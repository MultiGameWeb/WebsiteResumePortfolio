const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{const x=String(v??'').trim();return /^(https?:\/\/|data:image\/|\/|\.\/|\.\.\/)/i.test(x)?x:''};
const digits=v=>String(v??'').replace(/\D/g,'');
const amount=v=>{const n=Number(String(v??'').replace(/[^\d.-]/g,''));return Number.isFinite(n)?n:0};
const money=(v,currency='INR')=>{try{return new Intl.NumberFormat('en-IN',{style:'currency',currency,maximumFractionDigits:0}).format(amount(v))}catch{return '₹'+amount(v).toLocaleString('en-IN')}};

function scBaseRender(d={},selected=[]){
 const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},legal=d.legal||{},ok=x=>selected.includes(x);
 const products=(d.products||[]).filter(x=>x.enabled!==false),gallery=(d.gallery||[]).filter(x=>x.enabled!==false);
 const currency=s.currency||'INR',wa=digits(c.whatsapp);
 const reviews=(d.reviews||[]).filter(x=>x.enabled!==false),faqs=(d.faqs||[]).filter(x=>x.enabled!==false);
 const telHref=String(c.call||'').replace(/[^\d+]/g,''),mail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c.email||'').trim())?String(c.email).trim():'';
 const categories=[...new Set(products.map(p=>String(p.category||'General')).filter(Boolean))];
 const productCards=products.map((p,i)=>{
  const id=esc(p.id||('vh-product-'+i)),name=esc(p.name||'Product'),image=esc(safeUrl(p.image)),base=amount(p.basePrice||p.price),sale=amount(p.salePrice||p.price),off=base>sale&&base>0?Math.round((base-sale)/base*100):0;
  return '<article class="vh-product" data-vh-product data-id="'+id+'" data-category="'+esc(String(p.category||'General').toLowerCase())+'" data-search="'+esc([p.name,p.category,p.description].join(' ').toLowerCase())+'"><div class="vh-product-image">'+(off?'<span class="vh-sale">'+off+'% OFF</span>':'')+'<img src="'+image+'" alt="'+name+'" loading="lazy"></div><div class="vh-product-info"><small>'+esc(p.category||'COLLECTION')+'</small><h3>'+name+'</h3><p>'+esc(p.description||'')+'</p><div class="vh-price"><strong>'+money(sale,currency)+'</strong>'+(base>sale?'<del>'+money(base,currency)+'</del>':'')+'</div>'+(ok('cart')?'<button type="button" class="vh-add" data-vh-action="add" data-id="'+id+'" '+(p.inStock===false?'disabled':'')+'>'+(p.inStock===false?'Currently unavailable':'Add to bag')+'</button>':'')+'</div></article>';
 }).join('');
 let out='<div class="vh-store" data-vh-store><header class="vh-header"><a class="vh-logo" href="#vh-home">'+(()=>{const w=String(b.businessName||'Vastra Heritage').trim().split(/\s+/);return esc(w[0])+(w.length>1?'<span>'+esc(w.slice(1).join(' '))+'</span>':'')})()+'</a><nav>'+(ok('home')?'<a href="#vh-home">Home</a>':'')+(ok('about')?'<a href="#vh-about">About</a>':'')+(ok('products')?'<a href="#vh-products">Collections</a>':'')+(ok('gallery')?'<a href="#vh-gallery">Gallery</a>':'')+(ok('reviews')&&reviews.length?'<a href="#vh-reviews">Reviews</a>':'')+(ok('faq')&&faqs.length?'<a href="#vh-faq">FAQ</a>':'')+(ok('location')?'<a href="#vh-location">Location</a>':'')+(ok('enquiry')?'<a href="#vh-enquiry">Enquiry</a>':'')+'</nav><div class="vh-actions">'+(ok('cart')?'<button class="vh-cart-trigger" type="button" data-vh-action="cart-open" aria-label="Open shopping bag">Bag <span data-vh-cart-count>0</span></button>':'')+'</div></header>';
 if(ok('home'))out+='<section class="vh-hero" id="vh-home"><img src="'+esc(safeUrl(d.hero))+'" alt="" loading="eager"><div class="vh-shade"></div><div class="vh-hero-copy"><small>'+esc(b.motto||'HANDCRAFTED ELEGANCE')+'</small><h1>'+esc(h.title||'Festive collections, timeless elegance.')+'</h1><p>'+esc(h.text||'Discover carefully selected sarees, occasion wear and handcrafted styles.')+'</p><a class="vh-primary" href="#vh-products">Browse collections</a></div></section>';
 if(ok('about')&&s.showAbout!==false)out+='<section class="vh-about" id="vh-about"><small>OUR STORY</small><h2>'+esc(b.about||'A love for beautiful craftsmanship and timeless Indian style.')+'</h2></section>';
 if(ok('products'))out+='<section class="vh-section" id="vh-products"><div class="vh-section-heading"><div><small>THE COLLECTION</small><h2>Exclusive festive gallery</h2><p>Find your favourites and order directly through WhatsApp.</p></div>'+(ok('search')?'<input class="vh-search" type="search" data-vh-search placeholder="Search collections…" aria-label="Search products">':'')+'</div>'+(ok('categories')?'<div class="vh-categories"><button type="button" class="active" data-vh-filter="all">All</button>'+categories.map(cat=>'<button type="button" data-vh-filter="'+esc(cat.toLowerCase())+'">'+esc(cat)+'</button>').join('')+'</div>':'')+'<div class="vh-products" data-vh-products>'+productCards+'</div><p class="vh-empty" data-vh-empty hidden>No products found. Please try another search.</p></section>';
 if(ok('gallery')&&s.showGallery!==false)out+='<section class="vh-gallery-section" id="vh-gallery"><div class="vh-section-heading"><div><small>INSIDE THE COLLECTION</small><h2>Style inspiration</h2></div></div><div class="vh-gallery">'+gallery.map(x=>'<figure><img src="'+esc(safeUrl(x.image))+'" alt="'+esc(x.title||'Collection image')+'" loading="lazy"><figcaption>'+esc(x.title||'')+'</figcaption></figure>').join('')+'</div></section>';
 if(ok('reviews')&&reviews.length)out+='<section class="vh-section vh-reviews" id="vh-reviews"><div class="vh-section-heading"><div><small>CUSTOMER LOVE</small><h2>What our customers say</h2></div></div><div class="vh-review-grid">'+reviews.map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||0));return '<figure>'+(r?'<div class="vh-stars" aria-label="'+r+' out of 5">'+'★'.repeat(r)+'</div>':'')+'<blockquote>“'+esc(x.text||'')+'”</blockquote><figcaption>'+esc(x.name||'Customer')+'</figcaption></figure>'}).join('')+'</div></section>';
 if(ok('faq')&&faqs.length)out+='<section class="vh-section vh-faq" id="vh-faq"><div class="vh-section-heading"><div><small>GOOD TO KNOW</small><h2>Frequently asked questions</h2></div></div><div class="vh-faq-list">'+faqs.map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
 if(ok('location'))out+='<section class="vh-location" id="vh-location"><div class="vh-location-inner"><div><small>VISIT OUR STORE</small><h2>' + esc(c.storeName||b.businessName||'Vastra Heritage Studio') + '</h2>'+(c.location?'<p><b>Address</b><br>'+esc(c.location)+'</p>':'')+(c.hours?'<p><b>Working hours</b><br>'+esc(c.hours)+'</p>':'')+(c.call?'<p><b>Phone</b><br><a href="tel:'+esc(telHref)+'">'+esc(c.call)+'</a></p>':'')+(mail?'<p><b>Email</b><br><a href="mailto:'+esc(mail)+'">'+esc(mail)+'</a></p>':'')+'<div class="vh-location-actions">'+(safeUrl(c.maps)?'<a class="vh-secondary" href="'+esc(safeUrl(c.maps))+'" target="_blank" rel="noopener noreferrer">Open in Google Maps ↗</a>':'')+(c.call?'<a class="vh-secondary" href="tel:'+esc(telHref)+'">Call store</a>':'')+(ok('whatsapp')&&wa?'<a class="vh-secondary" href="https://wa.me/'+wa+'?text='+encodeURIComponent('Hi, I have a question about your collection.')+'" target="_blank" rel="noopener">Chat on WhatsApp</a>':'')+'</div></div><div class="vh-highlights"><div><strong>Beautifully</strong><span>Curated collections</span></div><div><strong>Personal</strong><span>WhatsApp assistance</span></div></div></div></section>';
 if(ok('enquiry'))out+='<section class="vh-section vh-enquiry" id="vh-enquiry"><div class="vh-section-heading centered"><div><small>WE ARE HERE TO HELP</small><h2>Personal styling enquiry</h2><p>Tell us what you are looking for, and our team will get in touch.</p></div></div><form class="vh-form" data-vh-enquiry><label>Your name<input name="name" type="text" autocomplete="name" required placeholder="Your full name"></label><label>Phone number<input name="phone" type="tel" autocomplete="tel" required placeholder="+91 98765 43210"></label><label>How can we help?<textarea name="message" rows="4" required placeholder="Share product, size, colour or event requirements…"></textarea></label><button class="vh-primary" type="submit">Send enquiry via WhatsApp</button><p class="vh-form-note" data-vh-form-note></p></form></section>';
 if(ok('privacyPolicy')&&legal.privacyPolicy)out+='<section class="vh-privacy" id="vh-privacy"><small>YOUR PRIVACY</small><h2>Privacy policy</h2><p>'+esc(legal.privacyPolicy)+'</p></section>';
 out+='<footer class="vh-footer">© '+new Date().getFullYear()+' '+esc(b.businessName||'Vastra Heritage')+'. All rights reserved.'+(ok('privacyPolicy')?'<a href="#vh-privacy">Privacy policy</a>':'')+'</footer>';
 if(ok('cart'))out+='<div class="vh-cart-backdrop" data-vh-action="cart-close"></div><aside class="vh-cart" data-vh-cart aria-label="Shopping bag"><div class="vh-cart-head"><div><small>YOUR SELECTION</small><h2>Your shopping bag</h2></div><button type="button" data-vh-action="cart-close" aria-label="Close bag">×</button></div><div class="vh-cart-items" data-vh-cart-items></div><div class="vh-cart-foot"><div><span>Total amount</span><strong data-vh-total>'+money(0,currency)+'</strong></div>'+(ok('whatsapp')&&wa?'<p>Complete your order directly with our store team.</p><button type="button" class="vh-checkout" data-vh-action="checkout">Order via WhatsApp</button>':'<p>Add the store WhatsApp number to enable checkout.</p>')+'</div></aside>';
 if(ok('whatsapp')&&wa)out+='<a class="vh-float" href="https://wa.me/'+wa+'?text='+encodeURIComponent('Hi, I have a question about your collection.')+'" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">WhatsApp</a>';
 return out+'</div>';
}

export function init(root,d={},selected=[]){scMobileNav(arguments[0]);
 const store=root.querySelector('[data-vh-store]');if(!store)return;
 const products=(d.products||[]).filter(p=>p.enabled!==false),currency=d.settings?.currency||'INR',wa=digits(d.contact?.whatsapp),cartKey='sitecraft:ecommerce-03:cart';
 const productById=id=>products.find((p,i)=>String(p.id||('vh-product-'+i))===String(id));
 let cart=[];try{const saved=JSON.parse(localStorage.getItem(cartKey)||'[]');if(Array.isArray(saved))cart=saved}catch{}
 const save=()=>{try{localStorage.setItem(cartKey,JSON.stringify(cart))}catch{}};
 const price=p=>amount(p.salePrice||p.price||p.basePrice);
 const moneyText=n=>money(n,currency);
 const panel=store.querySelector('[data-vh-cart]'),backdrop=store.querySelector('.vh-cart-backdrop'),items=store.querySelector('[data-vh-cart-items]');
 const closeCart=()=>{panel?.classList.remove('open');backdrop?.classList.remove('open')};
 const openCart=()=>{renderCart();panel?.classList.add('open');backdrop?.classList.add('open')};
 const renderCart=()=>{
  cart=cart.filter(x=>productById(x.id)&&productById(x.id).inStock!==false&&Number(x.qty)>0);save();
  const count=cart.reduce((n,x)=>n+x.qty,0),total=cart.reduce((n,x)=>n+price(productById(x.id))*x.qty,0);
  store.querySelectorAll('[data-vh-cart-count]').forEach(el=>el.textContent=count);
  const totalEl=store.querySelector('[data-vh-total]');if(totalEl)totalEl.textContent=moneyText(total);
  if(items)items.innerHTML=cart.length?cart.map(x=>{const p=productById(x.id);return '<article class="vh-cart-item"><img src="'+esc(safeUrl(p.image))+'" alt=""><div><strong>'+esc(p.name)+'</strong><span>'+moneyText(price(p))+' each</span><div class="vh-qty"><button type="button" data-vh-action="qty" data-id="'+esc(x.id)+'" data-delta="-1">−</button><b>'+x.qty+'</b><button type="button" data-vh-action="qty" data-id="'+esc(x.id)+'" data-delta="1">+</button><button type="button" class="vh-remove" data-vh-action="remove" data-id="'+esc(x.id)+'">Remove</button></div></div></article>'}).join(''):'<p class="vh-cart-empty">Your bag is empty. Browse the collection to add products.</p>';
 };
 store.addEventListener('click',e=>{
  const actionEl=e.target.closest('[data-vh-action],[data-vh-filter]');if(!actionEl||!store.contains(actionEl))return;
  if(actionEl.dataset.vhFilter!==undefined){const filter=actionEl.dataset.vhFilter;store.querySelectorAll('[data-vh-filter]').forEach(btn=>btn.classList.toggle('active',btn===actionEl));applyFilters(filter);return}
  const action=actionEl.dataset.vhAction,id=actionEl.dataset.id;
  if(action==='cart-open')openCart();
  if(action==='cart-close')closeCart();
  if(action==='add'){const p=productById(id);if(!p||p.inStock===false)return;const item=cart.find(x=>String(x.id)===String(id));if(item)item.qty++;else cart.push({id,qty:1});openCart()}
  if(action==='qty'){const item=cart.find(x=>String(x.id)===String(id));if(item)item.qty+=Number(actionEl.dataset.delta)||0;renderCart()}
  if(action==='remove'){cart=cart.filter(x=>String(x.id)!==String(id));renderCart()}
  if(action==='checkout'){
   if(!cart.length||!wa)return;
   const lines=cart.map(x=>{const p=productById(x.id);return x.qty+' × '+p.name+' — '+moneyText(price(p)*x.qty)});
   const total=cart.reduce((n,x)=>n+price(productById(x.id))*x.qty,0);
   const msg='Namaskaram! I would like to place an order from '+(d.brand?.businessName||'your store')+':\n'+lines.join('\n')+'\nTotal: '+moneyText(total)+'\nPlease confirm availability and delivery details.';
   window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank','noopener');
  }
 });
 let currentSearch='',currentFilter='all';
 const applyFilters=(filter=currentFilter)=>{currentFilter=filter;let visible=0;store.querySelectorAll('[data-vh-product]').forEach(card=>{const category=card.dataset.category||'',search=card.dataset.search||'',ok=(filter==='all'||category===filter)&&search.includes(currentSearch);card.hidden=!ok;if(ok)visible++});const empty=store.querySelector('[data-vh-empty]');if(empty)empty.hidden=visible>0};
 store.querySelector('[data-vh-search]')?.addEventListener('input',e=>{currentSearch=e.target.value.toLowerCase().trim();applyFilters()});
 store.querySelector('[data-vh-enquiry]')?.addEventListener('submit',e=>{
  e.preventDefault();const form=e.currentTarget;if(!wa){const note=form.querySelector('[data-vh-form-note]');if(note)note.textContent='Please add the store WhatsApp number in the owner dashboard first.';return}
  const data=new FormData(form),name=String(data.get('name')||'').trim(),phone=String(data.get('phone')||'').trim(),message=String(data.get('message')||'').trim();
  if(!name||!phone||!message)return;
  const msg='New website enquiry — '+(d.brand?.businessName||'Vastra Heritage')+'\nName: '+name+'\nPhone: '+phone+'\nMessage: '+message;
  window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank','noopener');
  const note=form.querySelector('[data-vh-form-note]');if(note)note.textContent='WhatsApp opened with your enquiry. Please press Send there to complete it.';
  form.reset();
 });
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
export function render(d={},selected=[]){return scConnect(scBaseRender(d,selected),d,selected);}
