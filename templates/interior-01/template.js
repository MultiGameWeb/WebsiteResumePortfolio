const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const safe=v=>String(v??'').replace(/[^0-9]/g,'');
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:0};
const fmt=n=>new Intl.NumberFormat('en-IN',{maximumFractionDigits:0}).format(Math.max(0,num(n)));
const money=(cur,n)=>esc(cur||'₹')+fmt(n);
export function render(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},s=d.settings||{},e=d.consultation||{},est=d.estimator||{},ok=x=>selected.includes(x);
  const projects=(d.projects||[]).filter(x=>x.enabled!==false);
  const materials=(d.materials||[]).filter(x=>x.enabled!==false);
  const services=(d.services||[]).filter(x=>x.enabled!==false);
  const team=(d.team||[]).filter(x=>x.enabled!==false);
  const reviews=(d.reviews||[]).filter(x=>x.enabled!==false);
  const faq=(d.faq||[]).filter(x=>x.enabled!==false);
  const featured=projects.filter(x=>x.featured).slice(0,3);
  const shownProjects=featured.length?featured:projects.slice(0,3);
  let html='<div class="site-preview interior-01">';
  html+='<header class="id-nav"><a class="id-brand" href="#home"><span class="id-brand-mark">AF</span><span><strong>'+esc(b.businessName||'Your Design Studio')+'</strong><small>'+esc(b.tagline||'INTERIOR DESIGN · ARCHITECTURE · EXECUTION')+'</small></span></a><nav>';
  if(ok('home'))html+='<a href="#home">Home</a>';
  if(ok('projects'))html+='<a href="#projects">Projects</a>';
  if(ok('floorplans'))html+='<a href="#floorplans">Floor Plans</a>';
  if(ok('materials'))html+='<a href="#materials">Materials</a>';
  if(ok('services'))html+='<a href="#services">Services</a>';
  if(ok('estimator'))html+='<a href="#estimator">Estimator</a>';
  if(ok('consultation'))html+='<a href="#consultation">Consultation</a>';
  html+='</nav><div class="id-nav-actions">'+(ok('whatsapp')&&c.whatsapp?'<a class="id-mini id-accent" target="_blank" href="https://wa.me/'+safe(c.whatsapp)+'">WhatsApp</a>':'')+'<a class="template-admin-link" href="admin.html?template=interior-01">Admin</a></div></header>';

  if(ok('home'))html+='<section id="home" class="id-hero"><div class="id-hero-copy"><span class="id-kicker">INTERIOR DESIGN · ARCHITECTURE · CRAFT</span><h1>'+esc(h.title||'Interiors with a point of view.')+'</h1><p>'+esc(h.text||'Thoughtful spaces, carefully specified.')+'</p><div class="id-actions">'+(ok('consultation')?'<a class="id-btn primary" href="#consultation">Start a consultation <span>↗</span></a>':'')+(ok('estimator')?'<a class="id-btn ghost" href="#estimator">Explore project budget <span>↓</span></a>':'')+'</div><div class="id-hero-stats"><div><strong>'+projects.length+'</strong><span>featured projects</span></div><div><strong>'+materials.length+'</strong><span>material scopes</span></div><div><strong>2D + 3D</strong><span>planning support</span></div></div></div><div class="id-hero-media"><img src="'+esc(d.hero||'')+'" alt="'+esc(b.businessName||'Interior studio')+'"><div class="id-hero-badge"><span>DESIGN NOTE</span><strong>Function first.<br>Character always.</strong></div></div></section>';

  if(ok('about'))html+='<section class="id-section id-about"><div class="id-section-head"><span class="id-kicker">ABOUT THE STUDIO</span><h2>We design the feeling of a space — then detail the way it works.</h2></div><div class="id-about-copy"><p>'+esc(b.about||'Add your studio story here.')+'</p><div class="id-about-grid"><div><strong>01</strong><span>Brief & planning</span></div><div><strong>02</strong><span>Design & visualization</span></div><div><strong>03</strong><span>Materials & detailing</span></div><div><strong>04</strong><span>Execution & handover</span></div></div></div></section>';

  if(ok('projects'))html+='<section id="projects" class="id-section id-projects"><div class="id-section-head split"><div><span class="id-kicker">SELECTED WORK</span><h2>Projects that balance architecture, interiors and everyday life.</h2></div><span class="id-count">'+projects.length+' projects</span></div><div class="id-project-grid">'+shownProjects.map((p,i)=>'<article class="id-project-card '+(i===0?'large':'')+'"><div class="id-project-img"><img src="'+esc(p.coverImage||'')+'" alt="'+esc(p.title||'Project')+'"><span class="id-project-index">0'+(i+1)+'</span></div><div class="id-project-body"><div class="id-project-meta"><span>'+esc(p.type||'Project')+'</span><span>'+esc(p.location||'')+'</span></div><h3>'+esc(p.title||'Untitled project')+'</h3><p>'+esc(p.summary||'')+'</p><div class="id-project-foot"><span>'+esc(p.area||'')+'</span><span>'+esc(p.year||'')+'</span></div></div></article>').join('')+'</div></section>';

  if(ok('floorplans'))html+='<section id="floorplans" class="id-section id-plans"><div class="id-section-head split"><div><span class="id-kicker">PLANS & VISUALIZATION</span><h2>Show the plan. Show the finished idea.</h2></div><p>Use the drawings below as a clean showcase for planning, zoning and 3D spatial intent.</p></div><div class="id-plan-grid">'+projects.map((p,i)=>'<article class="id-plan-card"><div class="id-plan-top"><span>0'+(i+1)+'</span><div><strong>'+esc(p.title||'Project')+'</strong><small>'+esc(p.type||'')+' · '+esc(p.area||'')+'</small></div></div><div class="id-plan-images">'+(p.floorPlan2D?'<button class="id-plan-image js-lightbox" data-image="'+esc(p.floorPlan2D)+'" data-title="'+esc((p.title||'Project')+' · 2D Floor Plan')+'"><img src="'+esc(p.floorPlan2D)+'" alt="2D floor plan"><span>2D Plan</span></button>':'')+(p.floorPlan3D?'<button class="id-plan-image js-lightbox" data-image="'+esc(p.floorPlan3D)+'" data-title="'+esc((p.title||'Project')+' · 3D View')+'"><img src="'+esc(p.floorPlan3D)+'" alt="3D floor plan"><span>3D View</span></button>':'')+'</div></article>').join('')+'</div></section>';

  if(ok('materials'))html+='<section id="materials" class="id-section id-materials"><div class="id-section-head split"><div><span class="id-kicker">MATERIAL PALETTE</span><h2>Let clients choose the language of the space.</h2></div><p>Select the material scopes you want to discuss during consultation.</p></div><div class="id-material-grid">'+materials.map(m=>'<label class="id-material-card"><input class="js-material" type="checkbox" data-addon="'+num(m.addonPerSqft)+'" checked><span class="id-check">✓</span><span class="id-material-copy"><strong>'+esc(m.name||'Material')+'</strong><small>'+esc(m.quality||'')+'</small><p>'+esc(m.description||'')+'</p></span><em>+'+fmt(m.addonPerSqft||0)+'/sq.ft</em></label>').join('')+'</div></section>';

  if(ok('services'))html+='<section id="services" class="id-section id-services"><div class="id-section-head"><span class="id-kicker">CAPABILITIES</span><h2>One studio. From first sketch to final finish.</h2></div><div class="id-service-list">'+services.map((x,i)=>'<article><span>0'+(i+1)+'</span><div><h3>'+esc(x.name||'Design service')+'</h3><p>'+esc(x.description||'')+'</p></div><b>↗</b></article>').join('')+'</div></section>';

  if(ok('team'))html+='<section class="id-section id-team"><div class="id-section-head"><span class="id-kicker">THE PEOPLE BEHIND THE DETAILS</span><h2>Designers who think in plans, materials and lived experience.</h2></div><div class="id-team-grid">'+team.map(x=>'<article class="id-team-card"><img src="'+esc(x.image||'')+'" alt="'+esc(x.name||'Designer')+'"><div class="id-team-copy"><span>'+esc(x.role||'')+'</span><h3>'+esc(x.name||'Designer')+'</h3><p>'+esc(x.specialization||'')+'</p><small>'+esc(x.credentials||'')+'</small></div></article>').join('')+'</div></section>';

  if(ok('reviews'))html+='<section class="id-section id-reviews"><div class="id-section-head split"><div><span class="id-kicker">CLIENT NOTES</span><h2>What it feels like to work together.</h2></div><span class="id-rating">5.0 ★</span></div><div class="id-review-grid">'+reviews.map(x=>'<article><div class="id-stars">'+('★'.repeat(Math.max(1,Math.min(5,num(x.rating)||5))))+'</div><p>“'+esc(x.text||'')+'”</p><strong>'+esc(x.name||'Client')+'</strong></article>').join('')+'</div></section>';

  if(ok('estimator')){
    const q=Array.isArray(est.qualityTiers)&&est.qualityTiers.length?est.qualityTiers:[{id:'Basic',label:'Essential',note:'Practical selections',rate:1250},{id:'Premium',label:'Premium',note:'Higher-grade detailing',rate:1850},{id:'Luxury',label:'Luxury',note:'Custom detailing',rate:2800}];
    const types=Array.isArray(est.projectTypes)&&est.projectTypes.length?est.projectTypes:[{id:'Apartment',label:'Apartment',multiplier:1},{id:'Villa',label:'Villa',multiplier:1.15}];
    const rows=Array.isArray(est.rows)?est.rows.filter(x=>x.enabled!==false):[];
    html+='<section id="estimator" class="id-section id-estimator"><div class="id-section-head split"><div><span class="id-kicker">BUDGET PLANNING</span><h2>Explore an indicative interior budget before the first meeting.</h2></div><p>Built for quick planning only. Final cost depends on drawings, quantities, brands, site conditions and the written quotation.</p></div><div class="id-estimator-grid"><div class="id-estimator-form"><div class="id-estimator-row"><label>Project type<select id="idSpaceType">'+types.map(x=>'<option value="'+esc(x.id)+'" data-multiplier="'+num(x.multiplier)+'">'+esc(x.label)+'</option>').join('')+'</select></label><label>Area (sq.ft)<input id="idArea" type="number" min="200" step="50" value="1800"></label></div><div class="id-quality-grid">'+q.map((x,i)=>'<label class="id-quality-card '+(i===1?'active':'')+'"><input type="radio" name="idQuality" value="'+esc(x.id)+'" '+(i===1?'checked':'')+'><span>'+esc(x.label||x.id)+'</span><strong>'+money(est.currency||'₹',x.rate||0)+' / sq.ft</strong><small>'+esc(x.note||'')+'</small></label>').join('')+'</div><div class="id-table-wrap"><table class="id-cost-table"><thead><tr><th>Cost category</th><th>Essential</th><th>Premium</th><th>Luxury</th></tr></thead><tbody>'+rows.map(r=>'<tr><td><strong>'+esc(r.category||'Cost item')+'</strong><small>'+esc(r.note||'')+'</small></td><td>'+money(est.currency||'₹',r.basic||0)+'</td><td>'+money(est.currency||'₹',r.premium||0)+'</td><td>'+money(est.currency||'₹',r.luxury||0)+'</td></tr>').join('')+'</tbody></table></div></div><aside class="id-estimate-result"><span>Indicative estimate</span><strong id="idEstimateValue">'+money(est.currency||'₹',0)+'</strong><small id="idEstimateNote">Enter area and choose a quality tier.</small><div class="id-estimate-breakdown" id="idEstimateBreakdown"></div><a class="id-btn primary" href="#consultation">Discuss this estimate <span>↗</span></a></aside></div></section>';
  }

  if(ok('consultation'))html+='<section id="consultation" class="id-section id-consultation"><div class="id-consultation-copy"><span class="id-kicker">START A PROJECT</span><h2>'+esc(e.heading||'Tell us about the space you want to create.')+'</h2><p>'+esc(e.text||'Share the basics. We will use the consultation to understand your brief, budget, timeline and design direction.')+'</p><div class="id-contact-points">'+(c.phone?'<a href="tel:'+safe(c.phone)+'"><span>Call</span>'+esc(c.phone)+'</a>':'')+(ok('whatsapp')&&c.whatsapp?'<a target="_blank" href="https://wa.me/'+safe(c.whatsapp)+'"><span>WhatsApp</span>Start a chat</a>':'')+'</div></div><form id="idLeadForm" class="id-form"><div class="id-form-grid"><label>Name<input name="name" required placeholder="Your name"></label><label>Phone<input name="phone" required type="tel" placeholder="+91"></label><label>Email<input name="email" type="email" placeholder="you@example.com"></label><label>Project / Requirement<input name="project" placeholder="3 BHK villa interior"></label><label>Space type<select name="spaceType"><option>Apartment</option><option>Villa</option><option>Office</option><option>Retail / Studio</option><option>Penthouse</option><option>Renovation</option></select></label><label>Area<input name="area" placeholder="e.g. 1800 sq.ft"></label><label>Budget<input name="budget" placeholder="e.g. ₹25–35 lakh"></label><label>Timeline<input name="timeline" placeholder="e.g. 4–6 months"></label></div><label>Message<textarea name="message" placeholder="Tell us about your style, rooms, priorities or special requirements"></textarea></label><button class="id-btn primary" type="submit">'+esc(e.buttonText||'Request consultation')+' <span>↗</span></button><p class="id-form-note" id="idLeadNotice"></p></form></section>';

  if(ok('faq'))html+='<section class="id-section id-faq"><div class="id-section-head"><span class="id-kicker">FAQ</span><h2>Practical answers before you begin.</h2></div><div class="id-faq-list">'+faq.map(x=>'<details><summary>'+esc(x.question||'Question')+'<span>+</span></summary><p>'+esc(x.answer||'')+'</p></details>').join('')+'</div></section>';

  if(ok('location')||ok('contact'))html+='<section class="id-section id-location"><div><span class="id-kicker">VISIT THE STUDIO</span><h2>Bring the brief. Leave with a clearer direction.</h2><p>'+esc(c.address||'Add studio address here.')+'</p><p>'+esc(c.hours||'')+(c.email?' · '+esc(c.email):'')+'</p></div>'+(c.maps?'<a class="id-map-card" target="_blank" href="'+esc(c.maps)+'"><span>OPEN MAP</span><strong>Studio location ↗</strong><small>'+esc(c.address||'View directions')+'</small></a>':'')+'</section>';

  if(ok('terms')||ok('privacy'))html+='<section class="id-footer-legal">'+(ok('terms')?'<details><summary>Terms & Conditions</summary><p>'+esc(d.termsText||'')+'</p></details>':'')+(ok('privacy')?'<details><summary>Privacy Policy</summary><p>'+esc(d.privacyPolicy||'')+'</p></details>':'')+'</section>';

  html+='<div class="id-footer"><div><strong>'+esc(b.businessName||'Your Design Studio')+'</strong><span>'+esc(b.tagline||'')+'</span></div><div class="id-footer-links">'+(c.phone?'<a href="tel:'+safe(c.phone)+'">Call</a>':'')+(c.email?'<a href="mailto:'+esc(c.email)+'">Email</a>':'')+(ok('whatsapp')&&c.whatsapp?'<a target="_blank" href="https://wa.me/'+safe(c.whatsapp)+'">WhatsApp</a>':'')+'</div></div>';
  if(ok('whatsapp')&&c.whatsapp)html+='<a class="id-float-wa" target="_blank" href="https://wa.me/'+safe(c.whatsapp)+'">WhatsApp ↗</a>';
  html+='<div class="id-lightbox" id="idLightbox" aria-hidden="true"><button class="id-lightbox-close" type="button">Close</button><img id="idLightboxImage" src="" alt=""><strong id="idLightboxTitle"></strong></div>';
  return html+'</div>';
}
export function init(root,d={}){
  root.querySelectorAll('.js-lightbox').forEach(btn=>btn.addEventListener('click',()=>{const box=root.querySelector('#idLightbox');const img=root.querySelector('#idLightboxImage');const title=root.querySelector('#idLightboxTitle');img.src=btn.dataset.image||'';title.textContent=btn.dataset.title||'';box.classList.add('open');box.setAttribute('aria-hidden','false')}));
  const close=()=>{const box=root.querySelector('#idLightbox');if(box){box.classList.remove('open');box.setAttribute('aria-hidden','true')}};
  root.querySelectorAll('.id-lightbox-close').forEach(x=>x.addEventListener('click',close));
  root.querySelectorAll('#idLightbox').forEach(x=>x.addEventListener('click',ev=>{if(ev.target===x)close()}));
  const form=root.querySelector('#idLeadForm');
  if(form)form.addEventListener('submit',ev=>{
    ev.preventDefault();
    const fd=new FormData(form),lead=Object.fromEntries(fd.entries());
    lead.createdAt=new Date().toISOString();
    try{const state=Store.read();const data=structuredClone(state.data||d||{});data.leads=Array.isArray(data.leads)?data.leads:[];data.leads.unshift(lead);Store.update({data});const n=root.querySelector('#idLeadNotice');if(n)n.textContent='Thanks — your consultation request has been saved. We will contact you to confirm the next step.';form.reset()}catch{const n=root.querySelector('#idLeadNotice');if(n)n.textContent='Your request could not be saved in this browser.'}
    const wa=d.contact?.whatsapp;
    if(wa){const msg=['Interior consultation enquiry',lead.name,lead.phone,lead.project,lead.spaceType,lead.area,lead.budget,lead.timeline,lead.message].filter(Boolean).join(' | ');window.open('https://wa.me/'+safe(wa)+'?text='+encodeURIComponent(msg),'_blank')}
  });
  const area=root.querySelector('#idArea'),space=root.querySelector('#idSpaceType'),value=root.querySelector('#idEstimateValue'),note=root.querySelector('#idEstimateNote'),breakdown=root.querySelector('#idEstimateBreakdown');
  const quality=()=>root.querySelector('input[name="idQuality"]:checked')?.value||'Premium';
  const rates=d.estimator||{};
  const update=()=>{
    if(!area||!value)return;
    const a=Math.max(0,num(area.value)),q=quality(),type=space?.selectedOptions?.[0],mult=Math.max(.5,num(type?.dataset?.multiplier||1));
    const base=(rates.baseRates?.[q]||0)*a*mult;
    const selectedMaterials=[...root.querySelectorAll('.js-material:checked')].reduce((sum,x)=>sum+num(x.dataset.addon),0);
    const materialCost=selectedMaterials*a;
    const total=base+materialCost;
    value.textContent=(rates.currency||'₹')+fmt(total);
    note.textContent=a?('Based on '+fmt(a)+' sq.ft · '+q+' · '+(type?.textContent||'selected space')):'Enter an area to see an estimate.';
    breakdown.innerHTML='<div><span>Design + base package</span><strong>'+(rates.currency||'₹')+fmt(base)+'</strong></div><div><span>Selected material scope</span><strong>'+(rates.currency||'₹')+fmt(materialCost)+'</strong></div><div><span>Rate guide</span><strong>'+(rates.currency||'₹')+fmt(rates.baseRates?.[q]||0)+'/sq.ft</strong></div>';
  };
  root.querySelectorAll('input[name="idQuality"]').forEach(x=>x.addEventListener('change',()=>{root.querySelectorAll('.id-quality-card').forEach(c=>c.classList.remove('active'));x.closest('.id-quality-card')?.classList.add('active');update()}));
  [area,space].filter(Boolean).forEach(x=>x.addEventListener('input',update));
  if(space)space.addEventListener('change',update);
  root.querySelectorAll('.js-material').forEach(x=>x.addEventListener('change',update));
  update();
}