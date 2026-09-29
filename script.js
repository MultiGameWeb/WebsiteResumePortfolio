(() => {
  'use strict';
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const filled = (v) => typeof v === 'string' && v.trim() !== '';
  const clone = (v) => structuredClone(v);
  const STORE_KEY = 'sitecraft-photography-01';
  const defaults = window.PHOTOGRAPHY_DEFAULTS || window.PHOTOGRAPHY_TEMPLATE_DATA;

  let data = clone(defaults || {});
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (saved) data = saved;
  } catch {}
  window.SITECRAFT_DATA = data;

  const esc = (v) => String(v ?? '').replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[ch]));
  const attr = (v) => esc(v).replace(/'/g,'&#39;');
  const waLink = (number) => { const digits = String(number || '').replace(/\D/g,''); return digits ? `https://wa.me/${digits}?text=${encodeURIComponent('Hi! I would like to enquire about a photography shoot.')}` : '#contact'; };

  function text(field, value) { $$(`[data-field="${field}"]`).forEach(n => n.textContent = value || ''); }
  function href(field, value) { $$(`[data-field-link="${field}"]`).forEach(n => { n.href = value || '#contact'; n.hidden = !filled(value); }); }

  function renderBase() {
    const s = data.settings || {};
    text('studioName', data.brand?.studioName || 'Your Studio');
    text('motto', data.brand?.motto || '');
    const copy = data.copy || {};
    Object.keys(copy).forEach(key => text(`copy.${key}`, copy[key]));
    const labels = { footerBackLabel:'Back to top', footerFaqLabel:'FAQs', footerEnquiryLabel:'Enquiry', footerAdminLabel:'Admin' };
    Object.keys(labels).forEach(key => { const el=$(`[data-field-href-label="${key}"]`); if(el) el.textContent=copy[key] || labels[key]; });
    text('about', data.brand?.about || '');
    text('experience', data.brand?.experience || '');
    text('teamStyle', data.brand?.teamStyle || '');
    text('phone', data.contact?.phone || '');
    text('email', data.contact?.email || '');
    text('address', data.contact?.address || '');
    text('privacy', data.privacy || '');
    text('hero.badge', data.hero?.badge || '');
    text('hero.title', data.hero?.title || data.brand?.studioName || 'Your Studio');
    text('hero.subtitle', data.hero?.subtitle || '');
    text('hero.primaryText', data.hero?.primaryText || 'View portfolio');
    text('hero.secondaryText', data.hero?.secondaryText || 'WhatsApp us');
    const hero = $('#heroImage'); if (hero) { hero.src = data.hero?.image || ''; hero.alt = `${data.brand?.studioName || 'Photography'} hero`; }
    href('phone', filled(data.contact?.phone) ? `tel:${data.contact.phone.replace(/\s+/g,'')}` : '');
    href('email', filled(data.contact?.email) ? `mailto:${data.contact.email}` : '');
    href('mapsUrl', data.contact?.mapsUrl || '');
    $$('.js-whatsapp').forEach(n => { n.href = waLink(data.contact?.whatsapp); n.hidden = !filled(data.contact?.whatsapp); });
    document.documentElement.style.setProperty('--accent', s.brandAccent || '#a88350');
    document.title = `${data.brand?.studioName || 'Photography Studio'} — Photography Studio`;
    setSection('about', !!s.showAbout);
    setSection('services', !!s.showServices);
    setSection('gallery', !!s.showGallery);
    setSection('reviews', !!s.showReviews);
    setSection('contact', !!s.showContact);
    setSection('faq', !!s.showFaq);
    $('#topRibbon').hidden = s.showTopRibbon === false;
    $$('.hero-badge').forEach(n => n.hidden = s.showHeroBadge === false || !filled(data.hero?.badge));
    $('#footer').hidden = false;
    $$('.privacy-text').forEach(n => n.closest('.footer-inner')?.classList.toggle('hide-privacy', s.showPrivacy === false || !filled(data.privacy)));
    document.body.classList.toggle('no-motion', s.animations === false || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function setSection(id, on) { const el = document.getElementById(id); if (el) el.hidden = !on; }

  function renderServices() {
    const grid = $('#servicesGrid'); if (!grid) return;
    const items = (data.services || []).filter(x => filled(x.name));
    grid.innerHTML = items.map((x,i) => `<article class="service-card lift reveal-child" style="--delay:${i*60}ms"><span class="service-index">0${i+1}</span><h3>${esc(x.name)}</h3>${filled(x.price)?`<strong>${esc(x.price)}</strong>`:''}${filled(x.description)?`<p>${esc(x.description)}</p>`:''}<a href="#contact" class="service-link">Enquire about this →</a></article>`).join('');
  }

  function renderGallery() {
    const grid = $('#galleryGrid'), filters = $('#galleryFilters'); if (!grid || !filters) return;
    const items = (data.gallery || []).filter(x => filled(x.image));
    const cats = ['All', ...new Set(items.map(x => x.category).filter(filled))];
    filters.innerHTML = cats.map((c,i)=>`<button class="filter${i===0?' active':''}" data-filter="${attr(c)}">${esc(c)}</button>`).join('');
    const paint = (cat) => {
      const shown = cat === 'All' ? items : items.filter(x => x.category === cat);
      grid.innerHTML = shown.map((x,i)=>`<figure class="gallery-card reveal-child" style="--delay:${i*55}ms"><div class="gallery-image-wrap"><img src="${attr(x.image)}" alt="${attr(x.title || x.category || 'Photography portfolio image')}" loading="lazy"><span class="image-overlay">${esc(x.category || 'Portfolio')}<b>↗</b></span></div>${filled(x.title)||filled(x.video)?`<figcaption><span>${esc(x.title || x.category)}</span>${filled(x.video)?`<a href="${attr(x.video)}" target="_blank" rel="noreferrer">Watch film ↗</a>`:''}</figcaption>`:''}</figure>`).join('');
      observeReveals();
    };
    paint('All');
    filters.onclick = (e) => { const b = e.target.closest('[data-filter]'); if (!b) return; $$('.filter',filters).forEach(x=>x.classList.remove('active')); b.classList.add('active'); paint(b.dataset.filter || 'All'); };
  }

  function renderReviews() {
    const grid=$('#reviewsGrid'), avg=$('#reviewAverage'); if(!grid)return;
    const items=(data.reviews||[]).filter(x=>x.approved !== false && filled(x.name) && filled(x.text));
    const average=items.length?(items.reduce((s,x)=>s+Number(x.rating||0),0)/items.length).toFixed(1):'0.0';
    if(avg) avg.textContent=average;
    grid.innerHTML=items.map(x=>`<blockquote class="review-card"><div class="stars">${'★'.repeat(Math.max(0,Math.min(5,Number(x.rating||0))))}${'☆'.repeat(5-Math.max(0,Math.min(5,Number(x.rating||0))))}</div><p>“${esc(x.text)}”</p><footer>${esc(x.name)} · via ${esc(x.source||'Customer')}</footer></blockquote>`).join('');
  }

  function renderFaqs() {
    const list=$('#faqList'); if(!list)return;
    const items=(data.faqs||[]).filter(x=>filled(x.question)&&filled(x.answer));
    list.innerHTML=items.map((x,i)=>`<div class="faq-item"><button class="faq-question" aria-expanded="false"><span>${esc(x.question)}</span><b>＋</b></button><div class="faq-answer" hidden>${esc(x.answer)}</div></div>`).join('');
    list.onclick=(e)=>{const q=e.target.closest('.faq-question');if(!q)return;const a=q.nextElementSibling;const open=q.getAttribute('aria-expanded')==='true';$$('.faq-question',list).forEach(n=>n.setAttribute('aria-expanded','false'));$$('.faq-answer',list).forEach(n=>n.hidden=true);if(!open){q.setAttribute('aria-expanded','true');a.hidden=false;}};
    const sec=$('#faq'); if(sec)sec.hidden=items.length===0 || data.settings?.showFaq===false;
  }

  function renderSocials(){
    const root=$('#socialLinks');if(!root)return;
    const items=[['Instagram',data.socials?.instagram,'IG'],['Facebook',data.socials?.facebook,'FB'],['YouTube',data.socials?.youtube,'YT'],['Pinterest',data.socials?.pinterest,'P']].filter(x=>filled(x[1]));
    root.hidden=items.length===0;root.innerHTML=items.map(x=>`<a href="${attr(x[1])}" target="_blank" rel="noreferrer" aria-label="${attr(x[0])}">${x[2]}</a>`).join('');
  }

  function setupMenu(){const t=$('#menuToggle'),n=$('#siteNav');if(!t||!n)return;t.onclick=()=>{const open=t.getAttribute('aria-expanded')==='true';t.setAttribute('aria-expanded',String(!open));n.classList.toggle('open',!open)};$$('a',n).forEach(a=>a.onclick=()=>{t.setAttribute('aria-expanded','false');n.classList.remove('open')});}

  function setupForm(){const f=$('#enquiryForm'),note=$('#formNote');if(!f)return;f.onsubmit=e=>{e.preventDefault();const name=$('#enquiryName').value.trim(),phone=$('#enquiryPhone').value.trim(),message=$('#enquiryMessage').value.trim();if(!name||!phone){note.textContent='Please enter your name and phone number.';note.className='form-note error';return;}const saved=JSON.parse(localStorage.getItem('sitecraft-enquiries')||'[]');saved.unshift({name,phone,message,createdAt:new Date().toISOString()});localStorage.setItem('sitecraft-enquiries',JSON.stringify(saved));note.textContent='Thanks! Your enquiry has been received.';note.className='form-note success';f.reset();showToast('Enquiry received');}}
  function showToast(m){const t=$('#toast');if(!t)return;t.textContent=m;t.classList.add('show');clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>t.classList.remove('show'),2300)}

  function observeReveals(){ if(document.body.classList.contains('no-motion')){$$('.reveal,.reveal-child').forEach(n=>n.classList.add('visible'));return;} const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.14}); $$('.reveal:not(.visible),.reveal-child:not(.visible)').forEach(el=>io.observe(el)); }

  renderBase();renderServices();renderGallery();renderReviews();renderFaqs();renderSocials();setupMenu();setupForm();observeReveals();
})();
