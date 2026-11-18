/* SiteCraft Resume Builder extras — all in the browser, no backend, free.
 * 1. Job examples: ready summary, skills and work bullets for common jobs (office and non-office).
 * 2. Cover letter: made from the resume details; edit, copy, download PDF or Word.
 * 3. My resumes: keep several resumes (e.g. one for IT jobs, one for teaching) on this device.
 * 4. Phone guide: one section at a time with Back / Next on small screens.
 * Uses window.SCResume (exposed by resume-builder.html). */
(function(){
'use strict';
var R=window.SCResume;if(!R)return;
var $=function(s,r){return (r||document).querySelector(s)},esc=R.esc;
var norm=function(v){return String(v==null?'':v).trim()};

/* ------------------------------------------------------------------ 1. Job examples */
var JOBS=[
 {id:'fresher',title:'Fresher / Graduate',headline:'Graduate seeking an entry-level role',summary:'Recent graduate with good communication skills, basic computer knowledge and a strong willingness to learn. Comfortable working in a team, following processes and meeting deadlines. Looking for an entry-level role where I can contribute and grow.',skills:['MS Office (Word, Excel)','Communication','Teamwork','Time management','Basic English typing','Problem solving'],role:'Intern / Project trainee',bullets:['Completed a final-year project and presented the results to faculty.','Worked in a team of 4 to plan tasks and finish work on time.','Prepared reports and presentations using MS Word and PowerPoint.']},
 {id:'software',title:'Software Developer',headline:'Software Developer',summary:'Software developer with experience building and maintaining web applications. Comfortable with JavaScript, a backend language and SQL databases. Writes clean, tested code and works well with designers, testers and product teams.',skills:['JavaScript','HTML & CSS','React','Node.js','SQL','Git','REST APIs','Unit testing'],role:'Software Developer',bullets:['Built and maintained features for a web application used by customers every day.','Fixed bugs and improved page load speed by optimising queries and code.','Wrote unit tests and reviewed code with the team before release.','Worked with designers and testers to deliver features on schedule.']},
 {id:'teacher',title:'Teacher',headline:'School Teacher',summary:'Dedicated teacher experienced in planning lessons, managing classrooms and helping students understand concepts clearly. Uses simple examples, activities and regular feedback to improve results. Good communication with students and parents.',skills:['Lesson planning','Classroom management','Student assessment','Parent communication','Smart board / digital teaching','Patience'],role:'Teacher',bullets:['Taught classes and prepared lesson plans as per the syllabus.','Conducted tests, checked answer sheets and tracked each student’s progress.','Gave extra support to students who needed help and improved class results.','Met parents regularly to share progress and concerns.']},
 {id:'nurse',title:'Nurse / Staff Nurse',headline:'Staff Nurse',summary:'Caring and responsible staff nurse experienced in patient care, medication, vital signs and maintaining records. Works calmly in busy wards, follows hospital protocols and supports doctors and patients with kindness.',skills:['Patient care','Vital signs monitoring','Medication administration','IV & injections','Infection control','Patient records','BLS / First aid'],role:'Staff Nurse',bullets:['Provided daily care to patients and monitored vital signs.','Gave medicines and injections as prescribed by doctors.','Maintained accurate patient records and handover notes for every shift.','Explained care instructions to patients and families before discharge.']},
 {id:'accountant',title:'Accountant',headline:'Accountant',summary:'Accountant with hands-on experience in bookkeeping, GST, TDS, bank reconciliation and preparing financial statements. Accurate with numbers, good with Tally and Excel, and meets monthly and yearly deadlines.',skills:['Tally Prime','GST filing','TDS','Bank reconciliation','MS Excel','Accounts payable & receivable','Financial statements'],role:'Accountant',bullets:['Recorded daily transactions and maintained books of accounts in Tally.','Prepared and filed monthly GST returns and TDS payments on time.','Reconciled bank statements and followed up on pending payments.','Helped prepare monthly reports and year-end financial statements.']},
 {id:'sales',title:'Sales Executive',headline:'Sales Executive',summary:'Target-driven sales executive with experience in field and counter sales. Builds good relationships with customers, explains products clearly and follows up to close deals. Comfortable with daily targets and reporting.',skills:['Customer relationship','Product demonstration','Negotiation','Lead follow-up','Target achievement','CRM / sales reports','Local languages'],role:'Sales Executive',bullets:['Met customers, explained products and closed sales to meet monthly targets.','Followed up with leads by phone and visits to increase conversions.','Maintained daily sales reports and customer records.','Built repeat customers through good service and timely follow-up.']},
 {id:'support',title:'Customer Support / BPO',headline:'Customer Support Executive',summary:'Customer support executive experienced in handling calls, chats and emails politely and solving customer problems quickly. Good listening and communication skills in English and local languages, with accurate ticket records.',skills:['Customer handling','Call & chat support','Email support','Ticketing system','Problem solving','Typing speed','English & Hindi/Telugu'],role:'Customer Support Executive',bullets:['Handled customer calls and chats and resolved common issues on the first contact.','Recorded every request in the ticket system and escalated complex cases.','Maintained good customer satisfaction scores and quality ratings.','Helped new team members learn processes and tools.']},
 {id:'data-entry',title:'Data Entry Operator',headline:'Data Entry Operator',summary:'Accurate and fast data entry operator with good typing speed and knowledge of MS Excel. Experienced in entering, checking and updating records, and keeping files organised and confidential.',skills:['Typing (40+ WPM)','MS Excel','MS Word','Data accuracy','Record keeping','Google Sheets','Confidentiality'],role:'Data Entry Operator',bullets:['Entered and updated customer and sales data in Excel and company software.','Checked records for errors and corrected mistakes before reporting.','Scanned, filed and organised documents for easy access.','Completed daily entry targets on time.']},
 {id:'reception',title:'Receptionist / Front Office',headline:'Front Office Executive',summary:'Friendly front office executive experienced in welcoming visitors, answering calls, managing appointments and handling basic office work. Well organised, polite and good with people.',skills:['Front desk management','Phone handling','Appointment scheduling','Visitor management','MS Office','Communication','Cash handling'],role:'Receptionist',bullets:['Welcomed visitors and guided them to the right person or department.','Answered calls, took messages and managed appointment bookings.','Maintained visitor registers and handled courier and office supplies.','Kept the reception area clean, organised and professional.']},
 {id:'retail',title:'Shop / Retail Assistant',headline:'Retail Sales Assistant',summary:'Helpful retail assistant experienced in serving customers, billing, arranging stock and keeping the store neat. Honest with cash, quick at billing and good at suggesting the right products.',skills:['Customer service','Billing / POS','Cash handling','Stock arrangement','Product knowledge','Inventory counting'],role:'Retail Sales Assistant',bullets:['Helped customers find products and answered their questions.','Handled billing and cash accurately at the counter.','Arranged shelves, checked stock and informed the manager about low stock.','Kept the store clean and displays attractive.']},
 {id:'delivery',title:'Delivery Executive',headline:'Delivery Executive',summary:'Reliable delivery executive with a valid two-wheeler licence and good knowledge of local routes. Delivers orders on time, handles cash and online payments carefully and is polite with customers.',skills:['Two-wheeler driving licence','Local route knowledge','On-time delivery','Cash & UPI collection','Customer handling','Delivery apps'],role:'Delivery Executive',bullets:['Delivered 30+ orders a day on time using delivery apps and maps.','Collected cash and UPI payments and settled accounts daily.','Handled packages carefully and reported issues immediately.','Maintained good customer ratings.']},
 {id:'driver',title:'Driver',headline:'Professional Driver',summary:'Experienced and safe driver with a valid driving licence and a clean record. Knows city and highway routes well, maintains the vehicle in good condition and is punctual, polite and trustworthy.',skills:['Valid driving licence (LMV / HMV)','Safe driving','Route knowledge','Vehicle maintenance','Punctuality','GPS / maps'],role:'Driver',bullets:['Drove company / family vehicle safely for daily office and outstation trips.','Planned routes to reach on time and avoid traffic.','Kept the vehicle clean and arranged regular servicing.','Maintained trip logs, fuel records and vehicle documents.']},
 {id:'electrician',title:'Electrician',headline:'Electrician (ITI)',summary:'ITI-certified electrician experienced in house wiring, repair of electrical fittings, panel work and maintenance. Follows safety rules, finds faults quickly and finishes work neatly.',skills:['House & building wiring','Fault finding','Panel / DB installation','Motor & pump repair','Safety practices','Reading electrical drawings'],role:'Electrician',bullets:['Did wiring for new houses and shops as per the drawing.','Found and repaired faults in switches, fans, lights and motors.','Installed distribution boards, MCBs and earthing.','Followed safety rules and used proper tools and protective gear.']},
 {id:'plumber',title:'Plumber',headline:'Plumber',summary:'Skilled plumber experienced in pipe fitting, installing bathroom and kitchen fittings, fixing leaks and maintaining water lines. Works neatly, on time and with good customer communication.',skills:['Pipe fitting (PVC, CPVC, GI)','Leak repair','Bathroom & kitchen fittings','Water tank & motor connections','Drainage work','Reading plans'],role:'Plumber',bullets:['Installed pipelines and bathroom fittings in new buildings.','Repaired leaks, blockages and damaged pipes for homes and offices.','Connected water tanks, motors and geysers safely.','Explained the work and cost clearly to customers.']},
 {id:'security',title:'Security Guard',headline:'Security Guard',summary:'Alert and disciplined security guard experienced in guarding premises, checking visitors and vehicles, and handling emergencies. Punctual, honest and trained in basic fire safety and first aid.',skills:['Access control','Visitor & vehicle checking','CCTV monitoring','Patrolling','Fire safety','First aid','Register maintenance'],role:'Security Guard',bullets:['Checked visitors and vehicles and kept entry registers updated.','Patrolled the premises and reported any suspicious activity.','Monitored CCTV cameras during shifts.','Handled emergency situations calmly and informed the supervisor.']},
 {id:'cook',title:'Cook / Chef',headline:'Cook',summary:'Experienced cook skilled in South Indian, North Indian and Chinese dishes. Maintains taste and quality, keeps the kitchen clean and hygienic, and manages food preparation for large orders on time.',skills:['South & North Indian cooking','Chinese / fast food','Food hygiene','Menu planning','Bulk cooking','Kitchen inventory'],role:'Cook',bullets:['Prepared daily meals and special orders with consistent taste.','Planned menus and ordered vegetables, groceries and supplies.','Kept the kitchen and utensils clean and followed hygiene rules.','Cooked for events and large orders on time.']},
 {id:'mechanic',title:'Mechanic / Technician',headline:'Automobile Mechanic',summary:'Skilled mechanic experienced in servicing and repairing two-wheelers and cars. Diagnoses problems quickly, does quality repairs and explains the work clearly to customers.',skills:['Engine servicing','Brake & clutch repair','Electrical diagnosis','Periodic maintenance','Tools & equipment','Customer communication'],role:'Mechanic',bullets:['Serviced and repaired two-wheelers and cars as per the job card.','Diagnosed engine, brake and electrical problems.','Replaced parts and tested vehicles before delivery.','Kept the workshop and tools clean and organised.']},
 {id:'marketing',title:'Digital Marketing Executive',headline:'Digital Marketing Executive',summary:'Digital marketing executive experienced in social media, Google Ads, SEO and content. Plans campaigns, tracks results and improves reach and leads for small businesses and brands.',skills:['Social media marketing','Google Ads','SEO','Content writing','Canva','Google Analytics','Email marketing'],role:'Digital Marketing Executive',bullets:['Managed Instagram and Facebook pages and posted content regularly.','Ran Google and Meta ad campaigns within budget to generate leads.','Improved website SEO and tracked results in Google Analytics.','Prepared monthly reports with reach, leads and next steps.']},
 {id:'hr',title:'HR Executive',headline:'HR Executive',summary:'HR executive experienced in recruitment, onboarding, attendance, payroll support and employee records. Good communication skills and a people-first approach.',skills:['Recruitment','Onboarding','Attendance & leave','Payroll support','Employee records','MS Excel','Communication'],role:'HR Executive',bullets:['Posted jobs, screened resumes and scheduled interviews.','Handled joining formalities and onboarding of new employees.','Maintained attendance, leave and employee records.','Supported monthly payroll and answered employee queries.']},
 {id:'civil',title:'Civil / Site Engineer',headline:'Site Engineer (Civil)',summary:'Civil site engineer experienced in supervising construction work, checking quality, managing labour and materials and keeping the project on schedule. Reads drawings well and maintains daily site reports.',skills:['Site supervision','Reading drawings','Quantity estimation','Quality checking','AutoCAD','Labour management','Daily progress reports'],role:'Site Engineer',bullets:['Supervised daily construction work as per drawings and specifications.','Checked quality of materials and work and fixed issues early.','Planned labour and materials to keep the work on schedule.','Prepared daily progress reports for the project manager.']}
];
function addSkills(sec,list){if(!Array.isArray(sec.groups)||!sec.groups.length)sec.groups=[{name:'',items:[]}];var g=sec.groups[0];g.items=Array.isArray(g.items)?g.items:[];var have={};sec.groups.forEach(function(x){(x.items||[]).forEach(function(v){have[norm(v).toLowerCase()]=true})});list.forEach(function(v){if(!have[v.toLowerCase()]){g.items.push(v);have[v.toLowerCase()]=true}})}
function jobsModal(){
 var cur=R.get(),hasSummary=!!norm(cur.sections.summary&&cur.sections.summary.text),hasExp=(cur.sections.experience&&cur.sections.experience.items||[]).some(function(x){return norm(x.role)||norm(x.company)}),hasHead=!!norm(cur.sections.header&&cur.sections.header.headline);
 var m=modal('scJobsModal','Job examples','Pick your job to get a ready summary, skills and work points. Then change them to your real details.');
 var body=m.querySelector('.sc-x-body');
 body.innerHTML='<input class="sc-x-search" type="search" placeholder="Search a job: driver, nurse, teacher…" aria-label="Search jobs"><div class="sc-x-jobs" role="list"></div><div class="sc-x-jobview" hidden></div>';
 var list=body.querySelector('.sc-x-jobs'),view=body.querySelector('.sc-x-jobview'),search=body.querySelector('.sc-x-search');
 function draw(q){q=norm(q).toLowerCase();list.innerHTML=JOBS.filter(function(j){return !q||(j.title+' '+j.headline+' '+j.skills.join(' ')).toLowerCase().indexOf(q)>=0}).map(function(j){return '<button type="button" role="listitem" class="sc-x-job" data-job="'+j.id+'">'+esc(j.title)+'</button>'}).join('')||'<p class="sc-x-muted">No job found. Try another word, or pick the closest job.</p>'}
 draw('');search.addEventListener('input',function(){draw(search.value)});
 list.addEventListener('click',function(e){var b=e.target.closest('[data-job]');if(!b)return;var j=JOBS.find(function(x){return x.id===b.dataset.job});show(j)});
 function show(j){
  list.hidden=true;search.hidden=true;view.hidden=false;
  view.innerHTML='<button type="button" class="sc-x-link" data-back>← All jobs</button><h3>'+esc(j.title)+'</h3>'+
   '<label class="sc-x-check"><input type="checkbox" data-use="headline" '+(hasHead?'':'checked')+'> Job title under your name: <b>'+esc(j.headline)+'</b>'+(hasHead?' <small>(replaces yours)</small>':'')+'</label>'+
   '<label class="sc-x-check"><input type="checkbox" data-use="summary" '+(hasSummary?'':'checked')+'> Summary'+(hasSummary?' <small>(replaces yours)</small>':'')+'</label><p class="sc-x-sample">'+esc(j.summary)+'</p>'+
   '<label class="sc-x-check"><input type="checkbox" data-use="skills" checked> Add skills</label><p class="sc-x-sample">'+j.skills.map(esc).join(' · ')+'</p>'+
   '<label class="sc-x-check"><input type="checkbox" data-use="experience" '+(hasExp?'':'checked')+'> Add a work experience entry ('+esc(j.role)+')</label><ul class="sc-x-sample">'+j.bullets.map(function(b){return '<li>'+esc(b)+'</li>'}).join('')+'</ul>'+
   '<p class="sc-x-note">These are examples. Change them to what you really did — company names, years and numbers.</p>'+
   '<div class="sc-x-actions"><button type="button" class="btn soft" data-close>Cancel</button><button type="button" class="btn primary" data-apply>Add to my resume</button></div>';
  view.querySelector('[data-back]').onclick=function(){view.hidden=true;list.hidden=false;search.hidden=false;search.focus()};
  view.querySelector('[data-close]').onclick=function(){closeModal(m)};
  view.querySelector('[data-apply]').onclick=function(){
   var use={};view.querySelectorAll('[data-use]').forEach(function(c){use[c.dataset.use]=c.checked});
   if(!use.headline&&!use.summary&&!use.skills&&!use.experience){R.toast('Tick at least one item to add.','error');return}
   R.mutate(function(s){
    if(use.headline)s.sections.header.headline=j.headline;
    if(use.summary){s.sections.summary.text=j.summary;s.sections.summary.show=true}
    if(use.skills){addSkills(s.sections.skills,j.skills);s.sections.skills.show=true}
    if(use.experience){s.sections.experience.items.push({company:'Company name',role:j.role,location:'',start:'',end:'',currently:false,bullets:j.bullets.slice()});s.sections.experience.show=true}
   },'Example added — now change it to your real details');
   closeModal(m);
   if(use.experience)R.openSection('experience');else if(use.summary)R.openSection('summary');
  };
  view.querySelector('[data-apply]').focus();
 }
 openModal(m,search);
}

/* ------------------------------------------------------------------ 2. Cover letter */
var COVER_KEY='cover:';
function firstSentence(t){t=norm(t);var m=t.match(/^.*?[.!?](\s|$)/);return m?m[0].trim():t}
function makeLetter(s,f){
 var h=s.sections.header||{},exp=(s.sections.experience&&s.sections.experience.items||[]).filter(function(x){return norm(x.role)||norm(x.company)}),edu=(s.sections.education&&s.sections.education.items||[]).filter(function(x){return norm(x.degree)||norm(x.institution)});
 var skills=[];(s.sections.skills&&s.sections.skills.groups||[]).forEach(function(g){(g.items||[]).forEach(function(v){if(norm(v))skills.push(norm(v))})});
 var name=norm(h.name)||'Your Name',role=norm(f.role)||norm(h.headline)||'the open position',company=norm(f.company)||'your company',greet=norm(f.manager)?'Dear '+norm(f.manager)+',':'Dear Hiring Manager,';
 var friendly=f.tone==='friendly',p=[];
 var intro=friendly?'I was excited to see the '+role+' opening at '+company+' and would love to be considered.':'I am writing to apply for the position of '+role+' at '+company+'.';
 var sum=firstSentence(s.sections.summary&&s.sections.summary.text);
 p.push(intro+(sum?' '+sum:''));
 if(exp.length){var e=exp[0],line='In my '+(e.currently?'current':'recent')+' role'+(norm(e.role)?' as '+norm(e.role):'')+(norm(e.company)&&norm(e.company)!=='Company name'?' at '+norm(e.company):'')+', I';var b=(e.bullets||[]).map(norm).filter(Boolean).slice(0,2).map(function(x){return x.replace(/\.$/,'').replace(/^([A-Z])/,function(c){return c.toLowerCase()})});
  p.push(b.length?line+' '+b.join(', and ')+'.':line+' built practical experience that fits this role.');}
 else if(edu.length){var d=edu[0];p.push('I have completed '+(norm(d.degree)||'my studies')+(norm(d.field)?' in '+norm(d.field):'')+(norm(d.institution)?' from '+norm(d.institution):'')+', where I learned to work hard, learn quickly and work well in a team.');}
 if(skills.length)p.push('My key skills include '+(skills.length>1?skills.slice(0,5).slice(0,-1).join(', ')+' and '+skills.slice(0,5).slice(-1):skills[0])+'.'+(norm(f.why)?' '+norm(f.why).replace(/\.?$/,'.'):''));
 else if(norm(f.why))p.push(norm(f.why).replace(/\.?$/,'.'));
 p.push(friendly?'I would be happy to talk about how I can help your team. Thank you for your time — I look forward to hearing from you.':'I would welcome the opportunity to discuss how I can contribute to '+company+'. Thank you for considering my application. I look forward to hearing from you.');
 var contact=[norm(h.phone),norm(h.email),norm(h.location)].filter(Boolean).join(' · ');
 var date=new Date().toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
 return name+'\n'+(contact?contact+'\n':'')+'\n'+date+'\n\n'+greet+'\n\n'+p.join('\n\n')+'\n\n'+(friendly?'Best regards,':'Yours sincerely,')+'\n'+name;
}
function coverModal(){
 var s=R.get();
 var m=modal('scCoverModal','Cover letter','Made from your resume. Change anything you like, then download or copy it.');
 var body=m.querySelector('.sc-x-body');
 body.innerHTML='<div class="sc-x-grid"><label>Company<input data-f="company" placeholder="e.g. Infosys, Apollo Hospitals"></label><label>Job title<input data-f="role" placeholder="e.g. Staff Nurse"></label><label>Hiring manager (optional)<input data-f="manager" placeholder="e.g. Ms. Priya Rao"></label><label>Tone<select data-f="tone"><option value="formal">Formal</option><option value="friendly">Friendly</option></select></label><label class="sc-x-wide">Why this company? (optional, one line)<input data-f="why" placeholder="e.g. I admire your focus on patient care."></label></div>'+
  '<div class="sc-x-actions sc-x-left"><button type="button" class="btn soft" data-gen>Write letter from my resume</button></div>'+
  '<label class="sc-x-wide">Your letter<textarea class="sc-x-letter" rows="14" aria-label="Cover letter text"></textarea></label>'+
  '<div class="sc-x-actions"><button type="button" class="btn soft" data-copy>Copy</button><button type="button" class="btn soft" data-docx>Download Word</button><button type="button" class="btn primary" data-pdf>Download PDF</button></div>';
 var ta=body.querySelector('.sc-x-letter'),fields=function(){var o={};body.querySelectorAll('[data-f]').forEach(function(x){o[x.dataset.f]=x.value});return o};
 var key=COVER_KEY+(Lib.currentId||'current');
 idbGet(key).then(function(saved){if(saved&&saved.text){ta.value=saved.text;Object.keys(saved.fields||{}).forEach(function(k){var el=body.querySelector('[data-f="'+k+'"]');if(el)el.value=saved.fields[k]})}else{ta.value=makeLetter(s,fields())}}).catch(function(){ta.value=makeLetter(s,fields())});
 var store=function(){idbPut(key,{text:ta.value,fields:fields(),savedAt:Date.now()}).catch(function(){})};
 var t=null;body.addEventListener('input',function(){clearTimeout(t);t=setTimeout(store,500)});
 body.querySelector('[data-gen]').onclick=function(){if(norm(ta.value)&&ta.dataset.edited&&!confirm('Replace the letter text with a new one from your resume?'))return;ta.value=makeLetter(R.get(),fields());ta.dataset.edited='';store();R.toast('Letter written from your resume')};
 ta.addEventListener('input',function(){ta.dataset.edited='1'});
 var base=function(){var n=norm(s.sections.header.name).normalize('NFKD').replace(/[^\x00-\x7F]/g,'').replace(/[^a-z0-9]+/gi,'-').replace(/^-|-$/g,'').toLowerCase();return (n?n+'-':'')+'cover-letter'};
 body.querySelector('[data-copy]').onclick=function(){var v=ta.value;(navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(v):Promise.reject()).then(function(){R.toast('Letter copied')},function(){ta.select();try{document.execCommand('copy');R.toast('Letter copied')}catch(e){R.toast('Select the text and copy it.','error')}})};
 body.querySelector('[data-docx]').onclick=function(){if(!norm(ta.value)){R.toast('The letter is empty.','error');return}try{download(letterDocx(ta.value),base()+'.docx');R.toast('Word file downloaded')}catch(e){R.toast('Could not make the Word file.','error')}};
 body.querySelector('[data-pdf]').onclick=function(){if(!norm(ta.value)){R.toast('The letter is empty.','error');return}var b=this;b.disabled=true;b.textContent='Preparing…';letterPdf(ta.value).then(function(blob){download(blob,base()+'.pdf');R.toast('PDF downloaded')}).catch(function(){R.toast('Could not make the PDF. Try Download Word or Copy.','error')}).then(function(){b.disabled=false;b.textContent='Download PDF'})};
 openModal(m,body.querySelector('[data-f="company"]'));
}
function loadScript(src,name){return new Promise(function(res,rej){if(window[name])return res(window[name]);var x=document.createElement('script');x.src=src;x.onload=function(){window[name]?res(window[name]):rej(new Error('load'))};x.onerror=rej;document.head.appendChild(x)})}
function letterPdf(text){
 return loadScript('core/pdf-export.js','SiteCraftPdf').then(function(P){
  var w=794,h=1123,m=76,host=document.createElement('div');host.setAttribute('aria-hidden','true');
  host.style.cssText='position:fixed;left:-20000px;top:0;width:'+w+'px;background:#fff;color:#111827;padding:'+m+'px;box-sizing:border-box;font:11.5pt/1.55 Georgia,"Times New Roman",serif;white-space:pre-wrap;overflow-wrap:anywhere';
  host.innerHTML=text.split(/\n{2,}/).map(function(par){return '<p style="margin:0 0 12pt">'+esc(par)+'</p>'}).join('');
  document.body.appendChild(host);
  return P.capture(host,{pageW:w,pageH:h,margin:m,background:'#ffffff',title:'Cover letter'}).then(function(b){host.remove();return b},function(e){host.remove();throw e});
 });
}
// Word file: a small, standard .docx (stored ZIP), one paragraph per line.
var CRC=(function(){var t=[];for(var n=0;n<256;n++){var c=n;for(var k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(b){var c=0xFFFFFFFF;for(var i=0;i<b.length;i++)c=CRC[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zip(files){var enc=new TextEncoder(),parts=[],central=[],off=0;function u16(v){return[v&255,(v>>>8)&255]}function u32(v){return[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]}
 files.forEach(function(f){var nm=enc.encode(f.name),d=enc.encode(f.data),c=crc32(d);parts.push(new Uint8Array([].concat(u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(c),u32(d.length),u32(d.length),u16(nm.length),u16(0))),nm,d);
  central.push(new Uint8Array([].concat(u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(c),u32(d.length),u32(d.length),u16(nm.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(off))),nm);off+=30+nm.length+d.length});
 var size=central.reduce(function(a,b){return a+b.length},0);return new Blob(parts.concat(central,[new Uint8Array([].concat(u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(size),u32(off),u16(0)))]),{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'})}
function x(v){return String(v).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]}).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'')}
function letterDocx(text){
 var paras=text.split('\n').map(function(l){return '<w:p><w:pPr><w:spacing w:after="'+(l?'0':'120')+'"/></w:pPr>'+(l?'<w:r><w:t xml:space="preserve">'+x(l)+'</w:t></w:r>':'')+'</w:p>'}).join('');
 var doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+paras+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1300" w:right="1300" w:bottom="1300" w:left="1300" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>';
 var styles='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Nirmala UI"/><w:sz w:val="23"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults></w:styles>';
 return zip([
  {name:'[Content_Types].xml',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'},
  {name:'_rels/.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'},
  {name:'word/_rels/document.xml.rels',data:'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'},
  {name:'word/document.xml',data:doc},{name:'word/styles.xml',data:styles}
 ]);
}
function download(blob,name){var u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},60000)}

/* ------------------------------------------------------------------ 3. My resumes (same IndexedDB as the builder) */
function idb(){return new Promise(function(res,rej){if(!window.indexedDB)return rej(new Error('no idb'));var q=indexedDB.open('sitecraft-resume',1);q.onupgradeneeded=function(){if(!q.result.objectStoreNames.contains('state'))q.result.createObjectStore('state')};q.onsuccess=function(){res(q.result)};q.onerror=function(){rej(q.error)}})}
function idbRun(mode,fn){return idb().then(function(db){return new Promise(function(res,rej){var tx=db.transaction('state',mode),st=tx.objectStore('state'),out;var r=fn(st);if(r)r.onsuccess=function(){out=r.result};tx.oncomplete=function(){db.close();res(out)};tx.onerror=tx.onabort=function(){db.close();rej(tx.error)}})})}
function idbGet(k){return idbRun('readonly',function(st){return st.get(k)})}
function idbPut(k,v){return idbRun('readwrite',function(st){return st.put(v,k)})}
function idbDel(k){return idbRun('readwrite',function(st){return st.delete(k)})}
function idbList(){return idb().then(function(db){return new Promise(function(res,rej){var out=[],tx=db.transaction('state','readonly'),c=tx.objectStore('state').openCursor();c.onsuccess=function(){var cur=c.result;if(!cur)return;if(String(cur.key).indexOf('lib:')===0)out.push(cur.value);cur.continue()};tx.oncomplete=function(){db.close();res(out)};tx.onerror=function(){db.close();rej(tx.error)}})})}
var Lib={currentId:null,lastSaved:''};
function autoName(s){var h=s.sections&&s.sections.header||{};var n=[norm(h.name),norm(h.headline)].filter(Boolean).join(' — ');return n||'My resume'}
function uid(){return 'r'+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function syncCurrent(){
 if(!Lib.currentId)return Promise.resolve();
 var s=R.get(),json=JSON.stringify(s);if(json===Lib.lastSaved)return Promise.resolve();
 return idbGet('lib:'+Lib.currentId).then(function(e){e=e||{id:Lib.currentId,name:autoName(s),createdAt:Date.now()};if(!e.renamed)e.name=autoName(s);e.state=s;e.updatedAt=Date.now();return idbPut('lib:'+Lib.currentId,e)}).then(function(){Lib.lastSaved=json});
}
function initLib(){
 return idbGet('lib-current').then(function(id){
  if(id)return idbGet('lib:'+id).then(function(e){if(e){Lib.currentId=id;return}return create()});
  return create();
  function create(){var nid=uid(),s=R.get();Lib.currentId=nid;return idbPut('lib:'+nid,{id:nid,name:autoName(s),state:s,createdAt:Date.now(),updatedAt:Date.now()}).then(function(){return idbPut('lib-current',nid)})}
 }).catch(function(){Lib.currentId=null});
}
function resumesModal(){
 var m=modal('scResumesModal','My resumes','Keep a different resume for each kind of job. They are saved on this device only.');
 var body=m.querySelector('.sc-x-body');
 function draw(){
  syncCurrent().then(idbList).then(function(list){
   list.sort(function(a,b){return (b.updatedAt||0)-(a.updatedAt||0)});
   body.innerHTML='<div class="sc-x-actions sc-x-left"><button type="button" class="btn primary" data-new>＋ New empty resume</button><button type="button" class="btn soft" data-dup="'+esc(Lib.currentId||'')+'">Copy this resume</button></div><div class="sc-x-list">'+list.map(function(e){var cur=e.id===Lib.currentId;return '<div class="sc-x-row'+(cur?' cur':'')+'"><div><strong>'+esc(e.name||'My resume')+'</strong>'+(cur?' <span class="sc-x-badge">Open now</span>':'')+'<small>Changed '+esc(new Date(e.updatedAt||Date.now()).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}))+'</small></div><div class="sc-x-rowbtns">'+(cur?'':'<button type="button" class="btn soft" data-open="'+esc(e.id)+'">Open</button>')+'<button type="button" class="btn soft" data-rename="'+esc(e.id)+'">Rename</button><button type="button" class="btn soft" data-dup="'+esc(e.id)+'">Copy</button>'+(cur?'':'<button type="button" class="btn soft sc-x-danger" data-del="'+esc(e.id)+'">Delete</button>')+'</div></div>'}).join('')+'</div>';
  }).catch(function(){body.innerHTML='<p class="sc-x-muted">Saving several resumes needs browser storage, which is turned off here (for example in a private window). Use More → Save backup file instead.</p>'});
 }
 body.addEventListener('click',function(e){
  var b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-new')){syncCurrent().then(function(){R.empty();var nid=uid(),s=R.get();Lib.currentId=nid;Lib.lastSaved='';return idbPut('lib:'+nid,{id:nid,name:'New resume',state:s,createdAt:Date.now(),updatedAt:Date.now()}).then(function(){return idbPut('lib-current',nid)})}).then(function(){closeModal(m);R.toast('New empty resume started. Your other resumes are in My resumes.')});return}
  if(b.dataset.open){var id=b.dataset.open;syncCurrent().then(function(){return idbGet('lib:'+id)}).then(function(e){if(!e)return;R.replace(e.state,'Opened “'+(e.name||'resume')+'”');Lib.currentId=id;Lib.lastSaved=JSON.stringify(R.get());return idbPut('lib-current',id)}).then(function(){closeModal(m)}).catch(function(){R.toast('Could not open that resume.','error')});return}
  if(b.dataset.rename){idbGet('lib:'+b.dataset.rename).then(function(e){if(!e)return;var n=prompt('Name for this resume (only you see it)',e.name||'');if(n===null||!norm(n))return;e.name=norm(n).slice(0,80);e.renamed=true;return idbPut('lib:'+e.id,e)}).then(draw);return}
  if(b.dataset.dup){var did=b.dataset.dup;syncCurrent().then(function(){return idbGet('lib:'+did)}).then(function(e){if(!e)return;var nid=uid();return idbPut('lib:'+nid,{id:nid,name:(e.name||'Resume')+' (copy)',renamed:true,state:e.state,createdAt:Date.now(),updatedAt:Date.now()})}).then(function(){R.toast('Copy saved in My resumes');draw()});return}
  if(b.dataset.del){var del=b.dataset.del;idbGet('lib:'+del).then(function(e){if(!e||!confirm('Delete “'+(e.name||'this resume')+'” from this device? This cannot be undone.'))return;return idbDel('lib:'+del).then(function(){return idbDel(COVER_KEY+del)}).then(function(){R.toast('Resume deleted')})}).then(draw);return}
 });
 draw();openModal(m);
}

/* ------------------------------------------------------------------ 5. Match a job (keywords from a job ad) */
var STOP=('a an the and or of to in on for with at by from as is are be been being was were will would can could should must may might '+
 'this that these those it its we our you your they their them he she his her who whom which what when where why how all any each '+
 'more most other some such no not only own same so than too very just also into over under about across through within without per '+
 'job role position candidate candidates applicant company team teams work working years year experience experienced required requirement requirements '+
 'responsibilities responsibility preferred plus good strong excellent ability able knowledge understanding skills skill etc including include includes '+
 'looking join apply salary location full time part based day days week month months new using use used make making well high level').split(/\s+/);
var STOPSET={};STOP.forEach(function(w){STOPSET[w]=1});
function keyText(v){return String(v||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9+#.\s\/-]/g,' ').replace(/\s+/g,' ').trim()}
function resumeText(s){var out=[];(function walk(v){if(typeof v==='string')out.push(v);else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')Object.keys(v).forEach(function(k){if(k!=='photo')walk(v[k])})})(s.sections);(s.custom||[]).forEach(function(c){out.push(c.title||'',c.content||'');(c.bullets||[]).forEach(function(b){out.push(b)})});return ' '+keyText(out.join(' '))+' '}
// Common verbs and describing words are not keywords; they also mark where a skill phrase ends.
var SOFT=('provide provides providing maintain maintains maintaining follow follows following assist assists assisting administer administers educate educates monitor monitors monitoring '+
 'ensure ensures manage manages managing handle handles handling support supports supporting prepare prepares perform performs develop develops create creates build builds '+
 'deliver delivers coordinate coordinates help helps conduct conducts review reviews track tracks plan plans lead leads drive drives own owns write writes design designs '+
 'implement implements identify identifies improve improves deliver deliverables meet meets achieve achieves collaborate collaborates communicate willing ready need needs want '+
 'accurate valid caring general every various relevant basic proven minimum maximum excellent effective efficient strong good great best key main daily weekly monthly '+
 'prescribed during while via like etc ie eg hyderabad bangalore bengaluru chennai mumbai delhi pune india telangana remote onsite hybrid immediate urgent opening openings hiring').split(/\s+/);
SOFT.forEach(function(w){STOPSET[w]=1});
function jobKeywords(ad){
 var known={};JOBS.forEach(function(j){j.skills.forEach(function(sk){known[keyText(sk.replace(/\(.*?\)/g,''))]=sk.replace(/\s*\(.*?\)/g,'')})});
 var text=keyText(ad),score={},label={},isKnown={};
 // acronyms such as ICU, BLS, GST, SQL, HTML (2-6 capitals) are strong keywords
 (String(ad||'').match(/\b[A-Z][A-Z0-9+#]{1,5}\b/g)||[]).forEach(function(a){var k=a.toLowerCase();if(STOPSET[k])return;score[k]=(score[k]||0)+3;label[k]=a});
 // runs of words between common words: "vital signs", "patient records", "infection control"
 // names of tools written with a capital in the middle of a sentence: TypeScript, Redux, Jest, Excel
 (String(ad||'').match(/[a-z,]\s+[A-Z][A-Za-z0-9]*(?:\.[a-z]+)?[A-Za-z0-9+#]/g)||[]).forEach(function(m){var w=m.replace(/^[a-z,]\s+/,''),k=keyText(w);if(!k||STOPSET[k]||k.length<3||/^[A-Z0-9+#]+$/.test(w))return;score[k]=(score[k]||0)+2.5;label[k]=w});
 String(ad||'').split(/\.(?=\s|$)|[\n;:!?•·|,()–—]+|\s-\s/).forEach(function(chunk){
  var run=[];keyText(chunk).split(' ').concat(['the']).forEach(function(w){
   if(!w||STOPSET[w]||/^\d+$/.test(w)){
    if(run.length>=1&&run.length<=3){var k=run.join(' ');if(run.length>1||k.length>=4)score[k]=(score[k]||0)+(run.length===1?1:2.5)}
    run=[];return;
   }
   run.push(w);
  });
 });
 Object.keys(known).forEach(function(k){if(k&&text.indexOf(k)>=0){score[k]=(score[k]||0)+6;label[k]=known[k];isKnown[k]=1}});
 var keys=Object.keys(score).filter(function(k){return score[k]>=2.5||label[k]}).sort(function(a,b){return score[b]-score[a]||b.length-a.length});
 // keep the longer phrase when a short word is part of it
 var chosen=[];keys.forEach(function(k){if(chosen.length>=20)return;if(chosen.some(function(c){return (' '+c+' ').indexOf(' '+k+' ')>=0}))return;if(label[k]&&!isKnown[k]&&keys.some(function(o){return o!==k&&(' '+o+' ').indexOf(' '+k+' ')>=0&&score[o]>=2.5}))return;chosen=chosen.filter(function(c){return (' '+k+' ').indexOf(' '+c+' ')<0||isKnown[c]});chosen.push(k)});
 return chosen.map(function(k){return {key:k,label:label[k]||k}});
}
function matchModal(){
 var m=modal('scMatchModal','Match a job','Paste the job advertisement. See which important words your resume already has and which are missing.');
 var body=m.querySelector('.sc-x-body');
 body.innerHTML='<label class="sc-x-wide">Job advertisement<textarea class="sc-x-letter sc-x-ad" rows="8" placeholder="Paste the full job post here…"></textarea></label><div class="sc-x-actions sc-x-left"><button type="button" class="btn primary" data-check>Check my resume</button></div><div class="sc-x-result" aria-live="polite"></div>';
 var ad=body.querySelector('.sc-x-ad'),out=body.querySelector('.sc-x-result');
 try{ad.value=sessionStorage.getItem('sc-job-ad')||''}catch(e){}
 function check(){
  var v=ad.value;try{sessionStorage.setItem('sc-job-ad',v)}catch(e){}
  if(norm(v).split(/\s+/).length<15){out.innerHTML='<p class="sc-x-muted">Paste a longer job post (at least a few lines) to get useful results.</p>';return}
  var kws=jobKeywords(v),text=resumeText(R.get()),have=[],miss=[];
  kws.forEach(function(k){var words=k.key.split(' '),hit=text.indexOf(' '+k.key+' ')>=0||words.every(function(w){return text.indexOf(' '+w+' ')>=0||text.indexOf(' '+w.replace(/s$/,'')+' ')>=0||text.indexOf(' '+w+'s ')>=0});(hit?have:miss).push(k)});
  var pct=kws.length?Math.round(have.length/kws.length*100):0,tone=pct>=70?'#15803d':pct>=40?'#b45309':'#b91c1c';
  out.innerHTML='<div class="sc-x-score"><b style="color:'+tone+'">'+pct+'%</b><span>of the important words in this job post are in your resume ('+have.length+' of '+kws.length+').</span></div>'+
   '<h3 class="sc-x-h">Already in your resume</h3><div class="sc-x-chips">'+(have.map(function(k){return '<span class="sc-x-chip ok">✓ '+esc(k.label)+'</span>'}).join('')||'<span class="sc-x-muted">None yet.</span>')+'</div>'+
   '<h3 class="sc-x-h">Missing — add only what you really know or did</h3><div class="sc-x-chips">'+(miss.map(function(k){return '<button type="button" class="sc-x-chip add" data-add-skill="'+esc(k.label)+'" title="Add to Skills">＋ '+esc(k.label)+'</button>'}).join('')||'<span class="sc-x-muted">Nothing important is missing.</span>')+'</div>'+
   '<p class="sc-x-note">Tip: use the same words as the job post in your summary and work points, not only in Skills. Never add skills you do not have.</p>';
 }
 body.querySelector('[data-check]').onclick=check;
 out.addEventListener('click',function(e){var b=e.target.closest('[data-add-skill]');if(!b)return;var sk=b.dataset.addSkill;R.mutate(function(s){addSkills(s.sections.skills,[sk.charAt(0).toUpperCase()+sk.slice(1)]);s.sections.skills.show=true},'Added “'+sk+'” to Skills');b.className='sc-x-chip ok';b.disabled=true;b.textContent='✓ '+sk});
 if(norm(ad.value))check();
 openModal(m,ad);
}

/* ------------------------------------------------------------------ 4. Phone guide */
var GUIDE_OFF='sc-resume-guide-off',phone=window.matchMedia('(max-width: 760px)');
function guideOn(){try{return localStorage.getItem(GUIDE_OFF)!=='1'}catch(e){return true}}
function steps(){return R.editorSections()}
function openId(){var c=$('#accordion .section-card.open');return c?c.dataset.editorSection:null}
var guide=null;
function buildGuide(){
 var bar=$('#mobileBottomBar');if(!bar||guide)return;
 guide={label:document.createElement('div'),back:document.createElement('button'),next:document.createElement('button')};
 guide.label.className='sc-x-steplabel';guide.label.setAttribute('aria-live','polite');
 guide.back.type=guide.next.type='button';guide.back.id='scGuideBack';guide.next.id='scGuideNext';guide.back.textContent='← Back';guide.next.textContent='Next →';
 bar.insertBefore(guide.next,bar.firstChild);bar.insertBefore(guide.back,bar.firstChild);bar.appendChild(guide.label);
 guide.back.onclick=function(){move(-1)};guide.next.onclick=function(){move(1)};
 guide.label.addEventListener('click',function(e){if(e.target.closest('[data-guide-off]')){try{localStorage.setItem(GUIDE_OFF,'1')}catch(_){}updateGuide();R.toast('Step guide turned off. Turn it on again from the editor links.')}});
}
function move(d){var list=steps(),cur=openId(),i=list.indexOf(cur);if(i<0)i=0;var n=i+d;
 if(n>=list.length){R.save();R.showPreview();R.toast('Check your resume, then tap Download PDF.');return}
 if(n<0)return;R.openSection(list[n]);var card=$('[data-editor-section="'+CSS.escape(list[n])+'"]');if(card)card.scrollIntoView({block:'start',behavior:'smooth'});updateGuide()}
function updateGuide(){
 if(!guide)return;var on=phone.matches&&guideOn()&&!document.body.classList.contains('mobile-preview');
 document.body.classList.toggle('sc-guide',on);
 [guide.back,guide.next,guide.label].forEach(function(el){el.hidden=!on});
 if(!on)return;var list=steps(),i=Math.max(0,list.indexOf(openId()));
 guide.back.disabled=i===0;guide.next.textContent=i>=list.length-1?'Preview ✓':'Next →';
 guide.label.innerHTML='Step '+(i+1)+' of '+list.length+' · <b>'+esc(R.sectionLabel(list[i]||'header'))+'</b> <button type="button" data-guide-off class="sc-x-link">Show all</button>';
}

/* ------------------------------------------------------------------ shared modal + styles */
function modal(id,title,sub){var m=document.getElementById(id);if(m)m.remove();m=document.createElement('div');m.className='modal sc-x-modal';m.id=id;m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-labelledby',id+'T');
 m.innerHTML='<div class="modal-card sc-x-card"><div class="sc-x-head"><div><h2 id="'+id+'T">'+esc(title)+'</h2><p>'+esc(sub)+'</p></div><button type="button" class="sc-x-close" aria-label="Close">×</button></div><div class="sc-x-body"></div></div>';
 document.body.appendChild(m);m.querySelector('.sc-x-close').onclick=function(){closeModal(m)};m.addEventListener('click',function(e){if(e.target===m)closeModal(m)});m.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal(m)});return m}
var lastFocus=null;
function openModal(m,focusEl){lastFocus=document.activeElement;m.classList.add('show');setTimeout(function(){(focusEl||m.querySelector('button,input,select,textarea')).focus()},30)}
function closeModal(m){m.classList.remove('show');setTimeout(function(){m.remove()},200);if(lastFocus&&lastFocus.focus)lastFocus.focus()}
var css=document.createElement('style');css.textContent=
 '.sc-x-card{width:min(720px,calc(100vw - 24px));max-height:calc(100vh - 40px);overflow:auto;padding:20px}'+
 '.sc-x-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.sc-x-head h2{margin:0 0 4px;font-size:20px}.sc-x-head p{margin:0;color:#4b5563;font-size:13px}'+
 '.sc-x-close{border:0;background:#f1f3f5;border-radius:10px;width:36px;height:36px;font-size:20px;cursor:pointer;flex:0 0 auto}'+
 '.sc-x-search{width:100%;min-height:44px;border:1px solid #d1d5db;border-radius:12px;padding:0 12px;font-size:15px;margin-bottom:12px;box-sizing:border-box}'+
 '.sc-x-jobs{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:8px}.sc-x-job{min-height:46px;border:1px solid #d1d5db;border-radius:12px;background:#fff;font-weight:700;text-align:left;padding:8px 12px;cursor:pointer;color:#111827}.sc-x-job:hover,.sc-x-job:focus-visible{border-color:#111827;background:#f8fafc}'+
 '.sc-x-jobview h3{margin:8px 0 10px}.sc-x-check{display:flex;gap:8px;align-items:flex-start;font-size:14px;margin:12px 0 4px;color:#111827}.sc-x-check input{margin-top:3px;width:18px;height:18px;flex:0 0 auto}.sc-x-check small{color:#9a3412}'+
 '.sc-x-sample{margin:0 0 4px 26px;color:#374151;font-size:13px;line-height:1.55}ul.sc-x-sample{padding-left:18px}.sc-x-note{background:#fff7ed;color:#7c2d12;border-radius:10px;padding:10px 12px;font-size:13px;margin:14px 0 0}.sc-x-muted{color:#4b5563;font-size:14px}'+
 '.sc-x-actions{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:14px}.sc-x-actions.sc-x-left{justify-content:flex-start;margin:4px 0 12px}'+
 '.sc-x-link{border:0;background:none;padding:0;color:#1d4ed8;text-decoration:underline;font-weight:700;cursor:pointer;font-size:13px}'+
 '.sc-x-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.sc-x-body label{display:grid;gap:5px;font-size:12px;font-weight:700;color:#374151}.sc-x-wide{grid-column:1/-1}.sc-x-body input:not([type=checkbox]),.sc-x-body select,.sc-x-letter{min-height:42px;border:1px solid #d1d5db;border-radius:10px;padding:8px 10px;font:14px/1.5 system-ui,sans-serif;width:100%;box-sizing:border-box}.sc-x-letter{min-height:280px;resize:vertical;font-family:Georgia,serif}'+
 '.sc-x-list{display:grid;gap:8px}.sc-x-row{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1px solid #e5e7eb;border-radius:12px;padding:10px 12px;flex-wrap:wrap}.sc-x-row.cur{border-color:#111827}.sc-x-row strong{font-size:14px}.sc-x-row small{display:block;color:#4b5563;font-size:12px;margin-top:2px}.sc-x-badge{font-size:11px;background:#111827;color:#fff;border-radius:999px;padding:2px 8px;margin-left:4px}.sc-x-rowbtns{display:flex;gap:6px;flex-wrap:wrap}.sc-x-rowbtns .btn{min-height:36px;padding:0 10px}.sc-x-danger{color:#b91c1c!important}'+
 '.sc-x-steplabel{position:absolute;left:10px;right:10px;bottom:calc(100% + 6px);background:#111827;color:#fff;border-radius:999px;padding:7px 12px;font-size:13px;display:flex;gap:6px;align-items:center;justify-content:center;box-shadow:0 6px 18px rgba(0,0,0,.18)}.sc-x-steplabel[hidden]{display:none}.sc-x-steplabel .sc-x-link{color:#c7d2fe;margin-left:auto}'+
 'body.sc-guide #mobileBottomBar{grid-template-columns:1fr 1fr 1.35fr!important;grid-auto-flow:column}body.sc-guide #mobileBottomBar button{min-height:46px!important}#scGuideBack,#scGuideNext{background:#fff!important;color:#171b21!important;border:1px solid #cfd5dd!important}#scGuideBack:disabled{opacity:.45}body:has(.modal.show) #mobileBottomBar{display:none!important}#mobileBottomBar [hidden]{display:none!important}body:not(.sc-guide) #mobileDownloadPdfBtn{grid-column:1/-1}body.sc-guide #editor{padding-bottom:150px}'+
 '.sc-x-score{display:flex;gap:12px;align-items:center;background:#f8fafc;border:1px solid #e5e7eb;border-radius:12px;padding:12px 14px;margin-top:6px}.sc-x-score b{font-size:30px;line-height:1}.sc-x-score span{font-size:13px;color:#374151}.sc-x-h{font-size:14px;margin:16px 0 8px}.sc-x-chips{display:flex;flex-wrap:wrap;gap:6px}.sc-x-chip{border-radius:999px;padding:6px 11px;font-size:13px;font-weight:700;border:1px solid #d1d5db;background:#fff;color:#111827}.sc-x-chip.ok{background:#ecfdf5;border-color:#a7f3d0;color:#065f46}button.sc-x-chip.add{cursor:pointer;background:#fff7ed;border-color:#fed7aa;color:#9a3412}button.sc-x-chip.add:hover{border-color:#9a3412}'+
 '@media(max-width:560px){.sc-x-grid{grid-template-columns:1fr}.sc-x-card{padding:16px}.sc-x-actions .btn{flex:1 1 auto}}';
document.head.appendChild(css);

/* ------------------------------------------------------------------ wire up */
function addLinks(){
 var row=$('.editor-quiet-actions');if(!row||$('#scJobsBtn'))return;
 var mk=function(id,label,fn){var b=document.createElement('button');b.type='button';b.className='quiet-link';b.id=id;b.textContent=label;b.onclick=fn;return b};
 row.insertBefore(mk('scJobsBtn','Job examples',jobsModal),row.firstChild);
 row.appendChild(mk('scMatchBtn','Match a job',matchModal));row.appendChild(mk('scCoverBtn','Cover letter',coverModal));
 row.appendChild(mk('scResumesBtn','My resumes',resumesModal));
 var g=mk('scGuideBtn','Step guide',function(){try{localStorage.removeItem(GUIDE_OFF)}catch(_){}updateGuide();var l=steps();if(l.length)R.openSection(openId()||l[0]);updateGuide();R.toast('Step guide on: use Back and Next at the bottom.')});g.classList.add('sc-x-phoneonly');row.appendChild(g);
 var st=document.createElement('style');st.textContent='@media(min-width:761px){.sc-x-phoneonly{display:none}}';document.head.appendChild(st);
 // also offer them in the More menu
 var more=$('#moreMenu');if(more&&!more.querySelector('[data-sc-x]')){[['Match a job',matchModal],['Cover letter',coverModal],['My resumes',resumesModal],['Job examples',jobsModal]].forEach(function(p){var b=document.createElement('button');b.type='button';b.setAttribute('role','menuitem');b.setAttribute('data-sc-x','');b.textContent=p[0];b.onclick=function(){more.hidden=true;var mb=$('#moreBtn');if(mb)mb.setAttribute('aria-expanded','false');p[1]()};more.insertBefore(b,more.firstChild)})}
}
function start(){
 addLinks();buildGuide();updateGuide();
 var acc=$('#accordion');if(acc)new MutationObserver(function(){updateGuide()}).observe(acc,{childList:true,subtree:false,attributes:true,attributeFilter:['class']});
 new MutationObserver(updateGuide).observe(document.body,{attributes:true,attributeFilter:['class']});
 if(phone.addEventListener)phone.addEventListener('change',updateGuide);
 document.addEventListener('click',function(e){if(e.target.closest('#accordion [data-open-section]'))setTimeout(updateGuide,0)});
 var wait=setInterval(function(){if(!R.ready())return;clearInterval(wait);initLib().then(function(){Lib.lastSaved='';syncCurrent().catch(function(){})})},200);
 setInterval(function(){syncCurrent().catch(function(){})},20000);
 window.addEventListener('pagehide',function(){syncCurrent().catch(function(){})});
 document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')syncCurrent().catch(function(){})});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
window.SCResumeExtras={jobKeywords:jobKeywords,JOBS:JOBS,makeLetter:makeLetter,letterDocx:letterDocx,syncCurrent:syncCurrent,lib:Lib};
})();
