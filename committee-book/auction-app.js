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
 const eligible=state.chit.dividendRule==="allMembers"?roster:roster.filter(m=>m.id!==(cycle.status==="completed"?cycle.winnerId:(bid?bid.memberId:null)));
 const divisor=eligible.length;
 const per=divisor?Math.floor(pool/divisor):0,leftover=pool-per*divisor;
 const dividends={};eligible.forEach(m=>dividends[m.id]=per);
 const due={};roster.forEach(m=>due[m.id]=Math.max(0,baseContribution()-(dividends[m.id]||0)));
 return {prizePaise:prize,discountPaise:discount,commissionPaise:commission,dividendPoolPaise:pool,dividendPerHeadPaise:per,eligibleIds:eligible.map(m=>m.id),dividends:dividends,due:due,leftoverPaise:leftover,monthlyCollectionPaise:baseContribution()*Number(state.chit.memberCount)};
}
function cycleName(c){const d=new Date(state.chit.startDate+"T00:00:00");d.setMonth(d.getMonth()+c.monthNo-1);return new Intl.DateTimeFormat(state.lang==="te"?"te-IN":"en-IN",{month:"short",year:"numeric"}).format(d);}
function seedDemo(){
 const n=new Date(),start=new Date(n.getFullYear(),n.getMonth()-3,1);
 const chit={name:"Srinivasa Auction Chit",potPaise:5000000,memberCount:10,startingFloorPaise:3000000,maxDiscountPct:40,commissionPct:5,dividendRule:"allMembers",startDate:iso(start),auctionStartDay:1,auctionEndDay:10,dueDay:10,lateFinePerDayPaise:5000,upiId:""};
 const members=[
  {id:"m1",name:"Ravi Kumar",phone:"9876500001",email:"ravi@example.com",status:"winner",wonMonths:[1]},
  {id:"m2",name:"Lakshmi Devi",phone:"9876500002",email:"lakshmi@example.com",status:"winner",wonMonths:[2]},
  {id:"m3",name:"Suresh Reddy",phone:"9876500003",email:"suresh@example.com",status:"winner",wonMonths:[3]},
  {id:"m4",name:"Anitha Rao",phone:"9876500004",email:"anitha@example.com",status:"active",wonMonths:[]},
  {id:"m5",name:"Kiran Kumar",phone:"9876500005",email:"kiran@example.com",status:"active",wonMonths:[]},
  {id:"m6",name:"Priya Sharma",phone:"9876500006",email:"priya@example.com",status:"active",wonMonths:[]},
  {id:"m7",name:"Mahesh Babu",phone:"9876500007",email:"mahesh@example.com",status:"active",wonMonths:[]},
  {id:"m8",name:"Swathi Rani",phone:"9876500008",email:"swathi@example.com",status:"active",wonMonths:[]},
  {id:"m9",name:"Naveen Kumar",phone:"9876500009",email:"naveen@example.com",status:"active",wonMonths:[]},
  {id:"m10",name:"Deepa Lakshmi",phone:"9876500010",email:"deepa@example.com",status:"active",wonMonths:[]}
 ];
 const cycles=[];
 const outcomes=[
  {bid:3500000,discount:1500000,commission:250000,per:125000},
  {bid:3600000,discount:1400000,commission:250000,per:115000},
  {bid:3800000,discount:1200000,commission:250000,per:95000}
 ];
 for(let i=1;i<=10;i++){
  const o=outcomes[i-1];
  cycles.push({monthNo:i,status:i<=3?"completed":i===4?"open":"upcoming",winnerId:i<=3?"m"+i:null,winningBidPaise:o?o.bid:null,prizePaise:o?o.bid:0,discountPaise:o?o.discount:0,commissionPaise:o?o.commission:0,dividendPerHeadPaise:o?o.per:0,dividendPoolPaise:o?o.discount-o.commission:0,completedAt:o?new Date(start.getFullYear(),start.getMonth()+i-1,8,12).toISOString():null});
 }
 const bids=[],d=new Date();
 const makeBid=(id,amount,status,ago)=>({id:"b"+(bids.length+1),memberId:id,cycleNo:4,amountPaise:amount,status:status,createdAt:new Date(d.getTime()-ago*60000).toISOString(),approvedAt:status==="approved"?new Date(d.getTime()-(ago-2)*60000).toISOString():null});
 bids.push(makeBid("m5",3750000,"approved",72));
 bids.push(makeBid("m6",3800000,"submitted",61));
 bids.push(makeBid("m7",3750000,"approved",49));
 bids.push(makeBid("m8",3950000,"submitted",37));
 bids.push(makeBid("m9",3875000,"approved",28));
 bids.push(makeBid("m10",3900000,"rejected",20));
 const payments=[];
 const statuses=[
  ["paid","paid","paid","paid","paid","partial","paid","paid","paid","pending"],
  ["paid","paid","paid","partial","paid","paid","pending","paid","paid","paid"],
  ["paid","paid","paid","paid","pending","paid","paid","partial","paid","paid"],
  ["paid","paid","partial","pending","pending","pending","pending","pending","pending","pending"]
 ];
 const dueByMonth=[375000,385000,405000,400000];
 for(let mo=1;mo<=4;mo++){
  statuses[mo-1].forEach((s,i)=>{
   const due=dueByMonth[mo-1],paid=s==="paid"?due:s==="partial"?Math.floor(due*.42):0;
   const pd=paid?new Date(d.getTime()-(i+mo+1)*3600000).toISOString():"";
   payments.push({id:"p"+mo+"-"+(i+1),memberId:members[i].id,cycleNo:mo,paidPaise:paid,status:s,mode:i%2?"cash":"upi",paidAt:pd,screenshotName:"",history:paid?[{type:"payment",amountPaise:paid,date:pd,mode:i%2?"cash":"upi",ref:"DEMO-"+mo+"-"+(i+1)}]:[]});
  });
 }
 const dividendHistory=[];
 cycles.filter(c=>c.status==="completed").forEach(c=>{
  const o=outcomes[c.monthNo-1];
  members.forEach(m=>{if(stateDummyDividendEligible(chit,m,c.winnerId))dividendHistory.push({cycleNo:c.monthNo,memberId:m.id,amountPaise:o.per});});
 });
 const rulesHtml="<h3>Chit and auction rules</h3><ul><li>Only active, eligible members who have not received a prize may submit bids for a new auction cycle.</li><li>Each valid bid must be at or above the calculated floor price and no higher than the total chit pot.</li><li>The lowest approved valid bid wins. If bid values tie, the earliest submitted bid wins.</li><li>Foreman commission is calculated from the pot. The remaining eligible discount amount is distributed as dividend using the selected rule.</li><li>Payment changes and corrections must be recorded transparently. A correction is a reversal entry; original history should not be deleted.</li><li>Organizer must ensure that the chit operation and its terms comply with applicable registration and legal requirements.</li></ul>";
 return {lang:"en",role:"organizer",previewMemberId:"m5",page:"dashboard",chit:chit,members:members,cycles:cycles,bids:bids,payments:payments,dividendHistory:dividendHistory,rulesHtml:rulesHtml,modal:null,toast:null,selectedMonth:4};
}
function stateDummyDividendEligible(chit,m,winnerId){return chit.dividendRule==="allMembers"||m.id!==winnerId;}
let state=seedDemo();
function paymentFor(memberId,cycleNo){
 let p=state.payments.find(x=>x.memberId===memberId&&x.cycleNo===Number(cycleNo));
 if(!p){p={id:"p"+cycleNo+"-"+memberId,memberId:memberId,cycleNo:Number(cycleNo),paidPaise:0,status:"pending",mode:"upi",paidAt:"",screenshotName:"",history:[]};state.payments.push(p);}
 return p;
}
function currentBidFor(memberId,cycleNo){return state.bids.find(b=>b.memberId===memberId&&b.cycleNo===Number(cycleNo)&&b.status!=="rejected")||null;}
function memberTotals(m){
 let paid=0,div=0,prize=0;
 state.payments.filter(p=>p.memberId===m.id).forEach(p=>{paid+=p.history.reduce((sum,h)=>sum+(h.type==="reversal"?-h.amountPaise:h.amountPaise),0);});
 state.dividendHistory.filter(h=>h.memberId===m.id).forEach(h=>div+=h.amountPaise||0);
 state.cycles.filter(c=>c.status==="completed"&&c.winnerId===m.id).forEach(c=>prize+=c.prizePaise||0);
 return {paid:paid,dividend:div,prize:prize,profitLoss:prize+div-paid};
}
function paymentDue(m,c){
 const bid=c.status==="completed"?null:lowestBid(c);
 const calc=cycleCalc(c,bid);
 const base=c.status==="completed"?(calc.due[m.id]||baseContribution()):(calc.due[m.id]||baseContribution());
 const p=paymentFor(m.id,c.monthNo),paid=Math.max(0,p.paidPaise||0);
 const fine=paid<base?Math.max(0,daysLate(c))*Math.max(0,state.chit.lateFinePerDayPaise):0;
 const remaining=Math.max(0,base+fine-paid);
 return {base:base,paid:paid,remaining:remaining,fine:fine,payment:p,calc:calc};
}
function sLabel(s){return ({paid:t("paid"),due:t("due"),partial:t("partial"),pending:t("pending"),approved:t("approved"),rejected:t("rejected"),submitted:t("submitted"),completed:t("completed"),upcoming:t("upcoming"),removed:t("removed"),active:t("active"),winner:t("winner")})[s]||s;}
function badge(s){const cl=({paid:"green",active:"green",approved:"green",completed:"green",winner:"blue",due:"red",rejected:"red",pending:"amber",partial:"amber",submitted:"amber",upcoming:"gray",removed:"gray"})[s]||"gray";return '<span class="badge '+cl+'">'+esc(sLabel(s))+'</span>';}
function memberCell(m){return '<div class="member-cell"><span class="avatar">'+esc(m.name.trim().split(/\s+/).slice(0,2).map(s=>s.charAt(0)).join("").toUpperCase())+'</span><span><span class="member-name">'+esc(m.name)+'</span><span class="member-meta">'+esc(m.phone||m.email||"")+'</span></span></div>';}
function heading(title,desc,actions){return '<section class="page-heading"><div><h1>'+esc(title)+'</h1><p>'+esc(desc||"")+'</p></div><div class="heading-actions">'+(actions||"")+'</div></section>';}
function banner(){return '<div class="demo-banner"><span class="banner-icon">i</span><div><strong>'+esc(t("demoNotice"))+'</strong><span>'+esc(t("demoText"))+'</span><div style="margin-top:5px;font-weight:800">'+esc(t("privacyNotice"))+'</div></div></div>';}
function nav(){
 const items=["dashboard","setup","members","auction","cycles","payments","rules","reports"],icons={dashboard:"▦",setup:"⚙",members:"♙",auction:"↗",cycles:"◷",payments:"₹",rules:"≡",reports:"▤"};
 return '<aside class="sidebar"><div class="side-label">'+esc(t("brand"))+'</div><nav class="nav-list">'+items.map(k=>'<button class="nav-item '+(state.page===k?"active":"")+'" data-page="'+k+'"><span class="nav-icon">'+icons[k]+'</span>'+esc(t(k))+'</button>').join("")+'</nav><div class="sidebar-note"><strong>'+esc(t("copyPreview"))+'</strong>'+esc(t("membersHelp"))+'</div></aside>';
}
function header(){
 const role='<div class="role-preview"><label for="role-select" style="font-size:9px;font-weight:900;color:var(--muted)">'+esc(t("rolePreview"))+'</label><select id="role-select" data-action="role-select"><option value="organizer" '+(state.role==="organizer"?"selected":"")+'>'+esc(t("organizerMode"))+'</option><option value="member" '+(state.role==="member"?"selected":"")+'>'+esc(t("memberMode"))+'</option></select></div>';
 return '<header class="header"><div class="header-inner"><a class="brand" href="committee-book.html"><span class="brand-mark">C</span><span><span class="brand-name">'+esc(t("brand"))+'</span><span class="brand-sub">'+esc(t("templateTag"))+' · '+esc(t("templateName"))+'</span></span></a><div class="header-actions">'+role+'<button class="lang-btn" data-action="toggle-lang">文 A · '+esc(t("language"))+'</button><button class="top-btn" data-action="sign-in">↗ '+esc(t("signIn"))+'</button><button class="top-btn" data-action="reset-demo">↻ '+esc(t("resetDemo"))+'</button></div></div></header>';
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
 return heading(t("dashboard"),t("subtitle"),'<button class="btn" data-page="reports">▤ '+esc(t("reports"))+'</button><button class="btn primary" data-page="auction">↗ '+esc(t("auction"))+'</button>')+banner()+cards+'<div class="grid2"><div>'+auctionPanel+historyPanel+paymentPanel+'</div><div>'+calcPanel+pendingPanel+'</div></div>';
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
 const field=(key,label,val,type,attrs,help)=>'<div class="field"><label for="f-'+key+'">'+esc(label)+'</label><input id="f-'+key+'" data-field="'+key+'" type="'+type+'" value="'+esc(val==null?"":val)+'" '+(attrs||"")+'>'+(help?'<div class="hint">'+esc(help)+'</div>':"")+'</div>';
 const select=(key,label,val,opts)=>'<div class="field"><label for="f-'+key+'">'+esc(label)+'</label><select id="f-'+key+'" data-field="'+key+'">'+opts.map(o=>'<option value="'+esc(o[0])+'" '+(o[0]===val?"selected":"")+'>'+esc(o[1])+'</option>').join("")+'</select></div>';
 const calc=floorPrice(currentCycle()?currentCycle().monthNo:1);
 return heading(t("setup"),t("editNotFormula"))+banner()+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("chitSetup"))+'</h2><p>'+esc(t("lockedFields"))+'</p></div><span class="lock">⚙ '+esc(t("edit"))+'</span></div><div class="panel-body"><div class="form-grid">'+
 field("name",t("chitName"),c.name,"text","required")+
 field("pot",t("potAmount"),(c.potPaise/100).toFixed(2),"number",'min="1" step="0.01"')+
 field("memberCount",t("numberMembers"),c.memberCount,"number",'min="2" step="1"')+
 field("contribution",t("monthlyContribution"),(baseContribution()/100).toFixed(2),"text",'disabled',t("editNotFormula"))+
 field("startingFloor",t("baseFloor"),(c.startingFloorPaise/100).toFixed(2),"number",'min="0.01" step="0.01"')+
 field("maxDiscountPct",t("maxDiscountCap"),c.maxDiscountPct,"number",'min="0" max="100" step="0.01"')+
 field("commissionPct",t("commissionPercent"),c.commissionPct,"number",'min="0" max="100" step="0.01"')+
 select("dividendRule",t("dividendRule"),c.dividendRule,[["allMembers",t("allMembersRule")],["nonWinners",t("nonWinnersRule")]])+
 field("startDate",t("startDate"),c.startDate,"date","required")+
 field("auctionStartDay",t("windowStart"),c.auctionStartDay,"number",'min="1" max="31" step="1"')+
 field("auctionEndDay",t("windowEnd"),c.auctionEndDay,"number",'min="1" max="31" step="1"')+
 field("dueDay",t("paidDate"),c.dueDay,"number",'min="1" max="31" step="1"')+
 field("lateFine",t("lateFine"),(c.lateFinePerDayPaise/100).toFixed(2),"number",'min="0" step="0.01"')+
 field("upiId",t("upiId"),c.upiId,"text",'placeholder="organizer@upi"')+
 '<div class="field span2"><label>'+esc(t("rulesText"))+'</label>'+rulesEditor(false)+'</div>'+
 '</div><div class="form-actions"><span class="hint">'+esc(t("lockedFields"))+'</span><button class="btn primary" data-action="save-setup">✓ '+esc(t("saveChanges"))+'</button></div></div></div>'+
 '<div class="panel"><div class="panel-head"><div><h2>'+esc(t("floorLogic"))+'</h2><p>'+esc(t("floorLogicHelp"))+'</p></div></div><div class="panel-body"><div class="calc-grid">'+calcCard(t("baseFloor"),money(c.startingFloorPaise),t("baseFloor"))+calcCard(t("maxDiscountCap"),String(c.maxDiscountPct)+"%",t("floorFormula"))+calcCard(t("autoFloor"),money(calc),t("floorMonth")+" "+(currentCycle()?currentCycle().monthNo:1))+'</div><div class="info" style="margin-top:12px">'+esc(t("floorFormula"))+'</div></div></div>';
}
function membersView(){
 const rows=state.members.map((m,i)=>{const total=memberTotals(m);return '<tr><td>'+(i+1)+'</td><td>'+memberCell(m)+'</td><td>'+esc(m.phone||"—")+'</td><td>'+esc(m.email||"—")+'</td><td>'+badge(m.status)+'</td><td class="money">'+money(total.paid)+'</td><td class="money">'+money(total.dividend)+'</td><td class="money">'+money(total.profitLoss)+'</td><td><button class="btn small" disabled title="'+esc(t("noKycUpload"))+'">'+esc(t("kycDoc"))+' · '+esc(t("comingSoon"))+'</button></td><td>'+(state.role==="organizer"?'<div class="row-actions"><button class="btn small" data-action="edit-member" data-id="'+m.id+'">'+esc(t("edit"))+'</button><button class="btn small danger" data-action="remove-member" data-id="'+m.id+'" '+(m.status==="removed"?"disabled":"")+'>'+esc(t("removeMember"))+'</button></div>':"—")+'</td></tr>';}).join("");
 return heading(t("members"),t("membersHelp"),state.role==="organizer"?'<button class="btn primary" data-action="add-member">＋ '+esc(t("addMember"))+'</button>':"")+banner()+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("membersTable"))+' · '+state.members.length+'</h2><p>'+esc(t("membersHelp"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("serialNo"))+'</th><th>'+esc(t("member"))+'</th><th>'+esc(t("phone"))+'</th><th>'+esc(t("email"))+'</th><th>'+esc(t("status"))+'</th><th>'+esc(t("totalPaid"))+'</th><th>'+esc(t("totalDividend"))+'</th><th>'+esc(t("netPL"))+'</th><th>'+esc(t("kycDoc"))+'</th><th>'+esc(t("action"))+'</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div><div class="info">'+esc(t("privacyNotice"))+'</div>';
}
function auctionView(){
 const c=currentCycle();if(!c)return heading(t("auction"),t("noHistory"));
 const mine=currentBidFor(state.previewMemberId,c.monthNo),member=mBy(state.previewMemberId),eligible=activeMembers().filter(m=>!hasWon(m.id));
 const choices=eligible.map(m=>'<option value="'+m.id+'" '+(state.previewMemberId===m.id?"selected":"")+'>'+esc(m.name)+'</option>').join("");
 const bidEntry='<div class="bid-entry"><div class="field"><label for="memberBidAmount">'+esc(t("enterBid"))+'</label><input type="number" min="'+(floorPrice(c.monthNo)/100).toFixed(2)+'" max="'+(state.chit.potPaise/100).toFixed(2)+'" step="0.01" id="memberBidAmount" value="'+(mine?(mine.amountPaise/100).toFixed(2):(floorPrice(c.monthNo)/100).toFixed(2))+'"><div class="hint">'+esc(t("bidHint"))+'</div><div class="hint">'+esc(t("floorPrice"))+': '+money(floorPrice(c.monthNo))+' · '+esc(t("potAmount"))+': '+money(state.chit.potPaise)+'</div></div><button class="btn primary" data-action="submit-bid">'+esc(t("submitBid"))+'</button></div>';
 const roleSelector=state.role==="member"?'<div class="field" style="margin-bottom:13px"><label for="preview-member">'+esc(t("member"))+'</label><select id="preview-member" data-action="preview-member">'+eligible.map(m=>'<option value="'+m.id+'" '+(state.previewMemberId===m.id?"selected":"")+'>'+esc(m.name)+'</option>').join("")+'</select><div class="hint">'+esc(t("memberOnly"))+'</div></div>':"";
 const timer=timerData(c);
 return heading(t("auction"),t("liveAuctionHelp"),state.role==="organizer"?'<button class="btn primary" data-action="declare-winner" '+(!lowestBid(c)?"disabled":"")+'>'+esc(t("declareWinner"))+'</button>':"")+banner()+'<div class="grid2"><div><div class="panel"><div class="panel-head"><div><h2>'+esc(t("liveAuction"))+'</h2><p>'+esc(t("auctionWindow"))+' · '+esc(dateText(iso(timer.start)))+' – '+esc(dateText(iso(timer.end)))+'</p></div>'+badge(timer.status==="open"?"approved":timer.status==="upcoming"?"upcoming":"completed")+'</div><div class="panel-body">'+(state.role==="member"?roleSelector:"")+(state.role==="member"&&member&&member.status!=="removed"&&!hasWon(member.id)?bidEntry:'<div class="info">'+esc(state.role==="member"?(hasWon(state.previewMemberId)?t("winnerCannotBid"):t("memberOnly")):t("bidApprovalRequired"))+'</div>')+'<div class="table-wrap" style="margin-top:14px"><table><thead><tr><th>'+esc(t("bidder"))+'</th><th>'+esc(t("bidAmount"))+'</th><th>'+esc(t("bidTime"))+'</th><th>'+esc(t("isLowest"))+'</th><th>'+esc(t("status"))+'</th>'+(state.role==="organizer"?"<th>"+esc(t("action"))+"</th>":"")+'</tr></thead><tbody>'+bidRows(c,lowestBid(c))+'</tbody></table></div>'+ (state.role==="organizer"?'<div class="form-actions"><span class="hint">'+esc(t("lowestRule"))+'</span><button class="btn primary" data-action="declare-winner" '+(!lowestBid(c)?"disabled":"")+'>'+esc(t("declareWinner"))+'</button></div>':"")+'</div></div></div><div><div class="panel"><div class="panel-head"><div><h2>'+esc(t("auctionTimer"))+'</h2><p>'+esc(t("timeLeft"))+'</p></div></div><div class="panel-body"><div class="timer"><div class="timer-label">'+esc(t("auctionWindow"))+'</div><div class="timer-value" id="timerValue">'+esc(timer.text)+'</div><div class="timer-caption">'+esc(timer.status==="open"?t("timerOpen"):timer.status==="upcoming"?t("timerUpcoming"):t("timerClosed"))+'</div></div><div class="calc-grid" style="margin-top:12px">'+calcCard(t("floorPrice"),money(floorPrice(c.monthNo)),t("floorMonth")+" "+c.monthNo)+calcCard(t("lowestBid"),lowestBid(c)?money(lowestBid(c).amountPaise):t("noBid"),lowestBid(c)?mBy(lowestBid(c).memberId).name:t("noValidBids"))+calcCard(t("dividendPerHead"),money(cycleCalc(c,lowestBid(c)).dividendPerHeadPaise),t("eligibleMembers"))+'</div></div></div><div class="panel"><div class="panel-head"><div><h2>'+esc(t("calcSummary"))+'</h2><p>'+esc(t("lowestRule"))+'</p></div></div><div class="panel-body"><div class="calc-grid">'+calcCard(t("prize"),money(cycleCalc(c,lowestBid(c)).prizePaise),"")+calcCard(t("discount"),money(cycleCalc(c,lowestBid(c)).discountPaise),"")+calcCard(t("commission"),money(cycleCalc(c,lowestBid(c)).commissionPaise),String(state.chit.commissionPct)+"%")+calcCard(t("dividendPool"),money(cycleCalc(c,lowestBid(c)).dividendPoolPaise),"")+calcCard(t("roundingLeftover"),money(cycleCalc(c,lowestBid(c)).leftoverPaise),t("toForeman"))+'</div></div></div></div></div>';
}
function cyclesView(){
 const rows=state.cycles.map(c=>{const b=c.status==="completed"?null:lowestBid(c),calc=cycleCalc(c,b);return '<tr><td><strong>'+c.monthNo+'</strong></td><td>'+esc(cycleName(c))+'</td><td>'+esc(c.winnerId&&mBy(c.winnerId)?mBy(c.winnerId).name:b&&mBy(b.memberId)?mBy(b.memberId).name:"—")+'</td><td class="money">'+money(c.status==="completed"?c.prizePaise:calc.prizePaise)+'</td><td class="money">'+money(c.status==="completed"?c.discountPaise:calc.discountPaise)+'</td><td class="money">'+money(c.status==="completed"?c.commissionPaise:calc.commissionPaise)+'</td><td class="money">'+money(c.status==="completed"?c.dividendPerHeadPaise:calc.dividendPerHeadPaise)+'</td><td>'+badge(c.status)+'</td></tr>';}).join("");
 const c=currentCycle(),b=c?lowestBid(c):null,calc=c?cycleCalc(c,b):null;
 const complete=c&&state.role==="organizer"?'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("currentMonth"))+' · '+esc(cycleName(c))+'</h2><p>'+esc(t("declareAuto"))+'</p></div>'+badge(c.status)+'</div><div class="panel-body"><div class="calc-grid">'+calcCard(t("winner"),b?mBy(b.memberId).name:t("noValidBids"),"")+calcCard(t("prize"),money(calc.prizePaise),"")+calcCard(t("dividendPerHead"),money(calc.dividendPerHeadPaise),"")+'</div><div class="form-actions"><span class="hint">'+esc(t("editNotFormula"))+'</span><button class="btn primary" data-action="declare-winner" '+(!b?"disabled":"")+'>'+esc(t("completeMonth"))+'</button></div></div></div>':"";
 return heading(t("cycles"),t("auctionHistory"))+banner()+complete+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("monthLedger"))+'</h2><p>'+esc(t("floorLogic"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("monthNo"))+'</th><th>'+esc(t("month"))+'</th><th>'+esc(t("winner"))+'</th><th>'+esc(t("prize"))+'</th><th>'+esc(t("discount"))+'</th><th>'+esc(t("commission"))+'</th><th>'+esc(t("dividendPerHead"))+'</th><th>'+esc(t("status"))+'</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div>';
}
function paymentsView(){
 const c=currentCycle();if(!c)return heading(t("payments"),t("noHistory"));
 const scope=state.role==="member"?activeMembers().filter(m=>m.id===state.previewMemberId):activeMembers();
 const rows=scope.map((m,i)=>{
  const d=paymentDue(m,c),p=d.payment;
  const checked=d.remaining===0;
  const toggle='<label class="toggle"><input type="checkbox" data-action="payment-toggle" data-id="'+m.id+'" '+(checked?"checked":"")+(state.role!=="organizer"?" disabled":"")+'><span>'+esc(t(checked?"yes":"no"))+'</span></label>';
  const actions=state.role==="organizer"?(d.paid>0?'<button class="btn small danger" data-action="reverse-payment" data-id="'+m.id+'">'+esc(t("reversePayment"))+'</button>':'<button class="btn small primary" data-action="mark-paid" data-id="'+m.id+'">'+esc(t("markPaid"))+'</button> <button class="btn small" data-action="mark-partial" data-id="'+m.id+'">'+esc(t("markPartial"))+'</button>'):'<button class="btn small" data-action="show-qr" data-id="'+m.id+'">'+esc(t("generateQR"))+'</button>';
  return '<tr><td>'+(i+1)+'</td><td>'+memberCell(m)+'</td><td class="money">'+money(d.remaining+d.fine)+'</td><td>'+toggle+' '+badge(d.remaining===0?"paid":d.paid?"partial":"pending")+'</td><td>'+esc(p.paidAt?dtText(p.paidAt):"—")+'</td><td><select data-action="payment-mode" data-id="'+m.id+'" aria-label="'+esc(t("paymentMode"))+'"><option value="upi" '+(p.mode==="upi"?"selected":"")+'>'+esc(t("upi"))+'</option><option value="cash" '+(p.mode==="cash"?"selected":"")+'>'+esc(t("cash"))+'</option></select></td><td class="money">'+money(d.fine)+'</td><td><button class="btn small" disabled title="'+esc(t("noScreenshotUpload"))+'">'+esc(t("screenshot"))+' · '+esc(t("comingSoon"))+'</button></td><td>'+actions+'</td></tr>';
 }).join("");
 const qrSection='<div class="panel"><div class="panel-head"><div><h2>'+esc(t("qrTitle"))+'</h2><p>'+esc(t("qrDisclaimer"))+'</p></div><span class="badge amber">'+esc(t("modeDemo"))+'</span></div><div class="panel-body"><div id="qrBox" class="info">'+esc(state.chit.upiId?t("generateQR"):t("qrNotConfigured"))+'</div><div id="qrImage" style="margin-top:12px"></div></div></div>';
 const allHistory=state.payments.filter(p=>scope.some(m=>m.id===p.memberId)&&p.cycleNo===c.monthNo).map(p=>{const m=mBy(p.memberId);return (p.history||[]).map(h=>'<tr><td>'+esc(m?m.name:"—")+'</td><td>'+esc(h.type==="reversal"?t("reversePayment"):t("paid"))+'</td><td>'+esc(dtText(h.date))+'</td><td class="money">'+(h.type==="reversal"?"−":"")+money(h.amountPaise)+'</td><td>'+esc(h.mode==="cash"?t("cash"):t("upi"))+'</td><td>'+esc(h.ref||"—")+'</td></tr>').join("");}).join("");
 return heading(t("payments"),t("fineCalculated"))+banner()+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("paymentsTitle"))+'</h2><p>'+esc(t("currentMonth"))+' · '+esc(cycleName(c))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("serialNo"))+'</th><th>'+esc(t("member"))+'</th><th>'+esc(t("amountDue"))+'</th><th>'+esc(t("paidQuestion"))+'</th><th>'+esc(t("paidDate"))+'</th><th>'+esc(t("paymentMode"))+'</th><th>'+esc(t("lateFine"))+'</th><th>'+esc(t("screenshot"))+'</th><th>'+esc(t("action"))+'</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div>'+qrSection+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("memberStatement"))+'</h2><p>'+esc(t("reverseConfirm"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("member"))+'</th><th>'+esc(t("status"))+'</th><th>'+esc(t("date"))+'</th><th>'+esc(t("amount"))+'</th><th>'+esc(t("paymentMode"))+'</th><th>'+esc(t("reference"))+'</th></tr></thead><tbody>'+(allHistory||'<tr><td colspan="6" class="empty">'+esc(t("noRows"))+'</td></tr>')+'</tbody></table></div></div></div>';
}
function rulesEditor(){return '<div class="rule-editor"><div class="rule-toolbar"><button class="btn small" data-rule-cmd="bold" title="'+esc(t("bold"))+'"><b>B</b></button><button class="btn small" data-rule-cmd="italic" title="'+esc(t("italic"))+'"><i>I</i></button><button class="btn small" data-rule-cmd="insertUnorderedList" title="'+esc(t("bullets"))+'">•</button></div><div class="rule-content" data-rule-content contenteditable="true" spellcheck="true" data-placeholder="'+esc(t("rulePlaceholder"))+'">'+sanitizeRules(state.rulesHtml)+'</div></div>';}
function sanitizeRules(html){const doc=new DOMParser().parseFromString(String(html||""),"text/html");const allowed=["P","BR","STRONG","B","EM","I","U","UL","OL","LI","H2","H3"];Array.from(doc.body.querySelectorAll("*")).forEach(el=>{if(!allowed.includes(el.tagName)){el.replaceWith(doc.createTextNode(el.textContent||""));return;}Array.from(el.attributes).forEach(a=>el.removeAttribute(a.name));});return doc.body.innerHTML;}
function rulesView(){
 const c=currentCycle(),calc=c?cycleCalc(c,lowestBid(c)):null;
 return heading(t("ruleTitle"),t("editRules"),state.role==="organizer"?'<button class="btn primary" data-action="save-rules">'+esc(t("saveRules"))+'</button>':"")+banner()+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("rulesText"))+'</h2><p>'+esc(t("editRules"))+'</p></div></div><div class="panel-body">'+(state.role==="organizer"?rulesEditor():'<div class="rule-content">'+sanitizeRules(state.rulesHtml)+'</div>')+'</div></div><div class="panel"><div class="panel-head"><div><h2>'+esc(t("calcSummary"))+'</h2><p>'+esc(t("lowestRule"))+'</p></div></div><div class="panel-body"><div class="calc-grid">'+calcCard(t("baseContribution"),money(baseContribution()),t("potAmount")+" ÷ "+t("numberMembers"))+calcCard(t("floorPrice"),money(c?floorPrice(c.monthNo):0),t("floorLogic"))+calcCard(t("commission"),money(commissionAmount()),String(state.chit.commissionPct)+"%")+calcCard(t("dividendPool"),money(calc?calc.dividendPoolPaise:0),"")+calcCard(t("dividendPerHead"),money(calc?calc.dividendPerHeadPaise:0),t("eligibleMembers"))+calcCard(t("roundingLeftover"),money(calc?calc.leftoverPaise:0),t("toForeman"))+'</div><div class="info" style="margin-top:12px">'+esc(t("profitFormula"))+'</div></div></div>';
}
function reportsView(){
 const mrows=state.members.map(m=>{const v=memberTotals(m);return '<tr><td>'+memberCell(m)+'</td><td>'+badge(m.status)+'</td><td class="money">'+money(v.paid)+'</td><td class="money">'+money(v.dividend)+'</td><td class="money">'+money(v.prize)+'</td><td class="money">'+money(v.profitLoss)+'</td></tr>';}).join("");
 const rows=state.cycles.map(c=>state.members.map(m=>{const p=paymentFor(m.id,c.monthNo),v=memberTotals(m);const d=paymentDue(m,c);const div=state.dividendHistory.filter(h=>h.cycleNo===c.monthNo&&h.memberId===m.id).reduce((s,h)=>s+h.amountPaise,0);return '<tr><td>'+c.monthNo+'</td><td>'+esc(cycleName(c))+'</td><td>'+esc(m.name)+'</td><td class="money">'+money(d.paid)+'</td><td class="money">'+money(div)+'</td><td class="money">'+money(m.id===c.winnerId?c.prizePaise:0)+'</td><td class="money">'+money(v.profitLoss)+'</td><td>'+badge(c.status)+'</td></tr>';}).join("")).join("");
 return heading(t("reportsTitle"),t("reportsHelp"),'<button class="btn" data-action="export-csv">⇩ '+esc(t("exportExcel"))+'</button><button class="btn primary" data-action="print-pdf">▤ '+esc(t("printPdf"))+'</button>')+banner()+'<div class="panel"><div class="panel-head"><div><h2>'+esc(t("fullLedger"))+'</h2><p>'+esc(t("memberStatement"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("member"))+'</th><th>'+esc(t("status"))+'</th><th>'+esc(t("totalPaid"))+'</th><th>'+esc(t("totalDividend"))+'</th><th>'+esc(t("prizeReceived"))+'</th><th>'+esc(t("netPL"))+'</th></tr></thead><tbody>'+mrows+'</tbody></table></div></div></div><div class="panel"><div class="panel-head"><div><h2>'+esc(t("monthLedger"))+'</h2><p>'+esc(t("profitLoss"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("monthNo"))+'</th><th>'+esc(t("period"))+'</th><th>'+esc(t("member"))+'</th><th>'+esc(t("amountPaid"))+'</th><th>'+esc(t("dividend"))+'</th><th>'+esc(t("prizeReceived"))+'</th><th>'+esc(t("netPL"))+'</th><th>'+esc(t("status"))+'</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div><div class="info">'+esc(t("profitFormula"))+'</div>';
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
 const roleText=state.role==="member"?t("memberMode"):t("organizerMode");
 root.innerHTML=header()+'<div class="shell">'+nav()+'<main class="main">'+pageContent()+'<footer class="footer">'+esc(t("footer"))+' · '+esc(t("supabaseMissing"))+'</footer></main></div>'+modalView()+'<div class="toast-area" id="toast-area">'+(state.toast?'<div class="toast '+(state.toast.error?"error":"")+'">'+esc(state.toast.message)+'</div>':"")+'</div>';
}
function toast(message,error){state.toast={message:message,error:!!error};render();clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>{state.toast=null;const el=document.getElementById("toast-area");if(el)el.innerHTML="";},2800);}
function saveSetup(){
 const $=k=>document.querySelector('[data-field="'+k+'"]');
 const val=k=>$ (k)?$ (k).value:"";
 const name=val("name").trim(),pot=parseMoney(val("pot")),members=Number(val("memberCount")),floor=parseMoney(val("startingFloor")),cap=Number(val("maxDiscountPct")),commission=Number(val("commissionPct")),start=val("startDate"),sday=Number(val("auctionStartDay")),eday=Number(val("auctionEndDay")),due=Number(val("dueDay")),fine=parseMoney(val("lateFine")),upi=val("upiId").trim();
 if(!name){toast(t("memberNameRequired"),true);return;}
 if(pot<=0){toast(t("validationPot"),true);return;}
 if(!Number.isInteger(members)||members<2){toast(t("validationMembers"),true);return;}
 if(floor<=0||floor>pot){toast(t("validationFloor"),true);return;}
 if(!Number.isFinite(cap)||cap<0||cap>100){toast(t("validationDiscount"),true);return;}
 if(!Number.isFinite(commission)||commission<0||commission>100){toast(t("validationCommission"),true);return;}
 if(!Number.isInteger(sday)||!Number.isInteger(eday)||sday<1||sday>31||eday<sday||eday>31||due<1||due>31){toast(t("validationDates"),true);return;}
 const oldCount=state.chit.memberCount;
 state.chit={...state.chit,name:name,potPaise:pot,memberCount:members,startingFloorPaise:floor,maxDiscountPct:cap,commissionPct:commission,dividendRule:val("dividendRule"),startDate:start||state.chit.startDate,auctionStartDay:sday,auctionEndDay:eday,dueDay:due,lateFinePerDayPaise:fine,upiId:upi};
 const box=document.querySelector("[data-rule-content]");if(box)state.rulesHtml=sanitizeRules(box.innerHTML);
 if(members<oldCount)state.members.slice(members).forEach(m=>{m.status="removed";});
 while(state.members.length<members){const idx=state.members.length+1;state.members.push({id:"m"+idx,name:"Member "+String(idx).padStart(2,"0"),phone:"",email:"",status:"active",wonMonths:[]});}
 toast(t("saved"));
}
function openMember(id){state.modal={id:id||null};render();}
function saveMember(){
 const get=k=>document.querySelector('[data-modal="'+k+'"]');
 const val=k=>get(k)?get(k).value.trim():"";
 const name=val("name");if(!name){toast(t("memberNameRequired"),true);return;}
 const phone=val("phone"),email=val("email");
 if(state.modal&&state.modal.id){const m=mBy(state.modal.id);if(m){m.name=name;m.phone=phone;m.email=email;}}
 else{if(state.members.filter(m=>m.status!=="removed").length>=state.chit.memberCount){toast(t("noSlots"),true);return;}const next=Math.max(0,...state.members.map(m=>Number(m.id.replace(/\D/g,""))||0))+1;state.members.push({id:"m"+next,name:name,phone:phone,email:email,status:"active",wonMonths:[]});}
 state.modal=null;toast(t("saved"));
}
function removeMember(id){const m=mBy(id);if(!m||m.status==="removed")return;if(!window.confirm(t("removeConfirm")))return;m.status="removed";toast(t("saved"));}
function bidSubmit(){
 const c=currentCycle();if(!c||c.status==="completed"){toast(t("cycleLocked"),true);return;}
 const id=state.previewMemberId,m=mBy(id);if(!m||m.status==="removed"||hasWon(id)){toast(t("winnerCannotBid"),true);return;}
 const input=document.getElementById("memberBidAmount"),amount=parseMoney(input?input.value:"");
 if(amount<floorPrice(c.monthNo)){toast(t("bidTooLow"),true);return;}
 if(amount>state.chit.potPaise){toast(t("bidTooHigh"),true);return;}
 const win=currentWindow(c);if(Date.now()<win.start.getTime()||Date.now()>win.end.getTime()){toast(t("cycleLocked"),true);return;}
 let bid=currentBidFor(id,c.monthNo);
 if(bid){bid.amountPaise=amount;bid.status="submitted";bid.createdAt=nowISO();bid.approvedAt=null;}
 else{bid={id:"b"+(Math.max(0,...state.bids.map(b=>Number(b.id.replace(/\D/g,""))||0))+1),memberId:id,cycleNo:c.monthNo,amountPaise:amount,status:"submitted",createdAt:nowISO(),approvedAt:null};state.bids.push(bid);}
 toast(t("bidSubmitted"));
}
function approveBid(id,approve){
 const b=state.bids.find(x=>x.id===id);if(!b)return;
 b.status=approve?"approved":"rejected";b.approvedAt=approve?nowISO():null;toast(approve?t("bidApproved"):t("bidRejected"));
}
function declareWinner(){
 const c=currentCycle();if(!c){toast(t("cycleLocked"),true);return;}
 const b=lowestBid(c);if(!b){toast(t("needApprovedBid"),true);return;}
 if(!window.confirm(t("winnerConfirm")))return;
 const m=mBy(b.memberId);if(!m){toast(t("noRows"),true);return;}
 const discount=state.chit.potPaise-b.amountPaise,commission=commissionAmount();
 if(discount<commission){toast(t("validationCommission"),true);return;}
 const provisional={...c,status:"completed",winnerId:m.id,winningBidPaise:b.amountPaise,prizePaise:b.amountPaise,discountPaise:discount,commissionPaise:commission};
 const calc=cycleCalc(provisional,b);Object.assign(provisional,{dividendPoolPaise:calc.dividendPoolPaise,dividendPerHeadPaise:calc.dividendPerHeadPaise,leftoverPaise:calc.leftoverPaise,eligibleIds:calc.eligibleIds,dividends:calc.dividends,due:calc.due,completedAt:nowISO()});
 Object.assign(c,provisional);
 b.status="winner";
 m.status="winner";m.wonMonths=m.wonMonths||[];m.wonMonths.push(c.monthNo);
 state.dividendHistory=state.dividendHistory.filter(h=>h.cycleNo!==c.monthNo);
 calc.eligibleIds.forEach(id=>state.dividendHistory.push({cycleNo:c.monthNo,memberId:id,amountPaise:calc.dividendPerHeadPaise}));
 c.nextDue=calc.due;
 const next=state.cycles.find(x=>x.monthNo===c.monthNo+1);if(next&&next.status==="upcoming")next.status="open";
 state.page="cycles";toast(t("winnerDeclared"));
}
function markPayment(id,kind){
 const c=currentCycle();if(!c)return;const m=mBy(id),d=paymentDue(m,c),p=d.payment;let amount=0;
 if(kind==="paid")amount=d.remaining;
 else{const answer=window.prompt(t("amountReceived")+" ("+money(d.remaining)+")",(d.remaining/100).toFixed(2));if(answer===null)return;amount=parseMoney(answer);if(amount<=0||amount>=d.remaining){toast(t("validationPot"),true);return;}}
 if(amount<=0){toast(t("saved"));return;}
 p.paidPaise+=amount;p.status=p.paidPaise>=d.base?"paid":"partial";p.paidAt=nowISO();p.mode=p.mode||"upi";
 p.history.push({type:"payment",amountPaise:amount,date:p.paidAt,mode:p.mode,ref:"DEMO-"+c.monthNo+"-"+id+"-"+(p.history.length+1)});
 toast(t("paymentSaved"));
}
function reversePayment(id){
 const c=currentCycle();if(!c)return;const p=paymentFor(id,c.monthNo);if(p.paidPaise<=0)return;
 if(!window.confirm(t("reverseConfirm")))return;
 const amount=p.paidPaise;p.history.push({type:"reversal",amountPaise:amount,date:nowISO(),mode:p.mode,ref:"REV-"+c.monthNo+"-"+id+"-"+(p.history.length+1)});p.paidPaise=0;p.status="pending";p.paidAt="";
 toast(t("reversalSaved"));
}
function generateQr(id){
 const m=mBy(id||state.previewMemberId),c=currentCycle();if(!m||!c)return;
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
 const rows=[[t("monthNo"),t("month"),t("member"),t("status"),t("bid"),t("prize"),t("discount"),t("commission"),t("dividend"),t("amountPaid"),t("profitLoss"),t("paidDate"),t("paymentMode")]];
 state.cycles.forEach(c=>state.members.forEach(m=>{
  const p=paymentFor(m.id,c.monthNo),tot=memberTotals(m),dv=state.dividendHistory.filter(h=>h.cycleNo===c.monthNo&&h.memberId===m.id).reduce((s,h)=>s+h.amountPaise,0);
  const b=state.bids.find(x=>x.cycleNo===c.monthNo&&x.memberId===m.id);
  rows.push([c.monthNo,cycleName(c),m.name,sLabel(m.status),b?(b.amountPaise/100).toFixed(2):"",c.winnerId===m.id?(c.prizePaise/100).toFixed(2):"",c.status==="completed"?(c.discountPaise/100).toFixed(2):"",c.status==="completed"?(c.commissionPaise/100).toFixed(2):"", (dv/100).toFixed(2),(p.paidPaise/100).toFixed(2),(tot.profitLoss/100).toFixed(2),p.paidAt||"",p.mode]);
 }));
 const blob=new Blob(["\uFEFF"+rows.map(r=>r.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="auction-chit-ledger-"+today()+".csv";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1300);toast(t("exportExcel"));
}
function resetDemo(){if(!window.confirm(t("resetConfirm")))return;const lang=state.lang;state=seedDemo();state.lang=lang;render();}
root.addEventListener("click",function(e){
 const el=e.target.closest("[data-action],[data-page],[data-rule-cmd]");
 if(!el)return;
 if(el.hasAttribute("data-page")){state.page=el.getAttribute("data-page");state.modal=null;render();return;}
 const a=el.getAttribute("data-action");
 if(a==="toggle-lang"){state.lang=state.lang==="en"?"te":"en";render();return;}
 if(a==="reset-demo"){resetDemo();return;}
 if(a==="sign-in"){toast(t("googleNotConfigured"),true);return;}
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
 if(a==="export-csv"){exportCsv();return;}
 if(a==="print-pdf"){window.print();return;}
 if(a==="save-rules"){const box=document.querySelector("[data-rule-content]");if(box)state.rulesHtml=sanitizeRules(box.innerHTML);toast(t("rulesSaved"));return;}
 if(el.hasAttribute("data-rule-cmd")){document.execCommand(a,false,null);const box=document.querySelector("[data-rule-content]");if(box)state.rulesHtml=sanitizeRules(box.innerHTML);return;}
});
root.addEventListener("change",function(e){
 const el=e.target,a=el.getAttribute("data-action");
 if(a==="role-select"){state.role=el.value;render();return;}
 if(a==="preview-member"){state.previewMemberId=el.value;render();return;}
 if(a==="payment-mode"){const p=paymentFor(el.getAttribute("data-id"),currentCycle().monthNo);p.mode=el.value;render();return;}
 if(a==="payment-toggle"){if(el.checked)markPayment(el.getAttribute("data-id"),"paid");else reversePayment(el.getAttribute("data-id"));return;}
});
root.addEventListener("input",function(e){
 const el=e.target;if(el.hasAttribute("data-rule-content"))state.rulesHtml=sanitizeRules(el.innerHTML);
});
function tick(){
 const c=currentCycle();if(!c)return;const d=timerData(c),el=document.getElementById("timerValue");if(el)el.textContent=d.text;
 const bar=document.getElementById("timerProgress");if(bar)bar.style.width=(d.status==="closed"?100:d.status==="upcoming"?0:Math.max(2,Math.min(100,((Date.now()-d.start)/(d.end-d.start))*100)))+"%";
}
function selfCheck(){
 const original=state;
 const demo=seedDemo();state=demo;
 console.assert(baseContribution()===500000,"Auction Chit Manager: ₹5,000 base contribution.");
 console.assert(floorPrice(1)===3000000,"Auction Chit Manager: month 1 starting floor should be ₹30,000.");
 console.assert(floorPrice(2)===3200000,"Auction Chit Manager: month 2 calculated floor should be ₹32,000.");
 console.assert(lowestBid(currentCycle()).amountPaise===3750000,"Auction Chit Manager: lowest approved bid should be ₹37,500.");
 const calc=cycleCalc(currentCycle(),lowestBid(currentCycle()));
 console.assert(calc.prizePaise===3750000&&calc.discountPaise===1250000,"Auction Chit Manager: prize ₹37,500 and discount ₹12,500.");
 console.assert(calc.commissionPaise===250000&&calc.dividendPoolPaise===1000000&&calc.dividendPerHeadPaise===100000,"Auction Chit Manager: commission ₹2,500, pool ₹10,000, dividend ₹1,000.");
 state=original;
}
render();selfCheck();setInterval(tick,1000);
})();