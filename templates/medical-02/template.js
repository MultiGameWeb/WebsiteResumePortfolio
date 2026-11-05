const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const safe=v=>String(v??'').replace(/[^0-9]/g,'');
const wa=(n,msg='')=>{const p=safe(n);return p?'https://wa.me/'+p+(msg?'?text='+encodeURIComponent(msg):''):''};
const dayKeys=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function scBaseRender(d={},selected=[]){
 const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},hours=d.hours||{},a=d.appointment||{},ok=x=>selected.includes(x);
 const services=(d.services||[]).filter(x=>x.enabled!==false),doctors=(d.doctors||[]).filter(x=>x.enabled!==false),fac=(d.facilities||[]).filter(x=>x.enabled!==false),trust=(d.trustBadges||[]).filter(x=>x.enabled!==false),ba=(d.beforeAfter||[]).filter(x=>x.enabled!==false&&x.beforeImage&&x.afterImage),gallery=(d.gallery||[]).filter(x=>x.enabled!==false&&x.image),reviews=(d.reviews||[]).filter(x=>x.enabled!==false),videos=(d.videoTestimonials||[]).filter(x=>x.enabled!==false&&x.videoUrl),payments=(d.insurancePayments||[]).filter(x=>x.enabled!==false),faq=(d.faq||[]).filter(x=>x.enabled!==false);
 let html='<div class="site-preview medical-02">';
 html+='<header class="medical-02-nav"><a class="medical-02-brand" href="#home"><span class="medical-02-mark">NC</span><span><strong>'+esc(b.businessName||'NexaCare Dental & Medical')+'</strong><small>'+esc(b.tagline||'DENTAL · MEDICAL · FAMILY CARE')+'</small></span></a><nav>';
 if(ok('home'))html+='<a href="#home">Home</a>';if(ok('services'))html+='<a href="#services">Care</a>';if(ok('doctors'))html+='<a href="#doctors">Doctors</a>';if(ok('trust'))html+='<a href="#trust">Trust</a>';if(ok('beforeAfter'))html+='<a href="#beforeAfter">Results</a>';if(ok('facilities'))html+='<a href="#facilities">Facilities</a>';if(ok('gallery'))html+='<a href="#gallery">Gallery</a>';if(ok('reviews'))html+='<a href="#reviews">Reviews</a>';if(ok('appointment'))html+='<a href="#appointment">Book</a>';
 html+='</nav><div class="medical-02-actions">'+(ok('whatsapp')&&c.whatsapp?'<a class="medical-02-mini" target="_blank" href="'+wa(c.whatsapp)+'">WhatsApp</a>':'')+'<a class="template-admin-link" href="admin.html?template=medical-02">Admin</a></div></header>';

 if(ok('home'))html+='<section id="home" class="medical-02-hero"><div class="medical-02-hero-img"><img src="'+esc(d.hero||'')+'" alt="'+esc(b.businessName||'Center')+'"></div><div class="medical-02-hero-over"></div><div class="medical-02-hero-copy"><span class="medical-02-eyebrow">DENTAL · MEDICAL · FAMILY CARE</span><h1>'+esc(h.title||'Care that starts with listening.')+'</h1><p>'+esc(h.text||'')+'</p><div class="medical-02-hero-btns">'+(ok('appointment')?'<a class="medical-02-btn primary" href="#appointment">Book Your Consultation <span>↗</span></a>':'')+(ok('whatsapp')&&c.whatsapp?'<a class="medical-02-btn ghost" target="_blank" href="'+wa(c.whatsapp)+'">WhatsApp the centre <span>↗</span></a>':'')+'</div></div><div class="medical-02-hero-hours"><small>CLINIC HOURS</small><strong>'+esc(hours.morningSlot||hours.weekdays||'Add hours')+'</strong><span>'+esc(hours.eveningSlot||hours.weekends||'Add evening / weekend hours')+'</span></div></section>';

 if(ok('about')&&s.showAbout!==false)html+='<section id="about" class="medical-02-section medical-02-about"><div class="medical-02-side"><span class="medical-02-eyebrow">ABOUT THE CENTRE</span><span>01</span></div><div><h2>'+esc(b.businessName||'Your Center')+' is designed around clear information, comfortable visits and professional care.</h2><p>'+esc(b.about||'Welcome! Get in touch to learn more about us.')+'</p><div class="medical-02-sign"><strong>'+esc(b.ownerName||'Medical Director')+'</strong><span>Medical Director / Founder</span></div></div></section>';

 if(ok('services')&&s.showServices!==false)html+='<section id="services" class="medical-02-section medical-02-services"><div class="medical-02-head"><div><span class="medical-02-eyebrow">CONSULTATIONS & TREATMENTS</span><h2>Care, clearly explained.</h2></div><p>Show dental and medical services with duration and consultation or starting-fee notes. Medicine ordering is not part of this template.</p></div><div class="medical-02-service-grid">'+services.map((x,i)=>'<article class="'+(x.featured?'featured':'')+'"><div class="medical-02-service-img">'+(x.image?'<img src="'+esc(x.image)+'" alt="'+esc(x.name)+'">':'')+'<span>0'+(i+1)+'</span></div><div class="medical-02-service-body"><small>'+esc(x.category||'CARE')+' · '+esc(x.duration||'')+'</small><h3>'+esc(x.name||'Service')+'</h3><p>'+esc(x.description||'')+'</p><div><strong>'+esc(x.fee||'Ask centre')+'</strong><button type="button" class="medical-02-line" data-book-service="'+esc(x.name)+'">Request ↗</button></div></div></article>').join('')+'</div></section>';

 if(ok('doctors')&&s.showDoctors!==false)html+='<section id="doctors" class="medical-02-section medical-02-doctors"><div class="medical-02-head"><div><span class="medical-02-eyebrow">DOCTORS & SPECIALISTS</span><h2>Meet the care team.</h2></div><p>Show qualifications, experience and registration details to help patients understand who they are booking with.</p></div><div class="medical-02-doctor-grid">'+doctors.map((x,i)=>{const schedule=dayKeys.map(k=>x[k]?'<li><b>'+k.slice(0,3).toUpperCase()+'</b> '+esc(x[k])+'</li>':'').join('');return '<article><div class="medical-02-doctor-img">'+(x.image?'<img src="'+esc(x.image)+'" alt="'+esc(x.name)+'">':'')+'<span>0'+(i+1)+'</span></div><div class="medical-02-doctor-body"><small>'+esc(x.role||'Consultant')+'</small><h3>'+esc(x.name||'Doctor')+'</h3><strong>'+esc(x.qualification||'')+'</strong><div class="medical-02-doctor-trust"><span>'+esc(x.experience||'Experienced team')+'</span>'+(x.registrationNumber?'<span>Reg. '+esc(x.registrationNumber)+'</span>':'')+'</div><p>'+esc(x.bio||'')+'</p><div class="medical-02-schedule"><b>Weekly timings</b><ul>'+schedule+'</ul></div>'+(x.leaveNote?'<small class="medical-02-leave">'+esc(x.leaveNote)+'</small>':'')+'<button type="button" class="medical-02-line" data-book-doctor="'+esc(x.name)+'">Choose doctor ↗</button></div></article>'}).join('')+'</div></section>';

 if(ok('trust')&&s.showTrust!==false)html+='<section id="trust" class="medical-02-section medical-02-trust"><div class="medical-02-side"><span class="medical-02-eyebrow">HYGIENE & TRUST</span><span>04</span></div><div><h2>Show the standards patients want to understand.</h2><div class="medical-02-trust-grid">'+trust.map((x,i)=>'<article><span>'+esc(x.icon||'✓')+'</span><h3>'+esc(x.title||'Trust point')+'</h3><p>'+esc(x.text||'')+'</p></article>').join('')+'</div></div></section>';

 if(ok('beforeAfter')&&s.showBeforeAfter!==false)html+='<section id="beforeAfter" class="medical-02-section medical-02-before-after"><div class="medical-02-head"><div><span class="medical-02-eyebrow">BEFORE / AFTER</span><h2>Show genuine treatment outcomes.</h2></div><p></p></div><div class="medical-02-ba-grid">'+ba.map(x=>'<article class="medical-02-ba-item" data-ba-item><div class="medical-02-ba-stage"><img src="'+esc(x.beforeImage)+'" alt="Before"><div class="medical-02-ba-after" data-ba-after><img src="'+esc(x.afterImage)+'" alt="After"></div><span class="medical-02-ba-label before">Before</span><span class="medical-02-ba-label after">After</span></div><label class="medical-02-ba-control"><span>Drag to compare</span><input type="range" min="0" max="100" value="50" data-ba-range></label><h3>'+esc(x.title||'Treatment comparison')+'</h3><p>'+esc(x.description||'')+'</p></article>').join('')+'</div></section>';

 if(ok('facilities')&&s.showFacilities!==false)html+='<section id="facilities" class="medical-02-section medical-02-facilities"><div class="medical-02-side"><span class="medical-02-eyebrow">FACILITIES & CARE</span><span>06</span></div><div><h2>A comfortable space for practical care.</h2><div class="medical-02-facility-grid">'+fac.map((x,i)=>'<article><span>0'+(i+1)+'</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.text)+'</p></article>').join('')+'</div></div></section>';

 if(ok('gallery')&&s.showGallery!==false)html+='<section id="gallery" class="medical-02-section medical-02-gallery"><div class="medical-02-head"><div><span class="medical-02-eyebrow">CENTER GALLERY</span><h2>See the space before you visit.</h2></div></div><div class="medical-02-gallery-grid">'+gallery.map(x=>'<button type="button" class="medical-02-gallery-item" data-gallery="'+esc(x.image)+'"><img src="'+esc(x.image)+'" alt="'+esc(x.title)+'"><span>'+esc(x.title)+'</span></button>').join('')+'</div></section>';

 if(ok('videoTestimonials')&&s.showVideoTestimonials!==false)html+='<section id="videoTestimonials" class="medical-02-section medical-02-videos"><div class="medical-02-head"><div><span class="medical-02-eyebrow">VIDEO TESTIMONIALS</span><h2>Let patients hear from patients.</h2></div><p></p></div><div class="medical-02-video-grid">'+(videos.map(x=>'<article><video controls preload="metadata" '+(x.posterImage?'poster="'+esc(x.posterImage)+'"':'')+' src="'+esc(x.videoUrl)+'"></video><h3>'+esc(x.title||'Patient testimonial')+'</h3></article>').join('')||'<div class="medical-02-empty"></div>')+'</div></section>';

 if(ok('reviews')&&s.showReviews!==false)html+='<section id="reviews" class="medical-02-section medical-02-reviews"><div><span class="medical-02-eyebrow">PATIENT REVIEWS</span><h2>Good care is remembered.</h2>'+(d.googleReviewsUrl?'<a class="medical-02-line" target="_blank" href="'+esc(d.googleReviewsUrl)+'">View Google reviews ↗</a>':'')+'</div><div class="medical-02-review-grid">'+reviews.map(x=>'<article><b>'+'★'.repeat(Number(x.rating)||0)+'</b><p>“'+esc(x.text)+'”</p><strong>'+esc(x.name||'Patient')+'</strong></article>').join('')+'</div></section>';

 if(ok('insurance')&&s.showInsurance!==false)html+='<section id="insurance" class="medical-02-section medical-02-insurance"><div class="medical-02-head"><div><span class="medical-02-eyebrow">INSURANCE & PAYMENTS</span><h2>Make the practical details clear.</h2></div><p>List only the insurance, UPI, card or eligible finance options your centre actually supports.</p></div><div class="medical-02-insurance-grid">'+payments.map(x=>'<article><span>✓</span><h3>'+esc(x.title)+'</h3><p>'+esc(x.text)+'</p></article>').join('')+'</div></section>';

 if(ok('faq')&&s.showFAQ!==false)html+='<section id="faq" class="medical-02-section medical-02-faq"><div class="medical-02-side"><span class="medical-02-eyebrow">FAQ</span><span>11</span></div><div class="medical-02-faq-list">'+faq.map((x,i)=>'<article><button type="button" data-faq aria-expanded="false"><span>0'+(i+1)+'</span>'+esc(x.question)+'<b>+</b></button><div data-answer hidden><p>'+esc(x.answer)+'</p></div></article>').join('')+'</div></section>';

 if(ok('appointment')&&s.showAppointment!==false)html+='<section id="appointment" class="medical-02-appointment"><div class="medical-02-appointment-copy"><span class="medical-02-eyebrow">DOCTOR APPOINTMENT BOOKING</span><h2>'+esc(a.heading||'Book a doctor appointment.')+'</h2><p>'+esc(a.text||'')+'</p><div class="medical-02-contact-stack">'+(c.phone?'<a href="tel:'+esc(c.phone)+'">'+esc(c.phone)+'</a>':'')+(c.email?'<a href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a>':'')+'</div></div><form id="medical-02Form" class="medical-02-form"><label><span>Patient name</span><input name="name" required placeholder="Your name"></label><label><span>Mobile number</span><input name="phone" type="tel" required placeholder="+91"></label><label><span>Email</span><input name="email" type="email" placeholder="you@example.com"></label><label><span>Doctor</span><select id="medical-02Doctor" name="doctor"><option value="">Any available</option>'+doctors.map(x=>'<option>'+esc(x.name)+'</option>').join('')+'</select></label><label><span>Treatment / service</span><select name="service"><option value="">Choose</option>'+services.map(x=>'<option>'+esc(x.name)+'</option>').join('')+'</select></label><label><span>Preferred date</span><input id="medical-02Date" name="date" type="date"></label><label><span>Preferred slot</span><select name="slot" required><option value="">Choose slot</option><option>Morning</option><option>Evening</option><option>Any available</option></select></label><label><span>Preferred time</span><input name="time" type="time"></label><div id="medical-02DoctorSchedule" class="medical-02schedule-note medical-02wide">Select a doctor and date to see the listed weekly availability.</div><label class="medical-02wide"><span>Notes</span><textarea name="notes" rows="4" placeholder="Tell the centre anything practical about the visit."></textarea></label><div class="medical-02notice medical-02wide">For medical emergencies, use your local emergency service rather than this appointment form.</div><button class="medical-02-btn primary medical-02wide" type="submit">Request Doctor Appointment <span>↗</span></button></form></section>';

 if(ok('hours')&&s.showHours!==false)html+='<section id="hours" class="medical-02-hours"><div><span class="medical-02-eyebrow">CLINIC TIMINGS</span><h2>Morning & evening OP hours.</h2></div><div class="medical-02-hours-grid"><div><small>MAIN WORKING HOURS</small><strong>'+esc(hours.weekdays||'Add main working hours')+'</strong></div><div><small>MORNING</small><strong>'+esc(hours.morningSlot||'Add morning OP slot')+'</strong></div><div><small>EVENING</small><strong>'+esc(hours.eveningSlot||'Add evening OP slot')+'</strong></div><div><small>WEEKEND</small><strong>'+esc(hours.weekends||'Add weekend hours')+'</strong></div></div></section>';

 if(ok('location')&&s.showLocation!==false)html+='<section id="location" class="medical-02-location"><div><span class="medical-02-eyebrow">LOCATION & LANDMARKS</span><h2>Practical details before you travel.</h2><p><strong>'+esc(c.address||'Add clinic address.')+'</strong><br>'+esc(c.floor||'')+'<br>'+esc(c.parking||'')+'<br>'+esc(c.landmarks||'')+'</p></div><div class="medical-02-location-actions">'+(c.maps?'<a class="medical-02-btn ghost" target="_blank" href="'+esc(c.maps)+'">Open in Google Maps <span>↗</span></a>':'')+(c.phone?'<a class="medical-02-line" href="tel:'+esc(c.phone)+'">Call '+esc(c.phone)+' <span>↗</span></a>':'')+'</div></section>';

 if(ok('terms')&&s.showTerms!==false)html+='<section id="terms" class="medical-02-legal"><span class="medical-02-eyebrow">TERMS & CONDITIONS</span><p>'+esc(d.termsText||'')+'</p></section>';
 if(ok('privacy')&&s.showPrivacy!==false)html+='<section id="privacy" class="medical-02-legal light"><span class="medical-02-eyebrow">PRIVACY POLICY</span><p>'+esc(d.privacyPolicy||'')+'</p></section>';
 html+='<section class="medical-02-disclaimer"><span class="medical-02-eyebrow">MEDICAL DISCLAIMER</span><p>'+esc(d.medicalDisclaimer||'Information on this website is for general awareness and clinic information only. It is not a substitute for professional medical advice, diagnosis or emergency care.')+'</p></section>';
 if(ok('contact')&&s.showContact!==false)html+='<section id="contact" class="medical-02-contact"><div><span class="medical-02-eyebrow">CONTACT</span><h2>Questions before you visit?</h2><p>'+esc(c.address||'')+'</p></div><div class="medical-02-contact-links">'+(c.phone?'<a href="tel:'+esc(c.phone)+'">Call '+esc(c.phone)+'</a>':'')+(c.email?'<a href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a>':'')+(c.whatsapp?'<a target="_blank" href="'+wa(c.whatsapp)+'">WhatsApp ↗</a>':'')+'</div></section>';

 html+='<div class="medical-02-gallery-modal" hidden><div class="medical-02-modal-backdrop" data-close-modal></div><div class="medical-02-modal-panel"><button type="button" class="medical-02-modal-close" data-close-modal>×</button><img data-modal-img src="" alt=""></div></div><div class="medical-02-floating">'+(c.emergency?'<a class="emergency" href="tel:'+esc(c.emergency)+'">Emergency <span>'+esc(c.emergency)+'</span></a>':'')+(c.phone?'<a href="tel:'+esc(c.phone)+'">Call <span>Clinic</span></a>':'')+(ok('whatsapp')&&c.whatsapp?'<a target="_blank" href="'+wa(c.whatsapp)+'">WhatsApp <span>Chat</span></a>':'')+'</div>';

 html+='<footer class="medical-02-footer"><div><span class="medical-02-mark">NC</span><div><strong>'+esc(b.businessName||'NexaCare Dental & Medical')+'</strong><small>'+esc(b.tagline||'Dental · Medical · Family Care')+'</small></div></div><div class="medical-02-footer-links">'+(c.whatsapp?'<a target="_blank" href="'+wa(c.whatsapp)+'">WhatsApp</a>':'')+(c.email?'<a href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a>':'')+'</div><a class="template-admin-link" href="admin.html?template=medical-02">Admin</a></footer></div>';
 return html;
}

export function init(root,d={},selected=[]){scMobileNav(arguments[0]);
 const c=d.contact||{},business=d.brand?.businessName||'Medical Center',doctors=(d.doctors||[]).filter(x=>x.enabled!==false),form=root.querySelector('#medical-02Form');
 const setVal=(selector,val)=>{const x=root.querySelector(selector);if(x)x.value=val||''};
 root.querySelectorAll('[data-book-service]').forEach(x=>x.addEventListener('click',()=>{setVal('select[name="service"]',x.dataset.bookService);root.querySelector('#appointment')?.scrollIntoView({behavior:'smooth'})}));
 root.querySelectorAll('[data-book-doctor]').forEach(x=>x.addEventListener('click',()=>{setVal('select[name="doctor"]',x.dataset.bookDoctor);root.querySelector('#appointment')?.scrollIntoView({behavior:'smooth'});setTimeout(updateDoctorAvailability,0)}));
 root.querySelectorAll('[data-faq]').forEach(btn=>btn.addEventListener('click',()=>{const a=btn.parentElement.querySelector('[data-answer]'),open=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!open));a.hidden=open;btn.classList.toggle('open',!open)}));
 root.querySelectorAll('[data-ba-range]').forEach(r=>r.addEventListener('input',()=>{const item=r.closest('[data-ba-item]'),layer=item?.querySelector('[data-ba-after]');if(layer)layer.style.clipPath='inset(0 0 0 '+r.value+'%)'}));
 const modal=root.querySelector('.medical-02-gallery-modal'),img=root.querySelector('[data-modal-img]');
 root.querySelectorAll('[data-gallery]').forEach(x=>x.addEventListener('click',()=>{if(!modal||!img)return;img.src=x.dataset.gallery;modal.hidden=false;document.body.style.overflow='hidden'}));
 root.querySelectorAll('[data-close-modal]').forEach(x=>x.addEventListener('click',()=>{if(modal)modal.hidden=true;document.body.style.overflow=''}));
 const doctorSelect=root.querySelector('#medical-02Doctor'),dateInput=root.querySelector('#medical-02Date'),scheduleNote=root.querySelector('#medical-02DoctorSchedule');
 function updateDoctorAvailability(){
   if(!scheduleNote)return;
   const doctor=doctors.find(x=>x.name===doctorSelect?.value),date=dateInput?.value;
   if(!doctor){scheduleNote.textContent='Select a doctor and date to see the listed weekly availability.';return}
   if(date){const day=dayKeys[new Date(date+'T12:00:00').getDay()],timing=doctor[day]||'No listed hours';scheduleNote.textContent=doctor.name+' · '+day[0].toUpperCase()+day.slice(1)+': '+timing+(doctor.leaveNote?' · '+doctor.leaveNote:'')}
   else scheduleNote.textContent=doctor.name+' · Select a date to see the listed day-wise timing.';
 }
 doctorSelect?.addEventListener('change',updateDoctorAvailability);dateInput?.addEventListener('change',updateDoctorAvailability);
 form?.addEventListener('submit',e=>{
  e.preventDefault();const f=new FormData(form),lead={id:crypto.randomUUID(),createdAt:new Date().toLocaleString(),status:'New',name:f.get('name')||'',phone:f.get('phone')||'',email:f.get('email')||'',doctor:f.get('doctor')||'',service:f.get('service')||'',date:f.get('date')||'',slot:f.get('slot')||'',time:f.get('time')||'',notes:f.get('notes')||''};
  try{const key='sitecraft:medical-02',saved=JSON.parse(localStorage.getItem(key)||'{}');saved.leads=Array.isArray(saved.leads)?saved.leads:[];saved.leads.unshift(lead);localStorage.setItem(key,JSON.stringify(saved))}catch{}
  if(!safe(c.whatsapp)){alert('This option is not available right now. Please call the business directly.');return}
  const msg=['Hello '+business+'!','','New doctor appointment enquiry:','Patient: '+lead.name,'Mobile: '+lead.phone,'Email: '+(lead.email||'Not specified'),'Doctor: '+(lead.doctor||'Any available'),'Treatment: '+(lead.service||'Not specified'),'Date: '+(lead.date||'Not specified'),'Preferred slot: '+(lead.slot||'Not specified'),'Preferred time: '+(lead.time||'Not specified'),'Notes: '+(lead.notes||'')].join('\\n');
  window.open(wa(c.whatsapp,msg),'_blank');
 });
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
  addEventListener('resize',sync);sync();
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
