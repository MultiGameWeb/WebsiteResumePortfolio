const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=v=>{const s=String(v??'').trim();if(/^https?:\/\//i.test(s))return s;if(/^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/=]+$/i.test(s))return s;return ''};
const digits=v=>String(v??'').replace(/[^0-9]/g,'');
const wa=(number,message='')=>{const n=digits(number);return n?'https://wa.me/'+n+(message?'?text='+encodeURIComponent(message):''):''};
const list=v=>Array.isArray(v)?v.filter(x=>x&&x.enabled!==false):[];
const dateText=v=>{const s=String(v??'').trim();if(!s)return 'your wedding date';const d=new Date(s+'T12:00:00');return Number.isNaN(d.getTime())?s:d.toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})};
const bookingMessage=(business,date)=>'Hi '+business+', I want to check availability for a Bridal Makeup on '+date+'.';

export function render(d={},selected=[]){
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

 if(ok('packages')&&s.showPackages!==false)html+='<section id="packages" class="bm-section bm-packages"><div class="bm-section-heading"><div><span class="bm-kicker">SERVICE PACKAGES & CHARGES</span><h2>Clear rates for every bridal moment.</h2></div><p>Sample pricing shown. Replace with your own charges and confirm the final scope with each client.</p></div><div class="bm-package-table"><div class="bm-package-head"><span>Package</span><span>Includes</span><span>Price</span></div>'+packages.map((x,i)=>'<article class="bm-package-row '+(i===packages.length-1?'bm-package-premium':'')+'"><div><small>'+String(i+1).padStart(2,'0')+'</small><h3>'+esc(x.name||'Bridal Package')+'</h3></div><p>'+esc(x.description||'')+'</p><strong>'+esc(x.price||'Custom quote')+'</strong></article>').join('')+'</div></section>';

 if(ok('beforeAfter')&&s.showBeforeAfter!==false)html+='<section id="beforeAfter" class="bm-section bm-ba"><div class="bm-section-heading"><div><span class="bm-kicker">BEFORE / AFTER GALLERY</span><h2>See the transformation, beautifully aligned.</h2></div><p>Use compressed WebP images or Cloudflare Images URLs for fast loading. Open any transformation for a larger view.</p></div><div class="bm-ba-grid">'+transformations.map((x,i)=>'<button type="button" class="bm-ba-card" data-ba-index="'+i+'" aria-label="Open '+esc(x.title||'bridal transformation')+'"><span class="bm-ba-photo before"><img loading="lazy" decoding="async" src="'+esc(safeUrl(x.beforeImage))+'" alt="'+esc((x.title||'Transformation')+' before')+'"><em>BEFORE</em></span><span class="bm-ba-photo after"><img loading="lazy" decoding="async" src="'+esc(safeUrl(x.afterImage))+'" alt="'+esc((x.title||'Transformation')+' after')+'"><em>AFTER</em></span><span class="bm-ba-meta"><strong>'+esc(x.title||'Bridal transformation')+'</strong><small>'+esc(x.caption||'')+'</small></span></button>').join('')+'</div></section>';

 if(ok('reviews')&&s.showReviews!==false)html+='<section id="reviews" class="bm-section bm-reviews"><div class="bm-section-heading"><div><span class="bm-kicker">CLIENT TESTIMONIALS</span><h2>Kind words from past brides.</h2></div></div><div class="bm-review-grid">'+reviews.map(x=>'<article><div class="bm-stars">'+('★'.repeat(Math.max(1,Math.min(5,Number(x.rating)||5))))+'</div><blockquote>“'+esc(x.text||'')+'”</blockquote><strong>'+esc(x.name||'Happy Bride')+'</strong></article>').join('')+'</div></section>';

 if(ok('location')&&s.showLocation!==false)html+='<section id="location" class="bm-section bm-location"><div class="bm-location-main"><span class="bm-kicker">SERVICE DISTANCE & LOCATION</span><h2>Wherever the bride gets ready, we can plan the beauty timeline around her.</h2><p class="bm-policy"><strong>'+esc(c.travelPolicy||'Available for on-venue bridal services across Hyderabad.')+'</strong></p><p>'+esc(c.extraCharge||'Travel charges may apply outside the service radius.')+'</p><div class="bm-location-actions">'+(safeUrl(c.maps)?'<a class="bm-btn bm-btn-dark" target="_blank" rel="noopener" href="'+esc(safeUrl(c.maps))+'">Open Google Maps <span>↗</span></a>':'')+(c.phone?'<a class="bm-text-link" href="tel:'+esc(c.phone)+'">Call '+esc(c.phone)+' ↗</a>':'')+'</div></div><div class="bm-location-card"><span>BASE / STUDIO</span><strong>'+esc(c.location||'Hyderabad, Telangana')+'</strong><small>On-venue service available across Hyderabad</small></div></section>';

 if(ok('contact')&&s.showContact!==false)html+='<section id="contact" class="bm-section bm-contact"><div><span class="bm-kicker">QUICK CONTACT</span><h2>Let’s reserve your date.</h2><p>Share your wedding date and preferred bridal package on WhatsApp. We’ll reply with availability and next steps.</p></div><div class="bm-contact-actions">'+(ok('whatsapp')&&whatsappHref?'<a class="bm-btn bm-btn-primary" target="_blank" rel="noopener" href="'+esc(whatsappHref)+'">Chat on WhatsApp <span>↗</span></a>':'')+(c.email?'<a class="bm-text-link" href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a>':'')+'</div></section>';

 html+='<footer class="bm-footer"><div><strong>'+esc(b.businessName||'Your Bridal Studio')+'</strong><span>'+esc(b.motto||'Making your special day more magical.')+'</span></div><div class="bm-footer-links">'+(c.phone?'<a href="tel:'+esc(c.phone)+'">Call</a>':'')+(c.email?'<a href="mailto:'+esc(c.email)+'">Email</a>':'')+(ok('whatsapp')&&whatsappHref?'<a target="_blank" rel="noopener" href="'+esc(whatsappHref)+'">WhatsApp</a>':'')+'</div></footer>';
 if(ok('whatsapp')&&whatsappHref)html+='<a class="bm-float-wa" target="_blank" rel="noopener" href="'+esc(whatsappHref)+'">Chat on WhatsApp ↗</a>';
 html+='<div class="bm-lightbox" hidden><div class="bm-lightbox-backdrop" data-close-ba></div><div class="bm-lightbox-panel"><button type="button" class="bm-lightbox-close" data-close-ba aria-label="Close image viewer">×</button><button type="button" class="bm-lightbox-prev" data-ba-prev aria-label="Previous transformation">‹</button><div class="bm-lightbox-grid"><figure><img data-ba-before src="" alt="Before"><figcaption>BEFORE</figcaption></figure><figure><img data-ba-after src="" alt="After"><figcaption>AFTER</figcaption></figure></div><button type="button" class="bm-lightbox-next" data-ba-next aria-label="Next transformation">›</button></div></div>';
 return html+'</div>';
}
export function init(root,d={}){
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