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
let hostedOffset = 0;
let callOffset = 0;
let callTimer = null;
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
const day = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
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
  for (const id of ['overview', 'bots', 'calls', 'hosted', 'sites']) $(`#${id}`).hidden = id !== name;
  if (name === 'overview') loadSummary();
  if (name === 'bots' && !$('#botRows').children.length) loadBots(true);
  if (name === 'sites' && !$('#siteRows').children.length) loadSites(true);
  if (name === 'hosted' && !$('#hostedRows').children.length) loadHosted(true);
  clearInterval(callTimer);
  if (name === 'calls') { loadCalls(true); callTimer = setInterval(() => loadCalls(true), 60000); }
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
      ...(data.hosted ? [['New call requests', data.hosted.callbacksNew], ['Hosting ending in 30 days', data.hosted.expiringSoon], ['Published sites', data.hosted.total], ['Published this week', data.hosted.newThisWeek], ['Sites switched off', data.hosted.blocked], ['Hosting storage', `${(data.hosted.sizeBytes / 1048576).toFixed(1)} MB`]] : []),
    ];
    $('#stats').replaceChildren(...tiles.map(([label, value]) => {
      const tile = element('div', 'stat');
      tile.append(element('span', '', label), element('strong', '', typeof value === 'string' ? value : number(value)));
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
    setCallBadge(data.hosted ? data.hosted.callbacksNew : 0);
    showStatus('');
  } catch (error) { showStatus(error.message); }
}

function setCallBadge(n) {
  const badge = $('#callBadge');
  badge.hidden = !n;
  badge.textContent = n ? String(n) : '';
  document.title = n ? `(${n}) SiteCraft Admin` : 'SiteCraft Admin';
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

// ---- Published sites (auto hosting) ----

async function loadHosted(reset) {
  if (reset) { hostedOffset = 0; $('#hostedRows').replaceChildren(); }
  try {
    const query = $('#hostedQuery').value.trim();
    const data = await api(`/api/admin/hosted?q=${encodeURIComponent(query)}&offset=${hostedOffset}`);
    const rows = data.sites.map((site) => {
      const row = element('tr');
      const live = site.status === 'live';
      const link = element('a', '', site.slug);
      link.href = site.url; link.target = '_blank'; link.rel = 'noopener';
      const address = element('td');
      address.append(link);
      const state = element('td');
      state.append(element('span', `pill ${live ? 'live' : 'paused'}`, live ? 'Live' : 'Switched off'));
      const toggle = element('button', live ? 'btn danger small' : 'btn small', live ? 'Switch off' : 'Switch on');
      toggle.type = 'button';
      toggle.addEventListener('click', async () => {
        if (live && !window.confirm(`Switch off ${site.business_name || site.slug}? Visitors will see that the website is not available.`)) return;
        toggle.disabled = true;
        try {
          await api('/api/admin/hosted', { method: 'POST', body: JSON.stringify({ slug: site.slug, action: live ? 'block' : 'unblock' }) });
          showStatus(live ? 'Website switched off.' : 'Website switched on.');
          loadHosted(true);
        } catch (error) { showStatus(error.message); toggle.disabled = false; }
      });
      const extend = element('button', 'btn small', 'Extend 1 year');
      extend.type = 'button';
      extend.addEventListener('click', async () => {
        if (!window.confirm(`Extend hosting for ${site.business_name || site.slug} by one year?`)) return;
        extend.disabled = true;
        try {
          const out = await api('/api/admin/hosted', { method: 'POST', body: JSON.stringify({ slug: site.slug, action: 'extend' }) });
          showStatus(`Hosting extended till ${day(out.expiresAt)}.`);
          loadHosted(true);
        } catch (error) { showStatus(error.message); extend.disabled = false; }
      });
      const action = element('td', 'row-actions');
      action.append(extend, toggle);
      const h = site.hosting || {};
      const till = element('td', h.state === 'active' ? '' : 'alert', day(h.expiresAt) + (h.state === 'grace' ? ' (grace week)' : h.state === 'ended' ? ' (ended)' : ''));
      row.append(
        element('td', 'shop-name', site.business_name || '(no name)'), address, element('td', '', site.template_id), state, till,
        element('td', 'num', `${(site.size_bytes / 1048576).toFixed(2)} MB`), element('td', '', when(site.created_at)), element('td', '', when(site.updated_at)), action,
      );
      return row;
    });
    if (reset && !rows.length) {
      const empty = element('tr');
      const cell = element('td', 'empty', query ? 'No published sites match this search.' : 'No websites published yet.');
      cell.colSpan = 9;
      empty.append(cell);
      rows.push(empty);
    }
    $('#hostedRows').append(...rows);
    hostedOffset += data.sites.length;
    $('#moreHosted').hidden = !data.more;
    showStatus('');
  } catch (error) { showStatus(error.message); }
}

// ---- Call requests ----

async function loadCalls(reset) {
  if (reset) callOffset = 0;
  try {
    const data = await api(`/api/admin/callbacks?status=${encodeURIComponent($('#callFilter').value)}&offset=${callOffset}`);
    const rows = data.requests.map((r) => {
      const row = element('tr', r.status === 'new' ? 'is-new' : '');
      const needs = [r.wants_domain ? 'Domain' : '', r.wants_online_payment ? 'Online payment' : '', r.note || ''].filter(Boolean).join(' + ');
      const phone = element('td');
      const digits = String(r.phone).replace(/[^\d]/g, '');
      const tel = element('a', '', r.phone); tel.href = `tel:${digits.length === 10 ? '+91' + digits : '+' + digits}`;
      const wa = element('a', 'wa', 'WhatsApp'); wa.href = `https://wa.me/${digits.length === 10 ? '91' + digits : digits}`; wa.target = '_blank'; wa.rel = 'noopener';
      phone.append(tel, document.createTextNode(' · '), wa);
      const site = element('td');
      site.append(document.createTextNode(r.template_id || '—'));
      if (r.site_url) { const a = element('a', '', ' ↗ site'); a.href = r.site_url; a.target = '_blank'; a.rel = 'noopener'; site.append(a); }
      const minutes = Math.round((Date.now() - Date.parse(r.created_at)) / 60000);
      const age = minutes < 60 ? `${minutes} min ago` : when(r.created_at);
      const state = element('td');
      state.append(element('span', `pill ${r.status === 'new' ? 'paused' : r.status === 'called' ? 'setup' : 'live'}`, r.status === 'new' ? 'New' : r.status === 'called' ? 'Called' : 'Done'));
      const actions = element('td', 'row-actions');
      for (const [status, label] of [['called', 'Mark called'], ['done', 'Mark done']]) {
        if (r.status === status) continue;
        const b = element('button', 'btn small', label); b.type = 'button';
        b.addEventListener('click', async () => {
          b.disabled = true;
          try { await api('/api/admin/callbacks', { method: 'POST', body: JSON.stringify({ id: r.id, status }) }); loadCalls(true); loadSummary(); }
          catch (error) { showStatus(error.message); b.disabled = false; }
        });
        actions.append(b);
      }
      row.append(element('td', minutes <= 20 && r.status === 'new' ? 'alert' : '', age), element('td', 'shop-name', `${r.name || '(no name)'}${r.business ? ' · ' + r.business : ''}`), phone, element('td', '', needs || '—'), site, state, actions);
      return row;
    });
    if (reset) $('#callRows').replaceChildren();
    if (reset && !rows.length) {
      const empty = element('tr'); const cell = element('td', 'empty', 'No call requests.'); cell.colSpan = 7; empty.append(cell); rows.push(empty);
    }
    $('#callRows').append(...rows);
    callOffset += data.requests.length;
    $('#moreCalls').hidden = !data.more;
    showStatus('');
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
$('#hostedSearch').addEventListener('submit', (event) => { event.preventDefault(); loadHosted(true); });
$('#moreHosted').addEventListener('click', () => loadHosted(false));
$('#callFilter').addEventListener('change', () => loadCalls(true));
$('#moreCalls').addEventListener('click', () => loadCalls(false));
$('#closeDrawer').addEventListener('click', () => $('#botDrawer').close());

apiBase = $('#apiBase').value || DEFAULT_API;
adminKey = read(sessionStorage, KEY_NAME) || read(localStorage, KEY_NAME);
if (adminKey) unlock();
