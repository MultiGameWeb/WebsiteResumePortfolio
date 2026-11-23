const API='http://127.0.0.1:8787', ORIGIN='http://127.0.0.1:8765', SID='11111111-2222-4333-8444-555555555555';
const PNG='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
let ipn=0; const nextIp=()=>`10.1.${Math.floor(ipn/250)}.${(ipn++%250)+1}`;
let pass=0, fail=0; const results=[];
const ok=(name,cond,extra='')=>{ (cond?pass++:fail++); results.push(`${cond?'PASS':'FAIL'}  ${name}${cond?'':'  -> '+extra}`); };
const post=async(path,body,headers={})=>{const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:ORIGIN,'CF-Connecting-IP':nextIp(),...headers},body:JSON.stringify(body)});let j={};try{j=await r.json();}catch{};return {status:r.status,...j};};
const owner=(action,data={})=>post('/api/botcraft/owner',{shopId:SID,action,...data});
const get=async(path,headers={})=>{const r=await fetch(API+path,{headers:{Origin:ORIGIN,'CF-Connecting-IP':nextIp(),...headers}});let j={};try{j=await r.json();}catch{};return {status:r.status,...j};};

let v=await owner('load'); const publicId=v.publicId; ok('owner load, public id made',v.ok&&/^[a-f0-9]{16}$/.test(publicId));
const pub=()=>get('/api/botcraft/public?s='+publicId);
let p=await pub(); ok('customer page data loads',p.ok&&p.shop.name==='Vinay Jewellers'&&p.offline.items.length===2, JSON.stringify(p).slice(0,150));

// --- hide / show item
await owner('save_product',{key:'silver anklet',name:'Silver Anklet',price_text:'₹3,200',details:'Pair',stock_status:'hidden'});
p=await pub(); ok('hidden item not shown to customers',p.offline.items.every(i=>i.name!=='Silver Anklet'));
v=await owner('load'); ok('hidden item still in owner view',v.products.some(x=>x.name==='Silver Anklet'&&x.stock_status==='hidden'));
await owner('save_product',{key:'silver anklet',name:'Silver Anklet',price_text:'₹3,200',details:'Pair',stock_status:'in_stock'});
p=await pub(); ok('shown again after unhide',p.offline.items.some(i=>i.name==='Silver Anklet'));

// --- rename + conflict
let r=await owner('save_product',{key:'gold chain 22k',name:'Gold Necklace',price_text:'₹48,500',details:'10 grams',stock_status:'in_stock'}); ok('rename item',r.ok&&r.products.some(x=>x.name==='Gold Necklace')&&!r.products.some(x=>x.name==='Gold Chain 22K'));
r=await owner('save_product',{key:'gold necklace',name:'silver anklet',price_text:'1',details:'',stock_status:'in_stock'}); ok('rename onto an existing item is refused',r.status===400&&/already/i.test(r.error||''),JSON.stringify(r).slice(0,120));
r=await owner('load'); ok('both items still exist after refused rename',r.products.length===2);

// --- sections
await owner('set_section',{section:'about',hidden:true}); await owner('set_section',{section:'map',hidden:true});
p=await pub(); ok('about hidden from customer page',!p.shop.about); ok('map hidden from customer page',!p.shop.mapLink);
r=await owner('set_section',{section:'gallery',hidden:true}); ok('hidden sections listed for owner',['about','map','gallery'].every(s=>r.hiddenSections.includes(s)));
r=await owner('set_section',{section:'bogus',hidden:true}); ok('unknown section refused',r.status===400);
await owner('set_section',{section:'about',hidden:false}); await owner('set_section',{section:'map',hidden:false});
p=await pub(); ok('about and map back after show',Boolean(p.shop.about)&&Boolean(p.shop.mapLink));

// --- shop name
r=await owner('save_info',{info:{shop_name:'Sri Vinay Jewellers'}}); ok('shop name changed',r.shopName==='Sri Vinay Jewellers');
r=await owner('save_info',{info:{shop_name:''}}); ok('empty shop name ignored',r.shopName==='Sri Vinay Jewellers');

// --- saved answers
v=await owner('load'); const offers=v.savedAnswers.find(a=>a.id==='f:offers'); ok('offers answer listed',Boolean(offers));
const faqHas=async t=>(await pub()).offline.faqs.some(f=>f.a.includes(t));
ok('offers visible to customers',await faqHas('Diwali'));
await owner('hide_answer',{answerId:'f:offers',hidden:true}); ok('hidden answer not shown to customers',!(await faqHas('Diwali')));
v=await owner('load'); ok('hidden answer still in owner list, flagged',v.savedAnswers.find(a=>a.id==='f:offers')?.hidden===true);
await owner('hide_answer',{answerId:'f:offers',hidden:false}); await owner('save_answer',{answerId:'f:offers',answer:'15% off on Diwali'}); ok('answer edited and shown',await faqHas('15% off'));
r=await owner('save_answer',{answerId:'f:bogus_key',answer:'x'}); ok('answer that does not exist is refused',r.status===400);
await owner('add_note',{note:'Free gift above 50k'}); v=await owner('load'); ok('note added',v.savedAnswers.some(a=>a.answer==='Free gift above 50k'));
const note=v.savedAnswers.find(a=>a.answer==='Free gift above 50k'); await owner('delete_answer',{answerId:note.id}); v=await owner('load'); ok('note deleted',!v.savedAnswers.some(a=>a.answer==='Free gift above 50k'));
await owner('delete_answer',{answerId:'f:home_delivery'}); v=await owner('load'); ok('answer deleted',!v.savedAnswers.some(a=>a.id==='f:home_delivery'));

// --- photos
const ids=[]; for(let i=0;i<6;i++){ r=await owner('upload_photo',{kind:'product',productKey:'gold necklace',image:{mimeType:'image/png',data:PNG}}); if(i<5) ids.push(r.ok); else ok('sixth item photo refused',r.status===400&&/up to 5/.test(r.error||''),JSON.stringify(r).slice(0,100)); }
ok('five item photos accepted',ids.every(Boolean)); v=await owner('load'); const itemPhotos=v.photos.filter(x=>x.kind==='product'&&x.product_key==='gold necklace'); ok('five photos stored',itemPhotos.length===5);
p=await pub(); const it=p.offline.items.find(i=>i.name==='Gold Necklace'); ok('customer data has all item photos, cover first',it.photos.length===5&&it.photo===it.photos[0]);
r=await owner('replace_photo',{photoId:itemPhotos[0].photo_id,image:{mimeType:'image/png',data:PNG}}); v=await owner('load'); const after=v.photos.filter(x=>x.kind==='product'&&x.product_key==='gold necklace'); ok('replace keeps five photos',after.length===5&&!after.some(x=>x.photo_id===itemPhotos[0].photo_id));
ok('replaced photo keeps its place (still the cover)',after[0].photo_id!==itemPhotos[0].photo_id && (await pub()).offline.items.find(i=>i.name==='Gold Necklace').photo===after[0].photo_id);
r=await owner('replace_photo',{photoId:'a'.repeat(32),image:{mimeType:'image/png',data:PNG}}); ok('replace of unknown photo refused',r.status===404);
await owner('delete_photo',{photoId:after[4].photo_id}); v=await owner('load'); ok('photo deleted',v.photos.filter(x=>x.product_key==='gold necklace').length===4);
const img=await fetch(API+'/api/botcraft/photo?id='+after[0].photo_id); ok('photo served as an image',img.status===200&&/image\/png/.test(img.headers.get('content-type')||''));
r=await owner('studio_photo',{photoId:after[0].photo_id}); ok('photo studio: Gemini failure is handled, not a crash',[502,422,503].includes(r.status)&&r.ok===false,JSON.stringify(r).slice(0,140));
v=await owner('load'); ok('failed studio call is not counted',v.photoStudio.leftToday===3);
r=await owner('studio_photo',{photoId:'b'.repeat(32)}); ok('studio on an unknown photo refused',r.status===404);
r=await owner('transcribe',{audio:{mimeType:'audio/webm',data:'AAAA'}}); ok('premium voice off falls back',r.status===503&&r.fallback===true);

// --- hosting (publish the shop page)
r=await owner('publish_page',{slug:''}); v=await owner('load'); ok('publish page works',r.ok&&v.page&&/^[a-z0-9-]+$/.test(v.page.slug),JSON.stringify(r).slice(0,160));
const slug=v.page?.slug; const home=await fetch(`${API}/s/${slug}/`); const html=await home.text();
ok('hosted page home loads',home.status===200&&html.includes(`SALESBOT_SHOP="${publicId}"`)&&!html.includes('demo-api.js'));
ok('hosted page title is the shop name',html.includes('<title>Sri Vinay Jewellers</title>'));
for(const f of ['app.js','styles.css','manifest.webmanifest','sw.js','icon.svg']){ const x=await fetch(`${API}/s/${slug}/${f}`); ok('hosted page serves '+f,x.status===200,String(x.status)); }
ok('unlisted file on hosted page is 404',(await fetch(`${API}/s/${slug}/package.json`)).status===404);
const again=await owner('publish_page',{slug:'other-name'}); v=await owner('load'); ok('publish again keeps the same address',again.ok&&v.page.slug===slug);
ok('hosting term set (one year)',Boolean(v.page.hosting?.expiresAt)&&v.page.hosting.state==='active');

// --- origins
r=await fetch(API+'/api/botcraft/public?s='+publicId,{headers:{Origin:'https://evil.example'}}); ok('customer endpoint refuses an unknown origin',r.status===403);
r=await fetch(API+'/api/botcraft/public?s='+publicId,{headers:{Origin:API}}); ok("hosted page's own origin may call customer endpoints",r.status===200);
r=await fetch(API+'/api/botcraft/owner',{method:'POST',headers:{Origin:API,'Content-Type':'application/json'},body:JSON.stringify({shopId:SID,action:'load'})}); ok('hosted origin may NOT call owner endpoint',r.status===403);

r=await fetch(API+'/api/botcraft/public?s='+publicId,{headers:{'Sec-Fetch-Site':'same-origin','CF-Connecting-IP':nextIp()}}); ok('same-origin GET with no Origin header is allowed (hosted page)',r.status===200,String(r.status));
r=await fetch(API+'/api/botcraft/public?s='+publicId,{headers:{'CF-Connecting-IP':nextIp()}}); ok('GET with no Origin and no same-origin proof is refused',r.status===403,String(r.status));
r=await fetch(API+'/api/botcraft/owner',{method:'POST',headers:{'Sec-Fetch-Site':'same-origin','Content-Type':'application/json','CF-Connecting-IP':nextIp()},body:JSON.stringify({shopId:SID,action:'load'})}); ok('owner endpoint still refuses without an allowed Origin',r.status===403,String(r.status));

// --- reply metering
const ask=()=>post('/api/botcraft/ask',{s:publicId,text:'what are your timings?'},{Origin:API});
r=await ask(); ok('ask with a fake Gemini key fails cleanly',r.status===503&&r.ok===false,JSON.stringify(r).slice(0,120));
v=await owner('load'); ok('credit given back when the AI fails',v.replies.balance===5&&v.replies.used===0,JSON.stringify(v.replies));
const adm=(body)=>post('/api/admin/bot',body,{Authorization:'Bearer test-admin-token'});
r=await adm({id:SID,action:'add_replies',count:-5}); ok('admin removes replies',r.ok&&r.bot.replies.balance===0,JSON.stringify(r).slice(0,150));
r=await ask(); ok('no replies left -> 402 no_replies',r.status===402&&r.code==='no_replies',JSON.stringify(r).slice(0,120));
// daily caps: one visitor (same address) may ask 3 times a day; the shop 6 times in total
const sameIp={'CF-Connecting-IP':'203.0.113.9'}; const caps=[]; for(let i=0;i<4;i++) caps.push(await post('/api/botcraft/ask',{s:publicId,text:'hello'},{Origin:API,...sameIp}));
ok('same visitor: first 3 questions pass the daily cap',caps.slice(0,3).every(x=>x.status===503||x.status===402),JSON.stringify(caps.map(x=>x.status)));
ok('same visitor: 4th question is stopped (visitor_limit, 429)',caps[3].status===429&&caps[3].code==='visitor_limit',JSON.stringify(caps[3]).slice(0,120));
const shopA=await post('/api/botcraft/ask',{s:publicId,text:'hello'},{Origin:API}); const shopB=await post('/api/botcraft/ask',{s:publicId,text:'hello'},{Origin:API});
ok('shop daily total: stopped after the shop limit (daily_limit, 429)',shopA.status!==429&&shopB.status===429&&shopB.code==='daily_limit',JSON.stringify([shopA.status,shopB.status,shopB.code]));
r=await post('/api/admin/photos',{action:'migrate'},{Authorization:'Bearer test-admin-token'}); ok('photo migration refused when no photo bucket is connected',r.status===503,JSON.stringify(r).slice(0,100));
r=await get('/api/admin/photos',{Authorization:'Bearer test-admin-token'}); ok('photo stats: bucket not connected, photos in D1',r.r2Available===false&&r.inD1>0&&r.inR2===0,JSON.stringify(r));
r=await adm({id:SID,action:'add_replies',count:100}); ok('admin recharge adds replies',r.bot.replies.balance===100);
r=await post('/api/admin/bot',{id:SID,action:'add_replies',count:5},{Authorization:'Bearer wrong'}); ok('admin refuses a wrong key',r.status===401);
r=await adm({id:SID,action:'add_replies',count:0}); ok('admin refuses zero',r.status===400);

// --- delete the whole bot (a second shop, so the other checks are not affected)
const SID2='22222222-3333-4444-8555-666666666666'; const owner2=(action,data={})=>post('/api/botcraft/owner',{shopId:SID2,action,...data});
let v2=await owner2('load'); const publicId2=v2.publicId; ok('second shop loads and has a public link',v2.ok&&Boolean(publicId2),JSON.stringify(v2).slice(0,100));
await owner2('upload_photo',{kind:'product',productKey:'test item',image:{mimeType:'image/png',data:PNG}}); await owner2('add_note',{note:'a note'}); await owner2('hide_answer',{answerId:'f:offers',hidden:true});
const pub2=await owner2('publish_page',{slug:'delete-me'}); v2=await owner2('load'); const slug2=v2.page?.slug; ok('second shop page published',pub2.ok&&Boolean(slug2),JSON.stringify(pub2).slice(0,100));
const photoId2=v2.photos[0]?.photo_id; ok('second shop has a photo before delete',Boolean(photoId2)&&(await fetch(API+'/api/botcraft/photo?id='+photoId2)).status===200);
let d=await owner2('delete_bot',{}); ok('delete without the confirm word is refused',d.status===400);
d=await owner2('delete_bot',{confirm:'yes'}); ok('delete with a wrong confirm word is refused',d.status===400);
v2=await owner2('load'); ok('shop still exists after refused deletes',v2.ok===true);
d=await owner2('delete_bot',{confirm:'DELETE'}); ok('delete bot works',d.ok&&d.deleted===true,JSON.stringify(d));
v2=await owner2('load'); ok('deleted bot is gone for the owner (404)',v2.status===404);
ok("deleted bot's public link is gone (404)",(await get('/api/botcraft/public?s='+publicId2)).status===404);
ok("deleted bot's photo is gone (404)",(await fetch(API+'/api/botcraft/photo?id='+photoId2)).status===404);
ok("deleted bot's web page is gone",[404,410].includes((await fetch(`${API}/s/${slug2}/`)).status));
d=await owner2('delete_bot',{confirm:'DELETE'}); ok('deleting again says not found (404)',d.status===404);
v=await owner('load'); ok('the other shop is untouched',v.ok&&v.products.length>=1);

console.log(results.join('\n')); console.log(`\n${pass} passed, ${fail} failed`);
