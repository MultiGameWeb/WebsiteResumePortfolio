// The owner page: bot name, photos and items of the owner's bot. Everything a
// customer sees is changed from here (or from the setup chat). The private
// shop id saved by the setup chat in this browser is the owner's key until
// sign-in exists.
import { enhanceProductPhoto } from './photo-enhance.js?v=2';
import { initUpdateChat } from './owner-update.js?v=13';

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

const photoUrl = (photoId) => (String(photoId).startsWith('data:') ? photoId : `${API_BASE}/api/botcraft/photo?id=${encodeURIComponent(photoId)}`);

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
    document.dispatchEvent(new Event('botcraft:view'));
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
    // Item photos are tidied first (square, white space around, brighter when dark).
    const image = (kind === 'product' && (await enhanceProductPhoto(file))) || (await prepareImage(file));
    await call('upload_photo', { kind, productKey, image });
  } catch {
    showStatus('This photo could not be read. Please choose a JPG or PNG photo.');
  }
}

// ---- Photo studio: a clean studio version of an item photo, shown first, saved only if the owner accepts ----
const studio = { photoId: '', result: null, run: 0 };

async function pngToJpeg(image) {
  const bytes = Uint8Array.from(atob(image.data), (c) => c.charCodeAt(0));
  const bitmap = await createImageBitmap(new Blob([bytes], { type: image.mimeType }));
  const side = Math.min(1000, Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = side; canvas.height = side;
  const context = canvas.getContext('2d');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, side, side);
  const scale = Math.min(side / bitmap.width, side / bitmap.height);
  context.drawImage(bitmap, (side - bitmap.width * scale) / 2, (side - bitmap.height * scale) / 2, bitmap.width * scale, bitmap.height * scale);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88));
  const data = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result).split(',')[1] || ''); reader.onerror = () => reject(reader.error); reader.readAsDataURL(blob); });
  return { mimeType: 'image/jpeg', data };
}

async function runStudio() {
  const cost = view.ownerCosts?.studio;
  if (cost && !window.confirm(`The clean studio photo uses ${cost} AI credits from your balance (the same credits as customer replies). If the photo cannot be made, no credits are used. Continue?`)) { $('#studioDialog').close?.(); return; }
  const run = ++studio.run; // a result that arrives after the owner closed the box is ignored
  $('#studioStatus').textContent = 'Cleaning your photo… this takes about 15 seconds.';
  for (const id of ['#studioCompare', '#studioNote', '#studioUse', '#studioRetry']) $(id).hidden = true;
  $('#studioBefore').src = photoUrl(studio.photoId);
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/owner`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, action: 'studio_photo', photoId: studio.photoId }),
    });
    const data = await response.json().catch(() => ({}));
    if (run !== studio.run) return;
    if (!response.ok || !data.ok) throw new Error(data.error || 'The photo studio could not clean this photo.');
    studio.result = data.image;
    $('#studioAfter').src = `data:${data.image.mimeType};base64,${data.image.data}`;
    $('#studioStatus').textContent = data.left >= 0 ? `Done. ${data.left} clean-up${data.left === 1 ? '' : 's'} left today.` : 'Done.';
    $('#studioCompare').hidden = false;
    $('#studioNote').hidden = false;
    $('#studioUse').hidden = false;
    $('#studioRetry').hidden = false;
  } catch (error) {
    if (run !== studio.run) return;
    $('#studioStatus').textContent = `${error.message} Your photo stays as it is.`;
    $('#studioRetry').hidden = false;
  }
}

function openStudio(photoId) {
  studio.photoId = photoId;
  studio.result = null;
  $('#studioDialog').showModal();
  runStudio();
}

$('#studioClose').addEventListener('click', () => { studio.run += 1; $('#studioDialog').close(); });
$('#studioRetry').addEventListener('click', runStudio);
$('#studioUse').addEventListener('click', async () => {
  if (!studio.result) return;
  $('#studioUse').disabled = true;
  try {
    const image = await pngToJpeg(studio.result);
    $('#studioDialog').close();
    await call('replace_photo', { photoId: studio.photoId, image });
  } catch {
    $('#studioStatus').textContent = 'Could not save the clean photo. Your photo stays as it is.';
  }
  $('#studioUse').disabled = false;
});

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
    else if (Number.isInteger(item.qty) && item.stock_status !== 'hidden') name.append(element('span', item.qty <= 3 ? 'badge badge-low' : 'badge badge-count', item.qty <= 3 ? `Low stock: ${item.qty} left` : `${item.qty} in stock`));
    else if (Number.isInteger(item.qty)) name.append(element('span', 'badge badge-count', `${item.qty} in stock`));
    if (item.stock_status === 'hidden') name.append(element('span', 'badge', 'Hidden from customers'));
    info.append(name);
    if (item.price_text) info.append(element('div', 'item-price', item.price_text));
    if (item.details) info.append(element('div', 'item-details', item.details));
    // All photos of the item (up to 5): the first is the cover customers see first.
    const itemPhotos = (view.photos || []).filter((p) => p.kind === 'product' && p.product_key === item.name_key);
    const strip = element('div', 'photo-strip');
    itemPhotos.forEach((photo, index) => {
      const cell = element('div', 'strip-photo');
      const thumb = element('img');
      thumb.src = photoUrl(photo.photo_id);
      thumb.alt = `Photo ${index + 1}`;
      thumb.loading = 'lazy';
      const x = element('button', 'strip-remove', '×');
      x.type = 'button';
      x.title = 'Remove this photo';
      x.setAttribute('aria-label', `Remove photo ${index + 1} of ${item.name}`);
      x.addEventListener('click', () => { if (window.confirm('Remove this photo?')) call('delete_photo', { photoId: photo.photo_id }); });
      cell.append(thumb, x);
      if (view.photoStudio?.available) {
        const magic = element('button', 'strip-studio', '✨');
        magic.type = 'button';
        magic.title = 'Clean studio photo (white background)';
        magic.setAttribute('aria-label', `Clean studio photo for photo ${index + 1} of ${item.name}`);
        magic.addEventListener('click', () => openStudio(photo.photo_id));
        cell.append(magic);
      }
      strip.append(cell);
    });
    if (itemPhotos.length < (view.productPhotoLimit || 5)) {
      const add = element('label', 'strip-add', itemPhotos.length ? '+ Photo' : '+ Add photo');
      const file = element('input');
      file.type = 'file'; file.accept = 'image/*';
      file.addEventListener('change', () => uploadPhoto('product', file.files[0], item.name_key));
      add.append(file);
      strip.append(add);
    }
    info.append(strip);
    if (itemPhotos.length && view.photoStudio?.available) info.append(element('div', 'studio-hint', '✨ makes it a clean studio photo. Without it your photo is shown as you took it.'));
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
    const hidden = item.stock_status === 'hidden';
    const hide = element('button', 'btn btn-light btn-small', hidden ? 'Show to customers' : 'Hide');
    hide.type = 'button';
    hide.addEventListener('click', () => call('save_product', {
      key: item.name_key, name: item.name, price_text: item.price_text, details: item.details,
      stock_status: hidden ? 'in_stock' : 'hidden',
    }));
    const remove = element('button', 'btn btn-danger btn-small', 'Delete');
    remove.type = 'button';
    remove.addEventListener('click', () => { if (window.confirm(`Delete ${item.name}?`)) call('delete_product', { key: item.name_key }); });
    actions.append(edit, stock, hide, remove);
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
  const waiting = open.length + (view.requests?.open || []).filter((r) => r.status === 'new').length;
  document.title = waiting ? `(${waiting}) Manage my bot · BotCraft` : 'Manage my bot · BotCraft';
  $('#questionList').replaceChildren(...(open.length ? open.map((q) => questionCard(q, false)) : [element('p', 'empty', 'No new questions. 🎉')]));
  const answered = view.answeredQuestions || [];
  $('#answeredCount').textContent = String(answered.length);
  $('#answeredList').replaceChildren(...answered.map((q) => questionCard(q, true)));
}

function answerCard(item) {
  const card = element('article', 'question');
  const head = element('div', 'item-name', item.question);
  if (item.hidden) head.append(element('span', 'badge', 'Hidden from customers'));
  card.append(head, element('div', 'question-answer', item.answer));
  const actions = element('div', 'item-actions');
  actions.append(
    actionButton('Edit', 'btn-light', () => {
      const next = window.prompt(item.question, item.answer);
      if (next && next.trim() && next.trim() !== item.answer) call('save_answer', { answerId: item.id, answer: next.trim() });
    }),
    actionButton(item.hidden ? 'Show to customers' : 'Hide', 'btn-light', () => call('hide_answer', { answerId: item.id, hidden: !item.hidden })),
    actionButton('Delete', 'btn-danger', () => { if (window.confirm('Delete this answer? Customers will no longer get it.')) call('delete_answer', { answerId: item.id }); })
  );
  card.append(actions);
  return card;
}

$('#deleteBot').addEventListener('click', async () => {
  if (!window.confirm('Delete this bot and start over?\n\nThis deletes its chat, answers, items, photos and web page for good. Its QR code and link will stop working. This cannot be undone.')) return;
  showStatus('Deleting…');
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/owner`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shopId, action: 'delete_bot', confirm: 'DELETE' }),
    });
    const data = await response.json().catch(() => ({}));
    if (!(response.ok && data.ok) && response.status !== 404) throw new Error(data.error || 'Could not delete the bot. Please try again.');
    try {
      const bots = JSON.parse(localStorage.getItem('botcraft:bots') || '[]').filter((bot) => bot.id !== shopId);
      localStorage.setItem('botcraft:bots', JSON.stringify(bots));
      localStorage.removeItem('botcraft:shopId');
    } catch {}
    (window.top || window).location.href = '../ai-chatbot-software.html';
  } catch (error) {
    showStatus(error.message);
  }
});

function renderReplies() {
  const replies = view.replies;
  $('#replies').hidden = !replies;
  if (!replies) return;
  const line = (label, value) => { const row = element('div', 'item-actions'); row.append(element('strong', '', label), element('span', '', ` ${value}`)); return row; };
  $('#repliesInfo').replaceChildren(
    line('Replies left:', replies.balance.toLocaleString()),
    line('Used this month:', replies.usedMonth.toLocaleString()),
    line('Used today:', replies.usedToday.toLocaleString()),
  );
  const low = $('#repliesLow');
  low.hidden = !replies.low;
  low.textContent = replies.balance <= 0 ? 'None left' : 'Running low';
  const packs = view.packs || [];
  $('#packList').replaceChildren(...packs.map((pack) => {
    const li = element('li');
    const label = element('span');
    label.append(element('strong', '', `${pack.replies.toLocaleString('en-IN')} replies`), element('span', 'pack-each', `  ₹${(pack.price / pack.replies).toFixed(2)} each`));
    const ask = element('a', 'btn btn-light btn-small', `₹${pack.price.toLocaleString('en-IN')} · Recharge`);
    const text = `Hello SiteCraft, I want to recharge ${pack.replies.toLocaleString('en-IN')} AI replies for my assistant "${view.shopName || ''}".`;
    ask.href = `https://wa.me/917981587505?text=${encodeURIComponent(text)}`;
    ask.target = '_blank';
    ask.rel = 'noopener';
    li.append(label, ask);
    return li;
  }));
  $('#packList').hidden = !packs.length;
  document.querySelector('.pack-title').hidden = !packs.length;
  const costs = view.ownerCosts || {};
  $('#repliesNote').textContent = (replies.low ? 'Your credits are running low. ' : '') + 'Online payment is coming soon: tap Recharge to message SiteCraft and we add the credits for you.';
  const uses = $('#creditUses');
  if (uses) uses.replaceChildren(...[
    ['Customer answer', 'text 1 credit · photo or file 2 · voice 3 (plain timings, address, phone questions and greetings are free)'],
    ['AI helper in your update chat', `${costs.update ?? 1} credit for each change it works out`],
    ['AI “write my About text”', `${costs.about ?? 2} credits`],
    ['Clean studio photo', `${costs.studio ?? 20} credits (nothing if the photo cannot be made)`],
    ['Changes that need no AI', 'free: price, stock count, hide or show, delete, timings and shop information, sales you record, editing a saved answer by hand'],
  ].map(([what, price]) => { const li = element('li'); li.append(element('strong', '', what), document.createTextNode(` — ${price}`)); return li; }));
}

function renderPage() {
  const page = view.page;
  const card = $('#pageCard');
  card.hidden = !view.publicId;
  const info = $('#pageInfo');
  if (page) {
    const link = element('a', '', page.url);
    link.href = page.url;
    link.target = '_blank';
    link.rel = 'noopener';
    const until = page.hosting?.expiresAt ? ` · hosted until ${new Date(page.hosting.expiresAt).toLocaleDateString()}` : '';
    info.replaceChildren(element('strong', '', 'Live: '), link, element('span', '', until));
  } else info.textContent = 'Not published yet.';
  $('#pageSlugLabel').hidden = Boolean(page);
  $('#pageButton').textContent = page ? 'Update my page' : 'Publish my page';
  $('#pageCopy').hidden = !page;
}

$('#pageForm').addEventListener('submit', (event) => {
  event.preventDefault();
  call('publish_page', { slug: event.target.elements.slug.value.trim().toLowerCase() });
});
$('#pageCopy').addEventListener('click', async () => {
  const url = view.page?.url;
  if (!url) return;
  try { await navigator.clipboard.writeText(url); showStatus('Link copied ✓'); } catch { window.prompt('Copy this link', url); }
});

const SECTION_LABELS = [['about', 'About us'], ['gallery', 'Gallery photos'], ['map', 'Map / directions button']];
function renderSections() {
  const hidden = view.hiddenSections || [];
  $('#sectionToggles').replaceChildren(...SECTION_LABELS.map(([key, label]) => {
    const isHidden = hidden.includes(key);
    const row = element('div', 'item-actions');
    row.append(element('span', 'item-name', label));
    if (isHidden) row.querySelector('.item-name').append(element('span', 'badge', 'Hidden from customers'));
    row.append(actionButton(isHidden ? 'Show to customers' : 'Hide', 'btn-light', () => call('set_section', { section: key, hidden: !isHidden })));
    return row;
  }));
}

function renderAnswers() {
  const list = view.savedAnswers || [];
  $('#answersCard').hidden = !list.length;
  const badge = $('#answersCount');
  badge.hidden = !list.length;
  badge.textContent = String(list.length);
  $('#answersList').replaceChildren(...list.map(answerCard));
}

const REQUEST_STATES = { new: 'New', accepted: 'Accepted', ready: 'Ready', done: 'Done', rejected: 'Not possible' };
const ORDER_STATES = { received: 'Received', in_progress: 'In progress', ready: 'Ready', delivered: 'Delivered' };

function actionButton(label, className, onClick) {
  const button = element('button', `btn btn-small ${className}`, label);
  button.type = 'button';
  button.addEventListener('click', onClick);
  return button;
}

function requestCard(request) {
  const card = element('article', 'question');
  const head = element('div', 'request-head');
  head.append(element('span', '', request.kind === 'preorder' ? '⚡ Pre-order' : '📸 Photo'),
    element('span', 'request-code', `#${request.code}`),
    element('span', `state state-${request.status}`, REQUEST_STATES[request.status] || request.status));
  card.append(head);
  const meta = [request.customer_name && `From ${request.customer_name}`, request.pickup && `Pickup: ${request.pickup}`,
    new Date(request.created_at).toLocaleString()].filter(Boolean).join(' · ');
  card.append(element('div', 'question-meta', meta));
  if (request.photo_id) {
    const link = element('a', 'request-photo');
    link.href = photoUrl(request.photo_id);
    link.target = '_blank';
    link.rel = 'noopener';
    const image = element('img');
    image.src = photoUrl(request.photo_id);
    image.alt = 'Customer photo';
    image.loading = 'lazy';
    link.append(image);
    card.append(link);
  }
  if (request.message) card.append(element('div', 'request-text', request.message));
  if (request.reply) card.append(element('div', 'question-answer', `Your reply: ${request.reply}`));
  const update = (status) => call('update_request', { requestId: request.request_id, status });
  const actions = element('div', 'request-actions');
  const open = ['new', 'accepted', 'ready'].includes(request.status);
  if (open && request.kind === 'preorder') {
    if (request.status === 'new') actions.append(actionButton('Accept', '', () => update('accepted')));
    if (request.status !== 'ready') actions.append(actionButton('Mark ready', '', () => update('ready')));
    actions.append(actionButton('Done', 'btn-light', () => update('done')));
    if (request.status === 'new') actions.append(actionButton('Not possible', 'btn-light', () => update('rejected')));
  } else if (open) {
    actions.append(actionButton('Done', 'btn-light', () => update('done')));
  }
  actions.append(actionButton('Delete', 'btn-danger', () => { if (window.confirm('Delete this request?')) call('delete_request', { requestId: request.request_id }); }));
  card.append(actions);
  if (open) {
    const row = element('div', 'row');
    const reply = element('textarea');
    reply.rows = 2;
    reply.maxLength = 600;
    reply.placeholder = request.kind === 'preorder' ? 'Reply to the customer (for example: Ready by 8:30, ₹420)' : 'Reply to the customer';
    reply.setAttribute('aria-label', `Reply to request ${request.code}`);
    const send = element('button', 'btn', 'Send reply');
    send.type = 'button';
    send.addEventListener('click', () => {
      if (reply.value.trim()) call('update_request', { requestId: request.request_id, reply: reply.value.trim(), ...(request.status === 'new' && request.kind === 'photo' ? { status: 'done' } : {}) });
    });
    row.append(reply, send);
    card.append(row);
  }
  return card;
}

function renderRequests() {
  const { open = [], closed = [] } = view.requests || {};
  const fresh = open.filter((r) => r.status === 'new').length;
  const badge = $('#requestCount');
  badge.hidden = !fresh;
  badge.textContent = String(fresh);
  const features = view.features || {};
  $('#requests').hidden = !features.photo && !features.preorder && !open.length && !closed.length;
  $('#requestList').replaceChildren(...(open.length ? open.map(requestCard) : [element('p', 'empty', 'No open requests.')]));
  $('#closedCount').textContent = String(closed.length);
  $('#closedList').replaceChildren(...closed.map(requestCard));
}

function renderOrders() {
  const orders = view.orders || [];
  $('#orders').hidden = !view.features?.orderStatus && !orders.length;
  $('#orderList').replaceChildren(...(orders.length ? orders.map((order) => {
    const row = element('div', 'order-row');
    row.append(element('span', 'request-code', order.code));
    const select = element('select');
    select.setAttribute('aria-label', `Status of order ${order.code}`);
    for (const [value, label] of Object.entries(ORDER_STATES)) {
      const option = element('option', '', label);
      option.value = value;
      option.selected = value === order.status;
      select.append(option);
    }
    select.addEventListener('change', () => call('save_order', { code: order.code, status: select.value, note: order.reply || '' }));
    row.append(select, element('span', 'order-note', order.reply || ''),
      actionButton('Delete', 'btn-danger', () => { if (window.confirm(`Delete order ${order.code}?`)) call('delete_order', { requestId: order.request_id }); }));
    return row;
  }) : [element('p', 'empty', 'No orders added yet.')]));
}

const FEATURE_KEYS = ['photo', 'preorder', 'orderStatus', 'voice', 'cart'];

function renderFeatures() {
  const form = $('#featureForm');
  if (form.contains(document.activeElement)) return;
  for (const key of FEATURE_KEYS) form.elements[key].checked = Boolean(view.features?.[key]);
}

const INFO_KEYS = ['shop_name', 'timings', 'weekly_holiday', 'address', 'call_number', 'whatsapp_number', 'map_link', 'about'];

function renderInfo() {
  const form = $('#infoForm');
  if (!form || form.contains(document.activeElement)) return;
  for (const key of INFO_KEYS) form.elements[key].value = view.info?.[key] || '';
}

$('#infoForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  call('save_info', { info: Object.fromEntries(INFO_KEYS.map((key) => [key, form.elements[key].value.trim()])) });
});

$('#aboutWrite').addEventListener('click', async () => {
  const note = $('#aboutNote');
  const cost = view.ownerCosts?.about;
  if (cost && !window.confirm(`Writing the About text with AI uses ${cost} credits from your balance (the same credits as customer replies). Continue?`)) return;
  note.textContent = 'Writing…';
  const ok = await call('generate_about');
  note.textContent = ok ? 'Done — read it and edit if you like.' : '';
  if (ok) { const area = $('#infoForm').elements.about; area.value = view.info?.about || ''; }
});

const rupees = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;
const PAY_LABEL = { cash: 'Cash', upi: 'UPI', card: 'Card', other: 'Not said' };

// Home: only today's total, with a button to the Sales tab.
function renderSales() {
  const sales = view.sales;
  $('#salesCard').hidden = !sales;
  if (!sales) { $('#ownerTabs').hidden = true; return; }
  $('#ownerTabs').hidden = false;
  const box = $('#salesCard .sales-total');
  box.replaceChildren(document.createTextNode(rupees(sales.today.total)));
  box.append(element('small', '', sales.today.sales
    ? `${sales.today.sales} sale${sales.today.sales === 1 ? '' : 's'} · ${sales.today.qty} item${sales.today.qty === 1 ? '' : 's'}`
    : 'No sales recorded today'));
}

// ---- Sales tab ----
let lastReport = null;
let rangeKey = 'week';
const dayMath = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86400000).toISOString().slice(0, 10);
const RANGES = [['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'Last 7 days'], ['month', 'Last 30 days'], ['custom', 'Pick dates']];

function rangeDates(key) {
  const today = view.sales?.day || new Date().toISOString().slice(0, 10);
  if (key === 'today') return [today, today];
  if (key === 'yesterday') return [dayMath(today, -1), dayMath(today, -1)];
  if (key === 'month') return [dayMath(today, -29), today];
  return [dayMath(today, -6), today];
}

async function loadReport(from, to) {
  await call('sales_report', { from, to });
}

function setTab(tab) {
  $('#sections').dataset.tab = tab;
  document.querySelectorAll('#ownerTabs button').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.tab === tab)));
  if (tab === 'sales' && view?.sales) loadReport(...rangeDates(rangeKey));
  window.scrollTo({ top: 0 });
}

function renderRanges() {
  $('#rangeRow').replaceChildren(...RANGES.map(([key, label]) => {
    const button = element('button', '', label);
    button.type = 'button';
    button.setAttribute('aria-pressed', String(key === rangeKey));
    button.addEventListener('click', () => {
      rangeKey = key;
      $('#rangeCustom').hidden = key !== 'custom';
      renderRanges();
      if (key !== 'custom') loadReport(...rangeDates(key));
      else { const [from, to] = lastReport ? [lastReport.from, lastReport.to] : rangeDates('week'); $('#rangeFrom').value = from; $('#rangeTo').value = to; $('#rangeTo').max = view.sales?.day || ''; $('#rangeFrom').max = view.sales?.day || ''; }
    });
    return button;
  }));
}

function renderSalesTab() {
  const report = lastReport;
  renderRanges();
  if (!report) return;
  const totals = report.totals;
  $('#reportTotals').replaceChildren(...[
    [rupees(totals.total), 'Total sales'], [String(totals.sales), 'Number of sales'], [String(totals.qty), 'Items sold'],
    [totals.sales ? rupees(Math.round(totals.total / totals.sales)) : '₹0', 'Average per sale'],
  ].map(([value, label]) => { const box = element('div'); box.append(element('strong', '', value), element('span', '', label)); return box; }));
  if (totals.unpriced) $('#reportTotals').append(element('p', 'muted', `${totals.unpriced} sale${totals.unpriced === 1 ? ' has' : 's have'} no price, counted as ₹0.`));

  const peak = Math.max(1, ...report.days.map((day) => day.total));
  const chart = $('#dayChart');
  chart.replaceChildren(...report.days.map((day) => {
    const bar = element('div', day.total ? 'day-bar' : 'day-bar zero');
    if (day.total) bar.style.height = `${Math.max(4, Math.round((day.total / peak) * 100))}%`;
    bar.title = `${day.day}: ${rupees(day.total)} (${day.sales} sale${day.sales === 1 ? '' : 's'})`;
    return bar;
  }));
  const axis = chart.nextElementSibling?.classList.contains('day-axis') ? chart.nextElementSibling : chart.insertAdjacentElement('afterend', element('div', 'day-axis'));
  axis.replaceChildren(element('span', '', report.from), element('span', '', `Highest day: ${rupees(peak === 1 && !totals.total ? 0 : peak)}`), element('span', '', report.to));

  $('#reportItems').replaceChildren(...(report.items.length ? report.items : [null]).map((item) => {
    const row = element('tr');
    if (!item) { const cell = element('td', 'muted', 'No sales in this period'); cell.colSpan = 3; row.append(cell); return row; }
    row.append(element('td', '', item.name), element('td', '', String(item.qty)), element('td', '', rupees(item.total)));
    return row;
  }));

  const payTotal = Object.values(report.payments).reduce((sum, n) => sum + n, 0) || 1;
  $('#paySplit').replaceChildren(...(Object.keys(report.payments).length ? Object.entries(report.payments) : [['', 0]]).map(([how, amount]) => {
    const row = element('div', 'pay-row');
    if (!how) { row.append(element('span', 'muted', 'No sales in this period')); return row; }
    const bar = element('div', 'pay-bar'); const fill = element('i'); fill.style.width = `${Math.round((amount / payTotal) * 100)}%`; bar.append(fill);
    row.append(element('span', '', PAY_LABEL[how] || how), bar, element('strong', '', rupees(amount)));
    return row;
  }));

  const low = (view.products || []).filter((item) => Number.isInteger(item.qty) && item.qty <= 3 && item.stock_status !== 'hidden').sort((a, b) => a.qty - b.qty);
  $('#lowList').replaceChildren(...(low.length ? low : [null]).map((item) => {
    const li = element('li');
    if (!item) { li.append(element('span', 'muted', 'Nothing is running low.')); return li; }
    li.append(element('span', '', item.name), element('strong', '', item.qty === 0 ? 'Out of stock' : `${item.qty} left`));
    return li;
  }));

  $('#reportRows').replaceChildren(...(report.rows.length ? report.rows : [null]).map((sale) => {
    const li = element('li');
    if (!sale) { li.append(element('span', 'muted', 'No sales in this period')); return li; }
    const when = new Date(sale.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
    li.append(element('span', '', `${when} · ${sale.qty} × ${sale.name} · ${rupees(sale.total)}${sale.payment ? ` · ${(PAY_LABEL[sale.payment] || sale.payment)}` : ''}`));
    const remove = element('button', '', 'Remove');
    remove.type = 'button';
    remove.addEventListener('click', async () => {
      if (!window.confirm('Remove this sale from your records?')) return;
      await call('delete_sale', { saleId: sale.id });
      await loadReport(report.from, report.to);
    });
    li.append(remove);
    return li;
  }));
}

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
function downloadCsv() {
  if (!lastReport) return;
  const lines = [['Date', 'Time', 'Item', 'Quantity', 'Price each', 'Amount', 'Payment'].map(csvCell).join(',')];
  for (const sale of [...lastReport.rows].reverse()) {
    const at = new Date(sale.at);
    lines.push([sale.day, at.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), sale.name, sale.qty, sale.unit_price, sale.total, PAY_LABEL[sale.payment] || 'Not said'].map(csvCell).join(','));
  }
  const url = URL.createObjectURL(new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `sales-${lastReport.from}-to-${lastReport.to}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

document.querySelectorAll('#ownerTabs button').forEach((button) => button.addEventListener('click', () => setTab(button.dataset.tab)));
$('#openSalesTab').addEventListener('click', () => setTab('sales'));
$('#rangeApply').addEventListener('click', () => { if ($('#rangeFrom').value && $('#rangeTo').value) loadReport($('#rangeFrom').value, $('#rangeTo').value); });
$('#downloadCsv').addEventListener('click', downloadCsv);

function render() {
  $('#sections').hidden = false;
  renderSales();
  if (view.report) lastReport = view.report;
  renderSalesTab();
  $('#shopName').textContent = view.shopName || 'Your shop';
  $('#defaultName').textContent = view.defaultBotName || 'Shop Assistant';
  const input = $('#botNameInput');
  if (document.activeElement !== input) input.value = view.customBotName || '';
  const openBot = $('#openBot');
  openBot.hidden = !view.publicId;
  if (view.publicId) openBot.href = view.page?.url || new URL(`../salesbot/?s=${encodeURIComponent(view.publicId)}`, window.location.href).href;
  renderInfo();
  renderQuestions();
  renderAnswers();
  renderSections();
  renderPage();
  renderReplies();
  renderRequests();
  renderOrders();
  renderFeatures();
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
  form.elements.qty.value = Number.isInteger(item?.qty) ? String(item.qty) : '';
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
    qty: form.elements.qty.value.trim() === '' ? null : Number(form.elements.qty.value),
  });
  if (!saved) return;
  const key = view.products.find((item) => item.name.toLowerCase().replace(/\s+/g, ' ').trim() === name.toLowerCase().replace(/\s+/g, ' ').trim())?.name_key;
  if (photo && key) await uploadPhoto('product', photo, key);
  form.hidden = true;
});

$('#orderForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.target;
  const code = form.elements.code.value.trim();
  if (!code) return;
  const saved = await call('save_order', { code, status: form.elements.status.value, note: form.elements.note.value.trim() });
  if (saved) form.reset();
});

$('#featureForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const form = event.target;
  call('save_features', { features: Object.fromEntries(FEATURE_KEYS.map((key) => [key, form.elements[key].checked])) });
});

$('#botNameForm').addEventListener('submit', (event) => {
  event.preventDefault();
  call('set_bot_name', { name: $('#botNameInput').value.trim() });
});

// ---- Notifications (Web Push) for new customer questions and requests. ----

const NOTIFY_KEY = 'botcraft:notify';
const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const notifyButton = $('#notifyButton');
const notifyNote = $('#notifyNote');

function keyBytes(text) {
  const plain = text.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(plain + '='.repeat((4 - (plain.length % 4)) % 4)), (c) => c.charCodeAt(0));
}

function notifyOn() {
  try { return localStorage.getItem(NOTIFY_KEY) === shopId; } catch { return false; }
}

function renderNotify() {
  $('#notifyCard').hidden = !pushSupported || !shopId;
  if (!pushSupported) return;
  const on = notifyOn() && Notification.permission === 'granted';
  notifyButton.textContent = on ? 'Turn off notifications' : 'Turn on notifications';
  notifyButton.className = on ? 'btn btn-light' : 'btn';
  if (Notification.permission === 'denied') notifyNote.textContent = 'Notifications are blocked for this site. Allow them in your browser settings, then try again.';
  else if (on) notifyNote.textContent = 'Notifications are on for this phone ✓';
}

async function pushCall(action, subscription) {
  const response = await fetch(`${API_BASE}/api/botcraft/push`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, role: 'owner', shopId, subscription: subscription.toJSON() }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || 'Could not save. Please try again.');
}

async function turnOnNotify() {
  if (await Notification.requestPermission() !== 'granted') { renderNotify(); return; }
  const registration = await navigator.serviceWorker.register('./owner-sw.js');
  await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    const response = await fetch(`${API_BASE}/api/botcraft/push`);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Notifications are not available right now.');
    subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(data.publicKey) });
  }
  await pushCall('subscribe', subscription);
  try { localStorage.setItem(NOTIFY_KEY, shopId); } catch {}
}

async function turnOffNotify() {
  const registration = await navigator.serviceWorker.getRegistration('./');
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await pushCall('unsubscribe', subscription);
    await subscription.unsubscribe();
  }
  try { localStorage.removeItem(NOTIFY_KEY); } catch {}
  notifyNote.textContent = 'Notifications are off.';
}

notifyButton.addEventListener('click', async () => {
  notifyButton.disabled = true;
  notifyNote.textContent = '';
  try {
    if (notifyOn() && Notification.permission === 'granted') await turnOffNotify();
    else await turnOnNotify();
  } catch (error) {
    notifyNote.textContent = error.message || 'Could not change notifications. Please try again.';
  } finally {
    notifyButton.disabled = false;
    renderNotify();
  }
});

if (pushSupported) navigator.serviceWorker.register('./owner-sw.js').catch(() => {});
renderNotify();

if (!shopId) showStatus('No bot found in this browser. Create your bot in the setup chat first.');
else {
  initUpdateChat({ getView: () => view || { products: [], info: {} }, call, prepareImage, apiBase: API_BASE, shopId });
  call('load');
  // New customer questions and requests show up while the page is open, unless the owner is typing.
  window.setInterval(() => {
    const typing = document.activeElement?.matches('input, textarea, select') || !$('#itemForm').hidden;
    if (!document.hidden && !typing) call('load');
  }, 60000);
}
