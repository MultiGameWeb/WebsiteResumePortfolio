import { geminiUsProxy } from "./gemini-proxy.js";
import { listPhotos, loadPhoto, loadSettings, saveSettings } from "./botcraft-store.js";

// Photo studio: turns an item photo into a clean studio photo (the item on a plain
// white background) with Gemini image editing. The owner always sees the result
// first and decides; nothing is saved here. Photos that skip the studio are shown
// as uploaded (only straightened and brightened on the owner's phone).
//
//   BOTCRAFT_IMAGE_GEMINI_API_KEY   secret, optional; falls back to BOTCRAFT_GEMINI_API_KEY
//   BOTCRAFT_IMAGE_MODEL            variable, default gemini-2.5-flash-image
//   BOTCRAFT_STUDIO_DAILY_LIMIT     variable, clean-ups per shop per day, default 20 (spending cap)

const DEFAULT_MODEL = "gemini-2.5-flash-image";
const DEFAULT_DAILY_LIMIT = 20;
const TIMEOUT_MS = 60000;
const LOCATION_ERROR = /location is not supported/i;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export const PROMPT = [
  "Edit this product photo for an online shop.",
  "Keep the product EXACTLY as it is: same shape, colours, proportions, text, logos, labels and every detail. Do not redraw, restyle or improve the product itself.",
  "Remove the background and everything around it (people, hands, furniture, floor, clutter).",
  "Place the product centred on a clean, plain, pure white studio background with a soft natural shadow under it, bright even lighting, and a little space around it.",
  "Square image. No text, no watermark, no border, no other objects.",
  "If the photo shows several different products, keep only the main one in front."
].join(" ");

const keyOf = env => env?.BOTCRAFT_IMAGE_GEMINI_API_KEY || env?.BOTCRAFT_GEMINI_API_KEY || "";
export const photoStudioAvailable = env => Boolean(keyOf(env));
const dailyLimit = env => (Number(env?.BOTCRAFT_STUDIO_DAILY_LIMIT) > 0 ? Number(env.BOTCRAFT_STUDIO_DAILY_LIMIT) : DEFAULT_DAILY_LIMIT);
const today = () => new Date().toISOString().slice(0, 10);

export function studioLeftToday(env, settings) {
  const used = settings?.studioUsage?.day === today() ? settings.studioUsage.count : 0;
  return Math.max(0, dailyLimit(env) - used);
}

function toBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

// Pulls the edited picture out of a Gemini response; null when there is none.
export function pickImage(payload) {
  for (const part of payload?.candidates?.[0]?.content?.parts || []) {
    const inline = part.inlineData || part.inline_data;
    const mime = inline?.mimeType || inline?.mime_type;
    if (inline?.data && IMAGE_TYPES.has(mime)) return { mimeType: mime, data: inline.data };
  }
  return null;
}

async function callImageModel(env, apiKey, imageParts) {
  const model = env.BOTCRAFT_IMAGE_MODEL || DEFAULT_MODEL;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const init = {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: PROMPT }, ...imageParts] }],
      generationConfig: { responseModalities: ["IMAGE"] }
    })
  };
  let response = await fetch(endpoint, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) {
    const detail = await response.clone().text();
    const proxy = LOCATION_ERROR.test(detail) ? geminiUsProxy(env) : null;
    if (proxy) response = await proxy.fetch(endpoint, init);
  }
  return response;
}

// Returns { status, body } for the owner action "studio_photo".
export async function studioPhoto(env, shopId, photoId) {
  const apiKey = keyOf(env);
  if (!apiKey) return { status: 503, body: { ok: false, error: "The photo studio is not switched on yet." } };
  const photos = await listPhotos(env, shopId);
  if (!photos.some(photo => photo.photo_id === photoId && photo.kind === "product")) {
    return { status: 404, body: { ok: false, error: "That photo was not found." } };
  }
  const settings = await loadSettings(env, shopId);
  const left = studioLeftToday(env, settings);
  if (left <= 0) return { status: 429, body: { ok: false, error: "Today's photo studio limit is finished. Please try again tomorrow. Your photo stays as it is." } };

  const stored = await loadPhoto(env, photoId);
  if (!stored) return { status: 404, body: { ok: false, error: "That photo was not found." } };
  const raw = stored.data instanceof ArrayBuffer ? new Uint8Array(stored.data) : ArrayBuffer.isView(stored.data) ? new Uint8Array(stored.data.buffer, stored.data.byteOffset, stored.data.byteLength) : Uint8Array.from(stored.data);
  let image = null;
  try {
    const response = await callImageModel(env, apiKey, [{ inlineData: { mimeType: stored.mime, data: toBase64(raw) } }]);
    if (!response.ok) {
      console.error("BotCraft photo studio failed", response.status, (await response.text()).slice(0, 300));
      return { status: 502, body: { ok: false, error: "The photo studio is busy right now. Please try again in a minute." } };
    }
    image = pickImage(await response.json());
  } catch (error) {
    console.error("BotCraft photo studio error", error);
    return { status: 502, body: { ok: false, error: "The photo studio is busy right now. Please try again in a minute." } };
  }
  if (!image) return { status: 422, body: { ok: false, error: "The AI could not clean this photo. Try a clearer photo of the item, or keep it as it is." } };
  // Counted once Gemini has produced a picture (a failed call costs nothing).
  const used = settings.studioUsage?.day === today() ? settings.studioUsage.count : 0;
  await saveSettings(env, shopId, { studioUsage: { day: today(), count: used + 1 } });
  return { status: 200, body: { ok: true, image, left: left - 1 } };
}
