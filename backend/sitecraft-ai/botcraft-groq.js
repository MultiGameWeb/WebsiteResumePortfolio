// Optional second AI provider (Groq) for plain TEXT customer replies, to lower the cost.
// Gemini stays the main provider and is always the fallback: Groq is used only when
//   - the Worker has the secret GROQ_API_KEY, and
//   - BOTCRAFT_GROQ_MODE is "english" (only questions that look like English) or "text" (every text-only question), and
//   - the question has no photo, file, recording or talk mode (those need Gemini).
// If Groq fails or answers badly, the reply is made by Gemini as before, so a customer never sees the difference.
// Default mode is "off". Decide with tests/provider-eval.mjs first (quality in Telugu and Hindi matters).

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-oss-120b";

export function groqMode(env) {
  const mode = String(env?.BOTCRAFT_GROQ_MODE || "off").toLowerCase();
  return env?.GROQ_API_KEY && (mode === "english" || mode === "text") ? mode : "off";
}

// Romanized Telugu / Hindi words: a message with any of them is not treated as English.
const INDIC_ROMAN = new Set(["entha", "enta", "enti", "yenti", "undi", "unnaya", "unda", "ledu", "ledhu", "kavali", "kaavali", "cheppandi", "chepandi", "ekkada", "ela", "elaa", "meeru", "mee", "mi", "nenu", "naku", "naaku", "ivvandi", "isthara", "chestara", "cheyandi", "vachindi", "vastaya", "kitna", "kya", "hai", "hain", "chahiye", "batao", "bataiye", "kahan", "kab", "aap", "mujhe", "mera", "hum", "nahi", "nahin", "kitne", "kaise", "dijiye", "karo", "karna", "wala", "wali", "ka", "ki", "ko", "ke", "se", "mein", "par", "tho", "tha", "thi", "anta", "ante", "aithe", "kani", "oka", "rendu", "motham", "dhara", "rate", "rupayalu"]);
const ENGLISH_COMMON = new Set(["the", "a", "an", "is", "are", "do", "does", "you", "your", "what", "which", "how", "much", "many", "when", "where", "can", "i", "me", "my", "we", "it", "this", "that", "for", "with", "have", "has", "any", "price", "cost", "open", "close", "today", "offer", "offers", "available", "stock", "delivery", "warranty", "tell", "please", "show", "want", "need", "buy", "of", "on", "in", "at", "to", "and", "or", "if", "will", "there", "good", "best", "cheap", "new", "old"]);

export function looksEnglish(text) {
  const tokens = String(text || "").toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").split(/\s+/).filter(Boolean);
  if (tokens.length < 3) return false;
  if (/[^\u0000-ɏ\s\p{P}\p{N}\p{S}]/u.test(String(text))) return false; // any non-Latin script
  if (tokens.some(token => INDIC_ROMAN.has(token))) return false;
  const known = tokens.filter(token => ENGLISH_COMMON.has(token)).length;
  return known / tokens.length >= 0.4;
}

export function groqEligible(env, { question = "", photos = 0, files = 0, voice = false } = {}) {
  const mode = groqMode(env);
  if (mode === "off" || photos || files || voice) return false;
  return mode === "text" || looksEnglish(question);
}

// Gemini-style contents ({role: user|model, parts: [{text}]}) to chat messages.
export function toChatMessages(system, contents) {
  const messages = [{ role: "system", content: system }];
  for (const turn of contents || []) {
    const text = (turn.parts || []).map(part => part.text || "").filter(Boolean).join("\n");
    if (text) messages.push({ role: turn.role === "model" ? "assistant" : "user", content: text });
  }
  return messages;
}

const JSON_RULE = '\n\nReply with one JSON object only, no other text: {"reply": string, "suggestions": string[] (0-3 short follow-up questions), "answered": boolean}.';

// Returns { result: { reply, suggestions, answered }, usage: { promptTokenCount, candidatesTokenCount } }. Throws on any problem.
export async function callGroq(env, { system, contents, timeoutMs = 20000 }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const model = String(env.GROQ_MODEL || DEFAULT_MODEL);
    const body = {
      model,
      messages: toChatMessages(system + JSON_RULE, contents),
      temperature: 0.3,
      max_completion_tokens: 900,
      response_format: { type: "json_object" }
    };
    if (/gpt-oss/i.test(model)) body.reasoning_effort = "low";
    const response = await fetch(GROQ_URL, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.GROQ_API_KEY}` }, body: JSON.stringify(body), signal: controller.signal });
    if (!response.ok) throw new Error(`Groq HTTP ${response.status}`);
    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("Groq: no content");
    let result;
    try { result = JSON.parse(text); } catch { throw new Error("Groq: not valid JSON"); }
    if (typeof result?.reply !== "string" || !result.reply.trim()) throw new Error("Groq: no reply");
    return {
      result: {
        reply: result.reply,
        suggestions: Array.isArray(result.suggestions) ? result.suggestions.filter(item => typeof item === "string").slice(0, 3) : [],
        answered: result.answered !== false
      },
      usage: { promptTokenCount: Number(data?.usage?.prompt_tokens) || 0, candidatesTokenCount: Number(data?.usage?.completion_tokens) || 0 }
    };
  } finally {
    clearTimeout(timer);
  }
}
