// The customer side of BotCraft: the shop's AI assistant, opened from the QR
// poster. ?s=<publicId> picks the shop; the last shop is remembered so the
// installed app (PWA) opens it again.
//
// Online, every question goes to the AI. The page also keeps a copy of the
// shop's answers and items, so without internet (or when the AI is busy) it
// still answers the basics from that copy, without AI.
const API_BASE = window.SALESBOT_API_BASE || 'https://sitecraft-ai.kammarivinaykumar216.workers.dev';
const LAST_SHOP_KEY = 'salesbot:lastShop';
const DATA_KEY_PREFIX = 'salesbot:data:';
const HISTORY_LIMIT = 12;
const OFFLINE_CHIPS = ['Items & prices', 'Timings', 'Address', 'Offers'];

const chat = document.querySelector('#chat');
const form = document.querySelector('#composer');
const input = document.querySelector('#input');
const send = document.querySelector('#send');
const banner = document.querySelector('#offlineBanner');

function readStore(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function writeStore(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

const params = new URLSearchParams(window.location.search);
// A hosted shop page (its own web address) has its shop built in; QR links use ?s=<id>.
const shopId = window.SALESBOT_SHOP || params.get('s') || readStore(LAST_SHOP_KEY) || '';
if (params.get('s')) writeStore(LAST_SHOP_KEY, shopId);

const history = [];
let busy = false;
// { shop, offline: { faqs, items, savedAt } } from the last time we were online.
let saved = null;
try { saved = JSON.parse(readStore(DATA_KEY_PREFIX + shopId) || 'null'); } catch {}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

// Telugu, Devanagari, Tamil… scripts pick the matching phone voice.
function speechLang(text) {
  const scripts = [[/[ఀ-౿]/, 'te-IN'], [/[ऀ-ॿ]/, 'hi-IN'], [/[஀-௿]/, 'ta-IN'], [/[ಀ-೿]/, 'kn-IN'],
    [/[ഀ-ൿ]/, 'ml-IN'], [/[ঀ-৿]/, 'bn-IN'], [/[઀-૿]/, 'gu-IN'], [/[਀-੿]/, 'pa-IN'], [/[؀-ۿ]/, 'ur-IN']];
  return scripts.find(([pattern]) => pattern.test(text))?.[1] || 'en-IN';
}

function speak(text, button) {
  const synth = window.speechSynthesis;
  if (!synth) return;
  if (synth.speaking) { synth.cancel(); button.textContent = '🔊 Listen'; return; }
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = speechLang(text);
  const voice = synth.getVoices().find((item) => item.lang.replace('_', '-').startsWith(utterance.lang.slice(0, 2)));
  if (voice) utterance.voice = voice;
  utterance.onend = () => { button.textContent = '🔊 Listen'; };
  button.textContent = '■ Stop';
  synth.speak(utterance);
}

function addMessage(role, text, suggestions = [], photos = []) {
  const row = element('div', `msg msg-${role}`);
  if (photos.length) {
    const strip = element('div', 'bubble-photos');
    for (const url of photos) { const image = element('img', 'bubble-photo'); image.src = url; image.alt = 'Photo you sent'; strip.append(image); }
    row.append(strip);
  }
  row.append(element('p', 'bubble', text));
  if (role === 'bot' && text !== '…' && window.speechSynthesis) {
    const listen = element('button', 'listen', '🔊 Listen');
    listen.type = 'button';
    listen.setAttribute('aria-label', 'Read this answer aloud');
    listen.addEventListener('click', () => speak(text, listen));
    row.append(listen);
  }
  if (suggestions.length) {
    const chips = element('div', 'chips');
    for (const suggestion of suggestions) {
      const chip = element('button', 'chip', suggestion);
      chip.type = 'button';
      chip.addEventListener('click', () => ask(suggestion));
      chips.append(chip);
    }
    row.append(chips);
  }
  chat.append(row);
  chat.scrollTop = chat.scrollHeight;
  return row;
}

function contactLink(label, href, newTab) {
  const link = element('a', 'contact', label);
  link.href = href;
  if (newTab) { link.target = '_blank'; link.rel = 'noopener'; }
  return link;
}

// Indian numbers without a country code get +91 for WhatsApp.
function whatsappNumber(digits) {
  const plain = digits.replace(/\D/g, '');
  return plain.length === 10 ? `91${plain}` : plain;
}

const photoUrl = (photoId) => (String(photoId).startsWith('data:') ? photoId : `${API_BASE}/api/botcraft/photo?id=${encodeURIComponent(photoId)}`);

const WEEKDAY_INDEX = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };

// "10:00 AM – 8:30 PM" + "Sunday" → { open: true, text: 'Open now · closes 8:30 PM' }, or null when the text cannot be read.
function openStatus(shop, now = new Date()) {
  const holiday = WEEKDAY_INDEX[String(shop.weeklyHoliday || '').trim().toLowerCase()];
  if (holiday !== undefined && holiday === now.getDay()) return { open: false, text: 'Closed today (weekly holiday)' };
  const times = [...String(shop.timings || '').matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/gi)];
  if (times.length < 2) return null;
  const toMinutes = (m, fallback) => {
    let hour = Number(m[1]);
    const minute = Number(m[2] || 0);
    const suffix = (m[3] || fallback || '').toLowerCase();
    if (hour > 24 || minute > 59) return null;
    if (suffix === 'pm' && hour < 12) hour += 12;
    if (suffix === 'am' && hour === 12) hour = 0;
    return hour * 60 + minute;
  };
  const start = toMinutes(times[0], times[0][3] ? '' : 'am');
  const end = toMinutes(times[1], times[1][3] ? '' : 'pm');
  if (start === null || end === null) return null;
  const current = now.getHours() * 60 + now.getMinutes();
  const open = end > start ? current >= start && current < end : current >= start || current < end;
  const label = `${String(times[1][1])}${times[1][2] ? `:${times[1][2]}` : ''} ${(times[1][3] || (end >= 720 ? 'PM' : 'AM')).toUpperCase()}`;
  return open ? { open: true, text: `Open now · closes ${label}` } : { open: false, text: 'Closed now' };
}

function setMeta(selector, attribute, value) {
  const node = document.querySelector(selector);
  if (node) node.setAttribute(attribute, value);
}

function showShop(shop) {
  const botLabel = shop.botName || `${shop.name} assistant`;
  document.title = `${shop.name} · ${botLabel}`;
  const blurb = shop.about || [shop.type, shop.timings && `Open ${shop.timings}`, shop.address].filter(Boolean).join(' · ');
  setMeta('#metaDescription', 'content', blurb || `${shop.name} — items, prices, timings and an AI assistant.`);
  setMeta('#ogTitle', 'content', shop.name);
  setMeta('#ogDescription', 'content', blurb || shop.name);
  document.querySelector('#shopName').textContent = shop.name;
  document.querySelector('#sectionsNav').dataset.brand = shop.name || '';
  document.querySelector('#botName').textContent = shop.type || '';
  const hero = document.querySelector('#heroPhoto');
  hero.hidden = !shop.mainPhoto;
  document.querySelector('#shopHeader').classList.toggle('has-photo', Boolean(shop.mainPhoto));
  if (shop.mainPhoto) { hero.src = photoUrl(shop.mainPhoto); hero.alt = shop.name; }
  document.querySelector('#shopMeta').textContent = shop.address || '';
  const status = openStatus(shop);
  const chip = document.querySelector('#openChip');
  chip.hidden = !status;
  if (status) { chip.textContent = status.text; chip.dataset.open = String(status.open); }
  const contacts = document.querySelector('#contactRow');
  contacts.replaceChildren();
  if (shop.call) contacts.append(contactLink('📞 Call', `tel:${shop.call}`));
  if (shop.whatsapp) contacts.append(contactLink('WhatsApp', `https://wa.me/${whatsappNumber(shop.whatsapp)}`, true));
  if (shop.mapLink) contacts.append(contactLink('📍 Directions', shop.mapLink, true));
  document.querySelector('#chatTitle').textContent = botLabel;
  // A long shop name would be cut off on a phone, so a long label becomes a short one.
  const askLabel = `Ask ${shop.botName || 'the assistant'}`;
  document.querySelector('#chatFabLabel').textContent = askLabel.length > 24 ? 'Ask the assistant' : askLabel;
  // Search engines and link previews understand this.
  let ld = document.querySelector('#shopJsonLd');
  if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'shopJsonLd'; document.head.append(ld); }
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'LocalBusiness', name: shop.name, description: blurb || undefined,
    address: shop.address || undefined, telephone: shop.call || undefined, openingHours: shop.timings || undefined, url: window.location.href.split('#')[0],
  });
}

function updateBanner() {
  banner.hidden = navigator.onLine;
}

function notFound(message) {
  document.querySelector('#shopName').textContent = 'Shop not found';
  document.querySelector('#fabRow').hidden = true;
  addMessage('bot', message);
  document.querySelector('#shopMeta').textContent = message;
  form.hidden = true;
}

let greeted = false;

async function loadShop({ silent = false } = {}) {
  updateBanner();
  if (!shopId) { if (!silent) notFound('Please scan the QR code in the shop again to open its page.'); return; }
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/public?s=${encodeURIComponent(shopId)}`);
    const data = await response.json();
    if (response.status === 404) { if (!silent) notFound('Sorry, this shop’s page was not found. Please scan the QR code again or ask at the counter.'); return; }
    if (!response.ok || !data.ok) throw new Error(data.error || 'Unavailable');
    const changed = JSON.stringify(saved?.shop) !== JSON.stringify(data.shop) || JSON.stringify(saved?.offline?.items) !== JSON.stringify(data.offline?.items)
      || JSON.stringify(saved?.offline?.faqs) !== JSON.stringify(data.offline?.faqs);
    saved = { shop: data.shop, offline: data.offline };
    writeStore(DATA_KEY_PREFIX + shopId, JSON.stringify(saved));
    if (silent && !changed) return;
  } catch {
    // No internet or server trouble: use the copy from the last visit.
    if (silent) return;
    if (!saved) { notFound('Please connect to the internet (or the shop’s Wi-Fi) to open this page.'); return; }
  }
  showShop(saved.shop);
  setupSections();
  if (!greeted) {
    greeted = true;
    addMessage('bot', `Hi! I'm ${saved.shop.botName || `the assistant of ${saved.shop.name}`}. Ask me about items, prices, offers or timings — in any language.`,
      navigator.onLine ? ['What do you sell?', 'Any offers today?', 'What are your timings?'] : OFFLINE_CHIPS);
    // Opened from a notification about a request.
    if (window.location.hash === '#requests' && !sections.requests.hidden) { sections.requests.scrollIntoView(); refreshMyRequests(); }
    renderNotify();
  }
}

// The page follows the owner's changes: when you come back to it, and every half minute while it is open.
document.addEventListener('visibilitychange', () => { if (!document.hidden) loadShop({ silent: true }); });
window.addEventListener('focus', () => loadShop({ silent: true }));
window.addEventListener('storage', (event) => { if (event.key === 'botcraft:demo:v1') loadShop({ silent: true }); });
window.setInterval(() => { if (!document.hidden) loadShop({ silent: true }); }, 30000);

// ---- Page sections ----

const sections = {
  about: document.querySelector('#aboutSection'), products: document.querySelector('#productsSection'), photos: document.querySelector('#photosSection'),
  info: document.querySelector('#infoSection'), requests: document.querySelector('#requestsSection'),
};
const sectionsNav = document.querySelector('#sectionsNav');
const chatSheet = document.querySelector('#chatSheet');
const sheet = document.querySelector('#productSheet');
let sheetProduct = null;

function openChat({ focus = true } = {}) {
  chatSheet.hidden = false;
  document.body.classList.add('chat-open');
  if (focus && !talking) input.focus();
  chat.scrollTop = chat.scrollHeight;
}

function closeChat() {
  if (talking) endTalk();
  chatSheet.hidden = true;
  document.body.classList.remove('chat-open');
}

// Item groups found from the item names, used for the icon when an item has no photo and for the filter chips.
const CATEGORIES = [
  ['🔌', 'Accessories', /\b(charger|cable|adapter|power ?bank|cover|case|screen guard|tempered|mouse|keyboard|pen ?drive|memory card|bag|stand|game tools?|router)\b/i],
  ['📱', 'Mobiles', /\b(mobile|phone|iphone|smartphone|galaxy|redmi|realme|oneplus|vivo|oppo|pixel)\b/i],
  ['💻', 'Laptops', /\b(laptop|notebook|macbook|chromebook|ideapad|thinkpad|vivobook|inspiron|latitude|aspire|pavilion|zenbook|legion)\b/i],
  ['📺', 'TVs', /\b(tv|television|led|oled|qled|smart tv)\b/i],
  ['🧊', 'Fridges', /\b(fridge|refrigerator|freezer)\b/i],
  ['🧺', 'Washing machines', /\b(washing machine|washer|dryer)\b/i],
  ['❄️', 'AC & coolers', /\b(ac|air conditioner|cooler|split)\b/i],
  ['🌀', 'Fans & home', /\b(fan|mixer|grinder|iron|heater|geyser|induction|cooker|oven|microwave|vacuum)\b/i],
  ['🎧', 'Audio', /\b(headphone|headphones|earbuds?|earphones?|speaker|soundbar|airpods?|neckband|home theatre)\b/i],
  ['⌚', 'Watches', /\b(watch|smartwatch|band)\b/i],
  ['📷', 'Cameras', /\b(camera|cctv|tripod)\b/i],
  ['💍', 'Jewellery', /\b(ring|chain|necklace|bangle|bangles|earring|earrings|anklet|gold|silver|diamond|pendant)\b/i],
  ['👕', 'Clothes', /\b(saree|shirt|jeans|kurta|dress|t-?shirt|pant|trousers|lehenga)\b/i],
  ['🥬', 'Groceries', /\b(rice|dal|oil|vegetables?|fruits?|milk|atta|sugar|spice|tomato|onion|potato)\b/i],
  ['💊', 'Medicines', /\b(tablet|syrup|capsule|medicine|ointment)\b/i],
];
const categoryOf = (item) => CATEGORIES.find(([, , pattern]) => pattern.test(item.name)) || ['📦', 'Other', null];
let categoryFilter = '';

function renderCategoryChips(all) {
  const box = document.querySelector('#categoryChips');
  const groups = new Map();
  for (const item of all) { const [icon, label] = categoryOf(item); groups.set(label, { icon, count: (groups.get(label)?.count || 0) + 1 }); }
  if (groups.size < 2 || all.length < 6) { box.hidden = true; box.replaceChildren(); categoryFilter = ''; return; }
  if (categoryFilter && !groups.has(categoryFilter)) categoryFilter = '';
  box.hidden = false;
  const make = (label, text) => {
    const chip = element('button', 'category-chip', text);
    chip.type = 'button';
    chip.setAttribute('aria-pressed', String(categoryFilter === label));
    chip.addEventListener('click', () => { categoryFilter = label; renderProducts(); });
    return chip;
  };
  box.replaceChildren(make('', `All (${all.length})`), ...[...groups].sort((a, b) => b[1].count - a[1].count).map(([label, g]) => make(label, `${g.icon} ${label} (${g.count})`)));
}

function renderProducts() {
  const query = document.querySelector('#productSearch').value.trim().toLowerCase();
  renderCategoryChips(saved.offline?.items || []);
  const items = (saved.offline?.items || []).filter((item) => (!query || `${item.name} ${item.details} ${item.price}`.toLowerCase().includes(query)) && (!categoryFilter || categoryOf(item)[1] === categoryFilter));
  const grid = document.querySelector('#productGrid');
  if (!items.length) { grid.replaceChildren(element('p', 'empty', 'No products found.')); return; }
  grid.replaceChildren(...items.map((item) => {
    const wrap = element('div', 'product-item');
    const card = element('button', 'product-card');
    card.type = 'button';
    if (item.photo) {
      const image = element('img');
      image.src = photoUrl(item.photo);
      image.alt = '';
      image.loading = 'lazy';
      card.append(image);
    } else {
      const placeholder = element('span', 'product-no-photo', categoryOf(item)[0]);
      placeholder.setAttribute('aria-hidden', 'true');
      card.append(placeholder);
    }
    card.append(element('span', 'product-name', item.name));
    if (item.price) card.append(element('span', 'product-price', item.price));
    if (item.out) card.append(element('span', 'product-out', 'Out of stock'));
    else if (item.left) card.append(element('span', 'product-low', `Only ${item.left} left`));
    card.addEventListener('click', () => openSheet(item));
    wrap.append(card);
    if (cartOn() && !item.out) {
      const add = element('button', 'product-add', cart[item.key] ? `✓ ${cart[item.key]} in cart · Add` : '+ Add to cart');
      add.type = 'button';
      add.addEventListener('click', () => addToCart(item));
      wrap.append(add);
    }
    return wrap;
  }));
  renderCartBar();
}

// ---- Cart: customers at home send their order to the shop's WhatsApp. ----

const CART_KEY = `salesbot:cart:${shopId}`;
let cart = (() => { try { return JSON.parse(readStore(CART_KEY) || '{}') || {}; } catch { return {}; } })();
const cartSheet = document.querySelector('#cartSheet');

const cartOn = () => Boolean(saved?.shop?.features?.cart && saved?.shop?.whatsapp);
const itemByKey = (key) => (saved?.offline?.items || []).find((item) => item.key === key);

// A price like "₹799" or "250/kg" counts towards the total; ranges do not.
function priceNumber(text) {
  const numbers = String(text || '').replace(/(\d),(?=\d)/g, '$1').match(/\d+(\.\d+)?/g);
  return numbers?.length === 1 ? Number(numbers[0]) : null;
}
const rupees = (amount) => `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function cartLines() {
  return Object.entries(cart).map(([key, qty]) => ({ item: itemByKey(key), qty })).filter((line) => line.item && !line.item.out && line.qty > 0);
}

function cartTotal(lines) {
  let total = 0;
  for (const line of lines) {
    const price = priceNumber(line.item.price);
    if (price === null) return null;
    total += price * line.qty;
  }
  return total;
}

function saveCart() {
  cart = Object.fromEntries(cartLines().map((line) => [line.item.key, line.qty]));
  writeStore(CART_KEY, JSON.stringify(cart));
}

function addToCart(item) {
  cart[item.key] = Math.min(99, (cart[item.key] || 0) + 1);
  saveCart();
  renderProducts();
}

function renderCartBar() {
  const lines = cartOn() ? cartLines() : [];
  const count = lines.reduce((sum, line) => sum + line.qty, 0);
  const total = cartTotal(lines);
  document.querySelector('#cartBar').hidden = !count;
  document.body.classList.toggle('has-cart', Boolean(count));
  document.querySelector('#cartSummary').textContent = `${count} item${count === 1 ? '' : 's'}${total !== null ? ` · ${rupees(total)}` : ''}`;
}

function renderCart() {
  const lines = cartLines();
  const list = document.querySelector('#cartList');
  if (!lines.length) list.replaceChildren(element('p', 'empty', 'Your cart is empty.'));
  else list.replaceChildren(...lines.map(({ item, qty }) => {
    const row = element('div', 'cart-row');
    const info = element('div', 'cart-info');
    info.append(element('span', 'cart-name', item.name), element('span', 'cart-price', item.price || 'Price on confirmation'));
    const controls = element('div', 'cart-qty');
    const minus = element('button', '', '−');
    minus.type = 'button';
    minus.setAttribute('aria-label', `One less ${item.name}`);
    minus.addEventListener('click', () => { cart[item.key] = qty - 1; saveCart(); renderCart(); renderProducts(); });
    const plus = element('button', '', '+');
    plus.type = 'button';
    plus.setAttribute('aria-label', `One more ${item.name}`);
    plus.addEventListener('click', () => { cart[item.key] = Math.min(99, qty + 1); saveCart(); renderCart(); renderProducts(); });
    controls.append(minus, element('span', '', String(qty)), plus);
    row.append(info, controls);
    return row;
  }));
  const total = cartTotal(lines);
  document.querySelector('#cartTotal').textContent = !lines.length ? '' : total !== null ? `Total: ${rupees(total)}` : 'The shop will confirm the total.';
  document.querySelector('#sendCart').disabled = !lines.length;
}

function sendCart() {
  const lines = cartLines();
  if (!lines.length) return;
  const total = cartTotal(lines);
  const name = document.querySelector('#cartName').value.trim();
  const note = document.querySelector('#cartNote').value.trim();
  const text = [
    `New order from ${saved.shop.name}'s assistant:`,
    ...lines.map(({ item, qty }, index) => `${index + 1}. ${item.name} × ${qty}${item.price ? ` — ${item.price}` : ''}`),
    total !== null ? `Total: ${rupees(total)} (as shown in the bot)` : 'Please confirm the total.',
    name && `Name: ${name}`,
    note && `Delivery / pickup: ${note}`,
    'Please confirm the order and how to pay.',
  ].filter(Boolean).join('\n');
  window.open(`https://wa.me/${whatsappNumber(saved.shop.whatsapp)}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  cart = {};
  saveCart();
  cartSheet.close();
  renderProducts();
}

document.querySelector('#openCart').addEventListener('click', () => { renderCart(); cartSheet.showModal(); });
document.querySelector('#closeCart').addEventListener('click', () => cartSheet.close());
cartSheet.addEventListener('click', (event) => { if (event.target === cartSheet) cartSheet.close(); });
document.querySelector('#sendCart').addEventListener('click', sendCart);
document.querySelector('#addThis').addEventListener('click', () => {
  if (sheetProduct) addToCart(sheetProduct);
  sheet.close();
});

// The item's photos like a shopping app: swipe through them, tap one to see it full screen.
function renderSheetPhotos(item) {
  const ids = (item.photos && item.photos.length ? item.photos : [item.photo]).filter(Boolean);
  const gallery = document.querySelector('#sheetGallery');
  const track = document.querySelector('#sheetTrack');
  const dots = document.querySelector('#sheetDots');
  gallery.hidden = !ids.length;
  track.scrollLeft = 0;
  track.replaceChildren(...ids.map((id, index) => {
    const slide = element('button', 'sheet-slide');
    slide.type = 'button';
    slide.setAttribute('aria-label', `${item.name}, photo ${index + 1} of ${ids.length}. Tap to enlarge`);
    const image = element('img');
    image.src = photoUrl(id);
    image.alt = '';
    slide.append(image);
    slide.addEventListener('click', () => { document.querySelector('#zoomPhoto').src = photoUrl(id); document.querySelector('#zoomDialog').showModal(); });
    return slide;
  }));
  dots.replaceChildren(...(ids.length > 1 ? ids.map((_, index) => element('span', index === 0 ? 'dot on' : 'dot')) : []));
  track.onscroll = () => {
    const index = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    [...dots.children].forEach((dot, i) => dot.classList.toggle('on', i === index));
  };
}
document.querySelector('#zoomDialog').addEventListener('click', () => document.querySelector('#zoomDialog').close());

// "8GB RAM | 512GB SSD | Core i5" (or one per line) is shown as a list of short points; plain text stays a paragraph.
function specParts(text) {
  const parts = String(text || '').split(/\n|\||•|;|(?<=\D),(?=\s)/).map((part) => part.trim()).filter(Boolean);
  return parts.length >= 2 && parts.every((part) => part.length <= 48) ? parts : null;
}

function renderSheetDetails(text) {
  const box = document.querySelector('#sheetDetails');
  const parts = specParts(text);
  box.classList.toggle('as-specs', Boolean(parts));
  if (!parts) { box.textContent = text; return; }
  box.replaceChildren(...parts.map((part) => element('span', 'spec-chip', part)));
}

// Up to three other items of the same group, so a customer can compare without going back.
function renderSimilar(item) {
  const box = document.querySelector('#sheetSimilar');
  const [, label] = categoryOf(item);
  const others = (saved.offline?.items || []).filter((other) => other.key !== item.key && !other.out && categoryOf(other)[1] === label && label !== 'Other').slice(0, 3);
  box.hidden = !others.length;
  box.querySelector('.similar-row').replaceChildren(...others.map((other) => {
    const card = element('button', 'similar-card');
    card.type = 'button';
    if (other.photo) { const image = element('img'); image.src = photoUrl(other.photo); image.alt = ''; image.loading = 'lazy'; card.append(image); }
    else card.append(element('span', 'similar-icon', categoryOf(other)[0]));
    card.append(element('span', 'similar-name', other.name));
    if (other.price) card.append(element('span', 'similar-price', other.price));
    card.addEventListener('click', () => openSheet(other));
    return card;
  }));
}

function openSheet(item) {
  sheetProduct = item;
  renderSheetPhotos(item);
  document.querySelector('#sheetName').textContent = item.name;
  document.querySelector('#sheetPrice').textContent = [item.price, item.out ? 'Out of stock' : item.left ? `Only ${item.left} left` : ''].filter(Boolean).join(' · ');
  renderSheetDetails(item.details || '');
  renderSimilar(item);
  document.querySelector('#addThis').hidden = !cartOn() || item.out;
  if (!sheet.open) sheet.showModal();
  sheet.scrollTop = 0;
}

function renderAbout(shop, faqs) {
  const text = shop.about || '';
  document.querySelector('#aboutText').textContent = text;
  document.querySelector('#aboutType').textContent = [shop.type, shop.timings && `Open ${shop.timings}`].filter(Boolean).join(' · ');
  const owner = document.querySelector('#ownerPhoto');
  owner.hidden = !shop.ownerPhoto;
  if (shop.ownerPhoto) owner.src = photoUrl(shop.ownerPhoto);
  const list = document.querySelector('#faqList');
  const shown = faqs.filter((faq) => faq.q && faq.a).slice(0, 12);
  list.replaceChildren(...shown.map((faq) => {
    const row = element('details', 'faq-item');
    row.append(element('summary', '', faq.q), element('p', '', faq.a));
    return row;
  }));
  const any = Boolean(text || owner.src && !owner.hidden || shown.length);
  sections.about.hidden = !any;
  return any;
}

function renderInfo(shop) {
  const list = document.querySelector('#infoList');
  const rows = [['🕒 Timings', shop.timings], ['📅 Weekly holiday', shop.weeklyHoliday], ['📍 Address', shop.address], ['📞 Phone', shop.call]].filter(([, value]) => value);
  list.replaceChildren(...rows.flatMap(([label, value]) => [element('dt', '', label), element('dd', '', value)]));
  const actions = document.querySelector('#infoActions');
  actions.replaceChildren();
  if (shop.mapLink) actions.append(contactLink('📍 Open in Maps', shop.mapLink, true));
  if (shop.call) actions.append(contactLink('📞 Call', `tel:${shop.call}`));
  if (shop.whatsapp) actions.append(contactLink('WhatsApp', `https://wa.me/${whatsappNumber(shop.whatsapp)}`, true));
  const frame = document.querySelector('#mapFrame');
  const query = shop.address ? encodeURIComponent(`${shop.name}, ${shop.address}`) : '';
  frame.hidden = !query || !navigator.onLine;
  const wanted = query ? `https://www.google.com/maps?q=${query}&output=embed` : '';
  if (wanted && frame.dataset.src !== wanted) { frame.dataset.src = wanted; frame.src = wanted; }
  sections.info.hidden = !rows.length && !shop.mapLink;
}

function setupSections() {
  const shop = saved.shop;
  const items = saved.offline?.items || [];
  const gallery = shop.gallery || [];
  const features = shop.features || {};
  const anyRequest = Boolean(features.photo || features.preorder || features.orderStatus);
  const hasAbout = renderAbout(shop, saved.offline?.faqs || []);
  renderInfo(shop);
  sections.products.hidden = !items.length;
  sections.photos.hidden = !gallery.length;
  sections.requests.hidden = !anyRequest;
  const visible = { aboutSection: hasAbout, productsSection: items.length > 0, photosSection: gallery.length > 0, infoSection: !sections.info.hidden, requestsSection: anyRequest };
  for (const link of sectionsNav.querySelectorAll('[data-section]')) link.hidden = !visible[link.dataset.section];
  sectionsNav.hidden = Object.values(visible).filter(Boolean).length < 2;
  // Computer screens: every other visible section gets a light background, whichever sections are shown.
  [...document.querySelectorAll('#sections .block')].filter((block) => !block.hidden).forEach((block, index) => block.classList.toggle('alt', index % 2 === 1));
  for (const button of document.querySelectorAll('#requestButtons [data-form]')) {
    button.hidden = !features[{ photo: 'photo', preorder: 'preorder', order: 'orderStatus' }[button.dataset.form]];
  }
  document.querySelector('#fabRow').hidden = false;
  const voiceOn = talkSupported && features.voice !== false;
  talkButton.hidden = !voiceOn;
  if (items.length) renderProducts();
  document.querySelector('#photoGrid').replaceChildren(...gallery.map((photoId) => {
    const link = element('a', 'gallery-photo');
    link.href = photoUrl(photoId);
    link.target = '_blank';
    link.rel = 'noopener';
    const image = element('img');
    image.src = photoUrl(photoId);
    image.alt = `${shop.name} photo`;
    image.loading = 'lazy';
    link.append(image);
    return link;
  }));
}

// Highlights the section you are reading in the sticky menu.
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      for (const link of sectionsNav.querySelectorAll('[data-section]')) link.classList.toggle('active', link.dataset.section === entry.target.id);
    }
  }, { rootMargin: '-35% 0px -55% 0px' });
  for (const section of Object.values(sections)) observer.observe(section);
}

document.querySelector('#productSearch').addEventListener('input', () => saved && renderProducts());
document.querySelector('#closeSheet').addEventListener('click', () => sheet.close());
sheet.addEventListener('click', (event) => { if (event.target === sheet) sheet.close(); });
document.querySelector('#askThis').addEventListener('click', () => {
  const item = sheetProduct;
  sheet.close();
  openChat();
  if (item) ask(`Tell me about ${item.name}`, item);
});
document.querySelector('#chatFab').addEventListener('click', () => openChat());
document.querySelector('#chatClose').addEventListener('click', closeChat);

// A bigger chat on a computer screen: the owner's customers can read long answers comfortably. The choice is remembered.
const chatSheetEl = document.querySelector('#chatSheet');
const expandButton = document.querySelector('#chatExpand');
function setChatLarge(large) {
  chatSheetEl.classList.toggle('is-large', large);
  expandButton.setAttribute('aria-pressed', String(large));
  expandButton.setAttribute('aria-label', large ? 'Make the chat smaller' : 'Make the chat bigger');
  expandButton.title = large ? 'Smaller chat' : 'Bigger chat';
  expandButton.textContent = large ? '⤡' : '⤢';
  try { localStorage.setItem('salesbot:chatLarge', large ? '1' : '0'); } catch {}
}
expandButton.addEventListener('click', () => setChatLarge(!chatSheetEl.classList.contains('is-large')));
try { if (localStorage.getItem('salesbot:chatLarge') === '1') setChatLarge(true); } catch {}
document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !chatSheet.hidden && !sheet.open && document.querySelector('#attachMenu').hidden) closeChat(); });  // Escape first closes the photo menu, then the chat
document.querySelector('#shareButton').addEventListener('click', async () => {
  const url = window.location.href.split('#')[0];
  const title = saved?.shop?.name || document.title;
  try {
    if (navigator.share) { await navigator.share({ title, text: `${title} — items, prices and timings`, url }); return; }
  } catch { return; }
  window.open(`https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`, '_blank', 'noopener');
});

// ---- Requests tab: photo questions, pre-orders and order status. ----

const MAX_IMAGE_SIDE = 1280;
const REQUESTS_KEY = `salesbot:requests:${shopId}`;
const REQUEST_LABELS = { new: 'Sent — waiting for the shop', accepted: 'Accepted by the shop', ready: 'Ready ✅', done: 'Completed', rejected: 'Not possible' };
const ORDER_LABELS = { received: 'Received', in_progress: 'In progress', ready: 'Ready ✅ — you can collect it', delivered: 'Delivered' };
const requestForms = { photo: document.querySelector('#photoForm'), preorder: document.querySelector('#preorderForm'), order: document.querySelector('#orderForm') };
const requestNote = document.querySelector('#requestNote');

function myRequestIds() {
  try { return JSON.parse(readStore(REQUESTS_KEY) || '[]').filter((id) => /^[a-f0-9]{32}$/.test(id)); } catch { return []; }
}

// Shrinks photos so they upload quickly on mobile data.
async function prepareImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
  const data = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return { mimeType: 'image/jpeg', data };
}

function openRequestForm(name) {
  for (const [key, formNode] of Object.entries(requestForms)) formNode.hidden = key !== name || !formNode.hidden;
  for (const button of document.querySelectorAll('#requestButtons [data-form]')) {
    button.setAttribute('aria-pressed', String(button.dataset.form === name && !requestForms[name].hidden));
  }
  requestNote.textContent = '';
}

function renderMyRequests(requests) {
  const list = document.querySelector('#myRequests');
  document.querySelector('#myTitle').hidden = !requests.length;
  list.replaceChildren(...requests.map((request) => {
    const card = element('article', 'my-request');
    const head = element('div', 'my-request-head');
    head.append(element('span', '', `${request.kind === 'preorder' ? '⚡ Pre-order' : '📸 Photo'} #${request.code}`),
      element('span', `my-state my-state-${request.status}`, REQUEST_LABELS[request.status] || request.status));
    card.append(head);
    const text = [request.message, request.pickup && `Pickup: ${request.pickup}`].filter(Boolean).join('\n');
    if (text) card.append(element('div', 'my-text', text));
    if (request.reply) card.append(element('div', 'my-reply', `Shop: ${request.reply}`));
    return card;
  }));
}

async function refreshMyRequests() {
  const ids = myRequestIds();
  if (!ids.length || !navigator.onLine) return;
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/requests`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ s: shopId, ids }),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) return;
    const byId = new Map(data.requests.map((request) => [request.id, request]));
    // Requests the shop deleted drop off this phone's list too.
    writeStore(REQUESTS_KEY, JSON.stringify(ids.filter((id) => byId.has(id))));
    renderMyRequests(ids.map((id) => byId.get(id)).filter(Boolean));
  } catch {}
}

async function sendRequest(formNode) {
  if (!navigator.onLine) { requestNote.textContent = 'Please connect to the internet to send this.'; return; }
  const kind = formNode.dataset.kind;
  const submit = formNode.querySelector('.request-submit');
  submit.disabled = true;
  requestNote.textContent = 'Sending…';
  try {
    const body = { s: shopId, kind, message: formNode.elements.message.value.trim(), name: formNode.elements.name.value.trim() };
    if (kind === 'preorder') body.pickup = formNode.elements.pickup.value.trim();
    if (kind === 'photo') {
      const file = formNode.elements.photo.files[0];
      if (!file) throw new Error('Please choose a photo.');
      body.image = await prepareImage(file).catch(() => { throw new Error('This photo could not be read. Please choose another one.'); });
    }
    const response = await fetch(`${API_BASE}/api/botcraft/request`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Could not send. Please try again.');
    writeStore(REQUESTS_KEY, JSON.stringify([data.request.id, ...myRequestIds()].slice(0, 20)));
    formNode.reset();
    formNode.hidden = true;
    requestNote.textContent = `Sent ✓ Your number is #${data.request.code}. The shop's reply will show below${kind === 'preorder' ? ' — show this number at the counter' : ''}.`;
    refreshMyRequests();
    // Already following replies: follow this request too.
    if (notifyOn()) followRequests(false).catch(() => {});
    renderNotify();
  } catch (error) {
    requestNote.textContent = error.message || 'Could not send. Please try again.';
  } finally {
    submit.disabled = false;
  }
}

// ---- Notifications for the shop's replies (Web Push). ----

const NOTIFY_KEY = `salesbot:notify:${shopId}`;
const pushSupported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const notifyButton = document.querySelector('#notifyMe');

function keyBytes(text) {
  const plain = text.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(atob(plain + '='.repeat((4 - (plain.length % 4)) % 4)), (c) => c.charCodeAt(0));
}

const notifyOn = () => pushSupported && readStore(NOTIFY_KEY) === '1' && Notification.permission === 'granted';

function renderNotify() {
  notifyButton.hidden = !pushSupported || !myRequestIds().length || notifyOn() || Notification.permission === 'denied';
}

// Saves this phone's subscription for all of its requests to this shop.
async function followRequests(create) {
  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    if (!create) return;
    const keyResponse = await fetch(`${API_BASE}/api/botcraft/push`);
    const keyData = await keyResponse.json();
    if (!keyResponse.ok || !keyData.ok) throw new Error(keyData.error || 'Notifications are not available right now.');
    subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(keyData.publicKey) });
  }
  const response = await fetch(`${API_BASE}/api/botcraft/push`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role: 'customer', s: shopId, ids: myRequestIds(), subscription: subscription.toJSON() }),
  });
  const data = await response.json();
  if (!response.ok || !data.ok) throw new Error(data.error || 'Could not turn on notifications.');
  writeStore(NOTIFY_KEY, '1');
}

notifyButton.addEventListener('click', async () => {
  notifyButton.disabled = true;
  try {
    if (await Notification.requestPermission() !== 'granted') throw new Error('Notifications were not allowed. The reply will still show here.');
    await followRequests(true);
    requestNote.textContent = '🔔 You will get a notification when the shop replies.';
  } catch (error) {
    requestNote.textContent = error.message || 'Could not turn on notifications.';
  } finally {
    notifyButton.disabled = false;
    renderNotify();
  }
});

async function checkOrder(formNode) {
  const result = document.querySelector('#orderResult');
  const code = formNode.elements.code.value.trim();
  if (!code) return;
  if (!navigator.onLine) { result.textContent = 'Please connect to the internet to check.'; return; }
  result.textContent = 'Checking…';
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/order?s=${encodeURIComponent(shopId)}&code=${encodeURIComponent(code)}`);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error);
    result.textContent = data.order
      ? `Order ${data.order.code}: ${ORDER_LABELS[data.order.status] || data.order.status}${data.order.note ? `\n${data.order.note}` : ''}`
      : 'No order with this number yet. Please check the number on your bill, or ask the shop.';
  } catch (error) {
    result.textContent = error.message || 'Could not check right now. Please try again.';
  }
}

document.querySelector('#requestButtons').addEventListener('click', (event) => {
  const button = event.target.closest('[data-form]');
  if (button) openRequestForm(button.dataset.form);
});
requestForms.photo.addEventListener('submit', (event) => { event.preventDefault(); sendRequest(event.target); });
requestForms.preorder.addEventListener('submit', (event) => { event.preventDefault(); sendRequest(event.target); });
requestForms.order.addEventListener('submit', (event) => { event.preventDefault(); checkOrder(event.target); });
// The shop's replies show up while the Requests tab is open.
window.setInterval(() => { if (!sections.requests.hidden && !document.hidden) refreshMyRequests(); }, 60000);

// ---- Offline answers: plain text search over the saved copy, no AI. ----

const words = (text) => String(text).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((word) => word.length > 2);

function itemLine(item) {
  return `• ${item.name}${item.price ? ` — ${item.price}` : ''}${item.out ? ' (out of stock)' : ''}`;
}

// Words that mean timings, address or phone, in English, Telugu and Hindi.
function quickAnswer(lower, shop) {
  if (/\b(timings?|time|open|opening|closing|close|closed|hours|holiday)\b|సమయం|టైమింగ్|సెలవు|टाइम|समय|खुलने|छुट्टी/.test(lower)) {
    return [shop.timings && `Timings: ${shop.timings}`, shop.weeklyHoliday && `Weekly holiday: ${shop.weeklyHoliday}`].filter(Boolean).join('\n');
  }
  if (/\b(address|where|location|directions?|map|reach)\b|చిరునామా|ఎక్కడ|पता|कहाँ/.test(lower)) return shop.address || '';
  if (/\b(phone|call|number|contact|whatsapp)\b|ఫోన్|नंबर|फोन/.test(lower)) return shop.call ? `Call us: ${shop.call}` : '';
  return '';
}

function offlineAnswer(question) {
  if (!saved) return 'I need the internet to answer. Please connect, or ask at the counter.';
  const shop = saved.shop;
  const { faqs = [], items = [] } = saved.offline || {};
  if (question === 'Items & prices') {
    return items.length ? `Items:\n${items.slice(0, 30).map(itemLine).join('\n')}` : 'The item list is not saved yet. Please ask at the counter.';
  }
  if (question === 'Timings') return [shop.timings && `Timings: ${shop.timings}`, shop.weeklyHoliday && `Weekly holiday: ${shop.weeklyHoliday}`].filter(Boolean).join('\n') || 'Please ask at the counter.';
  if (question === 'Address') return shop.address || 'Please ask at the counter.';
  const asked = words(question === 'Offers' ? 'offers offer discount' : question);
  const score = (text) => {
    const target = words(text);
    return asked.filter((word) => target.some((other) => other.includes(word) || word.includes(other))).length;
  };
  const itemHits = items.map((item) => ({ item, s: score(`${item.name} ${item.details}`) })).filter((hit) => hit.s > 0)
    .sort((a, b) => b.s - a.s).slice(0, 8).map((hit) => itemLine(hit.item));
  const faqHits = faqs.map((faq) => ({ faq, s: score(faq.q) * 2 + score(faq.a) })).filter((hit) => hit.s > 0)
    .sort((a, b) => b.s - a.s).slice(0, 2).map((hit) => `${hit.faq.q}\n→ ${hit.faq.a}`);
  if (!itemHits.length && !faqHits.length) {
    // Typed questions such as "timings?" or "where is the shop": the shop's own details.
    const quick = quickAnswer(String(question).toLowerCase(), shop);
    if (quick) return quick;
    return 'I could not find that in the saved answers. Please ask at the counter, or try again with internet.';
  }
  return [...itemHits, ...faqHits].join('\n\n');
}

// ---- Photos in the chat ----
// The customer adds photos (gallery or camera) and asks about them, typing or by voice (talk mode). The AI
// looks at them to understand the question and answers from the shop's own information. They are not saved.
const MAX_CHAT_PHOTOS = 3;
const staged = []; // { url, image: { mimeType, data } }
const attachTray = document.querySelector('#attachTray');
const attachMenu = document.querySelector('#attachMenu');
const attachButton = document.querySelector('#attach');
const fileGallery = document.querySelector('#fileGallery');
const fileCamera = document.querySelector('#fileCamera');

function renderTray() {
  attachTray.replaceChildren(...staged.map((photo, index) => {
    const cell = element('div', 'attach-thumb');
    const image = element('img');
    image.src = photo.url;
    image.alt = `Photo ${index + 1}`;
    const remove = element('button', 'attach-remove', '×');
    remove.type = 'button';
    remove.setAttribute('aria-label', `Remove photo ${index + 1}`);
    remove.addEventListener('click', () => { URL.revokeObjectURL(photo.url); staged.splice(staged.indexOf(photo), 1); renderTray(); });
    cell.append(image, remove);
    return cell;
  }));
  attachTray.hidden = !staged.length;
  chat.scrollTop = chat.scrollHeight;
}

async function addPhotos(fileList) {
  const files = Array.from(fileList || []).filter((file) => /^image\//.test(file.type));
  if (!files.length) return;
  for (const file of files) {
    if (staged.length >= MAX_CHAT_PHOTOS) { addMessage('bot', `You can send up to ${MAX_CHAT_PHOTOS} photos at a time.`); break; }
    try {
      staged.push({ url: URL.createObjectURL(file), image: await prepareImage(file) });
    } catch {
      addMessage('bot', 'I could not read that photo. Please try another one.');
    }
  }
  renderTray();
  if (!talking) input.focus();
}

function openAttachMenu() {
  attachMenu.hidden = false;
  attachButton.setAttribute('aria-expanded', 'true');
}
function closeAttachMenu() {
  attachMenu.hidden = true;
  attachButton.setAttribute('aria-expanded', 'false');
}
const toggleAttachMenu = () => (attachMenu.hidden ? openAttachMenu() : closeAttachMenu());

// Camera: a phone opens its own camera app; a computer shows a live camera box.
const cameraDialog = document.querySelector('#cameraDialog');
const cameraVideo = document.querySelector('#cameraVideo');
let cameraStream = null;
function stopCamera() {
  cameraStream?.getTracks().forEach((track) => track.stop());
  cameraStream = null;
  cameraVideo.srcObject = null;
}
async function takePhoto() {
  closeAttachMenu();
  if (window.matchMedia('(pointer: coarse)').matches || !navigator.mediaDevices?.getUserMedia) { fileCamera.click(); return; }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
    cameraVideo.srcObject = cameraStream;
    cameraDialog.showModal();
  } catch {
    // No camera or no permission: let the customer choose a picture instead.
    stopCamera();
    fileGallery.click();
  }
}
document.querySelector('#cameraSnap').addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  canvas.width = cameraVideo.videoWidth || 1280;
  canvas.height = cameraVideo.videoHeight || 720;
  canvas.getContext('2d').drawImage(cameraVideo, 0, 0, canvas.width, canvas.height);
  canvas.toBlob((blob) => { if (blob) addPhotos([new File([blob], 'camera.jpg', { type: 'image/jpeg' })]); }, 'image/jpeg', 0.9);
  cameraDialog.close();
});
document.querySelector('#cameraCancel').addEventListener('click', () => cameraDialog.close());
cameraDialog.addEventListener('close', stopCamera);

attachButton.addEventListener('click', (event) => { event.stopPropagation(); toggleAttachMenu(); });
document.querySelector('#talkPhoto').addEventListener('click', (event) => { event.stopPropagation(); toggleAttachMenu(); });
document.querySelector('#attachGallery').addEventListener('click', () => { closeAttachMenu(); fileGallery.click(); });
document.querySelector('#attachCamera').addEventListener('click', takePhoto);
fileGallery.addEventListener('change', () => { addPhotos(fileGallery.files); fileGallery.value = ''; });
fileCamera.addEventListener('change', () => { addPhotos(fileCamera.files); fileCamera.value = ''; });
document.addEventListener('click', (event) => { if (!attachMenu.hidden && !attachMenu.contains(event.target)) closeAttachMenu(); });
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeAttachMenu(); });
// The photo button next to the microphone: open the chat with the photo choices.

// Returns the reply shown (so talk mode can read it aloud).
async function ask(text, product = null, { voice = false } = {}) {
  const photos = staged.splice(0);
  // A photo alone is enough: it is sent with a plain question.
  const question = String(text || '').trim() || (photos.length ? 'Do you have this? Please look at my photo.' : '');
  if (!question || busy) { staged.unshift(...photos); return ''; }
  if (photos.length && !navigator.onLine) {
    staged.unshift(...photos);
    addMessage('bot', 'Photos need the internet. Please connect and try again, or ask in words.');
    return '';
  }
  addMessage('customer', question, [], photos.map((photo) => photo.url));
  renderTray();
  input.value = '';
  if (!navigator.onLine) {
    const answer = offlineAnswer(question);
    addMessage('bot', answer, OFFLINE_CHIPS);
    return answer;
  }
  busy = true;
  send.disabled = true;
  let limitCode = '';
  const typing = addMessage('bot', '…');
  typing.classList.add('typing');
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s: shopId, text: question, history: history.slice(-HISTORY_LIMIT), product: product?.key || undefined, voice: voice || undefined, images: photos.length ? photos.map((photo) => photo.image) : undefined }),
    });
    const data = await response.json();
    typing.remove();
    if (!response.ok || !data.ok) { limitCode = data.code || ''; throw new Error(data.error); }
    history.push({ role: 'customer', text: photos.length ? `${question} [sent ${photos.length} photo${photos.length === 1 ? '' : 's'}]` : question }, { role: 'bot', text: data.reply });
    addMessage('bot', data.reply, data.suggestions || []);
    return data.reply;
  } catch {
    // No connection or the AI is busy: answer from the saved copy.
    typing.remove();
    const answer = offlineAnswer(question);
    addMessage('bot', `(Basic answer — ${limitCode === 'no_replies' ? 'the AI assistant is resting for now' : limitCode === 'daily_limit' || limitCode === 'visitor_limit' ? 'too many questions for today' : 'AI not available right now'})\n${answer}`, OFFLINE_CHIPS);
    return answer;
  } finally {
    busy = false;
    send.disabled = false;
    if (!talking) input.focus();
  }
}

// ---- Talk mode: speak, hear the answer, speak again (no typing). ----
// The phone's own speech services turn speech into text and read replies
// aloud; the AI sees the same text as in chat, asked for short replies.

const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const TALK_LANG_KEY = 'salesbot:talkLang';
const TALK_LANGS = [['te-IN', 'తెలుగు'], ['hi-IN', 'हिन्दी'], ['en-IN', 'English'], ['ta-IN', 'தமிழ்'], ['kn-IN', 'ಕನ್ನಡ'],
  ['ml-IN', 'മലയാളം'], ['mr-IN', 'मराठी'], ['bn-IN', 'বাংলা'], ['gu-IN', 'ગુજરાતી'], ['ur-IN', 'اردو']];
const talkButton = document.querySelector('#talk');
const talkPanel = document.querySelector('#talkPanel');
const talkOrb = document.querySelector('#talkOrb');
const talkStatus = document.querySelector('#talkStatus');
const talkHeard = document.querySelector('#talkHeard');
const talkLang = document.querySelector('#talkLang');
let talking = false;
let talkSupported = false;
let talkState = 'idle'; // idle, listening, thinking, speaking
let recognizer = null;

const talkSaid = document.querySelector('#talkSaid');
const talkNote = document.querySelector('#talkNote');
const TALK_NOTE = 'Your phone turns your voice into text. Never say passwords, OTPs or bank details.';
const TALK_NOTE_V2 = 'Just speak and pause: I answer in my voice. Never say passwords, OTPs or bank details.';

function setTalkState(state, status) {
  talkState = state;
  talkPanel.dataset.state = state;
  talkStatus.textContent = status;
  talkOrb.textContent = state === 'speaking' ? '🔊' : state === 'thinking' ? '…' : state === 'listening' ? '⏹' : '🎙️';
  talkOrb.setAttribute('aria-label', state === 'listening' ? 'Done speaking' : state === 'speaking' ? 'Stop and talk' : 'Tap to talk');
  talkButton.classList.toggle('active', talking);
}

// Reads a reply aloud; resolves when it ends (or fails).
function speakText(text) {
  const synth = window.speechSynthesis;
  const clean = String(text || '').replace(/[*_#>`~]|https?:\/\/\S+|\p{Extended_Pictographic}/gu, '').trim();
  if (!synth || !clean) return Promise.resolve();
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = speechLang(clean) === 'en-IN' ? talkLang.value : speechLang(clean);
    const voices = synth.getVoices();
    const voice = voices.find((item) => item.lang.replace('_', '-') === utterance.lang) || voices.find((item) => item.lang.replace('_', '-').startsWith(utterance.lang.slice(0, 2)));
    if (voice) utterance.voice = voice;
    // Some phones have no voice for this language: the answer stays on screen.
    talkNote.textContent = voices.length && !voice ? 'This phone has no voice for this language, so the answer is shown on screen. Install it in the phone’s text-to-speech settings to hear it.' : TALK_NOTE;
    // Some phones never fire "end": stop waiting after a generous time.
    const timer = window.setTimeout(resolve, 4000 + clean.length * 120);
    const done = () => { window.clearTimeout(timer); resolve(); };
    utterance.onend = done;
    utterance.onerror = done;
    synth.cancel();
    synth.speak(utterance);
  });
}

function listen() {
  if (!talking) return;
  window.speechSynthesis?.cancel();
  let heard = '';
  talkHeard.textContent = '';
  recognizer = new Recognition();
  recognizer.lang = talkLang.value;
  recognizer.interimResults = true;
  recognizer.maxAlternatives = 1;
  recognizer.onresult = (event) => {
    heard = Array.from(event.results).map((result) => result[0].transcript).join('');
    talkHeard.textContent = heard;
  };
  recognizer.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      talking = false;
      setTalkState('idle', 'Please allow the microphone for this page, then tap to talk.');
    } else if (event.error === 'audio-capture') {
      talking = false;
      setTalkState('idle', 'No microphone was found on this device.');
    } else if (event.error === 'network') {
      talking = false;
      setTalkState('idle', 'Voice needs the internet. Please check your connection and tap to talk.');
    }
  };
  recognizer.onend = async () => {
    recognizer = null;
    if (!talking) return;
    const question = heard.trim();
    if (!question) { setTalkState('idle', 'I didn’t hear anything. Tap to talk.'); return; }
    setTalkState('thinking', 'Thinking…');
    const reply = await ask(question, null, { voice: true });
    if (!talking) return;
    setTalkState('speaking', 'Speaking… tap to interrupt');
    talkSaid.textContent = String(reply || '').replace(/\s+/g, ' ').slice(0, 220);
    await speakText(reply);
    if (talking && talkState === 'speaking') listen();
  };
  setTalkState('listening', 'Listening… speak now');
  try { recognizer.start(); } catch { setTalkState('idle', 'Tap to talk'); }
}

// ---- Voice to voice ----
// The customer speaks; the recording goes to the server, where the AI hears it directly (no phone speech-to-text
// that spoils Telugu), answers from the shop's information, and the answer comes back as a natural voice. The page
// listens again by itself, so it is a conversation: speak, pause, hear the answer, speak again. If the server
// cannot do this (or the phone has no microphone access to the audio engine) the older mode below is used.
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const voiceToVoice = Boolean(navigator.mediaDevices?.getUserMedia && AudioContextClass && window.AudioWorkletNode);
let voiceServerOk = true;
const useVoiceToVoice = () => voiceToVoice && voiceServerOk;

const WORKLET_CODE = "class PcmCapture extends AudioWorkletProcessor { process(inputs) { const channel = inputs[0] && inputs[0][0]; if (channel) this.port.postMessage(channel.slice(0)); return true; } } registerProcessor('pcm-capture', PcmCapture);";
const VAD = { minSpeechMs: 350, endSilenceMs: 1300, noSpeechMs: 9000, maxMs: 25000, floor: 0.012 };

// 16 kHz, 16 bit, mono WAV from the captured sound.
function encodeWav(samples, sampleRate) {
  const target = 16000;
  const ratio = sampleRate / target;
  const length = Math.floor(samples.length / ratio);
  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  const write = (offset, text) => { for (let i = 0; i < text.length; i += 1) view.setUint8(offset + i, text.charCodeAt(i)); };
  write(0, 'RIFF'); view.setUint32(4, 36 + length * 2, true); write(8, 'WAVE'); write(12, 'fmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, target, true); view.setUint32(28, target * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  write(36, 'data'); view.setUint32(40, length * 2, true);
  for (let i = 0; i < length; i += 1) {
    // Average the samples that fall in this 16 kHz step (a simple low-pass before shrinking).
    const from = Math.floor(i * ratio);
    const to = Math.min(samples.length, Math.max(from + 1, Math.floor((i + 1) * ratio)));
    let sum = 0;
    for (let j = from; j < to; j += 1) sum += samples[j];
    const value = Math.max(-1, Math.min(1, sum / (to - from)));
    view.setInt16(44 + i * 2, value < 0 ? value * 0x8000 : value * 0x7fff, true);
  }
  return new Uint8Array(buffer);
}
function bytesToBase64(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

// Records until the customer stops talking: speech starts, then a pause ends it. Resolves
// { reason: 'speech' | 'silence' | 'tapped' | 'long', samples, sampleRate }.
function captureSpeech(onLevel) {
  let stream; let context; let node; let finish;
  const chunks = [];
  const result = new Promise((resolve) => { finish = resolve; });
  let done = false;
  const stop = (reason) => {
    if (done) return;
    done = true;
    stream?.getTracks().forEach((track) => track.stop());
    const sampleRate = context?.sampleRate || 48000;
    context?.close().catch(() => {});
    const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const samples = new Float32Array(total);
    let offset = 0;
    for (const chunk of chunks) { samples.set(chunk, offset); offset += chunk.length; }
    finish({ reason, samples, sampleRate });
  };
  const ready = (async () => {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    context = new AudioContextClass();
    const url = URL.createObjectURL(new Blob([WORKLET_CODE], { type: 'text/javascript' }));
    await context.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);
    const source = context.createMediaStreamSource(stream);
    node = new AudioWorkletNode(context, 'pcm-capture');
    const mute = context.createGain();
    mute.gain.value = 0; // the microphone is never played back
    source.connect(node); node.connect(mute); mute.connect(context.destination);
    const started = performance.now();
    let windowSum = 0; let windowCount = 0; let windowStart = started;
    let floor = 0; let calibrated = false; let speechMs = 0; let silenceMs = 0; let spoke = false;
    node.port.onmessage = (event) => {
      if (done) return;
      const chunk = event.data;
      chunks.push(chunk);
      for (let i = 0; i < chunk.length; i += 1) windowSum += chunk[i] * chunk[i];
      windowCount += chunk.length;
      const now = performance.now();
      if (now - windowStart < 60) return;
      const level = Math.sqrt(windowSum / Math.max(1, windowCount));
      const span = now - windowStart;
      windowSum = 0; windowCount = 0; windowStart = now;
      onLevel?.(level);
      // The first moments set what "quiet" sounds like in this place. The quietest moment counts, so a customer
      // who starts talking the instant they tap is not mistaken for background noise.
      if (!calibrated) { floor = floor ? Math.min(floor, level) : level; if (now - started > 350) calibrated = true; return; }
      const threshold = Math.min(0.06, Math.max(VAD.floor, floor * 3));
      if (level > threshold) { speechMs += span; silenceMs = 0; if (speechMs >= VAD.minSpeechMs) spoke = true; }
      else if (spoke) silenceMs += span;
      if (spoke && silenceMs >= VAD.endSilenceMs) stop('speech');
      else if (!spoke && now - started > VAD.noSpeechMs) stop('silence');
      else if (now - started > VAD.maxMs) stop(spoke ? 'long' : 'silence');
    };
  })();
  return { ready, result, stop };
}

let capture = null;
let playback = null;
let playbackDone = null;
function stopPlayback() {
  if (playback) { playback.pause(); playback = null; }
  playbackDone?.();
  playbackDone = null;
}
function playAnswer(audio) {
  return new Promise((resolve) => {
    playbackDone = resolve;
    playback = new Audio(`data:${audio.mimeType};base64,${audio.data}`);
    playback.onended = () => { playback = null; playbackDone = null; resolve(); };
    playback.onerror = () => { playback = null; playbackDone = null; resolve(); };
    playback.play().catch(() => { playback = null; playbackDone = null; resolve(); });
  });
}
function stopVoice() {
  capture?.stop('tapped');
  capture = null;
  stopPlayback();
}

async function listenVoice() {
  if (!talking) return;
  window.speechSynthesis?.cancel();
  stopPlayback();
  setTalkState('listening', 'Listening… speak, and pause when you finish');
  const session = captureSpeech((level) => talkPanel.style.setProperty('--level', String(Math.min(1, level * 12))));
  capture = session;
  try {
    await session.ready;
  } catch (error) {
    capture = null;
    session.stop('tapped');
    if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') { talking = false; setTalkState('idle', 'Please allow the microphone for this page, then tap to talk.'); return; }
    if (error?.name === 'NotFoundError') { talking = false; setTalkState('idle', 'No microphone was found on this device.'); return; }
    // Anything else: use the older mode on this phone.
    useOlderVoice();
    return;
  }
  const recorded = await session.result;
  if (capture === session) capture = null;
  if (!talking) return;
  if (recorded.reason === 'silence' || recorded.samples.length < recorded.sampleRate * 0.4) {
    setTalkState('idle', 'I didn’t hear anything. Tap to talk.');
    return;
  }
  if (!navigator.onLine) { setTalkState('idle', 'Voice needs the internet. Please check your connection and tap to talk.'); return; }
  setTalkState('thinking', 'Thinking…');
  const photos = staged.splice(0);
  renderTray();
  let data;
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/voice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        s: shopId, history: history.slice(-HISTORY_LIMIT),
        audio: { mimeType: 'audio/wav', data: bytesToBase64(encodeWav(recorded.samples, recorded.sampleRate)) },
        images: photos.length ? photos.map((photo) => photo.image) : undefined,
      }),
    });
    data = await response.json();
    if (!response.ok || !data.ok) {
      staged.unshift(...photos); renderTray();
      // This server does not do voice to voice (or is busy): the older mode takes over; limits are shown as they are.
      if (!data.code && (response.status === 404 || response.status >= 500)) {
        useOlderVoice();
        return;
      }
      setTalkState('idle', data.error || 'The assistant is busy. Tap to talk.');
      return;
    }
  } catch {
    staged.unshift(...photos); renderTray();
    setTalkState('idle', 'Could not reach the assistant. Check your connection and tap to talk.');
    return;
  }
  if (!talking) return;
  if (data.noSpeech || !data.reply) {
    staged.unshift(...photos); renderTray();
    setTalkState('idle', 'I didn’t catch that. Tap to talk.');
    return;
  }
  const heard = String(data.heard || '').trim() || 'Voice message';
  addMessage('customer', heard, [], photos.map((photo) => photo.url));
  history.push({ role: 'customer', text: photos.length ? `${heard} [sent ${photos.length} photo${photos.length === 1 ? '' : 's'}]` : heard }, { role: 'bot', text: data.reply });
  addMessage('bot', data.reply, data.suggestions || []);
  talkHeard.textContent = heard;
  talkSaid.textContent = String(data.reply).replace(/\s+/g, ' ').slice(0, 220);
  setTalkState('speaking', 'Speaking… tap to interrupt');
  if (data.audio?.data) { talkNote.textContent = TALK_NOTE_V2; await playAnswer(data.audio); }
  else { talkNote.textContent = 'The answer is read with your phone’s own voice.'; await speakText(data.reply); }
  if (talking && talkState === 'speaking') listenVoice();
}

// The server cannot do voice to voice (or this phone cannot record it): use the older speech mode from now on.
function useOlderVoice() {
  voiceServerOk = false;
  talkNote.textContent = TALK_NOTE;
  talkLang.hidden = false;
  if (!Recognition) { talking = false; setTalkState('idle', 'Voice is not available on this phone. You can type your question.'); return; }
  listen();
}

const startListening = () => (useVoiceToVoice() ? listenVoice() : listen());

function startTalk() {
  openChat({ focus: false });
  talking = true;
  talkSaid.textContent = '';
  talkNote.textContent = useVoiceToVoice() ? TALK_NOTE_V2 : TALK_NOTE;
  // The new voice mode finds the language by itself; the language box is for the older mode only.
  talkLang.hidden = useVoiceToVoice();
  talkPanel.hidden = false;
  form.hidden = true;
  startListening();
}

function endTalk() {
  talking = false;
  stopVoice();
  recognizer?.abort();
  recognizer = null;
  window.speechSynthesis?.cancel();
  talkPanel.hidden = true;
  form.hidden = false;
  setTalkState('idle', 'Tap to talk');
}

if (voiceToVoice || (Recognition && window.speechSynthesis)) {
  const saved = readStore(TALK_LANG_KEY);
  const browser = (navigator.language || '').slice(0, 2);
  const preferred = saved || TALK_LANGS.find(([code]) => code.startsWith(browser) && browser !== 'en')?.[0] || 'te-IN';
  talkLang.replaceChildren(...TALK_LANGS.map(([code, label]) => {
    const option = element('option', '', label);
    option.value = code;
    option.selected = code === preferred;
    return option;
  }));
  talkSupported = true;
  talkButton.addEventListener('click', startTalk);
  document.querySelector('#talkEnd').addEventListener('click', endTalk);
  talkLang.addEventListener('change', () => {
    writeStore(TALK_LANG_KEY, talkLang.value);
    if (useVoiceToVoice()) return;
    if (talkState === 'listening') recognizer?.abort();
    else if (talking) listen();
  });
  talkOrb.addEventListener('click', () => {
    if (!talking) { talking = true; startListening(); return; }
    if (useVoiceToVoice()) {
      // Tapping while listening sends now; while speaking it interrupts and listens; while idle it starts.
      if (talkState === 'listening') capture?.stop('tapped');
      else if (talkState === 'speaking') { stopPlayback(); talkState = 'interrupted'; listenVoice(); }
      else if (talkState === 'idle') listenVoice();
      return;
    }
    if (talkState === 'listening') recognizer?.stop();
    else if (talkState === 'speaking') { talkState = 'interrupted'; listen(); }
    else if (talkState === 'idle') listen();
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  ask(input.value);
});
window.addEventListener('online', updateBanner);
window.addEventListener('offline', updateBanner);
// Some phones load their voices late.
window.speechSynthesis?.addEventListener?.('voiceschanged', () => {});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

loadShop();
