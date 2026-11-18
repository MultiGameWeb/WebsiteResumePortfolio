// AI Text to Voice: text to speech for creators, Telugu first.
//
// Paste text in any language and get audio in the same language. Optional
// helpers rewrite bookish text into spoken style (with a dialect) or translate
// it before the voice is made.
//
// Engines:
//   Sarvam Bulbul   Indian languages, native accent (normal / narration / news)
//   Gemini TTS      acting styles (emotional, comedy, ...), dialects, any language
//
// Words are prepaid. A browser gets a "wallet" (random code kept in
// localStorage) with free words; more words are bought as packs with Razorpay.
//
// Routes:
//   GET  /api/voice/config
//   POST /api/voice/wallet     { token?, lookupOnly? }         -> { token, words, isNew }
//   POST /api/voice/generate   { token, text, style, voice, dialect } -> audio/wav
//        (headers X-Words-Used, X-Words-Left, X-Voice-Engine; errors are JSON)
//   POST /api/voice/rewrite    { token, text, dialect }        -> { text }
//   POST /api/voice/translate  { token, text, to }             -> { text }
//   POST /api/voice/report     { token, reason, text }         -> { ok }
//   POST /api/voice/order      { token, pack }                 -> Razorpay order
//   POST /api/voice/verify     { token, orderId, paymentId, signature } -> { words }
//   POST /api/voice/recover    { token, orderId }              -> { words }
//   POST /api/voice/grant      (Authorization: Bearer ADMIN_TOKEN) { token?, words } -> { token, words }
//
// Worker secrets / variables:
//   SARVAM_API_KEY          secret, Sarvam engine (optional if Gemini is set)
//   VOICE_GEMINI_API_KEY    secret, Gemini engine + rewrite/translate (optional if Sarvam is set)
//   RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET   without them buying is off (free words still work)
//   ADMIN_TOKEN             secret, for /grant
//   VOICE_FREE_WORDS        default 300
//   VOICE_DAILY_WORD_LIMIT  words per day across everyone, default 20000 (spending cap)
//   VOICE_FREE_WALLETS_PER_IP  free wallets per IP per day, default 2
//   VOICE_DISABLED          "true" switches the studio off
//   VOICE_PAYMENTS          "off" holds buying packs (free words and /grant still work)
//   VOICE_TEST_WALLETS      wallet codes (comma separated) whose "Buy" adds words free, for testing;
//                           these wallets also see the owner alert banner (service problems)
//   TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID  optional: service problems are also sent to Telegram
//   VOICE_TTS_MODEL_FLASH / VOICE_TTS_MODEL_LITE / VOICE_TEXT_MODEL / SARVAM_TTS_MODEL  optional
//
// Privacy: the text is sent to Sarvam or Google to make the audio and is not
// stored, except the text a user attaches to a report.

import { allowedOrigins } from "./botcraft-builder.js";
import { callGemini } from "./ai-engine.js";
import { geminiUsProxy } from "./gemini-proxy.js";

const PREFIX = "/api/voice/";
const TOKEN_PATTERN = /^[a-f0-9]{32}$/;
const ORDER_PATTERN = /^order_[A-Za-z0-9]{8,40}$/;
const PAYMENT_PATTERN = /^pay_[A-Za-z0-9]{8,40}$/;

export const MAX_WORDS_PER_GENERATION = 800;
const MAX_TEXT_CHARS = 8000;
const CHUNK_CHARS = 1800;
const CHUNK_GAP_MS = 250;
const CHUNK_CONCURRENCY = 2;
const DEFAULT_FREE_WORDS = 300;
const DEFAULT_DAILY_WORDS = 20000;
const DEFAULT_FREE_WALLETS_PER_IP = 2;
const TEXT_CALLS_PER_DAY = 40;

const DEFAULT_MODELS = {
  flash: "gemini-3.8-flash-tts",
  lite: "gemini-3.8-flash-lite-tts",
  text: "gemini-3.1-flash-lite",
  sarvam: "bulbul:v3"
};

// Prices live here only, in the smallest unit of each currency (paise,
// cents, pence). The visitor's country picks the currency (see currencyFor).
export const PACKS = {
  w1k: { words: 1000, label: "1K words" },
  w2k: { words: 2000, label: "2K words" },
  w5k: { words: 5000, label: "5K words", badge: "Most popular" },
  w10k: { words: 10000, label: "10K words" },
  w25k: { words: 25000, label: "25K words", badge: "Best value" }
};
export const PRICES = {
  INR: { w1k: 4900, w2k: 7900, w5k: 17900, w10k: 34900, w25k: 84900 },
  USD: { w1k: 99, w2k: 179, w5k: 399, w10k: 699, w25k: 1499 },
  GBP: { w1k: 89, w2k: 149, w5k: 349, w10k: 599, w25k: 1299 },
  EUR: { w1k: 99, w2k: 169, w5k: 379, w10k: 649, w25k: 1399 }
};
const EURO_COUNTRIES = new Set("AT BE BG HR CY CZ DK EE FI FR DE GR HU IE IT LV LT LU MT NL PL PT RO SK SI ES SE IS LI NO".split(" "));

// India pays in rupees, the UK in pounds, Europe in euros, everyone else in dollars.
export function currencyFor(country) {
  const c = String(country || "").toUpperCase();
  if (c === "IN") return "INR";
  if (c === "GB") return "GBP";
  if (EURO_COUNTRIES.has(c)) return "EUR";
  return "USD";
}
export const packPrice = (id, currency) => PRICES[currency]?.[id] ?? PRICES.USD[id];

// engine "auto": Sarvam for Indian scripts when its key is set, otherwise
// Gemini Flash-Lite. engine "acting": Gemini Flash (the stronger actor).
const style = (group, label, note, prompt, engine = "acting") => ({ group, label, note, prompt, engine });
export const STYLES = {
  normal: style("Basic", "Normal", "Clear & neutral", "clear, natural and neutral, at an even pace", "auto"),
  narration: style("Basic", "Narration", "Story / audiobook", "a warm storyteller narrating an audiobook, unhurried, with natural pauses", "auto"),
  news: style("Basic", "News", "Formal & crisp", "a confident news presenter, crisp and formal, steady pace", "auto"),
  conversational: style("Basic", "Conversational", "Like a friend", "casual and friendly, like chatting with a close friend"),

  reel_hook: style("Instagram & creators", "Reel hook", "Grabs attention fast", "a fast, punchy social media reel voice-over that hooks the listener in the first second, upbeat, confident and energetic"),
  genz: style("Instagram & creators", "Gen Z creator", "Trendy & expressive", "a trendy young social media creator, casual, expressive and full of personality, natural and relatable"),
  podcast: style("Instagram & creators", "Podcast", "Relaxed host", "a relaxed, warm podcast host talking to listeners, natural and engaging"),
  ad: style("Instagram & creators", "Ad / promo", "Sells with energy", "a persuasive advertisement voice-over, warm and energetic, building excitement towards a clear call to action"),
  explainer: style("Instagram & creators", "Explainer", "Teacher style", "a clear, friendly teacher explaining step by step, patient and easy to follow"),
  review: style("Instagram & creators", "Product review", "Honest & friendly", "an honest, friendly product reviewer sharing real opinions, conversational and trustworthy"),

  emotional: style("Emotions", "Emotional", "Heartfelt", "deeply emotional and heartfelt, gentle, with real feeling in every line"),
  happy: style("Emotions", "Happy", "Cheerful & bright", "happy and cheerful, smiling while speaking, bright and positive"),
  sad: style("Emotions", "Sad", "Soft & heavy", "sad and sorrowful, soft and slow, with a heavy heart"),
  angry: style("Emotions", "Angry", "Fiery & intense", "angry and intense, forceful and fiery, but still clear"),
  romantic: style("Emotions", "Romantic", "Warm & tender", "romantic, warm and tender, affectionate and soft"),
  motivational: style("Emotions", "Motivational", "Energetic", "powerful and inspiring, with rising energy, like a motivational speaker"),
  sarcastic: style("Emotions", "Sarcastic", "Dry & witty", "dry and sarcastic, witty, with playful exaggeration"),

  comedy: style("Genres", "Comedy", "Fun & timing", "playful and funny, energetic, with comic timing and expressive reactions"),
  suspense: style("Genres", "Suspense story", "Gripping & dramatic", "a gripping storyteller building suspense, with dramatic pauses and rising tension"),
  horror: style("Genres", "Horror", "Spooky & eerie", "spooky and eerie, slow and chilling, like a horror story told at night"),
  documentary: style("Genres", "Documentary", "Deep & measured", "a deep, measured documentary narrator, calm and authoritative"),
  trailer: style("Genres", "Movie trailer", "Epic & bold", "an epic movie trailer voice, deep, bold and dramatic"),
  sports: style("Genres", "Sports commentary", "Fast & thrilling", "a fast, thrilling sports commentator, excited and full of energy"),
  devotional: style("Genres", "Devotional", "Calm & reverent", "calm, reverent and devotional, peaceful and sincere"),
  kids: style("Genres", "Kids story", "Fun for children", "a cheerful, animated storyteller for young children, playful and gentle"),
  meditation: style("Genres", "Calm / meditation", "Slow & soothing", "a slow, soothing meditation guide, very calm and relaxing"),
  whisper: style("Genres", "Whisper", "Soft & close", "a soft, intimate whisper, quiet and close")
};

// Accents need acting control, so they always use Gemini Flash. They change
// how the words sound, not the words; "Make it spoken" can change the words.
const accent = (group, label, desc) => ({ group, label, prompt: `Speak with an authentic ${desc} accent, rhythm and intonation.` });
export const DIALECTS = {
  none: { group: "", label: "Standard (no accent)", prompt: "" },
  telangana: accent("Telugu", "Telangana", "Telangana Telugu"),
  andhra: accent("Telugu", "Godavari / Coastal Andhra", "Godavari (coastal Andhra) Telugu"),
  rayalaseema: accent("Telugu", "Rayalaseema", "Rayalaseema Telugu"),
  uttarandhra: accent("Telugu", "Uttarandhra (Srikakulam, Vizag)", "Uttarandhra (north coastal Andhra, Srikakulam and Vizag) Telugu"),
  hyderabadi: accent("Telugu", "Hyderabadi (Dakhni)", "casual Hyderabadi Dakhni"),
  delhi: accent("Hindi & North India", "Delhi Hindi", "Delhi Hindi"),
  bambaiya: accent("Hindi & North India", "Mumbai (Bambaiya)", "Mumbai Bambaiya Hindi"),
  bihari: accent("Hindi & North India", "Bihari / Bhojpuri style", "Bihari, Bhojpuri-flavoured Hindi"),
  haryanvi: accent("Hindi & North India", "Haryanvi", "Haryanvi"),
  rajasthani: accent("Hindi & North India", "Rajasthani", "Rajasthani-flavoured Hindi"),
  lucknowi: accent("Hindi & North India", "Lucknowi (polite)", "polite Lucknowi Awadhi-flavoured Hindi"),
  hinglish: accent("Hindi & North India", "Hinglish (city youth)", "urban Indian Hinglish, the way young people in Delhi and Mumbai talk,"),
  chennai: accent("Tamil", "Chennai Tamil", "Chennai Tamil"),
  madurai: accent("Tamil", "Madurai Tamil", "Madurai Tamil"),
  kongu: accent("Tamil", "Kongu (Coimbatore)", "Kongu (Coimbatore) Tamil"),
  bengaluru: accent("Kannada", "Bengaluru Kannada", "Bengaluru Kannada"),
  north_karnataka: accent("Kannada", "North Karnataka (Dharwad)", "North Karnataka (Dharwad) Kannada"),
  mangaluru: accent("Kannada", "Mangaluru (coastal)", "coastal Mangaluru Kannada"),
  thrissur: accent("Malayalam", "Thrissur (Central Kerala)", "Thrissur (central Kerala) Malayalam"),
  malabar: accent("Malayalam", "Malabar (Kozhikode)", "Malabar (Kozhikode) Malayalam"),
  trivandrum: accent("Malayalam", "Thiruvananthapuram", "Thiruvananthapuram (south Kerala) Malayalam"),
  puneri: accent("Marathi", "Puneri", "Puneri Marathi"),
  mumbai_marathi: accent("Marathi", "Mumbai Marathi", "Mumbai Marathi"),
  varhadi: accent("Marathi", "Varhadi (Vidarbha)", "Varhadi (Vidarbha) Marathi"),
  kolkata: accent("Bengali", "Kolkata Bengali", "Kolkata Bengali"),
  bangal: accent("Bengali", "Bangal (East Bengal)", "Bangal (East Bengal) Bengali"),
  ahmedabad: accent("Gujarati", "Ahmedabad Gujarati", "Ahmedabad Gujarati"),
  kathiawadi: accent("Gujarati", "Kathiawadi", "Kathiawadi Gujarati"),
  majhi: accent("Punjabi", "Majhi (Amritsar)", "Majhi (Amritsar) Punjabi"),
  malwai: accent("Punjabi", "Malwai", "Malwai Punjabi"),
  cuttack: accent("Odia", "Cuttack Odia", "Cuttack Odia"),
  sambalpuri: accent("Odia", "Sambalpuri", "Sambalpuri"),
  indian_english: accent("English (India)", "Indian English", "neutral Indian English"),
  south_indian_english: accent("English (India)", "South Indian English", "South Indian English"),
  us_general: accent("English (US)", "American (neutral)", "neutral General American English"),
  us_southern: accent("English (US)", "Southern US", "Southern American English"),
  us_newyork: accent("English (US)", "New York", "New York City English"),
  us_california: accent("English (US)", "California (casual)", "casual Californian West Coast English"),
  us_midwest: accent("English (US)", "Midwest", "Midwestern American English"),
  uk_rp: accent("English (UK & more)", "British (BBC / RP)", "British Received Pronunciation (BBC English)"),
  uk_london: accent("English (UK & more)", "London (Cockney / Estuary)", "London Cockney and Estuary English"),
  uk_northern: accent("English (UK & more)", "Northern English (Manchester)", "Northern English (Manchester)"),
  uk_scottish: accent("English (UK & more)", "Scottish", "Scottish English"),
  uk_irish: accent("English (UK & more)", "Irish", "Irish English"),
  uk_welsh: accent("English (UK & more)", "Welsh", "Welsh English"),
  australian: accent("English (UK & more)", "Australian", "Australian English"),
  canadian: accent("English (UK & more)", "Canadian", "Canadian English")
};

const VOICES = {
  gemini: { female: "Kore", male: "Charon" },
  sarvam: { female: "priya", male: "shubh" }
};

const LANGUAGES = {
  en: "English", te: "Telugu", hi: "Hindi", ta: "Tamil", kn: "Kannada", ml: "Malayalam",
  bn: "Bengali", mr: "Marathi", gu: "Gujarati", pa: "Punjabi"
};

// Unicode blocks of the scripts Sarvam reads, with its language code.
const SCRIPTS = [
  [0x0c00, 0x0c7f, "te-IN"], [0x0900, 0x097f, "hi-IN"], [0x0b80, 0x0bff, "ta-IN"],
  [0x0c80, 0x0cff, "kn-IN"], [0x0d00, 0x0d7f, "ml-IN"], [0x0980, 0x09ff, "bn-IN"],
  [0x0a80, 0x0aff, "gu-IN"], [0x0a00, 0x0a7f, "pa-IN"], [0x0b00, 0x0b7f, "od-IN"]
];

// ---------- small helpers ----------

const num = (value, fallback, min = 1) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= min ? Math.floor(n) : fallback;
};
const settings = env => ({
  freeWords: num(env?.VOICE_FREE_WORDS, DEFAULT_FREE_WORDS, 0),
  dailyWords: num(env?.VOICE_DAILY_WORD_LIMIT, DEFAULT_DAILY_WORDS),
  freeWalletsPerIp: num(env?.VOICE_FREE_WALLETS_PER_IP, DEFAULT_FREE_WALLETS_PER_IP, 0)
});
const engines = env => ({ sarvam: Boolean(env?.SARVAM_API_KEY), gemini: Boolean(env?.VOICE_GEMINI_API_KEY) });
// VOICE_PAYMENTS = "off" holds buying (e.g. while testing) without touching
// the Razorpay keys that other features share.
// Owner's own wallets: "Buy" adds the pack free, no Razorpay. Works even with
// VOICE_PAYMENTS = "off". Codes are 32 hex letters; anything else is ignored.
const testWallets = env => new Set(String(env?.VOICE_TEST_WALLETS || "").toLowerCase().split(/[\s,]+/).filter(t => TOKEN_PATTERN.test(t)));
const razorpayReady = env => env?.VOICE_PAYMENTS !== "off" && Boolean(env?.RAZORPAY_KEY_ID && env?.RAZORPAY_KEY_SECRET);
const today = () => new Date().toISOString().slice(0, 10);
const randomToken = () => [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, "0")).join("");

function headers(origin, extra = {}) {
  return {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    Vary: "Origin",
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Expose-Headers": "X-Words-Used, X-Words-Left, X-Voice-Engine",
    ...extra
  };
}
const reply = (data, status, origin) => new Response(JSON.stringify(data), { status, headers: headers(origin) });

function same(a, b) {
  const x = new TextEncoder().encode(String(a));
  const y = new TextEncoder().encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}

const recent = new Map();
function throttled(key, limit) {
  const now = Date.now();
  const list = (recent.get(key) || []).filter(t => now - t < 60000);
  list.push(now);
  recent.set(key, list);
  if (recent.size > 5000) recent.clear();
  return list.length > limit;
}

// ---------- text ----------

export function cleanText(value) {
  return String(typeof value === "string" ? value : "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Words are what users understand. Long words (or text without spaces) also
// cost more audio, so 8 letters count as at least one word.
export function billableWords(text) {
  const t = cleanText(text);
  if (!t) return 0;
  const words = t.split(/\s+/).filter(Boolean).length;
  const letters = t.replace(/\s+/g, "").length;
  return Math.max(words, Math.ceil(letters / 8));
}

// The Indian script most of the letters are written in, or "" (Latin / other).
export function detectLanguage(text) {
  const counts = new Map();
  let latin = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) { latin += 1; continue; }
    const hit = SCRIPTS.find(([from, to]) => code >= from && code <= to);
    if (hit) counts.set(hit[2], (counts.get(hit[2]) || 0) + 1);
  }
  let best = "";
  let bestCount = 0;
  for (const [lang, count] of counts) if (count > bestCount) { best = lang; bestCount = count; }
  return bestCount > latin ? best : "";
}

// Splits at sentence ends, then commas, then spaces, so no piece is over max.
export function chunkText(text, max = CHUNK_CHARS) {
  const sentences = text.match(/[^.!?।॥\n]+[.!?।॥]*\s*|\n+/g) || [text];
  const pieces = [];
  for (const sentence of sentences) {
    if (sentence.length <= max) { pieces.push(sentence); continue; }
    let rest = sentence;
    while (rest.length > max) {
      // `end` is where the piece stops; the comma or space stays with it.
      let end = rest.lastIndexOf(", ", max - 2) + 2;
      if (end < max * 0.5) end = rest.lastIndexOf(" ", max - 1) + 1;
      if (end < max * 0.5) end = max;
      pieces.push(rest.slice(0, end));
      rest = rest.slice(end);
    }
    if (rest) pieces.push(rest);
  }
  const chunks = [];
  let current = "";
  for (const piece of pieces) {
    if (current && current.length + piece.length > max) { chunks.push(current.trim()); current = ""; }
    current += piece;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.filter(Boolean);
}

// Which engine, model, voice and style prompt to use.
export function planVoice({ style, voice, dialect, lang, available }) {
  const s = STYLES[style] || STYLES.normal;
  const d = DIALECTS[dialect] && dialect !== "none" ? DIALECTS[dialect] : null;
  const gender = voice === "male" ? "male" : "female";
  const prompt = [s.prompt, d?.prompt].filter(Boolean).join(". ");
  let engine;
  if (s.engine === "auto" && !d) {
    engine = lang && available.sarvam ? "sarvam" : available.gemini ? "gemini-lite" : null;
  } else {
    engine = available.gemini ? "gemini-flash" : lang && available.sarvam ? "sarvam" : null;
  }
  if (!engine) return null;
  return {
    engine,
    prompt,
    lang,
    voiceName: engine === "sarvam" ? VOICES.sarvam[gender] : VOICES.gemini[gender],
    fallback: s.engine === "acting" && engine === "sarvam"
  };
}

// ---------- WAV ----------

function base64ToBytes(b64) {
  const binary = atob(String(b64 || "").replace(/\s+/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

const ascii = (bytes, at) => String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]);

// Reads a WAV file, or raw 16-bit PCM when the mime type says so.
export function readAudio(bytes, mimeType = "") {
  if (bytes.length >= 12 && ascii(bytes, 0) === "RIFF" && ascii(bytes, 8) === "WAVE") {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    let at = 12;
    let format = null;
    while (at + 8 <= bytes.length) {
      const id = ascii(bytes, at);
      let size = view.getUint32(at + 4, true);
      const start = at + 8;
      if (id === "fmt ") {
        format = {
          audioFormat: view.getUint16(start, true),
          channels: view.getUint16(start + 2, true),
          sampleRate: view.getUint32(start + 4, true),
          bitsPerSample: view.getUint16(start + 14, true)
        };
      } else if (id === "data") {
        if (!format) throw new Error("WAV data before format.");
        // Streamed WAVs may say 0 or 0xFFFFFFFF; then the data runs to the end.
        if (size === 0 || size === 0xffffffff || start + size > bytes.length) size = bytes.length - start;
        return { ...format, data: bytes.subarray(start, start + size) };
      }
      at = start + size + (size % 2);
    }
    throw new Error("WAV has no audio data.");
  }
  if (/l16|pcm/i.test(mimeType)) {
    const rate = Number((/rate=(\d+)/i.exec(mimeType) || [])[1]) || 24000;
    return { audioFormat: 1, channels: 1, sampleRate: rate, bitsPerSample: 16, data: bytes };
  }
  throw new Error(`Unsupported audio format ${mimeType || "(unknown)"}.`);
}

// Joins pieces of the same format into one WAV, with a short pause between them.
export function joinWav(parts, gapMs = CHUNK_GAP_MS) {
  if (!parts.length) throw new Error("No audio.");
  const { audioFormat, channels, sampleRate, bitsPerSample } = parts[0];
  for (const p of parts) {
    if (p.channels !== channels || p.sampleRate !== sampleRate || p.bitsPerSample !== bitsPerSample || p.audioFormat !== audioFormat) {
      throw new Error("Audio pieces have different formats.");
    }
  }
  const blockAlign = channels * (bitsPerSample / 8);
  const gapBytes = Math.round((sampleRate * gapMs) / 1000) * blockAlign;
  const dataSize = parts.reduce((sum, p) => sum + p.data.length, 0) + gapBytes * (parts.length - 1);
  const out = new Uint8Array(44 + dataSize);
  const view = new DataView(out.buffer);
  const write = (at, text) => { for (let i = 0; i < 4; i += 1) out[at + i] = text.charCodeAt(i); };
  write(0, "RIFF"); view.setUint32(4, 36 + dataSize, true); write(8, "WAVE");
  write(12, "fmt "); view.setUint32(16, 16, true); view.setUint16(20, audioFormat, true);
  view.setUint16(22, channels, true); view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true); view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  write(36, "data"); view.setUint32(40, dataSize, true);
  let at = 44;
  parts.forEach((p, i) => {
    out.set(p.data, at);
    at += p.data.length + (i < parts.length - 1 ? gapBytes : 0); // gap bytes stay zero = silence
  });
  return out;
}

// ---------- engines ----------

const LOCATION_ERROR = /location is not supported/i;
const RETRYABLE = new Set([429, 500, 502, 503, 504]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

// How long Google asks us to wait on a 429 (Retry-After header or the
// "retryDelay": "23s" field in the error body), capped at 30 seconds.
async function retryDelayMs(response) {
  const header = Number(response.headers.get("Retry-After"));
  if (Number.isFinite(header) && header > 0) return Math.min(header * 1000, 30000);
  const body = await response.clone().text().catch(() => "");
  const match = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(body);
  return match ? Math.min(Number(match[1]) * 1000, 30000) : 0;
}

async function fetchWithRetry(doFetch, attempts = 4) {
  let last;
  for (let i = 0; i < attempts; i += 1) {
    last = await doFetch(i);
    if (last.ok || !RETRYABLE.has(last.status) || i === attempts - 1) return last;
    // Out of credits will not fix itself in a few seconds.
    if (last.status === 429 && /credit|prepa|billing/i.test(await last.clone().text().catch(() => ""))) return last;
    const asked = last.status === 429 ? await retryDelayMs(last) : 0;
    await sleep(Math.max(asked, (last.status === 429 ? 3000 : 600) * (2 ** i)) + Math.floor(Math.random() * 400));
  }
  return last;
}

// What went wrong with Google, in words the owner understands.
//   CREDITS     prepaid credits ran out / billing problem (retrying will not help)
//   RATE_LIMIT  too many requests for the current tier (429)
//   DOWN        Google error 5xx or timeouts
//   OTHER       anything else
export function classifyFailure(error) {
  const text = String(error?.message || error || "");
  if (/credit|prepa(y|id)|billing|payment required|insufficient.*(fund|balance)/i.test(text)) return "CREDITS";
  if (/HTTP 429|RESOURCE_EXHAUSTED|quota/i.test(text)) return "RATE_LIMIT";
  if (/HTTP 5\d\d|timeout|timed out|aborted|network/i.test(text)) return "DOWN";
  return "OTHER";
}

// One chunk with Gemini. If the chosen model fails (busy, down, no audio),
// the other TTS model is tried: Flash and Flash-Lite have separate limits.
async function geminiTts(env, plan, text) {
  const primary = plan.engine === "gemini-flash" ? "flash" : "lite";
  const backup = primary === "flash" ? "lite" : "flash";
  try {
    return await geminiTtsModel(env, plan, text, primary, 2);
  } catch (error) {
    if (classifyFailure(error) === "CREDITS" || error.badRequest) throw error;
    plan.usedBackup = true;
    return geminiTtsModel(env, plan, text, backup, 4);
  }
}

// Gemini TTS sometimes answers 200 with no audio; try that chunk again.
async function geminiTtsModel(env, plan, text, which, attempts) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await geminiTtsOnce(env, plan, text, which, attempts);
    } catch (error) {
      if (!error.noAudio || attempt >= 2) throw error;
      await sleep(1500 * (attempt + 1));
    }
  }
}

async function geminiTtsOnce(env, plan, text, which, attempts = 4) {
  const model = which === "flash"
    ? env?.VOICE_TTS_MODEL_FLASH || DEFAULT_MODELS.flash
    : env?.VOICE_TTS_MODEL_LITE || DEFAULT_MODELS.lite;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const part = { text };
  if (plan.prompt) part.speech_metadata = { style: plan.prompt };
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": env.VOICE_GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [part] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { voice: plan.voiceName } } }
    })
  };
  const proxy = geminiUsProxy(env);
  let viaProxy = false;
  let response = await fetchWithRetry(() => (viaProxy ? proxy.fetch(endpoint, init) : fetch(endpoint, { ...init, signal: AbortSignal.timeout(90000) })), attempts);
  if (!response.ok && response.status === 400 && proxy) {
    const detail = await response.clone().text();
    if (LOCATION_ERROR.test(detail)) {
      viaProxy = true;
      response = await fetchWithRetry(() => proxy.fetch(endpoint, init), attempts);
    }
  }
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    const error = new Error(`Gemini TTS HTTP ${response.status}: ${detail}`);
    // A plain 400 (bad text, blocked content) fails the same on the other model.
    if (response.status === 400 && !/credit|billing|prepa/i.test(detail)) error.badRequest = true;
    throw error;
  }
  const payload = await response.json();
  const parts = (payload?.candidates?.[0]?.content?.parts || []).filter(p => p.inlineData?.data);
  if (!parts.length) throw Object.assign(new Error(`Gemini TTS returned no audio (finishReason=${payload?.candidates?.[0]?.finishReason || "unknown"}).`), { noAudio: true });
  const pieces = parts.map(p => readAudio(base64ToBytes(p.inlineData.data), p.inlineData.mimeType));
  return pieces.length === 1 ? pieces[0] : readAudio(joinWav(pieces, 0));
}

async function sarvamTts(env, plan, text) {
  const send = langField => fetchWithRetry(() => fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: { "Content-Type": "application/json", "api-subscription-key": env.SARVAM_API_KEY },
    body: JSON.stringify({
      text,
      [langField]: plan.lang,
      speaker: plan.voiceName,
      model: env?.SARVAM_TTS_MODEL || DEFAULT_MODELS.sarvam,
      pace: 1.0,
      speech_sample_rate: 24000
    }),
    signal: AbortSignal.timeout(60000)
  }));
  let response = await send("target_language_code");
  // Newer Sarvam docs name the field language_code; switch if the API asks for it.
  if (response.status === 400 || response.status === 422) {
    const detail = await response.clone().text();
    if (/(^|[^_])language_code/.test(detail)) response = await send("language_code");
  }
  if (!response.ok) throw new Error(`Sarvam TTS HTTP ${response.status}: ${(await response.text()).slice(0, 500)}`);
  const payload = await response.json();
  const audios = Array.isArray(payload?.audios) ? payload.audios.filter(Boolean) : [];
  if (!audios.length) throw new Error("Sarvam TTS returned no audio.");
  const pieces = audios.map(a => readAudio(base64ToBytes(a)));
  return pieces.length === 1 ? pieces[0] : readAudio(joinWav(pieces, 0));
}

export async function synthesize(env, plan, text) {
  const chunks = chunkText(text);
  const run = plan.engine === "sarvam" ? sarvamTts : geminiTts;
  const results = new Array(chunks.length);
  let next = 0;
  async function worker() {
    while (next < chunks.length) {
      const i = next;
      next += 1;
      results[i] = await run(env, plan, chunks[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CHUNK_CONCURRENCY, chunks.length) }, worker));
  return joinWav(results);
}

// ---------- database ----------

let migrated = false;
async function tables(db) {
  await createTables(db);
  if (migrated) return;
  // Orders tables made before currencies existed get the column once.
  await db.prepare("ALTER TABLE voice_orders ADD COLUMN currency TEXT NOT NULL DEFAULT 'INR'").run().catch(() => {});
  migrated = true;
}

async function createTables(db) {
  await db.batch([
    db.prepare("CREATE TABLE IF NOT EXISTS voice_wallets (token TEXT PRIMARY KEY, words INTEGER NOT NULL, source TEXT NOT NULL, created_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS voice_free_claims (day TEXT NOT NULL, ip_hash TEXT NOT NULL, claims INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, ip_hash))"),
    db.prepare("CREATE TABLE IF NOT EXISTS voice_daily (day TEXT PRIMARY KEY, words INTEGER NOT NULL DEFAULT 0)"),
    db.prepare("CREATE TABLE IF NOT EXISTS voice_text_usage (day TEXT NOT NULL, token TEXT NOT NULL, calls INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (day, token))"),
    db.prepare("CREATE TABLE IF NOT EXISTS voice_generations (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT NOT NULL, words INTEGER NOT NULL, chars INTEGER NOT NULL, engine TEXT NOT NULL, style TEXT NOT NULL, lang TEXT, created_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS voice_orders (order_id TEXT PRIMARY KEY, token TEXT NOT NULL, pack TEXT NOT NULL, words INTEGER NOT NULL, amount INTEGER NOT NULL, status TEXT NOT NULL, payment_id TEXT, credited INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, currency TEXT NOT NULL DEFAULT 'INR')"),
    db.prepare("CREATE TABLE IF NOT EXISTS voice_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, token TEXT, reason TEXT NOT NULL, text TEXT, created_at TEXT NOT NULL)"),
    db.prepare("CREATE TABLE IF NOT EXISTS voice_health (kind TEXT PRIMARY KEY, count_day TEXT NOT NULL, count INTEGER NOT NULL DEFAULT 0, last_at TEXT NOT NULL, detail TEXT, alerted_at TEXT)")
  ]);
}

async function walletWords(db, token) {
  if (!TOKEN_PATTERN.test(String(token || ""))) return null;
  const row = await db.prepare("SELECT words FROM voice_wallets WHERE token = ?").bind(token).first();
  return row ? Number(row.words) : null;
}

async function createWallet(db, words, source) {
  const token = randomToken();
  await db.prepare("INSERT INTO voice_wallets (token, words, source, created_at) VALUES (?, ?, ?, ?)")
    .bind(token, words, source, new Date().toISOString()).run();
  return token;
}

// Takes words from the wallet only if enough are left (one atomic statement).
async function takeWords(db, token, words) {
  const done = await db.prepare("UPDATE voice_wallets SET words = words - ?1 WHERE token = ?2 AND words >= ?1").bind(words, token).run();
  return Boolean(done.meta?.changes);
}
const giveWords = (db, token, words) =>
  db.prepare("UPDATE voice_wallets SET words = words + ? WHERE token = ?").bind(words, token).run();

// Counts words across everyone today. Fails closed above the cap.
async function reserveDaily(db, env, words) {
  const day = today();
  const row = await db.prepare("INSERT INTO voice_daily (day, words) VALUES (?1, ?2) ON CONFLICT(day) DO UPDATE SET words = words + ?2 RETURNING words")
    .bind(day, words).first();
  if (Number(row?.words || 0) > settings(env).dailyWords) {
    await releaseDaily(db, words, day);
    return false;
  }
  return true;
}
const releaseDaily = (db, words, day = today()) =>
  db.prepare("UPDATE voice_daily SET words = MAX(words - ?, 0) WHERE day = ?").bind(words, day).run();

async function reserveTextCall(db, token) {
  const row = await db.prepare("INSERT INTO voice_text_usage (day, token, calls) VALUES (?1, ?2, 1) ON CONFLICT(day, token) DO UPDATE SET calls = calls + 1 RETURNING calls")
    .bind(today(), token).first();
  return Number(row?.calls || 0) <= TEXT_CALLS_PER_DAY;
}

// Credits a paid order once, in one transaction. A second call finds
// credited = 1, so the wallet's WHERE clause matches nothing.
async function creditOrder(db, orderId, paymentId) {
  await db.batch([
    db.prepare("UPDATE voice_wallets SET words = words + (SELECT words FROM voice_orders WHERE order_id = ?1 AND credited = 0) WHERE token = (SELECT token FROM voice_orders WHERE order_id = ?1 AND credited = 0)").bind(orderId),
    db.prepare("UPDATE voice_orders SET credited = 1, status = 'paid', payment_id = COALESCE(?2, payment_id) WHERE order_id = ?1 AND credited = 0").bind(orderId, paymentId || null)
  ]);
}

async function razorpay(env, path, init = {}) {
  const auth = btoa(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`);
  const response = await fetch(`https://api.razorpay.com/v1${path}`, { ...init, headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, signal: AbortSignal.timeout(15000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Razorpay HTTP ${response.status}: ${data?.error?.description || ""}`);
  return data;
}

// ---------- owner alerts ----------

const FAILURE_WORDS = {
  CREDITS: "Google AI credits ran out (or billing has a problem). Voices stop until credits are added.",
  RATE_LIMIT: "Google rate limit reached (too many voices at once for your Gemini tier).",
  DOWN: "Google's voice service had errors or timed out.",
  OTHER: "A voice failed for another reason."
};

// Counts failures per kind per day and pings Telegram at most every 30 min per kind.
async function recordFailure(db, env, kind, detail) {
  const now = new Date().toISOString();
  const day = now.slice(0, 10);
  const row = await db.prepare(`INSERT INTO voice_health (kind, count_day, count, last_at, detail) VALUES (?1, ?2, 1, ?3, ?4)
    ON CONFLICT(kind) DO UPDATE SET count = CASE WHEN count_day = ?2 THEN count + 1 ELSE 1 END, count_day = ?2, last_at = ?3, detail = ?4
    RETURNING count, alerted_at`).bind(kind, day, now, String(detail || "").slice(0, 300)).first();
  const last = row?.alerted_at ? Date.parse(row.alerted_at) : 0;
  if (!env?.TELEGRAM_BOT_TOKEN || !env?.TELEGRAM_CHAT_ID || Date.now() - last < 30 * 60 * 1000) return;
  await db.prepare("UPDATE voice_health SET alerted_at = ? WHERE kind = ?").bind(now, kind).run();
  await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: `⚠️ SiteCraft Text to Voice\n${FAILURE_WORDS[kind]}\nFailed voices today: ${row?.count || 1}` }),
    signal: AbortSignal.timeout(8000)
  }).catch(() => {});
}

// Problems in the last 24 hours, for the owner banner.
async function healthReport(db) {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { results = [] } = await db.prepare("SELECT kind, count, last_at FROM voice_health WHERE last_at >= ? ORDER BY last_at DESC").bind(since).all();
  return results.map(r => ({ kind: r.kind, message: FAILURE_WORDS[r.kind] || r.kind, count: Number(r.count), lastAt: r.last_at }));
}

// ---------- text helpers (Gemini) ----------

const TEXT_SCHEMA = { type: "OBJECT", properties: { text: { type: "STRING" } }, required: ["text"] };

async function rewriteSpoken(env, text, dialect) {
  const d = DIALECTS[dialect] && dialect !== "none" ? DIALECTS[dialect].label : "";
  const result = await callGemini(env, "VOICE_GEMINI_API_KEY", {
    model: env?.VOICE_TEXT_MODEL || DEFAULT_MODELS.text,
    temperature: 0.5,
    maxAttempts: 3,
    system: [
      "You rewrite scripts for voice-overs so they sound like natural spoken language, the way people really talk.",
      "Keep the same language as the input and the same meaning. Do not add new facts.",
      "Write Indian languages in their own script (Telugu in Telugu script, Hindi in Devanagari).",
      d ? `Use everyday ${d} words and expressions where they fit the text's language; otherwise just make it natural and spoken.` : "Use simple everyday spoken words instead of bookish ones.",
      "Return only the script to be read aloud: no titles, notes, stage directions or emojis.",
      "Return JSON: {\"text\": \"...\"}."
    ].join(" "),
    prompt: text,
    schema: TEXT_SCHEMA
  });
  return cleanText(result?.text);
}

async function translateText(env, text, to) {
  const result = await callGemini(env, "VOICE_GEMINI_API_KEY", {
    model: env?.VOICE_TEXT_MODEL || DEFAULT_MODELS.text,
    temperature: 0.3,
    maxAttempts: 3,
    system: [
      `Translate the user's script into natural spoken ${LANGUAGES[to]} for a voice-over.`,
      "Keep names, brands and numbers. Keep the tone. Write the language in its own script.",
      "Return only the translation: no notes or explanations.",
      "Return JSON: {\"text\": \"...\"}."
    ].join(" "),
    prompt: text,
    schema: TEXT_SCHEMA
  });
  return cleanText(result?.text);
}

// ---------- routes ----------

function configReply(env, country) {
  const e = engines(env);
  const currency = currencyFor(country);
  const s = settings(env);
  return {
    ok: true,
    enabled: env?.VOICE_DISABLED !== "true" && Boolean(env?.DB) && (e.sarvam || e.gemini),
    engines: e,
    textTools: e.gemini,
    freeWords: s.freeWords,
    maxWordsPerGeneration: MAX_WORDS_PER_GENERATION,
    payments: razorpayReady(env),
    keyId: razorpayReady(env) ? env.RAZORPAY_KEY_ID : "",
    currency,
    packs: Object.entries(PACKS).map(([id, p]) => ({ id, ...p, amount: packPrice(id, currency), currency })),
    styles: Object.entries(STYLES).map(([id, st]) => ({ id, label: st.label, note: st.note, group: st.group, acting: st.engine === "acting" })),
    dialects: Object.entries(DIALECTS).map(([id, d]) => ({ id, label: d.label, group: d.group })),
    languages: Object.entries(LANGUAGES).map(([id, label]) => ({ id, label }))
  };
}

export async function handleVoiceStudioRoute(request, env, url, ctx) {
  const path = url.pathname.replace(/\/+$/, "");
  if (!path.startsWith(PREFIX)) return null;
  const origin = request.headers.get("Origin") || "";
  if (!allowedOrigins(env).has(origin)) return reply({ ok: false, error: "Origin not allowed." }, 403, origin);
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: headers(origin) });
  const action = path.slice(PREFIX.length);

  const country = request.cf?.country || request.headers.get("CF-IPCountry") || "";
  if (action === "config" && request.method === "GET") return reply(configReply(env, country), 200, origin);
  if (request.method !== "POST") return reply({ ok: false, error: "Use POST." }, 405, origin);
  if (env?.VOICE_DISABLED === "true") return reply({ ok: false, error: "Text to Voice is switched off for now." }, 503, origin);
  const db = env?.DB;
  if (!db?.prepare) return reply({ ok: false, error: "Text to Voice is not available right now." }, 503, origin);

  const ip = request.headers.get("CF-Connecting-IP") || "unknown";
  const limits = { generate: 6, rewrite: 10, translate: 10, report: 10, wallet: 20 };
  if (throttled(`${action}:${ip}`, limits[action] || 15)) return reply({ ok: false, error: "Too many requests. Please wait a minute." }, 429, origin);

  let body;
  try { body = await request.json(); } catch { body = {}; }
  if (!body || typeof body !== "object") body = {};
  await tables(db);
  const token = String(body.token || "");

  try {
    if (action === "wallet") {
      const words = await walletWords(db, token);
      if (words !== null) {
        const owner = testWallets(env).has(token);
        return reply({ ok: true, token, words, isNew: false, ...(owner ? { owner: true, health: await healthReport(db) } : {}) }, 200, origin);
      }
      // "Use a code" only switches to an existing wallet; it never makes one.
      if (body.lookupOnly) return reply({ ok: false, error: "That code was not found." }, 404, origin);
      const s = settings(env);
      const ipHash = await sha256Hex(`voice:${ip}`);
      const row = await db.prepare("INSERT INTO voice_free_claims (day, ip_hash, claims) VALUES (?1, ?2, 1) ON CONFLICT(day, ip_hash) DO UPDATE SET claims = claims + 1 RETURNING claims")
        .bind(today(), ipHash).first();
      const free = Number(row?.claims || 0) <= s.freeWalletsPerIp ? s.freeWords : 0;
      const created = await createWallet(db, free, "free");
      return reply({ ok: true, token: created, words: free, isNew: true, freeGiven: free > 0 }, 200, origin);
    }

    if (action === "generate") {
      const balance = await walletWords(db, token);
      if (balance === null) return reply({ ok: false, error: "Your wallet was not found. Please reload the page." }, 401, origin);
      const text = cleanText(body.text);
      if (!text) return reply({ ok: false, error: "Please type or paste some text first." }, 400, origin);
      if (text.length > MAX_TEXT_CHARS) return reply({ ok: false, error: `Please keep one voice under ${MAX_WORDS_PER_GENERATION} words. Split longer scripts into parts.` }, 413, origin);
      const words = billableWords(text);
      if (words > MAX_WORDS_PER_GENERATION) return reply({ ok: false, error: `Please keep one voice under ${MAX_WORDS_PER_GENERATION} words. Split longer scripts into parts.` }, 413, origin);
      const style = STYLES[body.style] ? body.style : "normal";
      const lang = detectLanguage(text);
      const plan = planVoice({ style, voice: body.voice, dialect: body.dialect, lang, available: engines(env) });
      if (!plan) return reply({ ok: false, error: lang ? "Voice is not set up yet. Please try again later." : "This style needs Indian-language text right now (English voices are coming soon)." }, 503, origin);

      if (!(await takeWords(db, token, words))) {
        return reply({ ok: false, error: `This needs ${words} words but you have ${balance} left. Buy a pack to continue.`, code: "NO_WORDS", needed: words, words: balance }, 402, origin);
      }
      if (!(await reserveDaily(db, env, words))) {
        await giveWords(db, token, words);
        return reply({ ok: false, error: "Text to Voice is very busy today. Please try again tomorrow." }, 429, origin);
      }

      let wav;
      try {
        wav = await synthesize(env, plan, text);
      } catch (error) {
        console.error("Voice generate failed", plan.engine, error);
        await Promise.all([giveWords(db, token, words), releaseDaily(db, words)]);
        const kind = classifyFailure(error);
        const note = recordFailure(db, env, kind, error?.message).catch(() => {});
        if (ctx?.waitUntil) ctx.waitUntil(note); else await note;
        const replies = {
          CREDITS: ["PAUSED", 503, "Voices are paused for a short while. Your words were not used. Please try again later."],
          RATE_LIMIT: ["BUSY", 503, "The voice service is busy right now. Your words were not used."],
          DOWN: ["BUSY", 503, "The voice service is busy right now. Your words were not used."],
          OTHER: ["FAILED", 502, "The voice could not be made right now. Your words were not used."]
        };
        const [code, status, message] = replies[kind];
        return reply({ ok: false, code, error: message }, status, origin);
      }

      const log = db.prepare("INSERT INTO voice_generations (token, words, chars, engine, style, lang, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
        .bind(token, words, text.length, plan.engine, style, plan.lang || "auto", new Date().toISOString()).run().catch(() => {});
      if (ctx?.waitUntil) ctx.waitUntil(log); else await log;
      const left = await walletWords(db, token);
      return new Response(wav, {
        status: 200,
        headers: headers(origin, {
          "Content-Type": "audio/wav",
          "Content-Disposition": "attachment; filename=\"voice.wav\"",
          "X-Words-Used": String(words),
          "X-Words-Left": String(left ?? 0),
          "X-Voice-Engine": plan.fallback || plan.usedBackup ? `${plan.engine} (backup model)` : plan.engine
        })
      });
    }

    if (action === "rewrite" || action === "translate") {
      if (!engines(env).gemini) return reply({ ok: false, error: "This tool is not switched on yet." }, 503, origin);
      if ((await walletWords(db, token)) === null) return reply({ ok: false, error: "Your wallet was not found. Please reload the page." }, 401, origin);
      const text = cleanText(body.text);
      if (!text) return reply({ ok: false, error: "Please type or paste some text first." }, 400, origin);
      if (text.length > MAX_TEXT_CHARS) return reply({ ok: false, error: "This text is too long for one go. Please split it into parts." }, 413, origin);
      const to = String(body.to || "");
      if (action === "translate" && !LANGUAGES[to]) return reply({ ok: false, error: "Choose a language to translate to." }, 400, origin);
      if (!(await reserveTextCall(db, token))) return reply({ ok: false, error: "Today's limit for this tool is used up. Please try again tomorrow." }, 429, origin);
      const out = action === "rewrite" ? await rewriteSpoken(env, text, body.dialect) : await translateText(env, text, to);
      if (!out) return reply({ ok: false, error: "Could not do that right now. Please try again." }, 502, origin);
      return reply({ ok: true, text: out.slice(0, MAX_TEXT_CHARS) }, 200, origin);
    }

    if (action === "report") {
      const reasons = new Set(["offensive", "wrong_language", "bad_pronunciation", "harmful", "other"]);
      const reason = reasons.has(body.reason) ? body.reason : "other";
      await db.prepare("INSERT INTO voice_reports (token, reason, text, created_at) VALUES (?, ?, ?, ?)")
        .bind(TOKEN_PATTERN.test(token) ? token : null, reason, cleanText(body.text).slice(0, 2000), new Date().toISOString()).run();
      return reply({ ok: true }, 200, origin);
    }

    if (action === "grant") {
      const bearer = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      if (!env.ADMIN_TOKEN || !bearer || !same(bearer, env.ADMIN_TOKEN)) return reply({ ok: false, error: "Not allowed." }, 401, origin);
      const words = Math.min(100000, num(body.words, 0));
      if (!words) return reply({ ok: false, error: "Give words (1 to 100000)." }, 400, origin);
      if ((await walletWords(db, token)) !== null) {
        await giveWords(db, token, words);
        return reply({ ok: true, token, words: await walletWords(db, token) }, 200, origin);
      }
      const created = await createWallet(db, words, "admin");
      return reply({ ok: true, token: created, words }, 200, origin);
    }

    // Buying words
    if (action === "order" && testWallets(env).has(token) && (await walletWords(db, token)) !== null) {
      const pack = PACKS[body.pack];
      if (!pack) return reply({ ok: false, error: "Choose a pack." }, 400, origin);
      await db.prepare("INSERT INTO voice_orders (order_id, token, pack, words, amount, status, credited, created_at) VALUES (?, ?, ?, ?, 0, 'test', 1, ?)")
        .bind(`test_${randomToken()}`, token, body.pack, pack.words, new Date().toISOString()).run();
      await giveWords(db, token, pack.words);
      return reply({ ok: true, test: true, added: pack.words, words: await walletWords(db, token) }, 200, origin);
    }
    if (!razorpayReady(env)) return reply({ ok: false, error: "Online payment starts very soon.", code: "PAYMENTS_OFF" }, 503, origin);
    if ((await walletWords(db, token)) === null) return reply({ ok: false, error: "Your wallet was not found. Please reload the page." }, 401, origin);

    if (action === "order") {
      const pack = PACKS[body.pack];
      if (!pack) return reply({ ok: false, error: "Choose a pack." }, 400, origin);
      // The server picks the currency from the visitor's country, never the browser.
      const currency = currencyFor(country);
      const amount = packPrice(body.pack, currency);
      const order = await razorpay(env, "/orders", {
        method: "POST",
        body: JSON.stringify({ amount, currency, receipt: `voice_${Date.now().toString(36)}`, notes: { product: `Text to Voice ${pack.label}` } })
      });
      await db.prepare("INSERT INTO voice_orders (order_id, token, pack, words, amount, currency, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'created', ?)")
        .bind(order.id, token, body.pack, pack.words, amount, currency, new Date().toISOString()).run();
      return reply({ ok: true, orderId: order.id, amount, currency, keyId: env.RAZORPAY_KEY_ID, words: pack.words }, 200, origin);
    }

    if (action === "verify") {
      const { orderId, paymentId, signature } = body;
      if (!ORDER_PATTERN.test(String(orderId || "")) || !PAYMENT_PATTERN.test(String(paymentId || "")) || !/^[a-f0-9]{64}$/.test(String(signature || ""))) {
        return reply({ ok: false, error: "Payment details are not valid." }, 400, origin);
      }
      const expected = await hmacHex(env.RAZORPAY_KEY_SECRET, `${orderId}|${paymentId}`);
      if (!same(expected, signature)) return reply({ ok: false, error: "We could not confirm this payment. If money was deducted, tap “I paid but words did not come”." }, 400, origin);
      const order = await db.prepare("SELECT token FROM voice_orders WHERE order_id = ?").bind(orderId).first();
      if (!order) return reply({ ok: false, error: "Order not found." }, 404, origin);
      await creditOrder(db, orderId, paymentId);
      return reply({ ok: true, token: order.token, words: await walletWords(db, order.token) }, 200, origin);
    }

    if (action === "recover") {
      const orderId = String(body.orderId || "");
      if (!ORDER_PATTERN.test(orderId)) return reply({ ok: false, error: "Order not found." }, 400, origin);
      const order = await db.prepare("SELECT token, credited FROM voice_orders WHERE order_id = ?").bind(orderId).first();
      if (!order) return reply({ ok: false, error: "Order not found." }, 404, origin);
      if (!order.credited) {
        const list = await razorpay(env, `/orders/${orderId}/payments`);
        const paid = (list.items || []).find(p => p.status === "captured");
        if (!paid) return reply({ ok: false, error: "No payment found for this order yet. Please wait a minute and try again." }, 402, origin);
        await creditOrder(db, orderId, paid.id);
      }
      return reply({ ok: true, token: order.token, words: await walletWords(db, order.token) }, 200, origin);
    }
  } catch (error) {
    console.error("Text to Voice failed", action, error);
    return reply({ ok: false, error: "Something went wrong. Please try again." }, 502, origin);
  }
  return reply({ ok: false, error: "Unknown route." }, 404, origin);
}
