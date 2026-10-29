// The owner page: bot name, photos and items of the owner's bot. Everything a
// customer sees is changed from here (or from the setup chat). The private
// shop id saved by the setup chat in this browser is the owner's key until
// sign-in exists.
const API_BASE = window.BOTCRAFT_API_BASE || 'https://sitecraft-ai.kammarivinaykumar216.workers.dev';
const SHOP_ID_KEY = 'botcraft:shopId';
const MAX_IMAGE_SIDE = 1280;

const $ = (selector) => document.querySelector(selector);
const statusBox = $('#status');
let view = null;
let editingKey = null;

const shopId = (() => {
  try { return localStorage.getItem(SHOP_ID_KEY) || ''; } catch { return ''; }
})();

function showStatus(text) {
  statusBox.textContent = text;
  statusBox.hidden = !text;
}

const photoUrl = (photoId) => `${API_BASE}/api/botcraft/photo?id=${encodeURIComponent(photoId)}`;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

async function call(action, data = {}) {
  if (action !== 'load') showStatus('Saving…');
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/owner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, action, ...data }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Could not save. Please try again.');
    view = result;
    render();
    showStatus(action === 'load' ? '' : 'Saved ✓');
    if (action !== 'load') window.setTimeout(() => { if (statusBox.textContent === 'Saved ✓') showStatus(''); }, 2000);
    return true;
  } catch (error) {
    showStatus(error.message || 'Could not reach BotCraft. Please check your connection.');
    return false;
  }
}

// Shrinks photos so they upload quickly and fit the photo store.
async function prepareImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return { mimeType: 'image/jpeg', data };
}

async function uploadPhoto(kind, file, productKey = '') {
  if (!file) return;
  try {
    showStatus('Uploading photo…');
    const image = await prepareImage(file);
    await call('upload_photo', { kind, productKey, image });
  } catch {
    showStatus('This photo could not be read. Please choose a JPG or PNG photo.');
  }
}

function photoThumb(photo) {
  const box = element('div', 'thumb');
  const image = element('img');
  image.src = photoUrl(photo.photo_id);
  image.alt = '';
  image.loading = 'lazy';
  const remove = element('button', 'btn btn-danger btn-small', 'Remove');
  remove.type = 'button';
  remove.addEventListener('click', () => { if (window.confirm('Remove this photo?')) call('delete_photo', { photoId: photo.photo_id }); });
  box.append(image, remove);
  return box;
}

function addPhotoButton(kind, label) {
  const button = element('label', 'add-photo');
  button.append(document.createTextNode(label));
  const input = element('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.addEventListener('change', () => uploadPhoto(kind, input.files[0]));
  button.append(input);
  return button;
}

function renderPhotos() {
  for (const slot of document.querySelectorAll('.slot')) {
    const kind = slot.dataset.kind;
    const body = slot.querySelector('.slot-body');
    const photo = view.photos.find((item) => item.kind === kind);
    body.replaceChildren(photo ? photoThumb(photo) : addPhotoButton(kind, '+ Add photo'));
    if (photo) body.append(addPhotoButton(kind, 'Replace photo'));
  }
  const gallery = view.photos.filter((item) => item.kind === 'gallery');
  $('#galleryCount').textContent = `(${gallery.length} / ${view.galleryLimit})`;
  const box = $('#gallery');
  box.replaceChildren(...gallery.map(photoThumb));
  if (gallery.length < view.galleryLimit) box.append(addPhotoButton('gallery', '+ Add photo'));
}

function renderItems() {
  const query = $('#itemSearch').value.trim().toLowerCase();
  const items = view.products.filter((item) => !query || `${item.name} ${item.details} ${item.price_text}`.toLowerCase().includes(query));
  $('#itemCount').textContent = `(${view.products.length})`;
  const list = $('#items');
  if (!items.length) {
    list.replaceChildren(element('p', 'empty', view.products.length ? 'No items match your search.' : 'No items yet. Add your first item, or send photos of your items and price lists in the setup chat.'));
    return;
  }
  list.replaceChildren(...items.map((item) => {
    const card = element('article', 'item');
    if (item.photo_id) {
      const image = element('img');
      image.src = photoUrl(item.photo_id);
      image.alt = '';
      image.loading = 'lazy';
      card.append(image);
    } else card.append(element('div', 'no-photo', 'No photo'));
    const info = element('div');
    const name = element('div', 'item-name', item.name);
    if (item.stock_status === 'out_of_stock') name.append(element('span', 'badge', 'Out of stock'));
    info.append(name);
    if (item.price_text) info.append(element('div', 'item-price', item.price_text));
    if (item.details) info.append(element('div', 'item-details', item.details));
    const actions = element('div', 'item-actions');
    const edit = element('button', 'btn btn-light btn-small', 'Edit');
    edit.type = 'button';
    edit.addEventListener('click', () => openForm(item));
    const stock = element('button', 'btn btn-light btn-small', item.stock_status === 'out_of_stock' ? 'Mark in stock' : 'Mark out of stock');
    stock.type = 'button';
    stock.addEventListener('click', () => call('save_product', {
      key: item.name_key, name: item.name, price_text: item.price_text, details: item.details,
      stock_status: item.stock_status === 'out_of_stock' ? 'in_stock' : 'out_of_stock',
    }));
    const remove = element('button', 'btn btn-danger btn-small', 'Delete');
    remove.type = 'button';
    remove.addEventListener('click', () => { if (window.confirm(`Delete ${item.name}?`)) call('delete_product', { key: item.name_key }); });
    actions.append(edit, stock, remove);
    info.append(actions);
    card.append(info);
    return card;
  }));
}

function questionCard(question, answered) {
  const card = element('article', 'question');
  card.append(element('div', 'question-text', `“${question.question}”`));
  const meta = [`Asked ${question.times} time${question.times === 1 ? '' : 's'}`, question.product && `about ${question.product}`, new Date(question.last_at).toLocaleDateString()].filter(Boolean).join(' · ');
  card.append(element('div', 'question-meta', meta));
  if (answered) {
    card.append(element('div', 'question-answer', `Your answer: ${question.answer}`));
    return card;
  }
  const row = element('div', 'row');
  const answer = element('textarea');
  answer.rows = 2;
  answer.maxLength = 600;
  answer.placeholder = 'Write the answer for your customers';
  answer.setAttribute('aria-label', `Answer for: ${question.question}`);
  const save = element('button', 'btn', 'Save answer');
  save.type = 'button';
  save.addEventListener('click', () => {
    if (answer.value.trim()) call('answer_question', { qKey: question.q_key, answer: answer.value.trim() });
  });
  const dismiss = element('button', 'btn btn-light', 'Dismiss');
  dismiss.type = 'button';
  dismiss.addEventListener('click', () => call('dismiss_question', { qKey: question.q_key }));
  row.append(answer, save, dismiss);
  card.append(row);
  return card;
}

function renderQuestions() {
  const open = view.questions || [];
  const badge = $('#questionCount');
  badge.hidden = !open.length;
  badge.textContent = String(open.length);
  document.title = open.length ? `(${open.length}) Manage my bot · BotCraft` : 'Manage my bot · BotCraft';
  $('#questionList').replaceChildren(...(open.length ? open.map((q) => questionCard(q, false)) : [element('p', 'empty', 'No new questions. 🎉')]));
  const answered = view.answeredQuestions || [];
  $('#answeredCount').textContent = String(answered.length);
  $('#answeredList').replaceChildren(...answered.map((q) => questionCard(q, true)));
}

function render() {
  $('#sections').hidden = false;
  $('#shopName').textContent = view.shopName || 'Your shop';
  $('#defaultName').textContent = view.defaultBotName || 'Shop Assistant';
  const input = $('#botNameInput');
  if (document.activeElement !== input) input.value = view.customBotName || '';
  const openBot = $('#openBot');
  openBot.hidden = !view.publicId;
  if (view.publicId) openBot.href = new URL(`../salesbot/?s=${encodeURIComponent(view.publicId)}`, window.location.href).href;
  renderQuestions();
  renderPhotos();
  renderItems();
}

function openForm(item = null) {
  const form = $('#itemForm');
  editingKey = item?.name_key || null;
  $('#itemFormTitle').textContent = item ? `Edit ${item.name}` : 'Add item';
  form.elements.name.value = item?.name || '';
  form.elements.price_text.value = item?.price_text || '';
  form.elements.details.value = item?.details || '';
  form.elements.out.checked = item?.stock_status === 'out_of_stock';
  form.elements.photo.value = '';
  form.hidden = false;
  form.elements.name.focus();
}

$('#addItem').addEventListener('click', () => openForm());
$('#cancelItem').addEventListener('click', () => { $('#itemForm').hidden = true; });
$('#itemSearch').addEventListener('input', () => view && renderItems());

$('#itemForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const name = form.elements.name.value.trim();
  if (!name) return;
  const photo = form.elements.photo.files[0];
  const saved = await call('save_product', {
    key: editingKey || '', name,
    price_text: form.elements.price_text.value.trim(),
    details: form.elements.details.value.trim(),
    stock_status: form.elements.out.checked ? 'out_of_stock' : 'in_stock',
  });
  if (!saved) return;
  const key = view.products.find((item) => item.name.toLowerCase().replace(/\s+/g, ' ').trim() === name.toLowerCase().replace(/\s+/g, ' ').trim())?.name_key;
  if (photo && key) await uploadPhoto('product', photo, key);
  form.hidden = true;
});

$('#botNameForm').addEventListener('submit', (event) => {
  event.preventDefault();
  call('set_bot_name', { name: $('#botNameInput').value.trim() });
});

if (!shopId) showStatus('No bot found in this browser. Create your bot in the setup chat first.');
else {
  call('load');
  // New customer questions show up while the page is open, unless the owner is typing.
  window.setInterval(() => {
    const typing = document.activeElement?.matches('input, textarea') || !$('#itemForm').hidden;
    if (!document.hidden && !typing) call('load');
  }, 60000);
}
