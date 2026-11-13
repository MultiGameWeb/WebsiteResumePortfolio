/* SiteCraft PDF export: turns a rendered HTML element into a real PDF file in the browser.
 * Each page is an exact picture of the element (made with vendor/html-to-image.min.js), with an
 * invisible text layer on top so the text can be selected, copied and searched, and with clickable links.
 * No server and no third-party CDN. Used by the Document Editor and PDF Tools (HTML to PDF). */
(function(){
"use strict";
function loadScript(src,globalName){return new Promise(function(resolve,reject){if(window[globalName])return resolve(window[globalName]);var s=document.createElement("script");s.src=src;s.async=true;s.onload=function(){window[globalName]?resolve(window[globalName]):reject(new Error("Could not start "+src))};s.onerror=function(){reject(new Error("Could not load "+src))};document.head.appendChild(s)})}
function withTimeout(p,ms){return new Promise(function(resolve,reject){var t=setTimeout(function(){reject(new Error("Timed out"))},ms);p.then(function(v){clearTimeout(t);resolve(v)},function(e){clearTimeout(t);reject(e)})})}
var HELV=[278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];function helvWidth(s){var w=0;for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);w+=c>=32&&c<=126?HELV[c-32]:556}return w/1000}
function latin1Bytes(s){var u=new Uint8Array(s.length);for(var i=0;i<s.length;i++)u[i]=s.charCodeAt(i)&255;return u}
function pdfText(str){
 var map={8212:151,8211:150,8226:149,8216:145,8217:146,8220:147,8221:148,8230:133,8364:128},out="";
 for(var i=0;i<str.length;i++){var c=str.charCodeAt(i),b=c<128?c:(map[c]||(c>=160&&c<=255?c:-1));if(b<0)continue;if(b===40||b===41||b===92)out+="\\"+String.fromCharCode(b);else if(b<32||b>126)out+="\\"+("00"+b.toString(8)).slice(-3);else out+=String.fromCharCode(b)}
 return out;
}
function dataUrlBytes(u){var b=atob(u.split(",")[1]),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
/* pages: [{jpeg:Uint8Array, iw, ih, texts:[{str,size,tz,x,y}], links:[{url,x1,y1,x2,y2}]}], sizes in PDF points. */
function buildPdf(pages,wPt,hPt,title){
 var objs=[],n=function(){objs.push(null);return objs.length};
 var catalog=n(),pagesId=n(),font=n(),info=n(),pageIds=[];
 pages.forEach(function(pg){
  var pageId=n(),contentId=n(),imgId=n(),annIds=pg.links.map(function(){return n()});pageIds.push(pageId);
  var c="q "+wPt.toFixed(2)+" 0 0 "+hPt.toFixed(2)+" 0 0 cm /Im0 Do Q\nBT 3 Tr\n";
  pg.texts.forEach(function(t){c+="/F1 "+t.size.toFixed(2)+" Tf "+t.tz.toFixed(1)+" Tz 1 0 0 1 "+t.x.toFixed(2)+" "+t.y.toFixed(2)+" Tm ("+pdfText(t.str)+") Tj\n"});
  c+="ET";
  objs[contentId-1]={dict:"<< /Length "+c.length+" >>",stream:latin1Bytes(c)};
  objs[imgId-1]={dict:"<< /Type /XObject /Subtype /Image /Width "+pg.iw+" /Height "+pg.ih+" /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length "+pg.jpeg.length+" >>",stream:pg.jpeg};
  pg.links.forEach(function(l,i){objs[annIds[i]-1]={dict:"<< /Type /Annot /Subtype /Link /Rect ["+[l.x1,l.y1,l.x2,l.y2].map(function(v){return v.toFixed(2)}).join(" ")+"] /Border [0 0 0] /A << /S /URI /URI ("+pdfText(l.url)+") >> >>"}});
  objs[pageId-1]={dict:"<< /Type /Page /Parent "+pagesId+" 0 R /MediaBox [0 0 "+wPt.toFixed(2)+" "+hPt.toFixed(2)+"] /Resources << /Font << /F1 "+font+" 0 R >> /XObject << /Im0 "+imgId+" 0 R >> >> /Contents "+contentId+" 0 R"+(annIds.length?" /Annots ["+annIds.map(function(a){return a+" 0 R"}).join(" ")+"]":"")+" >>"};
 });
 objs[catalog-1]={dict:"<< /Type /Catalog /Pages "+pagesId+" 0 R >>"};
 objs[pagesId-1]={dict:"<< /Type /Pages /Kids ["+pageIds.map(function(p){return p+" 0 R"}).join(" ")+"] /Count "+pageIds.length+" >>"};
 objs[font-1]={dict:"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"};
 objs[info-1]={dict:"<< /Title ("+pdfText(title||"Document")+") /Producer (SiteCraft) >>"};
 var chunks=[],len=0,offsets=[];function add(x){var b=typeof x==="string"?latin1Bytes(x):x;chunks.push(b);len+=b.length}
 add("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n");
 objs.forEach(function(o,i){offsets.push(len);add((i+1)+" 0 obj\n"+o.dict+"\n");if(o.stream){add("stream\n");add(o.stream);add("\nendstream\n")}add("endobj\n")});
 var xref=len,x="xref\n0 "+(objs.length+1)+"\n0000000000 65535 f \n";offsets.forEach(function(o){x+=("0000000000"+o).slice(-10)+" 00000 n \n"});
 add(x+"trailer\n<< /Size "+(objs.length+1)+" /Root "+catalog+" 0 R /Info "+info+" 0 R >>\nstartxref\n"+xref+"\n%%EOF");
 return new Blob(chunks,{type:"application/pdf"});
}
/* Words and links inside root, in CSS pixels from root's top-left. */
function collectWords(root){
 var base=root.getBoundingClientRect(),words=[],links=[],doc=root.ownerDocument,win=doc.defaultView||window,walker=doc.createTreeWalker(root,NodeFilter.SHOW_TEXT,null),node;
 while((node=walker.nextNode())){
  var el=node.parentElement;if(!el||!node.nodeValue.trim())continue;var cs=win.getComputedStyle(el);if(cs.visibility==="hidden"||cs.display==="none"||el.closest("[data-editor-ui],script,style,noscript"))continue;
  var size=parseFloat(cs.fontSize)||12,re=/\S+/g,m,txt=cs.textTransform==="uppercase"?node.nodeValue.toUpperCase():node.nodeValue;
  while((m=re.exec(node.nodeValue))){var r=doc.createRange();r.setStart(node,m.index);r.setEnd(node,m.index+m[0].length);var b=r.getBoundingClientRect();if(!b.width)continue;
   words.push({str:txt.substr(m.index,m[0].length),size:size,left:b.left-base.left,top:b.top-base.top,bottom:b.bottom-base.top,width:b.width,height:b.height})}
 }
 Array.prototype.forEach.call(root.querySelectorAll("a[href]"),function(a){var href=a.getAttribute("href")||"";if(!/^(https?:|mailto:|tel:)/i.test(href))return;Array.prototype.forEach.call(a.getClientRects(),function(b){links.push({url:href,left:b.left-base.left,top:b.top-base.top,right:b.right-base.left,bottom:b.bottom-base.top})})});
 return{words:words,links:links};
}
/* Choose where pages end: at the top of a block (paragraph, heading, list item, table row...) when one is close,
 * so lines are not cut in half. Returns content y positions [start, b1, b2, ..., end]. */
function pageBreaks(root,contentTop,contentEnd,usable){
 var base=root.getBoundingClientRect().top,cand=[];
 Array.prototype.forEach.call(root.querySelectorAll("p,h1,h2,h3,h4,h5,h6,li,tr,blockquote,pre,hr,img,figure,table,div,section,article,header,footer"),function(el){var r=el.getBoundingClientRect();if(r.height>0)cand.push(Math.round(r.top-base))});
 cand=cand.filter(function(v,i,a){return v>contentTop&&a.indexOf(v)===i}).sort(function(a,b){return a-b});
 var breaks=[contentTop],y=contentTop,guard=0;
 while(contentEnd-y>usable+1&&guard++<500){var limit=y+usable,best=-1;for(var i=0;i<cand.length;i++){if(cand[i]>limit)break;if(cand[i]>y+usable*.35)best=cand[i]}y=best>0?best:limit;breaks.push(y)}
 breaks.push(Math.max(y+1,contentEnd));return breaks;
}
/* root must be in the document, laid out at the paper width (pageW CSS px) with margin px of padding. */
function capture(root,opts){
 var pageW=opts.pageW,pageH=opts.pageH,margin=opts.margin||0,bg=opts.background||"#ffffff",maxPages=opts.maxPages||40,ratio=opts.pixelRatio||2,k=.75,wPt=pageW*k,hPt=pageH*k;
 return withTimeout(loadScript(opts.libSrc||"vendor/html-to-image.min.js","htmlToImage"),15000).then(function(lib){
  var fullH=Math.max(pageH,Math.ceil(root.scrollHeight)),contentEnd=Math.max(margin+1,fullH-margin),usable=Math.max(50,pageH-margin*2);
  var breaks=pageBreaks(root,margin,contentEnd,usable);if(breaks.length-1>maxPages)throw new Error("This document is longer than "+maxPages+" pages.");
  var info=collectWords(root),pages=[],filter=function(n){return !(n.nodeType===1&&n.hasAttribute&&n.hasAttribute("data-editor-ui"))};
  // Each page is rendered on its own (the content is shifted up), so long documents never hit the browser's canvas size limit.
  return withTimeout(lib.getFontEmbedCSS(root,{filter:filter}),20000).catch(function(){return ""}).then(function(fontCss){
   return breaks.slice(0,-1).reduce(function(chain,_,p){return chain.then(function(){
    var y0=p===0?0:breaks[p],y1=breaks[p+1],dest=p===0?0:margin,hSrc=Math.max(1,Math.ceil(Math.min(y1,fullH)-y0));
    var o={pixelRatio:ratio,backgroundColor:bg,width:Math.round(pageW),height:hSrc,cacheBust:false,filter:filter,style:{transform:"translateY("+(-y0)+"px)",transformOrigin:"0 0",margin:"0",zoom:"1",boxShadow:"none"}};
    if(fontCss)o.fontEmbedCSS=fontCss;else o.skipFonts=true;
    return withTimeout(lib.toCanvas(root,o),45000).catch(function(){return withTimeout(lib.toCanvas(root,Object.assign({},o,{skipFonts:true,fontEmbedCSS:undefined})),45000)}).then(function(part){
     var sc=part.width/pageW,cv=document.createElement("canvas");cv.width=Math.round(pageW*sc);cv.height=Math.round(pageH*sc);
     var ctx=cv.getContext("2d");ctx.fillStyle=bg;ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(part,0,0,part.width,Math.min(part.height,Math.round(hSrc*sc)),0,Math.round(dest*sc),cv.width,Math.min(part.height,Math.round(hSrc*sc)));part.width=part.height=1;
     if(opts.border){var bw=Math.max(1,opts.border.width*sc),ins=(opts.border.inset||0)*sc+bw/2;ctx.strokeStyle=opts.border.color||"#17181d";ctx.lineWidth=bw;ctx.strokeRect(ins,ins,cv.width-ins*2,cv.height-ins*2)}
     var shift=dest-y0,texts=[],links=[];
     info.words.forEach(function(w){var mid=(w.top+w.bottom)/2;if(mid<y0||mid>=y1)return;var fs=w.size*k,natural=helvWidth(w.str)*fs,tz=Math.max(40,Math.min(250,(w.width*k)/Math.max(1,natural)*100));texts.push({str:w.str+" ",size:fs,tz:tz,x:w.left*k,y:hPt-((w.bottom+shift)-w.height*.22)*k})});
     info.links.forEach(function(l){var mid=(l.top+l.bottom)/2;if(mid<y0||mid>=y1)return;links.push({url:l.url,x1:l.left*k,y1:hPt-(l.bottom+shift)*k,x2:l.right*k,y2:hPt-(l.top+shift)*k})});
     pages.push({jpeg:dataUrlBytes(cv.toDataURL("image/jpeg",.92)),iw:cv.width,ih:cv.height,texts:texts,links:links});
     if(opts.onProgress)opts.onProgress(p+1,breaks.length-1);
    });
   })},Promise.resolve());
  }).then(function(){
   return buildPdf(pages,wPt,hPt,opts.title);
  });
 });
}
window.SiteCraftPdf={loadScript:loadScript,buildPdf:buildPdf,collectWords:collectWords,capture:capture};
})();
