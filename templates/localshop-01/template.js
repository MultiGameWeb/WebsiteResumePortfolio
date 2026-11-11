const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=v=>{const x=String(v??'').trim();return /^(https?:\/\/|tel:|mailto:)/i.test(x)?x:''};
const imageUrl=v=>{const x=String(v??'').trim();return /^https:\/\/images\.unsplash\.com\//i.test(x)?x:''};
const digits=v=>String(v??'').replace(/\D/g,'');
const tel=v=>String(v??'').replace(/[^\d+]/g,'');
const wa=(n,msg)=>{const p=digits(n);return p?'https://wa.me/'+p+(msg?'?text='+encodeURIComponent(msg):''):'';};
const slug=v=>String(v||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'other';
const rows=(d,key)=>(Array.isArray(d[key])?d[key]:[]).filter(x=>x&&x.enabled!==false);

function scBaseRender(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},ok=x=>selected.includes(x);
  const menu=rows(d,'menu'),combos=rows(d,'combos'),highlights=rows(d,'highlights'),gallery=rows(d,'gallery').filter(x=>imageUrl(x.image)),reviews=rows(d,'reviews'),faqs=rows(d,'faqs'),hours=rows(d,'hours');
  const name=b.businessName||'Sri Lakshmi General Store',mark=(String(name).match(/[A-Za-z0-9]+/g)||['s','l']).slice(0,2).map(w=>w[0].toLowerCase()).join('')+'.',phone=tel(c.phone),waOn=ok('whatsapp')&&!!digits(c.whatsapp);
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
  const nav=[['about','About'],['menu','Products'],['combos','Offers'],['work','Why us'],['gallery','Gallery'],['reviews','Reviews'],['faq','FAQ'],['hours','Hours'],['location','Visit']].filter(([k])=>show[k]);
  let html='<div class="localshop-01">';
  html+='<header class="ls-nav"><a class="ls-brand" href="#top" aria-label="'+esc(name)+' home"><span class="ls-brand-mark" aria-hidden="true">'+esc(mark)+'</span><span><strong>'+esc(name)+'</strong><small>'+esc(b.tagline||'Groceries · Household · Daily needs')+'</small></span></a><nav aria-label="Main navigation">'+nav.map(([k,label])=>'<a href="#'+k+'">'+label+'</a>').join('')+'</nav><div class="ls-nav-action">'+(show.reservation?'<a class="ls-btn ls-btn-dark ls-nav-cta" href="#enquire">Order on WhatsApp</a>':'')+'</div></header>';

  if(ok('home')&&s.showHome!==false&&(h.title||h.text||imageUrl(d.hero))){
    const hero=imageUrl(d.hero);
    html+='<section class="ls-hero" id="top">'+(hero?'<img class="ls-hero-photo" src="'+esc(hero)+'" alt="Well-stocked shop aisle with shelves of everyday products">':'')+'<div class="ls-hero-overlay"></div><div class="ls-hero-copy"><span class="ls-eyebrow">'+esc(h.eyebrow||'YOUR NEIGHBOURHOOD STORE')+'</span><h1>'+esc(h.title||'Everything you need, close to home.')+'</h1>'+(h.text?'<p>'+esc(h.text)+'</p>':'')+'<div class="ls-hero-actions">'+(show.menu?'<a class="ls-btn ls-btn-cream" href="#menu">See products <span aria-hidden="true">↗</span></a>':'')+(show.reservation?'<a class="ls-btn ls-btn-outline-light" href="#enquire">Send your list</a>':'')+'</div><div class="ls-hero-foot"><span>Order on WhatsApp</span><i aria-hidden="true"></i><span>Home delivery</span><i aria-hidden="true"></i><span>Fair prices</span></div></div><div class="ls-hero-badge"><span>ORDER</span><strong>ON WHATSAPP</strong><span>WE DELIVER</span></div></section>';
  }

  if(show.about){
    html+='<section class="ls-section ls-about" id="about"><div class="ls-about-label"><span class="ls-kicker">About our store</span><span class="ls-about-asterisk" aria-hidden="true">✳</span></div><div class="ls-about-copy"><h2>'+esc(b.motto||'Your trusted shop for daily needs.')+'</h2><p>'+esc(b.about)+'</p>'+(b.ownerName?'<p class="ls-sign">— '+esc(b.ownerName)+'</p>':'')+'</div></section>';
  }

  if(show.menu){
    const cats=[...new Set(menu.map(x=>String(x.category||'').trim()).filter(Boolean))];
    html+='<section class="ls-section ls-menu" id="menu"><div class="ls-section-head"><div><span class="ls-kicker">In stock today</span><h2>Popular products</h2><p>A few of the items customers buy most. Ask us for anything you don’t see here.</p></div><span class="ls-head-note">ASK FOR<br>ANY ITEM</span></div><div class="ls-tabs" role="group" aria-label="Filter products by category"><button type="button" class="is-active" data-menu-filter="all" aria-pressed="true">All</button>'+cats.map(x=>'<button type="button" data-menu-filter="'+esc(slug(x))+'" aria-pressed="false">'+esc(x)+'</button>').join('')+'</div><div class="ls-menu-grid">'+menu.map(x=>{
      const image=imageUrl(x.image),category=slug(x.category);
      return '<article class="ls-menu-card" data-menu-card data-category="'+esc(category)+'">'+(image?'<div class="ls-menu-image"><img src="'+esc(image)+'" alt="'+esc(x.imageAlt||x.name||'Shop product')+'" loading="lazy"></div>':'')+'<div class="ls-menu-content"><div class="ls-menu-meta"><span>'+esc(x.category||'Product')+'</span>'+(x.tag?'<b>'+esc(x.tag)+'</b>':'')+'</div><h3>'+esc(x.name||'House favourite')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'<div class="ls-menu-price"><strong>'+esc(x.price||'Ask for price')+'</strong>'+(waOn?'<a target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hi '+name+', I would like to order '+(x.name||'this item')+'. Please confirm price and availability.')))+'">Order ↗</a>':'')+'</div></div></article>';
    }).join('')+'</div></section>';
  }

  if(show.combos){
    html+='<section class="ls-section ls-combos" id="combos"><div class="ls-section-head"><div><span class="ls-kicker">Save more</span><h2>Offers & combos</h2><p>Value packs and seasonal deals. Prices may change with stock.</p></div></div><div class="ls-combo-grid">'+combos.map((x,i)=>'<article class="ls-combo-card"><span class="ls-combo-number">0'+(i+1)+'</span><div><h3>'+esc(x.name||'Offer')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'<strong>'+esc(x.price||'Ask for price')+'</strong></div>'+(waOn?'<a target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hi '+name+', please tell me more about the '+(x.name||'offer')+'.')))+'" aria-label="Ask about '+esc(x.name||'offer')+'">Ask about this offer ↗</a>':'')+'</article>').join('')+'</div></section>';
  }

  if(show.work){
    html+='<section class="ls-section ls-work" id="work"><div class="ls-work-intro"><span class="ls-kicker">Why shop with us</span><h2>Easy ordering, honest prices.</h2><p>Send your list on WhatsApp, pay the way you like and get it delivered or ready for pickup.</p></div><div class="ls-highlight-grid">'+highlights.map((x,i)=>'<article><span class="ls-highlight-icon" aria-hidden="true">'+esc(x.icon||['⌂','✓','◷','₹'][i%4])+'</span><h3>'+esc(x.title||'Made for you')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'</article>').join('')+'</div></section>';
  }

  if(show.gallery){
    html+='<section class="ls-section ls-gallery" id="gallery"><div class="ls-section-head"><div><span class="ls-kicker">Inside the store</span><h2>Take a look around</h2></div><span class="ls-gallery-flower" aria-hidden="true">✿</span></div><div class="ls-gallery-grid">'+gallery.map((x,i)=>'<figure class="ls-gallery-item ls-gallery-'+(i%4+1)+'"><img src="'+esc(imageUrl(x.image))+'" alt="'+esc(x.alt||x.title||name)+'" loading="lazy">'+(x.title?'<figcaption>'+esc(x.title)+'</figcaption>':'')+'</figure>').join('')+'</div></section>';
  }

  if(show.reviews){
    html+='<section class="ls-section ls-reviews" id="reviews"><div class="ls-section-head"><div><span class="ls-kicker">Customer words</span><h2>Trusted by our neighbours.</h2></div></div><div class="ls-review-grid">'+reviews.map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||5));return '<figure><div class="ls-stars" aria-label="'+r+' out of 5 stars">'+('★'.repeat(r))+'</div><blockquote>“'+esc(x.text||'')+'”</blockquote><figcaption>'+esc(x.name||'Customer')+'</figcaption></figure>';}).join('')+'</div></section>';
  }

  if(show.faq){
    html+='<section class="ls-section ls-faq" id="faq"><div class="ls-section-head"><div><span class="ls-kicker">Good to know</span><h2>Good to know</h2></div></div><div class="ls-faq-list">'+faqs.map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
  }

  if(show.hours){
    html+='<section class="ls-section ls-hours" id="hours"><div class="ls-hours-card"><div class="ls-hours-intro"><span class="ls-kicker">Store timings</span><h2>Open every day.</h2><span class="ls-open-badge" data-open-status hidden></span><p>'+(c.address?esc(c.address):'Hyderabad, Telangana')+'</p></div><div class="ls-hours-list">'+hours.map(x=>'<div class="ls-hours-row" data-day="'+esc(x.day||'')+'" data-open="'+esc(x.open||'')+'" data-close="'+esc(x.close||'')+'" data-closed="'+(x.closed?'true':'false')+'"><strong>'+esc(x.day||'Day')+'</strong><span>'+(x.closed?'Closed':esc(x.open||'')+(x.close?' – '+esc(x.close):''))+'</span></div>').join('')+'</div></div></section>';
  }

  if(show.reservation){
    html+='<section class="ls-section ls-reservation-anchor" id="reserve"><div class="ls-reserve-prompt"><span class="ls-kicker">Quick order</span><h2>Send us your shopping list.</h2><p>Type your list or send a photo of it on WhatsApp. We’ll confirm prices and pack your order.</p><a class="ls-btn ls-btn-dark" href="#enquire">Send your list ↗</a></div></section>';
  }

  if(show.location){
    html+='<section class="ls-section ls-location" id="location"><div><span class="ls-kicker">Visit the store</span><h2>Walk in, or we’ll deliver.</h2>'+(c.address?'<p>'+esc(c.address)+'</p>':'')+'</div>'+(url(c.maps)?'<a class="ls-btn ls-btn-dark" target="_blank" rel="noopener" href="'+esc(url(c.maps))+'">Get directions ↗</a>':'')+'</section>';
  }

  if(show.contact||show.social){
    html+='<section class="ls-contact" id="contact">';
    if(show.contact){
      html+='<div class="ls-contact-main"><span class="ls-kicker">See you soon</span><h2>'+esc(name)+'</h2><p>'+esc(c.address||'Hyderabad, Telangana')+'</p><div class="ls-contact-actions">'+(phone?'<a class="ls-btn ls-btn-cream" href="'+esc(url('tel:'+phone))+'">Call '+esc(c.phone)+'</a>':'')+(waOn?'<a class="ls-btn ls-btn-whatsapp" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hello '+name+'! I have an enquiry.')))+'">WhatsApp us</a>':'')+'</div></div>';
    }else{
      html+='<div class="ls-contact-main"><span class="ls-kicker">Stay connected</span><h2>Follow us for offers.</h2></div>';
    }
    if(show.contact&&c.email)html+='<div class="ls-contact-side"><a href="'+esc(url('mailto:'+c.email))+'">'+esc(c.email)+'</a></div>';
    if(show.social)html+='<div class="ls-contact-side"><div class="ls-social">'+(url(c.instagram)?'<a target="_blank" rel="noopener" href="'+esc(url(c.instagram))+'">Instagram ↗</a>':'')+(url(c.facebook)?'<a target="_blank" rel="noopener" href="'+esc(url(c.facebook))+'">Facebook ↗</a>':'')+(url(c.youtube)?'<a target="_blank" rel="noopener" href="'+esc(url(c.youtube))+'">YouTube ↗</a>':'')+'</div></div>';
    html+='</section>';
  }

  html+='<footer class="ls-footer"><a href="#top">'+esc(name)+'</a><span>'+esc(b.tagline||'Groceries · Household · Daily needs')+'</span><span>© '+new Date().getFullYear()+' · All rights reserved.</span></footer>';
  if(waOn)html+='<a class="ls-float" target="_blank" rel="noopener" href="'+esc(url(wa(c.whatsapp,'Hello '+name+'!')))+'" aria-label="Chat with '+esc(name)+' on WhatsApp">WhatsApp</a>';
  return html+'</div>';
}

const toMin=t=>{const m=String(t||'').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);if(!m)return null;let hr=+m[1]%12;if(/pm/i.test(m[3]||''))hr+=12;if(!m[3]&&+m[1]===12)hr=12;return hr*60+(+(m[2]||0));};
export function init(root,d={},selected=[]){
  scMobileNav(root);scBindForms(root);if(!root)return;
  const tabs=[...root.querySelectorAll('[data-menu-filter]')],cards=[...root.querySelectorAll('[data-menu-card]')];
  tabs.forEach(btn=>btn.addEventListener('click',()=>{const cat=btn.dataset.menuFilter;tabs.forEach(t=>{const on=t===btn;t.classList.toggle('is-active',on);t.setAttribute('aria-pressed',String(on));});cards.forEach(card=>{card.hidden=!(cat==='all'||card.dataset.category===cat);});}));
  const day=new Date().toLocaleDateString('en-US',{weekday:'long'}).toLowerCase(),now=new Date(),mins=now.getHours()*60+now.getMinutes();let openNow=null;
  root.querySelectorAll('.ls-hours-row').forEach(row=>{if(String(row.dataset.day).trim().toLowerCase()!==day)return;row.classList.add('is-today');if(row.dataset.closed==='true'){openNow=false;return;}const start=toMin(row.dataset.open),end=toMin(row.dataset.close);if(start===null||end===null)return;openNow=end>start?(mins>=start&&mins<end):(mins>=start||mins<end);});
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
const SC_FORM={"section": "ls-section ls-booking", "kicker": "ls-kicker", "btn": "ls-btn ls-btn-dark", "kickerText": "Order on WhatsApp", "title": "Send your shopping list", "text": "Write your items below. We’ll reply on WhatsApp with the total and delivery time.", "submit": "Send list on WhatsApp", "intro": "Hello, I would like to place an order.", "fields": [["name", "Your name", "text", true], ["phone", "Phone number", "tel", true], ["delivery", "Delivery or pickup", "select:meetupTypes:name", true], ["area", "Your area", "select:deliveryAreas:name", false], ["list", "Your shopping list", "textarea", true], ["message", "Delivery address or notes (optional)", "textarea", false]]};
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
export function render(d={},selected=[]){
  const s=d.settings||{},c=d.contact||{};
  const chosen=(selected||[]).filter(x=>x!=='enquiry'||s.showEnquiry!==false);
  const connectSelected=(selected||[]).filter(x=>x!=='social'||s.showSocial!==false);
  const connectData={...d,contact:{...c,hours:connectSelected.includes('hours')&&s.showHours!==false?c.hours:'',email:connectSelected.includes('contact')&&s.showContact!==false?c.email:''}};
  return scConnect(scWithForm(scBaseRender(d,selected),d,chosen),connectData,connectSelected);
}