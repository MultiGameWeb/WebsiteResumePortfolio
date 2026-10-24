import type { D1DatabaseLike, Task } from "./types.js";
import { TASK_CONFIG } from "./config.js";
import { sha256Hex } from "./security.js";

export interface Reservation { id: string; }
export class LimitError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string) {
    super(message);
  }
}
const DAY_MS = 24 * 60 * 60 * 1000;
const IP_WINDOW_MS = 60 * 1000;

/** Atomically consumes one SQLite/D1 counter slot. No RETURNING row means the limit was reached. */
async function consumeBucket(
  db: D1DatabaseLike, bucketKey: string, limit: number, windowMs: number, nowMs: number,
): Promise<boolean> {
  const cutoff = nowMs - windowMs;
  const row = await db.prepare(`
    INSERT INTO cb_rate_counters (bucket_key, window_started_at, request_count, updated_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(bucket_key) DO UPDATE SET
      window_started_at = CASE
        WHEN cb_rate_counters.window_started_at <= ? THEN excluded.window_started_at
        ELSE cb_rate_counters.window_started_at
      END,
      request_count = CASE
        WHEN cb_rate_counters.window_started_at <= ? THEN 1
        ELSE cb_rate_counters.request_count + 1
      END,
      updated_at = excluded.updated_at
    WHERE cb_rate_counters.window_started_at <= ?
       OR cb_rate_counters.request_count < ?
    RETURNING request_count
  `).bind(bucketKey, nowMs, nowMs, cutoff, cutoff, cutoff, limit)
    .first<{ request_count: number }>();
  return row !== null;
}

export async function reserveAiRequest(
  db: D1DatabaseLike,
  input: { ownerId: string; task: Task; sessionId: string; ipAddress: string; ownerDailyLimit: number },
): Promise<Reservation> {
  const now = Date.now();
  const day = new Date(now).toISOString().slice(0, 10);
  const minute = Math.floor(now / IP_WINDOW_MS);
  const [sessionHash, ipHash] = await Promise.all([
    sha256Hex(input.sessionId), sha256Hex(input.ipAddress),
  ]);

  try {
    const checks: Array<{ key: string; limit: number; window: number; reason: string; message: string }> = [
      { key: `ip:${ipHash}:${minute}`, limit: 20, window: IP_WINDOW_MS, reason: "ip_rate_limit",
        message: "Too many requests from this network. Please wait a minute and try again." },
      { key: `session:${sessionHash}`, limit: 40, window: DAY_MS, reason: "session_limit",
        message: "This chat has reached its message limit. Start a new chat to continue." },
      { key: `owner:${input.ownerId}:${day}`, limit: input.ownerDailyLimit, window: DAY_MS, reason: "owner_daily_limit",
        message: "Your daily BotCraft AI limit has been reached. Please try again tomorrow or contact SiteCraft." },
      { key: `task:${input.ownerId}:${input.task}:${day}`, limit: TASK_CONFIG[input.task].dailyLimit, window: DAY_MS,
        reason: "task_daily_limit", message: "This BotCraft task has reached today's limit. Please try again later." },
    ];

    for (const check of checks) {
      if (!(await consumeBucket(db, check.key, check.limit, check.window, now))) {
        throw new LimitError(check.reason.toUpperCase(), 429, check.message);
      }
    }

    const id = crypto.randomUUID();
    const result = await db.prepare(
      "INSERT INTO cb_ai_reservations (id, owner_id, task, status, created_at) VALUES (?, ?, ?, 'reserved', ?)"
    ).bind(id, input.ownerId, input.task, new Date(now).toISOString()).run();

    if (result.success === false || result.error) throw new Error("D1 reservation insert failed");
    return { id };
  } catch (error) {
    if (error instanceof LimitError) throw error;
    throw new LimitError("LIMIT_STORE_UNAVAILABLE", 503, "BotCraft usage protection is temporarily unavailable.");
  }
}

export async function finalizeAiRequest(db: D1DatabaseLike, reservationId: string, success: boolean): Promise<void> {
  const result = await db.prepare(
    "UPDATE cb_ai_reservations SET status = ?, completed_at = ? WHERE id = ? AND status = 'reserved'"
  ).bind(success ? "success" : "failed", new Date().toISOString(), reservationId).run();
  if (result.success === false || result.error) throw new Error("BotCraft reservation finalization failed");
}
