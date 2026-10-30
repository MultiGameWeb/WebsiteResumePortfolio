# Hand-written (curated) question bank for courier & parcel offices
# (franchises of courier companies, Speed Post franchises, parcel booking).
# Run: python3 scripts/curated/courier.py  -> writes botcraft-banks/courier_parcel.json
# Priorities: M = mandatory, I = important, O = optional.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, offers, photos) are asked separately. Payment methods are not asked.
# The assistant never helps send banned items or under-declare value, and
# warns about courier scam calls (see botcraft-salesbot.js).
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Services", "M", "list", "Which courier services do you offer?", "Do you send parcels abroad?", ["Documents (domestic)", "Parcels (domestic)", "Express / priority", "Same-day city delivery", "International courier", "Heavy parcels & cargo", "Pickup from home or office", "Packing service", "Business / bulk shipping", "Cash on delivery for sellers", "Receiving parcels for customers (pickup point)"], "C"),
 ("Services", "M", "list", "Which courier companies do you book with?", "Is this DTDC?", ["DTDC", "Blue Dart", "Delhivery", "Professional Couriers", "Shree Maruti", "ST Courier", "India Post / Speed Post", "Ekart", "DHL / FedEx / Aramex (international)", "Our own network"], "C"),

 ("Rates & time", "I", "text", "What are your rates by weight (for example first 500 g and each extra 500 g) for within the state, other states and metros, and how do you charge big light parcels (volumetric weight)?", "How much to send 1 kg to Hyderabad?", [], "C"),
 ("Rates & time", "I", "text", "How many days does delivery usually take to the same city, other districts, other states and villages?", "How many days to Delhi?", [], "C"),
 ("Rates & time", "O", "text", "Which areas or pin codes do you not deliver to, and what happens for remote villages?", "Do you deliver to my village?", [], "C"),
 ("Rates & time", "O", "text", "What is the last time to book for same-day dispatch, and do you deliver on Sundays and holidays?", "If I book at 6 pm, will it go today?", [], "C"),

 ("Booking & packing", "I", "text", "Do you pick up from homes and offices? Is there a charge or minimum?", "Can you pick up from my house?", [], "C"),
 ("Booking & packing", "I", "text", "Do you pack parcels (boxes, bubble wrap, wooden crates for fragile items)? What does packing cost?", "Can you pack my laptop safely?", [], "C"),
 ("Booking & packing", "I", "text", "Which ID or documents does the sender need (ID proof, invoice or bill for goods, KYC for international)?", "Do I need Aadhaar to send a parcel?", [], "C"),
 ("Booking & packing", "I", "list", "Which items do you NOT accept?", "Can I send a power bank?", ["Cash, cheques & gold / jewellery", "Liquids, oils & ghee (unless sealed and allowed)", "Batteries & power banks", "Perfumes, aerosols & sprays", "Gas, firecrackers & inflammables", "Medicines without a bill", "Perishable food", "Live plants, seeds & animals", "Weapons, knives & sharp items", "Anything illegal"], "C"),
 ("Booking & packing", "O", "text", "How do you send home-made food (pickles, sweets, podis) safely within India and abroad, and which foods are not allowed for certain countries?", "Can I send pickles to the USA?", [], "C"),

 ("Tracking & delivery", "I", "text", "How can customers track a parcel (tracking number, website, SMS / WhatsApp updates)?", "How do I track my courier?", [], "C"),
 ("Tracking & delivery", "O", "text", "If the receiver is not available, how many attempts are made, can it be held at the office, and what does a return to the sender cost?", "Nobody was home, what happens to my parcel?", [], "C"),
 ("Tracking & delivery", "O", "yes_no", "Can the delivery address be changed after booking?", "Can I change the address now?", YN, "C"),
 ("Tracking & delivery", "O", "yes_no", "Do you give proof of delivery (receiver's name or signature) when asked?", "Can I get proof that it was delivered?", YN, "C"),

 ("Loss & damage", "I", "text", "If a parcel is lost, delayed or damaged, how do customers claim, how long does it take, and what is the maximum compensation?", "My parcel is damaged, what do I do?", [], "C"),
 ("Loss & damage", "O", "text", "Do you offer insurance or declared-value cover for costly items? What does it cost?", "Can I insure my parcel?", [], "C"),

 ("International", "O", "text", "For international courier: which countries, delivery time, documents needed, and who pays customs duty?", "How many days to the US, and who pays customs?", [], "C"),

 ("Business customers", "O", "text", "Do you give monthly accounts, bulk rates or cash-on-delivery for sellers and businesses (online sellers, offices)?", "I sell on Instagram, do you have COD?", [], "C"),

 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "C"),
 ("Shop & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "C"),
]

PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
key, name = "courier_parcel", "Courier & parcel service"
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
