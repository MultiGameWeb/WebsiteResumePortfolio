(()=>{'use strict';
const root=document.querySelector('#customerSite');
const params=new URLSearchParams(location.search);
const id=params.get('template')||'ecommerce-03';
const template=(window.SITECRAFT_TEMPLATES||[]).find(x=>x.id===id);
const dataKey='sitecraft:'+id;
let moduleRef,manifest,styleLink,selected=[];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function readData(){
  try{const x=JSON.parse(localStorage.getItem(dataKey)||'null');if(x&&typeof x==='object'&&!Array.isArray(x))return x}catch{}
  const stored=window.Store?.read?.()||{};
  if(stored.templateId===id&&stored.data&&typeof stored.data==='object')return structuredClone(stored.data);
  return structuredClone(manifest?.demoData||{});
}
function readFeatures(){
  const stored=window.Store?.read?.()||{};
  return stored.templateId===id&&Array.isArray(stored.selectedFeatures)
    ? stored.selectedFeatures.filter(x=>(manifest.features||[]).some(f=>f.id===x))
    : (manifest.features||[]).map(f=>f.id);
}
async function showError(message){
  root.innerHTML='<section class="customer-load-error"><h1>Website could not be loaded</h1><p>'+esc(message)+'</p></section>';
}
async function render(){
  try{
    const data=readData();
    selected=readFeatures();
    const html=moduleRef.render(data,selected);
    root.innerHTML=html;
    moduleRef.init?.(root,data,selected);
    const title=data.brand?.businessName||manifest.name||'Customer Website';
    document.title=title;
  }catch(error){
    showError('Please refresh the page. '+String(error?.message||error));
  }
}
async function boot(){
  if(!template){showError('The requested template was not found.');return}
  try{
    const base=new URL('.',location.href);
    const [m,mod]=await Promise.all([
      fetch(new URL(template.manifest,base),{cache:'no-cache'}).then(r=>{if(!r.ok)throw Error('Template details unavailable');return r.json()}),
      import(new URL(template.module,base).href)
    ]);
    manifest=m;moduleRef=mod;
    styleLink=document.createElement('link');styleLink.rel='stylesheet';styleLink.href=new URL(template.style,base).href;document.head.appendChild(styleLink);
    await render();
  }catch(error){showError(String(error?.message||error))}
}
window.addEventListener('storage',event=>{
  if(event.key===dataKey||event.key==='sitecraft_builder_state_v2')render();
});
window.addEventListener('sitecraft:site-updated',render);
boot();
})();