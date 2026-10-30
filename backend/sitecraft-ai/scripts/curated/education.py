# Hand-written (curated) question banks for education businesses: tuition
# centre (school classes), coaching institute (competitive exams), and
# computer & skill training institute.
# Run: python3 scripts/curated/education.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: T = tuition centre, X = competitive exam coaching, S = skill / computer
# institute. Each owner is asked only the questions tagged for their business.
# A * in the tags marks a city-only question, asked only to centres in a
# district headquarters or city.
# Core questions (name, address, map, parking, timings, weekly holiday, phone,
# WhatsApp, offers, photos, Wi-Fi) are asked separately, so they are not
# repeated here.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Classes & courses", "M", "list", "Which classes and subjects do you teach?", "Do you take tuition for 9th class maths?", ["Classes 1–5", "Classes 6–8", "Classes 9–10", "Intermediate (MPC / BiPC / CEC)", "Maths", "Science (Physics, Chemistry, Biology)", "English", "Hindi", "Telugu", "Sanskrit", "Social", "Abacus / Vedic maths", "Handwriting (cursive)", "Chess / drawing", "Olympiad / NTSE", "Navodaya / Sainik school entrance"], "T"),
 ("Classes & courses", "O", "text", "For abacus, how many levels are there, how long is each, and is the kit included?", "How many abacus levels are there?", [], "T"),
 ("Classes & courses", "O", "text", "Do you run a summer camp (spoken English, crafts, dance, computers)? What is the fee?", "Is there a summer camp?", [], "TS"),
 ("Classes & courses", "M", "list", "Which exams do you coach for?", "Do you have NEET coaching?", ["IIT-JEE", "NEET", "EAMCET / EAPCET", "Police / SI", "DSC / TET", "Groups (APPSC / TSPSC)", "Bank exams", "SSC", "Railways", "Civil services", "IELTS / PTE / TOEFL / GRE"], "X"),
 ("Classes & courses", "M", "list", "Which courses do you teach?", "Do you have a spoken English course?", ["Spoken English", "Basic computers & MS Office", "Tally / GST accounting", "DTP / Photoshop", "Coding (Python, Java, web)", "Digital marketing", "Data analytics", "Typing", "Hardware & networking", "Communication & interview skills"], "S"),

 ("Fees & discounts", "M", "text", "What are your fees (monthly, yearly or full course) for each class or course?", "How much is the fee?", [], "TXS"),
 ("Fees & discounts", "I", "text", "Is there an admission or registration fee? How much?", "Is there an admission fee?", [], "TXS"),
 ("Fees & discounts", "I", "options", "Can the fee be paid in parts?", "Can I pay the fee in instalments?", ["Full payment only", "2–3 instalments", "Monthly fee"], "TXS"),
 ("Fees & discounts", "I", "text", "What does the fee include (study material, books, uniform, ID card, tests), and what is charged extra?", "Are books included in the fee?", [], "TXS"),
 ("Fees & discounts", "I", "text", "Do you give free demo classes before joining? For how many days?", "Can my son attend a demo class?", [], "TXS"),
 ("Fees & discounts", "O", "text", "Do you give a discount when two children from the same family join?", "Any discount for two kids?", [], "T"),
 ("Fees & discounts", "O", "text", "Do you give scholarships or fee concessions for merit students (for example 90%+ marks)?", "My daughter got 95%, any scholarship?", [], "TX"),
 ("Fees & discounts", "O", "text", "How much discount do you give if the full fee is paid at once?", "Any discount if I pay full fee?", [], "TXS"),
 ("Fees & discounts", "O", "text", "What is your refund policy (if the student leaves after the demo or moves to another town)?", "Will you refund the fee if we move?", [], "TXS"),
 ("Fees & discounts", "O", "text", "Do you give a referral discount when students bring friends?", "Any discount if my friend joins?", [], "TXS"),
 ("Fees & discounts", "O", "text", "For students joining in the middle of the year, is the fee reduced?", "We're joining late, is the fee less?", [], "TXS"),
 ("Fees & discounts", "I", "text", "What makes your centre special compared to others nearby?", "Why should we join you?", [], "TXS"),

 ("Teachers & teaching", "I", "text", "What are your teachers' qualifications and years of experience? Where did they teach before?", "Are the teachers qualified?", [], "TXS"),
 ("Teachers & teaching", "I", "yes_no", "Are your trainers working IT professionals with real project experience?", "Do the trainers work in software companies?", YN, "S"),
 ("Teachers & teaching", "I", "options", "Is there a separate teacher for each subject?", "Does one teacher teach all subjects?", ["Separate teacher for each subject", "One teacher for all subjects", "Depends on the class"], "TX"),
 ("Teachers & teaching", "I", "yes_no", "Do the same senior teachers from the demo classes teach the whole year?", "Will the demo teacher teach all year?", YN, "TXS"),
 ("Teachers & teaching", "O", "text", "If a teacher leaves in the middle of the year, how soon do you bring a replacement?", "What if the teacher leaves?", [], "TXS"),
 ("Teachers & teaching", "I", "options", "In which language do teachers explain?", "Will you explain in Telugu?", ["English only", "English with Telugu explanation", "Telugu medium", "Hindi too"], "TXS"),
 ("Teachers & teaching", "O", "yes_no", "Do teachers focus on basics and concepts, not just memorising?", "Do you teach concepts or just by-heart?", YN, "TX"),
 ("Teachers & teaching", "O", "options", "Do you use digital boards or projectors?", "Do you have smart classes?", ["Digital board / projector", "Whiteboard / blackboard", "Both"], "TXS"),

 ("Batches & attention", "I", "text", "How many students are in one batch?", "How many kids in a class?", [], "TXS"),
 ("Batches & attention", "I", "yes_no", "Do teachers give extra attention to slow learners, and re-teach basics (tables, basic maths) at their level?", "My son is weak in studies, will you take care?", YN, "TX"),
 ("Batches & attention", "I", "yes_no", "Do you have one-on-one doubt sessions for students who are shy to ask in class?", "Can my son clear doubts separately?", YN, "TXS"),
 ("Batches & attention", "O", "yes_no", "Do you have separate batches for toppers and average students?", "Are toppers in a separate batch?", YN, "TX"),
 ("Batches & attention", "I", "options", "Do you have separate batches for each syllabus?", "Is there a CBSE batch?", ["Separate batches (State, CBSE, ICSE)", "Mixed, with syllabus-wise help", "Only one syllabus"], "T"),
 ("Batches & attention", "O", "yes_no", "Can you arrange teachers for home tuition?", "Can a teacher come home?", YN, "T"),
 ("Batches & attention", "O", "yes_no", "Do you take special care of children who moved from Telugu medium to English medium?", "He just moved to English medium, will he cope?", YN, "T"),
 ("Batches & attention", "I", "text", "For children who don't study at home (TV, phone) or whose parents can't help at home, how do you build study habits and keep parents updated?", "My son never opens a book at home, can you change him?", [], "T"),
 ("Batches & attention", "O", "text", "If a student's marks drop after joining, what do you do (extra classes, parent meeting)?", "What if his marks go down?", [], "TX"),
 ("Batches & attention", "O", "yes_no", "Can a student move to another batch or teacher if they don't understand the lessons?", "Can you change his batch?", YN, "TXS"),
 ("Batches & attention", "O", "options", "Are central (SSC, Railways) and state (Groups, Police) exam students in separate batches?", "Are SSC and Groups in the same class?", ["Separate batches", "Common classes with separate sessions", "Same batch"], "X"),
 ("Batches & attention", "O", "yes_no", "Do you have special batches for students with backlogs or supplementary exams (Inter, degree, B.Tech)?", "Is there a batch for backlogs?", YN, "TX"),

 ("Timings & attendance", "I", "list", "Which batches do you have?", "Is there an evening batch?", ["Morning", "Evening", "Weekend only", "Holiday / summer courses", "Crash courses before exams"], "TXS"),
 ("Timings & attendance", "O", "text", "How many hours a day and days a week are classes? Any special classes on Sundays?", "Are there classes on Sunday?", [], "TXS"),
 ("Timings & attendance", "I", "yes_no", "If a student is absent, do you call or message the parents the same day?", "Will you tell me if my son bunks?", YN, "TX"),
 ("Timings & attendance", "O", "text", "If a student misses classes (illness, travel) or a class is cancelled (rain, holiday), how do you cover the missed lessons?", "My daughter was sick for 5 days, will you cover it?", [], "TXS"),
 ("Timings & attendance", "O", "text", "How do you cover the syllabus already finished for late joiners?", "How will you cover old lessons?", [], "TXS"),
 ("Timings & attendance", "O", "yes_no", "Do you change tuition timings during school exams (FA, SA, finals)?", "Will timings change in exams?", YN, "T"),

 ("Syllabus & material", "O", "options", "How do you follow the syllabus?", "Do you teach ahead of school?", ["Ahead of school", "Along with school", "Revise what school teaches"], "T"),
 ("Syllabus & material", "O", "yes_no", "Do you help children finish school homework and projects here?", "Will you help with school homework?", YN, "T"),
 ("Syllabus & material", "O", "text", "Do you give separate tuition homework? How much?", "Is there tuition homework too?", [], "T"),
 ("Syllabus & material", "I", "yes_no", "Do you give your own printed notes or study material?", "Do you give notes?", YN, "TXS"),
 ("Syllabus & material", "O", "yes_no", "Do you give previous years' question papers and an important-question bank?", "Do you give old question papers?", YN, "TX"),
 ("Syllabus & material", "O", "text", "By when do you finish the syllabus, and how much time is left for revision?", "When will the syllabus finish?", [], "TX"),
 ("Syllabus & material", "O", "yes_no", "Do you help improve handwriting?", "Can you improve his handwriting?", YN, "T"),
 ("Syllabus & material", "O", "yes_no", "Do you practise science diagrams and experiments, and map pointing in social?", "Do you practise map pointing?", YN, "T"),
 ("Syllabus & material", "O", "yes_no", "Do you teach grammar, essay writing and letter writing separately?", "Do you teach English grammar?", YN, "T"),
 ("Syllabus & material", "O", "yes_no", "Do you give paper-presentation tips for 10th and Inter board exams?", "How should he write to get more marks?", YN, "T"),
 ("Syllabus & material", "O", "text", "Is your material enough, or should students also buy standard reference books?", "Should I buy other books?", [], "X"),

 ("Tests & results", "I", "list", "Which tests do you conduct?", "Are there weekly tests?", ["Weekly tests", "Chapter-wise tests", "Monthly tests", "Grand / mock tests before finals"], "TX"),
 ("Tests & results", "I", "yes_no", "Do you show corrected papers to parents and send marks on WhatsApp?", "Will I see my son's test marks?", YN, "T"),
 ("Tests & results", "O", "text", "How often do you hold parent-teacher meetings?", "When is the parents' meeting?", [], "T"),
 ("Tests & results", "I", "text", "What were your results last year (10/10 GPA, ranks, selections or placements)?", "How many got 10/10 last year?", [], "TXS"),
 ("Tests & results", "O", "yes_no", "Can new parents talk to past toppers' parents (with their permission)?", "Can I talk to a topper's parents?", YN, "TX"),

 ("Online & hybrid", "I", "list", "Which ways of learning do you offer?", "Are there online classes?", ["Offline only", "Online live classes", "Hybrid (join online when absent)", "Recorded videos", "Mobile app"], "TXS"),
 ("Online & hybrid", "O", "yes_no", "Can students ask doubts online (chat or call)?", "Can I ask doubts on WhatsApp?", YN, "TXS"),

 ("Competitive exams", "I", "text", "How long do classes run: till the course is complete, or till the exam notification?", "Till when are the classes?", [], "X"),
 ("Competitive exams", "O", "text", "Once the fee is paid, can students repeat batches until they get selected (validity)?", "Can I attend the next batch free?", [], "X"),
 ("Competitive exams", "O", "text", "For IELTS / PTE, do you give mock tests, one-on-one speaking practice and help (or a voucher) for exam booking?", "Do you have IELTS mock tests?", [], "X"),
 ("Competitive exams", "O", "text", "Do you have a study hall or reading room? Monthly fee, hours, a fixed cabin with locker and plug point, and a separate row for girls?", "Is there a reading room?", [], "X"),
 ("Competitive exams", "O", "yes_no", "Do you have a computer lab for online (CBT) test practice?", "Is there CBT practice?", YN, "X"),
 ("Competitive exams", "O", "yes_no", "Do you practise OMR sheets, shortcut tricks for arithmetic and reasoning, and how to avoid negative marks?", "Do you give OMR practice?", YN, "X"),
 ("Competitive exams", "O", "yes_no", "Do you give a daily or monthly current affairs magazine or PDF?", "Do you give current affairs material?", YN, "X"),
 ("Competitive exams", "O", "yes_no", "When a notification comes, do you help students apply online without form-filling mistakes?", "Will you help me fill the application?", YN, "X"),
 ("Competitive exams", "O", "yes_no", "Do you give interview guidance and mock interviews after the written exam?", "Do you train for the interview?", YN, "X"),

 ("Skill courses", "O", "yes_no", "Do you teach English from zero level (basic grammar)?", "I don't know any English, can I join?", YN, "S"),
 ("Skill courses", "O", "yes_no", "Can students from non-IT backgrounds (B.Com, BA) learn coding here from the basics?", "I did B.Com, can I learn Python?", YN, "S"),
 ("Skill courses", "O", "text", "How do you help students with a career gap of a few years?", "I have a 3-year gap, can I still get a job?", [], "S"),
 ("Skill courses", "O", "options", "Can students pay part of the fee after getting placed?", "Can I pay after I get a job?", ["No, full fee before", "Part now, rest after placement", "Depends on the course"], "S"),
 ("Skill courses", "O", "yes_no", "Do you practise group discussions, debates and stage speaking?", "Will I get speaking practice?", YN, "S"),
 ("Skill courses", "I", "text", "Are computer courses practical (with live projects)? Does each student get their own computer?", "Will I get my own computer?", [], "S"),
 ("Skill courses", "O", "text", "How many hours can students use the lab for practice after class?", "Can I practise in the lab after class?", [], "S"),
 ("Skill courses", "I", "text", "What certificate do you give, and who recognises it (ISO, government, company)? Do you give internship certificates for real project work?", "Is the certificate government approved?", [], "S"),
 ("Skill courses", "I", "text", "Do you give placement assistance and help with resumes and interviews? How many interviews do you arrange?", "Will you help me get a job?", [], "S"),

 ("Discipline & rules", "O", "text", "How do teachers handle discipline and naughty or hyperactive children? Do you follow a no-beating, no-insulting policy (never shaming children for low marks)?", "Do teachers beat children?", [], "T"),
 ("Discipline & rules", "O", "text", "What is your rule on mobile phones in class?", "Can my son bring his phone?", [], "TXS"),
 ("Discipline & rules", "O", "options", "How are boys and girls seated?", "Do boys and girls sit together?", ["Separately", "Mixed", "Separate batches"], "TX"),
 ("Discipline & rules", "O", "yes_no", "Do you hold motivational sessions to remove exam fear and anxiety?", "Any motivation classes?", YN, "TX"),
 ("Discipline & rules", "O", "text", "Is there a dress code or uniform?", "Is there a uniform?", [], "TX"),
 ("Discipline & rules", "I", "text", "What action do you take if a child is bullied or hit by other students?", "What if other kids tease my son?", [], "TX"),
 ("Discipline & rules", "O", "yes_no", "Do teachers watch for distractions among teenage students and quietly inform parents?", "Will you keep an eye on distractions?", YN, "TX"),
 ("Discipline & rules", "O", "yes_no", "For late fees, do you call the parents instead of asking the child in front of the class?", "Will you ask my child about fees in class?", YN, "TXS"),
 ("Discipline & rules", "O", "yes_no", "Do you have fun activities (games, quizzes) along with studies?", "Are there any games or quizzes?", YN, "T"),

 ("Facilities & safety", "I", "list", "Which facilities do you have?", "Is there AC?", ["AC classrooms", "Fans & good ventilation", "Benches / chairs", "Power backup", "RO drinking water", "Separate washrooms for boys & girls", "CCTV", "Security guard", "Cycle / bike parking"], "TXS"),
 ("Facilities & safety", "O", "text", "How do you keep girls safe when classes end late (7–8 pm)?", "Is it safe for my daughter in the evening?", [], "TXS"),
 ("Facilities & safety", "O", "yes_no", "Does your staff help small children cross the road when classes end?", "Will someone help kids cross the road?", YN, "T"),
 ("Facilities & safety", "O", "yes_no", "Do you give a snack break for children coming straight from school?", "Can he eat his snacks there?", YN, "T"),
 ("Facilities & safety", "O", "yes_no", "For full-day batches, is there a microwave and a dining area for lunch?", "Is there a place to eat lunch?", YN, "X"),
 ("Facilities & safety", "O", "yes_no", "Do you have a first-aid kit, and will you take a student to hospital and call parents in an emergency?", "What if my child falls sick in class?", YN, "TXS"),
 ("Facilities & safety", "O", "yes_no", "Do you have a lost-and-found box for children's things (pens, books, umbrellas)?", "He lost his umbrella there, did anyone find it?", YN, "TXS"),
 ("Facilities & safety", "O", "text", "Do you have van or bus transport? Which areas, and what charge?", "Is there a van?", [], "TX"),
 ("Facilities & safety", "O", "text", "Do you help students from other towns find a hostel or PG? How is the food?", "Is there a hostel?", [], "X"),

 ("Centre & service", "O", "text", "How can parents or students raise a complaint (batch size, teacher, tests, fans, mosquitoes), and how soon do you act?", "Whom do I complain to?", [], "TXS"),
 ("Centre & service", "O", "text", "Do you keep students' original certificates? When are they returned, also if the student leaves midway?", "Will you return my original certificates?", [], "XS"),
 ("Centre & service", "O", "text", "Do you have branches in other areas or towns, and can students transfer between them?", "Can he move to your other branch?", [], "TXS"),
 ("Centre & service", "O", "yes_no", "Do teachers give career guidance (which college or group to choose) even after the course?", "Can you guide us on which college to join?", YN, "TXS"),
 ("Centre & service", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Do you have Instagram?", [], "TXS"),
]

TYPES = [("tuition_centre", "Tuition centre (school classes)", "T"),
         ("competitive_coaching", "Coaching institute (competitive exams)", "X"),
         ("skill_institute", "Computer & skill training institute", "S")]
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
