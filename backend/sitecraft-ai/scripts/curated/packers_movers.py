# Hand-written (curated) question bank for packers & movers (home, office and
# vehicle shifting).
# Run: python3 scripts/curated/packers_movers.py  -> writes botcraft-banks/packers_movers.json
# Priorities: M = mandatory, I = important, O = optional.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, offers, photos) are asked separately. Payment methods are not asked.
# The assistant never gives a final price or date without a survey (see
# botcraft-salesbot.js).
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Services", "M", "list", "Which shifting services do you offer?", "Do you shift to other states?", ["Home shifting (same city)", "Home shifting (other cities & states)", "Office shifting", "Car & bike transport", "Packing only", "Loading & unloading only", "Storage / warehouse", "Furniture dismantling & refitting", "AC, TV & washing machine uninstall / install", "Mini truck / tempo only", "International relocation"], "P"),
 ("Services", "I", "text", "Which vehicles do you use (closed container, Tata Ace, 14 / 17 / 20 ft trucks), and is it a full dedicated vehicle or shared (part load)?", "Will my goods go in a separate truck?", [], "P"),
 ("Services", "O", "yes_no", "Do you use your own trucks and trained staff (not outsourced), and are you GST registered?", "Are these your own trucks?", YN, "P"),

 ("Price & survey", "I", "text", "How do you decide the price (house size, distance, floors, lift, packing), and what are typical ranges (for example 1BHK / 2BHK / 3BHK within the city and to Hyderabad / Bengaluru)?", "How much to shift a 2BHK within the city?", [], "P"),
 ("Price & survey", "I", "yes_no", "Do you do a free survey (at home or on video call) and give a written quotation with every charge (GST, tolls, packing, floors, insurance)?", "Can you come and see the house first?", YN, "P"),
 ("Price & survey", "O", "text", "Which extra charges can come up (stairs without a lift, long carry, waiting time, Sundays, society entry, tolls), and are they written in the quote?", "Will there be any extra charges later?", [], "P"),
 ("Price & survey", "I", "text", "How much advance do you take, and is the balance paid only after delivery and checking the goods?", "How much advance?", [], "P"),
 ("Price & survey", "O", "yes_no", "Do you give IBA-approved bills or receipts for company and government transfer claims?", "Can I get an IBA-approved bill?", YN, "P"),
 ("Price & survey", "O", "text", "What is your policy for rescheduling or cancelling a booked shift?", "Can I change the shifting date?", [], "P"),

 ("Packing & handling", "I", "text", "Which packing materials do you use (bubble wrap, corrugated sheets, cartons, wooden crates for glass and TVs), and do you unpack and arrange at the new house?", "How will you pack the TV and glass items?", [], "P"),
 ("Packing & handling", "I", "yes_no", "Do you make an item list (inventory) signed by both sides at pickup and at delivery?", "Will you give a list of all items?", YN, "P"),
 ("Packing & handling", "O", "list", "Which items do you not carry?", "Can you carry the gas cylinder?", ["Filled gas cylinders", "Petrol, kerosene & inflammables", "Cash, jewellery & important documents (customer should carry)", "Perishable food", "Plants", "Pets", "Anything illegal"], "P"),
 ("Packing & handling", "O", "yes_no", "Do you help get society permission, lift booking or entry passes at both apartments?", "Will you talk to our society for the lift?", YN, "P"),

 ("Transit & insurance", "I", "text", "How many days does an intercity shift usually take, and how do customers track the vehicle?", "How many days to Bengaluru?", [], "P"),
 ("Transit & insurance", "I", "text", "Do you offer transit insurance? What does it cost, what does it cover (not self-packed boxes?), and how do customers claim for damage or loss?", "What if something breaks on the way?", [], "P"),

 ("Vehicles & storage", "O", "text", "For car and bike transport: which carrier (closed / open), which documents are needed (RC, insurance, ID), how much fuel should be left, and how many days?", "How do you send my car to Chennai?", [], "P"),
 ("Vehicles & storage", "O", "text", "For storage: monthly charges, is the warehouse safe from rain, termites and theft, and can customers take items out in parts?", "Can I keep my furniture with you for 3 months?", [], "P"),

 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "P"),
 ("Shop & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "P"),
]

PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
key, name = "packers_movers", "Packers & movers"
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
