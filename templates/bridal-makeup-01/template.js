const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{const s=String(v??'').trim();if(/^https?:\/\//i.test(s))return s;if(/^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(s))return s;return ''};
const digits=v=>String(v??'').replace(/[^0-9]/g,'');
const wa=(number,message='')=>{const n=digits(number);return n?'https://wa.me/'+n+(message?'?text='+encodeURIComponent(message):''):''};
const list=v=>Array.isArray(v)?v.filter(x=>x&&x.enabled!==false):[];
const dateText=v=>{const s=String(v??'').trim();if(!s)return 'your wedding date';const d=new Date(s+'T12:00:00');return Number.isNaN(d.getTime())?s:d.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})};
const bookingMessage=(business,date)=>'Hi '+business+', I want to check availability for a Bridal Makeup on '+date+'.';

function scBaseRender(d={},selected=[]){
 const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},ok=x=>selected.includes(x);
 const packages=list(d.packages), transformations=list(d.beforeAfter).filter(x=>safeUrl(x.beforeImage)&&safeUrl(x.afterImage)),reviews=list(d.reviews);
 const whatsappHref=wa(c.whatsapp,bookingMessage(b.businessName||'your studio',dateText(h.eventDate)));
 let html='<div class="site-preview bridal-makeup-01">';
 html+='<header class="bm-nav"><a class="bm-brand" href="#home"><span class="bm-mark">LB</span><span><strong>'+esc(b.businessName||'Your Bridal Studio')+'</strong><small>'+esc(b.ownerName||'Bridal Makeup Artist')+'</small></span></a><nav>';
 if(ok('home'))html+='<a href="#home">Home</a>';
 if(ok('about')&&s.showAbout!==false)html+='<a href="#about">About</a>';
 if(ok('packages')&&s.showPackages!==false)html+='<a href="#packages">Packages</a>';
 if(ok('beforeAfter')&&s.showBeforeAfter!==false)html+='<a href="#beforeAfter">Before / After</a>';
 if(ok('reviews')&&s.showReviews!==false)html+='<a href="#reviews">Reviews</a>';
 if(ok('location')&&s.showLocation!==false)html+='<a href="#location">Location</a>';
 html+='</nav><div class="bm-nav-actions">'+(ok('whatsapp')&&whatsappHref?'<a class="bm-nav-wa" target="_blank" rel="noopener" href="'+esc(whatsappHref)+'">WhatsApp</a>':'')+'</div></header>';

 if(ok('home')&&s.showHome!==false)html+='<section id="home" class="bm-hero"><div class="bm-hero-media"><img src="'+esc(safeUrl(d.hero)||'')+'" alt="'+esc(b.businessName||'Bridal makeup')+'" fetchpriority="high"></div><div class="bm-hero-overlay"></div><div class="bm-hero-copy"><span class="bm-kicker">BRIDAL MAKEUP · HYDERABAD</span><h1>'+esc(h.title||'Making Your Special Day More Magical')+'</h1><p>'+esc(h.text||'Premium bridal makeup, hair styling and saree draping for your wedding day.')+'</p><div class="bm-hero-actions">'+(ok('whatsapp')&&whatsappHref?'<a class="bm-btn bm-btn-primary" target="_blank" rel="noopener" href="'+esc(whatsappHref)+'">Book Appointment <span>↗</span></a>':'')+'<a class="bm-btn bm-btn-ghost" href="#packages">Check Availability <span>↓</span></a></div>'+(h.availability?'<div class="bm-availability"><span class="bm-dot"></span>'+esc(h.availability)+'</div>':'')+'</div></section>';

 if(ok('about')&&s.showAbout!==false)html+='<section id="about" class="bm-section bm-about"><div class="bm-section-label"><span>01</span><small>ABOUT THE ARTIST</small></div><div class="bm-about-grid"><div><span class="bm-kicker">YOUR BRIDAL LOOK, YOUR STORY</span><h2>'+esc(b.ownerName||b.businessName||'Your Bridal Artist')+'</h2></div><div><p>'+esc(b.about||'Share your experience, style and approach here.')+'</p><div class="bm-mini-points"><span>HD-ready finish</span><span>Hair styling</span><span>Saree draping</span></div></div></div></section>';

 if(ok('packages')&&s.showPackages!==false)html+='<section id="packages" class="bm-section bm-packages"><div class="bm-section-heading"><div><span class="bm-kicker">SERVICE PACKAGES & CHARGES</span><h2>Clear rates for every bridal moment.</h2></div><p>Final scope and pricing are confirmed with each client.</p></div><div class="bm-package-table"><div class="bm-package-head"><span>Package</span><span>Includes</span><span>Price</span></div>'+packages.map((x,i)=>'<article class="bm-package-row '+(i===packages.length-1?'bm-package-premium':'')+'"><div><small>'+String(i+1).padStart(2,'0')+'</small><h3>'+esc(x.name||'Bridal Package')+'</h3></div><p>'+esc(x.description||'')+'</p><strong>'+esc(x.price||'Custom quote')+'</strong></article>').join('')+'</div></section>';

 if(ok('beforeAfter')&&s.showBeforeAfter!==false)html+='<section id="beforeAfter" class="bm-section bm-ba"><div class="bm-section-heading"><div><span class="bm-kicker">BEFORE / AFTER GALLERY</span><h2>See the transformation, beautifully aligned.</h2></div><p>Tap any look to see it larger.</p></div><div class="bm-ba-grid">'+transformations.map((x,i)=>'<button type="button" class="bm-ba-card" data-ba-index="'+i+'" aria-label="Open '+esc(x.title||'bridal transformation')+'"><span class="bm-ba-photo before"><img loading="lazy" decoding="async" src="'+esc(safeUrl(x.beforeImage))+'" alt="'+esc((x.title||'Transformation')+' before')+'"><em>BEFORE</em></span><span class="bm-ba-photo after"><img loading="lazy" decoding="async" src="'+esc(safeUrl(x.afterImage))+'" alt="'+esc((x.title||'Transformation')+' after')+'"><em>AFTER</em></span><span class="bm-ba-meta"><strong>'+esc(x.title||'Bridal transformation')+'</strong><small>'+esc(x.caption||'')+'</small></span></button>').join('')+'</div></section>';

 if(ok('reviews')&&s.showReviews!==false)html+='<section id="reviews" class="bm-section bm-reviews"><div class="bm-section-heading"><div><span class="bm-kicker">CLIENT TESTIMONIALS</span><h2>Kind words from past brides.</h2></div></div><div class="bm-review-grid">'+reviews.map(x=>'<article><div class="bm-stars">'+('★'.repeat(Math.max(1,Math.min(5,Number(x.rating)||5))))+'</div><blockquote>“'+esc(x.text||'')+'”</blockquote><strong>'+esc(x.name||'Happy Bride')+'</strong></article>').join('')+'</div></section>';

 if(ok('location')&&s.showLocation!==false)html+='<section id="location" class="bm-section bm-location"><div class="bm-location-main"><span class="bm-kicker">SERVICE DISTANCE & LOCATION</span><h2>Wherever the bride gets ready, we can plan the beauty timeline around her.</h2><p class="bm-policy"><strong>'+esc(c.travelPolicy||'Available for on-venue bridal services across Hyderabad.')+'</strong></p><p>'+esc(c.extraCharge||'Travel charges may apply outside the service radius.')+'</p><div class="bm-location-actions">'+(safeUrl(c.maps)?'<a class="bm-btn bm-btn-dark" target="_blank" rel="noopener" href="'+esc(safeUrl(c.maps))+'">Open Google Maps <span>↗</span></a>':'')+(c.phone?'<a class="bm-text-link" href="tel:'+esc(c.phone)+'">Call '+esc(c.phone)+' ↗</a>':'')+'</div></div><div class="bm-location-card"><span>BASE / STUDIO</span><strong>'+esc(c.location||'Hyderabad, Telangana')+'</strong><small>On-venue service available across Hyderabad</small></div></section>';

 if(ok('contact')&&s.showContact!==false)html+='<section id="contact" class="bm-section bm-contact"><div><span class="bm-kicker">QUICK CONTACT</span><h2>Let’s reserve your date.</h2><p>Share your wedding date and preferred bridal package on WhatsApp. We’ll reply with availability and next steps.</p></div><div class="bm-contact-actions">'+(ok('whatsapp')&&whatsappHref?'<a class="bm-btn bm-btn-primary" target="_blank" rel="noopener" href="'+esc(whatsappHref)+'">Chat on WhatsApp <span>↗</span></a>':'')+(c.email?'<a class="bm-text-link" href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a>':'')+'</div></section>';

 html+='<footer class="bm-footer"><div><strong>'+esc(b.businessName||'Your Bridal Studio')+'</strong><span>'+esc(b.motto||'Making your special day more magical.')+'</span></div><div class="bm-footer-links">'+(c.phone?'<a href="tel:'+esc(c.phone)+'">Call</a>':'')+(c.email?'<a href="mailto:'+esc(c.email)+'">Email</a>':'')+(ok('whatsapp')&&whatsappHref?'<a target="_blank" rel="noopener" href="'+esc(whatsappHref)+'">WhatsApp</a>':'')+'</div></footer>';
 if(ok('whatsapp')&&whatsappHref)html+='<a class="bm-float-wa" target="_blank" rel="noopener" href="'+esc(whatsappHref)+'">Chat on WhatsApp ↗</a>';
 html+='<div class="bm-lightbox" hidden><div class="bm-lightbox-backdrop" data-close-ba></div><div class="bm-lightbox-panel"><button type="button" class="bm-lightbox-close" data-close-ba aria-label="Close image viewer">×</button><button type="button" class="bm-lightbox-prev" data-ba-prev aria-label="Previous transformation">‹</button><div class="bm-lightbox-grid"><figure><img data-ba-before src="" alt="Before"><figcaption>BEFORE</figcaption></figure><figure><img data-ba-after src="" alt="After"><figcaption>AFTER</figcaption></figure></div><button type="button" class="bm-lightbox-next" data-ba-next aria-label="Next transformation">›</button></div></div>';
 return html+'</div>';
}
export function init(root,d={}){scMobileNav(arguments[0]);scBindForms(arguments[0]);
 const items=list(d.beforeAfter).filter(x=>safeUrl(x.beforeImage)&&safeUrl(x.afterImage));
 const modal=root.querySelector('.bm-lightbox'),before=root.querySelector('[data-ba-before]'),after=root.querySelector('[data-ba-after]'); let index=0;
 const show=i=>{if(!items.length||!modal||!before||!after)return;index=(i+items.length)%items.length;const x=items[index];before.src=safeUrl(x.beforeImage);after.src=safeUrl(x.afterImage);before.alt=(x.title||'Transformation')+' before';after.alt=(x.title||'Transformation')+' after';modal.hidden=false;document.body.style.overflow='hidden'};
 const close=()=>{if(!modal)return;modal.hidden=true;document.body.style.overflow=''};
 root.querySelectorAll('[data-ba-index]').forEach(b=>b.addEventListener('click',()=>show(Number(b.dataset.baIndex)||0)));
 root.querySelector('[data-close-ba]')?.addEventListener('click',close);
 root.querySelector('[data-ba-prev]')?.addEventListener('click',()=>show(index-1));
 root.querySelector('[data-ba-next]')?.addEventListener('click',()=>show(index+1));
 const key=e=>{if(!modal||modal.hidden)return;if(e.key==='Escape')close();if(e.key==='ArrowLeft')show(index-1);if(e.key==='ArrowRight')show(index+1)};
 document.addEventListener('keydown',key);
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
export function render(d={},selected=[]){return scConnect(scWithForm(scBaseRender(d,selected),d,selected),d,selected);}

/* SiteCraft enquiry form: collects details and opens WhatsApp with them filled in. Shown before the contact section. */
const SC_FORM={"section": "bm-section bm-book", "kicker": "bm-kicker", "btn": "bm-btn bm-btn-primary", "kickerText": "Check availability", "title": "Tell us about your big day", "text": "Share your date and venue and we will confirm availability and the right package on WhatsApp.", "submit": "Check availability on WhatsApp", "intro": "Hi, I would like to check bridal makeup availability.", "fields": [["name", "Your name", "text", true], ["phone", "Phone number", "tel", true], ["package", "Package", "select:packages:name", false], ["date", "Wedding / event date", "date", true], ["venue", "Venue / city", "text", false], ["people", "Number of people for makeup", "number", false], ["message", "Anything else we should know?", "textarea", false]]};
function scWithForm(html,d,selected){
  const c=d.contact||{},wa=String(c.whatsapp||'').replace(/\D/g,'');
  if(!(selected||[]).includes('enquiry')||!wa)return html;
  const f=SC_FORM,biz=(d.brand||{}).businessName||'';
  const field=([name,label,type,req])=>{
    const id='sc-f-'+name,r=req?' required':'',lab='<label for="'+id+'">'+scEsc(label)+(req?' *':'')+'</label>';
    if(type.indexOf('select:')===0){const [,list,key]=type.split(':');const opts=(d[list]||[]).filter(x=>x&&x.enabled!==false&&x[key]).map(x=>x[key]);
      if(!opts.length)return '';return '<div class="sc-form-field">'+lab+'<select id="'+id+'" name="'+name+'" data-label="'+scEsc(label)+'"'+r+'><option value="">Select…</option>'+opts.map(o=>'<option>'+scEsc(o)+'</option>').join('')+'<option>Other / not sure</option></select></div>';}
    if(type==='textarea')return '<div class="sc-form-field wide">'+lab+'<textarea id="'+id+'" name="'+name+'" rows="3" data-label="'+scEsc(label)+'"'+r+'></textarea></div>';
    const extra=type==='tel'?' autocomplete="tel" inputmode="tel"':name==='name'?' autocomplete="name"':type==='number'?' min="1" inputmode="numeric"':'';
    return '<div class="sc-form-field">'+lab+'<input id="'+id+'" name="'+name+'" type="'+type+'" data-label="'+scEsc(label)+'"'+extra+r+'></div>';
  };
  const block='<section class="'+f.section+' sc-form-section" id="enquire"><div class="sc-form-head"><span class="'+f.kicker+'">'+scEsc(f.kickerText)+'</span><h2>'+scEsc(f.title)+'</h2><p>'+scEsc(f.text)+'</p></div>'+
    '<form class="sc-form" data-sc-form data-wa="'+wa+'" data-intro="'+scEsc(f.intro)+'" data-biz="'+scEsc(biz)+'" novalidate>'+f.fields.map(field).join('')+
    '<div class="sc-form-actions wide"><button type="submit" class="'+f.btn+'">'+scEsc(f.submit)+'</button><p class="sc-form-note" role="status" aria-live="polite">Your details are sent only to us, through WhatsApp.</p></div></form></section>';
  const m=html.search(/<section[^>]*id="contact"/);
  if(m>=0)return html.slice(0,m)+block+html.slice(m);
  const i=html.lastIndexOf('<footer');return i>=0?html.slice(0,i)+block+html.slice(i):html+block;
}
function scBindForms(root){
  if(!root)return;
  root.querySelectorAll('form[data-sc-form]').forEach(form=>{
    if(form.__scBound)return;form.__scBound=true;
    form.addEventListener('submit',e=>{
      e.preventDefault();
      const note=form.querySelector('.sc-form-note');
      const bad=[...form.querySelectorAll('[required]')].find(x=>!String(x.value).trim());
      form.querySelectorAll('[aria-invalid]').forEach(x=>x.removeAttribute('aria-invalid'));
      if(bad){bad.setAttribute('aria-invalid','true');bad.focus();if(note)note.textContent='Please fill in: '+bad.dataset.label;return;}
      const lines=[...form.querySelectorAll('input,select,textarea')].filter(x=>String(x.value).trim()).map(x=>x.dataset.label+': '+String(x.value).trim());
      const msg=(form.dataset.intro||'Hi')+(form.dataset.biz?' ('+form.dataset.biz+')':'')+'\n\n'+lines.join('\n');
      window.open('https://wa.me/'+form.dataset.wa+'?text='+encodeURIComponent(msg),'_blank','noopener');
      if(note)note.textContent='WhatsApp has opened with your details. Tap send to share them with us.';
    });
  });
}
