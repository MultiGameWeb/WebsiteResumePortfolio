# Hand-written (curated) question banks for vehicle service businesses: car
# service garage, bike & scooter service, car & bike garage (both), car wash &
# detailing studio, and lorry / auto / tractor service.
# Run: python3 scripts/curated/vehicle_service.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: C = car garage, B = bike & scooter, W = wash & detailing, H = heavy
# vehicles (lorry, auto, tractor). The car & bike garage gets every question
# tagged C or B.
# Core questions (name, address, map, parking, timings, phone, WhatsApp,
# offers, photos, Wi-Fi) are asked separately. Payment methods are not asked.
# Diagnosis questions ("why is my bike smoking?") are not asked: the assistant
# asks customers to bring the vehicle for an inspection and estimate.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Services", "M", "list", "Which car services do you do?", "Do you do car AC repair?", ["General service", "Engine overhaul / half-engine work", "Clutch work", "Suspension & lathe work", "Brakes & disc skimming", "Radiator & overheating", "Timing belt / chain", "OBD computer scanning", "AC service & gas", "Electrical & wiring (rat bites)", "Battery, self & alternator", "ECM repair", "Denting & painting", "Wheel alignment & balancing", "Tyres & puncture", "CNG / LPG kits", "Electric car repair", "BS6 diesel DPF / AdBlue", "Sunroof leak & repair", "ADAS / 360° camera calibration", "Airbag replacement", "Smart key coding", "Steering rack / EPS repair", "Automatic gearbox (AMT, CVT, DCT, torque converter)"], "C"),
 ("Services", "M", "list", "Which bike and scooter services do you do?", "Do you repair scooty belts?", ["General service", "Engine work", "Scooter CVT (belt, rollers, clutch shoes)", "Fork straightening & oil seals", "Chain sprocket kit", "Royal Enfield tuning", "Fuel injection & fuel pump", "Electrical & self start", "Brakes", "Tyres & puncture", "Bike wash", "Electric scooter repair (hub motor, controller, BMS)"], "B"),
 ("Services", "M", "list", "Which heavy vehicle services do you do?", "Do you do leaf spring work?", ["Leaf springs", "Hub greasing", "Differential / crown pinion", "Engine overhaul", "BS6 DPF / AdBlue", "Auto rickshaw repair", "Tractor hydraulics", "Electrical", "Tyres"], "H"),
 ("Services", "M", "list", "Which wash and detailing services do you offer?", "Do you do ceramic coating?", ["Foam wash with underbody on a lift", "Interior dry cleaning", "AC vent disinfection", "Headlight restoration", "Engine bay cleaning (sensors protected)", "Rubbing & polishing", "Teflon coating", "Ceramic coating", "Graphene coating", "Paint protection film (PPF)", "Underbody anti-rust coating"], "W"),
 ("Services", "I", "text", "Which makes and models do you specialise in?", "Do you service Hyundai cars?", [], "CBH"),

 ("Prices & estimates", "M", "text", "What is your general service labour charge, and what is included?", "How much for a general service?", [], "CB"),
 ("Prices & estimates", "M", "text", "What are your wash and detailing prices (by vehicle size), and what warranty do coatings have?", "How much is ceramic coating?", [], "W"),
 ("Prices & estimates", "I", "yes_no", "After inspection, do you give a written estimate and call the customer before any extra work or part change?", "Will you call me before changing parts?", YN, "CBWH"),
 ("Prices & estimates", "I", "text", "Is there an inspection or scanning charge if the customer doesn't do the repair?", "Do you charge just to check?", [], "CBH"),
 ("Prices & estimates", "I", "text", "What do major jobs usually cost (engine overhaul, clutch set, suspension)? Please give rough ranges.", "How much for an engine overhaul?", [], "CBH"),
 ("Prices & estimates", "O", "text", "How much do customers usually save compared with the authorised service centre?", "Is it cheaper than the showroom?", [], "CB"),
 ("Prices & estimates", "O", "text", "Do you charge MRP on spare parts or give a discount?", "Do you give discount on parts?", [], "CBH"),
 ("Prices & estimates", "O", "yes_no", "If customers bring their own parts, do you fit them for a labour charge?", "Can I bring my own parts?", YN, "CBH"),
 ("Prices & estimates", "O", "options", "Is GST included in your bill?", "Is GST extra?", ["Included", "Added on the bill", "No GST"], "CBWH"),
 ("Prices & estimates", "O", "text", "Do you have yearly maintenance (AMC) packages?", "Is there a yearly service package?", [], "CBW"),

 ("Trust & parts", "I", "options", "Which spare parts do you use?", "Are the parts original?", ["Genuine company parts (OEM)", "OES brands (Bosch, Valeo, Gabriel)", "Aftermarket, clearly told", "Tested used parts (on request)", "Customer's choice"], "CBH"),
 ("Trust & parts", "I", "yes_no", "Do you give back the old parts and the new parts' boxes?", "Will you give back my old parts?", YN, "CBH"),
 ("Trust & parts", "O", "yes_no", "Can customers sit and watch the work, or get photos and videos on WhatsApp?", "Can I watch the service?", YN, "CBWH"),
 ("Trust & parts", "I", "yes_no", "At drop-off, do you note the fuel level, odometer and belongings (spare wheel, jack, tools), keep parts like the catalytic converter safe, use seat and steering covers, and never use customers' vehicles for personal trips?", "Will your boys ride my bike around?", YN, "CBWH"),

 ("Engine oil & fluids", "I", "text", "Which engine oil brands do you use, and do you open sealed cans in front of the customer (no loose drum oil)?", "Is the oil from a sealed can?", [], "CBH"),
 ("Engine oil & fluids", "O", "text", "Which oil grades do you offer (mineral, semi-synthetic, fully synthetic), and after how many km should each be changed?", "How long does synthetic oil last?", [], "CBH"),
 ("Engine oil & fluids", "O", "text", "How do you drain old oil, and when do you suggest an engine flush?", "Do I need an engine flush?", [], "CBH"),
 ("Engine oil & fluids", "O", "text", "Which filters do you replace at each service, and which do you clean?", "Do you change all filters every time?", [], "CBH"),
 ("Engine oil & fluids", "O", "yes_no", "Do you check and top up coolant, brake, power-steering and gear oil at every service?", "Will you top up the coolant?", YN, "CH"),

 ("Car repairs", "O", "text", "Do you have an OBD scanner? What does scanning and clearing an error code cost?", "My check-engine light is on, can you scan it?", [], "C"),
 ("Car repairs", "O", "text", "How do you check AC cooling problems (gas top-up, leak test, cooling coil), and what are the charges?", "My car AC isn't cooling, how much?", [], "C"),
 ("Car repairs", "O", "yes_no", "For rat-bitten wiring, do you replace damaged wiring properly, and fit rat mesh and repellent?", "Rats cut my car wires, can you fix it?", YN, "C"),
 ("Car repairs", "O", "yes_no", "Do you repair ECMs or source tested used ones?", "Can you repair my ECM?", YN, "C"),
 ("Car repairs", "O", "list", "Which low-cost repairs do you do?", "Can you weld my silencer instead of a new one?", ["Silencer welding / patch", "Plastic bumper welding", "Windshield crack resin repair", "Petrol tank leak repair"], "CB"),
 ("Car repairs", "O", "yes_no", "Do you offer lathe-work bushes as a cheaper option for suspension?", "Can you do lathe bushes?", YN, "CH"),

 ("Denting, painting & insurance", "I", "text", "What is your per-panel denting and painting rate?", "How much to paint one door?", [], "C"),
 ("Denting, painting & insurance", "I", "text", "How do you match paint (computerised colour matching), do you paint in a dust-free booth, and which paint brand do you use?", "Will the colour match?", [], "C"),
 ("Denting, painting & insurance", "I", "options", "Do you handle insurance claims?", "Is cashless insurance available?", ["Cashless with insurers", "Reimbursement help", "No insurance work"], "C"),
 ("Denting, painting & insurance", "O", "text", "Do you call the surveyor, and explain what the customer pays (file charge, consumables) and whether a small claim is worth it?", "Should I claim insurance for a scratch?", [], "C"),

 ("Alignment & tyres", "I", "text", "What do wheel alignment and balancing cost, and are balancing weights charged?", "How much for alignment?", [], "C"),
 ("Alignment & tyres", "O", "yes_no", "Do you fill nitrogen and do mushroom patches for tubeless punctures?", "Do you have nitrogen air?", YN, "CB"),

 ("Used & old vehicles", "I", "text", "Do you inspect a used vehicle before purchase (accident, engine opened, flood damage, real km from the ECU)? What does it cost?", "Can your mechanic check a second-hand car before I buy?", [], "CB"),
 ("Used & old vehicles", "O", "text", "For flood-damaged vehicles, do you tow without starting, drain the engine, and dry and clean the interior?", "My car was in flood water, what do I do?", [], "CB"),
 ("Used & old vehicles", "O", "yes_no", "Do you revive vehicles that stood unused for months (tank rust, jammed tyres)?", "My bike stood for a year, can you get it running?", YN, "CBH"),
 ("Used & old vehicles", "O", "yes_no", "Do you prepare vehicles for the RTO fitness test and fix PUC failures (tuning, silencer cleaning)?", "My bike failed the pollution test, can you fix it?", YN, "CBH"),
 ("Used & old vehicles", "O", "text", "For engine swaps, do you help update the engine number in the RC at the RTO?", "Can you fit another engine and update the RC?", [], "CBH"),
 ("Used & old vehicles", "O", "yes_no", "Do you buy old vehicles for scrap?", "Will you buy my old car for scrap?", YN, "CBH"),
 ("Accessories", "I", "list", "Which accessories do you fit?", "Can you fit an Android stereo?", ["Relay-kit LED / projector lights (no wire cutting)", "Android stereo & reverse camera", "Dashcam hardwiring", "Seat covers", "Sound damping", "Suspension buffers"], "CBW"),
 ("EV, CNG & diesel", "O", "text", "Which electric vehicle brands do you repair?", "Do you repair Ola scooters?", [], "CB"),
 ("EV, CNG & diesel", "O", "text", "How do you handle DPF warnings and limp mode (regeneration, cleaning), and do you sell AdBlue?", "My diesel car shows DPF full, can you fix it?", [], "CH"),
 ("EV, CNG & diesel", "O", "text", "Do you tune CNG / LPG kits and help with cylinder hydro-testing certificates?", "My car stops on gas, can you tune it?", [], "CH"),

 ("Delivery & warranty", "I", "text", "Do you pick up and drop vehicles? What is the charge?", "Can you pick up my car from home?", [], "CBW"),
 ("Delivery & warranty", "I", "text", "Do you give breakdown help (jump-start, towing)? What is the visit charge?", "My car stopped on the road, can you come?", [], "CBH"),
 ("Delivery & warranty", "I", "text", "How long does a service usually take, where are vehicles kept overnight (locked, CCTV), and do you give a vehicle to get home if delivery is delayed?", "Will I get it back the same day?", [], "CBWH"),
 ("Delivery & warranty", "I", "text", "What warranty do you give on repairs and parts (days or km)?", "Is there a warranty on the repair?", [], "CBH"),
 ("Delivery & warranty", "I", "text", "If the original complaint isn't fixed, a new problem appears right after the service, or something isn't refitted properly (rattles, grease marks), do you fix it free?", "The noise came after your service, will you fix it free?", [], "CBWH"),

 ("Service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "CBWH"),
 ("Service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "CBWH"),
]

TYPES = [("car_service", "Car service garage", "C"), ("bike_service", "Bike & scooter service", "B"),
         ("car_bike_service", "Car & bike service garage", "CB"), ("car_wash_detailing", "Car wash & detailing studio", "W"),
         ("heavy_vehicle_service", "Lorry, auto & tractor service", "H")]
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
