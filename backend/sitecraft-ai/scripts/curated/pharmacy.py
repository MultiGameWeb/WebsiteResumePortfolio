# Hand-written (curated) question bank for pharmacies / medical stores.
# Run: python3 scripts/curated/pharmacy.py  -> writes botcraft-banks/pharmacy.json
# Priorities: M = mandatory, I = important, O = optional.
# A * in the tags marks a city-only question, asked only to shops in a district
# headquarters or city (local shops rarely know these).
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, offers, photos, Wi-Fi)
# are asked separately, so they are not repeated here. The customer bot never
# gives medical advice for a pharmacy (see botcraft-salesbot.js).
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Prescriptions & medicines", "I", "yes_no", "If a customer sends a doctor's prescription photo (on WhatsApp or from the bot), do you check which medicines are available and tell the total bill?", "Can I send my prescription photo?", YN, "P"),
 ("Prescriptions & medicines", "I", "options", "Do you give the exact brand on the prescription or a substitute with the same formula?", "Will I get the same company medicine?", ["Exact brand only", "Substitute only with the customer's OK", "Both"], "P"),
 ("Prescriptions & medicines", "I", "text", "If a medicine is not in stock, how soon can you get it (same evening, next day)?", "Can you get this medicine by tomorrow?", [], "P"),
 ("Prescriptions & medicines", "I", "yes_no", "Do you cut strips and give only the tablets needed (for example for 3 or 5 days)?", "Can I take only 10 tablets?", YN, "P"),
 ("Prescriptions & medicines", "I", "yes_no", "Are all your medicines genuine, bought from authorised distributors?", "Are these original medicines?", YN, "P"),
 ("Prescriptions & medicines", "I", "yes_no", "Do you sell generic medicines (lower price) along with branded ones?", "Do you have generic medicines?", YN, "P"),
 ("Prescriptions & medicines", "I", "yes_no", "For prescription-only medicines (antibiotics, sleeping pills — Schedule H / H1), do you require a valid doctor's prescription?", "Can I buy antibiotics without a prescription?", YN, "P"),
 ("Prescriptions & medicines", "I", "yes_no", "Do you keep insulin, vaccines and other cold medicines in a fridge all day, with power backup?", "Is the insulin kept cold?", YN, "P"),
 ("Prescriptions & medicines", "I", "yes_no", "Is a registered pharmacist always at the shop to answer questions about medicines?", "Is there a pharmacist?", YN, "P"),
 ("Prescriptions & medicines", "O", "yes_no", "Do you sell common over-the-counter items (for cold, headache, acidity) without a prescription?", "Do you have something for a cold?", YN, "P"),
 ("Prescriptions & medicines", "O", "yes_no", "Do you make sure medicines have a long expiry left (for example more than 6 months)?", "How long until this expires?", YN, "P"),
 ("Prescriptions & medicines", "O", "yes_no", "Do you mark on the cover when to take each medicine (morning / afternoon / night, before / after food), in Telugu for elders?", "Can you write when to take it?", YN, "P"),
 ("Prescriptions & medicines", "O", "yes_no", "Does your pharmacist explain how to use medicines (mixing dry syrups, how long eye / ear drops last after opening)?", "How do I mix this syrup?", YN, "P"),
 ("Prescriptions & medicines", "O", "yes_no", "Do you always keep tetanus (TT) injections and anti-rabies vaccine in stock?", "Do you have rabies vaccine?", YN, "P"),
 ("Prescriptions & medicines", "O", "yes_no", "Do you keep sugar-free syrups for diabetics?", "Do you have sugar-free cough syrup?", YN, "P"),
 ("Prescriptions & medicines", "O", "yes_no", "Do you pack insulin or cold injections with ice gel packs for travel?", "Can you pack insulin for travel?", YN, "P"),

 ("Prices & bills", "I", "text", "What discount do you give on MRP — on medicines (for example 10–20%), and on other items (ayurvedic, protein powders, baby food, soaps)?", "How much discount do you give?", [], "P"),
 ("Prices & bills", "I", "yes_no", "Do you give an itemised computer bill with patient and doctor name, batch number, expiry and GST (for insurance or office claims)?", "Can I get a bill for insurance?", YN, "P"),
 ("Prices & bills", "O", "text", "Do you give extra discount on monthly medicines (BP, sugar, thyroid, heart) bought for the whole month?", "Any discount for monthly medicines?", [], "P"),
 ("Prices & bills", "O", "text", "Online pharmacies sometimes give bigger discounts. Do you match them for regular monthly customers?", "1mg gives 25% off, can you match it?", [], "P"),
 ("Prices & bills", "O", "text", "Do you take back unopened full strips with the bill if the doctor changes the medicine? Within how many days?", "Doctor changed my tablet, can I return this?", [], "P"),
 ("Prices & bills", "O", "text", "Which medicines can't be returned (for example fridge items, syrups, cut strips)?", "Can I return this syrup?", [], "P"),
 ("Prices & bills", "O", "yes_no", "If a customer loses a bill, can you print a duplicate using their phone number?", "I lost my bill, can you print it again?", YN, "P"),
 ("Prices & bills", "O", "yes_no", "Do you remind regular customers before their monthly medicines run out and keep them packed?", "Can you remind me every month?", YN, "P"),
 ("Prices & bills", "O", "options", "If you have no change, what do you do?", "Will you give Vicks instead of change?", ["Take the exact amount by UPI", "Give small items", "Round off"], "P"),
 ("Prices & bills", "O", "text", "Do you have membership points or cashback for regular customers?", "Do I get points?", [], "P"),

 ("Delivery & timings", "I", "text", "For home delivery: minimum bill, distance and how quickly you deliver (for example within 1 hour)?", "How fast can you deliver medicines?", [], "P"),
 ("Delivery & timings", "I", "options", "Do you have night or emergency service?", "Are you open at midnight?", ["Open 24 hours", "Open till late night", "Emergency number at night", "No night service"], "P"),
 ("Delivery & timings", "O", "yes_no", "Can elders pay on delivery (cash or UPI QR)?", "Can my father pay when it comes?", YN, "P"),
 ("Delivery & timings", "O", "text", "If a wrong or damaged medicine is delivered, how quickly do you replace it?", "You sent the wrong tablet, what now?", [], "P"),
 ("Delivery & timings", "O", "yes_no", "Can customers pay online and get medicines delivered to their parents in another town?", "Can you deliver to my parents in Guntur?", YN, "P"),

 ("Devices & surgical", "M", "list", "Which health devices and surgical items do you sell?", "Do you have a BP machine?", ["BP monitors & glucometers", "Glucometer strips & lancets", "Nebulizers & vaporizers", "Thermometers & pulse oximeters", "Knee caps, belts, collars & crepe bandages", "Walkers, sticks, commode chairs & wheelchairs", "Adult diapers, underpads & urine bags", "Air / water beds", "Hot water bags & heating pads", "Dressing items (cotton, gauze, Betadine, gloves)", "Abdominal belts & compression stockings"], "P"),
 ("Devices & surgical", "O", "list", "Which checks can customers get at your shop?", "Can I check my BP here?", ["BP check", "Sugar (GRBS) test", "Weight", "None"], "P"),
 ("Devices & surgical", "O", "text", "Which brands of BP machines and glucometers do you sell (for example Omron, Accu-Chek, OneTouch), and with what warranty?", "Is there a warranty on the BP machine?", [], "P"),
 ("Devices & surgical", "O", "yes_no", "Do you keep glucometer strips, lancets and insulin pen needles (4 / 6 mm) for all common brands?", "Do you have insulin pen needles?", YN, "P"),
 ("Devices & surgical", "O", "yes_no", "Do you show customers how to use a BP machine or nebulizer at the shop?", "Can you show me how to use it?", YN, "P"),
 ("Devices & surgical", "O", "yes_no", "Do you give bulk rates on adult diapers and underpads?", "Any rate for a full pack of adult diapers?", YN, "P"),
 ("Devices & surgical", "O", "yes_no", "Do you keep supports and stockings in all sizes?", "Do you have an XL knee cap?", YN, "P"),

 ("Baby, nutrition & care", "I", "list", "What else do you sell?", "Do you have baby milk powder?", ["Baby milk powders (all stages)", "Diapers, wipes, feeding bottles, breast pumps & baby care", "Protein & nutrition (Ensure, Protinex)", "Women's care (pregnancy kits, pads, supplements)", "Skin care (medicated sunscreen, acne creams)", "Dental care (sensitive toothpaste, mouthwash)", "Ayurvedic (Himalaya, Dabur, Baidyanath, Zandu)", "ORS, glucose & probiotics", "Fitness & supplements (multivitamins, omega-3)", "Pet medicines (tick soap, deworming)", "Contact lens solutions & eyeglass cleaners", "First-aid kits", "Travel & daily care (balms, inhalers, small sanitizers)"], "P"),
 ("Baby, nutrition & care", "O", "yes_no", "Do you keep fresh stock of baby milk powders in all stages?", "Do you have Lactogen stage 2?", YN, "P"),
 ("Baby, nutrition & care", "O", "text", "Do you give discounts on diapers, wipes and baby care items?", "Any discount on diapers?", [], "P"),

 ("Shop & service", "O", "yes_no", "Is there a clinic, nurse, doctor or blood-test collection centre at or near your shop (for injections, drips or tests prescribed by a doctor)?", "Can I get a blood test here?", YN, "P"),
 ("Shop & service", "O", "yes_no", "Do you pack sanitary pads, condoms, pregnancy kits and other personal items discreetly (paper or dark cover)?", "Can you pack this in a paper cover?", YN, "P"),
 ("Shop & service", "O", "yes_no", "Can you arrange medical equipment on rent (oxygen cylinder or concentrator, hospital bed, wheelchair, walker, commode chair, air bed)?", "Can I rent an oxygen concentrator?", YN, "P"),
 ("Shop & service", "O", "yes_no", "Do you do gun-shot ear piercing?", "Do you pierce ears?", YN, "P"),
 ("Shop & service", "O", "yes_no", "Do you help customers dispose of expired medicines safely (advice or a drop box)?", "Where do I throw old medicines?", YN, "P"),
 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "P"),
 ("Shop & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "P"),
]

PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
key, name = "pharmacy", "Pharmacy / medical store"
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
