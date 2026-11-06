// Photo Video Maker: turns the user's photos into a short video ad, all in the
// browser. Photos are drawn on a canvas with template colours, motion and
// text; "Make my video" records the canvas (and optional music) in real time
// with MediaRecorder. Nothing is uploaded.
(function () {
  'use strict';

  const FORMATS = { story: [720, 1280], square: [1080, 1080], wide: [1280, 720] };
  const MAX_PHOTOS = 10;
  const MAX_SIDE = 1600;
  const INTRO = 2.6;
  const OUTRO = 3.2;
  const FADE = 0.6;
  const FPS = 30;
  const WATERMARK = 'Made with SiteCraft';
  const SANS = 'Poppins, "Noto Sans Telugu", "Noto Sans Devanagari", sans-serif';
  const SERIF = '"Playfair Display", "Noto Sans Telugu", "Noto Sans Devanagari", serif';

  // Each template: colours, the fonts, how photos move, and a decoration.
  const TEMPLATES = [
    { id: 'offer', name: 'Shop offer', bg: '#111111', bg2: '#2a2100', accent: '#ffcc00', text: '#ffffff', font: SANS, motion: 'zoom', deco: 'burst' },
    { id: 'product', name: 'Product showcase', bg: '#0b1222', bg2: '#12324a', accent: '#38bdf8', text: '#f8fafc', font: SANS, motion: 'pan', deco: 'lines' },
    { id: 'wedding', name: 'Wedding / function', bg: '#3b0d1e', bg2: '#5c1a30', accent: '#f5c97a', text: '#fff7e6', font: SERIF, motion: 'zoom', deco: 'frame' },
    { id: 'birthday', name: 'Birthday', bg: '#1e1b4b', bg2: '#4c1d95', accent: '#f472b6', text: '#ffffff', font: SANS, motion: 'slide', deco: 'dots' },
    { id: 'property', name: 'Real estate', bg: '#0b2e2a', bg2: '#134e4a', accent: '#5eead4', text: '#f0fdfa', font: SANS, motion: 'pan', deco: 'lines' },
    { id: 'food', name: 'Restaurant & food', bg: '#2b1408', bg2: '#5a2a0f', accent: '#fb923c', text: '#fff7ed', font: SANS, motion: 'zoom', deco: 'burst' },
  ];

  const $ = (selector) => document.querySelector(selector);
  const canvas = $('#stage');
  const ctx = canvas.getContext('2d');
  const state = { photos: [], template: TEMPLATES[0], format: 'story', perPhoto: 3, music: null, playing: false, recording: false };
  let frameRequest = 0;
  let audioContext = null;

  // ---- Helpers ----

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const ease = (x) => 1 - Math.pow(1 - clamp(x, 0, 1), 3);
  const text = (id) => $(id).value.trim();

  function setStatus(message) { $('#status').textContent = message; }

  function totalSeconds() {
    return INTRO + Math.max(1, state.photos.length) * state.perPhoto + OUTRO;
  }

  function sizeCanvas() {
    const [width, height] = FORMATS[state.format];
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  }

  // Splits text into lines that fit the width (words for most scripts).
  function wrap(line, maxWidth, maxLines) {
    const words = String(line).split(/\s+/).filter(Boolean);
    const lines = [];
    let current = '';
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (ctx.measureText(next).width <= maxWidth || !current) current = next;
      else { lines.push(current); current = word; }
    }
    if (current) lines.push(current);
    if (lines.length > maxLines) {
      lines.length = maxLines;
      lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s*\S*$/, '')}…`;
    }
    return lines;
  }

  // Draws centred (or left-aligned) wrapped text; returns the height used.
  function drawText(value, { x, y, size, weight = 800, color, maxWidth, align = 'center', alpha = 1, maxLines = 3, font = state.template.font, shadow = true }) {
    if (!value) return 0;
    ctx.save();
    ctx.globalAlpha *= alpha;
    ctx.font = `${weight} ${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    if (shadow) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = size * 0.25; ctx.shadowOffsetY = size * 0.06; }
    const lines = wrap(value, maxWidth, maxLines);
    const lineHeight = size * 1.18;
    lines.forEach((lineText, index) => ctx.fillText(lineText, x, y + index * lineHeight));
    ctx.restore();
    return lines.length * lineHeight;
  }

  // Draws a photo to cover the frame, with the template's motion.
  function drawPhoto(photo, progress, alpha = 1, slideFrom = 0) {
    const W = canvas.width;
    const H = canvas.height;
    const img = photo.bitmap;
    const motion = state.template.motion;
    let scale = Math.max(W / img.width, H / img.height);
    let dx = 0;
    if (motion === 'zoom') scale *= 1.04 + 0.12 * progress;
    else if (motion === 'pan') { scale *= 1.14; dx = (progress - 0.5) * 0.1 * W; }
    else scale *= 1.06 + 0.05 * progress;
    const w = img.width * scale;
    const h = img.height * scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, (W - w) / 2 + dx + slideFrom * W, (H - h) / 2, w, h);
    ctx.restore();
  }

  function background(alphaPhoto) {
    const W = canvas.width;
    const H = canvas.height;
    const t = state.template;
    const gradient = ctx.createLinearGradient(0, 0, W, H);
    gradient.addColorStop(0, t.bg);
    gradient.addColorStop(1, t.bg2);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);
    if (alphaPhoto && state.photos[0]) {
      drawPhoto(state.photos[0], 0.5, alphaPhoto);
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.fillRect(0, 0, W, H);
    }
  }

  // Template decorations, animated by the time since the scene started.
  function decoration(local) {
    const W = canvas.width;
    const H = canvas.height;
    const u = Math.min(W, H) / 100;
    const t = state.template;
    ctx.save();
    ctx.strokeStyle = t.accent;
    ctx.fillStyle = t.accent;
    if (t.deco === 'burst') {
      ctx.globalAlpha = 0.18;
      const r = ease(local / 1.2) * Math.max(W, H) * 0.75;
      for (let i = 0; i < 16; i += 1) {
        const angle = (i / 16) * Math.PI * 2 + local * 0.15;
        ctx.beginPath();
        ctx.moveTo(W / 2, H / 2);
        ctx.lineTo(W / 2 + Math.cos(angle) * r, H / 2 + Math.sin(angle) * r);
        ctx.lineTo(W / 2 + Math.cos(angle + 0.12) * r, H / 2 + Math.sin(angle + 0.12) * r);
        ctx.fill();
      }
    } else if (t.deco === 'lines') {
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = u * 0.6;
      const len = ease(local / 1) * W * 0.6;
      ctx.beginPath(); ctx.moveTo(u * 6, u * 8); ctx.lineTo(u * 6 + len, u * 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W - u * 6, H - u * 8); ctx.lineTo(W - u * 6 - len, H - u * 8); ctx.stroke();
    } else if (t.deco === 'frame') {
      ctx.globalAlpha = 0.85 * ease(local / 1);
      ctx.lineWidth = u * 0.5;
      ctx.strokeRect(u * 4, u * 4, W - u * 8, H - u * 8);
      ctx.lineWidth = u * 0.2;
      ctx.strokeRect(u * 5.5, u * 5.5, W - u * 11, H - u * 11);
    } else if (t.deco === 'dots') {
      for (let i = 0; i < 26; i += 1) {
        const seed = Math.sin(i * 91.7) * 0.5 + 0.5;
        const seed2 = Math.sin(i * 37.3) * 0.5 + 0.5;
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = i % 2 ? t.accent : '#facc15';
        ctx.beginPath();
        ctx.arc(seed * W, ((seed2 * H) + local * u * 12 * (1 + seed)) % H, u * (0.6 + seed * 1.2), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function watermark() {
    const W = canvas.width;
    const H = canvas.height;
    const size = Math.round(Math.min(W, H) * 0.028);
    ctx.save();
    ctx.font = `600 ${size}px ${SANS}`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,.6)';
    ctx.shadowBlur = size * 0.4;
    ctx.fillText(WATERMARK, W - size, H - size * 0.8);
    ctx.restore();
  }

  // ---- Scenes ----

  function introScene(local) {
    const W = canvas.width;
    const H = canvas.height;
    const u = Math.min(W, H) / 100;
    const t = state.template;
    background(0.55);
    decoration(local);
    const title = text('#titleInput') || 'Your business name';
    const subtitle = text('#subtitleInput');
    const rise = (1 - ease(local / 0.9)) * u * 6;
    const top = H * (state.format === 'wide' ? 0.3 : 0.36) + rise;
    const used = drawText(title, { x: W / 2, y: top, size: u * 9, color: t.text, maxWidth: W * 0.86, alpha: ease(local / 0.7) });
    if (subtitle) {
      const delay = clamp((local - 0.5) / 0.7, 0, 1);
      const size = u * 5;
      ctx.save();
      ctx.font = `800 ${size}px ${t.font}`;
      const lines = wrap(subtitle, W * 0.78, 2);
      const boxW = Math.min(W * 0.9, Math.max(...lines.map((l) => ctx.measureText(l).width)) + size * 1.6);
      const boxH = lines.length * size * 1.18 + size * 0.9;
      const y = top + used + u * 4;
      ctx.globalAlpha = ease(delay);
      ctx.fillStyle = t.accent;
      ctx.beginPath();
      ctx.roundRect((W - boxW) / 2, y, boxW, boxH, size * 0.5);
      ctx.fill();
      ctx.restore();
      drawText(subtitle, { x: W / 2, y: y + size * 0.45, size, color: '#111111', maxWidth: W * 0.78, maxLines: 2, alpha: ease(delay), shadow: false });
    }
  }

  function photoScene(index, local) {
    const W = canvas.width;
    const H = canvas.height;
    const u = Math.min(W, H) / 100;
    const t = state.template;
    const photo = state.photos[index];
    const progress = local / state.perPhoto;
    ctx.fillStyle = t.bg;
    ctx.fillRect(0, 0, W, H);
    const previous = index > 0 ? state.photos[index - 1] : null;
    const fade = clamp(local / FADE, 0, 1);
    if (previous && fade < 1) drawPhoto(previous, 1, 1);
    if (t.motion === 'slide' && previous) drawPhoto(photo, progress, 1, (1 - ease(fade)) * 1);
    else drawPhoto(photo, progress, previous ? fade : 1);

    // Caption band and price tag.
    if (photo.caption || photo.price) {
      const appear = ease((local - 0.35) / 0.5);
      const band = ctx.createLinearGradient(0, H * 0.55, 0, H);
      band.addColorStop(0, 'rgba(0,0,0,0)');
      band.addColorStop(1, 'rgba(0,0,0,.78)');
      ctx.save();
      ctx.globalAlpha = appear;
      ctx.fillStyle = band;
      ctx.fillRect(0, H * 0.55, W, H * 0.45);
      ctx.restore();
      const captionSize = u * 6;
      const bottom = H - u * 12;
      let y = bottom;
      if (photo.price) {
        const size = u * 6.5;
        ctx.save();
        ctx.font = `800 ${size}px ${SANS}`;
        const tagW = ctx.measureText(photo.price).width + size * 1.2;
        const tagH = size * 1.5;
        y = bottom - tagH;
        const x = u * 6 - (1 - appear) * u * 12;
        ctx.globalAlpha = appear;
        ctx.fillStyle = t.accent;
        ctx.beginPath();
        ctx.roundRect(x, y, tagW, tagH, size * 0.35);
        ctx.fill();
        ctx.fillStyle = '#111111';
        ctx.textBaseline = 'middle';
        ctx.fillText(photo.price, x + size * 0.6, y + tagH / 2 + size * 0.05);
        ctx.restore();
      }
      if (photo.caption) {
        ctx.save();
        ctx.font = `800 ${captionSize}px ${t.font}`;
        const lines = wrap(photo.caption, W - u * 12, 2);
        ctx.restore();
        const height = lines.length * captionSize * 1.18;
        drawText(photo.caption, { x: u * 6, y: y - height - u * 2.5, size: captionSize, color: '#ffffff', maxWidth: W - u * 12, align: 'left', alpha: appear, maxLines: 2 });
      }
    }
  }

  function outroScene(local) {
    const W = canvas.width;
    const H = canvas.height;
    const u = Math.min(W, H) / 100;
    const t = state.template;
    background(0.35);
    decoration(local);
    const title = text('#titleInput') || 'Your business name';
    const closing = text('#closingInput');
    const contact = text('#contactInput');
    let y = H * (state.format === 'wide' ? 0.26 : 0.34);
    y += drawText(closing, { x: W / 2, y, size: u * 5.5, weight: 600, color: t.accent, maxWidth: W * 0.84, alpha: ease(local / 0.6), maxLines: 2 }) + u * 2;
    y += drawText(title, { x: W / 2, y, size: u * 8.5, color: t.text, maxWidth: W * 0.86, alpha: ease((local - 0.2) / 0.7) }) + u * 4;
    if (contact) {
      const size = u * 5.5;
      const appear = ease((local - 0.6) / 0.6);
      ctx.save();
      ctx.font = `800 ${size}px ${SANS}`;
      const label = `📞 ${contact}`;
      const boxW = ctx.measureText(label).width + size * 1.6;
      const boxH = size * 1.7;
      ctx.globalAlpha = appear;
      ctx.fillStyle = t.accent;
      ctx.beginPath();
      ctx.roundRect((W - boxW) / 2, y, boxW, boxH, boxH / 2);
      ctx.fill();
      ctx.fillStyle = '#111111';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, W / 2, y + boxH / 2 + size * 0.05);
      ctx.restore();
    }
  }

  // Draws the frame at time t (seconds from the start).
  function drawFrame(t) {
    sizeCanvas();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const photosEnd = INTRO + state.photos.length * state.perPhoto;
    if (t < INTRO || !state.photos.length) {
      if (t < INTRO) introScene(t);
      else outroScene(t - INTRO - state.perPhoto);
    } else if (t < photosEnd) {
      const index = Math.min(state.photos.length - 1, Math.floor((t - INTRO) / state.perPhoto));
      photoScene(index, t - INTRO - index * state.perPhoto);
    } else {
      outroScene(t - photosEnd);
    }
    // Fade in from black and out to black.
    const total = totalSeconds();
    const edge = Math.max(clamp(1 - t / 0.4, 0, 1), clamp((t - (total - 0.6)) / 0.6, 0, 1));
    if (edge > 0) { ctx.fillStyle = `rgba(0,0,0,${edge})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    watermark();
  }

  function showPoster() {
    if (state.playing || state.recording) return;
    drawFrame(state.photos.length ? INTRO + state.perPhoto * 0.8 : 1.6);
    const seconds = Math.round(totalSeconds());
    $('#lengthNote').textContent = state.photos.length
      ? `${state.photos.length} photo${state.photos.length === 1 ? '' : 's'} · about ${seconds} seconds · ${FORMATS[state.format].join(' × ')}`
      : 'Add photos to start. The preview updates as you type.';
  }

  // ---- Playback and recording ----

  async function musicSource(destination) {
    if (!state.music) return null;
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') await audioContext.resume();
    if (!state.music.buffer) state.music.buffer = await audioContext.decodeAudioData(await state.music.file.arrayBuffer());
    const source = audioContext.createBufferSource();
    source.buffer = state.music.buffer;
    source.loop = true;
    const gain = audioContext.createGain();
    const total = totalSeconds();
    const now = audioContext.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.9, now + 0.6);
    gain.gain.setValueAtTime(0.9, now + Math.max(0.7, total - 1.2));
    gain.gain.linearRampToValueAtTime(0, now + total);
    source.connect(gain);
    gain.connect(destination || audioContext.destination);
    source.start();
    return source;
  }

  function stopPlayback() {
    cancelAnimationFrame(frameRequest);
    state.playing = false;
    $('#playBtn').textContent = '▶ Preview';
  }

  // Runs the animation in real time; resolves when it ends.
  function run(onFrame) {
    return new Promise((resolve) => {
      const start = performance.now();
      const total = totalSeconds();
      const tick = (now) => {
        const t = (now - start) / 1000;
        drawFrame(Math.min(t, total));
        onFrame?.(t, total);
        if (t >= total || (!state.playing && !state.recording)) { resolve(); return; }
        frameRequest = requestAnimationFrame(tick);
      };
      frameRequest = requestAnimationFrame(tick);
    });
  }

  async function preview() {
    if (state.recording) return;
    if (state.playing) { stopPlayback(); showPoster(); return; }
    if (!state.photos.length) { setStatus('Add at least one photo first.'); return; }
    await fontsReady();
    state.playing = true;
    $('#playBtn').textContent = '■ Stop';
    let source = null;
    try { source = await musicSource(); } catch { setStatus('This music file could not be played.'); }
    await run();
    try { source?.stop(); } catch {}
    stopPlayback();
    showPoster();
  }

  function pickType() {
    const types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
    return types.find((type) => window.MediaRecorder?.isTypeSupported?.(type)) || '';
  }

  async function fontsReady() {
    const font = state.template.font;
    try { await Promise.all([document.fonts.load(`800 40px ${font}`), document.fonts.load(`600 40px ${SANS}`), document.fonts.ready]); } catch {}
  }

  async function makeVideo() {
    if (state.recording) return;
    if (!state.photos.length) { setStatus('Add at least one photo first.'); return; }
    if (!window.MediaRecorder || !canvas.captureStream) { setStatus('This browser cannot make videos. Please use Chrome on Android or a computer.'); return; }
    stopPlayback();
    await fontsReady();
    const type = pickType();
    const stream = canvas.captureStream(FPS);
    let source = null;
    if (state.music) {
      try {
        audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
        const destination = audioContext.createMediaStreamDestination();
        source = await musicSource(destination);
        destination.stream.getAudioTracks().forEach((track) => stream.addTrack(track));
      } catch { setStatus('The music could not be added; making the video without music.'); }
    }
    const chunks = [];
    const recorder = new MediaRecorder(stream, { ...(type ? { mimeType: type } : {}), videoBitsPerSecond: state.format === 'square' ? 6_000_000 : 5_000_000 });
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    const stopped = new Promise((resolve) => { recorder.onstop = resolve; });
    state.recording = true;
    $('#makeBtn').disabled = true;
    $('#playBtn').disabled = true;
    $('#result').hidden = true;
    recorder.start(250);
    await run((t, total) => setStatus(`Making your video… ${Math.min(100, Math.round((t / total) * 100))}% — keep this screen open`));
    try { source?.stop(); } catch {}
    recorder.stop();
    await stopped;
    stream.getTracks().forEach((track) => track.stop());
    state.recording = false;
    $('#makeBtn').disabled = false;
    $('#playBtn').disabled = false;
    const mime = recorder.mimeType || type || 'video/webm';
    const blob = new Blob(chunks, { type: mime });
    const url = URL.createObjectURL(blob);
    const ext = mime.includes('mp4') ? 'mp4' : 'webm';
    const name = (text('#titleInput') || 'my-video').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 40) || 'my-video';
    $('#resultVideo').src = url;
    $('#downloadLink').href = url;
    $('#downloadLink').download = `${name}.${ext}`;
    $('#result').hidden = false;
    setStatus(ext === 'mp4' ? 'Your video is ready ✓' : 'Your video is ready ✓ (WebM format: if WhatsApp does not accept it, open this page in the latest Chrome for MP4.)');
    showPoster();
  }

  // ---- Inputs ----

  async function loadPhoto(file) {
    const source = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(source.width, source.height));
    if (scale === 1) return { bitmap: source, url: URL.createObjectURL(file) };
    const bitmap = await createImageBitmap(source, { resizeWidth: Math.round(source.width * scale), resizeHeight: Math.round(source.height * scale), resizeQuality: 'high' });
    source.close?.();
    return { bitmap, url: URL.createObjectURL(file) };
  }

  function renderPhotos() {
    const list = $('#photoList');
    list.replaceChildren(...state.photos.map((photo, index) => {
      const row = document.createElement('div');
      row.className = 'vm-photo';
      const img = document.createElement('img');
      img.src = photo.url;
      img.alt = `Photo ${index + 1}`;
      const fields = document.createElement('div');
      fields.className = 'vm-photo-fields';
      const caption = document.createElement('input');
      caption.placeholder = 'Caption (optional)';
      caption.maxLength = 50;
      caption.value = photo.caption;
      caption.setAttribute('aria-label', `Caption for photo ${index + 1}`);
      caption.addEventListener('input', () => { photo.caption = caption.value.trim(); showPoster(); });
      const price = document.createElement('input');
      price.placeholder = 'Price, e.g. ₹499';
      price.maxLength = 20;
      price.value = photo.price;
      price.setAttribute('aria-label', `Price for photo ${index + 1}`);
      price.addEventListener('input', () => { photo.price = price.value.trim(); showPoster(); });
      fields.append(caption, price);
      const tools = document.createElement('div');
      tools.className = 'vm-photo-tools';
      const tool = (label, title, action, disabled) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'vm-icon';
        button.textContent = label;
        button.title = title;
        button.setAttribute('aria-label', `${title} (photo ${index + 1})`);
        button.disabled = disabled;
        button.addEventListener('click', action);
        return button;
      };
      tools.append(
        tool('↑', 'Move up', () => { [state.photos[index - 1], state.photos[index]] = [state.photos[index], state.photos[index - 1]]; renderPhotos(); }, index === 0),
        tool('✕', 'Remove', () => { state.photos.splice(index, 1); renderPhotos(); }, false),
      );
      row.append(img, fields, tools);
      return row;
    }));
    showPoster();
  }

  $('#photoInput').addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []).slice(0, MAX_PHOTOS - state.photos.length);
    event.target.value = '';
    if (!files.length) { setStatus(`You can add up to ${MAX_PHOTOS} photos.`); return; }
    setStatus('Adding photos…');
    for (const file of files) {
      try { state.photos.push({ ...(await loadPhoto(file)), caption: '', price: '' }); } catch { setStatus('One photo could not be read and was skipped.'); }
    }
    setStatus('');
    renderPhotos();
  });

  const templateList = $('#templateList');
  templateList.replaceChildren(...TEMPLATES.map((template) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'vm-template';
    button.setAttribute('role', 'radio');
    button.setAttribute('aria-checked', String(template === state.template));
    const swatch = document.createElement('span');
    swatch.className = 'vm-swatch';
    swatch.style.background = `linear-gradient(115deg, ${template.bg}, ${template.bg2} 60%, ${template.accent})`;
    button.append(swatch, document.createTextNode(template.name));
    button.addEventListener('click', () => {
      state.template = template;
      for (const item of templateList.children) item.setAttribute('aria-checked', String(item === button));
      fontsReady().then(showPoster);
    });
    return button;
  }));

  $('#formatList').addEventListener('click', (event) => {
    const button = event.target.closest('[data-format]');
    if (!button || state.recording) return;
    state.format = button.dataset.format;
    for (const item of $('#formatList').children) item.setAttribute('aria-checked', String(item === button));
    showPoster();
  });

  $('#speedInput').addEventListener('input', (event) => {
    state.perPhoto = Number(event.target.value);
    $('#speedValue').textContent = String(state.perPhoto);
    showPoster();
  });

  $('#musicInput').addEventListener('change', (event) => {
    const file = event.target.files?.[0];
    state.music = file ? { file, buffer: null } : null;
  });

  for (const id of ['#titleInput', '#subtitleInput', '#contactInput', '#closingInput']) $(id).addEventListener('input', showPoster);
  $('#playBtn').addEventListener('click', preview);
  $('#makeBtn').addEventListener('click', makeVideo);

  // Older browsers without roundRect get a simple rectangle.
  if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h) { this.rect(x, y, w, h); };
  }

  fontsReady().then(showPoster);
  showPoster();
})();
