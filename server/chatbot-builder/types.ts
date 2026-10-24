export type Task = "interview" | "extract" | "questions" | "build" | "test" | "chat";
export type KeySlot = 1 | 2 | 3 | 4 | 5;
export type MessageRole = "user" | "model";

export interface D1Result<T = Record<string, unknown>> {
  results?: T[];
  success?: boolean;
  meta?: { changes?: number; duration?: number; last_row_id?: number; rows_read?: number; rows_written?: number };
  error?: string;
}
export interface D1PreparedStatementLike {
  bind(...values: unknown[]): D1PreparedStatementLike;
  first<T = Record<string, unknown>>(colName?: string): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<D1Result<T>>;
}
export interface D1DatabaseLike {
  prepare(query: string): D1PreparedStatementLike;
  batch<T = unknown>(statements: D1PreparedStatementLike[]): Promise<D1Result<T>[]>;
}
export interface Env {
  DB?: D1DatabaseLike;
  GEMINI_KEY_1?: string; GEMINI_KEY_2?: string; GEMINI_KEY_3?: string; GEMINI_KEY_4?: string; GEMINI_KEY_5?: string;
  GEMINI_MODEL_INTERVIEW?: string; GEMINI_MODEL_EXTRACT?: string; GEMINI_MODEL_QUESTIONS?: string; GEMINI_MODEL_BUILD?: string; GEMINI_MODEL_TEST?: string; GEMINI_MODEL_CHAT?: string;
  CB_ALLOWED_ORIGINS?: string;
  CB_ENABLE_ADMIN_TEST?: string;
  CB_OWNER_DAILY_LIMIT?: string;
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
