import { getCurrentUserId, getSupabase, isAdmin } from "./adapters.js";
import { getConfiguredModel, getKey, maskedKey, TASK_CONFIG, TASKS } from "./config.js";
import { callGemini, GeminiRouterError } from "./gemini-router.js";
import { finalizeAiRequest, LimitError, reserveAiRequest } from "./limits.js";
import { buildRestrictedPrompt } from "./prompts.js";
import { getClientIp, HttpError, jsonResponse, originAllowed, readJsonLimited, validateGenerateRequest, withCors } from "./security.js";
import type { Env, ExecutionContextLike, KeySlot } from "./types.js";

const DEFAULT_OWNER_DAILY_LIMIT = 200;
const WINDOW_MS = 24 * 60 * 60 * 1000;

function envNumber(value: string | undefined, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}
function defer(ctx: ExecutionContextLike, promise: Promise<unknown>): void {
  ctx.waitUntil(promise.catch(() => undefined));
}

async function keyStatus(env: Env, supabase: NonNullable<ReturnType<typeof getSupabase>>): Promise<Response> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  let usageData: Record<string, unknown>[] = [];
  let usageWarning: string | undefined;
  try {
    const result = await supabase.from("cb_ai_usage_log")
      .select("key_slot,task,status,tokens_in,tokens_out,created_at")
      .gte("created_at", since)
      .limit(5000);
    if (result.error) usageWarning = "Recent usage stats are unavailable.";
    else usageData = (result.data ?? []) as Record<string, unknown>[];
  } catch {
    usageWarning = "Recent usage stats are unavailable.";
  }

  const keys = await Promise.all(([1, 2, 3, 4, 5] as KeySlot[]).map(async slot => {
    let coolingDown = false;
    try {
      coolingDown = (await env.CB_KEY_COOLDOWNS.get(`cb:gemini:cooldown:${slot}`)) !== null;
    } catch {
      usageWarning = "The cooldown store is unavailable.";
    }
    const key = getKey(env, slot);
    const taskAssignments = TASKS.flatMap(task => {
      const cfg = TASK_CONFIG[task];
      return cfg.candidates.includes(slot)
        ? [{ task, role: cfg.primary === slot ? "primary" : "backup", model: getConfiguredModel(env, task) ?? "not configured" }]
        : [];
    });
    const rows = usageData.filter(row => Number(row.key_slot) === slot);
    return {
      keySlot: slot,
      configured: !!key,
      maskedKey: maskedKey(key),
      status: !key ? "missing" : coolingDown ? "cooldown" : "configured",
      taskAssignments,
      recent24h: {
        requests: rows.length,
        successes: rows.filter(row => row.status === "success").length,
        errors: rows.filter(row => row.status === "error").length,
        tokensIn: rows.reduce((sum, row) => sum + Number(row.tokens_in ?? 0), 0),
        tokensOut: rows.reduce((sum, row) => sum + Number(row.tokens_out ?? 0), 0),
      },
    };
  }));

  return jsonResponse({ keys, usageWindow: "last 24 hours; latest 5,000 log rows", warning: usageWarning ?? null });
}

async function runAdminSmokeTest(env: Env, ctx: ExecutionContextLike): Promise<Response> {
  const results: Array<Record<string, unknown>> = [];
  for (const task of TASKS) {
    try {
      const result = await callGemini(env, ctx, {
        task,
        systemPrompt: buildRestrictedPrompt(task, "This is an administrator smoke test. Reply to the test message briefly."),
        messages: [{ role: "user", content: "Say hello in Telugu" }],
        requestId: crypto.randomUUID(),
      });
      results.push({
        task, success: true, keySlot: result.keySlot, model: result.model,
        tokensIn: result.tokensIn, tokensOut: result.tokensOut, reply: result.text.slice(0, 240),
      });
    } catch (error) {
      const e = error instanceof GeminiRouterError ? error : null;
      results.push({ task, success: false, errorCode: e?.code ?? "TEST_FAILED" });
    }
  }
  return jsonResponse({ tested: results.length, results });
}

async function handleRequest(request: Request, env: Env, ctx: ExecutionContextLike): Promise<Response> {
  const url = new URL(request.url);
  if (!originAllowed(request, env)) {
    return jsonResponse({ error: { code: "ORIGIN_NOT_ALLOWED", message: "This origin is not allowed to use BotCraft." } }, 403);
  }
  if (request.method === "OPTIONS") return new Response(null, { status: 204 });

  if (request.method === "GET" && url.pathname === "/health") {
    return jsonResponse({
      ok: true,
      service: "botcraft-gemini-router",
      configuredKeySlots: ([1, 2, 3, 4, 5] as KeySlot[]).filter(slot => !!getKey(env, slot)).length,
      adaptersConnected: !!getSupabase(env),
    });
  }

  if (url.pathname === "/api/chatbot/admin/key-status") {
    if (request.method !== "GET") return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Use GET for this endpoint." } }, 405);
    if (!(await isAdmin(request))) return jsonResponse({ error: { code: "FORBIDDEN", message: "Admin access is required." } }, 403);
    const supabase = getSupabase(env);
    if (!supabase) return jsonResponse({ error: { code: "ADAPTER_NOT_CONFIGURED", message: "Connect the existing Supabase adapter before reading usage logs." } }, 503);
    return keyStatus(env, supabase);
  }

  if (url.pathname === "/api/chatbot/admin/router-test") {
    if (request.method !== "POST") return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST for this endpoint." } }, 405);
    if (env.CB_ENABLE_ADMIN_TEST !== "true") return jsonResponse({ error: { code: "NOT_FOUND", message: "Not found." } }, 404);
    if (!(await isAdmin(request))) return jsonResponse({ error: { code: "FORBIDDEN", message: "Admin access is required." } }, 403);
    const body = await readJsonLimited(request);
    if (!body || typeof body !== "object" || (body as Record<string, unknown>).confirm !== true) {
      return jsonResponse({ error: { code: "EXPLICIT_CONFIRMATION_REQUIRED", message: "Send { confirm: true } to run five live Gemini test requests." } }, 400);
    }
    // A full smoke test is five real, potentially billable provider requests.
    try {
      if (await env.CB_KEY_COOLDOWNS.get("cb:admin-test:cooldown")) {
        return jsonResponse({ error: { code: "ADMIN_TEST_COOLDOWN", message: "A live router test was run recently. Wait at least 60 seconds before running it again." } }, 429);
      }
      await env.CB_KEY_COOLDOWNS.put("cb:admin-test:cooldown", String(Date.now()), { expirationTtl: 60 });
    } catch {
      return jsonResponse({ error: { code: "ADMIN_TEST_GUARD_UNAVAILABLE", message: "The test guard is unavailable; no live test was run." } }, 503);
    }
    return runAdminSmokeTest(env, ctx);
  }

  if (url.pathname === "/api/chatbot/ai") {
    if (request.method !== "POST") return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST for this endpoint." } }, 405);
    const supabase = getSupabase(env);
    if (!supabase) return jsonResponse({ error: { code: "ADAPTER_NOT_CONFIGURED", message: "Connect the existing Supabase adapter before using BotCraft AI." } }, 503);
    const ownerId = await getCurrentUserId(request);
    if (!ownerId) return jsonResponse({ error: { code: "AUTH_REQUIRED", message: "Sign in to use this BotCraft owner endpoint." } }, 401);

    const input = validateGenerateRequest(await readJsonLimited(request));
    const requestId = crypto.randomUUID();
    let reservation: { id: string };
    try {
      reservation = await reserveAiRequest(supabase, {
        ownerId, task: input.task, sessionId: input.sessionId, ipAddress: getClientIp(request),
        ownerDailyLimit: envNumber(env.CB_OWNER_DAILY_LIMIT, DEFAULT_OWNER_DAILY_LIMIT, 1, 5000),
      });
    } catch (error) {
      if (error instanceof LimitError) return jsonResponse({ error: { code: error.code, message: error.message }, requestId }, error.status);
      return jsonResponse({ error: { code: "LIMIT_CHECK_FAILED", message: "BotCraft could not check usage limits safely. Please retry." }, requestId }, 503);
    }

    let succeeded = false;
    try {
      const result = await callGemini(env, ctx, {
        task: input.task, systemPrompt: buildRestrictedPrompt(input.task, input.systemPrompt),
        messages: input.messages, files: input.files, jsonMode: input.jsonMode, ownerId, requestId,
      });
      succeeded = true;
      // Do not disclose which API key served this ordinary owner request.
      return jsonResponse({ text: result.text, requestId, usage: { tokensIn: result.tokensIn, tokensOut: result.tokensOut } });
    } catch (error) {
      if (error instanceof GeminiRouterError) return jsonResponse({ error: { code: error.code, message: error.message }, requestId }, error.status);
      if (error instanceof HttpError) return jsonResponse({ error: { code: error.code, message: error.message }, requestId }, error.status);
      return jsonResponse({ error: { code: "BOTCRAFT_REQUEST_FAILED", message: "BotCraft could not complete the request. Please retry shortly." }, requestId }, 502);
    } finally {
      defer(ctx, finalizeAiRequest(supabase, reservation.id, succeeded));
    }
  }

  return jsonResponse({ error: { code: "NOT_FOUND", message: "Endpoint not found." } }, 404);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContextLike): Promise<Response> {
    let response: Response;
    try {
      response = await handleRequest(request, env, ctx);
    } catch (error) {
      if (error instanceof HttpError) response = jsonResponse({ error: { code: error.code, message: error.message } }, error.status);
      else response = jsonResponse({ error: { code: "INTERNAL_ERROR", message: "BotCraft encountered an unexpected error." } }, 500);
    }
    return withCors(request, response, env);
  },
};
