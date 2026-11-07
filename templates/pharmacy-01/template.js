const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=v=>{const x=String(v??'').trim();return /^(https?:\/\/|tel:|mailto:)/i.test(x)?x:'';};
const imageUrl=v=>{const x=String(v??'').trim();return /^https:\/\/images\.unsplash\.com\//i.test(x)?x:'';};
const digits=v=>String(v??'').replace(/\D/g,'');
const tel=v=>String(v??'').replace(/[^\d+]/g,'');
const wa=(n,msg)=>{const p=digits(n);return p?'https://wa.me/'+p+(msg?'?text='+encodeURIComponent(msg):''):'';};
const rows=(d,key)=>(Array.isArray(d[key])?d[key]:[]).filter(x=>x&&x.enabled!==false);
const mail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v||''))?url('mailto:'+String(v).trim()):'';

function scBaseRender(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},ok=x=>selected.includes(x);
  const categories=['Medicines','Wellness','Baby care','Devices'];
  const products=rows(d,'products').filter(x=>x.category!=='Medicines'&&x.category!=='Prescription medicines');
  const areas=rows(d,'deliveryAreas'),gallery=rows(d,'gallery').filter(x=>imageUrl(x.image));
  const reviews=rows(d,'reviews'),faqs=rows(d,'faqs'),hours=rows(d,'hours');
  const name=b.businessName||'CareMeds Pharmacy',phone=tel(c.phone),waOn=ok('whatsapp')&&!!digits(c.whatsapp);
  const maps=url(c.maps);
  const show={
    about:ok('about')&&s.showAbout!==false&&!!b.about,
    categories:ok('categories')&&s.showCategories!==false,
    products:ok('products')&&s.showProducts!==false&&products.length>0,
    delivery:ok('delivery')&&s.showDelivery!==false&&areas.length>0,
    gallery:ok('gallery')&&s.showGallery!==false&&gallery.length>0,
    reviews:ok('reviews')&&s.showReviews!==false&&reviews.length>0,
    faq:ok('faq')&&s.showFaq!==false&&faqs.length>0,
    hours:ok('hours')&&s.showHours!==false&&hours.length>0,
    prescription:ok('prescription')&&s.showPrescription!==false&&waOn,
    emergency:ok('emergency')&&s.showEmergency!==false,
    location:ok('location')&&s.showLocation!==false&&(!!c.address||!!maps),
    contact:ok('contact')&&s.showContact!==false&&(!!phone||waOn||!!mail(c.email)||!!c.address),
    social:ok('social')&&s.showSocial!==false&&(!!url(c.instagram)||!!url(c.facebook)||!!url(c.youtube))
  };
  const nav=[['about','About'],['categories','Categories'],['products','Health products'],['delivery','Delivery'],['gallery','Gallery'],['reviews','Reviews'],['faq','FAQ'],['hours','Hours'],['location','Location'],['contact','Contact']].filter(([k])=>show[k]);
  const prescriptionMsg='Hello CareMeds Pharmacy. I would like to request a prescription medicine. I will attach a clear photo or PDF of a valid prescription in this WhatsApp chat. Please have the pharmacist review it and confirm availability. I understand medicines are dispensed only against a valid prescription.';
  let html='<div class="pharmacy-01">';
  html+='<header class="cm-nav"><a class="cm-brand" href="#top" aria-label="'+esc(name)+' home"><span class="cm-brand-mark" aria-hidden="true">+</span><span><strong>'+esc(name)+'</strong><small>'+esc(b.tagline||'Everyday care, close to home')+'</small></span></a><nav aria-label="Main navigation">'+nav.map(([id,label])=>'<a href="#'+id+'">'+label+'</a>').join('')+'</nav><div class="cm-nav-right">'+(show.prescription?'<a class="cm-btn cm-btn-green cm-nav-cta" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,prescriptionMsg)))+'">Send prescription</a>':'')+'</div></header>';

  if(ok('home')&&s.showHome!==false&&(h.title||h.text||imageUrl(d.hero))){
    const hero=imageUrl(d.hero);
    html+='<section class="cm-hero" id="top">'+(hero?'<img class="cm-hero-photo" src="'+esc(hero)+'" alt="CareMeds Pharmacy store shelves and service counter">':'')+'<div class="cm-hero-shade"></div><div class="cm-hero-copy"><span class="cm-eyebrow">'+esc(h.eyebrow||'YOUR NEIGHBOURHOOD PHARMACY')+'</span><h1>'+esc(h.title||'Everyday care, made a little easier.')+'</h1>'+(h.text?'<p>'+esc(h.text)+'</p>':'')+'<div class="cm-actions">'+(show.prescription?'<a class="cm-btn cm-btn-green" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,prescriptionMsg)))+'">Send your prescription on WhatsApp ↗</a>':'')+(show.products?'<a class="cm-btn cm-btn-light" href="#products">Explore health products</a>':'')+'</div><div class="cm-hero-note"><span aria-hidden="true">✓</span> Medicines dispensed only against a valid prescription.</div></div></section>';
  }

  if(show.about){
    html+='<section class="cm-section cm-about" id="about"><div><span class="cm-kicker">Care, close to home</span><h2>'+esc(b.motto||'A pharmacy that puts people first.')+'</h2></div><div class="cm-about-copy"><p>'+esc(b.about)+'</p>'+(b.ownerName?'<p class="cm-sign">— '+esc(b.ownerName)+'</p>':'')+'</div></section>';
  }

  if(show.categories){
    html+='<section class="cm-section cm-categories" id="categories"><div class="cm-section-head"><div><span class="cm-kicker">Browse by need</span><h2>Find your care category</h2><p>Prescription requests are reviewed by the pharmacist. Other listed products are non-prescription health-care essentials.</p></div></div><div class="cm-category-grid">'+
      categories.map((cat,i)=>'<button type="button" class="cm-category-card" data-category-pick="'+esc(cat)+'"><span class="cm-category-icon" aria-hidden="true">'+['Rx','✳','♡','⌁'][i]+'</span><strong>'+esc(cat)+'</strong><span>'+(cat==='Medicines'?'Valid prescription required':cat==='Wellness'?'Personal care & hygiene':cat==='Baby care'?'Everyday baby essentials':'Home health devices')+'</span><em>Explore →</em></button>').join('')+'</div></section>';
  }

  if(show.products||show.prescription){
    html+='<section class="cm-section cm-products" id="products"><div class="cm-section-head"><div><span class="cm-kicker">A thoughtful essentials shelf</span><h2>Health & care products</h2><p>Only non-prescription products are displayed with prices. Prescription medicines are not listed for online sale.</p></div></div>';
    html+='<div class="cm-product-tabs" role="group" aria-label="Filter by product category"><button type="button" class="is-active" data-product-filter="all" aria-pressed="true">All</button>'+categories.map(cat=>'<button type="button" data-product-filter="'+esc(cat)+'" aria-pressed="false">'+esc(cat)+'</button>').join('')+'</div>';
    html+='<div class="cm-prescription-panel" data-prescription-panel hidden><div><span class="cm-prescription-tag">Prescription medicines</span><h3>Need a prescribed medicine?</h3><p>Send a clear photo or PDF of your valid prescription on WhatsApp. Our pharmacist will review it and confirm availability and dispensing details. No prescription medicine prices or online checkout are shown here.</p><small>Medicines are dispensed only against a valid prescription.</small></div>'+(waOn?'<a class="cm-btn cm-btn-green" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,prescriptionMsg)))+'">Send prescription ↗</a>':'')+'</div>';
    if(show.products){
      html+='<div class="cm-product-grid">'+products.map(x=>{
        const im=imageUrl(x.image),price=x.price||'';
        return '<article class="cm-product-card" data-product-card data-category="'+esc(x.category||'')+'">'+(im?'<div class="cm-product-image"><img src="'+esc(im)+'" alt="'+esc(x.imageAlt||x.name||'Health-care product')+'" loading="lazy"></div>':'')+'<div class="cm-product-content"><span class="cm-product-category">'+esc(x.category||'Health product')+'</span><h3>'+esc(x.name||'Care essential')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'<div class="cm-product-foot"><strong>'+esc(price)+'</strong>'+(waOn?'<a target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hello CareMeds Pharmacy. Please confirm availability and current price for '+(x.name||'this non-prescription product')+'.')))+'">Ask on WhatsApp ↗</a>':'')+'</div><small>Non-prescription product · Price subject to confirmation</small></div></article>';
      }).join('')+'</div>';
    }
    html+='</section>';
  }

  if(show.delivery){
    html+='<section class="cm-section cm-delivery" id="delivery"><div class="cm-section-head"><div><span class="cm-kicker">Local delivery</span><h2>Care delivered around your neighbourhood.</h2><p>Coverage, delivery slot and availability are confirmed by the pharmacy team when you contact us.</p></div></div><div class="cm-delivery-grid">'+areas.map(x=>'<article><span aria-hidden="true">⌖</span><strong>'+esc(x.name||'Local area')+'</strong>'+(x.note?'<p>'+esc(x.note)+'</p>':'')+'</article>').join('')+'</div>'+(waOn?'<a class="cm-text-link" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hello CareMeds Pharmacy. Please confirm home delivery availability for my area.')))+'">Check delivery for my area ↗</a>':'')+'</section>';
  }

  if(show.gallery){
    html+='<section class="cm-section cm-gallery" id="gallery"><div class="cm-section-head"><div><span class="cm-kicker">Inside CareMeds</span><h2>Our store & care essentials</h2></div></div><div class="cm-gallery-grid">'+gallery.map((x,i)=>'<figure class="cm-gallery-item cm-gallery-'+(i%3+1)+'"><img src="'+esc(imageUrl(x.image))+'" alt="'+esc(x.alt||x.title||'CareMeds Pharmacy')+'" loading="lazy">'+(x.title?'<figcaption>'+esc(x.title)+'</figcaption>':'')+'</figure>').join('')+'</div></section>';
  }

  if(show.reviews){
    html+='<section class="cm-section cm-reviews" id="reviews"><div class="cm-section-head"><div><span class="cm-kicker">Kind words from the neighbourhood</span><h2>Customer experiences</h2></div></div><div class="cm-review-grid">'+reviews.map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||5));return '<figure><div class="cm-stars" aria-label="'+r+' out of 5 stars">'+('★'.repeat(r))+'</div><blockquote>“'+esc(x.text||'')+'”</blockquote><figcaption>'+esc(x.name||'Customer')+'</figcaption></figure>';}).join('')+'</div></section>';
  }

  if(show.faq){
    html+='<section class="cm-section cm-faq" id="faq"><div class="cm-section-head"><div><span class="cm-kicker">Helpful information</span><h2>Frequently asked questions</h2></div></div><div class="cm-faq-list">'+faqs.map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
  }

  if(show.hours){
    html+='<section class="cm-section cm-hours" id="hours"><div class="cm-hours-card"><div><span class="cm-kicker">Store timings</span><h2>We’re here to help.</h2><span class="cm-open-badge" data-open-status hidden></span><p>'+esc(c.address||'Hyderabad, Telangana')+'</p></div><div class="cm-hours-list">'+hours.map(x=>'<div class="cm-hours-row" data-day="'+esc(x.day||'')+'" data-open="'+esc(x.open||'')+'" data-close="'+esc(x.close||'')+'" data-closed="'+(x.closed?'true':'false')+'"><strong>'+esc(x.day||'Day')+'</strong><span>'+(x.closed?'Closed':esc(x.open||'')+(x.close?' – '+esc(x.close):''))+'</span></div>').join('')+'</div></div></section>';
  }

  if(show.emergency){
    html+='<section class="cm-section cm-emergency" id="emergency"><div class="cm-emergency-copy"><span class="cm-kicker">Important contact</span><h2>Pharmacy assistance & emergencies</h2><p><strong>Pharmacy desk:</strong> For store hours, product availability and prescription process questions, call the pharmacy during business hours.</p><p class="cm-emergency-note">This pharmacy is not an emergency medical service. For an urgent medical or other emergency in India, call 112 or go to the nearest emergency department.</p></div><div class="cm-emergency-actions">'+(phone?'<a class="cm-btn cm-btn-outline" href="'+esc(url('tel:'+phone))+'">Call pharmacy</a>':'')+'<a class="cm-btn cm-btn-alert" href="'+esc(url('tel:112'))+'">Call 112 · Emergency</a></div></section>';
  }

  if(show.location){
    html+='<section class="cm-section cm-location" id="location"><div><span class="cm-kicker">Visit the store</span><h2>Find CareMeds Pharmacy.</h2>'+(c.address?'<p>'+esc(c.address)+'</p>':'')+'</div>'+(maps?'<a class="cm-btn cm-btn-dark" target="_blank" rel="noopener" href="'+esc(maps)+'">Open Google Maps ↗</a>':'')+'</section>';
  }

  if(show.contact||show.social){
    html+='<section class="cm-contact" id="contact">';
    if(show.contact){
      html+='<div class="cm-contact-main"><span class="cm-kicker">We’re happy to help</span><h2>'+esc(name)+'</h2><p>'+esc(c.address||'Hyderabad, Telangana')+'</p><div class="cm-contact-actions">'+(phone?'<a class="cm-btn cm-btn-light" href="'+esc(url('tel:'+phone))+'">Call '+esc(c.phone)+'</a>':'')+(waOn?'<a class="cm-btn cm-btn-green" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hello CareMeds Pharmacy. I have a general enquiry.')))+'">WhatsApp us</a>':'')+'</div></div>';
      html+='<div class="cm-contact-side">'+(mail(c.email)?'<a href="'+esc(mail(c.email))+'">'+esc(c.email)+'</a>':'')+(maps?'<a target="_blank" rel="noopener" href="'+esc(maps)+'">Google Maps directions ↗</a>':'')+'</div>';
    }
    if(show.social)html+='<div class="cm-contact-side cm-social">'+(url(c.instagram)?'<a target="_blank" rel="noopener" href="'+esc(url(c.instagram))+'">Instagram ↗</a>':'')+(url(c.facebook)?'<a target="_blank" rel="noopener" href="'+esc(url(c.facebook))+'">Facebook ↗</a>':'')+(url(c.youtube)?'<a target="_blank" rel="noopener" href="'+esc(url(c.youtube))+'">YouTube ↗</a>':'')+'</div>';
    html+='</section>';
  }

  html+='<div class="cm-disclaimer">Important: Medicines are dispensed only against a valid prescription. Prescription medicines are not sold through this website. Product information is general and is not a substitute for advice from a qualified healthcare professional.</div>';
  html+='<footer class="cm-footer"><a href="#top">'+esc(name)+'</a><span>'+esc(b.tagline||'Everyday care, close to home')+'</span><span>© '+new Date().getFullYear()+' · All rights reserved.</span></footer>';
  if(waOn)html+='<a class="cm-float" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hello CareMeds Pharmacy. I have a pharmacy enquiry.')))+'" aria-label="WhatsApp CareMeds Pharmacy">WhatsApp</a>';
  return html+'</div>';
}

const toMin=t=>{const m=String(t||'').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);if(!m)return null;let hr=+m[1]%12;if(/pm/i.test(m[3]||''))hr+=12;if(!m[3]&&+m[1]===12)hr=12;return hr*60+(+(m[2]||0));};
export function init(root,d={},selected=[]){
  scMobileNav(root);scBindForms(root);if(!root)return;
  const tabs=[...root.querySelectorAll('[data-product-filter]')],cards=[...root.querySelectorAll('[data-product-card]')],panel=root.querySelector('[data-prescription-panel]');
  const setCategory=cat=>{
    tabs.forEach(t=>{const on=t.dataset.productFilter===cat;t.classList.toggle('is-active',on);t.setAttribute('aria-pressed',String(on));});
    if(panel)panel.hidden=cat!=='Medicines';
    cards.forEach(card=>{card.hidden=cat==='Medicines'||(cat!=='all'&&card.dataset.category!==cat);});
  };
  tabs.forEach(btn=>btn.addEventListener('click',()=>setCategory(btn.dataset.productFilter)));
  root.querySelectorAll('[data-category-pick]').forEach(btn=>btn.addEventListener('click',()=>{document.querySelector('#products')?.scrollIntoView({behavior:'smooth'});setCategory(btn.dataset.categoryPick);}));
  const day=new Date().toLocaleDateString('en-US',{weekday:'long'}).toLowerCase(),now=new Date(),mins=now.getHours()*60+now.getMinutes();let openNow=null;
  root.querySelectorAll('.cm-hours-row').forEach(row=>{if(String(row.dataset.day).trim().toLowerCase()!==day)return;row.classList.add('is-today');if(row.dataset.closed==='true'){openNow=false;return;}const start=toMin(row.dataset.open),end=toMin(row.dataset.close);if(start===null||end===null)return;openNow=end>start?(mins>=start&&mins<end):(mins>=start||mins<end);});
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
const SC_FORM={"section":"cm-section cm-request","kicker":"cm-kicker","btn":"cm-btn cm-btn-primary","kickerText":"Quick pharmacy request","title":"Send a prescription or ask about a product","text":"Prescription medicines are not sold online. For a prescription request, WhatsApp opens with your details—attach a clear photo or PDF of a valid prescription in that chat. A pharmacist will review it before confirming availability and dispensing.","submit":"Continue to WhatsApp","intro":"Hello CareMeds Pharmacy. I have a pharmacy request. Prescription medicines are not being purchased online; I will attach a valid prescription in this WhatsApp chat for pharmacist review.","fields":[["name","Your name","text",true],["phone","Mobile number","tel",true],["requestType","Request type","select:requestTypes:name",true],["deliveryArea","Delivery area / locality","text",true],["products","Health products you are asking about","text",false],["message","Additional details (optional)","textarea",false]]};
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
  const connectData={...d,contact:{...c,hours:connectSelected.includes('hours')&&s.showHours!==false?c.hours:'',email:connectSelected.includes('contact')&&s.showContact!==false?c.email:''}};
  return scConnect(scWithForm(scBaseRender(d,selected),d,chosen),connectData,connectSelected);
}
