const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=v=>String(v??'').replace(/[^0-9]/g,'');
const normalizeMenus=(value=[])=>{
  if(!Array.isArray(value))return [];
  if(value.some(x=>Array.isArray(x?.items))){
    return value.map(x=>({...x,items:Array.isArray(x.items)?x.items:[]})); 
  }
  const groups=[];
  value.forEach((item,i)=>{
    const cat=item.category||'General Menu';
    let g=groups.find(x=>x.title===cat);
    if(!g){g={id:'migrated-'+(groups.length+1),title:cat,description:'',serves:'',pricePerPlate:'',enabled:true,items:[]};groups.push(g)}
    g.items.push({id:item.id||('legacy-'+(i+1)),name:item.name||'Menu item',description:item.description||'',price:item.price||item.displayPrice||'',image:item.image||'',enabled:item.enabled!==false});
  });
  return groups;
};
function scBaseRender(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},e=d.enquiry||{},ok=x=>selected.includes(x);
  const menus=normalizeMenus(d.menu),gallery=(d.gallery||[]).filter(x=>x.enabled!==false),reviews=(d.reviews||[]).filter(x=>x.enabled!==false),services=(d.eventServices||[]).filter(x=>x.enabled!==false),faq=(d.faq||[]).filter(x=>x.enabled!==false),trust=(d.trustBadges||[]).filter(x=>x.enabled!==false),videos=(d.videos||[]).filter(x=>x.enabled!==false),extraBlocks=(d.extraBlocks||[]).filter(x=>x.enabled!==false);
  let html='<div class="site-preview catering-01">';
  html+='<header class="cat-nav"><a class="cat-brand" href="#home"><strong>'+esc(b.businessName||'Your Catering Business')+'</strong><small>'+esc(b.tagline||'CATERING & EVENTS')+'</small></a><nav>';
  if(ok('home'))html+='<a href="#home">Home</a>';if(ok('about'))html+='<a href="#about">About</a>';if(ok('menu'))html+='<a href="#menu">Menus</a>';if(ok('eventServices'))html+='<a href="#event-services">Our Services</a>';if(ok('gallery'))html+='<a href="#gallery">Gallery</a>';if(ok('reviews'))html+='<a href="#reviews">Reviews</a>';if(ok('faq'))html+='<a href="#faq">FAQ</a>';if(ok('enquiry'))html+='<a href="#enquiry">Enquiry</a>';
  html+='</nav><div class="cat-nav-actions">';if(ok('whatsapp')&&c.whatsapp)html+='<a class="cat-mini-btn accent" target="_blank" href="https://wa.me/'+safe(c.whatsapp)+'">WhatsApp</a>';html+='<a class="template-admin-link" href="admin.html?template=catering-01">Admin</a></div></header>';
  if(ok('home'))html+='<section id="home" class="cat-hero"><div class="cat-hero-photo"><img src="'+esc(d.hero||'')+'" alt="'+esc(b.businessName||'Catering')+'"></div><div class="cat-hero-copy"><span class="cat-kicker">EVENT CATERING · WEDDINGS · PARTIES · CORPORATE</span><h1>'+esc(h.title||b.businessName||'Catering made for memorable celebrations.')+'</h1><p>'+esc(h.text||'')+'</p><div class="cat-actions">'+(ok('enquiry')?'<a class="cat-btn dark" href="#enquiry">Plan your event <i>↗</i></a>':'')+(ok('whatsapp')&&c.whatsapp?'<a class="cat-btn outline" target="_blank" href="https://wa.me/'+safe(c.whatsapp)+'">Chat on WhatsApp <i>↗</i></a>':'')+'</div><div class="cat-hero-note"><span>Weddings</span><span>Birthdays</span><span>Corporate</span><span>House parties</span></div></div></section>';
  if(ok('about')&&s.showAbout!==false)html+='<section id="about" class="cat-section cat-about"><div class="cat-section-label">ABOUT US</div><div><h2>Food, service and a calm event day.</h2><p>'+esc(b.about||'Welcome! Get in touch to learn more about us.')+'</p></div><div class="cat-about-stats"><div><strong>Fresh</strong><span>menu planning</span></div><div><strong>Flexible</strong><span>event formats</span></div><div><strong>Care</strong><span>on-site service</span></div></div></section>';
  if(ok('trust')&&s.showTrust!==false)html+='<section id="trust" class="cat-section cat-trust"><div class="cat-heading"><div><span class="cat-kicker">FOOD SAFETY & TRUST</span><h2>Standards your customers can see.</h2></div><p>'+esc(d.trustNote||'')+'</p></div><div class="cat-trust-grid">'+trust.map(x=>'<article><div class="trust-mark">'+(x.image?'<img src="'+esc(x.image)+'" alt="">':'<span>✓</span>')+'</div><div><h3>'+esc(x.title||'Trust badge')+'</h3><p>'+esc(x.text||'')+'</p></div></article>').join('')+'</div></section>';
  if(ok('menu')&&s.showMenu!==false)html+='<section id="menu" class="cat-section cat-menu"><div class="cat-heading"><div><span class="cat-kicker">MENU / PACKAGES</span><h2>Menus built around your event.</h2></div><p>Build as many menu packages as you need. Guest count and per-plate pricing can stay optional for custom quotations.</p></div><div class="cat-menu-groups">'+menus.map((m,i)=>'<article class="cat-menu-group"><div class="cat-menu-group-head"><div><small>MENU '+String(i+1).padStart(2,'0')+'</small><h3>'+esc(m.title||'Untitled Menu')+'</h3><p>'+esc(m.description||'')+'</p></div><div class="cat-menu-summary">'+(m.serves?'<span><b>Serves</b>'+esc(m.serves)+'</span>':'')+(m.pricePerPlate?'<span><b>Price</b>'+esc(m.pricePerPlate)+'</span>':'')+'</div></div><div class="cat-item-grid">'+(m.items||[]).filter(x=>x.enabled!==false).map(x=>'<div class="cat-menu-item"><div class="cat-item-image">'+(x.image?'<img src="'+esc(x.image)+'" alt="'+esc(x.name||'')+'">':'<span>No image</span>')+'</div><div class="cat-item-copy"><h4>'+esc(x.name||'Menu item')+'</h4><p>'+esc(x.description||'')+'</p>'+(x.price?'<strong>'+esc(x.price)+'</strong>':'')+'</div></div>').join('')+'</div>'+(ok('enquiry')?'<a class="cat-text-link" href="#enquiry" data-menu-title="'+esc(m.title||'')+'">Ask about this menu ↗</a>':'')+'</article>').join('')+'</div></section>';
  if(ok('eventServices')&&s.showEventServices!==false)html+='<section id="event-services" class="cat-section cat-event-services"><div class="cat-heading"><div><span class="cat-kicker">OUR SERVICES</span><h2>'+esc(d.servicesHeading||'Our Services')+'</h2></div><p>'+esc(d.servicesText||'We provide more than food for an event — from menu planning and buffet setup to serving staff, crockery, live counters, welcome drinks and on-site coordination.')+'</p></div><div class="cat-service-grid">'+services.map((x,i)=>'<article><span class="service-no">'+String(i+1).padStart(2,'0')+'</span><h3>'+esc(x.name||'Event service')+'</h3><p>'+esc(x.description||'')+'</p></article>').join('')+'</div></section>';
  if(ok('videos')&&s.showVideos!==false)html+='<section id="videos" class="cat-section cat-videos"><div class="cat-heading"><div><span class="cat-kicker">VIDEO SHOWCASE</span><h2>See the service in action.</h2></div><p></p></div><div class="cat-video-grid">'+(videos.length?videos.map(x=>'<article><div class="cat-video-frame">'+(x.video?'<video controls preload="metadata" playsinline src="'+esc(x.video)+'"></video>':'<div class="cat-video-empty">No video uploaded yet.</div>')+'</div><div class="cat-video-copy"><h3>'+esc(x.title||'Catering video')+'</h3><p>'+esc(x.description||'')+'</p></div></article>').join(''):'<article class="cat-video-placeholder"><div class="cat-video-frame"><div class="cat-video-empty">Videos coming soon.</div></div><div class="cat-video-copy"><h3>Your service video</h3><p>Upload a short owner introduction, customer testimonial or behind-the-scenes event video.</p></div></article>')+'</div></section>';
  if(ok('customContent')&&s.showCustomContent!==false)html+='<section id="custom-content" class="cat-section cat-custom-content">'+extraBlocks.map(x=>'<article><div class="cat-custom-copy"><span class="cat-kicker">CUSTOM</span><h2>'+esc(x.title||'')+'</h2><h3>'+esc(x.subtitle||'')+'</h3><p>'+esc(x.text||'')+'</p></div>'+(x.image?'<div class="cat-custom-image"><img src="'+esc(x.image)+'" alt=""></div>':'')+'</article>').join('')+'</section>';
  if(ok('gallery')&&s.showGallery!==false)html+='<section id="gallery" class="cat-section cat-gallery"><div class="cat-heading"><div><span class="cat-kicker">GALLERY</span><h2>A taste of the celebrations.</h2></div><p></p></div><div class="cat-gallery-grid">'+gallery.map((x,i)=>'<figure><img src="'+esc(x.image||'')+'" alt="'+esc(x.title||'')+'"><figcaption><b>'+String(i+1).padStart(2,'0')+'</b><span>'+esc(x.title||'')+'</span></figcaption></figure>').join('')+'</div></section>';
  if(ok('reviews')&&s.showReviews!==false)html+='<section id="reviews" class="cat-section cat-reviews"><div class="cat-heading"><div><span class="cat-kicker">CUSTOMER REVIEWS</span><h2>Trusted by hosts and teams.</h2></div></div><div class="cat-review-grid">'+reviews.map(x=>'<article><b class="stars">'+'★'.repeat(Number(x.rating)||0)+'</b><p>“'+esc(x.text||'')+'”</p><strong>'+esc(x.name||'Customer')+'</strong></article>').join('')+'</div></section>';
  if(ok('faq')&&s.showFAQ!==false)html+='<section id="faq" class="cat-section cat-faq"><div class="cat-heading"><div><span class="cat-kicker">FAQ</span><h2>Common questions, answered.</h2></div><p>Quick answers for the questions customers usually ask before booking.</p></div><div class="cat-faq-list">'+faq.map((x,i)=>'<article class="faq-item"><button type="button" class="faq-toggle" data-faq-toggle aria-expanded="false"><span><b>'+String(i+1).padStart(2,'0')+'</b>'+esc(x.question||'Question')+'</span><i>+</i></button><div class="faq-answer" data-faq-answer hidden><p>'+esc(x.answer||'')+'</p></div></article>').join('')+'</div></section>';
  if(ok('enquiry')&&s.showEnquiry!==false)html+='<section id="enquiry" class="cat-section cat-enquiry"><div class="cat-enquiry-copy"><span class="cat-kicker">ENQUIRY</span><h2>'+esc(e.heading||'Tell us about your celebration.')+'</h2><p>'+esc(e.text||'Share your date, guest count and event type. We will respond with menu options and a tailored estimate.')+'</p><div class="cat-event-tags"><span>Weddings</span><span>Corporate</span><span>Birthdays</span><span>Private parties</span></div></div><form id="cateringEnquiryForm" class="cat-form"><label><span>Your name</span><input name="name" required placeholder="Your name"></label><label><span>Phone</span><input name="phone" required placeholder="+91"></label><label><span>Event date</span><input name="date" type="date" required></label><label><span>Guests (optional)</span><input name="guests" type="number" min="1" placeholder="50"></label><label class="wide"><span>Event type</span><input name="eventType" placeholder="Wedding / Birthday / Corporate"></label><label class="wide"><span>Message</span><textarea name="message" rows="4" placeholder="Venue, food preferences or anything important."></textarea></label><button class="cat-btn dark wide" type="submit">'+esc(e.buttonText||'Send enquiry on WhatsApp')+' <i>↗</i></button></form></section>';
  if((ok('location')||c.address))html+='<section class="cat-location"><div><span class="cat-kicker">FIND US</span><h2>'+esc(b.businessName||'Your Catering Business')+'</h2><p>'+esc(c.address||'Please contact us for our address and service area.')+'</p></div><div class="cat-actions">'+(ok('location')&&c.maps?'<a class="cat-btn light" target="_blank" href="'+esc(c.maps)+'">Open location ↗</a>':'')+(c.phone?'<a class="cat-btn outline-dark" href="tel:'+esc(c.phone)+'">Call</a>':'')+'</div></section>';
  if(ok('privacy')&&s.showPrivacy!==false)html+='<section id="privacy" class="cat-privacy"><span class="cat-kicker">PRIVACY POLICY</span><p>'+esc(d.privacyPolicy||'Your privacy policy will appear here.')+'</p></section>';
  html+='<footer class="cat-footer"><div><strong>'+esc(b.businessName||'Your Catering Business')+'</strong><span>'+esc(b.tagline||'Catering & Events')+'</span></div><div class="cat-footer-links">'+(c.maps?'<a target="_blank" href="'+esc(c.maps)+'">Location ↗</a>':'')+(c.whatsapp?'<a target="_blank" href="https://wa.me/'+safe(c.whatsapp)+'">WhatsApp ↗</a>':'')+'</div><a class="template-admin-link" href="admin.html?template=catering-01">Admin</a></footer></div>';
  return html;
}
export function init(root,d={},selected=[]){scMobileNav(arguments[0]);
  const c=d.contact||{};
  root.querySelectorAll('[data-faq-toggle]').forEach(btn=>btn.addEventListener('click',()=>{const a=btn.parentElement?.querySelector('[data-faq-answer]'),open=btn.getAttribute('aria-expanded')==='true';btn.setAttribute('aria-expanded',String(!open));if(a)a.hidden=open;btn.classList.toggle('open',!open)}));
  root.querySelectorAll('[data-menu-title]').forEach(link=>link.addEventListener('click',()=>{const f=root.querySelector('#cateringEnquiryForm');if(f){const p=f.querySelector('input[name="eventType"]');if(p&&!p.value)p.value='Menu enquiry: '+link.dataset.menuTitle}}));
  root.querySelector('#cateringEnquiryForm')?.addEventListener('submit',ev=>{ev.preventDefault();if(!safe(c.whatsapp)){alert('This option is not available right now. Please call the business directly.');return}const f=new FormData(ev.currentTarget);const msg=['Hello '+(d.brand?.businessName||'Catering Team')+'!','','Catering enquiry:','Name: '+(f.get('name')||''),'Phone: '+(f.get('phone')||''),'Event date: '+(f.get('date')||''),'Guests: '+(f.get('guests')||'Not specified'),'Event type: '+(f.get('eventType')||'Not specified'),'Message: '+(f.get('message')||'')].join('\n');window.open('https://wa.me/'+safe(c.whatsapp)+'?text='+encodeURIComponent(msg),'_blank')});
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
