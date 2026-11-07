// "Create with AI" chat for the video maker: the customer describes their
// business, the AI (POST /api/aivideo/chat) asks for what is missing and
// returns a plan, then one AI picture per scene is made (POST
// /api/aivideo/image) and the editor renders the video
// (window.SiteCraftVideoMaker.loadPlan in maker.js).
(function () {
  'use strict';

  const API_BASE = window.SITECRAFT_API_BASE || 'https://sitecraft-ai.kammarivinaykumar216.workers.dev';
  const STYLE_NAMES = { jewel: 'Jewellery luxe', gym: 'Gym power', royal: 'Royal wedding', offer: 'Shop offer', product: 'Product showcase', wedding: 'Wedding / function', birthday: 'Birthday', property: 'Real estate', food: 'Restaurant & food' };
  const FORMAT_NAMES = { story: 'Status / Reels (9:16)', square: 'Post (1:1)', wide: 'YouTube (16:9)' };
  const GREETING = 'Hi! 👋 Tell me about your business and what you want to promote — in Telugu, Hindi or English. I will write the scenes and make your video, any length up to 1 minute, with free online photos, AI pictures or your own photos.';

  const $ = (selector) => document.querySelector(selector);
  const chatBox = $('#aiChat');
  const form = $('#aiForm');
  const input = $('#aiInput');
  const planBox = $('#aiPlan');
  const messages = [];
  let busy = false;

  function bubble(role, text) {
    const node = document.createElement('div');
    node.className = `vm-msg ${role}`;
    node.textContent = text;
    chatBox.append(node);
    chatBox.scrollTop = chatBox.scrollHeight;
    return node;
  }

  async function post(path, body) {
    const response = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
    return data;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function showPlan(plan) {
    planBox.hidden = false;
    const list = element('ol', 'vm-ai-scenes');
    for (const scene of plan.scenes) list.append(element('li', '', [scene.headline, scene.line].filter(Boolean).join(' — ')));
    const free = element('button', 'vm-btn primary', '🌐 Free online photos');
    free.type = 'button';
    const ai = element('button', 'vm-btn ghost', `✨ AI pictures (${plan.scenes.length})`);
    ai.type = 'button';
    const own = element('label', 'vm-btn ghost vm-ai-own', '🖼️ My own photos');
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.multiple = true;
    picker.hidden = true;
    own.append(picker);
    const choices = element('div', 'vm-ai-choices');
    choices.append(free, ai, own);
    const thumbs = element('div', 'vm-ai-thumbs');
    const note = element('p', 'vm-ai-meta');
    const credit = element('p', 'vm-ai-credit');
    const job = { plan, original: plan, slots: [], thumbs, note, credit };
    free.addEventListener('click', () => fill(job, 'stock'));
    ai.addEventListener('click', () => fill(job, 'ai'));
    picker.addEventListener('change', () => useOwnPhotos(job, picker));
    planBox.replaceChildren(
      element('h3', '', plan.title || 'Your video'),
      element('p', 'vm-ai-meta', `${STYLE_NAMES[plan.style] || plan.style} · ${plan.seconds} seconds · ${FORMAT_NAMES[plan.format] || plan.format}`),
      list,
      element('p', 'vm-ai-ask', `How do you want the ${plan.scenes.length} pictures? Free online photos (no watermark), new AI pictures, or your own photos. You can mix: after the photos load, tap ✨ on any scene to make that one with AI.`),
      choices, thumbs, note, credit,
    );
    planBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function showEditor() {
    const editor = $('#aiEditor');
    if (editor) editor.hidden = false;
  }

  function toBlob(image) {
    const bytes = Uint8Array.from(atob(image.data), (c) => c.charCodeAt(0));
    return new Blob([bytes], { type: image.mimeType });
  }

  // One free online photo for a scene, different from the ones already used.
  async function stockPicture(job, scene) {
    const exclude = job.slots.map((slot) => slot?.photo?.id).filter(Boolean);
    const data = await post('/api/aivideo/stock', { query: scene.stockQuery || scene.headline, format: job.plan.format, exclude });
    return { blob: toBlob(data.image), source: 'stock', photo: data.photo };
  }

  async function aiPicture(job, scene) {
    const data = await post('/api/aivideo/image', { prompt: scene.imagePrompt, format: job.plan.format });
    return { blob: toBlob(data.image), source: 'ai' };
  }

  // An AI picture that cannot be made falls back to a free photo, so the
  // video is never stuck.
  async function picture(job, scene, mode) {
    if (mode === 'stock') return stockPicture(job, scene);
    try {
      return await aiPicture(job, scene);
    } catch (error) {
      job.aiError = error.message;
      return stockPicture(job, scene);
    }
  }

  async function fill(job, mode) {
    if (busy) return;
    busy = true;
    job.plan = job.original;
    const { plan, thumbs, note } = job;
    job.slots = plan.scenes.map(() => null);
    job.aiError = '';
    thumbs.replaceChildren(...plan.scenes.map((_, i) => element('span', '', String(i + 1))));
    try {
      for (const [index, scene] of plan.scenes.entries()) {
        note.textContent = mode === 'ai' ? `Creating AI picture ${index + 1} of ${plan.scenes.length}…` : `Finding free photo ${index + 1} of ${plan.scenes.length}…`;
        try {
          job.slots[index] = await picture(job, scene, mode);
        } catch (error) {
          job.lastError = error.message;
        }
        renderThumbs(job);
      }
      await play(job);
    } finally {
      busy = false;
    }
  }

  function renderThumbs(job) {
    job.thumbs.replaceChildren(...job.plan.scenes.map((_, index) => {
      const slot = job.slots[index];
      if (!slot) return element('span', '', String(index + 1));
      const box = element('figure', 'vm-ai-thumb');
      const img = document.createElement('img');
      img.src = URL.createObjectURL(slot.blob);
      img.alt = `Scene ${index + 1}`;
      box.append(img);
      if (slot.source !== 'own') {
        const tools = element('div', 'vm-ai-thumb-tools');
        if (slot.source !== 'ai') tools.append(tool('✨', 'Make this scene with AI', () => replace(job, index, 'ai')));
        tools.append(tool('🔄', 'Another free photo', () => replace(job, index, 'stock')));
        box.append(tools);
      }
      return box;
    }));
    const names = [...new Set(job.slots.filter((slot) => slot?.source === 'stock').map((slot) => slot.photo?.photographer).filter(Boolean))];
    job.credit.replaceChildren();
    if (names.length) {
      const link = element('a', '', 'Pexels');
      link.href = 'https://www.pexels.com';
      link.target = '_blank';
      link.rel = 'noopener';
      job.credit.append(`Free photos by ${names.join(', ')} on `, link);
    }
  }

  function tool(label, title, action) {
    const button = element('button', '', label);
    button.type = 'button';
    button.title = title;
    button.setAttribute('aria-label', title);
    button.addEventListener('click', action);
    return button;
  }

  async function replace(job, index, mode) {
    if (busy) return;
    busy = true;
    job.aiError = '';
    job.note.textContent = mode === 'ai' ? `Creating an AI picture for scene ${index + 1}…` : `Finding another free photo for scene ${index + 1}…`;
    try {
      job.slots[index] = mode === 'ai' ? await aiPicture(job, job.plan.scenes[index]) : await stockPicture(job, job.plan.scenes[index]);
      renderThumbs(job);
      await play(job);
    } catch (error) {
      job.note.textContent = error.message;
    } finally {
      busy = false;
    }
  }

  // Sends the scenes that have a picture to the editor and plays the preview.
  async function play(job) {
    const ready = job.plan.scenes.map((scene, i) => [scene, job.slots[i]]).filter(([, slot]) => slot);
    if (!ready.length) {
      job.note.textContent = job.lastError || job.aiError || 'The pictures could not be loaded. Please try again, or use your own photos.';
      return;
    }
    await window.SiteCraftVideoMaker.loadPlan({ ...job.plan, scenes: ready.map(([scene]) => scene) }, ready.map(([, slot]) => slot.blob));
    showEditor();
    const missing = job.plan.scenes.length - ready.length;
    const parts = [`Your video is ready ✓ (${ready.length} picture${ready.length === 1 ? '' : 's'}). Tap “Make my video” to download it.`];
    if (job.aiError) parts.push(`Some AI pictures could not be made, so free photos were used: ${job.aiError}`);
    if (missing) parts.push(`${missing} scene${missing === 1 ? '' : 's'} had no picture.`);
    job.note.textContent = parts.join(' ');
  }

  // The customer's own photos take the place of the pictures, in order;
  // extra photos get no caption.
  async function useOwnPhotos(job, picker) {
    const files = Array.from(picker.files || []).filter((file) => file.type.startsWith('image/')).slice(0, 10);
    picker.value = '';
    if (!files.length || busy) return;
    busy = true;
    try {
      const scenes = files.map((_, i) => job.plan.scenes[i] || { headline: '', line: '' });
      job.plan = { ...job.plan, scenes };
      job.slots = files.map((file) => ({ blob: file, source: 'own' }));
      job.aiError = '';
      renderThumbs(job);
      await play(job);
    } catch (error) {
      job.note.textContent = 'These photos could not be opened. Please try other photos.';
    } finally {
      busy = false;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = '';
    bubble('user', text);
    messages.push({ role: 'user', text });
    busy = true;
    $('#aiSend').disabled = true;
    const typing = bubble('ai typing', '…');
    try {
      const data = await post('/api/aivideo/chat', { messages });
      typing.remove();
      bubble('ai', data.reply);
      messages.push({ role: 'assistant', text: data.reply });
      if (data.ready && data.plan) showPlan(data.plan);
    } catch (error) {
      typing.remove();
      bubble('ai', error.message);
      messages.pop();
    } finally {
      busy = false;
      $('#aiSend').disabled = false;
      input.focus();
    }
  });

  bubble('ai', GREETING);
  messages.push({ role: 'assistant', text: GREETING });
  input.focus({ preventScroll: true });
})();
