# Hand-written (curated) question bank for furniture shops (home & office
# furniture and mattresses).
# Run: python3 scripts/curated/furniture.py  -> writes botcraft-banks/furniture.json
# Priorities: M = mandatory, I = important, O = optional.
# A * in the tags marks a city-only question, asked only to shops in a district
# headquarters or city (local shops rarely know these).
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, EMI with its options and
# zero down payment, offers, photos, Wi-Fi) are asked separately, so they are
# not repeated here.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Products & materials", "M", "list", "Which furniture do you sell?", "Do you have dining tables?", ["Cots & beds", "Sofas", "Dining tables", "Wardrobes / almirahs (beeruva)", "Mattresses", "Office chairs, tables & reception counters", "TV units", "Dressing tables", "Kids' furniture (bunk beds, study tables)", "Outdoor & plastic furniture", "Swings (jhula)", "Steel furniture", "Recliners", "Centre tables / teapoy", "Shoe racks / cabinets", "Pooja mandirs", "Crockery units & bookshelves", "Diwan cots & bolsters", "Bar stools", "Baby cradles (thottela)", "Folding tape cots & easy / rocking chairs", "Rugs, sofa covers & cushions", "Home decor"], "F"),
 ("Products & materials", "M", "list", "Which materials do you use?", "Is this pure teak?", ["Teak wood", "Sheesham / rosewood", "Other solid wood", "Plywood", "MDF / particle board", "Steel / metal", "Cane / rattan", "Plastic"], "F"),
 ("Products & materials", "I", "yes_no", "Do you make custom furniture to the customer's room size and design?", "Can you make a cot to my room size?", YN, "F"),
 ("Products & materials", "I", "text", "What price ranges do you have for cots, sofas, dining sets and wardrobes?", "How much is a 3+2 sofa?", [], "F"),
 ("Products & materials", "I", "yes_no", "Can customers choose the sofa fabric, colour, leatherette or velvet?", "Can I choose the sofa colour?", YN, "F"),
 ("Products & materials", "I", "text", "Which foam / mattress brands do you sell, what density, and how many years of warranty against sagging?", "Will the sofa foam sink?", [], "F"),
 ("Products & materials", "I", "yes_no", "Is your wood seasoned and treated against termites and borers? Any warranty?", "Will termites come?", YN, "F"),
 ("Products & materials", "O", "text", "Which orthopaedic or memory-foam mattress brands do you have for back pain?", "Which mattress is good for back pain?", [], "F"),
 ("Products & materials", "O", "yes_no", "Do your cots have storage (hydraulic lift or box)? Is there a warranty on the hydraulic pumps?", "Does this cot have storage?", YN, "F"),
 ("Products & materials", "O", "yes_no", "Do you have ergonomic office chairs and computer tables (cable holes, lockable drawers) for long sitting / work from home? From what price?", "Do you have a chair for back support?", YN, "F"),
 ("Products & materials", "O", "text", "Which brands of locks, hinges and drawer channels do you use in wardrobes, and do you service them?", "Are the hinges good quality?", [], "F"),
 ("Products & materials", "O", "text", "Which dining-table tops do you offer (marble, onyx, toughened glass, wood), and which lasts longest?", "Is a glass top strong?", [], "F"),
 ("Products & materials", "O", "yes_no", "Do you have space-saving furniture (sofa-cum-bed, folding cots and study tables, folding dining table, bunk beds)? From what price?", "Do you have a sofa-cum-bed?", YN, "F"),
 ("Products & materials", "O", "text", "What wood is used inside sofa frames (neem, pine, teak)? Can you show frame photos?", "What is inside this sofa?", [], "F"),
 ("Products & materials", "O", "options", "What is under your sofa seats?", "Does this sofa have springs?", ["Pocket / zig-zag springs", "Webbing belts", "Both, by model"], "F"),
 ("Products & materials", "O", "text", "What is the bed base made of (for example 18 mm plywood or thin MDF)? Is it strong if children jump on it?", "Will the cot break if kids jump?", [], "F"),
 ("Products & materials", "O", "yes_no", "Do you have easy-clean or water-resistant sofa fabric, and removable zip covers that can be washed?", "Can I wash the sofa covers?", YN, "F"),
 ("Products & materials", "O", "yes_no", "Can L-shape sofas be set for a left or right corner (interchangeable lounger)?", "Can the L-shape go on the left?", YN, "F"),
 ("Products & materials", "O", "yes_no", "Are your dining chairs sturdy (strong joints for heavy people), and can the cushions be replaced?", "Will the chairs wobble?", YN, "F"),
 ("Products & materials", "O", "text", "Which wardrobes do you have: steel almirahs (Godrej, Triveni), wooden sliding wardrobes, with internal locker and full-length mirror?", "Do you have an almirah with a locker?", [], "F"),
 ("Products & materials", "O", "yes_no", "Are your beds and wardrobes knock-down (bolt fitting), easy to open and refit when shifting house?", "Can I take this apart when I shift?", YN, "F"),
 ("Products & materials", "O", "text", "Which polish do you use on wooden furniture (PU, melamine, matte or glossy), and does it resist water marks?", "Will water leave white marks?", [], "F"),
 ("Products & materials", "O", "options", "Do you make the furniture yourselves or buy it?", "Is this made in your own factory?", ["Our own factory / workshop", "Bought from manufacturers", "Both"], "F"),
 ("Products & materials", "O", "yes_no", "Do you have dressing tables with LED mirror lights and a cushion stool?", "Do you have a dressing table with lights?", YN, "F*"),
 ("Products & materials", "O", "yes_no", "Can sofas be made with high legs (5–6 inch gap) so a mop or robot vacuum can clean under them?", "Can a robot vacuum go under this sofa?", YN, "F"),
 ("Products & materials", "O", "yes_no", "Do you fit cots with strong bolts and rubber pads so they don't creak?", "Will the cot make noise?", YN, "F"),
 ("Products & materials", "O", "yes_no", "Can you make a custom cushioned (tufted) headboard for cots?", "Can I get a soft headboard?", YN, "F"),
 ("Products & materials", "O", "yes_no", "Do you have dining sets with chairs and a bench (for example 4 chairs + 1 bench)?", "Do you have a dining set with a bench?", YN, "F"),
 ("Products & materials", "O", "yes_no", "Can steel almirahs be painted in a colour of the customer's choice or with a printed door?", "Can I get the almirah in blue?", YN, "F"),
 ("Products & materials", "O", "yes_no", "Do you do interior woodwork at the customer's home (bedroom cupboards, modular kitchen) after taking measurements?", "Can you do our modular kitchen?", YN, "F"),
 ("Products & materials", "O", "yes_no", "Do you sell bean bags and bean refills?", "Do you have bean bag refills?", YN, "F"),
 ("Products & materials", "O", "yes_no", "Do you sell cloth drying stands and ironing boards?", "Do you have an ironing board?", YN, "F"),
 ("Products & materials", "O", "yes_no", "Do you sell branded furniture (for example Godrej, Nilkamal, Durian) along with local-made?", "Do you have Godrej almirahs?", YN, "F"),

 ("Delivery & fitting", "I", "text", "How many days does delivery take for ready stock and for made-to-order furniture?", "When will it be delivered?", [], "F"),
 ("Delivery & fitting", "I", "yes_no", "Is fitting / installation by your carpenter free (including wall-mounting TV units)?", "Will you fix the cot at home?", YN, "F"),
 ("Delivery & fitting", "O", "yes_no", "Can customers book now and get delivery on a later date (for example gruhapravesam muhurtham), with the furniture kept safely in your godown?", "Can you deliver on our gruhapravesam day?", YN, "F"),
 ("Delivery & fitting", "O", "yes_no", "Can you deliver on Sundays or after 7 pm for working customers?", "Can you deliver on Sunday?", YN, "F"),
 ("Delivery & fitting", "O", "yes_no", "Do you deliver to other towns and villages (outstation)?", "Can you send it to our village?", YN, "F"),
 ("Delivery & fitting", "O", "yes_no", "When customers shift house, do you send a carpenter to dismantle and refit furniture (paid)?", "Can you refit my cot in the new house?", YN, "F"),
 ("Delivery & fitting", "O", "options", "Who pays for carrying furniture upstairs when there is no lift?", "Is there a charge for the 3rd floor?", ["We pay", "Customer pays loading charges", "Free up to some floors"], "F"),
 ("Delivery & fitting", "O", "text", "If furniture is scratched or damaged in delivery, do you replace it or repair / polish it free?", "There is a scratch, what will you do?", [], "F"),

 ("Prices & offers", "I", "yes_no", "Do you take old furniture in exchange for new?", "Will you take my old sofa?", YN, "F"),
 ("Prices & offers", "I", "text", "How much advance do you take for custom orders, and can the balance be paid on delivery?", "How much advance should I pay?", [], "F"),
 ("Prices & offers", "O", "text", "Do you buy back furniture bought from you after 1–2 years (for bachelors or transferred employees)? At what value?", "Will you buy it back when I move?", [], "F"),
 ("Prices & offers", "O", "yes_no", "Do you give mattress, pillows and a waterproof protector as a combo with king (6x6) or queen (5x6) cots?", "Any mattress offer with the cot?", YN, "F"),
 ("Prices & offers", "O", "yes_no", "Can you give a GST invoice with the customer's company name and GSTIN (for example for a work-from-home claim)?", "Can you put my company's GST on the bill?", YN, "F"),
 ("Prices & offers", "O", "text", "Do you have wedding combo packages (cot, mattress, almirah, dressing table, sofa) at a special price?", "Any marriage furniture package?", [], "F"),
 ("Prices & offers", "O", "text", "Do you supply in bulk to offices, schools and hostels with wholesale prices and GST invoices?", "Can you supply 50 chairs for our school?", [], "F"),
 ("Prices & offers", "O", "options", "Is GST included in your prices or added on the bill?", "Is GST extra?", ["Included", "Added on the bill"], "F"),

 ("Warranty & service", "I", "text", "What warranty do you give on furniture (frame, wood, foam, fittings)?", "Is there a warranty?", [], "F"),
 ("Warranty & service", "O", "yes_no", "Do you repair office chairs (gas lift, wheels, base) and fit spare parts?", "My chair's wheel broke, can you fix it?", YN, "F"),
 ("Warranty & service", "O", "yes_no", "Do you make custom-size mattresses for old cots?", "Can you make a mattress for my old cot size?", YN, "F"),
 ("Warranty & service", "O", "text", "If a mattress feels too hard or soft at home, can it be exchanged within some days (cover not torn)?", "Can I change the mattress if it's too hard?", [], "F"),
 ("Warranty & service", "O", "yes_no", "Do you do paid re-polishing, sofa re-upholstery or cushion changes later?", "Can you redo my old sofa?", YN, "F"),

 ("Shop & service", "O", "yes_no", "Can customers see and sit on the furniture in your showroom?", "Can I try the sofa in the shop?", YN, "F"),
 ("Shop & service", "O", "yes_no", "Can you send photos or a video call to show designs before buying?", "Can you send me sofa photos?", YN, "F"),
 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "F"),
 ("Shop & service", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Do you have Instagram?", [], "F"),
]

PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
key, name = "furniture", "Furniture shop"
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
