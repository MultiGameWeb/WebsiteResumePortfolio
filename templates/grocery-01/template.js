const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{const x=String(v??'').trim();return /^(https?:\/\/|data:image\/|\/|\.\/|\.\.\/)/i.test(x)?x:''};
const digits=v=>String(v??'').replace(/\D/g,'');
const num=v=>{const n=Number(String(v??'').replace(/[^\d.-]/g,''));return Number.isFinite(n)?n:0};
const money=(v,c='INR')=>{try{return new Intl.NumberFormat('en-IN',{style:'currency',currency:c,maximumFractionDigits:0}).format(num(v))}catch{return '₹'+num(v).toLocaleString('en-IN')}};
const slug=v=>String(v??'').toLowerCase().trim();
function scBaseRender(d={},selected=[]){
 const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},del=d.delivery||{},legal=d.legal||{},ok=x=>selected.includes(x);
 const products=(d.products||[]).filter(p=>p.enabled!==false),offers=(d.offers||[]).filter(o=>o.enabled!==false),gallery=(d.gallery||[]).filter(g=>g.enabled!==false);
 const currency=s.currency||'INR',wa=digits(c.whatsapp);
 const categories=[...new Set(products.map(p=>String(p.category||'Other').trim()).filter(Boolean))];
 const card=p=>{
  const id=esc(p.id||p.sku||p.name),price=num(p.salePrice||p.basePrice),base=num(p.basePrice),stock=num(p.stockQty),available=p.inStock!==false&&stock>0;
  return '<article class="fm-product" data-fm-product data-id="'+id+'" data-category="'+esc(slug(p.category||'Other'))+'" data-search="'+esc([p.name,p.category,p.description,p.badge].join(' ').toLowerCase())+'"><div class="fm-product-photo">'+(p.badge?'<span class="fm-badge">'+esc(p.badge)+'</span>':'')+'<img src="'+esc(safeUrl(p.image))+'" alt="'+esc(p.name||'Grocery item')+'" loading="lazy">'+(p.featured?'<span class="fm-featured">POPULAR</span>':'')+'</div><div class="fm-product-info"><small>'+esc(p.category||'GROCERY')+'</small><h3>'+esc(p.name||'Grocery item')+'</h3><p>'+esc(p.description||'')+'</p><div class="fm-price"><strong>'+money(price,currency)+'</strong><span>/ '+esc(p.unit||'piece')+'</span>'+(base>price?'<del>'+money(base,currency)+'</del>':'')+'</div><div class="fm-product-bottom"><span class="'+(available?'fm-stock':'fm-stock out')+'">'+(available?'In stock':'Out of stock')+'</span>'+(ok('cart')?'<button type="button" class="fm-add" data-fm-action="add" data-id="'+id+'" '+(!available?'disabled':'')+'>＋ Add</button>':'')+'</div></div></article>';
 };
 let out='<div class="fm-store" data-fm-store>';
 if(offers.length)out+='<div class="fm-announcement"><span>✦</span> '+esc(offers[0].title)+' <span class="fm-announcement-detail">'+esc(offers[0].description||'')+'</span></div>';
 out+='<div class="fm-topline"><div>Fresh quality. Fair prices. Every day.</div><div>'+(del.enabled!==false?'Home delivery available':'Visit our store')+' · '+esc(c.hours||'')+'</div></div>';
 out+='<header class="fm-header"><a class="fm-brand" href="#fm-home"><span class="fm-brand-icon">✳</span><span><strong>'+esc(b.businessName||'FreshMart')+'</strong><small>GROCERIES & MORE</small></span></a><nav class="fm-nav">'+(ok('home')?'<a href="#fm-home">Home</a>':'')+(ok('products')?'<a href="#fm-products">Shop</a>':'')+(ok('offers')&&offers.length?'<a href="#fm-offers">Offers</a>':'')+(ok('about')?'<a href="#fm-about">About</a>':'')+(ok('location')?'<a href="#fm-location">Store</a>':'')+'</nav><div class="fm-head-actions">'+(ok('cart')?'<button type="button" class="fm-cart-button" data-fm-action="cart-open">Basket <span data-fm-count>0</span></button>':'')+'</div></header>';
 if(ok('home'))out+='<section class="fm-hero" id="fm-home"><div class="fm-hero-copy"><span class="fm-eyebrow">YOUR NEIGHBOURHOOD MARKET</span><h1>'+esc(h.title||'Fresh groceries for every day.')+'</h1><p>'+esc(h.text||'Everyday essentials, handpicked for your home.')+'</p><div class="fm-hero-actions"><a class="fm-primary" href="#fm-products">Shop groceries <span>→</span></a><span class="fm-delivery-note">✦ '+esc(del.estimatedTime||'Freshness delivered')+'</span></div><div class="fm-hero-proof"><span>✓ Quality checked</span><span>✓ Great everyday value</span><span>✓ Easy WhatsApp orders</span></div></div><div class="fm-hero-image"><img src="'+esc(safeUrl(d.hero))+'" alt="Fresh groceries and produce" loading="eager"><div class="fm-image-note"><b>Freshness first.</b><span>Good food, good mood.</span></div></div></section>';
 if(ok('delivery'))out+='<section class="fm-benefits"><article><span>✳</span><div><b>Fresh selections</b><small>Quality essentials for your home</small></div></article><article><span>⌂</span><div><b>'+(del.enabled!==false?'Home delivery':'Store pickup')+'</b><small>'+esc(del.estimatedTime||'Shop with ease')+'</small></div></article><article><span>₹</span><div><b>Great value</b><small>'+(num(del.freeAbove)>0?'Free delivery above '+money(del.freeAbove,currency):'Fair prices, every day')+'</small></div></article></section>';
 if(ok('offers')&&offers.length)out+='<section class="fm-offers" id="fm-offers"><div class="fm-section-heading"><div><span class="fm-eyebrow">GOOD DEALS, GOOD DAYS</span><h2>Offers worth adding to your basket.</h2></div><span class="fm-section-side">This week at '+esc(b.businessName||'our store')+'</span></div><div class="fm-offer-grid">'+offers.map(o=>'<article class="fm-offer"><span class="fm-offer-star">✳</span><div><h3>'+esc(o.title||'Special offer')+'</h3><p>'+esc(o.description||'')+'</p>'+(o.code?'<small>ASK FOR CODE: '+esc(o.code)+'</small>':'')+'</div></article>').join('')+'</div></section>';
 if(ok('products'))out+='<section class="fm-shop" id="fm-products"><div class="fm-section-heading"><div><span class="fm-eyebrow">THE EVERYDAY MARKET</span><h2>Shop your essentials.</h2><p>Fresh picks and pantry staples, all in one place.</p></div>'+(ok('search')?'<label class="fm-search"><span>⌕</span><input type="search" data-fm-search placeholder="Search fruits, milk, rice…" aria-label="Search products"></label>':'')+'</div>'+(ok('categories')?'<div class="fm-categories"><button type="button" class="active" data-fm-filter="all">All products</button>'+categories.map(x=>'<button type="button" data-fm-filter="'+esc(slug(x))+'">'+esc(x)+'</button>').join('')+'</div>':'')+'<div class="fm-products" data-fm-products>'+products.map(card).join('')+'</div><p class="fm-empty" data-fm-empty hidden>No products match your search. Try another item or category.</p></section>';
 if(ok('about')&&s.showAbout!==false)out+='<section class="fm-about" id="fm-about"><div><span class="fm-eyebrow">A LITTLE ABOUT US</span><h2>Good groceries make a good home.</h2></div><p>'+esc(b.about||'Your neighbourhood store for everyday essentials and fresh favourites.')+'</p></section>';
 if(ok('gallery')&&s.showGallery!==false&&gallery.length)out+='<section class="fm-gallery"><div class="fm-section-heading"><div><span class="fm-eyebrow">A LOOK INSIDE</span><h2>Fresh from our store.</h2></div></div><div class="fm-gallery-grid">'+gallery.map(g=>'<figure><img src="'+esc(safeUrl(g.image))+'" alt="'+esc(g.title||'Store image')+'" loading="lazy"><figcaption>'+esc(g.title||'')+'</figcaption></figure>').join('')+'</div></section>';
 if(ok('reviews')&&(d.reviews||[]).some(x=>x.enabled!==false))out+='<section class="fm-reviews sc-extra-section" id="fm-reviews"><span class="fm-eyebrow">CUSTOMER LOVE</span><h2>What our customers say</h2><div class="sc-review-grid">'+(d.reviews||[]).filter(x=>x.enabled!==false).map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||0));return '<figure>'+(r?'<div class="sc-stars" aria-label="'+r+' out of 5">'+'★'.repeat(r)+'</div>':'')+'<blockquote>“'+esc(x.text||'')+'”</blockquote><figcaption>'+esc(x.name||'Customer')+'</figcaption></figure>'}).join('')+'</div></section>';
 if(ok('faq')&&(d.faqs||[]).some(x=>x.enabled!==false))out+='<section class="fm-faq sc-extra-section" id="fm-faq"><span class="fm-eyebrow">GOOD TO KNOW</span><h2>Frequently asked questions</h2><div class="sc-faq-list">'+(d.faqs||[]).filter(x=>x.enabled!==false).map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
 if(ok('location')&&s.showLocation!==false)out+='<section class="fm-location" id="fm-location"><div><span class="fm-eyebrow">COME SAY HELLO</span><h2>'+esc(b.businessName||'Our Store')+'</h2>'+(c.location?'<p>'+esc(c.location)+'</p>':'')+'<p><b>Opening hours</b><br>'+esc(c.hours||'Please contact us for today’s hours.')+'</p><p><b>Delivery area</b><br>'+esc(del.areas||'Contact us to confirm delivery availability.')+'</p><div class="fm-location-actions">'+(safeUrl(c.maps)?'<a class="fm-outline" href="'+esc(safeUrl(c.maps))+'" target="_blank" rel="noopener noreferrer">Get directions ↗</a>':'')+(c.call?'<a class="fm-outline" href="tel:'+esc(c.call.replace(/[^\d+]/g,''))+'">Call store</a>':'')+'</div></div><div class="fm-location-card"><span>✳</span><b>Neighbourhood shopping, made simple.</b><small>'+esc(c.call||c.email||'We are happy to help')+'</small></div></section>';
 if(ok('enquiry'))out+='<section class="fm-enquiry"><div><span class="fm-eyebrow">NEED A HAND?</span><h2>We’re happy to help.</h2><p>Ask about product availability, bulk orders or delivery in your area.</p></div><form data-fm-enquiry><label>Your name<input name="name" autocomplete="name" required placeholder="Full name"></label><label>Phone number<input name="phone" autocomplete="tel" type="tel" required placeholder="Mobile number"></label><label>Your message<textarea name="message" rows="3" required placeholder="How can we help?"></textarea></label><button class="fm-primary" type="submit">Send enquiry on WhatsApp →</button><p class="fm-form-note" data-fm-note></p></form></section>';
 if(ok('privacyPolicy')&&s.showPrivacyPolicy!==false&&legal.privacyPolicy)out+='<section class="fm-privacy"><b>Privacy policy</b><p>'+esc(legal.privacyPolicy)+'</p></section>';
 out+='<footer class="fm-footer"><div><a class="fm-brand" href="#fm-home"><span class="fm-brand-icon">✳</span><span><strong>'+esc(b.businessName||'FreshMart')+'</strong><small>GROCERIES & MORE</small></span></a><p>Fresh choices for everyday living.</p></div><div><b>Contact</b><span>'+esc(c.call||'')+'</span><span>'+esc(c.email||'')+'</span><span>'+esc(c.location||'')+'</span></div><div><b>Store hours</b><span>'+esc(c.hours||'')+'</span><span>'+(del.enabled!==false?'Home delivery available':'Visit us in store')+'</span></div><small class="fm-copyright">© '+new Date().getFullYear()+' '+esc(b.businessName||'FreshMart')+'. All rights reserved.</small></footer>';
 if(ok('cart'))out+='<div class="fm-cart-backdrop" data-fm-action="cart-close"></div><aside class="fm-cart" data-fm-cart aria-label="Shopping basket"><div class="fm-cart-head"><div><span class="fm-eyebrow">YOUR BASKET</span><h2>Shopping basket</h2></div><button type="button" data-fm-action="cart-close" aria-label="Close basket">×</button></div><div class="fm-cart-items" data-fm-items></div><div class="fm-cart-summary"><div><span>Subtotal</span><b data-fm-subtotal>'+money(0,currency)+'</b></div><div><span>Delivery</span><b data-fm-delivery>'+money(0,currency)+'</b></div><div class="fm-cart-total"><span>Total</span><b data-fm-total>'+money(0,currency)+'</b></div><small data-fm-minimum></small></div><form class="fm-checkout-form" data-fm-checkout><span class="fm-eyebrow">DELIVERY DETAILS</span><label>Your name<input name="name" autocomplete="name" required placeholder="Full name"></label><label>Mobile number<input name="phone" type="tel" autocomplete="tel" required placeholder="10-digit mobile number"></label><label>Delivery address<textarea name="address" rows="2" required placeholder="House number, street, area"></textarea></label><label>Preferred delivery time<select name="slot"><option>As soon as possible</option><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label><label>Order notes (optional)<textarea name="notes" rows="2" placeholder="Any preferences or instructions"></textarea></label><button class="fm-primary fm-checkout-button" type="submit">Continue on WhatsApp →</button><small class="fm-checkout-note">Your order request will open in WhatsApp. Please press Send there to submit it.</small></form></aside>';
 if(ok('whatsapp')&&String((d.contact||{}).whatsapp||'').replace(/\D/g,''))out+='<a class="sc-wa-float" href="https://wa.me/'+String(d.contact.whatsapp).replace(/\D/g,'')+'?text='+encodeURIComponent('Hi, I would like to order groceries.')+'" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">WhatsApp</a>';
 return out+'</div>';
}
function scPreUpiInit(root,d={},selected=[]){scMobileNav(arguments[0]);
 const store=root.querySelector('[data-fm-store]');if(!store)return;
 const products=(d.products||[]).filter(p=>p.enabled!==false),currency=d.settings?.currency||'INR',wa=digits(d.contact?.whatsapp),delivery=d.delivery||{},cartKey='sitecraft:grocery-01:cart';
 const productById=id=>products.find((p,i)=>String(p.id||p.sku||p.name)===String(id));
 const unitPrice=p=>num(p.salePrice||p.basePrice);
 const available=p=>p&&p.inStock!==false&&num(p.stockQty)>0;
 let cart=[];try{const saved=JSON.parse(localStorage.getItem(cartKey)||'[]');if(Array.isArray(saved))cart=saved}catch{}
 const save=()=>{try{localStorage.setItem(cartKey,JSON.stringify(cart))}catch{}};
 const subtotal=()=>cart.reduce((n,x)=>n+unitPrice(productById(x.id))*x.qty,0);
 const deliveryFee=()=>delivery.enabled===false||subtotal()===0|| (num(delivery.freeAbove)>0&&subtotal()>=num(delivery.freeAbove))?0:num(delivery.fee);
 const fmt=v=>money(v,currency);
 const panel=store.querySelector('[data-fm-cart]'),backdrop=store.querySelector('.fm-cart-backdrop'),items=store.querySelector('[data-fm-items]');
 const close=()=>{panel?.classList.remove('open');backdrop?.classList.remove('open');document.body.classList.remove('fm-cart-open')};
 const open=()=>{renderCart();panel?.classList.add('open');backdrop?.classList.add('open');document.body.classList.add('fm-cart-open')};
 function renderCart(){
  cart=cart.filter(x=>available(productById(x.id))&&Number(x.qty)>0);
  cart.forEach(x=>{const p=productById(x.id);x.qty=Math.min(x.qty,Math.max(0,num(p.stockQty)))});
  cart=cart.filter(x=>x.qty>0);save();
  const count=cart.reduce((n,x)=>n+x.qty,0),sub=subtotal(),fee=deliveryFee(),total=sub+fee;
  store.querySelectorAll('[data-fm-count]').forEach(e=>e.textContent=count);
  const subEl=store.querySelector('[data-fm-subtotal]'),feeEl=store.querySelector('[data-fm-delivery]'),totalEl=store.querySelector('[data-fm-total]');
  if(subEl)subEl.textContent=fmt(sub);if(feeEl)feeEl.textContent=fee?fmt(fee):(sub?'FREE':fmt(0));if(totalEl)totalEl.textContent=fmt(total);
  const min=store.querySelector('[data-fm-minimum]');if(min)min.textContent=num(delivery.minimumOrder)>sub?'Minimum order is '+fmt(delivery.minimumOrder)+'. Add '+fmt(num(delivery.minimumOrder)-sub)+' more.':'';
  if(items)items.innerHTML=cart.length?cart.map(x=>{const p=productById(x.id);return '<article class="fm-cart-item"><img src="'+esc(safeUrl(p.image))+'" alt=""><div class="fm-cart-item-info"><b>'+esc(p.name)+'</b><small>'+fmt(unitPrice(p))+' / '+esc(p.unit||'piece')+'</small><div class="fm-qty"><button type="button" data-fm-action="qty" data-id="'+esc(x.id)+'" data-delta="-1" aria-label="Decrease quantity">−</button><b>'+x.qty+'</b><button type="button" data-fm-action="qty" data-id="'+esc(x.id)+'" data-delta="1" aria-label="Increase quantity" '+(x.qty>=num(p.stockQty)?'disabled':'')+'>＋</button><button type="button" class="fm-remove" data-fm-action="remove" data-id="'+esc(x.id)+'">Remove</button></div></div><strong>'+fmt(unitPrice(p)*x.qty)+'</strong></article>'}).join(''):'<p class="fm-cart-empty">Your basket is empty. Add a few everyday essentials to get started.</p>';
  const submit=store.querySelector('[data-fm-checkout] button[type=submit]');if(submit)submit.disabled=!cart.length;
 }
 store.addEventListener('click',e=>{
  const el=e.target.closest('[data-fm-action],[data-fm-filter]');if(!el||!store.contains(el))return;
  if(el.dataset.fmFilter!==undefined){const f=el.dataset.fmFilter;store.querySelectorAll('[data-fm-filter]').forEach(b=>b.classList.toggle('active',b===el));applyFilters(f);return}
  const a=el.dataset.fmAction,id=el.dataset.id;
  if(a==='cart-open')open();if(a==='cart-close')close();
  if(a==='add'){const p=productById(id);if(!available(p))return;const it=cart.find(x=>String(x.id)===String(id));if(it){if(it.qty<num(p.stockQty))it.qty++}else cart.push({id,qty:1});open()}
  if(a==='qty'){const it=cart.find(x=>String(x.id)===String(id)),p=productById(id);if(it&&p){it.qty=Math.max(0,Math.min(num(p.stockQty),it.qty+(Number(el.dataset.delta)||0)));}renderCart()}
  if(a==='remove'){cart=cart.filter(x=>String(x.id)!==String(id));renderCart()}
 });
 let currentSearch='',currentFilter='all';
 function applyFilters(filter=currentFilter){currentFilter=filter;let count=0;store.querySelectorAll('[data-fm-product]').forEach(card=>{const ok=(filter==='all'||card.dataset.category===filter)&&(card.dataset.search||'').includes(currentSearch);card.hidden=!ok;if(ok)count++});const empty=store.querySelector('[data-fm-empty]');if(empty)empty.hidden=count>0}
 store.querySelector('[data-fm-search]')?.addEventListener('input',e=>{currentSearch=e.target.value.toLowerCase().trim();applyFilters()});
 store.querySelector('[data-fm-enquiry]')?.addEventListener('submit',e=>{e.preventDefault();if(!wa){const n=e.currentTarget.querySelector('[data-fm-note]');if(n)n.textContent='Please add the store WhatsApp number in the owner dashboard.';return}const f=new FormData(e.currentTarget),name=String(f.get('name')||'').trim(),phone=String(f.get('phone')||'').trim(),message=String(f.get('message')||'').trim();const msg='Store enquiry — '+(d.brand?.businessName||'Grocery Store')+'\nName: '+name+'\nPhone: '+phone+'\nMessage: '+message;window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank','noopener');const n=e.currentTarget.querySelector('[data-fm-note]');if(n)n.textContent='WhatsApp opened. Press Send there to submit your enquiry.'});
 store.querySelector('[data-fm-checkout]')?.addEventListener('submit',e=>{
  e.preventDefault();if(!cart.length)return;
  if(!wa){alert('Store WhatsApp number is not configured yet. Please contact the store.');return}
  const f=new FormData(e.currentTarget),name=String(f.get('name')||'').trim(),phone=String(f.get('phone')||'').trim(),address=String(f.get('address')||'').trim(),slot=String(f.get('slot')||''),notes=String(f.get('notes')||'').trim();
  if(!name||!phone||!address)return;
  const sub=subtotal(),fee=deliveryFee(),total=sub+fee;
  if(num(delivery.minimumOrder)>sub){alert('Please add items worth at least '+fmt(delivery.minimumOrder)+' to continue.');return}
  const lines=cart.map(x=>{const p=productById(x.id);return x.qty+' × '+p.name+' ('+p.unit+') — '+fmt(unitPrice(p)*x.qty)});
  const msg='GROCERY ORDER REQUEST — '+(d.brand?.businessName||'FreshMart')+'\n\n'+lines.join('\n')+'\n\nSubtotal: '+fmt(sub)+'\nDelivery: '+(fee?fmt(fee):'FREE')+'\nTotal: '+fmt(total)+'\n\nCustomer: '+name+'\nPhone: '+phone+'\nAddress: '+address+'\nPreferred time: '+slot+(notes?'\nNotes: '+notes:'')+'\n\nPlease confirm availability and order.';
  window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank','noopener');
 });
 store.querySelectorAll('[data-fm-product] img').forEach(img=>img.addEventListener('error',()=>{img.style.opacity='.2'}));
 renderCart();
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
export function render(d={},selected=[]){return scPay(scPreUpiRender(d,selected),d,selected);}
export function init(root,...rest){const r=scPreUpiInit(root,...rest);try{scBindPay(root);}catch(e){}return r;}
