// Owner Update mode: the owner types, speaks or sends photos ("Gold chain price
// 52000", "paneer out of stock", "new bangles arrived") and BotCraft shows what
// it will change. Nothing is saved until the owner taps Confirm.
//
// The plan comes from the AI helper on the server. If that is not available
// (no key yet, offline, busy, or demo mode) the rule-based planner in
// update-planner.js is used instead, and the screen says so.

import { applyPlan, runUndo } from './plan-apply.js';
import { describeOp, planLocally } from './update-planner.js';

const EXAMPLES = ['Gold chain price 52000', 'Silver anklet out of stock', 'Add Silk saree 3500', 'Timings 10 am to 8 pm', 'Closed on Sunday'];
const LANGS = [['te-IN', 'తెలుగు'], ['en-IN', 'English'], ['hi-IN', 'हिन्दी'], ['ta-IN', 'தமிழ்'], ['kn-IN', 'ಕನ್ನಡ']];
const LANG_KEY = 'botcraft:ownerVoiceLang';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

export function initUpdateChat({ getView, call, prepareImage, apiBase, shopId }) {
  const root = document.querySelector('#updateChat');
  if (!root) return null;
  const log = root.querySelector('.uc-log');
  const form = root.querySelector('.uc-form');
  const input = root.querySelector('.uc-input');
  const fileInput = root.querySelector('.uc-file');
  const tray = root.querySelector('.uc-tray');
  const micButton = root.querySelector('.uc-mic');
  const langSelect = root.querySelector('.uc-lang');
  const sendButton = root.querySelector('.uc-send');
  const chips = root.querySelector('.uc-chips');

  let attached = []; // { file, url, image }
  let pending = null; // { ops, images, card }
  let busy = false;

  const scrollDown = () => { log.scrollTop = log.scrollHeight; };
  function bubble(role, text) {
    const node = el('div', `uc-msg uc-${role}`);
    if (text) node.textContent = text;
    log.append(node);
    scrollDown();
    return node;
  }

  // ---- Photos the owner attaches ----
  function renderTray() {
    tray.replaceChildren(...attached.map((item, index) => {
      const box = el('div', 'uc-thumb');
      const image = el('img');
      image.src = item.url;
      image.alt = `Photo ${index + 1}`;
      const remove = el('button', 'uc-x', '×');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove photo ${index + 1}`);
      remove.addEventListener('click', () => { URL.revokeObjectURL(item.url); attached.splice(index, 1); renderTray(); });
      box.append(image, remove);
      return box;
    }));
    tray.hidden = !attached.length;
  }
  fileInput.addEventListener('change', async () => {
    for (const file of [...fileInput.files].slice(0, 3 - attached.length)) {
      try {
        attached.push({ file, url: URL.createObjectURL(file), image: await prepareImage(file) });
      } catch { bubble('bot', 'That photo could not be read. Please choose a JPG or PNG photo.'); }
    }
    fileInput.value = '';
    renderTray();
  });

  // ---- Planning: AI helper first, rules as the fallback ----
  async function requestPlan(text, images) {
    const view = getView();
    if (!window.BOTCRAFT_DEMO) {
      try {
        const response = await fetch(`${apiBase}/api/botcraft/owner`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ shopId, action: 'plan_update', text, images }),
        });
        const data = await response.json();
        if (response.ok && data.ok && data.plan) return { ...data.plan, source: 'ai' };
      } catch { /* fall through to the basic planner */ }
    }
    const plan = planLocally(text, { products: view.products || [], imageCount: images.length });
    return { ...plan, source: 'basic' };
  }

  async function submit(textOverride) {
    if (busy) return;
    const text = (textOverride ?? input.value).trim();
    if (!text && !attached.length) return;
    busy = true;
    sendButton.disabled = true;
    const sent = attached.slice();
    const mine = bubble('owner', text);
    for (const item of sent) { const image = el('img', 'uc-sent'); image.src = item.url; mine.append(image); }
    if (!text) mine.prepend(document.createTextNode('📷 '));
    input.value = '';
    attached = [];
    renderTray();
    dropPending();
    const thinking = bubble('bot', 'Checking…');
    thinking.classList.add('uc-typing');
    const images = sent.map((item) => item.image);
    const plan = await requestPlan(text, images);
    thinking.remove();
    showPlan(plan, images);
    busy = false;
    sendButton.disabled = false;
  }

  function dropPending() {
    if (pending?.card) pending.card.remove();
    pending = null;
  }

  function speak(text) {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langSelect.value;
    synth.speak(utterance);
  }

  function showPlan(plan, images) {
    const view = getView();
    const lines = plan.ops.map((op) => describeOp(op, view.products || [], view.info || {}));
    const head = plan.source === 'basic' ? 'I will make these changes (basic mode — please check each line):' : 'I will make these changes:';
    if (!plan.ops.length) {
      bubble('bot', plan.unclear || plan.summary || 'I could not find a change to make. Try: “Gold chain price 52000”.');
      return;
    }
    const card = el('div', 'uc-msg uc-bot uc-plan');
    card.append(el('div', 'uc-plan-head', head));
    const list = el('ul', 'uc-plan-list');
    for (const line of lines) {
      const item = el('li', line.danger ? 'uc-danger' : '');
      item.append(el('span', 'uc-icon', line.icon), document.createTextNode(` ${line.text}`));
      list.append(item);
    }
    card.append(list);
    if (plan.unclear) card.append(el('p', 'uc-note', plan.unclear));
    const actions = el('div', 'uc-actions');
    const confirm = el('button', 'btn uc-confirm', '✅ Confirm & update');
    confirm.type = 'button';
    const cancel = el('button', 'btn btn-light', 'Cancel');
    cancel.type = 'button';
    const read = el('button', 'btn btn-light', '🔊 Read');
    read.type = 'button';
    actions.append(confirm, cancel, read);
    card.append(actions);
    log.append(card);
    scrollDown();
    pending = { ops: plan.ops, images, card };
    cancel.addEventListener('click', () => { dropPending(); bubble('bot', 'Okay, nothing was changed.'); });
    read.addEventListener('click', () => speak(`${head} ${lines.map((line) => line.text).join('. ')}. Say confirm to save.`));
    confirm.addEventListener('click', async () => {
      if (!pending) return;
      const { ops, images: sentImages } = pending;
      actions.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      confirm.textContent = 'Saving…';
      await apply(ops, sentImages, card);
    });
  }

  // ---- Applying a confirmed plan ----
  async function apply(ops, images, card) {
    const { done, failed, undo, undoable } = await applyPlan({ ops, images, call, getView });
    card.remove();
    pending = null;
    const result = el('div', 'uc-msg uc-bot uc-result');
    result.append(el('div', failed ? 'uc-warn' : 'uc-ok', failed
      ? `Saved ${done} change${done === 1 ? '' : 's'}. ${failed} could not be saved — please check the item names.`
      : `✅ Done — ${done} change${done === 1 ? '' : 's'} saved. Your customers see it right away.`));
    const actions = el('div', 'uc-actions');
    const open = document.querySelector('#openBot');
    if (open && !open.hidden) {
      const link = el('a', 'btn btn-light', 'See customer page');
      link.href = open.href;
      link.target = '_blank';
      link.rel = 'noopener';
      actions.append(link);
    }
    if (undoable) {
      const button = el('button', 'btn btn-light', '↩ Undo');
      button.type = 'button';
      button.addEventListener('click', async () => {
        button.disabled = true;
        await runUndo(undo, call);
        result.replaceChildren(el('div', 'uc-ok', '↩ Undone. Everything is back as it was.'));
      });
      actions.append(button);
    }
    if (actions.childNodes.length) result.append(actions);
    log.append(result);
    scrollDown();
  }

  // ---- Voice: speak the change instead of typing it ----
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognizer = null;
  const savedLang = (() => { try { return localStorage.getItem(LANG_KEY); } catch { return null; } })();
  langSelect.replaceChildren(...LANGS.map(([code, label]) => {
    const option = el('option', '', label);
    option.value = code;
    option.selected = code === (savedLang || 'te-IN');
    return option;
  }));
  langSelect.addEventListener('change', () => { try { localStorage.setItem(LANG_KEY, langSelect.value); } catch {} });

  function stopListening() {
    recognizer?.stop();
  }
  function startListening() {
    if (!Recognition) return;
    window.speechSynthesis?.cancel();
    let heard = '';
    recognizer = new Recognition();
    recognizer.lang = langSelect.value;
    recognizer.interimResults = true;
    recognizer.maxAlternatives = 1;
    micButton.classList.add('uc-listening');
    micButton.setAttribute('aria-pressed', 'true');
    input.placeholder = 'Listening… speak now';
    recognizer.onresult = (event) => {
      heard = Array.from(event.results).map((result) => result[0].transcript).join('');
      input.value = heard;
    };
    recognizer.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') bubble('bot', 'Please allow the microphone for this page, then tap the mic again.');
    };
    recognizer.onend = () => {
      recognizer = null;
      micButton.classList.remove('uc-listening');
      micButton.setAttribute('aria-pressed', 'false');
      input.placeholder = 'Type or speak a change…';
      if (heard.trim()) submit(heard);
    };
    try { recognizer.start(); } catch { micButton.classList.remove('uc-listening'); }
  }
  if (Recognition) {
    micButton.addEventListener('click', () => { if (recognizer) stopListening(); else startListening(); });
  } else {
    micButton.hidden = true;
    langSelect.hidden = true;
  }

  // ---- Wiring ----
  form.addEventListener('submit', (event) => { event.preventDefault(); submit(); });
  input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } });
  chips.replaceChildren(...EXAMPLES.map((example) => {
    const chip = el('button', 'uc-chip', example);
    chip.type = 'button';
    chip.addEventListener('click', () => { input.value = example; input.focus(); });
    return chip;
  }));
  bubble('bot', 'Tell me what changed in your shop — type it, speak it, or send a photo. I will show you the changes first, and nothing is saved until you confirm.');
  return { submit };
}
