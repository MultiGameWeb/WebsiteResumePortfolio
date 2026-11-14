// Logo letters come from the customer's business name (not the demo name).
const scMark=(d,count,only)=>{const n=String((d&&d.brand&&d.brand.businessName)||'').trim();const words=n.split(/\s+/).filter(w=>/[\p{L}\p{N}]/u.test(w)&&!/^the$/i.test(w));const letters=words.map(w=>(Array.from(w.replace(/^[^\p{L}\p{N}]+/u,''))[0]||'').toUpperCase());const pick=letters.slice(0,count||2);if(pick.length<(count||2)&&words[0]){const extra=Array.from(words[0].replace(/^[^\p{L}\p{N}]+/u,'')).slice(1,2).join('').toUpperCase();if(count!==1&&extra&&pick.length===1)pick.push(extra)}const out=(only!=null?(pick[only]||''):pick.join(''));return out.replace(/[&<>"']/g,'')||'•'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{const x=String(v??'').trim();return /^(https?:\/\/|mailto:|tel:|#|\/|\.\/|\.\.\/|data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml);base64,)/i.test(x)?x:''};
const digits=v=>String(v??'').replace(/\D/g,'');
const list=a=>(Array.isArray(a)?a:[]).filter(x=>x&&x.enabled!==false);
const today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
function scPreUpiRender(d={},selected=[]){
 const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},ok=x=>selected.includes(x),show=id=>ok(id)&&s['show'+id.charAt(0).toUpperCase()+id.slice(1)]!==false,menu=list(d.menu),plans=list(d.mealPlans),catering=list(d.catering),services=list(d.services),areas=list(d.deliveryAreas),gallery=list(d.gallery),reviews=list(d.reviews),faqs=list(d.faqs),pol=d.policies||{},hy=d.hygiene||{};
 let out='<div class="kitchen-01" data-kitchen-site>';
 out+='<div class="kb-strip"><span>'+esc(b.tagline||'Fresh food, thoughtfully prepared')+'</span><span>DAILY MEALS · SUBSCRIPTIONS · CATERING</span></div>';
 out+='<header class="kb-header"><a class="kb-brand" href="#kb-home"><span class="kb-mark">'+scMark(d,1)+'<span>+</span></span><span><b>'+esc(b.businessName||'FreshBite Kitchen')+'</b><small>GOOD FOOD · EVERY DAY</small></span></a><nav>'+(show('menu')?'<a href="#kb-menu">Menu</a>':'')+(show('mealPlans')?'<a href="#kb-plans">Meal plans</a>':'')+(show('catering')?'<a href="#kb-catering">Catering</a>':'')+(show('about')?'<a href="#kb-about">About</a>':'')+(show('contact')?'<a href="#kb-contact">Contact</a>':'')+'</nav><div class="kb-head-actions">'+(show('whatsapp')&&c.whatsapp?'<a href="https://wa.me/'+digits(c.whatsapp)+'" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>':'')+(show('enquiry')?'<a class="kb-order-link" href="#kb-order">Order / Enquire</a>':'')+'</div></header>';
 if(show('home'))out+='<section class="kb-hero" id="kb-home"><div class="kb-hero-copy"><span class="kb-eyebrow">FRESH FROM OUR KITCHEN</span><h1>'+esc(h.title||'Good food, made for your everyday.')+'</h1><p>'+esc(h.text||'Freshly prepared meals, daily tiffins and catering for every gathering.')+'</p><div class="kb-hero-actions">'+(show('menu')?'<a class="kb-primary" href="#kb-menu">Explore today’s menu ↗</a>':'')+(show('catering')?'<a class="kb-secondary" href="#kb-catering">Bulk & event catering</a>':'')+'</div><div class="kb-hero-points"><span>01 · DAILY MEALS</span><span>02 · OFFICE & FAMILY PLANS</span><span>03 · EVENT CATERING</span></div></div><div class="kb-hero-image"><img src="'+esc(d.hero||'')+'" alt="'+esc(b.businessName||'Kitchen')+'"><div class="kb-image-stamp">MADE FRESH<br>MADE WITH CARE</div></div></section>';
 if(show('about'))out+='<section class="kb-about" id="kb-about"><div><span class="kb-eyebrow">OUR KITCHEN STORY</span><h2>Food that fits your day, and brings people together.</h2></div><div><p>'+esc(b.about||'We prepare fresh meals and food for gatherings.')+'</p>'+(b.chefName?'<small>Kitchen lead · '+esc(b.chefName)+'</small>':'')+(b.experience?'<small> · '+esc(b.experience)+' experience</small>':'')+'</div></section>';
 if(show('menu')&&menu.length){const cats=[...new Set(menu.map(x=>x.category||'Other'))];out+='<section class="kb-section kb-menu" id="kb-menu"><div class="kb-section-head"><div><span class="kb-eyebrow">WHAT’S COOKING</span><h2>Our food menu<span>.</span></h2><p>Choose your favourites, add them to your enquiry and tell us when you need them.</p></div>'+(show('menuSearch')?'<label class="kb-search"><span>⌕</span><input type="search" data-menu-search placeholder="Search dishes or ingredients" aria-label="Search food menu"></label>':'')+'</div>'+(show('menuSearch')?'<div class="kb-filters"><button class="active" type="button" data-menu-filter="all">All dishes</button>'+cats.map(x=>'<button type="button" data-menu-filter="'+esc(x.toLowerCase())+'">'+esc(x)+'</button>').join('')+'</div>':'')+'<div class="kb-menu-grid">'+menu.map(x=>'<article class="kb-dish" data-dish data-category="'+esc(String(x.category||'other').toLowerCase())+'" data-search="'+esc([x.name,x.category,x.foodType,x.description,x.allergens].join(' ').toLowerCase())+'"><div class="kb-dish-image"><img src="'+esc(safeUrl(x.image))+'" alt="'+esc(x.name)+'" loading="lazy">'+(x.featured?'<span>POPULAR</span>':'')+'</div><div class="kb-dish-copy"><small>'+esc(x.category||'MENU')+' · '+esc(x.foodType||'')+'</small><h3>'+esc(x.name||'Dish')+'</h3><p>'+esc(x.description||'')+'</p><div class="kb-dish-meta"><span>'+esc(x.serving||'Serving details on request')+'</span><span>'+esc(x.spice||'Spice level on request')+'</span></div>'+(x.allergens?'<p class="kb-allergen">Allergen note: '+esc(x.allergens)+'</p>':'')+'<div class="kb-dish-foot"><strong>'+esc(x.price||'Enquire')+' <small>'+esc(x.unit||'')+'</small></strong><button type="button" data-add-dish="'+esc(x.name)+'" '+(x.availability==='Sold out'?'disabled':'')+'>'+(x.availability==='Sold out'?'Sold out':'Add to enquiry +')+'</button></div><em class="kb-availability">'+esc(x.availability||'Confirm availability')+'</em></div></article>').join('')+'</div><p class="kb-empty" data-menu-empty hidden>No dishes match your search.</p><p class="kb-note">Menu, portion size and availability may change. Confirm ingredients, price and order acceptance with the kitchen.</p></section>'}
 if(show('mealPlans')&&plans.length)out+='<section class="kb-section kb-plans" id="kb-plans"><div class="kb-section-head"><div><span class="kb-eyebrow">EAT WELL, ON YOUR SCHEDULE</span><h2>Meal plans & subscriptions.</h2><p>Daily, weekly, monthly and custom meal arrangements.</p></div></div><div class="kb-plan-grid">'+plans.map(x=>'<article><small>'+esc(x.frequency||'PLAN')+'</small><h3>'+esc(x.name)+'</h3><strong>'+esc(x.price||'Ask for price')+'</strong><em>'+esc(x.unit||'')+'</em><p>'+esc(x.description||'')+'</p><div>'+esc(x.includes||'')+'</div><footer><span>'+esc(x.foodType||'Custom food preference')+'</span><button type="button" data-plan="'+esc(x.name)+'">Ask about plan ↗</button></footer></article>').join('')+'</div></section>';
 if(show('catering')&&catering.length)out+='<section class="kb-catering" id="kb-catering"><div class="kb-section-head"><div><span class="kb-eyebrow">FOR TEAMS, PARTIES & EVENTS</span><h2>Bulk orders & catering.</h2><p>Meal boxes and event menus planned around your guest count and occasion.</p></div></div><div class="kb-catering-grid">'+catering.map(x=>'<article><small>'+esc(x.guestRange||'CUSTOM QUANTITY')+' · '+esc(x.foodType||'')+'</small><h3>'+esc(x.name)+'</h3><strong>'+esc(x.price||'Custom quotation')+'</strong><p>'+esc(x.description||'')+'</p><div>'+esc(x.includes||'')+'</div><button type="button" data-catering="'+esc(x.name)+'">Request catering quote ↗</button></article>').join('')+'</div></section>';
 if(show('services')&&services.length)out+='<section class="kb-section kb-services"><div class="kb-section-head"><div><span class="kb-eyebrow">HOW WE CAN HELP</span><h2>Food services for every occasion.</h2></div></div><div class="kb-service-grid">'+services.map(x=>'<article><span>'+esc(x.icon||'✦')+'</span><h3>'+esc(x.name)+'</h3><p>'+esc(x.description||'')+'</p></article>').join('')+'</div></section>';
 if(show('delivery')&&areas.length)out+='<section class="kb-delivery"><div><span class="kb-eyebrow">DELIVERY & SERVICE AREAS</span><h2>Good food, closer to you.</h2><p>'+esc(c.deliveryNote||'Ask us to check your location before ordering.')+'</p></div><div class="kb-area-grid">'+areas.map(x=>'<article><b>'+esc(x.area)+'</b><span>Minimum '+esc(x.minimum||'Confirm')+'</span><span>Delivery '+esc(x.fee||'Confirm')+'</span><small>'+esc(x.time||'Timing on confirmation')+'</small></article>').join('')+'</div></section>';
 if(show('hygiene'))out+='<section class="kb-hygiene"><div><span class="kb-eyebrow">CARE IN EVERY STEP</span><h2>Kitchen care & food safety.</h2><p>'+esc(hy.statement||'Ask us about our food preparation and safety practices.')+'</p></div><div><b>Our kitchen practices</b><p>'+esc(hy.standards||'Add kitchen hygiene and handling details.')+'</p>'+(hy.licence?'<small>Food licence: '+esc(hy.licence)+'</small>':'')+'</div></section>';
 if(show('gallery')&&gallery.length)out+='<section class="kb-section kb-gallery"><div class="kb-section-head"><div><span class="kb-eyebrow">FROM OUR KITCHEN</span><h2>Food, freshness & gatherings.</h2></div></div><div class="kb-gallery-grid">'+gallery.map(x=>'<figure><img src="'+esc(safeUrl(x.image))+'" alt="'+esc(x.title||'Food')+'" loading="lazy"><figcaption>'+esc(x.title||'')+'</figcaption></figure>').join('')+'</div></section>';
 if(show('reviews')&&reviews.length)out+='<section class="kb-reviews"><div class="kb-section-head"><div><span class="kb-eyebrow">KIND WORDS</span><h2>What customers say.</h2></div></div><div class="kb-review-grid">'+reviews.map(x=>'<article><b>'+('★'.repeat(Math.max(0,Math.min(5,Number(x.rating)||0))))+'</b><p>“'+esc(x.text||'')+'”</p><strong>'+esc(x.name||'Customer')+'</strong></article>').join('')+'</div></section>';
 if(show('faq')&&faqs.length)out+='<section class="kb-section kb-faq"><span class="kb-eyebrow">GOOD TO KNOW</span><h2>Frequently asked questions.</h2><div>'+faqs.map(x=>'<details><summary>'+esc(x.question)+'</summary><p>'+esc(x.answer)+'</p></details>').join('')+'</div></section>';
 if(show('policies'))out+='<section class="kb-section kb-policies"><div class="kb-section-head"><div><span class="kb-eyebrow">ORDER INFORMATION</span><h2>Please check before ordering.</h2></div></div><div class="kb-policy-grid">'+[['Order lead time',pol.order],['Delivery',pol.delivery],['Payment',pol.payment],['Cancellations',pol.refund],['Allergens',pol.allergy]].filter(x=>x[1]).map(x=>'<article><b>'+esc(x[0])+'</b><p>'+esc(x[1])+'</p></article>').join('')+'</div></section>';
 if(show('enquiry'))out+='<section class="kb-order" id="kb-order"><div class="kb-order-copy"><span class="kb-eyebrow">PLACE AN ENQUIRY</span><h2>Tell us what you’re hungry for.</h2><p>Share your food choices, date and delivery details. We’ll confirm the menu, quantity and final total before accepting the order.</p><div class="kb-order-steps"><span>01 · Choose meals or service</span><span>02 · Share delivery / event details</span><span>03 · Kitchen confirms the order</span></div>'+(show('contact')&&c.phone?'<a href="tel:'+esc(String(c.phone).replace(/[^\d+]/g,''))+'">Call the kitchen · '+esc(c.phone)+'</a>':'')+'</div><form class="kb-form" data-food-form><div class="kb-form-title"><small>FOOD ORDER & SERVICE ENQUIRY</small><b>Let’s get the details right.</b></div><div class="kb-form-grid"><label>Your name<input name="name" required autocomplete="name" placeholder="Full name"></label><label>Phone number<input name="phone" required type="tel" autocomplete="tel" placeholder="+91"></label><label>Email<input name="email" type="email" placeholder="you@example.com"></label><label>Service needed<select name="orderType"><option>Daily meal / tiffin</option><option>Meal subscription</option><option>Office / corporate meals</option><option>Party / event catering</option><option>Bulk meal boxes</option><option>Custom food order</option></select></label><label>Required date<input name="date" type="date" data-food-date required></label><label>Preferred time<input name="time" type="time"></label><label>Quantity / guests<input name="quantity" type="number" min="1" required placeholder="e.g. 25"></label><label>Food preference<select name="foodPreference"><option>Vegetarian</option><option>Non-vegetarian</option><option>Both</option><option>Vegan</option><option>Custom / discuss</option></select></label><label>Delivery area / pincode<input name="deliveryArea" placeholder="Area or pincode"></label><label>Budget<input name="budget" placeholder="Approximate budget"></label><label class="kb-full">Selected dishes / meal plan<textarea name="items" rows="3" placeholder="Add dishes, meal plan or menu requirements"></textarea></label><label class="kb-full">Delivery address / event venue<textarea name="address" rows="2" placeholder="Full address and landmark"></textarea></label><label class="kb-full">Allergies / special requirements<textarea name="message" rows="2" placeholder="Allergies, dietary needs, delivery instructions or event details"></textarea></label></div><button class="kb-submit" type="submit">'+esc(d.enquiry?.buttonText||'Send food enquiry')+' <span>↗</span></button><small class="kb-form-note">This is an enquiry, not an accepted order or paid transaction. The kitchen will confirm availability, allergens, delivery and final pricing.</small><p class="kb-feedback" data-food-feedback aria-live="polite"></p></form></section>';
 if(show('location'))out+='<section class="kb-location"><div><span class="kb-eyebrow">FIND OUR KITCHEN</span><h2>Made here. Shared with you.</h2><p>'+esc(c.address||'Add kitchen address in the owner dashboard.')+'</p><p>'+esc(c.hoursText||'Contact us for ordering hours.')+'</p>'+(c.maps&&/^https?:\/\//i.test(c.maps)?'<a href="'+esc(c.maps)+'" target="_blank" rel="noopener noreferrer">Get directions ↗</a>':'')+'</div><div class="kb-location-card"><span>FRESHBITE KITCHEN</span><b>GOOD FOOD<br>GOOD DAYS.</b><small>'+esc(b.kitchenType||'FOOD SERVICES')+'</small></div></section>';
 if(show('contact'))out+='<section class="kb-contact" id="kb-contact"><div><span class="kb-eyebrow">SAY HELLO</span><h2>Talk to our kitchen team.</h2><p>'+esc(c.address||'')+'</p><p>'+esc(c.hoursText||'')+'</p></div><div class="kb-contact-links">'+(c.phone?'<a href="tel:'+esc(String(c.phone).replace(/[^\d+]/g,''))+'">Call ↗ '+esc(c.phone)+'</a>':'')+(show('whatsapp')&&c.whatsapp?'<a href="https://wa.me/'+digits(c.whatsapp)+'" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>':'')+(c.email?'<a href="mailto:'+esc(c.email)+'">Email ↗</a>':'')+'</div></section>';
 if(show('social'))out+='<div class="kb-social">'+[['Instagram',d.social?.instagram],['Facebook',d.social?.facebook],['YouTube',d.social?.youtube]].filter(x=>x[1]&&/^https?:\/\//i.test(x[1])).map(x=>'<a href="'+esc(x[1])+'" target="_blank" rel="noopener noreferrer">'+x[0]+' ↗</a>').join('')+'</div>';
 out+='<footer class="kb-footer"><div><b>'+esc(b.businessName||'FreshBite Kitchen')+'</b><span>'+esc(b.tagline||'Freshly prepared. Thoughtfully delivered.')+'</span></div><small>© '+new Date().getFullYear()+' '+esc(b.businessName||'FreshBite Kitchen')+'. All rights reserved.</small></footer></div>';
 return out;
}
function scPreUpiInit(root,d={},selected=[]){scMobileNav(arguments[0]);
 const site=root.querySelector('[data-kitchen-site]');if(!site)return;
 let filter='all',query='';
 const apply=()=>{let count=0;site.querySelectorAll('[data-dish]').forEach(card=>{const show=(filter==='all'||card.dataset.category===filter)&&(card.dataset.search||'').includes(query);card.hidden=!show;if(show)count++});const empty=site.querySelector('[data-menu-empty]');if(empty)empty.hidden=count>0};
 site.querySelector('[data-menu-search]')?.addEventListener('input',e=>{query=e.target.value.toLowerCase().trim();apply()});
 site.addEventListener('click',e=>{const f=e.target.closest('[data-menu-filter]'),dish=e.target.closest('[data-add-dish]'),plan=e.target.closest('[data-plan]'),cat=e.target.closest('[data-catering]');if(f){filter=f.dataset.menuFilter;site.querySelectorAll('[data-menu-filter]').forEach(x=>x.classList.toggle('active',x===f));apply()}if(dish||plan||cat){const input=site.querySelector('[name="items"]');if(input){const value=dish?dish.dataset.addDish:plan?'Meal plan: '+plan.dataset.plan:'Catering package: '+cat.dataset.catering;input.value=[input.value,value].filter(Boolean).join('\n');}site.querySelector('#kb-order')?.scrollIntoView({behavior:'smooth'})}});
 const form=site.querySelector('[data-food-form]');
 if(form){const date=form.querySelector('[data-food-date]');date.min=today();form.addEventListener('submit',e=>{e.preventDefault();const v=k=>String(new FormData(form).get(k)||'').trim(),dateValue=v('date'),notice=form.querySelector('[data-food-feedback]');if(dateValue<today()){notice.textContent='Please choose a date from today onwards.';return}
 const lead={id:'food-'+Date.now(),createdAt:new Date().toISOString(),status:'New',name:v('name'),phone:v('phone'),email:v('email'),orderType:v('orderType'),date:dateValue,time:v('time'),quantity:v('quantity'),foodPreference:v('foodPreference'),deliveryArea:v('deliveryArea'),budget:v('budget'),items:v('items'),address:v('address'),message:v('message')};
 try{const key='sitecraft:kitchen-01',current=JSON.parse(localStorage.getItem(key)||'null')||JSON.parse(JSON.stringify(d||{}));current.leads=Array.isArray(current.leads)?current.leads:[];current.leads.unshift(lead);localStorage.setItem(key,JSON.stringify(current));if(window.Store)Store.update({templateId:'kitchen-01',data:current});notice.textContent='Thank you. Your enquiry has been saved in this browser. Please send the WhatsApp message to contact our kitchen.'}catch{notice.textContent='We could not save the enquiry here. Please contact the kitchen directly.'}
 const wa=selected.includes('whatsapp')?digits(d.contact?.whatsapp):'';if(wa){const msg='FOOD ORDER / CATERING ENQUIRY — '+(d.brand?.businessName||'Kitchen')+'\n\nName: '+lead.name+'\nPhone: '+lead.phone+'\nEmail: '+lead.email+'\nService: '+lead.orderType+'\nDate: '+lead.date+'\nTime: '+lead.time+'\nQuantity / guests: '+lead.quantity+'\nFood preference: '+lead.foodPreference+'\nDelivery area: '+lead.deliveryArea+'\nBudget: '+lead.budget+'\nDishes / plan: '+lead.items+'\nAddress / venue: '+lead.address+'\nSpecial requirements: '+lead.message+'\n\nPlease confirm menu, availability, allergens, delivery and final price.';window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank','noopener')}
 });}
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
function scBaseRender(d={},selected=[]){return scPay(scPreUpiRender(d,selected),d,selected);}
export function init(root,...rest){const r=scPreUpiInit(root,...rest);try{scBindPay(root);}catch(e){}return r;}

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
export function render(d={},selected=[]){return scConnect(scBaseRender(d,selected),d,selected);}
