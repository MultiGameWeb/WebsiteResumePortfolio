(function(){
"use strict";
const cfg=window.COMMITTEE_BOOK_SUPABASE_CONFIG||{};
let client=null;
function getClient(){
 if(client)return client;
 if(!cfg.url||!cfg.anonKey||!window.supabase||typeof window.supabase.createClient!=="function")return null;
 client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 return client;
}
const configured=()=>!!getClient();
async function signInGoogle(){
 const c=getClient();if(!c)throw new Error("Supabase URL/public anon key is not configured.");
 const {error}=await c.auth.signInWithOAuth({provider:"google",options:{redirectTo:window.location.href}});
 if(error)throw error;
}
async function signOut(){const c=getClient();if(!c)return;const {error}=await c.auth.signOut();if(error)throw error;}
async function getUser(){
 const c=getClient();if(!c)return null;
 const {data,error}=await c.auth.getUser();if(error)throw error;return data.user||null;
}
function moneyToNumber(v){return Number(v||0)/100;}
function monthIso(start,monthNo){const d=new Date(start+"T00:00:00");d.setMonth(d.getMonth()+Number(monthNo)-1);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
async function loadWorkspace(requestedChitId){
 const c=getClient();if(!c)throw new Error("Supabase is not configured.");
 const {data:{user},error:userError}=await c.auth.getUser();if(userError)throw userError;if(!user)return {user:null,chits:[],workspace:null};
 const {data:chits,error}=await c.from("chits").select("*").order("created_at",{ascending:false});
 if(error)throw error;
 const list=chits||[];
 if(!list.length)return {user:user,chits:[],workspace:null};
 let chit=(requestedChitId&&list.find(x=>x.id===requestedChitId))||list.find(x=>x.owner_id===user.id)||list[0];
 const [memberRes,cycleRes,bidRes,paymentRes,dividendRes]=await Promise.all([
  c.from("members").select("*").eq("chit_id",chit.id).order("created_at",{ascending:true}),
  c.from("monthly_cycles").select("*").eq("chit_id",chit.id).order("month_no",{ascending:true}),
  c.from("auction_bids").select("*").eq("chit_id",chit.id).order("created_at",{ascending:true}),
  c.from("payments").select("*").eq("chit_id",chit.id).order("created_at",{ascending:true}),
  c.from("dividend_history").select("*").eq("chit_id",chit.id).order("created_at",{ascending:true})
 ]);
 for(const res of [memberRes,cycleRes,bidRes,paymentRes,dividendRes])if(res.error)throw res.error;
 const members=(memberRes.data||[]).map(m=>({id:m.id,dbId:m.id,name:m.name,phone:m.phone||"",email:m.email||"",status:m.status,authUserId:m.auth_user_id,kycDocPath:m.kyc_doc_path,wonMonths:[]}));
 const cycleIdToNo=new Map();
 const cycles=(cycleRes.data||[]).map(cy=>{
  cycleIdToNo.set(cy.id,cy.month_no);
  const m=new Date(cy.auction_starts_at);
  return {dbId:cy.id,monthNo:cy.month_no,status:cy.status,winnerId:cy.winner_member_id,winningBidPaise:cy.winning_bid_paise,prizePaise:cy.prize_paise||0,discountPaise:cy.discount_paise||0,commissionPaise:cy.commission_paise||0,dividendPerHeadPaise:cy.dividend_per_head_paise||0,dividendPoolPaise:cy.dividend_pool_paise||0,leftoverPaise:cy.rounding_leftover_paise||0,completedAt:cy.completed_at,dueDate:cy.due_date,baseContributionPaise:cy.base_contribution_paise,startingFloorPaise:cy.floor_price_paise,maxDiscountPct:cy.max_discount_pct,memberCount:cy.member_count,dividendRule:cy.dividend_rule,commissionPct:cy.commission_pct,lateFinePerDayPaise:cy.late_fine_per_day_paise,periodStartDate:monthIso(chit.start_date,cy.month_no),auctionStartsAt:cy.auction_starts_at,auctionEndsAt:cy.auction_ends_at});
 });
 members.forEach(m=>{cycles.forEach(cy=>{if(cy.winnerId===m.id){m.status="winner";m.wonMonths.push(cy.monthNo);}});});
 const bids=(bidRes.data||[]).map(b=>({id:b.id,dbId:b.id,memberId:b.member_id,cycleNo:cycleIdToNo.get(b.cycle_id),cycleDbId:b.cycle_id,amountPaise:b.amount_paise,status:b.status,createdAt:b.created_at,approvedAt:b.approved_at,approvedBy:b.approved_by}));
 const payRows=paymentRes.data||[],byPayment=new Map(),payments=[];
 payRows.forEach(p=>{
  let g=byPayment.get(p.member_id+"|"+cycleIdToNo.get(p.cycle_id));
  if(!g){g={id:p.id,dbId:p.id,memberId:p.member_id,cycleNo:cycleIdToNo.get(p.cycle_id),paidPaise:0,status:"pending",mode:p.mode||"upi",paidAt:"",history:[],entries:[]};byPayment.set(p.member_id+"|"+g.cycleNo,g);payments.push(g);}
  const item={dbId:p.id,type:p.entry_type==="reversal"?"reversal":"payment",amountPaise:p.amount_paise,date:p.created_at,mode:p.mode,ref:p.id,status:p.status};
  g.entries.push(item);
  if(p.status==="confirmed"){
   g.history.push({type:item.type,amountPaise:item.amountPaise,date:item.date,mode:item.mode,ref:item.ref});
   if(item.type==="reversal")g.paidPaise-=item.amountPaise;else g.paidPaise+=item.amountPaise;
   if(item.type==="payment"&&(!g.paidAt||new Date(item.date)>new Date(g.paidAt)))g.paidAt=item.date;
   g.mode=p.mode||g.mode;
  }else if(p.status==="reported"){
   g.history.push({...item,type:"reported"});
  }
 });
 payments.forEach(p=>{p.paidPaise=Math.max(0,p.paidPaise);p.status=p.paidPaise>0?"paid":"pending";});
 const dividendHistory=(dividendRes.data||[]).map(d=>({dbId:d.id,cycleNo:cycleIdToNo.get(d.cycle_id),memberId:d.member_id,amountPaise:d.amount_paise,createdAt:d.created_at}));
 const isOwner=chit.owner_id===user.id;
 const mappedChit={dbId:chit.id,name:chit.name,potPaise:chit.pot_paise,memberCount:chit.member_count,startingFloorPaise:chit.starting_floor_paise,maxDiscountPct:Number(chit.max_discount_pct),commissionPct:Number(chit.commission_pct),dividendRule:chit.dividend_rule==="non_winners"?"nonWinners":"allMembers",startDate:chit.start_date,auctionStartDay:chit.auction_start_day,auctionEndDay:chit.auction_end_day,dueDay:chit.due_day,lateFinePerDayPaise:chit.late_fine_per_day_paise,upiId:chit.upi_id||"",status:chit.status};
 const workspace={chit:mappedChit,members:members,cycles:cycles,bids:bids,payments:payments,dividendHistory:dividendHistory,rulesHtml:chit.rules_html||"",role:isOwner?"organizer":"member",previewMemberId:(members.find(m=>m.authUserId===user.id)||members.find(m=>m.status!=="removed")||{}).id||null,selectedMonth:cycles.find(cy=>cy.status!=="completed")?.monthNo||cycles.length};
 return {user:user,chits:list.map(x=>({id:x.id,name:x.name,ownerId:x.owner_id})),workspace:workspace};
}
async function createWorkspace(chit,members){
 const c=getClient(),user=await getUser();if(!c||!user)throw new Error("Sign in with Google before creating a live chit.");
 const values={owner_id:user.id,name:chit.name,pot_paise:chit.potPaise,member_count:chit.memberCount,starting_floor_paise:chit.startingFloorPaise,max_discount_pct:chit.maxDiscountPct,commission_pct:chit.commissionPct,dividend_rule:chit.dividendRule==="nonWinners"?"non_winners":"all_members",start_date:chit.startDate,auction_start_day:chit.auctionStartDay,auction_end_day:chit.auctionEndDay,due_day:chit.dueDay,late_fine_per_day_paise:chit.lateFinePerDayPaise,upi_id:chit.upiId||null,rules_html:chit.rulesHtml||"",status:"active"};
 const {data,error}=await c.from("chits").insert(values).select("*").single();if(error)throw error;
 const rows=[];
 for(let i=0;i<chit.memberCount;i++){
  const m=members&&members[i];
  rows.push({chit_id:data.id,name:m&&m.name&&!/^((Ravi Kumar)|(Lakshmi Devi)|(Suresh Reddy)|(Anitha Rao)|(Kiran Kumar)|(Priya Sharma)|(Mahesh Babu)|(Swathi Rani)|(Naveen Kumar)|(Deepa Lakshmi))$/.test(m.name)?m.name:"Member "+String(i+1).padStart(2,"0"),phone:m&&m.name&&m.name.startsWith("Member ")?m.phone||null:null,email:m&&m.name&&m.name.startsWith("Member ")?m.email||null:null,status:"active"});
 }
 const {error:memberError}=await c.from("members").insert(rows);
 if(memberError)throw memberError;
 const {error:cycleError}=await c.rpc("initialize_chit_cycles",{p_chit_id:data.id});
 if(cycleError)throw cycleError;
 return data.id;
}
async function saveChit(chitId,chit,rulesHtml){
 const c=getClient();if(!c||!chitId)throw new Error("No connected chit is selected.");
 const {error}=await c.from("chits").update({name:chit.name,pot_paise:chit.potPaise,member_count:chit.memberCount,starting_floor_paise:chit.startingFloorPaise,max_discount_pct:chit.maxDiscountPct,commission_pct:chit.commissionPct,dividend_rule:chit.dividendRule==="nonWinners"?"non_winners":"all_members",start_date:chit.startDate,auction_start_day:chit.auctionStartDay,auction_end_day:chit.auctionEndDay,due_day:chit.dueDay,late_fine_per_day_paise:chit.lateFinePerDayPaise,upi_id:chit.upiId||null,rules_html:rulesHtml||""}).eq("id",chitId);
 if(error)throw error;
 const {error:syncError}=await c.rpc("sync_open_auction_cycles",{p_chit_id:chitId});if(syncError)throw syncError;
}
async function saveMember(chitId,m){
 const c=getClient();if(!c)throw new Error("Supabase is not configured.");
 if(m.dbId){const {error}=await c.from("members").update({name:m.name,phone:m.phone||null,email:m.email||null,status:m.status}).eq("id",m.dbId).eq("chit_id",chitId);if(error)throw error;return m.dbId;}
 const {data,error}=await c.from("members").insert({chit_id:chitId,name:m.name,phone:m.phone||null,email:m.email||null,status:m.status||"active"}).select("id").single();if(error)throw error;return data.id;
}
async function placeBid(cycleId,amountPaise){const c=getClient();if(!c)throw new Error("Supabase is not configured.");const {data,error}=await c.rpc("place_auction_bid",{p_cycle_id:cycleId,p_amount_paise:amountPaise});if(error)throw error;return data;}
async function approveBid(bidId,approve){const c=getClient();if(!c)throw new Error("Supabase is not configured.");const {error}=await c.rpc("approve_auction_bid",{p_bid_id:bidId,p_approve:!!approve});if(error)throw error;}
async function declareWinner(cycleId){const c=getClient();if(!c)throw new Error("Supabase is not configured.");const {data,error}=await c.rpc("declare_auction_winner",{p_cycle_id:cycleId});if(error)throw error;return data;}
async function autoDeclare(){const c=getClient();if(!c)throw new Error("Supabase is not configured.");const {data,error}=await c.rpc("auto_declare_due_auctions");if(error)throw error;return data;}
async function recordPayment(cycleId,memberId,amountPaise,mode,notes){const c=getClient();if(!c)throw new Error("Supabase is not configured.");const {data,error}=await c.rpc("record_organizer_payment",{p_cycle_id:cycleId,p_member_id:memberId,p_amount_paise:amountPaise,p_mode:mode||"cash",p_notes:notes||null});if(error)throw error;return data;}
async function submitPayment(cycleId,amountPaise,mode,screenshotPath){const c=getClient();if(!c)throw new Error("Supabase is not configured.");const {data,error}=await c.rpc("submit_payment_report",{p_cycle_id:cycleId,p_amount_paise:amountPaise,p_mode:mode||"upi",p_screenshot_path:screenshotPath||null});if(error)throw error;return data;}
async function confirmPayment(paymentId,approve,notes){const c=getClient();if(!c)throw new Error("Supabase is not configured.");const {error}=await c.rpc("confirm_payment_report",{p_payment_id:paymentId,p_approve:!!approve,p_notes:notes||null});if(error)throw error;}
async function reversePayment(paymentId,notes){const c=getClient();if(!c)throw new Error("Supabase is not configured.");const {data,error}=await c.rpc("reverse_confirmed_payment",{p_payment_id:paymentId,p_notes:notes||null});if(error)throw error;return data;}
async function uploadPrivateFile(chitId,memberId,file){
 const c=getClient();if(!c)throw new Error("Supabase is not configured.");
 const clean=String(file.name||"document").replace(/[^a-zA-Z0-9._-]/g,"_"),path=chitId+"/"+memberId+"/"+Date.now()+"-"+clean;
 const {error}=await c.storage.from("chit-private-docs").upload(path,file,{upsert:false,contentType:file.type||"application/octet-stream"});if(error)throw error;return path;
}
async function signedFileUrl(path,seconds){
 const c=getClient();if(!c)throw new Error("Supabase is not configured.");
 const {data,error}=await c.storage.from("chit-private-docs").createSignedUrl(path,seconds||120);if(error)throw error;return data.signedUrl;
}
window.AuctionChitBackend={configured:configured,client:getClient,signInGoogle:signInGoogle,signOut:signOut,getUser:getUser,loadWorkspace:loadWorkspace,createWorkspace:createWorkspace,saveChit:saveChit,saveMember:saveMember,placeBid:placeBid,approveBid:approveBid,declareWinner:declareWinner,autoDeclare:autoDeclare,recordPayment:recordPayment,submitPayment:submitPayment,confirmPayment:confirmPayment,reversePayment:reversePayment,uploadPrivateFile:uploadPrivateFile,signedFileUrl:signedFileUrl};
})();