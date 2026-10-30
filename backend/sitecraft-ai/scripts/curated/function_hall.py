# Hand-written (curated) question banks for function halls, banquet halls,
# kalyana mandapams and lawns, and for commercial / cloud kitchen rentals.
# Run: python3 scripts/curated/function_hall.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: F = function hall, K = kitchen rental. A * marks a city-only question.
# Core questions (name, address, map, parking, timings, phone, WhatsApp,
# offers, photos, Wi-Fi) are asked separately. Payment methods are not asked.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Venues & rent", "M", "list", "Which venues do you have?", "Do you have an AC hall?", ["AC banquet hall", "Non-AC function hall", "Kalyana mandapam", "Open lawn", "Mini hall (birthdays, small functions)", "Conference hall", "Rooftop / terrace"], "F"),
 ("Venues & rent", "M", "text", "What is the rent for a full day (24 hours) and for one session (half day)?", "How much is the hall for one day?", [], "F"),
 ("Venues & rent", "I", "options", "How do you charge for the banquet hall?", "Is the hall free if we take your food?", ["Rent only", "Per plate (food with hall)", "Both options"], "F"),
 ("Venues & rent", "I", "text", "For per-plate bookings, what is the minimum guarantee, what if fewer guests come, and what is the rate for extra plates?", "What if only 150 come instead of 200?", [], "F"),
 ("Venues & rent", "I", "text", "What is included in the rent, and what is charged extra (cleaning, water, garbage, chair covers, AC hours, generator, gas)? Please give a full list.", "Are there any extra charges after the function?", [], "F"),
 ("Venues & rent", "I", "options", "Is GST included in the rent?", "Is GST extra?", ["Included", "Added on the bill", "No GST"], "F"),
 ("Venues & rent", "O", "text", "Do you reduce rent on non-muhurtham days or for small functions (birthday, seemantham, vratham)?", "Any discount for a small function?", [], "F"),

 ("Power, AC & generator", "I", "text", "Is electricity included in the rent, or charged by meter reading (rate per unit)? Can customers photograph the meter before and after?", "Is the current bill extra?", [], "F"),
 ("Power, AC & generator", "I", "text", "How long is the AC on (whole function or only muhurtham hours), and what does an extra AC hour cost?", "Will the AC be on the whole time?", [], "F"),
 ("Power, AC & generator", "I", "text", "Is there a generator, does it run the ACs too, and how is diesel charged?", "Will the AC run on the generator?", [], "F"),

 ("Timings & booking", "I", "text", "At what time is the hall handed over and when must it be vacated? Can decorators and cooks start the night before (any charge)?", "Can the decorators come the night before?", [], "F"),
 ("Timings & booking", "O", "text", "What is the grace time or charge if the function runs late, and do you book another function the same day?", "What if we vacate 2 hours late?", [], "F"),
 ("Timings & booking", "I", "text", "How much advance blocks the date, when is the balance paid, and how much is the caution deposit (refunded when)?", "How much advance to book?", [], "FK"),
 ("Timings & booking", "I", "text", "If the function is cancelled or the muhurtham changes, do you refund or move the advance?", "Will you refund if the wedding is cancelled?", [], "FK"),

 ("Capacity & rooms", "M", "text", "How many people can sit in the main hall, and how many can the dining hall serve per batch? Which floor is the dining hall on?", "How many people fit in the hall?", [], "F"),
 ("Capacity & rooms", "I", "yes_no", "Do you have a passenger lift, a goods lift and a wheelchair ramp?", "Is there a lift for elders?", YN, "F"),
 ("Capacity & rooms", "O", "text", "How many chairs, tables and sofas come free, and are chair covers and table cloths charged?", "Are chair covers free?", [], "F"),
 ("Capacity & rooms", "O", "text", "What is the stage size and ceiling height?", "How big is the stage?", [], "F"),
 ("Capacity & rooms", "I", "text", "How many AC rooms come free for the bride and groom, are there extra guest rooms, and do they have attached bathrooms, hot water and bedding?", "Is there a room for the bride?", [], "F"),
 ("Capacity & rooms", "O", "yes_no", "Are the main doors wide enough for a palanquin, and is there a place at the entrance for the nadaswaram players?", "Can the bride come in a palanquin?", YN, "F"),

 ("Decoration & sound", "I", "text", "Must decoration, lighting and sound be taken from you, or can customers bring outside vendors? Is there a royalty charge?", "Can we bring our own decorator?", [], "F"),
 ("Decoration & sound", "O", "text", "What are the decoration rules (no nails, tape allowed, ceiling hooks / truss), and are mandapam, maharaja chairs and red carpet free?", "Can we fix things on the walls?", [], "F"),
 ("Decoration & sound", "I", "text", "Are DJ and loud music allowed, until what time, and who takes the police permission and music licences (PPL / IPRS)?", "Till what time can we play the DJ?", [], "F"),
 ("Decoration & sound", "O", "text", "Are cold pyros, dry-ice fog and confetti allowed (smoke detectors)? Can the homam be done inside, with exhaust fans?", "Can we do the homam inside the hall?", [], "F"),
 ("Decoration & sound", "O", "text", "Are firecrackers, a horse or a band allowed at the gate for the baraat?", "Can we burst crackers at the gate?", [], "F"),
 ("Decoration & sound", "O", "yes_no", "Can a cow and calf be brought inside or on the stage for rituals?", "Can we bring a cow for the puja?", YN, "F"),
 ("Decoration & sound", "O", "yes_no", "Do you charge for talambralu rice, flower petals or akshintalu on the carpet?", "Will you fine us for rice on the carpet?", YN, "F"),

 ("Kitchen & catering", "I", "options", "Can customers bring their own cook or caterer?", "Can we bring our own cook?", ["Yes, cook in your kitchen", "Only food cooked outside", "Only our in-house catering"], "F"),
 ("Kitchen & catering", "I", "text", "What is the kitchen usage charge for outside caterers?", "How much to use the kitchen?", [], "F"),
 ("Kitchen & catering", "I", "list", "What does your kitchen have?", "Do you have big vessels?", ["Big vessels (degchis, kadais, ladles)", "Wet grinders & vegetable cutters", "Serving buckets & basins", "High-pressure burners / bhatti", "Commercial gas cylinders", "Deep freezer / cold storage", "Dishwashing area & staff", "Outside space for firewood / tandoor", "24-hour sweet water", "Exhaust hood & grease trap", "3-phase power", "Fire safety NOC"], "FK"),
 ("Kitchen & catering", "O", "text", "Are kitchen vessels free or rented per item, and what is charged for missing items?", "Are the vessels free?", [], "FK"),
 ("Kitchen & catering", "O", "text", "How are gas cylinders charged, or can customers bring their own?", "Do we bring our own gas?", [], "FK"),
 ("Kitchen & catering", "I", "options", "Is non-veg allowed?", "Can we serve chicken biryani?", ["Veg and non-veg allowed", "Pure veg only", "Non-veg in a separate area"], "F"),
 ("Kitchen & catering", "O", "yes_no", "For pure-veg functions, do you have a separate veg kitchen and vessels?", "Are the vessels used for non-veg?", YN, "F"),
 ("Kitchen & catering", "O", "text", "Do you provide RO drinking water, buffet counters with warmers, wash basins and hand wash, or should customers bring them?", "Is drinking water provided?", [], "F"),
 ("Kitchen & catering", "O", "text", "Who clears the kitchen waste and leaf plates?", "Who will clean the kitchen?", [], "FK"),

 ("In-house food", "I", "yes_no", "Do you offer free food tasting before booking, with the same ingredients on the function day?", "Can we taste the food before booking?", YN, "F"),
 ("In-house food", "O", "text", "Which live counters do you offer (dosa, chaat, jalebi, rotis), and how many cooks and tawas so there are no long queues?", "Do you have a live dosa counter?", [], "F"),
 ("In-house food", "I", "text", "Is your kitchen FSSAI-licensed? Which oil do you use, and do you avoid reusing oil?", "Is your kitchen FSSAI licensed?", [], "FK"),
 ("In-house food", "O", "text", "How do you count plates (tokens, a person from our side), and what do staff, drivers and photographers' meals cost?", "How will you count the plates?", [], "F"),
 ("In-house food", "O", "yes_no", "Can customers take leftover food home?", "Can we pack the leftover food?", YN, "F"),
 ("In-house food", "O", "text", "If guests fall sick after the food, how do you handle it?", "What if someone gets food poisoning?", [], "F"),

 ("Alcohol & parties", "O", "text", "Is alcohol allowed at receptions, who arranges the one-day excise permit, and is there a separate bar area with counter, glasses and ice?", "Can we serve drinks at the reception?", [], "F"),

 ("Community needs", "O", "yes_no", "For nikah and walima, do you arrange a full purdah partition and lady stewards for the ladies' side?", "Do you have a purdah system?", YN, "F"),
 ("Community needs", "O", "yes_no", "Can you arrange thaal / dastarkhwan seating, and is there a prayer room with wazu facility?", "Is there a place for namaz?", YN, "F"),
 ("Community needs", "O", "yes_no", "Is there open space for Kashi yatra, edurukolu, oonjal and other rituals?", "Is there space for Kashi yatra?", YN, "F"),
 ("Community needs", "O", "yes_no", "Do you allow sit-down banana-leaf meals (pankti bhojanam)?", "Can we serve on banana leaves sitting on the floor?", YN, "F"),
 ("Community needs", "O", "yes_no", "For Christian receptions, do you provide a cake table, toast glasses and a wooden dance floor?", "Is there a dance floor?", YN, "F"),

 ("Corporate & exhibitions", "O", "list", "What do you have for corporate events?", "Do you have a projector?", ["Classroom / U-shape / cluster seating", "Projector & screen", "Podium & lapel mics", "Whiteboard", "High-speed Wi-Fi", "High-tea & working lunch packages"], "F"),
 ("Corporate & exhibitions", "O", "text", "Do you rent the hall for exhibitions and sales (saree, jewellery, books) for several days, with stalls?", "Can we hold a saree exhibition?", [], "F"),

 ("Parking & safety", "I", "text", "How many cars and bikes can park inside, and do you provide valet drivers and security for traffic?", "How many cars can park?", [], "F"),
 ("Parking & safety", "I", "yes_no", "Do you have working CCTV, especially near the bride's room and gift counter?", "Is there CCTV near the gift counter?", YN, "F"),
 ("Parking & safety", "O", "yes_no", "If something goes missing, will your staff cooperate with checking and CCTV?", "Our bag went missing, will you help?", YN, "F"),
 ("Parking & safety", "O", "text", "For lawns, what is the rain backup (indoor hall or waterproof tent)?", "What if it rains on the lawn?", [], "F"),
 ("Parking & safety", "O", "yes_no", "Are sweepers on duty to keep washrooms clean during the function, and do you do fogging before the event?", "Will the toilets be cleaned during the function?", YN, "F"),
 ("Parking & safety", "O", "text", "Is there a lift big enough for a stretcher, and which hospital is nearest?", "Which hospital is near?", [], "F"),
 ("Parking & safety", "O", "text", "Do your staff ask guests for tips after the function? How do you control it?", "Will your staff demand tips?", [], "F"),

 ("Kitchen rental", "M", "text", "Do you rent only the kitchen (per day for bulk cooking, or monthly for a cloud kitchen)? At what rent?", "Can I rent only the kitchen?", [], "FK"),
 ("Kitchen rental", "O", "yes_no", "Is there space for Swiggy / Zomato riders to wait and park?", "Where will delivery boys wait?", YN, "K"),
 ("Kitchen rental", "O", "text", "How many people can the kitchen cook for in a day?", "Can we cook for 1,000 people?", [], "K"),

 ("Service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "FK"),
 ("Service", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Where can I see photos of the hall?", [], "FK"),
]

TYPES = [("function_hall", "Function hall / banquet hall / lawn", "F"), ("kitchen_rental", "Commercial & cloud kitchen rental", "K")]
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
