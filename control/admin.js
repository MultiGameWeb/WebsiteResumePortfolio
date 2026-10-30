// SiteCraft admin dashboard: reads totals, BotCraft bots and website sites
// from the Worker's /api/admin routes with the owner's admin key, and makes a
// few fixes (bot buttons, pausing a bot). The key stays in this browser only.
const DEFAULT_API = window.SITECRAFT_API_BASE || 'https://sitecraft-ai.kammarivinaykumar216.workers.dev';
const KEY_NAME = 'sitecraft:adminKey';
const API_NAME = 'sitecraft:adminApi';
const BOT_BASE = new URL('../salesbot/', window.location.href).href;
const FEATURES = [
  ['photo', '📸 Send a photo'], ['preorder', '⚡ Pre-order'], ['orderStatus', '🔍 Order status'],
  ['voice', '🎙️ Voice mode'], ['cart', '🛒 WhatsApp orders'],
];

const $ = (selector) => document.querySelector(selector);
const statusBox = $('#status');
let adminKey = '';
let apiBase = DEFAULT_API;
let botOffset = 0;
let siteOffset = 0;
let currentBot = null;

function read(storage, name) { try { return storage.getItem(name) || ''; } catch { return ''; } }
function write(storage, name, value) { try { if (value) storage.setItem(name, value); else storage.removeItem(name); } catch {} }

function showStatus(text) {
  statusBox.textContent = text;
  statusBox.hidden = !text;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = String(text);
  return node;
}

const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');
const number = (value) => (value === null || value === undefined ? '—' : Number(value).toLocaleString('en-IN'));

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${adminKey}`, ...(options.body ? { 'Content-Type': 'application/json' } : {}) },
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401) { lock('Wrong admin key.'); throw new Error('Wrong admin key.'); }
  if (!response.ok || !data.ok) throw new Error(data.error || `Request failed (${response.status}).`);
  return data;
}

function lock(message = '') {
  adminKey = '';
  write(localStorage, KEY_NAME, '');
  write(sessionStorage, KEY_NAME, '');
  $('#panels').hidden = true;
  $('#tabs').hidden = true;
  $('#login').hidden = false;
  showStatus(message);
}

function selectTab(name) {
  for (const button of document.querySelectorAll('#tabs [data-tab]')) button.setAttribute('aria-pressed', String(button.dataset.tab === name));
  for (const id of ['overview', 'bots', 'sites']) $(`#${id}`).hidden = id !== name;
  if (name === 'overview') loadSummary();
  if (name === 'bots' && !$('#botRows').children.length) loadBots(true);
  if (name === 'sites' && !$('#siteRows').children.length) loadSites(true);
}

// ---- Overview ----

async function loadSummary() {
  try {
    const data = await api('/api/admin/summary');
    const b = data.botcraft;
    const tiles = [
      ['BotCraft bots', b.bots], ['Live bots (QR ready)', b.live], ['New bots this week', b.newBots], ['Items added', b.products],
      ['Open customer questions', b.openQuestions], ['New customer requests', b.newRequests], ['Owner phones with alerts', b.ownerDevices],
      ['Websites', data.websites.sites], ['Website leads', data.websites.leads],
    ];
    $('#stats').replaceChildren(...tiles.map(([label, value]) => {
      const tile = element('div', 'stat');
      tile.append(element('span', '', label), element('strong', '', number(value)));
      return tile;
    }));
    const max = Math.max(1, ...b.types.map((t) => t.n));
    $('#types').replaceChildren(...(b.types.length ? b.types.map((t) => {
      const row = element('div', 'type-row');
      const bar = element('div', 'type-bar');
      bar.style.width = `${(t.n / max) * 100}%`;
      row.append(element('span', '', t.shop_type || '(not chosen yet)'), bar, element('span', 'num', number(t.n)));
      return row;
    }) : [element('p', 'empty', 'No bots yet.')]));
    showStatus('');
  } catch (error) { showStatus(error.message); }
}

// ---- Bots ----

function botState(bot) {
  if (bot.status === 'disabled') return ['Paused', 'paused'];
  return bot.public_id || bot.publicId ? ['Live', 'live'] : ['In setup', 'setup'];
}

async function loadBots(reset) {
  if (reset) { botOffset = 0; $('#botRows').replaceChildren(); }
  try {
    const query = $('#botQuery').value.trim();
    const data = await api(`/api/admin/bots?q=${encodeURIComponent(query)}&offset=${botOffset}`);
    const rows = data.bots.map((bot) => {
      const row = element('tr');
      const [label, tone] = botState(bot);
      const pill = element('span', `pill ${tone}`, label);
      const state = element('td');
      state.append(pill);
      const cells = [
        element('td', 'shop-name', bot.shop_name || '(no name yet)'), element('td', '', bot.shop_type || '—'), state,
        element('td', 'num', number(bot.answers)), element('td', 'num', number(bot.products)),
        element('td', `num${bot.open_questions ? ' alert' : ''}`, number(bot.open_questions)),
        element('td', `num${bot.new_requests ? ' alert' : ''}`, number(bot.new_requests)),
        element('td', '', when(bot.updated_at)),
      ];
      row.append(...cells);
      row.tabIndex = 0;
      row.addEventListener('click', () => openBot(bot.shop_id));
      row.addEventListener('keydown', (event) => { if (event.key === 'Enter') openBot(bot.shop_id); });
      return row;
    });
    if (reset && !rows.length) {
      const empty = element('tr');
      const cell = element('td', 'empty', query ? 'No bots match this search.' : 'No bots yet.');
      cell.colSpan = 8;
      empty.append(cell);
      rows.push(empty);
    }
    $('#botRows').append(...rows);
    botOffset += data.bots.length;
    $('#moreBots').hidden = !data.more;
    showStatus('');
  } catch (error) { showStatus(error.message); }
}

function definitionList(entries) {
  const list = element('dl', 'kv');
  for (const [key, value] of entries) list.append(element('dt', '', key), element('dd', '', value === '' || value === undefined ? '—' : value));
  return list;
}

function renderBot(bot) {
  currentBot = bot;
  $('#botTitle').textContent = bot.name || '(no name yet)';
  const body = $('#botBody');
  const [label, tone] = botState(bot);
  const link = bot.publicId ? `${BOT_BASE}?s=${bot.publicId}` : '';

  const summary = definitionList([
    ['Status', label], ['Business type', bot.type || '—'], ['Created', when(bot.createdAt)], ['Last change', when(bot.updatedAt)],
    ['Shop id (private)', bot.shopId], ['Public id', bot.publicId || 'Not live yet'], ['Questions answered', number(bot.answers)],
    ['Setup messages', number(bot.setupMessages)], ['Photos', Object.entries(bot.photos).map(([k, n]) => `${k}: ${n}`).join(', ') || 'none'],
  ]);
  const actions = element('div', 'actions');
  if (link) {
    const open = element('a', 'btn ghost', 'Open customer bot ↗');
    open.href = link; open.target = '_blank'; open.rel = 'noopener';
    actions.append(open);
  }
  const pause = element('button', tone === 'paused' ? 'btn' : 'btn danger', tone === 'paused' ? 'Resume bot' : 'Pause bot');
  pause.type = 'button';
  pause.addEventListener('click', () => {
    if (tone !== 'paused' && !window.confirm('Pause this bot? Customers will see that the assistant is not available until you resume it.')) return;
    updateBot({ action: 'set_status', status: tone === 'paused' ? 'draft' : 'disabled' });
  });
  actions.append(pause);

  const features = element('div', 'feature-list');
  for (const [key, name] of FEATURES) {
    const row = element('label', 'check');
    const box = element('input');
    box.type = 'checkbox';
    box.checked = Boolean(bot.features[key]);
    box.addEventListener('change', () => updateBot({ action: 'set_features', features: { [key]: box.checked } }));
    row.append(box, document.createTextNode(` ${name}`));
    features.append(row);
  }
  const featureNote = element('p', 'muted', 'What the customer bot shows now, including the defaults for this business type. A change here is the same as the owner changing it.');

  const facts = definitionList(Object.entries(bot.facts).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, typeof v === 'string' ? v : JSON.stringify(v)]));

  const list = (items, text) => {
    const box = element('div', 'list');
    if (!items.length) box.append(element('p', 'empty', 'None.'));
    for (const item of items) box.append(element('div', '', text(item)));
    return box;
  };
  body.replaceChildren(
    summary, actions,
    element('h3', '', 'Bot buttons'), features, featureNote,
    element('h3', '', `Items (${bot.products.length})`), list(bot.products, (p) => `${p.name} · ${p.price_text || 'no price'}${p.stock_status === 'out_of_stock' ? ' · out of stock' : ''}`),
    element('h3', '', 'Customer questions'), list(bot.questions, (q) => `${q.status === 'open' ? '❓' : q.status === 'answered' ? '✅' : '✖'} ${q.question} (${q.times}×)${q.answer ? ` → ${q.answer}` : ''}`),
    element('h3', '', 'Customer requests'), list(bot.requests, (r) => `${r.kind} #${r.code} · ${r.status} · ${r.message || ''}${r.reply ? ` → ${r.reply}` : ''}`),
    element('h3', '', 'Shop details (facts)'), facts,
  );
}

async function openBot(shopId) {
  try {
    const data = await api(`/api/admin/bot?id=${encodeURIComponent(shopId)}`);
    renderBot(data.bot);
    $('#botDrawer').showModal();
  } catch (error) { showStatus(error.message); }
}

async function updateBot(change) {
  try {
    const data = await api('/api/admin/bot', { method: 'POST', body: JSON.stringify({ id: currentBot.shopId, ...change }) });
    renderBot(data.bot);
    showStatus('Saved.');
    loadBots(true);
  } catch (error) { showStatus(error.message); }
}

// ---- Websites ----

async function loadSites(reset) {
  if (reset) { siteOffset = 0; $('#siteRows').replaceChildren(); }
  try {
    const data = await api(`/api/admin/sites?offset=${siteOffset}`);
    $('#sitesNote').textContent = data.configured ? (data.sites.length || siteOffset ? '' : 'No websites yet.') : 'The websites database (sitecraft-db) is not set up on the Worker yet.';
    $('#siteRows').append(...data.sites.map((site) => {
      const row = element('tr');
      row.append(
        element('td', 'shop-name', site.business_name || '(no name)'), element('td', '', site.id), element('td', '', site.status),
        element('td', 'num', number(site.plan_gb)), element('td', 'num', `${(site.storage_used_bytes / 1048576).toFixed(1)} MB`),
        element('td', '', when(site.storage_expires_at)), element('td', 'num', number(site.leads)), element('td', '', when(site.created_at)),
      );
      return row;
    }));
    siteOffset += data.sites.length;
    $('#moreSites').hidden = !data.more;
  } catch (error) { showStatus(error.message); }
}

// ---- Start ----

async function unlock() {
  try {
    await api('/api/admin/summary');
    $('#login').hidden = true;
    $('#panels').hidden = false;
    $('#tabs').hidden = false;
    selectTab('overview');
  } catch (error) {
    if (adminKey) showStatus(error.message);
  }
}

$('#apiBase').value = read(localStorage, API_NAME) || DEFAULT_API;
$('#loginForm').addEventListener('submit', (event) => {
  event.preventDefault();
  adminKey = $('#adminKey').value.trim();
  apiBase = $('#apiBase').value.trim().replace(/\/+$/, '') || DEFAULT_API;
  write(localStorage, API_NAME, apiBase === DEFAULT_API ? '' : apiBase);
  write($('#rememberKey').checked ? localStorage : sessionStorage, KEY_NAME, adminKey);
  $('#adminKey').value = '';
  showStatus('Checking…');
  unlock();
});
$('#tabs').addEventListener('click', (event) => {
  const button = event.target.closest('[data-tab]');
  if (button) selectTab(button.dataset.tab);
});
$('#signOut').addEventListener('click', () => lock('Locked.'));
$('#botSearch').addEventListener('submit', (event) => { event.preventDefault(); loadBots(true); });
$('#moreBots').addEventListener('click', () => loadBots(false));
$('#moreSites').addEventListener('click', () => loadSites(false));
$('#closeDrawer').addEventListener('click', () => $('#botDrawer').close());

apiBase = $('#apiBase').value || DEFAULT_API;
adminKey = read(sessionStorage, KEY_NAME) || read(localStorage, KEY_NAME);
if (adminKey) unlock();
