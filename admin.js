(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const KEY = 'sitecraft-photography-01';
  const ENQ_KEY = 'sitecraft-enquiries';
  const clone = (v) => structuredClone(v);
  const defaults = clone(window.PHOTOGRAPHY_DEFAULTS || {});
  let data = loadStored();
  let pickerTarget = null;
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const filled = (v) => typeof v === 'string' && v.trim() !== '';
  const uid = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

  function normalize(value) {
    const out = { ...clone(defaults), ...value };
    for (const key of ['settings','brand','home','hero','copy','contact','socials']) out[key] = { ...clone(defaults[key] || {}), ...(value[key] || {}) };
    for (const key of ['mediaLibrary','videos','services','gallery','reviews','faqs']) out[key] = Array.isArray(value[key]) ? value[key] : clone(defaults[key] || []);
    if (!value.brand?.businessName && value.brand?.studioName) out.brand.businessName = value.brand.studioName;
    if (value.hero?.image && !value.hero?.mediaId) {
      const existing = out.mediaLibrary.find(x => x.src === value.hero.image);
      const media = existing || { id: 'migrated-hero', name: 'Migrated hero image', type: 'image', src: value.hero.image };
      if (!existing) out.mediaLibrary.push(media);
      out.hero.mediaId = media.id;
    }
    out.gallery = out.gallery.map((item, index) => {
      if (item.mediaId || !item.image) return item;
      const existing = out.mediaLibrary.find(x => x.src === item.image);
      const media = existing || { id: `migrated-gallery-${index}`, name: item.title || `Gallery image ${index + 1}`, type: 'image', src: item.image };
      if (!existing) out.mediaLibrary.push(media);
      return { ...item, mediaId: media.id, fallbackImage: item.image };
    });
    if (!out.gallery.length && Array.isArray(defaults.gallery)) out.gallery = clone(defaults.gallery);
    return out;
  }

  function loadStored() {
    try { const saved = JSON.parse(localStorage.getItem(KEY) || 'null'); return saved ? normalize(saved) : clone(defaults); } catch { return clone(defaults); }
  }

  function save(message = 'Changes saved') {
    localStorage.setItem(KEY, JSON.stringify(data));
    const indicator = $('#saveIndicator'); if (indicator) indicator.textContent = message;
    toast(message);
  }

  function toast(message) {
    const t = $('#toast'); if (!t) return; t.textContent = message; t.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function get(path) { return path.split('.').reduce((o, k) => o?.[k], data); }
  function set(path, value) { const keys = path.split('.'); let obj = data; keys.slice(0, -1).forEach(k => { if (!obj[k] || typeof obj[k] !== 'object') obj[k] = {}; obj = obj[k]; }); obj[keys.at(-1)] = value; }
  function imageById(id) { return data.mediaLibrary.find(x => x.id === id); }

  function syncSimpleFields() {
    $$('[data-path]').forEach(el => {
      el.value = get(el.dataset.path) ?? '';
      el.oninput = () => { set(el.dataset.path, el.value); save('Draft saved'); renderStats(); };
    });
    $$('[data-setting]').forEach(el => {
      el.checked = get(`settings.${el.dataset.setting}`) !== false;
      el.onchange = () => { set(`settings.${el.dataset.setting}`, el.checked); save('Setting updated'); renderStats(); updatePasswordBox(); };
    });
    $$('[data-setting-value]').forEach(el => {
      el.value = get(`settings.${el.dataset.settingValue}`) ?? '';
      el.oninput = () => { set(`settings.${el.dataset.settingValue}`, el.value); save('Setting saved'); };
    });
  }

  function renderStats() {
    $('#statImages').textContent = data.mediaLibrary.filter(x => x.type === 'image').length;
    $('#statServices').textContent = data.services.filter(x => x.enabled !== false && filled(x.name)).length;
    $('#statGallery').textContent = data.gallery.filter(x => x.enabled !== false).length;
    try { $('#statEnquiries').textContent = JSON.parse(localStorage.getItem(ENQ_KEY) || '[]').length; } catch { $('#statEnquiries').textContent = '0'; }
    $('#overviewName').textContent = data.brand.businessName || 'Your Studio';
    $('#overviewMotto').textContent = data.brand.motto || 'Add a studio motto';
    $('#overviewImage').src = imageById(data.hero.mediaId)?.src || data.hero.imageFallback || '';
    renderRecentEnquiries();
  }

  function renderRecentEnquiries() {
    const root = $('#recentEnquiries');
    if (!root) return;
    let items = []; try { items = JSON.parse(localStorage.getItem(ENQ_KEY) || '[]'); } catch {}
    items = Array.isArray(items) ? items.slice(0, 5) : [];
    root.innerHTML = items.length ? items.map(x => `<div class="mini-row"><span><strong>${esc(x.name || 'Unnamed')}</strong><small>${esc(x.message || 'No message')}</small></span><span>${esc(x.phone || '')}</span></div>`).join('') : '<div class="empty-state">No enquiries yet. Send one from the public website.</div>';
  }

  function mediaPicker(target) {
    pickerTarget = target;
    $('#pickerOverlay').hidden = false;
    renderPicker();
  }

  function renderPicker() {
    const root = $('#pickerGrid');
    const items = data.mediaLibrary.filter(x => x.type === 'image');
    root.innerHTML = items.length ? items.map(x => `<button class="picker-item" data-pick-media="${x.id}"><img src="${esc(x.src)}" alt=""><span>${esc(x.name)}</span></button>`).join('') : '<div class="empty-state">No images in storage. Upload one first.</div>';
    $$('[data-pick-media]').forEach(btn => btn.onclick = () => { if (pickerTarget) pickerTarget(btn.dataset.pickMedia); $('#pickerOverlay').hidden = true; });
  }

  async function compressImage(file) {
    if (!file.type.startsWith('image/')) throw new Error('Please select an image file.');
    const bitmap = await createImageBitmap(file);
    const max = 1800;
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d'); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.82);
  }

  function renderMedia() {
    const root = $('#mediaGrid'); if (!root) return;
    $('#mediaCount').textContent = `${data.mediaLibrary.length} stored image${data.mediaLibrary.length === 1 ? '' : 's'}`;
    root.innerHTML = data.mediaLibrary.filter(x => x.type === 'image').map(item => `<article class="media-card"><div class="media-thumb"><img src="${esc(item.src)}" alt="${esc(item.name)}"></div><div class="media-body"><strong>${esc(item.name)}</strong><small>Storage image</small><div class="media-actions"><button class="button ghost small" data-use-hero="${item.id}">Use as hero</button><button class="button danger small" data-delete-media="${item.id}">Delete</button></div></div></article>`).join('');
    $$('[data-use-hero]').forEach(btn => btn.onclick = () => { data.hero.mediaId = btn.dataset.useHero; save('Hero image updated'); renderStats(); });
    $$('[data-delete-media]').forEach(btn => btn.onclick = () => deleteMedia(btn.dataset.deleteMedia));
  }

  function deleteMedia(id) {
    const item = imageById(id); if (!item) return;
    if (!confirm(`Delete “${item.name}” from storage?`)) return;
    data.mediaLibrary = data.mediaLibrary.filter(x => x.id !== id);
    if (data.hero.mediaId === id) { data.hero.mediaId = ''; data.hero.imageFallback = ''; }
    data.gallery.forEach(x => { if (x.mediaId === id) { x.mediaId = ''; x.fallbackImage = ''; } });
    save('Image deleted'); renderMedia(); renderGallery(); renderStats();
  }

  function renderVideos() {
    const root = $('#videoEditor');
    root.innerHTML = data.videos.map((item, i) => `<article class="repeat-card"><div class="repeat-head"><div><span>Video ${i + 1}</span><strong>${esc(item.title || 'Untitled video')}</strong></div><button class="button danger small" data-delete-video="${item.id}">Delete</button></div><div class="two-col"><label class="field"><span>Title</span><input data-video="${item.id}" data-key="title" value="${esc(item.title)}"></label><label class="field"><span>Source</span><select data-video="${item.id}" data-key="source"><option ${item.source === 'YouTube' ? 'selected' : ''}>YouTube</option><option ${item.source === 'Vimeo' ? 'selected' : ''}>Vimeo</option><option ${item.source === 'Other' ? 'selected' : ''}>Other</option></select></label><label class="field wide"><span>YouTube / Vimeo URL</span><input data-video="${item.id}" data-key="url" value="${esc(item.url)}"></label><label class="check-line"><input type="checkbox" data-video-enabled="${item.id}" ${item.enabled !== false ? 'checked' : ''}> Show on website</label></div></article>`).join('');
    $$('[data-video]').forEach(el => el.oninput = () => { const item = data.videos.find(x => x.id === el.dataset.video); if (item) { item[el.dataset.key] = el.value; save('Video saved'); } });
    $$('[data-video-enabled]').forEach(el => el.onchange = () => { const item = data.videos.find(x => x.id === el.dataset.videoEnabled); if (item) { item.enabled = el.checked; save('Video visibility updated'); } });
    $$('[data-delete-video]').forEach(btn => btn.onclick = () => { data.videos = data.videos.filter(x => x.id !== btn.dataset.deleteVideo); data.gallery.forEach(g => { if (g.videoId === btn.dataset.deleteVideo) g.videoId = ''; }); save('Video deleted'); renderVideos(); renderGallery(); renderStats(); });
  }

  function renderServices() {
    const root = $('#servicesEditor');
    root.innerHTML = data.services.map((item, i) => `<article class="repeat-card"><div class="repeat-head"><div><span>Service ${i+1}</span><strong>${esc(item.name || 'Untitled service')}</strong></div><button class="button danger small" data-delete-service="${item.id}">Delete</button></div><div class="two-col"><label class="field"><span>Name</span><input data-service="${item.id}" data-key="name" value="${esc(item.name)}"></label><label class="field"><span>Price / package text</span><input data-service="${item.id}" data-key="price" value="${esc(item.price)}"></label><label class="field wide"><span>Description</span><textarea data-service="${item.id}" data-key="description" rows="3">${esc(item.description)}</textarea></label><label class="check-line"><input type="checkbox" data-service-enabled="${item.id}" ${item.enabled !== false ? 'checked' : ''}> Show on website</label></div></article>`).join('');
    $$('[data-service]').forEach(el => el.oninput = () => { const item = data.services.find(x => x.id === el.dataset.service); if (item) { item[el.dataset.key] = el.value; save('Service saved'); } });
    $$('[data-service-enabled]').forEach(el => el.onchange = () => { const item = data.services.find(x => x.id === el.dataset.serviceEnabled); if (item) { item.enabled = el.checked; save('Service visibility updated'); } });
    $$('[data-delete-service]').forEach(btn => btn.onclick = () => { data.services = data.services.filter(x => x.id !== btn.dataset.deleteService); save('Service deleted'); renderServices(); renderStats(); });
  }

  function renderGallery() {
    const root = $('#galleryEditor');
    root.innerHTML = data.gallery.map((item, i) => {
      const media = imageById(item.mediaId);
      return `<article class="repeat-card gallery-editor-card"><div class="repeat-head"><div><span>Gallery item ${i+1}</span><strong>${esc(item.title || 'Untitled image')}</strong></div><button class="button danger small" data-delete-gallery="${item.id}">Delete</button></div><div class="gallery-edit-grid"><div class="gallery-thumb"><img src="${esc(media?.src || item.fallbackImage || '')}" alt=""></div><div><div class="two-col"><label class="field"><span>Title</span><input data-gallery="${item.id}" data-key="title" value="${esc(item.title)}"></label><label class="field"><span>Category</span><select data-gallery="${item.id}" data-key="category">${['Weddings','Pre-Wedding','Portraits','Maternity','Birthdays','Corporate','Nature'].map(c => `<option ${item.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select></label></div><div class="inline-actions"><button class="button dark small" data-choose-gallery="${item.id}">Choose from storage</button><span class="selected-file">${esc(media?.name || 'No image selected')}</span></div><div class="two-col"><label class="field"><span>Featured video</span><select data-gallery="${item.id}" data-key="videoId"><option value="">None</option>${data.videos.map(v => `<option value="${v.id}" ${item.videoId === v.id ? 'selected' : ''}>${esc(v.title || 'Video')}</option>`).join('')}</select></label><label class="check-line"><input type="checkbox" data-gallery-enabled="${item.id}" ${item.enabled !== false ? 'checked' : ''}> Show on website</label></div></div></div></article>`;
    }).join('');
    $$('[data-gallery]').forEach(el => el.oninput = () => { const item = data.gallery.find(x => x.id === el.dataset.gallery); if (item) { item[el.dataset.key] = el.value; save('Gallery saved'); } });
    $$('[data-choose-gallery]').forEach(btn => btn.onclick = () => mediaPicker((mediaId) => { const item = data.gallery.find(x => x.id === btn.dataset.chooseGallery); if (item) { item.mediaId = mediaId; save('Gallery image selected'); renderGallery(); renderStats(); } }));
    $$('[data-gallery-enabled]').forEach(el => el.onchange = () => { const item = data.gallery.find(x => x.id === el.dataset.galleryEnabled); if (item) { item.enabled = el.checked; save('Gallery visibility updated'); } });
    $$('[data-delete-gallery]').forEach(btn => btn.onclick = () => { data.gallery = data.gallery.filter(x => x.id !== btn.dataset.deleteGallery); save('Gallery item deleted'); renderGallery(); renderStats(); });
  }

  function renderReviews() {
    const root = $('#reviewsEditor');
    root.innerHTML = data.reviews.map((item, i) => `<article class="repeat-card"><div class="repeat-head"><div><span>Review ${i+1}</span><strong>${esc(item.name || 'Untitled review')}</strong></div><button class="button danger small" data-delete-review="${item.id}">Delete</button></div><div class="two-col"><label class="field"><span>Customer name</span><input data-review="${item.id}" data-key="name" value="${esc(item.name)}"></label><label class="field"><span>Rating</span><select data-review="${item.id}" data-key="rating">${[5,4,3,2,1].map(v => `<option ${Number(item.rating) === v ? 'selected' : ''}>${v}</option>`).join('')}</select></label><label class="field wide"><span>Review text</span><textarea data-review="${item.id}" data-key="text" rows="3">${esc(item.text)}</textarea></label><label class="field"><span>Source</span><select data-review="${item.id}" data-key="source"><option ${item.source === 'Google' ? 'selected' : ''}>Google</option><option ${item.source === 'Facebook' ? 'selected' : ''}>Facebook</option></select></label><label class="check-line"><input type="checkbox" data-review-enabled="${item.id}" ${item.enabled !== false ? 'checked' : ''}> Show on website</label></div></article>`).join('');
    $$('[data-review]').forEach(el => el.oninput = () => { const item = data.reviews.find(x => x.id === el.dataset.review); if (item) { item[el.dataset.key] = el.dataset.key === 'rating' ? Number(el.value) : el.value; save('Review saved'); } });
    $$('[data-review-enabled]').forEach(el => el.onchange = () => { const item = data.reviews.find(x => x.id === el.dataset.reviewEnabled); if (item) { item.enabled = el.checked; save('Review visibility updated'); } });
    $$('[data-delete-review]').forEach(btn => btn.onclick = () => { data.reviews = data.reviews.filter(x => x.id !== btn.dataset.deleteReview); save('Review deleted'); renderReviews(); renderStats(); });
  }

  function renderFaq() {
    const root = $('#faqEditor');
    root.innerHTML = data.faqs.map((item, i) => `<article class="repeat-card"><div class="repeat-head"><div><span>FAQ ${i+1}</span><strong>${esc(item.question || 'Untitled question')}</strong></div><button class="button danger small" data-delete-faq="${item.id}">Delete</button></div><label class="field"><span>Question</span><input data-faq="${item.id}" data-key="question" value="${esc(item.question)}"></label><label class="field"><span>Answer</span><textarea data-faq="${item.id}" data-key="answer" rows="3">${esc(item.answer)}</textarea></label><label class="check-line"><input type="checkbox" data-faq-enabled="${item.id}" ${item.enabled !== false ? 'checked' : ''}> Show on website</label></article>`).join('');
    $$('[data-faq]').forEach(el => el.oninput = () => { const item = data.faqs.find(x => x.id === el.dataset.faq); if (item) { item[el.dataset.key] = el.value; save('FAQ saved'); } });
    $$('[data-faq-enabled]').forEach(el => el.onchange = () => { const item = data.faqs.find(x => x.id === el.dataset.faqEnabled); if (item) { item.enabled = el.checked; save('FAQ visibility updated'); } });
    $$('[data-delete-faq]').forEach(btn => btn.onclick = () => { data.faqs = data.faqs.filter(x => x.id !== btn.dataset.deleteFaq); save('FAQ deleted'); renderFaq(); renderStats(); });
  }

  function add(kind) {
    const id = uid(kind.slice(0, 3));
    if (kind === 'video') data.videos.push({ id, title: 'New film', url: '', source: 'YouTube', enabled: true });
    if (kind === 'service') data.services.push({ id, name: 'New service', price: 'Custom quote', description: 'Add package details here.', enabled: true });
    if (kind === 'gallery') data.gallery.push({ id, title: 'New gallery image', category: 'Weddings', mediaId: '', fallbackImage: '', videoId: '', enabled: true });
    if (kind === 'review') data.reviews.push({ id, name: 'New customer', text: 'Add testimonial text.', rating: 5, source: 'Google', enabled: true });
    if (kind === 'faq') data.faqs.push({ id, question: 'New frequently asked question?', answer: 'Add the answer here.', enabled: true });
    save(`${kind} added`);
    ({video:renderVideos, service:renderServices, gallery:renderGallery, review:renderReviews, faq:renderFaq})[kind](); renderStats();
  }

  function updatePasswordBox() { $('#passwordBox').hidden = data.settings.passwordProtected !== true; }

  function initAuth() {
    const protectedMode = data.settings.passwordProtected === true && filled(data.settings.adminPassword);
    const screen = $('#authScreen'), app = $('#adminApp'), form = $('#loginForm');
    if (!protectedMode) { screen.hidden = true; app.hidden = false; return; }
    screen.hidden = false; app.hidden = true;
    $('#authMessage').textContent = 'Enter the admin password to continue.';
    form.onsubmit = (e) => { e.preventDefault(); const pass = $('#loginPassword').value; if (pass === data.settings.adminPassword) { screen.hidden = true; app.hidden = false; } else { toast('Incorrect admin password'); } };
  }

  function initTabs() {
    $$('.side-tab').forEach(btn => btn.onclick = () => { $$('.side-tab').forEach(x => x.classList.remove('active')); btn.classList.add('active'); $$('.tab-panel').forEach(x => x.classList.remove('active')); $('#tab-' + btn.dataset.tab).classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' }); });
    $$('[data-jump]').forEach(btn => btn.onclick = () => { const tab = $(`.side-tab[data-tab="${btn.dataset.jump}"]`); if (tab) tab.click(); });
  }

  function initUploads() {
    $('#imageUpload').onchange = async (e) => {
      const files = [...(e.target.files || [])];
      if (!files.length) return;
      for (const file of files) {
        try { const src = await compressImage(file); data.mediaLibrary.push({ id: uid('img'), name: file.name.replace(/\.[^.]+$/, ''), type: 'image', src }); } catch (error) { toast(error.message || 'Image upload failed'); }
      }
      save(`${files.length} image${files.length === 1 ? '' : 's'} added to storage`); renderMedia(); renderStats(); e.target.value = '';
    };
  }

  $('#chooseHero').onclick = () => mediaPicker((mediaId) => { data.hero.mediaId = mediaId; save('Hero image selected'); renderStats(); });
  $('#closePicker').onclick = () => { $('#pickerOverlay').hidden = true; pickerTarget = null; };
  $('#pickerOverlay').onclick = (e) => { if (e.target === $('#pickerOverlay')) { $('#pickerOverlay').hidden = true; pickerTarget = null; } };
  $('#saveTop').onclick = () => save('All changes saved');
  $('#addVideo').onclick = () => add('video'); $('#addService').onclick = () => add('service'); $('#addGallery').onclick = () => add('gallery'); $('#addReview').onclick = () => add('review'); $('#addFaq').onclick = () => add('faq');
  $('#resetBtn').onclick = () => { if (confirm('Reset all Photography Template 01 content to the default demo?')) { data = clone(defaults); save('Defaults restored'); location.reload(); } };
  $('#exportBtn').onclick = () => { const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'photography-template-01-settings.json'; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500); };
  $('#importInput').onchange = () => { const file = $('#importInput').files?.[0]; if (!file) return; const r = new FileReader(); r.onload = () => { try { data = normalize(JSON.parse(r.result)); save('Settings imported'); location.reload(); } catch { toast('Invalid settings file'); } }; r.readAsText(file); };
  $('#savePassword').onclick = () => { const pass = $('#newPassword').value, confirmPass = $('#confirmPassword').value; if (!pass || pass !== confirmPass) { toast('Passwords do not match'); return; } data.settings.adminPassword = pass; data.settings.passwordProtected = true; save('Admin password saved'); setTimeout(() => location.reload(), 500); };
  $('#passwordProtected').onchange = () => { data.settings.passwordProtected = $('#passwordProtected').checked; save(data.settings.passwordProtected ? 'Password protection enabled' : 'Password protection disabled'); updatePasswordBox(); setTimeout(initAuth, 50); };

  syncSimpleFields(); renderStats(); renderMedia(); renderVideos(); renderServices(); renderGallery(); renderReviews(); renderFaq(); updatePasswordBox(); initTabs(); initUploads(); initAuth();
})();
