const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=v=>{const x=String(v??'').trim();return /^(https?:|tel:|mailto:|data:image\/)/i.test(x)||/^[\w./-]+$/.test(x)?x:''};
const digits=v=>String(v??'').replace(/\D/g,'');
const tel=v=>String(v??'').replace(/[^\d+]/g,'');
const wa=(n,msg)=>{const p=digits(n);return p?'https://wa.me/'+p+(msg?'?text='+encodeURIComponent(msg):''):''};
const initials=n=>String(n||'').split(/\s+/).filter(w=>/^[A-Za-z]/.test(w)).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'S';
const slug=v=>String(v||'other').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'other';

function scBaseRender(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{};
  const ok=x=>selected.includes(x);
  const products=(d.products||[]).filter(x=>x.enabled!==false);
  const gallery=(d.gallery||[]).filter(x=>x.enabled!==false&&url(x.image));
  const reviews=(d.reviews||[]).filter(x=>x.enabled!==false);
  const name=b.businessName||'Your Store';
  const waOn=ok('whatsapp')&&digits(c.whatsapp);
  const order=msg=>waOn?wa(c.whatsapp,msg):'';
  const showAbout=ok('about')&&s.showAbout!==false;
  const showProducts=ok('products')&&products.length;
  const showGallery=ok('gallery')&&s.showGallery!==false&&gallery.length;
  const showReviews=ok('reviews')&&s.showReviews!==false&&reviews.length;
  const showContact=ok('contact')&&s.showContact!==false;
  const faqs=(d.faqs||[]).filter(x=>x.enabled!==false);const showFaq=ok('faq')&&faqs.length;
  const cats=[...new Set(products.map(x=>x.category).filter(Boolean))];
  const nav=[showProducts&&['#products','Shop'],showAbout&&['#about','About'],showGallery&&['#gallery','Gallery'],showReviews&&['#reviews','Reviews'],showFaq&&['#faq','FAQ'],showContact&&['#contact','Contact']].filter(Boolean);
  let html='<div class="site-preview shop1">';

  html+='<header class="sh-nav"><a class="sh-brand" href="#top"><span class="sh-mark" aria-hidden="true">'+esc(initials(name))+'</span><span><strong>'+esc(name)+'</strong>'+(b.motto?'<small>'+esc(b.motto)+'</small>':'')+'</span></a>'+
    '<nav aria-label="Main">'+nav.map(([href,label])=>'<a href="'+href+'">'+label+'</a>').join('')+'</nav>'+
    '<div class="sh-nav-actions">'+(waOn?'<a class="sh-btn wa small" target="_blank" rel="noopener" href="'+esc(order('Hi, I would like to place an order.'))+'">Order on WhatsApp</a>':'')+
    '<a class="template-admin-link" href="admin.html?template=ecommerce-01">Admin</a></div></header>';

  if(ok('home')){
    html+='<section class="sh-hero" id="top"><div class="sh-hero-copy"><span class="sh-eyebrow">'+esc(b.ownerName||'Online store')+'</span><h1>'+esc(h.title||'A storefront made for your products.')+'</h1>'+(h.text?'<p>'+esc(h.text)+'</p>':'')+
      '<div class="sh-actions">'+(showProducts?'<a class="sh-btn dark" href="#products">Shop the collection</a>':'')+(waOn?'<a class="sh-btn line" target="_blank" rel="noopener" href="'+esc(order('Hi, I have a question about your products.'))+'">Ask on WhatsApp</a>':'')+'</div>'+
      (products.length?'<ul class="sh-hero-facts"><li><b>'+products.length+'</b> products</li>'+(cats.length?'<li><b>'+cats.length+'</b> categories</li>':'')+(c.location?'<li><b>📍</b> '+esc(String(c.location).split(',')[0])+'</li>':'')+'</ul>':'')+'</div>'+
      '<div class="sh-hero-media">'+(url(d.hero)?'<img src="'+esc(url(d.hero))+'" alt="'+esc(name)+'">':'')+'</div></section>';
  }

  if(showProducts){
    html+='<section class="sh-section sh-products" id="products"><div class="sh-head"><div><span class="sh-kicker">Shop</span><h2>Featured products</h2></div>'+
      (cats.length>1?'<div class="sh-filters" role="group" aria-label="Filter by category"><button type="button" class="active" data-cat="all" aria-pressed="true">All</button>'+cats.map(x=>'<button type="button" data-cat="'+esc(slug(x))+'" aria-pressed="false">'+esc(x)+'</button>').join('')+'</div>':'')+'</div>'+
      '<div class="sh-grid">'+products.map(x=>'<article class="sh-product" data-cat="'+esc(slug(x.category))+'"><div class="sh-product-media">'+(url(x.image)?'<img src="'+esc(url(x.image))+'" alt="'+esc(x.name||'Product')+'" loading="lazy">':'')+(x.category?'<span>'+esc(x.category)+'</span>':'')+'</div>'+
        '<div class="sh-product-body"><h3>'+esc(x.name||'Product')+'</h3>'+(x.description?'<p>'+esc(x.description)+'</p>':'')+'<div class="sh-product-foot"><strong>'+esc(x.price||'Price on request')+'</strong>'+
        (waOn?'<a class="sh-btn wa small" target="_blank" rel="noopener" href="'+esc(order('Hi, I would like to order: '+(x.name||'this product')+(x.price?' ('+x.price+')':'')))+'">Order</a>':'')+'</div></div></article>').join('')+'</div></section>';
    if(waOn)html+='<section class="sh-section sh-steps" aria-label="How to order"><h2>How to order</h2><ol><li><b>1</b><span><strong>Pick a product</strong>Browse the collection and choose what you like.</span></li><li><b>2</b><span><strong>Tap “Order”</strong>WhatsApp opens with the product name filled in.</span></li><li><b>3</b><span><strong>We confirm</strong>We reply with price, availability, payment and delivery details.</span></li></ol></section>';
  }

  if(showAbout){
    html+='<section class="sh-section sh-about" id="about"><span class="sh-kicker">About</span><h2>'+esc(b.about||'A curated store with simple, trustworthy shopping.')+'</h2></section>';
  }

  if(showGallery){
    html+='<section class="sh-section sh-gallery" id="gallery"><div class="sh-head"><div><span class="sh-kicker">Gallery</span><h2>From the collection</h2></div></div><div class="sh-gallery-grid">'+
      gallery.map(x=>'<figure><img src="'+esc(url(x.image))+'" alt="'+esc(x.title||'Collection photo')+'" loading="lazy">'+(x.title?'<figcaption>'+esc(x.title)+'</figcaption>':'')+'</figure>').join('')+'</div></section>';
  }

  if(showReviews){
    html+='<section class="sh-section sh-reviews" id="reviews"><div class="sh-head"><div><span class="sh-kicker">Reviews</span><h2>What customers say</h2></div></div><div class="sh-review-grid">'+
      reviews.map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||0));return '<figure>'+(r?'<div class="sh-stars" aria-label="'+r+' out of 5">'+'★'.repeat(r)+'</div>':'')+'<blockquote>“'+esc(x.text||'')+'”</blockquote><figcaption>'+esc(x.name||'Customer')+'</figcaption></figure>'}).join('')+'</div></section>';
  }

  if(showFaq){
    html+='<section class="sh-section sh-faq" id="faq"><div class="sh-head"><div><span class="sh-kicker">FAQ</span><h2>Good to know</h2></div></div><div class="sh-faq-list">'+
      faqs.map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
  }

  if(showContact){
    html+='<section class="sh-contact" id="contact"><div><span class="sh-kicker">Contact</span><h2>Need help choosing?</h2><p>'+[c.location?esc(c.location):'',typeof c.hours==='string'&&c.hours?esc(c.hours):'',c.call?'<a href="tel:'+esc(tel(c.call))+'">'+esc(c.call)+'</a>':''].filter(Boolean).join(' · ')+'</p></div>'+
      '<div class="sh-actions">'+(waOn?'<a class="sh-btn wa" target="_blank" rel="noopener" href="'+esc(order('Hi, I need help choosing a product.'))+'">Chat on WhatsApp</a>':'')+(c.call?'<a class="sh-btn line light" href="tel:'+esc(tel(c.call))+'">Call</a>':'')+
      (ok('location')&&url(c.maps)?'<a class="sh-btn line light" target="_blank" rel="noopener" href="'+esc(url(c.maps))+'">Directions</a>':'')+'</div></section>';
  }

  html+='<footer class="sh-footer"><strong>'+esc(name)+'</strong><span>© '+new Date().getFullYear()+(b.motto?' · '+esc(b.motto):'')+'</span></footer>';
  if(waOn)html+='<a class="sh-float" target="_blank" rel="noopener" href="'+esc(order('Hi, I would like to place an order.'))+'" aria-label="Order on WhatsApp">WhatsApp</a>';
  return html+'</div>';
}

function scPreUpiInit(root){
  scMobileNav(arguments[0]);
  if(!root)return;
  const btns=[...root.querySelectorAll('.sh-filters button')];
  btns.forEach(btn=>btn.addEventListener('click',()=>{
    const cat=btn.dataset.cat;
    btns.forEach(x=>{const on=x===btn;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});
    root.querySelectorAll('.sh-product').forEach(p=>{p.hidden=!(cat==='all'||p.dataset.cat===cat);});
  }));
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
function scPreUpiRender(d={},selected=[]){return scConnect(scBaseRender(d,selected),d,selected);}

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
export function render(d={},selected=[]){const h=scSeoBaseRender(d,selected);try{if(typeof window!=="undefined"&&window.SiteCraftPack&&window.SiteCraftPack.seo)window.SiteCraftPack.seo(d,"E-commerce")}catch(e){}return h}
