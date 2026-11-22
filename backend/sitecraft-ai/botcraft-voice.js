import { loadSettings, saveSettings } from "./botcraft-store.js";

// Premium owner voice: the owner speaks in the owner page or the setup chat and
// ElevenLabs Speech to Text (Scribe) turns it into text. It understands Telugu,
// Hindi and mixed speech much better than the phone's built-in voice typing.
// The key stays on the Worker (ELEVENLABS_API_KEY secret). Without it, or when
// ElevenLabs fails, the page falls back to the phone's own voice typing.
//
//   ELEVENLABS_API_KEY        secret
//   ELEVENLABS_STT_MODEL      variable, default scribe_v1
//   ELEVENLABS_DAILY_LIMIT    variable, voice messages per shop per day, default 150 (spending cap)

const ENDPOINT = "https://api.elevenlabs.io/v1/speech-to-text";
const MAX_AUDIO_BYTES = 2 * 1024 * 1024;
const AUDIO_TYPES = new Set(["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav", "audio/x-wav", "audio/aac"]);
const DEFAULT_DAILY_LIMIT = 150;

export const premiumVoiceAvailable = env => Boolean(env?.ELEVENLABS_API_KEY);

const baseType = mime => String(mime || "").split(";")[0].trim().toLowerCase();

// Returns { status, body } for the owner action "transcribe".
export async function transcribeOwnerVoice(env, shopId, audio) {
  if (!premiumVoiceAvailable(env)) return { status: 503, body: { ok: false, error: "Premium voice is not switched on.", fallback: true } };
  const type = baseType(audio?.mimeType);
  if (!AUDIO_TYPES.has(type) || typeof audio?.data !== "string" || !audio.data) return { status: 400, body: { ok: false, error: "Could not read the recording." } };
  let bytes;
  try { bytes = Uint8Array.from(atob(audio.data), c => c.charCodeAt(0)); } catch { return { status: 400, body: { ok: false, error: "Could not read the recording." } }; }
  if (!bytes.length || bytes.length > MAX_AUDIO_BYTES) return { status: 413, body: { ok: false, error: "The recording is too long. Please speak a shorter message." } };

  // Daily cap per shop, so a stuck loop can never run up the bill.
  const limit = Number(env.ELEVENLABS_DAILY_LIMIT) > 0 ? Number(env.ELEVENLABS_DAILY_LIMIT) : DEFAULT_DAILY_LIMIT;
  const today = new Date().toISOString().slice(0, 10);
  const settings = await loadSettings(env, shopId);
  const usage = settings.voiceUsage?.day === today ? settings.voiceUsage.count : 0;
  if (usage >= limit) return { status: 429, body: { ok: false, error: "Today's voice limit is finished. You can still type, or use the phone's voice typing.", fallback: true } };

  const form = new FormData();
  form.append("model_id", env.ELEVENLABS_STT_MODEL || "scribe_v1");
  form.append("tag_audio_events", "false");
  form.append("file", new Blob([bytes], { type }), `voice.${type.split("/")[1] || "webm"}`);
  let text = "";
  try {
    const response = await fetch(ENDPOINT, { method: "POST", headers: { "xi-api-key": env.ELEVENLABS_API_KEY }, body: form });
    if (!response.ok) {
      console.error("ElevenLabs speech to text failed", response.status);
      return { status: 502, body: { ok: false, error: "Premium voice is busy right now.", fallback: true } };
    }
    const data = await response.json();
    text = String(data?.text || "").trim().slice(0, 1500);
  } catch (error) {
    console.error("ElevenLabs speech to text error", error);
    return { status: 502, body: { ok: false, error: "Premium voice is busy right now.", fallback: true } };
  }
  await saveSettings(env, shopId, { voiceUsage: { day: today, count: usage + 1 } });
  if (!text) return { status: 200, body: { ok: true, text: "" } };
  return { status: 200, body: { ok: true, text } };
}
