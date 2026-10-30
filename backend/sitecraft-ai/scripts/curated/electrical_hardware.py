# Hand-written (curated) question banks for electrical shops, hardware &
# plumbing stores, and shops that are both.
# Run: python3 scripts/curated/electrical_hardware.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: E = electrical shop, H = hardware, plumbing & paints store. The combined
# electrical & hardware shop gets every question tagged E or H.
# A * in the tags marks a city-only question, asked only to shops in a district
# headquarters or city (local shops rarely know these).
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, offers, photos, Wi-Fi)
# are asked separately, so they are not repeated here.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Electrical items", "M", "list", "Which electrical items do you sell?", "Do you have FRLS wire?", ["House wires (FRLS / ZHFR)", "Service, armoured & submersible cables", "CCTV, LAN (Cat-6) & TV (RG-6) cables", "Modular switches, sockets & plates", "MCB, RCCB, changeover, fuses & AC starter boxes", "Earthing kits", "Conduit pipes, boxes & casing-capping", "LED bulbs, tubes, panel lights & bulb holders", "Decorative lights (chandeliers, pendants, strips, tri-colour)", "Outdoor, flood, gate & solar lights", "Festival & serial lights, night bulbs & electric diyas", "Fans, exhaust fans & regulators", "Extension boards, plug tops & adapters", "Calling bells", "Sub-meters & phase selectors", "Motor starters & control panels", "Emergency lights, torches & inverter bulbs", "Mosquito bats & machines, room heaters"], "E"),
 ("Electrical items", "I", "text", "Which wire brands do you sell (for example Polycab, Finolex, Havells, RR Kabel), and are they ISI-marked FRLS?", "Is this Finolex wire original?", [], "E"),
 ("Electrical items", "I", "text", "Which switch and MCB / RCCB brands do you sell (for example Anchor Roma, Legrand, GM, Goldmedal), and do you have designer plates (wooden, grey, glass)?", "Do you have black switch plates?", [], "E"),
 ("Electrical items", "O", "text", "How many years of warranty do switches and sockets have?", "Is there a warranty on switches?", [], "E"),
 ("Electrical items", "O", "yes_no", "Do you have USB / Type-C charging sockets, 2-way switches and small hum-free step regulators?", "Do you have a USB socket?", YN, "E"),
 ("Electrical items", "O", "yes_no", "Do you keep heavy-gauge conduit pipes and boxes that don't break?", "Are these pipes strong?", YN, "E"),
 ("Electrical items", "O", "yes_no", "Do you cut wire by the metre (for example 5 or 10 m) instead of a full 90 m coil?", "Can I take 10 metres?", YN, "E"),
 ("Electrical items", "O", "text", "What warranty do LED bulbs and tubes have? Do you mark the date on them, and replace them without a bill within warranty?", "My bulb fused in 6 months, will you change it?", [], "E"),
 ("Electrical items", "O", "yes_no", "Do you give wholesale rates on false-ceiling lights (COB, spot, profile, rope lights)?", "Rate for 40 ceiling lights?", YN, "E"),
 ("Electrical items", "O", "yes_no", "Do you have motion-sensor lights, foot / step lights and adjustable panel lights?", "Do you have a sensor light?", YN, "E*"),
 ("Electrical items", "O", "yes_no", "Do you make ready-made switch boards (for example 4 sockets + 4 switches for the kitchen) and sell weatherproof switch covers?", "Can you make a kitchen board?", YN, "E"),
 ("Electrical items", "O", "list", "Which spare parts do you keep?", "Do you have a fan capacitor?", ["Fan capacitors, down rods & shackles", "LED drivers & tube chokes / starters", "Immersion heater rods", "Geyser elements & thermostats", "Iron box cords & thermostats", "Mixer couplers, blades & carbon brushes", "Motor capacitors & push buttons", "Electrical tape, clips, cable ties & flexible pipe", "Soldering irons & multimeters"], "E"),

 ("Hardware & plumbing items", "M", "list", "Which hardware, plumbing and paint items do you sell?", "Do you have CPVC pipes?", ["CPVC / UPVC pipes & fittings", "Taps & showers (PTMT, brass)", "Sanitaryware (commodes, basins, flush tanks)", "Kitchen sinks & couplings", "Water tanks", "Water motors & level controllers", "Garden hoses & spray guns", "Leak repair (Teflon tape, M-Seal, solvent)", "Bathroom accessories (stands, rods, mirror cabinets)", "Locks & padlocks", "Door & window hardware (hinges, tower bolts, aldrops, closers, stoppers)", "Cabinet fittings (soft-close hinges, channels)", "Mosquito mesh & door seals", "Curtain rods & brackets", "Ceiling cloth-dryer hangers", "Hand tools & ladders", "Adhesives & screws (Fevicol)", "Waterproofing, putty & white cement", "Paints, primers, brushes & rollers", "Cutting wheels, drill bits & sandpaper", "Construction safety items (helmets, gloves, rope, tools)", "Drain cleaners & plungers"], "H"),
 ("Hardware & plumbing items", "I", "text", "Which pipe and tap brands do you sell (for example Ashirvad, Astral, Finolex, Supreme, Jaquar, Hindware, Cera, Parryware, Prayag)?", "Do you have Jaquar taps?", [], "H"),
 ("Hardware & plumbing items", "I", "text", "Which lock brands do you sell (for example Godrej, Europa, Yale, Harrison), and from what price?", "How much is a Godrej main door lock?", [], "H"),
 ("Hardware & plumbing items", "O", "text", "What is the starting price for a bathroom set (wall mixer, overhead shower, health faucet)?", "How much for a bathroom set?", [], "H"),
 ("Hardware & plumbing items", "O", "yes_no", "Do you sell tap spares separately (washers, spindles, cartridges)?", "My tap is dripping, do you have the spindle?", YN, "H"),
 ("Hardware & plumbing items", "O", "yes_no", "Do you have washing machine taps and long inlet / outlet pipes?", "Do you have a washing machine tap?", YN, "H"),
 ("Hardware & plumbing items", "O", "yes_no", "Do you cut curtain rods to size?", "Can you cut the rod to 5 feet?", YN, "H"),
 ("Hardware & plumbing items", "O", "yes_no", "Do you fit ceiling cloth-dryer hangers at home?", "Can you fit the dryer hanger?", YN, "H"),

 ("Buying advice", "O", "text", "How do you advise wire sizes (for example 2.5 vs 4 sq mm for AC, geyser and main line) and FR vs FRLS / ZHFR wires?", "Which wire for the AC?", [], "E"),
 ("Buying advice", "O", "text", "For an old flickering tube light, do you suggest a new choke / starter or a 20 W LED tube?", "Repair the tube light or buy LED?", [], "E"),
 ("Buying advice", "O", "text", "How do you advise water motors (0.5 vs 1 HP, monoblock vs submersible) and tanks (3- or 4-layer)?", "Which motor for my sump?", [], "H"),

 ("Prices & service", "I", "text", "For a full house-wiring or plumbing list, what discount do you give on the company price list? Do customers who come without an electrician get the electrician's commission as a discount?", "What discount on the full list?", [], "EH"),
 ("Prices & service", "I", "yes_no", "If customers send their electrician's or plumber's list on WhatsApp, do you send a price estimate?", "Can you send a quotation for this list?", YN, "EH"),
 ("Prices & service", "I", "yes_no", "Do you deliver heavy items (pipes, tanks, wire bundles) to the site by auto?", "Can you send the tank to my site?", YN, "EH"),
 ("Prices & service", "O", "text", "Do you take back unused leftover material (wire, switches, fittings) with the bill and refund?", "Can I return the extra wire?", [], "EH"),
 ("Prices & service", "O", "yes_no", "Can you send a trusted electrician or plumber for repairs and fitting?", "Do you know a good electrician?", YN, "EH"),
 ("Prices & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "EH"),
 ("Prices & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "EH"),
]

TYPES = [("electrical_shop", "Electrical shop", "E"), ("hardware_store", "Hardware, plumbing & paints store", "H"),
         ("electrical_hardware", "Electrical & hardware shop", "EH")]
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
