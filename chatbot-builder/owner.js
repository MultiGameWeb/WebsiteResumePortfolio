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
  const waiting = open.length + (view.requests?.open || []).filter((r) => r.status === 'new').length;
  document.title = waiting ? `(${waiting}) Manage my bot · BotCraft` : 'Manage my bot · BotCraft';
  $('#questionList').replaceChildren(...(open.length ? open.map((q) => questionCard(q, false)) : [element('p', 'empty', 'No new questions. 🎉')]));
  const answered = view.answeredQuestions || [];
  $('#answeredCount').textContent = String(answered.length);
  $('#answeredList').replaceChildren(...answered.map((q) => questionCard(q, true)));
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
  call('load');
  // New customer questions and requests show up while the page is open, unless the owner is typing.
  window.setInterval(() => {
    const typing = document.activeElement?.matches('input, textarea, select') || !$('#itemForm').hidden;
    if (!document.hidden && !typing) call('load');
  }, 60000);
}
