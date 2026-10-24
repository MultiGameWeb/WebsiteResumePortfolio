import type { Env, KeySlot, Task } from "./types.js";

export interface TaskConfig {
  primary: KeySlot; candidates: KeySlot[]; modelEnv:
    "GEMINI_MODEL_INTERVIEW" | "GEMINI_MODEL_EXTRACT" | "GEMINI_MODEL_TEST" | "GEMINI_MODEL_CHAT" | "GEMINI_MODEL_VOICE";
  maxOutputTokens: number; temperature: number; jsonMode: boolean; dailyLimit: number;
}
export const TASKS: Task[] = ["interview", "extract", "test", "chat", "voice"];
export const TASK_CONFIG: Record<Task, TaskConfig> = {
  interview: { primary: 1, candidates: [1, 4, 5], modelEnv: "GEMINI_MODEL_INTERVIEW", maxOutputTokens: 600, temperature: 0.35, jsonMode: false, dailyLimit: 80 },
  extract: { primary: 2, candidates: [2, 4, 5], modelEnv: "GEMINI_MODEL_EXTRACT", maxOutputTokens: 4096, temperature: 0.1, jsonMode: true, dailyLimit: 50 },
  test: { primary: 3, candidates: [3, 4, 5], modelEnv: "GEMINI_MODEL_TEST", maxOutputTokens: 3072, temperature: 0.1, jsonMode: true, dailyLimit: 30 },
  chat: { primary: 4, candidates: [4, 5], modelEnv: "GEMINI_MODEL_CHAT", maxOutputTokens: 500, temperature: 0.2, jsonMode: false, dailyLimit: 240 },
  voice: { primary: 5, candidates: [5, 4], modelEnv: "GEMINI_MODEL_VOICE", maxOutputTokens: 600, temperature: 0.2, jsonMode: false, dailyLimit: 120 },
};
export function getConfiguredModel(env: Env, task: Task): string | null {
  const raw = env[TASK_CONFIG[task].modelEnv];
  return typeof raw === "string" && raw.trim() && !raw.trim().startsWith("SET_MODEL") ? raw.trim() : null;
}
export function getKey(env: Env, slot: KeySlot): string | null {
  const values: Record<KeySlot, string | undefined> = {
    1: env.GEMINI_KEY_1, 2: env.GEMINI_KEY_2, 3: env.GEMINI_KEY_3, 4: env.GEMINI_KEY_4, 5: env.GEMINI_KEY_5,
  };
  const raw = values[slot];
  return typeof raw === "string" && raw.trim().length > 20 ? raw.trim() : null;
}
export function maskedKey(key: string | null): string {
  if (!key) return "not configured";
  return key.length > 4 ? `••••${key.slice(-4)}` : "••••";
}
