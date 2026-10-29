/**
 * BotCraft's outbound boundary: sends each owner action to the SiteCraft
 * Worker (POST /api/botcraft/chat), which talks to Gemini. The Gemini key
 * stays on the Worker. If the Worker is unreachable or not configured yet,
 * the local demo in mockChat.js answers instead, so the page never breaks.
 */
import { sendChatAction as sendDemoAction } from './mockChat.js?v=20261030b';

const API_BASE = window.BOTCRAFT_API_BASE || 'https://sitecraft-ai.kammarivinaykumar216.workers.dev';
const SEND_AS_IMAGE = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_SIDE = 1600;
const MAX_RAW_IMAGE_BYTES = 4 * 1024 * 1024;
const HISTORY_LIMIT = 30;

// The shop id ties this browser to its saved setup on the Worker. Until owner
// login exists it is kept in localStorage; history, facts and answers below
// are also sent so the chat still works when the Worker has no database.
const SHOP_ID_KEY = 'botcraft:shopId';
const shopId = (() => {
  try {
    const existing = localStorage.getItem(SHOP_ID_KEY);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(SHOP_ID_KEY, created);
    return created;
  } catch {
    return crypto.randomUUID();
  }
})();
const history = [];
let facts = {};
// Answers to the shop type's question bank, by question id.
let answers = {};

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
  const formAnswers = action.formAnswers ?? [];
  // forms: this page shows question forms (older pages get the questions as text).
  return { shopId, forms: true, language: action.language, text, images, otherFiles, formAnswers, history: history.slice(-HISTORY_LIMIT), facts, answers };
}

/**
 * The saved conversation for this browser's shop, or null if there is none.
 * @returns {Promise<{ messages: { role: string, text: string, created_at: string }[], progress?: { answered: number, total: number } } | null>}
 */
export async function loadSavedConversation() {
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/shop?id=${encodeURIComponent(shopId)}`);
    const data = await response.json();
    if (!response.ok || !data?.ok || !data.messages?.length) return null;
    for (const message of data.messages) history.push({ role: message.role, text: message.text });
    return data;
  } catch {
    return null;
  }
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
    const detail = data?.detail ? ` [${data.detail}]` : '';
    return { ok: false, error: (data?.error || 'BotCraft could not reply. Please try again.') + detail };
  }

  facts = { ...facts, ...data.facts };
  answers = data.resetAnswers ? {} : { ...answers, ...data.answers };
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
      questions: data.questions ?? [],
      time: new Date(),
    },
    progress: data.progress,
    bankStatus: data.bankStatus,
    bot: data.bot,
    photo: data.photo,
    shopTypeName: data.shopTypeName,
  };
}

/**
 * Asks the Worker to prepare the question bank for this shop's type (1-2 minutes).
 * @returns {Promise<{ ok: true, name: string, question_count: number } | { ok: false, error: string }>}
 */
export async function prepareQuestionBank() {
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/bank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId }),
    });
    const data = await response.json();
    return response.ok && data?.ok ? data : { ok: false, error: data?.error || 'Could not prepare the questions.' };
  } catch {
    return { ok: false, error: 'Could not reach BotCraft. Please check your connection.' };
  }
}
