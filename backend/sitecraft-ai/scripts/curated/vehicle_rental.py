# Hand-written (curated) question banks for vehicle rentals: self-drive cars &
# bikes, travels (cabs, tempo travellers, buses with drivers), both, and goods
# vehicle & machinery rental.
# Run: python3 scripts/curated/vehicle_rental.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: S = self-drive, D = with driver (cabs, buses, wedding cars), G = goods
# vehicles & machinery. The self-drive & travels type gets every question
# tagged S or D.
# A * in the tags marks a city-only question.
# Core questions (name, address, map, parking, timings, phone, WhatsApp,
# offers, photos, Wi-Fi) are asked separately. Payment methods are not asked.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Vehicles & rates", "M", "list", "Which self-drive vehicles do you rent?", "Do you have an automatic car?", ["Scooters & bikes", "Royal Enfield / touring bikes", "Electric scooters (no-licence models)", "Bicycles / geared cycles", "Hatchback", "Sedan", "SUV / 7-seater", "Automatic cars", "Electric cars", "Luxury cars"], "S"),
 ("Vehicles & rates", "M", "list", "Which vehicles with driver do you have?", "Do you have a tempo traveller?", ["Sedan", "SUV / Innova", "Tempo traveller (12–26 seats)", "Mini bus", "Bus (35–50 seats)", "Sleeper coach", "Wedding cars (Audi, BMW, open jeep, vintage)", "Caravan / motorhome", "Ambulance / freezer van", "Boats / yachts"], "D"),
 ("Vehicles & rates", "M", "list", "Which goods vehicles and machines do you rent?", "Do you have a JCB?", ["Goods auto / Tata Ace", "Bolero pickup", "Mini truck / Eicher", "Lorry", "JCB", "Crane", "Tractor & rotavator", "Combine harvester", "Agri drone", "DJ / campaign van", "Generator van"], "G"),
 ("Vehicles & rates", "M", "text", "What is the self-drive rent for each vehicle per hour, per day, per week and per month?", "How much is a car for one day?", [], "S"),
 ("Vehicles & rates", "I", "options", "For self-drive, what does one day mean?", "Is one day 24 hours?", ["24 hours from pick-up", "Calendar day (till midnight)"], "S"),
 ("Vehicles & rates", "I", "text", "How many free kilometres per day, is there an unlimited-km package, and what is the charge per extra km?", "How many km can I drive in a day?", [], "S"),
 ("Vehicles & rates", "I", "text", "What is the charge if the vehicle is returned late (per hour, or a full day)?", "What if I return the car 2 hours late?", [], "S"),
 ("Vehicles & rates", "O", "text", "Are rates higher on weekends and festivals?", "Is the rate more on Sunday?", [], "SD"),
 ("Vehicles & rates", "M", "text", "What is your rate per km with driver, and the minimum km charged per day?", "How much per km for an Innova?", [], "D"),
 ("Vehicles & rates", "I", "options", "How do you count kilometres?", "Do you count km from your garage?", ["Garage to garage", "Point to point (from the customer's place)"], "D"),
 ("Vehicles & rates", "M", "text", "What are your rates for goods vehicles and machines (per trip, per hour, per acre), and is the transport to the site charged?", "How much per hour for a JCB?", [], "G"),
 ("Vehicles & rates", "I", "text", "How do customers book, how much advance is needed, and what is your cancellation and refund policy?", "How do I book a vehicle?", [], "SDG"),
 ("Vehicles & rates", "O", "options", "Is GST included in your rates?", "Is GST extra?", ["Included", "Added on the bill", "No GST"], "SDG"),

 ("Documents & deposit", "M", "text", "Which documents are needed (driving licence, Aadhaar), do you keep any original, and is DigiLocker accepted?", "Will you keep my original licence?", [], "S"),
 ("Documents & deposit", "I", "text", "What is the minimum age and licence needed (no learner's licence)? Can another licensed person drive too?", "Can my father also drive the car?", [], "S"),
 ("Documents & deposit", "I", "text", "How much is the security deposit, can something else be left instead, and how soon is it refunded after return?", "How much deposit?", [], "S"),
 ("Documents & deposit", "I", "options", "Are your self-drive vehicles registered for rental (black number plate with yellow letters)?", "Is this a rental number plate?", ["Yes, all are rental registered", "Some vehicles", "No"], "S"),

 ("Fuel, FASTag & travel", "I", "text", "What is your fuel policy (full to full or same level), and do you refund fuel left over?", "Do I return it with a full tank?", [], "S"),
 ("Fuel, FASTag & travel", "O", "text", "Do vehicles have a FASTag? Who recharges it, and how are tolls settled?", "Is there a FASTag?", [], "S"),
 ("Fuel, FASTag & travel", "I", "text", "Can vehicles go to other states, and who pays the border permit / state tax?", "Can I take the car to Goa?", [], "SD"),
 ("Fuel, FASTag & travel", "I", "text", "Are tolls, parking and state permits included in the package, or paid separately?", "Are tolls included?", [], "DG"),
 ("Fuel, FASTag & travel", "O", "yes_no", "Can customers pick up in one town and drop in another (one-way)?", "Can I drop the car in Vijayawada?", YN, "SD"),
 ("Fuel, FASTag & travel", "I", "text", "Do you deliver and pick up vehicles at home, the airport or the station? What is the charge?", "Can you bring the car to the airport?", [], "S"),

 ("Vehicle condition", "O", "text", "How old are your vehicles (model year, km run)?", "Is the car new?", [], "SDG"),
 ("Vehicle condition", "O", "yes_no", "Are AC, music, power windows and reverse camera checked, with a spare tyre, jack and tool kit in every car?", "Is there a spare tyre?", YN, "SD"),
 ("Vehicle condition", "O", "yes_no", "Do bikes come with two helmets and a mobile holder?", "Will I get two helmets?", YN, "S"),
 ("Vehicle condition", "O", "text", "For electric vehicles, how many km does a full charge give, and where can customers charge?", "How far does the electric scooter go?", [], "S"),
 ("Vehicle condition", "I", "text", "If the vehicle or machine breaks down on the way or at the site, do you send a replacement or a mechanic, and who pays?", "What if the car breaks down on the highway?", [], "SDG"),
 ("Vehicle condition", "O", "text", "Who pays for a puncture or a burst tyre?", "Who pays if the tyre bursts?", [], "S"),

 ("Damage & insurance", "I", "yes_no", "Do you record a video of existing scratches at pick-up and check the vehicle together with the customer at return?", "Can I take a video of old scratches?", YN, "S"),
 ("Damage & insurance", "I", "text", "What do you charge for scratches, dents or broken glass?", "How much for a small scratch?", [], "S"),
 ("Damage & insurance", "I", "text", "What insurance do your vehicles have, and what is the most a customer pays in an accident (maximum liability)?", "What if there is an accident?", [], "S"),
 ("Damage & insurance", "O", "text", "Do customers pay rent for the days the vehicle is in the garage after an accident?", "Do I pay rent while it's repaired?", [], "S"),
 ("Damage & insurance", "O", "text", "What happens in case of theft, floods or a tree falling on a parked vehicle?", "What if the car is stolen?", [], "S"),
 ("Damage & insurance", "O", "text", "What if the key is lost or locked inside, or the wrong fuel is filled? Do you have a spare key?", "I locked the key inside, what now?", [], "S"),
 ("Damage & insurance", "O", "text", "If police seize the vehicle (for example drunk driving), what does the customer pay?", "What if police seize the car?", [], "S"),
 ("Damage & insurance", "I", "text", "How are traffic e-challans during the rental paid?", "Who pays the challan?", [], "S"),
 ("Damage & insurance", "O", "text", "Do vehicles have a speed governor or GPS tracking? Do you ever stop a vehicle remotely, and when?", "Will you track where I go?", [], "S"),

 ("Rules & fees", "O", "text", "What are the fines for smoking, drinking, pets or vomiting in the vehicle, and is there a washing charge?", "Is there a fine for smoking?", [], "S"),
 ("Rules & fees", "O", "yes_no", "Is there any in-cabin camera or voice recorder in your vehicles?", "Is there a camera inside the car?", YN, "SD"),
 ("Rules & fees", "O", "list", "What extras can customers rent?", "Do you have a baby car seat?", ["Baby car seat", "Riding jackets & knee guards", "Saddle bags", "Fuel cans", "Sunshades", "Roof carrier"], "S"),

 ("Driver & trip", "I", "text", "How much is the driver bata per day and the night charge? Who pays for the driver's food and stay?", "How much is driver bata?", [], "D"),
 ("Driver & trip", "I", "yes_no", "Are your drivers experienced on these routes, sober and careful (no gutka, smoking or phone while driving), and will you change the driver on a complaint?", "Is the driver safe?", YN, "D"),
 ("Driver & trip", "O", "text", "Which languages do your drivers speak? Can you send a driver who knows the language of the state we visit?", "Does the driver know Tamil?", [], "D"),
 ("Driver & trip", "O", "yes_no", "Do drivers stop where customers want (no commission hotels) and drop them near the entrance?", "Will the driver stop where we want?", YN, "D"),
 ("Driver & trip", "O", "yes_no", "Is the AC kept on on ghat roads (Tirumala, Araku)?", "Will you switch off the AC on the ghat?", YN, "D"),
 ("Driver & trip", "O", "yes_no", "Can customers note the odometer reading at the start and see the fuel bills?", "Can I take a photo of the odometer?", YN, "D"),

 ("Buses & special vehicles", "O", "list", "What do your tempo travellers and buses have?", "Are the seats push-back?", ["Push-back seats", "Sleeper berths", "Music / DJ system", "LED TV & mic", "Charging points", "Roof carrier / big boot"], "D"),
 ("Buses & special vehicles", "O", "text", "Can groups carry cooking items in the bus for yatras? What is not allowed?", "Can we carry a gas stove?", [], "D"),
 ("Buses & special vehicles", "O", "yes_no", "Do you arrange tour packages with hotels and sightseeing (Tirupati, Srisailam, Araku)?", "Do you have a Tirupati package?", YN, "D"),
 ("Buses & special vehicles", "O", "text", "What are your wedding car packages (4 / 8 hours), and do you decorate the car or allow outside decoration?", "How much is an Audi for the baraat?", [], "D"),

 ("Goods & machines", "I", "text", "Which vehicle suits house shifting (1BHK, 2BHK, 3BHK)?", "Which vehicle for a 2BHK shifting?", [], "G"),
 ("Goods & machines", "I", "text", "Do loading and unloading workers come with the vehicle? What do they charge?", "Will you send loading workers?", [], "G"),
 ("Goods & machines", "O", "yes_no", "Does an experienced operator come with JCBs, tractors and harvesters?", "Does the JCB come with a driver?", YN, "G"),
 ("Goods & machines", "I", "text", "Is there a minimum charge (minimum hours or trips), and is diesel included for machines?", "Is diesel included for the JCB?", [], "G"),
 ("Goods & machines", "O", "text", "Which villages and areas do you serve, and how soon can a vehicle or machine reach the site?", "Can the tractor come today?", [], "G"),
 ("Goods & machines", "O", "text", "If goods get damaged in shifting, or something gets damaged at the work site, who pays?", "What if my fridge gets damaged in shifting?", [], "G"),
 ("Goods & machines", "O", "yes_no", "Do you pack goods (sheets, bubble wrap) for house shifting?", "Will you pack the furniture?", YN, "G"),

 ("Corporate & partners", "O", "yes_no", "Do you give vehicles on monthly corporate contracts (employee pick-up and drop)?", "Can you give 10 cars monthly for our office?", YN, "SD"),
 ("Corporate & partners", "O", "text", "Can people attach their own car to your agency? What do they earn, and who pays for damage?", "Can I attach my car with you?", [], "SD"),
 ("Corporate & partners", "O", "text", "Please share your Google reviews link and Instagram page, if you have them.", "Where can I see your reviews?", [], "SDG"),
]

TYPES = [("self_drive_rental", "Self-drive car & bike rental", "S"),
         ("travels", "Travels (cabs, tempo travellers & buses)", "D"),
         ("self_drive_travels", "Self-drive rental & travels", "SD"),
         ("goods_equipment_rental", "Goods vehicle & machinery rental", "G")]
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
