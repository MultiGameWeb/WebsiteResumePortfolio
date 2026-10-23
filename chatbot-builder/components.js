const NS = 'http://www.w3.org/2000/svg';

export function makeElement(tag, className = '', text = '') {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null && text !== '') node.textContent = String(text);
  return node;
}

function icon(name) {
  const paths = {
    sun: '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"></path>',
    moon: '<path d="M20.9 13A8.7 8.7 0 0 1 11 3.1 9 9 0 1 0 20.9 13Z"></path>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"></path><path d="M22 2 11 13"></path>',
    plus: '<path d="M12 5v14M5 12h14"></path>',
    mic: '<rect x="9" y="2" width="6" height="12" rx="3"></rect><path d="M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"></path>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"></rect><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"></path>',
    close: '<path d="m18 6-12 12M6 6l12 12"></path>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"></path><path d="M14 2v6h6M8 13h8M8 17h8"></path>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="m21 15-5-5L5 21"></path>',
    retry: '<path d="M20 7v5h-5M4 17v-5h5"></path><path d="M5.5 9a7 7 0 0 1 11.6-2.6L20 12M4 12l2.9 5.6A7 7 0 0 0 18.5 15"></path>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><path d="m7 10 5 5 5-5M12 15V3"></path>',
    arrowDown: '<path d="M12 5v14m-7-7 7 7 7-7"></path>',
    zoom: '<circle cx="11" cy="11" r="7"></circle><path d="m20 20-4-4M11 8v6m-3-3h6"></path>',
  };
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '20');
  svg.setAttribute('height', '20');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = paths[name] ?? paths.file;
  return svg;
}

export function iconButton(name, label, className = '', action = '') {
  const button = makeElement('button', `icon-button ${className}`.trim());
  button.type = 'button';
  button.setAttribute('aria-label', label);
  button.title = label;
  if (action) button.dataset.action = action;
  button.append(icon(name));
  return button;
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(d);
}

export function ProgressHeader({ answered = 12, total = 70 }) {
  const header = makeElement('header', 'app-header-inner');
  const identity = makeElement('div', 'brand-lockup');
  const mark = makeElement('div', 'brand-mark');
  mark.setAttribute('aria-hidden', 'true');
  mark.innerHTML = '<svg viewBox="0 0 32 32" width="27" height="27" fill="none"><path d="M16 3.5 27 9.8v12.4L16 28.5 5 22.2V9.8L16 3.5Z" stroke="currentColor" stroke-width="1.7"/><path d="M10.5 14.2c0-2.2 1.6-3.7 3.8-3.7 2.1 0 3.5 1.5 3.5 3.4 0 3-4.8 2.3-4.8 5.4M16 23.3v.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const words = makeElement('div', 'brand-words');
  const title = makeElement('div', 'brand-name', 'BotCraft');
  const subtitle = makeElement('div', 'brand-subtitle', 'Your business, in every conversation');
  words.append(title, subtitle);
  identity.append(mark, words);

  const progress = makeElement('div', 'progress-wrap');
  const progressText = makeElement('div', 'progress-meta');
  progressText.append(makeElement('span', 'progress-label', 'Setup progress'));
  const count = makeElement('span', 'progress-count', `${answered} / ${total} answered`);
  count.setAttribute('aria-label', `${answered} of ${total} questions answered`);
  progressText.append(count);
  const track = makeElement('div', 'progress-track');
  track.setAttribute('role', 'progressbar');
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', String(total));
  track.setAttribute('aria-valuenow', String(answered));
  track.setAttribute('aria-label', 'Business setup progress');
  const fill = makeElement('div', 'progress-fill');
  fill.style.width = `${Math.min(100, Math.max(0, (answered / total) * 100))}%`;
  track.append(fill);
  progress.append(progressText, track);

  const theme = iconButton('moon', 'Switch to dark mode', 'theme-toggle', 'theme-toggle');
  header.append(identity, progress, theme);
  return header;
}

export function QuickChips(options = [], disabled = false) {
  const group = makeElement('div', 'quick-chips');
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', 'Quick answers');
  for (const item of options) {
    const button = makeElement('button', 'quick-chip', item.label);
    button.type = 'button';
    button.dataset.action = 'quick-option';
    button.dataset.value = item.value;
    button.dataset.optionId = item.id;
    button.disabled = disabled;
    group.append(button);
  }
  return group;
}

export function TypingIndicator() {
  const row = makeElement('div', 'typing-row');
  const avatar = makeElement('div', 'bot-avatar bot-avatar-small', 'b');
  avatar.setAttribute('aria-hidden', 'true');
  const bubble = makeElement('div', 'typing-bubble');
  bubble.setAttribute('role', 'status');
  bubble.setAttribute('aria-label', 'BotCraft is typing');
  for (let i = 0; i < 3; i++) {
    const dot = makeElement('span', 'typing-dot');
    dot.setAttribute('aria-hidden', 'true');
    bubble.append(dot);
  }
  row.append(avatar, bubble);
  return row;
}

export function FileCard(attachment) {
  const card = makeElement('div', 'message-file-card');
  const badge = makeElement('div', 'file-type-icon');
  badge.append(icon('file'));
  const meta = makeElement('div', 'file-meta');
  const name = makeElement('div', 'file-name', attachment.name);
  name.title = attachment.name;
  const details = makeElement('div', 'file-details', `${(attachment.extension || 'FILE').toUpperCase()} · ${formatBytes(attachment.size)}`);
  meta.append(name, details);
  const link = makeElement('a', 'file-open-link');
  link.href = attachment.url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.setAttribute('aria-label', `Open or download ${attachment.name}`);
  link.append(icon('download'));
  link.append(makeElement('span', '', 'Open'));
  card.append(badge, meta, link);
  return card;
}

function renderAttachment(attachment) {
  if (attachment.isImage) {
    const button = makeElement('button', 'message-image-button');
    button.type = 'button';
    button.dataset.action = 'open-image';
    button.dataset.attachmentId = attachment.id;
    button.setAttribute('aria-label', `Open image ${attachment.name} in enlarged view`);
    const image = makeElement('img', 'message-image');
    image.src = attachment.url;
    image.alt = attachment.name;
    image.loading = 'lazy';
    button.append(image);
    return button;
  }
  return FileCard(attachment);
}

export function MessageBubble(message) {
  const row = makeElement('article', `message-row message-${message.role}`);
  row.dataset.messageId = message.id;
  if (message.role === 'assistant') {
    const avatar = makeElement('div', 'bot-avatar', 'b');
    avatar.setAttribute('aria-hidden', 'true');
    row.append(avatar);
  }

  const column = makeElement('div', 'message-column');
  const bubble = makeElement('div', `message-bubble ${message.role === 'user' ? 'user-bubble' : 'assistant-bubble'} ${message.status === 'failed' ? 'bubble-failed' : ''}`);
  if (message.text) {
    const paragraph = makeElement('p', 'message-text', message.text);
    bubble.append(paragraph);
  }
  if (message.attachments?.length) {
    const attachments = makeElement('div', message.attachments.some(a => a.isImage) ? 'message-attachments image-attachments' : 'message-attachments');
    for (const attachment of message.attachments) attachments.append(renderAttachment(attachment));
    bubble.append(attachments);
  }
  if (message.status === 'failed') {
    const error = makeElement('div', 'message-error', message.error || 'Message failed to send.');
    bubble.append(error);
  }
  column.append(bubble);

  if (message.options?.length) {
    column.append(QuickChips(message.options, Boolean(message.optionsUsed)));
    if (message.optionsUsed) column.append(makeElement('div', 'options-used-note', 'Answer selected'));
  }

  const footer = makeElement('div', 'message-footer');
  footer.append(makeElement('time', 'message-time', formatTime(message.time)));
  const actions = makeElement('div', 'message-actions');
  const copy = iconButton('copy', 'Copy message', 'copy-button', 'copy-message');
  copy.dataset.messageId = message.id;
  if (message.text) actions.append(copy);
  if (message.status === 'failed') {
    const retry = iconButton('retry', 'Retry sending this message', 'retry-button', 'retry-message');
    retry.dataset.messageId = message.id;
    actions.append(retry);
  }
  footer.append(actions);
  column.append(footer);
  row.append(column);
  return row;
}

export function MessageList(messages, typing = false) {
  const list = makeElement('div', 'message-list-inner');
  for (const message of messages) list.append(MessageBubble(message));
  if (typing) list.append(TypingIndicator());
  return list;
}

export function AttachmentTray(attachments = []) {
  const tray = makeElement('div', 'attachment-tray');
  tray.hidden = attachments.length === 0;
  tray.setAttribute('aria-label', 'Attachments ready to send');
  for (const attachment of attachments) {
    const item = makeElement('div', `attachment-preview ${attachment.isImage ? 'attachment-preview-image' : ''}`);
    item.dataset.attachmentId = attachment.id;
    if (attachment.isImage) {
      const img = makeElement('img', 'tray-thumbnail');
      img.src = attachment.url;
      img.alt = '';
      item.append(img);
    } else {
      const fileMark = makeElement('span', 'tray-file-icon');
      fileMark.append(icon('file'));
      item.append(fileMark);
    }
    const meta = makeElement('div', 'tray-meta');
    const name = makeElement('div', 'tray-file-name', attachment.name);
    name.title = attachment.name;
    const size = makeElement('div', 'tray-file-size', formatBytes(attachment.size));
    meta.append(name, size);
    const remove = iconButton('close', `Remove ${attachment.name}`, 'remove-attachment-button', 'remove-attachment');
    remove.dataset.attachmentId = attachment.id;
    item.append(meta, remove);
    tray.append(item);
  }
  return tray;
}

export function AttachMenu() {
  const wrapper = makeElement('div', 'attach-menu-wrap');
  const trigger = iconButton('plus', 'Attach a photo or file', 'attach-trigger', 'toggle-attach-menu');
  trigger.setAttribute('aria-haspopup', 'true');
  trigger.setAttribute('aria-expanded', 'false');
  const menu = makeElement('div', 'attach-menu');
  menu.hidden = true;
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Attach a file');

  const items = [
    { action: 'camera', glyph: '◉', label: 'Camera', hint: 'Take a photo' },
    { action: 'gallery', glyph: '▧', label: 'Photo gallery', hint: 'Choose images' },
    { action: 'files', glyph: '↥', label: 'File', hint: 'PDF, Word, Excel, CSV, TXT' },
  ];
  for (const item of items) {
    const button = makeElement('button', 'attach-menu-item');
    button.type = 'button';
    button.dataset.action = 'open-picker';
    button.dataset.picker = item.action;
    button.setAttribute('role', 'menuitem');
    const glyph = makeElement('span', 'attach-menu-glyph', item.glyph);
    glyph.setAttribute('aria-hidden', 'true');
    const words = makeElement('span', 'attach-menu-words');
    words.append(makeElement('strong', '', item.label), makeElement('small', '', item.hint));
    button.append(glyph, words);
    menu.append(button);
  }

  const camera = makeElement('input', 'visually-hidden-file-input');
  camera.type = 'file'; camera.accept = 'image/*'; camera.capture = 'environment'; camera.multiple = false;
  camera.dataset.pickerInput = 'camera'; camera.setAttribute('aria-label', 'Take a photo');
  const gallery = makeElement('input', 'visually-hidden-file-input');
  gallery.type = 'file'; gallery.accept = 'image/*'; gallery.multiple = true;
  gallery.dataset.pickerInput = 'gallery'; gallery.setAttribute('aria-label', 'Choose photos');
  const files = makeElement('input', 'visually-hidden-file-input');
  files.type = 'file'; files.accept = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain';
  files.multiple = true; files.dataset.pickerInput = 'files'; files.setAttribute('aria-label', 'Choose documents');
  wrapper.append(trigger, menu, camera, gallery, files);
  return wrapper;
}

export function InputBar(attachments = [], error = '', micActive = false) {
  const dock = makeElement('section', 'input-dock');
  dock.setAttribute('aria-label', 'Message composer');
  dock.append(AttachmentTray(attachments));
  const errorBox = makeElement('div', 'composer-error', error);
  errorBox.hidden = !error;
  errorBox.id = 'composerError';
  errorBox.setAttribute('role', 'status');
  dock.append(errorBox);

  const form = makeElement('form', 'composer-form');
  form.id = 'composerForm';
  form.noValidate = true;
  const row = makeElement('div', 'composer-row');
  const attach = AttachMenu();
  const textareaWrap = makeElement('div', 'textarea-wrap');
  const textarea = makeElement('textarea', 'message-input');
  textarea.id = 'messageInput';
  textarea.rows = 1;
  textarea.placeholder = 'Reply to BotCraft…';
  textarea.maxLength = 6000;
  textarea.setAttribute('aria-label', 'Write your answer');
  textarea.setAttribute('aria-describedby', 'composerHint composerError');
  textareaWrap.append(textarea);
  const mic = iconButton('mic', micActive ? 'Stop demo recording' : 'Start demo voice input', `mic-button ${micActive ? 'mic-active' : ''}`, 'toggle-mic');
  mic.setAttribute('aria-pressed', String(micActive));
  const send = iconButton('send', 'Send message', 'send-button', 'send-message');
  send.type = 'submit';
  send.disabled = true;
  row.append(attach, textareaWrap, mic, send);
  form.append(row);
  dock.append(form);
  const hint = makeElement('div', 'composer-hint', 'Enter to send · Shift + Enter for a new line');
  hint.id = 'composerHint';
  dock.append(hint);
  return dock;
}

export function ImageLightbox(attachment) {
  const content = makeElement('div', 'lightbox-content');
  const top = makeElement('div', 'lightbox-topbar');
  const title = makeElement('div', 'lightbox-title', attachment?.name ?? 'Image preview');
  title.id = 'lightboxTitle';
  const actions = makeElement('div', 'lightbox-actions');
  const zoom = iconButton('zoom', 'Zoom image', 'lightbox-zoom', 'toggle-lightbox-zoom');
  const close = iconButton('close', 'Close image preview', 'lightbox-close', 'close-lightbox');
  actions.append(zoom, close);
  top.append(title, actions);
  const stage = makeElement('div', 'lightbox-image-stage');
  const img = makeElement('img', 'lightbox-image');
  img.src = attachment?.url ?? '';
  img.alt = attachment?.name ?? 'Selected image';
  img.tabIndex = 0;
  img.dataset.action = 'toggle-lightbox-zoom';
  stage.append(img);
  const tip = makeElement('div', 'lightbox-tip', 'Select the image or use Zoom to enlarge it');
  content.append(top, stage, tip);
  return content;
}