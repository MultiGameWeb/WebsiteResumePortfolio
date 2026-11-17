// AI Text to Voice page. Talks to the Worker routes in backend/sitecraft-ai/voice-studio.js.
(function () {
  'use strict';
  const API = (window.SITECRAFT_API_BASE || 'https://sitecraft-ai.kammarivinaykumar216.workers.dev').replace(/\/+$/, '') + '/api/voice/';
  const WALLET_KEY = 'sc_voice_wallet';
  const ORDER_KEY = 'sc_voice_last_order';
  const $ = (sel) => document.querySelector(sel);

  const store = {
    get(key) { try { return localStorage.getItem(key) || ''; } catch { return ''; } },
    set(key, value) { try { value ? localStorage.setItem(key, value) : localStorage.removeItem(key); } catch {} },
  };

  // Shown before the config loads, and if it cannot load.
  const FALLBACK = {
    enabled: false, textTools: false, freeWords: 300, maxWordsPerGeneration: 800, payments: false,
    styles: [
      { id: 'normal', label: 'Normal' }, { id: 'narration', label: 'Narration' }, { id: 'news', label: 'News' },
      { id: 'conversational', label: 'Conversational', acting: true }, { id: 'emotional', label: 'Emotional', acting: true },
      { id: 'comedy', label: 'Comedy', acting: true }, { id: 'motivational', label: 'Motivational', acting: true },
      { id: 'whisper', label: 'Whisper', acting: true },
    ],
    dialects: [{ id: 'none', label: 'Standard' }, { id: 'telangana', label: 'Telangana' }, { id: 'andhra', label: 'Godavari / Coastal Andhra' }, { id: 'rayalaseema', label: 'Rayalaseema' }, { id: 'hyderabadi', label: 'Hyderabadi' }],
    currency: 'INR',
    packs: [
      { id: 'w1k', words: 1000, amount: 4900, currency: 'INR', label: '1K words' }, { id: 'w2k', words: 2000, amount: 7900, currency: 'INR', label: '2K words' },
      { id: 'w5k', words: 5000, amount: 17900, currency: 'INR', label: '5K words', badge: 'Most popular' },
      { id: 'w10k', words: 10000, amount: 34900, currency: 'INR', label: '10K words' }, { id: 'w25k', words: 25000, amount: 84900, currency: 'INR', label: '25K words', badge: 'Best value' },
    ],
  };

  const state = { config: FALLBACK, token: store.get(WALLET_KEY), words: null, urls: [], job: null, running: false, stop: false, lastText: '', undoText: '' };
  // ~5–6 minutes of speech per part; must stay under the server's 800-word limit.
  const PART_WORDS = 750;
  const AUTO_RETRIES = 3;

  // Same rule as the server: each word once, and 8 letters count as at least one word.
  function billableWords(text) {
    const t = String(text || '').trim();
    if (!t) return 0;
    const words = t.split(/\s+/).filter(Boolean).length;
    const letters = t.replace(/\s+/g, '').length;
    return Math.max(words, Math.ceil(letters / 8));
  }

  async function post(action, body) {
    const response = await fetch(API + action, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body || {}) });
    const data = await response.json().catch(() => ({ ok: false, error: 'Unexpected reply from the server.' }));
    return { status: response.status, ...data };
  }

  function say(el, text, kind) {
    el.textContent = text || '';
    el.classList.toggle('error', kind === 'error');
    el.classList.toggle('ok', kind === 'ok');
  }
  const status = (text, kind) => say($('#status'), text, kind);
  const payStatus = (text, kind) => say($('#payStatus'), text, kind);

  function setWords(words) {
    state.words = Number.isFinite(Number(words)) ? Number(words) : null;
    $('#wordsLeft').textContent = state.words === null ? '—' : state.words.toLocaleString('en-IN');
    updateCount();
  }

  function setToken(token) {
    state.token = token;
    store.set(WALLET_KEY, token);
    $('#walletCode').textContent = token || '—';
  }

  // ---------- render ----------

  function renderStyles() {
    const box = $('#styles');
    const current = box.querySelector('input:checked')?.value || 'normal';
    box.innerHTML = '';
    let group = null;
    let grid = null;
    state.config.styles.forEach((s) => {
      if (!grid || (s.group || '') !== group) {
        group = s.group || '';
        if (group) {
          const head = document.createElement('p');
          head.className = 'vs-style-group';
          head.textContent = group;
          box.append(head);
        }
        grid = document.createElement('div');
        grid.className = 'vs-styles';
        box.append(grid);
      }
      const label = document.createElement('label');
      label.className = 'vs-style';
      const input = Object.assign(document.createElement('input'), { type: 'radio', name: 'style', value: s.id, checked: s.id === current });
      const span = document.createElement('span');
      span.append(s.label);
      const small = document.createElement('small');
      small.textContent = s.note || '';
      span.append(small);
      label.append(input, span);
      grid.append(label);
    });
  }

  function renderDialects() {
    const select = $('#dialect');
    const current = select.value || 'none';
    select.innerHTML = '';
    const groups = new Map();
    state.config.dialects.forEach((d) => {
      const option = new Option(d.label, d.id, false, d.id === current);
      if (!d.group) { select.append(option); return; }
      if (!groups.has(d.group)) {
        const og = document.createElement('optgroup');
        og.label = d.group;
        groups.set(d.group, og);
        select.append(og);
      }
      groups.get(d.group).append(option);
    });
  }

  // amount is in the smallest unit of the currency (1/100).
  function money(amount, currency) {
    const value = amount / 100;
    try {
      return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en', { style: 'currency', currency, minimumFractionDigits: currency === 'INR' ? 0 : 2, maximumFractionDigits: 2 }).format(value);
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
  }

  function renderPacks() {
    const grid = $('#packGrid');
    grid.innerHTML = '';
    const base = state.config.packs[0];
    const basePer1k = base ? base.amount / (base.words / 1000) : 0;
    state.config.packs.forEach((p) => {
      const per1k = p.amount / (p.words / 1000);
      const save = basePer1k && per1k < basePer1k ? Math.round((1 - per1k / basePer1k) * 100) : 0;
      const card = document.createElement('div');
      card.className = 'vs-pack' + (p.badge === 'Most popular' ? ' hot' : '');
      card.innerHTML = (p.badge ? '<span class="badge"></span>' : '') + '<h3></h3><div class="price"></div><div class="per"></div><div class="save"></div><button type="button" class="vs-btn primary">Buy</button>';
      if (p.badge) card.querySelector('.badge').textContent = p.badge;
      card.querySelector('h3').textContent = p.label;
      card.querySelector('.price').textContent = money(p.amount, p.currency);
      card.querySelector('.per').textContent = money(Math.round(per1k), p.currency) + ' per 1K words';
      card.querySelector('.save').textContent = save ? `Save ${save}%` : '';
      const button = card.querySelector('button');
      button.dataset.pack = p.id;
      button.setAttribute('aria-label', `Buy ${p.label} for ${money(p.amount, p.currency)}`);
      button.addEventListener('click', () => buy(p, button));
      grid.append(card);
    });
  }

  const fmt = (n) => Number(n).toLocaleString('en-IN');

  function updateCount() {
    const text = $('#script').value;
    const words = billableWords(text);
    const parts = words ? splitParts(text).length : 0;
    const info = $('#wordInfo');
    info.textContent = !words ? '0 words' : parts > 1 ? `${fmt(words)} words · ${parts} parts (~5–6 min each)` : `${fmt(words)} word${words === 1 ? '' : 's'}`;
    const btn = $('#generateBtn');
    if (state.running) return;
    btn.textContent = !words ? '🎙️ Make voice' : parts > 1 ? `🎙️ Make ${parts} parts · uses ${fmt(words)} words` : `🎙️ Make voice · uses ${fmt(words)} word${words === 1 ? '' : 's'}`;
    btn.disabled = !state.config.enabled || !words;
  }

  function applyConfig() {
    const c = state.config;
    $('#freeWordsChip').textContent = c.freeWords;
    renderStyles();
    renderDialects();
    renderPacks();
    $('#textTools').hidden = !c.textTools;
    const banner = $('#offBanner');
    banner.hidden = c.enabled;
    banner.textContent = c.enabled ? '' : 'Text to Voice is opening very soon. You can try the page now; making voices will switch on shortly.';
    updateCount();
  }

  // ---------- wallet ----------

  async function loadWallet(token) {
    const result = await post('wallet', { token });
    if (!result.ok) { setWords(null); return false; }
    setToken(result.token);
    setWords(result.words);
    if (result.isNew && result.freeGiven) status(`Welcome! ${result.words} free words are added. Try it now.`, 'ok');
    return true;
  }

  async function init() {
    renderStyles(); renderDialects(); renderPacks(); updateCount();
    $('#walletCode').textContent = state.token || '—';
    try {
      const response = await fetch(API + 'config');
      const config = await response.json();
      if (config.ok) state.config = { ...FALLBACK, ...config };
    } catch {}
    applyConfig();
    if (state.config.enabled) {
      try { await loadWallet(state.token); } catch { setWords(null); status('Could not reach the server. Please check your internet.', 'error'); }
    } else {
      setWords(null);
    }
  }

  // ---------- actions ----------

  const selected = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;

  // ---------- long scripts: split into ~5–6 minute parts ----------

  // Splits at sentence ends (then spaces) so each part stays under PART_WORDS.
  function splitParts(text) {
    const t = String(text || '').trim();
    if (!t) return [];
    if (billableWords(t) <= state.config.maxWordsPerGeneration) return [t];
    const limit = PART_WORDS;
    const sentences = t.match(/[^.!?।॥\n]+[.!?।॥]*\s*|\n+/g) || [t];
    const pieces = [];
    sentences.forEach((sentence) => {
      if (billableWords(sentence) <= limit) { pieces.push(sentence); return; }
      let current = '';
      sentence.split(/(\s+)/).forEach((w) => {
        if (current && billableWords(current + w) > limit) { pieces.push(current); current = ''; }
        current += w;
      });
      if (current) pieces.push(current);
    });
    const parts = [];
    let current = '';
    pieces.forEach((piece) => {
      if (current.trim() && billableWords(current + piece) > limit) { parts.push(current.trim()); current = ''; }
      current += piece;
    });
    if (current.trim()) parts.push(current.trim());
    return parts.filter((p) => billableWords(p) > 0);
  }

  function fileBase() {
    const raw = ($('#fileName').value || '').trim() || 'voice';
    return raw.replace(/\.wav$/i, '').replace(/[\\/:*?"<>|#%]+/g, '').replace(/\s+/g, '-').slice(0, 60) || 'voice';
  }

  function partRow(job, index) {
    const row = document.createElement('div');
    row.className = 'vs-part';
    row.innerHTML = '<div class="vs-part-head"><strong></strong><span class="vs-part-state"></span></div><audio controls preload="none" hidden></audio><a class="vs-btn small" hidden>⬇ Download</a>';
    row.querySelector('strong').textContent = job.parts.length > 1 ? `Part ${index + 1} of ${job.parts.length}` : 'Your voice';
    return row;
  }

  function setPartState(job, index, text, kind) {
    const el = job.rows[index].querySelector('.vs-part-state');
    el.textContent = text;
    el.className = 'vs-part-state' + (kind ? ' ' + kind : '');
  }

  async function makePart(job, index) {
    const part = job.parts[index];
    let response;
    try {
      response = await fetch(API + 'generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: state.token, text: part.text, style: job.style, voice: job.voice, dialect: job.dialect }),
      });
    } catch {
      throw Object.assign(new Error('Could not reach the server.'), { code: 'NETWORK' });
    }
    const type = response.headers.get('Content-Type') || '';
    if (!response.ok || !type.includes('audio')) {
      const data = await response.json().catch(() => ({}));
      if (data.code === 'NO_WORDS') setWords(data.words);
      throw Object.assign(new Error(data.error || 'The voice could not be made.'), { code: data.code });
    }
    const blob = await response.blob();
    part.url = URL.createObjectURL(blob);
    state.urls.push(part.url);
    const row = job.rows[index];
    const audio = row.querySelector('audio');
    audio.src = part.url;
    audio.hidden = false;
    const link = row.querySelector('a');
    link.href = part.url;
    link.download = part.fileName;
    link.textContent = `⬇ ${part.fileName}`;
    link.hidden = false;
    setWords(response.headers.get('X-Words-Left'));
    setPartState(job, index, 'Ready ✓', 'ok');
    audio.addEventListener('loadedmetadata', () => {
      const m = Math.floor(audio.duration / 60);
      const sec = String(Math.round(audio.duration % 60)).padStart(2, '0');
      if (Number.isFinite(audio.duration)) setPartState(job, index, `Ready ✓ ${m}:${sec}`, 'ok');
    }, { once: true });
    part.done = true;
  }

  async function runJob(job) {
    state.running = true;
    state.stop = false;
    $('#continueBtn').hidden = true;
    $('#stopBtn').hidden = job.parts.length < 2;
    const btn = $('#generateBtn');
    btn.disabled = true;
    try {
      for (let i = 0; i < job.parts.length; i += 1) {
        const part = job.parts[i];
        if (part.done) continue;
        if (state.stop) { status(`Stopped. ${job.parts.filter((p) => p.done).length} of ${job.parts.length} parts are ready.`, 'error'); showContinue(job); return; }
        const label = job.parts.length > 1 ? `Making part ${i + 1} of ${job.parts.length}…` : 'Making your voice…';
        btn.textContent = '⏳ ' + label;
        status(label + ' This can take 10–60 seconds.');
        setPartState(job, i, 'Making…');
        try {
          await makePart(job, i);
          if (i === 0) job.rows[0].querySelector('audio').play().catch(() => {});
          part.retries = 0;
        } catch (error) {
          // Busy or a hiccup: wait and try the same part again, up to 3 times.
          if ((error.code === 'BUSY' || error.code === 'FAILED' || error.code === 'NETWORK') && (part.retries || 0) < AUTO_RETRIES && !state.stop) {
            part.retries = (part.retries || 0) + 1;
            const wait = error.code === 'BUSY' ? 30 : 15;
            for (let left = wait; left > 0 && !state.stop; left -= 1) {
              setPartState(job, i, `Retrying in ${left}s`);
              status(`Part ${i + 1} hit a hiccup. Trying again automatically in ${left}s (try ${part.retries} of ${AUTO_RETRIES})…`);
              await new Promise((r) => setTimeout(r, 1000));
            }
            i -= 1; // run this part again
            continue;
          }
          setPartState(job, i, 'Not made', 'error');
          status(error.code === 'NO_WORDS'
            ? `Words finished at part ${i + 1}. Buy a pack, then tap “Continue”.`
            : `${error.message || 'Part ' + (i + 1) + ' failed.'} Tap “Continue” to try again from part ${i + 1}.`, 'error');
          showContinue(job);
          if (error.code === 'NO_WORDS') $('#packs').scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      const total = job.parts.reduce((sum, p) => sum + p.words, 0);
      status(job.parts.length > 1 ? `All ${job.parts.length} parts are ready ✓ Used ${fmt(total)} words.` : `Done ✓ Used ${fmt(total)} words.`, 'ok');
      $('#downloadAll').hidden = job.parts.length < 2;
      $('#mergeBtn').hidden = job.parts.length < 2;
    } finally {
      state.running = false;
      $('#stopBtn').hidden = true;
      updateCount();
    }
  }

  function showContinue(job) {
    state.job = job;
    $('#continueBtn').hidden = false;
  }

  async function generate() {
    const text = $('#script').value.trim();
    if (!text) { status('Please type or paste some text first.', 'error'); return; }
    const texts = splitParts(text);
    const total = texts.reduce((sum, t) => sum + billableWords(t), 0);
    if (state.words !== null && total > state.words) {
      let fitCount = 0;
      texts.reduce((sum, t) => { sum += billableWords(t); if (sum <= state.words) fitCount += 1; return sum; }, 0);
      const fit = texts.length > 1 && fitCount ? ` (enough for ${fitCount} part${fitCount === 1 ? '' : 's'})` : '';
      status(`This needs ${fmt(total)} words but you have ${fmt(state.words)}${fit}. Buy a pack below to continue.`, 'error');
      $('#packs').scrollIntoView({ behavior: 'smooth' });
      return;
    }
    state.urls.forEach((u) => URL.revokeObjectURL(u));
    state.urls = [];
    const base = fileBase();
    const job = {
      style: selected('style'), voice: selected('voice'), dialect: $('#dialect').value,
      parts: texts.map((t, i) => ({ text: t, words: billableWords(t), done: false, fileName: texts.length > 1 ? `${base}-${i + 1}.wav` : `${base}.wav` })),
      rows: [],
    };
    const list = $('#parts');
    list.innerHTML = '';
    job.parts.forEach((p, i) => { const row = partRow(job, i); job.rows.push(row); list.append(row); setPartState(job, i, 'Waiting'); });
    $('#result').hidden = false;
    $('#reportForm').hidden = true;
    $('#downloadAll').hidden = true;
    $('#mergeBtn').hidden = true;
    $('#mergedBox').hidden = true;
    state.lastText = text.slice(0, 2000);
    state.job = job;
    await runJob(job);
  }

  // ---------- merge parts into one WAV (in the browser, free) ----------

  function readWav(buffer) {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    const tag = (at) => String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]);
    if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('not wav');
    let at = 12;
    let fmt = null;
    while (at + 8 <= bytes.length) {
      const id = tag(at);
      let size = view.getUint32(at + 4, true);
      const start = at + 8;
      if (id === 'fmt ') fmt = { audioFormat: view.getUint16(start, true), channels: view.getUint16(start + 2, true), sampleRate: view.getUint32(start + 4, true), bitsPerSample: view.getUint16(start + 14, true) };
      if (id === 'data' && fmt) {
        if (start + size > bytes.length) size = bytes.length - start;
        return { ...fmt, data: bytes.subarray(start, start + size) };
      }
      at = start + size + (size % 2);
    }
    throw new Error('no data');
  }

  function buildWav(parts, gapMs) {
    const { audioFormat, channels, sampleRate, bitsPerSample } = parts[0];
    if (parts.some((p) => p.sampleRate !== sampleRate || p.channels !== channels || p.bitsPerSample !== bitsPerSample)) throw new Error('format');
    const block = channels * (bitsPerSample / 8);
    const gap = Math.round((sampleRate * gapMs) / 1000) * block;
    const size = parts.reduce((sum, p) => sum + p.data.length, 0) + gap * (parts.length - 1);
    const header = new ArrayBuffer(44);
    const v = new DataView(header);
    const w = (at, t) => { for (let i = 0; i < 4; i += 1) v.setUint8(at + i, t.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + size, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, audioFormat, true); v.setUint16(22, channels, true);
    v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * block, true);
    v.setUint16(32, block, true); v.setUint16(34, bitsPerSample, true); w(36, 'data'); v.setUint32(40, size, true);
    const pieces = [header];
    const silence = new Uint8Array(gap);
    parts.forEach((p, i) => { pieces.push(p.data); if (i < parts.length - 1) pieces.push(silence); });
    return new Blob(pieces, { type: 'audio/wav' });
  }

  async function mergeParts() {
    const job = state.job;
    if (!job || job.parts.some((p) => !p.url)) { status('All parts must be ready before merging.', 'error'); return; }
    const btn = $('#mergeBtn');
    btn.disabled = true;
    status('Joining all parts into one file…');
    try {
      const parts = [];
      for (const part of job.parts) parts.push(readWav(await (await fetch(part.url)).arrayBuffer()));
      const blob = buildWav(parts, 400);
      const url = URL.createObjectURL(blob);
      state.urls.push(url);
      const name = `${fileBase()}-full.wav`;
      const box = $('#mergedBox');
      box.querySelector('audio').src = url;
      const link = box.querySelector('a');
      link.href = url;
      link.download = name;
      link.textContent = `⬇ ${name}`;
      box.hidden = false;
      status(`Merged ✓ One file with all ${parts.length} parts (${(blob.size / 1048576).toFixed(1)} MB).`, 'ok');
    } catch {
      status('Could not join the parts on this device. Please download them one by one.', 'error');
    } finally {
      btn.disabled = false;
    }
  }

  async function downloadAll() {
    const job = state.job;
    if (!job) return;
    for (const part of job.parts.filter((p) => p.url)) {
      const a = Object.assign(document.createElement('a'), { href: part.url, download: part.fileName });
      document.body.append(a); a.click(); a.remove();
      await new Promise((r) => setTimeout(r, 700));
    }
  }

  async function textTool(action, button) {
    const text = $('#script').value.trim();
    if (!text) { status('Please type or paste some text first.', 'error'); return; }
    if (text.length > 8000) { status('Text tools work on about 1,000 words at a time. Paste a shorter part, use the tool, then add the rest.', 'error'); return; }
    button.disabled = true;
    status(action === 'rewrite' ? 'Making it sound spoken…' : 'Translating…');
    try {
      const result = await post(action, { token: state.token, text, dialect: $('#dialect').value, to: $('#translateTo').value });
      if (!result.ok) { status(result.error || 'Could not do that right now.', 'error'); return; }
      state.undoText = $('#script').value;
      $('#script').value = result.text;
      $('#undoBtn').hidden = false;
      updateCount();
      status('Done ✓ Check the text, then make the voice.', 'ok');
    } catch {
      status('Could not reach the server. Please try again.', 'error');
    } finally {
      button.disabled = false;
    }
  }

  async function report(event) {
    event.preventDefault();
    const result = await post('report', { token: state.token, reason: $('#reportReason').value, text: state.lastText }).catch(() => ({ ok: false }));
    $('#reportForm').hidden = true;
    status(result.ok ? 'Thanks. We will review this voice.' : 'Could not send the report. Please try again.', result.ok ? 'ok' : 'error');
  }

  function loadCheckout() {
    if (window.Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = resolve;
      script.onerror = () => reject(new Error('checkout'));
      document.head.append(script);
    });
  }

  function whatsappBuy(pack) {
    payStatus('Online payment starts very soon. To buy words today, ', 'error');
    const link = Object.assign(document.createElement('a'), {
      href: 'https://wa.me/917981587505?text=' + encodeURIComponent(`Hi SiteCraft, I want to buy the Text to Voice ${pack.label} pack (${money(pack.amount, pack.currency)}). My wallet code: ${state.token}`),
      target: '_blank', rel: 'noopener noreferrer', textContent: 'message us on WhatsApp ↗',
    });
    link.style.color = '#fcd34d';
    $('#payStatus').append(link);
  }

  async function buy(pack, button) {
    if (!state.token) { payStatus('Please reload the page and try again.', 'error'); return; }
    button.disabled = true;
    payStatus('Opening payment…');
    try {
      const order = await post('order', { token: state.token, pack: pack.id });
      if (order.ok && order.test) {
        setWords(order.words);
        payStatus(`Test purchase ✓ Added ${fmt(order.added)} words, no money charged. You now have ${fmt(order.words)} words.`, 'ok');
        return;
      }
      if (order.code === 'PAYMENTS_OFF') { whatsappBuy(pack); return; }
      if (!order.ok) { payStatus(order.error || 'Payments are not available right now.', 'error'); return; }
      store.set(ORDER_KEY, order.orderId);
      await loadCheckout();
      new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId,
        name: 'SiteCraft', description: `Text to Voice · ${pack.label}`,
        handler: async (r) => {
          payStatus('Confirming your payment…');
          const done = await post('verify', { token: state.token, orderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
          if (done.ok) { setWords(done.words); store.set(ORDER_KEY, ''); payStatus(`Payment received ✓ You now have ${done.words.toLocaleString('en-IN')} words.`, 'ok'); return; }
          payStatus(done.error || 'We could not confirm the payment. Tap “I paid but words did not come”.', 'error');
        },
        modal: { ondismiss: () => payStatus('') },
        theme: { color: '#f59e0b' },
      }).open();
    } catch {
      payStatus('Payment could not start. Please check your internet and try again.', 'error');
    } finally {
      button.disabled = false;
    }
  }

  async function recover() {
    const orderId = store.get(ORDER_KEY);
    if (!orderId) { payStatus('No recent payment found on this device. Please send your payment details on WhatsApp.', 'error'); return; }
    payStatus('Checking your payment…');
    try {
      const result = await post('recover', { token: state.token, orderId });
      if (result.ok) { setWords(result.words); store.set(ORDER_KEY, ''); payStatus(`Found your payment ✓ You have ${result.words.toLocaleString('en-IN')} words.`, 'ok'); return; }
      payStatus(result.error || 'No payment found yet.', 'error');
    } catch { payStatus('Could not reach the server. Please try again.', 'error'); }
  }

  async function useCode() {
    const code = $('#useCode').value.trim().toLowerCase();
    if (!/^[a-f0-9]{32}$/.test(code)) { status('A wallet code has 32 letters and numbers. Please check it.', 'error'); return; }
    try {
      const result = await post('wallet', { token: code, lookupOnly: true });
      if (result.ok) {
        setToken(code); setWords(result.words); $('#useCode').value = '';
        status(`Wallet switched ✓ ${result.words} words.`, 'ok');
      } else {
        status(result.error || 'That code was not found.', 'error');
      }
    } catch { status('Could not reach the server. Please try again.', 'error'); }
  }

  // ---------- events ----------

  $('#script').addEventListener('input', updateCount);
  $('#generateBtn').addEventListener('click', generate);
  $('#stopBtn').addEventListener('click', () => { state.stop = true; status('Stopping after this part…'); });
  $('#continueBtn').addEventListener('click', () => { if (state.job && !state.running) { state.job.parts.forEach((p) => { p.retries = 0; }); runJob(state.job); } });
  $('#downloadAll').addEventListener('click', downloadAll);
  $('#mergeBtn').addEventListener('click', mergeParts);
  $('#rewriteBtn').addEventListener('click', (e) => textTool('rewrite', e.currentTarget));
  $('#translateBtn').addEventListener('click', (e) => textTool('translate', e.currentTarget));
  $('#undoBtn').addEventListener('click', () => { $('#script').value = state.undoText; $('#undoBtn').hidden = true; updateCount(); status(''); });
  $('#reportToggle').addEventListener('click', () => { const f = $('#reportForm'); f.hidden = !f.hidden; });
  $('#reportForm').addEventListener('submit', report);
  $('#recoverBtn').addEventListener('click', recover);
  $('#applyCode').addEventListener('click', useCode);
  $('#copyCode').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(state.token); status('Wallet code copied ✓', 'ok'); } catch { status('Select the code and copy it.', 'error'); }
  });

  init();
})();
