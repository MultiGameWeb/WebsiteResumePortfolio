import { getD1 } from "./adapters.js";
import type { Env, UsageEvent } from "./types.js";

export async function logUsage(env: Env, event: UsageEvent): Promise<void> {
  try {
    const db = getD1(env);
    if (!db) return;
    const result = await db.prepare(`
      INSERT INTO cb_ai_usage_log
        (request_id, owner_id, task, key_slot, model_name, tokens_in, tokens_out, duration_ms, status, error_code, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      event.requestId ?? null, event.ownerId ?? null, event.task, event.keySlot, event.model,
      Math.max(0, Math.trunc(event.tokensIn)), Math.max(0, Math.trunc(event.tokensOut)),
      Math.max(0, Math.trunc(event.durationMs)), event.status, event.errorCode ?? null,
      new Date().toISOString(),
    ).run();
    if (result.success === false || result.error) console.error("[botcraft] D1 usage-log insert failed");
  } catch {
    // Never log keys, prompts, file contents or provider response bodies.
    // Logging failure must not fail or delay the chatbot reply.
    console.error("[botcraft] D1 usage-log unavailable");
  }
}
