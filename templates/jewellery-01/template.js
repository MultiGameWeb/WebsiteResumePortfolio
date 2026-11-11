const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{const x=String(v??'').trim();return /^(https?:\/\/|data:image\/|\/|\.\/|\.\.\/)/i.test(x)?x:''};
const digits=v=>String(v??'').replace(/\D/g,'');
const num=v=>{const n=Number(String(v??'').replace(/[^\d.-]/g,''));return Number.isFinite(n)?n:0};
const money=(v,c='INR')=>{try{return new Intl.NumberFormat('en-IN',{style:'currency',currency:c,maximumFractionDigits:0}).format(num(v))}catch{return '₹'+num(v).toLocaleString('en-IN')}};
const slug=v=>String(v??'').toLowerCase().trim();
function scBaseRender(d={},selected=[]){
 const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},legal=d.legal||{},ok=x=>selected.includes(x);
 const products=(d.products||[]).filter(p=>p.enabled!==false),offers=(d.offers||[]).filter(o=>o.enabled!==false),gallery=(d.gallery||[]).filter(g=>g.enabled!==false),currency=s.currency||'INR',wa=digits(c.whatsapp);
 const categories=[...new Set(products.map(p=>String(p.category||'Fine Jewellery').trim()).filter(Boolean))];
 const price=p=>p.priceOnRequest||num(p.salePrice||p.basePrice)<=0?'Price on request':money(p.salePrice||p.basePrice,currency);
 const card=p=>'<article class="aj-product" data-aj-product data-id="'+esc(p.id||p.sku||p.name)+'" data-category="'+esc(slug(p.category||'Fine Jewellery'))+'" data-search="'+esc([p.name,p.category,p.metal,p.purity,p.description,p.stoneDetails].join(' ').toLowerCase())+'"><div class="aj-product-image"><img src="'+esc(safeUrl(p.image))+'" alt="'+esc(p.name||'Jewellery design')+'" loading="lazy">'+(p.featured?'<span class="aj-featured">SIGNATURE</span>':'')+(ok('wishlist')?'<button type="button" class="aj-heart" data-aj-action="wish" data-id="'+esc(p.id||p.sku||p.name)+'" aria-label="Add to wishlist">♡</button>':'')+'</div><div class="aj-product-copy"><small>'+esc(p.category||'FINE JEWELLERY')+'</small><h3>'+esc(p.name||'Jewellery design')+'</h3><div class="aj-product-spec">'+esc(p.metal||'')+(p.purity?' · '+esc(p.purity):'')+(p.grossWeight?' · '+esc(p.grossWeight):'')+'</div><div class="aj-price">'+esc(price(p))+'</div><div class="aj-card-actions"><button type="button" class="aj-outline" data-aj-action="details" data-id="'+esc(p.id||p.sku||p.name)+'">View details</button>'+(ok('cart')?'<button type="button" class="aj-add" data-aj-action="add" data-id="'+esc(p.id||p.sku||p.name)+'" aria-label="Add to bag">＋</button>':'')+'</div></div></article>';
 let out='<div class="aj-store" data-aj-store>';
 out+='<div class="aj-topbar"><span>AN HEIRLOOM IN THE MAKING</span><span>PERSONAL SERVICE · TIMELESS CRAFT</span></div><header class="aj-header"><a class="aj-brand" href="#aj-home"><span class="aj-brand-mark">A</span><span><b>'+esc(b.businessName||'Aurelia Fine Jewels')+'</b><small>'+esc(b.motto||'CRAFTED TO BE TREASURED')+'</small></span></a><nav>'+(ok('home')?'<a href="#aj-home">Home</a>':'')+(ok('products')?'<a href="#aj-products">Collections</a>':'')+(ok('offers')?'<a href="#aj-offers">Services</a>':'')+(ok('about')?'<a href="#aj-about">Our story</a>':'')+(ok('location')?'<a href="#aj-location">Visit us</a>':'')+'</nav><div class="aj-header-actions">'+(ok('wishlist')?'<button type="button" class="aj-wish-link" data-aj-action="show-wishlist">♡ <span data-aj-wish-count>0</span></button>':'')+(ok('cart')?'<button type="button" class="aj-bag-link" data-aj-action="cart-open">Bag <span data-aj-cart-count>0</span></button>':'')+'</div></header>';
 if(ok('home'))out+='<section class="aj-hero" id="aj-home"><img src="'+esc(safeUrl(d.hero))+'" alt="Fine jewellery collection" loading="eager"><div class="aj-hero-overlay"></div><div class="aj-hero-content"><span class="aj-kicker">THE ART OF FINE JEWELLERY</span><h1>'+esc(h.title||'Jewellery for the moments that become memories.')+'</h1><p>'+esc(h.text||'Discover pieces made to be treasured for generations.')+'</p><a class="aj-primary" href="#aj-products">Explore the collection <span>↗</span></a></div><div class="aj-hero-caption">CRAFTED WITH INTENTION · WORN WITH LOVE</div></section>';
 out+='<section class="aj-values"><span>✧ Thoughtful craftsmanship</span><span>✧ Personal consultations</span><span>✧ Hallmark & certification details</span></section>';
 if(ok('products'))out+='<section class="aj-collection" id="aj-products"><div class="aj-section-intro"><div><span class="aj-kicker">THE COLLECTION</span><h2>Find the piece that feels like you.</h2><p>Explore gold, diamonds, silver and special occasion designs.</p></div>'+(ok('search')?'<label class="aj-search"><span>⌕</span><input type="search" data-aj-search placeholder="Search jewellery…" aria-label="Search jewellery"></label>':'')+'</div>'+(ok('categories')?'<div class="aj-categories"><button type="button" class="active" data-aj-filter="all">All pieces</button>'+categories.map(x=>'<button type="button" data-aj-filter="'+esc(slug(x))+'">'+esc(x)+'</button>').join('')+'</div>':'')+'<div class="aj-products" data-aj-products>'+products.map(card).join('')+'</div><p class="aj-empty" data-aj-empty hidden>No designs found. Try another search or collection.</p></section>';
 if(ok('offers')&&offers.length)out+='<section class="aj-services" id="aj-offers"><div class="aj-section-intro"><div><span class="aj-kicker">A PERSONAL EXPERIENCE</span><h2>More than a purchase.</h2><p>Thoughtful guidance for the pieces and moments that matter.</p></div></div><div class="aj-service-grid">'+offers.map(o=>'<article><span class="aj-service-icon">✧</span><h3>'+esc(o.title||'Personal service')+'</h3><p>'+esc(o.description||'')+'</p>'+(o.code?'<small>MENTION: '+esc(o.code)+'</small>':'')+'</article>').join('')+'</div></section>';
 if(ok('about')&&s.showAbout!==false)out+='<section class="aj-about" id="aj-about"><div class="aj-about-image"><img src="'+esc(safeUrl(gallery[0]?.image||d.hero))+'" alt="Jewellery craftsmanship" loading="lazy"></div><div><span class="aj-kicker">OUR PHILOSOPHY</span><h2>Beauty that holds meaning.</h2><p>'+esc(b.about||'We believe every beautiful piece should feel personal, lasting and meaningful.')+'</p><a href="#aj-location" class="aj-text-link">Discover our showroom ↗</a></div></section>';
 if(ok('appointment'))out+='<section class="aj-appointment" id="aj-appointment"><div><span class="aj-kicker">YOUR TIME, YOUR STYLE</span><h2>A private moment with our collection.</h2><p>'+esc(d.appointments?.note||'Book a personal showroom visit and let us help you find the right piece.')+'</p></div><form data-aj-appointment><label>Your name<input name="name" autocomplete="name" required placeholder="Full name"></label><label>Phone number<input name="phone" type="tel" autocomplete="tel" required placeholder="Mobile number"></label><label>Preferred date<input name="date" type="date" required></label><label>Preferred time<select name="time"><option>Morning</option><option>Afternoon</option><option>Evening</option></select></label><label class="aj-wide">What are you looking for?<textarea name="interest" rows="3" placeholder="Bridal collection, gold necklace, custom design…"></textarea></label><button class="aj-primary aj-wide" type="submit">Request a showroom visit ↗</button><small class="aj-wide" data-aj-appointment-note></small></form></section>';
 if(ok('gallery')&&s.showGallery!==false&&gallery.length)out+='<section class="aj-lookbook"><div class="aj-section-intro"><div><span class="aj-kicker">VISUAL STORIES</span><h2>Details worth remembering.</h2></div></div><div class="aj-gallery">'+gallery.map(g=>'<figure><img src="'+esc(safeUrl(g.image))+'" alt="'+esc(g.title||'Jewellery lookbook')+'" loading="lazy"><figcaption>'+esc(g.title||'')+'</figcaption></figure>').join('')+'</div></section>';
 if(ok('reviews')&&(d.reviews||[]).some(x=>x.enabled!==false))out+='<section class="aj-reviews sc-extra-section" id="aj-reviews"><span class="aj-kicker">CUSTOMER LOVE</span><h2>What our customers say</h2><div class="sc-review-grid">'+(d.reviews||[]).filter(x=>x.enabled!==false).map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||0));return '<figure>'+(r?'<div class="sc-stars" aria-label="'+r+' out of 5">'+'★'.repeat(r)+'</div>':'')+'<blockquote>“'+esc(x.text||'')+'”</blockquote><figcaption>'+esc(x.name||'Customer')+'</figcaption></figure>'}).join('')+'</div></section>';
 if(ok('faq')&&(d.faqs||[]).some(x=>x.enabled!==false))out+='<section class="aj-faq sc-extra-section" id="aj-faq"><span class="aj-kicker">GOOD TO KNOW</span><h2>Frequently asked questions</h2><div class="sc-faq-list">'+(d.faqs||[]).filter(x=>x.enabled!==false).map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
 if(ok('location')&&s.showLocation!==false)out+='<section class="aj-location" id="aj-location"><div><span class="aj-kicker">VISIT OUR SHOWROOM</span><h2>'+esc(b.businessName||'Our showroom')+'</h2>'+(c.location?'<p>'+esc(c.location)+'</p>':'')+'<p><b>Opening hours</b><br>'+esc(c.hours||'Contact us for opening hours.')+'</p><div class="aj-location-actions">'+(safeUrl(c.maps)?'<a href="'+esc(safeUrl(c.maps))+'" target="_blank" rel="noopener noreferrer">Get directions ↗</a>':'')+(c.call?'<a href="tel:'+esc(c.call.replace(/[^\d+]/g,''))+'">Call showroom</a>':'')+'</div></div><div class="aj-location-mark">A<span>FINE JEWELS</span></div></section>';
 if(ok('enquiry'))out+='<section class="aj-contact"><div><span class="aj-kicker">LET US HELP YOU</span><h2>Every question deserves a personal answer.</h2><p>Ask about a design, availability, custom sizing or jewellery care.</p></div><form data-aj-enquiry><label>Your name<input name="name" required placeholder="Full name"></label><label>Phone number<input name="phone" type="tel" required placeholder="Mobile number"></label><label class="aj-wide">Your message<textarea name="message" rows="3" required placeholder="Tell us how we can help…"></textarea></label><button class="aj-primary aj-wide" type="submit">Send enquiry on WhatsApp ↗</button><small class="aj-wide" data-aj-enquiry-note></small></form></section>';
 if(ok('privacyPolicy')&&s.showPrivacyPolicy!==false&&legal.privacyPolicy)out+='<section class="aj-privacy"><b>Privacy</b><p>'+esc(legal.privacyPolicy)+'</p></section>';
 out+='<footer class="aj-footer"><div><a class="aj-brand" href="#aj-home"><span class="aj-brand-mark">A</span><span><b>'+esc(b.businessName||'Aurelia Fine Jewels')+'</b><small>CRAFTED TO BE TREASURED</small></span></a><p>Fine jewellery, thoughtfully chosen.</p></div><div><b>Contact</b><span>'+esc(c.call||'')+'</span><span>'+esc(c.email||'')+'</span><span>'+esc(c.location||'')+'</span></div><div><b>Showroom hours</b><span>'+esc(c.hours||'')+'</span></div><small class="aj-copyright">© '+new Date().getFullYear()+' '+esc(b.businessName||'Aurelia Fine Jewels')+'. All rights reserved.</small></footer>';
 if(ok('cart'))out+='<div class="aj-cart-backdrop" data-aj-action="cart-close"></div><aside class="aj-cart" data-aj-cart aria-label="Shopping bag"><div class="aj-cart-head"><div><span class="aj-kicker">YOUR SELECTION</span><h2>Your bag</h2></div><button type="button" data-aj-action="cart-close">×</button></div><div data-aj-cart-items class="aj-cart-items"></div><div class="aj-cart-foot"><div><span>Estimated total</span><b data-aj-cart-total>'+money(0,currency)+'</b></div><p>Final metal rates, making charges and availability are confirmed by our team.</p>'+(ok('whatsapp')?'<button type="button" class="aj-primary" data-aj-action="checkout">Enquire on WhatsApp ↗</button>':'<p class="aj-disabled-note">Enable WhatsApp ordering to send your selection to the showroom.</p>')+'</div></aside>';
 out+='<div class="aj-modal-backdrop" data-aj-action="modal-close"></div><section class="aj-product-modal" data-aj-modal aria-label="Jewellery details"><button type="button" class="aj-modal-close" data-aj-action="modal-close">×</button><div data-aj-modal-content></div></section>';
 if(ok('whatsapp')&&String((d.contact||{}).whatsapp||'').replace(/\D/g,''))out+='<a class="sc-wa-float" href="https://wa.me/'+String(d.contact.whatsapp).replace(/\D/g,'')+'?text='+encodeURIComponent('Hi, I would like to enquire about your jewellery.')+'" target="_blank" rel="noopener" aria-label="Chat on WhatsApp">WhatsApp</a>';
 return out+'</div>';
}
function scPreUpiInit(root,d={},selected=[]){scMobileNav(arguments[0]);
 const store=root.querySelector('[data-aj-store]');if(!store)return;
 const products=(d.products||[]).filter(p=>p.enabled!==false),currency=d.settings?.currency||'INR',wa=selected.includes('whatsapp')?digits(d.contact?.whatsapp):'';
 const idOf=p=>String(p.id||p.sku||p.name),find=id=>products.find(p=>idOf(p)===String(id));
 const fmt=v=>money(v,currency),shownPrice=p=>p.priceOnRequest||num(p.salePrice||p.basePrice)<=0?'Price on request':fmt(p.salePrice||p.basePrice);
 let cart=[],wishlist=[];try{const x=JSON.parse(localStorage.getItem('sitecraft:jewellery-01:cart')||'[]');if(Array.isArray(x))cart=x}catch{}try{const x=JSON.parse(localStorage.getItem('sitecraft:jewellery-01:wishlist')||'[]');if(Array.isArray(x))wishlist=x}catch{}
 const save=()=>{try{localStorage.setItem('sitecraft:jewellery-01:cart',JSON.stringify(cart));localStorage.setItem('sitecraft:jewellery-01:wishlist',JSON.stringify(wishlist))}catch{}};
 const panel=store.querySelector('[data-aj-cart]'),back=store.querySelector('.aj-cart-backdrop'),modal=store.querySelector('[data-aj-modal]'),modalBack=store.querySelector('.aj-modal-backdrop');
 const openCart=()=>{drawCart();panel?.classList.add('open');back?.classList.add('open')},closeCart=()=>{panel?.classList.remove('open');back?.classList.remove('open')};
 const openModal=p=>{if(!p||!modal)return;const box=store.querySelector('[data-aj-modal-content]');box.innerHTML='<div class="aj-modal-layout"><img src="'+esc(safeUrl(p.image))+'" alt="'+esc(p.name)+'"><div><span class="aj-kicker">'+esc(p.category||'FINE JEWELLERY')+'</span><h2>'+esc(p.name)+'</h2><strong class="aj-modal-price">'+esc(shownPrice(p))+'</strong><p>'+esc(p.description||'')+'</p><dl><dt>Metal</dt><dd>'+esc(p.metal||'—')+'</dd><dt>Purity</dt><dd>'+esc(p.purity||'—')+'</dd><dt>Gross weight</dt><dd>'+esc(p.grossWeight||'—')+'</dd><dt>Net weight</dt><dd>'+esc(p.netWeight||'—')+'</dd><dt>Stone details</dt><dd>'+esc(p.stoneDetails||'—')+'</dd><dt>Size</dt><dd>'+esc(p.size||'—')+'</dd><dt>Hallmark / certificate</dt><dd>'+esc(p.certificate||'—')+'</dd><dt>Availability</dt><dd>'+esc(p.stockStatus||'Please enquire')+'</dd></dl>'+(selected.includes('whatsapp')?'<button class="aj-primary" type="button" data-aj-action="product-enquiry" data-id="'+esc(idOf(p))+'">Enquire about this design ↗</button>':'')+'</div></div>';modal.classList.add('open');modalBack?.classList.add('open')};
 const closeModal=()=>{modal?.classList.remove('open');modalBack?.classList.remove('open')};
 const drawCounts=()=>{store.querySelectorAll('[data-aj-cart-count]').forEach(x=>x.textContent=cart.reduce((n,x)=>n+x.qty,0));store.querySelectorAll('[data-aj-wish-count]').forEach(x=>x.textContent=wishlist.length);store.querySelectorAll('[data-aj-action="wish"]').forEach(x=>{const yes=wishlist.includes(x.dataset.id);x.classList.toggle('active',yes);x.textContent=yes?'♥':'♡'})};
 const drawCart=()=>{cart=cart.filter(x=>find(x.id)&&x.qty>0);save();const area=store.querySelector('[data-aj-cart-items]');if(area)area.innerHTML=cart.length?cart.map(x=>{const p=find(x.id);return '<article class="aj-cart-item"><img src="'+esc(safeUrl(p.image))+'" alt=""><div><b>'+esc(p.name)+'</b><small>'+esc(p.purity||p.metal||'')+'</small><div><button data-aj-action="qty" data-id="'+esc(x.id)+'" data-delta="-1">−</button><span>'+x.qty+'</span><button data-aj-action="qty" data-id="'+esc(x.id)+'" data-delta="1">+</button><button class="aj-remove" data-aj-action="remove" data-id="'+esc(x.id)+'">Remove</button></div></div><strong>'+esc(shownPrice(p))+'</strong></article>'}).join(''):'<p class="aj-empty-cart">Your bag is waiting for something special.</p>';const total=cart.reduce((n,x)=>{const p=find(x.id);return n+(p.priceOnRequest?0:num(p.salePrice||p.basePrice))*x.qty},0);const t=store.querySelector('[data-aj-cart-total]');if(t)t.textContent=fmt(total)+(cart.some(x=>find(x.id)?.priceOnRequest)?' + quote items':'')};
 store.addEventListener('click',e=>{
  const el=e.target.closest('[data-aj-action],[data-aj-filter]');if(!el||!store.contains(el))return;
  if(el.dataset.ajFilter!==undefined){store.querySelectorAll('[data-aj-filter]').forEach(x=>x.classList.toggle('active',x===el));applyFilters(el.dataset.ajFilter);return}
  const a=el.dataset.ajAction,id=el.dataset.id,p=find(id);
  if(a==='cart-open')openCart();if(a==='cart-close')closeCart();if(a==='modal-close')closeModal();
  if(a==='details')openModal(p);
  if(a==='wish'){if(wishlist.includes(id))wishlist=wishlist.filter(x=>x!==id);else wishlist.push(id);save();drawCounts()}
  if(a==='show-wishlist'){currentFilter='wishlist';store.querySelectorAll('[data-aj-filter]').forEach(x=>x.classList.remove('active'));applyFilters('wishlist');store.querySelector('#aj-products')?.scrollIntoView({behavior:'smooth'})}
  if(a==='add'&&p){const it=cart.find(x=>x.id===id);if(it)it.qty++;else cart.push({id,qty:1});save();drawCounts();openCart()}
  if(a==='qty'){const it=cart.find(x=>x.id===id);if(it){it.qty=Math.max(0,it.qty+(Number(el.dataset.delta)||0));cart=cart.filter(x=>x.qty>0);drawCart();drawCounts()}}
  if(a==='remove'){cart=cart.filter(x=>x.id!==id);drawCart();drawCounts()}
  if(a==='product-enquiry'&&p&&wa){const msg='Jewellery enquiry — '+(d.brand?.businessName||'Jewellery Store')+'\nDesign: '+p.name+'\nSKU: '+(p.sku||'')+'\nPurity: '+(p.purity||'')+'\nWeight: '+(p.grossWeight||'')+'\nPlease share current price and availability.';window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank','noopener')}
  if(a==='checkout'&&cart.length&&wa){const lines=cart.map(x=>{const p=find(x.id);return x.qty+' × '+p.name+' ('+(p.sku||'')+') — '+shownPrice(p)});const msg='Jewellery order enquiry — '+(d.brand?.businessName||'Jewellery Store')+'\n'+lines.join('\n')+'\nPlease confirm current metal rates, making charges, final price and availability.';window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank','noopener')}
 });
 let currentSearch='',currentFilter='all';
 function applyFilters(filter=currentFilter){currentFilter=filter;let count=0;store.querySelectorAll('[data-aj-product]').forEach(card=>{const ok=(filter==='all'||(filter==='wishlist'?wishlist.includes(card.dataset.id):card.dataset.category===filter))&&(card.dataset.search||'').includes(currentSearch);card.hidden=!ok;if(ok)count++});const empty=store.querySelector('[data-aj-empty]');if(empty)empty.hidden=count>0}
 store.querySelector('[data-aj-search]')?.addEventListener('input',e=>{currentSearch=e.target.value.toLowerCase().trim();applyFilters()});
 const waOpen=(form,msg,noteSel)=>{const note=form.querySelector(noteSel);if(!wa){if(note)note.textContent='Please add the store WhatsApp number in the owner dashboard.';return}window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank','noopener');if(note)note.textContent='WhatsApp opened. Press Send there to submit your request.'};
 store.querySelector('[data-aj-appointment]')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),v=k=>String(f.get(k)||'').trim();if(!v('name')||!v('phone')||!v('date'))return;waOpen(e.currentTarget,'Showroom visit request — '+(d.brand?.businessName||'Jewellery Store')+'\nName: '+v('name')+'\nPhone: '+v('phone')+'\nPreferred date: '+v('date')+'\nPreferred time: '+v('time')+'\nInterested in: '+v('interest'),'[data-aj-appointment-note]')});
 store.querySelector('[data-aj-enquiry]')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),v=k=>String(f.get(k)||'').trim();waOpen(e.currentTarget,'Jewellery enquiry — '+(d.brand?.businessName||'Jewellery Store')+'\nName: '+v('name')+'\nPhone: '+v('phone')+'\nMessage: '+v('message'),'[data-aj-enquiry-note]')});
 drawCart();drawCounts();
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
