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
window.SiteCraftPack={extract,loadZip,toBlob,sanitize};

})();
