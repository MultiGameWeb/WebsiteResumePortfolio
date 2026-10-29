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
const shopId = params.get('s') || readStore(LAST_SHOP_KEY) || '';
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

function addMessage(role, text, suggestions = []) {
  const row = element('div', `msg msg-${role}`);
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

const photoUrl = (photoId) => `${API_BASE}/api/botcraft/photo?id=${encodeURIComponent(photoId)}`;

function showShop(shop) {
  document.title = `${shop.botName || shop.name} · ${shop.name}`;
  document.querySelector('#shopName').textContent = shop.name;
  document.querySelector('#botName').textContent = shop.botName || '';
  const hero = document.querySelector('#heroPhoto');
  hero.hidden = !shop.mainPhoto;
  if (shop.mainPhoto) { hero.src = photoUrl(shop.mainPhoto); hero.alt = shop.name; }
  document.querySelector('#shopMeta').textContent = [shop.type, shop.timings, shop.weeklyHoliday && `Holiday: ${shop.weeklyHoliday}`].filter(Boolean).join(' · ');
  const contacts = document.querySelector('#contactRow');
  contacts.replaceChildren();
  if (shop.call) contacts.append(contactLink('Call', `tel:${shop.call}`));
  if (shop.whatsapp) contacts.append(contactLink('WhatsApp', `https://wa.me/${whatsappNumber(shop.whatsapp)}`, true));
  if (shop.mapLink) contacts.append(contactLink('Directions', shop.mapLink, true));
}

function updateBanner() {
  banner.hidden = navigator.onLine;
}

function notFound(message) {
  document.querySelector('#shopName').textContent = 'Shop not found';
  addMessage('bot', message);
  form.hidden = true;
}

async function loadShop() {
  updateBanner();
  if (!shopId) { notFound('Please scan the QR code in the shop again to open its assistant.'); return; }
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/public?s=${encodeURIComponent(shopId)}`);
    const data = await response.json();
    if (response.status === 404) { notFound('Sorry, this shop’s assistant was not found. Please scan the QR code again or ask at the counter.'); return; }
    if (!response.ok || !data.ok) throw new Error(data.error || 'Unavailable');
    saved = { shop: data.shop, offline: data.offline };
    writeStore(DATA_KEY_PREFIX + shopId, JSON.stringify(saved));
  } catch {
    // No internet or server trouble: use the copy from the last visit.
    if (!saved) { notFound('Please connect to the internet (or the shop’s Wi-Fi) to open the assistant.'); return; }
  }
  showShop(saved.shop);
  setupTabs();
  addMessage('bot', `Hi! I'm ${saved.shop.botName || `the assistant of ${saved.shop.name}`}. Ask me about items, prices, offers or timings — in any language.`,
    navigator.onLine ? ['What do you sell?', 'Any offers today?', 'What are your timings?'] : OFFLINE_CHIPS);
}

// ---- Products and photos tabs ----

const tabs = document.querySelector('#tabs');
const panels = { products: document.querySelector('#productsPanel'), photos: document.querySelector('#photosPanel') };
const sheet = document.querySelector('#productSheet');
let sheetProduct = null;

function selectTab(name) {
  for (const button of tabs.querySelectorAll('[data-tab]')) button.setAttribute('aria-selected', String(button.dataset.tab === name));
  panels.products.hidden = name !== 'products';
  panels.photos.hidden = name !== 'photos';
  chat.hidden = name !== 'chat';
  form.hidden = name !== 'chat';
  if (name === 'chat') input.focus();
}

function renderProducts() {
  const query = document.querySelector('#productSearch').value.trim().toLowerCase();
  const items = (saved.offline?.items || []).filter((item) => !query || `${item.name} ${item.details} ${item.price}`.toLowerCase().includes(query));
  const grid = document.querySelector('#productGrid');
  if (!items.length) { grid.replaceChildren(element('p', 'empty', 'No products found.')); return; }
  grid.replaceChildren(...items.map((item) => {
    const card = element('button', 'product-card');
    card.type = 'button';
    if (item.photo) {
      const image = element('img');
      image.src = photoUrl(item.photo);
      image.alt = '';
      image.loading = 'lazy';
      card.append(image);
    } else card.append(element('span', 'product-no-photo', item.name.slice(0, 1).toUpperCase()));
    card.append(element('span', 'product-name', item.name));
    if (item.price) card.append(element('span', 'product-price', item.price));
    if (item.out) card.append(element('span', 'product-out', 'Out of stock'));
    card.addEventListener('click', () => openSheet(item));
    return card;
  }));
}

function openSheet(item) {
  sheetProduct = item;
  const image = document.querySelector('#sheetPhoto');
  image.hidden = !item.photo;
  if (item.photo) image.src = photoUrl(item.photo);
  document.querySelector('#sheetName').textContent = item.name;
  document.querySelector('#sheetPrice').textContent = [item.price, item.out ? 'Out of stock' : ''].filter(Boolean).join(' · ');
  document.querySelector('#sheetDetails').textContent = item.details || '';
  sheet.showModal();
}

function setupTabs() {
  const items = saved.offline?.items || [];
  const gallery = saved.shop.gallery || [];
  tabs.querySelector('[data-tab="products"]').hidden = !items.length;
  tabs.querySelector('[data-tab="photos"]').hidden = !gallery.length;
  tabs.hidden = !items.length && !gallery.length;
  if (items.length) renderProducts();
  document.querySelector('#photoGrid').replaceChildren(...gallery.map((photoId) => {
    const link = element('a', 'gallery-photo');
    link.href = photoUrl(photoId);
    link.target = '_blank';
    link.rel = 'noopener';
    const image = element('img');
    image.src = photoUrl(photoId);
    image.alt = `${saved.shop.name} photo`;
    image.loading = 'lazy';
    link.append(image);
    return link;
  }));
}

tabs.addEventListener('click', (event) => {
  const button = event.target.closest('[data-tab]');
  if (button) selectTab(button.dataset.tab);
});
document.querySelector('#productSearch').addEventListener('input', () => saved && renderProducts());
document.querySelector('#closeSheet').addEventListener('click', () => sheet.close());
sheet.addEventListener('click', (event) => { if (event.target === sheet) sheet.close(); });
document.querySelector('#askThis').addEventListener('click', () => {
  const item = sheetProduct;
  sheet.close();
  selectTab('chat');
  if (item) ask(`Tell me about ${item.name}`, item);
});

// ---- Offline answers: plain text search over the saved copy, no AI. ----

const words = (text) => String(text).toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((word) => word.length > 2);

function itemLine(item) {
  return `• ${item.name}${item.price ? ` — ${item.price}` : ''}${item.out ? ' (out of stock)' : ''}`;
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
    return 'I could not find that in the saved answers. Please ask at the counter, or try again with internet.';
  }
  return [...itemHits, ...faqHits].join('\n\n');
}

async function ask(text, product = null) {
  const question = String(text || '').trim();
  if (!question || busy) return;
  addMessage('customer', question);
  input.value = '';
  if (!navigator.onLine) {
    addMessage('bot', offlineAnswer(question), OFFLINE_CHIPS);
    return;
  }
  busy = true;
  send.disabled = true;
  const typing = addMessage('bot', '…');
  typing.classList.add('typing');
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s: shopId, text: question, history: history.slice(-HISTORY_LIMIT), product: product?.key || undefined }),
    });
    const data = await response.json();
    typing.remove();
    if (!response.ok || !data.ok) throw new Error(data.error);
    history.push({ role: 'customer', text: question }, { role: 'bot', text: data.reply });
    addMessage('bot', data.reply, data.suggestions || []);
  } catch {
    // No connection or the AI is busy: answer from the saved copy.
    typing.remove();
    addMessage('bot', `(Basic answer — AI not available right now)\n${offlineAnswer(question)}`, OFFLINE_CHIPS);
  } finally {
    busy = false;
    send.disabled = false;
    input.focus();
  }
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
