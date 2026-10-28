/**
 * BotCraft's outbound boundary: sends each owner action to the SiteCraft
 * Worker (POST /api/botcraft/chat), which talks to Gemini. The Gemini key
 * stays on the Worker. If the Worker is unreachable or not configured yet,
 * the local demo in mockChat.js answers instead, so the page never breaks.
 */
import { sendChatAction as sendDemoAction } from './mockChat.js';

const API_BASE = window.BOTCRAFT_API_BASE || 'https://sitecraft-ai.kammarivinaykumar216.workers.dev';
const SEND_AS_IMAGE = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIDE = 1600;
const MAX_RAW_IMAGE_BYTES = 4 * 1024 * 1024;
const HISTORY_LIMIT = 30;

// Conversation and collected facts live only in this page for now.
const history = [];
let facts = {};

let nextOptionId = 0;
const toOption = (label) => ({ id: `api-option-${++nextOptionId}`, label, value: label, kind: 'answer' });

function readAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

// Shrinks photos so they upload quickly; Gemini reads 1600px text fine.
async function prepareImage(file) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (blob) return { mimeType: 'image/jpeg', data: await readAsBase64(blob) };
  } catch {
    // Formats the browser cannot decode (e.g. HEIC) are sent as-is below.
  }
  if (SEND_AS_IMAGE.has(file.type) || /^image\/hei[cf]$/.test(file.type)) {
    if (file.size <= MAX_RAW_IMAGE_BYTES) return { mimeType: file.type, data: await readAsBase64(file) };
  }
  return null;
}

async function buildPayload(action) {
  const text = String(action.text ?? action.option?.value ?? '').trim();
  const images = [];
  const otherFiles = [];
  for (const attachment of action.attachments ?? []) {
    const image = attachment.isImage ? await prepareImage(attachment.file) : null;
    if (image) images.push(image);
    else otherFiles.push(attachment.name);
  }
  return { text, images, otherFiles, history: history.slice(-HISTORY_LIMIT), facts };
}

/**
 * @param {import('./types.js').ChatAction} action
 */
export async function sendChatAction(action) {
  const payload = await buildPayload(action);
  let response;
  let data;
  try {
    response = await fetch(`${API_BASE}/api/botcraft/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    data = await response.json();
  } catch {
    return sendDemoAction(action);
  }

  // Not deployed or not configured yet: keep the demo working.
  if (response.status === 404 || response.status === 403 || (response.status === 503 && /not configured/i.test(data?.error || ''))) {
    return sendDemoAction(action);
  }
  if (!response.ok || !data?.ok) {
    return { ok: false, error: data?.error || 'BotCraft could not reply. Please try again.' };
  }

  facts = { ...facts, ...data.facts };
  const sentFiles = payload.images.length + payload.otherFiles.length;
  history.push(
    { role: 'owner', text: payload.text || `(sent ${sentFiles} file${sentFiles === 1 ? '' : 's'})` },
    { role: 'botcraft', text: data.reply },
  );
  return {
    ok: true,
    message: {
      id: `bot-${crypto.randomUUID?.() ?? Date.now()}`,
      text: data.reply,
      options: (data.options ?? []).map(toOption),
      time: new Date(),
    },
    progress: data.progress,
  };
}
