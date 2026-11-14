/* SiteCraft PDF compressor: makes PDFs smaller in the browser. No server and no third-party CDN.
 * 1) Pictures inside the PDF are made smaller (fewer pixels, JPEG quality) while text, lines and fonts stay
 *    exactly as they are, so text stays sharp and selectable.
 * 2) Objects nothing points to (old edits, unused copies) are removed.
 * 3) If a target size is still not reached, the pages can be redrawn as pictures with invisible text on top
 *    (the text can still be selected and searched) — this is the strongest option.
 * Needs PDFLib (vendor/pdf-lib.min.js). The picture fallback needs pdf.js and core/pdf-export.js. */
(function(){
"use strict";
var L=function(){return window.PDFLib};
function isName(v){return v instanceof L().PDFName}
function isRef(v){return v instanceof L().PDFRef}
function isArr(v){return v instanceof L().PDFArray}
function isDict(v){return v instanceof L().PDFDict}
function isStream(v){return v instanceof L().PDFStream}
function nm(v){return isName(v)?v.asString().replace(/^\//,""):null}
function num(v){return v instanceof L().PDFNumber?v.asNumber():null}
function look(ctx,v){return isRef(v)?ctx.lookup(v):v}

/* How many colour parts (1 grey, 3 RGB) a colour space has, or 0 if we do not handle it. */
function colorParts(ctx,cs){
 cs=look(ctx,cs);
 if(isName(cs)){var n=nm(cs);return n==="DeviceRGB"||n==="CalRGB"?3:n==="DeviceGray"||n==="CalGray"?1:0}
 if(isArr(cs)&&cs.size()){
  var kind=nm(look(ctx,cs.get(0)));
  if(kind==="ICCBased"){var s=look(ctx,cs.get(1)),N=s&&s.dict?num(s.dict.get(L().PDFName.of("N"))):null;return N===1||N===3?N:0}
  if(kind==="CalRGB")return 3;if(kind==="CalGray")return 1;
 }
 return 0;
}
/* Indexed colour space: [/Indexed base hival lookup] -> {parts, palette:Uint8Array} */
function indexedInfo(ctx,cs){
 cs=look(ctx,cs);if(!isArr(cs)||cs.size()<4||nm(look(ctx,cs.get(0)))!=="Indexed")return null;
 var parts=colorParts(ctx,cs.get(1));if(!parts)return null;
 var lk=look(ctx,cs.get(3)),pal=null;
 if(isStream(lk)){try{pal=L().decodePDFRawStream(lk).decode()}catch(e){return null}}
 else if(lk&&typeof lk.asBytes==="function")pal=lk.asBytes();
 else if(lk&&typeof lk.decodeText==="function"){var t=lk.decodeText();pal=new Uint8Array(t.length);for(var i=0;i<t.length;i++)pal[i]=t.charCodeAt(i)&255}
 return pal?{parts:parts,palette:pal}:null;
}
function filters(dict,ctx){var f=look(ctx,dict.get(L().PDFName.of("Filter")));if(!f)return[];if(isName(f))return[nm(f)];if(isArr(f)){var a=[];for(var i=0;i<f.size();i++)a.push(nm(look(ctx,f.get(i))));return a}return["?"]}
function parmsOf(dict,ctx,at){var p=look(ctx,dict.get(L().PDFName.of("DecodeParms")));if(isArr(p))p=look(ctx,p.get(at||0));return isDict(p)?p:null}
var TEXT_FILTERS={ASCII85Decode:1,ASCIIHexDecode:1,A85:1,AHx:1};
/* Bytes of a stream with only its first `keep` filters undone (e.g. ASCII85 around a JPEG). */
function partlyDecoded(ctx,obj,fl,keep){
 if(!keep)return obj.contents;
 var d=ctx.obj({}),P=L().PDFName;d.set(P.of("Filter"),keep===1?P.of(fl[0]):ctx.obj(fl.slice(0,keep)));
 return L().decodePDFRawStream(L().PDFRawStream.of(d,obj.contents)).decode();
}

/* Undo PNG row filters (FlateDecode /Predictor 10–15). */
function unPredict(data,colors,bpc,columns,predictor){
 if(!predictor||predictor<10)return predictor===2?null:data;
 var bpp=Math.max(1,Math.ceil(colors*bpc/8)),row=Math.ceil(colors*bpc*columns/8),rows=Math.floor(data.length/(row+1)),out=new Uint8Array(rows*row),prev=new Uint8Array(row);
 for(var r=0;r<rows;r++){
  var type=data[r*(row+1)],src=r*(row+1)+1,o=r*row;
  for(var i=0;i<row;i++){
   var x=data[src+i],a=i>=bpp?out[o+i-bpp]:0,b=prev[i],c=i>=bpp?prev[i-bpp]:0,v;
   if(type===0)v=x;else if(type===1)v=x+a;else if(type===2)v=x+b;else if(type===3)v=x+((a+b)>>1);
   else if(type===4){var p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);v=x+(pa<=pb&&pa<=pc?a:pb<=pc?b:c)}else v=x;
   out[o+i]=v&255;
  }
  prev=out.subarray(o,o+row);
 }
 return out;
}

/* Every image in the PDF we can safely re-encode, with how to get its pixels. */
function findImages(doc){
 var ctx=doc.context,list=[];
 ctx.enumerateIndirectObjects().forEach(function(pair){
  var ref=pair[0],obj=pair[1];
  if(!isStream(obj)||!obj.dict)return;
  var d=obj.dict,P=function(k){return look(ctx,d.get(L().PDFName.of(k)))};
  if(nm(P("Subtype"))!=="Image")return;
  var im=P("ImageMask");if(im&&im.asBoolean&&im.asBoolean())return;
  if(P("Decode"))return;
  if(isArr(P("Mask")))return; // colour-key masks would change with JPEG colours
  var W=num(P("Width")),H=num(P("Height")),bpc=num(P("BitsPerComponent")),f=filters(d,ctx),size=obj.contents?obj.contents.length:0;
  if(!W||!H||W*H<64*64)return;
  var cs=P("ColorSpace"),parts=colorParts(ctx,cs),idx=parts?null:indexedInfo(ctx,cs);
  var item={ref:ref,obj:obj,ctx:ctx,w:W,h:H,size:size};
  var last=f[f.length-1],pre=f.slice(0,-1);
  if(!pre.every(function(x){return TEXT_FILTERS[x]}))return;
  item.filters=f;item.pre=pre.length;
  if(last==="DCTDecode"){if(parts!==1&&parts!==3)return;item.kind="jpeg";}
  else if(last==="FlateDecode"||last==="Fl"){
   if(parts&&bpc===8){item.kind="raw";item.parts=parts}
   else if(idx&&(bpc===8||bpc===4||bpc===2||bpc===1)){item.kind="indexed";item.idx=idx;item.bpc=bpc}
   else return;
   var pr=parmsOf(d,ctx,f.length-1);item.predictor=pr?num(pr.get(L().PDFName.of("Predictor")))||1:1;
   if(item.predictor===2)return;
  }else return;
  list.push(item);
 });
 return list;
}
/* Pixels of one image as an ImageBitmap/canvas (white behind; the PDF's own soft mask is kept). */
async function decodeImage(item){
 if(item.kind==="jpeg"){
  var blob=new Blob([partlyDecoded(item.ctx,item.obj,item.filters,item.pre)],{type:"image/jpeg"});
  return await createImageBitmap(blob);
 }
 var raw=L().decodePDFRawStream(item.obj).decode(),w=item.w,h=item.h,out=new ImageData(w,h),px=out.data;
 if(item.kind==="raw"){
  var data=unPredict(raw,item.parts,8,w,item.predictor);if(!data||data.length<w*h*item.parts)throw new Error("short");
  for(var i=0,j=0;i<w*h;i++){if(item.parts===3){px[j]=data[i*3];px[j+1]=data[i*3+1];px[j+2]=data[i*3+2]}else{px[j]=px[j+1]=px[j+2]=data[i]}px[j+3]=255;j+=4}
 }else{
  var bpc=item.bpc,data2=unPredict(raw,1,bpc,w,item.predictor),pal=item.idx.palette,np=item.idx.parts,rowBytes=Math.ceil(w*bpc/8);if(!data2||data2.length<rowBytes*h)throw new Error("short");
  for(var y=0,k=0;y<h;y++)for(var x=0;x<w;x++){
   var bit=x*bpc,b=data2[y*rowBytes+(bit>>3)],v=bpc===8?b:(b>>(8-bpc-(bit&7)))&((1<<bpc)-1),o=v*np;
   if(np===3){px[k]=pal[o]||0;px[k+1]=pal[o+1]||0;px[k+2]=pal[o+2]||0}else{px[k]=px[k+1]=px[k+2]=pal[o]||0}px[k+3]=255;k+=4;
  }
 }
 var c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").putImageData(out,0,0);return c;
}
function toJpeg(src,w,h,quality){
 var c=document.createElement("canvas");c.width=w;c.height=h;var g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,w,h);g.imageSmoothingEnabled=true;g.imageSmoothingQuality="high";g.drawImage(src,0,0,w,h);
 return new Promise(function(resolve,reject){c.toBlob(function(b){if(!b)return reject(new Error("JPEG"));b.arrayBuffer().then(function(a){c.width=c.height=1;resolve(new Uint8Array(a))},reject)},"image/jpeg",quality)});
}

/* Remove objects nothing points to (left over from earlier edits). */
function dropUnused(doc){
 var ctx=doc.context,seen=new Set(),stack=[];
 var t=ctx.trailerInfo||{};["Root","Info","Encrypt"].forEach(function(k){if(t[k])stack.push(t[k])});
 while(stack.length){
  var v=stack.pop();
  if(isRef(v)){var key=v.toString();if(seen.has(key))continue;seen.add(key);var o=ctx.lookup(v);if(o)stack.push(o);continue}
  if(isDict(v)){v.values().forEach(function(x){stack.push(x)});continue}
  if(isStream(v)&&v.dict){stack.push(v.dict);continue}
  if(isArr(v)){for(var i=0;i<v.size();i++)stack.push(v.get(i))}
 }
 var removed=0;ctx.enumerateIndirectObjects().forEach(function(p){if(!seen.has(p[0].toString())){ctx.delete(p[0]);removed++}});
 return removed;
}

/* The longest page side in points, to know the most pixels a picture can usefully have. */
function maxPageSide(doc){var m=0;doc.getPages().forEach(function(p){var s=p.getSize();m=Math.max(m,s.width,s.height)});return m||842}

/* Prepare once: load the PDF and decode its pictures (kept for every quality try). */
async function prepare(bytes,onProgress){
 var doc=await L().PDFDocument.load(bytes,{updateMetadata:false}),imgs=findImages(doc),decoded=[];
 for(var i=0;i<imgs.length;i++){
  if(onProgress)onProgress(i+1,imgs.length);
  try{decoded.push({item:imgs[i],src:await decodeImage(imgs[i])})}catch(e){/* keep this picture as it is */}
 }
 return {bytes:bytes,pageSide:maxPageSide(doc),images:decoded,imageBytes:decoded.reduce(function(s,d){return s+d.item.size},0)};
}
/* One try at a given sharpness (dots per inch) and JPEG quality. Returns the new PDF bytes. */
async function compressAt(prep,dpi,quality,onProgress){
 var doc=await L().PDFDocument.load(prep.bytes,{updateMetadata:false}),ctx=doc.context,maxSide=Math.round(prep.pageSide/72*dpi),changed=0;
 for(var i=0;i<prep.images.length;i++){
  var d=prep.images[i],it=d.item;if(onProgress)onProgress(i+1,prep.images.length);
  var f=Math.min(1,maxSide/Math.max(it.w,it.h)),w=Math.max(1,Math.round(it.w*f)),h=Math.max(1,Math.round(it.h*f));
  var jpeg=await toJpeg(d.src,w,h,quality);
  if(jpeg.length>=it.size*0.92)continue; // not worth it: keep the original picture
  var old=it.obj.dict,nd=ctx.obj({Type:"XObject",Subtype:"Image",Width:w,Height:h,ColorSpace:"DeviceRGB",BitsPerComponent:8,Filter:"DCTDecode"});
  ["SMask","Mask","Intent","Interpolate","OC","Metadata","Name"].forEach(function(k){var v=old.get(L().PDFName.of(k));if(v)nd.set(L().PDFName.of(k),v)});
  ctx.assign(it.ref,L().PDFRawStream.of(nd,jpeg));changed++;
 }
 dropUnused(doc);
 var out=await doc.save({useObjectStreams:true,addDefaultPage:false,updateFieldAppearances:false});
 return {bytes:out,changed:changed};
}

/* Strongest option: every page becomes a picture, with invisible text on top so it can still be selected. */
async function rasterize(bytes,pdfjs,dpi,quality,onProgress){
 var SP=window.SiteCraftPdf;if(!SP)throw new Error("LIB:pdf-export");
 var pdf=await pdfjs.getDocument({data:new Uint8Array(bytes.slice(0))}).promise,pages=[];
 try{
  for(var n=1;n<=pdf.numPages;n++){
   if(onProgress)onProgress(n,pdf.numPages);
   var page=await pdf.getPage(n),vp1=page.getViewport({scale:1}),scale=Math.min(dpi/72,Math.sqrt(12e6/(vp1.width*vp1.height))),vp=page.getViewport({scale:scale});
   var c=document.createElement("canvas");c.width=Math.max(1,Math.round(vp.width));c.height=Math.max(1,Math.round(vp.height));var g=c.getContext("2d");g.fillStyle="#fff";g.fillRect(0,0,c.width,c.height);
   await page.render({canvasContext:g,viewport:vp}).promise;
   var jpeg=await new Promise(function(res,rej){c.toBlob(function(b){b?b.arrayBuffer().then(function(a){res(new Uint8Array(a))},rej):rej(new Error("JPEG"))},"image/jpeg",quality)});
   var texts=[],tc=await page.getTextContent();
   tc.items.forEach(function(t){
    if(!t.str||!t.str.trim())return;
    var tr=pdfjs.Util.transform(vp1.transform,t.transform),size=Math.hypot(tr[2],tr[3]);if(!size)return;
    // viewport space is top-down; PDF space is bottom-up. Any text direction is kept (rotated pages too).
    var m=[tr[0]/size,-tr[1]/size,tr[2]/size,-tr[3]/size],natural=SP.helvWidth(t.str)*size,want=t.width||0;
    texts.push({str:t.str+(t.hasEOL?"":" "),size:size,tz:natural>0&&want>0?Math.max(40,Math.min(250,want/natural*100)):100,x:tr[4],y:vp1.height-tr[5],m:m});
   });
   pages.push({jpeg:jpeg,iw:c.width,ih:c.height,texts:texts,links:[],w:vp1.width,h:vp1.height});
   c.width=c.height=1;page.cleanup();
  }
 }finally{pdf.destroy()}
 var blob=SP.buildPdf(pages,pages[0].w,pages[0].h,"Compressed PDF");
 return new Uint8Array(await blob.arrayBuffer());
}

/* Ladders from gentle to strong. */
var IMAGE_STEPS=[[220,.85],[170,.78],[150,.7],[130,.62],[110,.55],[96,.48],[84,.42],[72,.36],[62,.3],[52,.25],[44,.2]];
var RASTER_STEPS=[[150,.7],[120,.6],[100,.5],[84,.42],[72,.35],[60,.28],[50,.22],[40,.18]];
var LEVELS={light:[200,.82],recommended:[150,.7],strong:[100,.5],extreme:[72,.36]};

window.SiteCraftCompress={prepare:prepare,compressAt:compressAt,rasterize:rasterize,dropUnused:dropUnused,findImages:findImages,IMAGE_STEPS:IMAGE_STEPS,RASTER_STEPS:RASTER_STEPS,LEVELS:LEVELS};
})();
