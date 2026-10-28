import { loadSavedConversation, prepareQuestionBank, sendChatAction } from './chatApi.js';
import {
  ImageLightbox,
  InputBar,
  MessageList,
  ProgressHeader,
} from './components.js';

const app = document.querySelector('#botcraftApp');
const headerHost = document.querySelector('#progressHeader');
const messageHost = document.querySelector('#messageList');
const inputHost = document.querySelector('#inputBar');
const dropOverlay = document.querySelector('#dropOverlay');
const scrollButton = document.querySelector('#scrollToBottom');
const toastRegion = document.querySelector('#toastRegion');
const lightbox = document.querySelector('#imageLightbox');

// Keep the composer inside the visible mobile viewport when the on-screen
// keyboard opens (notably on mobile browsers where 100dvh alone is insufficient).
function syncVisualViewport() {
  const viewport = window.visualViewport;
  if (!viewport) return;
  document.documentElement.style.setProperty('--botcraft-vh', `${Math.max(240, viewport.height)}px`);
}
syncVisualViewport();
window.visualViewport?.addEventListener('resize', syncVisualViewport, { passive: true });
window.visualViewport?.addEventListener('scroll', syncVisualViewport, { passive: true });
window.addEventListener('resize', syncVisualViewport, { passive: true });

const MAX_ATTACHMENTS = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'heif', 'avif', 'tif', 'tiff', 'apng',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt',
]);
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'heic', 'heif', 'avif', 'tif', 'tiff', 'apng']);
const MIME_BY_EXTENSION = {
  jpg: ['image/jpeg'], jpeg: ['image/jpeg'], png: ['image/png'], gif: ['image/gif'],
  webp: ['image/webp'], bmp: ['image/bmp', 'image/x-ms-bmp'], tif: ['image/tiff'], tiff: ['image/tiff'], apng: ['image/apng', 'image/png'], heic: ['image/heic', 'image/heif'],
  heif: ['image/heif', 'image/heic'], avif: ['image/avif'], pdf: ['application/pdf'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel', 'application/x-msexcel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  csv: ['text/csv', 'application/csv', 'text/plain', 'application/vnd.ms-excel'],
  txt: ['text/plain'],
};

let nextId = 0;
const makeId = (prefix = 'item') => `${prefix}-${Date.now().toString(36)}-${(++nextId).toString(36)}`;
const makeOption = (label, value = label, kind = 'starter') => ({ id: makeId('option'), label, value, kind });

const state = {
  // Real counts arrive once the question bank for the owner's shop type exists.
  answered: 0,
  total: 0,
  pendingCount: 0,
  stagedAttachments: [],
  inputError: '',
  micActive: false,
  theme: window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  isDragging: false,
  messages: [
    {
      id: makeId('message'), role: 'assistant',
      text: 'Hi! I’m BotCraft 👋\nI’ll create an AI salesman for your shop. Your customers scan a QR poster in your shop and the bot shows them your items, photos, prices and details — in any language — even when you are busy.\n\nTell me about your shop to begin. What kind of shop do you have?',
      time: new Date(),
      options: [
        makeOption('Jewellery shop'),
        makeOption('Clothing / saree shop'),
        makeOption('Mobile & electronics'),
        makeOption('Other shop'),
      ],
    },
  ],
};

function announce(text) {
  toastRegion.textContent = '';
  window.setTimeout(() => { toastRegion.textContent = text; }, 20);
}

function render({ forceBottom = false } = {}) {
  const shouldStick = forceBottom || isNearBottom();
  headerHost.replaceChildren(ProgressHeader({ answered: state.answered, total: state.total }));
  const list = MessageList(state.messages, state.pendingCount > 0);
  messageHost.replaceChildren(list);
  inputHost.replaceChildren(InputBar(state.stagedAttachments, state.inputError, state.micActive));
  applyTheme();
  syncComposerControls();
  updateScrollButton();
  if (shouldStick) scrollToBottom(false);
}

function applyTheme() {
  app.dataset.theme = state.theme;
  document.documentElement.dataset.theme = state.theme;
  const button = app.querySelector('[data-action="theme-toggle"]');
  if (button) {
    const icon = state.theme === 'dark' ? '☼' : '◐';
    button.textContent = icon;
    button.setAttribute('aria-label', state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    button.title = state.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = state.theme === 'dark' ? '#141721' : '#f7f8fc';
}

function isNearBottom() {
  return messageHost.scrollHeight - messageHost.scrollTop - messageHost.clientHeight < 100;
}

function scrollToBottom(smooth = true) {
  requestAnimationFrame(() => {
    messageHost.scrollTo({ top: messageHost.scrollHeight, behavior: smooth && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto' });
    updateScrollButton();
  });
}

function updateScrollButton() {
  const hasOverflow = messageHost.scrollHeight > messageHost.clientHeight + 80;
  scrollButton.hidden = !hasOverflow || isNearBottom();
}

function syncComposerControls() {
  const textarea = inputHost.querySelector('#messageInput');
  const send = inputHost.querySelector('[data-action="send-message"]');
  if (!textarea || !send) return;
  send.disabled = state.pendingCount > 0 || (!textarea.value.trim() && state.stagedAttachments.length === 0);
  if (state.pendingCount > 0) send.setAttribute('aria-label', 'Please wait for BotCraft to reply');
  else send.setAttribute('aria-label', 'Send message');
}

function getExtension(name) {
  const dot = name.lastIndexOf('.');
  return dot > -1 ? name.slice(dot + 1).toLowerCase() : '';
}

function validateFile(file) {
  const extension = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return `${file.name}: This file type isn’t supported. Choose an image, PDF, DOC/DOCX, XLS/XLSX, CSV, or TXT file.`;
  }
  if (file.size > MAX_FILE_BYTES) {
    return `${file.name}: The file is larger than 10 MB. Choose a smaller file.`;
  }
  const knownMimes = MIME_BY_EXTENSION[extension] ?? [];
  if (file.type && file.type !== 'application/octet-stream' && knownMimes.length && !knownMimes.includes(file.type)) {
    return `${file.name}: The file type doesn’t match its extension. Please choose a valid file.`;
  }
  return '';
}

function addFiles(fileList) {
  const files = Array.from(fileList ?? []);
  if (!files.length) return;
  const errors = [];
  for (const file of files) {
    if (state.stagedAttachments.length >= MAX_ATTACHMENTS) {
      errors.push(`You can attach up to ${MAX_ATTACHMENTS} files per message. Remove a file to add another.`);
      break;
    }
    const error = validateFile(file);
    if (error) {
      errors.push(error);
      continue;
    }
    const attachment = {
      id: makeId('attachment'), file, name: file.name, size: file.size,
      type: file.type || 'application/octet-stream',
      isImage: file.type.startsWith('image/') || IMAGE_EXTENSIONS.has(getExtension(file.name)),
      url: URL.createObjectURL(file), extension: getExtension(file.name),
    };
    state.stagedAttachments.push(attachment);
  }
  state.inputError = errors.join(' ');
  render();
  if (errors.length) announce(errors.join(' '));
  else if (files.length) announce(`${files.length} file${files.length === 1 ? '' : 's'} ready to attach.`);
  const textarea = inputHost.querySelector('#messageInput');
  if (textarea) textarea.focus({ preventScroll: true });
}

function removeStagedAttachment(id) {
  const index = state.stagedAttachments.findIndex((item) => item.id === id);
  if (index === -1) return;
  const [removed] = state.stagedAttachments.splice(index, 1);
  URL.revokeObjectURL(removed.url);
  state.inputError = '';
  render();
  const textarea = inputHost.querySelector('#messageInput');
  textarea?.focus({ preventScroll: true });
}

function markOptionUsed(optionId) {
  for (const message of state.messages) {
    if (message.role === 'assistant' && message.options?.some((item) => item.id === optionId)) {
      message.optionsUsed = true;
      return message.options.find((item) => item.id === optionId);
    }
  }
  return null;
}

async function handleSend({ text = '', option = null, attachments = null, retryMessage = null, formAnswers = null } = {}) {
  const cleanText = String(text).trim();
  const outgoingAttachments = attachments ?? [...state.stagedAttachments];

  if (!retryMessage) {
    // A retry resends its own message; only new sends need content.
    if (!cleanText && outgoingAttachments.length === 0) return;
    if (option?.id) markOptionUsed(option.id);
    const userMessage = {
      id: makeId('message'), role: 'user', text: cleanText,
      time: new Date(), status: 'sending', attachments: outgoingAttachments,
      formAnswers: formAnswers ?? undefined,
    };
    state.messages.push(userMessage);
    state.stagedAttachments = [];
    state.inputError = '';
    const actionType = option ? 'quick-option' : (outgoingAttachments.length && !cleanText ? 'attachment' : 'message');
    render({ forceBottom: true });
    await runMockAction({ type: actionType, text: cleanText, option: option ?? undefined, attachments: outgoingAttachments, formAnswers: formAnswers ?? undefined }, userMessage);
  } else {
    retryMessage.status = 'sending';
    retryMessage.error = '';
    render({ forceBottom: true });
    const actionType = retryMessage.attachments?.length && !retryMessage.text ? 'attachment' : 'retry';
    await runMockAction({ type: actionType, text: retryMessage.text, attachments: retryMessage.attachments ?? [], formAnswers: retryMessage.formAnswers }, retryMessage);
  }
}

async function runMockAction(action, userMessage) {
  state.pendingCount += 1;
  render({ forceBottom: true });
  try {
    // The single boundary for outgoing messages and attachment sends.
    const result = await sendChatAction(action);
    if (!result?.ok) throw new Error(result?.error || 'Could not send. Please try again.');
    userMessage.status = 'sent';
    userMessage.error = '';
    if (result.progress) {
      state.answered = result.progress.answered;
      state.total = result.progress.total;
    }
    state.messages.push({
      id: result.message.id || makeId('message'), role: 'assistant',
      text: result.message.text, options: result.message.options ?? [],
      questions: result.message.questions ?? [], form: {},
      time: result.message.time instanceof Date ? result.message.time : new Date(result.message.time ?? Date.now()),
    });
    if (result.bankStatus === 'missing') {
      render({ forceBottom: true });
      await prepareBankForShop(result.shopTypeName);
    }
  } catch (error) {
    userMessage.status = 'failed';
    userMessage.error = error instanceof Error ? error.message : 'Message failed. Please try again.';
    announce(userMessage.error);
  } finally {
    state.pendingCount = Math.max(0, state.pendingCount - 1);
    render({ forceBottom: true });
  }
}

// The shop type has no ready-made questions: prepare them, then let the owner continue.
let preparingBank = false;
async function prepareBankForShop(typeName) {
  if (preparingBank) return;
  preparingBank = true;
  const label = typeName || 'your business';
  state.messages.push({
    id: makeId('message'), role: 'assistant', time: new Date(),
    text: `Preparing the questions customers of ${label} usually ask… This takes 1–2 minutes. Please keep this page open.`,
  });
  render({ forceBottom: true });
  const bank = await prepareQuestionBank();
  preparingBank = false;
  state.messages.push(bank.ok
    ? {
      id: makeId('message'), role: 'assistant', time: new Date(),
      text: `Ready! I prepared ${bank.question_count} questions for ${bank.name || label}. Let's continue — I'll ask the important ones first.`,
      options: [makeOption('Continue', 'Continue', 'answer')],
    }
    : {
      id: makeId('message'), role: 'assistant', time: new Date(),
      text: `${bank.error} Tap "Try again" when you are ready.`,
      options: [makeOption('Try again', 'Prepare my questions again', 'answer')],
    });
}

function formAnswer(message, questionId) {
  message.form ??= {};
  message.form[questionId] ??= { selected: [], text: '' };
  return message.form[questionId];
}

// Options are single choice, except "list" questions, which take several.
// "Skip" clears the other choices and the written answer.
function chooseFormOption(button) {
  const message = state.messages.find((item) => item.id === button.dataset.messageId);
  const question = message?.questions?.find((item) => item.id === button.dataset.questionId);
  if (!question || message.formSent) return;
  const answer = formAnswer(message, question.id);
  const value = button.dataset.value;
  if (answer.selected.includes(value)) answer.selected = answer.selected.filter((item) => item !== value);
  else if (value === 'skipped') { answer.selected = ['skipped']; answer.text = ''; }
  else if (question.type === 'list') answer.selected = [...answer.selected.filter((item) => item !== 'skipped'), value];
  else answer.selected = [value];
  // Update the chips in place: a full render would replay every message's fade-in.
  for (const chip of button.closest('.question-field').querySelectorAll('.question-choice')) {
    chip.setAttribute('aria-pressed', String(answer.selected.includes(chip.dataset.value)));
  }
  if (value === 'skipped') button.closest('.question-field').querySelector('.question-input').value = '';
  if (message.formError) {
    message.formError = '';
    button.closest('.question-form').querySelector('.message-error')?.remove();
  }
}

function submitForm(messageId) {
  const message = state.messages.find((item) => item.id === messageId);
  if (!message?.questions?.length || message.formSent || state.pendingCount > 0) return;
  const formAnswers = [];
  const lines = [];
  for (const [index, question] of message.questions.entries()) {
    const answer = formAnswer(message, question.id);
    const text = answer.text.trim();
    const chosen = question.options.filter((option) => answer.selected.includes(option.value));
    const skipped = answer.selected.includes('skipped');
    if (!chosen.length && !text && !skipped && question.mandatory) {
      message.formError = 'Please answer the questions marked *.';
      render();
      return;
    }
    // Unanswered optional questions count as skipped, so they are not asked again.
    const value = [...chosen.map((option) => option.value), text].filter(Boolean).join(', ') || 'skipped';
    const shown = [...chosen.map((option) => option.label), text].filter(Boolean).join(', ') || 'Skip';
    formAnswers.push({ id: question.id, value });
    lines.push(`${index + 1}. ${question.question} — ${shown}`);
  }
  message.formSent = true;
  message.formError = '';
  if (message.options?.length) message.optionsUsed = true;
  handleSend({ text: lines.join('\n'), formAnswers });
}

function autosizeTextarea(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
}

function openPicker(kind) {
  const input = inputHost.querySelector(`[data-picker-input="${kind}"]`);
  if (input) input.click();
  closeAttachMenu();
}

function closeAttachMenu() {
  const menu = inputHost.querySelector('.attach-menu');
  const trigger = inputHost.querySelector('[data-action="toggle-attach-menu"]');
  if (menu) menu.hidden = true;
  if (trigger) trigger.setAttribute('aria-expanded', 'false');
}

function toggleAttachMenu() {
  const menu = inputHost.querySelector('.attach-menu');
  const trigger = inputHost.querySelector('[data-action="toggle-attach-menu"]');
  if (!menu || !trigger) return;
  const willOpen = menu.hidden;
  menu.hidden = !willOpen;
  trigger.setAttribute('aria-expanded', String(willOpen));
  if (willOpen) inputHost.querySelector('.attach-menu-item')?.focus();
}

function showLightbox(attachmentId) {
  const attachment = state.messages.flatMap((message) => message.attachments ?? []).find((item) => item.id === attachmentId);
  if (!attachment?.isImage) return;
  lightbox.replaceChildren(ImageLightbox(attachment));
  lightbox.setAttribute('aria-labelledby', 'lightboxTitle');
  if (!lightbox.open) lightbox.showModal();
  lightbox.querySelector('[data-action="close-lightbox"]')?.focus();
}

function closeLightbox() {
  if (lightbox.open) lightbox.close();
}

function showToast(message) {
  announce(message);
}

// Shows "Copied" on the button itself for a moment.
function markCopied(button) {
  if (!button) return;
  const original = button.innerHTML;
  button.classList.add('is-copied');
  button.textContent = '✓ Copied';
  window.setTimeout(() => {
    button.classList.remove('is-copied');
    button.innerHTML = original;
  }, 1500);
}

function copyMessage(messageId, button) {
  const message = state.messages.find((item) => item.id === messageId);
  if (!message?.text) return;
  const copied = () => { showToast('Message copied.'); markCopied(button); };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(message.text).then(copied, () => fallbackCopy(message.text, copied));
  } else fallbackCopy(message.text, copied);
}

function fallbackCopy(text, onCopied) {
  const helper = document.createElement('textarea');
  helper.value = text;
  helper.style.position = 'fixed'; helper.style.opacity = '0';
  document.body.append(helper); helper.select();
  try { document.execCommand('copy'); onCopied(); }
  catch { showToast('Could not copy automatically. Select the message text to copy it.'); }
  helper.remove();
}

function setMicState() {
  state.micActive = !state.micActive;
  render();
  showToast(state.micActive ? 'Demo recording state is on. Real voice recording is not connected yet.' : 'Demo recording state stopped. No audio was recorded.');
}

app.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const action = button.dataset.action;

  if (action === 'theme-toggle') {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    applyTheme();
    return;
  }
  if (action === 'send-message') {
    event.preventDefault();
    handleSend({ text: inputHost.querySelector('#messageInput')?.value ?? '' });
    return;
  }
  if (action === 'toggle-attach-menu') { toggleAttachMenu(); return; }
  if (action === 'open-picker') { openPicker(button.dataset.picker); return; }
  if (action === 'remove-attachment') { removeStagedAttachment(button.dataset.attachmentId); return; }
  if (action === 'quick-option') {
    const option = markOptionUsed(button.dataset.optionId) ?? { id: button.dataset.optionId, value: button.dataset.value, label: button.textContent };
    handleSend({ text: button.dataset.value, option });
    return;
  }
  if (action === 'form-choice') { chooseFormOption(button); return; }
  if (action === 'submit-form') { submitForm(button.dataset.messageId); return; }
  if (action === 'copy-message') { copyMessage(button.dataset.messageId, button); return; }
  if (action === 'retry-message') {
    const message = state.messages.find((item) => item.id === button.dataset.messageId);
    if (message) handleSend({ retryMessage: message });
    return;
  }
  if (action === 'open-image') { showLightbox(button.dataset.attachmentId); return; }
  if (action === 'toggle-mic') { setMicState(); return; }
});

app.addEventListener('input', (event) => {
  if (event.target.matches('.question-input')) {
    const message = state.messages.find((item) => item.id === event.target.dataset.messageId);
    if (message && !message.formSent) {
      const answer = formAnswer(message, event.target.dataset.questionId);
      answer.text = event.target.value;
      if (answer.text.trim() && answer.selected.includes('skipped')) {
        answer.selected = answer.selected.filter((item) => item !== 'skipped');
        event.target.closest('.question-field')?.querySelector('[data-value="skipped"]')?.setAttribute('aria-pressed', 'false');
      }
    }
    return;
  }
  if (event.target.matches('#messageInput')) {
    autosizeTextarea(event.target);
    syncComposerControls();
    if (state.inputError) {
      state.inputError = '';
      const error = inputHost.querySelector('#composerError');
      if (error) { error.textContent = ''; error.hidden = true; }
    }
  }
});

app.addEventListener('keydown', (event) => {
  if (event.target.matches('#messageInput') && event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    if (!inputHost.querySelector('[data-action="send-message"]')?.disabled) {
      handleSend({ text: event.target.value });
    }
  }
  if (event.target.matches('.attach-menu-item') && event.key === 'Escape') closeAttachMenu();
});

app.addEventListener('change', (event) => {
  if (event.target.matches('input[type="file"][data-picker-input]')) {
    addFiles(event.target.files);
    event.target.value = '';
  }
});

inputHost.addEventListener('submit', (event) => {
  if (event.target.id !== 'composerForm') return;
  event.preventDefault();
  handleSend({ text: inputHost.querySelector('#messageInput')?.value ?? '' });
});

messageHost.addEventListener('scroll', updateScrollButton, { passive: true });
scrollButton.addEventListener('click', () => scrollToBottom(true));

// Close the attachment popover on outside click and Escape.
document.addEventListener('click', (event) => {
  if (!inputHost.contains(event.target)) closeAttachMenu();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeAttachMenu();
});

lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;
  if (actionButton.dataset.action === 'close-lightbox') closeLightbox();
  if (actionButton.dataset.action === 'toggle-lightbox-zoom') {
    const image = lightbox.querySelector('.lightbox-image');
    const zoomed = image.classList.toggle('is-zoomed');
    actionButton.setAttribute('aria-label', zoomed ? 'Zoom image out' : 'Zoom image');
    const iconEl = actionButton.querySelector('svg');
    if (iconEl) iconEl.style.transform = zoomed ? 'rotate(45deg)' : '';
  }
});
lightbox.addEventListener('close', () => {
  app.querySelector('[data-action="open-image"]')?.focus({ preventScroll: true });
});

// Desktop drag-and-drop. Only files pass through the same validation/staging path.
let dragDepth = 0;
app.addEventListener('dragenter', (event) => {
  if (!Array.from(event.dataTransfer?.types ?? []).includes('Files')) return;
  event.preventDefault();
  dragDepth++;
  state.isDragging = true;
  dropOverlay.classList.add('is-visible');
  dropOverlay.setAttribute('aria-hidden', 'false');
});
app.addEventListener('dragover', (event) => {
  if (Array.from(event.dataTransfer?.types ?? []).includes('Files')) event.preventDefault();
});
app.addEventListener('dragleave', (event) => {
  if (!Array.from(event.dataTransfer?.types ?? []).includes('Files')) return;
  event.preventDefault();
  dragDepth = Math.max(0, dragDepth - 1);
  if (dragDepth === 0) hideDropOverlay();
});
// Pasted screenshots or copied images become attachments, like dropped files.
app.addEventListener('paste', (event) => {
  const files = Array.from(event.clipboardData?.items ?? [])
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (!files.length) return;
  event.preventDefault();
  addFiles(files.map((file, i) => (file.name && file.name !== 'image.png'
    ? file
    : new File([file], `pasted-image-${Date.now()}-${i + 1}.${(file.type.split('/')[1] || 'png').replace('jpeg', 'jpg')}`, { type: file.type }))));
});

app.addEventListener('drop', (event) => {
  if (!Array.from(event.dataTransfer?.types ?? []).includes('Files')) return;
  event.preventDefault();
  dragDepth = 0;
  hideDropOverlay();
  addFiles(event.dataTransfer.files);
});
function hideDropOverlay() {
  state.isDragging = false;
  dropOverlay.classList.remove('is-visible');
  dropOverlay.setAttribute('aria-hidden', 'true');
}

window.addEventListener('pagehide', () => {
  for (const attachment of state.stagedAttachments) URL.revokeObjectURL(attachment.url);
  for (const message of state.messages) {
    for (const attachment of message.attachments ?? []) URL.revokeObjectURL(attachment.url);
  }
});

render({ forceBottom: true });

// Continue a setup started earlier in this browser.
loadSavedConversation().then((saved) => {
  if (!saved) return;
  const restored = saved.messages.map((message) => ({
    id: makeId('message'),
    role: message.role === 'owner' ? 'user' : 'assistant',
    text: message.text,
    time: new Date(message.created_at),
    status: 'sent',
  }));
  state.messages = [{ ...state.messages[0], optionsUsed: true }, ...restored];
  if (saved.progress) {
    state.answered = saved.progress.answered;
    state.total = saved.progress.total;
  }
  render({ forceBottom: true });
});
