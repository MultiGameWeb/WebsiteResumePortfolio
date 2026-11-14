const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=v=>{const x=String(v??'').trim();return /^(https?:|tel:|mailto:|data:image\/)/i.test(x)||/^[\w./-]+$/.test(x)?x:''};
const digits=v=>String(v??'').replace(/\D/g,'');
const tel=v=>String(v??'').replace(/[^\d+]/g,'');
const wa=(n,msg)=>{const p=digits(n);return p?'https://wa.me/'+p+(msg?'?text='+encodeURIComponent(msg):''):''};
const initials=n=>String(n||'').split(/\s+/).filter(w=>/^[A-Za-z]/.test(w)).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'✦';

function scBaseRender(d={},selected=[]){
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
    html+='<section class="as-contact" id="contact"><div><span class="as-kicker">Contact</span><h2>Book a consultation</h2><p>'+[c.location?esc(c.location):'',typeof c.hours==='string'&&c.hours?esc(c.hours):'',c.call?'<a href="tel:'+esc(tel(c.call))+'">'+esc(c.call)+'</a>':''].filter(Boolean).join(' · ')+'</p></div>'+
      '<div class="as-actions">'+(waOn?'<a class="as-btn gold" target="_blank" rel="noopener" href="'+esc(waLink('Namaste, I would like to book a consultation.'))+'">WhatsApp us</a>':'')+
      (c.call?'<a class="as-btn ghost" href="tel:'+esc(tel(c.call))+'">Call</a>':'')+(ok('location')&&url(c.maps)?'<a class="as-btn ghost" target="_blank" rel="noopener" href="'+esc(url(c.maps))+'">Directions</a>':'')+'</div></section>';
  }

  html+='<footer class="as-footer"><strong>'+esc(name)+'</strong><span>© '+new Date().getFullYear()+' · '+esc(b.motto||'All rights reserved.')+'</span></footer>';
  if(waOn)html+='<a class="as-float" target="_blank" rel="noopener" href="'+esc(waLink('Namaste, I would like to book a consultation.'))+'" aria-label="Chat on WhatsApp">WhatsApp</a>';
  return html+'</div>';
}

function scPreUpiInit(root){scMobileNav(arguments[0]);scBindForms(arguments[0]);}

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
function scPreUpiRender(d={},selected=[]){return scConnect(scWithForm(scBaseRender(d,selected),d,selected),d,selected);}

/* SiteCraft enquiry form: collects details and opens WhatsApp with them filled in. Shown before the contact section. */
const SC_FORM={"section": "as-section as-book", "kicker": "as-kicker", "btn": "as-btn gold", "kickerText": "Book a consultation", "title": "Share your details", "text": "Fill in your birth details and we will confirm your consultation slot on WhatsApp.", "submit": "Send booking on WhatsApp", "intro": "Namaste, I would like to book a consultation.", "fields": [["name", "Your name", "text", true], ["phone", "Phone number", "tel", true], ["service", "Consultation", "select:services:name", false], ["dob", "Date of birth", "date", true], ["tob", "Time of birth", "time", false], ["pob", "Place of birth", "text", false], ["date", "Preferred consultation date", "date", false], ["message", "Your question (optional)", "textarea", false]]};
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
export function render(d={},selected=[]){const h=scSeoBaseRender(d,selected);try{if(typeof window!=="undefined"&&window.SiteCraftPack&&window.SiteCraftPack.seo)window.SiteCraftPack.seo(d,"Astrology")}catch(e){}return h}
