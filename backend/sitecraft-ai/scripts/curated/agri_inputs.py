# Hand-written (curated) question bank for fertilizer, seeds & pesticides
# shops (agri-input dealers).
# Run: python3 scripts/curated/agri_inputs.py  -> writes botcraft-banks/agri_inputs.json
# Priorities: M = mandatory, I = important, O = optional.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, offers, photos, Wi-Fi)
# are asked separately. Payment methods are not asked.
# The assistant never works out pesticide doses or mixes itself: it shares the
# shop's own recommendations and asks farmers to follow the label and check at
# the counter.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Fertilizers & stock", "M", "list", "Which fertilizers do you keep?", "Do you have DAP?", ["Urea", "DAP", "Potash (MOP)", "Complex (20-20-0-13, 10-26-26, 14-35-14, 28-28-0)", "Single super phosphate (SSP)", "Nano urea / nano DAP", "Water-soluble (19:19:19, 13:0:45, 0:52:34, 0:0:50, 12:61:0)", "Micronutrients (zinc, boron, MgSO4, ferrous, calcium nitrate)", "Organic (neem cake, castor cake, vermicompost)", "Humic acid & mycorrhiza"], "A"),
 ("Fertilizers & stock", "M", "text", "What is today's stock of urea and DAP, is the e-POS machine working, and when is the next load due? (Update this any time.)", "Is urea in stock today?", [], "A"),
 ("Fertilizers & stock", "I", "text", "Do you sell fertilizers at the government MRP? Is there any hamali or transport charge?", "What is the urea bag rate?", [], "A"),
 ("Fertilizers & stock", "I", "yes_no", "Do you sell urea and DAP without making farmers buy other items (nano urea, zinc, granules)?", "Do I have to buy nano urea with urea?", YN, "A"),
 ("Fertilizers & stock", "O", "text", "Which fertilizer companies do you stock (IFFCO, Coromandel, Nagarjuna, Zuari, RCF, Kribhco)?", "Do you have Gromor?", [], "A"),
 ("Fertilizers & stock", "O", "text", "What do nano urea and nano DAP cost, and what does the company say they replace?", "How much is nano urea?", [], "A"),

 ("e-POS & subsidy", "I", "text", "What must farmers bring for subsidised fertilizer (Aadhaar, pattadar passbook)? Can a family member or tenant farmer buy, and what if fingerprints don't work (iris, OTP)?", "Do I need my passbook?", [], "A"),
 ("e-POS & subsidy", "O", "text", "Is there a limit on bags per Aadhaar?", "How many bags can I get?", [], "A"),

 ("Credit & bills", "I", "text", "Do you give credit until harvest? Is the price or interest different on credit?", "Can I pay after harvest?", [], "A"),
 ("Credit & bills", "O", "text", "Do you buy farmers' produce and adjust their dues?", "Will you buy my paddy?", [], "A"),
 ("Credit & bills", "O", "text", "What discount do you give for cash payment?", "Any discount for cash?", [], "A"),
 ("Credit & bills", "I", "yes_no", "Do you give a proper bill (with GST, batch and lot numbers) for every sale, usable for crop loans and complaints?", "Will you give a bill with the lot number?", YN, "A"),

 ("Seeds", "M", "list", "Which seeds do you sell?", "Do you have cotton seeds?", ["Paddy", "Cotton (BT)", "Chilli", "Maize", "Groundnut", "Pulses (red gram, black gram, green gram)", "Soybean", "Vegetable hybrids", "Green manure (dhaincha, sunnhemp, pillipesara)"], "A"),
 ("Seeds", "I", "text", "Which paddy varieties do you have, with their duration and the company's yield claims (BPT 5204, MTU 1010, MTU 1061, RNR 15048, KNM 118 and others)?", "Do you have BPT seeds?", [], "A"),
 ("Seeds", "I", "text", "Which cotton seed brands do you have and at what packet price? Which suit black or red soil?", "Which cotton seed is good for black soil?", [], "A"),
 ("Seeds", "O", "text", "Which chilli, maize and vegetable hybrids do you have, and at what price?", "Do you have Syngenta chilli seeds?", [], "A"),
 ("Seeds", "O", "text", "What do green manure seeds cost, and are they available on subsidy?", "Is dhaincha on subsidy?", [], "A"),
 ("Seeds", "I", "yes_no", "Do you sell only government-approved seeds (no HT cotton or loose unlabelled seed)?", "Do you have HT cotton seeds?", YN, "A"),
 ("Seeds", "I", "text", "If seeds don't germinate or turn out fake, how do you help (lot number on the bill, complaint to the company, compensation)?", "My seeds didn't germinate, what now?", [], "A"),

 ("Pesticides", "M", "list", "Which crop protection products do you keep?", "Do you have weedicides?", ["Insecticides", "Fungicides", "Weedicides", "Granules", "Bio-pesticides (neem oil, Trichoderma, Pseudomonas)", "Sticky traps & pheromone lures", "Spreaders / stickers"], "A"),
 ("Pesticides", "I", "text", "For common pests and diseases here (for example paddy stem borer, BPH, blast; cotton sucking pests, pink bollworm; chilli thrips and mites; maize armyworm), which products does your shop usually recommend? The assistant will share these and always ask farmers to follow the label and confirm at the counter.", "Which spray for paddy stem borer?", [], "A"),
 ("Pesticides", "I", "yes_no", "Does a qualified person at the shop (agri graduate / licensed dealer) explain dose, mixing, label instructions and safety (gloves, mask)?", "How many ml per tank?", YN, "A"),
 ("Pesticides", "I", "yes_no", "Do you look at crop photos on WhatsApp or visit fields to suggest a remedy?", "Can I send you a photo of the leaf?", YN, "A"),
 ("Pesticides", "O", "text", "Which weedicides do you keep for each crop, and do you sell restricted products like glyphosate only as the rules allow?", "Do you have weedicide for paddy?", [], "A"),
 ("Pesticides", "O", "text", "Which tonics and growth regulators do you keep (for flowering, fruit set)?", "Any tonic for more flowers?", [], "A"),
 ("Pesticides", "I", "yes_no", "Do you check expiry dates and never sell expired or old stock?", "Is this an old stock?", YN, "A"),
 ("Pesticides", "I", "text", "If a product doesn't work after spraying, do you bring the company representative to see the field?", "I sprayed twice and the pest is still there, what now?", [], "A"),
 ("Pesticides", "O", "text", "Do you take back unopened products, or exchange them?", "Can I return an unopened bottle?", [], "A"),

 ("Equipment & services", "I", "list", "Which equipment do you sell?", "Do you have battery sprayers?", ["Battery sprayers", "Petrol power sprayers", "HTP sprayers", "Sprayer spares (batteries, motors, nozzles)", "Tarpaulins", "Mulching sheets", "Bird & shade nets"], "A"),
 ("Equipment & services", "O", "yes_no", "Do you repair sprayers?", "Can you repair my sprayer?", YN, "A"),
 ("Equipment & services", "O", "text", "Do you arrange drone spraying? What does it cost per acre?", "How much for drone spraying?", [], "A"),
 ("Equipment & services", "O", "text", "Do you help with soil testing?", "Can you test my soil?", [], "A"),
 ("Equipment & services", "O", "text", "Do you deliver bulk orders to villages or fields? Who pays hamali?", "Can you send 30 bags to my village?", [], "A"),

 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "A"),
 ("Shop & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "A"),
]

PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
key, name = "agri_inputs", "Fertilizer, seeds & pesticides shop"
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
