const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=v=>{const x=String(v??'').trim();return /^(https?:|tel:|mailto:|data:image\/)/i.test(x)||/^[\w./-]+$/.test(x)?x:''};
const tel=v=>String(v??'').replace(/[^\d+]/g,'');
const digits=v=>String(v??'').replace(/\D/g,'');
const embed=u=>{const x=String(u||'').trim();const yt=x.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);if(yt)return 'https://www.youtube.com/embed/'+yt[1]+'?rel=0';const vm=x.match(/vimeo\.com\/(?:video\/)?(\d+)/);if(vm)return 'https://player.vimeo.com/video/'+vm[1];return '';};
const wa=(n,msg)=>{const p=digits(n);return p?'https://wa.me/'+p+(msg?'?text='+encodeURIComponent(msg):''):''};

export function render(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},ok=x=>selected.includes(x);
  const services=(d.services||[]).filter(x=>x.enabled!==false);
  const gallery=(d.gallery||[]).filter(x=>x.enabled!==false&&url(x.image));
  const reviews=(d.reviews||[]).filter(x=>x.enabled!==false);
  const faqs=(d.faqs||[]).filter(x=>x.enabled!==false);
  const stories=(d.stories||[]).filter(x=>x.enabled!==false);
  const videos=(d.videos||[]).filter(x=>x.enabled!==false&&url(x.url));
  const rating=Math.max(0,Math.min(5,Math.round(Number(c.googleRating)||0)));
  const name=b.businessName||'Aurora Moments';
  const waOn=ok('whatsapp')&&digits(c.whatsapp);
  const enquire=msg=>waOn?wa(c.whatsapp,msg):'';
  const show={about:ok('about')&&s.showAbout!==false&&b.about,services:ok('services')&&s.showServices!==false&&services.length,gallery:ok('gallery')&&s.showGallery!==false&&gallery.length,
    reviews:ok('reviews')&&s.showReviews!==false&&reviews.length,faq:ok('faq')&&s.showFaq!==false&&faqs.length,stories:ok('stories')&&s.showStories!==false&&stories.length,videos:ok('videos')&&s.showVideos!==false&&videos.length,social:ok('social')&&s.showSocial!==false&&(url(c.instagram)||url(c.googleReviews)),contact:ok('contact')&&s.showContact!==false};
  const nav=[show.gallery&&['#gallery','Portfolio'],show.services&&['#services','Services'],show.stories&&['#stories','Stories'],show.videos&&['#films','Films'],show.about&&['#about','About'],show.reviews&&['#reviews','Reviews'],show.faq&&['#faq','FAQ'],show.contact&&['#contact','Contact']].filter(Boolean);
  let html='<div class="site-preview t2">';

  html+='<header class="pg-nav"><a class="pg-brand" href="#top"><strong>'+esc(name)+'</strong>'+(b.motto?'<small>'+esc(b.motto)+'</small>':'')+'</a>'+
    '<nav aria-label="Main">'+nav.map(([href,label])=>'<a href="'+href+'">'+label+'</a>').join('')+'</nav>'+
    '<div class="template-header-right">'+(waOn?'<a class="pg-btn dark small" target="_blank" rel="noopener" href="'+esc(enquire('Hi, I would like to check your availability for a shoot.'))+'">Check availability</a>':'')+'<a class="template-admin-link" href="admin.html?template=photography-02">Admin</a></div></header>';

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

  if(show.videos){
    html+='<section class="pg-section soft" id="films"><div class="pg-head"><span class="pg-kicker">Films</span><h2>Watch the moments.</h2></div><div class="pg-videos">'+
      videos.map(x=>{const src=embed(x.url);return '<article>'+(src?'<div class="pg-video"><iframe src="'+esc(src)+'" title="'+esc(x.title||'Video')+'" loading="lazy" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>':'<a class="pg-video pg-video-link" target="_blank" rel="noopener" href="'+esc(url(x.url))+'"><span>▶</span>Watch on '+esc(x.provider||'video')+'</a>')+'<h3>'+esc(x.title||'Video')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'</article>'}).join('')+'</div></section>';
  }

  if(show.stories){
    html+='<section class="pg-section" id="stories"><div class="pg-head"><span class="pg-kicker">Journal</span><h2>Behind the frame.</h2></div><div class="pg-stories">'+
      stories.map(x=>'<article>'+(url(x.image)?'<img src="'+esc(url(x.image))+'" alt="'+esc(x.title||'Story')+'" loading="lazy">':'')+'<div>'+(x.date?'<small>'+esc(x.date)+'</small>':'')+'<h3>'+esc(x.title||'Story')+'</h3>'+(x.excerpt?'<p class="pg-excerpt">'+esc(x.excerpt)+'</p>':'')+(x.content?'<details><summary>Read the story</summary><p>'+esc(x.content)+'</p></details>':'')+'</div></article>').join('')+'</div></section>';
  }

  if(show.reviews){
    html+='<section class="pg-section soft" id="reviews"><div class="pg-head"><span class="pg-kicker">Kind words</span><h2>From our couples and clients</h2></div><div class="pg-reviews">'+
      reviews.map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||0));return '<figure>'+(r?'<div class="pg-stars" aria-label="'+r+' out of 5">'+'★'.repeat(r)+'</div>':'')+'<blockquote>“'+esc(x.text||'')+'”</blockquote><figcaption>'+esc(x.name||'Client')+'</figcaption></figure>'}).join('')+'</div></section>';
  }

  if(show.faq){
    html+='<section class="pg-section" id="faq"><div class="pg-head"><span class="pg-kicker">FAQ</span><h2>Questions, answered.</h2></div><div class="pg-faq">'+
      faqs.map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
  }

  if(show.social){
    html+='<section class="pg-section pg-social"><div><span class="pg-kicker">Stay connected</span><h2>Follow our latest work.</h2></div><div class="pg-actions">'+
      (url(c.instagram)?'<a class="pg-btn light" target="_blank" rel="noopener" href="'+esc(url(c.instagram))+'">Instagram ↗</a>':'')+
      (url(c.googleReviews)?'<a class="pg-btn ghost" target="_blank" rel="noopener" href="'+esc(url(c.googleReviews))+'">'+(rating?'<b>'+'★'.repeat(rating)+'</b>&nbsp;':'')+'Google Reviews ↗</a>':'')+'</div></section>';
  }

  if(show.contact){
    html+='<section class="pg-contact" id="contact"><div><span class="pg-kicker">Contact</span><h2>Let’s create something memorable.</h2><p>'+[c.location?esc(c.location):'',c.call?'<a href="tel:'+esc(tel(c.call))+'">'+esc(c.call)+'</a>':''].filter(Boolean).join(' · ')+'</p></div>'+
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
  addEventListener('resize',sync);sync();
}
