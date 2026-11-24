import { SALESBOT_SCHEMA } from "./botcraft-salesbot.js";
import { detectLanguage, planVoice, synthesize } from "./voice-studio.js";

// Voice to voice for the customer chat. The customer speaks, the AI hears the recording itself (no
// separate speech-to-text step that mangles Telugu), answers from the shop's information, and the answer
// comes back as a natural voice (Sarvam for Indian languages when its key is set, otherwise Gemini speech).
// When no voice can be made the page reads the answer with the phone's own voice.
//
//   VOICE_GEMINI_API_KEY    optional; the speech key (falls back to BOTCRAFT_GEMINI_API_KEY)
//   SARVAM_API_KEY          optional; used for Indian languages when set
//   BOTCRAFT_VOICE_REPLY    "off" switches the spoken answer off (the text answer still comes)

// What the customer said is needed too, to show it in the chat.
export const VOICE_SCHEMA = {
  ...SALESBOT_SCHEMA,
  properties: {
    heard: { type: "STRING", description: "what the customer said in the recording, written word for word in their own language; empty when there was no speech" },
    ...SALESBOT_SCHEMA.properties
  },
  required: ["heard", ...SALESBOT_SCHEMA.required]
};

export const AUDIO_RULE = "\n- The customer's question is in the attached voice recording. First write exactly what they said in \"heard\" (in their own language and script). If the recording has no clear speech, leave \"heard\" empty and do not guess. Then answer that question. Reply in the language the customer spoke.";

const AUDIO_TYPES = new Set(["audio/wav", "audio/x-wav", "audio/wave"]);
const MAX_AUDIO_CHARS = 2_000_000; // base64 characters: about 1.5 MB, 45 seconds of 16 kHz mono sound

export function customerAudio(raw) {
  const mimeType = String(raw?.mimeType || "").split(";")[0].trim().toLowerCase();
  const data = raw?.data;
  if (!AUDIO_TYPES.has(mimeType) || typeof data !== "string" || !data || data.length > MAX_AUDIO_CHARS || !/^[A-Za-z0-9+/=]+$/.test(data)) return null;
  return { mimeType: "audio/wav", data };
}

// Adds the recording to the customer's last message.
export function withCustomerAudio(contents, audio) {
  if (!audio) return contents;
  const out = contents.map(m => ({ ...m, parts: [...m.parts] }));
  const last = out[out.length - 1];
  if (last) last.parts.push({ inlineData: { mimeType: audio.mimeType, data: audio.data } });
  return out;
}

function toBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export const speechAvailable = env => env?.BOTCRAFT_VOICE_REPLY !== "off" && Boolean(env?.SARVAM_API_KEY || env?.VOICE_GEMINI_API_KEY || env?.BOTCRAFT_GEMINI_API_KEY);

// The answer as sound: { mimeType, data } (WAV, base64), or null when no voice can be made.
export async function speakReply(env, text) {
  if (!speechAvailable(env)) return null;
  // Spoken answers are short; markdown marks, links and emoji are not read out.
  const clean = String(text || "").replace(/[*_#>`~]|https?:\/\/\S+|\p{Extended_Pictographic}/gu, " ").replace(/\s+/g, " ").trim().slice(0, 700);
  if (!clean) return null;
  const lang = detectLanguage(clean);
  const available = { sarvam: Boolean(env.SARVAM_API_KEY), gemini: Boolean(env.VOICE_GEMINI_API_KEY || env.BOTCRAFT_GEMINI_API_KEY) };
  const plan = planVoice({ style: "normal", voice: "female", dialect: "none", lang, available });
  if (!plan) return null;
  try {
    const bytes = await synthesize({ ...env, VOICE_GEMINI_API_KEY: env.VOICE_GEMINI_API_KEY || env.BOTCRAFT_GEMINI_API_KEY }, plan, clean);
    return { mimeType: "audio/wav", data: toBase64(bytes) };
  } catch (error) {
    console.error("BotCraft spoken answer failed", String(error?.message || error).slice(0, 300));
    return null;
  }
}
