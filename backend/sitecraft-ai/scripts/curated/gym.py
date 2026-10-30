# Hand-written (curated) question bank for gyms and fitness centres.
# Run: python3 scripts/curated/gym.py  -> writes botcraft-banks/gym.json
# Priorities: M = mandatory, I = important, O = optional.
# A * in the tags marks a city-only question, asked only to gyms in a district
# headquarters or city (local gyms rarely offer these).
# Core questions (name, address, map, parking, timings, weekly holiday, phone,
# WhatsApp, offers, photos, Wi-Fi) are asked separately, so they are not
# repeated here.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Membership & fees", "M", "text", "What are your membership fees for 1, 3, 6 and 12 months? Is there a separate fee for cardio only or weights only?", "How much is the gym fee?", [], "G"),
 ("Membership & fees", "I", "text", "Is there a registration or admission fee on top of the package fee? How much?", "Is there an admission fee?", [], "G"),
 ("Membership & fees", "I", "text", "Apart from the package fee, are there any other charges (personal training, locker, group classes, GST)?", "Are there any hidden charges?", [], "G"),
 ("Membership & fees", "I", "text", "Do you give a free trial before joining? For how many days?", "Can I try the gym for a day first?", [], "G"),
 ("Membership & fees", "I", "options", "Can members pay the fee in parts?", "Can I pay the fee in instalments?", ["Full payment only", "Two or more instalments on long packages", "Credit card EMI on long packages", "Depends on the package"], "G"),
 ("Membership & fees", "O", "text", "Do you have couple, family, group or friends discounts?", "Any offer for couples?", [], "G"),
 ("Membership & fees", "O", "text", "Do you have special discounts for students, corporate employees or senior citizens?", "Any student discount?", [], "G"),
 ("Membership & fees", "O", "text", "Can members freeze (pause) their membership when they are out of town or unwell? For how many days, and are those days added at the end?", "Can I pause my membership for a month?", [], "G"),
 ("Membership & fees", "O", "text", "Do you refund the fee if a member stops, and can a membership be transferred to someone else?", "Can I transfer my membership to my brother?", [], "G"),
 ("Membership & fees", "O", "text", "Do you have a day pass or weekly pass (for example for visitors from other towns)? How much?", "Can I come for just one day?", [], "G"),
 ("Membership & fees", "O", "text", "What is the minimum age to join? Can teenagers join with a parent's permission, and do you have kids' fitness programmes?", "Can my 15-year-old son join?", [], "G"),
 ("Membership & fees", "O", "yes_no", "Do you give a GST bill that members can use for office fitness reimbursement?", "Can I get a bill for reimbursement?", YN, "G"),
 ("Membership & fees", "O", "text", "Do regular members get an extra discount on renewal? Do you send a WhatsApp / SMS reminder before the package ends?", "Will I get a discount on renewal?", [], "G"),
 ("Membership & fees", "O", "text", "Do you give a referral bonus (discount or free month) when members bring friends?", "Any offer if I bring a friend?", [], "G"),
 ("Membership & fees", "O", "text", "If someone switches from another gym with membership days left, do you add free days?", "I still have a month at my old gym, will you add it?", [], "G"),
 ("Membership & fees", "O", "yes_no", "Do you give a welcome kit (gym bag, shaker, T-shirt) on joining?", "Will I get a free shaker?", YN, "G"),
 ("Membership & fees", "O", "yes_no", "Do you accept Cult.fit, Fitpass or other fitness app memberships?", "Does my Fitpass work here?", YN, "G*"),
 ("Membership & fees", "O", "yes_no", "Do you extend ladies' packages for days missed during periods?", "Will you add the days I miss during periods?", YN, "G"),
 ("Membership & fees", "I", "text", "What makes your gym special compared to other gyms nearby?", "Why should I join your gym?", [], "G"),

 ("Timings & crowd", "M", "options", "Is your gym unisex? Do you have ladies-only timings or a ladies section?", "Is this a ladies gym?", ["Unisex", "Unisex with ladies-only timings", "Separate ladies section", "Men only", "Ladies only"], "G"),
 ("Timings & crowd", "I", "text", "When is the gym busiest, and when is it quiet?", "What time is the gym less crowded?", [], "G"),
 ("Timings & crowd", "O", "options", "Can members come any time during opening hours (even twice a day), or only in a chosen slot?", "Can I come morning and evening?", ["Any time, even twice a day", "Once a day, any time", "Fixed slot (morning or evening)", "Depends on the package"], "G"),
 ("Timings & crowd", "O", "text", "Is there a limit on how long members can work out in a day?", "How many hours can I work out?", [], "G"),
 ("Timings & crowd", "O", "text", "Is the gym open on festival holidays? Any change in timings?", "Is the gym open on Sankranti?", [], "G"),

 ("Trainers & guidance", "M", "options", "Does a floor trainer guide all members, or is a personal trainer needed for proper guidance?", "Will a trainer help me, or do I need a personal trainer?", ["Floor trainer guides everyone (free)", "Personal trainer needed for full guidance", "Both available"], "G"),
 ("Trainers & guidance", "I", "text", "How much does personal training cost (per month or per session), and for couple / buddy PT (two people with one trainer)?", "How much for a personal trainer?", [], "G"),
 ("Trainers & guidance", "I", "text", "Are your trainers certified? How many years of experience do they have?", "Are the trainers certified?", [], "G"),
 ("Trainers & guidance", "I", "yes_no", "Do you have female trainers for ladies?", "Is there a lady trainer?", YN, "G"),
 ("Trainers & guidance", "I", "yes_no", "Do trainers teach beginners the basic exercises and correct form?", "I'm new to the gym, who will teach me?", YN, "G"),
 ("Trainers & guidance", "I", "text", "Do you give members a written workout plan? How often do you change it?", "Will you give me a workout chart?", [], "G"),
 ("Trainers & guidance", "O", "text", "Can members bring their own outside personal trainer? Is there a charge?", "Can I bring my own trainer?", [], "G"),
 ("Trainers & guidance", "O", "yes_no", "Can members change their personal trainer if they are not comfortable?", "Can I change my trainer?", YN, "G"),
 ("Trainers & guidance", "O", "yes_no", "Do trainers spot members when they lift heavy weights?", "Will someone spot me on bench press?", YN, "G"),
 ("Trainers & guidance", "I", "text", "For members with back or knee pain, diabetes, BP, thyroid, PCOD, asthma or heart problems, do trainers plan suitable workouts? Do you ask for a doctor's note?", "I have knee pain, can I join?", [], "G"),
 ("Trainers & guidance", "O", "yes_no", "Do your trainers give personal training at home?", "Can a trainer come to my home?", YN, "G*"),
 ("Special programmes", "O", "yes_no", "Do you have light workouts for senior citizens (above 60)?", "Can my father, who is 65, join?", YN, "G"),
 ("Special programmes", "O", "text", "Do you have post-pregnancy programmes? When can women join after a normal delivery or C-section (with the doctor's OK)?", "Can I join 6 months after delivery?", [], "G"),
 ("Special programmes", "O", "text", "Do you have a wedding (bride / groom) transformation package? For how many months, and at what price?", "My wedding is in 3 months, any package?", [], "G"),
 ("Special programmes", "O", "yes_no", "Do you train candidates for police / army physical tests (running, long jump, pull-ups)?", "Do you train for the police physical test?", YN, "G"),
 ("Special programmes", "O", "text", "Do you have rehab training after surgery or an accident with a physiotherapist? Is a physio or doctor consultation free (for example once a month)?", "Do you have physiotherapy?", [], "G"),
 ("Special programmes", "O", "yes_no", "Do you prepare members for bodybuilding competitions (Mr. Andhra, Mr. Telangana, Mr. India), including posing?", "Can you prepare me for Mr. Telangana?", YN, "G"),
 ("Special programmes", "O", "yes_no", "Do trainers adjust workouts for members who are fasting (Ramzan, Karthika masam, Ekadashi)?", "I'm fasting for Ramzan, what timing is good?", YN, "G"),

 ("Diet & results", "I", "options", "Do you give a diet plan?", "Will you give me a diet chart?", ["Free with membership", "Extra charge", "Only with personal training", "No diet plans"], "G"),
 ("Diet & results", "O", "yes_no", "Do your diet plans use normal home food, with pure vegetarian plans (no eggs or chicken) for those who need them?", "I'm vegetarian, will you give a veg diet?", YN, "G"),
 ("Diet & results", "I", "yes_no", "Do you have a certified nutritionist or dietitian?", "Is there a dietitian?", YN, "G"),
 ("Diet & results", "O", "text", "What do you tell members about how long weight loss or weight gain usually takes, and do you promise results?", "How soon will I lose weight?", [], "G"),
 ("Diet & results", "O", "text", "Do you sell supplements such as protein powder? Are they original (with bill and batch number), and do you tell members they are optional and never forced?", "Do I have to take protein powder?", [], "G"),
 ("Diet & results", "O", "yes_no", "Do trainers guide members to build muscle with normal home food, without supplements?", "Can I build my body without supplements?", YN, "G"),

 ("Equipment & facilities", "M", "list", "Which equipment do you have?", "Do you have a treadmill?", ["Treadmills", "Cross trainers / ellipticals", "Exercise & spin bikes", "Rowing machine", "Dumbbells & free weights", "Benches & squat racks", "Smith machine", "Cable crossover / pulley machines", "Leg press & leg machines", "Deadlift platform", "Functional area (kettlebells, TRX, battle ropes, tyres, medicine balls)", "Calisthenics (pull-up bars, parallel bars, rings)", "Boxing bag"], "G"),
 ("Equipment & facilities", "O", "text", "How old are your machines, and which brands are they? Up to what weight do your dumbbells go?", "What's the heaviest dumbbell?", [], "G"),
 ("Equipment & facilities", "O", "yes_no", "Can members drop weights on deadlifts, on a separate platform?", "Can I drop the weights on deadlifts?", YN, "G"),
 ("Equipment & facilities", "O", "text", "Do you give gym gloves, lifting belts, knee wraps and resistance bands to use, or do members bring their own? Do you sell them?", "Do you give gym gloves?", [], "G"),
 ("Equipment & facilities", "I", "yes_no", "Do you have power backup (generator / inverter) for treadmills and lights?", "What if the power goes while I'm on the treadmill?", YN, "G"),
 ("Equipment & facilities", "I", "options", "Is the gym air-conditioned?", "Is there AC in the gym?", ["Full AC, always on", "AC at peak hours", "Non-AC (fans)"], "G"),
 ("Equipment & facilities", "I", "text", "How many cardio machines (treadmills, cross trainers, cycles) do you have, and is there a time limit on them at peak hours?", "Will I have to wait for a treadmill?", [], "G"),
 ("Equipment & facilities", "I", "list", "Which group classes do you have?", "Do you have Zumba?", ["Zumba", "Yoga", "Aerobics", "CrossFit / functional training", "HIIT", "Dance fitness", "Boxing / kickboxing / MMA", "Pilates", "No group classes"], "G"),
 ("Equipment & facilities", "O", "text", "Are group classes included in the membership, or charged extra? On which days and at what times? Are yoga mats given?", "Is Zumba extra?", [], "G"),
 ("Equipment & facilities", "I", "list", "Which facilities do you have?", "Is there a locker?", ["Lockers", "Changing rooms", "Washrooms", "Showers with hot water", "Steam bath", "Sauna", "RO drinking water", "Phone charging points", "Healthy café (shakes, eggs, black coffee)", "Accurate weighing scale", "Massage gun & foam rollers", "Ice bath / cold shower", "Waiting area (also for kids with parents)"], "G"),

 ("Equipment & facilities", "O", "text", "Which facilities are in the fee and which are extra (steam bath, sauna, lockers)? How often can members use them, and do they bring their own locker lock?", "Is steam bath free?", [], "G"),
 ("Hygiene & safety", "I", "text", "How many times a day do you clean the floor, machines, washrooms and changing rooms? Do you keep sanitiser sprays and tissues for members, and take care of ventilation, odour and mosquitoes?", "Are the machines cleaned daily?", [], "G"),
 ("Hygiene & safety", "O", "yes_no", "Do you have a first-aid kit, and staff trained to help if someone gets hurt?", "What if I get hurt?", YN, "G"),
 ("Hygiene & safety", "I", "text", "If a woman member complains of staring or harassment, what action do you take?", "What if someone stares at me in the gym?", [], "G"),
 ("Hygiene & safety", "O", "yes_no", "Do ladies' washrooms have a sanitary-pad bin, and do you keep pads for emergencies?", "Is there a sanitary bin?", YN, "G"),
 ("Hygiene & safety", "O", "yes_no", "Do you have a lost-and-found box, and will you check CCTV if a member's things go missing?", "I forgot my bottle yesterday, did anyone find it?", YN, "G"),
 ("Hygiene & safety", "O", "yes_no", "Do you have CCTV on the gym floor (never in changing rooms) for members' safety?", "Is there CCTV in the gym?", YN, "G"),
 ("Hygiene & safety", "O", "text", "What should members bring and wear (indoor-only shoes, towel, water bottle, dress code)? Are outdoor shoes, chappals or bare feet allowed?", "What should I wear to the gym?", [], "G"),

 ("Assessment & progress", "I", "text", "Do you check BMI, body fat and muscle mass when someone joins? Is it free?", "Will you check my body fat?", [], "G"),
 ("Assessment & progress", "O", "yes_no", "Do trainers check and tell members their progress every month?", "Will you track my progress?", YN, "G"),

 ("Gym rules & complaints", "O", "text", "What are your gym rules for lifting chalk, shirtless mirror photos and loud grunting?", "Can I use chalk for deadlifts?", [], "G"),
 ("Gym rules & complaints", "O", "yes_no", "Do staff make sure members put weights back and don't sit on machines using their phones at peak hours?", "People leave dumbbells everywhere, will you tell them?", YN, "G"),
 ("Gym rules & complaints", "O", "text", "How can members report a broken machine or a complaint, and how soon do you repair machines?", "This machine has been broken for a week, when will you fix it?", [], "G"),
 ("Gym & service", "O", "text", "Do you conduct events (treks, marathons, cricket matches) or transformation challenges with prizes?", "Any running events from the gym?", [], "G"),
 ("Gym & service", "O", "text", "What music do you play and how loud? Can members ask for songs?", "Is the music too loud?", [], "G"),
 ("Gym & service", "O", "yes_no", "Can members shoot videos or reels with a tripod while working out?", "Can I record reels in the gym?", YN, "G"),
 ("Gym & service", "O", "text", "Do you have a mobile app? How is attendance marked (biometric, face recognition)?", "Is there a gym app?", [], "G"),
 ("Gym & service", "O", "text", "Do you have branches in other areas, and can members work out at any branch?", "Can I use the other branch?", [], "G"),
 ("Gym & service", "O", "list", "Which languages can your trainers speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "G"),
 ("Gym & service", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Do you have Instagram?", [], "G"),
]

PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
key, name = "gym", "Gym & fitness centre"
assert len({q[3] for q in Q}) == len(Q), "duplicate question"
rows = sorted(enumerate(Q), key=lambda x: (order[x[1][1]], x[0]))
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
