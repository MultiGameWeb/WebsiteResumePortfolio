const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=v=>String(v??'').replace(/[^0-9]/g,'');
const priceValue=p=>{const n=Number(p);return Number.isFinite(n)?n:parseFloat(String(p??'').replace(/[^0-9.]/g,''))||0};
const moneyLakhs=v=>{const n=Number(v)||0;if(!n)return '';return n>=10000000?'₹'+(n/10000000).toFixed(2).replace(/\.00$/,'')+' Cr':'₹'+(n/100000).toFixed(0)+' L';};
function scBaseRender(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},e=d.enquiry||{},ok=x=>selected.includes(x);
  const props=(d.properties||[]).filter(x=>x.enabled!==false),services=(d.services||[]).filter(x=>x.enabled!==false),agents=(d.agents||[]).filter(x=>x.enabled!==false),reviews=(d.reviews||[]).filter(x=>x.enabled!==false),faq=(d.faq||[]).filter(x=>x.enabled!==false),landmarks=(d.landmarks||[]).filter(x=>x.enabled!==false);
  const featured=props.filter(x=>x.featured||x.status==='Featured'), featuredList=featured.length?featured:props.slice(0,2);
  let html='<div class="site-preview realestate-01">';
  html+='<header class="re-nav"><a class="re-brand" href="#home"><span class="re-brand-mark">⌂</span><span><strong>'+esc(b.businessName||'Your Realty Agency')+'</strong><small>'+esc(b.tagline||'REAL ESTATE & PROPERTY ADVISORY')+'</small></span></a><nav>';
  if(ok('home'))html+='<a href="#home">Home</a>';if(ok('gallery'))html+='<a href="#properties">Properties</a>';if(ok('services'))html+='<a href="#services">Services</a>';if(ok('agents'))html+='<a href="#team">Team</a>';if(ok('reviews'))html+='<a href="#reviews">Reviews</a>';if(ok('faq'))html+='<a href="#faq">FAQ</a>';if(ok('enquiry'))html+='<a href="#enquiry">Enquiry</a>';
  html+='</nav><div class="re-nav-actions">'+(ok('whatsapp')&&c.whatsapp?'<a class="re-mini re-accent" target="_blank" href="https://wa.me/'+safe(c.whatsapp)+'">WhatsApp</a>':'')+'<a class="template-admin-link" href="admin.html?template=realestate-01">Admin</a></div></header>';

  if(ok('home'))html+='<section id="home" class="re-hero"><div class="re-hero-bg"><div class="re-glow"></div></div><div class="re-hero-copy"><span class="re-kicker">PROPERTY · ADVISORY · SITE VISITS</span><h1>'+esc(h.title||b.businessName||'Find a place worth moving for.')+'</h1><p>'+esc(h.text||'Explore homes, plots and commercial spaces with guided property search and site-visit support.')+'</p><div class="re-hero-actions">'+(ok('enquiry')?'<a class="re-3d-btn dark" href="#enquiry">Book a site visit <i>↗</i></a>':'')+(ok('whatsapp')&&c.whatsapp?'<a class="re-3d-btn gold" target="_blank" href="https://wa.me/'+safe(c.whatsapp)+'">Chat with an agent <i>↗</i></a>':'')+'</div></div><div class="re-hero-media"><img src="'+esc(d.hero||'')+'" alt="'+esc(b.businessName||'Real estate')+'"><div class="re-float-card"><strong>'+props.length+'+</strong><span>active listings</span></div></div></section>';

  if(ok('home')&&props.length)html+='<section class="re-search-wrap"><div class="re-search-card"><div><span class="re-kicker">SEARCH PROPERTIES</span><h2>Start with what matters.</h2></div><form id="propertySearch" class="re-search-form"><label><span>Location</span><input name="location" placeholder="Gachibowli / Kondapur"></label><label><span>Property Type</span><select name="type"><option value="">Any type</option><option>Apartment</option><option>Villa</option><option>Open Plot</option><option>Commercial Space</option><option>Independent House</option><option>Farm Land</option></select></label><label><span>BHK</span><select name="bhk"><option value="">Any BHK</option><option>1 BHK</option><option>2 BHK</option><option>3 BHK</option><option>4 BHK</option><option>5 BHK</option></select></label><label class="budget-field"><span>Budget up to <b id="budgetValue">₹5 Cr</b></span><input id="budgetRange" name="budget" type="range" min="25" max="500" step="5" value="500"></label><button class="re-3d-btn dark" type="submit">Search properties</button></form><div id="searchResultNote" class="re-search-note"></div></div></section>';

  if(ok('about')&&s.showAbout!==false)html+='<section id="about" class="re-section re-about"><div class="re-section-label">ABOUT US</div><div><span class="re-kicker">A LOCAL TEAM WITH A LONG VIEW</span><h2>'+esc(b.businessName||'Your Realty Agency')+' helps people search, compare and visit with clarity.</h2><p>'+esc(b.about||'Welcome! Get in touch to learn more about us.')+'</p></div><div class="re-about-metrics"><div><strong>Local</strong><span>market knowledge</span></div><div><strong>Guided</strong><span>site visits</span></div><div><strong>Clear</strong><span>communication</span></div></div></section>';

  if(ok('gallery')&&s.showGallery!==false)html+='<section id="properties" class="re-section re-properties"><div class="re-section-head"><div><span class="re-kicker">PROPERTY LISTINGS</span><h2>Spaces worth seeing.</h2></div><p>Search by location, type, BHK and budget.</p></div><div id="propertyGrid" class="re-property-grid">'+props.map((x,i)=>'<article class="re-property-card" data-property data-id="'+esc(x.id)+'" data-location="'+esc(x.location||'').toLowerCase()+'" data-type="'+esc(x.type||'')+'" data-bhk="'+esc(x.bhk||'')+'" data-price="'+priceValue(x.priceValue||x.price)+'"><div class="re-property-image">'+(x.coverImage?'<img src="'+esc(x.coverImage)+'" alt="'+esc(x.title||'')+'">':'<div class="re-no-image">No image</div>')+'<span class="re-badge">'+esc(x.status||'Available')+'</span>'+(x.featured?'<em>Featured</em>':'')+'</div><div class="re-property-body"><div class="re-property-top"><span>'+esc(x.type||'Property')+'</span><strong>'+esc(x.price||moneyLakhs(x.priceValue)||'Price on request')+'</strong></div><h3>'+esc(x.title||'Property')+'</h3><p class="re-location">⌖ '+esc(x.location||'')+'</p><div class="re-specs"><span>🛏️ '+esc(x.bhk||'—')+'</span><span>🚿 '+esc(x.bathrooms||'—')+'</span><span>📐 '+esc(x.area||'—')+'</span></div><p class="re-description">'+esc(x.description||'')+'</p><a href="#enquiry" class="re-text-link" data-property-enquiry="'+esc(x.title||'')+'">Enquire about this property ↗</a></div></article>').join('')+'</div><div id="noResults" class="re-no-results" hidden>No properties match those filters. Try a broader search or send an enquiry.</div></section>';

  if(ok('services')&&s.showServices!==false)html+='<section id="services" class="re-section re-services"><div class="re-section-head"><div><span class="re-kicker">OUR SERVICES</span><h2>More than a property listing.</h2></div><p>From buying and selling to documentation and loan coordination, our team supports you through the full journey.</p></div><div class="re-service-grid">'+services.map((x,i)=>'<article><span class="re-service-no">'+String(i+1).padStart(2,'0')+'</span><h3>'+esc(x.name||'Real estate service')+'</h3><p>'+esc(x.description||'')+'</p></article>').join('')+'</div></section>';

  if(ok('agents')&&s.showAgents!==false)html+='<section id="team" class="re-section re-team"><div class="re-section-head"><div><span class="re-kicker">OUR TEAM</span><h2>People behind the shortlist.</h2></div></div><div class="re-agent-grid">'+agents.map(x=>'<article><div class="re-agent-image">'+(x.image?'<img src="'+esc(x.image)+'" alt="'+esc(x.name||'')+'">':'')+'</div><div><span>'+esc(x.role||'Property Consultant')+'</span><h3>'+esc(x.name||'Agent')+'</h3><p>'+esc(x.bio||'')+'</p></div></article>').join('')+'</div></section>';

  if(ok('reviews')&&s.showReviews!==false)html+='<section id="reviews" class="re-section re-reviews"><div class="re-section-head"><div><span class="re-kicker">CUSTOMER REVIEWS</span><h2>Guidance people remember.</h2></div></div><div class="re-review-grid">'+reviews.map(x=>'<article><b class="re-stars">'+'★'.repeat(Number(x.rating)||0)+'</b><p>“'+esc(x.text||'')+'”</p><strong>'+esc(x.name||'Client')+'</strong></article>').join('')+'</div></section>';

  if(ok('location')&&s.showLocation!==false)html+='<section id="location" class="re-section re-location-section"><div class="re-section-head"><div><span class="re-kicker">LOCATION & LANDMARKS</span><h2>Show customers what surrounds the property.</h2></div><p>'+esc(c.address||'Please contact us for our address and service area.')+'</p></div><div class="re-landmark-grid">'+landmarks.map(x=>'<article><span>⌖</span><h3>'+esc(x.name||'Landmark')+'</h3><p>'+esc(x.text||'')+'</p></article>').join('')+'</div><div class="re-location-actions">'+(c.maps?'<a class="re-3d-btn dark" target="_blank" href="'+esc(c.maps)+'">Open office location ↗</a>':'')+(c.phone?'<a class="re-3d-btn light" href="tel:'+esc(c.phone)+'">Call '+esc(c.phone)+'</a>':'')+'</div></section>';

  if(ok('faq')&&s.showFAQ!==false)html+='<section id="faq" class="re-section re-faq"><div class="re-section-head"><div><span class="re-kicker">FAQ</span><h2>Questions before you visit.</h2></div></div><div class="re-faq-list">'+faq.map((x,i)=>'<article><button type="button" data-faq-toggle aria-expanded="false"><span><b>'+String(i+1).padStart(2,'0')+'</b>'+esc(x.question||'Question')+'</span><i>+</i></button><div data-faq-answer hidden><p>'+esc(x.answer||'')+'</p></div></article>').join('')+'</div></section>';

  if(ok('enquiry')&&s.showEnquiry!==false)html+='<section id="enquiry" class="re-section re-enquiry"><div class="re-enquiry-copy"><span class="re-kicker">ENQUIRY & SITE VISIT</span><h2>'+esc(e.heading||'Tell us what you are looking for.')+'</h2><p>'+esc(e.text||'Share property type, budget and purpose. Add a preferred site-visit date/time so the team can respond with a focused shortlist.')+'</p></div><form id="reEnquiryForm" class="re-enquiry-form"><label><span>Name</span><input name="name" required placeholder="Your name"></label><label><span>Phone</span><input name="phone" required placeholder="+91"></label><label><span>Email</span><input name="email" type="email" placeholder="you@example.com"></label><label><span>Property Type</span><select name="propertyType"><option value="">Choose</option><option>Apartment</option><option>Villa</option><option>Open Plot</option><option>Commercial Space</option><option>Independent House</option><option>Farm Land</option></select></label><label class="budget-slider"><span>Budget up to <b id="enquiryBudgetValue">₹2 Cr</b></span><input id="enquiryBudget" name="budgetValue" type="range" min="25" max="500" step="5" value="200"><small>₹25 Lakhs – ₹5 Crore</small></label><fieldset><legend>Purpose</legend><label><input type="checkbox" name="purpose" value="Buying"> Buying</label><label><input type="checkbox" name="purpose" value="Investing"> Investment</label></fieldset><label><span>Property of interest</span><input id="reSelectedProperty" name="property" placeholder="Optional"></label><label><span>Preferred visit date</span><input name="visitDate" type="date"></label><label><span>Preferred time</span><input name="visitTime" type="time"></label><label class="wide"><span>Message</span><textarea name="message" rows="4" placeholder="Tell us about your requirement."></textarea></label><button class="re-3d-btn gold wide" type="submit">Send enquiry & request site visit <i>↗</i></button></form></section>';

  if(ok('terms')&&s.showTerms!==false)html+='<section id="terms" class="re-legal"><span class="re-kicker">TERMS & CONDITIONS</span><p>'+esc(d.termsText||'')+'</p></section>';
  if(ok('privacy')&&s.showPrivacy!==false)html+='<section id="privacy" class="re-legal light"><span class="re-kicker">PRIVACY POLICY</span><p>'+esc(d.privacyPolicy||'')+'</p></section>';
  if(ok('rera')&&s.showRera!==false)html+='<section id="rera" class="re-rera"><div><span class="re-kicker">RERA INFORMATION</span><h2>Verify project registration details before proceeding.</h2><p>'+esc(d.rera?.text||'')+'</p></div><strong>'+esc(d.rera?.number||'Registration details available on request')+'</strong></section>';

  html+='<footer class="re-footer"><div><strong>'+esc(b.businessName||'Your Realty Agency')+'</strong><span>'+esc(b.tagline||'Property Advisory & Site Visits')+'</span></div><div class="re-footer-links">'+(c.whatsapp?'<a target="_blank" href="https://wa.me/'+safe(c.whatsapp)+'">WhatsApp ↗</a>':'')+(c.email?'<a href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a>':'')+'</div><a class="template-admin-link" href="admin.html?template=realestate-01">Admin</a></footer></div>';
  return html;
}
function scPreUpiInit(root,d={},selected=[]){scMobileNav(arguments[0]);
  const c=d.contact||{},props=(d.properties||[]).filter(x=>x.enabled!==false);
  const fmtBudget=n=>{const v=Number(n)||0;return v>=100?'₹'+(v/100).toFixed(v%100?1:0)+' Cr':'₹'+v+' L';};
  const updateRange=(input,out)=>{if(input&&out)out.textContent=fmtBudget(input.value)};
  const sr=root.querySelector('#budgetRange'),sv=root.querySelector('#budgetValue');updateRange(sr,sv);sr?.addEventListener('input',()=>updateRange(sr,sv));
  root.querySelector('#propertySearch')?.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.currentTarget),loc=String(f.get('location')||'').toLowerCase().trim(),type=String(f.get('type')||''),bhk=String(f.get('bhk')||''),budget=(Number(f.get('budget'))||500)*100000;let n=0;root.querySelectorAll('[data-property]').forEach(card=>{const okLoc=!loc||card.dataset.location.includes(loc),okType=!type||card.dataset.type===type,okBhk=!bhk||card.dataset.bhk===bhk,okBudget=!Number(card.dataset.price)||Number(card.dataset.price)<=budget;const show=okLoc&&okType&&okBhk&&okBudget;card.hidden=!show;if(show)n++});root.querySelector('#searchResultNote').textContent=n+' matching '+(n===1?'property':'properties');root.querySelector('#noResults').hidden=n!==0});
  const eb=root.querySelector('#enquiryBudget'),ev=root.querySelector('#enquiryBudgetValue');updateRange(eb,ev);eb?.addEventListener('input',()=>updateRange(eb,ev));
  root.querySelectorAll('[data-property-enquiry]').forEach(a=>a.addEventListener('click',()=>{const f=root.querySelector('#reSelectedProperty');if(f)f.value=a.dataset.propertyEnquiry}));
  root.querySelectorAll('[data-faq-toggle]').forEach(btn=>btn.addEventListener('click',()=>{const a=btn.parentElement?.querySelector('[data-faq-answer]'),open=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!open));if(a)a.hidden=open;btn.classList.toggle('open',!open)}));
  root.querySelector('#reEnquiryForm')?.addEventListener('submit',e=>{
    e.preventDefault();const f=new FormData(e.currentTarget);
    if(!safe(c.whatsapp)){alert('This option is not available right now. Please call the business directly.');return}
    const purposes=[...e.currentTarget.querySelectorAll('input[name="purpose"]:checked')].map(x=>x.value).join(', ')||'Not specified';
    const lead={id:crypto.randomUUID(),createdAt:new Date().toLocaleString(),name:f.get('name')||'',phone:f.get('phone')||'',email:f.get('email')||'',property:f.get('property')||'',propertyType:f.get('propertyType')||'',budget:fmtBudget(f.get('budgetValue')),purpose:purposes,visitDate:f.get('visitDate')||'',visitTime:f.get('visitTime')||'',message:f.get('message')||''};
    try{const key='sitecraft:realestate-01',saved=JSON.parse(localStorage.getItem(key)||'{}');saved.leads=Array.isArray(saved.leads)?saved.leads:[];saved.leads.unshift(lead);localStorage.setItem(key,JSON.stringify(saved))}catch{}
    const msg=['Hello '+(d.brand?.businessName||'Real Estate Team')+'!','','New property enquiry:','Name: '+lead.name,'Phone: '+lead.phone,'Email: '+(lead.email||'Not specified'),'Property: '+(lead.property||'Not specified'),'Property Type: '+(lead.propertyType||'Not specified'),'Budget: '+lead.budget,'Purpose: '+lead.purpose,'Site Visit Date: '+(lead.visitDate||'Not specified'),'Site Visit Time: '+(lead.visitTime||'Not specified'),'Message: '+(lead.message||'')].join('\n');
    window.open('https://wa.me/'+safe(c.whatsapp)+'?text='+encodeURIComponent(msg),'_blank');
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
export function render(d={},selected=[]){const h=scSeoBaseRender(d,selected);try{if(typeof window!=="undefined"&&window.SiteCraftPack&&window.SiteCraftPack.seo)window.SiteCraftPack.seo(d,"Real Estate Agencies & Brokers")}catch(e){}return h}
