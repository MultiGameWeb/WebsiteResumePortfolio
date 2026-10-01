const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
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
  html+='<header><div><strong>'+esc(b.businessName||'Aurora Moments')+'</strong><span>'+esc(b.motto||'')+'</span></div><a class="template-admin-link" href="admin.html?template=photography-02">Admin</a></header>';
  if(ok('home')) html+='<section class="hero"><img src="'+esc(d.hero||'')+'" alt=""><div><small>'+esc(b.ownerName||'PHOTOGRAPHER')+'</small><h1>'+esc(h.title||b.businessName)+'</h1><p>'+esc(h.text||'')+'</p>'+(ok('whatsapp')&&c.whatsapp?'<a href="https://wa.me/'+safe(c.whatsapp)+'">WhatsApp</a>':'')+'</div></section>';
  if(ok('about')&&s.showAbout!==false) html+='<section><small>ABOUT</small><h2>'+esc(b.about||'')+'</h2></section>';
  if(ok('services')&&s.showServices!==false) html+='<section class="dark"><small>SERVICES</small><h2>Photography services</h2><div class="grid">'+services.map(x=>'<article><h3>'+esc(x.name)+'</h3><b>'+esc(x.price||'')+'</b><p>'+esc(x.description||'')+'</p></article>').join('')+'</div></section>';
  if(ok('gallery')&&s.showGallery!==false) html+='<section><small>SELECTED WORK</small><h2>Portfolio</h2><div class="gallery">'+gallery.map(x=>'<figure><img src="'+esc(x.image||'')+'" alt="'+esc(x.title||'')+'"><figcaption>'+esc(x.title||'')+'</figcaption></figure>').join('')+'</div></section>';
  if(ok('videos')&&s.showVideos!==false&&videos.length){html+='<section class="dark t2-video-section"><small>VIDEO STORIES</small><h2>Watch the moments.</h2><p class="video-note">YouTube/Vimeo embeds keep large video files off the website storage while giving customers a fast way to watch.</p><div class="video-grid">';videos.forEach(x=>{const src=embed(x.url);html+='<article class="video-card">'+(src?'<div class="video-frame"><iframe src="'+esc(src)+'" title="'+esc(x.title||'Video')+'" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>':'<div class="video-placeholder"><span>VIDEO</span><a href="'+esc(x.url||'#')+'" target="_blank" rel="noreferrer">Open video ↗</a></div>')+'<h3>'+esc(x.title||'Video')+'</h3><p>'+esc(x.description||'')+'</p></article>'});html+='</div></section>';}
  if(ok('stories')&&stories.length){html+='<section class="t2-stories-section"><small>JOURNAL / STORIES</small><h2>Behind the frame.</h2><p class="stories-intro">Share the people, places and small moments behind your favourite photographs.</p><div class="stories-grid">';stories.forEach(x=>{html+='<article class="story-card">'+(x.image?'<img src="'+esc(x.image)+'" alt="'+esc(x.title||'')+'">':'')+'<div class="story-copy"><small>'+esc(x.date||'')+'</small><h3>'+esc(x.title||'Untitled story')+'</h3><p class="story-excerpt">'+esc(x.excerpt||'')+'</p><p>'+esc(x.content||'')+'</p></div></article>'});html+='</div></section>';}
  if(ok('reviews')&&s.showReviews!==false) html+='<section class="dark"><small>KIND WORDS</small><div class="grid">'+reviews.map(x=>'<article><b>'+('★'.repeat(Number(x.rating)||0))+'</b><p>“'+esc(x.text||'')+'”</p><strong>'+esc(x.name||'Customer')+'</strong></article>').join('')+'</div></section>';
  if((ok('social')&&s.showSocial!==false)&&(c.instagram||c.googleReviews)) html+='<section class="t2-social"><small>SOCIAL + REVIEWS</small><h2>Stay connected.</h2><div class="social-actions">'+(c.instagram?'<a class="social-link" target="_blank" href="'+esc(c.instagram)+'">Instagram ↗</a>':'')+(c.googleReviews?'<a class="social-link" target="_blank" href="'+esc(c.googleReviews)+'"><strong>'+('★'.repeat(rating))+'</strong> Google Reviews ↗</a>':'')+'</div></section>';
  if(ok('contact')&&s.showContact!==false) html+='<section><small>CONTACT</small><h2>Let’s create something memorable.</h2><p>'+esc(c.call||'')+' · '+esc(c.location||c.address||'')+'</p>'+(ok('location')&&c.maps?'<a href="'+esc(c.maps)+'">Directions</a>':'')+'</section>';
  html+='<footer>© '+new Date().getFullYear()+' '+esc(b.businessName||'Aurora Moments')+'</footer></div>';
  return html;
}