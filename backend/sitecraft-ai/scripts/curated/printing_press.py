# Hand-written (curated) question banks for flex & large-format printers,
# printing presses (cards, stationery, commercial printing, ID cards, stamps),
# and shops that do both.
# Run: python3 scripts/curated/printing_press.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: F = flex & large format, P = printing press. The combined shop gets
# every question tagged F or P.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, home delivery, offers, photos) are asked separately. Payment
# methods are not asked.
# The assistant never offers fake documents, currency, brand copies or
# unauthorised seals (see botcraft-salesbot.js).
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Services", "M", "list", "Which flex and large-format work do you do?", "Do you print sunboards?", ["Flex banners", "Hoardings", "Sunboards", "Vinyl stickers & one-way vision (glass)", "Backlit flex (glow sign boards)", "Canvas & photo enlargements", "Standees & roll-up banners", "Vehicle stickers & wraps", "Wall wallpapers & murals", "Name boards (ACP, acrylic, LED letters)"], "F"),
 ("Services", "M", "list", "Which printing work do you do?", "Do you print wedding cards?", ["Wedding & invitation cards", "Visiting cards", "Letterheads & envelopes", "Bill books & receipt books", "Brochures, pamphlets & catalogues", "Books, magazines & reports", "ID cards & lanyards", "Rubber stamps & seals", "Stickers, labels & tags", "Calendars & diaries", "Certificates & award sheets (for institutions)", "Packaging boxes & covers"], "P"),
 ("Services", "I", "list", "Which design work do you do?", "Can you design a logo?", ["Logo design", "Visiting card design", "Invitation design", "Flex & poster design", "Brochure & catalogue design", "Social media posts", "No design (print-ready files only)"], "FP"),

 ("Design & proof", "I", "text", "What do you charge for design, how many changes are free, and is the design fee waived if we also print?", "How much for designing the card?", [], "FP"),
 ("Design & proof", "I", "yes_no", "Do you send a proof (on WhatsApp) for approval before printing, and print only after the customer approves it?", "Will you show me the design before printing?", YN, "FP"),
 ("Design & proof", "I", "text", "If a spelling or detail mistake is found after printing, who pays for the reprint (shop's mistake vs approved proof)?", "There is a spelling mistake in the cards, will you reprint?", [], "FP"),
 ("Design & proof", "O", "list", "Which files can customers send?", "Can I send a Canva design?", ["PDF", "CDR (CorelDRAW)", "AI / PSD", "Canva link", "High-resolution JPG / PNG", "Word files", "Only a photo or rough sketch (we design it)"], "FP"),
 ("Design & proof", "O", "yes_no", "Do you tell customers that colours on mobile screens can look different in print, and show printed samples or colour proofs?", "Will the colour be the same as on my phone?", YN, "FP"),
 ("Design & proof", "O", "yes_no", "Do you type Telugu, Hindi and other languages correctly in designs?", "Can you print the card in Telugu?", YN, "FP"),
 ("Design & proof", "O", "yes_no", "Do you keep customers' designs so repeat orders are quick, and give the final design file if asked?", "Can I get the design file?", YN, "FP"),

 ("Flex & boards", "I", "text", "What is your rate per sq ft for each material (normal flex, star flex, vinyl, sunboard, backlit), and what is the maximum width?", "How much per sq ft for flex?", [], "F"),
 ("Flex & boards", "O", "text", "How long does outdoor flex and vinyl last in sun and rain, and do you use eco-solvent / UV inks?", "Will the banner fade in sun?", [], "F"),
 ("Flex & boards", "O", "text", "Do you give frames, eyelets, rope and fixing, and do you install boards and hoardings at site? What is the charge?", "Can you fix the board on our shop?", [], "F"),
 ("Flex & boards", "O", "yes_no", "Do you take away and dispose of old flex when you put up new ones?", "Will you remove the old banner?", YN, "F"),
 ("Flex & boards", "O", "text", "For hoardings and road-side banners, do you tell customers that municipal or police permission is needed, and help with it?", "Do I need permission for a road banner?", [], "F"),

 ("Cards & stationery", "I", "text", "Wedding cards: can customers see physical samples, what is the minimum quantity, the price range per card, and are envelopes, inserts and return gift tags printed to match?", "What is the minimum for wedding cards?", [], "P"),
 ("Cards & stationery", "O", "text", "Visiting cards: which paper thickness (GSM) and finishes (matte, gloss lamination, spot UV, rounded corners) do you offer, and the price per 100 / 1,000?", "How much for 500 visiting cards?", [], "P"),
 ("Cards & stationery", "O", "text", "Bill books: do you print serial numbers, duplicate / triplicate copies (carbonless), and the GST bill format, and what is the minimum order?", "Can you print a GST bill book with numbering?", [], "P"),
 ("Cards & stationery", "O", "text", "Brochures and catalogues: offset or digital printing, paper (GSM), folding and binding options, and how the price drops with quantity?", "How much for 1,000 brochures?", [], "P"),

 ("ID cards & stamps", "O", "text", "ID cards: PVC or laminated, can you print in bulk from an Excel sheet with photos, and do you supply lanyards, holders and clips?", "Can you make 500 school ID cards from Excel?", [], "P"),
 ("ID cards & stamps", "O", "text", "Rubber stamps: which types (normal, self-inking, pre-inked, seals, date stamps), how soon are they ready, and what does each cost?", "How soon can I get a self-ink stamp?", [], "P"),
 ("ID cards & stamps", "I", "yes_no", "For office, company or institution seals and ID cards, do you ask for an authorisation letter or proof before making them?", "Can you make a stamp for our company?", YN, "P"),

 ("Orders & delivery", "I", "text", "How many days does each job usually take, and do you do urgent same-day or overnight printing? Extra charge?", "Can you print the banner by tonight?", [], "FP"),
 ("Orders & delivery", "I", "text", "How much advance do you take, and is the balance paid on delivery?", "How much advance for the wedding cards?", [], "FP"),
 ("Orders & delivery", "O", "text", "Do you give discounts for bulk or repeat orders (schools, businesses, political parties, events)?", "Any discount for 50 banners?", [], "FP"),
 ("Orders & delivery", "O", "text", "If printing is faulty (wrong colour, cut, smudges), what do you do?", "The colours came out dull, what now?", [], "FP"),
 ("Orders & delivery", "O", "yes_no", "Do you give a GST bill?", "Can I get a GST bill?", YN, "FP"),

 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "FP"),
 ("Shop & service", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Where can I see your work?", [], "FP"),
]

TYPES = [("flex_printing", "Flex & large-format printing", "F"),
         ("printing_press", "Printing press (cards, stationery & stamps)", "P"),
         ("printing_flex", "Printing press & flex", "FP")]
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
