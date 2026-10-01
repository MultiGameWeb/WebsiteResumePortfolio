const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=v=>String(v??'').replace(/[^0-9]/g,'');
const wa=(n,msg='')=>{const p=safe(n);return p?'https://wa.me/'+p+(msg?'?text='+encodeURIComponent(msg):''):''};
const txt=v=>String(v??'');
const image=(src,alt='')=>src?'<img src="'+esc(src)+'" alt="'+esc(alt)+'" loading="lazy">':'';

export function render(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},hours=d.hours||{},trial=d.trial||{},s=d.settings||{},ok=id=>selected.includes(id);
  const slides=(d.heroSlides||[]).filter(x=>x.enabled!==false&&x.image);
  const plans=(d.plans||[]).filter(x=>x.enabled!==false);
  const trainers=(d.trainers||[]).filter(x=>x.enabled!==false);
  const schedule=(d.schedule||[]).filter(x=>x.enabled!==false);
  const facilities=(d.facilities||[]).filter(x=>x.enabled!==false&&x.image);
  const transformations=(d.transformations||[]).filter(x=>x.enabled!==false&&x.beforeImage&&x.afterImage);
  const products=(d.products||[]).filter(x=>x.enabled!==false&&x.image);
  const gallery=(d.gallery||[]).filter(x=>x.enabled!==false&&x.image);
  const reviews=(d.reviews||[]).filter(x=>x.enabled!==false);
  const faq=(d.faq||[]).filter(x=>x.enabled!==false);
  const goals=txt(trial.goalsText||'Weight Loss,Muscle Gain,General Fitness').split(',').map(x=>x.trim()).filter(Boolean);
  const firstSlide=slides[0]?.image||'';
  const planCards=plans.map(p=>{
    const fs=Array.isArray(p.features)?p.features:txt(p.features).split(/\r?\n/);
    return '<article class="gym-plan '+(p.featured?'featured':'')+'">'+
      (p.featured?'<span class="gym-plan-badge">Most Popular</span>':'')+
      '<h3>'+esc(p.name||'Membership')+'</h3>'+
      '<div class="gym-plan-offer">'+esc(p.offer||'')+'</div>'+
      '<div class="gym-plan-prices">'+
        '<div class="gym-price"><span>Monthly</span><strong>'+esc(p.monthly||'—')+'</strong></div>'+
        '<div class="gym-price"><span>Quarterly</span><strong>'+esc(p.quarterly||'—')+'</strong></div>'+
        '<div class="gym-price"><span>Annual</span><strong>'+esc(p.annual||'—')+'</strong></div>'+
      '</div>'+
      '<div class="gym-plan-save">'+esc(p.discount||'')+'</div>'+
      '<ul>'+fs.filter(Boolean).map(f=>'<li><span class="gym-check">✓</span>'+esc(f)+'</li>').join('')+'</ul>'+
      '<a class="gym-cta" href="#trial" data-plan="'+esc(p.name||'')+'">Choose Plan</a>'+
    '</article>';
  }).join('');

  let html='<div class="gym-preview-wrap">';
  html+='<header class="gym-nav"><a class="gym-brand" href="#home"><span class="gym-mark">FG</span><span><strong>'+esc(b.businessName||'Forge Fitness Club')+'</strong><small>'+esc(b.tagline||'FITNESS & PERFORMANCE')+'</small></span></a><nav>';
  if(ok('home'))html+='<a href="#home">Home</a>';
  if(ok('membership'))html+='<a href="#membership">Plans</a>';
  if(ok('trainers'))html+='<a href="#trainers">Trainers</a>';
  if(ok('schedule'))html+='<a href="#schedule">Classes</a>';
  if(ok('facilities'))html+='<a href="#facilities">Facilities</a>';
  if(ok('trial'))html+='<a class="gym-cta" href="#trial">Join Now</a>';
  html+='</nav></header>';

  if(ok('home')){
    html+='<section class="gym-hero" id="home">';
    html+=slides.map((x,i)=>'<div class="gym-hero-slide '+(i===0?'active':'')+'" data-hero-slide="'+i+'">'+image(x.image,x.title)+'</div>').join('');
    if(txt(d.heroVideo))html+='<video class="gym-hero-video" autoplay muted loop playsinline poster="'+esc(firstSlide)+'"><source src="'+esc(d.heroVideo)+'" type="video/mp4"></video>';
    html+='<div class="gym-hero-content"><div class="gym-eyebrow">'+esc(h.badge||'FREE TRIAL')+'</div><h1>'+esc(h.title||'Build the strongest version of you.')+'</h1><p>'+esc(h.text||'Premium training, expert coaching and flexible memberships.')+'</p><div class="gym-hero-actions"><a class="gym-cta" href="#trial" data-scroll-trial>Start Your Free Trial</a><a class="gym-cta dark" href="#membership">View Memberships</a></div><div class="gym-hero-meta"><span class="gym-pill">'+esc(hours.weekdays||'')+'</span><span class="gym-pill">'+esc(hours.weekends||'')+'</span></div></div>';
    html+='<div class="gym-hero-dots">'+slides.map((x,i)=>'<button type="button" class="'+(i===0?'active':'')+'" data-hero-dot="'+i+'" aria-label="Slide '+(i+1)+'"></button>').join('')+'</div></section>';
  }

  if(ok('about'))html+='<section class="gym-section panel" id="about"><div class="gym-2col"><div class="gym-about-copy"><div class="gym-kicker">01 · About</div><div class="gym-section-head" style="margin-left:0"><h2>A serious place to train.</h2><p>'+esc(b.about||'')+'</p></div></div><div class="gym-about-card"><div class="gym-about-stat"><strong>'+plans.length+'</strong><small>Membership tiers</small></div><div class="gym-about-stat"><strong>'+trainers.length+'</strong><small>Coaches</small></div><div class="gym-about-stat"><strong>'+schedule.length+'</strong><small>Weekly class slots</small></div><div class="gym-about-stat"><strong>1 DAY</strong><small>Guest pass option</small></div></div></div></section>';

  if(ok('membership'))html+='<section class="gym-section dark" id="membership"><div class="gym-section-head"><div class="gym-kicker">02 · Membership</div><h2>Pick your training level.</h2><p>Compare monthly, quarterly and annual plans with clear inclusions, offers and savings. Replace all sample pricing before publishing.</p></div><div class="gym-plan-grid">'+planCards+'</div></section>';

  if(ok('trainers'))html+='<section class="gym-section panel" id="trainers"><div class="gym-section-head"><div class="gym-kicker">03 · Trainers</div><h2>Coaches with a clear specialty.</h2><p>Certifications, specialization and availability stay visible so visitors can ask for the right coach.</p></div><div class="gym-trainer-grid">'+trainers.map(t=>'<article class="gym-trainer"><div class="gym-trainer-img">'+image(t.image,t.name)+'</div><div class="gym-trainer-body"><h3>'+esc(t.name)+'</h3><strong>'+esc(t.role||'Trainer')+'</strong><div class="gym-trainer-tags"><span>'+esc(t.certification||'Certification not added')+'</span><span>'+esc(t.specialization||'Fitness')+'</span></div><p>'+esc(t.bio||'')+'</p><div class="gym-trainer-tags"><span>'+esc(t.availability||'Availability on request')+'</span></div></div></article>').join('')+'</div></section>';

  if(ok('schedule'))html+='<section class="gym-section dark" id="schedule"><div class="gym-section-head"><div class="gym-kicker">04 · Classes</div><h2>Morning & evening batches.</h2><p>Keep the weekly timetable easy to scan across mobile and desktop.</p></div><div class="gym-schedule-wrap"><table class="gym-schedule"><thead><tr><th>Day</th><th>Time</th><th>Class</th><th>Coach</th><th>Level</th></tr></thead><tbody>'+schedule.map(x=>'<tr><td>'+esc(x.day)+'</td><td>'+esc(x.time)+'</td><td>'+esc(x.class)+'</td><td>'+esc(x.coach)+'</td><td>'+esc(x.level)+'</td></tr>').join('')+'</tbody></table></div></section>';

  if(ok('facilities'))html+='<section class="gym-section panel" id="facilities"><div class="gym-section-head"><div class="gym-kicker">05 · Facilities</div><h2>Equipment you can actually see.</h2><p>Highlight the strength floor, cardio, studio, recovery and locker spaces with real photos.</p></div><div class="gym-facility-grid">'+facilities.map(x=>'<article class="gym-facility"><div class="gym-facility-img">'+image(x.image,x.title)+'</div><div class="gym-facility-body"><h3>'+esc(x.title)+'</h3><p>'+esc(x.text)+'</p></div></article>').join('')+'</div></section>';

  if(ok('transformations'))html+='<section class="gym-section dark" id="transformations"><div class="gym-section-head"><div class="gym-kicker">06 · Transformations</div><h2>Real stories, shown responsibly.</h2><p>Replace demo placeholders with authentic member stories, accurate time periods and appropriate permission before publishing.</p></div><div class="gym-transform-grid">'+transformations.map((x,i)=>'<article class="gym-transform"><div class="gym-transform-stage"><img src="'+esc(x.beforeImage)+'" alt="Before" loading="lazy"><div class="gym-transform-after" data-transform-after="'+i+'"><img src="'+esc(x.afterImage)+'" alt="After" loading="lazy"></div><span class="gym-transform-label before">Before</span><span class="gym-transform-label after">After</span></div><div class="gym-transform-control"><small>Drag slider</small><input type="range" min="0" max="100" value="50" data-transform="'+i+'"></div><h3>'+esc(x.title||'Transformation story')+'</h3><p>'+esc(x.period||'')+' · '+esc(x.description||'')+'</p></article>').join('')+'</div></section>';

  if(ok('bmi'))html+='<section class="gym-section panel" id="bmi"><div class="gym-section-head"><div class="gym-kicker">07 · BMI</div><h2>A quick starting point.</h2><p>Calculate a BMI value in the browser as a general screening measure, not a medical diagnosis.</p></div><div class="gym-bmi-grid"><div class="gym-bmi-card"><div class="gym-bmi-form"><label><span>Height (cm)</span><input id="gymBmiHeight" type="number" inputmode="decimal" min="50" max="250" placeholder="170"></label><label><span>Weight (kg)</span><input id="gymBmiWeight" type="number" inputmode="decimal" min="10" max="300" placeholder="70"></label></div><div class="gym-bmi-result"><strong id="gymBmiValue">—</strong><span id="gymBmiLabel">Enter values to calculate.</span></div><div class="gym-note">BMI does not account for every aspect of body composition. Use it as one data point and seek qualified health advice for personal medical questions.</div></div><div class="gym-bmi-card"><h3 style="margin-top:0;font-size:25px">Use the number as a conversation starter.</h3><p style="font-size:12px;line-height:1.8;color:#929c97">Coaches can discuss goals, training history, routine and lifestyle context to help plan fitness sessions. Do not use BMI alone to make medical decisions.</p></div></div></section>';

  if(ok('merchandise'))html+='<section class="gym-section dark" id="merchandise"><div class="gym-section-head"><div class="gym-kicker">08 · Merchandise</div><h2>Products on display.</h2><p>Show apparel, accessories and genuine supplement products without turning the template into an online pharmacy.</p></div><div class="gym-product-grid">'+products.map(p=>'<article class="gym-product"><div class="gym-product-img">'+image(p.image,p.name)+'</div><div class="gym-product-body"><small>'+esc(p.type||'Product')+'</small><h3>'+esc(p.name||'Product')+'</h3><p>'+esc(p.text||'')+'</p><div class="gym-product-price">'+esc(p.price||'Ask gym')+'</div></div></article>').join('')+'</div></section>';

  if(ok('gallery'))html+='<section class="gym-section panel" id="gallery"><div class="gym-section-head"><div class="gym-kicker">09 · Gallery</div><h2>The room sells the experience.</h2></div><div class="gym-gallery">'+gallery.map((x,i)=>'<button class="gym-gallery-item" type="button" data-gallery="'+i+'" data-src="'+esc(x.image)+'" aria-label="Open '+esc(x.title||'Gallery image')+'">'+image(x.image,x.title)+'<span>'+esc(x.title||'Gym')+'</span></button>').join('')+'</div></section>';

  if(ok('reviews'))html+='<section class="gym-section light" id="reviews"><div class="gym-section-head"><div class="gym-kicker">10 · Member Reviews</div><h2>What members say.</h2></div><div class="gym-review-grid">'+reviews.map(x=>'<article class="gym-review"><div class="gym-stars">'+('★'.repeat(Math.max(1,Math.min(5,Number(x.rating)||5))))+'</div><p>'+esc(x.text)+'</p><strong>'+esc(x.name)+'</strong></article>').join('')+'</div></section>';

  if(ok('faq'))html+='<section class="gym-section panel" id="faq"><div class="gym-section-head"><div class="gym-kicker">11 · FAQ</div><h2>Questions before joining.</h2></div><div class="gym-faq">'+faq.map((x,i)=>'<article><button type="button" data-faq="'+i+'"><span>'+String(i+1).padStart(2,'0')+'</span><strong>'+esc(x.question)+'</strong><b>+</b></button><div data-answer hidden><p>'+esc(x.answer)+'</p></div></article>').join('')+'</div></section>';

  if(ok('trial'))html+='<section class="gym-trial" id="trial"><div class="gym-trial-copy"><div class="gym-kicker">12 · Free Trial</div><h2>'+esc(trial.heading||'Start with a free trial.')+'</h2><p>'+esc(trial.text||'Tell us your goal and preferred time.')+'</p><a class="gym-guest" href="'+esc(wa(c.whatsapp,(trial.passText||'1-Day Guest Pass')+' — '+(b.businessName||'Gym')))+'" target="_blank" rel="noopener">'+esc(trial.passText||'1-Day Guest Pass · Book on WhatsApp')+'</a></div><form class="gym-trial-form" id="gymTrialForm"><label><span>Your name *</span><input name="name" required placeholder="Full name"></label><label><span>Phone number *</span><input name="phone" type="tel" required placeholder="+91..."></label><label><span>Your goal</span><select name="goal">'+goals.map(g=>'<option value="'+esc(g)+'">'+esc(g)+'</option>').join('')+'</select></label><label><span>Preferred plan</span><select name="plan"><option value="">Not decided</option>'+plans.map(p=>'<option value="'+esc(p.name||'')+'">'+esc(p.name||'')+'</option>').join('')+'</select></label><label><span>Preferred date</span><input name="date" type="date"></label><label><span>Preferred time</span><input name="time" type="time"></label><label class="gym-trial-wide"><span>Message</span><textarea name="message" rows="4" placeholder="Tell us anything the coach should know."></textarea></label><div class="gym-trial-wide"><button class="gym-cta" type="submit">Request Free Trial</button></div><div class="gym-trial-wide"><div id="gymTrialMsg" style="font-size:10px;color:#d8e5df"></div></div></form></section>';

  if(ok('location'))html+='<section class="gym-section dark" id="location"><div class="gym-section-head"><div class="gym-kicker">13 · Location</div><h2>Make the first visit easy.</h2></div><div class="gym-location"><article class="gym-location-card"><h3>Find '+esc(b.businessName||'the gym')+'</h3><p>'+esc(c.address||'')+'</p><p><strong>Parking:</strong> '+esc(c.parking||'')+'</p><p><strong>Landmarks:</strong> '+esc(c.landmarks||'')+'</p><div class="gym-location-links"><a class="gym-cta" target="_blank" rel="noopener" href="'+esc(c.maps||'#')+'">Open Google Maps</a><a class="gym-cta dark" href="'+esc(wa(c.whatsapp,'I want to enquire about joining '+(b.businessName||'the gym')))+'" target="_blank" rel="noopener">Ask on WhatsApp</a></div></article><article class="gym-location-card"><h3>Local training hours</h3><p>'+esc(hours.weekdays||'')+'</p><p>'+esc(hours.weekends||'')+'</p><p>Replace the sample timings and parking notes with your actual information.</p></article></div></section>';

  if(ok('hours'))html+='<section class="gym-section panel" id="hours"><div class="gym-section-head"><div class="gym-kicker">14 · Opening Hours</div><h2>Train on your schedule.</h2></div><div class="gym-hours-grid"><div class="gym-hour"><small>Weekdays</small><strong>'+esc(hours.weekdays||'')+'</strong></div><div class="gym-hour"><small>Weekends</small><strong>'+esc(hours.weekends||'')+'</strong></div></div></section>';

  if(ok('terms'))html+='<section class="gym-legal" id="terms"><h3>Terms & Conditions</h3><p>'+esc(d.termsText||'')+'</p></section>';
  if(ok('privacy'))html+='<section class="gym-legal" id="privacy"><h3>Privacy Policy</h3><p>'+esc(d.privacyPolicy||'')+'</p></section>';
  if(ok('contact'))html+='<section class="gym-contact" id="contact"><div><h2>Ready to train?</h2><p>'+esc(b.tagline||'')+'</p></div><div class="gym-contact-links"><a href="tel:'+esc(c.phone||'')+'">'+esc(c.phone||'')+'</a><a href="mailto:'+esc(c.email||'')+'">'+esc(c.email||'')+'</a><a class="gym-cta" href="#trial">Start Your Free Trial</a></div></section>';
  html+='<footer class="gym-footer"><div><strong>'+esc(b.businessName||'Forge Fitness Club')+'</strong><small>'+esc(b.tagline||'')+'</small></div><div class="gym-footer-links"><a href="#contact">Contact</a><a href="#trial">Free Trial</a></div></footer>';
  html+='<div class="gym-modal" id="gymGalleryModal" hidden><div class="gym-modal-backdrop" data-close-modal></div><div class="gym-modal-panel"><button class="gym-modal-close" type="button" data-close-modal>×</button><img id="gymModalImg" src="" alt=""></div></div>';
  html+='</div>';
  return html;
}

export function init(rootEl,d={}){
  const root=rootEl.querySelector('.gym-preview-wrap');if(!root)return;
  const slides=root.querySelectorAll('[data-hero-slide]'),dots=root.querySelectorAll('[data-hero-dot]');
  let heroIndex=0,heroTimer=null;
  const showHero=i=>{if(!slides.length)return;heroIndex=(i+slides.length)%slides.length;slides.forEach((x,n)=>x.classList.toggle('active',n===heroIndex));dots.forEach((x,n)=>x.classList.toggle('active',n===heroIndex))};
  const startHero=()=>{if(slides.length>1)heroTimer=setInterval(()=>showHero(heroIndex+1),4500)};
  dots.forEach(x=>x.addEventListener('click',()=>{clearInterval(heroTimer);showHero(Number(x.dataset.heroDot));startHero()}));
  startHero();

  root.querySelectorAll('[data-plan]').forEach(x=>x.addEventListener('click',()=>{const f=root.querySelector('[name="plan"]');if(f)f.value=x.dataset.plan||''}));
  root.querySelectorAll('[data-scroll-trial]').forEach(x=>x.addEventListener('click',e=>{e.preventDefault();root.querySelector('#trial')?.scrollIntoView({behavior:'smooth',block:'start'})}));

  root.querySelectorAll('[data-faq]').forEach(btn=>btn.addEventListener('click',()=>{
    const box=btn.nextElementSibling,opening=!!box?.hidden;
    root.querySelectorAll('[data-answer]').forEach(x=>x.hidden=true);
    root.querySelectorAll('[data-faq]').forEach(x=>x.classList.remove('open'));
    if(box&&opening){box.hidden=false;btn.classList.add('open')}
  }));

  root.querySelectorAll('[data-transform]').forEach(input=>input.addEventListener('input',()=>{
    const target=root.querySelector('[data-transform-after="'+input.dataset.transform+'"]');
    if(target)target.style.clipPath='inset(0 0 0 '+input.value+'%)';
  }));

  const bh=root.querySelector('#gymBmiHeight'),bw=root.querySelector('#gymBmiWeight'),bv=root.querySelector('#gymBmiValue'),bl=root.querySelector('#gymBmiLabel');
  const updateBMI=()=>{
    const h=Number(bh?.value)/100,w=Number(bw?.value);
    if(!h||!w||h<.5||h>2.5||w<10||w>300){if(bv)bv.textContent='—';if(bl)bl.textContent='Enter valid height and weight.';return}
    const n=w/(h*h);
    const label=n<18.5?'Below the standard adult BMI range':n<25?'Standard adult BMI range':n<30?'Above the standard adult BMI range':'Higher adult BMI range';
    if(bv)bv.textContent=n.toFixed(1);if(bl)bl.textContent=label;
  };
  bh?.addEventListener('input',updateBMI);bw?.addEventListener('input',updateBMI);

  const form=root.querySelector('#gymTrialForm'),msg=root.querySelector('#gymTrialMsg');
  form?.addEventListener('submit',e=>{
    e.preventDefault();
    const fd=new FormData(form);
    const lead={id:crypto.randomUUID(),createdAt:new Date().toLocaleString(),status:'New',name:fd.get('name')||'',phone:fd.get('phone')||'',goal:fd.get('goal')||'',plan:fd.get('plan')||'',date:fd.get('date')||'',time:fd.get('time')||'',source:'Website Trial Form',message:fd.get('message')||''};
    try{
      const key='sitecraft:gym-01',raw=localStorage.getItem(key),saved=raw?JSON.parse(raw):{templateId:'gym-01',data:{}};
      saved.data=saved.data||{};saved.data.leads=Array.isArray(saved.data.leads)?saved.data.leads:[];saved.data.leads.unshift(lead);localStorage.setItem(key,JSON.stringify(saved));
      if(msg)msg.textContent='Thanks — your request is saved. The gym team can confirm your trial by phone or WhatsApp.';
      const wtext='Gym trial enquiry\nName: '+lead.name+'\nPhone: '+lead.phone+'\nGoal: '+lead.goal+'\nPlan: '+(lead.plan||'Not decided')+'\nDate: '+(lead.date||'Not specified')+'\nTime: '+(lead.time||'Not specified')+'\nMessage: '+lead.message;
      const link=wa(d.contact?.whatsapp,wtext);if(link)window.open(link,'_blank','noopener');
      form.reset();
    }catch{if(msg)msg.textContent='Could not save the enquiry in this browser. Please call or WhatsApp the gym.'}
  });

  const modal=root.querySelector('#gymGalleryModal'),modalImg=root.querySelector('#gymModalImg');
  root.querySelectorAll('[data-gallery]').forEach(btn=>btn.addEventListener('click',()=>{if(modalImg)modalImg.src=btn.dataset.src||'';if(modal)modal.hidden=false}));
  root.querySelectorAll('[data-close-modal]').forEach(x=>x.addEventListener('click',()=>{if(modal)modal.hidden=true}));
}
