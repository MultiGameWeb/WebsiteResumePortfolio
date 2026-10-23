import { TASKS } from "./config.js";
import type { Env, GenerateRequest, GeminiFile, GeminiMessage, Task } from "./types.js";

export const MAX_JSON_BYTES = 30 * 1024 * 1024;
export const MAX_FILES = 5;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_TOTAL_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_MESSAGE_CHARS = 4000;
export const MAX_MESSAGES = 30;
export const MAX_TOTAL_TEXT_CHARS = 45000;
export const MAX_SYSTEM_PROMPT_CHARS = 8000;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/heic", "image/heif",
  "application/pdf", "text/plain", "text/csv",
]);

export class HttpError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) {
    super(message);
  }
}

export function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      ...extraHeaders,
    },
  });
}

export function allowedOrigins(env: Env): Set<string> {
  const configured = env.CB_ALLOWED_ORIGINS?.split(",").map(x => x.trim()).filter(Boolean);
  return new Set(configured?.length ? configured : [
    "https://multigameweb.github.io", "http://localhost:8000", "http://127.0.0.1:8000",
  ]);
}
export function originAllowed(request: Request, env: Env): boolean {
  const origin = request.headers.get("Origin");
  return !origin || allowedOrigins(env).has(origin);
}
export function withCors(request: Request, response: Response, env: Env): Response {
  const headers = new Headers(response.headers);
  headers.set("Vary", "Origin");
  const origin = request.headers.get("Origin");
  if (origin && allowedOrigins(env).has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    headers.set("Access-Control-Max-Age", "600");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

/** Stream the request body with a byte cap to avoid unbounded request allocation. */
export async function readJsonLimited(request: Request): Promise<unknown> {
  const contentType = request.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") throw new HttpError(415, "JSON_REQUIRED", "Send the request as application/json.");
  const advertisedLength = Number(request.headers.get("Content-Length") || 0);
  if (advertisedLength > MAX_JSON_BYTES) throw new HttpError(413, "BODY_TOO_LARGE", "This request is too large. Reduce the files and try again.");
  if (!request.body) throw new HttpError(400, "EMPTY_BODY", "The request body is empty.");

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_JSON_BYTES) {
        await reader.cancel();
        throw new HttpError(413, "BODY_TOO_LARGE", "This request is too large. Reduce the files and try again.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const combined = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return JSON.parse(new TextDecoder().decode(combined)) as unknown;
  } catch {
    throw new HttpError(400, "INVALID_JSON", "The request body is not valid JSON.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}
function validSessionId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{16,128}$/.test(value);
}
function estimatedDecodedBytes(base64: string): number {
  return Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
}
function validateFiles(value: unknown): GeminiFile[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > MAX_FILES) {
    throw new HttpError(400, "ATTACHMENT_COUNT", "Attach no more than 5 files to one message.");
  }
  let totalBytes = 0;
  return value.map((candidate, index) => {
    if (!isRecord(candidate) || typeof candidate.mimeType !== "string" || typeof candidate.data !== "string") {
      throw new HttpError(400, "INVALID_ATTACHMENT", `Attachment ${index + 1} is invalid. Remove it and try again.`);
    }
    const mimeType = candidate.mimeType.toLowerCase().trim();
    const data = candidate.data;
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new HttpError(415, "UNSUPPORTED_ATTACHMENT_TYPE", "For now, upload JPG, PNG, WEBP, HEIC/HEIF images, PDF, TXT or CSV files.");
    }
    if (!data || data.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(data)) {
      throw new HttpError(400, "INVALID_ATTACHMENT_DATA", `Attachment ${index + 1} is not valid base64 data.`);
    }
    const size = estimatedDecodedBytes(data);
    if (size > MAX_FILE_BYTES) throw new HttpError(413, "FILE_TOO_LARGE", `Attachment ${index + 1} exceeds the 10 MB file limit.`);
    totalBytes += size;
    if (totalBytes > MAX_TOTAL_FILE_BYTES) throw new HttpError(413, "TOTAL_FILES_TOO_LARGE", "Attachments must total no more than 20 MB per request.");
    return { mimeType, data, name: typeof candidate.name === "string" ? candidate.name.slice(0, 180) : undefined };
  });
}
export function validateGenerateRequest(value: unknown): GenerateRequest {
  if (!isRecord(value)) throw new HttpError(400, "INVALID_REQUEST", "The request must be a JSON object.");
  if (typeof value.task !== "string" || !TASKS.includes(value.task as Task)) throw new HttpError(400, "INVALID_TASK", "Choose a valid BotCraft task.");
  const task = value.task as Task;
  if (!validSessionId(value.sessionId)) throw new HttpError(400, "INVALID_SESSION", "The session ID is missing or invalid. Refresh the chat and try again.");
  if (typeof value.systemPrompt !== "string" || value.systemPrompt.length > MAX_SYSTEM_PROMPT_CHARS) {
    throw new HttpError(400, "INVALID_SYSTEM_PROMPT", "The instruction text must be under 8,000 characters.");
  }
  if (!Array.isArray(value.messages) || value.messages.length < 1 || value.messages.length > MAX_MESSAGES) {
    throw new HttpError(400, "MESSAGE_COUNT", "Send between 1 and 30 conversation messages.");
  }
  let totalText = value.systemPrompt.length;
  const messages: GeminiMessage[] = value.messages.map((message, index) => {
    if (!isRecord(message) || !["user", "model"].includes(String(message.role)) || typeof message.content !== "string") {
      throw new HttpError(400, "INVALID_MESSAGE", `Conversation message ${index + 1} is invalid.`);
    }
    if (message.content.length > MAX_MESSAGE_CHARS) throw new HttpError(413, "MESSAGE_TOO_LONG", "Each message must be 4,000 characters or fewer.");
    totalText += message.content.length;
    return { role: message.role as GeminiMessage["role"], content: message.content };
  });
  if (messages[messages.length - 1].role !== "user") {
    throw new HttpError(400, "LAST_MESSAGE_MUST_BE_USER", "The latest conversation message must be from the user.");
  }
  if (totalText > MAX_TOTAL_TEXT_CHARS) throw new HttpError(413, "TEXT_CONTEXT_TOO_LARGE", "This conversation is too long. Start a new session or shorten it.");
  if (value.jsonMode !== undefined && typeof value.jsonMode !== "boolean") throw new HttpError(400, "INVALID_JSON_MODE", "The JSON mode setting is invalid.");

  return {
    task, systemPrompt: value.systemPrompt, messages, files: validateFiles(value.files),
    // The caller cannot enable JSON mode for customer-chat tasks or disable it for extract/test.
    jsonMode: task === "extract" || task === "test",
    sessionId: value.sessionId,
  };
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}
export function getClientIp(request: Request): string {
  // Cloudflare sets this header. Do not trust arbitrary X-Forwarded-For.
  return request.headers.get("CF-Connecting-IP")?.trim() || "unknown";
}
