const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeLink=v=>{const x=String(v??'').trim();return /^(https?:\/\/|mailto:|tel:|#|\/|\.\/|\.\.\/)/i.test(x)||/^data:(application\/(pdf|epub\+zip|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/plain|audio\/(mpeg|mp4|wav|x-wav));base64,/i.test(x)?x:''};
const enabled=a=>(Array.isArray(a)?a:[]).filter(x=>x&&x.enabled!==false);
const digits=v=>String(v??'').replace(/\D/g,'');
const dateFmt=v=>{if(!v)return'';const d=new Date(v+'T00:00:00');return Number.isNaN(d.getTime())?esc(v):d.toLocaleDateString(undefined,{day:'numeric',month:'short',year:'numeric'})};
const download=(url,label,fileName)=>url?'<a class="aq-file-link" href="'+esc(safeLink(url))+'" target="_blank" rel="noopener noreferrer" '+(fileName?'download="'+esc(fileName)+'"':'')+'>'+esc(label)+' ↗</a>':'';
function scBaseRender(d={},selected=[]){
 const b=d.brand||{},a=d.author||{},h=d.home||{},c=d.contact||{},social=d.social||{},ok=x=>selected.includes(x);
 const books=enabled(d.books),works=enabled(d.works),articles=enabled(d.articles),events=enabled(d.events),awards=enabled(d.awards),gallery=enabled(d.gallery),media=enabled(d.media);
 const featured=books.filter(x=>x.featured),name=a.name||b.businessName||'The Author';
 let out='<div class="author-01" data-author-site>';
 out+='<div class="aq-strip"><span>THE OFFICIAL WEBSITE OF '+esc(name).toUpperCase()+'</span><span>'+esc(a.role||'AUTHOR · WRITER · CREATOR')+'</span></div>';
 out+='<header class="aq-header"><a class="aq-brand" href="#aq-home"><span class="aq-logo">A<span>Q</span></span><span><b>'+esc(b.businessName||name)+'</b><small>WORDS · WORLDS · IDEAS</small></span></a><nav>'+(ok('books')?'<a href="#aq-books">Books</a>':'')+(ok('works')?'<a href="#aq-works">Writings</a>':'')+(ok('articles')?'<a href="#aq-journal">Journal</a>':'')+(ok('profile')?'<a href="#aq-about">About</a>':'')+(ok('contact')?'<a href="#aq-contact">Contact</a>':'')+'</nav><a class="aq-header-cta" href="'+(ok('books')?'#aq-books':'#aq-contact')+'">Explore the work ↗</a></header>';
 if(ok('home'))out+='<section class="aq-hero" id="aq-home"><div class="aq-hero-copy"><span class="aq-eyebrow">A WRITER’S WORLD · '+esc(a.role||'AUTHOR')+'</span><h1>'+esc(h.title||'Stories that stay with you.')+'</h1><p>'+esc(h.text||'Explore books, writings and ideas.')+'</p><div class="aq-hero-actions">'+(ok('books')?'<a class="aq-btn-dark" href="#aq-books">Discover the books <span>↗</span></a>':'')+(ok('profile')?'<a class="aq-text-link" href="#aq-about">Meet the author</a>':'')+'</div><div class="aq-hero-meta"><span>WRITING IN</span><b>'+esc(a.languages||'Words & ideas')+'</b><i></i><span>BASED IN</span><b>'+esc(a.location||'Everywhere')+'</b></div></div><div class="aq-hero-image"><img src="'+esc(a.portrait||d.hero||'')+'" alt="'+esc(name)+'" loading="eager"><div class="aq-vertical-note">AN AUTHOR’S JOURNEY · EST. IN WORDS</div><div class="aq-photo-caption">“'+esc(a.quote||'Every story leaves a trace.')+'”</div></div></section>';
 if(ok('books')&&books.length)out+='<section class="aq-section aq-books" id="aq-books"><div class="aq-heading"><div><span class="aq-eyebrow">THE LIBRARY</span><h2>Books & publications<span>.</span></h2><p>Stories, poems and ideas collected between two covers.</p></div>'+(ok('bookSearch')?'<label class="aq-search"><span>⌕</span><input type="search" data-book-search placeholder="Search titles, genre or language" aria-label="Search books"></label>':'')+'</div>'+(ok('bookSearch')?'<div class="aq-filters"><button class="active" type="button" data-book-filter="all">All books</button>'+[...new Set(books.map(x=>x.genre||'Other'))].map(x=>'<button type="button" data-book-filter="'+esc(x.toLowerCase())+'">'+esc(x)+'</button>').join('')+'</div>':'')+'<div class="aq-book-grid">'+books.map(x=>'<article class="aq-book-card" data-book-card data-genre="'+esc(String(x.genre||'other').toLowerCase())+'" data-search="'+esc([x.title,x.subtitle,x.genre,x.language,x.publisher,x.synopsis].join(' ').toLowerCase())+'"><div class="aq-cover-wrap"><img src="'+esc(x.cover||'')+'" alt="'+esc(x.title)+' cover" loading="lazy">'+(x.featured?'<span class="aq-featured">FEATURED TITLE</span>':'')+'</div><div class="aq-book-info"><span class="aq-book-genre">'+esc(x.genre||'PUBLICATION')+' · '+esc(x.language||'')+'</span><h3>'+esc(x.title||'Untitled book')+'</h3><p class="aq-book-subtitle">'+esc(x.subtitle||'')+'</p><p class="aq-synopsis">'+esc(x.synopsis||'')+'</p><div class="aq-book-meta">'+[[x.publisher,'Publisher'],[x.published,'Year'],[x.pages,x.pages?'Pages':''],[x.format,'Format']].filter(z=>z[0]).map(z=>'<span>'+esc(z[1])+': '+esc(z[0])+'</span>').join('')+'</div><div class="aq-book-actions">'+(x.price?'<strong class="aq-price">'+esc(x.price)+'</strong>':'')+(x.buyUrl&&/^https?:\/\//i.test(x.buyUrl)?'<a class="aq-btn-dark" href="'+esc(x.buyUrl)+'" target="_blank" rel="noopener noreferrer">Buy / publisher ↗</a>':'')+download(x.sampleFile,'Read sample',x.sampleFileName)+download(x.fullFile,'Download book',x.fullFileName)+'</div></div></article>').join('')+'</div><p class="aq-empty" data-book-empty hidden>No books match your search.</p></section>';
 if(ok('works')&&works.length)out+='<section class="aq-section aq-works" id="aq-works"><div class="aq-heading"><div><span class="aq-eyebrow">BEYOND THE BOOKS</span><h2>Creative works & writings<span>.</span></h2><p>Poems, short stories, essays, research, scripts and other work.</p></div></div><div class="aq-work-grid">'+works.map(x=>'<article class="aq-work-card">'+(x.image?'<img src="'+esc(x.image)+'" alt="" loading="lazy">':'<div class="aq-work-placeholder">A·Q</div>')+'<div class="aq-work-info"><span>'+esc(x.type||'WRITING')+' · '+esc(x.language||'')+'</span><h3>'+esc(x.title||'Untitled work')+'</h3><small>'+esc(x.date||'')+'</small><p>'+esc(x.summary||'')+'</p><div class="aq-inline-actions">'+download(x.file,'Open / download',x.fileName)+(x.url&&/^https?:\/\//i.test(x.url)?'<a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">Read / listen ↗</a>':'')+'</div></div></article>').join('')+'</div></section>';
 if(ok('articles')&&articles.length)out+='<section class="aq-section aq-journal" id="aq-journal"><div class="aq-heading"><div><span class="aq-eyebrow">FROM THE DESK</span><h2>Articles & journal<span>.</span></h2><p>Thoughts on reading, writing, life and the creative process.</p></div></div><div class="aq-article-grid">'+articles.map((x,i)=>'<article class="aq-article"><div class="aq-article-image">'+(x.image?'<img src="'+esc(x.image)+'" alt="" loading="lazy">':'<span>NOTES / '+String(i+1).padStart(2,'0')+'</span>')+'</div><div class="aq-article-copy"><small>'+esc(x.category||'JOURNAL')+' · '+dateFmt(x.date)+'</small><h3>'+esc(x.title||'Untitled article')+'</h3><p>'+esc(x.excerpt||'')+'</p>'+(x.content?'<details><summary>Read article</summary><div class="aq-article-content">'+esc(x.content).replace(/\n/g,'<br>')+'</div></details>':'')+(x.url&&/^https?:\/\//i.test(x.url)?'<a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">Continue reading ↗</a>':'')+'</div></article>').join('')+'</div></section>';
 if(ok('events')&&events.length)out+='<section class="aq-section aq-events"><div class="aq-heading"><div><span class="aq-eyebrow">MEET & CONNECT</span><h2>Events & appearances<span>.</span></h2></div></div><div class="aq-event-list">'+events.map(x=>'<article><div class="aq-event-date"><b>'+esc(x.date?new Date(x.date+'T00:00:00').getDate(): '—')+'</b><small>'+esc(x.date?new Date(x.date+'T00:00:00').toLocaleDateString(undefined,{month:'short',year:'numeric'}):'DATE TBA')+'</small></div><div><span>'+esc(x.type||'EVENT')+' · '+esc(x.time||'')+'</span><h3>'+esc(x.title||'Author event')+'</h3><p>'+esc([x.venue,x.location].filter(Boolean).join(' · '))+'</p><small>'+esc(x.description||'')+'</small></div>'+(x.url&&/^https?:\/\//i.test(x.url)?'<a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">Details ↗</a>':'')+'</article>').join('')+'</div></section>';
 if(ok('awards')&&awards.length)out+='<section class="aq-section aq-awards"><div class="aq-heading"><div><span class="aq-eyebrow">MILESTONES</span><h2>Awards & recognition<span>.</span></h2></div></div><div class="aq-award-grid">'+awards.map(x=>'<article><span>✳</span><div><small>'+esc(x.year||'')+' · '+esc(x.organization||'')+'</small><h3>'+esc(x.title||'Recognition')+'</h3><p>'+esc(x.description||'')+'</p>'+(x.url&&/^https?:\/\//i.test(x.url)?'<a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">View recognition ↗</a>':'')+'</div></article>').join('')+'</div></section>';
 if(ok('profile'))out+='<section class="aq-about" id="aq-about"><div class="aq-about-image"><img src="'+esc(a.portrait||d.hero||'')+'" alt="'+esc(name)+'" loading="lazy"></div><div class="aq-about-copy"><span class="aq-eyebrow">A LITTLE ABOUT THE AUTHOR</span><h2>'+esc(name)+(a.penName?' <small>('+esc(a.penName)+')</small>':'')+'</h2><b>'+esc(a.role||'Writer & storyteller')+'</b><p>'+esc(a.bio||'')+'</p><div class="aq-tags">'+[...(a.genres||'').split(/[,;]/),...(a.languages||'').split(/[,;]/)].map(x=>x.trim()).filter(Boolean).map(x=>'<span>'+esc(x)+'</span>').join('')+'</div><blockquote>'+esc(a.quote||'')+'</blockquote></div></section>';
 if(ok('gallery')&&gallery.length)out+='<section class="aq-section aq-gallery"><div class="aq-heading"><div><span class="aq-eyebrow">FRAGMENTS & MOMENTS</span><h2>Life around the writing<span>.</span></h2></div></div><div class="aq-gallery-grid">'+gallery.map(x=>'<figure><img src="'+esc(x.image||'')+'" alt="'+esc(x.title||'')+'" loading="lazy"><figcaption>'+esc(x.title||'')+'</figcaption></figure>').join('')+'</div></section>';
 if(ok('media')&&media.length)out+='<section class="aq-section aq-media"><div class="aq-heading"><div><span class="aq-eyebrow">LISTEN · WATCH · DISCOVER</span><h2>Talks & interviews<span>.</span></h2></div></div><div class="aq-media-grid">'+media.map(x=>'<article>'+(x.thumbnail?'<img src="'+esc(x.thumbnail)+'" alt="" loading="lazy">':'<div class="aq-work-placeholder">A·Q</div>')+'<div><small>'+esc(x.type||'MEDIA')+' '+esc(x.duration||'')+'</small><h3>'+esc(x.title||'Media')+'</h3><p>'+esc(x.description||'')+'</p>'+(x.file?'<audio controls preload="none" src="'+esc(safeLink(x.file))+'"></audio>':'')+(x.url&&/^https?:\/\//i.test(x.url)?'<a href="'+esc(x.url)+'" target="_blank" rel="noopener noreferrer">Watch / listen ↗</a>':'')+'</div></article>').join('')+'</div></section>';
 if(ok('contact'))out+='<section class="aq-contact" id="aq-contact"><div><span class="aq-eyebrow">LET’S STAY IN TOUCH</span><h2>For readers, booksellers & collaborators.</h2><p>For book enquiries, interviews, speaking invitations, rights and collaborations, please get in touch.</p><div class="aq-contact-meta">'+(c.email?'<a href="mailto:'+esc(c.email)+'">'+esc(c.email)+'</a>':'')+(c.phone?'<a href="tel:'+esc(String(c.phone).replace(/[^\d+]/g,''))+'">'+esc(c.phone)+'</a>':'')+(c.address?'<span>'+esc(c.address)+'</span>':'')+'</div></div><form data-reader-form><label>Your name<input name="name" required placeholder="Your name"></label><label>Email or phone<input name="reply" required placeholder="How can we reach you?"></label><label>Message<textarea name="message" required rows="4" placeholder="Write your message..."></textarea></label><button type="submit">Send a message ↗</button><small data-reader-feedback aria-live="polite"></small></form></section>';
 if(ok('social'))out+='<div class="aq-social">'+[['Instagram',social.instagram],['Facebook',social.facebook],['YouTube',social.youtube],['LinkedIn',social.linkedin],['Goodreads',social.goodreads]].filter(x=>x[1]&&/^https?:\/\//i.test(x[1])).map(x=>'<a href="'+esc(x[1])+'" target="_blank" rel="noopener noreferrer">'+x[0]+' ↗</a>').join('')+'</div>';
 if(ok('privacy'))out+='<section class="aq-privacy"><span>'+esc(d.privacyPolicy||'Reader information is used only to respond to enquiries.')+'</span></section>';
 out+='<footer class="aq-footer"><div><b>'+esc(b.businessName||name)+'</b><span>THE AUTHOR’S OFFICIAL WEBSITE</span></div><small>© '+new Date().getFullYear()+' '+esc(name)+'. All rights reserved.</small></footer></div>';
 return out;
}
export function init(root,d={},selected=[]){scMobileNav(arguments[0]);
 const site=root.querySelector('[data-author-site]');if(!site)return;
 let filter='all',query='';
 const apply=()=>{let visible=0;site.querySelectorAll('[data-book-card]').forEach(card=>{const show=(filter==='all'||card.dataset.genre===filter)&&(card.dataset.search||'').includes(query);card.hidden=!show;if(show)visible++});const empty=site.querySelector('[data-book-empty]');if(empty)empty.hidden=visible>0};
 site.querySelector('[data-book-search]')?.addEventListener('input',e=>{query=e.target.value.toLowerCase().trim();apply()});
 site.addEventListener('click',e=>{const f=e.target.closest('[data-book-filter]');if(f){filter=f.dataset.bookFilter;site.querySelectorAll('[data-book-filter]').forEach(x=>x.classList.toggle('active',x===f));apply()}});
 const form=site.querySelector('[data-reader-form]');if(form)form.addEventListener('submit',e=>{e.preventDefault();const v=k=>String(new FormData(form).get(k)||'').trim();const msg='AUTHOR WEBSITE MESSAGE\nName: '+v('name')+'\nEmail / phone: '+v('reply')+'\nMessage: '+v('message');const phone=selected.includes('contact')?digits(d.contact?.whatsapp):'';if(phone){window.open('https://wa.me/'+phone+'?text='+encodeURIComponent(msg),'_blank','noopener');form.querySelector('[data-reader-feedback]').textContent='WhatsApp opened with your message. Review it and press Send.'}else if(d.contact?.email){location.href='mailto:'+encodeURIComponent(d.contact.email)+'?subject='+encodeURIComponent('Reader enquiry')+'&body='+encodeURIComponent(msg);form.querySelector('[data-reader-feedback]').textContent='Your email app is opening with the message.'}else form.querySelector('[data-reader-feedback]').textContent='Please use the contact details shown above.'});
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
export function render(d={},selected=[]){return scConnect(scAuthorExtras(scBaseRender(d,selected),d,selected),d,selected);}

/* Reader reviews before the contact section, and a WhatsApp button when a number is set. */
function scAuthorExtras(html,d,selected){
  const reviews=(d.reviews||[]).filter(x=>x&&x.enabled!==false&&x.text);
  let block='';
  if((selected||[]).includes('reviews')&&reviews.length){
    block='<section class="aq-section aq-reviews" id="aq-reviews"><span class="aq-eyebrow">FROM READERS</span><h2>What readers are saying</h2><div class="aq-review-grid">'+
      reviews.map(x=>{const r=Math.max(0,Math.min(5,Number(x.rating)||0));return '<figure>'+(r?'<div class="aq-stars" aria-label="'+r+' out of 5">'+'★'.repeat(r)+'</div>':'')+'<blockquote>“'+scEsc(x.text)+'”</blockquote><figcaption>'+scEsc(x.name||'Reader')+'</figcaption></figure>'}).join('')+'</div></section>';
    const m=html.search(/<section[^>]*id="aq-contact"/);
    html=m>=0?html.slice(0,m)+block+html.slice(m):html;
  }
  const wa=String((d.contact||{}).whatsapp||'').replace(/\D/g,'');
  if(wa&&(selected||[]).includes('contact')){
    const i=html.lastIndexOf('</div>');
    const btn='<a class="aq-wa-float" href="https://wa.me/'+wa+'?text='+encodeURIComponent('Hello, I would like to get in touch about your books.')+'" target="_blank" rel="noopener" aria-label="Message on WhatsApp">WhatsApp</a>';
    html=i>=0?html.slice(0,i)+btn+html.slice(i):html+btn;
  }
  return html;
}
