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
  const GREETING = 'Hi! 👋 Tell me about your business and what you want to promote — in Telugu, Hindi or English. I will write the scenes and make your video, any length up to 1 minute, with AI pictures or your own photos.';

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
    const button = element('button', 'vm-btn primary', `✨ Create AI pictures (${plan.scenes.length})`);
    button.type = 'button';
    const own = element('label', 'vm-btn ghost vm-ai-own', '🖼️ Use my own photos');
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.multiple = true;
    picker.hidden = true;
    own.append(picker);
    const choices = element('div', 'vm-ai-choices');
    choices.append(button, own);
    const thumbs = element('div', 'vm-ai-thumbs');
    const note = element('p', 'vm-ai-meta');
    button.addEventListener('click', () => makeVideo(plan, button, thumbs, note));
    picker.addEventListener('change', () => useOwnPhotos(plan, picker, thumbs, note));
    planBox.replaceChildren(
      element('h3', '', plan.title || 'Your video'),
      element('p', 'vm-ai-meta', `${STYLE_NAMES[plan.style] || plan.style} · ${plan.seconds} seconds · ${FORMAT_NAMES[plan.format] || plan.format}`),
      list,
      element('p', 'vm-ai-ask', `How do you want the pictures? AI can create ${plan.scenes.length}, or you can send your own photos (up to 10).`),
      choices, thumbs, note,
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

  // The customer's own photos take the place of the AI pictures, in order;
  // extra photos get no caption.
  async function useOwnPhotos(plan, picker, thumbs, note) {
    const files = Array.from(picker.files || []).filter((file) => file.type.startsWith('image/')).slice(0, 10);
    picker.value = '';
    if (!files.length || busy) return;
    busy = true;
    try {
      thumbs.replaceChildren(...files.map((file, i) => {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        img.alt = `Photo ${i + 1}`;
        return img;
      }));
      note.textContent = 'Your photos are in ✓ Playing a preview. Tap “Make my video” to download it, or change any text or photo below.';
      await window.SiteCraftVideoMaker.loadPlan(plan, files);
      showEditor();
    } catch (error) {
      note.textContent = 'These photos could not be opened. Please try other photos.';
    } finally {
      busy = false;
    }
  }

  async function makeVideo(plan, button, thumbs, note) {
    if (busy) return;
    busy = true;
    button.disabled = true;
    thumbs.replaceChildren(...plan.scenes.map((_, i) => element('span', '', String(i + 1))));
    const images = [];
    try {
      for (const [index, scene] of plan.scenes.entries()) {
        note.textContent = `Creating picture ${index + 1} of ${plan.scenes.length}…`;
        const data = await post('/api/aivideo/image', { prompt: scene.imagePrompt, format: plan.format });
        const blob = toBlob(data.image);
        images.push(blob);
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        img.alt = `Scene ${index + 1}`;
        thumbs.children[index].replaceWith(img);
      }
      note.textContent = 'All pictures are ready ✓ Playing a preview. Tap “Make my video” to download it, or change any text or photo below.';
      await window.SiteCraftVideoMaker.loadPlan(plan, images);
      showEditor();
    } catch (error) {
      note.textContent = images.length
        ? `${error.message} You can still make the video with the ${images.length} picture${images.length === 1 ? '' : 's'} ready.`
        : error.message;
      if (images.length) {
        const partial = element('button', 'vm-btn ghost', `Use the ${images.length} ready picture${images.length === 1 ? '' : 's'}`);
        partial.type = 'button';
        partial.addEventListener('click', async () => { await window.SiteCraftVideoMaker.loadPlan({ ...plan, scenes: plan.scenes.slice(0, images.length) }, images); showEditor(); });
        note.after(partial);
      }
      button.disabled = false;
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
