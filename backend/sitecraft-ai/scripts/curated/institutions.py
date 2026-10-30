# Hand-written (curated) question banks for schools and colleges: play schools
# & daycare, schools (1st–10th), junior colleges (Inter), degree / engineering /
# professional colleges, open & distance education centres, study abroad
# consultancies, sports academies, and music, dance & arts academies.
# (Tuition centres, coaching institutes and skill institutes are in
# education.py.)
# Run: python3 scripts/curated/institutions.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: P = play school & daycare, S = school, J = junior college,
# C = degree / professional college, O = open & distance education,
# A = study abroad consultancy, G = sports academy, M = music & dance academy.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, offers, photos, Wi-Fi) are asked separately.
# The assistant never promises seats, ranks, marks, jobs or visas, and never
# offers non-attending admissions or certificates without study (see
# botcraft-salesbot.js).
import json, os, datetime

YN = ["Yes", "No"]
ALL = "PSJCOAGM"
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Classes & care", "M", "list", "Which classes and care do you offer?", "Do you have LKG?", ["Playgroup", "Nursery", "LKG", "UKG", "Daycare / creche", "After-school care"], "P"),
 ("Classes & care", "I", "text", "How old must a child be (as on 1 June) for each class, and do you take children who are a month or two younger?", "My son is 2 years 10 months, can he join nursery?", [], "PS"),
 ("Classes & care", "I", "text", "How many ayahs (female caretakers) are there per class, and do they change diapers and help with toilet training?", "Will the ayah change his diaper?", [], "P"),
 ("Classes & care", "O", "yes_no", "In the first week, can a parent sit outside the class while the child settles?", "Can I sit outside for the first few days?", YN, "P"),
 ("Classes & care", "I", "list", "How do you teach small children?", "Do you follow Montessori?", ["Play-way / activity-based", "Montessori", "Phonics", "Kit-based programme (for example Kreedo)", "Mostly books & writing"], "P"),
 ("Classes & care", "O", "text", "Do you give homework to small children? How much?", "Is there homework for nursery?", [], "P"),
 ("Classes & care", "I", "text", "Daycare: until what time, is lunch fed and a nap bed given, and what does it cost?", "Can my child stay till 6:30 pm?", [], "P"),
 ("Classes & care", "O", "yes_no", "Can parents watch their child live on CCTV through an app?", "Can I see my child on CCTV from office?", YN, "P"),

 ("Board & recognition", "M", "list", "Which board and classes do you have?", "Is your school CBSE?", ["State syllabus", "CBSE", "ICSE", "IB / Cambridge", "Pre-primary", "Classes 1–5", "Classes 6–8", "Classes 9–10"], "S"),
 ("Board & recognition", "I", "text", "Is your school government recognised up to which class, and what are your board affiliation number and UDISE code?", "Is the school recognised till 10th?", [], "S"),
 ("Board & recognition", "O", "yes_no", "Do you teach the syllabus of the board you are affiliated to (for example CBSE books in a CBSE school)?", "Do you really follow CBSE books?", YN, "S"),
 ("Board & recognition", "I", "text", "Do you have IIT / NEET / Olympiad foundation from class 6? Is there a separate fee for it?", "Is there IIT foundation from 6th?", [], "S"),
 ("Board & recognition", "O", "list", "Which second and third languages can students take?", "Can my child take Hindi instead of Telugu?", ["Telugu", "Hindi", "Sanskrit", "Urdu", "French"], "SJ"),
 ("Board & recognition", "O", "options", "How do you form sections?", "Do you put low scorers in a separate section?", ["All levels mixed", "By marks", "By language or stream"], "S"),
 ("Board & recognition", "O", "yes_no", "Do you enter every student in UDISE and create their APAAR ID / PEN, so they get government schemes (for example Thalliki Vandanam)?", "Will my child get the Thalliki Vandanam scheme here?", YN, "S"),
 ("Board & recognition", "I", "text", "Is your college recognised by the Intermediate board, and which exam centre do students write at?", "Is the college board recognised?", [], "J"),

 ("Fees", "I", "text", "Apart from the tuition fee, what else is charged in the year (admission, term, computer, sports, annual day, picnic, exam, university, placement training)?", "Are there any other fees besides tuition fee?", [], "PSJC"),
 ("Fees", "O", "options", "Must books, uniform and shoes be bought from you?", "Can I buy books outside?", ["Must buy from us", "Can buy outside with our list", "Books from us, uniform outside"], "PS"),
 ("Fees", "O", "yes_no", "Do you admit children under the RTE 25% free quota?", "Is there an RTE free seat?", YN, "PS"),
 ("Fees", "I", "text", "When a student leaves, how soon do you give the TC, bonafide, study records and other certificates, and which dues must be cleared first?", "Will you give the TC if we move mid-year?", [], "SJ"),
 ("Fees", "I", "text", "What are the fees for each batch (board only, EAPCET, JEE Mains, JEE Advanced, NEET)?", "What is the fee for the NEET batch?", [], "J"),
 ("Fees", "I", "text", "What concession do you give for 10th marks (for example 10/10 GPA) or on your scholarship test?", "How much discount for 10 GPA?", [], "J"),

 ("Transport", "I", "text", "School bus: which areas, fee by distance, is there a lady attender, and can parents track the bus on an app?", "Does the bus come to our street?", [], "PSJ"),

 ("Activities", "I", "list", "Which sports and activities do you offer?", "Is there a playground?", ["Playground", "Karate", "Skating", "Swimming", "Dance", "Music", "Abacus", "Robotics", "Chess", "Yoga", "Drawing"], "PS"),
 ("Activities", "O", "text", "How do you keep school bags light (lockers, books only as per timetable)?", "Does my child have to carry all books every day?", [], "S"),
 ("Activities", "O", "text", "Are annual day costumes and picnics optional, and what do they usually cost?", "Is the picnic compulsory?", [], "PS"),

 ("Daily rules & care", "O", "text", "What are your grooming rules (hair, nails, shoes, plaits) and what happens if they are not followed?", "Will you cut my son's hair at school?", [], "S"),
 ("Daily rules & care", "O", "text", "What are your birthday rules (colour dress, what can be shared in class)?", "Can she wear a colour dress on her birthday?", [], "PS"),
 ("Daily rules & care", "O", "yes_no", "For girls, do you keep sanitary pads, a spare uniform and a rest room?", "What if my daughter gets her period at school?", YN, "SJC"),
 ("Daily rules & care", "O", "yes_no", "Can parents drop a hot lunch box at the gate at lunch time, and do staff take it to the class?", "Can I bring a hot lunch box at 12?", YN, "PS"),
 ("Daily rules & care", "O", "options", "Can children bring egg or non-veg in their lunch box?", "Can I send egg in the tiffin?", ["Yes", "Egg only", "Veg only"], "PS"),
 ("Daily rules & care", "O", "yes_no", "Do you avoid punishments like hitting, insulting or writing an answer many times (impositions)?", "Do teachers punish children?", YN, "PS"),
 ("Daily rules & care", "I", "text", "Do you have a parent app (homework, attendance, fee receipts), can both parents log in, and how can parents reach teachers?", "Is there a school app?", [], "PSJ"),
 ("Daily rules & care", "O", "text", "How often are notebooks corrected?", "How often do teachers correct notebooks?", [], "S"),
 ("Daily rules & care", "O", "text", "Do you have a special educator or shadow teacher for children with ADHD, dyslexia or slow learning, and help get a scribe, extra time or other allowed help (for weak eyesight or hearing) in exams?", "My son has dyslexia, can you support him?", [], "PS"),

 ("Admissions & records", "I", "text", "Which documents are needed for admission (birth certificate, Aadhaar, photos, parent ID, previous records), originals or copies, and do you give provisional admission if one is missing?", "Which documents do I need for admission?", [], "PSJ"),
 ("Admissions & records", "O", "text", "Do you take admissions 2–3 months after the year starts, and how do you help late joiners catch up?", "Can he join in August?", [], "PSJ"),
 ("Admissions & records", "O", "text", "Do younger siblings get admission priority or a fee concession?", "Is there a discount for the second child?", [], "PS"),
 ("Admissions & records", "O", "text", "For single parents, guardians (for example grandparents) or separated parents: which documents are needed, who is recorded as guardian, do both parents get reports, and how do you check who may pick up the child?", "Can the grandmother be the guardian?", [], "PS"),
 ("Admissions & records", "O", "text", "For students returning from abroad, foreign students, or students moving from IB / Cambridge, which class do you admit them to, and which documents or equivalency certificates are needed?", "We are coming back from the US, which class will she join?", [], "SJC"),
 ("Admissions & records", "O", "text", "How do you correct a student's name or date of birth in records, and how do you check board exam registration details before the deadline?", "Her name is spelt differently in Aadhaar, can you correct it?", [], "SJ"),

 ("Exams & results", "O", "text", "If a student misses an exam due to illness, is there a special exam, and by when must the medical certificate be given?", "He had fever on exam day, will there be a re-exam?", [], "SJC"),
 ("Exams & results", "O", "text", "Can parents see corrected answer sheets, how are internal marks given (projects, assignments, tests), and can marks be rechecked?", "Can I see my son's answer paper?", [], "SJ"),
 ("Exams & results", "O", "text", "What are your promotion rules if a student fails in subjects, and do you give remedial classes or a re-test?", "Will he be promoted if he fails in maths?", [], "SJ"),
 ("Exams & results", "O", "text", "When are original marks memos given, and do you help with DigiLocker and duplicate certificates?", "When will we get the original memo?", [], "SJC"),

 ("Parents & communication", "I", "text", "How often are parent-teacher meetings held (in person or online), can parents book a time with a teacher, and do you send a monthly progress report?", "When is the next parents meeting?", [], "PSJ"),
 ("Parents & communication", "O", "text", "How do you inform parents about exam date changes, holidays and sudden closures (rain, government orders), and what happens if a closure is announced after buses leave?", "How will I know if school is closed due to rain?", [], "PSJ"),
 ("Parents & communication", "I", "text", "How can parents complain about a teacher or other problem, who handles it up to the principal or management, and in how many days do you reply?", "Whom do I complain to about a teacher?", [], "PSJC"),
 ("Parents & communication", "O", "text", "What disciplinary steps do you take for rule breaking, and do parents get to explain before a suspension?", "Will my son be suspended?", [], "SJ"),
 ("Parents & communication", "O", "yes_no", "Do you keep a lost-and-found for bags, bottles and books?", "My son lost his water bottle, where do I ask?", YN, "PS"),
 ("Parents & communication", "O", "text", "Can parents visit without an appointment or meet children during class time, and how do you check visitors and delivery or contract staff (visitor pass, ID)?", "Can I come to school without an appointment?", [], "PSJ"),

 ("Safety & health", "I", "text", "Do you have a child protection policy (staff training, a way for children to complain privately, good touch / bad touch awareness), and how do you handle POCSO complaints?", "How do you keep children safe from abuse?", [], "PSJ"),
 ("Safety & health", "I", "text", "Who gives first aid, how do you record allergies and medical needs (shared only with the staff who need it), and do you have a plan for severe allergies?", "My daughter has a peanut allergy, will teachers know?", [], "PSJ"),
 ("Safety & health", "O", "yes_no", "With a parent's written note, do staff give a child their daily medicine and record the time and who gave it?", "Can the teacher give his medicine at lunch?", YN, "PS"),
 ("Safety & health", "O", "yes_no", "Do you hold fire and evacuation drills, with fire extinguishers and emergency exits?", "Do you have fire safety?", YN, "PSJC"),
 ("Safety & health", "O", "yes_no", "Do you hold health check-ups (eyes, teeth, height, weight) and send the report to parents?", "Do you do eye check-ups?", YN, "PS"),

 ("Digital learning", "O", "text", "Do you give recorded lessons for missed classes, and can homework be submitted online (or on paper if the internet fails)?", "He missed the online class, is there a recording?", [], "SJ"),
 ("Digital learning", "O", "text", "Does each student get their own computer in the lab, what do they learn (coding, office tools), and do you teach safe use of AI tools without copying homework?", "Do children learn coding?", [], "SJ"),
 ("Digital learning", "O", "yes_no", "Do you take parents' permission before posting children's photos online, and respect a request not to share them?", "Will you put my child's photo on Instagram?", YN, "PSJ"),

 ("Fees", "O", "text", "If admission is cancelled before the child joins, how much is refunded (admission, tuition and other fees)?", "If we cancel admission, will we get the fee back?", [], "PSJC"),
 ("Fees", "O", "text", "If a family has money trouble, can the fee date be extended or a concession given? Which documents are needed?", "I lost my job, can I pay the fee later?", [], "PSJC"),
 ("Fees", "O", "text", "Do you give an official receipt for every payment, and how do you fix online payments that failed or were charged twice?", "Money was cut twice on UPI, what now?", [], "PSJC"),
 ("Fees", "O", "text", "How early do you tell parents about a fee increase for the next year?", "Will the fee go up next year?", [], "PSJ"),
 ("Fees", "O", "text", "If fees are due, do you stop classes, exams or library for the student, or talk to parents first?", "Will my child be stopped from exams if the fee is late?", [], "PSJC"),

 ("Career & skills", "O", "text", "Do you give aptitude tests and career counselling (from class 8), and hold sessions with doctors, engineers or business people, or company visits?", "Do you help choose a group after 10th?", [], "SJC"),
 ("Career & skills", "O", "yes_no", "Do you teach public speaking, leadership, teamwork and money skills through projects or activities?", "Do you teach public speaking?", YN, "SJ"),

 ("Transport", "O", "text", "Can the bus pick-up point be changed when a family moves, or the bus stopped mid-year? What is the extra fee or refund, and how much notice is needed?", "We are moving house, can the bus stop change?", [], "PSJ"),
 ("Transport", "O", "text", "If a child misses the bus, can they take another route's bus, and at which gate should parents drop them?", "He missed the bus, where do I drop him?", [], "PSJ"),
 ("Transport", "I", "text", "Bus safety: are seats within the permitted capacity, do drivers have valid licences and police verification, and does each bus carry a first-aid kit, fire extinguisher and emergency exit?", "Are the bus drivers police verified?", [], "PSJ"),
 ("Transport", "O", "text", "If a bus is late or breaks down, do parents get an alert and is another bus sent, and do you record when each child gets on and off?", "The bus is late, will I get a message?", [], "PSJ"),
 ("Transport", "O", "text", "Is there a bus after evening activities, and are buses suitable for wheelchair users (ramp, helper)?", "Is there a bus after the sports class?", [], "PSJ"),

 ("Library & labs", "O", "text", "Library: how many books can a student borrow and for how long, what is the late fine, what if a book is lost, and is there a digital library usable from home?", "How many library books can he take?", [], "SJC"),
 ("Library & labs", "O", "text", "Do students do experiments themselves (or in small groups), with safety gear (gloves, goggles, eye wash), and who pays if equipment breaks by accident?", "Does every student do the experiment?", [], "SJC"),
 ("Library & labs", "O", "yes_no", "Do you have research or project labs with faculty mentors for degree and engineering students?", "Is there a lab for my final project?", YN, "C"),

 ("Teachers & staff", "I", "text", "What qualifications do your teachers have (B.Ed, D.El.Ed, TET / CTET), and how are music, sports and language guest teachers chosen?", "Are the teachers B.Ed qualified?", [], "PSJ"),
 ("Teachers & staff", "O", "text", "How many students are there per teacher in a class, and do you add a teacher when classes grow?", "How many children in one class?", [], "PSJ"),
 ("Teachers & staff", "O", "text", "If a teacher is on leave or leaves mid-year, who teaches the subject, and how do you keep the syllabus on track?", "What if the maths teacher leaves?", [], "PSJC"),
 ("Teachers & staff", "O", "text", "How do you train teachers and other staff (ayahs, attenders, guards) on child safety and first aid, and how do you review teaching (results, class visits, anonymous student and parent feedback)?", "Can students give feedback on teachers?", [], "PSJ"),

 ("College", "O", "text", "Do you give the academic calendar and timetable in advance (exams, holidays, project dates), and how do credits and backlog exams work?", "When are the mid exams?", [], "C"),
 ("College", "O", "yes_no", "Are drinking water and washrooms checked and cleaned regularly?", "Is the drinking water RO?", YN, "SJC"),
 ("College", "O", "yes_no", "Do you have an active alumni network that mentors current students?", "Do seniors help with jobs?", YN, "C"),

 ("Counselling & entrance", "O", "text", "After results, do you guide students through counselling (EAPCET, JoSAA / CSAB, NEET, CUET), including choice filling and documents?", "Will you help with JoSAA choice filling?", [], "J"),

 ("Certificates & schemes", "O", "text", "How soon do you give bonafide, study certificates and a duplicate TC, and can they be requested online?", "I need a bonafide certificate for a bus pass, how long?", [], "SJC"),
 ("Certificates & schemes", "O", "yes_no", "Do you guide students on caste, income and local / non-local certificates needed for scholarships, counselling and bus passes?", "Which certificates are needed for the scholarship?", YN, "SJC"),
 ("Certificates & schemes", "O", "text", "Who helps students with scholarship applications (government, trusts, companies), including pending or rejected ones?", "My scholarship shows rejected, whom do I meet?", [], "SJCA"),

 ("Counselling & wellbeing", "O", "text", "What does your counsellor help with (exam fear, low interest, confidence, career pressure), is it kept private except for safety risks, and do you also counsel parents and make a support plan for weak students?", "My daughter is scared of exams, can the counsellor help?", [], "SJC"),
 ("Counselling & wellbeing", "O", "text", "How do you handle fights between students, bullying (including online bullying) and too much social media or gaming?", "Someone is bullying my son on Instagram, will you help?", [], "SJC"),

 ("Franchise", "O", "text", "Do you offer franchises? Investment, fees and royalty, training and approvals help?", "Can I open a branch of your school?", [], "PS"),

 ("Loans & finance", "O", "text", "Do you help with education loans (documents, fee certificate or estimate, how the bank pays the college, interest subsidy schemes)?", "Will you give a fee letter for my education loan?", [], "CA"),
 ("Loans & finance", "O", "yes_no", "Do you give a full budget estimate for studying abroad (tuition, stay, food, insurance, travel, visa)?", "How much will the whole MS cost?", YN, "A"),

 ("Global", "O", "yes_no", "Do you have student exchange or credit transfer programmes with foreign schools or universities?", "Is there a semester abroad?", YN, "SJC"),
 ("Study abroad", "O", "text", "Do you help with foreign university scholarships and tell students the deadlines in advance?", "Can you help me get a scholarship in Germany?", [], "A"),
 ("Study abroad", "O", "text", "Before students leave, do you guide them on health insurance, part-time work rules under their visa, safe stay and a local emergency contact?", "Can I work part-time in Canada?", [], "A"),
 ("Study abroad", "O", "text", "After the course, do you guide on post-study work visas, internships and job search (resume and interview help)?", "Can I get a job after MS?", [], "A"),

 ("Inter college", "M", "list", "Which groups and batches do you have?", "Do you have a NEET batch?", ["MPC", "BiPC", "CEC", "MEC", "HEC", "Board only", "EAPCET batch", "JEE Mains batch", "JEE Advanced batch", "NEET batch", "CA / CMA / CLAT foundation"], "J"),
 ("Inter college", "I", "text", "What are the timings for day scholars, and are there supervised study hours in the evening?", "Is there evening study?", [], "J"),
 ("Inter college", "I", "yes_no", "Do you have a student counsellor and avoid shaming or pressuring students over marks?", "Will my son be under too much pressure?", YN, "SJC"),
 ("Inter college", "O", "yes_no", "Do you take second-year students from other colleges (with board permission)?", "Can he join you in second year?", YN, "J"),
 ("Inter college", "O", "text", "Can students change group (for example MPC to CEC) after joining? Until when?", "Can she change from MPC to CEC?", [], "J"),
 ("Inter college", "O", "text", "Can students move to another branch or campus of your college? Is there an extra fee?", "Can he move to your Vijayawada campus?", [], "JC"),
 ("Inter college", "O", "text", "Who clears doubts in study hours, and what are their qualifications?", "Who answers doubts in study hours?", [], "J"),
 ("Inter college", "O", "text", "What are your dress code and mobile phone rules?", "Can students bring phones?", [], "JC"),

 ("Hostel", "I", "options", "Do you have a hostel?", "Is there a hostel?", ["Boys", "Girls", "Both", "No hostel"], "SJC"),
 ("Hostel", "O", "text", "How often can hostel students call their parents, and can parents call the warden in an emergency?", "How often can my son call home?", [], "SJC"),
 ("Hostel", "O", "text", "What are the outing rules, and how do you check who picks up a student (photo ID, OTP)?", "Can my brother pick her up for outing?", [], "SJC"),
 ("Hostel", "O", "text", "What is the hostel menu, can parents taste the food, and whom do students complain to about it?", "What food do they give in the hostel?", [], "SJC"),
 ("Hostel", "O", "yes_no", "Is laundry included in the hostel fee, with roll numbers marked on clothes?", "Who washes the clothes?", YN, "SJC"),
 ("Hostel", "O", "text", "Is there a 24/7 nurse, sick room and ambulance, and do you call parents at once if a student falls ill?", "What if my child gets fever at night?", [], "SJC"),
 ("Hostel", "O", "text", "How many students share a room, and are there beds, mosquito nets, hot water and AC or non-AC rooms?", "How many in one room?", [], "SJC"),

 ("College", "M", "list", "Which courses do you offer?", "Do you have B.Tech CSE?", ["B.Tech", "Degree (BA, B.Com, B.Sc)", "MBA", "MCA", "B.Pharm / Pharm.D", "Nursing & paramedical", "B.Ed / D.El.Ed", "Law (LLB)", "Polytechnic", "ITI", "Hotel management"], "C"),
 ("College", "I", "text", "What are your counselling codes (EAPCET, ECET, ICET, PGECET), university affiliation or autonomous status, and NAAC / NBA grades?", "What is your EAPCET college code?", [], "C"),
 ("College", "I", "text", "Which approvals do you have (for example AICTE, PCI, INC, NCTE, NCVT, BCI)?", "Is your ITI NCVT approved?", [], "C"),
 ("College", "I", "text", "Does government fee reimbursement apply to convener seats, and what happens if the government payment is late?", "Will fee reimbursement cover everything?", [], "C"),
 ("College", "I", "text", "What are the fees for management (B-category) seats in each branch?", "What is the management quota fee for CSE?", [], "C"),
 ("College", "O", "text", "What are the fees for spot admissions, and does fee reimbursement apply to them?", "How much for a spot admission seat?", [], "C"),
 ("College", "I", "text", "Last year's placements: how many students were placed, in which companies, and what were the average and highest packages?", "How many got placed last year?", [], "C"),
 ("College", "I", "text", "Do you keep original certificates? Are they returned when the student asks, also if they leave?", "Will you return my originals if I leave?", [], "C"),
 ("College", "I", "yes_no", "Do you have strict anti-ragging rules and an anti-ragging committee?", "Is there ragging?", YN, "C"),
 ("College", "O", "text", "What is the attendance rule, and how does condonation work?", "What if attendance is below 75%?", [], "C"),
 ("College", "O", "text", "Can students change branch after first year, take a minor degree (for example in CSE / AI) or electives from other departments? Any GPA condition?", "Can I move from ECE to CSE?", [], "C"),
 ("College", "O", "text", "Do you help with internships (including hotel and hospital internships) and guide final-year projects in your own labs?", "Will the college allow a 6-month internship?", [], "C"),
 ("College", "O", "text", "What is the supplementary exam fee, and is there an instant supplementary exam?", "When is the supplementary exam?", [], "C"),
 ("College", "O", "yes_no", "For nursing and paramedical courses, do you have your own hospital for clinical practice?", "Do you have your own hospital?", YN, "C"),

 ("Open & distance", "M", "list", "Which programmes do you help with?", "Can I do open 10th?", ["Open 10th (NIOS / APOSS / TOSS)", "Open Inter", "Distance degree (BA, B.Com, B.Sc)", "Distance MBA / MCA", "Online degrees"], "O"),
 ("Open & distance", "I", "text", "How long does open 10th or Inter take, and when are the exams?", "Can I finish 10th in one year?", [], "O"),
 ("Open & distance", "I", "text", "Which universities or boards do you work with (for example NIOS, IGNOU, Ambedkar Open University), what approvals do they have (UGC-DEB), and are the certificates valid for jobs and higher studies?", "Is open Inter valid for a police job?", [], "O"),
 ("Open & distance", "O", "text", "What are the total fees, and what does your centre charge for its help?", "What is the full cost?", [], "O"),

 ("Study abroad", "M", "list", "Which countries and courses do you help with?", "Do you help with MS in USA?", ["USA", "UK", "Canada", "Australia", "Germany", "Ireland", "New Zealand", "MBBS abroad"], "A"),
 ("Study abroad", "I", "text", "What is your processing fee? Is it free for some universities?", "What is your processing fee?", [], "A"),
 ("Study abroad", "I", "list", "Which services do you give?", "Do you help with the SOP?", ["University shortlisting", "SOP & LOR help", "Applications", "Visa slot booking", "Mock visa interviews", "German / French / Japanese language classes", "Education loan help", "Forex & travel", "Accommodation help", "IELTS / PTE coaching"], "A"),
 ("Study abroad", "I", "text", "If the visa is refused, what part of your fee is refunded?", "What if my visa is rejected?", [], "A"),
 ("Study abroad", "O", "text", "Which options do you suggest for students with low marks, backlogs, or without IELTS (MOI letter)?", "I have 10 backlogs, can I still go to UK?", [], "A"),
 ("Study abroad", "O", "text", "For MBBS abroad: total cost, which universities meet NMC rules, and do you help with FMGE / NExT coaching?", "Can I get MBBS in Georgia under 25 lakhs?", [], "A"),

 ("Sports academy", "M", "list", "Which sports do you train?", "Do you have swimming classes?", ["Cricket", "Badminton", "Swimming", "Karate / Taekwondo", "Skating", "Chess", "Football", "Tennis", "Athletics", "Yoga"], "G"),
 ("Sports academy", "I", "text", "What are the monthly fees and batch timings for each sport?", "How much for badminton coaching?", [], "G"),
 ("Sports academy", "O", "text", "What are the hourly rates for court or pool booking, and do you rent equipment or non-marking shoes?", "How much to book a badminton court for an hour?", [], "G"),
 ("Sports academy", "O", "text", "How is the pool water filtered and the chlorine checked, and are there ladies' batches with a lady coach?", "Is there a ladies swimming batch?", [], "G"),
 ("Sports academy", "O", "text", "What do belt or grading tests cost, and do you take students to district and state tournaments?", "How much for the karate belt test?", [], "G"),
 ("Sports academy", "O", "text", "What are your coaches' qualifications (certified coaches, former players)?", "Who is the coach?", [], "G"),

 ("Music & dance", "M", "list", "What do you teach?", "Do you teach Kuchipudi?", ["Kuchipudi", "Bharatanatyam", "Western dance", "Carnatic vocal", "Hindustani vocal", "Guitar", "Keyboard / piano", "Violin", "Flute", "Tabla / mridangam", "Drawing & painting"], "M"),
 ("Music & dance", "I", "text", "What are the minimum age, monthly fees and class timings?", "From what age can my daughter learn Bharatanatyam?", [], "M"),
 ("Music & dance", "O", "text", "Do students need their own instrument, or can they practise on yours?", "Do I have to buy a keyboard?", [], "M"),
 ("Music & dance", "O", "text", "Do you prepare students for certificate exams (for example Telugu University, Prayag Sangeet Samiti, Trinity) and arrange an arangetram?", "Will she get a certificate?", [], "M"),

 ("Sports academy", "I", "text", "Which age groups and levels do you train (kids, teens, adults, beginners, advanced), and how many students are there per coach?", "Is there a batch for 6-year-olds?", [], "G"),
 ("Sports academy", "O", "list", "Which facilities do you have?", "Is it a synthetic court?", ["Indoor courts", "Outdoor ground / turf", "Cricket nets & bowling machine", "Synthetic / wooden court flooring", "Swimming pool", "Changing rooms & washrooms", "Drinking water", "First-aid kit", "CCTV", "Parents' waiting area", "Parking"], "G"),
 ("Sports academy", "O", "text", "What equipment and kit do students need (bat, racket, shuttles, uniform, belts), is any of it included in the fee, and do you sell or suggest where to buy?", "Do I have to buy my own racket?", [], "G"),
 ("Sports academy", "I", "text", "How do you keep students safe (warm-ups, a lifeguard at the pool, first aid, trained staff), and do you inform parents at once if a child is hurt?", "Is there a lifeguard at the pool?", [], "G"),
 ("Sports academy", "O", "text", "Do you track progress (assessments, fitness tests, reports to parents), and do you include fitness and conditioning training?", "How will I know my son is improving?", [], "G"),
 ("Sports academy", "O", "text", "Do you prepare students for school, district or state selections and give participation certificates?", "Will you prepare him for the district team selection?", [], "G"),
 ("Sports academy", "O", "yes_no", "Do you have batches for working adults and on weekends?", "Is there a weekend batch for adults?", YN, "G"),
 ("Sports academy", "O", "text", "For outdoor sports, what happens on rainy or very hot days?", "What if it rains?", [], "G"),
 ("Music & dance", "I", "text", "How is the course structured (levels or grades, syllabus), and how many students are in a batch (group or one-to-one)?", "Is it group or individual class?", [], "M"),
 ("Music & dance", "O", "text", "What is your teachers' training (guru, institution, certificates) and experience?", "Where did the teacher learn?", [], "M"),
 ("Music & dance", "O", "text", "Do students get chances to perform (annual day, stage shows, competitions, temple festivals), and what do costumes and make-up cost?", "Will my daughter get to perform on stage?", [], "M"),
 ("Music & dance", "O", "yes_no", "Can students practise in your room or on your instruments outside class time?", "Can she practise on your veena on Sunday?", YN, "M"),
 ("Music & dance", "O", "text", "Do you help buy instruments (brand advice, discounts) or rent them?", "Which guitar should I buy?", [], "M"),
 ("Music & dance", "O", "yes_no", "Do you share practice videos or recordings for students to practise at home?", "Can you send a video to practise at home?", YN, "M"),
 ("Music & dance", "O", "yes_no", "Are drawing and painting materials included, or do students bring their own?", "Do we have to buy colours?", YN, "M"),
 ("Academy", "O", "yes_no", "Do you run summer camps and short courses?", "Is there a summer camp?", YN, "GM"),
 ("Academy", "O", "yes_no", "Do you also teach online?", "Are there online classes?", YN, "GM"),
 ("Academy", "O", "yes_no", "Do you have batches for adults and working people?", "Can I join at 35?", YN, "M"),
 ("Academy", "O", "text", "How are missed classes made up, and can the fee be paused (illness, exams, travel)? What is your refund policy?", "Can I pause for a month during exams?", [], "GM"),
 ("Academy", "O", "yes_no", "Can parents watch classes, and are there lady teachers or coaches for girls?", "Can I sit and watch the class?", YN, "GM"),
 ("Academy", "O", "yes_no", "Do you have van or pickup service for students?", "Do you have a van?", YN, "GM"),
 ("General", "O", "yes_no", "Can parents or students visit the campus or take a demo class before joining?", "Can we see the campus first?", YN, ALL),
 ("General", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], ALL),
 ("General", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Where can I see your reviews?", [], ALL),
]

TYPES = [("play_school", "Play school, pre-school & daycare", "P"),
         ("school", "School (1st to 10th class)", "S"),
         ("junior_college", "Junior college (Intermediate)", "J"),
         ("college", "Degree, engineering & professional college", "C"),
         ("open_distance", "Open school & distance education centre", "O"),
         ("study_abroad", "Study abroad consultancy", "A"),
         ("sports_academy", "Sports academy", "G"),
         ("arts_academy", "Music, dance & arts academy", "M")]
PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
for key, name, tag in TYPES:
    chosen = [q for q in Q if any(t in q[6] for t in tag)]
    assert len({q[3] for q in chosen}) == len(chosen), f"duplicate question in {key}"
    rows = sorted(enumerate(chosen), key=lambda x: (order[x[1][1]], x[0]))
    questions = []
    for n, (_, (cat, pri, typ, owner, customer, opts, tags)) in enumerate(rows, 1):
        q = {"id": f"{key}-{n:03d}", "category": cat, "owner_question": owner, "customer_question": customer,
             "priority": PRI[pri], "answer_type": typ}
        if opts: q["options"] = opts
        if "*" in tags: q["city_only"] = True
        questions.append(q)
    out = os.path.join(here, "..", "..", "botcraft-banks", f"{key}.json")
    json.dump({"shop_type_key": key, "name": name, "version": 2, "model": "curated",
               "generated_at": datetime.date.today().isoformat(), "question_count": len(questions), "questions": questions},
              open(out, "w"), indent=1, ensure_ascii=False)
    print(f"{key}: {len(questions)} questions", {p: sum(q["priority"] == p for q in questions) for p in PRI.values()})
