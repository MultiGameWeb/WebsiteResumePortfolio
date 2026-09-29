(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const filled = (v) => typeof v === 'string' && v.trim() !== '';
  const clone = (v) => structuredClone(v);
  const KEY = 'sitecraft-photography-01';
  let data = clone(window.PHOTOGRAPHY_DEFAULTS || {});

  function load() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (saved && typeof saved === 'object') data = normalize(saved);
    } catch {
      data = clone(window.PHOTOGRAPHY_DEFAULTS || {});
    }
    window.SITECRAFT_DATA = data;
  }

  function normalize(value) {
    const defaults = clone(window.PHOTOGRAPHY_DEFAULTS || {});
    const out = { ...defaults, ...value };
    out.settings = { ...defaults.settings, ...(value.settings || {}) };
    out.brand = { ...defaults.brand, ...(value.brand || {}) };
    out.ui = { ...defaults.ui, ...(value.ui || {}) };
    out.home = { ...defaults.home, ...(value.home || {}) };
    out.copy = { ...defaults.copy, ...(value.copy || {}) };
    out.contact = { ...defaults.contact, ...(value.contact || {}) };
    out.socials = { ...defaults.socials, ...(value.socials || value.social || {}) };
    out.hero = { ...defaults.hero, ...(value.hero || {}) };
    out.mediaLibrary = Array.isArray(value.mediaLibrary) ? value.mediaLibrary : clone(defaults.mediaLibrary);
    out.videos = Array.isArray(value.videos) ? value.videos : clone(defaults.videos);
    out.services = Array.isArray(value.services) ? value.services : clone(defaults.services);
    out.gallery = Array.isArray(value.gallery) ? value.gallery : clone(defaults.gallery);
    out.reviews = Array.isArray(value.reviews) ? value.reviews : clone(defaults.reviews);
    out.faqs = Array.isArray(value.faqs) ? value.faqs : clone(defaults.faqs);
    // Migrate the earlier v2 shape (studioName/hero.image/gallery.image).
    if (!value.brand?.businessName && value.brand?.studioName) out.brand.businessName = value.brand.studioName;
    if (!value.hero?.mediaId && value.hero?.image) {
      const legacyHero = out.mediaLibrary.find(x => x.src === value.hero.image);
      if (legacyHero) out.hero.mediaId = legacyHero.id;
      else { const item = { id: 'migrated-hero', name: 'Migrated hero image', type: 'image', src: value.hero.image }; out.mediaLibrary.push(item); out.hero.mediaId = item.id; }
    }
    out.gallery = out.gallery.map((item, index) => {
      if (item.mediaId || !item.image) return item;
      const existing = out.mediaLibrary.find(x => x.src === item.image);
      const media = existing || { id: `migrated-gallery-${index}`, name: item.title || `Gallery image ${index + 1}`, type: 'image', src: item.image };
      if (!existing) out.mediaLibrary.push(media);
      return { ...item, mediaId: media.id, fallbackImage: item.image };
    });
    return out;
  }

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const attr = (v) => esc(v);
  const toast = (message) => {
    const t = $('#toast'); if (!t) return;
    t.textContent = message; t.classList.add('show'); clearTimeout(toast.timer);
    toast.timer = setTimeout(() => t.classList.remove('show'), 2300);
  };

  function getMedia(id, fallback = '') {
    return data.mediaLibrary?.find((item) => item.id === id)?.src || fallback;
  }

  function text(path, value) {
    $$(`[data-field="${path}"]`).forEach((node) => { node.textContent = value ?? ''; });
  }

  function renderBase() {
    const s = data.settings || {}, b = data.brand || {}, h = data.home || {}, c = data.contact || {}, copy = data.copy || {};
    Object.entries({
      'brand.businessName': b.businessName || 'Your Studio', 'brand.ownerName': b.ownerName || '', 'brand.motto': b.motto || '',
      'brand.about': b.about || '', 'brand.experience': b.experience || '', 'brand.teamStyle': b.teamStyle || '',
      'ui.navAbout': (data.ui || {}).navAbout || 'About', 'ui.navServices': (data.ui || {}).navServices || 'Services', 'ui.navGallery': (data.ui || {}).navGallery || 'Gallery', 'ui.navReviews': (data.ui || {}).navReviews || 'Reviews', 'ui.navContact': (data.ui || {}).navContact || 'Contact',
      'ui.formNameLabel': (data.ui || {}).formNameLabel || 'Your name', 'ui.formPhoneLabel': (data.ui || {}).formPhoneLabel || 'Phone number', 'ui.formMessageLabel': (data.ui || {}).formMessageLabel || 'Message',
      'ui.formSubmit': (data.ui || {}).formSubmit || 'Send enquiry', 'ui.mobileBarText': (data.ui || {}).mobileBarText || 'Planning a shoot?', 'ui.mobileBarTitle': (data.ui || {}).mobileBarTitle || 'Check your date', 'ui.mobileBarButton': (data.ui || {}).mobileBarButton || 'WhatsApp',
      'home.ribbonText': h.ribbonText || '', 'home.ribbonCta': h.ribbonCta || '', 'home.heroBadge': h.heroBadge || '',
      'home.heroTitle': h.heroTitle || b.businessName || 'Your Studio', 'home.heroSubtitle': h.heroSubtitle || '',
      'home.primaryText': h.primaryText || 'View portfolio', 'home.secondaryText': h.secondaryText || 'WhatsApp us',
      'home.proof1': h.proof1 || '', 'home.proof2': h.proof2 || '', 'home.proof3': h.proof3 || '',
      'home.midEyebrow': h.midEyebrow || '', 'home.midTitle': h.midTitle || '', 'home.midText': h.midText || '', 'home.midButton': h.midButton || '',
      'contact.callNumber': c.callNumber || '', 'contact.email': c.email || '', 'contact.locationName': c.locationName || '', 'privacy': data.privacy || ''
    }).forEach(([path, value]) => text(path, value));
    Object.entries(copy).forEach(([key, value]) => text(`copy.${key}`, value || ''));

    const hero = $('#heroImage');
    if (hero) { hero.src = getMedia(data.hero?.mediaId, data.hero?.imageFallback); hero.alt = `${b.businessName || 'Photography'} hero`; }
    $('#heroBg')?.style.setProperty('backgroundImage', `url("${getMedia(data.hero?.mediaId, data.hero?.imageFallback)}")`);
    const call = $('#callLink'); if (call) call.href = filled(c.callNumber) ? `tel:${c.callNumber.replace(/\s+/g,'')}` : '#contact';
    const mail = $('#emailLink'); if (mail) mail.href = filled(c.email) ? `mailto:${c.email}` : '#contact';
    const maps = $('#mapsLink'); if (maps) { maps.href = c.mapsUrl || '#contact'; maps.hidden = !filled(c.mapsUrl); }
    $$('.js-whatsapp').forEach((node) => { node.href = waLink(c.whatsapp); node.hidden = !filled(c.whatsapp); });
    const nameInput = $('#enquiryName'); if (nameInput) nameInput.placeholder = data.ui?.formNamePlaceholder || 'Your name';
    const phoneInput = $('#enquiryPhone'); if (phoneInput) phoneInput.placeholder = data.ui?.formPhonePlaceholder || '+91 98765 43210';
    const messageInput = $('#enquiryMessage'); if (messageInput) messageInput.placeholder = data.ui?.formMessagePlaceholder || 'Tell us about your shoot';
    document.title = `${b.businessName || 'Photography Studio'} — Photography Studio`;
    document.documentElement.style.setProperty('--accent', s.brandAccent || '#a88350');
    $('#topRibbon').hidden = s.showTopRibbon === false || (!filled(h.ribbonText) && !filled(h.ribbonCta));
    setSection('about', s.showAbout !== false);
    setSection('services', s.showServices !== false && (data.services || []).some(x => x.enabled !== false && filled(x.name)));
    setSection('video', s.showVideo !== false && (data.videos || []).some(x => x.enabled !== false && filled(x.url)));
    setSection('gallery', s.showGallery !== false && (data.gallery || []).some(x => x.enabled !== false && filled(getMedia(x.mediaId, x.fallbackImage))));
    setSection('reviews', s.showReviews !== false && (data.reviews || []).some(x => x.enabled !== false && filled(x.name) && filled(x.text)));
    setSection('contact', s.showContact !== false);
    setSection('faq', s.showFaq !== false && (data.faqs || []).some(x => x.enabled !== false && filled(x.question) && filled(x.answer)));
    $('#footer').hidden = false;
    $$('.privacy-text').forEach(n => n.closest('.footer-inner')?.classList.toggle('hide-privacy', s.showPrivacy === false || !filled(data.privacy)));
    $$('.hero-badge').forEach(n => n.hidden = s.showHeroBadge === false || !filled(h.heroBadge));
    document.body.classList.toggle('no-motion', s.animations === false || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function setSection(id, on) { const el = document.getElementById(id); if (el) el.hidden = !on; }

  function renderServices() {
    const root = $('#servicesGrid'); if (!root) return;
    const items = (data.services || []).filter(x => x.enabled !== false && filled(x.name));
    root.innerHTML = items.map((x, i) => `<article class="service-card lift reveal-child" style="--delay:${i*60}ms"><span class="service-index">0${i+1}</span><h3>${esc(x.name)}</h3>${filled(x.price) ? `<strong>${esc(x.price)}</strong>` : ''}${filled(x.description) ? `<p>${esc(x.description)}</p>` : ''}<a href="#contact" class="service-link">Enquire about this <b>→</b></a></article>`).join('');
    observeReveals();
  }

  function renderVideo() {
    const root = $('#videoGrid'); if (!root) return;
    const items = (data.videos || []).filter(x => x.enabled !== false && filled(x.url));
    root.innerHTML = items.map((x) => {
      const id = youtubeId(x.url);
      if (id) return `<article class="video-card"><div class="video-frame"><iframe src="https://www.youtube.com/embed/${attr(id)}" title="${esc(x.title || 'Photography film')}" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div><div class="video-meta"><strong>${esc(x.title || 'Photography film')}</strong><span>${esc(x.source || 'Video')}</span></div></article>`;
      return `<article class="video-card"><a class="video-link-card" href="${attr(x.url)}" target="_blank" rel="noreferrer"><span>Watch film ↗</span><strong>${esc(x.title || 'Photography film')}</strong><small>${esc(x.source || 'External video')}</small></a></article>`;
    }).join('');
  }

  function youtubeId(url) { const match = String(url || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/); return match ? match[1] : ''; }

  function renderGallery() {
    const grid = $('#galleryGrid'), filters = $('#galleryFilters'); if (!grid || !filters) return;
    const items = (data.gallery || []).filter(x => x.enabled !== false && filled(getMedia(x.mediaId, x.fallbackImage)));
    const cats = ['All', ...new Set(items.map(x => x.category).filter(filled))];
    filters.innerHTML = cats.map((c, i) => `<button class="filter${i === 0 ? ' active' : ''}" data-filter="${attr(c)}">${esc(c)}</button>`).join('');
    const paint = (cat) => {
      const shown = cat === 'All' ? items : items.filter(x => x.category === cat);
      grid.innerHTML = shown.map((x, i) => `<figure class="gallery-card reveal-child" style="--delay:${i*55}ms"><div class="gallery-image-wrap"><img src="${attr(getMedia(x.mediaId, x.fallbackImage))}" alt="${attr(x.title || x.category || 'Photography portfolio image')}" loading="lazy"><span class="image-overlay">${esc(x.category || 'Portfolio')}<b>↗</b></span></div>${filled(x.title) || filled(videoUrlFor(x.videoId)) ? `<figcaption><span>${esc(x.title || x.category)}</span>${filled(videoUrlFor(x.videoId)) ? `<a href="${attr(videoUrlFor(x.videoId))}" target="_blank" rel="noreferrer">Watch film ↗</a>` : ''}</figcaption>` : ''}</figure>`).join('');
      observeReveals();
    };
    paint('All');
    filters.onclick = (e) => { const b = e.target.closest('[data-filter]'); if (!b) return; $$('.filter', filters).forEach(x => x.classList.remove('active')); b.classList.add('active'); paint(b.dataset.filter || 'All'); };
  }

  function videoUrlFor(id) { return data.videos?.find(v => v.id === id && v.enabled !== false)?.url || ''; }

  function renderReviews() {
    const grid = $('#reviewsGrid'), avg = $('#reviewAverage'); if (!grid) return;
    const items = (data.reviews || []).filter(x => x.enabled !== false && filled(x.name) && filled(x.text));
    const average = items.length ? (items.reduce((sum, x) => sum + Number(x.rating || 0), 0) / items.length).toFixed(1) : '0.0';
    if (avg) avg.textContent = average;
    grid.innerHTML = items.map(x => {
      const rating = Math.max(0, Math.min(5, Number(x.rating || 0)));
      return `<blockquote class="review-card"><div class="stars">${'★'.repeat(rating)}${'☆'.repeat(5-rating)}</div><p>“${esc(x.text)}”</p><footer>${esc(x.name)} · via ${esc(x.source || 'Customer')}</footer></blockquote>`;
    }).join('');
  }

  function renderFaqs() {
    const list = $('#faqList'); if (!list) return;
    const items = (data.faqs || []).filter(x => x.enabled !== false && filled(x.question) && filled(x.answer));
    list.innerHTML = items.map(x => `<div class="faq-item"><button class="faq-question" aria-expanded="false"><span>${esc(x.question)}</span><b>＋</b></button><div class="faq-answer" hidden>${esc(x.answer)}</div></div>`).join('');
    list.onclick = (e) => { const q = e.target.closest('.faq-question'); if (!q) return; const a = q.nextElementSibling; const open = q.getAttribute('aria-expanded') === 'true'; $$('.faq-question', list).forEach(n => n.setAttribute('aria-expanded', 'false')); $$('.faq-answer', list).forEach(n => n.hidden = true); if (!open) { q.setAttribute('aria-expanded', 'true'); a.hidden = false; } };
  }

  function renderSocials() {
    const root = $('#socialLinks'); if (!root) return;
    if (data.settings?.showSocials === false) { root.hidden = true; return; }
    const labels = [['Instagram', data.socials?.instagram, 'IG'], ['Facebook', data.socials?.facebook, 'FB'], ['YouTube', data.socials?.youtube, 'YT'], ['Pinterest', data.socials?.pinterest, 'P']];
    const items = labels.filter(x => filled(x[1])); root.hidden = items.length === 0;
    root.innerHTML = items.map(x => `<a href="${attr(x[1])}" target="_blank" rel="noreferrer" aria-label="${attr(x[0])}">${x[2]}</a>`).join('');
  }

  function waLink(number) { const digits = String(number || '').replace(/\D/g, ''); return digits ? `https://wa.me/${digits}?text=${encodeURIComponent('Hi! I would like to enquire about a photography shoot.')}` : '#contact'; }

  function setupMenu() { const t = $('#menuToggle'), n = $('#siteNav'); if (!t || !n) return; t.onclick = () => { const open = t.getAttribute('aria-expanded') === 'true'; t.setAttribute('aria-expanded', String(!open)); n.classList.toggle('open', !open); }; $$('a', n).forEach(a => a.onclick = () => { t.setAttribute('aria-expanded', 'false'); n.classList.remove('open'); }); }

  function setupForm() {
    const f = $('#enquiryForm'), note = $('#formNote'); if (!f) return;
    f.onsubmit = (e) => { e.preventDefault(); const name = $('#enquiryName').value.trim(), phone = $('#enquiryPhone').value.trim(), message = $('#enquiryMessage').value.trim(); if (!name || !phone) { note.textContent = 'Please enter your name and phone number.'; note.className = 'form-note error'; return; } const saved = JSON.parse(localStorage.getItem('sitecraft-enquiries') || '[]'); saved.unshift({ name, phone, message, createdAt: new Date().toISOString(), template: 'photography-01' }); localStorage.setItem('sitecraft-enquiries', JSON.stringify(saved)); note.textContent = 'Thanks! Your enquiry has been received.'; note.className = 'form-note success'; f.reset(); toast('Enquiry received'); };
  }

  function observeReveals() {
    const reduceMotion = document.body.classList.contains('no-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      $$('.reveal,.reveal-child').forEach(n => n.classList.add('visible'));
      $$('[data-scroll-focus]').forEach(n => n.classList.add('scroll-focus-target'));
      return;
    }

    // First pass: the existing reveal animation only runs once.
    const revealObserver = new IntersectionObserver(entries => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    }), { threshold: .12 });
    $$('.reveal:not(.visible),.reveal-child:not(.visible)').forEach(el => revealObserver.observe(el));

    // Second pass: as sections/features cross the comfortable reading zone, give
    // them a tiny lift + left/right shake. Keep observing so it can happen again
    // on later scrolls without becoming distracting.
    const focusObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      const el = entry.target;
      if (entry.isIntersecting && entry.intersectionRatio >= .32) {
        el.classList.add('scroll-focus-target');
        const last = Number(el.dataset.lastFocus || 0);
        const now = performance.now();
        if (now - last > 850) {
          el.dataset.lastFocus = String(now);
          el.classList.remove('scroll-focus');
          void el.offsetWidth;
          el.classList.add('scroll-focus');
          clearTimeout(el._scrollFocusTimer);
          el._scrollFocusTimer = setTimeout(() => el.classList.remove('scroll-focus'), 760);
        }
      }
    }), { threshold: [.32, .58], rootMargin: '-18% 0px -18% 0px' });
    $$('[data-scroll-focus]').forEach(el => focusObserver.observe(el));
  }

  function renderAll() { renderBase(); renderServices(); renderVideo(); renderGallery(); renderReviews(); renderFaqs(); renderSocials(); observeReveals(); }

  load(); renderAll(); setupMenu(); setupForm();
  window.addEventListener('storage', (event) => { if (event.key === KEY) { load(); renderAll(); toast('Website updated from admin'); } });
})();
