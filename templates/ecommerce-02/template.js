const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{const x=String(v??'').trim();return /^(https?:\/\/|data:image\/|\/|\.\/|\.\.\/)/i.test(x)?x:''};
const digits=v=>String(v??'').replace(/\D/g,'');
const amount=v=>{const n=Number(String(v??'').replace(/[^\d.]/g,''));return Number.isFinite(n)?n:0};
const money=(v,currency='INR')=>{const n=typeof v==='number'?v:amount(v);try{return new Intl.NumberFormat('en-IN',{style:'currency',currency,maximumFractionDigits:2}).format(n)}catch{return '₹'+n.toFixed(2)}};
function scBaseRender(d={},selected=[]){
 const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},ok=x=>selected.includes(x);
 const products=(d.products||[]).filter(x=>x.enabled!==false);
 const gallery=(d.gallery||[]).filter(x=>x.enabled!==false),reviews=(d.reviews||[]).filter(x=>x.enabled!==false);
 const cats=[...new Set(products.map(x=>String(x.category||'General')).filter(Boolean))],currency=s.currency||'INR',wa=digits(c.whatsapp);
 const cards=products.map((p,i)=>{
  const id=esc(p.id||('product-'+i)),name=esc(p.name||'Product'),cat=esc(p.category||'General'),desc=esc(p.description||''),image=esc(safeUrl(p.image));
  const base=amount(p.basePrice||p.price),sale=amount(p.salePrice||p.price),discount=base>sale&&sale>0?Math.round((base-sale)/base*100):0;
  const stocked=p.inStock!==false;
  return '<article class="lc-product" data-product-card data-id="'+id+'" data-category="'+cat.toLowerCase()+'" data-name="'+(name+' '+desc+' '+cat).toLowerCase()+'" data-featured="'+(p.featured?'1':'0')+'"><div class="lc-product-media">'+(discount?'<span class="lc-sale-badge">'+discount+'% OFF</span>':'')+'<img src="'+image+'" alt="'+name+'" loading="lazy">'+(ok('quickView')?'<button type="button" class="lc-quick-view" data-action="quick-view" data-id="'+id+'">Quick view</button>':'')+'</div><div class="lc-product-info"><span class="lc-category">'+cat+(p.featured?' · ★ Featured':'')+'</span><h3>'+name+'</h3><p>'+desc+'</p><div class="lc-price"><strong>'+money(sale,currency)+'</strong>'+(base>sale?'<del>'+money(base,currency)+'</del>':'')+'</div>'+(ok('cart')?'<button type="button" class="lc-add" data-action="add" data-id="'+id+'" '+(!stocked?'disabled':'')+'>'+(stocked?'＋ Add to bag':'Currently unavailable')+'</button>':'')+'</div></article>';
 }).join('');
 const catsHtml=ok('categories')?'<div class="lc-categories"><button type="button" class="active" data-filter="all">All items</button>'+cats.map(x=>'<button type="button" data-filter="'+esc(x.toLowerCase())+'">'+esc(x)+'</button>').join('')+(products.some(x=>x.featured)?'<button type="button" data-filter="featured">★ Best sellers</button>':'')+'</div>':'';
 const contact=[c.call?'<a class="lc-outline" href="tel:'+esc(String(c.call).replace(/[^\d+]/g,''))+'">Call store</a>':'',ok('whatsapp')&&wa?'<a class="lc-dark" target="_blank" rel="noopener" href="https://wa.me/'+wa+'">WhatsApp</a>':'',ok('location')&&safeUrl(c.maps)?'<a class="lc-outline" target="_blank" rel="noopener" href="'+esc(safeUrl(c.maps))+'">Get directions</a>':''].join('');
 let out='<div class="lc-store" data-lc-store><header class="lc-header"><a class="lc-brand" href="#lc-home"><span class="lc-mark">✦</span><span><strong>'+esc(b.businessName||'LuxeCart Store')+'</strong><small>'+esc(b.motto||'A BETTER WAY TO SHOP')+'</small></span></a><nav>'+(ok('about')?'<a href="#lc-about">About</a>':'')+(ok('products')?'<a href="#lc-products">Shop</a>':'')+(ok('gallery')?'<a href="#lc-gallery">Gallery</a>':'')+(ok('reviews')?'<a href="#lc-reviews">Reviews</a>':'')+(ok('faq')&&(d.faqs||[]).some(x=>x.enabled!==false)?'<a href="#lc-faq">FAQ</a>':'')+(ok('contact')?'<a href="#lc-contact">Contact</a>':'')+'</nav><div class="lc-header-actions">'+(ok('sellerPortal')?'<a class="lc-seller" href="admin.html?template=ecommerce-02">Seller portal ↗</a>':'')+(ok('cart')?'<button class="lc-cart-button" type="button" data-action="cart-open">Bag <span data-cart-count>0</span></button>':'')+'</div></header>';
 if(ok('home'))out+='<section class="lc-hero" id="lc-home"><img src="'+esc(safeUrl(d.hero))+'" alt=""><div class="lc-hero-shade"></div><div class="lc-hero-copy"><small>'+esc(b.ownerName||'WELCOME TO OUR STORE')+'</small><h1>'+esc(h.title||'Find something you will love.')+'</h1><p>'+esc(h.text||'Explore our latest collection and shop your favourites.')+'</p><a class="lc-hero-cta" href="#lc-products">Explore collection ↗</a></div></section>';
 if(ok('categories'))out+='<section class="lc-category-section"><div class="lc-section-head"><div><small>CURATED FOR YOU</small><h2>Shop by category</h2></div></div>'+catsHtml+'</section>';
 if(ok('about')&&s.showAbout!==false)out+='<section class="lc-about" id="lc-about"><small>OUR STORY</small><h2>'+esc(b.about||'Thoughtful products, friendly service, and a store built around you.')+'</h2></section>';
 if(ok('products'))out+='<section class="lc-products-section" id="lc-products"><div class="lc-section-head"><div><small>THE COLLECTION</small><h2>Popular products</h2></div>'+(ok('search')?'<input class="lc-search" type="search" data-product-search placeholder="Search products…" aria-label="Search products">':'')+'</div><div class="lc-products-grid" data-products-grid>'+cards+'</div><p class="lc-no-results" data-no-results hidden>No products match your search.</p></section>';
 if(ok('gallery')&&s.showGallery!==false)out+='<section class="lc-gallery-section" id="lc-gallery"><div class="lc-section-head"><div><small>IN THE SPOTLIGHT</small><h2>Store gallery</h2></div></div><div class="lc-gallery">'+gallery.map(x=>'<figure><img src="'+esc(safeUrl(x.image))+'" alt="'+esc(x.title||'')+'" loading="lazy"><figcaption>'+esc(x.title||'')+'</figcaption></figure>').join('')+'</div></section>';
 if(ok('reviews')&&s.showReviews!==false)out+='<section class="lc-reviews" id="lc-reviews"><small>WHAT CUSTOMERS SAY</small><h2>Good things, shared.</h2><div class="lc-review-grid">'+reviews.map(x=>'<article><b>'+('★'.repeat(Math.max(0,Math.min(5,Number(x.rating)||0))))+'</b><p>“'+esc(x.text||'')+'”</p><strong>'+esc(x.name||'Customer')+'</strong></article>').join('')+'</div></section>';
 if(ok('faq')&&(d.faqs||[]).some(x=>x.enabled!==false))out+='<section class="lc-faq" id="lc-faq"><small>GOOD TO KNOW</small><h2>Frequently asked questions</h2><div class="lc-faq-list">'+(d.faqs||[]).filter(x=>x.enabled!==false).map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
 if(ok('contact')&&s.showContact!==false)out+='<section class="lc-contact" id="lc-contact"><div><small>WE ARE HERE TO HELP</small><h2>Need a hand?</h2><p>'+esc(c.location||'Visit or contact our store for help with your order.')+'</p></div><div class="lc-contact-actions">'+contact+'</div></section>';
 out+='<footer class="lc-footer">© '+new Date().getFullYear()+' '+esc(b.businessName||'Your Store')+'. All rights reserved.</footer>';
 if(ok('cart'))out+='<div class="lc-cart-shade" data-cart-shade data-action="cart-close"></div><aside class="lc-cart-panel" data-cart-panel aria-label="Shopping bag"><div class="lc-cart-head"><div><small>YOUR SELECTION</small><h2>Shopping bag</h2></div><button type="button" data-action="cart-close" aria-label="Close cart">×</button></div><div class="lc-cart-items" data-cart-items></div><div class="lc-cart-foot"><div class="lc-total"><span>Subtotal</span><strong data-cart-total>'+money(0,currency)+'</strong></div>'+(ok('whatsapp')&&wa?'<p class="lc-cart-note">Your order will be sent to the store through WhatsApp.</p><button type="button" class="lc-checkout" data-action="checkout">Place order via WhatsApp ↗</button>':'<p class="lc-cart-note">Contact the store to complete your order.</p>')+'</div></aside>';
 out+='<div class="lc-modal" data-quick-modal hidden><div class="lc-modal-card"><button type="button" class="lc-modal-close" data-action="quick-close" aria-label="Close">×</button><div data-quick-content></div></div></div>';
 return out+'</div>';
}
function scPreUpiInit(root,d={},selected=[]){scMobileNav(arguments[0]);
 const store=root.querySelector('[data-lc-store]');if(!store)return;
 const products=(d.products||[]).filter(x=>x.enabled!==false),currency=d.settings?.currency||'INR',wa=digits(d.contact?.whatsapp),cartKey='sitecraft-ecommerce-02-cart';
 let cart=[];try{cart=JSON.parse(localStorage.getItem(cartKey)||'[]')}catch{cart=[]}if(!Array.isArray(cart))cart=[];
 const productById=id=>products.find((p,i)=>String(p.id||('product-'+i))===String(id));
 const save=()=>{try{localStorage.setItem(cartKey,JSON.stringify(cart))}catch{}};
 const moneyText=n=>money(n,currency);
 const panel=store.querySelector('[data-cart-panel]'),shade=store.querySelector('[data-cart-shade]'),items=store.querySelector('[data-cart-items]');
 const renderCart=()=>{
  cart=cart.filter(x=>productById(x.id)&&productById(x.id).inStock!==false&&Number(x.qty)>0);save();
  const count=cart.reduce((n,x)=>n+x.qty,0),total=cart.reduce((n,x)=>{const p=productById(x.id);return n+amount(p.salePrice||p.price)*x.qty},0);
  store.querySelectorAll('[data-cart-count]').forEach(x=>x.textContent=count);
  const totalEl=store.querySelector('[data-cart-total]');if(totalEl)totalEl.textContent=moneyText(total);
  if(items)items.innerHTML=cart.length?cart.map(x=>{const p=productById(x.id);return '<article class="lc-cart-item"><img src="'+esc(safeUrl(p.image))+'" alt=""><div class="lc-cart-item-info"><strong>'+esc(p.name)+'</strong><span>'+moneyText(amount(p.salePrice||p.price))+' each</span><div class="lc-qty"><button type="button" data-action="qty" data-id="'+esc(x.id)+'" data-delta="-1">−</button><b>'+x.qty+'</b><button type="button" data-action="qty" data-id="'+esc(x.id)+'" data-delta="1">+</button><button type="button" class="lc-remove" data-action="remove" data-id="'+esc(x.id)+'">Remove</button></div></div></article>'}).join(''):'<p class="lc-empty-cart">Your bag is empty. Add a few favourites to get started.</p>';
 };
 const openCart=()=>{panel?.classList.add('open');shade?.classList.add('open');store.classList.add('lc-cart-open')};
 const closeCart=()=>{panel?.classList.remove('open');shade?.classList.remove('open');store.classList.remove('lc-cart-open')};
 const quickModal=store.querySelector('[data-quick-modal]'),quickContent=store.querySelector('[data-quick-content]');
 const showQuick=id=>{const p=productById(id);if(!p||!quickModal||!quickContent)return;const sale=amount(p.salePrice||p.price),base=amount(p.basePrice||p.price);quickContent.innerHTML='<img src="'+esc(safeUrl(p.image))+'" alt="'+esc(p.name)+'"><div><small>'+esc(p.category||'PRODUCT')+'</small><h2>'+esc(p.name||'Product')+'</h2><strong>'+moneyText(sale)+'</strong>'+(base>sale?'<del>'+moneyText(base)+'</del>':'')+'<p>'+esc(p.description||'')+'</p>'+(p.inStock===false?'<span class="lc-stock-out">Currently unavailable</span>':(selected.includes('cart')?'<button type="button" class="lc-add" data-action="add" data-id="'+esc(id)+'">＋ Add to bag</button>':''))+'</div>';quickModal.hidden=false};
 let currentCategory='all',currentSearch='';const applyFilters=()=>{let shown=0;store.querySelectorAll('[data-product-card]').forEach(card=>{const cat=card.dataset.category,categoryMatch=currentCategory==='all'||(currentCategory==='featured'?card.dataset.featured==='1':cat===currentCategory),searchMatch=card.dataset.name.includes(currentSearch);const visible=categoryMatch&&searchMatch;card.hidden=!visible;if(visible)shown++});const none=store.querySelector('[data-no-results]');if(none)none.hidden=shown>0};
 store.addEventListener('click',e=>{
  const button=e.target.closest('[data-action],[data-filter]');if(!button||!store.contains(button))return;
  if(button.dataset.filter!==undefined){currentCategory=button.dataset.filter;store.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('active',x===button));applyFilters();return}
  const id=button.dataset.id,action=button.dataset.action;
  if(action==='cart-open'){renderCart();openCart()}
  if(action==='cart-close')closeCart();
  if(action==='quick-view')showQuick(id);
  if(action==='quick-close')quickModal.hidden=true;
  if(action==='add'){const p=productById(id);if(!p||p.inStock===false)return;const item=cart.find(x=>String(x.id)===String(id));if(item)item.qty++;else cart.push({id,qty:1});renderCart();openCart();quickModal.hidden=true}
  if(action==='qty'){const item=cart.find(x=>String(x.id)===String(id));if(item)item.qty+=Number(button.dataset.delta)||0;renderCart()}
  if(action==='remove'){cart=cart.filter(x=>String(x.id)!==String(id));renderCart()}
  if(action==='checkout'){
   if(!cart.length||!wa)return;
   const lines=cart.map(x=>{const p=productById(x.id);return x.qty+' × '+p.name+' — '+moneyText(amount(p.salePrice||p.price)*x.qty)});
   const total=cart.reduce((n,x)=>n+amount(productById(x.id).salePrice||productById(x.id).price)*x.qty,0);
   const msg='Namaskaram! I would like to place an order:\n'+lines.join('\n')+'\nTotal: '+moneyText(total)+'\nPlease confirm availability and delivery details.';
   window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank','noopener');
  }
 });
 store.querySelector('[data-product-search]')?.addEventListener('input',e=>{currentSearch=e.target.value.toLowerCase().trim();applyFilters()});
 quickModal?.addEventListener('click',e=>{if(e.target===quickModal)quickModal.hidden=true});
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
function scSeoBaseRender(d={},selected=[]){return scPay(scPreUpiRender(d,selected),d,selected);}
export function init(root,...rest){const r=scPreUpiInit(root,...rest);try{scBindPay(root);}catch(e){}return r;}

// SEO: page title, description, business details for Google and tab icon (core/pack.js).
export function render(d={},selected=[]){const h=scSeoBaseRender(d,selected);try{if(typeof window!=="undefined"&&window.SiteCraftPack&&window.SiteCraftPack.seo)window.SiteCraftPack.seo(d,"E-commerce")}catch(e){}return h}
