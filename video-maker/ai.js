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
  const GREETING = 'Hi! 👋 Tell me about your business and what you want to promote — in Telugu, Hindi or English. I will write the scenes and make your video, any length up to 1 minute, with AI pictures or your own photos. Tap an example below to start.';

  const $ = (selector) => document.querySelector(selector);
  const chatBox = $('#aiChat');
  const form = $('#aiForm');
  const input = $('#aiInput');
  const planBox = $('#aiPlan');
  const messages = [];
  let busy = false;

  function bubble(role, text, files = []) {
    const node = document.createElement('div');
    node.className = `vm-msg ${role}`;
    node.textContent = text;
    if (files.length) {
      const row = element('div', 'vm-msg-files');
      for (const item of files) {
        if (item.preview) {
          const img = document.createElement('img');
          img.src = item.preview;
          img.alt = item.file.name || 'Shared photo';
          row.append(img);
        } else {
          row.append(element('span', '', `📄 ${item.file.name || 'File'}`));
        }
      }
      node.append(row);
    }
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
    // The plan card is a message in the chat.
    chatBox.append(planBox);
    planBox.hidden = false;
    const list = element('ol', 'vm-ai-scenes');
    for (const scene of plan.scenes) list.append(element('li', '', [scene.eyebrow, scene.headline, scene.line].filter(Boolean).join(' — ')));
    // AI makes the pictures (the main way), or works with the customer's photos.
    // Free stock photos only stand in when an AI picture cannot be made.
    const ai = element('button', 'vm-btn primary', `✨ AI creates the ${plan.scenes.length} pictures`);
    ai.type = 'button';
    const own = element('label', 'vm-btn ghost vm-ai-own', '🖼️ Use my photos');
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.multiple = true;
    picker.hidden = true;
    own.append(picker);
    const choices = element('div', 'vm-ai-choices');
    choices.append(ai);
    // Photos already shared in the chat: one button for them, no second picker.
    if (!sharedPhotos.length) choices.append(own);
    if (sharedPhotos.length) {
      const shared = element('button', 'vm-btn primary vm-ai-shared', `🖼️ Use the ${sharedPhotos.length} photo${sharedPhotos.length === 1 ? '' : 's'} I shared`);
      shared.type = 'button';
      shared.addEventListener('click', () => useFiles(job, sharedPhotos));
      ai.className = 'vm-btn ghost';
      choices.classList.add('vm-ai-choices-shared');
      choices.prepend(shared);
    }
    const thumbs = element('div', 'vm-ai-thumbs');
    const note = element('p', 'vm-ai-meta');
    const credit = element('p', 'vm-ai-credit');
    const job = { plan, original: plan, slots: [], thumbs, note, credit };
    ai.addEventListener('click', () => fill(job, 'ai'));
    picker.addEventListener('change', () => useOwnPhotos(job, picker));
    planBox.replaceChildren(
      element('h3', '', plan.title || 'Your video'),
      element('p', 'vm-ai-meta', `${STYLE_NAMES[plan.style] || plan.style} · ${plan.seconds} seconds · ${FORMAT_NAMES[plan.format] || plan.format}`),
      list,
      element('p', 'vm-ai-ask', `AI will create ${plan.scenes.length} pictures for these scenes and make the video. Have your own photos? Share them in the chat (＋ or paste) or tap “Use my photos” — AI looks at them, puts them in order and writes the text. Either way your pictures go inside the video and the HTML file.`),
      choices, thumbs, note, credit,
    );
    chatBox.scrollTop = planBox.offsetTop - chatBox.offsetTop - 8;
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
      await frameSlots(job);
      await play(job);
    } finally {
      busy = false;
    }
  }

  // Smart framing: the AI looks at the pictures and says where the subject
  // is and what light / colour fix each needs. Skipped quietly on errors.
  async function frameSlots(job, only) {
    const todo = job.slots.map((slot, i) => [slot, i]).filter(([slot, i]) => slot && !slot.look && (only === undefined || only === i));
    if (!todo.length) return;
    job.note.textContent = 'AI is framing the pictures…';
    try {
      const photos = await Promise.all(todo.map(([slot]) => shrinkImage(slot.blob, 512)));
      const data = await post('/api/aivideo/analyze', { photos });
      todo.forEach(([slot], k) => { if (data.looks?.[k]) slot.look = data.looks[k]; });
    } catch {
      // Framing is a bonus; the video works without it.
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
      await frameSlots(job, index);
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
    try {
      await window.SiteCraftVideoMaker.loadPlan({ ...job.plan, scenes: ready.map(([scene, slot]) => ({ ...scene, look: slot.look })) }, ready.map(([, slot]) => slot.blob));
    } catch (error) {
      job.note.textContent = error.message;
      return;
    }
    showEditor();
    showVersions(job, ready).catch(() => {});
    const missing = job.plan.scenes.length - ready.length;
    const parts = [`${job.slots.some((slot) => slot?.source === 'own') && !job.aiError ? 'AI arranged your photos and wrote the scenes. ' : ''}Your video is ready ✓ (${ready.length} picture${ready.length === 1 ? '' : 's'}). Download it as an HTML video or tap “Make my video” for MP4.`];
    if (job.aiError) parts.push(job.slots.some((slot) => slot?.source === 'own') ? job.aiError : `Some AI pictures could not be made, so free photos were used: ${job.aiError}`);
    if (missing) parts.push(`${missing} scene${missing === 1 ? '' : 's'} had no picture.`);
    job.note.textContent = parts.join(' ');
  }

  // ---- Three versions ----
  // The AI's design plus two other ad templates that suit the business, as
  // small live previews; tapping one loads it into the editor. The video is
  // drawn in the browser, so extra versions cost nothing.
  const VERSION_LAYOUTS = {
    offer: ['sale', 'kinetic', 'story'], product: ['product', 'cinema', 'countdown'], food: ['story', 'sale', 'kinetic'],
    property: ['cinema', 'product', 'countdown'], jewel: ['cinema', 'product', 'story'], wedding: ['cinema', 'event', 'kinetic'],
    royal: ['cinema', 'event', 'story'], gym: ['beat', 'sale', 'countdown'], birthday: ['story', 'event', 'kinetic'], default: ['kinetic', 'story', 'countdown'],
  };
  let versionTimer = 0;

  async function showVersions(job, ready) {
    const S = window.SiteCraftStyles;
    const VM = window.SiteCraftVideoMaker;
    if (!S || !VM?.variantData) return;
    cancelAnimationFrame(versionTimer);
    job.versions?.remove();
    const plan = { ...job.plan, scenes: ready.map(([scene]) => scene) };
    const first = S.CHOICES.layout.includes(plan.design?.layout) ? plan.design.layout : S.layoutFor(plan.style);
    const others = (VERSION_LAYOUTS[plan.style] || VERSION_LAYOUTS.default).filter((layout) => layout !== first).slice(0, 2);
    const colours = plan.design?.accent ? { accent: plan.design.accent, dark: plan.design.dark || '' } : {};
    const versions = [
      { layout: first, design: plan.design?.layout ? plan.design : null },
      ...others.map((layout) => ({ layout, design: { layout, ...colours } })),
    ];
    const bitmaps = await Promise.all(ready.map(async ([, slot]) => {
      const bitmap = await createImageBitmap(slot.blob, { resizeWidth: 480, resizeQuality: 'medium' }).catch(() => createImageBitmap(slot.blob));
      if (slot.look) bitmap.__look = slot.look;
      return bitmap;
    }));
    const box = element('div', 'vm-versions');
    box.append(element('p', 'vm-ai-ask', '✨ 3 versions — tap the one you like best:'));
    const row = element('div', 'vm-version-row');
    const items = versions.map((version, i) => {
      const d = VM.variantData(plan, bitmaps, version.layout, version.design);
      const canvas = document.createElement('canvas');
      canvas.width = 160; canvas.height = Math.round((160 * d.h) / d.w);
      const card = element('button', `vm-version${i === 0 ? ' on' : ''}`);
      card.type = 'button';
      card.setAttribute('aria-label', `Version ${i + 1}: ${VM.templateName(version.layout)}`);
      card.append(canvas, element('span', '', `${i + 1}. ${VM.templateName(version.layout)}`));
      card.addEventListener('click', async () => {
        if (busy) return;
        for (const node of row.children) node.classList.toggle('on', node === card);
        try {
          await VM.loadPlan({ ...plan, design: version.design || { layout: version.layout }, scenes: ready.map(([scene, slot]) => ({ ...scene, look: slot.look })) }, ready.map(([, slot]) => slot.blob));
          job.note.textContent = `Version ${i + 1} (${VM.templateName(version.layout)}) is in the editor ✓ Download it as an HTML video or tap “Make my video” for MP4.`;
        } catch (error) {
          job.note.textContent = error.message;
        }
      });
      row.append(card);
      return { d, ctx: canvas.getContext('2d'), scale: canvas.width / d.w, total: S.total(d) };
    });
    box.append(row);
    job.note.after(box);
    job.versions = box;
    const start = performance.now();
    const tick = (now) => {
      if (!box.isConnected) return;
      const t = ((now - start) / 1000);
      for (const item of items) {
        item.ctx.setTransform(item.scale, 0, 0, item.scale, 0, 0);
        item.ctx.clearRect(0, 0, item.d.w, item.d.h);
        S.frame(item.ctx, t % item.total, item.d);
      }
      versionTimer = requestAnimationFrame(tick);
    };
    versionTimer = requestAnimationFrame(tick);
  }

  // The customer's own photos take the place of the pictures, in order;
  // extra photos get no caption.
  async function useOwnPhotos(job, picker) {
    const files = Array.from(picker.files || []);
    picker.value = '';
    await useFiles(job, files);
  }

  async function useFiles(job, list) {
    const files = list.filter((file) => file.type.startsWith('image/')).slice(0, 10);
    if (!files.length || busy) return;
    busy = true;
    try {
      // The AI looks at the photos, orders them and writes each scene's text.
      // If it cannot, the photos are used in the order given with the plan's text.
      let order = files.map((file, i) => ({ file, eyebrow: job.original.scenes[i]?.eyebrow || '', headline: job.original.scenes[i]?.headline || '', line: job.original.scenes[i]?.line || '' }));
      job.note.textContent = `AI is looking at your ${files.length} photo${files.length === 1 ? '' : 's'} and writing the scenes…`;
      try {
        const photos = await Promise.all(files.map((file) => shrinkImage(file, 768)));
        const data = await post('/api/aivideo/photos', { plan: job.original, photos });
        order = data.scenes.map((scene) => ({ file: files[scene.photo], eyebrow: scene.eyebrow, headline: scene.headline, line: scene.line, look: scene.look }));
        job.aiError = '';
      } catch (error) {
        job.aiError = `${error.message} Your photos were used in the order you picked.`;
      }
      job.plan = { ...job.original, scenes: order.map(({ eyebrow, headline, line }) => ({ eyebrow, headline, line })) };
      job.slots = order.map(({ file, look }) => ({ blob: file, source: 'own', look }));
      renderThumbs(job);
      await play(job);
    } catch (error) {
      job.note.textContent = 'These photos could not be opened. Please try other photos.';
    } finally {
      busy = false;
    }
  }

  // ---- Sharing photos and files (＋ button, paste, drag and drop) ----
  const MAX_PENDING = 6;
  const MAX_FILE_BYTES = 3 * 1024 * 1024;
  const attachList = $('#aiAttachList');
  const fileInput = $('#aiFiles');
  const card = $('#aiCard');
  const sharedPhotos = [];
  let pending = [];

  function renderPending() {
    attachList.hidden = !pending.length;
    attachList.replaceChildren(...pending.map((item, index) => {
      const chip = element('div', 'vm-attach');
      if (item.preview) {
        const img = document.createElement('img');
        img.src = item.preview;
        img.alt = '';
        chip.append(img);
      } else {
        chip.append(element('b', 'vm-file-icon', '📄'));
      }
      chip.append(element('span', '', item.file.name || 'Pasted photo'));
      const remove = element('button', '', '✕');
      remove.type = 'button';
      remove.setAttribute('aria-label', `Remove ${item.file.name || 'file'}`);
      remove.addEventListener('click', () => { pending.splice(index, 1); renderPending(); });
      chip.append(remove);
      return chip;
    }));
  }

  function addFiles(list) {
    let skipped = 0;
    for (const file of list) {
      const isImage = file.type.startsWith('image/');
      const isDoc = file.type === 'application/pdf' || file.type === 'text/plain';
      if ((!isImage && !isDoc) || (isDoc && file.size > MAX_FILE_BYTES) || pending.length >= MAX_PENDING) { skipped += 1; continue; }
      pending.push({ file, preview: isImage ? URL.createObjectURL(file) : '' });
    }
    renderPending();
    if (skipped) bubble('ai', `Some files were skipped. You can share up to ${MAX_PENDING} at a time: photos, PDF or text files (up to 3 MB each).`);
    input.focus();
  }

  // Photos are made smaller before they go to the AI (it only needs to see them).
  function shrinkImage(file, size = 1280) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, size / Math.max(img.naturalWidth, img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve({ mimeType: 'image/jpeg', data: canvas.toDataURL('image/jpeg', 0.82).split(',')[1] });
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This photo could not be opened.')); };
      img.src = url;
    });
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ mimeType: file.type, data: String(reader.result).split(',')[1] });
      reader.onerror = () => reject(new Error('This file could not be read.'));
      reader.readAsDataURL(file);
    });
  }

  fileInput.addEventListener('change', () => { addFiles(Array.from(fileInput.files || [])); fileInput.value = ''; });
  card.addEventListener('paste', (event) => {
    const files = Array.from(event.clipboardData?.files || []);
    if (!files.length) return;
    event.preventDefault();
    addFiles(files);
  });
  card.addEventListener('dragover', (event) => { event.preventDefault(); card.classList.add('vm-drop'); });
  card.addEventListener('dragleave', (event) => { if (!card.contains(event.relatedTarget)) card.classList.remove('vm-drop'); });
  card.addEventListener('drop', (event) => {
    event.preventDefault();
    card.classList.remove('vm-drop');
    addFiles(Array.from(event.dataTransfer?.files || []));
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const typed = input.value.trim();
    if ((!typed && !pending.length) || busy) return;
    const sending = pending;
    let files = [];
    try {
      files = await Promise.all(sending.map((item) => (item.preview ? shrinkImage(item.file) : readFile(item.file))));
    } catch (error) {
      bubble('ai', error.message);
      return;
    }
    pending = [];
    renderPending();
    for (const item of sending) if (item.preview && sharedPhotos.length < 10) sharedPhotos.push(item.file);
    const text = typed || (sending.some((item) => item.preview) ? 'I shared these photos.' : 'I shared this file.');
    input.value = '';
    bubble('user', typed, sending);
    messages.push({ role: 'user', text, files });
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

  // Example requests to start from; they go away after the first message.
  const EXAMPLES = ['Saree shop in Warangal — Diwali offer 30% off, 30 seconds', 'Gym — New year offer ₹999/month, Reels', 'Half saree function invitation for my daughter', 'Bakery — new cakes launch, Telugu, 15 seconds'];
  const suggest = element('div', 'vm-suggest');
  for (const example of EXAMPLES) {
    const chip = element('button', '', example);
    chip.type = 'button';
    chip.addEventListener('click', () => { input.value = example; input.focus(); });
    suggest.append(chip);
  }
  chatBox.append(suggest);
  form.addEventListener('submit', () => suggest.remove(), { once: true });
  input.focus({ preventScroll: true });
})();
