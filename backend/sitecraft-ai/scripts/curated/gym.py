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
 ("Membership & fees", "M", "text", "What are your membership fees for 1, 3, 6 and 12 months?", "How much is the gym fee?", [], "G"),
 ("Membership & fees", "I", "text", "Is there a registration or admission fee on top of the package fee? How much?", "Is there an admission fee?", [], "G"),
 ("Membership & fees", "I", "text", "Apart from the package fee, are there any other charges (personal training, locker, group classes, GST)?", "Are there any hidden charges?", [], "G"),
 ("Membership & fees", "I", "text", "Do you give a free trial before joining? For how many days?", "Can I try the gym for a day first?", [], "G"),
 ("Membership & fees", "I", "options", "Can members pay the fee in parts?", "Can I pay the fee in instalments?", ["Full payment only", "Monthly instalments on long packages", "Depends on the package"], "G"),
 ("Membership & fees", "O", "text", "Do you have couple, family, group or friends discounts?", "Any offer for couples?", [], "G"),
 ("Membership & fees", "O", "text", "Do you have special discounts for students, corporate employees or senior citizens?", "Any student discount?", [], "G"),
 ("Membership & fees", "O", "text", "Can members freeze (pause) their membership when they are out of town? For how many days?", "Can I pause my membership for a month?", [], "G"),
 ("Membership & fees", "O", "text", "Do you refund the fee if a member stops, and can a membership be transferred to someone else?", "Can I transfer my membership to my brother?", [], "G"),
 ("Membership & fees", "O", "text", "Do you have a day pass or per-visit fee (for example for visitors from other towns)?", "Can I come for just one day?", [], "G"),
 ("Membership & fees", "O", "text", "What is the minimum age to join? Can teenagers join with a parent's permission?", "Can my 15-year-old son join?", [], "G"),

 ("Timings & crowd", "M", "options", "Is your gym unisex? Do you have ladies-only timings or a ladies section?", "Is this a ladies gym?", ["Unisex", "Unisex with ladies-only timings", "Separate ladies section", "Men only", "Ladies only"], "G"),
 ("Timings & crowd", "I", "text", "When is the gym busiest, and when is it quiet?", "What time is the gym less crowded?", [], "G"),
 ("Timings & crowd", "O", "options", "Can members come any time during opening hours, or only in a chosen slot?", "Can I come at any time?", ["Any time", "Fixed slot (morning or evening)", "Depends on the package"], "G"),
 ("Timings & crowd", "O", "text", "Is the gym open on festival holidays? Any change in timings?", "Is the gym open on Sankranti?", [], "G"),

 ("Trainers & guidance", "M", "options", "Does a floor trainer guide all members, or is a personal trainer needed for proper guidance?", "Will a trainer help me, or do I need a personal trainer?", ["Floor trainer guides everyone (free)", "Personal trainer needed for full guidance", "Both available"], "G"),
 ("Trainers & guidance", "I", "text", "How much does personal training cost (per month or per session)?", "How much for a personal trainer?", [], "G"),
 ("Trainers & guidance", "I", "text", "Are your trainers certified? How many years of experience do they have?", "Are the trainers certified?", [], "G"),
 ("Trainers & guidance", "I", "yes_no", "Do you have female trainers for ladies?", "Is there a lady trainer?", YN, "G"),
 ("Trainers & guidance", "I", "yes_no", "Do trainers teach beginners the basic exercises and correct form?", "I'm new to the gym, who will teach me?", YN, "G"),
 ("Trainers & guidance", "I", "text", "For members with back or knee pain, diabetes, BP, PCOD or after surgery, do trainers plan suitable workouts? Do you ask for a doctor's note?", "I have knee pain, can I join?", [], "G"),
 ("Trainers & guidance", "O", "yes_no", "Do your trainers give personal training at home?", "Can a trainer come to my home?", YN, "G*"),

 ("Diet & results", "I", "options", "Do you give a diet plan?", "Will you give me a diet chart?", ["Free with membership", "Extra charge", "Only with personal training", "No diet plans"], "G"),
 ("Diet & results", "O", "yes_no", "Do you give vegetarian diet plans?", "I'm vegetarian, will you give a veg diet?", YN, "G"),
 ("Diet & results", "O", "text", "What do you tell members about how long weight loss or weight gain usually takes?", "How soon will I lose weight?", [], "G"),
 ("Diet & results", "O", "text", "Do you sell supplements such as protein powder? Do you tell members they are optional?", "Do I have to take protein powder?", [], "G"),
 ("Diet & results", "O", "yes_no", "Do trainers guide members to build muscle with normal home food, without supplements?", "Can I build my body without supplements?", YN, "G"),

 ("Equipment & facilities", "M", "list", "Which equipment do you have?", "Do you have a treadmill?", ["Treadmills", "Cross trainers / ellipticals", "Exercise & spin bikes", "Rowing machine", "Dumbbells & free weights", "Benches & squat racks", "Smith machine", "Cable / pulley machines", "Leg machines", "Functional area (kettlebells, TRX, battle ropes)", "Boxing bag"], "G"),
 ("Equipment & facilities", "I", "options", "Is the gym air-conditioned?", "Is there AC in the gym?", ["Full AC, always on", "AC at peak hours", "Non-AC (fans)"], "G"),
 ("Equipment & facilities", "I", "text", "How many cardio machines (treadmills, cross trainers, cycles) do you have, and is there a time limit on them at peak hours?", "Will I have to wait for a treadmill?", [], "G"),
 ("Equipment & facilities", "I", "list", "Which group classes do you have?", "Do you have Zumba?", ["Zumba", "Yoga", "Aerobics", "CrossFit / functional training", "Dance fitness", "Kickboxing / MMA", "Pilates", "No group classes"], "G"),
 ("Equipment & facilities", "O", "text", "Are group classes included in the membership, or charged extra? At what times?", "Is Zumba extra?", [], "G"),
 ("Equipment & facilities", "I", "list", "Which facilities do you have?", "Is there a locker?", ["Lockers", "Changing rooms", "Washrooms", "Showers", "Steam bath", "Sauna", "RO drinking water", "Music system", "Waiting area"], "G"),

 ("Hygiene & safety", "I", "yes_no", "Do you clean and sanitise machines, mats, washrooms and changing rooms every day?", "Are the machines cleaned daily?", YN, "G"),
 ("Hygiene & safety", "O", "yes_no", "Do you have a first-aid kit, and staff trained to help if someone gets hurt?", "What if I get hurt?", YN, "G"),
 ("Hygiene & safety", "O", "yes_no", "Do you have CCTV on the gym floor (never in changing rooms) for members' safety?", "Is there CCTV in the gym?", YN, "G"),
 ("Hygiene & safety", "O", "text", "What should members bring (separate indoor shoes, towel, water bottle, mat)?", "What should I bring to the gym?", [], "G"),

 ("Assessment & progress", "I", "text", "Do you check BMI, body fat and muscle mass when someone joins? Is it free?", "Will you check my body fat?", [], "G"),
 ("Assessment & progress", "O", "yes_no", "Do trainers check and tell members their progress every month?", "Will you track my progress?", YN, "G"),

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
