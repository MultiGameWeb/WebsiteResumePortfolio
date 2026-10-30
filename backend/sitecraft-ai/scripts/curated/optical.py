# Hand-written (curated) question bank for optical shops.
# Run: python3 scripts/curated/optical.py  -> writes botcraft-banks/optical.json
# Priorities: M = mandatory, I = important, O = optional.
# A * in the tags marks a city-only question, asked only to shops in a district
# headquarters or city (local shops rarely know these).
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, offers, photos, Wi-Fi)
# are asked separately, so they are not repeated here.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Eye testing", "I", "yes_no", "Do you do computerised eye testing by a qualified optometrist at the shop?", "Can I get my eyes tested here?", YN, "O"),
 ("Eye testing", "I", "text", "Is the eye test free? What do you charge if the customer doesn't buy glasses?", "How much for an eye test only?", [], "O"),
 ("Eye testing", "I", "text", "How long does it take to make glasses from a prescription (including cylindrical power), and can you deliver urgently in 1–2 hours?", "Can I get glasses today?", [], "O"),
 ("Eye testing", "I", "text", "If new glasses cause headache or blur in the first few days, do you recheck and change the lens free?", "I'm getting a headache with new glasses, what now?", [], "O"),
 ("Eye testing", "O", "yes_no", "Can you read the power from old glasses (lensometer) and make new glasses with the same power?", "I lost my prescription, can you check my old glasses?", YN, "O"),
 ("Eye testing", "O", "yes_no", "Do you write distance and reading power on a card, and save customers' power on their phone number for re-orders?", "Can you give me my power card?", YN, "O"),
 ("Eye testing", "O", "yes_no", "Do you test children's eyes?", "Can you check my son's eyes?", YN, "O"),
 ("Eye testing", "O", "yes_no", "Do you check colour vision?", "Can you test colour blindness?", YN, "O"),
 ("Eye testing", "O", "text", "What do you tell customers about how often to recheck their power (and timing for people with sugar or BP)?", "When should I check my power again?", [], "O"),

 ("Lenses", "M", "list", "Which lenses do you offer?", "Do you have blue-cut lenses?", ["Single vision", "Blue-cut (computer)", "Zero-power computer glasses", "Photochromic (day & night)", "Photochromic that darkens in cars (Transitions XTRActive)", "Photo-blue (blue-cut + photochromic)", "Bifocal (kryptok / D)", "Blended (invisible) bifocal", "Progressive (incl. wide-corridor)", "Office / computer progressive (occupational)", "Myopia-control lenses for children (Stellest, MyoVision)", "Flip-up reading glasses", "High-index thin lenses", "Polycarbonate (unbreakable)", "Night-drive anti-glare", "Anti-fog", "Hard / hydrophobic / anti-reflective coatings", "Mineral glass lenses", "Prism lenses (on order)", "Ready reading glasses (incl. pocket folding)", "Post-cataract dark glasses", "Prescription sunglasses (tinted / polarized)"], "O"),
 ("Lenses", "I", "text", "What are the starting prices for blue-cut, photochromic and progressive lenses?", "How much for blue-cut glasses?", [], "O"),
 ("Lenses", "I", "text", "Which lens brands do you sell (for example Crizal, Essilor, Zeiss, Kodak), and do they come with an authenticity / warranty card?", "Is this original Crizal?", [], "O"),
 ("Lenses", "O", "yes_no", "Do you show a blue-light torch test to prove blue-cut lenses are real?", "How do I know it's real blue-cut?", YN, "O"),
 ("Lenses", "O", "text", "How do you explain bifocal vs progressive lenses (price and use)?", "Bifocal or progressive?", [], "O"),
 ("Lenses", "O", "yes_no", "Can you replace just one lens (if only one is broken or scratched)?", "Can you change only one glass?", YN, "O"),
 ("Lenses", "O", "yes_no", "Can you replace a broken sunglass lens in the same tint (green, black, gradient) without changing the frame?", "Can you change one Ray-Ban glass?", YN, "O"),
 ("Lenses", "O", "yes_no", "Can you dye power lenses with a fashion or gradient tint (brown, grey, pink, blue)?", "Can I get tinted power glasses?", YN, "O"),
 ("Lenses", "O", "yes_no", "Do you have clear blue-cut lenses without a yellow tint?", "Will white look yellow with blue-cut?", YN, "O"),
 ("Lenses", "O", "text", "For photochromic lenses, do you suggest grey or brown tint?", "Grey or brown day-night lens?", [], "O"),
 ("Lenses", "O", "yes_no", "Do you measure PD and fitting height carefully for progressive and high-power lenses?", "Will you measure my eyes for progressive?", YN, "O"),
 ("Lenses", "O", "yes_no", "For rimless frames, do you use polycarbonate lenses so they don't crack at the holes?", "Will rimless glasses break?", YN, "O"),

 ("Frames", "M", "list", "Which frames do you have?", "Do you have light frames?", ["Ultra-light (titanium / TR-90)", "Flexible memory metal", "Full-rim", "Half-rim", "Rimless", "Kids' unbreakable silicone", "Trendy (transparent, round, cat-eye, aviator)", "Stainless steel / titanium / gold-plated (no allergy)", "Large sizes for broad faces (54–56 mm)", "Helmet-friendly flat temples", "Bluetooth audio smart glasses", "Sports prescription goggles", "Magnetic clip-on sunglass frames", "Spring-hinge frames", "Branded (Ray-Ban, Titan, Fastrack, Vogue, Vincent Chase)"], "O"),
 ("Frames", "O", "yes_no", "Can you put new lenses in a customer's old frame, or fit old lenses into a new frame?", "Can you change only the lenses?", YN, "O"),
 ("Frames", "O", "yes_no", "Do your staff help customers choose frames for their face shape?", "Which frame suits my face?", YN, "O"),
 ("Frames", "O", "text", "Which frame type do you suggest for rough daily use (full-rim, half-rim, rimless), and which shape / size for high minus power so the lens edges don't look thick?", "Which frame is strongest?", [], "O"),

 ("Sunglasses & contact lenses", "I", "list", "Which sunglasses and contact lenses do you sell?", "Do you have contact lenses?", ["UV / polarized sunglasses", "Power sunglasses", "Monthly / daily contact lenses", "Colour contact lenses (with / without power)", "Toric lenses (on order)", "Lens solutions & cases", "Zero-power riding / safety glasses"], "O"),
 ("Sunglasses & contact lenses", "O", "yes_no", "Do you teach first-time contact lens users how to wear and remove them (trial)?", "Can you teach me to wear lenses?", YN, "O"),
 ("Sunglasses & contact lenses", "O", "yes_no", "Do you convert spectacle power to the right contact lens power (for high powers)?", "Is my lens power the same as my glasses?", YN, "O"),
 ("Sunglasses & contact lenses", "O", "yes_no", "Do you sell a single pair of daily disposable lenses for one occasion?", "Can I buy lenses for just one day?", YN, "O"),
 ("Sunglasses & contact lenses", "O", "text", "How long do unopened contact lens packs last before expiry?", "When do these lenses expire?", [], "O"),

 ("Repairs & offers", "I", "text", "Do you have frame + lens combos (for example ₹799 / ₹999) or family discounts?", "Any combo offer?", [], "O"),
 ("Repairs & offers", "I", "text", "Do you repair glasses (screws, bent frames, nose pads, temple tips, half-rim nylon thread, loose rimless bushes, soldering broken metal frames)? Free or charged?", "Can you fix my glasses screw?", [], "O"),
 ("Repairs & offers", "O", "text", "Do you give an exchange discount on old glasses or frames?", "Any discount for my old glasses?", [], "O"),
 ("Repairs & offers", "O", "yes_no", "Do you clean glasses in an ultrasonic cleaner and remove stains (for example hair dye on the temples)?", "Can you clean the dye off my frame?", YN, "O"),
 ("Repairs & offers", "O", "text", "What warranty do branded frames have (colour fading, broken spring hinge)?", "Is there a warranty on the frame?", [], "O"),
 ("Repairs & offers", "O", "yes_no", "Does your optometrist visit homes for elders who can't come (eye test at home)?", "Can you test my grandmother at home?", YN, "O"),
 ("Repairs & offers", "O", "yes_no", "Do you give a hard case, cleaning cloth and lens spray free with new glasses?", "Will I get a box?", YN, "O"),
 ("Repairs & offers", "O", "list", "Which accessories do you sell?", "Do you have a spectacle chain?", ["Spectacle chains / cords", "Ear hooks for kids", "Anti-slip nose pads & ear locks", "Swimming goggles (normal & power)", "Cleaning kits", "Eye patches / occluders for kids", "LED magnifying glasses", "Double spectacle cases & car visor clips", "Lubricating eye drops"], "O"),
 ("Repairs & offers", "O", "yes_no", "Do you give a computer bill with the prescription for office medical reimbursement?", "Can I get a bill for reimbursement?", YN, "O"),
 ("Repairs & offers", "O", "text", "How much advance do you take for an order, with the balance paid at delivery?", "How much advance?", [], "O"),
 ("Repairs & offers", "I", "yes_no", "Do you send trending frame models and offers on WhatsApp?", "Can you send frame photos?", YN, "O"),
 ("Repairs & offers", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "O"),
 ("Repairs & offers", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Do you have Instagram?", [], "O"),
]

PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
key, name = "optical", "Optical shop"
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
