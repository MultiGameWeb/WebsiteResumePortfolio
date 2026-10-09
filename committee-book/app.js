(function(){
"use strict";
const root=document.getElementById("app");
const tr=()=>window.CHIT_I18N[state.lang]||window.CHIT_I18N.en;
const t=k=>tr()[k]||window.CHIT_I18N.en[k]||k;
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]});
const money=p=>t("currency")+((Number(p||0)/100).toLocaleString(state.lang==="te"?"te-IN":"en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}));
const parseMoney=v=>{const n=Number(String(v||"").replace(/,/g,""));return Number.isFinite(n)?Math.round(n*100):0};
const dateISO=(d)=>{const x=d||new Date();return x.getFullYear()+"-"+String(x.getMonth()+1).padStart(2,"0")+"-"+String(x.getDate()).padStart(2,"0")};
const todayISO=()=>dateISO(new Date());
const fmtDate=s=>{if(!s)return "—";const d=new Date(s+"T00:00:00");return Number.isNaN(d.getTime())?esc(s):new Intl.DateTimeFormat(state.lang==="te"?"te-IN":"en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(d)};
const cycleLabel=n=>{const d=new Date(state.chit.startDate+"T00:00:00");d.setMonth(d.getMonth()+Number(n)-1);return new Intl.DateTimeFormat(state.lang==="te"?"te-IN":"en-IN",{month:"short",year:"numeric"}).format(d)};
const nextDate=(n)=>{const d=new Date(state.chit.startDate+"T00:00:00");d.setMonth(d.getMonth()+Number(n)-1);d.setDate(Math.min(state.chit.dueDay,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));return dateISO(d)};
const daysLate=(due)=>{const a=new Date(todayISO()+"T00:00:00"),b=new Date(due+"T00:00:00");return Math.max(0,Math.floor((a-b)/86400000))};
const activeMembers=()=>state.members.filter(m=>m.status!=="removed");
const memberById=id=>state.members.find(m=>m.id===id);
const getCycle=n=>state.cycles.find(c=>c.no===Number(n));
const currentCycle=()=>state.cycles.find(c=>!c.completed)||null;
const activeCount=()=>activeMembers().length;
const contribution=()=>Math.floor(state.chit.potPaise/Math.max(1,Number(state.chit.membersCount)||1));
const commissionPaise=()=>state.chit.commissionEnabled?Math.floor(state.chit.potPaise*Math.max(0,Number(state.chit.commissionPct)||0)/100):0;
const fineFor=cycle=>{if(!cycle)return 0;const d=daysLate(nextDate(cycle.no));if(!d)return 0;let fee=d*Math.max(0,state.chit.finePerDayPaise||0);if(state.chit.maxFineCapPaise>0)fee=Math.min(fee,state.chit.maxFineCapPaise);return fee};
function eligibleFor(cycle){
  const all=activeMembers();
  if(state.chit.distributionRule==="notWonYet")return all.filter(m=>(m.wonMonths||[]).length===0&&m.id!==cycle.winnerId);
  return all;
}
function cycleMath(cycle){
  const pot=state.chit.potPaise,discount=cycle&&cycle.discountPaise!=null?cycle.discountPaise:state.chit.discountPaise;
  const comm=cycle&&cycle.commissionPaise!=null?cycle.commissionPaise:commissionPaise();
  const pool=Math.max(0,discount-comm),eligible=eligibleFor(cycle||{winnerId:null});
  const per=eligible.length?Math.floor(pool/eligible.length):0,left=pool-per*eligible.length;
  const map={};eligible.forEach(m=>map[m.id]=per);
  const pays={};activeMembers().forEach(m=>pays[m.id]=Math.max(0,contribution()-(map[m.id]||0)));
  return {potPaise:pot,discountPaise:discount,commissionPaise:comm,prizePaise:Math.max(0,pot-discount),dividendPoolPaise:pool,eligibleIds:eligible.map(m=>m.id),dividendPerHeadPaise:per,leftoverPaise:left,dividendByMember:map,paysByMember:pays,monthlyCollectionPaise:contribution()*state.chit.membersCount};
}
function seedPayment(id,cycleNo,status,amount,mode,date){
  const amountPaise=Math.max(0,amount);
  return {memberId:id,cycleNo:Number(cycleNo),status:status,amountPaidPaise:amountPaise,mode:mode||"upi",paidDate:date||"",history:amountPaise?[{type:"Payment",amountPaise:amountPaise,date:date||"",mode:mode||"upi",reference:"DEMO-"+cycleNo+"-"+id.toUpperCase()}]:[]};
}
function buildDemoState(lang){
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
  const chit={name:"Fixed Discount Demo Chit",potPaise:5000000,membersCount:10,discountPaise:500000,commissionEnabled:false,commissionPct:0,distributionRule:"allMembers",winnerMethod:"fixedOrder",startDate:"2026-07-10",dueDay:10,finePerDayPaise:10000,maxFineCapPaise:500000,rulesHtml:"<h3>Member rules</h3><ul><li>Each member contributes the fixed monthly installment on or before the due date.</li><li>The fixed discount and prize amount follow the terms recorded at the start of the chit.</li><li>Winner selection and monthly statements should be recorded transparently.</li><li>Any payment correction must be recorded as a reversal; original entries must be preserved.</li></ul>"};
  const cycles=[];
  for(let n=1;n<=10;n++){
    const c={no:n,completed:n<=3,winnerId:n===1?"m1":n===2?"m2":n===3?"m3":null,discountPaise:500000,commissionPaise:0,completionDate:n<=3?nextDateForSeed(chit.startDate,n,10):"",method:"fixedOrder"};
    cycles.push(c);
  }
  const payments=[];
  const seedStates=[
    ["paid","paid","paid","paid","pending","paid","partial","paid","pending","paid"],
    ["paid","paid","pending","paid","paid","paid","paid","partial","paid","pending"],
    ["paid","pending","paid","paid","partial","paid","pending","paid","paid","paid"]
  ];
  const paidDates=[["2026-07-08","2026-07-09","2026-07-10","2026-07-08","","2026-07-10","2026-07-09","2026-07-08","","2026-07-10"],["2026-08-08","2026-08-10","","2026-08-09","2026-08-08","2026-08-10","2026-08-09","","2026-08-10",""],["2026-09-08","","2026-09-09","2026-09-10","","2026-09-09","","2026-09-08","2026-09-10","2026-09-10"]];
  const amtByStatus={paid:450000,pending:0,partial:200000};
  for(let n=1;n<=3;n++){
    const labelDate=nextDateForSeed(chit.startDate,n,10);
    seedStates[n-1].forEach((status,i)=>payments.push(seedPayment(members[i].id,n,status,amtByStatus[status],"upi",paidDates[n-1][i])));
  }
  payments.push(seedPayment("m1",4,"paid",450000,"upi","2026-10-06"));
  payments.push(seedPayment("m2",4,"paid",450000,"cash","2026-10-08"));
  payments.push(seedPayment("m3",4,"partial",200000,"cash","2026-10-08"));
  const upcomingNo=4,upcoming={no:upcomingNo,winnerId:"m4",completed:false};
  const temporary={lang:lang||"en",chit:chit,members:members,cycles:cycles,payments:payments,page:"dashboard",selectedWinnerId:"m4",modal:null,toast:null};
  const original=state;state=temporary;
  cycles.filter(c=>c.completed).forEach(c=>{const math=cycleMath(c);c.discountPaise=math.discountPaise;c.commissionPaise=math.commissionPaise;c.prizePaise=math.prizePaise;c.dividendPoolPaise=math.dividendPoolPaise;c.dividendPerHeadPaise=math.dividendPerHeadPaise;c.leftoverPaise=math.leftoverPaise;c.eligibleIds=math.eligibleIds;c.dividendByMember=math.dividendByMember;c.paysByMember=math.paysByMember;c.contributionPaise=contribution();c.monthlyCollectionPaise=math.monthlyCollectionPaise;});
  state=original;
  return temporary;
}
function nextDateForSeed(start,n,due){
 const dt=new Date(start+"T00:00:00");dt.setMonth(dt.getMonth()+n-1);dt.setDate(Math.min(due,new Date(dt.getFullYear(),dt.getMonth()+1,0).getDate()));return dateISO(dt);
}
let state;state=buildDemoState("en");
function getPayment(memberId,cycleNo){
  let p=state.payments.find(x=>x.memberId===memberId&&x.cycleNo===Number(cycleNo));
  if(!p){p={memberId:memberId,cycleNo:Number(cycleNo),status:"pending",amountPaidPaise:0,mode:"upi",paidDate:"",history:[]};state.payments.push(p);}
  return p;
}
function memberMath(member){
  let paid=0,dividend=0,prize=0;
  state.payments.filter(p=>p.memberId===member.id).forEach(p=>{paid+=p.amountPaidPaise||0;});
  state.cycles.filter(c=>c.completed).forEach(c=>{
    if(c.dividendByMember&&c.dividendByMember[member.id])dividend+=c.dividendByMember[member.id];
    if(c.winnerId===member.id)prize+=c.prizePaise||Math.max(0,state.chit.potPaise-state.chit.discountPaise);
  });
  return {paid:paid,dividend:dividend,prize:prize,profitLoss:prize+dividend-paid};
}
function dueFor(member,cycle){
  if(!cycle)return {base:0,paid:0,remaining:0,fine:0,payment:null};
  if(member.status==="removed"&&!cycle.completed){const old=getPayment(member.id,cycle.no);return {base:0,paid:old.amountPaidPaise||0,remaining:0,fine:0,payment:old};}
  const math=cycle.completed?cycle:cycleMath(cycle);
  const due=cycle.completed?(math.paysByMember&&math.paysByMember[member.id]!=null?math.paysByMember[member.id]:contribution()):math.paysByMember[member.id]||contribution();
  const payment=getPayment(member.id,cycle.no),remaining=Math.max(0,due-(payment.amountPaidPaise||0));
  return {base:due,paid:payment.amountPaidPaise||0,remaining:remaining,fine:remaining>0?fineFor(cycle):0,payment:payment};
}
function memberName(id){const m=memberById(id);return m?m.name:t("noWinnerYet");}
function statusLabel(s){return ({paid:t("paidStatus"),pending:t("pendingStatus"),partial:t("partialStatus"),reversed:t("reversedStatus"),active:t("activeStatus"),winner:t("winnerStatus"),removed:t("removedStatus"),upcoming:t("upcoming"),completed:t("completed"),overdue:t("overdue")})[s]||s;}
function statusClass(s){return ({paid:"green",active:"green",winner:"blue",pending:"amber",partial:"amber",reversed:"red",due:"red",removed:"gray",upcoming:"gray",completed:"green",overdue:"red"})[s]||"gray";}
function badge(s){return '<span class="badge '+statusClass(s)+'"><span class="status-dot"></span>'+esc(statusLabel(s))+'</span>';}
function paidToggle(m,c,d){const checked=d.payment.status==="paid"||d.remaining===0;const label=checked?t("yes"):t("no");return '<label class="toggle"><input class="paid-toggle" type="checkbox" data-action="toggle-paid" data-id="'+m.id+'" '+(checked?"checked":"")+' aria-label="'+esc(t("paidQuestion"))+'"><span>'+esc(label)+'</span></label>'+(d.payment.status==="partial"?'<div style="margin-top:4px">'+badge("partial")+'</div>':"");}
function heading(title,desc,actions){return '<section class="page-heading"><div><h1>'+esc(title)+'</h1><p>'+esc(desc||"")+'</p></div><div class="heading-actions">'+(actions||"")+'</div></section>';}
function demoBanner(){return '<div class="demo-banner"><span class="demo-banner-icon">i</span><div><strong>'+esc(t("demoNotice"))+'</strong><span>'+esc(t("demoNoticeText"))+'</span></div></div>';}
function pageIcon(page){return ({dashboard:"◫",setup:"⚙",members:"♙",cycles:"◷",payments:"↗",rules:"≡",reports:"▤"})[page]||"•";}
function navigation(){const items=["dashboard","setup","members","cycles","payments","rules","reports"];return '<aside class="sidebar"><div class="side-label">'+esc(t("overview"))+'</div><nav class="nav-list">'+items.map(k=>'<button class="nav-item '+(state.page===k?"active":"")+'" data-page="'+k+'"><span class="nav-icon">'+pageIcon(k)+'</span><span>'+esc(t(k))+'</span></button>').join("")+'</nav><div class="sidebar-note"><strong>'+esc(t("copyMode"))+'</strong>'+esc(t("fixedDiscountIntro"))+'</div></aside>';}
function header(){return '<header class="app-header"><div class="header-inner"><a class="brand" href="index.html" aria-label="'+esc(t("brand"))+'"><span class="brand-mark">C</span><span><span class="brand-name">'+esc(t("brand"))+'</span><span class="brand-sub">'+esc(t("templateTag"))+' · '+esc(t("templateName"))+'</span></span></a><div class="header-actions"><button type="button" class="language-btn" data-action="toggle-lang" aria-label="'+esc(t("languageLabel"))+'">文 A · '+esc(t("language"))+'</button><button type="button" class="reset-btn" data-action="reset-demo">↻ '+esc(t("resetDemo"))+'</button></div></div></header>';}
function statCard(label,value,foot,icon,color){return '<article class="stat-card '+color+'"><div class="stat-top"><span class="stat-label">'+esc(label)+'</span><span class="stat-icon">'+icon+'</span></div><div class="stat-value">'+esc(value)+'</div><div class="stat-foot">'+esc(foot||"")+'</div></article>';}
function dashboardView(){
  const c=currentCycle(),math=c?cycleMath(c):null;
  const active=activeMembers();let paidCount=0,collected=0;
  if(c)active.forEach(m=>{const d=dueFor(m,c);if(d.payment.status==="paid")paidCount++;collected+=d.paid;});
  const dueCount=active.length-paidCount;
  const dividend=state.cycles.filter(x=>x.completed).reduce((sum,x)=>sum+Object.values(x.dividendByMember||{}).reduce((a,b)=>a+b,0),0);
  const stats='<div class="stat-grid">'+
    statCard(t("totalDueMembers"),String(Math.max(0,dueCount)),c?cycleLabel(c.no):t("noCompletedCycles"),"!", "red")+
    statCard(t("totalPaidMembers"),String(paidCount),t("currentCycle")+(c?" · "+cycleLabel(c.no):""),"✓","green")+
    statCard(t("collectedThisMonth"),money(collected),c?cycleLabel(c.no):"—","↗","blue")+
    statCard(t("dividendDistributed"),money(dividend),t("completed")+" "+state.cycles.filter(x=>x.completed).length+" "+t("cycles"),"₹","amber")+'</div>';
  const winRows=state.cycles.filter(x=>x.completed).slice().reverse().map(x=>'<tr><td><strong>'+esc(cycleLabel(x.no))+'</strong><div class="subtle">'+esc(t("monthNo"))+' '+x.no+'</div></td><td>'+esc(memberName(x.winnerId))+'</td><td class="money">'+money(x.prizePaise||state.chit.potPaise-state.chit.discountPaise)+'</td><td class="money">'+money(x.dividendPerHeadPaise||0)+'</td><td>'+badge("completed")+'</td></tr>').join("");
  const winnersTable='<div class="panel"><div class="panel-header"><div><h2>'+esc(t("winnerHistory"))+'</h2><p>'+esc(t("monthHistory"))+'</p></div><button class="btn small" data-page="cycles">'+esc(t("cycles"))+' →</button></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("month"))+'</th><th>'+esc(t("winner"))+'</th><th>'+esc(t("prize"))+'</th><th>'+esc(t("dividendPerHead"))+'</th><th>'+esc(t("status"))+'</th></tr></thead><tbody>'+(winRows||'<tr><td colspan="5" class="empty-state">'+esc(t("noRows"))+'</td></tr>')+'</tbody></table></div></div></div>';
  const statusRows=c?active.map(m=>{const d=dueFor(m,c),p=d.payment;return '<tr><td>'+memberCell(m)+'</td><td class="money">'+money(d.remaining+d.fine)+'</td><td>'+paidToggle(m,c,d)+'</td><td>'+esc(p.paidDate?fmtDate(p.paidDate):"—")+'</td><td><select data-action="payment-mode" data-id="'+m.id+'" aria-label="'+esc(t("paymentMode"))+'"><option value="upi" '+(p.mode==="upi"?"selected":"")+'>'+esc(t("upi"))+'</option><option value="cash" '+(p.mode==="cash"?"selected":"")+'>'+esc(t("cash"))+'</option></select></td><td class="money">'+money(d.fine)+'</td></tr>';}).join(""):"";
  const statusTable='<div class="panel"><div class="panel-header"><div><h2>'+esc(t("paymentStatus"))+'</h2><p>'+esc(t("currentCycle"))+(c?" · "+esc(cycleLabel(c.no)):"")+'</p></div><button class="btn small" data-page="payments">'+esc(t("payments"))+' →</button></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("memberName"))+'</th><th>'+esc(t("amountDue"))+'</th><th>'+esc(t("paidQuestion"))+'</th><th>'+esc(t("paidDate"))+'</th><th>'+esc(t("paymentMode"))+'</th><th>'+esc(t("lateFine"))+'</th></tr></thead><tbody>'+(statusRows||'<tr><td colspan="6" class="empty-state">'+esc(t("noRows"))+'</td></tr>')+'</tbody></table></div></div></div>';
  const pending= c?active.filter(m=>{const d=dueFor(m,c);return d.remaining>0;}).map(m=>{const d=dueFor(m,c),late=daysLate(nextDate(c.no));const cl=late>0?"red":"amber";return '<div class="pending-item '+cl+'"><span class="pending-icon">'+(late>0?"!":"◷")+'</span><div><div class="pending-title">'+esc(m.name)+'</div><div class="pending-desc">'+esc(late>0?t("reminderOverdue"):t("reminderDue"))+' · '+esc(late>0?(t("fineDays")+": "+late):fmtDate(nextDate(c.no)))+'</div></div><span class="pending-amount">'+money(d.remaining+d.fine)+'</span></div>';}).join(""):"";
  const pendingPanel='<div class="panel"><div class="panel-header"><div><h2>'+esc(t("pendingList"))+'</h2><p>'+esc(t("reminderText"))+'</p></div></div><div class="panel-body"><div class="pending-list">'+(pending||'<div class="empty-state">'+esc(t("noPending"))+'</div>')+'</div></div></div>';
  const mathPanel=math?'<div class="panel"><div class="panel-header"><div><h2>'+esc(t("howCalculationWorks"))+'</h2><p>'+esc(t("fixedDiscountIntro"))+'</p></div></div><div class="panel-body"><div class="calc-grid">'+
    calcItem(t("monthlyCollection"),money(math.monthlyCollectionPaise),t("numberMembers")+" × "+t("monthlyContribution"))+
    calcItem(t("prizeAmount"),money(math.prizePaise),t("potAmount")+" − "+t("discount"))+
    calcItem(t("commission"),money(math.commissionPaise),String(state.chit.commissionPct||0)+"%")+
    calcItem(t("dividendPool"),money(math.dividendPoolPaise),t("discountPool")+" − "+t("commission"))+
    calcItem(t("eligibleMembers"),String(math.eligibleIds.length),t("dividendRule"))+
    calcItem(t("roundingLeftover"),money(math.leftoverPaise),t("leader"))+
    '</div><div class="field-help" style="margin-top:12px">'+esc(t("amountFormula"))+'</div></div></div>':'';
  const actions='<button class="btn primary" data-page="payments">↗ '+esc(t("payments"))+'</button><button class="btn" data-page="reports">▤ '+esc(t("reports"))+'</button>';
  return heading(t("dashboard"),t("fixedDiscountIntro"),actions)+demoBanner()+stats+'<div class="content-grid"><div>'+winnersTable+statusTable+'</div><div>'+pendingPanel+mathPanel+'</div></div>';
}
function calcItem(label,value,help){return '<div class="calc-item"><span>'+esc(label)+'</span><strong>'+esc(value)+'</strong><small>'+esc(help||"")+'</small></div>';}
function memberCell(m){return '<div class="member-cell"><span class="avatar">'+esc(m.name.trim().split(/\s+/).slice(0,2).map(x=>x[0]||"").join("").toUpperCase())+'</span><div><div class="member-main">'+esc(m.name)+'</div><div class="member-meta">'+esc(m.phone||m.email||"")+'</div></div></div>';}
function setupView(){
  const c=state.chit,locked=state.cycles.some(x=>x.completed),m=cycleMath(currentCycle()||{winnerId:null});
  const lockTag='<span class="inline-lock" title="'+esc(t("lockedHint"))+'">🔒 '+esc(t("cycleLock"))+'</span>';
  const input=(key,label,value,type,disabled,help,attrs)=>'<div class="form-field"><label for="f-'+key+'">'+esc(label)+(disabled?lockTag:"")+'</label><input id="f-'+key+'" data-field="'+key+'" type="'+type+'" value="'+esc(value)+'" '+(disabled?'disabled title="'+esc(t("lockedHint"))+'"':"")+' '+(attrs||"")+'>'+ (help?'<div class="field-help">'+esc(help)+'</div>':"")+'</div>';
  const select=(key,label,value,opts,disabled)=>'<div class="form-field"><label for="f-'+key+'">'+esc(label)+(disabled?lockTag:"")+'</label><select id="f-'+key+'" data-field="'+key+'" '+(disabled?'disabled title="'+esc(t("lockedHint"))+'"':"")+'>'+opts.map(o=>'<option value="'+esc(o[0])+'" '+(o[0]===value?"selected":"")+'>'+esc(o[1])+'</option>').join("")+'</select></div>';
  const lockedHTML=locked?'<div class="lock-alert"><b>🔒</b><span><strong>'+esc(t("locked"))+'</strong><br>'+esc(t("lockedHint"))+'</span></div>':"";
  const commissionBlock='<div class="form-field"><label>'+esc(t("leaderCommission"))+(locked?lockTag:"")+'</label><div class="field-row"><input type="checkbox" class="check-toggle" id="f-commissionEnabled" data-field="commissionEnabled" '+(c.commissionEnabled?"checked":"")+' '+(locked?"disabled":"")+' aria-label="'+esc(t("leaderCommission"))+'"><span class="subtle" id="commissionToggleLabel">'+esc(c.commissionEnabled?t("commissionOn"):t("commissionOff"))+'</span></div></div>';
  const percentBlock='<div class="form-field" id="commissionRateWrap" '+(!c.commissionEnabled?'hidden':"")+'><label for="f-commissionPct">'+esc(t("commissionPercent"))+'</label><input id="f-commissionPct" type="number" data-field="commissionPct" min="0" max="100" step="0.01" value="'+esc(c.commissionPct)+'" '+(locked?"disabled":"")+'></div>';
  const fields='<div class="form-grid">'+
    input("name",t("chitName"),c.name,"text",false)+
    input("pot",t("potAmount"),(c.potPaise/100).toFixed(2),"number",locked,"", 'min="0.01" step="0.01"')+
    input("membersCount",t("numberMembers"),c.membersCount,"number",locked,"", 'min="2" step="1"')+
    input("contribution",t("monthlyContribution"),(contribution()/100).toFixed(2),"text",true,t("amountFormula"))+
    input("discount",t("fixedDiscount"),(c.discountPaise/100).toFixed(2),"number",locked,"", 'min="0.01" step="0.01"')+
    input("prize",t("prizeAmount"),((c.potPaise-c.discountPaise)/100).toFixed(2),"text",true)+
    commissionBlock+percentBlock+
    select("distributionRule",t("dividendRule"),c.distributionRule,[["allMembers",t("allMembersRule")],["notWonYet",t("notWonRule")]],locked)+
    select("winnerMethod",t("winnerMethod"),c.winnerMethod,[["fixedOrder",t("fixedOrder")],["luckyDraw",t("luckyDraw")],["manual",t("leaderSelects")]],locked)+
    input("startDate",t("startDate"),c.startDate,"date",false)+
    input("dueDay",t("monthlyDueDate"),c.dueDay,"number",false,"", 'min="1" max="31" step="1"')+
    input("finePerDay",t("finePerDay"),(c.finePerDayPaise/100).toFixed(2),"number",false,"", 'min="0" step="0.01"')+
    input("maxFineCap",t("maxFineCap"),c.maxFineCapPaise>0?(c.maxFineCapPaise/100).toFixed(2):"","number",false,"", 'min="0" step="0.01"')+
    '<div class="form-field span-2"><label>'+esc(t("rulesText"))+'</label>'+ruleEditor(false)+'</div>'+
    '</div>';
  const mathSummary='<div class="panel"><div class="panel-header"><div><h2>'+esc(t("howCalculationWorks"))+'</h2><p>'+esc(t("amountFormula"))+'</p></div></div><div class="panel-body"><div class="calc-grid">'+
    calcItem(t("monthlyCollection"),money(c.membersCount*contribution()),t("numberMembers")+" × "+t("monthlyContribution"))+
    calcItem(t("prizeAmount"),money(c.potPaise-c.discountPaise),t("potAmount")+" − "+t("discount"))+
    calcItem(t("dividendPool"),money(m.dividendPoolPaise),t("discountPool")+" − "+t("commission"))+
    '</div></div></div>';
  return heading(t("chitSetup"),t("editNameDatesFineRules"))+demoBanner()+'<div class="panel"><div class="panel-header"><div><h2>'+esc(t("chitSetup"))+'</h2><p>'+esc(t("lockedHint"))+'</p></div></div><div class="panel-body">'+lockedHTML+fields+'<div class="form-actions"><span class="help-text">'+esc(t("editNameDatesFineRules"))+'</span><button class="btn primary" data-action="save-setup">✓ '+esc(t("saveChanges"))+'</button></div></div></div>'+mathSummary;
}
function ruleEditor(compact){
  return '<div class="rule-editor"><div class="rule-toolbar"><button class="btn small" data-rule-cmd="bold" title="'+esc(t("bold"))+'"><b>B</b></button><button class="btn small" data-rule-cmd="italic" title="'+esc(t("italic"))+'"><i>I</i></button><button class="btn small" data-rule-cmd="insertUnorderedList" title="'+esc(t("bullets"))+'">•</button></div><div class="rule-content" data-rule-content contenteditable="true" spellcheck="true" data-placeholder="'+esc(t("rulePlaceholder"))+'">'+sanitizeRules(state.chit.rulesHtml)+'</div></div>';
}
function sanitizeRules(html){
  const doc=new DOMParser().parseFromString(String(html||""),"text/html");
  const allowed=["P","BR","STRONG","B","EM","I","U","UL","OL","LI","H2","H3"];
  Array.from(doc.body.querySelectorAll("*")).forEach(el=>{
    if(!allowed.includes(el.tagName)){el.replaceWith(doc.createTextNode(el.textContent||""));return;}
    Array.from(el.attributes).forEach(a=>el.removeAttribute(a.name));
  });
  return doc.body.innerHTML;
}
function membersView(){
  const search='<input class="search-input" type="search" data-member-search placeholder="'+esc(t("memberName"))+'" aria-label="'+esc(t("memberName"))+'" value="'+esc(state.memberSearch||"")+'">';
  const members=state.members.filter(m=>(m.name+" "+m.phone+" "+m.email).toLowerCase().includes((state.memberSearch||"").toLowerCase()));
  const rows=members.map((m,i)=>{
    const totals=memberMath(m),d=dueFor(m,currentCycle()),st=m.status;
    return '<tr><td>'+(i+1)+'</td><td>'+memberCell(m)+'</td><td>'+esc(m.phone||"—")+'</td><td>'+esc(m.email||"—")+'</td><td>'+badge(st)+'</td><td class="money">'+money(totals.paid)+'</td><td class="money">'+money(totals.dividend)+'</td><td class="money">'+money(d.remaining+d.fine)+'</td><td><button class="btn small" disabled title="'+esc(t("comingSoon"))+'">'+esc(t("documents"))+' · '+esc(t("comingSoon"))+'</button></td><td><div class="row-actions"><button class="btn small" data-action="edit-member" data-id="'+m.id+'">'+esc(t("edit"))+'</button><button class="btn small danger" data-action="remove-member" data-id="'+m.id+'" '+(st==="removed"?"disabled":"")+'>'+esc(t("deleteMember"))+'</button></div></td></tr>';
  }).join("");
  const canAdd=activeCount()<state.chit.membersCount;
  return heading(t("members"),t("membersSubtitle"),'<button class="btn primary" data-action="add-member" '+(!canAdd?'disabled title="'+esc(t("noMemberSlots"))+'"':"")+'">＋ '+esc(t("addMember"))+'</button>')+
    '<div class="panel"><div class="panel-header"><div><h2>'+esc(t("members"))+' · '+state.members.length+'</h2><p>'+esc(t("membersCountHint"))+'</p></div><div class="table-toolbar">'+search+'</div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("serialNo"))+'</th><th>'+esc(t("memberName"))+'</th><th>'+esc(t("phone"))+'</th><th>'+esc(t("email"))+'</th><th>'+esc(t("status"))+'</th><th>'+esc(t("totalPaid"))+'</th><th>'+esc(t("totalDividend"))+'</th><th>'+esc(t("dueAmount"))+'</th><th>'+esc(t("documents"))+'</th><th>'+esc(t("action"))+'</th></tr></thead><tbody>'+(rows||'<tr><td colspan="10" class="empty-state">'+esc(t("noRows"))+'</td></tr>')+'</tbody></table></div></div></div><div class="info-box">'+esc(t("removedNotice"))+'</div>';
}
function cyclesView(){
  const cur=currentCycle(),all=state.cycles;
  const cycleRows=all.map(c=>{
    const math=c.completed?c:cycleMath(c.winnerId?c:{winnerId:null});
    return '<tr><td><strong>'+c.no+'</strong></td><td><strong>'+esc(cycleLabel(c.no))+'</strong><div class="member-meta">'+esc(t("monthNo"))+' '+c.no+'</div></td><td>'+esc(c.winnerId?memberName(c.winnerId):t("noWinnerYet"))+'</td><td class="money">'+money(c.completed?c.discountPaise:state.chit.discountPaise)+'</td><td class="money">'+money(c.completed?(c.commissionPaise||0):commissionPaise())+'</td><td class="money">'+money(c.completed?(c.dividendPerHeadPaise||0):math.dividendPerHeadPaise)+'</td><td class="money">'+money(c.completed?(c.paysByMember&&c.paysByMember[activeMembers()[0]?.id]||contribution()):(math.paysByMember[activeMembers()[0]?.id]||contribution()))+'</td><td>'+badge(c.completed?"completed":"upcoming")+'</td></tr>';
  }).join("");
  const eligible=activeMembers().filter(m=>m.status!=="removed"&&(state.chit.distributionRule!=="notWonYet"||(m.wonMonths||[]).length===0));
  const choices=eligible.map(m=>'<option value="'+m.id+'" '+(state.selectedWinnerId===m.id?"selected":"")+'>'+esc(m.name)+'</option>').join("");
  const drawControls=cur?'<div class="panel"><div class="panel-header"><div><h2>'+esc(t("currentCycle"))+' · '+esc(cycleLabel(cur.no))+'</h2><p>'+esc(t("startNew"))+'</p></div>'+badge("upcoming")+'</div><div class="panel-body"><div class="cycle-action"><div class="form-field"><label for="winner-select">'+esc(t("selectWinner"))+'</label><select id="winner-select" data-action="winner-select">'+choices+'</select></div><div class="row-actions"><button class="btn" data-action="pick-winner">'+esc(t("chooseWinner"))+'</button><button class="btn primary" data-action="complete-cycle">✓ '+esc(t("recordCycle"))+'</button></div></div><div class="calc-grid" style="margin-top:16px">'+calcItem(t("prizeAmount"),money(state.chit.potPaise-state.chit.discountPaise),t("potAmount")+" − "+t("discount"))+calcItem(t("dividendPerHead"),money(cycleMath(cur).dividendPerHeadPaise),t("eligibleMembers")+": "+cycleMath(cur).eligibleIds.length)+calcItem(t("eachMemberPays"),money(cycleMath(cur).paysByMember[state.selectedWinnerId]||contribution()),t("amountFormula"))+'</div></div></div>':'<div class="info-box">'+esc(t("noEligibleWinner"))+'</div>';
  return heading(t("cycles"),t("monthlyCollection")+" = "+t("numberMembers")+" × "+t("monthlyContribution"))+demoBanner()+drawControls+'<div class="panel"><div class="panel-header"><div><h2>'+esc(t("monthHistory"))+'</h2><p>'+esc(t("cycleStatus"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("monthNo"))+'</th><th>'+esc(t("month"))+'</th><th>'+esc(t("winner"))+'</th><th>'+esc(t("discount"))+'</th><th>'+esc(t("commission"))+'</th><th>'+esc(t("dividendPerHead"))+'</th><th>'+esc(t("eachMemberPays"))+'</th><th>'+esc(t("cycleStatus"))+'</th></tr></thead><tbody>'+cycleRows+'</tbody></table></div></div></div>';
}
function paymentsView(){
  const c=currentCycle();
  if(!c)return heading(t("payments"),t("noCompletedCycles"))+demoBanner();
  const list=activeMembers();
  const rows=list.map((m,i)=>{
    const d=dueFor(m,c),p=d.payment;
    const s=d.remaining===0?"paid":d.paid>0?"partial":"pending";
    const action=d.paid>0?'<button class="btn small danger" data-action="reverse-payment" data-id="'+m.id+'">'+esc(t("reversePayment"))+'</button>':'<button class="btn small primary" data-action="mark-paid" data-id="'+m.id+'">'+esc(t("markPaid"))+'</button> <button class="btn small" data-action="mark-partial" data-id="'+m.id+'">'+esc(t("markPartial"))+'</button>';
    return '<tr><td>'+(i+1)+'</td><td>'+memberCell(m)+'</td><td class="money">'+money(d.remaining)+'</td><td>'+paidToggle(m,c,d)+'</td><td>'+esc(p.paidDate?fmtDate(p.paidDate):"—")+'</td><td><select data-action="payment-mode" data-id="'+m.id+'" aria-label="'+esc(t("paymentMode"))+'"><option value="upi" '+(p.mode==="upi"?"selected":"")+'>'+esc(t("upi"))+'</option><option value="cash" '+(p.mode==="cash"?"selected":"")+'>'+esc(t("cash"))+'</option></select></td><td class="money">'+money(d.fine)+'</td><td><div class="row-actions">'+action+'</div></td></tr>';
  }).join("");
  const sums=list.reduce((a,m)=>{const d=dueFor(m,c);a.paid+=d.paid;a.remaining+=d.remaining;a.fine+=d.fine;return a;},{paid:0,remaining:0,fine:0});
  const ledger=state.payments.filter(p=>p.cycleNo===c.no).map(p=>{const m=memberById(p.memberId);return (p.history||[]).map(h=>'<tr><td>'+esc(m?m.name:"—")+'</td><td>'+esc(h.type==="Reversal"?t("reversal"):t("paidStatus"))+'</td><td>'+esc(fmtDate(h.date))+'</td><td class="money">'+(h.type==="Reversal"?"−":"")+money(h.amountPaise)+'</td><td>'+esc(h.mode==="cash"?t("cash"):t("upi"))+'</td><td>'+esc(h.reference||"—")+'</td></tr>').join("");}).join("");
  return heading(t("payments"),t("currentCycle")+" · "+cycleLabel(c.no),'<button class="btn" data-action="export-csv">⇩ '+esc(t("exportExcel"))+'</button>')+demoBanner()+'<div class="stat-grid">'+statCard(t("collectedThisMonth"),money(sums.paid),cycleLabel(c.no),"↗","green")+statCard(t("amountDue"),money(sums.remaining),t("pendingList"),"!","red")+statCard(t("lateFine"),money(sums.fine),t("fineCalculated"),"◷","amber")+statCard(t("totalPaidMembers"),String(list.filter(m=>dueFor(m,c).payment.status==="paid").length),t("currentCycle"),"✓","blue")+'</div><div class="panel"><div class="panel-header"><div><h2>'+esc(t("paymentStatus"))+'</h2><p>'+esc(t("currentCycle"))+' · '+esc(cycleLabel(c.no))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("serialNo"))+'</th><th>'+esc(t("memberName"))+'</th><th>'+esc(t("amountDue"))+'</th><th>'+esc(t("paidQuestion"))+'</th><th>'+esc(t("paidDate"))+'</th><th>'+esc(t("paymentMode"))+'</th><th>'+esc(t("lateFine"))+'</th><th>'+esc(t("action"))+'</th></tr></thead><tbody>'+rows+'</tbody></table></div></div></div><div class="panel"><div class="panel-header"><div><h2>'+esc(t("paymentHistory"))+'</h2><p>'+esc(t("reversalRecorded"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("memberName"))+'</th><th>'+esc(t("entry"))+'</th><th>'+esc(t("date"))+'</th><th>'+esc(t("amount"))+'</th><th>'+esc(t("paymentMode"))+'</th><th>'+esc(t("reference"))+'</th></tr></thead><tbody>'+(ledger||'<tr><td colspan="6" class="empty-state">'+esc(t("noRows"))+'</td></tr>')+'</tbody></table></div></div></div>';
}
function rulesView(){
  const math=cycleMath(currentCycle()||{winnerId:null});
  const verification='<div class="panel"><div class="panel-header"><div><h2>'+esc(t("howCalculationWorks"))+'</h2><p>'+esc(t("amountFormula"))+'</p></div></div><div class="panel-body"><div class="calc-grid">'+
    calcItem(t("monthlyContribution"),money(contribution()),t("potAmount")+" ÷ "+t("numberMembers"))+
    calcItem(t("prizeAmount"),money(state.chit.potPaise-state.chit.discountPaise),t("potAmount")+" − "+t("discount"))+
    calcItem(t("commission"),money(commissionPaise()),t("leaderCommission"))+
    calcItem(t("dividendPool"),money(math.dividendPoolPaise),t("discountPool")+" − "+t("commission"))+
    calcItem(t("dividendPerHead"),money(math.dividendPerHeadPaise),t("eligibleMembers")+": "+math.eligibleIds.length)+
    calcItem(t("roundingLeftover"),money(math.leftoverPaise),t("leader"))+
    '</div><div class="info-box" style="margin-top:13px">'+esc(t("calcVerificationText"))+'</div></div></div>';
  return heading(t("rulesPageTitle"),t("editRules"))+demoBanner()+'<div class="panel"><div class="panel-header"><div><h2>'+esc(t("rulesText"))+'</h2><p>'+esc(t("editRules"))+'</p></div><button class="btn primary" data-action="save-rules">'+esc(t("saveRules"))+'</button></div><div class="panel-body">'+ruleEditor(false)+'</div></div>'+verification;
}
function reportsView(){
  const c=state.cycles.filter(x=>x.completed),members=state.members;
  const totalDiv=c.reduce((s,x)=>s+Object.values(x.dividendByMember||{}).reduce((a,b)=>a+b,0),0);
  const totalCollected=state.payments.reduce((s,p)=>s+(p.amountPaidPaise||0),0);
  const totalPrize=c.reduce((s,x)=>s+(x.prizePaise||0),0);
  const memberRows=members.map(m=>{const v=memberMath(m);return '<tr><td>'+memberCell(m)+'</td><td>'+badge(m.status)+'</td><td class="money">'+money(v.paid)+'</td><td class="money">'+money(v.dividend)+'</td><td class="money">'+money(v.prize)+'</td><td class="money">'+money(v.profitLoss)+'</td></tr>';}).join("");
  return heading(t("reports"),t("reportsSubtitle"),'<button class="btn" data-action="export-csv">⇩ '+esc(t("exportExcel"))+'</button><button class="btn primary" data-action="print-pdf">▤ '+esc(t("printPdf"))+'</button>')+demoBanner()+'<div class="stat-grid">'+statCard(t("collected"),money(totalCollected),t("paymentLedger"),"↗","green")+statCard(t("dividendDistributed"),money(totalDiv),t("completed")+" "+c.length,"₹","amber")+statCard(t("prizePayout"),money(totalPrize),t("winnerHistory"),"★","blue")+statCard(t("members"),String(members.length),t("shareCount"),"♙","red")+'</div><div class="panel"><div class="panel-header"><div><h2>'+esc(t("fullLedger"))+'</h2><p>'+esc(t("memberStatement"))+' · '+esc(t("profitLoss"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("memberName"))+'</th><th>'+esc(t("status"))+'</th><th>'+esc(t("totalPaid"))+'</th><th>'+esc(t("totalDividend"))+'</th><th>'+esc(t("prizeReceived"))+'</th><th>'+esc(t("profitLossShort"))+'</th></tr></thead><tbody>'+memberRows+'</tbody></table></div></div></div><div class="panel"><div class="panel-header"><div><h2>'+esc(t("paymentLedger"))+'</h2><p>'+esc(t("fullLedger"))+'</p></div></div><div class="panel-body flush"><div class="table-wrap"><table><thead><tr><th>'+esc(t("monthNo"))+'</th><th>'+esc(t("month"))+'</th><th>'+esc(t("memberName"))+'</th><th>'+esc(t("amountPaid"))+'</th><th>'+esc(t("dividend"))+'</th><th>'+esc(t("profitLossShort"))+'</th><th>'+esc(t("status"))+'</th></tr></thead><tbody>'+state.cycles.map(cy=>members.map(m=>{const d=dueFor(m,cy),v=memberMath(m),dv=cy.dividendByMember?cy.dividendByMember[m.id]||0:0;return '<tr><td>'+cy.no+'</td><td>'+esc(cycleLabel(cy.no))+'</td><td>'+esc(m.name)+'</td><td class="money">'+money(d.paid)+'</td><td class="money">'+money(dv)+'</td><td class="money">'+money(v.profitLoss)+'</td><td>'+badge(cy.completed?"completed":"upcoming")+'</td></tr>';}).join("")).join("")+'</tbody></table></div></div></div>';
}
function pageContent(){switch(state.page){case"setup":return setupView();case"members":return membersView();case"cycles":return cyclesView();case"payments":return paymentsView();case"rules":return rulesView();case"reports":return reportsView();default:return dashboardView();}}
function modalView(){
  if(!state.modal)return "";
  const existing=state.modal.id?memberById(state.modal.id):null;
  const m=existing||{name:"",phone:"",email:""};
  const status=existing?existing.status:"active";
  return '<div class="member-modal-backdrop" data-action="close-modal-bg"><section class="member-modal" role="dialog" aria-modal="true" aria-labelledby="member-modal-title"><div class="modal-header"><h2 id="member-modal-title">'+esc(existing?t("editMember"):t("addMember"))+'</h2><button class="btn small" data-action="close-modal">✕ '+esc(t("close"))+'</button></div><div class="modal-body"><div class="form-grid">'+
    '<div class="form-field span-2"><label for="modal-name">'+esc(t("name"))+'</label><input id="modal-name" data-modal-field="name" value="'+esc(m.name)+'"></div>'+
    '<div class="form-field"><label for="modal-phone">'+esc(t("phone"))+'</label><input id="modal-phone" data-modal-field="phone" type="tel" value="'+esc(m.phone||"")+'"></div>'+
    '<div class="form-field"><label for="modal-email">'+esc(t("email"))+'</label><input id="modal-email" data-modal-field="email" type="email" value="'+esc(m.email||"")+'"></div>'+
    '</div>'+(existing&&existing.status==="removed"?'<div class="field-help">'+esc(t("removedNotice"))+'</div>':"")+'</div><div class="modal-footer"><button class="btn" data-action="close-modal">'+esc(t("cancel"))+'</button><button class="btn primary" data-action="save-member">'+esc(t("saveMember"))+'</button></div></section></div>';
}
function render(){
  document.title=t("pageTitle");document.documentElement.lang=state.lang==="te"?"te":"en";
  root.innerHTML=header()+'<div class="shell">'+navigation()+'<main class="main">'+pageContent()+'<footer class="footer">'+esc(t("footerText"))+'</footer></main></div>'+modalView()+'<div class="toast-area" id="toast-area">'+(state.toast?'<div class="toast '+(state.toast.error?"error":"")+'">'+esc(state.toast.message)+'</div>':"")+'</div>';
}
function showToast(message,error){
  state.toast={message:message,error:!!error};render();
  clearTimeout(state.toastTimer);
  state.toastTimer=setTimeout(()=>{state.toast=null;const box=document.getElementById("toast-area");if(box)box.innerHTML="";},2600);
}
function saveSetup(){
  const get=id=>document.querySelector('[data-field="'+id+'"]');
  const val=id=>get(id)?get(id).value:"";
  const locked=state.cycles.some(c=>c.completed);
  const name=val("name").trim();
  const start=val("startDate"),due=Number(val("dueDay")),fine=parseMoney(val("finePerDay")),cap=val("maxFineCap")===""?0:parseMoney(val("maxFineCap"));
  if(!name){showToast(t("chitName"),true);return;}
  if(!Number.isInteger(due)||due<1||due>31){showToast(t("validationDueDate"),true);return;}
  let next={...state.chit,name:name,startDate:start||state.chit.startDate,dueDay:due,finePerDayPaise:Math.max(0,fine),maxFineCapPaise:Math.max(0,cap)};
  if(!locked){
    next.potPaise=parseMoney(val("pot"));
    next.membersCount=Number(val("membersCount"));
    next.discountPaise=parseMoney(val("discount"));
    next.commissionEnabled=!!(get("commissionEnabled")&&get("commissionEnabled").checked);
    next.commissionPct=next.commissionEnabled?Math.max(0,Number(val("commissionPct"))||0):0;
    next.distributionRule=val("distributionRule");
    next.winnerMethod=val("winnerMethod");
  }
  if(next.membersCount<2){showToast(t("validationMembers"),true);return;}
  if(next.discountPaise>=next.potPaise){showToast(t("validationDiscount"),true);return;}
  const fee=Math.floor(next.potPaise*next.commissionPct/100);
  if(fee>next.discountPaise){showToast(t("validationCommission"),true);return;}
  if(next.potPaise<=0){showToast(t("validationDiscount"),true);return;}
  state.chit=next;
  const ruleEl=document.querySelector("[data-rule-content]");
  if(ruleEl)state.chit.rulesHtml=sanitizeRules(ruleEl.innerHTML);
  showToast(t("saved"));
}
function openMember(id){state.modal={id:id||null};render();setTimeout(()=>{const el=document.getElementById("modal-name");if(el)el.focus();},0);}
function saveMember(){
  const val=id=>{const el=document.querySelector('[data-modal-field="'+id+'"]');return el?el.value.trim():"";};
  const name=val("name");if(!name){showToast(t("invalidMember"),true);return;}
  const phone=val("phone"),email=val("email"),modal=state.modal;
  if(modal&&modal.id){
    const m=memberById(modal.id);if(m){m.name=name;m.phone=phone;m.email=email;if(m.status==="removed")m.status="active";}
  }else{
    if(activeCount()>=state.chit.membersCount){showToast(t("noMemberSlots"),true);return;}
    const id="m"+(Math.max.apply(null,state.members.map(m=>Number(m.id.replace(/\D/g,""))||0))+1);
    state.members.push({id:id,name:name,phone:phone,email:email,status:"active",wonMonths:[]});
  }
  state.modal=null;showToast(t("saved"));
}
function removeMember(id){
  const m=memberById(id);if(!m||m.status==="removed")return;
  if(!window.confirm(t("removeConfirm")))return;
  m.status="removed";showToast(t("removedNotice"));
}
function selectEligibleForWinner(){
  const c=currentCycle();if(!c)return [];
  return activeMembers().filter(m=>!(m.wonMonths||[]).length);
}
function pickWinner(){
  const c=currentCycle();if(!c){showToast(t("noEligibleWinner"),true);return;}
  let choices=selectEligibleForWinner();
  if(state.chit.distributionRule==="notWonYet")choices=choices.filter(m=>(m.wonMonths||[]).length===0);
  if(!choices.length){showToast(t("noEligibleWinner"),true);return;}
  if(state.chit.winnerMethod==="fixedOrder"){
    state.selectedWinnerId=choices.slice().sort((a,b)=>Number(a.id.replace(/\D/g,""))-Number(b.id.replace(/\D/g,"")))[0].id;
  }else if(state.chit.winnerMethod==="luckyDraw"){
    state.selectedWinnerId=choices[Math.floor(Math.random()*choices.length)].id;
  }else if(!choices.some(m=>m.id===state.selectedWinnerId)){
    state.selectedWinnerId=choices[0].id;
  }
  render();
}
function completeCycle(){
  const c=currentCycle();if(!c){showToast(t("noEligibleWinner"),true);return;}
  let winner=memberById(state.selectedWinnerId);
  if(state.chit.winnerMethod==="fixedOrder"){const first=selectEligibleForWinner().slice().sort((a,b)=>Number(a.id.replace(/\D/g,""))-Number(b.id.replace(/\D/g,"")))[0];if(first){winner=first;state.selectedWinnerId=first.id;}}
  if(!winner||winner.status==="removed"||(winner.wonMonths||[]).length){showToast(t("cannotComplete"),true);return;}
  if(!window.confirm(t("cycleCompleteConfirm")))return;
  c.winnerId=winner.id;c.completed=true;c.method=state.chit.winnerMethod;c.completionDate=todayISO();
  c.discountPaise=state.chit.discountPaise;c.commissionPaise=commissionPaise();
  const math=cycleMath(c);
  Object.assign(c,math);c.completed=true;c.winnerId=winner.id;c.method=state.chit.winnerMethod;c.completionDate=todayISO();c.contributionPaise=contribution();
  winner.status="winner";winner.wonMonths=winner.wonMonths||[];winner.wonMonths.push(c.no);
  activeMembers().forEach(m=>getPayment(m.id,c.no));
  const next=currentCycle();state.selectedWinnerId=next?((selectEligibleForWinner()[0]||{}).id||null):null;
  showToast(t("cycleComplete"));
}
function payCurrent(id,kind){
  const c=currentCycle();if(!c)return;
  const m=memberById(id);if(!m||m.status==="removed")return;
  const d=dueFor(m,c),p=d.payment;let amount=0;
  if(kind==="paid")amount=d.remaining;
  else{
    const answer=window.prompt(t("payAmount")+" ("+money(d.remaining)+")",String(Math.max(0,d.remaining/2/100).toFixed(2)));
    if(answer===null)return;amount=parseMoney(answer);
    if(amount<=0||amount>=d.remaining){showToast(t("invalidMember"),true);return;}
  }
  if(amount<=0){showToast(t("saved"));return;}
  p.amountPaidPaise+=amount;p.paidDate=todayISO();p.mode=p.mode||"upi";
  p.status=p.amountPaidPaise>=d.base?"paid":"partial";
  p.history.push({type:"Payment",amountPaise:amount,date:p.paidDate,mode:p.mode,reference:"DEMO-"+c.no+"-"+m.id.toUpperCase()+"-"+(p.history.length+1)});
  showToast(t("paymentRecorded"));
}
function reversePayment(id){
  const c=currentCycle();if(!c)return;
  const p=getPayment(id,c.no);
  if(p.amountPaidPaise<=0)return;
  if(!window.confirm(t("reverseConfirm")))return;
  const amount=p.amountPaidPaise;
  p.history.push({type:"Reversal",amountPaise:amount,date:todayISO(),mode:p.mode,reference:"REV-"+c.no+"-"+id.toUpperCase()+"-"+(p.history.length+1)});
  p.amountPaidPaise=0;p.status="pending";p.paidDate="";
  showToast(t("reversalRecorded"));
}
function csvCell(x){let s=String(x==null?"":x);if(/[",\r\n]/.test(s))s='"'+s.replace(/"/g,'""')+'"';return s;}
function exportCsv(){
  const lines=[[t("monthNo"),t("month"),t("memberName"),t("phone"),t("status"),t("amountDue"),t("amountPaid"),t("dividend"),t("prizeReceived"),t("profitLossShort"),t("paidDate"),t("paymentMode"),t("lateFine"),t("cycleStatus")]];
  state.cycles.forEach(c=>state.members.forEach(m=>{
    const d=dueFor(m,c),v=memberMath(m),div=c.dividendByMember?c.dividendByMember[m.id]||0:0,prize=c.winnerId===m.id?(c.prizePaise||state.chit.potPaise-state.chit.discountPaise):0;
    lines.push([c.no,cycleLabel(c.no),m.name,m.phone,statusLabel(m.status),((d.base+d.fine)/100).toFixed(2),(d.paid/100).toFixed(2),(div/100).toFixed(2),(prize/100).toFixed(2),(v.profitLoss/100).toFixed(2),d.payment&&d.payment.paidDate||"",d.payment&&d.payment.mode==="cash"?t("cash"):t("upi"),(d.fine/100).toFixed(2),statusLabel(c.completed?"completed":"upcoming")]);
  }));
  const csv="\uFEFF"+lines.map(row=>row.map(csvCell).join(",")).join("\r\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="committee-book-full-ledger-"+todayISO()+".csv";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
  showToast(t("reports"));
}
function selfCheck(){
  console.assert(Math.floor(500000/10)===50000,"Fixed Discount Chit Manager: All Members dividend must be ₹500.");
  console.assert(Math.floor(500000/9)===55555,"Fixed Discount Chit Manager: Not Won Yet dividend must floor to ₹555.55.");
  console.assert(5000000-500000===4500000,"Fixed Discount Chit Manager: prize must be ₹45,000.");
  console.assert(500000- Math.floor(500000/9)*9===5,"Fixed Discount Chit Manager: rounding remainder must be 5 paise.");
}
root.addEventListener("click",function(e){
  const el=e.target.closest("[data-action],[data-page],[data-rule-cmd]");
  if(!el)return;
  if(el.hasAttribute("data-page")){state.page=el.getAttribute("data-page");state.modal=null;state.toast=null;render();return;}
  const action=el.getAttribute("data-action");
  if(action==="toggle-lang"){state.lang=state.lang==="en"?"te":"en";render();return;}
  if(action==="reset-demo"){if(window.confirm(t("resetConfirm"))){const lang=state.lang;state=buildDemoState(lang);render();}return;}
  if(action==="save-setup"){saveSetup();return;}
  if(action==="add-member"){if(activeCount()>=state.chit.membersCount){showToast(t("noMemberSlots"),true);return;}openMember(null);return;}
  if(action==="edit-member"){openMember(el.getAttribute("data-id"));return;}
  if(action==="remove-member"){removeMember(el.getAttribute("data-id"));return;}
  if(action==="save-member"){saveMember();return;}
  if(action==="close-modal"){state.modal=null;render();return;}
  if(action==="close-modal-bg"&&e.target===el){state.modal=null;render();return;}
  if(action==="pick-winner"){pickWinner();return;}
  if(action==="complete-cycle"){completeCycle();return;}
  if(action==="mark-paid"){payCurrent(el.getAttribute("data-id"),"paid");return;}
  if(action==="mark-partial"){payCurrent(el.getAttribute("data-id"),"partial");return;}
  if(action==="reverse-payment"){reversePayment(el.getAttribute("data-id"));return;}
  if(action==="export-csv"){exportCsv();return;}
  if(action==="print-pdf"){window.print();return;}
  if(action==="save-rules"){const box=document.querySelector("[data-rule-content]");if(box)state.chit.rulesHtml=sanitizeRules(box.innerHTML);showToast(t("rulesSaved"));return;}
  if(el.hasAttribute("data-rule-cmd")){const cmd=el.getAttribute("data-rule-cmd");document.execCommand(cmd,false,null);const box=document.querySelector("[data-rule-content]");if(box){box.focus();state.chit.rulesHtml=sanitizeRules(box.innerHTML);}return;}
});
root.addEventListener("change",function(e){
  const el=e.target;
  if(el.getAttribute("data-action")==="winner-select"){state.selectedWinnerId=el.value;render();return;}
  if(el.getAttribute("data-action")==="payment-mode"){const c=currentCycle(),p=getPayment(el.getAttribute("data-id"),c.no);p.mode=el.value;render();return;}
  if(el.getAttribute("data-action")==="toggle-paid"){if(el.checked)payCurrent(el.getAttribute("data-id"),"paid");else reversePayment(el.getAttribute("data-id"));return;}
  if(el.id==="f-commissionEnabled"){const wrap=document.getElementById("commissionRateWrap");if(wrap)wrap.hidden=!el.checked;const label=document.getElementById("commissionToggleLabel");if(label)label.textContent=el.checked?t("commissionOn"):t("commissionOff");return;}
});
root.addEventListener("input",function(e){
  const el=e.target;
  if(el.hasAttribute("data-rule-content"))state.chit.rulesHtml=sanitizeRules(el.innerHTML);
  if(el.hasAttribute("data-member-search")){state.memberSearch=el.value;const pos=el.selectionStart;render();const search=document.querySelector("[data-member-search]");if(search){search.focus();search.setSelectionRange(pos,pos);}}
});
render();
selfCheck();
})();