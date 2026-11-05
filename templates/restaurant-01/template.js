const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url=v=>{const x=String(v??'').trim();return /^(https?:|tel:|mailto:|data:image\/)/i.test(x)||/^[\w./-]+$/.test(x)?x:''};
const safe=v=>String(v??'').replace(/[^0-9]/g,'');
const tel=v=>String(v??'').replace(/[^\d+]/g,'');
const wa=(n,msg)=>{const p=safe(n);return p?'https://wa.me/'+p+(msg?'?text='+encodeURIComponent(msg):''):''};
const slug=v=>String(v||'other').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'other';

function scBaseRender(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},ok=x=>selected.includes(x);
  const menu=(d.menu||[]).filter(x=>x.enabled!==false);
  const offers=(d.offers||[]).filter(x=>x.enabled!==false);
  const gallery=(d.gallery||[]).filter(x=>x.enabled!==false&&url(x.image));
  const reviews=(d.reviews||[]).filter(x=>x.enabled!==false),hours=d.hours||[];
  const faqs=(d.faqs||[]).filter(x=>x.enabled!==false);
  const name=b.businessName||'Your Restaurant';
  const waOn=ok('whatsapp')&&safe(c.whatsapp);
  const show={about:ok('about')&&s.showAbout!==false&&b.about,menu:ok('menu')&&s.showMenu!==false&&menu.length,offers:ok('offers')&&s.showOffers!==false&&offers.length,
    gallery:ok('gallery')&&s.showGallery!==false&&gallery.length,reviews:ok('reviews')&&s.showReviews!==false&&reviews.length,social:ok('social')&&s.showSocial!==false&&(url(c.instagram)||url(c.googleReviews)),
    hours:ok('hours')&&s.showHours!==false&&hours.length,reservation:ok('reservation')&&s.showReservation!==false&&(c.phone||c.whatsapp),contact:ok('contact')&&s.showContact!==false};
  const cats=[...new Set(menu.map(x=>x.category).filter(Boolean))];
  const nav=[show.about&&['#about','About'],show.menu&&['#menu','Menu'],show.offers&&['#offers','Offers'],show.gallery&&['#gallery','Gallery'],show.hours&&['#hours','Hours'],ok('faq')&&faqs.length&&['#faq','FAQ'],show.contact&&['#contact','Contact']].filter(Boolean);
  const rating=Math.max(0,Math.min(5,Math.round(Number(c.googleRating)||0)));
  let html='<div class="site-preview restaurant-01">';

  html+='<header class="restaurant-nav"><a class="rs-brand" href="#top"><strong>'+esc(name)+'</strong>'+(b.tagline?'<small>'+esc(b.tagline)+'</small>':'')+'</a>'+
    '<nav aria-label="Main">'+nav.map(([href,label])=>'<a href="'+href+'">'+label+'</a>').join('')+'</nav>'+
    '<div class="restaurant-nav-right">'+(show.reservation?'<a class="r-btn saffron small" href="#reservation">Reserve</a>':'')+'<a class="template-admin-link" href="admin.html?template=restaurant-01">Admin</a></div></header>';

  if(ok('home')){
    html+='<section class="restaurant-hero" id="top">'+(url(d.hero)?'<img src="'+esc(url(d.hero))+'" alt="">':'')+'<div class="restaurant-hero-overlay"></div><div class="restaurant-hero-copy">'+
      '<small>'+esc(b.ownerName||'Kitchen & table')+'</small><h1>'+esc(h.title||name)+'</h1>'+(h.text?'<p>'+esc(h.text)+'</p>':'')+
      '<div class="restaurant-actions">'+(show.reservation?'<a class="r-btn saffron" href="#reservation">Reserve a table</a>':'')+(show.menu?'<a class="r-btn outline" href="#menu">View menu</a>':'')+'</div>'+
      (show.hours?'<p class="rs-open" data-open-status hidden></p>':'')+'</div></section>';
  }

  if(show.about){
    const pic=gallery[0];
    html+='<section id="about" class="r-section rs-about"><div><small>Our story</small><h2>'+esc(b.about)+'</h2>'+(b.ownerName?'<p class="rs-sign">— '+esc(b.ownerName)+'</p>':'')+'</div>'+
      (pic?'<figure><img src="'+esc(url(pic.image))+'" alt="'+esc(pic.title||name)+'" loading="lazy"></figure>':'')+'</section>';
  }

  if(show.menu){
    html+='<section id="menu" class="r-section warm"><div class="r-head"><div><small>The menu</small><h2>Kitchen favourites</h2></div>'+
      (cats.length>1?'<div class="rs-tabs" role="group" aria-label="Menu categories"><button type="button" class="active" data-cat="all" aria-pressed="true">All</button>'+cats.map(x=>'<button type="button" data-cat="'+esc(slug(x))+'" aria-pressed="false">'+esc(x)+'</button>').join('')+'</div>':'')+'</div>'+
      '<div class="menu-grid">'+menu.map(x=>'<article data-cat="'+esc(slug(x.category))+'">'+(url(x.image)?'<img src="'+esc(url(x.image))+'" alt="'+esc(x.name||'Dish')+'" loading="lazy">':'')+
        '<div class="rs-dish"><div class="rs-dish-top"><h3>'+esc(x.name||'Dish')+'</h3>'+(x.price?'<strong>'+esc(x.price)+'</strong>':'')+'</div>'+(x.category?'<small>'+esc(x.category)+'</small>':'')+(x.description?'<p>'+esc(x.description)+'</p>':'')+'</div></article>').join('')+'</div></section>';
  }

  if(show.offers){
    html+='<section id="offers" class="r-section offers"><small>This week</small><h2>Specials at the table</h2><div class="offer-grid">'+
      offers.map(x=>'<article><span aria-hidden="true">✦</span><h3>'+esc(x.title||'Special')+'</h3>'+(x.text?'<p>'+esc(x.text)+'</p>':'')+(waOn?'<a target="_blank" rel="noopener" href="'+esc(wa(c.whatsapp,'Hi, I would like to know more about: '+(x.title||'your offer')))+'">Ask about this →</a>':'')+'</article>').join('')+'</div></section>';
  }

  if(show.gallery){
    html+='<section id="gallery" class="r-section"><small>The space</small><h2>A table worth returning to.</h2><div class="restaurant-gallery">'+
      gallery.map(x=>'<figure><img src="'+esc(url(x.image))+'" alt="'+esc(x.title||name)+'" loading="lazy">'+(x.title?'<figcaption>'+esc(x.title)+'</figcaption>':'')+'</figure>').join('')+'</div></section>';
  }

  if(show.reviews){
    html+='<section class="r-section warm" id="reviews"><small>Guest notes</small><h2>Good words, shared.</h2><div class="review-row">'+
      reviews.map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||0));return '<figure>'+(r?'<div class="rs-stars" aria-label="'+r+' out of 5">'+'★'.repeat(r)+'</div>':'')+'<blockquote>“'+esc(x.text||'')+'”</blockquote><figcaption>'+esc(x.name||'Guest')+'</figcaption></figure>'}).join('')+'</div></section>';
  }

  if(show.hours||show.reservation){
    html+='<section class="r-section rs-visit">';
    if(show.hours){
      html+='<div id="hours" class="hours"><small>Opening hours</small><h2>Come by when we’re open.</h2><div class="hours-list">'+
        hours.map(x=>'<div class="hours-row" data-day="'+esc(x.day||'')+'" data-open="'+esc(x.open||'')+'" data-close="'+esc(x.close||'')+'" data-enabled="'+(x.enabled!==false)+'"><strong>'+esc(x.day||'Day')+'</strong><span>'+(x.enabled!==false?esc(x.open||'')+' – '+esc(x.close||''):'Closed')+'</span></div>').join('')+'</div></div>';
    }
    if(show.reservation){
      html+='<div id="reservation" class="reservation"><small>Reservations</small><h2>Book your table.</h2><p>Send your details and our team will confirm your table.</p>'+
        (waOn?'<form class="rs-form" data-wa="'+esc(safe(c.whatsapp))+'" data-name="'+esc(name)+'"><label>Your name<input name="name" autocomplete="name" required></label><div class="rs-form-row"><label>Date<input name="date" type="date" required></label><label>Time<input name="time" type="time" required></label></div><label>Guests<select name="guests">'+[1,2,3,4,5,6,7,8].map(n=>'<option'+(n===2?' selected':'')+'>'+n+'</option>').join('')+'<option value="9+">9+</option></select></label><button class="r-btn saffron" type="submit">Request on WhatsApp</button></form>':'')+
        (c.phone?'<a class="rs-call" href="tel:'+esc(tel(c.phone))+'">Or call '+esc(c.phone)+'</a>':'')+'</div>';
    }
    html+='</section>';
  }

  if(ok('faq')&&faqs.length){
    html+='<section id="faq" class="r-section rs-faq"><small>Good to know</small><h2>Questions before you visit</h2><div class="rs-faq-list">'+
      faqs.map(x=>'<details><summary>'+esc(x.question||'Question')+'</summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';
  }

  if(show.social){
    html+='<section id="social" class="r-section social"><div><small>Stay connected</small><h2>Follow the table.</h2><p>New dishes, events and guest moments.</p></div><div class="social-links">'+
      (url(c.instagram)?'<a class="r-btn dark" target="_blank" rel="noopener" href="'+esc(url(c.instagram))+'">Instagram ↗</a>':'')+
      (url(c.googleReviews)?'<a class="r-btn line" target="_blank" rel="noopener" href="'+esc(url(c.googleReviews))+'">'+(rating?'<b>'+'★'.repeat(rating)+'</b> ':'')+'Google Reviews ↗</a>':'')+'</div></section>';
  }

  if(show.contact){
    html+='<section id="contact" class="r-section contact"><div><small>Find us</small><h2>'+esc(name)+'</h2>'+(c.address?'<p>'+esc(c.address)+'</p>':'')+'</div><div class="restaurant-actions">'+
      (ok('location')&&url(c.maps)?'<a class="r-btn saffron" target="_blank" rel="noopener" href="'+esc(url(c.maps))+'">Get directions</a>':'')+
      (c.phone?'<a class="r-btn outline" href="tel:'+esc(tel(c.phone))+'">Call</a>':'')+(waOn?'<a class="r-btn outline" target="_blank" rel="noopener" href="'+esc(wa(c.whatsapp))+'">WhatsApp</a>':'')+'</div></section>';
  }

  html+='<footer><strong>'+esc(name)+'</strong><span>'+esc(b.tagline||'')+'</span><span>© '+new Date().getFullYear()+'</span></footer>';
  if(waOn)html+='<a class="rs-float" target="_blank" rel="noopener" href="'+esc(wa(c.whatsapp,'Hi, I would like to book a table.'))+'" aria-label="WhatsApp us">WhatsApp</a>';
  return html+'</div>';
}

const toMin=t=>{const m=String(t||'').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);if(!m)return null;let hr=+m[1]%12;if(/pm/i.test(m[3]||''))hr+=12;if(!m[3]&&+m[1]===12)hr=12;return hr*60+(+(m[2]||0));};

export function init(root){
  scMobileNav(arguments[0]);
  if(!root)return;
  // Menu category tabs
  const tabs=[...root.querySelectorAll('.rs-tabs button')];
  tabs.forEach(btn=>btn.addEventListener('click',()=>{const cat=btn.dataset.cat;tabs.forEach(x=>{const on=x===btn;x.classList.toggle('active',on);x.setAttribute('aria-pressed',String(on));});
    root.querySelectorAll('.menu-grid article').forEach(a=>{a.hidden=!(cat==='all'||a.dataset.cat===cat);});}));
  // Open-now status from the hours table
  const days=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'],now=new Date(),today=days[now.getDay()],mins=now.getHours()*60+now.getMinutes();
  let openNow=null;
  root.querySelectorAll('.hours-row').forEach(r=>{if(String(r.dataset.day).trim().toLowerCase()!==today)return;r.classList.add('today');
    if(r.dataset.enabled==='false'){openNow=false;return;}const o=toMin(r.dataset.open),cl=toMin(r.dataset.close);if(o==null||cl==null)return;openNow=cl>o?(mins>=o&&mins<cl):(mins>=o||mins<cl);});
  const st=root.querySelector('[data-open-status]');
  if(st&&openNow!==null){st.hidden=false;st.classList.add(openNow?'is-open':'is-closed');st.textContent=openNow?'● Open now':'● Closed now';}
  // Reservation form → WhatsApp
  const form=root.querySelector('.rs-form');
  if(form)form.addEventListener('submit',e=>{e.preventDefault();const f=new FormData(form);
    const msg='Hi '+form.dataset.name+', I would like to book a table.\nName: '+f.get('name')+'\nDate: '+f.get('date')+'\nTime: '+f.get('time')+'\nGuests: '+f.get('guests');
    window.open('https://wa.me/'+form.dataset.wa+'?text='+encodeURIComponent(msg),'_blank','noopener');});
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
export function render(d={},selected=[]){return scConnect(scBaseRender(d,selected),d,selected);}
