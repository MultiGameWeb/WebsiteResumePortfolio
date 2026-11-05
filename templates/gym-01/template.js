const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safe=v=>String(v??'').replace(/[^0-9]/g,'');
const wa=(n,msg='')=>{const p=safe(n);return p?'https://wa.me/'+p+(msg?'?text='+encodeURIComponent(msg):''):''};
const txt=v=>String(v??'');
const image=(src,alt='')=>src?'<img src="'+esc(src)+'" alt="'+esc(alt)+'" loading="lazy">':'';
const fitnessRules={
  'Yoga':{copy:{servicesText:'Every style we teach, from gentle Hatha to restorative Yin, with breathwork and meditation.',trainersText:'Meet our teachers: their training, style and the batches they lead.',about:'A calm space to practise.',plans:'Choose your practice plan.',trainers:'Teachers who guide with care.',schedule:'Sunrise & evening sessions.',hours:'Practise on your schedule.',reviews:'What our students say.',faq:'Questions before your first class.',cta:'Ready to roll out your mat?'},hide:['facilities','transformations','merchandise'],hero:'Find balance. Build strength.',servicesTitle:'Mindful movement & classes.'},
  'Mobility':{copy:{servicesText:'Mobility, stretching and recovery sessions for every stage, from desk-job stiffness to athletes.',trainersText:'Meet our specialists: their background, focus and available timings.',about:'Move without the stiffness.',plans:'Choose your recovery plan.',trainers:'Specialists in movement and recovery.',schedule:'Morning & evening sessions.',hours:'Recover on your schedule.',reviews:'What our clients say.',faq:'Questions before your first session.',cta:'Ready to move better?'},hide:['facilities','transformations','merchandise'],hero:'Move better. Feel better.',servicesTitle:'Mobility & recovery sessions.'},
  'Zumba':{copy:{servicesText:'Zumba, Bollywood dance fitness and toning classes for every energy level.',trainersText:'Meet our instructors: their licences, dance style and the batches they lead.',about:'Fitness that feels like a party.',plans:'Pick your dance pass.',trainers:'Instructors who bring the energy.',schedule:'Dance batches all week.',hours:'Dance on your schedule.',reviews:'What our dancers say.',faq:'Questions before your first class.',cta:'Ready to dance?'},hide:['transformations'],hero:'Move with the beat.',servicesTitle:'Dance fitness & group classes.'},
  'CrossFit':{copy:{servicesText:'WODs, Olympic lifting, gymnastics skills and conditioning, all coached and scaled to you.',trainersText:'Meet our coaches: certifications, specialty and the classes they run.',about:'A box built for real capacity.',plans:'Choose your box membership.',trainers:'Certified coaches on every WOD.',schedule:'WODs morning & evening.',reviews:'What our athletes say.',faq:'New to CrossFit? Start here.',cta:'Ready for your first WOD?'},hide:[],hero:'Train hard. Move different.',servicesTitle:'Functional training & classes.'},
  'HIIT':{copy:{servicesText:'Interval, Tabata, core and conditioning classes, with an easier option for every move.',trainersText:'Meet our coaches: certifications, specialty and the batches they lead.',about:'Short sessions. Serious results.',plans:'Pick your intensity.',trainers:'Coaches who keep the pace.',schedule:'Express batches all day.',reviews:'What our members say.',faq:'Questions before your first HIIT class.',cta:'Ready to sweat?'},hide:[],hero:'Short. Intense. Focused.',servicesTitle:'High-intensity training & classes.'},
  'Strength Circuit':{copy:{servicesText:'Station-based strength, kettlebell and power circuits, with technique coaching throughout.',trainersText:'Meet our coaches: certifications, specialty and available timings.',about:'Strength, one station at a time.',plans:'Choose your circuit plan.',trainers:'Coaches who track your lifts.',schedule:'Circuit batches all week.',reviews:'What our members say.',faq:'Questions before you start lifting.',cta:'Ready to get stronger?'},hide:[],hero:'Build strength that lasts.',servicesTitle:'Strength & conditioning sessions.'},
  'General Gym':{hide:[],hero:'Build the strongest version of you.',servicesTitle:'Training services & classes.'}
};

function scBaseRender(d={},selected=[]){
  const b=d.brand||{},h=d.home||{},c=d.contact||{},hours=d.hours||{},trial=d.trial||{},s=d.settings||{};
  const fitnessType=String(d.fitness?.type||'General Gym');
  const fitnessRule=fitnessRules[fitnessType]||fitnessRules['General Gym'];
  const copy=Object.assign({servicesText:'Everything we offer — training floor, group classes, conditioning and recovery — at a glance.',trainersText:'Meet the team: certifications, specialty and available timings for every coach.',about:'A serious place to train.',plans:'Pick your training level.',trainers:'Coaches with a clear specialty.',schedule:'Morning & evening batches.',hours:'Train on your schedule.',reviews:'What members say.',faq:'Questions before joining.',cta:'Ready to train?'},fitnessRule.copy||{});
  const ok=id=>selected.includes(id)&&!fitnessRule.hide.includes(id);
  const runtimeId=String(d.runtime?.templateId||'gym-01');
  const slides=(d.heroSlides||[]).filter(x=>x.enabled!==false&&x.image);
  const plans=(d.plans||[]).filter(x=>x.enabled!==false);
  const services=(d.services||[]).filter(x=>x.enabled!==false);
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
        (p.monthly&&p.monthly!=='—'?'<div class="gym-price"><span>Monthly</span><strong>'+esc(p.monthly)+'</strong></div>':'')+
        (p.quarterly&&p.quarterly!=='—'?'<div class="gym-price"><span>Quarterly</span><strong>'+esc(p.quarterly)+'</strong></div>':'')+
        (p.annual&&p.annual!=='—'?'<div class="gym-price"><span>Annual</span><strong>'+esc(p.annual)+'</strong></div>':'')+
      '</div>'+
      '<div class="gym-plan-save">'+esc(p.discount||'')+'</div>'+
      '<ul>'+fs.filter(Boolean).map(f=>'<li><span class="gym-check">✓</span>'+esc(f)+'</li>').join('')+'</ul>'+
      '<a class="gym-cta" href="#trial" data-plan="'+esc(p.name||'')+'">Choose Plan</a>'+
    '</article>';
  }).join('');

  const topTransform=fitnessType==='CrossFit'||fitnessType==='HIIT';
  const renderTransformationsBlock=(sectionId,kicker)=>'<section class="gym-section dark" id="'+esc(sectionId)+'"><div class="gym-section-head"><div class="gym-kicker">'+esc(kicker)+'</div><h2>Real stories, shown responsibly.</h2><p></p></div><div class="gym-transform-grid">'+transformations.map((x,i)=>'<article class="gym-transform"><div class="gym-transform-stage"><img src="'+esc(x.beforeImage)+'" alt="Before" loading="lazy"><div class="gym-transform-after" data-transform-after="'+i+'"><img src="'+esc(x.afterImage)+'" alt="After" loading="lazy"></div><span class="gym-transform-label before">Before</span><span class="gym-transform-label after">After</span></div><div class="gym-transform-control"><small>Drag slider</small><input type="range" min="0" max="100" value="50" data-transform="'+i+'"></div><h3>'+esc(x.title||'Transformation story')+'</h3><p>'+esc(x.period||'')+' · '+esc(x.description||'')+'</p></article>').join('')+'</div></section>';
  let html='<div class="gym-preview-wrap gym-type-'+esc(fitnessType.toLowerCase().replace(/[^a-z0-9]+/g,'-'))+'">';
  html+='<header class="gym-nav"><a class="gym-brand" href="#home"><span class="gym-mark">'+esc(String(b.businessName||'Fitness Studio').split(/\s+/).filter(w=>/^[A-Za-z]/.test(w)).slice(0,2).map(w=>w[0].toUpperCase()).join('')||'FS')+'</span><span><strong>'+esc(b.businessName||'Forge Fitness Club')+'</strong><small>'+esc(b.tagline||'FITNESS & PERFORMANCE')+'</small></span></a><nav>';
  if(ok('home'))html+='<a href="#home">Home</a>';
  if(ok('membership'))html+='<a href="#membership">Plans</a>';
  if(ok('services'))html+='<a href="#services">Services</a>';
  if(ok('trainers'))html+='<a href="#trainers">Trainers</a>';
  if(ok('schedule'))html+='<a href="#schedule">Classes</a>';
  if(ok('facilities'))html+='<a href="#facilities">Facilities</a>';
  if(ok('trial'))html+='<a class="gym-cta" href="#trial">Join Now</a>';
  html+='</nav></header>';

  if(ok('home')){
    html+='<section class="gym-hero" id="home">';
    html+=slides.map((x,i)=>'<div class="gym-hero-slide '+(i===0?'active':'')+'" data-hero-slide="'+i+'">'+image(x.image,x.title)+'</div>').join('');
    if(txt(d.heroVideo))html+='<video class="gym-hero-video" autoplay muted loop playsinline poster="'+esc(firstSlide)+'"><source src="'+esc(d.heroVideo)+'" type="video/mp4"></video>';
    html+='<div class="gym-hero-content"><div class="gym-eyebrow">'+esc(h.badge||'FREE TRIAL')+'</div><h1>'+esc(h.title||fitnessRule.hero)+'</h1><p>'+esc(h.text||'Premium training, expert coaching and flexible memberships.')+'</p><div class="gym-hero-actions"><a class="gym-cta" href="#trial" data-scroll-trial>Start Your Free Trial</a><a class="gym-cta dark" href="#membership">View Memberships</a></div><div class="gym-hero-meta"><span class="gym-pill">'+esc(hours.weekdays||'')+'</span><span class="gym-pill">'+esc(hours.weekends||'')+'</span></div></div>';
    html+='<div class="gym-hero-dots">'+slides.map((x,i)=>'<button type="button" class="'+(i===0?'active':'')+'" data-hero-dot="'+i+'" aria-label="Slide '+(i+1)+'"></button>').join('')+'</div></section>';
  }

  if(ok('about'))html+='<section class="gym-section panel" id="about"><div class="gym-2col"><div class="gym-about-copy"><div class="gym-kicker">01 · About</div><div class="gym-section-head" style="margin-left:0"><h2>'+esc(copy.about)+'</h2><p>'+esc(b.about||'')+'</p></div></div><div class="gym-about-card"><div class="gym-about-stat"><strong>'+plans.length+'</strong><small>Membership tiers</small></div><div class="gym-about-stat"><strong>'+trainers.length+'</strong><small>Coaches</small></div><div class="gym-about-stat"><strong>'+schedule.length+'</strong><small>Weekly class slots</small></div><div class="gym-about-stat"><strong>1 DAY</strong><small>Guest pass option</small></div></div></div></section>';

  if(ok('services'))html+='<section class="gym-section dark" id="services"><div class="gym-section-head"><div class="gym-kicker">02 · Services & Classes</div><h2>'+esc(fitnessRule.servicesTitle)+'</h2><p>'+esc(copy.servicesText)+'</p></div><div class="gym-service-grid">'+services.map(x=>'<article class="gym-service"><div class="gym-service-icon">'+esc(x.icon||'✦')+'</div><div><small>'+esc(x.category||'Fitness')+'</small><h3>'+esc(x.name||'Service')+'</h3><p>'+esc(x.text||'')+'</p></div></article>').join('')+'</div></section>'

  if(ok('membership'))html+='<section class="gym-section dark" id="membership"><div class="gym-section-head"><div class="gym-kicker">02 · Membership</div><h2>'+esc(copy.plans)+'</h2><p>Compare monthly, quarterly and annual plans with clear inclusions, offers and savings.</p></div><div class="gym-plan-grid">'+planCards+'</div></section>';

  if(topTransform&&ok('transformations'))html+=renderTransformationsBlock('transformations-priority','03 · Priority Transformations');

  if(ok('trainers'))html+='<section class="gym-section panel" id="trainers"><div class="gym-section-head"><div class="gym-kicker">03 · Trainers</div><h2>'+esc(copy.trainers)+'</h2><p>'+esc(copy.trainersText)+'</p></div><div class="gym-trainer-grid">'+trainers.map(t=>'<article class="gym-trainer"><div class="gym-trainer-img">'+image(t.image,t.name)+'</div><div class="gym-trainer-body"><h3>'+esc(t.name)+'</h3><strong>'+esc(t.role||'Trainer')+'</strong><div class="gym-trainer-tags"><span>'+esc(t.certification||'Certification not added')+'</span><span>'+esc(t.specialization||'Fitness')+'</span></div><p>'+esc(t.bio||'')+'</p><div class="gym-trainer-tags"><span>'+esc(t.availability||'Availability on request')+'</span></div></div></article>').join('')+'</div></section>';

  if(ok('schedule'))html+='<section class="gym-section dark" id="schedule"><div class="gym-section-head"><div class="gym-kicker">04 · Classes</div><h2>'+esc(copy.schedule)+'</h2><p>Keep the weekly timetable easy to scan across mobile and desktop.</p></div><div class="gym-schedule-wrap"><table class="gym-schedule"><thead><tr><th>Day</th><th>Time</th><th>Class</th><th>Coach</th><th>Level</th></tr></thead><tbody>'+schedule.map(x=>'<tr><td>'+esc(x.day)+'</td><td>'+esc(x.time)+'</td><td>'+esc(x.class)+'</td><td>'+esc(x.coach)+'</td><td>'+esc(x.level)+'</td></tr>').join('')+'</tbody></table></div></section>';

  if(ok('facilities'))html+='<section class="gym-section panel" id="facilities"><div class="gym-section-head"><div class="gym-kicker">05 · Facilities</div><h2>Equipment you can actually see.</h2><p>Highlight the strength floor, cardio, studio, recovery and locker spaces with real photos.</p></div><div class="gym-facility-grid">'+facilities.map(x=>'<article class="gym-facility"><div class="gym-facility-img">'+image(x.image,x.title)+'</div><div class="gym-facility-body"><h3>'+esc(x.title)+'</h3><p>'+esc(x.text)+'</p></div></article>').join('')+'</div></section>';

  if(ok('transformations')&&!topTransform)html+=renderTransformationsBlock('transformations','06 · Transformations');

  if(ok('bmi'))html+='<section class="gym-section panel" id="bmi"><div class="gym-section-head"><div class="gym-kicker">07 · BMI</div><h2>A quick starting point.</h2><p>Calculate a BMI value in the browser as a general screening measure, not a medical diagnosis.</p></div><div class="gym-bmi-grid"><div class="gym-bmi-card"><div class="gym-bmi-form"><label><span>Height (cm)</span><input id="gymBmiHeight" type="number" inputmode="decimal" min="50" max="250" placeholder="170"></label><label><span>Weight (kg)</span><input id="gymBmiWeight" type="number" inputmode="decimal" min="10" max="300" placeholder="70"></label></div><div class="gym-bmi-result"><strong id="gymBmiValue">—</strong><span id="gymBmiLabel">Enter values to calculate.</span></div><div class="gym-note">BMI does not account for every aspect of body composition. Use it as one data point and seek qualified health advice for personal medical questions.</div></div><div class="gym-bmi-card"><h3 style="margin-top:0;font-size:25px">Use the number as a conversation starter.</h3><p style="font-size:12px;line-height:1.8;color:#929c97">Coaches can discuss goals, training history, routine and lifestyle context to help plan fitness sessions. Do not use BMI alone to make medical decisions.</p></div></div></section>';

  if(ok('merchandise'))html+='<section class="gym-section dark" id="merchandise"><div class="gym-section-head"><div class="gym-kicker">08 · Merchandise</div><h2>Products on display.</h2><p>Show apparel, accessories and genuine supplement products without turning the template into an online pharmacy.</p></div><div class="gym-product-grid">'+products.map(p=>'<article class="gym-product"><div class="gym-product-img">'+image(p.image,p.name)+'</div><div class="gym-product-body"><small>'+esc(p.type||'Product')+'</small><h3>'+esc(p.name||'Product')+'</h3><p>'+esc(p.text||'')+'</p><div class="gym-product-price">'+esc(p.price||'Ask gym')+'</div></div></article>').join('')+'</div></section>';

  if(ok('gallery'))html+='<section class="gym-section panel" id="gallery"><div class="gym-section-head"><div class="gym-kicker">09 · Gallery</div><h2>The room sells the experience.</h2></div><div class="gym-gallery">'+gallery.map((x,i)=>'<button class="gym-gallery-item" type="button" data-gallery="'+i+'" data-src="'+esc(x.image)+'" aria-label="Open '+esc(x.title||'Gallery image')+'">'+image(x.image,x.title)+'<span>'+esc(x.title||'Gym')+'</span></button>').join('')+'</div></section>';

  if(ok('reviews'))html+='<section class="gym-section light" id="reviews"><div class="gym-section-head"><div class="gym-kicker">10 · Member Reviews</div><h2>'+esc(copy.reviews)+'</h2></div><div class="gym-review-grid">'+reviews.map(x=>'<article class="gym-review"><div class="gym-stars">'+('★'.repeat(Math.max(1,Math.min(5,Number(x.rating)||5))))+'</div><p>'+esc(x.text)+'</p><strong>'+esc(x.name)+'</strong></article>').join('')+'</div></section>';

  if(ok('faq'))html+='<section class="gym-section panel" id="faq"><div class="gym-section-head"><div class="gym-kicker">11 · FAQ</div><h2>'+esc(copy.faq)+'</h2></div><div class="gym-faq">'+faq.map((x,i)=>'<article><button type="button" data-faq="'+i+'"><span>'+String(i+1).padStart(2,'0')+'</span><strong>'+esc(x.question)+'</strong><b>+</b></button><div data-answer hidden><p>'+esc(x.answer)+'</p></div></article>').join('')+'</div></section>';

  if(ok('trial'))html+='<section class="gym-trial" id="trial"><div class="gym-trial-copy"><div class="gym-kicker">12 · Free Trial</div><h2>'+esc(trial.heading||'Start with a free trial.')+'</h2><p>'+esc(trial.text||'Tell us your goal and preferred time.')+'</p><a class="gym-guest" href="'+esc(wa(c.whatsapp,(trial.passText||'1-Day Guest Pass')+' — '+(b.businessName||'Gym')))+'" target="_blank" rel="noopener">'+esc(trial.passText||'1-Day Guest Pass · Book on WhatsApp')+'</a></div><form class="gym-trial-form" id="gymTrialForm"><label><span>Your name *</span><input name="name" required placeholder="Full name"></label><label><span>Phone number *</span><input name="phone" type="tel" required placeholder="+91..."></label><label><span>Your goal</span><select name="goal">'+goals.map(g=>'<option value="'+esc(g)+'">'+esc(g)+'</option>').join('')+'</select></label><label><span>Preferred plan</span><select name="plan"><option value="">Not decided</option>'+plans.map(p=>'<option value="'+esc(p.name||'')+'">'+esc(p.name||'')+'</option>').join('')+'</select></label><label><span>Preferred date</span><input name="date" type="date"></label><label><span>Preferred time</span><input name="time" type="time"></label><label class="gym-trial-wide"><span>Message</span><textarea name="message" rows="4" placeholder="Tell us anything the coach should know."></textarea></label><div class="gym-trial-wide"><button class="gym-cta" type="submit">Request Free Trial</button></div><div class="gym-trial-wide"><div id="gymTrialMsg" style="font-size:12px;color:#d8e5df"></div></div></form></section>';

  if(ok('location'))html+='<section class="gym-section dark" id="location"><div class="gym-section-head"><div class="gym-kicker">13 · Location</div><h2>Make the first visit easy.</h2></div><div class="gym-location"><article class="gym-location-card"><h3>Find '+esc(b.businessName||'the gym')+'</h3><p>'+esc(c.address||'')+'</p><p><strong>Parking:</strong> '+esc(c.parking||'')+'</p><p><strong>Landmarks:</strong> '+esc(c.landmarks||'')+'</p><div class="gym-location-links"><a class="gym-cta" target="_blank" rel="noopener" href="'+esc(c.maps||'#')+'">Open Google Maps</a><a class="gym-cta dark" href="'+esc(wa(c.whatsapp,'I want to enquire about joining '+(b.businessName||'the gym')))+'" target="_blank" rel="noopener">Ask on WhatsApp</a></div></article><article class="gym-location-card"><h3>Local training hours</h3><p>'+esc(hours.weekdays||'')+'</p><p>'+esc(hours.weekends||'')+'</p><p></p></article></div></section>';

  if(ok('hours'))html+='<section class="gym-section panel" id="hours"><div class="gym-section-head"><div class="gym-kicker">14 · Opening Hours</div><h2>'+esc(copy.hours)+'</h2></div><div class="gym-hours-grid"><div class="gym-hour"><small>Weekdays</small><strong>'+esc(hours.weekdays||'')+'</strong></div><div class="gym-hour"><small>Weekends</small><strong>'+esc(hours.weekends||'')+'</strong></div></div></section>';

  if(ok('terms'))html+='<section class="gym-legal" id="terms"><h3>Terms & Conditions</h3><p>'+esc(d.termsText||'')+'</p></section>';
  if(ok('privacy'))html+='<section class="gym-legal" id="privacy"><h3>Privacy Policy</h3><p>'+esc(d.privacyPolicy||'')+'</p></section>';
  if(ok('contact'))html+='<section class="gym-contact" id="contact"><div><h2>'+esc(copy.cta)+'</h2><p>'+esc(b.tagline||'')+'</p></div><div class="gym-contact-links"><a href="tel:'+esc(c.phone||'')+'">'+esc(c.phone||'')+'</a><a href="mailto:'+esc(c.email||'')+'">'+esc(c.email||'')+'</a><a class="gym-cta" href="#trial">Start Your Free Trial</a></div></section>';
  if(ok('whatsapp'))html+='<div class="gym-floating-contact" aria-label="Quick contact">'+(c.phone?'<a class="gym-float-call" href="tel:'+esc(c.phone)+'"><span>☎</span><b>Call</b></a>':'')+(c.whatsapp?'<a class="gym-float-wa" href="'+esc(wa(c.whatsapp,'I want to enquire about joining '+(b.businessName||'the gym')))+'" target="_blank" rel="noopener"><span>◉</span><b>WhatsApp</b></a>':'')+'</div>';
  html+='<footer class="gym-footer"><div><strong>'+esc(b.businessName||'Forge Fitness Club')+'</strong><small>'+esc(b.tagline||'')+'</small></div><div class="gym-footer-links"><a href="#contact">Contact</a><a href="#trial">Free Trial</a></div></footer>';
  html+='<div class="gym-modal" id="gymGalleryModal" hidden><div class="gym-modal-backdrop" data-close-modal></div><div class="gym-modal-panel"><button class="gym-modal-close" type="button" data-close-modal>×</button><img id="gymModalImg" src="" alt=""></div></div>';
  html+='</div>';
  let kickerNo=0;html=html.replace(/(class="gym-kicker">)\d{2} · /g,(m,a)=>a+String(++kickerNo).padStart(2,'0')+' · ');
  return html;
}

export function init(rootEl,d={}){scMobileNav(arguments[0]);
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
      const key='sitecraft:'+runtimeId,raw=localStorage.getItem(key),saved=raw?JSON.parse(raw):{templateId:runtimeId,data:{}};
      saved.data=saved.data||{};saved.data.leads=Array.isArray(saved.data.leads)?saved.data.leads:[];saved.data.leads.unshift(lead);localStorage.setItem(key,JSON.stringify(saved));
      if(msg)msg.textContent='Thanks! Please send the WhatsApp message that opened to confirm your trial. If it did not open, please call the gym.';
      const wtext='Gym trial enquiry\nName: '+lead.name+'\nPhone: '+lead.phone+'\nGoal: '+lead.goal+'\nPlan: '+(lead.plan||'Not decided')+'\nDate: '+(lead.date||'Not specified')+'\nTime: '+(lead.time||'Not specified')+'\nMessage: '+lead.message;
      const link=wa(d.contact?.whatsapp,wtext);if(link)window.open(link,'_blank','noopener');
      form.reset();
    }catch{if(msg)msg.textContent='Could not save the enquiry in this browser. Please call or WhatsApp the gym.'}
  });

  const modal=root.querySelector('#gymGalleryModal'),modalImg=root.querySelector('#gymModalImg');
  root.querySelectorAll('[data-gallery]').forEach(btn=>btn.addEventListener('click',()=>{if(modalImg)modalImg.src=btn.dataset.src||'';if(modal)modal.hidden=false}));
  root.querySelectorAll('[data-close-modal]').forEach(x=>x.addEventListener('click',()=>{if(modal)modal.hidden=true}));
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
  addEventListener('resize',sync);sync();
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
