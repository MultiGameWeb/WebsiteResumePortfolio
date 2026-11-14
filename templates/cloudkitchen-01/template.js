// Logo letters come from the customer's business name (not the demo name).
const scMark=(d,count,only)=>{const n=String((d&&d.brand&&d.brand.businessName)||'').trim();const words=n.split(/\s+/).filter(w=>/[\p{L}\p{N}]/u.test(w)&&!/^the$/i.test(w));const letters=words.map(w=>(Array.from(w.replace(/^[^\p{L}\p{N}]+/u,''))[0]||'').toUpperCase());const pick=letters.slice(0,count||2);if(pick.length<(count||2)&&words[0]){const extra=Array.from(words[0].replace(/^[^\p{L}\p{N}]+/u,'')).slice(1,2).join('').toUpperCase();if(count!==1&&extra&&pick.length===1)pick.push(extra)}const out=(only!=null?(pick[only]||''):pick.join(''));return out.replace(/[&<>"']/g,'')||'•'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=v=>String(v??'').replace(/[^0-9]/g,'');
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const money=(cur,n)=>esc(cur||'₹')+new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(Math.max(0,num(n)));
const list=v=>Array.isArray(v)?v.filter(x=>x&&x.enabled!==false):[];
function scBaseRender(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},cake=d.cake||{},del=d.delivery||{},party=d.party||{},os=d.orderSettings||{},ok=x=>selected.includes(x);
  const menu=list(d.menu),offers=list(d.offers),gallery=list(d.gallery),reviews=list(d.reviews),services=list(d.services),hygiene=list(d.hygiene),faq=list(d.faq),hours=list(d.hours),slots=list(del.slots),partyPackages=list(party.packages),bases=list(cake.bases),sizes=list(cake.sizes),fillings=list(cake.fillings),toppings=list(cake.toppings);
  const cats=[...new Set(menu.map(x=>x.category).filter(Boolean))];
  let html='<div class="site-preview cloudkitchen-01">';
  html+='<header class="ck-nav"><a class="ck-brand" href="#home"><span class="ck-mark">'+scMark(d,2)+'</span><span><strong>'+esc(b.businessName||"Your Kitchen")+'</strong><small>'+esc(b.tagline||"DIRECT ORDERS · FRESHLY MADE")+'</small></span></a><nav>';
  if(ok('home'))html+='<a href="#home">Home</a>';
  if(ok('menu'))html+='<a href="#menu">Menu</a>';
  if(ok('cake'))html+='<a href="#cake">Custom Cake</a>';
  if(ok('delivery'))html+='<a href="#delivery">Delivery</a>';
  if(ok('party'))html+='<a href="#party">Party Orders</a>';
  if(ok('order'))html+='<a href="#order">Order</a>';
  html+='</nav><div class="ck-nav-actions">'+(ok('whatsapp')&&c.whatsapp?'<a class="ck-mini ck-wa" target="_blank" href="https://wa.me/'+safe(c.whatsapp)+'">WhatsApp</a>':'')+'<a class="template-admin-link" href="admin.html?template=cloudkitchen-01">Admin</a></div></header>';

  if(ok('home')&&s.showHome!==false)html+='<section id="home" class="ck-hero"><div class="ck-hero-copy"><span class="ck-kicker">DIRECT FROM OUR KITCHEN</span><h1>'+esc(h.title||"Your cravings. Delivered direct.")+'</h1><p>'+esc(h.text||"Fresh food and celebration bakes, ordered directly.")+'</p><div class="ck-actions">'+(ok('order')?'<a class="ck-btn solid" href="#order">Start an order <span>↗</span></a>':'')+(ok('cake')?'<a class="ck-btn light" href="#cake">Build a cake <span>＋</span></a>':'')+'</div><div class="ck-hero-note"><span>DIRECT ORDER</span><strong>No marketplace detour.</strong></div></div><div class="ck-hero-media">'+(d.heroVideo?'<video autoplay muted loop playsinline poster="'+esc(d.hero||'')+'"><source src="'+esc(d.heroVideo)+'" type="video/mp4"></video>':'<img src="'+esc(d.hero||'')+'" alt="'+esc(b.businessName||"Kitchen")+'">')+'<div class="ck-hero-chip"><span>FRESH</span><strong>Made to order</strong></div></div></section>';

  if(ok('menu')&&s.showMenu!==false)html+='<section id="menu" class="ck-section"><div class="ck-head split"><div><span class="ck-kicker">TODAY’S MENU</span><h2>Good food, straight from the kitchen.</h2></div><p>Browse by category, add items to your cart and continue to the direct-order form.</p></div><div class="ck-cat-row"><button class="ck-cat active" data-menu-cat="all">All</button>'+cats.map(x=>'<button class="ck-cat" data-menu-cat="'+esc(x)+'">'+esc(x)+'</button>').join('')+'</div><div class="ck-menu-grid" id="ckMenuGrid">'+menu.map(x=>'<article class="ck-menu-card" data-category="'+esc(x.category||'')+'"><img src="'+esc(x.image||'')+'" alt="'+esc(x.name||'Menu item')+'"><div class="ck-menu-body"><div class="ck-menu-meta"><span>'+esc(x.category||'')+'</span><span>'+esc(x.veg?'VEG':'NON-VEG')+'</span></div><h3>'+esc(x.name||'Item')+'</h3><p>'+esc(x.description||'')+'</p><div class="ck-menu-foot"><strong>'+money(os.currency||'₹',x.price||0)+'</strong><button class="ck-add" data-menu-id="'+esc(x.id)+'">Add to order ＋</button></div></div></article>').join('')+'</div></section>';

  if(ok('cake'))html+='<section id="cake" class="ck-section ck-cake"><div class="ck-head split"><div><span class="ck-kicker">CAKE CUSTOMIZER</span><h2>'+esc(cake.title||"Build your cake your way.")+'</h2></div><p>Choose size, base, filling and toppings. The live total updates before you add the cake to your order.</p></div><div class="ck-cake-grid"><div class="ck-cake-form"><label>Size<select id="ckCakeSize">'+sizes.map((x,i)=>'<option value="'+esc(x.id)+'" '+(i===1?'selected':'')+' data-price="'+num(x.price)+'">'+esc(x.name)+'</option>').join('')+'</select></label><label>Cake base<select id="ckCakeBase">'+bases.map((x,i)=>'<option value="'+esc(x.id)+'" '+(i===0?'selected':'')+' data-price="'+num(x.price)+'">'+esc(x.name)+' '+(x.price?'(+'+money(os.currency||'₹',x.price)+')':'')+'</option>').join('')+'</select></label><label>Filling<select id="ckCakeFilling">'+fillings.map((x,i)=>'<option value="'+esc(x.id)+'" '+(i===0?'selected':'')+' data-price="'+num(x.price)+'">'+esc(x.name)+' '+(x.price?'(+'+money(os.currency||'₹',x.price)+')':'')+'</option>').join('')+'</select></label><div><span class="ck-label">Toppings / add-ons</span><div class="ck-option-grid">'+toppings.map(x=>'<label class="ck-option"><input class="ckCakeTop" type="checkbox" value="'+esc(x.id)+'" data-price="'+num(x.price)+'"><span>✓</span><strong>'+esc(x.name)+'</strong><small>'+(x.price?'+ '+money(os.currency||'₹',x.price):'Included')+'</small></label>').join('')+'</div></div><label>Cake message<input id="ckCakeMessage" maxlength="60" placeholder="Happy Birthday!"></label><div class="ck-cake-result"><span>Estimated cake price</span><strong id="ckCakeTotal">'+money(os.currency||'₹',0)+'</strong><button class="ck-btn solid" type="button" id="ckAddCake">Add custom cake to order <span>＋</span></button></div></div><div class="ck-cake-visual"><img src="'+esc((gallery[0]?.image)||d.hero||'')+'" alt="Custom cake"><div><span>Custom</span><strong>Made for your occasion.</strong><p>Pricing is indicative until the kitchen confirms the exact design, weight, topper and delivery details.</p></div></div></div></section>';

  if(ok('delivery')&&s.showDelivery!==false)html+='<section id="delivery" class="ck-section ck-delivery"><div class="ck-head split"><div><span class="ck-kicker">DELIVERY</span><h2>Choose a slot that works for you.</h2></div><p>'+esc(del.sameDayNote||"Delivery availability depends on slot capacity and area.")+'<br>'+esc(del.deliveryFeeText||c.deliveryArea||"Delivery fee confirmed by area.")+'</p></div><div class="ck-delivery-grid"><div><span class="ck-label">Available slots</span><div class="ck-slot-grid">'+slots.map(x=>'<button type="button" class="ck-slot" data-slot="'+esc(x.label)+'">'+esc(x.label)+'</button>').join('')+'</div></div><div class="ck-area-card"><span>DELIVERY AREA</span><strong>'+esc(c.deliveryArea||"Contact us to confirm delivery to your area.")+'</strong><p></p></div></div></section>';

  if(ok('party')&&s.showParty!==false)html+='<section id="party" class="ck-section ck-party"><div class="ck-head split"><div><span class="ck-kicker">PARTY & BULK ORDERS</span><h2>From family celebrations to office gatherings.</h2></div><p>'+esc(party.leadTimeText||"Share your guest count and requirements for a tailored order.")+'</p></div><div class="ck-party-grid">'+partyPackages.map((x,i)=>'<article><span>0'+(i+1)+'</span><h3>'+esc(x.name||"Party order")+'</h3><strong>'+esc(x.guests||"Custom")+' guests</strong><p>'+esc(x.note||"")+'</p><a class="ck-link" href="#order" data-party="'+esc(x.name||'')+'">Plan this order ↗</a></article>').join('')+'</div><div class="ck-capacity"><span>CAPACITY</span><strong>'+esc(party.capacityText||"Party orders welcome")+'</strong></div></section>';

  if(ok('order')&&s.showOrder!==false)html+='<section id="order" class="ck-section ck-order"><div class="ck-head split"><div><span class="ck-kicker">DIRECT ORDER</span><h2>Your order, one message away.</h2></div><p>Items added above appear in your live cart. Choose delivery details and send the confirmed request directly to the kitchen.</p></div><div class="ck-order-grid"><aside class="ck-cart"><div class="ck-cart-head"><strong>Your order</strong><span id="ckCartCount">0 items</span></div><div id="ckCartItems" class="ck-cart-items"><div class="ck-empty-cart">Add menu items or a custom cake to start.</div></div><div class="ck-cart-total"><span>Total</span><strong id="ckCartTotal">'+money(os.currency||'₹',0)+'</strong></div></aside><form id="ckOrderForm" class="ck-form"><div class="ck-form-grid"><label>Name<input name="name" required placeholder="Your name"></label><label>Phone<input name="phone" required type="tel" placeholder="+91"></label><label>Email<input name="email" type="email" placeholder="you@example.com"></label><label>Order type<select name="orderType" id="ckOrderType"><option>Regular Order</option><option>Custom Cake</option><option>Party / Bulk Order</option></select></label><label>Delivery / Pickup Date<input name="deliveryDate" type="date"></label><label>Delivery Slot<select name="deliverySlot" id="ckDeliverySlot"><option value="">Choose a slot</option>'+slots.map(x=>'<option>'+esc(x.label)+'</option>').join('')+'</select></label><label class="full">Delivery / Pickup Location<input name="location" required placeholder="Area, landmark, full address"></label><label>Party Guests<input name="partyGuests" type="number" min="0" placeholder="e.g. 40"></label><label>Preferred contact<select name="contactMode"><option>WhatsApp</option><option>Call</option></select></label></div><label>Order / Message<textarea name="message" id="ckOrderMessage" placeholder="Special instructions, cake message, delivery notes, etc."></textarea></label><div class="ck-form-foot"><span id="ckOrderNotice" class="ck-notice"></span><button class="ck-btn solid" type="submit">Send order to kitchen <span>↗</span></button></div></form></div></section>';

  if(ok('offers')&&s.showOffers!==false)html+='<section class="ck-section ck-offers"><div class="ck-head"><span class="ck-kicker">OFFERS</span><h2>Make your order a little more rewarding.</h2></div><div class="ck-offer-grid">'+offers.map(x=>'<article><span>✦</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.text||'')+'</p></article>').join('')+'</div></section>';

  if(ok('services')&&s.showServices!==false)html+='<section class="ck-section ck-services"><div class="ck-head"><span class="ck-kicker">WHAT WE MAKE</span><h2>More than a menu — made for everyday and celebrations.</h2></div><div class="ck-service-grid">'+services.map((x,i)=>'<article><span class="ck-service-icon">'+esc(x.icon||"•")+'</span><small>0'+(i+1)+'</small><h3>'+esc(x.name)+'</h3><p>'+esc(x.description||'')+'</p></article>').join('')+'</div></section>';

  if(ok('gallery')&&s.showGallery!==false)html+='<section class="ck-section"><div class="ck-head split"><div><span class="ck-kicker">FROM THE KITCHEN</span><h2>See what is coming out fresh.</h2></div><p></p></div><div class="ck-gallery">'+gallery.map(x=>'<figure><img src="'+esc(x.image||'')+'" alt="'+esc(x.title||'')+'"><figcaption>'+esc(x.title||'')+'</figcaption></figure>').join('')+'</div></section>';

  if(ok('reviews')&&s.showReviews!==false)html+='<section class="ck-section ck-reviews"><div class="ck-head"><span class="ck-kicker">CUSTOMER NOTES</span><h2>What direct-order customers say.</h2></div><div class="ck-review-grid">'+reviews.map(x=>'<article>'+(x.image?'<img src="'+esc(x.image)+'" alt="'+esc(x.name||'Customer')+'">':'')+'<div class="ck-stars">'+('★'.repeat(Math.max(1,Math.min(5,num(x.rating)||5))))+'</div><p>“'+esc(x.text||'')+'”</p><strong>'+esc(x.name||'Customer')+'</strong></article>').join('')+'</div></section>';

  if(ok('about')&&s.showAbout!==false)html+='<section class="ck-section ck-about"><div class="ck-head split"><div><span class="ck-kicker">ABOUT THE KITCHEN</span><h2>Small-batch thinking, direct communication.</h2></div><p>'+esc(b.about||"Tell customers how the kitchen started and what you care about.")+'</p></div><div class="ck-about-stats">'+(d.aboutStats||[]).filter(x=>x.enabled!==false).map(x=>'<div><strong>'+esc(x.value||'')+'</strong><span>'+esc(x.label||'')+'</span></div>').join('')+'</div></section>';

  if(ok('hygiene')&&s.showHygiene!==false)html+='<section class="ck-section ck-hygiene"><div class="ck-head split"><div><span class="ck-kicker">KITCHEN TRUST</span><h2>Show the standards behind the food.</h2></div><p>Ask us about our kitchen hygiene, food registration, ingredients and packaging.</p></div><div class="ck-hygiene-grid">'+hygiene.map(x=>'<article><span>✓</span><h3>'+esc(x.title||'Trust')+'</h3><p>'+esc(x.text||'')+'</p></article>').join('')+'</div></section>';

  if(ok('faq')&&s.showFAQ!==false)html+='<section class="ck-section"><div class="ck-head"><span class="ck-kicker">FAQ</span><h2>Before you place the order.</h2></div><div class="ck-faq">'+faq.map(x=>'<details><summary>'+esc(x.question||"Question")+'<span>+</span></summary><p>'+esc(x.answer||"")+'</p></details>').join('')+'</div></section>';

  if(ok('hours')||ok('location')||ok('social'))html+='<section class="ck-section ck-contact"><div class="ck-contact-grid"><div>'+((ok('location'))?'<span class="ck-kicker">PICKUP / KITCHEN</span><h2>'+esc(b.businessName||"Your Kitchen")+'</h2><p>'+esc(c.address||"Add pickup address here.")+'</p>':'')+(ok('hours')?'<p class="ck-contact-hours">'+esc(c.hoursText||"See opening hours below.")+'</p>':'')+(ok('call')&&c.phone?'<a class="ck-link" href="tel:'+safe(c.phone)+'">Call '+esc(c.phone)+' ↗</a>':'')+'</div>'+(ok('location')&&c.maps?'<a class="ck-map-card" target="_blank" href="'+esc(c.maps)+'"><span>OPEN MAP</span><strong>Get pickup directions ↗</strong><small>'+esc(c.deliveryArea||"View service area")+'</small></a>':'')+'</div></section>';

  if(ok('hours'))html+='<section class="ck-section ck-hours"><div class="ck-head split"><div><span class="ck-kicker">OPENING HOURS</span><h2>Order while the kitchen is open.</h2></div></div><div class="ck-hours-list">'+hours.map(x=>'<div><strong>'+esc(x.day||"Day")+'</strong><span>'+esc(x.enabled!==false?(x.open||"")+" — "+(x.close||""):"Closed")+'</span></div>').join('')+'</div></section>';

  if(ok('social')&&s.showSocial!==false)html+='<section class="ck-section ck-social"><div><span class="ck-kicker">FOLLOW THE KITCHEN</span><h2>See new bakes, specials and behind-the-scenes updates.</h2></div><div class="ck-social-links">'+(c.instagram?'<a class="ck-btn light" target="_blank" href="'+esc(c.instagram)+'">Instagram ↗</a>':'')+(d.social?.facebook?'<a class="ck-btn light" target="_blank" href="'+esc(d.social.facebook)+'">Facebook ↗</a>':'')+(d.social?.youtube?'<a class="ck-btn light" target="_blank" href="'+esc(d.social.youtube)+'">YouTube ↗</a>':'')+'</div></section>';

  if(ok('terms')||ok('privacy'))html+='<section class="ck-legal">'+(ok('terms')?'<details><summary>Terms & Order Policy</summary><p>'+esc(d.termsText||'')+'</p></details>':'')+(ok('privacy')?'<details><summary>Privacy Policy</summary><p>'+esc(d.privacyPolicy||'')+'</p></details>':'')+'</section>';

  html+='<footer class="ck-footer"><div><strong>'+esc(b.businessName||"Your Kitchen")+'</strong><span>'+esc(b.tagline||"")+'</span></div><div>'+(c.phone?'<a href="tel:'+safe(c.phone)+'">Call</a>':'')+(ok('whatsapp')&&c.whatsapp?'<a target="_blank" href="https://wa.me/'+safe(c.whatsapp)+'">WhatsApp</a>':'')+(c.email?'<a href="mailto:'+esc(c.email)+'">Email</a>':'')+'</div></footer>';
  if(ok('whatsapp')&&c.whatsapp)html+='<a class="ck-float-wa" target="_blank" href="https://wa.me/'+safe(c.whatsapp)+'">WhatsApp ↗</a>';
  html+='</div>';
  return html;
}
function scPreUpiInit(root,d={}){scMobileNav(arguments[0]);
  const menu=list(d.menu),slots=list(d.delivery?.slots),currency=d.orderSettings?.currency||'₹';
  let cart=[];
  const moneyLocal=n=>currency+new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(Math.max(0,num(n)));
  const renderCart=()=>{
    const box=root.querySelector('#ckCartItems'),count=root.querySelector('#ckCartCount'),totalEl=root.querySelector('#ckCartTotal');
    const total=cart.reduce((s,x)=>s+x.price*x.qty,0);
    if(count)count.textContent=cart.reduce((s,x)=>s+x.qty,0)+' item'+(cart.reduce((s,x)=>s+x.qty,0)===1?'':'s');
    if(totalEl)totalEl.textContent=moneyLocal(total);
    if(box)box.innerHTML=cart.length?cart.map((x,i)=>'<div class="ck-cart-item"><div><strong>'+esc(x.name)+'</strong><small>'+esc(x.meta||"")+'</small></div><div class="ck-cart-actions"><button type="button" data-cart-dec="'+i+'">−</button><span>'+x.qty+'</span><button type="button" data-cart-inc="'+i+'">+</button><strong>'+moneyLocal(x.price*x.qty)+'</strong><button class="ck-remove" type="button" data-cart-del="'+i+'">×</button></div></div>').join(''):'<div class="ck-empty-cart">Add menu items or a custom cake to start.</div>';
    box?.querySelectorAll('[data-cart-inc]').forEach(b=>b.onclick=()=>{cart[Number(b.dataset.cartInc)].qty++;renderCart()});
    box?.querySelectorAll('[data-cart-dec]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.cartDec);cart[i].qty=Math.max(0,cart[i].qty-1);if(!cart[i].qty)cart.splice(i,1);renderCart()});
    box?.querySelectorAll('[data-cart-del]').forEach(b=>{b.onclick=()=>{cart.splice(Number(b.dataset.cartDel),1);renderCart()}});
  };
  root.querySelectorAll('.ck-add').forEach(b=>b.onclick=()=>{const x=menu.find(m=>m.id===b.dataset.menuId);if(!x)return;const found=cart.find(i=>i.id===x.id);if(found)found.qty++;else cart.push({id:x.id,name:x.name,price:num(x.price),qty:1,meta:x.category||"Menu item"});renderCart();root.querySelector('#order')?.scrollIntoView({behavior:'smooth'})});
  root.querySelectorAll('[data-menu-cat]').forEach(b=>b.onclick=()=>{root.querySelectorAll('.ck-cat').forEach(x=>x.classList.remove('active'));b.classList.add('active');const cat=b.dataset.menuCat;root.querySelectorAll('.ck-menu-card').forEach(card=>card.hidden=cat!=='all'&&card.dataset.category!==cat)});
  const getSelectedPrice=id=>{const s=root.querySelector(id);return num(s?.selectedOptions?.[0]?.dataset?.price||0)};
  const updateCake=()=>{
    const total=getSelectedPrice('#ckCakeSize')+getSelectedPrice('#ckCakeBase')+getSelectedPrice('#ckCakeFilling')+[...root.querySelectorAll('.ckCakeTop:checked')].reduce((s,x)=>s+num(x.dataset.price),0);
    const out=root.querySelector('#ckCakeTotal');if(out)out.textContent=moneyLocal(total);
  };
  ['#ckCakeSize','#ckCakeBase','#ckCakeFilling'].forEach(sel=>root.querySelector(sel)?.addEventListener('change',updateCake));
  root.querySelectorAll('.ckCakeTop').forEach(x=>x.addEventListener('change',updateCake));
  updateCake();
  root.querySelector('#ckAddCake')?.addEventListener('click',()=>{
    const size=root.querySelector('#ckCakeSize')?.selectedOptions?.[0],base=root.querySelector('#ckCakeBase')?.selectedOptions?.[0],filling=root.querySelector('#ckCakeFilling')?.selectedOptions?.[0];
    const tops=[...root.querySelectorAll('.ckCakeTop:checked')].map(x=>x.parentElement?.querySelector('strong')?.textContent||'').filter(Boolean);
    const message=root.querySelector('#ckCakeMessage')?.value||'';
    const price=getSelectedPrice('#ckCakeSize')+getSelectedPrice('#ckCakeBase')+getSelectedPrice('#ckCakeFilling')+[...root.querySelectorAll('.ckCakeTop:checked')].reduce((s,x)=>s+num(x.dataset.price),0);
    cart.push({id:'cake-'+Date.now(),name:'Custom Cake · '+(size?.textContent||''),price,qty:1,meta:[base?.textContent?.trim(),filling?.textContent?.trim(),tops.join(', '),message?'Message: '+message:''].filter(Boolean).join(' · ')});
    renderCart();root.querySelector('#order')?.scrollIntoView({behavior:'smooth'})
  });
  root.querySelectorAll('.ck-slot').forEach(b=>b.onclick=()=>{root.querySelectorAll('.ck-slot').forEach(x=>x.classList.remove('active'));b.classList.add('active');const s=root.querySelector('#ckDeliverySlot');if(s){s.value=b.dataset.slot;s.dispatchEvent(new Event('change'))}});
  root.querySelectorAll('[data-party]').forEach(b=>b.onclick=()=>{const f=root.querySelector('#ckOrderType');if(f){f.value='Party / Bulk Order';f.dispatchEvent(new Event('change'))}root.querySelector('#ckOrder')?.scrollIntoView?.({behavior:'smooth'})});
  const form=root.querySelector('#ckOrderForm');
  if(form)form.addEventListener('submit',ev=>{
    ev.preventDefault();
    if(!cart.length){const n=root.querySelector('#ckOrderNotice');if(n)n.textContent='Add at least one item or custom cake before sending the order.';return}
    const fd=new FormData(form),lead=Object.fromEntries(fd.entries());
    const total=cart.reduce((s,x)=>s+x.price*x.qty,0);
    lead.total=moneyLocal(total);lead.items=cart.map(x=>({name:x.name,qty:x.qty,price:x.price,meta:x.meta}));lead.status='New';lead.createdAt=new Date().toISOString();
    try{const state=Store.read(),data=structuredClone(state.data||d||{});data.leads=Array.isArray(data.leads)?data.leads:[];data.leads.unshift(lead);Store.update({data});const n=root.querySelector('#ckOrderNotice');if(n)n.textContent='Thanks! Please send the WhatsApp message that opened to place your order. If it did not open, please call us.';form.reset()}catch{const n=root.querySelector('#ckOrderNotice');if(n)n.textContent='Could not save the order in this browser.'}
    const wa=d.contact?.whatsapp;
    if(wa){const itemText=cart.map(x=>x.qty+'× '+x.name+' — '+moneyLocal(x.price*x.qty)+(x.meta?' ('+x.meta+')':'')).join('\n');const msg=['Direct order',lead.name,lead.phone,lead.location,lead.deliveryDate,lead.deliverySlot,'Order type: '+lead.orderType,'Party guests: '+lead.partyGuests,'Total: '+lead.total,itemText,lead.message].filter(Boolean).join('\n');window.open('https://wa.me/'+safe(wa)+'?text='+encodeURIComponent(msg),'_blank')}
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
export function render(d={},selected=[]){const h=scSeoBaseRender(d,selected);try{if(typeof window!=="undefined"&&window.SiteCraftPack&&window.SiteCraftPack.seo)window.SiteCraftPack.seo(d,"Cloud Kitchen & Home Bakers")}catch(e){}return h}
