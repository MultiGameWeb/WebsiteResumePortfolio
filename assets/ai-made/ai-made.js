// "AI-made videos" on ai-ad-videos.html: sample videos from videos.json with
// type filters, and a brief form that opens the customer's requirement in
// WhatsApp, ready to send. The number is only ever put in the link, never
// shown on the page.
(function () {
  'use strict';

  const WHATSAPP = ['91', '79815', '87505'].join('');
  const $ = (selector) => document.querySelector(selector);
  const grid = $('#amGrid');
  if (!grid) return;
  const tabs = $('#amTabs');
  const kinds = $('#amKinds');
  const empty = $('#amEmpty');
  const typeSelect = $('#amType');
  const form = $('#amForm');
  const ref = $('#amRef');
  const refText = $('#amRefText');
  const errorLine = $('#amError');
  let reference = null;
  let data = { categories: [], videos: [] };
  let filter = 'all';

  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function openWhatsApp(message) {
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
  }

  // Sets the form from a type and, optionally, a sample video to match.
  function startBrief(categoryId, video) {
    if (categoryId) typeSelect.value = categoryId;
    reference = video || null;
    ref.hidden = !reference;
    refText.textContent = reference ? `Like: “${reference.title}”` : '';
    $('#amBrief').scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => $('#amDetails').focus({ preventScroll: true }), 450);
  }

  function renderTabs() {
    const used = new Set(data.videos.map((video) => video.category));
    const list = [{ id: 'all', name: 'All' }, ...data.categories.filter((category) => used.has(category.id))];
    tabs.hidden = data.videos.length === 0;
    tabs.replaceChildren(...list.map((category) => {
      const button = make('button', 'am-tab', category.name);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(category.id === filter));
      button.addEventListener('click', () => { filter = category.id; renderTabs(); renderGrid(); });
      return button;
    }));
  }

  function renderGrid() {
    const names = Object.fromEntries(data.categories.map((category) => [category.id, category.name]));
    const shown = data.videos.filter((video) => filter === 'all' || video.category === filter);
    grid.replaceChildren(...shown.map((video) => {
      const card = make('article', 'am-card');
      const player = document.createElement('video');
      player.src = video.src;
      if (video.poster) player.poster = video.poster;
      player.controls = true;
      player.playsInline = true;
      player.preload = 'none';
      player.title = video.title;
      const body = make('div', 'am-card-body');
      const meta = make('div', 'am-meta');
      meta.append(make('span', '', names[video.category] || video.category), make('span', '', video.length || ''));
      const ask = make('button', 'av-btn primary', 'Get a video like this ↗');
      ask.type = 'button';
      ask.addEventListener('click', () => startBrief(video.category, video));
      body.append(meta, make('h3', '', video.title));
      if (video.about) body.append(make('p', '', video.about));
      body.append(ask);
      card.append(player, body);
      return card;
    }));
    grid.hidden = shown.length === 0;
  }

  // The kinds of video we make; shown always, so there is something to tap
  // even before samples are added.
  function renderKinds() {
    kinds.replaceChildren(...data.categories.map((category) => {
      const tile = make('button', 'am-kind');
      tile.type = 'button';
      tile.append(make('i', '', category.icon || '🎬'), make('b', '', category.name), make('span', '', category.about || ''));
      tile.addEventListener('click', () => startBrief(category.id, null));
      return tile;
    }));
    typeSelect.replaceChildren(...data.categories.map((category) => { const option = make('option', '', category.name); option.value = category.id; return option; }), Object.assign(make('option', '', 'Something else'), { value: 'other' }));
  }

  function render() {
    renderKinds();
    renderTabs();
    renderGrid();
    empty.hidden = data.videos.length > 0;
    if (!empty.hidden) empty.textContent = 'Sample videos are being added here. Meanwhile, tap what you need below and tell us the details on WhatsApp.';
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const details = $('#amDetails').value.trim();
    if (details.length < 10) { errorLine.textContent = 'Please tell us a little more: the occasion, names or offer, and any date or place.'; $('#amDetails').focus(); return; }
    errorLine.textContent = '';
    const typeName = typeSelect.selectedOptions[0]?.textContent || 'AI video';
    const name = $('#amName').value.trim();
    const lines = [
      'Hi SiteCraft, I want an AI video.',
      `Type: ${typeName}`,
      `Language: ${$('#amLang').value} · Length: ${$('#amLen').value}`,
      name ? `Name: ${name}` : '',
      `Requirement: ${details}`,
      reference ? `Like this sample: “${reference.title}”` : '',
    ].filter(Boolean);
    openWhatsApp(lines.join('\n'));
  });
  $('#amRefClear').addEventListener('click', () => { reference = null; ref.hidden = true; });
  $('#amDetails').addEventListener('input', () => { errorLine.textContent = ''; });

  fetch('./assets/ai-made/videos.json', { cache: 'no-cache' })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error('videos'))))
    .then((loaded) => { data = { categories: loaded.categories || [], videos: loaded.videos || [] }; })
    .catch(() => { data = { categories: [{ id: 'ads', name: 'Ads' }, { id: 'promo', name: 'Promotional' }, { id: 'wedding', name: 'Wedding' }, { id: 'birthday', name: 'Birthday' }, { id: 'festival', name: 'Festival' }], videos: [] }; })
    .finally(render);
})();
