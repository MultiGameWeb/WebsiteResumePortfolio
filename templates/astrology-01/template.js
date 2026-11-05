const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=v=>{const x=String(v??'').trim();return /^(https?:|tel:|mailto:|data:image\/)/i.test(x)||/^[\w./-]+$/.test(x)?x:''};
const digits=v=>String(v??'').replace(/\D/g,'');
const tel=v=>String(v??'').replace(/[^\d+]/g,'');
const wa=(n,msg)=>{const p=digits(n);return p?'https://wa.me/'+p+(msg?'?text='+encodeURIComponent(msg):''):''};
const initials=n=>String(n||'').split(/\s+/).filter(w=>/^[A-Za-z]/.test(w)).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'✦';

export function render(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{};
  const ok=x=>selected.includes(x);
  const services=(d.services||[]).filter(x=>x.enabled!==false);
  const rashis=(d.rashis||[]).filter(x=>x.enabled!==false);
  const reviews=(d.reviews||[]).filter(x=>x.enabled!==false);
  const faqs=(d.faqs||[]).filter(x=>x.enabled!==false);
  const name=b.businessName||'Your Astrology Studio';
  const waOn=ok('whatsapp')&&digits(c.whatsapp);
  const waLink=msg=>waOn?wa(c.whatsapp,msg):'';
  const showAbout=ok('about')&&s.showAbout!==false;
  const showServices=ok('services')&&s.showServices!==false&&services.length;
  const showReviews=ok('reviews')&&s.showReviews!==false&&reviews.length;
  const showContact=ok('contact')&&s.showContact!==false;
  const nav=[showAbout&&['#about','About'],showServices&&['#services','Services'],ok('rashis')&&rashis.length&&['#rashis','Rashi'],showReviews&&['#reviews','Reviews'],ok('faq')&&faqs.length&&['#faq','FAQ'],showContact&&['#contact','Contact']].filter(Boolean);
  let html='<div class="site-preview astro1">';

  html+='<header class="as-nav"><a class="as-brand" href="#top"><span class="as-mark" aria-hidden="true">'+esc(initials(name))+'</span><span><strong>'+esc(name)+'</strong>'+(b.motto?'<small>'+esc(b.motto)+'</small>':'')+'</span></a>'+
    '<nav aria-label="Main">'+nav.map(([href,label])=>'<a href="'+href+'">'+label+'</a>').join('')+'</nav>'+
    '<div class="as-nav-actions">'+(waOn?'<a class="as-btn gold small" target="_blank" rel="noopener" href="'+esc(waLink('Namaste, I would like to book a consultation.'))+'">Book now</a>':'')+
    '<a class="template-admin-link" href="admin.html?template=astrology-01">Admin</a></div></header>';

  if(ok('home')){
    html+='<section class="as-hero" id="top">'+(url(d.hero)?'<img src="'+esc(url(d.hero))+'" alt="">':'')+'<div class="as-hero-shade"></div><div class="as-stars" aria-hidden="true"></div>'+
      '<div class="as-hero-copy"><span class="as-eyebrow">'+esc(b.ownerName||'Vedic astrology')+'</span><h1>'+esc(h.title||'Guidance for every important chapter.')+'</h1>'+(h.text?'<p>'+esc(h.text)+'</p>':'')+
      '<div class="as-actions">'+(waOn?'<a class="as-btn gold" target="_blank" rel="noopener" href="'+esc(waLink('Namaste, I would like to book a consultation.'))+'">Book on WhatsApp</a>':'')+
      (c.call?'<a class="as-btn ghost" href="tel:'+esc(tel(c.call))+'">Call '+esc(c.call)+'</a>':'')+'</div>'+
      '<ul class="as-hero-facts">'+(services.length?'<li><b>'+services.length+'</b> consultation types</li>':'')+'<li><b>1:1</b> private sessions</li>'+(c.location?'<li><b>📍</b> '+esc(String(c.location).split(',')[0])+'</li>':'')+'</ul></div></section>';
  }

  if(showAbout){
    html+='<section class="as-section as-about" id="about"><div class="as-about-copy"><span class="as-kicker">About</span><h2>'+esc(b.motto||'Clarity through Vedic wisdom.')+'</h2><p>'+esc(b.about||'Personal consultations rooted in Vedic astrology and practical, respectful guidance.')+'</p></div>'+
      '<aside class="as-about-card"><span class="as-mark big" aria-hidden="true">✦</span><strong>'+esc(b.ownerName||name)+'</strong><span>Astrologer · '+esc(name)+'</span>'+(c.location?'<span>'+esc(c.location)+'</span>':'')+'</aside></section>';
  }

  if(showServices){
    html+='<section class="as-section as-services" id="services"><div class="as-head"><span class="as-kicker">Services</span><h2>Consultations we offer</h2><p>Choose a consultation and send us a message. We will confirm the date, time and the birth details we need.</p></div>'+
      '<div class="as-service-grid">'+services.map((x,i)=>'<article class="as-service"><span class="as-num">'+String(i+1).padStart(2,'0')+'</span><h3>'+esc(x.name||'Consultation')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+
        '<div class="as-service-foot">'+(x.price?'<strong>'+esc(x.price)+'</strong>':'<span></span>')+(waOn?'<a target="_blank" rel="noopener" href="'+esc(waLink('Namaste, I would like to book: '+(x.name||'a consultation')))+'">Book →</a>':'')+'</div></article>').join('')+'</div></section>';
    html+='<section class="as-section as-steps" aria-label="How a consultation works"><div class="as-step"><b>1</b><h3>Share your details</h3><p>Send your name, date, time and place of birth on WhatsApp or call.</p></div><div class="as-step"><b>2</b><h3>Get your slot</h3><p>We confirm a convenient time for an in-person or phone consultation.</p></div><div class="as-step"><b>3</b><h3>Receive guidance</h3><p>A calm, one-to-one conversation about your questions and next steps.</p></div></section>';
  }

  if(ok('rashis')&&rashis.length){
    html+='<section class="as-section as-rashis" id="rashis"><div class="as-head"><span class="as-kicker">Rashi</span><h2>Explore the 12 signs</h2></div><div class="as-rashi-grid">'+
      rashis.map(x=>'<article><span class="as-symbol" aria-hidden="true">'+esc(x.symbol||'✦')+'</span><h3>'+esc(x.name||'Rashi')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'</article>').join('')+'</div></section>';
  }

  if(showReviews){
    html+='<section class="as-section as-reviews" id="reviews"><div class="as-head"><span class="as-kicker">Client experiences</span><h2>Kind words from clients</h2></div><div class="as-review-grid">'+
      reviews.map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||0));return '<figure>'+(r?'<div class="as-stars-row" aria-label="'+r+' out of 5">'+'★'.repeat(r)+'</div>':'')+'<blockquote>“'+esc(x.text||'')+'”</blockquote><figcaption>'+esc(x.name||'Client')+'</figcaption></figure>'}).join('')+'</div></section>';
  }

  if(ok('faq')&&faqs.length){
    html+='<section class="as-section as-faq" id="faq"><div class="as-head"><span class="as-kicker">FAQ</span><h2>Questions before you book</h2></div><div class="as-faq-list">'+
      faqs.map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
  }

  if(showContact){
    html+='<section class="as-contact" id="contact"><div><span class="as-kicker">Contact</span><h2>Book a consultation</h2><p>'+[c.location?esc(c.location):'',c.call?'<a href="tel:'+esc(tel(c.call))+'">'+esc(c.call)+'</a>':''].filter(Boolean).join(' · ')+'</p></div>'+
      '<div class="as-actions">'+(waOn?'<a class="as-btn gold" target="_blank" rel="noopener" href="'+esc(waLink('Namaste, I would like to book a consultation.'))+'">WhatsApp us</a>':'')+
      (c.call?'<a class="as-btn ghost" href="tel:'+esc(tel(c.call))+'">Call</a>':'')+(ok('location')&&url(c.maps)?'<a class="as-btn ghost" target="_blank" rel="noopener" href="'+esc(url(c.maps))+'">Directions</a>':'')+'</div></section>';
  }

  html+='<footer class="as-footer"><strong>'+esc(name)+'</strong><span>© '+new Date().getFullYear()+' · '+esc(b.motto||'All rights reserved.')+'</span></footer>';
  if(waOn)html+='<a class="as-float" target="_blank" rel="noopener" href="'+esc(waLink('Namaste, I would like to book a consultation.'))+'" aria-label="Chat on WhatsApp">WhatsApp</a>';
  return html+'</div>';
}

export function init(root){scMobileNav(arguments[0]);}

/* SiteCraft mobile menu: adds a menu button when the header nav is hidden (phones/tablets). */
function scMobileNav(root){
  const header=root&&root.querySelector('header');const nav=header&&header.querySelector('nav');
  if(!nav||header.querySelector('.sc-nav-btn'))return;
  const btn=document.createElement('button');
  btn.type='button';btn.className='sc-nav-btn';btn.hidden=true;
  btn.setAttribute('aria-expanded','false');btn.setAttribute('aria-label','Open menu');
  btn.innerHTML='<span></span><span></span><span></span>';
  header.appendChild(btn);
  const setOpen=o=>{header.classList.toggle('sc-nav-open',o);btn.setAttribute('aria-expanded',String(o));btn.setAttribute('aria-label',o?'Close menu':'Open menu');};
  const bgOf=el=>{for(let x=el;x&&x.nodeType===1;x=x.parentElement){const c=getComputedStyle(x).backgroundColor;const m=c.match(/[\d.]+/g);if(m&&(m.length<4||+m[3]>.5))return 'rgb('+m.slice(0,3).join(',')+')';}return null;};
  const sync=()=>{
    const was=header.classList.contains('sc-nav-open');header.classList.remove('sc-nav-open');
    const hidden=!nav.getClientRects().length||getComputedStyle(nav).display==='none';
    btn.hidden=!hidden;
    if(hidden){if(getComputedStyle(header).position==='static')header.style.position='relative';const tc=(getComputedStyle(nav.querySelector('a')||nav).color.match(/[\d.]+/g)||[0,0,0]).slice(0,3).reduce((a,b)=>a+ +b,0)/3;header.style.setProperty('--sc-nav-bg',bgOf(header)||(tc>140?'#111':'#fff'));}
    header.classList.toggle('sc-nav-open',was&&hidden);if(!hidden)setOpen(false);
  };
  btn.addEventListener('click',()=>setOpen(!header.classList.contains('sc-nav-open')));
  nav.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&header.classList.contains('sc-nav-open')){setOpen(false);btn.focus();}});
  addEventListener('resize',sync);sync();
}
