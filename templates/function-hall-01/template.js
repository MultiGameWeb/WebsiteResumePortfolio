const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{const x=String(v??'').trim();return /^(https?:\/\/|mailto:|tel:|#|\/|\.\/|\.\.\/|data:image\/(?:png|jpeg|jpg|webp|gif|svg\+xml);base64,)/i.test(x)?x:''};
const digits=v=>String(v??'').replace(/\D/g,'');
const list=a=>(Array.isArray(a)?a:[]).filter(x=>x&&x.enabled!==false);
const today=()=>{const d=new Date();return new Date(d.getTime()-d.getTimezoneOffset()*60000).toISOString().slice(0,10)};
const dateFmt=x=>{if(!x)return'';const d=new Date(x+'T00:00:00');return Number.isNaN(d.getTime())?esc(x):d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})};
function scPreUpiRender(d={},selected=[]){
 const b=d.brand||{},h=d.home||{},v=d.venue||{},c=d.contact||{},s=d.settings||{},p=d.policies||{},ok=x=>selected.includes(x),show=id=>ok(id)&&s['show'+id.charAt(0).toUpperCase()+id.slice(1)]!==false;
 const halls=list(d.halls),events=list(d.events),plans=list(d.packages),facilities=list(d.facilities),dining=list(d.dining),addons=list(d.addons),dates=list(d.availability),gallery=list(d.gallery),reviews=list(d.reviews),faqs=list(d.faqs);
 let out='<div class="function-hall-01" data-function-hall>';
 out+='<div class="fh-strip"><span>'+esc(b.tagline||'A welcoming place for every family occasion')+'</span><span>FUNCTION HALLS · KALYANA MANDAPAM · CELEBRATIONS</span></div>';
 out+='<header class="fh-header"><a class="fh-brand" href="#fh-home"><span class="fh-symbol">శ్రీ</span><span><b>'+esc(b.businessName||'Sri Lakshmi Function Halls')+'</b><small>FAMILY FUNCTIONS · TRADITIONS · TOGETHERNESS</small></span></a><nav>'+(show('halls')?'<a href="#fh-halls">Our halls</a>':'')+(show('packages')?'<a href="#fh-packages">Rentals</a>':'')+(show('facilities')?'<a href="#fh-facilities">Facilities</a>':'')+(show('gallery')?'<a href="#fh-gallery">Gallery</a>':'')+(show('contact')?'<a href="#fh-contact">Contact</a>':'')+'</nav><div class="fh-actions">'+(show('whatsapp')&&c.whatsapp?'<a href="https://wa.me/'+digits(c.whatsapp)+'" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>':'')+(show('enquiry')?'<a class="fh-book" href="#fh-enquiry">Enquire now</a>':'')+'</div></header>';
 if(show('home'))out+='<section class="fh-hero" id="fh-home"><img src="'+esc(safeUrl(h.image||d.hero))+'" alt="'+esc(b.businessName||'Function hall')+'" class="fh-hero-img"><div class="fh-overlay"></div><div class="fh-hero-copy"><span class="fh-eyebrow">A PLACE FOR YOUR SPECIAL DAY</span><h1>'+esc(h.title||'Your family’s occasion deserves the right place.')+'</h1><p>'+esc(h.text||'Comfortable halls, practical facilities and a team to help with your arrangements.')+'</p><div class="fh-hero-cta">'+(show('halls')?'<a class="fh-light-btn" href="#fh-halls">Explore function halls ↗</a>':'')+(show('enquiry')?'<a class="fh-outline-btn" href="#fh-enquiry">Check date & timing</a>':'')+'</div><div class="fh-hero-stats"><span><b>'+esc(b.experience||'')+'</b><small>EXPERIENCE</small></span><i></i><span><b>'+esc(b.eventsHosted||'')+'</b><small>FUNCTIONS HOSTED</small></span><i></i><span><b>'+halls.length+'</b><small>VENUE SPACES</small></span></div></div><div class="fh-hero-note">MUHURTHAM · CELEBRATIONS · FAMILY</div></section>';
 if(show('about'))out+='<section class="fh-about"><div><span class="fh-eyebrow">WELCOME TO '+esc(b.businessName||'OUR FUNCTION HALL').toUpperCase()+'</span><h2>A familiar place for the moments your family remembers.</h2></div><p>'+esc(b.about||'A comfortable venue for traditional ceremonies and gatherings.')+'</p></section>';
 if(show('halls')&&halls.length){const cats=[...new Set(halls.map(x=>x.hallType||'Function hall'))];out+='<section class="fh-section" id="fh-halls"><div class="fh-section-head"><div><span class="fh-eyebrow">CHOOSE YOUR SPACE</span><h2>Our function halls<span>.</span></h2><p>Compare capacity, layout, dining facilities and rental slots.</p></div>'+(show('hallSearch')?'<label class="fh-search"><span>⌕</span><input type="search" data-hall-search placeholder="Search by name or guest count" aria-label="Search function halls"></label>':'')+'</div>'+(show('hallSearch')?'<div class="fh-filters"><button type="button" class="active" data-hall-filter="all">All halls</button>'+cats.map(x=>'<button type="button" data-hall-filter="'+esc(x.toLowerCase())+'">'+esc(x)+'</button>').join('')+'</div>':'')+'<div class="fh-hall-grid">'+halls.map(x=>'<article class="fh-hall-card" data-fh-card data-type="'+esc(String(x.hallType||'function hall').toLowerCase())+'" data-search="'+esc([x.name,x.hallType,x.capacityMin,x.capacityMax,x.seating,x.description].join(' ').toLowerCase())+'"><div class="fh-hall-image"><img src="'+esc(safeUrl(x.image))+'" alt="'+esc(x.name)+'" loading="lazy"><span>'+esc(x.status||'Enquire for availability')+'</span></div><div class="fh-hall-copy"><small>'+esc(x.hallType||'FUNCTION HALL')+'</small><h3>'+esc(x.name)+'</h3><p>'+esc(x.description||'')+'</p><div class="fh-capacity"><div><b>'+esc(x.capacityMin||'—')+'–'+esc(x.capacityMax||'—')+'</b><small>GUEST CAPACITY</small></div><div><b>'+esc(x.area||'Ask venue')+'</b><small>HALL AREA</small></div></div><div class="fh-detail-grid">'+[['Seating',x.seating],['Dining',x.dining],['Rooms',x.rooms],['Parking',x.parking],['Stage',x.stage],['Rental slot',x.slot]].filter(z=>z[1]).map(z=>'<span><b>'+esc(z[0])+'</b>'+esc(z[1])+'</span>').join('')+'</div><div class="fh-hall-foot"><strong>'+esc(x.rental||'Enquire for rental')+'</strong><button type="button" data-pick-hall="'+esc(x.name)+'" '+(x.status==='Not accepting enquiries'?'disabled':'')+'>Enquire about this hall ↗</button></div></div></article>').join('')+'</div><p class="fh-empty" data-hall-empty hidden>No halls match your search.</p><p class="fh-note">Guest capacities and rental rates are indicative. Confirm hall layout, timing, facilities and final quotation with the venue.</p></section>'}
 if(show('events')&&events.length)out+='<section class="fh-events"><div class="fh-section-head"><div><span class="fh-eyebrow">OCCASIONS WE WELCOME</span><h2>For traditions, milestones & gatherings.</h2></div></div><div class="fh-event-grid">'+events.map(x=>'<article><span>'+esc(x.icon||'✦')+'</span><h3>'+esc(x.name)+'</h3><p>'+esc(x.description||'')+'</p><button type="button" data-pick-event="'+esc(x.name)+'">Plan this function ↗</button></article>').join('')+'</div></section>';
 if(show('packages')&&plans.length)out+='<section class="fh-section fh-packages" id="fh-packages"><div class="fh-section-head"><div><span class="fh-eyebrow">BOOKING OPTIONS</span><h2>Hall rental plans<span>.</span></h2><p>Half-day, full-day, evening and multi-day arrangements.</p></div></div><div class="fh-package-grid">'+plans.map((x,i)=>'<article><small>0'+(i+1)+' · VENUE RENTAL</small><h3>'+esc(x.name)+'</h3><strong>'+esc(x.price||'Ask for quote')+'</strong><em>'+esc(x.duration||'')+'</em><p>'+esc(x.description||'')+'</p><div class="fh-package-foot"><span>'+esc(x.guests||'Guest count by hall')+'</span><button type="button" data-pick-package="'+esc(x.name)+'">Choose plan ↗</button></div><ul>'+String(x.includes||'').split(',').map(z=>z.trim()).filter(Boolean).map(z=>'<li>✓ '+esc(z)+'</li>').join('')+'</ul></article>').join('')+'</div><p class="fh-note">Rental rates and inclusions are indicative. Taxes, deposit, cleaning, overtime, setup and additional services are confirmed in the written quotation.</p></section>';
 if(show('facilities')&&facilities.length)out+='<section class="fh-facilities" id="fh-facilities"><div class="fh-section-head"><div><span class="fh-eyebrow">VENUE FACILITIES</span><h2>Comfort for hosts & guests.</h2></div></div><div class="fh-facility-grid">'+facilities.map(x=>'<article><span>'+esc(x.icon||'✦')+'</span><div><h3>'+esc(x.name)+'</h3><p>'+esc(x.description||'')+'</p></div></article>').join('')+'</div><div class="fh-facility-extra">'+[['Parking',v.parking],['Power backup',v.power]].filter(x=>x[1]).map(x=>'<span><b>'+esc(x[0])+'</b>'+esc(x[1])+'</span>').join('')+'</div></section>';
 if(show('dining')&&dining.length)out+='<section class="fh-section fh-dining"><div class="fh-section-head"><div><span class="fh-eyebrow">FOOD & DINING</span><h2>Dining arrangements for your guests.</h2></div></div><div class="fh-dining-grid">'+dining.map(x=>'<article><small>'+esc(x.status||'BY ENQUIRY')+'</small><h3>'+esc(x.name)+'</h3><p>'+esc(x.details||'')+'</p></article>').join('')+'</div></section>';
 if(show('addons')&&addons.length)out+='<section class="fh-section fh-addons"><div class="fh-section-head"><div><span class="fh-eyebrow">OPTIONAL ARRANGEMENTS</span><h2>Plan the finishing touches.</h2></div></div><div class="fh-addon-grid">'+addons.map(x=>'<article><b>'+esc(x.name)+'</b><p>'+esc(x.description||'')+'</p></article>').join('')+'</div></section>';
 if(show('availability')&&dates.length)out+='<section class="fh-availability"><div class="fh-section-head"><div><span class="fh-eyebrow">DATE & TIME SLOTS</span><h2>Check selected date updates.</h2><p>Choose a listed date to add it to your booking enquiry.</p></div></div><div class="fh-date-grid">'+dates.map(x=>'<button type="button" data-date="'+esc(x.date||'')+'" data-hall="'+esc(x.hall||'')+'" data-slot="'+esc(x.slot||'')+'" class="fh-date status-'+esc(String(x.status||'Enquiry').toLowerCase())+'"><b>'+dateFmt(x.date)+'</b><span>'+esc(x.hall||'All halls')+'</span><small>'+esc(x.slot||'')+' · '+esc(x.status||'')+'</small></button>').join('')+'</div><p class="fh-note">This is a manually maintained availability notice, not a live booking calendar. Confirm every date and slot directly with the manager.</p></section>';
 if(show('enquiry'))out+='<section class="fh-enquiry" id="fh-enquiry"><div class="fh-enquiry-copy"><span class="fh-eyebrow">START YOUR BOOKING ENQUIRY</span><h2>'+esc(d.enquiry?.heading||'Plan your function with us.')+'</h2><p>'+esc(d.enquiry?.text||'Share your event details and preferred venue.')+'</p><div class="fh-steps"><span>01 · Select a hall</span><span>02 · Share date & timing</span><span>03 · Arrange a site visit</span></div>'+(show('contact')&&c.phone?'<a href="tel:'+esc(String(c.phone).replace(/[^\d+]/g,''))+'">Call the venue · '+esc(c.phone)+'</a>':'')+'</div><form class="fh-form" data-function-form><small>FUNCTION HALL BOOKING / SITE VISIT</small><b>Tell us about your occasion.</b><div class="fh-form-grid"><label>Your name<input name="name" required placeholder="Full name"></label><label>Phone<input name="phone" type="tel" required placeholder="+91"></label><label>Email<input name="email" type="email" placeholder="you@example.com"></label><label>Function type<select name="eventType">'+events.map(x=>'<option>'+esc(x.name)+'</option>').join('')+'<option>Other</option></select></label><label>Event date<input type="date" name="eventDate" data-fh-date required></label><label>Muhurtham / start time<input type="time" name="time"></label><label>Preferred hall<select name="hall"><option value="Any suitable hall">Any suitable hall</option>'+halls.map(x=>'<option>'+esc(x.name)+'</option>').join('')+'</select></label><label>Time slot<select name="timeSlot"><option>Half day</option><option>Morning</option><option>Evening</option><option>Full day</option><option>Two days / multi-day</option></select></label><label>Expected guests<input type="number" name="guests" min="1" required placeholder="e.g. 300"></label><label>Rental package<select name="package"><option>Discuss / custom</option>'+plans.map(x=>'<option>'+esc(x.name)+'</option>').join('')+'</select></label><label>Dining / catering<select name="catering"><option>Discuss options</option><option>In-house catering</option><option>Outside caterer</option><option>Dining hall only</option><option>Not required</option></select></label><label>Decoration / add-ons<input name="decoration" placeholder="Stage, flowers, sound, LED..."></label><label class="fh-full">Budget range<input name="budget" placeholder="Approximate rental budget"></label><label class="fh-full">Special requirements<textarea name="message" rows="3" placeholder="Site visit, setup, rooms, parking or other requirements"></textarea></label></div><button class="fh-submit" type="submit">Send booking enquiry <span>↗</span></button><p class="fh-form-note">This is an enquiry only. Hall, date, slot and booking are confirmed only after written confirmation from the venue.</p><p data-fh-feedback class="fh-feedback" aria-live="polite"></p></form></section>';
 if(show('gallery')&&gallery.length)out+='<section class="fh-section fh-gallery" id="fh-gallery"><div class="fh-section-head"><div><span class="fh-eyebrow">VENUE & CELEBRATION PHOTOS</span><h2>A look around our spaces.</h2></div></div><div class="fh-gallery-grid">'+gallery.map(x=>'<figure><img src="'+esc(safeUrl(x.image))+'" alt="'+esc(x.title||'Function hall')+'" loading="lazy"><figcaption><b>'+esc(x.title||'')+'</b><small>'+esc(x.category||'')+'</small></figcaption></figure>').join('')+'</div></section>';
 if(show('reviews')&&reviews.length)out+='<section class="fh-reviews"><div class="fh-section-head"><div><span class="fh-eyebrow">GUEST EXPERIENCES</span><h2>What families say.</h2></div></div><div class="fh-review-grid">'+reviews.map(x=>'<article><b>'+('★'.repeat(Math.max(0,Math.min(5,Number(x.rating)||0))))+'</b><p>“'+esc(x.text||'')+'”</p><strong>'+esc(x.name||'Guest')+'</strong><small>'+esc(x.event||'Function')+'</small></article>').join('')+'</div></section>';
 if(show('faq')&&faqs.length)out+='<section class="fh-section fh-faq"><span class="fh-eyebrow">BEFORE YOU BOOK</span><h2>Frequently asked questions.</h2><div>'+faqs.map(x=>'<details><summary>'+esc(x.question)+'</summary><p>'+esc(x.answer)+'</p></details>').join('')+'</div></section>';
 if(show('policies'))out+='<section class="fh-section fh-policies"><div class="fh-section-head"><div><span class="fh-eyebrow">BOOKING INFORMATION</span><h2>Venue & booking policies.</h2></div></div><div class="fh-policy-grid">'+[['Advance & payment',p.advance],['Cancellation & date change',p.cancellation],['Timing & overtime',p.timing],['Catering & vendors',p.catering],['Decoration & safety',p.decor]].filter(x=>x[1]).map(x=>'<article><b>'+esc(x[0])+'</b><p>'+esc(x[1])+'</p></article>').join('')+'</div></section>';
 if(show('location'))out+='<section class="fh-location"><div><span class="fh-eyebrow">VISIT THE VENUE</span><h2>Come see the hall before you decide.</h2><p>'+esc(c.address||'Add venue address in the owner dashboard.')+'</p><p>'+esc(c.hours||'Call to arrange a site visit.')+'</p>'+(c.maps&&/^https?:\/\//i.test(c.maps)?'<a href="'+esc(c.maps)+'" target="_blank" rel="noopener noreferrer">Get directions ↗</a>':'')+'</div><div class="fh-map-card"><span>YOUR FAMILY FUNCTION</span><b>BEGINS HERE.</b><small>'+esc(v.type||'FUNCTION HALL')+'</small></div></section>';
 if(show('contact'))out+='<section class="fh-contact" id="fh-contact"><div><span class="fh-eyebrow">WE’RE HERE TO HELP</span><h2>Speak to the booking manager.</h2><p>'+esc(c.address||'')+'</p><p>'+esc(c.hours||'')+'</p></div><div class="fh-contact-links">'+(c.phone?'<a href="tel:'+esc(String(c.phone).replace(/[^\d+]/g,''))+'">Call ↗ '+esc(c.phone)+'</a>':'')+(show('whatsapp')&&c.whatsapp?'<a href="https://wa.me/'+digits(c.whatsapp)+'" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>':'')+(c.email?'<a href="mailto:'+esc(c.email)+'">Email ↗</a>':'')+'</div></section>';
 if(show('social'))out+='<div class="fh-social">'+[['Instagram',d.social?.instagram],['Facebook',d.social?.facebook]].filter(x=>x[1]&&/^https?:\/\//i.test(x[1])).map(x=>'<a href="'+esc(x[1])+'" target="_blank" rel="noopener noreferrer">'+x[0]+' ↗</a>').join('')+'</div>';
 out+='<footer class="fh-footer"><div><b>'+esc(b.businessName||'Sri Lakshmi Function Halls')+'</b><span>'+esc(b.tagline||'A welcoming place for your family’s special moments.')+'</span></div><small>© '+new Date().getFullYear()+' '+esc(b.businessName||'Sri Lakshmi Function Halls')+'. All rights reserved.</small></footer></div>';
 return out;
}
function scPreUpiInit(root,d={},selected=[]){scMobileNav(arguments[0]);
 const site=root.querySelector('[data-function-hall]');if(!site)return;
 let filter='all',query='';
 const apply=()=>{let count=0;site.querySelectorAll('[data-fh-card]').forEach(card=>{const show=(filter==='all'||card.dataset.type===filter)&&(card.dataset.search||'').includes(query);card.hidden=!show;if(show)count++});const empty=site.querySelector('[data-hall-empty]');if(empty)empty.hidden=count>0};
 site.querySelector('[data-hall-search]')?.addEventListener('input',e=>{query=e.target.value.toLowerCase().trim();apply()});
 site.addEventListener('click',e=>{const f=e.target.closest('[data-hall-filter]'),hall=e.target.closest('[data-pick-hall]'),event=e.target.closest('[data-pick-event]'),pkg=e.target.closest('[data-pick-package]'),dt=e.target.closest('[data-date]');if(f){filter=f.dataset.hallFilter;site.querySelectorAll('[data-hall-filter]').forEach(x=>x.classList.toggle('active',x===f));apply()}if(hall||event||pkg||dt){const form=site.querySelector('[data-function-form]');if(form){if(hall)form.elements.hall.value=hall.dataset.pickHall;if(event)form.elements.eventType.value=event.dataset.pickEvent;if(pkg)form.elements.package.value=pkg.dataset.pickPackage;if(dt){form.elements.eventDate.value=dt.dataset.date;form.elements.hall.value=dt.dataset.hall||form.elements.hall.value;form.elements.timeSlot.value=dt.dataset.slot||form.elements.timeSlot.value}}site.querySelector('#fh-enquiry')?.scrollIntoView({behavior:'smooth'})}});
 const form=site.querySelector('[data-function-form]');
 if(form){const date=form.querySelector('[data-fh-date]');date.min=today();form.addEventListener('submit',e=>{e.preventDefault();const v=k=>String(new FormData(form).get(k)||'').trim(),dateValue=v('eventDate'),notice=form.querySelector('[data-fh-feedback]');if(dateValue<today()){notice.textContent='Please select a date from today onwards.';return}
 const lead={id:'function-'+Date.now(),createdAt:new Date().toISOString(),status:'New',name:v('name'),phone:v('phone'),email:v('email'),eventType:v('eventType'),eventDate:dateValue,timeSlot:v('timeSlot'),time:v('time'),hall:v('hall'),guests:v('guests'),package:v('package'),catering:v('catering'),decoration:v('decoration'),budget:v('budget'),message:v('message')};
 try{const key='sitecraft:function-hall-01',current=JSON.parse(localStorage.getItem(key)||'null')||JSON.parse(JSON.stringify(d||{}));current.leads=Array.isArray(current.leads)?current.leads:[];current.leads.unshift(lead);localStorage.setItem(key,JSON.stringify(current));if(window.Store)Store.update({templateId:'function-hall-01',data:current});notice.textContent='Thank you. Your enquiry is saved in this browser. The venue team must confirm the hall, date and time slot.'}catch{notice.textContent='We could not save the enquiry here. Please contact the venue.'}
 const wa=selected.includes('whatsapp')?digits(d.contact?.whatsapp):'';if(wa){const msg='FUNCTION HALL ENQUIRY — '+(d.brand?.businessName||'Function Hall')+'\n\nName: '+lead.name+'\nPhone: '+lead.phone+'\nEmail: '+lead.email+'\nFunction: '+lead.eventType+'\nEvent date: '+lead.eventDate+'\nMuhurtham / start time: '+lead.time+'\nTime slot: '+lead.timeSlot+'\nHall: '+lead.hall+'\nGuests: '+lead.guests+'\nRental package: '+lead.package+'\nDining: '+lead.catering+'\nAdd-ons: '+lead.decoration+'\nBudget: '+lead.budget+'\nRequirements: '+lead.message+'\n\nPlease confirm hall, date, slot, rental and advance details.';window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank','noopener')}
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
