(function(){
"use strict";
const root=document.getElementById("auction-app");
const t=k=>((window.AUCTION_CHIT_I18N[state.lang]||window.AUCTION_CHIT_I18N.en)[k]||window.AUCTION_CHIT_I18N.en[k]||k);
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money=p=>t("currency")+((Number(p||0)/100).toLocaleString(state.lang==="te"?"te-IN":"en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}));
const parseMoney=v=>{const n=Number(String(v==null?"":v).replace(/,/g,""));return Number.isFinite(n)?Math.round(n*100):0;};
const iso=d=>d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
const today=()=>iso(new Date());
const dateText=s=>{if(!s)return"—";const d=new Date(s);if(Number.isNaN(d.getTime()))return esc(s);return new Intl.DateTimeFormat(state.lang==="te"?"te-IN":"en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(d);};
const dtText=s=>{if(!s)return"—";const d=new Date(s);if(Number.isNaN(d.getTime()))return"—";return new Intl.DateTimeFormat(state.lang==="te"?"te-IN":"en-IN",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"}).format(d);};
const totalMonths=()=>Math.max(2,Number(state.chit.memberCount)||2);
const baseContribution=()=>Math.floor(state.chit.potPaise/totalMonths());
const activeMembers=()=>state.members.filter(m=>m.status!=="removed");
const mBy=id=>state.members.find(m=>m.id===id);
const cBy=n=>state.cycles.find(c=>c.monthNo===Number(n));
const currentCycle=()=>state.cycles.find(c=>c.status!=="completed")||null;
const currentBids=cycle=>cycle?state.bids.filter(b=>b.cycleNo===cycle.monthNo&&b.status!=="rejected"): [];
const nowISO=()=>new Date().toISOString();
const timeWindow=(monthNo)=>{
 const start=new Date(state.chit.startDate+"T00:00:00");
 start.setMonth(start.getMonth()+Number(monthNo)-1);
 const year=start.getFullYear(),month=start.getMonth();
 const last=new Date(year,month+1,0).getDate();
 const st=Math.min(Math.max(1,state.chit.auctionStartDay),last);
 const en=Math.min(Math.max(st,state.chit.auctionEndDay),last);
 return {start:new Date(year,month,st,0,0,0),end:new Date(year,month,en,23,59,59)};
};
const dueDate=cycle=>{const d=new Date(state.chit.startDate+"T00:00:00");d.setMonth(d.getMonth()+cycle.monthNo-1);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(state.chit.dueDay,last));return d;};
const daysLate=cycle=>Math.max(0,Math.floor((new Date(today()+"T00:00:00")-new Date(iso(dueDate(cycle))+"T00:00:00"))/86400000));
const currentWindow=cycle=>timeWindow(cycle.monthNo);
function floorPrice(monthNo){
 const months=totalMonths(),remaining=Math.max(1,months-Number(monthNo)+1);
 const discountCap=Math.floor(state.chit.potPaise*(Math.max(0,Number(state.chit.maxDiscountPct)||0)/100)*(remaining/months));
 const formulaFloor=state.chit.potPaise-discountCap;
 return Math.min(state.chit.potPaise,Math.max(0,Number(state.chit.startingFloorPaise)||0,formulaFloor));
}
function lowestBid(cycle){
 const bids=currentBids(cycle).filter(b=>b.status==="approved"&&b.amountPaise>=floorPrice(cycle.monthNo)&&b.amountPaise<=state.chit.potPaise&&mBy(b.memberId)&&mBy(b.memberId).status!=="removed"&&!hasWon(b.memberId));
 bids.sort((a,b)=>a.amountPaise-b.amountPaise||new Date(a.createdAt)-new Date(b.createdAt));
 return bids[0]||null;
}
function hasWon(memberId){return state.cycles.some(c=>c.status==="completed"&&c.winnerId===memberId);}
function commissionAmount(){return Math.floor(state.chit.potPaise*(Math.max(0,Number(state.chit.commissionPct)||0)/100));}
function cycleCalc(cycle,bid){
 const prize=cycle.status==="completed"?(cycle.prizePaise||0):(bid?bid.amountPaise:floorPrice(cycle.monthNo));
 const discount=cycle.status==="completed"?(cycle.discountPaise||0):Math.max(0,state.chit.potPaise-prize);
 const commission=cycle.status==="completed"?(cycle.commissionPaise||0):commissionAmount();
 const pool=Math.max(0,discount-commission);
 const roster=activeMembers();
 const rule=cycle.status==="completed"&&cycle.dividendRule?cycle.dividendRule:state.chit.dividendRule;
 const base=cycle.status==="completed"&&cycle.baseContributionPaise!=null?Number(cycle.baseContributionPaise):baseContribution();
 const remoteMember=state.liveWorkspace&&state.role==="member"&&roster.length<Number(state.chit.memberCount);
 const currentWinner=cycle.status==="completed"?cycle.winnerId:(bid?bid.memberId:null);
 const eligible=rule==="allMembers"?roster:roster.filter(m=>m.id!==currentWinner);
 let divisor=eligible.length;
 if(remoteMember)divisor=rule==="allMembers"?Number(cycle.memberCount||state.chit.memberCount):Math.max(0,Number(cycle.memberCount||state.chit.memberCount)-1);
 const per=divisor?Math.floor(pool/divisor):0,leftover=pool-per*divisor;
 const dividends={};eligible.forEach(m=>{if(rule==="allMembers"||m.id!==currentWinner)dividends[m.id]=per;});
 const due={};roster.forEach(m=>due[m.id]=Math.max(0,base-(dividends[m.id]||0)));
 return {prizePaise:prize,discountPaise:discount,commissionPaise:commission,dividendPoolPaise:pool,dividendPerHeadPaise:per,eligibleIds:remoteMember?Array.from({length:divisor},(_,i)=>"recipient-"+i):eligible.map(m=>m.id),dividends:dividends,due:due,leftoverPaise:leftover,monthlyCollectionPaise:base*Number(state.chit.memberCount)};
}
function cycleName(c){const d=new Date((c.periodStartDate||(()=>{const x=new Date(state.chit.startDate+"T00:00:00");x.setMonth(x.getMonth()+c.monthNo-1);return iso(x);})())+"T00:00:00");return new Intl.DateTimeFormat(state.lang==="te"?"te-IN":"en-IN",{month:"short",year:"numeric"}).format(d);}
function blankState(){
 const chit={name:"",potPaise:0,memberCount:2,startingFloorPaise:0,maxDiscountPct:0,commissionPct:0,dividendRule:"allMembers",startDate:today(),auctionStartDay:1,auctionEndDay:10,dueDay:10,lateFinePerDayPaise:0,upiId:""};
 const rulesHtml="<h3>Chit and auction rules</h3><ul><li>Only active, eligible members who have not received a prize may submit bids for a new auction cycle.</li><li>Each valid bid must be at or above the calculated floor price and no higher than the total chit pot.</li><li>The lowest approved valid bid wins. If bid values tie, the earliest submitted bid wins.</li><li>Foreman commission is calculated from the pot. The remaining eligible discount amount is distributed as dividend using the selected rule.</li><li>Payment changes and corrections must be recorded transparently. A correction is a reversal entry; original history should not be deleted.</li><li>Organizer must ensure that the chit operation and its terms comply with applicable registration and legal requirements.</li></ul>";
 return {lang:"en",role:"organizer",previewMemberId:null,page:"dashboard",chit:chit,members:[],cycles:[],bids:[],payments:[],dividendHistory:[],rulesHtml:rulesHtml,modal:null,toast:null,selectedMonth:1,selectedPaymentMonth:1};
}
let state=blankState();

state.backendConfigured=!!(window.AuctionChitBackend&&window.AuctionChitBackend.configured());
state.authUser=null;
state.availableChits=[];
state.dbChitId=null;
state.liveWorkspace=false;
state.backendLoading=false;
state.backendBusy=false;
state.backendError=null;
async function refreshLiveWorkspace(requestedChitId){
 const backend=window.AuctionChitBackend;
 if(!backend||!backend.configured()){state.backendConfigured=false;render();return;}
 const lang=state.lang,page=state.page;
 state.backendLoading=true;render();
 try{
  const inviteId=requestedChitId||(new URLSearchParams(window.location.search)).get("chit")||state.dbChitId||null;
  const payload=await backend.loadWorkspace(inviteId);
  state.authUser=payload.user||null;state.availableChits=payload.chits||[];state.backendConfigured=true;state.backendError=null;
  if(payload.workspace){
   Object.assign(state,payload.workspace);
   state.dbChitId=payload.workspace.chit.dbId;
   state.liveWorkspace=true;
   state.authUser=payload.user;
   state.availableChits=payload.chits||[];
   state.backendConfigured=true;
   state.backendLoading=false;
   state.backendBusy=false;
   state.backendError=null;
   state.lang=lang;state.page=page;
   state.modal=null;state.toast=null;
  }else{
   state.dbChitId=null;state.liveWorkspace=false;state.backendLoading=false;state.backendBusy=false;
   state.lang=lang;state.page=page;
   if(payload.user)state.role="organizer";
  }
  render();
 }catch(error){
  state.backendLoading=false;state.backendBusy=false;state.backendError=error&&error.message?error.message:String(error);
  render();
  toast(state.backendError,true);
 }
}
async function bootstrapBackend(){
 const backend=window.AuctionChitBackend;
 if(!backend||!backend.configured()){state.backendConfigured=false;render();return;}
 state.backendConfigured=true;
 try{const user=await backend.getUser();state.authUser=user||null;if(user)await refreshLiveWorkspace((new URLSearchParams(window.location.search)).get("chit")||null);else render();}
 catch(error){state.backendError=error.message||String(error);render();}
}
async function createLiveChit(){
 const backend=window.AuctionChitBackend;
 if(!backend||!backend.configured()){toast(t("backendSetupMissing"),true);return;}
 if(!state.authUser){toast(t("signInReady"),true);return;}
 if(!window.confirm(t("createLiveChit")+"? "+t("privacyNotice")))return;
 state.backendBusy=true;render();
 try{
  const id=await backend.createWorkspace(state.chit,state.members,state.rulesHtml);
  await refreshLiveWorkspace(id);
  state.page="dashboard";render();toast(t("liveWorkspaceCreated"));
 }catch(error){state.backendBusy=false;state.backendError=error.message||String(error);render();toast(state.backendError,true);}
}
async function persistLiveMember(member){
 if(!state.liveWorkspace||!state.dbChitId)return;
 const backend=window.AuctionChitBackend;
 try{const id=await backend.saveMember(state.dbChitId,member);if(!member.dbId){member.dbId=id;member.id=id;}await refreshLiveWorkspace(state.dbChitId);}
 catch(error){toast(error.message||String(error),true);}
}
async function persistAndReload(action){
 try{state.backendBusy=true;render();await action();await refreshLiveWorkspace(state.dbChitId);}
 catch(error){state.backendBusy=false;toast(error.message||String(error),true);}
}
function paymentHistoryIncluded(h){return h.type!=="reported";}
function paymentFor(memberId,cycleNo){
 let p=state.payments.find(x=>x.memberId===memberId&&x.cycleNo===Number(cycleNo));
 if(!p){p={id:"p"+cycleNo+"-"+memberId,memberId:memberId,cycleNo:Number(cycleNo),paidPaise:0,status:"pending",mode:"upi",paidAt:"",screenshotName:"",history:[]};state.payments.push(p);}
 return p;
}
function currentBidFor(memberId,cycleNo){return state.bids.find(b=>b.memberId===memberId&&b.cycleNo===Number(cycleNo)&&b.status!=="rejected")||null;}
function financialPosition(m){
 const wins=state.cycles.filter(c=>c.status==="completed"&&c.winnerId===m.id).sort((a,b)=>a.monthNo-b.monthNo);
 if(!wins.length)return t("notYetWon");
 return wins[0].monthNo<=Math.ceil(state.chit.memberCount/2)?t("earlyBorrower"):t("lateInvestor");
}
function memberTotals(m){
 let paid=0,div=0,prize=0;
 state.payments.filter(p=>p.memberId===m.id).forEach(p=>{paid+=(p.history||[]).filter(h=>paymentHistoryIncluded(h)).reduce((sum,h)=>sum+(h.type==="reversal"?-h.amountPaise:h.amountPaise),0);});
 state.dividendHistory.filter(h=>h.memberId===m.id).forEach(h=>div+=h.amountPaise||0);
 state.cycles.filter(c=>c.status==="completed"&&c.winnerId===m.id).forEach(c=>prize+=c.prizePaise||0);
 return {paid:paid,dividend:div,prize:prize,profitLoss:prize+div-paid};
}
function paymentDue(m,c){
 const bid=c.status==="completed"?null:lowestBid(c);
 const calc=cycleCalc(c,bid);
 const baseSnapshot=c.status==="completed"&&c.baseContributionPaise!=null?c.baseContributionPaise:baseContribution();
 const historicalDividend=c.status==="completed"?state.dividendHistory.filter(h=>h.cycleNo===c.monthNo&&h.memberId===m.id).reduce((sum,h)=>sum+(h.amountPaise||0),0):(calc.dividends[m.id]||0);
 const base=Math.max(0,baseSnapshot-historicalDividend);
 const p=paymentFor(m.id,c.monthNo),paid=Math.max(0,p.paidPaise||0);
 const fine=paid<base?Math.max(0,daysLate(c))*Math.max(0,c.status==="completed"&&c.lateFinePerDayPaise!=null?c.lateFinePerDayPaise:state.chit.lateFinePerDayPaise):0;
 const remaining=Math.max(0,base+fine-paid);
 return {base:base,paid:paid,remaining:remaining,fine:fine,payment:p,calc:calc};
}
function sLabel(s){return ({paid:t("paid"),due:t("due"),partial:t("partial"),pending:t("pending"),approved:t("approved"),rejected:t("rejected"),submitted:t("submitted"),completed:t("completed"),upcoming:t("upcoming"),removed:t("removed"),active:t("active"),winner:t("winner")})[s]||s;}
function badge(s){const cl=({paid:"green",active:"green",approved:"green",completed:"green",winner:"blue",due:"red",rejected:"red",pending:"amber",partial:"amber",submitted:"amber",upcoming:"gray",removed:"gray"})[s]||"gray";return '<span class="badge '+cl+'">'+esc(sLabel(s))+'</span>';}
function memberCell(m){return '<div class="member-cell"><span class="avatar">'+esc(m.name.trim().split(/\s+/).slice(0,2).map(s=>s.charAt(0)).join("").toUpperCase())+'</span><span><span class="member-name">'+esc(m.name)+'</span><span class="member-meta">'+esc(m.phone||m.email||"")+'</span></span></div>';}
function heading(title,desc,actions){return '<section class="page-heading"><div><h1>'+esc(title)+'</h1><p>'+esc(desc||"")+'</p></div><div class="heading-actions">'+(actions||"")+'</div></section>';}
function banner(){if(state.liveWorkspace)return '<div class="demo-banner"><span class="banner-icon">✓</span><div><strong>'+esc(t("liveConnected"))+'</strong><span>'+esc(t("liveBanner"))+'</span></div></div>';if(state.authUser&&state.backendConfigured)return '<div class="demo-banner"><span class="banner-icon">i</span><div><strong>'+esc(t("noWorkspace"))+'</strong><span>'+esc(t("privacyNotice"))+'</span></div></div>';return '<div class="demo-banner"><span class="banner-icon">i</span><div><strong>'+esc(t("demoNotice"))+'</strong><span>'+esc(t("demoText"))+'</span><div style="margin-top:5px;font-weight:800">'+esc(t("privacyNotice"))+'</div></div></div>';}
function nav(){
 const items=state.liveWorkspace&&state.role==="member"?["dashboard","members","auction","cycles","payments","rules","reports"]:["dashboard","setup","members","auction","cycles","payments","rules","reports"],icons={dashboard:"▦",setup:"⚙",members:"♙",auction:"↗",cycles:"◷",payments:"₹",rules:"≡",reports:"▤"};
 return '<aside class="sidebar"><div class="side-label">'+esc(t("brand"))+'</div><nav class="nav-list">'+items.map(k=>'<button class="nav-item '+(state.page===k?"active":"")+'" data-page="'+k+'"><span class="nav-icon">'+icons[k]+'</span>'+esc(t(k))+'</button>').join("")+'</nav><div class="sidebar-note"><strong>'+esc(t("copyPreview"))+'</strong>'+esc(t("membersHelp"))+'</div></aside>';
}
function header(){
 const role=state.liveWorkspace?'<span class="badge blue">'+esc(state.role==="member"?t("memberMode"):t("organizerMode"))+'</span>':'<div class="role-preview"><label for="role-select" style="font-size:9px;font-weight:900;color:var(--muted)">'+esc(t("rolePreview"))+'</label><select id="role-select" data-action="role-select"><option value="organizer" '+(state.role==="organizer"?"selected":"")+'>'+esc(t("organizerMode"))+'</option><option value="member" '+(state.role==="member"?"selected":"")+'>'+esc(t("memberMode"))+'</option></select></div>';
 const switcher=state.liveWorkspace&&state.availableChits&&state.availableChits.length>1?'<select class="top-btn" aria-label="'+esc(t("switchChit"))+'" data-action="switch-chit">'+state.availableChits.map(c=>'<option value="'+esc(c.id)+'" '+(c.id===state.dbChitId?"selected":"")+'>'+esc(c.name)+'</option>').join("")+'</select>':"";
  const home='<a class="top-btn" href="committee-book.html">⌂ '+(state.lang==="te"?"హోమ్":"Home")+'</a>';
 const reset="";
 return '<header class="header"><div class="header-inner"><a class="brand" href="committee-book.html"><span class="brand-mark">C</span><span><span class="brand-name">'+esc(t("brand"))+'</span><span class="brand-sub">'+esc(t("templateTag"))+' · '+esc(t("templateName"))+'</span></span></a><div class="header-actions">'+switcher+role+'<button class="lang-btn" data-action="toggle-lang">文 A · '+esc(t("language"))+'</button>'+home+reset+'</div></div></header>';
}
function stat(label,value,foot,icon,cls){return '<article class="stat '+cls+'"><div class="stat-top"><span class="stat-label">'+esc(label)+'</span><span class="stat-icon">'+icon+'</span></div><div class="stat-value">'+esc(value)+'</div><div class="stat-foot">'+esc(foot||"")+'</div></article>';}
function calcCard(label,value,help){return '<div class="calc-item"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(help||"")+'</small></div>';}
function allCompletedDividends(){return state.dividendHistory.reduce((sum,h)=>sum+(h.amountPaise||0),0);}
function timerData(c){
 const w=timeWindow(c.monthNo),now=new Date(),status=now<w.start?"upcoming":now>w.end?"closed":"open",target=status==="upcoming"?w.start:w.end,delta=Math.max(0,target-now),days=Math.floor(delta/86400000),hours=Math.floor(delta%86400000/3600000),mins=Math.floor(delta%3600000/60000),secs=Math.floor(delta%60000/1000);
 return {start:w.start,end:w.end,status:status,text:String(days).padStart(2,"0")+"d "+String(hours).padStart(2,"0")+"h "+String(mins).padStart(2,"0")+"m "+String(secs).padStart(2,"0")+"s",target:target};
}
function dashboard(){
 const c=currentCycle(),lb=c?lowestBid(c):null,calc=c?cycleCalc(c,lb):null,active=activeMembers();
 const payments=c?active.map(m=>paymentDue(m,c)):[],paidCount=payments.filter(d=>d.remaining===0).length,collected=payments.reduce((s,d)=>s+d.paid,0);
 const next=c?calc.due[state.previewMemberId]||baseContribution():baseContribution();
 const cards='<div class="stats">'+
  stat(t("currentPot"),money(state.chit.potPaise),c?cycleName(c):"—","₹","blue")+
  stat(t("lowestBid"),lb?money(lb.amountPaise):t("noValidBids"),lb?mBy(lb.memberId).name:t("noValidBids"),"↘","green")+
  stat(t("dividendDistributed"),money(allCompletedDividends()),t("completed")+" · "+state.cycles.filter(x=>x.status==="completed").length+" "+t("cycles"),"₹","amber")+
  stat(t("nextDue"),money(next),t("baseContribution")+" "+money(baseContribution()),"◷","red")+
 '</div>';
 const w=c?timerData(c):null;
 const timer='<div class="timer"><div class="timer-label">'+esc(t("auctionTimer"))+'</div><div class="timer-value" id="timerValue">'+(w?esc(w.text):"—")+'</div><div class="timer-caption">'+esc(!w?t("notStarted"):w.status==="open"?t("timerOpen"):w.status==="upcoming"?t("timerUpcoming"):t("timerClosed"))+' · '+esc(w?dateText(iso(w.start))+" – "+dateText(iso(w.end)):"—")+'</div><div class="progress"><span id="timerProgress" style="width:'+(w?(w.status==="closed"?100:w.status==="upcoming"?0:Math.max(2,Math.min(100,((Date.now()-w.start)/(w.end-w.start))*100))):0)+'%"></span></div></div>';
 const calcPanel=c?'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("calcSummary"))+'</h2><p>'+esc(t("lowestRule"))+'</p></div></div><div class="panel-body"><div class="calc-grid">'+calcCard(t("floorPrice"),money(floorPrice(c.monthNo)),t("floorMonth")+" "+c.monthNo)+calcCard(t("prize"),money(calc.prizePaise),t("lowestBid"))+calcCard(t("discount"),money(calc.discountPaise),t("potAmount")+" − "+t("prize"))+calcCard(t("commission"),money(calc.commissionPaise),String(state.chit.commissionPct)+"%")+calcCard(t("dividendPool"),money(calc.dividendPoolPaise),t("discount")+" − "+t("commission"))+calcCard(t("dividendPerHead"),money(calc.dividendPerHeadPaise),t("eligibleMembers")+": "+calc.eligibleIds.length)+'</div><div class="hint" style="margin-top:10px">'+esc(t(state.chit.dividendRule==="allMembers"?"allRules":"nonWinnerRules"))+'</div></div></div>':'';
 const auctionPanel='<div class="panel"><div class="panel-head"><div><h2>'+esc(t("liveAuction"))+'</h2><p>'+esc(t("liveAuctionHelp"))+'</p></div>'+(c?badge(c.status):"")+'</div><div class="panel-body">'+timer+
  '<div class="live-stat-row" style="margin-top:12px">'+
  '<div class="mini"><span>'+esc(t("floorPrice"))+'</span><strong>'+money(c?floorPrice(c.monthNo):0)+'</strong></div>'+
  '<div class="mini green"><span>'+esc(t("lowestBid"))+'</span><strong>'+(lb?money(lb.amountPaise):"—")+'</strong></div>'+
  '<div class="mini"><span>'+esc(t("winner"))+'</span><strong>'+(lb?esc(mBy(lb.memberId).name):"—")+'</strong></div></div>'+
  '<div class="table-wrap"><table><thead><tr><th>'+esc(t("bidder"))+'</th><th>'+esc(t("bidAmount"))+'</th><th>'+esc(t("bidTime"))+'</th><th>'+esc(t("isLowest"))+'</th><th>'+esc(t("status"))+'</th>'+(state.role==="organizer"?"<th>"+esc(t("action"))+"</th>":"")+'</tr></thead><tbody>'+bidRows(c,lb)+'</tbody></table></div>'+
  (state.role==="organizer"&&c?'<div class="form-actions"><span class="hint">'+esc(t("bidApprovalRequired"))+'</span><button class="btn primary" data-action="declare-winner" '+(!lb?"disabled":"")+'>'+esc(t("declareWinner"))+'</button></div>':"")+
 '</div></div>';
 const dues=active.filter(m=>{const p=paymentDue(m,c);return p.remaining>0;}).slice(0,6).map(m=>{const d=paymentDue(m,c),late=daysLate(c),cl=late>0?"overdue":"";return '<div class="pending-item '+cl+'"><span class="pending-mark">'+(late>0?"!":"◷")+'</span><span><span class="pending-title">'+esc(m.name)+'</span><span class="pending-desc">'+esc(late>0?t("overdue"):t("dueSoon"))+" · "+esc(dateText(iso(dueDate(c))))+'</span></span><span class="pending-amount">'+money(d.remaining+d.fine)+'</span></div>';}).join("");
 const pendingPanel='<div class="panel"><div class="panel-head"><div><h2>'+esc(t("pendingList"))+'</h2><p>'+esc(t("reminderPreview"))+'</p></div></div><div class="panel-body"><div class="pending-list">'+(dues||'<div class="empty">'+esc(t("noRows"))+'</div>')+'</div></div></div>';
 const history=state.cycles.filter(x=>x.status==="completed").slice().reverse().map(x=>'<tr><td><strong>'+esc(cycleName(x))+'</strong><div class="member-meta">'+esc(t("monthNo"))+" "+x.monthNo+'</div></td><td>'+esc(mBy(x.winnerId)?mBy(x.winnerId).name:"—")+'</td><td class="money">'+money(x.prizePaise)+'</td><td class="money">'+money(x.discountPaise)+'</td><td class="money">'+money(x.commissionPaise)+'</td><td class="money">'+money(x.dividendPerHeadPaise)+'</td></tr>').join("");
 const historyPanel='<div class="panel"><div class="panel-head"><div><h2>'+esc(t("auctionHistory"))+'</h2><p>'+esc(t("monthLedger"))+'</p></div><button class="btn small" data-page="cycles">'+esc(t("cycles"))+' →</button></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("month"))+'</th><th>'+esc(t("winner"))+'</th><th>'+esc(t("prize"))+'</th><th>'+esc(t("discount"))+'</th><th>'+esc(t("commission"))+'</th><th>'+esc(t("dividend"))+'</th></tr></thead><tbody>'+(history||'<tr><td colspan="6" class="empty">'+esc(t("noHistory"))+'</td></tr>')+'</tbody></table></div></div></div>';
 const paymentRows=c?active.map((m,i)=>{const d=paymentDue(m,c);return '<tr><td>'+memberCell(m)+'</td><td class="money">'+money(d.remaining+d.fine)+'</td><td>'+badge(d.remaining===0?"paid":d.paid?"partial":"pending")+'</td><td>'+esc(d.payment.paidAt?dtText(d.payment.paidAt):"—")+'</td><td>'+esc(d.payment.mode==="cash"?t("cash"):t("upi"))+'</td></tr>';}).join(""):"";
 const paymentPanel='<div class="panel"><div class="panel-head"><div><h2>'+esc(t("paymentsTitle"))+'</h2><p>'+esc(t("currentMonth"))+'</p></div><button class="btn small" data-page="payments">'+esc(t("payments"))+' →</button></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("member"))+'</th><th>'+esc(t("amountDue"))+'</th><th>'+esc(t("status"))+'</th><th>'+esc(t("paidDate"))+'</th><th>'+esc(t("paymentMode"))+'</th></tr></thead><tbody>'+paymentRows+'</tbody></table></div></div></div>';
 const dashActions=(state.authUser&&!state.dbChitId?'<button class="btn primary" data-action="create-live-chit">＋ '+esc(t("createLiveChit"))+'</button>':"")+'<button class="btn" data-page="reports">▤ '+esc(t("reports"))+'</button><button class="btn primary" data-page="auction">↗ '+esc(t("auction"))+'</button>';
 return heading(t("dashboard"),t("subtitle"),dashActions)+banner()+cards+'<div class="grid2"><div>'+auctionPanel+historyPanel+paymentPanel+'</div><div>'+calcPanel+pendingPanel+'</div></div>';
}
function bidRows(c,lb){
 if(!c)return '<tr><td colspan="6" class="empty">'+esc(t("noRows"))+'</td></tr>';
 const list=currentBids(c).slice().sort((a,b)=>a.amountPaise-b.amountPaise||new Date(a.createdAt)-new Date(b.createdAt));
 if(!list.length)return '<tr><td colspan="6" class="empty">'+esc(t("noValidBids"))+'</td></tr>';
 return list.map(b=>{const low=lb&&b.id===lb.id;const m=mBy(b.memberId)||{name:"—"};const controls=state.role==="organizer"?'<div class="row-actions">'+(b.status==="submitted"?'<button class="btn small primary" data-action="approve-bid" data-id="'+b.id+'">'+esc(t("approve"))+'</button><button class="btn small danger" data-action="reject-bid" data-id="'+b.id+'">'+esc(t("reject"))+'</button>':"")+'</div>':"";
 return '<tr class="'+(low?"bid-lowest":"")+'"><td>'+memberCell(m)+'</td><td class="money">'+money(b.amountPaise)+'</td><td>'+esc(dtText(b.createdAt))+'</td><td>'+(low?'<span class="badge green">'+esc(t("yes"))+'</span>':'—')+'</td><td>'+badge(b.status)+'</td>'+(state.role==="organizer"?"<td>"+controls+"</td>":"")+'</tr>';}).join("");
}
function setup(){
 const c=state.chit;
 const configurationLocked=state.liveWorkspace||state.cycles.some(cy=>cy.status==="completed");
 const distributionLocked=state.cycles.some(cy=>cy.status==="completed");
 const field=(key,label,val,type,attrs,help,locked)=>'<div class="field"><label for="f-'+key+'">'+esc(label)+(locked?' <span class="lock" title="'+esc(t("editNotFormula"))+'">🔒 '+esc(t("locked"))+'</span>':"")+'</label><input id="f-'+key+'" data-field="'+key+'" type="'+type+'" value="'+esc(val==null?"":val)+'" '+(attrs||"")+(locked?' disabled title="'+esc(t("editNotFormula"))+'"':"")+'>'+(help?'<div class="hint">'+esc(help)+'</div>':"")+'</div>';
 const select=(key,label,val,opts,locked)=>'<div class="field"><label for="f-'+key+'">'+esc(label)+(locked?' <span class="lock" title="'+esc(t("editNotFormula"))+'">🔒 '+esc(t("locked"))+'</span>':"")+'</label><select id="f-'+key+'" data-field="'+key+'" '+(locked?'disabled title="'+esc(t("editNotFormula"))+'"':"")+'>'+opts.map(o=>'<option value="'+esc(o[0])+'" '+(o[0]===val?"selected":"")+'>'+esc(o[1])+'</option>').join("")+'</select></div>';
 const calc=floorPrice(currentCycle()?currentCycle().monthNo:1);
 const setupActions=state.authUser&&!state.dbChitId?'<button class="btn primary" data-action="create-live-chit">＋ '+esc(t("createLiveChit"))+'</button>':"";
 return heading(t("setup"),t("editNotFormula"),setupActions)+banner()+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("chitSetup"))+'</h2><p>'+esc(t("editNotFormula"))+'</p></div><span class="lock">⚙ '+esc(t("edit"))+'</span></div><div class="panel-body"><div class="form-grid">'+
 field("name",t("chitName"),c.name,"text","required")+
 field("pot",t("potAmount"),(c.potPaise/100).toFixed(2),"number",'min="1" step="0.01"',"",configurationLocked)+
 field("memberCount",t("numberMembers"),c.memberCount,"number",'min="2" step="1"',"",configurationLocked)+
 field("contribution",t("monthlyContribution"),(baseContribution()/100).toFixed(2),"text",'disabled',t("editNotFormula"))+
 field("startingFloor",t("baseFloor"),(c.startingFloorPaise/100).toFixed(2),"number",'min="0.01" step="0.01"')+
 field("maxDiscountPct",t("maxDiscountCap"),c.maxDiscountPct,"number",'min="0" max="100" step="0.01"',"",configurationLocked)+
 field("commissionPct",t("commissionPercent"),c.commissionPct,"number",'min="0" max="100" step="0.01"')+
 select("dividendRule",t("dividendRule"),c.dividendRule,[["allMembers",t("allMembersRule")],["nonWinners",t("nonWinnersRule")]],distributionLocked)+
 field("startDate",t("startDate"),c.startDate,"date","required")+
 select("floorLogic",t("auctionFloorLogic"),"automatic",[["automatic",t("floorAutoIncrease")]],true)+
 field("auctionStartDay",t("auctionStartDay"),c.auctionStartDay,"number",'min="1" max="31" step="1"')+
 field("auctionEndDay",t("auctionEndDay"),c.auctionEndDay,"number",'min="1" max="31" step="1"')+
 field("dueDay",t("dueDay"),c.dueDay,"number",'min="1" max="31" step="1"')+
 field("lateFine",t("lateFine"),(c.lateFinePerDayPaise/100).toFixed(2),"number",'min="0" step="0.01"')+
 field("upiId",t("upiId"),c.upiId,"text",'placeholder="organizer@upi"')+
 '<div class="field span2"><label>'+esc(t("rulesText"))+'</label>'+rulesEditor(false)+'</div>'+
 '</div><div class="form-actions"><span class="hint">'+esc(t("editNotFormula"))+'</span><button class="btn primary" data-action="save-setup">✓ '+esc(t("saveChanges"))+'</button></div></div></div>'+
 '<div class="panel"><div class="panel-head"><div><h2>'+esc(t("floorLogic"))+'</h2><p>'+esc(t("floorLogicHelp"))+'</p></div></div><div class="panel-body"><div class="calc-grid">'+calcCard(t("baseFloor"),money(c.startingFloorPaise),t("baseFloor"))+calcCard(t("maxDiscountCap"),String(c.maxDiscountPct)+"%",t("floorFormula"))+calcCard(t("autoFloor"),money(calc),t("floorMonth")+" "+(currentCycle()?currentCycle().monthNo:1))+'</div><div class="info" style="margin-top:12px">'+esc(t("floorFormula"))+'</div></div></div>';
}
async function openPrivateDocument(path){
 if(!state.liveWorkspace||!path){toast(t("notAvailable"),true);return;}
 try{const url=await window.AuctionChitBackend.signedFileUrl(path,120);window.open(url,"_blank","noopener,noreferrer");}
 catch(error){toast(error.message||String(error),true);}
}
function membersView(){
 const rows=state.members.map((m,i)=>{
  const total=memberTotals(m);
  const uploadControl=(type,label,path)=>{
   const upload=state.liveWorkspace&&state.role==="organizer"?'<label class="btn small">'+esc(label)+'<input type="file" data-action="upload-document" data-doc-type="'+type+'" data-id="'+m.id+'" accept="application/pdf,image/jpeg,image/png" style="display:none"></label>':'<button class="btn small" disabled title="'+esc(t("noKycUpload"))+'">'+esc(label)+' · '+esc(t("comingSoon"))+'</button>';
   const view=state.liveWorkspace&&path?'<button class="btn small" data-action="view-document" data-path="'+esc(path)+'">'+esc(t("details"))+'</button>':"";
   return '<div class="row-actions">'+upload+view+'</div>';
  };
  const docs='<td>'+uploadControl("kyc",t("kycDoc"),m.kycDocPath)+uploadControl("agreement",t("agreement"),m.agreementDocPath)+'</td>';
  const actions=state.role==="organizer"?'<div class="row-actions"><button class="btn small" data-action="edit-member" data-id="'+m.id+'">'+esc(t("edit"))+'</button>'+(state.liveWorkspace?'<button class="btn small" data-action="invite-member" data-id="'+m.id+'">'+esc(t("inviteMember"))+'</button>':"")+'<button class="btn small danger" data-action="remove-member" data-id="'+m.id+'" '+(m.status==="removed"?"disabled":"")+'>'+esc(t("removeMember"))+'</button></div>':"—";
  return '<tr><td>'+(i+1)+'</td><td>'+memberCell(m)+'</td><td>'+esc(m.phone||"—")+'</td><td>'+esc(m.email||"—")+'</td><td>'+badge(m.status)+'</td><td class="money">'+money(total.paid)+'</td><td class="money">'+money(total.dividend)+'</td><td class="money">'+money(total.profitLoss)+'</td>'+docs+'<td>'+actions+'</td></tr>';
 }).join("")||'<tr><td colspan="10" class="empty">'+esc(t("noRows"))+'</td></tr>';
 const addButton=state.role==="organizer"&&!state.liveWorkspace?'<button class="btn primary" data-action="add-member">＋ '+esc(t("addMember"))+'</button>':"";
 return heading(t("members"),t("membersHelp"),addButton)+banner()+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("membersTable"))+' · '+state.members.length+'</h2><p>'+esc(t("membersHelp"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("serialNo"))+'</th><th>'+esc(t("member"))+'</th><th>'+esc(t("phone"))+'</th><th>'+esc(t("email"))+'</th><th>'+esc(t("status"))+'</th><th>'+esc(t("totalPaid"))+'</th><th>'+esc(t("totalDividend"))+'</th><th>'+esc(t("netPL"))+'</th><th>'+esc(t("documents"))+'</th><th>'+esc(t("action"))+'</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div><div class="info">'+esc(t("privacyNotice"))+'</div>';
}
function auctionView(){
 const c=currentCycle();if(!c)return heading(t("auction"),t("noHistory"),'<button class="btn primary" data-page="setup">⚙ '+esc(t("setup"))+'</button>')+banner();
 const mine=currentBidFor(state.previewMemberId,c.monthNo),member=mBy(state.previewMemberId),eligible=activeMembers().filter(m=>!hasWon(m.id));
 const choices=eligible.map(m=>'<option value="'+m.id+'" '+(state.previewMemberId===m.id?"selected":"")+'>'+esc(m.name)+'</option>').join("");
 const bidEntry='<div class="bid-entry"><div class="field"><label for="memberBidAmount">'+esc(t("enterBid"))+'</label><input type="number" min="'+(floorPrice(c.monthNo)/100).toFixed(2)+'" max="'+(state.chit.potPaise/100).toFixed(2)+'" step="0.01" id="memberBidAmount" value="'+(mine?(mine.amountPaise/100).toFixed(2):(floorPrice(c.monthNo)/100).toFixed(2))+'"><div class="hint">'+esc(t("bidHint"))+'</div><div class="hint">'+esc(t("floorPrice"))+': '+money(floorPrice(c.monthNo))+' · '+esc(t("potAmount"))+': '+money(state.chit.potPaise)+'</div></div><button class="btn primary" data-action="submit-bid">'+esc(t("submitBid"))+'</button></div>';
 const roleSelector=state.role==="member"?'<div class="field" style="margin-bottom:13px"><label for="preview-member">'+esc(t("member"))+'</label><select id="preview-member" data-action="preview-member">'+eligible.map(m=>'<option value="'+m.id+'" '+(state.previewMemberId===m.id?"selected":"")+'>'+esc(m.name)+'</option>').join("")+'</select><div class="hint">'+esc(t("memberOnly"))+'</div></div>':"";
 const timer=timerData(c);
 return heading(t("auction"),t("liveAuctionHelp"),state.role==="organizer"?'<button class="btn primary" data-action="declare-winner" '+(!lowestBid(c)?"disabled":"")+'>'+esc(t("declareWinner"))+'</button>':"")+banner()+'<div class="grid2"><div><div class="panel"><div class="panel-head"><div><h2>'+esc(t("liveAuction"))+'</h2><p>'+esc(t("auctionWindow"))+' · '+esc(dateText(iso(timer.start)))+' – '+esc(dateText(iso(timer.end)))+'</p></div>'+badge(timer.status==="open"?"approved":timer.status==="upcoming"?"upcoming":"completed")+'</div><div class="panel-body">'+(state.role==="member"?roleSelector:"")+(state.role==="member"&&member&&member.status!=="removed"&&!hasWon(member.id)?bidEntry:'<div class="info">'+esc(state.role==="member"?(hasWon(state.previewMemberId)?t("winnerCannotBid"):t("memberOnly")):t("bidApprovalRequired"))+'</div>')+'<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>'+esc(t("bidder"))+'</th><th>'+esc(t("bidAmount"))+'</th><th>'+esc(t("bidTime"))+'</th><th>'+esc(t("isLowest"))+'</th><th>'+esc(t("status"))+'</th>'+(state.role==="organizer"?"<th>"+esc(t("action"))+"</th>":"")+'</tr></thead><tbody>'+bidRows(c,lowestBid(c))+'</tbody></table></div>'+ (state.role==="organizer"?'<div class="form-actions"><span class="hint">'+esc(t("lowestRule"))+'</span><button class="btn primary" data-action="declare-winner" '+(!lowestBid(c)?"disabled":"")+'>'+esc(t("declareWinner"))+'</button></div>':"")+'</div></div></div><div><div class="panel"><div class="panel-head"><div><h2>'+esc(t("auctionTimer"))+'</h2><p>'+esc(t("timeLeft"))+'</p></div></div><div class="panel-body"><div class="timer"><div class="timer-label">'+esc(t("auctionWindow"))+'</div><div class="timer-value" id="timerValue">'+esc(timer.text)+'</div><div class="timer-caption">'+esc(timer.status==="open"?t("timerOpen"):timer.status==="upcoming"?t("timerUpcoming"):t("timerClosed"))+'</div></div><div class="calc-grid" style="margin-top:12px">'+calcCard(t("floorPrice"),money(floorPrice(c.monthNo)),t("floorMonth")+" "+c.monthNo)+calcCard(t("lowestBid"),lowestBid(c)?money(lowestBid(c).amountPaise):t("noBid"),lowestBid(c)?mBy(lowestBid(c).memberId).name:t("noValidBids"))+calcCard(t("dividendPerHead"),money(cycleCalc(c,lowestBid(c)).dividendPerHeadPaise),t("eligibleMembers"))+'</div></div></div><div class="panel"><div class="panel-head"><div><h2>'+esc(t("calcSummary"))+'</h2><p>'+esc(t("lowestRule"))+'</p></div></div><div class="panel-body"><div class="calc-grid">'+calcCard(t("prize"),money(cycleCalc(c,lowestBid(c)).prizePaise),"")+calcCard(t("discount"),money(cycleCalc(c,lowestBid(c)).discountPaise),"")+calcCard(t("commission"),money(cycleCalc(c,lowestBid(c)).commissionPaise),String(state.chit.commissionPct)+"%")+calcCard(t("dividendPool"),money(cycleCalc(c,lowestBid(c)).dividendPoolPaise),"")+calcCard(t("roundingLeftover"),money(cycleCalc(c,lowestBid(c)).leftoverPaise),t("toForeman"))+'</div></div></div></div></div>';
}
function cyclesView(){
 const rows=state.cycles.map(c=>{const b=c.status==="completed"?null:lowestBid(c),calc=cycleCalc(c,b);return '<tr><td><strong>'+c.monthNo+'</strong></td><td>'+esc(cycleName(c))+'</td><td>'+esc(c.winnerId&&mBy(c.winnerId)?mBy(c.winnerId).name:b&&mBy(b.memberId)?mBy(b.memberId).name:"—")+'</td><td class="money">'+money(c.status==="completed"?c.prizePaise:calc.prizePaise)+'</td><td class="money">'+money(c.status==="completed"?c.discountPaise:calc.discountPaise)+'</td><td class="money">'+money(c.status==="completed"?c.commissionPaise:calc.commissionPaise)+'</td><td class="money">'+money(c.status==="completed"?c.dividendPerHeadPaise:calc.dividendPerHeadPaise)+'</td><td>'+badge(c.status)+'</td></tr>';}).join("")||'<tr><td colspan="8" class="empty">'+esc(t("noHistory"))+'</td></tr>';
 const c=currentCycle(),b=c?lowestBid(c):null,calc=c?cycleCalc(c,b):null;
 const complete=c&&state.role==="organizer"?'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("currentMonth"))+' · '+esc(cycleName(c))+'</h2><p>'+esc(t("declareAuto"))+'</p></div>'+badge(c.status)+'</div><div class="panel-body"><div class="calc-grid">'+calcCard(t("winner"),b?mBy(b.memberId).name:t("noValidBids"),"")+calcCard(t("prize"),money(calc.prizePaise),"")+calcCard(t("dividendPerHead"),money(calc.dividendPerHeadPaise),"")+'</div><div class="form-actions"><span class="hint">'+esc(t("editNotFormula"))+'</span><button class="btn primary" data-action="declare-winner" '+(!b?"disabled":"")+'>'+esc(t("completeMonth"))+'</button></div></div></div>':"";
 return heading(t("cycles"),t("auctionHistory"))+banner()+complete+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("monthLedger"))+'</h2><p>'+esc(t("floorLogic"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("monthNo"))+'</th><th>'+esc(t("month"))+'</th><th>'+esc(t("winner"))+'</th><th>'+esc(t("prize"))+'</th><th>'+esc(t("discount"))+'</th><th>'+esc(t("commission"))+'</th><th>'+esc(t("dividendPerHead"))+'</th><th>'+esc(t("status"))+'</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div>';
}
function paymentsView(){
 const defaultCycle=currentCycle();
 const selectedNo=Number(state.selectedPaymentMonth)||(defaultCycle?defaultCycle.monthNo:1);
 const c=state.cycles.find(x=>x.monthNo===selectedNo)||defaultCycle;
 if(!c)return heading(t("payments"),t("noHistory"),'<button class="btn primary" data-page="setup">⚙ '+esc(t("setup"))+'</button>')+banner();
 const scope=state.role==="member"?activeMembers().filter(m=>m.id===state.previewMemberId):activeMembers();
 const rows=scope.map((m,i)=>{
  const d=paymentDue(m,c),p=d.payment;
  const pendingReport=(p.entries||[]).find(e=>e.status==="reported");
  const status=pendingReport?"submitted":d.remaining===0?"paid":d.paid?"partial":"pending";
  const toggle=state.role==="organizer"?'<label class="toggle"><input type="checkbox" data-action="payment-toggle" data-id="'+m.id+'" '+(d.remaining===0?"checked":"")+'><span>'+esc(t(d.remaining===0?"yes":"no"))+'</span></label>':"";
  let actions;
  if(state.role==="organizer"&&pendingReport){
   actions='<div class="row-actions"><button class="btn small primary" data-action="confirm-payment-report" data-id="'+pendingReport.dbId+'">'+esc(t("approvePayment"))+'</button><button class="btn small danger" data-action="reject-payment-report" data-id="'+pendingReport.dbId+'">'+esc(t("rejectPayment"))+'</button></div>';
  }else if(state.role==="organizer"){
   actions=d.paid>0?'<button class="btn small danger" data-action="reverse-payment" data-id="'+m.id+'">'+esc(t("reversePayment"))+'</button>':'<button class="btn small primary" data-action="mark-paid" data-id="'+m.id+'">'+esc(t("markPaid"))+'</button> <button class="btn small" data-action="mark-partial" data-id="'+m.id+'">'+esc(t("markPartial"))+'</button>';
  }else actions='<button class="btn small" data-action="show-qr" data-id="'+m.id+'">'+esc(t("generateQR"))+'</button>';
  const pstatus=d.remaining===0?"paid":pendingReport?"submitted":d.paid?"partial":"pending";
  return '<tr><td>'+(i+1)+'</td><td>'+memberCell(m)+'</td><td class="money">'+money(d.remaining+d.fine)+'</td><td>'+toggle+' '+badge(pstatus)+'</td><td>'+esc(p.paidAt?dtText(p.paidAt):"—")+'</td><td><select data-action="payment-mode" data-id="'+m.id+'" aria-label="'+esc(t("paymentMode"))+'" '+(state.role!=="organizer"?"disabled":"")+'><option value="upi" '+(p.mode==="upi"?"selected":"")+'>'+esc(t("upi"))+'</option><option value="cash" '+(p.mode==="cash"?"selected":"")+'>'+esc(t("cash"))+'</option></select></td><td class="money">'+money(d.fine)+'</td><td>'+(pendingReport?badge("submitted"):'<span class="subtle">—</span>')+'</td><td>'+actions+'</td></tr>';
 }).join("");
 const monthSelect='<select data-action="payment-month" aria-label="'+esc(t("selectMonth"))+'">'+state.cycles.map(cy=>'<option value="'+cy.monthNo+'" '+(cy.monthNo===c.monthNo?"selected":"")+'>'+esc(cycleName(cy))+' · '+esc(t("monthNo"))+" "+cy.monthNo+'</option>').join("")+'</select>';
 const qrSection='<div class="panel"><div class="panel-head"><div><h2>'+esc(t("qrTitle"))+'</h2><p>'+esc(t("qrDisclaimer"))+'</p></div><span class="badge amber">'+esc(t("modeDemo"))+'</span></div><div class="panel-body"><div id="qrBox" class="info">'+esc(state.chit.upiId?t("generateQR"):t("qrNotConfigured"))+'</div><div id="qrImage" style="margin-top:12px"></div></div></div>';
 let reportSection="";
 if(state.role==="member"){
  const m=mBy(state.previewMemberId),d=m?paymentDue(m,c):null;
  if(state.liveWorkspace&&m&&c.status==="completed"){
   reportSection='<div class="panel"><div class="panel-head"><div><h2>'+esc(t("submitPaymentReport"))+'</h2><p>'+esc(t("screenshotRequired"))+'</p></div><span class="badge amber">'+esc(t("approvalPending"))+'</span></div><div class="panel-body"><div class="form-grid"><div class="field"><label for="reported-payment-amount">'+esc(t("amountReceived"))+'</label><input type="number" id="reported-payment-amount" min="0.01" step="0.01" max="'+((d?d.remaining+d.fine:0)/100).toFixed(2)+'" value="'+((d?d.remaining+d.fine:0)/100).toFixed(2)+'"></div><div class="field"><label for="reported-payment-mode">'+esc(t("paymentMode"))+'</label><select id="reported-payment-mode"><option value="upi">'+esc(t("upi"))+'</option><option value="cash">'+esc(t("cash"))+'</option></select></div><div class="field span2"><label for="payment-screenshot">'+esc(t("screenshot"))+'</label><input type="file" id="payment-screenshot" accept="application/pdf,image/jpeg,image/png" required><div class="hint">'+esc(t("noScreenshotUpload"))+'</div></div></div><div class="form-actions"><span class="hint">'+esc(t("qrDisclaimer"))+'</span><button class="btn primary" data-action="submit-payment-report" '+(!(d&&d.remaining>0)?"disabled":"")+'>'+esc(t("submitPaymentReport"))+'</button></div></div></div>';
  }else{
   reportSection='<div class="info">'+esc(state.liveWorkspace?t("cycleLocked"):t("noScreenshotUpload"))+'</div>';
  }
 }
 const allHistory=state.payments.filter(p=>scope.some(m=>m.id===p.memberId)&&p.cycleNo===c.monthNo).map(p=>{const m=mBy(p.memberId);return (p.history||[]).map(h=>'<tr><td>'+esc(m?m.name:"—")+'</td><td>'+esc(h.type==="reversal"?t("reversePayment"):h.type==="reported"?t("submitted"):t("paid"))+'</td><td>'+esc(dtText(h.date))+'</td><td class="money">'+(h.type==="reversal"?"−":"")+money(h.amountPaise)+'</td><td>'+esc(h.mode==="cash"?t("cash"):t("upi"))+'</td><td>'+esc(h.ref||"—")+'</td></tr>').join("");}).join("");
 return heading(t("payments"),t("fineCalculated"))+banner()+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("paymentsTitle"))+'</h2><p>'+esc(t("currentMonth"))+' · '+esc(cycleName(c))+'</p></div>'+monthSelect+'</div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("serialNo"))+'</th><th>'+esc(t("member"))+'</th><th>'+esc(t("amountDue"))+'</th><th>'+esc(t("paidQuestion"))+'</th><th>'+esc(t("paidDate"))+'</th><th>'+esc(t("paymentMode"))+'</th><th>'+esc(t("lateFine"))+'</th><th>'+esc(t("screenshot"))+'</th><th>'+esc(t("action"))+'</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div>'+qrSection+reportSection+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("memberStatement"))+'</h2><p>'+esc(t("reverseConfirm"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("member"))+'</th><th>'+esc(t("status"))+'</th><th>'+esc(t("date"))+'</th><th>'+esc(t("amount"))+'</th><th>'+esc(t("paymentMode"))+'</th><th>'+esc(t("reference"))+'</th></tr></thead><tbody>'+(allHistory||'<tr><td colspan="6" class="empty">'+esc(t("noRows"))+'</td></tr>')+'</tbody></table></div></div></div>';
}
function rulesEditor(){return '<div class="rule-editor"><div class="rule-toolbar"><button class="btn small" data-rule-cmd="bold" title="'+esc(t("bold"))+'"><b>B</b></button><button class="btn small" data-rule-cmd="italic" title="'+esc(t("italic"))+'"><i>I</i></button><button class="btn small" data-rule-cmd="insertUnorderedList" title="'+esc(t("bullets"))+'">•</button></div><div class="rule-content" data-rule-content contenteditable="true" spellcheck="true" data-placeholder="'+esc(t("rulePlaceholder"))+'">'+sanitizeRules(state.rulesHtml)+'</div></div>';}
function sanitizeRules(html){const doc=new DOMParser().parseFromString(String(html||""),"text/html");const allowed=["P","BR","STRONG","B","EM","I","U","UL","OL","LI","H2","H3"];Array.from(doc.body.querySelectorAll("*")).forEach(el=>{if(!allowed.includes(el.tagName)){el.replaceWith(doc.createTextNode(el.textContent||""));return;}Array.from(el.attributes).forEach(a=>el.removeAttribute(a.name));});return doc.body.innerHTML;}
function rulesView(){
 const c=currentCycle(),calc=c?cycleCalc(c,lowestBid(c)):null;
 return heading(t("ruleTitle"),t("editRules"),state.role==="organizer"?'<button class="btn primary" data-action="save-rules">'+esc(t("saveRules"))+'</button>':"")+banner()+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("rulesText"))+'</h2><p>'+esc(t("editRules"))+'</p></div></div><div class="panel-body">'+(state.role==="organizer"?rulesEditor():'<div class="rule-content">'+sanitizeRules(state.rulesHtml)+'</div>')+'</div></div><div class="panel"><div class="panel-head"><div><h2>'+esc(t("calcSummary"))+'</h2><p>'+esc(t("lowestRule"))+'</p></div></div><div class="panel-body"><div class="calc-grid">'+calcCard(t("baseContribution"),money(baseContribution()),t("potAmount")+" ÷ "+t("numberMembers"))+calcCard(t("floorPrice"),money(c?floorPrice(c.monthNo):0),t("floorLogic"))+calcCard(t("commission"),money(commissionAmount()),String(state.chit.commissionPct)+"%")+calcCard(t("dividendPool"),money(calc?calc.dividendPoolPaise:0),"")+calcCard(t("dividendPerHead"),money(calc?calc.dividendPerHeadPaise:0),t("eligibleMembers"))+calcCard(t("roundingLeftover"),money(calc?calc.leftoverPaise:0),t("toForeman"))+'</div><div class="info" style="margin-top:12px">'+esc(t("profitFormula"))+'</div></div></div>';
}
function reportsView(){
 const mrows=state.members.map(m=>{const v=memberTotals(m);return '<tr><td>'+memberCell(m)+'</td><td>'+badge(m.status)+'</td><td>'+esc(financialPosition(m))+'</td><td class="money">'+money(v.paid)+'</td><td class="money">'+money(v.dividend)+'</td><td class="money">'+money(v.prize)+'</td><td class="money">'+money(v.profitLoss)+'</td></tr>';}).join("");
 const rows=state.cycles.map(c=>state.members.map(m=>{const p=paymentFor(m.id,c.monthNo),v=memberTotals(m);const d=paymentDue(m,c);const div=state.dividendHistory.filter(h=>h.cycleNo===c.monthNo&&h.memberId===m.id).reduce((s,h)=>s+h.amountPaise,0);return '<tr><td>'+c.monthNo+'</td><td>'+esc(cycleName(c))+'</td><td>'+esc(m.name)+'</td><td class="money">'+money(d.paid)+'</td><td class="money">'+money(div)+'</td><td class="money">'+money(m.id===c.winnerId?c.prizePaise:0)+'</td><td class="money">'+money(v.profitLoss)+'</td><td>'+badge(c.status)+'</td></tr>';}).join("")).join("");
 return heading(t("reportsTitle"),t("reportsHelp"),'<button class="btn" data-action="export-csv">⇩ '+esc(t("exportExcel"))+'</button><button class="btn primary" data-action="print-pdf">▤ '+esc(t("printPdf"))+'</button>')+banner()+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("fullLedger"))+'</h2><p>'+esc(t("memberStatement"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("member"))+'</th><th>'+esc(t("status"))+'</th><th>'+esc(t("financialPosition"))+'</th><th>'+esc(t("totalPaid"))+'</th><th>'+esc(t("totalDividend"))+'</th><th>'+esc(t("prizeReceived"))+'</th><th>'+esc(t("netPL"))+'</th></tr></thead><tbody>'+mrows+'</tbody></table></div></div></div><div class="panel"><div class="panel-head"><div><h2>'+esc(t("monthLedger"))+'</h2><p>'+esc(t("profitLoss"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("monthNo"))+'</th><th>'+esc(t("period"))+'</th><th>'+esc(t("member"))+'</th><th>'+esc(t("amountPaid"))+'</th><th>'+esc(t("dividend"))+'</th><th>'+esc(t("prizeReceived"))+'</th><th>'+esc(t("netPL"))+'</th><th>'+esc(t("status"))+'</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div><div class="info">'+esc(t("profitFormula"))+'</div>';
}
function pageContent(){switch(state.page){case"setup":return setup();case"members":return membersView();case"auction":return auctionView();case"cycles":return cyclesView();case"payments":return paymentsView();case"rules":return rulesView();case"reports":return reportsView();default:return dashboard();}}
function modalView(){
 if(!state.modal)return "";
 const m=state.modal.id?mBy(state.modal.id):null,existing=!!m,member=m||{name:"",phone:"",email:"",status:"active"};
 const f=(key,label,val,type)=>'<div class="field"><label for="modal-'+key+'">'+esc(label)+'</label><input id="modal-'+key+'" data-modal="'+key+'" type="'+type+'" value="'+esc(val||"")+'"></div>';
 return '<div class="modal-backdrop" data-action="modal-bg"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="member-modal-heading"><div class="modal-head"><h2 id="member-modal-heading">'+esc(existing?t("edit"):t("addMember"))+'</h2><button class="btn small" data-action="close-modal">✕ '+esc(t("close"))+'</button></div><div class="modal-body"><div class="form-grid">'+f("name",t("name"),member.name,"text")+f("phone",t("phone"),member.phone,"tel")+f("email",t("email"),member.email,"email")+'</div></div><div class="modal-foot"><button class="btn" data-action="close-modal">'+esc(t("cancel"))+'</button><button class="btn primary" data-action="save-member">'+esc(t("saveMember"))+'</button></div></section></div>';
}
function render(){
 document.title=t("pageTitle");document.documentElement.lang=state.lang==="te"?"te":"en";
 const footerStatus=state.liveWorkspace?t("liveConnected"):state.backendLoading?t("loadingData"):state.authUser&&state.backendConfigured?t("noWorkspace"):t("supabaseMissing");
 root.innerHTML=header()+'<div class="shell">'+nav()+'<main class="main">'+pageContent()+'<footer class="footer">'+esc(t("footer"))+' · '+esc(footerStatus)+'</footer></main></div>'+modalView()+'<div class="toast-area" id="toast-area">'+(state.toast?'<div class="toast '+(state.toast.error?"error":"")+'">'+esc(state.toast.message)+'</div>':"")+'</div>';
}
function toast(message,error){state.toast={message:message,error:!!error};render();clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>{state.toast=null;const el=document.getElementById("toast-area");if(el)el.innerHTML="";},2800);}
function syncCycles(){
 const completed=state.cycles.filter(c=>c.status==="completed").length;
 const existing=new Map(state.cycles.map(c=>[c.monthNo,c]));
 const nextCycles=[];
 for(let n=1;n<=state.chit.memberCount;n++){
  let c=existing.get(n);
  if(!c)c={monthNo:n,status:n===completed+1?"open":"upcoming",winnerId:null,winningBidPaise:null,prizePaise:0,discountPaise:0,commissionPaise:0,dividendPerHeadPaise:0,dividendPoolPaise:0,completedAt:null};
  if(c.status!=="completed"){
   c.status=n===completed+1?"open":"upcoming";
   const start=new Date(state.chit.startDate+"T00:00:00");start.setMonth(start.getMonth()+n-1);
   c.periodStartDate=iso(start);
   const due=new Date(start);const last=new Date(due.getFullYear(),due.getMonth()+1,0).getDate();due.setDate(Math.min(state.chit.dueDay,last));
   c.dueDate=iso(due);c.baseContributionPaise=baseContribution();c.dividendRule=state.chit.dividendRule;c.commissionPct=state.chit.commissionPct;c.lateFinePerDayPaise=state.chit.lateFinePerDayPaise;
  }
  nextCycles.push(c);
 }
 state.cycles=nextCycles;
}
function saveSetup(){
 const $=k=>document.querySelector('[data-field="'+k+'"]');
 const val=k=>$ (k)?$ (k).value:"";
 const name=val("name").trim(),pot=parseMoney(val("pot")),members=Number(val("memberCount")),floor=parseMoney(val("startingFloor")),cap=Number(val("maxDiscountPct")),commission=Number(val("commissionPct")),start=val("startDate"),sday=Number(val("auctionStartDay")),eday=Number(val("auctionEndDay")),due=Number(val("dueDay")),fine=parseMoney(val("lateFine")),upi=val("upiId").trim();
 if(!name){toast(t("memberNameRequired"),true);return;}
 if(pot<=0){toast(t("validationPot"),true);return;}
 if(!Number.isInteger(members)||members<2){toast(t("validationMembers"),true);return;}
 if(members<state.cycles.filter(c=>c.status==="completed").length){toast(t("memberCountBelowHistory"),true);return;}
 if(floor<=0||floor>pot){toast(t("validationFloor"),true);return;}
 if(!Number.isFinite(cap)||cap<0||cap>100){toast(t("validationDiscount"),true);return;}
 if(!Number.isFinite(commission)||commission<0||commission>100){toast(t("validationCommission"),true);return;}
 if(!Number.isInteger(sday)||!Number.isInteger(eday)||sday<1||sday>31||eday<sday||eday>31||due<1||due>31){toast(t("validationDates"),true);return;}
 const oldCount=state.chit.memberCount;
 state.chit={...state.chit,name:name,potPaise:pot,memberCount:members,startingFloorPaise:floor,maxDiscountPct:cap,commissionPct:commission,dividendRule:val("dividendRule"),startDate:start||state.chit.startDate,auctionStartDay:sday,auctionEndDay:eday,dueDay:due,lateFinePerDayPaise:fine,upiId:upi};
 const box=document.querySelector("[data-rule-content]");if(box)state.rulesHtml=sanitizeRules(box.innerHTML);
 if(members<oldCount)state.members.slice(members).forEach(m=>{m.status="removed";});
 if(state.liveWorkspace&&state.dbChitId){const chitId=state.dbChitId;persistAndReload(()=>window.AuctionChitBackend.saveChit(chitId,state.chit,state.rulesHtml));return;}
 syncCycles();toast(t("saved"));
}
function openMember(id){state.modal={id:id||null};render();}
function saveMember(){
 const get=k=>document.querySelector('[data-modal="'+k+'"]');
 const val=k=>get(k)?get(k).value.trim():"";
 const name=val("name");if(!name){toast(t("memberNameRequired"),true);return;}
 const phone=val("phone"),email=val("email");let savedMember=null;
 if(state.modal&&state.modal.id){
  const m=mBy(state.modal.id);if(m){m.name=name;m.phone=phone;m.email=email;savedMember=m;}
 }else{
  if(state.liveWorkspace){toast(t("noSlots"),true);return;}
  if(state.members.filter(m=>m.status!=="removed").length>=state.chit.memberCount){toast(t("noSlots"),true);return;}
  const next=Math.max(0,...state.members.map(m=>Number(m.id.replace(/\D/g,""))||0))+1;
  savedMember={id:"m"+next,name:name,phone:phone,email:email,status:"active",wonMonths:[]};
  state.members.push(savedMember);
 }
 if(!state.previewMemberId&&savedMember)state.previewMemberId=savedMember.id;
 state.modal=null;
 if(state.liveWorkspace&&savedMember&&state.dbChitId){
  const chitId=state.dbChitId;
  persistAndReload(async()=>{const id=await window.AuctionChitBackend.saveMember(chitId,savedMember);savedMember.dbId=id;savedMember.id=id;});
  return;
 }
 toast(t("saved"));
}
function removeMember(id){
 const m=mBy(id);if(!m||m.status==="removed")return;
 if(!window.confirm(t("removeConfirm")))return;
 m.status="removed";
 if(state.liveWorkspace&&state.dbChitId){
  const chitId=state.dbChitId;
  persistAndReload(()=>window.AuctionChitBackend.saveMember(chitId,m));
  return;
 }
 toast(t("saved"));
}
function bidSubmit(){
 const c=currentCycle();if(!c||c.status==="completed"){toast(t("cycleLocked"),true);return;}
 const id=state.previewMemberId,m=mBy(id);if(!m||m.status==="removed"||hasWon(id)){toast(t("winnerCannotBid"),true);return;}
 const input=document.getElementById("memberBidAmount"),amount=parseMoney(input?input.value:"");
 if(amount<floorPrice(c.monthNo)){toast(t("bidTooLow"),true);return;}
 if(amount>state.chit.potPaise){toast(t("bidTooHigh"),true);return;}
 const win=currentWindow(c);if(Date.now()<win.start.getTime()||Date.now()>win.end.getTime()){toast(t("cycleLocked"),true);return;}
 if(state.liveWorkspace){const cycleId=c.dbId;persistAndReload(()=>window.AuctionChitBackend.placeBid(cycleId,amount));return;}
 let bid=currentBidFor(id,c.monthNo);
 if(bid){bid.amountPaise=amount;bid.status="submitted";bid.createdAt=nowISO();bid.approvedAt=null;}
 else{bid={id:"b"+(Math.max(0,...state.bids.map(b=>Number(b.id.replace(/\D/g,""))||0))+1),memberId:id,cycleNo:c.monthNo,amountPaise:amount,status:"submitted",createdAt:nowISO(),approvedAt:null};state.bids.push(bid);}
 toast(t("bidSubmitted"));
}
function approveBid(id,approve){
 const b=state.bids.find(x=>x.id===id);if(!b)return;
 if(state.liveWorkspace){persistAndReload(()=>window.AuctionChitBackend.approveBid(b.dbId||b.id,approve));return;}
 b.status=approve?"approved":"rejected";b.approvedAt=approve?nowISO():null;toast(approve?t("bidApproved"):t("bidRejected"));
}
function finalizeWinner(manual){
 const c=currentCycle();if(!c){if(manual)toast(t("cycleLocked"),true);return false;}
 if(state.liveWorkspace){if(state.role!=="organizer"){if(manual)toast(t("memberOnly"),true);return false;}if(timerData(c).status!=="closed"){if(manual)toast(t("cycleLocked"),true);return false;}const cycleId=c.dbId;persistAndReload(()=>window.AuctionChitBackend.declareWinner(cycleId));return true;}
 const b=lowestBid(c);if(!b){if(manual)toast(t("needApprovedBid"),true);return false;}
 if(manual&&!window.confirm(t("winnerConfirm")))return false;
 const m=mBy(b.memberId);if(!m){if(manual)toast(t("noRows"),true);return false;}
 const discount=state.chit.potPaise-b.amountPaise,commission=commissionAmount();
 if(discount<commission){if(manual)toast(t("validationCommission"),true);return false;}
 const provisional={...c,status:"open",winnerId:m.id,winningBidPaise:b.amountPaise,prizePaise:b.amountPaise,discountPaise:discount,commissionPaise:commission};
 const calc=cycleCalc(provisional,b),due=iso(dueDate(c));
 Object.assign(c,{status:"completed",winnerId:m.id,winningBidPaise:b.amountPaise,prizePaise:b.amountPaise,discountPaise:discount,commissionPaise:commission,dividendPoolPaise:calc.dividendPoolPaise,dividendPerHeadPaise:calc.dividendPerHeadPaise,leftoverPaise:calc.leftoverPaise,eligibleIds:calc.eligibleIds,dividends:calc.dividends,due:calc.due,completedAt:nowISO(),baseContributionPaise:baseContribution(),dividendRule:state.chit.dividendRule,commissionPct:state.chit.commissionPct,lateFinePerDayPaise:state.chit.lateFinePerDayPaise,dueDate:due,autoDeclared:!manual});
 b.status="winner";m.status="winner";m.wonMonths=m.wonMonths||[];if(!m.wonMonths.includes(c.monthNo))m.wonMonths.push(c.monthNo);
 state.dividendHistory=state.dividendHistory.filter(h=>h.cycleNo!==c.monthNo);
 calc.eligibleIds.forEach(id=>state.dividendHistory.push({cycleNo:c.monthNo,memberId:id,amountPaise:calc.dividendPerHeadPaise}));
 const next=state.cycles.find(x=>x.monthNo===c.monthNo+1);if(next&&next.status==="upcoming")next.status="open";
 if(manual){state.page="cycles";toast(t("winnerDeclared"));}else{state.page="dashboard";toast(t("winnerDeclared"));}
 return true;
}
function declareWinner(){return finalizeWinner(true);}
function markPayment(id,kind){
 const c=state.cycles.find(x=>x.monthNo===Number(state.selectedPaymentMonth))||currentCycle();if(!c)return;const m=mBy(id),d=paymentDue(m,c),p=d.payment;let amount=0;
 if(kind==="paid")amount=d.remaining;
 else{const answer=window.prompt(t("amountReceived")+" ("+money(d.remaining)+")",(d.remaining/100).toFixed(2));if(answer===null)return;amount=parseMoney(answer);if(amount<=0||amount>=d.remaining){toast(t("validationPot"),true);return;}}
 if(amount<=0){toast(t("saved"));return;}
 if(state.liveWorkspace){
  const cycleId=c.dbId,mode=p.mode||"cash";
  persistAndReload(()=>window.AuctionChitBackend.recordPayment(cycleId,id,amount,mode));
  return;
 }
 p.paidPaise+=amount;p.status=p.paidPaise>=d.base?"paid":"partial";p.paidAt=nowISO();p.mode=p.mode||"upi";
 p.history.push({type:"payment",amountPaise:amount,date:p.paidAt,mode:p.mode,ref:"DEMO-"+c.monthNo+"-"+id+"-"+(p.history.length+1)});
 toast(t("paymentSaved"));
}
function reversePayment(id){
 const c=state.cycles.find(x=>x.monthNo===Number(state.selectedPaymentMonth))||currentCycle();if(!c)return;const p=paymentFor(id,c.monthNo);if(p.paidPaise<=0)return;
 if(!window.confirm(t("reverseConfirm")))return;
 if(state.liveWorkspace){
  const ids=(p.entries||[]).filter(entry=>entry.type==="payment"&&entry.status==="confirmed"&&!entry.alreadyReversed).map(entry=>entry.dbId);
  if(!ids.length){toast(t("reverseConfirm"),true);return;}
  persistAndReload(async()=>{for(const paymentId of ids)await window.AuctionChitBackend.reversePayment(paymentId);});
  return;
 }
 const amount=p.paidPaise;p.history.push({type:"reversal",amountPaise:amount,date:nowISO(),mode:p.mode,ref:"REV-"+c.monthNo+"-"+id+"-"+(p.history.length+1)});p.paidPaise=0;p.status="pending";p.paidAt="";
 toast(t("reversalSaved"));
}
function generateQr(id){
 const m=mBy(id||state.previewMemberId),c=state.cycles.find(x=>x.monthNo===Number(state.selectedPaymentMonth))||currentCycle();if(!m||!c)return;
 const d=paymentDue(m,c);
 const box=document.getElementById("qrBox"),image=document.getElementById("qrImage");
 if(!state.chit.upiId){if(box)box.textContent=t("qrNotConfigured");return;}
 const vpa=state.chit.upiId.trim();
 if(!/^[A-Za-z0-9._-]+@[A-Za-z0-9]+$/.test(vpa)){toast(t("qrNotConfigured"),true);return;}
 const uri="upi://pay?pa="+encodeURIComponent(vpa)+"&pn="+encodeURIComponent(state.chit.name)+"&am="+(d.remaining+d.fine)/100+"&cu=INR&tn="+encodeURIComponent("Chit "+cycleName(c)+" "+m.name);
 if(box)box.textContent=t("qrDisclaimer");
 if(image){image.innerHTML='<div class="info" style="display:flex;gap:12px;align-items:center;flex-wrap:wrap"><canvas id="qrCanvas" width="190" height="190" style="max-width:190px"></canvas><div><strong>'+esc(m.name)+'</strong><p>'+esc(t("amountDue"))+': '+money(d.remaining+d.fine)+'</p><a class="btn primary" href="'+esc(uri)+'">'+esc(t("generateQR"))+'</a><p class="hint">'+esc(t("modeDemo"))+'</p></div></div>';}
 if(window.QRCode&&image){window.QRCode.toCanvas(document.getElementById("qrCanvas"),uri,{width:190,margin:1},function(err){if(err)toast(t("qrNotConfigured"),true);});}
}
function csvCell(v){let s=String(v==null?"":v);return /[",\r\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function exportCsv(){
 const rows=[[t("monthNo"),t("month"),t("member"),t("status"),t("financialPosition"),t("bid"),t("prize"),t("discount"),t("commission"),t("dividend"),t("amountPaid"),t("profitLoss"),t("paidDate"),t("paymentMode")]];
 state.cycles.forEach(c=>state.members.forEach(m=>{
  const p=paymentFor(m.id,c.monthNo),tot=memberTotals(m),dv=state.dividendHistory.filter(h=>h.cycleNo===c.monthNo&&h.memberId===m.id).reduce((s,h)=>s+h.amountPaise,0);
  const b=state.bids.find(x=>x.cycleNo===c.monthNo&&x.memberId===m.id);
  rows.push([c.monthNo,cycleName(c),m.name,sLabel(m.status),financialPosition(m),b?(b.amountPaise/100).toFixed(2):"",c.winnerId===m.id?(c.prizePaise/100).toFixed(2):"",c.status==="completed"?(c.discountPaise/100).toFixed(2):"",c.status==="completed"?(c.commissionPaise/100).toFixed(2):"", (dv/100).toFixed(2),(p.paidPaise/100).toFixed(2),(tot.profitLoss/100).toFixed(2),p.paidAt||"",p.mode]);
 }));
 const blob=new Blob(["\uFEFF"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="auction-chit-ledger-"+today()+".csv";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1300);toast(t("exportExcel"));
}
root.addEventListener("click",function(e){
 const el=e.target.closest("[data-action],[data-page],[data-rule-cmd]");
 if(!el)return;
 if(el.hasAttribute("data-page")){state.page=el.getAttribute("data-page");state.modal=null;render();return;}
 const a=el.getAttribute("data-action");
 if(a==="toggle-lang"){state.lang=state.lang==="en"?"te":"en";render();return;}
 if(a==="sign-in"){
  const backend=window.AuctionChitBackend;if(!backend||!backend.configured()){toast(t("backendSetupMissing"),true);return;}
  backend.signInGoogle().catch(error=>toast(error.message||String(error),true));return;
 }
 if(a==="sign-out"){
  const backend=window.AuctionChitBackend;
  if(!backend){state.authUser=null;state.liveWorkspace=false;state.dbChitId=null;render();return;}
  backend.signOut().then(()=>{const lang=state.lang;state=blankState();state.lang=lang;state.backendConfigured=backend.configured();state.authUser=null;state.availableChits=[];state.dbChitId=null;state.liveWorkspace=false;render();}).catch(error=>toast(error.message||String(error),true));return;
 }
 if(a==="create-live-chit"){createLiveChit();return;}
 if(a==="invite-member"){
  if(!state.liveWorkspace||!state.dbChitId){toast(t("backendSetupMissing"),true);return;}
  const inviteUrl=window.location.origin+window.location.pathname+"?chit="+encodeURIComponent(state.dbChitId);
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(inviteUrl).then(()=>toast(t("inviteLinkCopied"))).catch(()=>window.prompt(t("inviteMember"),inviteUrl));}
  else window.prompt(t("inviteMember"),inviteUrl);
  return;
 }
 if(a==="save-setup"){saveSetup();return;}
 if(a==="add-member"){openMember(null);return;}
 if(a==="edit-member"){openMember(el.getAttribute("data-id"));return;}
 if(a==="remove-member"){removeMember(el.getAttribute("data-id"));return;}
 if(a==="close-modal"){state.modal=null;render();return;}
 if(a==="modal-bg"&&e.target===el){state.modal=null;render();return;}
 if(a==="save-member"){saveMember();return;}
 if(a==="submit-bid"){bidSubmit();return;}
 if(a==="approve-bid"){approveBid(el.getAttribute("data-id"),true);return;}
 if(a==="reject-bid"){approveBid(el.getAttribute("data-id"),false);return;}
 if(a==="declare-winner"){declareWinner();return;}
 if(a==="payment-toggle"){if(el.checked)markPayment(el.getAttribute("data-id"),"paid");else reversePayment(el.getAttribute("data-id"));return;}
 if(a==="mark-paid"){markPayment(el.getAttribute("data-id"),"paid");return;}
 if(a==="mark-partial"){markPayment(el.getAttribute("data-id"),"partial");return;}
 if(a==="reverse-payment"){reversePayment(el.getAttribute("data-id"));return;}
 if(a==="show-qr"){generateQr(el.getAttribute("data-id"));return;}
 if(a==="view-document"){openPrivateDocument(el.getAttribute("data-path"));return;}
 if(a==="submit-payment-report"){
  const monthNo=Number(state.selectedPaymentMonth)||(currentCycle()&&currentCycle().monthNo),c=state.cycles.find(x=>x.monthNo===monthNo),m=mBy(state.previewMemberId);
  const amount=parseMoney((document.getElementById("reported-payment-amount")||{}).value||"");const mode=(document.getElementById("reported-payment-mode")||{}).value||"upi";const file=(document.getElementById("payment-screenshot")||{}).files?.[0];
  if(!state.liveWorkspace||!c||c.status!=="completed"){toast(t("cycleLocked"),true);return;}
  if(!m||!file||amount<=0){toast(t("screenshotRequired"),true);return;}
  const due=paymentDue(m,c);if(amount>due.remaining+due.fine){toast(t("validationPot"),true);return;}
  const chitId=state.dbChitId,cycleId=c.dbId,memberId=m.id;
  persistAndReload(async()=>{const path=await window.AuctionChitBackend.uploadPrivateFile(chitId,memberId,file);await window.AuctionChitBackend.submitPayment(cycleId,amount,mode,path);});return;
 }
 if(a==="confirm-payment-report"||a==="reject-payment-report"){
  const approve=a==="confirm-payment-report";persistAndReload(()=>window.AuctionChitBackend.confirmPayment(el.getAttribute("data-id"),approve));return;
 }
 if(a==="export-csv"){exportCsv();return;}
 if(a==="print-pdf"){window.print();return;}
 if(a==="save-rules"){const box=document.querySelector("[data-rule-content]");if(box)state.rulesHtml=sanitizeRules(box.innerHTML);if(state.liveWorkspace&&state.dbChitId){const id=state.dbChitId;persistAndReload(()=>window.AuctionChitBackend.saveChit(id,state.chit,state.rulesHtml));}else toast(t("rulesSaved"));return;}
 if(el.hasAttribute("data-rule-cmd")){document.execCommand(a,false,null);const box=document.querySelector("[data-rule-content]");if(box)state.rulesHtml=sanitizeRules(box.innerHTML);return;}
});
root.addEventListener("change",function(e){
 const el=e.target,a=el.getAttribute("data-action");
 if(a==="role-select"){state.role=el.value;render();return;}
 if(a==="switch-chit"){refreshLiveWorkspace(el.value);return;}
 if(a==="preview-member"){state.previewMemberId=el.value;render();return;}
 if(a==="payment-month"){state.selectedPaymentMonth=Number(el.value);render();return;}
 if(a==="payment-mode"){const c=state.cycles.find(x=>x.monthNo===Number(state.selectedPaymentMonth))||currentCycle();const p=paymentFor(el.getAttribute("data-id"),c.monthNo);p.mode=el.value;if(state.liveWorkspace){toast(t("saved"));return;}render();return;}
 if(a==="payment-toggle"){if(el.checked)markPayment(el.getAttribute("data-id"),"paid");else reversePayment(el.getAttribute("data-id"));return;}
 if(a==="upload-document"){const file=el.files&&el.files[0];if(!file)return;if(!state.liveWorkspace||!state.dbChitId){toast(t("noKycUpload"),true);return;}const member=mBy(el.getAttribute("data-id")),type=el.getAttribute("data-doc-type");if(!member){toast(t("noRows"),true);return;}const chitId=state.dbChitId;persistAndReload(async()=>{const path=await window.AuctionChitBackend.uploadPrivateFile(chitId,member.id,file);await window.AuctionChitBackend.saveMemberDocument(chitId,member.id,path,type);});return;}
});
root.addEventListener("input",function(e){
 const el=e.target;if(el.hasAttribute("data-rule-content"))state.rulesHtml=sanitizeRules(el.innerHTML);
});
function tick(){
 const c=currentCycle();if(!c)return;const d=timerData(c),el=document.getElementById("timerValue");if(el)el.textContent=d.text;
 if(state.liveWorkspace){if(d.status==="closed"&&Date.now()-(state.lastBackendRefresh||0)>30000){state.lastBackendRefresh=Date.now();refreshLiveWorkspace(state.dbChitId);}return;}
 if(d.status==="closed"&&c.status!=="completed"&&lowestBid(c)){finalizeWinner(false);return;}
 const bar=document.getElementById("timerProgress");if(bar)bar.style.width=(d.status==="closed"?100:d.status==="upcoming"?0:Math.max(2,Math.min(100,((Date.now()-d.start)/(d.end-d.start))*100)))+"%";
}
function selfCheck(){
 const original=state;
 const startDate=new Date(new Date().getFullYear(),new Date().getMonth()-3,1);
 state={
  lang:"en",role:"organizer",previewMemberId:"m5",page:"dashboard",
  chit:{name:"",potPaise:5000000,memberCount:10,startingFloorPaise:3000000,maxDiscountPct:40,commissionPct:5,dividendRule:"allMembers",startDate:iso(startDate),auctionStartDay:1,auctionEndDay:10,dueDay:10,lateFinePerDayPaise:5000,upiId:""},
  members:Array.from({length:10},(_,i)=>({id:"m"+(i+1),name:"Test Member "+(i+1),phone:"",email:"",status:"active",wonMonths:[]})),
  cycles:[{monthNo:1,status:"open",winnerId:null,winningBidPaise:null,prizePaise:0,discountPaise:0,commissionPaise:0,dividendPerHeadPaise:0,dividendPoolPaise:0}],
  bids:[{id:"test-bid",memberId:"m5",cycleNo:1,amountPaise:3750000,status:"approved",createdAt:new Date().toISOString()}],
  payments:[],dividendHistory:[],rulesHtml:"",modal:null,toast:null,selectedMonth:1,selectedPaymentMonth:1
 };
 console.assert(baseContribution()===500000,"Auction Chit Manager: ₹5,000 base contribution.");
 console.assert(floorPrice(1)===3000000,"Auction Chit Manager: month 1 starting floor should be ₹30,000.");
 console.assert(floorPrice(2)===3200000,"Auction Chit Manager: month 2 calculated floor should be ₹32,000.");
 console.assert(lowestBid(currentCycle()).amountPaise===3750000,"Auction Chit Manager: lowest approved bid should be ₹37,500.");
 const calc=cycleCalc(currentCycle(),lowestBid(currentCycle()));
 console.assert(calc.prizePaise===3750000&&calc.discountPaise===1250000,"Auction Chit Manager: prize ₹37,500 and discount ₹12,500.");
 console.assert(calc.commissionPaise===250000&&calc.dividendPoolPaise===1000000&&calc.dividendPerHeadPaise===100000,"Auction Chit Manager: commission ₹2,500, pool ₹10,000, dividend ₹1,000.");
 state=original;
}
render();selfCheck();setInterval(tick,1000);if(window.AuctionChitBackend&&window.AuctionChitBackend.configured())setTimeout(bootstrapBackend,0);
})();