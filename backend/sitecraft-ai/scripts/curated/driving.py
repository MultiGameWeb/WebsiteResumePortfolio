# Hand-written (curated) question banks for driving schools, RTO agents
# (licence, registration and vehicle paperwork), and businesses that do both.
# Run: python3 scripts/curated/driving.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: D = driving school, R = RTO agent. The combined business gets every
# question tagged D or R.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, offers, photos) are asked separately. Payment methods are not asked.
# The assistant never promises a licence without a test or a pass, and never
# offers fake papers (see botcraft-salesbot.js).
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Driving classes", "M", "list", "Which vehicles do you teach?", "Do you teach scooty?", ["Car (manual)", "Car (automatic)", "Two-wheeler (geared)", "Scooty / gearless", "Auto rickshaw", "Heavy vehicles (lorry, bus)", "Tractor"], "D"),
 ("Driving classes", "I", "text", "What are your course fees and duration (number of days, minutes per day), and what is included (theory, LLR help, licence test vehicle)?", "How much for car driving classes?", [], "D"),
 ("Driving classes", "I", "list", "Who are your trainers?", "Is there a lady trainer?", ["Male trainers", "Female trainers", "Trainers who speak Telugu, Hindi & English"], "D"),
 ("Driving classes", "I", "yes_no", "Do your training cars have dual controls (brake for the trainer)?", "Is there a brake for the trainer?", YN, "D"),
 ("Driving classes", "I", "text", "Which batch timings do you have (early morning, evening, Sundays), and do you pick up learners from home?", "Is there a 6 am batch?", [], "D"),
 ("Driving classes", "O", "list", "What do you train in?", "Will you teach reverse parking?", ["Traffic driving", "Highway driving", "Night driving", "Parking & reversing", "Hill / slope starts", "Licence test track (8 / H track)", "Road signs & rules (theory)", "Simulator"], "D"),
 ("Driving classes", "O", "text", "Which car models do learners train on?", "Which car do you use for training?", [], "D"),
 ("Driving classes", "O", "yes_no", "Do you have refresher classes for licence holders who have not driven for years or are nervous drivers?", "I have a licence but I'm scared to drive, can you help?", YN, "D"),
 ("Driving classes", "O", "text", "Can learners book extra classes if not confident, and can missed classes be rescheduled? What is the charge?", "Can I take 5 more days?", [], "D"),
 ("Driving classes", "O", "text", "If a learner fails the licence test, do you give extra practice and help rebook the test? Any charge?", "What if I fail the test?", [], "D"),
 ("Driving classes", "O", "text", "If there is an accident during a class, who pays for damage (is the training vehicle insured)?", "What if I hit something during class?", [], "D"),
 ("Driving classes", "O", "yes_no", "Are you an accredited driver training centre that gives the training certificate (Form 5) needed for transport / heavy licences?", "Do you give Form 5 for a heavy licence?", YN, "D"),

 ("Licence & RTO help", "M", "list", "Which RTO services do you help with?", "Can you help with RC transfer?", ["Learner's licence (LLR)", "Driving licence (new)", "Licence renewal & duplicate", "Address or details change in licence", "International driving permit", "New vehicle registration", "Ownership transfer", "Loan / hypothecation removal", "NOC for another state", "Re-registration of other-state vehicles", "Fitness certificate", "Permits (taxi, goods)", "Road tax", "Fancy number booking", "Insurance renewal", "Pollution (PUC) certificate", "Challan check & payment"], "R"),
 ("Licence & RTO help", "I", "yes_no", "Do you help with LLR and licence test slot booking for learners?", "Will you book my LLR slot?", YN, "D"),
 ("Licence & RTO help", "I", "text", "For each service, what is the government fee and your service charge?", "How much for ownership transfer?", [], "R"),
 ("Licence & RTO help", "I", "text", "Which documents and ages are needed (for example LLR, licence, RC transfer, NOC), and does the applicant need to come for photo, signature or test?", "What documents for a licence?", [], "DR"),
 ("Licence & RTO help", "I", "text", "How long does each service usually take, and how do you update customers on status?", "How many days for RC transfer?", [], "R"),
 ("Licence & RTO help", "O", "yes_no", "Do you help get the licence and RC on DigiLocker / mParivahan?", "Can I keep my licence on the phone?", YN, "R"),
 ("Licence & RTO help", "O", "text", "For insurance renewal, which companies do you compare, and do you help with claims?", "Can you renew my bike insurance?", [], "R"),

 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "DR"),
 ("Shop & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "DR"),
]

TYPES = [("driving_school", "Driving school", "D"),
         ("rto_agent", "RTO agent (licence & vehicle papers)", "R"),
         ("driving_school_rto", "Driving school & RTO services", "DR")]
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
