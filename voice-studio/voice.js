// AI Voice Studio page. Talks to the Worker routes in backend/sitecraft-ai/voice-studio.js.
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
    packs: [
      { id: 'w1k', words: 1000, paise: 4900, label: '1K words' }, { id: 'w2k', words: 2000, paise: 7900, label: '2K words' },
      { id: 'w5k', words: 5000, paise: 17900, label: '5K words', badge: 'Most popular' },
      { id: 'w10k', words: 10000, paise: 34900, label: '10K words' }, { id: 'w25k', words: 25000, paise: 84900, label: '25K words', badge: 'Best value' },
    ],
  };
  const STYLE_NOTES = { normal: 'Clear & neutral', narration: 'Story / audiobook', news: 'Formal & crisp', conversational: 'Like a friend', emotional: 'Heartfelt', comedy: 'Fun & timing', motivational: 'Energetic', whisper: 'Soft & close' };

  const state = { config: FALLBACK, token: store.get(WALLET_KEY), words: null, audioUrl: '', lastText: '', undoText: '' };

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
    state.config.styles.forEach((s) => {
      const label = document.createElement('label');
      label.className = 'vs-style';
      const input = Object.assign(document.createElement('input'), { type: 'radio', name: 'style', value: s.id, checked: s.id === current });
      const span = document.createElement('span');
      span.append(s.label);
      const small = document.createElement('small');
      small.textContent = (STYLE_NOTES[s.id] || '') + (s.acting ? ' · acting' : '');
      span.append(small);
      label.append(input, span);
      box.append(label);
    });
  }

  function renderDialects() {
    const select = $('#dialect');
    const current = select.value || 'none';
    select.innerHTML = '';
    state.config.dialects.forEach((d) => select.append(new Option(d.label, d.id, false, d.id === current)));
  }

  const rupees = (paise) => '₹' + Math.round(paise / 100).toLocaleString('en-IN');

  function renderPacks() {
    const grid = $('#packGrid');
    grid.innerHTML = '';
    const base = state.config.packs[0];
    const basePer1k = base ? base.paise / (base.words / 1000) : 0;
    state.config.packs.forEach((p) => {
      const per1k = p.paise / (p.words / 1000);
      const save = basePer1k && per1k < basePer1k ? Math.round((1 - per1k / basePer1k) * 100) : 0;
      const card = document.createElement('div');
      card.className = 'vs-pack' + (p.badge === 'Most popular' ? ' hot' : '');
      card.innerHTML = (p.badge ? '<span class="badge"></span>' : '') + '<h3></h3><div class="price"></div><div class="per"></div><div class="save"></div><button type="button" class="vs-btn primary">Buy</button>';
      if (p.badge) card.querySelector('.badge').textContent = p.badge;
      card.querySelector('h3').textContent = p.label;
      card.querySelector('.price').textContent = rupees(p.paise);
      card.querySelector('.per').textContent = '₹' + (per1k / 100).toFixed(1).replace(/\.0$/, '') + ' per 1K words';
      card.querySelector('.save').textContent = save ? `Save ${save}%` : '';
      const button = card.querySelector('button');
      button.dataset.pack = p.id;
      button.setAttribute('aria-label', `Buy ${p.label} for ${rupees(p.paise)}`);
      button.addEventListener('click', () => buy(p, button));
      grid.append(card);
    });
  }

  function updateCount() {
    const words = billableWords($('#script').value);
    const max = state.config.maxWordsPerGeneration;
    const info = $('#wordInfo');
    info.textContent = words ? `${words} word${words === 1 ? '' : 's'}` : '0 words';
    info.classList.toggle('over', words > max);
    const btn = $('#generateBtn');
    btn.textContent = words ? `🎙️ Make voice · uses ${words} word${words === 1 ? '' : 's'}` : '🎙️ Make voice';
    btn.disabled = !state.config.enabled || !words || words > max;
  }

  function applyConfig() {
    const c = state.config;
    $('#freeWordsChip').textContent = c.freeWords;
    $('#maxWords').textContent = c.maxWordsPerGeneration;
    renderStyles();
    renderDialects();
    renderPacks();
    $('#textTools').hidden = !c.textTools;
    const banner = $('#offBanner');
    banner.hidden = c.enabled;
    banner.textContent = c.enabled ? '' : 'Voice Studio is opening very soon. You can try the page now; making voices will switch on shortly.';
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

  async function generate() {
    const text = $('#script').value.trim();
    const words = billableWords(text);
    if (!text) { status('Please type or paste some text first.', 'error'); return; }
    if (state.words !== null && words > state.words) {
      status(`This needs ${words} words but you have ${state.words}. Buy a pack below to continue.`, 'error');
      $('#packs').scrollIntoView({ behavior: 'smooth' });
      return;
    }
    const btn = $('#generateBtn');
    btn.disabled = true;
    status('Making your voice… this can take 10–40 seconds.');
    try {
      const response = await fetch(API + 'generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: state.token, text, style: selected('style'), voice: selected('voice'), dialect: $('#dialect').value }),
      });
      const type = response.headers.get('Content-Type') || '';
      if (!response.ok || !type.includes('audio')) {
        const data = await response.json().catch(() => ({}));
        status(data.error || 'The voice could not be made. Please try again.', 'error');
        if (data.code === 'NO_WORDS') { setWords(data.words); $('#packs').scrollIntoView({ behavior: 'smooth' }); }
        return;
      }
      const blob = await response.blob();
      if (state.audioUrl) URL.revokeObjectURL(state.audioUrl);
      state.audioUrl = URL.createObjectURL(blob);
      state.lastText = text;
      const player = $('#player');
      player.src = state.audioUrl;
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      const link = $('#downloadBtn');
      link.href = state.audioUrl;
      link.download = `sitecraft-voice-${selected('style') || 'voice'}-${stamp}.wav`;
      $('#result').hidden = false;
      $('#reportForm').hidden = true;
      setWords(response.headers.get('X-Words-Left'));
      status(`Done ✓ Used ${response.headers.get('X-Words-Used') || words} words.`, 'ok');
      player.play().catch(() => {});
    } catch {
      status('Could not reach the server. Please check your internet and try again.', 'error');
    } finally {
      updateCount();
    }
  }

  async function textTool(action, button) {
    const text = $('#script').value.trim();
    if (!text) { status('Please type or paste some text first.', 'error'); return; }
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

  async function buy(pack, button) {
    if (!state.config.payments) {
      payStatus('Online payment starts very soon. To buy words today, ', 'error');
      const link = Object.assign(document.createElement('a'), {
        href: 'https://wa.me/917981587505?text=' + encodeURIComponent(`Hi SiteCraft, I want to buy the Voice Studio ${pack.label} pack (${rupees(pack.paise)}). My wallet code: ${state.token}`),
        target: '_blank', rel: 'noopener noreferrer', textContent: 'message us on WhatsApp ↗',
      });
      link.style.color = '#fcd34d';
      $('#payStatus').append(link);
      return;
    }
    if (!state.token) { payStatus('Please reload the page and try again.', 'error'); return; }
    button.disabled = true;
    payStatus('Opening payment…');
    try {
      const order = await post('order', { token: state.token, pack: pack.id });
      if (!order.ok) { payStatus(order.error || 'Payments are not available right now.', 'error'); return; }
      store.set(ORDER_KEY, order.orderId);
      await loadCheckout();
      new window.Razorpay({
        key: order.keyId, amount: order.amount, currency: order.currency, order_id: order.orderId,
        name: 'SiteCraft', description: `Voice Studio · ${pack.label}`,
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
