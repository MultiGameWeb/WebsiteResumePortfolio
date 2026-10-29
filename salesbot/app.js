// The customer side of BotCraft: the shop's AI salesman, opened from the QR
// poster. ?s=<publicId> picks the shop; the last shop is remembered so the
// installed app (PWA) opens it again.
const API_BASE = window.SALESBOT_API_BASE || 'https://sitecraft-ai.kammarivinaykumar216.workers.dev';
const LAST_SHOP_KEY = 'salesbot:lastShop';
const HISTORY_LIMIT = 12;

const chat = document.querySelector('#chat');
const form = document.querySelector('#composer');
const input = document.querySelector('#input');
const send = document.querySelector('#send');

function storage(action, value) {
  try {
    if (action === 'get') return localStorage.getItem(LAST_SHOP_KEY);
    localStorage.setItem(LAST_SHOP_KEY, value);
  } catch {}
  return null;
}

const params = new URLSearchParams(window.location.search);
const shopId = params.get('s') || storage('get') || '';
if (params.get('s')) storage('set', shopId);

const history = [];
let busy = false;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function addMessage(role, text, suggestions = []) {
  const row = element('div', `msg msg-${role}`);
  row.append(element('p', 'bubble', text));
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

async function loadShop() {
  if (!shopId) {
    document.querySelector('#shopName').textContent = 'Shop not found';
    addMessage('bot', 'Please scan the QR code in the shop again to open its salesman.');
    form.hidden = true;
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/public?s=${encodeURIComponent(shopId)}`);
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || 'Not found');
    const shop = data.shop;
    document.title = `${shop.name} · AI salesman`;
    document.querySelector('#shopName').textContent = shop.name;
    document.querySelector('#shopMeta').textContent = [shop.type, shop.timings, shop.weeklyHoliday && `Holiday: ${shop.weeklyHoliday}`].filter(Boolean).join(' · ');
    const contacts = document.querySelector('#contactRow');
    if (shop.call) contacts.append(contactLink('Call', `tel:${shop.call}`));
    if (shop.whatsapp) contacts.append(contactLink('WhatsApp', `https://wa.me/${whatsappNumber(shop.whatsapp)}`, true));
    if (shop.mapLink) contacts.append(contactLink('Directions', shop.mapLink, true));
    addMessage('bot', `Hi! I'm the AI salesman of ${shop.name}. Ask me about items, prices, offers or timings — in any language.`,
      ['What do you sell?', 'Any offers today?', 'What are your timings?']);
  } catch {
    document.querySelector('#shopName').textContent = 'Shop not found';
    addMessage('bot', 'Sorry, this shop’s salesman could not be opened. Please scan the QR code again or ask at the counter.');
    form.hidden = true;
  }
}

async function ask(text) {
  const question = String(text || '').trim();
  if (!question || busy) return;
  busy = true;
  send.disabled = true;
  input.value = '';
  addMessage('customer', question);
  const typing = addMessage('bot', '…');
  typing.classList.add('typing');
  try {
    const response = await fetch(`${API_BASE}/api/botcraft/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ s: shopId, text: question, history: history.slice(-HISTORY_LIMIT) }),
    });
    const data = await response.json();
    typing.remove();
    if (!response.ok || !data.ok) throw new Error(data.error);
    history.push({ role: 'customer', text: question }, { role: 'bot', text: data.reply });
    addMessage('bot', data.reply, data.suggestions || []);
  } catch (error) {
    typing.remove();
    addMessage('bot', error?.message || 'Sorry, I could not answer right now. Please try again or ask at the counter.');
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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

loadShop();
