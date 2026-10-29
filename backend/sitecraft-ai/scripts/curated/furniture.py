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
 ("Products & materials", "M", "list", "Which furniture do you sell?", "Do you have dining tables?", ["Cots & beds", "Sofas", "Dining tables", "Wardrobes / almirahs (beeruva)", "Mattresses", "Office chairs & tables", "TV units", "Dressing tables", "Kids' furniture", "Outdoor & plastic furniture", "Steel furniture", "Home decor"], "F"),
 ("Products & materials", "M", "list", "Which materials do you use?", "Is this pure teak?", ["Teak wood", "Sheesham / rosewood", "Other solid wood", "Plywood", "MDF / particle board", "Steel / metal", "Cane / rattan", "Plastic"], "F"),
 ("Products & materials", "I", "yes_no", "Do you make custom furniture to the customer's room size and design?", "Can you make a cot to my room size?", YN, "F"),
 ("Products & materials", "I", "text", "What price ranges do you have for cots, sofas, dining sets and wardrobes?", "How much is a 3+2 sofa?", [], "F"),
 ("Products & materials", "I", "yes_no", "Can customers choose the sofa fabric, colour, leatherette or velvet?", "Can I choose the sofa colour?", YN, "F"),
 ("Products & materials", "I", "text", "Which foam / mattress brands do you sell, what density, and how many years of warranty against sagging?", "Will the sofa foam sink?", [], "F"),
 ("Products & materials", "I", "yes_no", "Is your wood seasoned and treated against termites and borers? Any warranty?", "Will termites come?", YN, "F"),
 ("Products & materials", "O", "text", "Which orthopaedic or memory-foam mattress brands do you have for back pain?", "Which mattress is good for back pain?", [], "F"),
 ("Products & materials", "O", "yes_no", "Do your cots have storage (hydraulic lift or box)? Is there a warranty on the hydraulic pumps?", "Does this cot have storage?", YN, "F"),
 ("Products & materials", "O", "yes_no", "Do you have ergonomic office chairs and computer tables for long sitting / work from home?", "Do you have a chair for back support?", YN, "F"),
 ("Products & materials", "O", "text", "Which brands of locks, hinges and drawer channels do you use in wardrobes, and do you service them?", "Are the hinges good quality?", [], "F"),
 ("Products & materials", "O", "text", "Which dining-table tops do you offer (marble, onyx, toughened glass, wood), and which lasts longest?", "Is a glass top strong?", [], "F"),
 ("Products & materials", "O", "yes_no", "Do you have space-saving furniture (sofa-cum-bed, folding dining table, bunk beds)?", "Do you have a sofa-cum-bed?", YN, "F"),
 ("Products & materials", "O", "yes_no", "Do you sell branded furniture (for example Godrej, Nilkamal, Durian) along with local-made?", "Do you have Godrej almirahs?", YN, "F"),

 ("Delivery & fitting", "I", "text", "How many days does delivery take for ready stock and for made-to-order furniture?", "When will it be delivered?", [], "F"),
 ("Delivery & fitting", "I", "yes_no", "Is fitting / installation by your carpenter free?", "Will you fix the cot at home?", YN, "F"),
 ("Delivery & fitting", "O", "options", "Who pays for carrying furniture upstairs when there is no lift?", "Is there a charge for the 3rd floor?", ["We pay", "Customer pays loading charges", "Free up to some floors"], "F"),
 ("Delivery & fitting", "O", "text", "If furniture is scratched or damaged in delivery, do you replace it or repair / polish it free?", "There is a scratch, what will you do?", [], "F"),

 ("Prices & offers", "I", "yes_no", "Do you take old furniture in exchange for new?", "Will you take my old sofa?", YN, "F"),
 ("Prices & offers", "O", "text", "Do you have wedding combo packages (cot, mattress, almirah, dressing table, sofa) at a special price?", "Any marriage furniture package?", [], "F"),
 ("Prices & offers", "O", "text", "Do you supply in bulk to offices, schools and hostels with wholesale prices and GST invoices?", "Can you supply 50 chairs for our school?", [], "F"),
 ("Prices & offers", "O", "options", "Is GST included in your prices or added on the bill?", "Is GST extra?", ["Included", "Added on the bill"], "F"),

 ("Warranty & service", "I", "text", "What warranty do you give on furniture (frame, wood, foam, fittings)?", "Is there a warranty?", [], "F"),
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
