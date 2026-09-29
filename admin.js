(() => {
  'use strict';
  const $ = (s,root=document)=>root.querySelector(s);
  const $$ = (s,root=document)=>[...root.querySelectorAll(s)];
  const KEY='sitecraft-photography-01';
  const defaults=structuredClone(window.PHOTOGRAPHY_DEFAULTS);
  let data=structuredClone(defaults);
  try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved)data=saved;}catch{}

  const get=(path)=>path.split('.').reduce((o,k)=>o?.[k],data);
  const set=(path,value)=>{const keys=path.split('.');let obj=data;keys.slice(0,-1).forEach(k=>obj=obj[k]);obj[keys.at(-1)]=value;};
  const save=(message='Changes saved')=>{localStorage.setItem(KEY,JSON.stringify(data));toast(message);};
  const toast=(message)=>{const t=$('#toast');t.textContent=message;t.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove('show'),2200)};

  function escape(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function syncSimpleFields(){
    $$('[data-path]').forEach(el=>{el.value=get(el.dataset.path)??'';el.oninput=()=>{set(el.dataset.path,el.value);save('Draft saved');}});
    $$('[data-setting]').forEach(el=>{el.checked=get('settings.'+el.dataset.setting) !== false;el.onchange=()=>{set('settings.'+el.dataset.setting,el.checked);save();renderStats();}});
    $$('[data-setting-value]').forEach(el=>{el.value=get('settings.'+el.dataset.settingValue)??'';el.oninput=()=>{set('settings.'+el.dataset.settingValue,el.value);save();}});
  }

  function renderStats(){
    $('#statServices').textContent=(data.services||[]).filter(x=>x.name).length;
    $('#statGallery').textContent=(data.gallery||[]).filter(x=>x.image).length;
    $('#statReviews').textContent=(data.reviews||[]).filter(x=>x.name && x.approved!==false).length;
    $('#statFaqs').textContent=(data.faqs||[]).filter(x=>x.question).length;
    $('#overviewName').textContent=data.brand?.studioName||'Your Studio';$('#overviewMotto').textContent=data.brand?.motto||'Add a studio motto';$('#overviewImage').src=data.hero?.image||'';
  }

  function renderServices(){
    const root=$('#servicesEditor');root.innerHTML=(data.services||[]).map((x,i)=>`<article class="repeat-card"><div class="repeat-head"><div><span>Service ${i+1}</span><strong>${escape(x.name)||'Untitled service'}</strong></div><button class="danger" data-delete-service="${x.id}">Delete</button></div><div class="two-col"><label class="field"><span>Name</span><input data-service="${x.id}" data-key="name" value="${escape(x.name)}"></label><label class="field"><span>Price / package text</span><input data-service="${x.id}" data-key="price" value="${escape(x.price)}"></label><label class="field wide"><span>Description</span><textarea data-service="${x.id}" data-key="description" rows="3">${escape(x.description)}</textarea></label></div></article>`).join('');
    $$('[data-service]').forEach(el=>el.oninput=()=>{const item=data.services.find(x=>x.id===el.dataset.service);if(item){item[el.dataset.key]=el.value;save('Service saved')}});
    $$('[data-delete-service]').forEach(b=>b.onclick=()=>{data.services=data.services.filter(x=>x.id!==b.dataset.deleteService);save('Service deleted');renderServices();renderStats()});
  }

  function renderGallery(){
    const root=$('#galleryEditor');root.innerHTML=(data.gallery||[]).map((x,i)=>`<article class="repeat-card gallery-editor-card"><div class="repeat-head"><div><span>Gallery image ${i+1}</span><strong>${escape(x.title)||'Untitled image'}</strong></div><button class="danger" data-delete-gallery="${x.id}">Delete</button></div><div class="gallery-edit-grid"><div class="gallery-thumb"><img src="${escape(x.image)||''}" alt=""></div><div class="two-col"><label class="field"><span>Title</span><input data-gallery="${x.id}" data-key="title" value="${escape(x.title)}"></label><label class="field"><span>Category</span><select data-gallery="${x.id}" data-key="category"><option>Weddings</option><option>Portraits</option><option>Nature</option><option>Birthdays</option><option>Corporate</option></select></label><label class="field wide"><span>Image URL</span><input data-gallery="${x.id}" data-key="image" value="${escape(x.image)}"></label><label class="field wide"><span>Or upload image from device (demo/local)</span><input type="file" accept="image/*" data-upload-gallery="${x.id}"></label><label class="field wide"><span>YouTube / Vimeo URL</span><input data-gallery="${x.id}" data-key="video" value="${escape(x.video)}"></label></div></div></article>`).join('');
    $$('[data-gallery]').forEach(el=>{const item=data.gallery.find(x=>x.id===el.dataset.gallery);if(item){if(el.tagName==='SELECT')el.value=item[el.dataset.key];el.oninput=()=>{item[el.dataset.key]=el.value;save('Gallery saved');if(el.dataset.key==='image')renderGallery()}}});
    $$('[data-delete-gallery]').forEach(b=>b.onclick=()=>{data.gallery=data.gallery.filter(x=>x.id!==b.dataset.deleteGallery);save('Image deleted');renderGallery();renderStats()});
    $$('[data-upload-gallery]').forEach(input=>input.onchange=()=>{const file=input.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const item=data.gallery.find(x=>x.id===input.dataset.uploadGallery);if(item){item.image=reader.result;save('Image uploaded locally');renderGallery();renderStats()}};reader.readAsDataURL(file)});
  }

  function renderReviews(){
    const root=$('#reviewsEditor');root.innerHTML=(data.reviews||[]).map((x,i)=>`<article class="repeat-card"><div class="repeat-head"><div><span>Review ${i+1}</span><strong>${escape(x.name)||'Untitled review'}</strong></div><button class="danger" data-delete-review="${x.id}">Delete</button></div><div class="two-col"><label class="field"><span>Customer name</span><input data-review="${x.id}" data-key="name" value="${escape(x.name)}"></label><label class="field"><span>Rating</span><select data-review="${x.id}" data-key="rating">${[5,4,3,2,1].map(v=>`<option ${Number(x.rating)===v?'selected':''}>${v}</option>`).join('')}</select></label><label class="field wide"><span>Review</span><textarea data-review="${x.id}" data-key="text" rows="3">${escape(x.text)}</textarea></label><label class="field"><span>Source</span><select data-review="${x.id}" data-key="source"><option ${x.source==='Google'?'selected':''}>Google</option><option ${x.source==='Facebook'?'selected':''}>Facebook</option></select></label><label class="check-line"><input type="checkbox" data-approve-review="${x.id}" ${x.approved!==false?'checked':''}> Show on website</label></div></article>`).join('');
    $$('[data-review]').forEach(el=>el.oninput=()=>{const item=data.reviews.find(x=>x.id===el.dataset.review);if(item){item[el.dataset.key]=el.dataset.key==='rating'?Number(el.value):el.value;save('Review saved')}});
    $$('[data-approve-review]').forEach(el=>el.onchange=()=>{const item=data.reviews.find(x=>x.id===el.dataset.approveReview);if(item){item.approved=el.checked;save('Review visibility updated')}});
    $$('[data-delete-review]').forEach(b=>b.onclick=()=>{data.reviews=data.reviews.filter(x=>x.id!==b.dataset.deleteReview);save('Review deleted');renderReviews();renderStats()});
  }

  function renderFaqs(){
    const root=$('#faqEditor');root.innerHTML=(data.faqs||[]).map((x,i)=>`<article class="repeat-card"><div class="repeat-head"><div><span>FAQ ${i+1}</span><strong>${escape(x.question)||'Untitled question'}</strong></div><button class="danger" data-delete-faq="${x.id}">Delete</button></div><label class="field"><span>Question</span><input data-faq="${x.id}" data-key="question" value="${escape(x.question)}"></label><label class="field"><span>Answer</span><textarea data-faq="${x.id}" data-key="answer" rows="3">${escape(x.answer)}</textarea></label></article>`).join('');
    $$('[data-faq]').forEach(el=>el.oninput=()=>{const item=data.faqs.find(x=>x.id===el.dataset.faq);if(item){item[el.dataset.key]=el.value;save('FAQ saved')}});
    $$('[data-delete-faq]').forEach(b=>b.onclick=()=>{data.faqs=data.faqs.filter(x=>x.id!==b.dataset.deleteFaq);save('FAQ deleted');renderFaqs();renderStats()});
  }

  function add(kind){
    const id=crypto.randomUUID();
    if(kind==='service')data.services.push({id,name:'New service',price:'Custom quote',description:'Add package details here.'});
    if(kind==='gallery')data.gallery.push({id,title:'New image',category:'Weddings',image:'',video:''});
    if(kind==='review')data.reviews.push({id,name:'New customer',text:'Add testimonial text.',rating:5,source:'Google',approved:true});
    if(kind==='faq')data.faqs.push({id,question:'New frequently asked question?',answer:'Add the answer here.'});
    save(`${kind} added`);({service:renderServices,gallery:renderGallery,review:renderReviews,faq:renderFaqs}[kind])();renderStats();
  }

  $$('.side-tab').forEach(btn=>btn.onclick=()=>{$$('.side-tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');$$('.tab-panel').forEach(x=>x.classList.remove('active'));$('#tab-'+btn.dataset.tab).classList.add('active')});
  $('#addService').onclick=()=>add('service');$('#addGallery').onclick=()=>add('gallery');$('#addReview').onclick=()=>add('review');$('#addFaq').onclick=()=>add('faq');$('#saveTop').onclick=()=>save('All changes saved');
  $('#resetBtn').onclick=()=>{if(confirm('Reset all photography content to defaults?')){data=structuredClone(defaults);save('Defaults restored');location.reload()}};
  $('#exportBtn').onclick=()=>{const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='photography-template-settings.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)};
  $('#importInput').onchange=()=>{const file=$('#importInput').files?.[0];if(!file)return;const r=new FileReader();r.onload=()=>{try{const imported=JSON.parse(r.result);data=imported;save('Settings imported');location.reload()}catch{toast('Invalid JSON file')}};r.readAsText(file)};

  renderStats();syncSimpleFields();renderServices();renderGallery();renderReviews();renderFaqs();
})();
