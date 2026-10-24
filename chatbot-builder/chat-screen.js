import { sendChatAction } from './api-client.js';
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
  'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif', 'pdf', 'csv', 'txt',
]);
const IMAGE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);
const MIME_BY_EXTENSION = {
  jpg: ['image/jpeg'], jpeg: ['image/jpeg'], png: ['image/png'],
  webp: ['image/webp'], heic: ['image/heic', 'image/heif'],
  heif: ['image/heif', 'image/heic'], pdf: ['application/pdf'],
  csv: ['text/csv', 'application/csv', 'text/plain'],
  txt: ['text/plain'],
};

let nextId = 0;
const makeId = (prefix = 'item') => `${prefix}-${Date.now().toString(36)}-${(++nextId).toString(36)}`;
const makeOption = (label, value = label, kind = 'starter') => ({ id: makeId('option'), label, value, kind });

const state = {
  answered: 12,
  total: 70,
  pendingCount: 0,
  stagedAttachments: [],
  inputError: '',
  micActive: false,
  theme: window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
  isDragging: false,
  messages: [
    {
      id: makeId('message'), role: 'assistant',
      text: 'Hi! I’m BotCraft 👋\nI’ll help you build a chatbot that understands your business and answers customers confidently. You don’t need to prepare a list of questions — I’ll guide you through it, one question at a time.',
      time: new Date(),
      options: [
        makeOption('Create restaurant chatbot', 'Create restaurant chatbot'),
        makeOption('Upload my menu', 'Upload my menu'),
        makeOption('Set prices & timings', 'Set prices & timings'),
        makeOption('I need help', 'I need help'),
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
    return `${file.name}: This file type isn’t supported. Choose JPG, PNG, WEBP, HEIC/HEIF, PDF, CSV, or TXT.`;
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

async function handleSend({ text = '', option = null, attachments = null, retryMessage = null } = {}) {
  const cleanText = String(text).trim();
  const outgoingAttachments = attachments ?? [...state.stagedAttachments];
  if (!cleanText && outgoingAttachments.length === 0) return;

  if (!retryMessage) {
    if (option?.id) markOptionUsed(option.id);
    const userMessage = {
      id: makeId('message'), role: 'user', text: cleanText,
      time: new Date(), status: 'sending', attachments: outgoingAttachments,
    };
    state.messages.push(userMessage);
    state.stagedAttachments = [];
    state.inputError = '';
    const actionType = option ? 'quick-option' : (outgoingAttachments.length && !cleanText ? 'attachment' : 'message');
    render({ forceBottom: true });
    await runApiAction({ type: actionType, text: cleanText, option: option ?? undefined, attachments: outgoingAttachments, history: state.messages.map((item) => ({ role: item.role, text: item.text })).filter((item) => item.role === 'assistant' || item.role === 'user').slice(-29) }, userMessage);
  } else {
    retryMessage.status = 'sending';
    retryMessage.error = '';
    render({ forceBottom: true });
    const actionType = retryMessage.attachments?.length && !retryMessage.text ? 'attachment' : 'retry';
    await runApiAction({ type: actionType, text: retryMessage.text, attachments: retryMessage.attachments ?? [], history: state.messages.map((item) => ({ role: item.role, text: item.text })).filter((item) => item.role === 'assistant' || item.role === 'user').slice(-29) }, retryMessage);
  }
}

async function runApiAction(action, userMessage) {
  state.pendingCount += 1;
  render({ forceBottom: true });
  try {
    // The only placeholder boundary for outgoing messages and attachment sends.
    const result = await sendChatAction(action);
    if (!result?.ok) throw new Error(result?.error || 'Could not send. Please try again.');
    userMessage.status = 'sent';
    userMessage.error = '';
    state.answered = Math.min(state.total, state.answered + 1);
    state.messages.push({
      id: result.message.id || makeId('message'), role: 'assistant',
      text: result.message.text, options: result.message.options ?? [],
      time: result.message.time instanceof Date ? result.message.time : new Date(result.message.time ?? Date.now()),
    });
  } catch (error) {
    userMessage.status = 'failed';
    userMessage.error = error instanceof Error ? error.message : 'Message failed. Please try again.';
    announce(userMessage.error);
  } finally {
    state.pendingCount = Math.max(0, state.pendingCount - 1);
    render({ forceBottom: true });
  }
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

function copyMessage(messageId) {
  const message = state.messages.find((item) => item.id === messageId);
  if (!message?.text) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(message.text).then(
      () => showToast('Message copied.'),
      () => fallbackCopy(message.text),
    );
  } else fallbackCopy(message.text);
}

function fallbackCopy(text) {
  const helper = document.createElement('textarea');
  helper.value = text;
  helper.style.position = 'fixed'; helper.style.opacity = '0';
  document.body.append(helper); helper.select();
  try { document.execCommand('copy'); showToast('Message copied.'); }
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
  if (action === 'copy-message') { copyMessage(button.dataset.messageId); return; }
  if (action === 'retry-message') {
    const message = state.messages.find((item) => item.id === button.dataset.messageId);
    if (message) handleSend({ retryMessage: message });
    return;
  }
  if (action === 'open-image') { showLightbox(button.dataset.attachmentId); return; }
  if (action === 'toggle-mic') { setMicState(); return; }
});

app.addEventListener('input', (event) => {
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