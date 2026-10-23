export type Task = "interview" | "extract" | "test" | "chat" | "voice";
export type KeySlot = 1 | 2 | 3 | 4 | 5;
export type MessageRole = "user" | "model";

export interface KVNamespaceLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}
export interface SupabaseClientLike {
  from(table: string): any;
  rpc(functionName: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>;
}
export interface Env {
  GEMINI_KEY_1?: string; GEMINI_KEY_2?: string; GEMINI_KEY_3?: string; GEMINI_KEY_4?: string; GEMINI_KEY_5?: string;
  GEMINI_MODEL_INTERVIEW?: string; GEMINI_MODEL_EXTRACT?: string; GEMINI_MODEL_TEST?: string; GEMINI_MODEL_CHAT?: string; GEMINI_MODEL_VOICE?: string;
  CB_KEY_COOLDOWNS: KVNamespaceLike;
  CB_ALLOWED_ORIGINS?: string;
  CB_ENABLE_ADMIN_TEST?: string;
  CB_OWNER_DAILY_LIMIT?: string;
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
}
export interface ExecutionContextLike { waitUntil(promise: Promise<unknown>): void; }
export interface GeminiFile { mimeType: string; data: string; name?: string; }
export interface GeminiMessage { role: MessageRole; content: string; }
export interface CallGeminiInput {
  task: Task; systemPrompt: string; messages: GeminiMessage[]; files?: GeminiFile[];
  jsonMode?: boolean; ownerId?: string; requestId?: string;
}
export interface CallGeminiResult {
  text: string; tokensIn: number; tokensOut: number; keySlot: KeySlot; model: string; durationMs: number;
}
export interface GenerateRequest extends CallGeminiInput { sessionId: string; }
export interface UsageEvent {
  requestId?: string; ownerId?: string; task: Task; keySlot: KeySlot; model: string;
  tokensIn: number; tokensOut: number; status: "success" | "error"; errorCode?: string; durationMs: number;
}
