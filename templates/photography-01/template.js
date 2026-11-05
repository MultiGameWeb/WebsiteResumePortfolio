const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=v=>{const x=String(v??'').trim();return /^(https?:|tel:|mailto:|data:image\/)/i.test(x)||/^[\w./-]+$/.test(x)?x:''};
const tel=v=>String(v??'').replace(/[^\d+]/g,'');
const digits=v=>String(v??'').replace(/\D/g,'');
const wa=(n,msg)=>{const p=digits(n);return p?'https://wa.me/'+p+(msg?'?text='+encodeURIComponent(msg):''):''};

function scBaseRender(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},ok=x=>selected.includes(x);
  const services=(d.services||[]).filter(x=>x.enabled!==false);
  const gallery=(d.gallery||[]).filter(x=>x.enabled!==false&&url(x.image));
  const reviews=(d.reviews||[]).filter(x=>x.enabled!==false);
  const faqs=(d.faqs||[]).filter(x=>x.enabled!==false);
  const name=b.businessName||'Your Studio';
  const waOn=ok('whatsapp')&&digits(c.whatsapp);
  const enquire=msg=>waOn?wa(c.whatsapp,msg):'';
  const show={about:ok('about')&&s.showAbout!==false&&b.about,services:ok('services')&&s.showServices!==false&&services.length,gallery:ok('gallery')&&s.showGallery!==false&&gallery.length,
    reviews:ok('reviews')&&s.showReviews!==false&&reviews.length,faq:ok('faq')&&s.showFaq!==false&&faqs.length,contact:ok('contact')&&s.showContact!==false};
  const nav=[show.gallery&&['#gallery','Portfolio'],show.services&&['#services','Services'],show.about&&['#about','About'],show.reviews&&['#reviews','Reviews'],show.faq&&['#faq','FAQ'],show.contact&&['#contact','Contact']].filter(Boolean);
  let html='<div class="site-preview t1">';

  html+='<header class="pg-nav"><a class="pg-brand" href="#top"><strong>'+esc(name)+'</strong>'+(b.motto?'<small>'+esc(b.motto)+'</small>':'')+'</a>'+
    '<nav aria-label="Main">'+nav.map(([href,label])=>'<a href="'+href+'">'+label+'</a>').join('')+'</nav>'+
    '<div class="template-header-right">'+(waOn?'<a class="pg-btn dark small" target="_blank" rel="noopener" href="'+esc(enquire('Hi, I would like to check your availability for a shoot.'))+'">Check availability</a>':'')+'<a class="template-admin-link" href="admin.html?template=photography-01">Admin</a></div></header>';

  if(ok('home')){
    html+='<section class="pg-hero" id="top">'+(url(d.hero)?'<img src="'+esc(url(d.hero))+'" alt="">':'')+'<div class="pg-hero-shade"></div><div class="pg-hero-copy"><span class="pg-eyebrow">'+esc(b.ownerName||'Photography studio')+'</span><h1>'+esc(h.title||name)+'</h1>'+(h.text?'<p>'+esc(h.text)+'</p>':'')+
      '<div class="pg-actions">'+(show.gallery?'<a class="pg-btn light" href="#gallery">View portfolio</a>':'')+(waOn?'<a class="pg-btn ghost" target="_blank" rel="noopener" href="'+esc(enquire('Hi, I would like to check your availability for a shoot.'))+'">Enquire on WhatsApp</a>':'')+'</div></div></section>';
  }

  if(show.gallery){
    html+='<section class="pg-section" id="gallery"><div class="pg-head"><span class="pg-kicker">Portfolio</span><h2>Selected work</h2><p>Tap any photograph to view it larger.</p></div><div class="gallery">'+
      gallery.map((x,i)=>'<figure><button type="button" class="pg-open" data-index="'+i+'" aria-label="View '+esc(x.title||'photo '+(i+1))+' larger"><img src="'+esc(url(x.image))+'" alt="'+esc(x.title||'Portfolio photograph')+'" loading="lazy" decoding="async"></button>'+(x.title?'<figcaption>'+esc(x.title)+'</figcaption>':'')+'</figure>').join('')+'</div></section>';
  }

  if(show.services){
    html+='<section class="pg-section soft" id="services"><div class="pg-head"><span class="pg-kicker">Services</span><h2>Ways we can work together</h2></div><div class="pg-services">'+
      services.map((x,i)=>'<article><span class="pg-num">'+String(i+1).padStart(2,'0')+'</span><div><h3>'+esc(x.name||'Service')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'</div><div class="pg-service-end">'+(x.price?'<strong>'+esc(x.price)+'</strong>':'')+
        (waOn?'<a target="_blank" rel="noopener" href="'+esc(enquire('Hi, I would like to enquire about: '+(x.name||'a shoot')))+'">Enquire →</a>':'')+'</div></article>').join('')+'</div></section>';
    html+='<section class="pg-section pg-process" aria-label="How it works"><div class="pg-head"><span class="pg-kicker">How it works</span><h2>From first message to final gallery</h2></div><ol>'+
      [['Enquire','Share your date, location and the kind of shoot you have in mind.'],['Plan','We confirm the package, timeline and the moments that matter most to you.'],['Shoot','Relaxed, candid direction on the day so you can simply be yourselves.'],['Deliver','Your edited photographs, ready to share and keep.']].map((x,i)=>'<li><b>'+(i+1)+'</b><h3>'+x[0]+'</h3><p>'+x[1]+'</p></li>').join('')+'</ol></section>';
  }

  if(show.about){
    html+='<section class="pg-section pg-about" id="about"><span class="pg-kicker">About</span><h2>'+esc(b.about)+'</h2>'+(b.ownerName?'<p class="pg-sign">— '+esc(b.ownerName)+'</p>':'')+'</section>';
  }

  if(show.reviews){
    html+='<section class="pg-section soft" id="reviews"><div class="pg-head"><span class="pg-kicker">Kind words</span><h2>From our couples and clients</h2></div><div class="pg-reviews">'+
      reviews.map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||0));return '<figure>'+(r?'<div class="pg-stars" aria-label="'+r+' out of 5">'+'★'.repeat(r)+'</div>':'')+'<blockquote>“'+esc(x.text||'')+'”</blockquote><figcaption>'+esc(x.name||'Client')+'</figcaption></figure>'}).join('')+'</div></section>';
  }

  if(show.faq){
    html+='<section class="pg-section" id="faq"><div class="pg-head"><span class="pg-kicker">FAQ</span><h2>Questions, answered.</h2></div><div class="pg-faq">'+
      faqs.map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
  }

  if(show.contact){
    html+='<section class="pg-contact" id="contact"><div><span class="pg-kicker">Contact</span><h2>Let’s create something memorable.</h2><p>'+[c.location?esc(c.location):'',typeof c.hours==='string'&&c.hours?esc(c.hours):'',c.call?'<a href="tel:'+esc(tel(c.call))+'">'+esc(c.call)+'</a>':''].filter(Boolean).join(' · ')+'</p></div>'+
      '<div class="pg-actions">'+(waOn?'<a class="pg-btn light" target="_blank" rel="noopener" href="'+esc(enquire('Hi, I would like to check your availability for a shoot.'))+'">WhatsApp us</a>':'')+(c.call?'<a class="pg-btn ghost" href="tel:'+esc(tel(c.call))+'">Call</a>':'')+
      (ok('location')&&url(c.maps)?'<a class="pg-btn ghost" target="_blank" rel="noopener" href="'+esc(url(c.maps))+'">Directions</a>':'')+'</div></section>';
  }

  html+='<footer class="pg-footer"><strong>'+esc(name)+'</strong><span>© '+new Date().getFullYear()+(b.motto?' · '+esc(b.motto):'')+'</span></footer>';
  if(waOn)html+='<a class="pg-float" target="_blank" rel="noopener" href="'+esc(enquire('Hi, I would like to check your availability for a shoot.'))+'" aria-label="Enquire on WhatsApp">WhatsApp</a>';
  return html+'</div>';
}

export function init(root){
  scMobileNav(arguments[0]);
  if(!root||root.__pgLb)return;root.__pgLb=true;
  // Lightbox with previous / next
  root.addEventListener('click',e=>{
    const open=e.target.closest&&e.target.closest('.pg-open');if(!open)return;
    const imgs=[...root.querySelectorAll('.gallery img')];let i=+open.dataset.index||0;
    const o=document.createElement('div');o.className='pg-lightbox';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.setAttribute('aria-label','Photo viewer');
    o.innerHTML='<button type="button" class="pg-lb-close" aria-label="Close">×</button><button type="button" class="pg-lb-prev" aria-label="Previous photo">‹</button><figure><img alt=""><figcaption></figcaption></figure><button type="button" class="pg-lb-next" aria-label="Next photo">›</button>';
    const big=o.querySelector('img'),cap=o.querySelector('figcaption');
    const show=n=>{i=(n+imgs.length)%imgs.length;big.src=imgs[i].currentSrc||imgs[i].src;big.alt=imgs[i].alt||'';cap.textContent=imgs[i].alt||'';};
    const close=()=>{o.remove();document.removeEventListener('keydown',k);open.focus();};
    const k=ev=>{if(ev.key==='Escape')close();if(ev.key==='ArrowRight')show(i+1);if(ev.key==='ArrowLeft')show(i-1);};
    o.addEventListener('click',ev=>{if(ev.target.closest('.pg-lb-prev'))return show(i-1);if(ev.target.closest('.pg-lb-next'))return show(i+1);if(ev.target===o||ev.target.closest('.pg-lb-close'))close();});
    document.addEventListener('keydown',k);root.appendChild(o);show(i);o.querySelector('.pg-lb-close').focus();
  });
}

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
  addEventListener('resize',sync);sync();[150,600,2000].forEach(t=>setTimeout(sync,t));addEventListener('load',sync);document.querySelectorAll('link[rel="stylesheet"]').forEach(l=>l.addEventListener('load',sync));
}

/* SiteCraft connect strip: hours, email and social links, shown in the footer only when the page does not already show them. */
const scEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SC_SOCIAL_FEATURE=false;
const SC_ICONS={
  instagram:['Instagram','<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.5" cy="6.5" r="1.3" fill="currentColor"/></svg>'],
  facebook:['Facebook','<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 8h3V4h-3c-2.8 0-4.5 1.8-4.5 4.6V11H7v4h2.5v6h4v-6h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8z"/></svg>'],
  youtube:['YouTube','<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="5.5" width="19" height="13" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M10 9v6l5-3z"/></svg>']
};
function scConnect(html,d,selected){
  const c=d.contact||{},so=d.social||{};
  const pick=k=>String(c[k]||so[k]||'').trim();
  const has=v=>html.indexOf(v)>=0||html.indexOf(scEsc(v))>=0;
  const parts=[];
  const hours=typeof c.hours==='string'?c.hours.trim():'';
  if(hours&&!has(hours))parts.push('<span class="sc-connect-item">🕒 '+scEsc(hours)+'</span>');
  const mail=pick('email');
  if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)&&!has(mail))parts.push('<a class="sc-connect-item" href="mailto:'+scEsc(mail)+'">✉ '+scEsc(mail)+'</a>');
  const icons=[];
  if(!SC_SOCIAL_FEATURE||(selected||[]).includes('social'))Object.keys(SC_ICONS).forEach(k=>{const u=pick(k);if(/^https?:\/\//i.test(u)&&!has(u))icons.push('<a class="sc-connect-icon" href="'+scEsc(u)+'" target="_blank" rel="noopener" aria-label="'+SC_ICONS[k][0]+'">'+SC_ICONS[k][1]+'</a>');});
  if(!parts.length&&!icons.length)return html;
  const block='<div class="sc-connect">'+parts.join('')+(icons.length?'<span class="sc-connect-icons">'+icons.join('')+'</span>':'')+'</div>';
  const i=html.lastIndexOf('</footer>');
  if(i>=0)return html.slice(0,i)+block+html.slice(i);
  const j=html.lastIndexOf('</div>');
  return j>=0?html.slice(0,j)+'<div class="sc-connect-wrap">'+block+'</div>'+html.slice(j):html+block;
}
export function render(d={},selected=[]){return scConnect(scBaseRender(d,selected),d,selected);}
