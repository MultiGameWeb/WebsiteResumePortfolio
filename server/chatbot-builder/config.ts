import type { Env, KeySlot, Task } from "./types.js";

export interface TaskConfig {
  primary: KeySlot;
  candidates: KeySlot[];
  modelEnv:
    | "GEMINI_MODEL_INTERVIEW"
    | "GEMINI_MODEL_EXTRACT"
    | "GEMINI_MODEL_QUESTIONS"
    | "GEMINI_MODEL_BUILD"
    | "GEMINI_MODEL_TEST"
    | "GEMINI_MODEL_CHAT";
  maxOutputTokens: number;
  temperature: number;
  jsonMode: boolean;
  dailyLimit: number;
}

/**
 * Four primary key slots plus one reserve:
 * 1 interview, 2 extraction, 3 question intelligence, 4 build/test/live chat,
 * and 5 is never a primary slot.
 */
export const TASKS: Task[] = ["interview", "extract", "questions", "build", "test", "chat"];

export const TASK_CONFIG: Record<Task, TaskConfig> = {
  interview: {
    primary: 1, candidates: [1, 5], modelEnv: "GEMINI_MODEL_INTERVIEW",
    maxOutputTokens: 600, temperature: 0.35, jsonMode: false, dailyLimit: 80,
  },
  extract: {
    primary: 2, candidates: [2, 5], modelEnv: "GEMINI_MODEL_EXTRACT",
    maxOutputTokens: 4096, temperature: 0.1, jsonMode: true, dailyLimit: 50,
  },
  questions: {
    primary: 3, candidates: [3, 5], modelEnv: "GEMINI_MODEL_QUESTIONS",
    maxOutputTokens: 4096, temperature: 0.1, jsonMode: true, dailyLimit: 60,
  },
  build: {
    primary: 4, candidates: [4, 5], modelEnv: "GEMINI_MODEL_BUILD",
    maxOutputTokens: 8192, temperature: 0.1, jsonMode: true, dailyLimit: 20,
  },
  test: {
    primary: 4, candidates: [4, 5], modelEnv: "GEMINI_MODEL_TEST",
    maxOutputTokens: 4096, temperature: 0.1, jsonMode: true, dailyLimit: 30,
  },
  chat: {
    primary: 4, candidates: [4, 5], modelEnv: "GEMINI_MODEL_CHAT",
    maxOutputTokens: 500, temperature: 0.2, jsonMode: false, dailyLimit: 240,
  },
};

export function getConfiguredModel(env: Env, task: Task): string | null {
  const raw = env[TASK_CONFIG[task].modelEnv];
  return typeof raw === "string" && raw.trim() && !raw.trim().startsWith("SET_MODEL") ? raw.trim() : null;
}

export function getKey(env: Env, slot: KeySlot): string | null {
  const values: Record<KeySlot, string | undefined> = {
    1: env.GEMINI_KEY_1,
    2: env.GEMINI_KEY_2,
    3: env.GEMINI_KEY_3,
    4: env.GEMINI_KEY_4,
    5: env.GEMINI_KEY_5,
  };
  const raw = values[slot];
  return typeof raw === "string" && raw.trim().length > 20 ? raw.trim() : null;
}

export function maskedKey(key: string | null): string {
  if (!key) return "not configured";
  return key.length > 4 ? `••••${key.slice(-4)}` : "••••";
}
