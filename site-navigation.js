(function(){
"use strict";
if(document.getElementById("sitecraftGlobalNav"))return;
const pathParts=location.pathname.split("/").filter(Boolean);
const lastPart=pathParts[pathParts.length-1]||"index.html";
const leaf=(lastPart.indexOf(".")===-1?"index.html":lastPart).toLowerCase();
const isHome=leaf==="index.html";
const menuItems=[["Home","index.html","home"],["Templates","templates.html","templates"],["Portfolio Creator","portfolio-creator.html","portfolio"],["Resume Builder","resume-builder.html","resume"],["PDF Tools","pdf-tools.html","pdf"],["Document Editor","document-editor.html","document"],["Presentation Maker","presentation-maker.html","presentation"],["Committee Book","committee-book.html","committee"],["How it works","index.html#how-it-works","how"]];
const committeePages=new Set(["committee-book.html","my-chits.html","auction-chit-manager.html","fixed-discount-chit-manager.html","fixed-rotation-bc-chit-manager.html","lottery-kuri-chit-manager.html"]);
const templateFlow=new Set(["templates.html","features.html","builder.html","checkout.html","success.html","admin.html","ai-builder.html","ai-websites.html"]);
const currentKey=isHome?"home":committeePages.has(leaf)?"committee":templateFlow.has(leaf)?"templates":({"portfolio-creator.html":"portfolio","resume-builder.html":"resume","pdf-tools.html":"pdf","document-editor.html":"document","presentation-maker.html":"presentation"})[leaf]||"";
const nav=document.createElement("header");
nav.id="sitecraftGlobalNav";nav.setAttribute("aria-label","SiteCraft site navigation");
nav.innerHTML='<div class="sc-nav-inner"><a class="sc-brand" href="index.html" aria-label="SiteCraft home"><span class="sc-brand-mark" aria-hidden="true">✦</span><span>SiteCraft</span></a><div class="sc-actions">'+(isHome?"":'<button class="sc-action sc-back" type="button" aria-label="Go back to the previous page">← Back</button><a class="sc-action sc-home" href="index.html" aria-label="Go to Home"><svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></svg><span>Home</span></a>')+'</div><button type="button" class="sc-menu-toggle" aria-label="Open site menu" aria-controls="scSiteMenu" aria-expanded="false"><span aria-hidden="true">☰</span></button><nav class="sc-menu" id="scSiteMenu" aria-label="Main menu"></nav></div>';
const navMenu=nav.querySelector("#scSiteMenu");
menuItems.forEach(item=>{const a=document.createElement("a");a.href=item[1];a.textContent=item[0];a.dataset.menuKey=item[2];if(item[2]===currentKey)a.setAttribute("aria-current","page");navMenu.appendChild(a)});
document.body.insertBefore(nav,document.body.firstChild);
const toggle=nav.querySelector(".sc-menu-toggle");
toggle.addEventListener("click",function(){const open=toggle.getAttribute("aria-expanded")!=="true";toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Close site menu":"Open site menu");toggle.firstElementChild.textContent=open?"×":"☰";navMenu.classList.toggle("sc-open",open)});
document.addEventListener("click",function(e){if(!nav.contains(e.target)){navMenu.classList.remove("sc-open");toggle.setAttribute("aria-expanded","false");toggle.setAttribute("aria-label","Open site menu");toggle.firstElementChild.textContent="☰"}});
function cleanLegacyHeader(header){
 if(!header||header.id==="sitecraftGlobalNav")return;
 const hasBrand=!!header.querySelector("a.logo,a.brand");
 const controls=!!header.querySelector("button,input,select,textarea,form,.top-actions,.topbar-right,.admin-top-actions,.more-wrap,#saveState,#savedStatus,#saveStatus");
 const pageNavs=header.querySelectorAll("nav");
 pageNavs.forEach(n=>{n.classList.add("sc-legacy-site-nav");n.setAttribute("aria-hidden","true")});
 header.querySelectorAll("a").forEach(a=>{
  const label=(a.textContent||"").replace(/\s+/g," ").trim().toLowerCase();
  const cls=(a.className&&String(a.className))||"";
  const href=(a.getAttribute("href")||"").toLowerCase();
  const brand=/\b(logo|brand)\b/i.test(cls)||/^(?:✦\s*)?sitecraft(?:\s|$)/i.test(label)&&href.indexOf("index.html")>=0;
  const back=/\b(back|back-link|back-home)\b/i.test(cls)||/^(?:←|↶)\s*(?:back|home|edit|templates)?/i.test(label)||/back to home|sitecraft home/i.test(label)||href==="javascript:history.back()";
  const oldHome=/^(?:←\s*)?home(?:\s*↗)?$/i.test(label)&&href!=="index.html#how-it-works";
  if(brand||back||oldHome){a.hidden=true;a.setAttribute("aria-hidden","true")}
 });
 header.querySelectorAll(".top-left-nav>a,.topbar-left>a,.topbar-left>nav").forEach(a=>{a.hidden=true;a.setAttribute("aria-hidden","true")});
 if(hasBrand&&pageNavs.length&&!controls){header.classList.add("sc-legacy-site-nav");header.setAttribute("aria-hidden","true")}
 const meaningful=header.querySelector("h1,h2,h3,strong,[id='templateName'],[id='templateCategory'],.top-actions,.admin-top-actions,.topbar-right,.more-wrap,#saveStatus,#savedStatus,#saveState,button,input,select,form");
 const visibleLinks=[...header.querySelectorAll("a")].some(a=>!a.hidden);
 if(hasBrand&&!controls&&!pageNavs.length&&!meaningful&&!visibleLinks){header.classList.add("sc-legacy-site-nav");header.setAttribute("aria-hidden","true")}
}
function isNavigationChromeParent(parent){
 return !!parent&&(parent===document.body||parent.matches(".app,.app-shell,#app,.admin-app,#auction-app,#chit-suite-app"));
}
function cleanLegacyNavigation(root){
 const headers=[];
 if(root&&root.matches&&root.matches("header:not(#sitecraftGlobalNav)")&&isNavigationChromeParent(root.parentElement))headers.push(root);
 if(root&&root.querySelectorAll)root.querySelectorAll("header:not(#sitecraftGlobalNav)").forEach(h=>{if(isNavigationChromeParent(h.parentElement))headers.push(h)});
 [...new Set(headers)].forEach(cleanLegacyHeader);
}
cleanLegacyNavigation(document);
document.addEventListener("DOMContentLoaded",function(){cleanLegacyNavigation(document)},{once:true});
if("MutationObserver"in window){
 const legacyObserver=new MutationObserver(records=>{
  records.forEach(record=>record.addedNodes.forEach(node=>{
   if(node.nodeType!==1)return;
   if((node.matches&&node.matches("header:not(#sitecraftGlobalNav)"))||(node.querySelector&&node.querySelector("header:not(#sitecraftGlobalNav)")))cleanLegacyNavigation(node);
  }));
 });
 legacyObserver.observe(document.body,{childList:true,subtree:true});
}
const guardPages=new Set(["document-editor.html","presentation-maker.html","resume-builder.html","portfolio-creator.html","pdf-tools.html","committee-book.html","my-chits.html","auction-chit-manager.html","fixed-discount-chit-manager.html","fixed-rotation-bc-chit-manager.html","lottery-kuri-chit-manager.html"]);
const autoSavePages=new Set(["document-editor.html","presentation-maker.html","resume-builder.html","portfolio-creator.html","my-chits.html"]);
let dirty=false,saveFailed=false,saveTimer=null;
function reportSaved(){dirty=false;saveFailed=false;clearTimeout(saveTimer)}
function reportFailure(){dirty=true;saveFailed=true;clearTimeout(saveTimer)}
function markDirty(){if(!guardPages.has(leaf))return;dirty=true;saveFailed=false;clearTimeout(saveTimer);if(autoSavePages.has(leaf))saveTimer=setTimeout(function(){if(!saveFailed)dirty=false},1700)}
function statusText(){return ["#saveState","#savedStatus","#saveStatus","#saveIndicator"].map(s=>document.querySelector(s)?.textContent||"").join(" ").trim()}
function syncStatus(){const t=statusText();if(/could not save|save failed|storage is unavailable|may not survive reload|export failed|not saved/i.test(t)){reportFailure();return}if(/unsaved changes|saving…|saving\.\.\./i.test(t)){dirty=true;saveFailed=false;return}if(/saved just now|(?:auto-save on)|\bsaved\b|changes synced/i.test(t))reportSaved()}
["#saveState","#savedStatus","#saveStatus","#saveIndicator"].forEach(sel=>{const n=document.querySelector(sel);if(n&&"MutationObserver"in window)new MutationObserver(syncStatus).observe(n,{childList:true,subtree:true,characterData:true})});
if(guardPages.has(leaf)){
 document.addEventListener("input",function(e){if(!nav.contains(e.target))markDirty()},true);
 document.addEventListener("change",function(e){if(!nav.contains(e.target))markDirty()},true);
 document.addEventListener("click",function(e){if(nav.contains(e.target))return;const b=e.target.closest("button,[role=button]");if(!b)return;if(/\b(?:download|export|print|save|back|home|cancel|close|undo|redo|help|preview)\b/i.test((b.textContent||"")+" "+(b.id||"")+" "+(b.dataset.action||"")))return;if(leaf==="portfolio-creator.html"||leaf==="my-chits.html"||leaf==="committee-book.html")markDirty()},true);
}
function wantsLeave(){if(!guardPages.has(leaf)||!dirty)return true;return window.confirm(saveFailed||!autoSavePages.has(leaf)?"Leave this page? Your work may not be saved.":"Leave this page? Your work is saved automatically on this device.")}
nav.querySelector(".sc-back")?.addEventListener("click",function(){if(!wantsLeave())return;let sameOriginReferrer=false;try{sameOriginReferrer=!!document.referrer&&new URL(document.referrer).origin===location.origin}catch(_){}if(history.length>1&&sameOriginReferrer)history.back();else location.href="index.html"});
nav.querySelector(".sc-home")?.addEventListener("click",function(e){if(!wantsLeave())e.preventDefault()});
nav.querySelector(".sc-brand")?.addEventListener("click",function(e){if(!wantsLeave())e.preventDefault()});
navMenu.addEventListener("click",function(e){const a=e.target.closest("a");if(!a)return;const dest=(a.getAttribute("href")||"").split(/[?#]/)[0]||leaf;if(dest.toLowerCase()===leaf&&a.hash==="")return;if(!wantsLeave())e.preventDefault()});
window.addEventListener("beforeunload",function(e){if(!guardPages.has(leaf)||!dirty)return;e.preventDefault();e.returnValue=""});
})();