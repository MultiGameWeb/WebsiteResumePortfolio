(()=>{
const EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/svg+xml':'svg','application/pdf':'pdf','application/epub+zip':'epub','application/vnd.openxmlformats-officedocument.wordprocessingml.document':'docx','text/plain':'txt','audio/mpeg':'mp3','audio/mp4':'m4a','audio/wav':'wav','audio/x-wav':'wav'};
function toBlob(dataUrl){const m=/^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(dataUrl);if(!m)return new Blob([]);const mime=m[1];let bytes;if(m[2]){const bin=atob(m[3]);bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i)}else bytes=new TextEncoder().encode(decodeURIComponent(m[3]));return new Blob([bytes],{type:mime})}
function extract(data,prefix){prefix=prefix||'assets/uploads/';const files=[],seen=new Map();let n=0;
 const walk=v=>{if(typeof v==='string'){if(/^data:(image\/|application\/(pdf|epub\+zip|vnd\.openxmlformats-officedocument\.wordprocessingml\.document)|text\/plain|audio\/)/i.test(v)){if(seen.has(v))return seen.get(v);const m=/^data:([^;,]+)/.exec(v),mime=m&&m[1],path=prefix+'file-'+(++n)+'.'+(EXT[mime]||(String(mime).startsWith('image/')?'jpg':'bin'));seen.set(v,path);files.push({path,blob:toBlob(v)});return path}return v}
  if(Array.isArray(v))return v.map(walk);if(v&&typeof v==='object'){const o={};Object.keys(v).forEach(k=>{o[k]=walk(v[k])});return o}return v};
 return {data:walk(data),files}}
async function loadZip(){if(window.JSZip)return window.JSZip;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});return window.JSZip}
function sanitize(root){if(!root||!root.querySelectorAll)return root;
 const okLink=v=>{v=String(v||'').trim();return v===''||/^(#|\/|\.\/|\.\.\/|https?:|tel:|mailto:|sms:|whatsapp:)/i.test(v)||/^[\w./%-][\w./%?=&#-]*$/.test(v)};
 root.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href');if(!okLink(h))a.removeAttribute('href');if(a.target==='_blank')a.rel='noopener noreferrer'});
 let first=true;root.querySelectorAll('img').forEach(img=>{const s=(img.getAttribute('src')||'').trim();if(!s){img.style.display='none';return}if(!/^(https?:|data:image\/|\/|\.\/|\.\.\/|[\w./%-])/i.test(s)||/^javascript:/i.test(s)){img.removeAttribute('src');img.style.display='none';return}if(first){first=false}else if(!img.hasAttribute('loading')){img.loading='lazy';img.decoding='async'}});
 root.querySelectorAll('p:empty,h2:empty,h3:empty').forEach(e=>e.remove());
 root.querySelectorAll('iframe[src]').forEach(f=>{if(!/^https:\/\/(www\.youtube\.com\/embed\/|player\.vimeo\.com\/video\/|www\.google\.com\/maps\/embed)/i.test(f.getAttribute('src')))f.remove()});
 return root}
// ---- SEO for customer websites: business details for Google (schema.org JSON-LD), a clear page title
// and description, and a browser tab icon. Runs only on a hosted website or the builder preview
// (pages with <div id="site">), never on SiteCraft's own pages.
const SEO_TYPES={
 'Restaurants':['Restaurant','Restaurant'],'E-commerce':['Store','Online Store'],'Photography':['ProfessionalService','Photographer'],
 'Catering Services':['FoodEstablishment','Catering Service'],'Real Estate Agencies & Brokers':['RealEstateAgent','Real Estate Agency'],
 'Interior Designers & Architects':['ProfessionalService','Interior Designer'],'Salon & Spa':['BeautySalon','Salon & Spa'],
 'Dental & Medical Centers':['MedicalClinic','Dental & Medical Clinic'],'Gyms & Fitness Centers':['ExerciseGym','Gym & Fitness Centre'],
 'Cloud Kitchen & Home Bakers':['FoodEstablishment','Cloud Kitchen'],'Event & Wedding Planners':['ProfessionalService','Event & Wedding Planner'],
 'Automotive Services':['AutoRepair','Car Service & Detailing'],'Astrology':['ProfessionalService','Astrologer'],
 'Groceries & Supermarkets':['GroceryStore','Grocery Store'],'Jewellery Stores':['JewelryStore','Jewellery Store'],
 'Teaching Websites':['EducationalOrganization','Tutor'],'Electronics Stores':['ElectronicsStore','Electronics Store'],
 'Mobile Stores':['MobilePhoneStore','Mobile Store'],'Hotels & Resorts':['Hotel','Hotel & Resort'],'Author Websites':['Person','Author'],
 'Banquet Halls':['EventVenue','Banquet Hall'],'Kitchen & Food Services':['FoodEstablishment','Kitchen & Food Service'],
 'Home Services & Repairs':['HomeAndConstructionBusiness','Home Services & Repairs'],'Function Halls':['EventVenue','Function Hall'],
 'Cafés & Coffee Shops':['CafeOrCoffeeShop','Café'],'Bakeries & Cake Shops':['Bakery','Bakery & Cake Shop'],
 'Clothing & Fashion Stores':['ClothingStore','Clothing Store'],'Hardware, Paints & Sanitary':['HardwareStore','Hardware & Paints Store'],
 'Furniture Stores':['FurnitureStore','Furniture Store'],'Wholesalers & Distributors':['WholesaleStore','Wholesaler & Distributor'],
 'Agri Inputs & Seeds':['Store','Agri Inputs & Seeds Store'],'Local Shops & Stores':['Store','Local Store'],
 'Local Service Businesses':['LocalBusiness','Local Service'],'Pharmacies & Medical Stores':['Pharmacy','Pharmacy'],
 'Tailors & Boutiques':['LocalBusiness','Tailor & Boutique'],'Optical Stores':['Optician','Optical Store'],
 'Printing & Xerox Shops':['LocalBusiness','Printing & Xerox Shop'],'Diagnostic Labs':['MedicalClinic','Diagnostic Lab'],
 'Florists & Gift Shops':['Florist','Florist & Gift Shop'],'Pet Shops & Clinics':['PetStore','Pet Shop & Clinic'],
 'Tent House & Decorators':['LocalBusiness','Tent House & Decorators'],'Travel & Tours':['TravelAgency','Travel Agency'],
 "Schools, Colleges, Coaching & Educational Institutes":['EducationalOrganization','School & Coaching Centre']
};
const seoText=v=>typeof v==='string'?v.replace(/\s+/g,' ').trim():'';
const DAYS={mon:'Monday',tue:'Tuesday',wed:'Wednesday',thu:'Thursday',fri:'Friday',sat:'Saturday',sun:'Sunday'},ORDER=['mon','tue','wed','thu','fri','sat','sun'];
function to24(t){const m=/^(\d{1,2})(?::(\d{2}))?\s*([AP])\.?M\.?$/i.exec(seoText(t));if(!m)return '';let h=Number(m[1])%12;if(/p/i.test(m[3]))h+=12;return String(h).padStart(2,'0')+':'+(m[2]||'00')}
function seoHours(h){
 const out=[];
 if(Array.isArray(h))h.forEach(x=>{if(!x||x.closed||x.enabled===false)return;const day=DAYS[String(x.id||x.day||'').slice(0,3).toLowerCase()],o=to24(x.open),c=to24(x.close);if(day&&o&&c)out.push({'@type':'OpeningHoursSpecification',dayOfWeek:day,opens:o,closes:c})});
 else if(h&&typeof h==='object')Object.values(h).forEach(v=>{
  // e.g. "Mon–Sat · 9:00 AM – 8:00 PM" or "Sun · 7:00 AM – 1:00 PM"
  const m=/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*(?:\s*[–-]\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*)?\s*[·:,]\s*(\d{1,2}(?::\d{2})?\s*[AP]M)\s*[–-]\s*(\d{1,2}(?::\d{2})?\s*[AP]M)/i.exec(seoText(v));if(!m)return;
  const a=ORDER.indexOf(m[1].slice(0,3).toLowerCase()),b=m[2]?ORDER.indexOf(m[2].slice(0,3).toLowerCase()):a,o=to24(m[3]),c=to24(m[4]);if(a<0||b<0||!o||!c)return;
  const days=[];for(let i=a;;i=(i+1)%7){days.push(DAYS[ORDER[i]]);if(i===b||days.length>7)break}
  out.push({'@type':'OpeningHoursSpecification',dayOfWeek:days.length===1?days[0]:days,opens:o,closes:c})});
 return out;
}
const SEO_REGIONS=/^(india|bharat|telangana|andhra pradesh|ap|ts|karnataka|tamil nadu|tamilnadu|kerala|maharashtra|odisha|orissa|gujarat|rajasthan|madhya pradesh|uttar pradesh|bihar|west bengal|punjab|haryana|delhi|goa|assam|jharkhand|chhattisgarh|uttarakhand|himachal pradesh)$/i;
function seoCity(addr){const parts=seoText(addr).split(',').map(x=>x.replace(/\b\d{6}\b/g,'').replace(/[-–\s]+$/,'').trim()).filter(x=>x&&!SEO_REGIONS.test(x));return parts.length?parts[parts.length-1]:''}
function seoAbs(u){u=seoText(u);if(!u||/^data:/i.test(u))return '';try{return new URL(u,location.href).href}catch(e){return ''}}
function seoImage(d){
 const looks=v=>typeof v==='string'&&/^(https:\/\/|assets\/|\.\/assets\/)/i.test(v)&&/(\.(jpe?g|png|webp|gif)(\?|$)|images\.unsplash\.com|\/uploads\/)/i.test(v);
 const seen=new Set(),q=[d&&d.hero,d&&d.home,d&&d.brand,d&&d.heroSlides,d&&d.gallery];
 while(q.length){const v=q.shift();if(!v||typeof v!=='object'||seen.has(v))continue;seen.add(v);for(const x of Array.isArray(v)?v:Object.values(v)){if(looks(x))return seoAbs(x);if(x&&typeof x==='object')q.push(x)}}
 return '';
}
function seoInitials(n){const w=seoText(n).split(/\s+/).filter(x=>/[\p{L}\p{N}]/u.test(x)&&!/^the$/i.test(x));const l=w.map(x=>(Array.from(x.replace(/^[^\p{L}\p{N}]+/u,''))[0]||'').toUpperCase());return (l.slice(0,2).join('')||'•')}
function seoHead(sel,make){let el=document.head.querySelector(sel);if(!el){el=make();document.head.appendChild(el)}return el}
function seo(d,category){
 if(typeof document==='undefined'||!document.getElementById('site'))return;
 const b=(d&&d.brand)||{},c=(d&&d.contact)||{},name=seoText(b.businessName);if(!name)return;
 const pair=SEO_TYPES[category]||['LocalBusiness',seoText(category)],type=pair[0],label=pair[1];
 const address=seoText(c.address)||seoText(c.location),city=seoCity(address);
 const about=seoText(b.about)||seoText(b.tagline)||seoText(b.motto)||seoText(d&&d.home&&d.home.text);
 // Page title and description (what Google shows in results)
 const lowName=name.toLowerCase(),showLabel=label&&lowName.indexOf(label.toLowerCase())<0&&!new RegExp('(^|[^\\p{L}])'+label.split(/[\s&]+/)[0].replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'iu').test(name);
 document.title=name+(showLabel?' — '+label:'')+(city&&name.toLowerCase().indexOf(city.toLowerCase())<0?' in '+city:'');
 const desc=(about||(name+(label?', '+label:'')+(city?' in '+city:'')+'.')).slice(0,160);
 seoHead('meta[name="description"]',()=>{const m=document.createElement('meta');m.name='description';return m}).setAttribute('content',desc);
 // Business details for Google Search and Maps
 const phone=seoText(c.phone)||seoText(c.call)||(String(c.whatsapp||'').replace(/\D/g,'').length>=10?'+'+String(c.whatsapp).replace(/\D/g,''):'');
 const social=[c.instagram,c.facebook,c.youtube,d&&d.social&&d.social.instagram,d&&d.social&&d.social.facebook,d&&d.social&&d.social.youtube].map(seoText).filter(u=>/^https:\/\/[^/]+\/[^/?#]+/i.test(u));
 const url=location.protocol==='file:'?'':location.origin+location.pathname;
 const ld={'@context':'https://schema.org','@type':type,name};
 if(url&&!/template-preview\.html$/.test(location.pathname))ld.url=url;
 if(about)ld.description=about.slice(0,500);
 const img=seoImage(d);if(img)ld.image=img;
 if(type==='Person'){if(social.length)ld.sameAs=[...new Set(social)];if(seoText(c.email))ld.email=seoText(c.email)}
 else{
  if(phone)ld.telephone=phone;if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(seoText(c.email)))ld.email=seoText(c.email);
  if(address)ld.address={'@type':'PostalAddress',streetAddress:address,addressLocality:city||undefined,addressCountry:'IN'};
  if(/^https:\/\//i.test(seoText(c.maps)))ld.hasMap=seoText(c.maps);
  const hours=seoHours(d&&d.hours);if(hours.length)ld.openingHoursSpecification=hours;
  if(social.length)ld.sameAs=[...new Set(social)];
 }
 const json=JSON.stringify(ld).replace(/</g,'\\u003c');
 seoHead('script[data-sc-seo]',()=>{const s=document.createElement('script');s.type='application/ld+json';s.setAttribute('data-sc-seo','');return s}).textContent=json;
 // Browser tab icon with the business initials
 const letters=seoInitials(name).replace(/[&<>"']/g,''),svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#17181d"/><text x="32" y="42" font-family="Arial,sans-serif" font-size="'+(letters.length>1?26:32)+'" font-weight="700" fill="#fff" text-anchor="middle">'+letters+'</text></svg>';
 seoHead('link[rel="icon"][data-sc-seo]',()=>{const l=document.createElement('link');l.rel='icon';l.setAttribute('data-sc-seo','');return l}).href='data:image/svg+xml,'+encodeURIComponent(svg);
}
window.SiteCraftPack={extract,loadZip,toBlob,sanitize,seo};

})();
