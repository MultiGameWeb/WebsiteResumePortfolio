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
  const name=b.businessName||'Happy Paws Pet Shop & Clinic',mark=(String(name).match(/[A-Za-z0-9]+/g)||['h','p']).slice(0,2).map(w=>w[0].toLowerCase()).join('')+'.',phone=tel(c.phone),waOn=ok('whatsapp')&&!!digits(c.whatsapp);
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
  const nav=[['about','About'],['menu','Services'],['combos','Offers'],['work','Why us'],['gallery','Gallery'],['reviews','Reviews'],['faq','FAQ'],['hours','Hours'],['location','Visit']].filter(([k])=>show[k]);
  let html='<div class="pet-01">';
  html+='<header class="pt-nav"><a class="pt-brand" href="#top" aria-label="'+esc(name)+' home"><span class="pt-brand-mark" aria-hidden="true">'+esc(mark)+'</span><span><strong>'+esc(name)+'</strong><small>'+esc(b.tagline||'Grooming · Vet · Food · Accessories')+'</small></span></a><nav aria-label="Main navigation">'+nav.map(([k,label])=>'<a href="#'+k+'">'+label+'</a>').join('')+'</nav><div class="pt-nav-action">'+(show.reservation?'<a class="pt-btn pt-btn-dark pt-nav-cta" href="#enquire">Book a visit</a>':'')+'</div></header>';

  if(ok('home')&&s.showHome!==false&&(h.title||h.text||imageUrl(d.hero))){
    const hero=imageUrl(d.hero);
    html+='<section class="pt-hero" id="top">'+(hero?'<img class="pt-hero-photo" src="'+esc(hero)+'" alt="Two small dogs running along a sunny path">':'')+'<div class="pt-hero-overlay"></div><div class="pt-hero-copy"><span class="pt-eyebrow">'+esc(h.eyebrow||'PET SHOP · CLINIC · GROOMING')+'</span><h1>'+esc(h.title||'Happy pets, happy families.')+'</h1>'+(h.text?'<p>'+esc(h.text)+'</p>':'')+'<div class="pt-hero-actions">'+(show.menu?'<a class="pt-btn pt-btn-cream" href="#menu">See services & prices <span aria-hidden="true">↗</span></a>':'')+(show.reservation?'<a class="pt-btn pt-btn-outline-light" href="#enquire">Book a visit</a>':'')+'</div><div class="pt-hero-foot"><span>Qualified vet</span><i aria-hidden="true"></i><span>Gentle grooming</span><i aria-hidden="true"></i><span>Safe boarding</span></div></div><div class="pt-hero-badge"><span>LOVE,</span><strong>CARE AND</strong><span>TREATS</span></div></section>';
  }

  if(show.about){
    html+='<section class="pt-section pt-about" id="about"><div class="pt-about-label"><span class="pt-kicker">About us</span><span class="pt-about-asterisk" aria-hidden="true">✳</span></div><div class="pt-about-copy"><h2>'+esc(b.motto||'Everything your pet needs, in one place.')+'</h2><p>'+esc(b.about)+'</p>'+(b.ownerName?'<p class="pt-sign">— '+esc(b.ownerName)+'</p>':'')+'</div></section>';
  }

  if(show.menu){
    const cats=[...new Set(menu.map(x=>String(x.category||'').trim()).filter(Boolean))];
    html+='<section class="pt-section pt-menu" id="menu"><div class="pt-section-head"><div><span class="pt-kicker">Care & supplies</span><h2>Services & prices</h2><p>Grooming, vet care, boarding, food and accessories for dogs, cats and small pets.</p></div><span class="pt-head-note">FIRST VISIT<br>10% OFF</span></div><div class="pt-tabs" role="group" aria-label="Filter by category"><button type="button" class="is-active" data-menu-filter="all" aria-pressed="true">All</button>'+cats.map(x=>'<button type="button" data-menu-filter="'+esc(slug(x))+'" aria-pressed="false">'+esc(x)+'</button>').join('')+'</div><div class="pt-menu-grid">'+menu.map(x=>{
      const image=imageUrl(x.image),category=slug(x.category);
      return '<article class="pt-menu-card" data-menu-card data-category="'+esc(category)+'">'+(image?'<div class="pt-menu-image"><img src="'+esc(image)+'" alt="'+esc(x.imageAlt||x.name||'Pet service')+'" loading="lazy"></div>':'')+'<div class="pt-menu-content"><div class="pt-menu-meta"><span>'+esc(x.category||'Pet care')+'</span>'+(x.tag?'<b>'+esc(x.tag)+'</b>':'')+'</div><h3>'+esc(x.name||'House favourite')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'<div class="pt-menu-price"><strong>'+esc(x.price||'Ask for price')+'</strong>'+(waOn?'<a target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hi '+name+', I would like '+(x.name||'this item')+'. Please share price and availability.')))+'">Book ↗</a>':'')+'</div></div></article>';
    }).join('')+'</div></section>';
  }

  if(show.combos){
    html+='<section class="pt-section pt-combos" id="combos"><div class="pt-section-head"><div><span class="pt-kicker">Save more</span><h2>Offers & care packs</h2><p>Care packs and first-visit offers for your pet.</p></div></div><div class="pt-combo-grid">'+combos.map((x,i)=>'<article class="pt-combo-card"><span class="pt-combo-number">0'+(i+1)+'</span><div><h3>'+esc(x.name||'Pack')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'<strong>'+esc(x.price||'Ask for price')+'</strong></div>'+(waOn?'<a target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hi '+name+', please tell me more about the '+(x.name||'pack')+'.')))+'" aria-label="Ask about '+esc(x.name||'pack')+'">Ask about this pack ↗</a>':'')+'</article>').join('')+'</div></section>';
  }

  if(show.work){
    html+='<section class="pt-section pt-work" id="work"><div class="pt-work-intro"><span class="pt-kicker">Why pet parents trust us</span><h2>Care that feels like family.</h2><p>A qualified vet, gentle groomers and a clean, safe space. We treat your pet like our own.</p></div><div class="pt-highlight-grid">'+highlights.map((x,i)=>'<article><span class="pt-highlight-icon" aria-hidden="true">'+esc(x.icon||['♥', '✓', '⌂', '₹'][i%4])+'</span><h3>'+esc(x.title||'Made for you')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'</article>').join('')+'</div></section>';
  }

  if(show.gallery){
    html+='<section class="pt-section pt-gallery" id="gallery"><div class="pt-section-head"><div><span class="pt-kicker">Our little family</span><h2>Pets we love</h2></div><span class="pt-gallery-flower" aria-hidden="true">✿</span></div><div class="pt-gallery-grid">'+gallery.map((x,i)=>'<figure class="pt-gallery-item pt-gallery-'+(i%4+1)+'"><img src="'+esc(imageUrl(x.image))+'" alt="'+esc(x.alt||x.title||name)+'" loading="lazy">'+(x.title?'<figcaption>'+esc(x.title)+'</figcaption>':'')+'</figure>').join('')+'</div></section>';
  }

  if(show.reviews){
    html+='<section class="pt-section pt-reviews" id="reviews"><div class="pt-section-head"><div><span class="pt-kicker">Pet parent reviews</span><h2>Wagging tails all around.</h2></div></div><div class="pt-review-grid">'+reviews.map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||5));return '<figure><div class="pt-stars" aria-label="'+r+' out of 5 stars">'+('★'.repeat(r))+'</div><blockquote>“'+esc(x.text||'')+'”</blockquote><figcaption>'+esc(x.name||'Customer')+'</figcaption></figure>';}).join('')+'</div></section>';
  }

  if(show.faq){
    html+='<section class="pt-section pt-faq" id="faq"><div class="pt-section-head"><div><span class="pt-kicker">Good to know</span><h2>Good to know</h2></div></div><div class="pt-faq-list">'+faqs.map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
  }

  if(show.hours){
    html+='<section class="pt-section pt-hours" id="hours"><div class="pt-hours-card"><div class="pt-hours-intro"><span class="pt-kicker">Shop timings</span><h2>Drop in any day.</h2><span class="pt-open-badge" data-open-status hidden></span><p>'+(c.address?esc(c.address):'Hyderabad, Telangana')+'</p></div><div class="pt-hours-list">'+hours.map(x=>'<div class="pt-hours-row" data-day="'+esc(x.day||'')+'" data-open="'+esc(x.open||'')+'" data-close="'+esc(x.close||'')+'" data-closed="'+(x.closed?'true':'false')+'"><strong>'+esc(x.day||'Day')+'</strong><span>'+(x.closed?'Closed':esc(x.open||'')+(x.close?' – '+esc(x.close):''))+'</span></div>').join('')+'</div></div></section>';
  }

  if(show.reservation){
    html+='<section class="pt-section pt-reservation-anchor" id="reserve"><div class="pt-reserve-prompt"><span class="pt-kicker">Need help for your pet?</span><h2>Book a visit or ask us.</h2><p>Tell us about your pet and what you need. We’ll confirm a time on WhatsApp.</p><a class="pt-btn pt-btn-dark" href="#enquire">Book a visit ↗</a></div></section>';
  }

  if(show.location){
    html+='<section class="pt-section pt-location" id="location"><div><span class="pt-kicker">Visit the shop</span><h2>Come say hello.</h2>'+(c.address?'<p>'+esc(c.address)+'</p>':'')+'</div>'+(url(c.maps)?'<a class="pt-btn pt-btn-dark" target="_blank" rel="noopener" href="'+esc(url(c.maps))+'">Get directions ↗</a>':'')+'</section>';
  }

  if(show.contact||show.social){
    html+='<section class="pt-contact" id="contact">';
    if(show.contact){
      html+='<div class="pt-contact-main"><span class="pt-kicker">See you soon</span><h2>'+esc(name)+'</h2><p>'+esc(c.address||'Hyderabad, Telangana')+'</p><div class="pt-contact-actions">'+(phone?'<a class="pt-btn pt-btn-cream" href="'+esc(url('tel:'+phone))+'">Call '+esc(c.phone)+'</a>':'')+(waOn?'<a class="pt-btn pt-btn-whatsapp" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hello '+name+'! I have an enquiry.')))+'">WhatsApp us</a>':'')+'</div></div>';
    }else{
      html+='<div class="pt-contact-main"><span class="pt-kicker">Stay connected</span><h2>Follow our pets on Instagram.</h2></div>';
    }
    if(show.contact&&c.email)html+='<div class="pt-contact-side"><a href="'+esc(url('mailto:'+c.email))+'">'+esc(c.email)+'</a></div>';
    if(show.social)html+='<div class="pt-contact-side"><div class="pt-social">'+(url(c.instagram)?'<a target="_blank" rel="noopener" href="'+esc(url(c.instagram))+'">Instagram ↗</a>':'')+(url(c.facebook)?'<a target="_blank" rel="noopener" href="'+esc(url(c.facebook))+'">Facebook ↗</a>':'')+(url(c.youtube)?'<a target="_blank" rel="noopener" href="'+esc(url(c.youtube))+'">YouTube ↗</a>':'')+'</div></div>';
    html+='</section>';
  }

  html+='<footer class="pt-footer"><a href="#top">'+esc(name)+'</a><span>'+esc(b.tagline||'Grooming · Vet · Food · Accessories')+'</span><span>© '+new Date().getFullYear()+' · All rights reserved.</span></footer>';
  if(waOn)html+='<a class="pt-float" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hello '+name+'!')))+'" aria-label="Chat with '+esc(name)+' on WhatsApp">WhatsApp</a>';
  return html+'</div>';
}

const toMin=t=>{const m=String(t||'').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);if(!m)return null;let hr=+m[1]%12;if(/pm/i.test(m[3]||''))hr+=12;if(!m[3]&&+m[1]===12)hr=12;return hr*60+(+(m[2]||0));};
function scPreUpiInit(root,d={},selected=[]){
  scMobileNav(root);scBindForms(root);if(!root)return;
  const tabs=[...root.querySelectorAll('[data-menu-filter]')],cards=[...root.querySelectorAll('[data-menu-card]')];
  tabs.forEach(btn=>btn.addEventListener('click',()=>{const cat=btn.dataset.menuFilter;tabs.forEach(t=>{const on=t===btn;t.classList.toggle('is-active',on);t.setAttribute('aria-pressed',String(on));});cards.forEach(card=>{card.hidden=!(cat==='all'||card.dataset.category===cat);});}));
  const day=new Date().toLocaleDateString('en-US',{weekday:'long'}).toLowerCase(),now=new Date(),mins=now.getHours()*60+now.getMinutes();let openNow=null;
  root.querySelectorAll('.pt-hours-row').forEach(row=>{if(String(row.dataset.day).trim().toLowerCase()!==day)return;row.classList.add('is-today');if(row.dataset.closed==='true'){openNow=false;return;}const start=toMin(row.dataset.open),end=toMin(row.dataset.close);if(start===null||end===null)return;openNow=end>start?(mins>=start&&mins<end):(mins>=start||mins<end);});
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
const SC_FORM={"section": "pt-section pt-booking", "kicker": "pt-kicker", "btn": "pt-btn pt-btn-dark", "kickerText": "Book a visit", "title": "Book a visit", "text": "Tell us about your pet and what you need. We’ll confirm a time on WhatsApp.", "submit": "Send on WhatsApp", "intro": "Hello, I would like to book for my pet.", "fields": [["name", "Your name", "text", true], ["phone", "Phone number", "tel", true], ["product", "Service or product", "select:menu:name", true], ["pet", "Pet type", "select:meetupTypes:name", true], ["date", "Preferred date", "date", false], ["message", "Pet’s name, age, breed or questions (optional)", "textarea", false]]};
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
export function init(root,...rest){const r=scPreUpiInit(root,...rest);try{scBindPay(root);}catch(e){}return r;}

// SEO: page title, description, business details for Google and tab icon (core/pack.js).
export function render(d={},selected=[]){const h=scSeoBaseRender(d,selected);try{if(typeof window!=="undefined"&&window.SiteCraftPack&&window.SiteCraftPack.seo)window.SiteCraftPack.seo(d,"Pet Shops & Clinics")}catch(e){}return h}
