// Logo letters come from the customer's business name (not the demo name).
const scMark=(d,count,only)=>{const n=String((d&&d.brand&&d.brand.businessName)||'').trim();const words=n.split(/\s+/).filter(w=>/[\p{L}\p{N}]/u.test(w)&&!/^the$/i.test(w));const letters=words.map(w=>(Array.from(w.replace(/^[^\p{L}\p{N}]+/u,''))[0]||'').toUpperCase());const pick=letters.slice(0,count||2);if(pick.length<(count||2)&&words[0]){const extra=Array.from(words[0].replace(/^[^\p{L}\p{N}]+/u,'')).slice(1,2).join('').toUpperCase();if(count!==1&&extra&&pick.length===1)pick.push(extra)}const out=(only!=null?(pick[only]||''):pick.join(''));return out.replace(/[&<>"']/g,'')||'•'};
const CONFIG={id:'hotel-01',title:'The Stillwater Retreat'};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{const x=String(v??'').trim();return /^(https?:\/\/|data:image\/|\/|\.\/|\.\.\/)/i.test(x)?x:''};
const digits=v=>String(v??'').replace(/\D/g,'');
const list=v=>String(v??'').split(/[,;\n]/).map(x=>x.trim()).filter(Boolean);
const roomStatus=r=>String(r.availabilityStatus||'On request');
function scBaseRender(d={},selected=[]){
 const ok=id=>selected.includes(id),b=d.brand||{},h=d.home||{},p=d.property||{},c=d.contact||{},s=d.settings||{},pol=d.policies||{};
 const rooms=(d.rooms||[]).filter(x=>x.enabled!==false),amenities=(d.amenities||[]).filter(x=>x.enabled!==false),offers=(d.offers||[]).filter(x=>x.enabled!==false),gallery=(d.gallery||[]).filter(x=>x.enabled!==false),reviews=(d.reviews||[]).filter(x=>x.enabled!==false),faqs=(d.faqs||[]).filter(x=>x.enabled!==false);
 const roomCard=r=>'<article class="sr-room-card" data-room-card data-category="'+esc(String(r.category||'Other').toLowerCase())+'" data-search="'+esc([r.name,r.category,r.subtitle,r.description,r.bed,r.view,r.amenities].join(' ').toLowerCase())+'"><div class="sr-room-image"><img src="'+esc(safeUrl(r.image))+'" alt="'+esc(r.name||'Room')+'" loading="lazy"><span class="sr-status '+(roomStatus(r)==='Not accepting enquiries'?'closed':'')+'">'+esc(roomStatus(r))+'</span></div><div class="sr-room-copy"><span class="sr-kicker">'+esc(r.category||'ROOM')+'</span><h3>'+esc(r.name||'Guest room')+'</h3><p class="sr-room-sub">'+esc(r.subtitle||'A comfortable stay, thoughtfully prepared.')+'</p><div class="sr-room-meta"><span>♧ '+esc(r.bed||'Bed details on request')+'</span><span>♙ '+esc(r.maxGuests||'Occupancy on request')+'</span><span>▱ '+esc(r.area||'Room size on request')+'</span><span>⌁ '+esc(r.view||'View on request')+'</span></div><div class="sr-amenity-tags">'+list(r.amenities).slice(0,4).map(x=>'<span>'+esc(x)+'</span>').join('')+'</div><div class="sr-room-foot"><div><small>STARTING TARIFF / NIGHT</small><strong>'+esc(r.rate||'Enquire for tariff')+'</strong></div><button type="button" data-room-book="'+esc(r.name||'')+'" '+(roomStatus(r)==='Not accepting enquiries'?'disabled':'')+'>Enquire about room ↗</button></div></div></article>';
 let out='<div class="hotel-01" data-hotel>';
 out+='<div class="sr-topline"><span>'+esc(b.tagline||'A considered stay, a lasting memory.')+'</span><span>'+esc(p.propertyType||'HOTEL & RESORT')+' · '+esc(p.starCategory||'')+'</span></div>';
 out+='<header class="sr-header"><a class="sr-brand" href="#sr-home"><span class="sr-mark">'+scMark(d,1)+'</span><span><b>'+esc(b.businessName||CONFIG.title)+'</b><small>STAYS · EXPERIENCES · HOSPITALITY</small></span></a><nav>'+(ok('rooms')?'<a href="#sr-rooms">Rooms</a>':'')+(ok('amenities')?'<a href="#sr-amenities">Experiences</a>':'')+(ok('offers')?'<a href="#sr-offers">Offers</a>':'')+(ok('gallery')?'<a href="#sr-gallery">Gallery</a>':'')+(ok('contact')?'<a href="#sr-contact">Contact</a>':'')+'</nav><div class="sr-header-actions">'+(ok('whatsapp')&&c.whatsapp?'<a href="https://wa.me/'+digits(c.whatsapp)+'" target="_blank" rel="noopener noreferrer">WhatsApp ↗</a>':'')+(ok('bookingEnquiry')?'<a class="sr-book-link" href="#sr-booking">Enquire / Book</a>':'')+'</div></header>';
 if(ok('home'))out+='<section class="sr-hero" id="sr-home"><img class="sr-hero-photo" src="'+esc(safeUrl(d.hero))+'" alt="'+esc(b.businessName||'Hotel')+'"><div class="sr-hero-overlay"></div><div class="sr-hero-copy"><span class="sr-kicker">'+esc(p.propertyType||'A PLACE TO UNWIND')+' · '+esc(p.starCategory||'THOUGHTFUL HOSPITALITY')+'</span><h1>'+esc(h.title||'A quieter kind of escape.')+'</h1><p>'+esc(h.text||'Discover considered spaces and warm hospitality.')+'</p><div class="sr-hero-actions">'+(ok('rooms')?'<a href="#sr-rooms" class="sr-light-btn">Explore rooms <span>↗</span></a>':'')+(ok('bookingEnquiry')?'<a href="#sr-booking" class="sr-outline-light">Plan your stay</a>':'')+'</div><div class="sr-checkin-strip"><span><small>CHECK-IN</small><b>'+esc(p.checkInTime||'2:00 PM')+'</b></span><i></i><span><small>CHECK-OUT</small><b>'+esc(p.checkOutTime||'11:00 AM')+'</b></span><em>Thoughtful stays, from arrival to departure.</em></div></div></section>';
 if(ok('about')&&s.showAbout!==false)out+='<section class="sr-intro"><span class="sr-kicker">THE PROPERTY</span><h2>'+esc(b.businessName||CONFIG.title)+'</h2><p>'+esc(b.about||'A considered place to rest, reconnect and explore.')+'</p></section>';
 if(ok('rooms')){const cats=[...new Set(rooms.map(x=>String(x.category||'Other')))];out+='<section class="sr-section sr-rooms" id="sr-rooms"><div class="sr-section-head"><div><span class="sr-kicker">STAY YOUR WAY</span><h2>Rooms & suites</h2><p>Find the space that feels right for your stay.</p></div>'+(ok('roomSearch')?'<label class="sr-search"><span>⌕</span><input type="search" data-room-search placeholder="Search rooms, views or amenities" aria-label="Search rooms"></label>':'')+'</div>'+(ok('roomSearch')?'<div class="sr-filters"><button type="button" class="active" data-room-filter="all">All rooms</button>'+cats.map(x=>'<button type="button" data-room-filter="'+esc(x.toLowerCase())+'">'+esc(x)+'</button>').join('')+'</div>':'')+'<div class="sr-room-grid">'+rooms.map(roomCard).join('')+'</div><p class="sr-empty" data-room-empty hidden>No rooms match your search. Try another category.</p><p class="sr-availability-note">Room status is maintained by the property and is indicative only. Availability and final tariff are confirmed directly by the property.</p></section>'}
 if(ok('bookingEnquiry'))out+='<section class="sr-booking" id="sr-booking"><div class="sr-booking-copy"><span class="sr-kicker">YOUR STAY STARTS HERE</span><h2>Let us plan your stay.</h2><p>Share your preferred dates and guest details. Our team will respond to confirm availability, tariff and booking terms.</p><div class="sr-booking-assurance"><span>01 / Share your dates</span><span>02 / We check the request</span><span>03 / Property confirms directly</span></div></div><form class="sr-booking-form" data-booking-form><div class="sr-form-title"><small>STAY ENQUIRY</small><b>Request a room</b></div><div class="sr-form-grid"><label>Check-in date<input type="date" name="checkin" required></label><label>Check-out date<input type="date" name="checkout" required></label><label>Adults<select name="adults"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></label><label>Children<select name="children"><option selected>0</option><option>1</option><option>2</option><option>3</option><option>4</option></select></label><label class="sr-full">Preferred room<select name="room"><option value="Any suitable room">Any suitable room</option>'+rooms.map(r=>'<option>'+esc(r.name)+'</option>').join('')+'</select></label><label class="sr-full">Guest name<input name="guest" autocomplete="name" required placeholder="Your name"></label><label class="sr-full">Phone number<input type="tel" name="phone" autocomplete="tel" required placeholder="Your contact number"></label><label class="sr-full">Special requests<textarea name="notes" rows="2" placeholder="Arrival time, children ages or any special request"></textarea></label></div><button class="sr-submit" type="submit">Send stay enquiry <span>↗</span></button><small class="sr-form-note">This is a booking request, not an instant reservation. Your stay is confirmed only after the property contacts you.</small><p class="sr-form-feedback" data-booking-feedback aria-live="polite"></p></form></section>';
 if(ok('amenities')&&amenities.length)out+='<section class="sr-section sr-amenities" id="sr-amenities"><div class="sr-section-head"><div><span class="sr-kicker">THE EXPERIENCE</span><h2>Everything in its place.</h2><p>Little details that make a stay feel effortless.</p></div></div><div class="sr-amenity-grid">'+amenities.map(a=>'<article><span>'+esc(a.icon||'✦')+'</span><div><h3>'+esc(a.name||'Facility')+'</h3><p>'+esc(a.description||'')+'</p></div></article>').join('')+'</div></section>';
 if(ok('offers')&&offers.length)out+='<section class="sr-offers" id="sr-offers"><div class="sr-offer-heading"><span class="sr-kicker">MAKE IT A LITTLE MORE SPECIAL</span><h2>Stay offers & experiences</h2><p>Speak with us about experiences designed around your visit.</p></div><div class="sr-offer-grid">'+offers.map(o=>'<article><small>THE STILLWATER EDIT</small><h3>'+esc(o.title||'Stay experience')+'</h3><p>'+esc(o.description||'')+'</p><span>'+esc(o.details||'Ask the property for details.')+'</span></article>').join('')+'</div></section>';
 if(ok('gallery')&&s.showGallery!==false&&gallery.length)out+='<section class="sr-section sr-gallery" id="sr-gallery"><div class="sr-section-head"><div><span class="sr-kicker">A SENSE OF PLACE</span><h2>Moments around the property.</h2></div></div><div class="sr-gallery-grid">'+gallery.map(g=>'<figure><img src="'+esc(safeUrl(g.image))+'" alt="'+esc(g.title||'Property gallery')+'" loading="lazy"><figcaption>'+esc(g.title||'')+'</figcaption></figure>').join('')+'</div></section>';
 if(ok('reviews')&&s.showReviews!==false&&reviews.length)out+='<section class="sr-reviews"><span class="sr-kicker">KIND WORDS</span><h2>Memories worth sharing.</h2><div class="sr-review-grid">'+reviews.map(r=>'<article><b>'+('★'.repeat(Math.max(0,Math.min(5,Number(r.rating)||0))))+'</b><p>“'+esc(r.text||'')+'”</p><small>'+esc(r.name||'Guest')+'</small></article>').join('')+'</div></section>';
 if(ok('faq')&&s.showFAQ!==false&&faqs.length)out+='<section class="sr-section sr-faq"><span class="sr-kicker">GOOD TO KNOW</span><h2>Before your stay.</h2><div class="sr-faq-list">'+faqs.map(f=>'<details><summary>'+esc(f.question||'Question')+'</summary><p>'+esc(f.answer||'')+'</p></details>').join('')+'</div></section>';
 if(ok('location'))out+='<section class="sr-location"><div><span class="sr-kicker">FIND YOUR WAY HERE</span><h2>Come find us.</h2>'+(c.address?'<p>'+esc(c.address)+'</p>':'')+'<p>'+esc(c.hours||'Contact the property for front desk hours.')+'</p>'+(c.maps&&/^https?:\/\//i.test(c.maps)?'<a href="'+esc(c.maps)+'" target="_blank" rel="noopener noreferrer">Get directions ↗</a>':'')+'</div><div class="sr-location-art"><span>THE STILLWATER</span><b>STAY AWHILE</b><small>'+esc(p.propertyType||'HOSPITALITY')+'</small></div></section>';
 if(ok('policies')&&s.showPolicies!==false)out+='<section class="sr-section sr-policies"><span class="sr-kicker">A FEW DETAILS</span><h2>Stay information.</h2><div class="sr-policy-grid">'+[['Check-in & check-out',(p.checkInTime||'2:00 PM')+' / '+(p.checkOutTime||'11:00 AM')],['Cancellation',pol.cancellation],['Children & extra beds',pol.children],['Pets',pol.pets],['Additional information',pol.notes]].filter(x=>x[1]).map(x=>'<article><b>'+esc(x[0])+'</b><p>'+esc(x[1])+'</p></article>').join('')+'</div></section>';
 if(ok('contact'))out+='<section class="sr-contact" id="sr-contact"><div><span class="sr-kicker">WE WOULD LOVE TO WELCOME YOU</span><h2>Have a question?</h2><p>'+esc(c.address||'Contact our team for assistance with your stay.')+'</p><p>'+esc(c.hours||'')+'</p></div><div class="sr-contact-actions">'+((ok('call')||ok('contact'))&&c.phone?'<a href="tel:'+esc(String(c.phone).replace(/[^\d+]/g,''))+'">Call the property ↗</a>':'')+(ok('whatsapp')&&c.whatsapp?'<a target="_blank" rel="noopener noreferrer" href="https://wa.me/'+digits(c.whatsapp)+'">WhatsApp ↗</a>':'')+(c.email?'<a href="mailto:'+esc(c.email)+'">Email ↗</a>':'')+'</div></section>';
 if(ok('social')&&(d.social?.instagram||d.social?.facebook||d.social?.youtube))out+='<div class="sr-social">'+[['Instagram',d.social.instagram],['Facebook',d.social.facebook],['YouTube',d.social.youtube]].filter(x=>x[1]&&/^https?:\/\//i.test(x[1])).map(x=>'<a href="'+esc(x[1])+'" target="_blank" rel="noopener noreferrer">'+x[0]+' ↗</a>').join('')+'</div>';
 out+='<footer class="sr-footer"><div><b>'+esc(b.businessName||CONFIG.title)+'</b><span>'+esc(b.tagline||'A quieter kind of escape.')+'</span></div><small>© '+new Date().getFullYear()+' '+esc(b.businessName||CONFIG.title)+'. All rights reserved.</small></footer>';
 return out+'</div>';
}
function scPreUpiInit(root,d={},selected=[]){scMobileNav(arguments[0]);
 const site=root.querySelector('[data-hotel]');if(!site)return;
 let filter='all',search='';
 const apply=()=>{let count=0;site.querySelectorAll('[data-room-card]').forEach(card=>{const category=filter==='all'||card.dataset.category===filter,query=(card.dataset.search||'').includes(search);const show=category&&query;card.hidden=!show;if(show)count++});const empty=site.querySelector('[data-room-empty]');if(empty)empty.hidden=count>0};
 site.querySelector('[data-room-search]')?.addEventListener('input',e=>{search=e.target.value.toLowerCase().trim();apply()});
 site.addEventListener('click',e=>{const f=e.target.closest('[data-room-filter]'),b=e.target.closest('[data-room-book]');if(f){filter=f.dataset.roomFilter;site.querySelectorAll('[data-room-filter]').forEach(x=>x.classList.toggle('active',x===f));apply()}if(b){const select=site.querySelector('[data-booking-form] select[name="room"]');if(select)select.value=b.dataset.roomBook;site.querySelector('#sr-booking')?.scrollIntoView({behavior:'smooth'})}});
 const form=site.querySelector('[data-booking-form]');
 if(form){const inEl=form.querySelector('[name="checkin"]'),outEl=form.querySelector('[name="checkout"]'),today=new Date(),minDate=new Date(today.getTime()-today.getTimezoneOffset()*60000).toISOString().slice(0,10);inEl.min=minDate;outEl.min=minDate;inEl.addEventListener('change',()=>{outEl.min=inEl.value||minDate;if(outEl.value&&outEl.value<=inEl.value)outEl.value=''});
 form.addEventListener('submit',e=>{e.preventDefault();const v=k=>String(new FormData(form).get(k)||'').trim(),start=v('checkin'),end=v('checkout');if(!start||!end||end<=start){form.querySelector('[data-booking-feedback]').textContent='Please select a check-out date after your check-in date.';return}if(start<minDate){form.querySelector('[data-booking-feedback]').textContent='Please choose a check-in date from today onwards.';return}
 const d0={nights:Math.round((new Date(end+'T00:00:00')-new Date(start+'T00:00:00'))/86400000)};
 const msg='STAY ENQUIRY — '+(d.brand?.businessName||CONFIG.title)+'\n\nCheck-in: '+start+'\nCheck-out: '+end+' ('+d0.nights+' nights)\nAdults: '+v('adults')+'\nChildren: '+v('children')+'\nPreferred room: '+v('room')+'\nGuest name: '+v('guest')+'\nPhone: '+v('phone')+'\nSpecial requests: '+(v('notes')||'None')+'\n\nPlease confirm room availability, final tariff, taxes and booking terms. This is an enquiry, not a confirmed reservation.';
 const wa=selected.includes('whatsapp')?digits(d.contact?.whatsapp):'';
 if(wa){window.open('https://wa.me/'+wa+'?text='+encodeURIComponent(msg),'_blank','noopener');form.querySelector('[data-booking-feedback]').textContent='WhatsApp opened with your enquiry. Review the message and press Send; the property will confirm your request.'}
 else if(d.contact?.email){window.location.href='mailto:'+encodeURIComponent(d.contact.email)+'?subject='+encodeURIComponent('Stay enquiry — '+(d.brand?.businessName||CONFIG.title))+'&body='+encodeURIComponent(msg);form.querySelector('[data-booking-feedback]').textContent='Your email app is opening with the enquiry. Please send it to the property.'}
 else form.querySelector('[data-booking-feedback]').textContent='Please contact the property using the phone number shown on this page.';
 });}
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
