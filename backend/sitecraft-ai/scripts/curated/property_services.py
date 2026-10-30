# Hand-written (curated) question banks for real estate agents & builders,
# hostels & PGs, and home appliance repair services.
# Run: python3 scripts/curated/property_services.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: E = real estate, P = hostel / PG, A = appliance repair.
# Core questions (name, address, map, parking, timings, phone, WhatsApp,
# offers, photos, Wi-Fi) are asked separately. Payment methods are not asked.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Properties", "M", "list", "What do you deal in?", "Do you have open plots?", ["Open plots / ventures", "Farm land / farm plots", "New flats / apartments", "Independent houses / villas", "Resale properties", "House rentals", "Shops & offices (sale / rent)"], "E"),
 ("Properties", "M", "options", "Are you the builder / developer, or an agent?", "Are you the builder?", ["Builder / developer", "Agent / broker", "Both"], "E"),
 ("Properties", "I", "text", "What are your plot rates (per square yard, gunta or acre), and the extra for east / north facing or corner plots?", "What is the rate per yard?", [], "E"),
 ("Properties", "I", "text", "Which approvals do your projects have (HMDA / DTCP / RERA with LP and RERA numbers), or are they GP layouts or farm plots? Please give the numbers so buyers can check them.", "Is this venture HMDA approved?", [], "E"),
 ("Properties", "O", "text", "Is LRS paid, and can buyers get building permission now?", "Can I start building right away?", [], "E"),
 ("Properties", "I", "text", "Can buyers see the title documents (30-year link documents, EC), and is the land free of assigned, endowment, waqf or lake FTL / buffer issues?", "Is this land clear of FTL?", [], "E"),
 ("Properties", "O", "text", "Which banks give loans on your projects, and how is registration done (charges, spot registration)?", "Will SBI give a loan here?", [], "E"),
 ("Properties", "O", "yes_no", "Do you arrange free site visits with pick-up and drop?", "Can you take us to see the venture on Sunday?", YN, "E"),
 ("Properties", "I", "text", "For flats, what is the rate per sft, and what is the all-inclusive price (parking, amenities, corpus fund, GST, registration)?", "What is the full price of a 2BHK?", [], "E"),
 ("Properties", "I", "text", "Are the flats ready to move (with occupancy certificate), or when is handover?", "Is OC received?", [], "E"),
 ("Properties", "O", "text", "What are the super built-up area, carpet area and UDS (land share) of your flats, how many flats per floor, and are they vastu compliant?", "What is the carpet area?", [], "E"),
 ("Properties", "O", "text", "Do you sell landowner-share flats, and are they registered the same way as the builder's?", "Is this a landowner share flat?", [], "E"),
 ("Rentals", "I", "text", "For rentals, what are the usual rent, maintenance, advance (how many months) and your brokerage?", "How much is a 2BHK rent?", [], "E"),
 ("Rentals", "O", "text", "Which houses allow bachelors, pets or non-veg cooking, and what about water and the owner living in the same building?", "Do they allow bachelors?", [], "E"),
 ("Rentals", "O", "yes_no", "Do you help with the rental agreement and tenant police verification?", "Will you make the rent agreement?", YN, "E"),

 ("Rooms & rent", "M", "text", "What is the rent for each sharing (1, 2, 3, 4) and for AC / non-AC rooms?", "How much for 2 sharing?", [], "P"),
 ("Rooms & rent", "M", "options", "Who is the hostel for?", "Is this a ladies hostel?", ["Men", "Women", "Co-living"], "P"),
 ("Rooms & rent", "I", "text", "What deposit do you take, what is the notice period before leaving, and when is the deposit deducted?", "Will I get my deposit back?", [], "P"),
 ("Rooms & rent", "I", "text", "What is included in the rent, and what is extra (for example AC electricity)?", "Is electricity extra for AC?", [], "P"),
 ("Food", "I", "text", "How many meals a day, which days have chicken and eggs, and do you pack a lunch box for office or college?", "How many days chicken?", [], "P"),
 ("Facilities & rules", "I", "list", "Which facilities do you have?", "Is there Wi-Fi?", ["Wi-Fi", "Washing machine", "Geyser / hot water", "Room cleaning", "AC rooms", "Power backup", "RO water", "CCTV & security", "Lockers / cupboards", "Bike parking"], "P"),
 ("Facilities & rules", "I", "text", "What are the gate timings and visitor rules?", "What time is the gate closed?", [], "P"),
 ("Facilities & rules", "O", "yes_no", "Do you verify residents' ID and register them with the police as required?", "Do you check IDs?", YN, "P"),
 ("Facilities & rules", "O", "text", "How far are the nearby colleges, offices or IT parks, and how do residents usually travel?", "How far is the IT park?", [], "P"),
 ("Facilities & rules", "O", "yes_no", "Can someone stay a day or two before joining?", "Can I stay one day and see?", YN, "P"),
 ("Facilities & rules", "O", "text", "Who handles complaints (warden, manager), and how soon?", "Whom do I complain to?", [], "P"),

 ("Repairs", "M", "list", "Which appliances do you repair?", "Do you repair LED TVs?", ["LED / smart TVs (panel, backlight, bonding)", "ACs (install, shift, gas, jet service)", "Fridges (cooling, compressor, gas)", "Washing machines (drum, motor, PCB)", "Microwaves", "Geysers", "RO purifiers", "Chimneys", "Inverters"], "A"),
 ("Repairs", "M", "text", "What is your visiting / inspection charge?", "What is the visiting charge?", [], "A"),
 ("Repairs", "I", "text", "What do common jobs usually cost (TV backlight, AC service and gas, fridge gas, washing machine PCB)? Please give ranges.", "How much for AC gas filling?", [], "A"),
 ("Repairs", "I", "text", "Which brands do you service?", "Do you repair Samsung?", [], "A"),
 ("Repairs", "I", "options", "Which spare parts do you use?", "Are the parts original?", ["Original company parts", "Compatible parts, clearly told", "Customer's choice"], "A"),
 ("Repairs", "I", "yes_no", "Do you give an estimate before repairing and call before any extra work, and give back old parts?", "Will you tell me the cost first?", YN, "A"),
 ("Repairs", "I", "text", "What warranty do you give on repairs and parts?", "Is there a warranty on the repair?", [], "A"),
 ("Repairs", "O", "text", "How soon can a technician come, and do you take big repairs to your workshop?", "Can someone come today?", [], "A"),
 ("Repairs", "O", "text", "Do you offer yearly maintenance (AMC) for ACs and purifiers?", "Is there an AC service plan?", [], "A"),

 ("Service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "EPA"),
 ("Service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "EPA"),
]

TYPES = [("real_estate", "Real estate agent & builder", "E"), ("hostel_pg", "Hostel / PG", "P"),
         ("appliance_repair", "Home appliance repair service", "A")]
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
