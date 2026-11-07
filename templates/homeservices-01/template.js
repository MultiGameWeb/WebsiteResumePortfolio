const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=v=>{const x=String(v??'').trim();return /^(https?:\/\/|tel:|mailto:)/i.test(x)?x:'';};
const imageUrl=v=>{const x=String(v??'').trim();return /^https:\/\/images\.unsplash\.com\//i.test(x)?x:'';};
const digits=v=>String(v??'').replace(/\D/g,'');
const tel=v=>String(v??'').replace(/[^\d+]/g,'');
const wa=(n,msg)=>{const p=digits(n);return p?'https://wa.me/'+p+(msg?'?text='+encodeURIComponent(msg):''):'';};
const rows=(d,key)=>(Array.isArray(d[key])?d[key]:[]).filter(x=>x&&x.enabled!==false);

function scBaseRender(d={},selected=[]){
 const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},ok=x=>selected.includes(x);
 const services=rows(d,'services'),areas=rows(d,'serviceAreas'),hours=rows(d,'hours'),gallery=rows(d,'gallery').filter(x=>imageUrl(x.image)),reviews=rows(d,'reviews'),faqs=rows(d,'faqs');
 const name=b.businessName||'FixRight Home Services',phone=tel(c.phone),waOn=ok('whatsapp')&&!!digits(c.whatsapp);
 const maps=url(c.maps),callLink=phone?url('tel:'+phone):'';
 const show={
  about:ok('about')&&s.showAbout!==false&&!!b.about,
  services:ok('services')&&s.showServices!==false&&services.length>0,
  how:ok('how')&&s.showHow!==false&&rows(d,'steps').length>0,
  areas:ok('areas')&&s.showAreas!==false&&areas.length>0,
  gallery:ok('gallery')&&s.showGallery!==false&&gallery.length>0,
  reviews:ok('reviews')&&s.showReviews!==false&&reviews.length>0,
  faq:ok('faq')&&s.showFaq!==false&&faqs.length>0,
  hours:ok('hours')&&s.showHours!==false&&hours.length>0,
  enquiry:ok('enquiry')&&s.showEnquiry!==false&&waOn,
  location:ok('location')&&s.showLocation!==false&&(!!c.address||!!maps),
  contact:ok('contact')&&s.showContact!==false&&(!!phone||waOn||!!url(c.email)||!!c.address),
  social:ok('social')&&s.showSocial!==false&&(!!url(c.instagram)||!!url(c.facebook)||!!url(c.youtube))
 };
 const nav=[['about','About'],['services','Services'],['how','How it works'],['areas','Service areas'],['reviews','Reviews'],['faq','FAQ'],['hours','Hours'],['location','Location'],['contact','Contact']].filter(([k])=>show[k]);
 let html='<div class="homeservices-01">';
 html+='<header class="fr-nav"><a class="fr-brand" href="#top" aria-label="'+esc(name)+' home"><span class="fr-brand-mark" aria-hidden="true">FR</span><span><strong>'+esc(name)+'</strong><small>'+esc(b.tagline||'Reliable help around your home')+'</small></span></a><nav aria-label="Main navigation">'+nav.map(([id,label])=>'<a href="#'+id+'">'+label+'</a>').join('')+'</nav><div class="fr-nav-actions">'+(show.enquiry?'<a class="fr-btn fr-btn-dark fr-nav-cta" href="#enquire">Book a technician</a>':'')+'</div></header>';

 if(ok('home')&&s.showHome!==false&&(h.title||h.text||imageUrl(d.hero))){
  const hero=imageUrl(d.hero);
  html+='<section class="fr-hero" id="top">'+(hero?'<img class="fr-hero-photo" src="'+esc(hero)+'" alt="Home maintenance technician working on a household repair">':'')+'<div class="fr-hero-shade"></div><div class="fr-hero-copy"><span class="fr-eyebrow">'+esc(h.eyebrow||'HOME REPAIRS, MADE SIMPLE')+'</span><h1>'+esc(h.title||'A reliable fix is just one booking away.')+'</h1>'+(h.text?'<p>'+esc(h.text)+'</p>':'')+'<div class="fr-hero-actions">'+(show.enquiry?'<a class="fr-btn fr-btn-primary" href="#enquire">Book a technician <span aria-hidden="true">↗</span></a>':'')+(show.services?'<a class="fr-btn fr-btn-outline-light" href="#services">Explore services</a>':'')+'</div><div class="fr-hero-points"><span>✓ Clear visit charges</span><i></i><span>✓ Quote before repair</span><i></i><span>✓ Pay after work</span></div></div></section>';
 }

 if(show.about){
  html+='<section class="fr-section fr-about" id="about"><div><span class="fr-kicker">About FixRight</span><h2>'+esc(b.motto||'Good service starts with listening.')+'</h2></div><div class="fr-about-copy"><p>'+esc(b.about)+'</p>'+(b.ownerName?'<p class="fr-sign">— '+esc(b.ownerName)+'</p>':'')+'</div></section>';
 }

 if(show.services){
  html+='<section class="fr-section fr-services" id="services"><div class="fr-section-head"><div><span class="fr-kicker">What can we help with?</span><h2>Home services, handled with care.</h2><p>Choose a service to include it in your booking request. Visit charges are starting rates; repair work and parts are quoted separately after inspection.</p></div><span class="fr-head-mark" aria-hidden="true">01 / 04</span></div><div class="fr-service-grid">'+services.map((x,i)=>{
   const im=imageUrl(x.image);
   return '<article class="fr-service-card">'+(im?'<div class="fr-service-image"><img src="'+esc(im)+'" alt="'+esc(x.imageAlt||x.name||'Home repair service')+'" loading="lazy"></div>':'')+'<div class="fr-service-content"><div class="fr-service-top"><span>0'+(i+1)+'</span>'+(x.badge?'<b>'+esc(x.badge)+'</b>':'')+'</div><h3>'+esc(x.name||'Home service')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'<div class="fr-service-foot"><span><small>Visit charge</small><strong>'+esc(x.price||'From ₹199')+'</strong></span>'+(show.enquiry?'<a href="#enquire" data-book-service="'+esc(x.name||'')+'">Book this service ↗</a>':'')+'</div></div></article>';
  }).join('')+'</div><p class="fr-price-note">Visit charges are indicative starting rates. Final repair costs, materials and any additional work will be explained and approved by you before work begins.</p></section>';
 }

 if(show.how){
  const steps=rows(d,'steps');
  html+='<section class="fr-section fr-how" id="how"><div class="fr-section-head"><div><span class="fr-kicker">Simple from start to finish</span><h2>Book → visit → pay after work.</h2><p>You stay in control at every step. No repair begins until you approve the quote.</p></div></div><div class="fr-steps">'+steps.map((x,i)=>'<article><span class="fr-step-no">0'+(i+1)+'</span><h3>'+esc(x.title||'Next step')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'</article>').join('')+'</div></section>';
 }

 if(show.areas){
  html+='<section class="fr-section fr-areas" id="areas"><div class="fr-section-head"><div><span class="fr-kicker">Where we work</span><h2>Service across Hyderabad.</h2><p>Choose your locality in the booking form. Our coordinator will confirm technician availability for your area.</p></div></div><div class="fr-area-list">'+areas.map(x=>'<span class="fr-area-chip">'+esc(x.name||'Service area')+'</span>').join('')+'</div></section>';
 }

 if(show.gallery){
  html+='<section class="fr-section fr-gallery" id="gallery"><div class="fr-section-head"><div><span class="fr-kicker">At work</span><h2>Care in every detail.</h2></div></div><div class="fr-gallery-grid">'+gallery.map((x,i)=>'<figure class="fr-gallery-item fr-gallery-'+(i%3+1)+'"><img src="'+esc(imageUrl(x.image))+'" alt="'+esc(x.alt||x.title||'FixRight home services')+'" loading="lazy">'+(x.title?'<figcaption>'+esc(x.title)+'</figcaption>':'')+'</figure>').join('')+'</div></section>';
 }

 if(show.reviews){
  html+='<section class="fr-section fr-reviews" id="reviews"><div class="fr-section-head"><div><span class="fr-kicker">Neighbourhood feedback</span><h2>Good work gets remembered.</h2></div></div><div class="fr-review-grid">'+reviews.map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||5));return '<figure><div class="fr-stars" aria-label="'+r+' out of 5 stars">'+('★'.repeat(r))+'</div><blockquote>“'+esc(x.text||'')+'”</blockquote><figcaption>'+esc(x.name||'Customer')+'</figcaption></figure>';}).join('')+'</div></section>';
 }

 if(show.faq){
  html+='<section class="fr-section fr-faq" id="faq"><div class="fr-section-head"><div><span class="fr-kicker">Before you book</span><h2>Frequently asked questions</h2></div></div><div class="fr-faq-list">'+faqs.map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
 }

 if(show.hours){
  html+='<section class="fr-section fr-hours" id="hours"><div class="fr-hours-card"><div><span class="fr-kicker">Service hours</span><h2>Here when home needs a hand.</h2>'+(c.hours?'<p class="fr-hours-summary">'+esc(c.hours)+'</p>':'')+'</div><div class="fr-hours-list">'+hours.map(x=>'<div class="fr-hours-row" data-day="'+esc(x.day||'')+'" data-open="'+esc(x.open||'')+'" data-close="'+esc(x.close||'')+'" data-closed="'+(x.closed?'true':'false')+'"><strong>'+esc(x.day||'Day')+'</strong><span>'+(x.closed?'Closed':esc(x.open||'')+(x.close?' – '+esc(x.close):''))+'</span></div>').join('')+'</div></div></section>';
 }

 if(show.location){
  html+='<section class="fr-section fr-location" id="location"><div><span class="fr-kicker">Local team, local knowledge</span><h2>Find FixRight Home Services.</h2>'+(c.address?'<p>'+esc(c.address)+'</p>':'')+'</div>'+(maps?'<a class="fr-btn fr-btn-dark" target="_blank" rel="noopener" href="'+esc(maps)+'">Open Google Maps ↗</a>':'')+'</section>';
 }

 if(show.contact||show.social){
  html+='<section class="fr-contact" id="contact">';
  if(show.contact){
   html+='<div class="fr-contact-main"><span class="fr-kicker">Let’s get it fixed</span><h2>'+esc(name)+'</h2><p>'+esc(c.address||'Hyderabad, Telangana')+'</p><div class="fr-contact-actions">'+(callLink?'<a class="fr-btn fr-btn-light" href="'+esc(callLink)+'">Call '+esc(c.phone)+'</a>':'')+(waOn?'<a class="fr-btn fr-btn-wa" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hello FixRight Home Services. I have a home repair enquiry.')))+'">WhatsApp us</a>':'')+'</div></div>';
   html+='<div class="fr-contact-side">'+(url(c.email)?'<a href="'+esc(url('mailto:'+c.email))+'">'+esc(c.email)+'</a>':'')+(maps?'<a target="_blank" rel="noopener" href="'+esc(maps)+'">Google Maps directions ↗</a>':'')+'</div>';
  }
  if(show.social)html+='<div class="fr-contact-side fr-social">'+(url(c.instagram)?'<a target="_blank" rel="noopener" href="'+esc(url(c.instagram))+'">Instagram ↗</a>':'')+(url(c.facebook)?'<a target="_blank" rel="noopener" href="'+esc(url(c.facebook))+'">Facebook ↗</a>':'')+(url(c.youtube)?'<a target="_blank" rel="noopener" href="'+esc(url(c.youtube))+'">YouTube ↗</a>':'')+'</div>';
  html+='</section>';
 }

 html+='<footer class="fr-footer"><a href="#top">'+esc(name)+'</a><span>'+esc(b.tagline||'Reliable help around your home')+'</span><span>© '+new Date().getFullYear()+' · All rights reserved.</span></footer>';
 if(waOn)html+='<a class="fr-float" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hello FixRight Home Services. I have a home repair enquiry.')))+'" aria-label="WhatsApp FixRight Home Services">WhatsApp</a>';
 return html+'</div>';
}

const toMin=t=>{const m=String(t||'').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);if(!m)return null;let hr=+m[1]%12;if(/pm/i.test(m[3]||''))hr+=12;if(!m[3]&&+m[1]===12)hr=12;return hr*60+(+(m[2]||0));};
export function init(root,d={},selected=[]){
 scMobileNav(root);scBindForms(root);if(!root)return;
 root.querySelectorAll('[data-book-service]').forEach(btn=>btn.addEventListener('click',()=>{const field=root.querySelector('[name="service"]');if(field){field.value=btn.dataset.bookService;field.dispatchEvent(new Event('change',{bubbles:true}));}}));
 const day=new Date().toLocaleDateString('en-US',{weekday:'long'}).toLowerCase(),now=new Date(),mins=now.getHours()*60+now.getMinutes();let openNow=null;
 root.querySelectorAll('.fr-hours-row').forEach(row=>{if(String(row.dataset.day).trim().toLowerCase()!==day)return;row.classList.add('is-today');if(row.dataset.closed==='true'){openNow=false;return;}const start=toMin(row.dataset.open),end=toMin(row.dataset.close);if(start===null||end===null)return;openNow=end>start?(mins>=start&&mins<end):(mins>=start||mins<end);});
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
/* SiteCraft enquiry form: collects details and opens WhatsApp with them filled in. Shown before the contact section. */
const SC_FORM={"section":"fr-section fr-booking","kicker":"fr-kicker","btn":"fr-btn fr-btn-primary","kickerText":"Book a technician","title":"Tell us what needs fixing","text":"Share the service, area and a suitable time. Our coordinator will reply on WhatsApp to confirm the visit. A technician will inspect the issue and share a quote before any repair work begins.","submit":"Send booking request on WhatsApp","intro":"Hello FixRight Home Services. I would like to book a technician.","fields":[["name","Your name","text",true],["phone","Mobile number","tel",true],["service","Service required","select:services:name",true],["area","Service area / locality","select:serviceAreas:name",true],["address","House / flat, street and landmark","text",true],["date","Preferred date","date",true],["slot","Preferred time slot","select:timeSlots:name",true],["problem","Describe the problem","textarea",true]]};
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
    '<div class="sc-form-actions wide"><button type="submit" class="'+f.btn+'">'+scEsc(f.submit)+'</button><p class="sc-form-note" role="status" aria-live="polite">Your details are sent only to us, through WhatsApp.</p></div></form></section>';
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
      const msg=(form.dataset.intro||'Hi')+(form.dataset.biz?' ('+form.dataset.biz+')':'')+'\n\n'+lines.join('\n');
      window.open('https://wa.me/'+form.dataset.wa+'?text='+encodeURIComponent(msg),'_blank','noopener');
      if(note)note.textContent='WhatsApp has opened with your details. Tap send to share them with us.';
    });
  });
}

export function render(d={},selected=[]){
 const s=d.settings||{},c=d.contact||{};
 const chosen=(selected||[]).filter(x=>x!=='enquiry'||s.showEnquiry!==false);
 const connectSelected=(selected||[]).filter(x=>x!=='social'||s.showSocial!==false);
 const connectData={...d,contact:{
  ...c,
  hours:connectSelected.includes('hours')&&s.showHours!==false?c.hours:'',
  email:connectSelected.includes('contact')&&s.showContact!==false?c.email:'',
  instagram:connectSelected.includes('social')&&s.showSocial!==false?c.instagram:'',
  facebook:connectSelected.includes('social')&&s.showSocial!==false?c.facebook:'',
  youtube:connectSelected.includes('social')&&s.showSocial!==false?c.youtube:''
 }};
 return scConnect(scWithForm(scBaseRender(d,selected),d,chosen),connectData,connectSelected);
}
