import { test } from "node:test";
import assert from "node:assert/strict";
import { callGemini, taskPrimarySlot } from "../gemini-router.js";
import worker from "../worker.js";
import { TASKS } from "../config.js";
import { HttpError, validateGenerateRequest } from "../security.js";
import type { D1DatabaseLike, D1PreparedStatementLike, D1Result, Env, KeySlot, Task } from "../types.js";

class FakeD1 implements D1DatabaseLike {
  cooldowns = new Map<string, { cooldown_until_ms: number; updated_at: number }>();

  prepare(query: string): D1PreparedStatementLike {
    const db = this;
    let values: unknown[] = [];
    const statement: D1PreparedStatementLike = {
      bind(...args: unknown[]) { values = args; return statement; },
      async first<T = Record<string, unknown>>(): Promise<T | null> {
        if (query.includes("SELECT cooldown_until_ms FROM cb_key_cooldowns")) {
          return (db.cooldowns.get(String(values[0])) ?? null) as T | null;
        }
        return null;
      },
      async all<T = Record<string, unknown>>(): Promise<D1Result<T>> { return { success: true, results: [] }; },
      async run<T = unknown>(): Promise<D1Result<T>> {
        if (query.includes("INSERT INTO cb_key_cooldowns")) {
          const key = String(values[0]);
          db.cooldowns.set(key, { cooldown_until_ms: Number(values[1]), updated_at: Number(values[2]) });
        }
        return { success: true, meta: { changes: 1 } };
      },
    };
    return statement;
  }
  async batch<T = unknown>(_statements: D1PreparedStatementLike[]): Promise<D1Result<T>[]> { return []; }
}

function makeEnv(): Env {
  return {
    GEMINI_KEY_1: "test-secret-key-slot-one-0001",
    GEMINI_KEY_2: "test-secret-key-slot-two-0002",
    GEMINI_KEY_3: "test-secret-key-slot-three-0003",
    GEMINI_KEY_4: "test-secret-key-slot-four-0004",
    GEMINI_KEY_5: "test-secret-key-slot-five-0005",
    GEMINI_MODEL_INTERVIEW: "test-model-interview",
    GEMINI_MODEL_EXTRACT: "test-model-extract",
    GEMINI_MODEL_TEST: "test-model-test",
    GEMINI_MODEL_CHAT: "test-model-chat",
    GEMINI_MODEL_VOICE: "test-model-voice",
    DB: new FakeD1(),
  };
}

const ctx = { waitUntil: (_promise: Promise<unknown>) => undefined };
const prompt = "Answer the test request briefly.";
const messages = [{ role: "user" as const, content: "Say hello in Telugu" }];
const expectedModels: Record<Task, string> = {
  interview: "test-model-interview",
  extract: "test-model-extract",
  test: "test-model-test",
  chat: "test-model-chat",
  voice: "test-model-voice",
};
function successResponse(text = "నమస్కారం!") {
  return Response.json({
    candidates: [{ content: { parts: [{ text }] } }],
    usageMetadata: { promptTokenCount: 7, candidatesTokenCount: 4 },
  });
}

test("primary key mapping is correct for all five tasks", () => {
  const expected: Record<Task, KeySlot> = { interview: 1, extract: 2, test: 3, chat: 4, voice: 5 };
  for (const task of TASKS) assert.equal(taskPrimarySlot(task), expected[task]);
});

for (const task of TASKS) {
  test(`${task} uses its primary key and task-specific model`, async () => {
    const env = makeEnv();
    const expectedSlot = taskPrimarySlot(task);
    let seenKey = "";
    let seenUrl = "";
    const result = await callGemini(env, ctx, { task, systemPrompt: prompt, messages }, {
      sleep: async () => undefined,
      fetchImpl: async (url, init) => {
        seenKey = new Headers(init?.headers).get("x-goog-api-key") ?? "";
        seenUrl = String(url);
        return successResponse();
      },
    });
    assert.equal(result.keySlot, expectedSlot);
    const expectedKeys: Record<KeySlot, string | undefined> = {
      1: env.GEMINI_KEY_1, 2: env.GEMINI_KEY_2, 3: env.GEMINI_KEY_3,
      4: env.GEMINI_KEY_4, 5: env.GEMINI_KEY_5,
    };
    assert.equal(seenKey, expectedKeys[expectedSlot]);
    assert.ok(seenUrl.includes(expectedModels[task]));
    assert.equal(result.text, "నమస్కారం!");
    assert.equal(result.tokensIn, 7);
    assert.equal(result.tokensOut, 4);
  });
}

test("chat fails over from key 4 to key 5 after a simulated 429", async () => {
  const env = makeEnv();
  const seenKeys: string[] = [];
  const result = await callGemini(env, ctx, { task: "chat", systemPrompt: prompt, messages }, {
    sleep: async () => undefined,
    fetchImpl: async (_url, init) => {
      seenKeys.push(new Headers(init?.headers).get("x-goog-api-key") ?? "");
      if (seenKeys.length === 1) return new Response("simulated quota response", { status: 429 });
      return successResponse();
    },
  });

  assert.deepEqual(seenKeys, [env.GEMINI_KEY_4, env.GEMINI_KEY_5]);
  assert.equal(result.keySlot, 5);
  assert.equal(result.text, "నమస్కారం!");
  assert.equal((env.DB as FakeD1).cooldowns.has("gemini:4"), true);
});

test("build tasks can use key 4 and key 5 as last-resort backups", async () => {
  const env = makeEnv();
  const used: string[] = [];
  const result = await callGemini(env, ctx, { task: "interview", systemPrompt: prompt, messages }, {
    sleep: async () => undefined,
    fetchImpl: async (_url, init) => {
      used.push(new Headers(init?.headers).get("x-goog-api-key") ?? "");
      if (used.length <= 2) return new Response("temporarily unavailable", { status: 503 });
      return successResponse();
    },
  });
  assert.deepEqual(used, [env.GEMINI_KEY_1, env.GEMINI_KEY_4, env.GEMINI_KEY_5]);
  assert.equal(result.keySlot, 5);
});

test("does not expose key values in an unconfigured-model error", async () => {
  const env = makeEnv();
  env.GEMINI_MODEL_CHAT = "";
  await assert.rejects(
    () => callGemini(env, ctx, { task: "chat", systemPrompt: prompt, messages }),
    (error: Error) => {
      assert.match(error.message, /not configured/i);
      assert.equal(error.message.includes(env.GEMINI_KEY_4 ?? "never"), false);
      return true;
    },
  );
});

test("one-attempt budget prevents cascading to backup keys", async () => {
  const env = makeEnv();
  const seenKeys: string[] = [];
  await assert.rejects(
    () => callGemini(env, ctx, { task: "chat", systemPrompt: prompt, messages }, {
      maxAttempts: 1,
      sleep: async () => undefined,
      fetchImpl: async (_url, init) => {
        seenKeys.push(new Headers(init?.headers).get("x-goog-api-key") ?? "");
        return new Response("simulated temporary provider failure", { status: 503 });
      },
    }),
    /temporarily unavailable after 1 attempt/,
  );
  assert.deepEqual(seenKeys, [env.GEMINI_KEY_4]);
});

test("public health response does not disclose key-slot or database configuration", async () => {
  const response = await worker.fetch(new Request("https://botcraft.example/health"), makeEnv(), ctx);
  assert.equal(response.status, 200);
  const body = await response.json() as Record<string, unknown>;
  assert.equal(body.ok, true);
  assert.equal("configuredKeySlots" in body, false);
  assert.equal("d1Configured" in body, false);
});

test("request validation rejects over-limit messages and unknown file types", () => {
  const base = { task: "chat", sessionId: "session_123456789012345", systemPrompt: "", messages };
  assert.throws(
    () => validateGenerateRequest({ ...base, messages: [{ role: "user", content: "a".repeat(4001) }] }),
    (error: unknown) => error instanceof HttpError && error.code === "MESSAGE_TOO_LONG",
  );
  assert.throws(
    () => validateGenerateRequest({ ...base, files: [{ mimeType: "application/x-executable", data: "aGVsbG8=" }] }),
    (error: unknown) => error instanceof HttpError && error.code === "UNSUPPORTED_ATTACHMENT_TYPE",
  );
});

test("user cannot enable JSON mode for a normal chat task", () => {
  const input = validateGenerateRequest({
    task: "chat", sessionId: "session_123456789012345", systemPrompt: "",
    messages, jsonMode: true,
  });
  assert.equal(input.jsonMode, false);
});
