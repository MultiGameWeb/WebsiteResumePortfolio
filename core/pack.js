(()=>{
const EXT={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif','image/svg+xml':'svg'};
function toBlob(dataUrl){const m=/^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(dataUrl);if(!m)return new Blob([]);const mime=m[1];let bytes;if(m[2]){const bin=atob(m[3]);bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i)}else bytes=new TextEncoder().encode(decodeURIComponent(m[3]));return new Blob([bytes],{type:mime})}
function extract(data,prefix){prefix=prefix||'assets/uploads/';const files=[],seen=new Map();let n=0;
 const walk=v=>{if(typeof v==='string'){if(v.startsWith('data:image/')){if(seen.has(v))return seen.get(v);const m=/^data:([^;,]+)/.exec(v),path=prefix+'img-'+(++n)+'.'+(EXT[m&&m[1]]||'jpg');seen.set(v,path);files.push({path,blob:toBlob(v)});return path}return v}
  if(Array.isArray(v))return v.map(walk);if(v&&typeof v==='object'){const o={};Object.keys(v).forEach(k=>{o[k]=walk(v[k])});return o}return v};
 return {data:walk(data),files}}
async function loadZip(){if(window.JSZip)return window.JSZip;await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});return window.JSZip}
window.SiteCraftPack={extract,loadZip,toBlob};
})();
