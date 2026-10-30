# Hand-written (curated) question banks for interior designers & modular
# kitchen makers, plywood / laminates / glass shops, and UPVC & aluminium
# window makers.
# Run: python3 scripts/curated/interiors.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: I = interior designer & modular kitchen, L = plywood, laminates &
# glass shop, U = UPVC & aluminium windows.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, EMI, offers, photos)
# are asked separately. Payment methods are not asked.
# The assistant never gives a final quote: it shares the rates below and asks
# customers to book a site visit (see botcraft-salesbot.js).
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Work & packages", "M", "list", "Which work do you do?", "Do you do modular kitchens?", ["Full home interiors (turnkey)", "Modular kitchen", "Wardrobes & lofts", "TV units & wall panelling", "Pooja room / mandir", "False ceiling & lighting", "Beds, study & crockery units", "Glass & mirror work", "Wallpaper", "Office & shop interiors"], "I"),
 ("Work & packages", "I", "text", "What is your starting package price for a full 2BHK and 3BHK (kitchen, wardrobes, TV unit, pooja unit, false ceiling)?", "How much for full 2BHK interiors?", [], "I"),
 ("Work & packages", "I", "text", "What is your rate per sq ft for wardrobes and kitchen, and what material and finish does it include?", "What is your per sq ft rate?", [], "I"),
 ("Work & packages", "I", "options", "Is your sq ft rate for full box work (with shelves inside) or only frame and shutters on existing cement shelves?", "Is the rate for box work or shutters only?", ["Full box work", "Frame & shutters only", "Both, at different rates"], "I"),
 ("Work & packages", "O", "text", "What rate do you charge for lofts above wardrobes?", "Is the loft rate lower?", [], "I"),
 ("Work & packages", "I", "text", "How do you measure for the final bill (outer size only, or each shelf separately), and do you write this in the quotation?", "How will you measure for the bill?", [], "I"),
 ("Work & packages", "O", "text", "Do you show a 3D design or walk-through before starting? Is it charged, and is the fee adjusted if the customer gives you the work?", "Will you show a 3D design first?", [], "I"),
 ("Work & packages", "O", "text", "Which items are not in your package and are charged extra (for example chimney, hob, sink, countertop, electrical, lights, painting)?", "Is the chimney included in the package?", [], "I"),
 ("Work & packages", "I", "yes_no", "Do you give a written quotation that lists the brands, thickness and finish of every material?", "Will the quotation list the brands?", YN, "I"),

 ("Materials", "M", "list", "What do you sell?", "Do you have BWP plywood?", ["Plywood (BWP / MR)", "HDHMR, MDF & particle boards", "WPC / PVC foam boards", "Flush & WPC doors", "Laminates (sunmica)", "Acrylic & PU / veneer sheets", "Edge-banding tape", "Cabinet hardware (hinges, channels, handles)", "Kitchen baskets & accessories", "Adhesives (Fevicol)", "Glass & mirrors", "Wall panels & louvers", "Wallpaper"], "L"),
 ("Materials", "I", "text", "Which boards do you use for kitchen and bathroom vanities, and which for bedrooms (for example BWP IS:710 plywood, MR IS:303, HDHMR, WPC)?", "Is the kitchen made with BWP plywood?", [], "IL"),
 ("Materials", "I", "text", "Which plywood and board brands do you use or sell (for example CenturyPly, Greenply, Austin, Kitply, Sainik 710, Action Tesa, Greenpanel)?", "Which plywood brand do you use?", [], "IL"),
 ("Materials", "O", "text", "How can customers check that a plywood sheet is original (brand QR code or app, ISI marks)?", "How do I know this CenturyPly is original?", [], "IL"),
 ("Materials", "O", "text", "What core wood is in your plywood (gurjan, alternate, poplar, eucalyptus), and do you tell customers clearly?", "Is this full gurjan plywood?", [], "IL"),
 ("Materials", "O", "yes_no", "Do you use particle board or plain MDF anywhere? Do you tell customers where?", "Do you use particle board?", YN, "I"),
 ("Materials", "O", "yes_no", "Do you make termite-proof and waterproof cupboards with WPC or PVC foam board?", "Can you make cupboards that termites can't eat?", YN, "IL"),
 ("Materials", "O", "text", "What thickness do you use for carcass, shutters and back panels (for example 18 / 19 mm, 6 or 8 mm back)?", "Is the back panel 4 mm or 8 mm?", [], "IL"),
 ("Materials", "O", "text", "Which laminates do you use or sell (brands, 1 mm or 0.8 mm, matte, high-gloss, textured, fluted), and what goes inside the cupboards?", "Is the laminate 1 mm?", [], "IL"),
 ("Materials", "O", "text", "Do you do acrylic, lacquered glass, PU or veneer finishes? What is the rate per sq ft?", "How much extra for acrylic shutters?", [], "IL"),
 ("Materials", "O", "text", "Which adhesive do you use (for example Fevicol Marine, HeatX)?", "Which gum do you use?", [], "I"),
 ("Materials", "I", "options", "Is your work factory-made or made on site?", "Is it factory finish?", ["Factory-made (machine cut & edge-banded)", "Made on site by carpenters", "Both"], "I"),

 ("Kitchen & hardware", "I", "text", "Which hardware brands do you use or sell (for example Hettich, Hafele, Ebco, Blum, Godrej), with soft-close hinges and channels, and what warranty?", "Are the hinges soft-close?", [], "IL"),
 ("Kitchen & hardware", "O", "options", "Which steel do you use for kitchen baskets?", "Will the baskets rust?", ["SS 304", "SS 202", "Customer's choice"], "IL"),
 ("Kitchen & hardware", "O", "list", "Which kitchen accessories do you fit?", "Do you have a magic corner?", ["Tandem / box drawers", "Magic corner / carousel", "Tall pantry unit", "Bottle pull-out", "Cutlery tray", "Plate & glass rack (GTPT)", "Wicker / detergent pull-outs", "Profile handles & G-profile"], "IL"),
 ("Kitchen & hardware", "O", "text", "Do you supply the countertop (granite, quartz), sink, chimney and hob too? Which brands?", "Do you fit the quartz countertop?", [], "I"),

 ("Wardrobes, pooja & glass", "O", "yes_no", "Do you make sliding wardrobes, aluminium-profile glass shutters and sensor lights inside cupboards?", "Can you make a sliding wardrobe?", YN, "I"),
 ("Wardrobes, pooja & glass", "O", "yes_no", "Do you make CNC jali pooja units with backlit acrylic designs?", "Can you make a CNC jali mandir?", YN, "IL"),
 ("Wardrobes, pooja & glass", "O", "list", "Which glass and mirror work do you do?", "Do you fit shower glass partitions?", ["LED / touch-sensor mirrors", "Toughened glass shower partitions", "Glass & SS railings", "Lacquered & fluted glass", "Glass table tops", "Office glass partitions"], "IL"),

 ("Ceiling & walls", "O", "text", "Which false ceiling do you do (gypsum, POP, PVC or wooden panels), with which brands, and how do you prevent joint cracks?", "Will the ceiling crack?", [], "I"),
 ("Ceiling & walls", "O", "text", "Is wiring, cove lighting and spot lights included in your false ceiling rate? Do you add the fan hook extension?", "Is lighting included in the ceiling rate?", [], "I"),
 ("Ceiling & walls", "O", "yes_no", "Do you do wall panelling (UV marble sheet, charcoal louvers) and wallpaper?", "Do you do louvers behind the TV?", YN, "IL"),

 ("Windows & doors", "M", "list", "Which windows and doors do you make or sell?", "Do you make UPVC windows?", ["UPVC sliding windows", "UPVC casement windows", "Aluminium (system) windows", "Sliding & folding balcony doors", "Pleated mosquito mesh", "SS 304 security mesh doors", "Flush doors", "WPC / PVC bathroom doors", "Invisible grills"], "U"),
 ("Windows & doors", "I", "text", "What is your rate per sq ft for UPVC and aluminium windows, which profile brands do you use, and which glass (5 mm toughened, double-glazed)?", "How much per sq ft for UPVC windows?", [], "U"),
 ("Windows & doors", "O", "yes_no", "Are your UPVC profiles UV-protected so they don't turn yellow in the sun? Is there a warranty?", "Will the UPVC turn yellow?", YN, "U"),
 ("Windows & doors", "O", "yes_no", "Do you also do mosquito mesh, flush / WPC doors and invisible grills?", "Do you fit invisible grills?", YN, "I"),

 ("Plywood shop service", "I", "text", "Do you give a lower rate or wholesale price for bulk sheets, and is delivery free?", "Is delivery free for 50 sheets?", [], "L"),
 ("Plywood shop service", "O", "yes_no", "Do you do machine cutting and edge-banding for customers' own carpenters (job work)?", "Can you cut and edge-band my sheets?", YN, "L"),
 ("Plywood shop service", "O", "text", "Do you take back unused full sheets? Any deduction?", "Can I return 5 extra sheets?", [], "L"),
 ("Plywood shop service", "O", "text", "If customers buy directly without a carpenter, do they get the carpenter's commission as a discount?", "I came without a carpenter, will you reduce the commission?", [], "L"),
 ("Plywood shop service", "O", "yes_no", "Can you suggest trusted carpenters or interior workers?", "Do you know a good carpenter?", YN, "L"),

 ("Timeline & payment", "I", "text", "How many days do you usually take for a full 2BHK, and do you agree to a written completion date (with a delay penalty)?", "Can you finish before our gruhapravesam in 45 days?", [], "IU"),
 ("Timeline & payment", "I", "text", "What are your payment stages (advance, on material delivery, mid-work, final after checking)?", "How much advance do I pay?", [], "IU"),
 ("Timeline & payment", "O", "text", "What warranty do you give on your work, and do you come for free service visits (hinge adjustment, alignment)?", "What warranty on the work?", [], "IU"),
 ("Site work", "O", "yes_no", "Do your workers follow apartment rules (no noisy work on Sundays or late evenings)?", "Will your workers follow our apartment rules?", YN, "IU"),
 ("Site work", "O", "yes_no", "Do you protect floors and fittings during work (floor protection sheets)?", "Will you protect the floor tiles?", YN, "IU"),
 ("Site work", "O", "text", "After work, do you remove the debris and do a deep cleaning? Free or charged?", "Will you clean the house after the work?", [], "IU"),
 ("Site work", "O", "list", "Which areas do you work in?", "Do you work in other towns?", ["Our town / city only", "Nearby towns", "Anywhere in the state", "Other states"], "IU"),

 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "ILU"),
 ("Shop & service", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Where can I see your work?", [], "ILU"),
]

TYPES = [("interior_designer", "Interior designer & modular kitchen", "I"),
         ("plywood_glass", "Plywood, laminates & glass shop", "L"),
         ("upvc_windows", "UPVC & aluminium windows", "U")]
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
