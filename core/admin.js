(()=>{'use strict';
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const get=(o,p)=>p.split('.').reduce((x,k)=>x?.[k],o);
const set=(o,p,v)=>{const a=p.split('.');let x=o;a.slice(0,-1).forEach(k=>{if(!x[k]||typeof x[k]!=='object')x[k]={};x=x[k]});x[a.at(-1)]=v};
const root=p=>new URL(p,location.href).href;
const id=new URLSearchParams(location.search).get('template')||Store.read().templateId||'restaurant-01';
const t=getTemplate(id);if(!t){location.href='index.html';return}
let m,d,key='sitecraft:'+id,pickerTarget=null;
async function boot(){m=await fetch(root(t.manifest)).then(r=>{if(!r.ok)throw Error('Manifest load failed');return r.json()});d=load();ensureMediaLibrary();$('#adminTemplateName').textContent=m.name||t.name;$('#adminTemplateCategory').textContent=m.category||t.category||'';if(isProtected()&&sessionStorage.getItem(authKey())!=='1'){showAuth();return}build();bind();render()}
function load(){
  let x;
  try{x=JSON.parse(localStorage.getItem(key)||'null')}catch{x=null}
  if(!x||typeof x!=='object')x=structuredClone(m.demoData||{});
  if(m.id==='catering-01'&&Array.isArray(x.menu)&&x.menu.some(v=>!Array.isArray(v.items))){
    const groups=[];
    x.menu.forEach((item,i)=>{
      const cat=item.category||'General Menu';
      let g=groups.find(v=>v.title===cat);
      if(!g){g={id:'menu-'+(groups.length+1),title:cat,description:'',serves:'',pricePerPlate:'',enabled:true,items:[]};groups.push(g)}
      g.items.push({id:item.id||('item-'+(i+1)),name:item.name||'Menu item',description:item.description||'',price:item.price||'',image:item.image||'',enabled:item.enabled!==false});
    });
    x.menu=groups;
  }
  const demo=m.demoData||{};
  Object.keys(demo).forEach(k=>{if(x[k]===undefined)x[k]=structuredClone(demo[k])});
  return x;
}
function ensureMediaLibrary(){
  const library=Array.isArray(d.mediaLibrary)?d.mediaLibrary:[];
  const seen=new Set(library.map(x=>x.src));
  const add=(src,name)=>{
    if(!src||typeof src!=='string'||seen.has(src))return;
    seen.add(src);library.push({id:crypto.randomUUID(),name,type:'image',src});
  };
  if(m.admin?.heroPath)add(get(d,m.admin.heroPath),m.name+' hero');
  (m.admin?.sections||[]).forEach(s=>{
    if(s.type==='collection'){
      (get(d,s.path)||[]).forEach((it,i)=>(s.fields||[]).filter(f=>f.type==='media').forEach(f=>add(it[f.key],(it[s.titleKey||'name']||s.itemLabel||'Image')+' '+(i+1))));
    }else if(s.type==='nestedCollection'){
      (get(d,s.path)||[]).forEach((group,gi)=>{
        (s.groupFields||[]).filter(f=>f.type==='media').forEach(f=>add(group[f.key],(group[s.titleKey||'title']||'Menu')+' '+(gi+1)));
        (group.items||[]).forEach((it,ii)=>(s.itemFields||[]).filter(f=>f.type==='media').forEach(f=>add(it[f.key],(it.name||'Item')+' '+(ii+1))));
      });
    }else{
      (s.fields||[]).filter(f=>f.type==='media').forEach(f=>add(get(d,f.path),f.label||'Image'));
    }
  });
  if(library.length!==((d.mediaLibrary||[]).length)){d.mediaLibrary=library;try{localStorage.setItem(key,JSON.stringify(d));Store.update({templateId:id,data:structuredClone(d)})}catch{}}
}
function isProtected(){return d?.settings?.passwordProtected===true&&String(d?.settings?.adminPassword||'').length>0}
function authKey(){return 'sitecraft-admin-auth:'+id}
function showAuth(){const app=$('#adminApp'),screen=$('#authScreen');if(!screen||!app){return true}app.hidden=true;screen.hidden=false;screen.innerHTML='<div class="auth-card"><div class="auth-mark">✦</div><span class="kicker">ADMIN ACCESS</span><h1>Private admin panel.</h1><p>Enter the password to manage this website.</p><form id="adminLoginForm"><label class="field"><span>Password</span><input id="adminLoginPassword" type="password" autocomplete="current-password" required></label><button class="dark full" type="submit">Open Admin</button><div id="adminLoginError" class="admin-login-error"></div></form></div>';$('#adminLoginForm').onsubmit=e=>{e.preventDefault();const p=$('#adminLoginPassword').value;if(p===String(d.settings.adminPassword)){sessionStorage.setItem(authKey(),'1');screen.hidden=true;app.hidden=false;build();bind();render()}else{$('#adminLoginError').textContent='Incorrect password.'}};return false}

function save(msg='Saved'){try{localStorage.setItem(key,JSON.stringify(d));Store.update({templateId:id,data:structuredClone(d)});$('#saveIndicator').textContent=msg;toast(msg);renderStats()}catch{toast('Storage full')}}
function toast(x){const e=$('#toast');if(!e)return;e.textContent=x;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),1800)}
function build(){const secs=m.admin?.sections||[];$('#sideNav').innerHTML=secs.map((s,i)=>`<button class="side-tab ${i?'':'active'}" data-tab="${esc(s.id)}">${esc(s.label)}</button>`).join('')+`<a class="side-tab side-link" href="index.html">View website ↗</a>`;$('#tabPanels').innerHTML=secs.map((s,i)=>`<section class="tab-panel ${i?'':'active'}" id="tab-${esc(s.id)}">${section(s)}</section>`).join('');$$('.side-tab[data-tab]').forEach(b=>b.onclick=()=>{$$('.side-tab[data-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.tab-panel').forEach(x=>x.classList.remove('active'));$('#tab-'+b.dataset.tab).classList.add('active')})}
function mediaControl(label,value,target,compact=false){return`<div class="media-field ${compact?'compact':''}"><div><span class="media-label">${esc(label)}</span><small>${esc(value||'No image selected')}</small></div><button class="button ghost small" type="button" data-pick='${esc(JSON.stringify(target))}'>Choose image</button></div>`}
function field(f){const v=get(d,f.path);if(f.type==='checkbox')return`<label class="check-line"><input type="checkbox" data-path="${esc(f.path)}" ${v!==false?'checked':''}> ${esc(f.label)}</label>`;if(f.type==='media')return mediaControl(f.label,v,{kind:'path',path:f.path});if(f.type==='textarea')return`<label class="field wide"><span>${esc(f.label)}</span><textarea rows="5" data-path="${esc(f.path)}">${esc(v||'')}</textarea></label>`;if(f.type==='select')return`<label class="field"><span>${esc(f.label)}</span><select data-path="${esc(f.path)}">${(f.options||[]).map(o=>{const val=o.value??o;return`<option value="${esc(val)}" ${String(val)===String(v??'')?'selected':''}>${esc(o.label??o)}</option>`}).join('')}</select></label>`;return`<label class="field"><span>${esc(f.label)}</span><input data-path="${esc(f.path)}" type="${esc(f.type||'text')}" value="${esc(v||'')}" placeholder="${esc(f.placeholder||'')}"></label>`}
function section(s){
 if(s.type==='overview')return`<div class="page-head"><div><span class="kicker">SITECRAFT ADMIN</span><h1>Manage ${esc(m.name)}.</h1><p>Change your website after download from this control panel.</p></div></div><div class="stat-grid"><article><span>Images</span><strong id="statImages">0</strong></article><article><span>Menu / Services</span><strong id="statServices">0</strong></article><article><span>Gallery</span><strong id="statGallery">0</strong></article><article><span>Enquiries</span><strong id="statEnquiries">0</strong></article></div><div class="card overview-card"><h2 id="overviewName"></h2><p id="overviewMotto"></p></div>`;
 if(s.type==='collection')return`<div class="page-head"><div><span class="kicker">${esc(s.label)}</span><h1>${esc(s.title||s.label)}</h1><p>${esc(s.description||'Add, edit, reorder or remove items.')}</p></div></div><div class="card media-toolbar"><button class="button dark" data-add="${esc(s.id)}">+ Add ${esc(s.itemLabel||s.label)}</button></div><div id="list-${esc(s.id)}" class="repeat-list"></div>`; if(s.type==='nestedCollection')return`<div class="page-head"><div><span class="kicker">${esc(s.label)}</span><h1>${esc(s.title||s.label)}</h1><p>${esc(s.description||'Create groups, then add items inside each group.')}</p></div></div><div class="card media-toolbar"><button class="button dark" data-add="${esc(s.id)}">+ Add ${esc(s.itemLabel||'group')}</button></div><div id="list-${esc(s.id)}" class="repeat-list"></div>`;
 if(s.type==='media')return`<div class="page-head"><div><span class="kicker">IMAGES</span><h1>Upload once, reuse everywhere.</h1></div></div><div class="card media-toolbar"><label class="button dark file-btn">+ Upload images<input id="imageUpload" type="file" accept="image/*" multiple></label><span id="mediaCount"></span></div><div id="mediaGrid" class="media-grid"></div>`;
 if(s.type==='security')return`<div class="page-head"><div><span class="kicker">SECURITY</span><h1>Optional admin protection.</h1></div></div><div class="card form-card"><label class="check-line"><input id="passwordProtected" type="checkbox"> Password protection</label><div id="passwordBox"><div class="two-col"><label class="field"><span>Password</span><input id="newPassword" type="password"></label><label class="field"><span>Confirm</span><input id="confirmPassword" type="password"></label></div><button class="button dark" id="savePassword">Save password</button></div></div>`;
 return`<div class="page-head"><div><span class="kicker">${esc(s.label)}</span><h1>${esc(s.title||s.label)}</h1><p>${esc(s.description||'')}</p></div></div><div class="card form-card"><div class="two-col">${(s.fields||[]).map(field).join('')}</div></div>`}
function collectionField(s,it,i,f){
 const v=it[f.key];
 if(f.type==='checkbox')return`<label class="check-line"><input type="checkbox" data-item="${esc(s.id)}" data-id="${esc(it.id)}" data-key="${esc(f.key)}" ${v!==false?'checked':''}> ${esc(f.label)}</label>`;
 if(f.type==='media')return mediaControl(f.label,v,{kind:'item',sectionId:s.id,itemId:it.id,key:f.key},true);
 if(f.type==='textarea')return`<label class="field wide"><span>${esc(f.label)}</span><textarea data-item="${esc(s.id)}" data-id="${esc(it.id)}" data-key="${esc(f.key)}">${esc(v||'')}</textarea></label>`;
 if(f.type==='select')return`<label class="field"><span>${esc(f.label)}</span><select data-item="${esc(s.id)}" data-id="${esc(it.id)}" data-key="${esc(f.key)}">${(f.options||[]).map(o=>{const val=o.value??o;return`<option value="${esc(val)}" ${String(val)===String(v??'')?'selected':''}>${esc(o.label??o)}</option>`}).join('')}</select></label>`;
 return`<label class="field"><span>${esc(f.label)}</span><input data-item="${esc(s.id)}" data-id="${esc(it.id)}" data-key="${esc(f.key)}" value="${esc(v||'')}"></label>`}
function nestedField(s,g,f){
 const v=g[f.key];
 if(f.type==='checkbox')return`<label class="check-line"><input type="checkbox" data-group="${esc(s.id)}" data-id="${esc(g.id)}" data-key="${esc(f.key)}" ${v!==false?'checked':''}> ${esc(f.label)}</label>`;
 if(f.type==='media')return mediaControl(f.label,v,{kind:'nestedGroup',sectionId:s.id,groupId:g.id,key:f.key},true);
 if(f.type==='textarea')return`<label class="field wide"><span>${esc(f.label)}</span><textarea data-group="${esc(s.id)}" data-id="${esc(g.id)}" data-key="${esc(f.key)}">${esc(v||'')}</textarea></label>`;
 return`<label class="field"><span>${esc(f.label)}</span><input data-group="${esc(s.id)}" data-id="${esc(g.id)}" data-key="${esc(f.key)}" value="${esc(v||'')}"></label>`;
}
function nestedItemField(s,g,it,f){
 const v=it[f.key];
 if(f.type==='checkbox')return`<label class="check-line"><input type="checkbox" data-subitem="${esc(s.id)}" data-group-id="${esc(g.id)}" data-id="${esc(it.id)}" data-key="${esc(f.key)}" ${v!==false?'checked':''}> ${esc(f.label)}</label>`;
 if(f.type==='media')return mediaControl(f.label,v,{kind:'nestedItem',sectionId:s.id,groupId:g.id,itemId:it.id,key:f.key},true);
 if(f.type==='textarea')return`<label class="field wide"><span>${esc(f.label)}</span><textarea data-subitem="${esc(s.id)}" data-group-id="${esc(g.id)}" data-id="${esc(it.id)}" data-key="${esc(f.key)}">${esc(v||'')}</textarea></label>`;
 return`<label class="field"><span>${esc(f.label)}</span><input data-subitem="${esc(s.id)}" data-group-id="${esc(g.id)}" data-id="${esc(it.id)}" data-key="${esc(f.key)}" value="${esc(v||'')}"></label>`;
}
function renderNestedCollection(s){
 const r=$('#list-'+s.id);if(!r)return;
 const list=get(d,s.path)||[];
 r.innerHTML=list.map((g,i)=>`<article class="repeat-card nested-group-card"><div class="repeat-head"><div><span>${esc(s.itemLabel||'Group')} ${i+1}</span><strong>${esc(g[s.titleKey||'title']||'Untitled menu')}</strong></div><div class="nested-group-actions"><button class="button ghost small" type="button" data-toggle-menu="${esc(g.id)}">Collapse</button><button class="button danger small" data-del="${esc(s.id)}" data-id="${esc(g.id)}">Delete menu</button></div></div><div class="nested-menu-body" data-menu-body="${esc(g.id)}"><div class="two-col nested-group-fields">${(s.groupFields||[]).map(f=>nestedField(s,g,f)).join('')}</div><div class="nested-items"><div class="nested-items-head"><div><strong>Menu items</strong><span>Add individual dishes inside this menu.</span></div><button class="button ghost small" data-add-subitem="${esc(s.id)}" data-group-id="${esc(g.id)}">+ Add Item</button></div><div class="nested-item-list">${(g.items||[]).map((it,ii)=>`<article class="nested-item-card"><div class="nested-item-head"><span>Item ${ii+1}</span><button class="button danger small" data-del-subitem="${esc(s.id)}" data-group-id="${esc(g.id)}" data-id="${esc(it.id)}">Delete item</button></div><div class="two-col">${(s.itemFields||[]).map(f=>nestedItemField(s,g,it,f)).join('')}</div></article>`).join('')||'<div class="empty-state">No items yet. Click Add Item to create the first dish.</div>'}</div></div></div></article>`).join('')||'<div class="empty-state">No menus yet. Click Add menu to create one.</div>';
}
function renderCollection(s){const r=$('#list-'+s.id);if(!r)return;const list=get(d,s.path)||[];r.innerHTML=list.map((it,i)=>`<article class="repeat-card"><div class="repeat-head"><div><span>${esc(s.itemLabel||s.label)} ${i+1}</span><strong>${esc(it[s.titleKey||'name']||it.title||'Untitled')}</strong></div><button class="button danger small" data-del="${esc(s.id)}" data-id="${esc(it.id)}">Delete</button></div><div class="two-col">${(s.fields||[]).map(f=>collectionField(s,it,i,f)).join('')}</div></article>`).join('')||'<div class="empty-state">No items yet. Use Add to create one.</div>'}
function renderMedia(){const r=$('#mediaGrid');if(!r)return;const a=(d.mediaLibrary||[]).filter(x=>x.type==='image');$('#mediaCount').textContent=a.length+' stored images';r.innerHTML=a.map(x=>`<article class="media-card"><div class="media-thumb"><img src="${esc(x.src)}" alt=""></div><div class="media-body"><strong>${esc(x.name)}</strong><div class="media-actions"><button class="button danger small" data-media-del="${esc(x.id)}">Delete</button></div></div></article>`).join('')||'<div class="empty-state">No images yet. Upload images to build your library.</div>'}
function renderStats(){const c=(id)=>{const s=m.admin?.sections?.find(x=>x.id===id);const a=s?get(d,s.path):[];return Array.isArray(a)?a.filter(x=>x.enabled!==false).length:0};if($('#statImages'))$('#statImages').textContent=(d.mediaLibrary||[]).length;if($('#statServices'))$('#statServices').textContent=c(['restaurant-01','restaurant-02','catering-01'].includes(m.id)?'menu':'services');if($('#statGallery'))$('#statGallery').textContent=c('gallery');if($('#statEnquiries'))$('#statEnquiries').textContent='0';if($('#overviewName'))$('#overviewName').textContent=get(d,m.admin?.overviewNamePath||'brand.businessName')||m.name;if($('#overviewMotto'))$('#overviewMotto').textContent=get(d,m.admin?.overviewMottoPath||'brand.tagline')||get(d,m.admin?.overviewMottoPath||'brand.motto')||''}
function render(){ $$('[data-path]').forEach(e=>{const v=get(d,e.dataset.path);if(e.type==='checkbox')e.checked=v!==false;else e.value=v??''});$$('.media-field').forEach(x=>{const b=x.querySelector('[data-pick]');if(!b)return;const target=JSON.parse(b.dataset.pick);let v='';if(target.kind==='path')v=get(d,target.path);else if(target.kind==='item')v=((get(d,m.admin.sections.find(s=>s.id===target.sectionId)?.path)||[]).find(i=>i.id===target.itemId)?.[target.key]||'');else if(target.kind==='nestedGroup')v=((get(d,m.admin.sections.find(s=>s.id===target.sectionId)?.path)||[]).find(i=>i.id===target.groupId)?.[target.key]||'');else if(target.kind==='nestedItem'){const g=(get(d,m.admin.sections.find(s=>s.id===target.sectionId)?.path)||[]).find(i=>i.id===target.groupId);v=(g?.items||[]).find(i=>i.id===target.itemId)?.[target.key]||''}const small=x.querySelector('small');if(small)small.textContent=v?'Image selected':'No image selected'});(m.admin?.sections||[]).filter(s=>s.type==='collection').forEach(renderCollection);(m.admin?.sections||[]).filter(s=>s.type==='nestedCollection').forEach(renderNestedCollection);renderMedia();renderStats();updateSecurity()}
function openPicker(target){
 pickerTarget=target;
 const a=(d.mediaLibrary||[]).filter(x=>x.type==='image');
 const o=$('#pickerOverlay'),g=$('#pickerGrid');if(!o||!g)return;
 g.innerHTML=a.map(x=>`<button class="picker-item" type="button" data-pick-id="${esc(x.id)}"><img src="${esc(x.src)}" alt=""><span>${esc(x.name)}</span></button>`).join('')||'<div class="empty-state">No images in storage yet.</div>';
 const head=o.querySelector('.picker-head');
 if(head&&!head.querySelector('#pickerUpload')){
   const wrap=document.createElement('label');wrap.className='button dark picker-upload-btn';wrap.id='pickerUpload';
   wrap.innerHTML='+ Upload image<input id="pickerImageUpload" type="file" accept="image/*">';
   head.appendChild(wrap);
   $('#pickerImageUpload')?.addEventListener('change',async e=>{
     for(const f of [...e.target.files]){
       try{
         const b=await createImageBitmap(f),cv=document.createElement('canvas'),scale=Math.min(1,1800/Math.max(b.width,b.height));
         cv.width=Math.max(1,Math.round(b.width*scale));cv.height=Math.max(1,Math.round(b.height*scale));
         cv.getContext('2d').drawImage(b,0,0,cv.width,cv.height);
         d.mediaLibrary=d.mediaLibrary||[];
         const src=cv.toDataURL('image/jpeg',.82);
         d.mediaLibrary.push({id:crypto.randomUUID(),name:f.name,type:'image',src});
       }catch{toast('Could not process '+f.name)}
     }
     save('Image uploaded'); openPicker(pickerTarget);
   });
 }
 o.hidden=false;
}
function closePicker(){$('#pickerOverlay').hidden=true;pickerTarget=null}
function bind(){
 document.addEventListener('input',e=>{if(e.target.matches('[data-path]')){set(d,e.target.dataset.path,e.target.type==='checkbox'?e.target.checked:e.target.value);save('Draft saved')}}); 
 document.addEventListener('change',e=>{if(e.target.matches('[data-path]')){set(d,e.target.dataset.path,e.target.type==='checkbox'?e.target.checked:e.target.value);save('Setting saved')}});
 document.addEventListener('input',e=>{if(e.target.matches('[data-item]')){const s=m.admin.sections.find(x=>x.id===e.target.dataset.item),it=(get(d,s.path)||[]).find(x=>x.id===e.target.dataset.id);if(it){it[e.target.dataset.key]=e.target.type==='checkbox'?e.target.checked:e.target.value;save('Item saved')}}});
 document.addEventListener('change',e=>{if(e.target.matches('[data-item]')){const s=m.admin.sections.find(x=>x.id===e.target.dataset.item),it=(get(d,s.path)||[]).find(x=>x.id===e.target.dataset.id);if(it){it[e.target.dataset.key]=e.target.type==='checkbox'?e.target.checked:e.target.value;save('Item saved')}}});
 document.addEventListener('input',e=>{if(e.target.matches('[data-group]')){const s=m.admin.sections.find(x=>x.id===e.target.dataset.group),g=(get(d,s.path)||[]).find(x=>x.id===e.target.dataset.id);if(g){g[e.target.dataset.key]=e.target.type==='checkbox'?e.target.checked:e.target.value;save('Menu saved')}}});
 document.addEventListener('change',e=>{if(e.target.matches('[data-group]')){const s=m.admin.sections.find(x=>x.id===e.target.dataset.group),g=(get(d,s.path)||[]).find(x=>x.id===e.target.dataset.id);if(g){g[e.target.dataset.key]=e.target.type==='checkbox'?e.target.checked:e.target.value;save('Menu saved')}}});
 document.addEventListener('input',e=>{if(e.target.matches('[data-subitem]')){const s=m.admin.sections.find(x=>x.id===e.target.dataset.subitem),g=(get(d,s.path)||[]).find(x=>x.id===e.target.dataset.groupId),it=(g?.items||[]).find(x=>x.id===e.target.dataset.id);if(it){it[e.target.dataset.key]=e.target.type==='checkbox'?e.target.checked:e.target.value;save('Menu item saved')}}});
 document.addEventListener('change',e=>{if(e.target.matches('[data-subitem]')){const s=m.admin.sections.find(x=>x.id===e.target.dataset.subitem),g=(get(d,s.path)||[]).find(x=>x.id===e.target.dataset.groupId),it=(g?.items||[]).find(x=>x.id===e.target.dataset.id);if(it){it[e.target.dataset.key]=e.target.type==='checkbox'?e.target.checked:e.target.value;save('Menu item saved')}}});
 document.addEventListener('click',e=>{
  const p=e.target.closest('[data-pick]');if(p){openPicker(JSON.parse(p.dataset.pick));return}
  const pi=e.target.closest('[data-pick-id]');if(pi&&pickerTarget){const img=(d.mediaLibrary||[]).find(x=>x.id===pi.dataset.pickId);if(img){if(pickerTarget.kind==='path')set(d,pickerTarget.path,img.src);else if(pickerTarget.kind==='item'){const s=m.admin.sections.find(x=>x.id===pickerTarget.sectionId),it=(get(d,s.path)||[]).find(x=>x.id===pickerTarget.itemId);if(it)it[pickerTarget.key]=img.src}else if(pickerTarget.kind==='nestedGroup'){const s=m.admin.sections.find(x=>x.id===pickerTarget.sectionId),g=(get(d,s.path)||[]).find(x=>x.id===pickerTarget.groupId);if(g)g[pickerTarget.key]=img.src}else if(pickerTarget.kind==='nestedItem'){const s=m.admin.sections.find(x=>x.id===pickerTarget.sectionId),g=(get(d,s.path)||[]).find(x=>x.id===pickerTarget.groupId),it=(g?.items||[]).find(x=>x.id===pickerTarget.itemId);if(it)it[pickerTarget.key]=img.src}save('Image selected');render()}closePicker();return}
  const menuToggle=e.target.closest('[data-toggle-menu]');if(menuToggle){const body=$('[data-menu-body="'+menuToggle.dataset.toggleMenu+'"]');if(body){const collapsed=body.hidden;body.hidden=!collapsed;menuToggle.textContent=collapsed?'Collapse':'Expand'}return}
  const nsAdd=e.target.closest('[data-add-subitem]');if(nsAdd){const s=m.admin.sections.find(x=>x.id===nsAdd.dataset.addSubitem),g=(get(d,s.path)||[]).find(x=>x.id===nsAdd.dataset.groupId);if(g){g.items=g.items||[];const it={id:crypto.randomUUID()};(s.itemFields||[]).forEach(f=>{it[f.key]=f.default??(f.type==='checkbox'?true:'')});g.items.push(it);save('Menu item added');renderNestedCollection(s)}return}
  const nsDel=e.target.closest('[data-del-subitem]');if(nsDel){const s=m.admin.sections.find(x=>x.id===nsDel.dataset.delSubitem),g=(get(d,s.path)||[]).find(x=>x.id===nsDel.dataset.groupId);if(g){g.items=(g.items||[]).filter(x=>x.id!==nsDel.dataset.id);save('Menu item deleted');renderNestedCollection(s)}return}
  const a=e.target.closest('[data-add]');if(a){const s=m.admin.sections.find(x=>x.id===a.dataset.add),list=get(d,s.path)||[],it={id:crypto.randomUUID(),...(s.addDefaults||{})};(s.fields||[]).forEach(f=>{if(it[f.key]===undefined)it[f.key]=f.default??(f.type==='checkbox'?true:'')});list.push(it);set(d,s.path,list);save('Item added');renderCollection(s);return}
  const del=e.target.closest('[data-del]');if(del){const s=m.admin.sections.find(x=>x.id===del.dataset.del);set(d,s.path,(get(d,s.path)||[]).filter(x=>x.id!==del.dataset.id));save('Item deleted');renderCollection(s);return}
  const md=e.target.closest('[data-media-del]');if(md&&confirm('Delete image?')){const removed=(d.mediaLibrary||[]).find(x=>x.id===md.dataset.mediaDel);d.mediaLibrary=(d.mediaLibrary||[]).filter(x=>x.id!==md.dataset.mediaDel);if(removed){(m.admin?.sections||[]).filter(s=>s.type==='collection').forEach(s=>{const list=get(d,s.path)||[];list.forEach(it=>(s.fields||[]).filter(f=>f.type==='media').forEach(f=>{if(it[f.key]===removed.src)it[f.key]=''}))});
(m.admin?.sections||[]).filter(s=>s.type==='nestedCollection').forEach(s=>{(get(d,s.path)||[]).forEach(g=>{(s.groupFields||[]).filter(f=>f.type==='media').forEach(f=>{if(g[f.key]===removed.src)g[f.key]=''});(g.items||[]).forEach(it=>(s.itemFields||[]).filter(f=>f.type==='media').forEach(f=>{if(it[f.key]===removed.src)it[f.key]=''}))})});(m.admin?.sections||[]).forEach(s=>(s.fields||[]).filter(f=>f.type==='media').forEach(f=>{if(get(d,f.path)===removed.src)set(d,f.path,'')}))}save('Image deleted');render()}
 });
 $('#closePicker')?.addEventListener('click',closePicker);$('#pickerOverlay')?.addEventListener('click',e=>{if(e.target.id==='pickerOverlay')closePicker()});
 $('#saveTop').onclick=()=>save('All changes saved');
 $('#resetBtn').onclick=()=>{if(confirm('Reset this template?')){d=structuredClone(m.demoData||{});save('Defaults restored');location.reload()}};
 $('#exportBtn').onclick=()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(d,null,2)],{type:'application/json'}));a.download=id+'-settings.json';a.click()};
 $('#imageUpload')?.addEventListener('change',async e=>{for(const f of [...e.target.files]){try{const b=await createImageBitmap(f),c=document.createElement('canvas'),scale=Math.min(1,1800/Math.max(b.width,b.height));c.width=Math.max(1,Math.round(b.width*scale));c.height=Math.max(1,Math.round(b.height*scale));c.getContext('2d').drawImage(b,0,0,c.width,c.height);d.mediaLibrary=d.mediaLibrary||[];d.mediaLibrary.push({id:crypto.randomUUID(),name:f.name,type:'image',src:c.toDataURL('image/jpeg',.82)})}catch{toast('Could not process '+f.name)}}save('Images uploaded');render()});
}
function updateSecurity(){const p=$('#passwordProtected');if(!p)return;p.checked=d.settings?.passwordProtected===true;$('#passwordBox').hidden=!p.checked;p.onchange=()=>{d.settings=d.settings||{};d.settings.passwordProtected=p.checked;save('Security updated');updateSecurity()};$('#savePassword').onclick=()=>{const a=$('#newPassword').value,b=$('#confirmPassword').value;if(!a||a!==b)return toast('Passwords do not match');d.settings.adminPassword=a;d.settings.passwordProtected=true;save('Password saved');updateSecurity()}}
boot().catch(e=>{$('#adminApp').innerHTML='<div class="admin-error">Admin failed to start: '+esc(e.message)+'</div>'});
})();