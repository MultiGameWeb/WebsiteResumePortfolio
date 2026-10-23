import type { SupabaseClientLike, Task } from "./types.js";
import { TASK_CONFIG } from "./config.js";
import { sha256Hex } from "./security.js";

export interface Reservation { id: string; }
export class LimitError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message);
  }
}
function firstRow(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return (value[0] ?? null) as Record<string, unknown> | null;
  return value && typeof value === "object" ? value as Record<string, unknown> : null;
}

export async function reserveAiRequest(
  supabase: SupabaseClientLike,
  input: { ownerId: string; task: Task; sessionId: string; ipAddress: string; ownerDailyLimit: number },
): Promise<Reservation> {
  const [sessionHash, ipHash] = await Promise.all([
    sha256Hex(input.sessionId),
    sha256Hex(input.ipAddress),
  ]);
  const { data, error } = await supabase.rpc("cb_reserve_ai_request", {
    p_owner_id: input.ownerId,
    p_task: input.task,
    p_session_hash: sessionHash,
    p_ip_hash: ipHash,
    p_ip_limit: 20,
    p_session_limit: 40,
    p_owner_daily_limit: input.ownerDailyLimit,
    p_task_daily_limit: TASK_CONFIG[input.task].dailyLimit,
  });
  if (error) throw new LimitError("LIMIT_STORE_UNAVAILABLE", 503, "BotCraft usage protection is temporarily unavailable.");
  const row = firstRow(data);
  if (!row || row.allowed !== true || typeof row.reservation_id !== "string") {
    const reason = typeof row?.reason === "string" ? row.reason : "limit_store_error";
    const publicErrors: Record<string, { status: number; message: string }> = {
      ip_rate_limit: { status: 429, message: "Too many requests from this network. Please wait a minute and try again." },
      session_limit: { status: 429, message: "This chat has reached its message limit. Start a new chat to continue." },
      owner_daily_limit: { status: 429, message: "Your daily BotCraft AI limit has been reached. Please try again tomorrow or contact SiteCraft." },
      task_daily_limit: { status: 429, message: "This BotCraft task has reached today's limit. Please try again later." },
      invalid_task: { status: 400, message: "This BotCraft task is not allowed." },
    };
    const mapped = publicErrors[reason] ?? { status: 503, message: "BotCraft could not reserve usage safely. Please retry shortly." };
    throw new LimitError(reason.toUpperCase(), mapped.status, mapped.message);
  }
  return { id: row.reservation_id };
}

export async function finalizeAiRequest(
  supabase: SupabaseClientLike, reservationId: string, success: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("cb_finalize_ai_request", {
    p_reservation_id: reservationId,
    p_success: success,
  });
  if (error) throw new Error("BotCraft reservation finalization failed");
}
