# Hand-written (curated) question banks for veterinary medicine & cattle feed
# shops, poultry feed & medicine shops, aqua shops (fish & prawn feed and pond
# care), and shops that sell all three.
# Run: python3 scripts/curated/vet_feed.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: V = veterinary medicines & cattle feed, P = poultry, Q = aqua. The
# combined shop gets every question tagged V, P or Q.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, offers, photos, Wi-Fi)
# are asked separately. Payment methods are not asked.
# The assistant never diagnoses an animal or works out doses itself: it shares
# the shop's stock and own suggestions and points farmers to a vet (see
# botcraft-salesbot.js).
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Cattle feed & fodder", "M", "list", "Which cattle feed and fodder items do you keep?", "Do you have cattle feed?", ["Cattle feed pellets (bags)", "Bypass protein / bypass fat feed", "Rice bran (with oil and de-oiled / DORB)", "Oil cakes (cottonseed, groundnut, coconut, sesame, sunflower)", "Chuni / husk (chana, red gram, black gram)", "Maize grit / powder", "Calf milk replacer & calf starter", "Sheep & goat feed", "Silage bales", "Fodder seeds & slips"], "V"),
 ("Cattle feed & fodder", "I", "text", "Which cattle feed brands do you keep (for example Godrej, Heritage, Vijaya, Kapila, Cargill, Kaveri, Nandini, SKM, Amul), and how should farmers get today's bag rate?", "What is the rate of a 50 kg feed bag?", [], "V"),
 ("Cattle feed & fodder", "I", "text", "For farmers whose milk, fat or SNF is low, which feed or supplements do you usually suggest (to be confirmed with a vet)?", "Which feed increases fat in buffalo milk?", [], "V"),
 ("Cattle feed & fodder", "O", "yes_no", "Do you check feed and oil cakes for fungus and dampness (aflatoxin) and store them off the floor?", "Is this cottonseed cake free of fungus?", YN, "V"),
 ("Cattle feed & fodder", "O", "text", "Which fodder seeds and slips do you keep (for example Super Napier, CO-4, COFS-29, multi-cut jowar, maize, lucerne)?", "Do you have Super Napier slips?", [], "V"),
 ("Cattle feed & fodder", "O", "text", "Do you give a lower rate or free auto delivery for bulk feed (for example 10–20 bags)?", "Will you send 20 bags home?", [], "VPQ"),
 ("Cattle feed & fodder", "O", "text", "Do you give credit to dairy farmers until the milk bill comes (for example every 15 days)?", "Can I pay when the dairy bill comes?", [], "V"),

 ("Minerals & supplements", "I", "list", "Which supplements do you keep for cattle?", "Do you have liquid calcium?", ["Liquid calcium (5 / 10 litre cans)", "Chelated mineral mixture", "Mineral salt lick blocks", "Liver tonics", "Rumen powders & digestives", "Soda bicarbonate", "Galactagogue boluses / powders (without injections)", "Weight-gain tonics for sheep & goats"], "V"),
 ("Minerals & supplements", "O", "text", "Which calcium and mineral mixture brands do you keep (for example Ostovet, Calshakti, Milchigen, Agrimin Forte, Minfa Gold), and in what pack sizes?", "How much is a 5 kg mineral mixture?", [], "V"),

 ("Vet medicines", "M", "list", "Which veterinary medicines do you keep?", "Do you have deworming medicine for buffaloes?", ["Dewormers (liquid & bolus)", "Tick, lice & fly medicines (spray, pour-on)", "Skin & wound sprays (maggot wounds)", "Mastitis tubes & udder gels", "Bloat & digestion medicines", "Diarrhoea / scour medicines", "Fever & pain medicines (on prescription)", "Antibiotics (on prescription)", "Eye & foot-rot medicines", "Sheep & goat medicines"], "V"),
 ("Vet medicines", "I", "yes_no", "Do you sell antibiotics and injections only with a vet's prescription?", "Can I buy an antibiotic injection without a doctor?", YN, "VPQ"),
 ("Vet medicines", "I", "yes_no", "Do you keep dewormers that the label says are safe for pregnant animals, and tell farmers to confirm with a vet?", "Which dewormer is safe for a pregnant buffalo?", YN, "V"),
 ("Vet medicines", "O", "text", "Which dewormer and tick medicine brands do you keep (for example Fenbendazole / Panacur, Albendazole, Ivermectin, Oxyclozanide, Butox, Flumethrin pour-on)?", "Do you have Butox?", [], "V"),
 ("Vet medicines", "O", "yes_no", "Do you explain the label safety steps for tick medicines (for example stopping the animal from licking, gloves, keeping away from the water trough)?", "Will it harm the buffalo if it licks the medicine?", YN, "V"),
 ("Vet medicines", "O", "text", "Which mastitis items do you keep (intramammary tubes, udder gels, teat siphons and teat dips)?", "Do you have mastitis tubes?", [], "V"),
 ("Vet medicines", "O", "yes_no", "Do you keep vaccines for cattle, sheep and goats (FMD, HS, BQ, PPR, ET, sheep pox, LSD) in a fridge with power backup, and pack them with ice for travel?", "Do you have PPR vaccine for sheep?", YN, "V"),
 ("Vet medicines", "O", "text", "Do you sell vaccines and medicines in small packs for farmers with only a few animals or birds?", "I have only 10 hens, do you have a small pack?", [], "VP"),

 ("Vet & farm help", "I", "options", "Is a vet available?", "Is there a vet at your shop?", ["Vet at the shop", "Vet visits on fixed days", "We give a nearby vet's number", "Government vet hospital nearby", "No vet"], "VPQ"),
 ("Vet & farm help", "O", "yes_no", "Do you tell farmers about government schemes and free vaccination camps (FMD, LSD, sheep deworming)?", "When is the free vaccine camp?", YN, "V"),
 ("Vet & farm help", "O", "yes_no", "Can you arrange artificial insemination (AI) or a pregnancy check through a vet or gopalamitra?", "Can you send someone for AI?", YN, "V"),

 ("Dairy & farm equipment", "O", "list", "Which dairy farm equipment do you sell?", "Do you have milking machine liners?", ["Milking machines & liners", "Chaff cutters & blades", "Cow rubber mats", "Ropes, bells & halters", "Water troughs & buckets", "Teat dips & udder wipes", "Fans & foggers for sheds"], "V"),

 ("Poultry feed", "M", "list", "Which poultry feed do you keep?", "Do you have broiler starter feed?", ["Broiler pre-starter", "Broiler starter", "Broiler finisher", "Layer mash", "Grower mash", "Country chicken feed", "Feed for fighter cocks (grains & mixes)"], "P"),
 ("Poultry feed", "I", "text", "Which poultry feed brands do you keep, and do you give wholesale rates for farms (for example per 10 bags)?", "What is the rate for 10 bags of starter?", [], "P"),

 ("Poultry health", "I", "list", "Which poultry medicines and vaccines do you keep?", "Do you have Lasota vaccine?", ["Vaccines (Lasota, F1, R2B, Gumboro / IBD, fowl pox)", "Water-soluble antibiotics (on prescription)", "Coccidiosis medicines", "Vitamins & electrolytes (summer heat)", "Liver & kidney tonics", "Dewormers", "Disinfectants & lime for sheds", "Fly baits & larvicides"], "P"),
 ("Poultry health", "O", "yes_no", "Do you give poultry vaccines with an ice flask (cold chain) and the vaccination schedule?", "Will you pack the vaccine with ice?", YN, "P"),
 ("Poultry health", "O", "text", "Which vitamins, calcium and tonics do you keep for country chickens and fighter cocks?", "Do you have vitamins for fighting roosters?", [], "P"),
 ("Poultry health", "O", "yes_no", "Can farmers bring a dead or sick bird for a post-mortem check through a vet?", "Can someone check why my hens are dying?", YN, "P"),

 ("Poultry equipment", "O", "list", "Which poultry equipment do you sell?", "Do you have nipple drinkers?", ["Nipple & bell drinkers", "Feeders", "Brooders (gas, charcoal, electric)", "Litter (paddy husk)", "Shed curtains", "Cages & nets", "Egg trays", "Incubators"], "P"),
 ("Poultry equipment", "O", "yes_no", "Do you sell day-old chicks (broiler, layer or country) or take orders for them?", "Do you have country chicken chicks?", YN, "P"),

 ("Aqua feed", "M", "list", "Which aqua feed do you keep?", "Do you have floating fish feed?", ["Floating fish feed (pellets)", "Sinking fish feed", "Rice bran & oil cakes for fish", "Vannamei shrimp feed (starter to grower)", "Scampi feed", "Feed binders & gels"], "Q"),
 ("Aqua feed", "I", "text", "Which aqua feed brands, pellet sizes and protein levels do you keep (for example Avanti, CP, Growel, Uno, Waterbase, Godrej; 2–4 mm; 24–32% protein)?", "Do you have 3 mm floating feed?", [], "Q"),
 ("Aqua feed", "O", "text", "Do you give credit until harvest for regular pond farmers? On what terms?", "Can I pay after the harvest?", [], "Q"),

 ("Pond care", "I", "list", "Which pond care products do you keep?", "Do you have oxygen tablets?", ["Oxygen tablets & powders", "Zeolite", "Yucca", "Water & soil probiotics", "Gut probiotics", "Lime & dolomite", "Plankton / bloom minerals", "Minerals & vitamin C for shrimp", "Disinfectants (BKC, iodine, KMnO4)", "Medicines for fish lice (Argulus), on the label rules"], "Q"),
 ("Pond care", "I", "yes_no", "Do you keep oxygen tablets / powders in stock all the time, and can farmers get them early in the morning or at night in an emergency?", "Fish are gasping, can I get oxygen tablets now?", YN, "Q"),
 ("Pond care", "O", "text", "Do you test pond water (pH, ammonia, nitrite, alkalinity, hardness) or shrimp gut under a microscope? Is it free?", "Can you test my pond water?", [], "Q"),
 ("Pond care", "O", "text", "Do you sell water test kits, aerators and spares (paddle wheels, gearboxes, motors)?", "Do you have a 2 HP aerator?", [], "Q"),
 ("Pond care", "O", "yes_no", "Do you have a technician or consultant who visits ponds?", "Can someone come and see my pond?", YN, "Q"),

 ("Shop & service", "I", "yes_no", "Do you give a bill with batch number and expiry for medicines and vaccines?", "Will I get a bill with the expiry date?", YN, "VPQ"),
 ("Shop & service", "O", "text", "Which items can't be returned (for example vaccines, opened medicines, cut feed bags)?", "Can I return this vaccine?", [], "VPQ"),
 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada", "Odia"], "VPQ"),
 ("Shop & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "VPQ"),
]

TYPES = [("vet_cattle_feed", "Veterinary medicines & cattle feed shop", "V"),
         ("poultry_needs", "Poultry feed & medicines shop", "P"),
         ("aqua_needs", "Aqua shop (fish & prawn feed, pond care)", "Q"),
         ("vet_poultry_aqua", "Veterinary, poultry & aqua shop", "VPQ")]
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
