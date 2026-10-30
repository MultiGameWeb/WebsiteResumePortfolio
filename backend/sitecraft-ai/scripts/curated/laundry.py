# Hand-written (curated) question banks for laundry & dry cleaning shops and
# ironing (istri / press) shops.
# Run: python3 scripts/curated/laundry.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: L = laundry & dry cleaning, I = ironing shop.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, home delivery, offers, photos) are asked separately. Payment
# methods are not asked.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Services", "M", "list", "Which services do you offer?", "Do you do dry cleaning?", ["Wash & fold", "Wash & iron", "Dry cleaning", "Steam ironing", "Ironing only", "Saree polishing & rolling", "Starch", "Stain removal", "Blankets, quilts & bed sheets", "Curtains, carpets & sofa covers", "Shoe cleaning", "Leather & suede jackets", "Bridal & designer wear", "Small repairs (buttons, stitches)"], "L"),
 ("Services", "M", "list", "Which ironing do you do?", "Do you iron sarees?", ["Shirts & pants", "Sarees", "Dresses & kurtis", "Bed sheets", "Starch & ironing", "Steam ironing", "Charcoal (coal) ironing", "Electric ironing"], "I"),
 ("Rates & time", "I", "text", "What are your rates (per piece or per kg) for each service, for example shirt, saree, pattu saree, blanket, suit?", "How much to dry clean a pattu saree?", [], "L"),
 ("Rates & time", "I", "text", "What is your ironing rate per piece (shirt, pant, saree, bed sheet)?", "How much per shirt for ironing?", [], "I"),
 ("Rates & time", "I", "text", "How long does each service usually take, and do you do same-day / express work? Extra charge?", "Can I get it back by tomorrow?", [], "LI"),
 ("Rates & time", "O", "text", "Do you have monthly packages for families, or bulk rates for hostels, PGs, hotels and hospitals?", "Is there a monthly package?", [], "LI"),

 ("Pickup & receipts", "I", "text", "Do you pick up clothes from homes and apartments? Minimum order and charge?", "Can you pick up from my flat?", [], "LI"),
 ("Pickup & receipts", "I", "yes_no", "Do you count and tag each piece and give a receipt or list (on paper or WhatsApp)?", "Will you give a list of my clothes?", YN, "LI"),
 ("Pickup & receipts", "O", "text", "How long do you keep clothes that are not collected?", "I forgot to collect my clothes for a month, are they safe?", [], "LI"),

 ("Care & quality", "I", "text", "If a piece is lost or damaged (shrinks, colour runs, burns, tears), how much do you pay or how do you settle it, and within how many days must customers tell you?", "You lost my shirt, what will you do?", [], "LI"),
 ("Care & quality", "O", "yes_no", "Do you check clothes when you take them and tell customers about stains, tears or loose buttons first?", "Will you check for stains before washing?", YN, "L"),
 ("Care & quality", "O", "text", "Which stains usually cannot be removed (old turmeric, ink, oil, rust), and do you tell customers before trying?", "Can you remove turmeric stains?", [], "L"),
 ("Care & quality", "O", "text", "How do you care for silk / pattu sarees and zari (dry clean or gentle wash, rolling, no direct heat on zari)?", "Will the zari get damaged?", [], "LI"),
 ("Care & quality", "O", "yes_no", "Do you wash each customer's clothes separately, and keep whites, colours and dark clothes apart so colours don't run?", "Are my clothes washed with others' clothes?", YN, "L"),
 ("Care & quality", "O", "text", "Which detergents do you use, and can customers ask for mild, baby-safe or fragrance-free washing?", "Can you use mild detergent for baby clothes?", [], "L"),
 ("Care & quality", "O", "text", "Which items do you not accept (very old or torn clothes, some leather, items with valuables)?", "Do you clean leather bags?", [], "L"),
 ("Care & quality", "O", "yes_no", "Do you check pockets and return any money, cards or jewellery found?", "I left money in my pant pocket, will I get it back?", YN, "LI"),

 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "LI"),
 ("Shop & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "LI"),
]

TYPES = [("laundry", "Laundry & dry cleaning", "L"),
         ("ironing_shop", "Ironing (istri / press) shop", "I")]
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
