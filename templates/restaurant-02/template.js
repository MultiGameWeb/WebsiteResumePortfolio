const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=v=>{const x=String(v??'').trim();return /^(https?:|tel:|mailto:|data:image\/)/i.test(x)||/^[\w./-]+$/.test(x)?x:''};
const num=v=>{const m=String(v??'').match(/\d[\d,]*(?:\.\d+)?/),n=m?parseFloat(m[0].replace(/,/g,'')):NaN;return Number.isFinite(n)?n:0};
const safe=v=>String(v??'').replace(/\D/g,'');
const money=v=>{const n=Number(v);return Number.isFinite(n)?'₹'+n.toLocaleString('en-IN'):String(v??'')};
function scBaseRender(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},ok=x=>selected.includes(x);
  const menu=(d.menu||[]).filter(x=>x.enabled!==false);
  const offers=(d.offers||[]).filter(x=>x.enabled!==false);
  const reviews=(d.reviews||[]).filter(x=>x.enabled!==false),hours=d.hours||[];
  const faqs=(d.faqs||[]).filter(x=>x.enabled!==false);
  return `<div class="site-preview restaurant-02">
    <header class="rp2-nav">
      <a class="rp2-brand" href="#top"><strong>${esc(b.businessName||'Your Restaurant')}</strong><small>${esc(b.tagline||'')}</small></a>
      <nav>${ok('menu')?'<a href="#menu">Menu</a>':''}${ok('offers')?'<a href="#offers">Offers</a>':''}${ok('reservation')?'<a href="#book">Book</a>':''}${ok('hours')?'<a href="#hours">Hours</a>':''}${ok('faq')&&faqs.length?'<a href="#faq">FAQ</a>':''}${ok('contact')?'<a href="#contact">Contact</a>':''}</nav>
      <div class="rp2-nav-actions">${ok('onlineOrder')?'<a class="rp2-cart-link" href="#cart">Cart <span data-cart-count>0</span></a>':''}<a class="template-admin-link" href="admin.html?template=restaurant-02">Admin</a></div>
    </header>
    ${ok('home')?`<section id="top" class="rp2-hero"><div class="rp2-hero-bg"></div><div class="rp2-hero-card"><span class="rp2-chip">GOOD FOOD · GOOD MOOD</span><small>${esc(b.ownerName||'KITCHEN TEAM')}</small><h1>${esc(h.title||'Eat bright. Order easy.')}</h1><p>${esc(h.text||'')}</p><div class="rp2-actions"><a class="rp2-btn pop" href="#menu">See the menu <i>→</i></a>${ok('reservation')?'<a class="rp2-btn light" href="#book">Book a table</a>':''}</div></div><div class="rp2-hero-photo"><img src="${esc(url(d.hero))}" alt=""></div></section>`:''}
    ${ok('about')&&s.showAbout!==false?`<section id="about" class="rp2-section rp2-about"><div class="rp2-kicker">OUR KITCHEN</div><div class="rp2-split"><h2>${esc(b.about||'')}</h2><div><span class="rp2-sticker">FRESH<br>DAILY</span><p>Easy to order, easy to share and made for busy city days.</p></div></div></section>`:''}
    ${ok('menu')&&s.showMenu!==false&&menu.length?`<section id="menu" class="rp2-section rp2-menu"><div class="rp2-heading"><div><div class="rp2-kicker">THE MENU</div><h2>Pick. Tap. Enjoy.</h2></div><p>Choose your favourites and send the order straight to WhatsApp.</p></div><div class="rp2-menu-grid">${menu.map((x,i)=>`<article class="rp2-dish" data-dish-id="${esc(x.id)}" data-price="${num(x.price)}" data-name="${esc(x.name)}"><div class="dish-image"><img src="${esc(url(x.image||d.hero))}" alt="${esc(x.name)}"><span class="dish-no">0${i+1}</span></div><div class="dish-info"><span class="dish-cat">${esc(x.category||'')}</span><h3>${esc(x.name)}</h3><p>${esc(x.description||'')}</p><div class="dish-bottom"><strong>${esc(money(num(x.price)))}</strong>${ok('onlineOrder')?'<button class="rp2-add" type="button" data-add-dish>+ Add</button>':''}</div></div></article>`).join('')}</div></section>`:''}
    ${ok('offers')&&s.showOffers!==false?`<section id="offers" class="rp2-section rp2-offers"><div class="rp2-kicker">TODAY'S GOOD IDEA</div><h2>Specials worth sharing.</h2><div class="rp2-offer-grid">${offers.map(x=>`<article><span>✦</span><div><h3>${esc(x.title)}</h3><p>${esc(x.text||'')}</p></div></article>`).join('')}</div></section>`:''}
    ${ok('reviews')&&s.showReviews!==false?`<section class="rp2-section rp2-reviews"><div class="rp2-kicker">GUEST NOTES</div><h2>People came hungry.<br>They left smiling.</h2><div class="rp2-review-grid">${reviews.map(x=>`<article><b>${'★'.repeat(Number(x.rating)||0)}</b><p>“${esc(x.text||'')}”</p><strong>${esc(x.name||'Guest')}</strong></article>`).join('')}</div></section>`:''}
    ${ok('social')&&s.showSocial!==false?`<section class='rp2-section rp2-social'><div><div class='rp2-kicker'>SOCIAL + REVIEWS</div><h2>More from our table.</h2><p>Follow along and see what guests are saying.</p></div><div class='rp2-actions'>${c.instagram?`<a class='rp2-btn pop' target='_blank' href='${esc(url(c.instagram))}'>Instagram ↗</a>`:''}${c.googleReviews?`<a class='rp2-btn light' target='_blank' href='${esc(url(c.googleReviews))}'><strong>${'★'.repeat(Math.max(0,Math.min(5,Math.round(Number(c.googleRating)||0))))}</strong> Google Reviews ↗</a>`:''}</div></section>`:''}
    ${ok('hours')&&s.showHours!==false?`<section id='hours' class='rp2-section rp2-hours'><div class='rp2-kicker'>OPENING HOURS</div><h2>Plan your visit.</h2><div class='hours-list'>${hours.map(x=>`<div class='hours-row'><strong>${esc(x.day||'Day')}</strong><span>${x.enabled!==false?esc(x.open||'')+' — '+esc(x.close||''):'Closed'}</span></div>`).join('')}</div></section>`:''}
    ${ok('reservation')&&s.showReservation!==false?`<section id="book" class="rp2-section rp2-book"><div><div class="rp2-kicker">TABLE BOOKING</div><h2>Your table is a WhatsApp away.</h2><p>Pick a date, time and guest count. We'll send the request to the restaurant on WhatsApp.</p></div><form id="bookingForm" class="rp2-book-form"><input name="name" placeholder="Your name" required><input name="date" type="date" aria-label="Date" required><input name="time" type="time" aria-label="Time" required><input name="guests" type="number" min="1" max="50" value="2" aria-label="Number of guests" required><button class="rp2-btn pop" type="submit">Book via WhatsApp <i>↗</i></button></form></section>`:''}
    ${ok('faq')&&faqs.length?`<section id="faq" class="rp2-section rp2-faq"><div class="rp2-kicker">Good to know</div><h2>Questions before you visit</h2><div class="rp2-faq-list">${faqs.map(x=>`<details><summary>${esc(x.question||'Question')}</summary><p>${esc(x.answer||'')}</p></details>`).join('')}</div></section>`:''}
    ${ok('contact')&&s.showContact!==false?`<section id="contact" class="rp2-section rp2-contact"><div><div class="rp2-kicker">FIND US</div><h2>${esc(b.businessName||'Your Restaurant')}</h2><p>${esc(c.address||'')}</p></div><div class="rp2-actions">${c.maps&&ok('location')?'<a class="rp2-btn dark" target="_blank" href="'+esc(c.maps)+'">Directions</a>':''}${c.phone?'<a class="rp2-btn light" href="tel:'+esc(c.phone)+'">Call</a>':''}</div></section>`:''}
    ${ok('onlineOrder')?`<aside id="cart" class="rp2-cart" data-cart><div class="cart-head"><div><div class="rp2-kicker">YOUR ORDER</div><h3>WhatsApp cart</h3></div><button type="button" class="cart-close" data-cart-close>×</button></div><div data-cart-items class="cart-items"><p>Your cart is empty.</p></div><div class="cart-total"><span>Total</span><strong data-cart-total>₹0</strong></div><button type="button" class="rp2-btn pop full" data-whatsapp-order>Order on WhatsApp <i>↗</i></button></aside>`:''}
    <footer class="rp2-footer"><strong>${esc(b.businessName||'Your Restaurant')}</strong><span>${esc(b.tagline||'')}</span><a class="template-admin-link" href="admin.html?template=restaurant-02">Admin</a></footer>
  </div>`;
}
function scPreUpiInit(root,d={},selected=[]){scMobileNav(arguments[0]);
  const c=d.contact||{}, menu=(d.menu||[]).filter(x=>x.enabled!==false), ok=x=>selected.includes(x);
  const cart={}; const money=v=>'₹'+Number(v||0).toLocaleString('en-IN');
  const countEl=root.querySelector('[data-cart-count]'),itemsEl=root.querySelector('[data-cart-items]'),totalEl=root.querySelector('[data-cart-total]'),cartEl=root.querySelector('[data-cart]');
  const sync=()=>{const items=Object.values(cart),count=items.reduce((n,x)=>n+x.qty,0),total=items.reduce((n,x)=>n+x.qty*x.price,0);if(countEl)countEl.textContent=count;if(totalEl)totalEl.textContent=money(total);if(itemsEl)itemsEl.innerHTML=items.length?items.map(x=>`<div class="cart-row"><span><strong>${esc(x.name)}</strong><small>${x.qty} × ${money(x.price)}</small></span><div><button type="button" data-cart-minus="${esc(x.id)}">−</button><b>${x.qty}</b><button type="button" data-cart-plus="${esc(x.id)}">+</button></div></div>`).join(''):'<p>Your cart is empty.</p>'};
  root.querySelectorAll('[data-add-dish]').forEach(btn=>btn.addEventListener('click',()=>{const card=btn.closest('[data-dish-id]'),id=card?.dataset.dishId,x=menu.find(i=>i.id===id);if(!x)return;cart[id]=cart[id]||{id,name:x.name,price:num(x.price),qty:0};cart[id].qty++;btn.textContent='Added ✓';setTimeout(()=>btn.textContent='+ Add',700);sync()}));
  root.querySelectorAll('.rp2-cart-link').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();cartEl?.classList.toggle('open')}));
  root.addEventListener('click',e=>{const minus=e.target.closest('[data-cart-minus]'),plus=e.target.closest('[data-cart-plus]'),close=e.target.closest('[data-cart-close]');if(minus){const id=minus.dataset.cartMinus;if(cart[id])cart[id].qty--;if(cart[id]?.qty<=0)delete cart[id];sync()}if(plus){const id=plus.dataset.cartPlus;if(cart[id])cart[id].qty++;sync()}if(close)cartEl?.classList.remove('open')});
  root.querySelector('[data-whatsapp-order]')?.addEventListener('click',()=>{const items=Object.values(cart),total=items.reduce((n,x)=>n+x.qty*x.price,0);if(!items.length){alert('Please add at least one item to your cart.');return}const lines=items.map(x=>x.qty+' × '+x.name+' — '+money(x.qty*x.price));if(!safe(c.whatsapp)){alert('This option is not available right now. Please call the business directly.');return}const text='Hello '+(d.brand?.businessName||'Restaurant')+'!\n\nOrder:\n'+lines.join('\n')+'\n\nTotal: '+money(total);window.open('https://wa.me/'+safe(c.whatsapp)+'?text='+encodeURIComponent(text),'_blank')});
  root.querySelector('#bookingForm')?.addEventListener('submit',e=>{e.preventDefault();if(!safe(c.whatsapp)){alert('Table booking is not available right now. Please call the restaurant'+(c.phone?' on '+c.phone:'')+'.');return}const f=new FormData(e.currentTarget),text='Hello '+(d.brand?.businessName||'Restaurant')+'!\n\nTable booking request:\nName: '+f.get('name')+'\nDate: '+f.get('date')+'\nTime: '+f.get('time')+'\nGuests: '+f.get('guests');window.open('https://wa.me/'+safe(c.whatsapp)+'?text='+encodeURIComponent(text),'_blank')});
  const dateEl=root.querySelector('#bookingForm [name=date]');if(dateEl){const n=new Date(),m=new Date(n.getTime()-n.getTimezoneOffset()*60000).toISOString().slice(0,10);dateEl.min=m}
  sync();
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
export function render(d={},selected=[]){return scPay(scPreUpiRender(d,selected),d,selected);}
export function init(root,...rest){const r=scPreUpiInit(root,...rest);try{scBindPay(root);}catch(e){}return r;}
