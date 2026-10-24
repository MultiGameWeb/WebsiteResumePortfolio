import { getConfiguredModel, getKey, TASK_CONFIG } from "./config.js";
import { getD1 } from "./adapters.js";
import { logUsage } from "./usage-log.js";
import type { CallGeminiInput, CallGeminiResult, Env, ExecutionContextLike, KeySlot, Task } from "./types.js";

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const COOLDOWN_SECONDS = 60;
const MAX_ATTEMPTS = 3;
const REQUEST_TIMEOUT_MS = 30_000;
const RETRYABLE_STATUS = new Set([429, 500, 503]);

export class GeminiRouterError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}
export interface RouterDependencies {
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
}
function sleep(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)); }
function defer(ctx: ExecutionContextLike, promise: Promise<unknown>): void {
  ctx.waitUntil(promise.catch(() => undefined));
}
async function coolingDown(env: Env, slot: KeySlot): Promise<boolean> {
  const db = getD1(env);
  if (!db) throw new GeminiRouterError(503, "D1_UNAVAILABLE", "BotCraft key protection is temporarily unavailable.");
  try {
    const row = await db.prepare(
      "SELECT cooldown_until_ms FROM cb_key_cooldowns WHERE cooldown_key = ?"
    ).bind(`gemini:${slot}`).first<{ cooldown_until_ms: number }>();
    return Number(row?.cooldown_until_ms ?? 0) > Date.now();
  } catch {
    throw new GeminiRouterError(503, "COOLDOWN_STORE_UNAVAILABLE", "BotCraft key protection is temporarily unavailable.");
  }
}
async function markCooldown(env: Env, slot: KeySlot): Promise<void> {
  const db = getD1(env);
  if (!db) throw new GeminiRouterError(503, "D1_UNAVAILABLE", "BotCraft key protection is temporarily unavailable.");
  try {
    const now = Date.now();
    const result = await db.prepare(`
      INSERT INTO cb_key_cooldowns (cooldown_key, cooldown_until_ms, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(cooldown_key) DO UPDATE SET
        cooldown_until_ms = excluded.cooldown_until_ms,
        updated_at = excluded.updated_at
    `).bind(`gemini:${slot}`, now + COOLDOWN_SECONDS * 1000, now).run();
    if (result.success === false || result.error) throw new Error("Cooldown write failed");
  } catch {
    throw new GeminiRouterError(503, "COOLDOWN_STORE_UNAVAILABLE", "BotCraft key protection is temporarily unavailable.");
  }
}
function publicStatusCode(status: number): string { return status > 0 ? `HTTP_${status}` : "NETWORK_ERROR"; }
function contentsFor(input: CallGeminiInput) {
  const contents = input.messages.map(message => ({
    role: message.role,
    parts: [{ text: message.content }] as Array<Record<string, unknown>>,
  }));
  if (input.files?.length) {
    const last = contents[contents.length - 1];
    for (const file of input.files) {
      last.parts.push({ inlineData: { mimeType: file.mimeType, data: file.data } });
    }
  }
  return contents;
}
function requestBody(input: CallGeminiInput) {
  const config = TASK_CONFIG[input.task];
  return {
    systemInstruction: { parts: [{ text: input.systemPrompt }] },
    contents: contentsFor(input),
    generationConfig: {
      temperature: config.temperature,
      maxOutputTokens: config.maxOutputTokens,
      ...(config.jsonMode || input.jsonMode ? { responseMimeType: "application/json" } : {}),
    },
  };
}
function recordUsage(env: Env, ctx: ExecutionContextLike, event: Parameters<typeof logUsage>[1]): void {
  defer(ctx, logUsage(env, event));
}

export async function callGemini(
  env: Env, ctx: ExecutionContextLike, input: CallGeminiInput, dependencies: RouterDependencies = {},
): Promise<CallGeminiResult> {
  const task = input.task;
  const config = TASK_CONFIG[task];
  const model = getConfiguredModel(env, task);
  if (!model) throw new GeminiRouterError(503, "MODEL_NOT_CONFIGURED", `The Gemini model for the ${task} task is not configured.`);

  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const wait = dependencies.sleep ?? sleep;
  const startedAt = Date.now();
  let attempts = 0;
  let lastStatus = 0;
  let anyConfigured = false;
  let anyNotCooling = false;

  for (let index = 0; index < config.candidates.length && attempts < MAX_ATTEMPTS; index++) {
    const slot = config.candidates[index];
    const key = getKey(env, slot);
    if (!key) continue;
    anyConfigured = true;
    if (await coolingDown(env, slot)) continue;
    anyNotCooling = true;
    attempts++;

    let response: Response;
    try {
      response = await fetchImpl(
        `${GEMINI_API_BASE}/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": key },
          body: JSON.stringify(requestBody(input)),
          signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        },
      );
    } catch {
      lastStatus = 0;
      recordUsage(env, ctx, {
        requestId: input.requestId, ownerId: input.ownerId, task, keySlot: slot, model,
        tokensIn: 0, tokensOut: 0, status: "error", errorCode: "NETWORK_ERROR",
        durationMs: Date.now() - startedAt,
      });
      if (attempts < MAX_ATTEMPTS && index < config.candidates.length - 1) {
        await wait(Math.min(200 * (2 ** (attempts - 1)), 800));
        continue;
      }
      break;
    }

    lastStatus = response.status;
    if (!response.ok) {
      recordUsage(env, ctx, {
        requestId: input.requestId, ownerId: input.ownerId, task, keySlot: slot, model,
        tokensIn: 0, tokensOut: 0, status: "error", errorCode: publicStatusCode(response.status),
        durationMs: Date.now() - startedAt,
      });
      if (!RETRYABLE_STATUS.has(response.status)) {
        throw new GeminiRouterError(502, "GEMINI_REQUEST_REJECTED", `Gemini rejected the ${task} request. Check the configured model and input format.`);
      }
      await markCooldown(env, slot);
      if (attempts < MAX_ATTEMPTS && index < config.candidates.length - 1) {
        await wait(Math.min(200 * (2 ** (attempts - 1)), 800));
      }
      continue;
    }

    let payload: {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    try {
      payload = await response.json() as typeof payload;
    } catch {
      recordUsage(env, ctx, {
        requestId: input.requestId, ownerId: input.ownerId, task, keySlot: slot, model,
        tokensIn: 0, tokensOut: 0, status: "error", errorCode: "GEMINI_INVALID_RESPONSE",
        durationMs: Date.now() - startedAt,
      });
      throw new GeminiRouterError(502, "GEMINI_INVALID_RESPONSE", "Gemini returned an unreadable response.");
    }
    const text = payload.candidates?.[0]?.content?.parts?.map(part => part.text ?? "").join("").trim() ?? "";
    const tokensIn = payload.usageMetadata?.promptTokenCount ?? 0;
    const tokensOut = payload.usageMetadata?.candidatesTokenCount ?? 0;
    const durationMs = Date.now() - startedAt;

    if (!text) {
      recordUsage(env, ctx, {
        requestId: input.requestId, ownerId: input.ownerId, task, keySlot: slot, model,
        tokensIn, tokensOut, status: "error", errorCode: "EMPTY_MODEL_RESPONSE", durationMs,
      });
      throw new GeminiRouterError(502, "EMPTY_MODEL_RESPONSE", "Gemini did not return a usable answer. Please retry.");
    }
    recordUsage(env, ctx, {
      requestId: input.requestId, ownerId: input.ownerId, task, keySlot: slot, model,
      tokensIn, tokensOut, status: "success", durationMs,
    });
    return { text, tokensIn, tokensOut, keySlot: slot, model, durationMs };
  }

  if (!anyConfigured) throw new GeminiRouterError(503, "NO_KEYS_CONFIGURED", "No Gemini key is configured for this task or its backup slots.");
  if (!anyNotCooling) throw new GeminiRouterError(503, "ALL_KEYS_COOLING_DOWN", "BotCraft is temporarily protecting its Gemini keys. Please try again in about a minute.");
  throw new GeminiRouterError(503, "GEMINI_TEMPORARILY_UNAVAILABLE",
    `Gemini is temporarily unavailable after ${attempts} attempt(s) (${publicStatusCode(lastStatus)}). Please retry shortly.`);
}
export function taskPrimarySlot(task: Task): KeySlot { return TASK_CONFIG[task].primary; }
