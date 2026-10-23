import { getSupabase } from "./adapters.js";
import type { Env, UsageEvent } from "./types.js";

export async function logUsage(env: Env, event: UsageEvent): Promise<void> {
  try {
    const supabase = getSupabase(env);
    if (!supabase) return; // Safe until the existing Supabase adapter is connected.
    const { error } = await supabase.from("cb_ai_usage_log").insert({
      request_id: event.requestId ?? null,
      owner_id: event.ownerId ?? null,
      task: event.task,
      key_slot: event.keySlot,
      model_name: event.model,
      tokens_in: Math.max(0, Math.trunc(event.tokensIn)),
      tokens_out: Math.max(0, Math.trunc(event.tokensOut)),
      duration_ms: Math.max(0, Math.trunc(event.durationMs)),
      status: event.status,
      error: event.errorCode ?? null,
      created_at: new Date().toISOString(),
    });
    if (error) console.error("[botcraft] usage-log insert failed");
  } catch {
    // Do not log API keys, prompts, attachment contents or provider response bodies.
    // A logging failure must not fail or delay the chatbot reply.
    console.error("[botcraft] usage-log unavailable");
  }
}
