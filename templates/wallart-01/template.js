const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=v=>{const x=String(v??'').trim();return /^(https?:\/\/|tel:|mailto:)/i.test(x)?x:''};
const imageUrl=v=>{const x=String(v??'').trim();return /^https:\/\/[^\s"'<>]+$/i.test(x)||/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+\/=]+$/i.test(x)?x:'';};
const digits=v=>String(v??'').replace(/\D/g,'');
const tel=v=>String(v??'').replace(/[^\d+]/g,'');
const wa=(n,msg)=>{const p=digits(n);return p?'https://wa.me/'+p+(msg?'?text='+encodeURIComponent(msg):''):'';};
const slug=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'other';
const rows=(d,key)=>(Array.isArray(d[key])?d[key]:[]).filter(x=>x&&x.enabled!==false);

function scBaseRender(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},ok=x=>selected.includes(x);
  const menu=rows(d,'menu'),combos=rows(d,'combos'),highlights=rows(d,'highlights'),gallery=rows(d,'gallery').filter(x=>imageUrl(x.image)),reviews=rows(d,'reviews'),faqs=rows(d,'faqs'),hours=rows(d,'hours');
  const name=b.businessName||'Colour Canvas Wall Arts',mark=(String(name).match(/[A-Za-z0-9]+/g)||['c','c']).slice(0,2).map(w=>w[0].toLowerCase()).join('')+'.',phone=tel(c.phone),waOn=ok('whatsapp')&&!!digits(c.whatsapp);
  const show={
    about:ok('about')&&s.showAbout!==false&&!!b.about,
    menu:ok('menu')&&s.showMenu!==false&&menu.length>0,
    combos:ok('combos')&&s.showCombos!==false&&combos.length>0,
    work:ok('work')&&s.showWork!==false&&highlights.length>0,
    gallery:ok('gallery')&&s.showGallery!==false&&gallery.length>0,
    reviews:ok('reviews')&&s.showReviews!==false&&reviews.length>0,
    faq:ok('faq')&&s.showFaq!==false&&faqs.length>0,
    hours:ok('hours')&&s.showHours!==false&&hours.length>0,
    reservation:ok('enquiry')&&s.showEnquiry!==false&&waOn,
    location:ok('location')&&s.showLocation!==false&&(!!c.address||!!url(c.maps)),
    contact:ok('contact')&&s.showContact!==false&&(!!c.phone||!!c.whatsapp||!!c.email||!!c.address),
    social:ok('social')&&s.showSocial!==false&&(!!url(c.instagram)||!!url(c.facebook)||!!url(c.youtube))
  };
  const nav=[['about','About'],['menu','Our work'],['combos','Packages'],['work','How it works'],['gallery','Gallery'],['reviews','Reviews'],['faq','FAQ'],['hours','Hours'],['location','Visit']].filter(([k])=>show[k]);
  let html='<div class="wallart-01">';
  html+='<header class="wa-nav"><a class="wa-brand" href="#top" aria-label="'+esc(name)+' home"><span class="wa-brand-mark" aria-hidden="true">'+esc(mark)+'</span><span><strong>'+esc(name)+'</strong><small>'+esc(b.tagline||'Murals · Portraits · Animals · Lettering')+'</small></span></a><nav aria-label="Main navigation">'+nav.map(([k,label])=>'<a href="#'+k+'">'+label+'</a>').join('')+'</nav><div class="wa-nav-action">'+(show.reservation?'<a class="wa-btn wa-btn-dark wa-nav-cta" href="#enquire">Book a wall</a>':'')+'</div></header>';

  if(ok('home')&&s.showHome!==false){
    html+='<section class="wa-art-banner" aria-label="Animated wall painting introduction"><canvas class="wa-art-banner-canvas" role="img" aria-label="Animated colourful paint strokes, a blooming lotus and a rainbow"></canvas><div class="wa-art-banner-shade"></div><div class="wa-art-banner-copy"><h2>Bringing Blank Walls to <em>Living Art</em></h2><span>Wall Painting · Design · Murals · Kids Drawing</span></div></section>';
  }

  if(ok('home')&&s.showHome!==false&&(h.title||h.text||imageUrl(d.hero))){
    const hero=imageUrl(d.hero);
    html+='<section class="wa-hero" id="top">'+(hero?'<img class="wa-hero-photo" src="'+esc(hero)+'" alt="Colourful paint strokes in blue, orange and red">':'')+'<div class="wa-hero-overlay"></div><div class="wa-hero-copy"><span class="wa-eyebrow">'+esc(h.eyebrow||'WALL ART · MURALS · HAND-PAINTED')+'</span><h1>'+esc(h.title||'Your walls, painted as art.')+'</h1>'+(h.text?'<p>'+esc(h.text)+'</p>':'')+'<div class="wa-hero-actions">'+(show.menu?'<a class="wa-btn wa-btn-cream" href="#menu">See our work <span aria-hidden="true">↗</span></a>':'')+(show.reservation?'<a class="wa-btn wa-btn-outline-light" href="#enquire">Book a wall</a>':'')+'</div><div class="wa-hero-foot"><span>Hand-painted</span><i aria-hidden="true"></i><span>Any theme</span><i aria-hidden="true"></i><span>Homes to shops</span></div></div><div class="wa-hero-badge"><span>PAINTED</span><strong>BY HAND</strong><span>WITH LOVE</span></div></section>';
  }

  if(show.about){
    html+='<section class="wa-section wa-about" id="about"><div class="wa-about-label"><span class="wa-kicker">About the artist</span><span class="wa-about-asterisk" aria-hidden="true">✳</span></div><div class="wa-about-copy"><h2>'+esc(b.motto||'Every wall tells a story.')+'</h2><p>'+esc(b.about)+'</p>'+(b.ownerName?'<p class="wa-sign">— '+esc(b.ownerName)+'</p>':'')+'</div></section>';
  }

  if(show.menu){
    const cats=[...new Set(menu.map(x=>String(x.category||'').trim()).filter(Boolean))];
    html+='<section class="wa-section wa-menu" id="menu"><div class="wa-section-head"><div><span class="wa-kicker">Wall art portfolio</span><h2>Our work</h2><p>Murals, portraits, animals, forests, designs and hand-painted lettering. Tap Ask on any piece to get a price.</p></div><span class="wa-head-note">PAINTED<br>BY HAND</span></div><div class="wa-tabs" role="group" aria-label="Filter our work by style"><button type="button" class="is-active" data-menu-filter="all" aria-pressed="true">All</button>'+cats.map(x=>'<button type="button" data-menu-filter="'+esc(slug(x))+'" aria-pressed="false">'+esc(x)+'</button>').join('')+'</div><div class="wa-menu-grid">'+menu.map(x=>{
      const image=imageUrl(x.image),category=slug(x.category);
      return '<article class="wa-menu-card" data-menu-card data-category="'+esc(category)+'">'+(image?'<div class="wa-menu-image"><img src="'+esc(image)+'" alt="'+esc(x.imageAlt||x.name||'Wall art')+'" loading="lazy"></div>':'')+'<div class="wa-menu-content"><div class="wa-menu-meta"><span>'+esc(x.category||'Wall art')+'</span>'+(x.tag?'<b>'+esc(x.tag)+'</b>':'')+'</div><h3>'+esc(x.name||'House favourite')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'<div class="wa-menu-price"><strong>'+esc(x.price||'Ask for price')+'</strong>'+(waOn?'<a target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hi '+name+', I like your '+(x.name||'this item')+'. Please share price and availability.')))+'">Ask ↗</a>':'')+'</div></div></article>';
    }).join('')+'</div></section>';
  }

  if(show.combos){
    html+='<section class="wa-section wa-combos" id="combos"><div class="wa-section-head"><div><span class="wa-kicker">Commission packages</span><h2>Packages & pricing</h2><p>Prices depend on the wall size and the detail. You get a clear price before we start.</p></div></div><div class="wa-combo-grid">'+combos.map((x,i)=>'<article class="wa-combo-card"><span class="wa-combo-number">0'+(i+1)+'</span><div><h3>'+esc(x.name||'Package')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'<strong>'+esc(x.price||'Ask for price')+'</strong></div>'+(waOn?'<a target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hi '+name+', please tell me more about the '+(x.name||'package')+'.')))+'" aria-label="Ask about '+esc(x.name||'package')+'">Ask about this package ↗</a>':'')+'</article>').join('')+'</div></section>';
  }

  if(show.work){
    html+='<section class="wa-section wa-work" id="work"><div class="wa-work-intro"><span class="wa-kicker">How it works</span><h2>From your idea to a finished wall.</h2><p>Share your wall and idea, get a sketch, and we paint it. The price is agreed before we start.</p></div><div class="wa-highlight-grid">'+highlights.map((x,i)=>'<article><span class="wa-highlight-icon" aria-hidden="true">'+esc(x.icon||['✎', '✓', '⏱', '₹'][i%4])+'</span><h3>'+esc(x.title||'Made for you')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'</article>').join('')+'</div></section>';
  }

  if(show.gallery){
    html+='<section class="wa-section wa-gallery" id="gallery"><div class="wa-section-head"><div><span class="wa-kicker">At work</span><h2>Behind the brush</h2></div><span class="wa-gallery-flower" aria-hidden="true">✿</span></div><div class="wa-gallery-grid">'+gallery.map((x,i)=>'<figure class="wa-gallery-item wa-gallery-'+(i%4+1)+'"><img src="'+esc(imageUrl(x.image))+'" alt="'+esc(x.alt||x.title||name)+'" loading="lazy">'+(x.title?'<figcaption>'+esc(x.title)+'</figcaption>':'')+'</figure>').join('')+'</div></section>';
  }

  if(show.reviews){
    html+='<section class="wa-section wa-reviews" id="reviews"><div class="wa-section-head"><div><span class="wa-kicker">Customer reviews</span><h2>Walls people love.</h2></div></div><div class="wa-review-grid">'+reviews.map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||5));return '<figure><div class="wa-stars" aria-label="'+r+' out of 5 stars">'+('★'.repeat(r))+'</div><blockquote>“'+esc(x.text||'')+'”</blockquote><figcaption>'+esc(x.name||'Customer')+'</figcaption></figure>';}).join('')+'</div></section>';
  }

  if(show.faq){
    html+='<section class="wa-section wa-faq" id="faq"><div class="wa-section-head"><div><span class="wa-kicker">Good to know</span><h2>Good to know</h2></div></div><div class="wa-faq-list">'+faqs.map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
  }

  if(show.hours){
    html+='<section class="wa-section wa-hours" id="hours"><div class="wa-hours-card"><div class="wa-hours-intro"><span class="wa-kicker">Studio timings</span><h2>Call or message us.</h2><span class="wa-open-badge" data-open-status hidden></span><p>'+(c.address?esc(c.address):'Hyderabad, Telangana')+'</p></div><div class="wa-hours-list">'+hours.map(x=>'<div class="wa-hours-row" data-day="'+esc(x.day||'')+'" data-open="'+esc(x.open||'')+'" data-close="'+esc(x.close||'')+'" data-closed="'+(x.closed?'true':'false')+'"><strong>'+esc(x.day||'Day')+'</strong><span>'+(x.closed?'Closed':esc(x.open||'')+(x.close?' – '+esc(x.close):''))+'</span></div>').join('')+'</div></div></section>';
  }

  if(show.reservation){
    html+='<section class="wa-section wa-reservation-anchor" id="reserve"><div class="wa-reserve-prompt"><span class="wa-kicker">Have a wall in mind?</span><h2>Send a photo of your wall.</h2><p>Share a photo of the wall, its size and your idea on WhatsApp. We’ll send a sketch and a price.</p><a class="wa-btn wa-btn-dark" href="#enquire">Book a wall ↗</a></div></section>';
  }

  if(show.location){
    html+='<section class="wa-section wa-location" id="location"><div><span class="wa-kicker">Find us</span><h2>Visit our studio.</h2>'+(c.address?'<p>'+esc(c.address)+'</p>':'')+'</div>'+(url(c.maps)?'<a class="wa-btn wa-btn-dark" target="_blank" rel="noopener" href="'+esc(url(c.maps))+'">Get directions ↗</a>':'')+'</section>';
  }

  if(show.contact||show.social){
    html+='<section class="wa-contact" id="contact">';
    if(show.contact){
      html+='<div class="wa-contact-main"><span class="wa-kicker">See you soon</span><h2>'+esc(name)+'</h2><p>'+esc(c.address||'Hyderabad, Telangana')+'</p><div class="wa-contact-actions">'+(phone?'<a class="wa-btn wa-btn-cream" href="'+esc(url('tel:'+phone))+'">Call '+esc(c.phone)+'</a>':'')+(waOn?'<a class="wa-btn wa-btn-whatsapp" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hello '+name+'! I have an enquiry.')))+'">WhatsApp us</a>':'')+'</div></div>';
    }else{
      html+='<div class="wa-contact-main"><span class="wa-kicker">Stay connected</span><h2>Follow our latest walls.</h2></div>';
    }
    if(show.contact&&c.email)html+='<div class="wa-contact-side"><a href="'+esc(url('mailto:'+c.email))+'">'+esc(c.email)+'</a></div>';
    if(show.social)html+='<div class="wa-contact-side"><div class="wa-social">'+(url(c.instagram)?'<a target="_blank" rel="noopener" href="'+esc(url(c.instagram))+'">Instagram ↗</a>':'')+(url(c.facebook)?'<a target="_blank" rel="noopener" href="'+esc(url(c.facebook))+'">Facebook ↗</a>':'')+(url(c.youtube)?'<a target="_blank" rel="noopener" href="'+esc(url(c.youtube))+'">YouTube ↗</a>':'')+'</div></div>';
    html+='</section>';
  }

  html+='<footer class="wa-footer"><a href="#top">'+esc(name)+'</a><span>'+esc(b.tagline||'Murals · Portraits · Animals · Lettering')+'</span><span>© '+new Date().getFullYear()+' · All rights reserved.</span></footer>';
  if(waOn)html+='<a class="wa-float" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hello '+name+'!')))+'" aria-label="Chat with '+esc(name)+' on WhatsApp">WhatsApp</a>';
  return html+'</div>';
}

const toMin=t=>{const m=String(t||'').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);if(!m)return null;let hr=+m[1]%12;if(/pm/i.test(m[3]||''))hr+=12;if(!m[3]&&+m[1]===12)hr=12;return hr*60+(+(m[2]||0));};
function scPreUpiInit(root,d={},selected=[]){
  scMobileNav(root);scBindForms(root);if(!root)return;
  const tabs=[...root.querySelectorAll('[data-menu-filter]')],cards=[...root.querySelectorAll('[data-menu-card]')];
  tabs.forEach(btn=>btn.addEventListener('click',()=>{const cat=btn.dataset.menuFilter;tabs.forEach(t=>{const on=t===btn;t.classList.toggle('is-active',on);t.setAttribute('aria-pressed',String(on));});cards.forEach(card=>{card.hidden=!(cat==='all'||card.dataset.category===cat);});}));
  const day=new Date().toLocaleDateString('en-US',{weekday:'long'}).toLowerCase(),now=new Date(),mins=now.getHours()*60+now.getMinutes();let openNow=null;
  root.querySelectorAll('.wa-hours-row').forEach(row=>{if(String(row.dataset.day).trim().toLowerCase()!==day)return;row.classList.add('is-today');if(row.dataset.closed==='true'){openNow=false;return;}const start=toMin(row.dataset.open),end=toMin(row.dataset.close);if(start===null||end===null)return;openNow=end>start?(mins>=start&&mins<end):(mins>=start||mins<end);});
  const badge=root.querySelector('[data-open-status]');if(badge&&openNow!==null){badge.hidden=false;badge.classList.toggle('is-open',openNow);badge.classList.toggle('is-closed',!openNow);badge.textContent=openNow?'● Open now':'● Closed now';}
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
const SC_SOCIAL_FEATURE=true;
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

/* SiteCraft enquiry form: collects table / meet-up details and opens WhatsApp with them filled in. */
const SC_FORM={"section": "wa-section wa-booking", "kicker": "wa-kicker", "btn": "wa-btn wa-btn-dark", "kickerText": "Book a wall", "title": "Book a wall", "text": "Tell us about your wall and your idea. We’ll reply on WhatsApp with a sketch and a price.", "submit": "Send on WhatsApp", "intro": "Hello, I would like to get a wall painted.", "fields": [["name", "Your name", "text", true], ["phone", "Phone number", "tel", true], ["product", "Style you like", "select:menu:name", false], ["place", "Wall location", "select:meetupTypes:name", true], ["size", "Wall size (width × height in ft)", "text", false], ["date", "When do you need it?", "date", false], ["message", "Your idea, theme or city (optional)", "textarea", false]]};
function scWithForm(html,d,selected){
  const c=d.contact||{},wa=String(c.whatsapp||'').replace(/\D/g,'');
  if(!(selected||[]).includes('enquiry')||!wa)return html;
  const f=SC_FORM,biz=(d.brand||{}).businessName||'';
  const field=([name,label,type,req])=>{
    const id='sc-f-'+name,r=req?' required':'',lab='<label for="'+id+'">'+scEsc(label)+(req?' *':'')+'</label>';
    if(type.indexOf('select:')===0){const [,list,key]=type.split(':');const opts=(d[list]||[]).filter(x=>x&&x.enabled!==false&&x[key]).map(x=>x[key]);
      if(!opts.length)return '';return '<div class="sc-form-field">'+lab+'<select id="'+id+'" name="'+name+'" data-label="'+scEsc(label)+'"'+r+'><option value="">Select…</option>'+opts.map(o=>'<option>'+scEsc(o)+'</option>').join('')+'<option>Other / not sure</option></select></div>';}
    if(type==='textarea')return '<div class="sc-form-field wide">'+lab+'<textarea id="'+id+'" name="'+name+'" rows="3" data-label="'+scEsc(label)+'"'+r+'></textarea></div>';
    const extra=type==='tel'?' autocomplete="tel" inputmode="tel"':name==='name'?' autocomplete="name"':type==='number'?' min="1" inputmode="numeric"':'';
    return '<div class="sc-form-field">'+lab+'<input id="'+id+'" name="'+name+'" type="'+type+'" data-label="'+scEsc(label)+'"'+extra+r+'></div>';
  };
  const block='<section class="'+f.section+' sc-form-section" id="enquire"><div class="sc-form-head"><span class="'+f.kicker+'">'+scEsc(f.kickerText)+'</span><h2>'+scEsc(f.title)+'</h2><p>'+scEsc(f.text)+'</p></div>'+
    '<form class="sc-form" data-sc-form data-wa="'+wa+'" data-intro="'+scEsc(f.intro)+'" data-biz="'+scEsc(biz)+'" novalidate>'+f.fields.map(field).join('')+
    '<div class="sc-form-actions wide"><button type="submit" class="'+f.btn+'">'+scEsc(f.submit)+'</button><p class="sc-form-note" role="status" aria-live="polite">Your details will be prepared in WhatsApp for you to review before sending.</p></div></form></section>';
  const m=html.search(/<section[^>]*id="contact"/);
  if(m>=0)return html.slice(0,m)+block+html.slice(m);
  const i=html.lastIndexOf('<footer');return i>=0?html.slice(0,i)+block+html.slice(i):html+block;
}
function scBindForms(root){
  if(!root)return;
  root.querySelectorAll('form[data-sc-form]').forEach(form=>{
    if(form.__scBound)return;form.__scBound=true;
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const note=form.querySelector('.sc-form-note');
      const bad=[...form.querySelectorAll('[required]')].find(x=>!String(x.value).trim());
      form.querySelectorAll('[aria-invalid]').forEach(x=>x.removeAttribute('aria-invalid'));
      if(bad){bad.setAttribute('aria-invalid','true');bad.focus();if(note)note.textContent='Please fill in: '+bad.dataset.label;return;}
      const lines=[...form.querySelectorAll('input,select,textarea')].filter(x=>String(x.value).trim()).map(x=>x.dataset.label+': '+String(x.value).trim());
      const msg=(form.dataset.intro||'Hi')+(form.dataset.biz?' ('+form.dataset.biz+')':'\n\n')+'\n\n'+lines.join('\n');
      window.open('https://wa.me/'+form.dataset.wa+'?text='+encodeURIComponent(msg),'_blank','noopener');
      if(note)note.textContent='WhatsApp has opened with your details. Tap send to share them with us.';
    });
  });
}
function scPreUpiRender(d={},selected=[]){
  const s=d.settings||{},c=d.contact||{};
  const chosen=(selected||[]).filter(x=>x!=='enquiry'||s.showEnquiry!==false);
  const connectSelected=(selected||[]).filter(x=>x!=='social'||s.showSocial!==false);
  const connectData={...d,contact:{...c,hours:connectSelected.includes('hours')&&s.showHours!==false?c.hours:'',email:connectSelected.includes('contact')&&s.showContact!==false?c.email:''}};
  return scConnect(scWithForm(scBaseRender(d,selected),d,chosen),connectData,connectSelected);
}

/* SiteCraft payments: optional UPI / payment link section. Shown only when the owner adds payment details. */
const scPayEsc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function scPay(html,d,selected){
  if(!(selected||[]).includes('upi'))return html;
  const p=d.payment||{},b=d.brand||{};
  const upi=String(p.upiId||'').trim(),okUpi=/^[a-z0-9._-]{2,256}@[a-z][a-z0-9.-]{1,63}$/i.test(upi);
  const link=/^https:\/\/[^\s"'<>]+$/i.test(String(p.link||'').trim())?String(p.link).trim():'';
  const qr=String(p.qr||'').trim(),okQr=/^https:\/\/[^\s"'<>]+$/i.test(qr)||/^data:image\/(png|jpe?g|webp|gif);base64,[a-z0-9+\/=]+$/i.test(qr);
  if(!okUpi&&!link&&!okQr)return html;
  const name=String(p.payeeName||b.businessName||b.name||d.businessName||'').trim();
  const intent='upi://pay?pa='+encodeURIComponent(upi)+(name?'&pn='+encodeURIComponent(name):'')+'&cu=INR';
  const block='<section class="sc-pay" id="pay" aria-labelledby="sc-pay-title"><div class="sc-pay-card">'+
    (okQr?'<img class="sc-pay-qr" src="'+scPayEsc(qr)+'" alt="UPI QR code for '+scPayEsc(name||'this business')+'" loading="lazy">':'')+
    '<div class="sc-pay-body"><span class="sc-pay-kicker">Pay online</span><h2 id="sc-pay-title">'+scPayEsc(p.title||'Pay with UPI')+'</h2>'+
    '<p>'+scPayEsc(p.note||'Pay with Google Pay, PhonePe, Paytm, BHIM or any UPI app. Please share the payment screenshot on WhatsApp after paying.')+'</p>'+
    (okUpi?'<div class="sc-pay-id"><span>UPI ID</span><strong data-sc-upi>'+scPayEsc(upi)+'</strong><button type="button" class="sc-pay-copy" data-sc-copy="'+scPayEsc(upi)+'">Copy</button></div>':'')+
    '<div class="sc-pay-actions">'+(okUpi?'<a class="sc-pay-btn" href="'+scPayEsc(intent)+'">Pay with UPI app</a>':'')+(link?'<a class="sc-pay-btn sc-pay-btn-alt" href="'+scPayEsc(link)+'" target="_blank" rel="noopener">'+scPayEsc(p.linkLabel||'Pay by card / net banking')+' ↗</a>':'')+'</div>'+
    (okUpi?'<p class="sc-pay-small">The UPI app button works on phones. On a computer, scan the QR code or copy the UPI ID.</p>':'')+
    '</div></div></section>';
  const m=html.search(/<section[^>]*id="contact"/);
  if(m>=0)return html.slice(0,m)+block+html.slice(m);
  const i=html.lastIndexOf('<footer');
  if(i>=0)return html.slice(0,i)+block+html.slice(i);
  const k=html.search(/<(section|div)[^>]*class="[^"]*footer[^"]*"/);
  if(k>=0)return html.slice(0,k)+block+html.slice(k);
  const j=html.lastIndexOf('</div>');return j>=0?html.slice(0,j)+block+html.slice(j):html+block;
}
function scBindPay(root){
  if(!root||!root.querySelectorAll)return;
  root.querySelectorAll('[data-sc-copy]').forEach(btn=>{
    if(btn.__scBound)return;btn.__scBound=true;
    btn.addEventListener('click',async()=>{
      const v=btn.dataset.scCopy;let ok=false;
      try{await navigator.clipboard.writeText(v);ok=true;}catch(e){
        try{const t=document.createElement('textarea');t.value=v;t.setAttribute('readonly','');t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();ok=document.execCommand('copy');t.remove();}catch(_){}}
      btn.textContent=ok?'Copied':'Copy failed';setTimeout(()=>{btn.textContent='Copy';},1800);
    });
  });
}
function scSeoBaseRender(d={},selected=[]){return scPay(scPreUpiRender(d,selected),d,selected);}

function scWallartArtBannerInit(root){
  const host=root&&root.querySelector&&root.querySelector('.wa-art-banner');
  const canvas=host&&host.querySelector('.wa-art-banner-canvas');
  if(!host||!canvas||host.dataset.waArtReady==='true')return;
  const ctx=canvas.getContext&&canvas.getContext('2d');
  if(!ctx)return;
  host.dataset.waArtReady='true';

  let width=0,height=0,elapsed=0,last=0,raf=0,inView=true;
  const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp=v=>Math.max(0,Math.min(1,v));
  const ease=v=>1-Math.pow(1-v,3);
  const mix=(a,b,p)=>a+(b-a)*p;

  function resize(){
    const rect=host.getBoundingClientRect();
    const dpr=Math.min(window.devicePixelRatio||1,1.7);
    width=Math.max(1,rect.width);height=Math.max(1,rect.height);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    drawFrame(reduced?10.8:elapsed);
  }
  function point(a,b,c,d,p){
    const u=1-p;
    return {x:u*u*u*a.x+3*u*u*p*b.x+3*u*p*p*c.x+p*p*p*d.x,y:u*u*u*a.y+3*u*u*p*b.y+3*u*p*p*c.y+p*p*p*d.y};
  }
  function tangent(a,b,c,d,p){
    const u=1-p;
    return Math.atan2(3*u*u*(b.y-a.y)+6*u*p*(c.y-b.y)+3*p*p*(d.y-c.y),3*u*u*(b.x-a.x)+6*u*p*(c.x-b.x)+3*p*p*(d.x-c.x));
  }
  function cubic(a,b,c,d,p,line,col){
    if(p<=0)return null;
    ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
    ctx.lineWidth=line+3;ctx.strokeStyle='rgba(70,45,45,.12)';ctx.shadowColor='rgba(60,42,33,.18)';ctx.shadowBlur=6;
    ctx.beginPath();ctx.moveTo(a.x,a.y);
    const steps=Math.max(2,Math.ceil(64*p));
    for(let i=1;i<=steps;i++){const q=point(a,b,c,d,Math.min(p,i/64));ctx.lineTo(q.x,q.y);}
    ctx.stroke();ctx.shadowBlur=0;ctx.lineWidth=line;ctx.strokeStyle=col;ctx.stroke();
    ctx.globalAlpha=.24;ctx.lineWidth=Math.max(1,line*.15);ctx.strokeStyle='#fff8e9';ctx.stroke();ctx.restore();
    return {point:point(a,b,c,d,p),angle:tangent(a,b,c,d,p)};
  }
  function brush(x,y,angle,scale,color,time){
    const length=scale*.245,w=scale*.026;
    ctx.save();ctx.translate(x,y);ctx.rotate(angle-Math.PI/2);ctx.translate(0,Math.sin(time*8)*scale*.005);
    ctx.shadowColor='rgba(45,30,20,.23)';ctx.shadowBlur=scale*.016;ctx.shadowOffsetY=scale*.01;
    ctx.beginPath();ctx.moveTo(-w*.9,-length*.18);ctx.quadraticCurveTo(-w*.8,-length*.05,0,scale*.012);ctx.quadraticCurveTo(w*.8,-length*.05,w*.9,-length*.18);ctx.closePath();ctx.fillStyle=color;ctx.fill();
    ctx.beginPath();ctx.moveTo(-w*1.2,-length*.2);ctx.lineTo(w*1.2,-length*.2);ctx.lineTo(w*.9,-length*.31);ctx.lineTo(-w*.9,-length*.31);ctx.closePath();
    const metal=ctx.createLinearGradient(-w,0,w,0);metal.addColorStop(0,'#98713b');metal.addColorStop(.48,'#f4df9b');metal.addColorStop(1,'#98713b');ctx.fillStyle=metal;ctx.fill();
    const wood=ctx.createLinearGradient(-w,0,w,0);wood.addColorStop(0,'#713a24');wood.addColorStop(.45,'#c7824c');wood.addColorStop(1,'#753c24');
    ctx.beginPath();ctx.moveTo(-w*.78,-length*.3);ctx.quadraticCurveTo(-w*.85,-length*.68,-w*.46,-length);ctx.quadraticCurveTo(0,-length*1.035,w*.46,-length);ctx.quadraticCurveTo(w*.85,-length*.68,w*.78,-length*.3);ctx.closePath();ctx.fillStyle=wood;ctx.fill();
    ctx.shadowColor='transparent';ctx.strokeStyle='rgba(255,231,194,.5)';ctx.lineWidth=Math.max(1,scale*.002);ctx.beginPath();ctx.moveTo(0,-length*.4);ctx.lineTo(0,-length*.88);ctx.stroke();
    ctx.beginPath();ctx.arc(0,scale*.008,scale*.008,0,Math.PI*2);ctx.fillStyle='#fff6dc';ctx.fill();ctx.restore();
  }
  function petal(cx,cy,angle,progress,scale,color){
    if(progress<=0)return null;
    const len=scale*.125*progress,spread=scale*.047*progress;
    ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);ctx.shadowColor='rgba(114,39,58,.16)';ctx.shadowBlur=scale*.01;
    ctx.beginPath();ctx.moveTo(0,0);ctx.bezierCurveTo(-spread,-len*.38,-spread*.72,-len*.82,0,-len);ctx.bezierCurveTo(spread*.72,-len*.82,spread,-len*.38,0,0);
    const grad=ctx.createLinearGradient(0,0,0,-len);grad.addColorStop(0,'#e94f74');grad.addColorStop(1,color);ctx.fillStyle=grad;ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='rgba(255,235,225,.55)';ctx.lineWidth=Math.max(1,scale*.002);ctx.stroke();ctx.restore();
    return {x:cx+Math.sin(angle)*len*.86,y:cy-Math.cos(angle)*len*.86,angle:angle-Math.PI/2};
  }
  function rainbow(cx,cy,r,progress,color,line){
    if(progress<=0)return null;
    const angle=Math.PI+Math.PI*progress;
    ctx.save();ctx.lineCap='round';ctx.lineWidth=line+2;ctx.strokeStyle='rgba(82,62,42,.10)';ctx.beginPath();ctx.arc(cx,cy,r,Math.PI,angle,false);ctx.stroke();
    ctx.lineWidth=line;ctx.strokeStyle=color;ctx.beginPath();ctx.arc(cx,cy,r,Math.PI,angle,false);ctx.stroke();ctx.restore();
    return {point:{x:cx+Math.cos(angle)*r,y:cy+Math.sin(angle)*r},angle:angle+Math.PI/2};
  }
  function drawFrame(t){
    if(!width||!height)return;
    const sc=Math.min(width,height);
    ctx.clearRect(0,0,width,height);ctx.fillStyle='#FAF6F0';ctx.fillRect(0,0,width,height);
    const wash=ctx.createRadialGradient(width*.76,height*.5,sc*.02,width*.76,height*.5,sc*.75);
    wash.addColorStop(0,'rgba(255,255,255,.62)');wash.addColorStop(1,'rgba(250,246,240,0)');ctx.fillStyle=wash;ctx.fillRect(0,0,width,height);

    const a1={x:width*.2,y:height*.7},b1={x:width*.4,y:height*.2},c1={x:width*.7,y:height*.8},d1={x:width*.9,y:height*.35};
    const p1=ease(clamp(t/1.55)),s1=cubic(a1,b1,c1,d1,p1,sc*.075,'#ef5574');
    const a2={x:width*.25,y:height*.4},b2={x:width*.5,y:height*.75},c2={x:width*.75,y:height*.25},d2={x:width*.92,y:height*.6};
    const p2=ease(clamp((t-1.2)/1.65)),s2=cubic(a2,b2,c2,d2,p2,sc*.056,'#f0a52f');

    let active=null,color='#ef5574';
    if(t<1.55&&s1){active=s1;color='#ef5574';}
    else if(t<2.85&&s2){active=s2;color='#f0a52f';}

    if(t>3){
      const p=ease(clamp((t-3)/1.7)),cx=width*.75,cy=height*.45,r=sc*.12,angle=Math.PI+Math.PI*p;
      ctx.save();ctx.lineCap='round';ctx.lineWidth=sc*.009;ctx.strokeStyle='rgba(30,41,59,.12)';ctx.beginPath();ctx.arc(cx,cy,r,Math.PI,angle,false);ctx.stroke();
      ctx.strokeStyle='#26384d';ctx.lineWidth=sc*.007;ctx.beginPath();ctx.arc(cx,cy,r,Math.PI,angle,false);ctx.stroke();ctx.restore();
      if(t<4.8){active={point:{x:cx+Math.cos(angle)*r,y:cy+Math.sin(angle)*r},angle:angle+Math.PI/2};color='#26384d';}
    }

    const lotusX=width*.48,lotusY=height*.65,angles=[-.7,-.35,0,.35,.7];
    if(t>5.5){
      let moving=null;
      angles.forEach((angle,i)=>{const q=ease(clamp((t-5.5-i*.31)/.77));const p=petal(lotusX,lotusY,angle,q,sc,i%2?'#fb7892':'#ec5275');if(q>0&&q<1)moving=p;});
      if(t<8.0&&moving){active={point:{x:moving.x,y:moving.y},angle:moving.angle};color='#ed5275';}
      const bloom=ease(clamp((t-7.1)/.55));
      if(bloom>0){ctx.beginPath();ctx.arc(lotusX,lotusY,sc*.016*bloom,0,Math.PI*2);ctx.fillStyle='#e9ad36';ctx.fill();}
    }

    const rainbowX=width*.24,rainbowY=height*.75,rainbowR=sc*.13;
    const colors=['#ef4444','#f59e0b','#22a06b','#38a7db'];
    colors.forEach((col,i)=>{
      const q=ease(clamp((t-8.4-i*.47)/.62));
      const r=rainbowR-i*sc*.016;
      const tip=rainbow(rainbowX,rainbowY,r,q,col,sc*.008);
      if(t>=8.4+i*.47&&t<8.4+(i+1)*.47+.62&&tip){active=tip;color=col;}
    });

    if(t>=10.6){
      const q=clamp((t-10.6)/.6);
      active={point:{x:mix(width*.62,width*.92,q),y:mix(height*.62,height*.18,q)},angle:-.65};color='#ef5574';
      ctx.save();ctx.globalAlpha=q*(.35+.35*Math.sin((t-10.6)*8));
      [[.86,.25],[.94,.72],[.68,.18],[.52,.83]].forEach(([x,y],i)=>{ctx.beginPath();ctx.arc(width*x,height*y,sc*(.004+i*.001),0,Math.PI*2);ctx.fillStyle=i%2?'#eaa63b':'#ef7890';ctx.fill();});ctx.restore();
    }
    if(active&&active.point)brush(active.point.x,active.point.y,active.angle,sc,color,t);
    if(t>11.35){ctx.fillStyle='rgba(250,246,240,'+clamp((t-11.35)/.65)+')';ctx.fillRect(0,0,width,height);}
  }
  function animate(ts){
    raf=0;if(!last)last=ts;const dt=Math.min((ts-last)/1000,.05);last=ts;
    if(inView&&!document.hidden){elapsed=(elapsed+dt)%12;drawFrame(elapsed);}
    raf=requestAnimationFrame(animate);
  }
  function start(){if(reduced){drawFrame(10.8);return;}if(!raf){last=0;raf=requestAnimationFrame(animate);}}
  function stop(){if(raf){cancelAnimationFrame(raf);raf=0;}last=0;}
  if(typeof ResizeObserver!=='undefined'){const ro=new ResizeObserver(resize);ro.observe(host);}else{window.addEventListener('resize',resize,{passive:true});}
  if('IntersectionObserver'in window){const io=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;if(inView)start();else stop();},{threshold:.01});io.observe(host);}
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else if(inView)start();});
  resize();start();
}

export function init(root,...rest){const r=scPreUpiInit(root,...rest);try{scBindPay(root);scWallartArtBannerInit(root);}catch(e){}return r;}

// SEO: page title, description, business details for Google and tab icon (core/pack.js).
export function render(d={},selected=[]){const h=scSeoBaseRender(d,selected);try{if(typeof window!=="undefined"&&window.SiteCraftPack&&window.SiteCraftPack.seo)window.SiteCraftPack.seo(d,"Wall Artists & Murals")}catch(e){}return h}
