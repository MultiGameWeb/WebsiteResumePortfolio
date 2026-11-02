const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=v=>{const x=String(v??'').trim();return /^(https?:|tel:|mailto:|data:image\/)/i.test(x)||/^[\w./-]+$/.test(x)?x:''};const tel=v=>String(v??'').replace(/[^\d+]/g,'');const contactLine=c=>[c.call?'<a class="pg-tel" href="tel:'+esc(tel(c.call))+'">'+esc(c.call)+'</a>':'',c.location?esc(c.location||c.address||''):''].filter(Boolean).join(' · ');
const safe=v=>String(v??'').replace(/\D/g,'');
const embed=url=>{
  const u=String(url||'').trim();
  if(!u)return '';
  const yt=u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if(yt)return 'https://www.youtube.com/embed/'+yt[1]+'?rel=0';
  const vm=u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if(vm)return 'https://player.vimeo.com/video/'+vm[1];
  return '';
};
export function render(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},ok=x=>selected.includes(x),s=d.settings||{};
  const services=(d.services||[]).filter(x=>x.enabled!==false);
  const gallery=(d.gallery||[]).filter(x=>x.enabled!==false);
  const reviews=(d.reviews||[]).filter(x=>x.enabled!==false);
  const stories=(d.stories||[]).filter(x=>x.enabled!==false);
  const videos=(d.videos||[]).filter(x=>x.enabled!==false);
  const rating=Math.max(0,Math.min(5,Math.round(Number(c.googleRating)||0)));
  let html='<div class="site-preview t2">';
  html+='<header><div><strong>'+esc(b.businessName||'Aurora Moments')+'</strong><span>'+esc(b.motto||'')+'</span></div>'+'<div class="t2-header-right"><nav>'+(ok('about')?'<a href="#about">About</a>':'')+(ok('services')?'<a href="#services">Services</a>':'')+(ok('gallery')?'<a href="#gallery">Gallery</a>':'')+(ok('reviews')?'<a href="#reviews">Reviews</a>':'')+(ok('contact')?'<a href="#contact">Contact</a>':'')+'</nav><a class="template-admin-link" href="admin.html?template=photography-02">Admin</a></div></header>';
  if(ok('home')) html+='<section class="hero"><img src="'+esc(url(d.hero))+'" alt=""><div><small>'+esc(b.ownerName||'PHOTOGRAPHER')+'</small><h1>'+esc(h.title||b.businessName)+'</h1><p>'+esc(h.text||'')+'</p>'+(ok('whatsapp')&&c.whatsapp?'<a target="_blank" rel="noopener" href="https://wa.me/'+safe(c.whatsapp)+'">WhatsApp</a>':'')+'</div></section>';
  if(ok('about')&&s.showAbout!==false&&b.about) html+='<section id="about"><small>ABOUT</small><h2>'+esc(b.about||'')+'</h2></section>';
  if(ok('services')&&s.showServices!==false) html+='<section id="services" class="dark"><small>SERVICES</small><h2>Photography services</h2><div class="grid">'+services.map(x=>'<article><h3>'+esc(x.name)+'</h3><b>'+esc(x.price||'')+'</b><p>'+esc(x.description||'')+'</p></article>').join('')+'</div></section>';
  if(ok('gallery')&&s.showGallery!==false&&gallery.length) html+='<section id="gallery"><small>SELECTED WORK</small><h2>Portfolio</h2><div class="gallery">'+gallery.map(x=>'<figure><img src="'+esc(url(x.image))+'" alt="'+esc(x.title||'')+'" loading="lazy" decoding="async"><figcaption>'+esc(x.title||'')+'</figcaption></figure>').join('')+'</div></section>';
  if(ok('videos')&&s.showVideos!==false&&videos.length){html+='<section class="dark t2-video-section"><small>VIDEO STORIES</small><h2>Watch the moments.</h2><div class="video-grid">';videos.forEach(x=>{const src=embed(x.url);html+='<article class="video-card">'+(src?'<div class="video-frame"><iframe src="'+esc(src)+'" title="'+esc(x.title||'Video')+'" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>':'<div class="video-placeholder"><span>VIDEO</span><a href="'+esc(x.url||'#')+'" target="_blank" rel="noreferrer">Open video ↗</a></div>')+'<h3>'+esc(x.title||'Video')+'</h3><p>'+esc(x.description||'')+'</p></article>'});html+='</div></section>';}
  if(ok('stories')&&stories.length){html+='<section class="t2-stories-section"><small>JOURNAL / STORIES</small><h2>Behind the frame.</h2><p class="stories-intro">Share the people, places and small moments behind your favourite photographs.</p><div class="stories-grid">';stories.forEach(x=>{html+='<article class="story-card">'+(x.image?'<img src="'+esc(url(x.image))+'" loading="lazy" alt="'+esc(x.title||'')+'">':'')+'<div class="story-copy"><small>'+esc(x.date||'')+'</small><h3>'+esc(x.title||'Untitled story')+'</h3><p class="story-excerpt">'+esc(x.excerpt||'')+'</p><p>'+esc(x.content||'')+'</p></div></article>'});html+='</div></section>';}
  if(ok('reviews')&&s.showReviews!==false&&reviews.length) html+='<section id="reviews" class="dark"><small>KIND WORDS</small><div class="grid">'+reviews.map(x=>'<article><b>'+('★'.repeat(Number(x.rating)||0))+'</b><p>“'+esc(x.text||'')+'”</p><strong>'+esc(x.name||'Customer')+'</strong></article>').join('')+'</div></section>';
  if((ok('social')&&s.showSocial!==false)&&(c.instagram||c.googleReviews)) html+='<section class="t2-social"><small>SOCIAL + REVIEWS</small><h2>Stay connected.</h2><div class="social-actions">'+(c.instagram?'<a class="social-link" target="_blank" rel="noopener" href="'+esc(url(c.instagram))+'">Instagram ↗</a>':'')+(c.googleReviews?'<a class="social-link" target="_blank" rel="noopener" href="'+esc(url(c.googleReviews))+'"><strong>'+('★'.repeat(rating))+'</strong> Google Reviews ↗</a>':'')+'</div></section>';
  if(ok('contact')&&s.showContact!==false) html+='<section id="contact"><small>CONTACT</small><h2>Let’s create something memorable.</h2><p>'+contactLine({call:c.call,location:c.location||c.address})+'</p>'+(ok('location')&&c.maps?'<a target="_blank" rel="noopener" href="'+esc(url(c.maps))+'">Directions</a>':'')+'</section>';
  html+='<footer>© '+new Date().getFullYear()+' '+esc(b.businessName||'Aurora Moments')+'</footer></div>';
  return html;
}
export function init(root){if(!root||root.__pgLb)return;root.__pgLb=true;root.addEventListener('click',e=>{const img=e.target.closest&&e.target.closest('.gallery img');if(!img)return;const o=document.createElement('div');o.className='pg-lightbox';o.setAttribute('role','dialog');o.setAttribute('aria-modal','true');o.innerHTML='<button type="button" aria-label="Close">×</button><img alt="">';const big=o.querySelector('img');big.src=img.currentSrc||img.src;big.alt=img.alt||'';const k=ev=>{if(ev.key==='Escape')close()};const close=()=>{o.remove();document.removeEventListener('keydown',k)};o.addEventListener('click',close);document.addEventListener('keydown',k);root.appendChild(o)})}
