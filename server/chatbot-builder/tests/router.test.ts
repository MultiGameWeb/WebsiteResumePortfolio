import { test } from "node:test";
import assert from "node:assert/strict";
import { callGemini, taskPrimarySlot } from "../gemini-router.js";
import { TASKS } from "../config.js";
import { HttpError, validateGenerateRequest } from "../security.js";
import type { Env, KeySlot, Task } from "../types.js";

class FakeKV {
  values = new Map<string, string>();
  async get(key: string) { return this.values.get(key) ?? null; }
  async put(key: string, value: string) { this.values.set(key, value); }
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
    CB_KEY_COOLDOWNS: new FakeKV(),
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
  assert.equal((env.CB_KEY_COOLDOWNS as FakeKV).values.has("cb:gemini:cooldown:4"), true);
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
