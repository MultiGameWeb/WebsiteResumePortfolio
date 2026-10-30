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
 ("Fees", "I", "text", "When a student leaves, how soon do you give the TC, bonafide and other certificates, and which dues must be cleared first?", "Will you give the TC if we move mid-year?", [], "SJ"),
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
 ("Daily rules & care", "I", "text", "Do you have a parent app (homework, attendance, fee receipts), and how can parents reach teachers?", "Is there a school app?", [], "PSJ"),
 ("Daily rules & care", "O", "text", "How often are notebooks corrected?", "How often do teachers correct notebooks?", [], "S"),
 ("Daily rules & care", "O", "text", "Do you have a special educator or shadow teacher for children with ADHD, dyslexia or slow learning, and help get a scribe or extra time in board exams?", "My son has dyslexia, can you support him?", [], "PS"),

 ("Inter college", "M", "list", "Which groups and batches do you have?", "Do you have a NEET batch?", ["MPC", "BiPC", "CEC", "MEC", "HEC", "Board only", "EAPCET batch", "JEE Mains batch", "JEE Advanced batch", "NEET batch", "CA / CMA / CLAT foundation"], "J"),
 ("Inter college", "I", "text", "What are the timings for day scholars, and are there supervised study hours in the evening?", "Is there evening study?", [], "J"),
 ("Inter college", "I", "yes_no", "Do you have a student counsellor and avoid shaming or pressuring students over marks?", "Will my son be under too much pressure?", YN, "SJC"),
 ("Inter college", "O", "yes_no", "Do students do real lab experiments for their practical exams?", "Are practicals done in the lab?", YN, "J"),
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
 ("College", "O", "text", "Can students change branch after first year, or take a minor degree (for example in CSE / AI)?", "Can I move from ECE to CSE?", [], "C"),
 ("College", "O", "text", "Do you help with internships (including hotel and hospital internships) and guide final-year projects in your own labs?", "Will the college allow a 6-month internship?", [], "C"),
 ("College", "O", "text", "What is the supplementary exam fee, and is there an instant supplementary exam?", "When is the supplementary exam?", [], "C"),
 ("College", "O", "yes_no", "For nursing and paramedical courses, do you have your own hospital for clinical practice?", "Do you have your own hospital?", YN, "C"),

 ("Open & distance", "M", "list", "Which programmes do you help with?", "Can I do open 10th?", ["Open 10th (NIOS / APOSS / TOSS)", "Open Inter", "Distance degree (BA, B.Com, B.Sc)", "Distance MBA / MCA", "Online degrees"], "O"),
 ("Open & distance", "I", "text", "How long does open 10th or Inter take, and when are the exams?", "Can I finish 10th in one year?", [], "O"),
 ("Open & distance", "I", "text", "Which universities or boards do you work with (for example NIOS, IGNOU, Ambedkar Open University), what approvals do they have (UGC-DEB), and are the certificates valid for jobs and higher studies?", "Is open Inter valid for a police job?", [], "O"),
 ("Open & distance", "O", "text", "What are the total fees, and what does your centre charge for its help?", "What is the full cost?", [], "O"),

 ("Study abroad", "M", "list", "Which countries and courses do you help with?", "Do you help with MS in USA?", ["USA", "UK", "Canada", "Australia", "Germany", "Ireland", "New Zealand", "MBBS abroad"], "A"),
 ("Study abroad", "I", "text", "What is your processing fee? Is it free for some universities?", "What is your processing fee?", [], "A"),
 ("Study abroad", "I", "list", "Which services do you give?", "Do you help with the SOP?", ["University shortlisting", "SOP & LOR help", "Applications", "Visa slot booking", "Mock visa interviews", "Education loan help", "Forex & travel", "Accommodation help", "IELTS / PTE coaching"], "A"),
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
