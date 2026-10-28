# Hand-written (curated) question banks for jewellery businesses: gold &
# diamond jewellery shops, and one-gram gold / imitation jewellery shops.
# Run: python3 scripts/curated/jewellery.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: J = gold & diamond jewellery shop, F = one-gram gold / imitation jewellery shop.
# Each owner is asked only the questions tagged for their business.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, EMI, offers, photos)
# are asked separately, so they are not repeated here.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Products & purity", "M", "list", "Which jewellery do you sell?", "Do you have diamond jewellery?", ["Gold", "Diamond", "Silver", "Platinum", "Gemstones / navaratna", "Pearls", "Antique / temple", "Kundan / polki"], "J"),
 ("Products & purity", "M", "list", "Which gold purities do you sell?", "Do you have 18 carat?", ["24K coins / bars (999)", "22K (916)", "18K", "14K"], "J"),
 ("Products & purity", "M", "yes_no", "Is all your gold jewellery BIS hallmarked with a HUID number?", "Is this hallmarked?", YN, "J"),
 ("Products & purity", "M", "list", "Which jewellery do you sell?", "Do you have one gram gold?", ["One-gram gold", "Imitation / fashion", "Oxidised", "Kundan / polki (imitation)", "American diamond (AD / CZ)", "Beads & pearls", "Bangles", "Bridal sets"], "F"),
 ("Products & purity", "I", "list", "Which collections do you have?", "Do you have temple jewellery?", ["Bridal", "Daily wear", "Temple", "Antique", "Light weight", "Kids", "Men's", "Office wear"], "JF"),
 ("Products & purity", "I", "yes_no", "Do you have light-weight jewellery (for example below 5 grams)?", "Any light chain under 5 grams?", YN, "J"),
 ("Products & purity", "I", "yes_no", "Do you sell gold coins and bars?", "Do you sell gold coins?", YN, "J"),
 ("Products & purity", "I", "yes_no", "Do you sell silver articles (pooja items, plates, anklets, gifts)?", "Do you have a silver pooja set?", YN, "J"),
 ("Products & purity", "I", "text", "Do your diamonds come with a certificate? Which labs (IGI, GIA, SGL)?", "Is the diamond certified?", [], "J"),
 ("Products & purity", "O", "yes_no", "Do you give a card with the diamond's 4Cs (cut, clarity, colour, carat)?", "What is the clarity of this diamond?", YN, "J"),
 ("Products & purity", "O", "text", "Do you sell rose gold or white gold jewellery? What purity?", "Do you have white gold rings?", [], "J"),
 ("Products & purity", "I", "options", "Do you sell lab-grown diamonds, and are they clearly marked?", "Is this a natural diamond?", ["Only natural diamonds", "Both, clearly marked", "Only lab-grown"], "J"),
 ("Products & purity", "O", "yes_no", "Do you sell navaratna / astrological gemstones with a lab certificate?", "Do you have a certified emerald?", YN, "J"),
 ("Products & purity", "O", "text", "What is the usual weight and price range of your bridal sets?", "How much is a bridal necklace set?", [], "J"),
 ("Products & purity", "I", "text", "What is the price range of your jewellery?", "Necklace sets price?", [], "F"),
 ("Products & purity", "I", "yes_no", "Do you have matching sets for sarees or custom colours?", "Do you have a set to match my red saree?", YN, "F"),

 ("Rates & charges", "M", "options", "How should customers get today's gold rate?", "What is today's gold rate?", ["I'll update the rate every morning with Update", "Customers should call for the rate"], "J"),
 ("Rates & charges", "M", "options", "How do you charge making charges?", "What are the making charges?", ["Per gram", "Percentage of gold value", "Fixed per piece", "Depends on the design"], "J"),
 ("Rates & charges", "I", "text", "What is your usual making charge range (for example 8–15%)?", "Making charge for a chain?", [], "J"),
 ("Rates & charges", "I", "options", "Do you charge wastage (VA) separately, or is it included in the making charge?", "Is there wastage extra?", ["Included in making", "Charged separately", "No wastage"], "J"),
 ("Rates & charges", "I", "text", "What wastage (VA) percentage do you charge, and does it change with the design?", "How much wastage on this necklace?", [], "J"),
 ("Rates & charges", "O", "yes_no", "Are making and wastage higher for antique, nakshi and temple designs?", "Why is wastage more on temple jewellery?", YN, "J"),
 ("Rates & charges", "O", "yes_no", "Do you give a lower wastage on plain gold jewellery (without stones)?", "Any less wastage on plain bangles?", YN, "J"),
 ("Rates & charges", "O", "options", "Is your rate the local board rate or a branded / corporate rate?", "Is your rate the board rate?", ["Local board rate", "Branded / corporate rate", "Our own rate"], "J"),
 ("Rates & charges", "I", "options", "Are stones charged separately from the gold weight?", "Is the stone weight counted as gold?", ["Stone weight deducted, stones charged separately", "Stones included in the price", "Depends on the piece"], "J"),
 ("Rates & charges", "I", "yes_no", "Does your bill show gross weight, net gold weight, stone weight, purity, rate, making, wastage and GST separately?", "Will the bill show net and gross weight?", YN, "J"),
 ("Rates & charges", "I", "yes_no", "Is the HUID number of each piece printed on the bill?", "Will the HUID be on my bill?", YN, "J"),
 ("Rates & charges", "I", "options", "Is GST (3%) included in the price or added on the bill?", "Is GST extra?", ["Included", "Added on the bill"], "JF"),
 ("Rates & charges", "I", "text", "Can customers book gold at today's rate by paying an advance (rate lock)? How much advance?", "Can I lock today's rate?", [], "J"),
 ("Rates & charges", "O", "yes_no", "Do you have fixed-price items (no separate making charge)?", "Any fixed-price earrings?", YN, "J"),

 ("Old gold & buy-back", "I", "options", "Do you take old gold?", "Do you take old gold?", ["Exchange for new jewellery", "Buy for money", "Both", "No"], "J"),
 ("Old gold & buy-back", "I", "text", "How do you test old gold purity (karatmeter, acid test, melting)? Can customers watch, and is there a charge for melting?", "How will you check my old gold?", [], "J"),
 ("Old gold & buy-back", "I", "text", "How much is deducted for old gold — for exchange, and for buying it for money?", "How much will you cut for old gold?", [], "J"),
 ("Old gold & buy-back", "I", "options", "Do you accept old gold bought from other shops?", "I bought it elsewhere, will you take it?", ["Yes", "Only hallmarked gold", "Only our own jewellery"], "J"),
 ("Old gold & buy-back", "I", "text", "What value do you give when your own jewellery is returned for exchange or buy-back?", "If I return this later, how much will I get?", [], "J"),
 ("Old gold & buy-back", "O", "yes_no", "Do you exchange old silver?", "Do you take old silver?", YN, "J"),
 ("Old gold & buy-back", "O", "text", "What is your diamond buy-back or upgrade policy (percentage of value)?", "Can I upgrade my diamond ring later?", [], "J"),
 ("Old gold & buy-back", "O", "text", "When jewellery with stones is sold back to you, do you give any value for the stones?", "Will I get money for the stones too?", [], "J"),
 ("Old gold & buy-back", "O", "options", "When you buy old gold, how do you pay the customer?", "Will you pay cash for my old gold?", ["Bank transfer", "Cash (within legal limit)", "Both"], "J"),

 ("Gold saving schemes", "I", "yes_no", "Do you run a monthly gold saving scheme?", "Do you have a monthly scheme?", YN, "J"),
 ("Gold saving schemes", "I", "text", "Scheme details: how many months, minimum monthly amount, and the benefit (for example one month free or making charge discount)?", "What do I get in the scheme?", [], "J"),
 ("Gold saving schemes", "O", "text", "What happens if a customer misses an instalment or stops the scheme?", "What if I miss a month?", [], "J"),
 ("Gold saving schemes", "O", "yes_no", "Can scheme instalments be paid online / by UPI?", "Can I pay the scheme by GPay?", YN, "J"),

 ("Custom orders & services", "I", "yes_no", "Do you make custom designs (from a customer's photo or a CAD design)?", "Can you make this design from a photo?", YN, "J"),
 ("Custom orders & services", "I", "text", "How many days do custom orders take, and how much advance is needed?", "How long for a custom ring?", [], "J"),
 ("Custom orders & services", "I", "list", "Which services do you offer?", "Can you resize my ring?", ["Repair", "Polishing", "Resizing", "Rhodium plating", "Stone setting", "Name engraving", "Ear / nose piercing"], "J"),
 ("Custom orders & services", "O", "text", "What do you charge for polishing and repairs?", "How much to polish a chain?", [], "J"),
 ("Custom orders & services", "O", "yes_no", "Do you give free polishing or maintenance for jewellery bought from you?", "Is polishing free for my bangles?", YN, "J"),
 ("Custom orders & services", "O", "text", "Do you re-polish or re-plate old one-gram jewellery? Charge?", "Can you re-polish my old set?", [], "F"),

 ("Quality & guarantee", "I", "yes_no", "Do you give a purity certificate or guarantee card with each piece?", "Will I get a certificate?", YN, "J"),
 ("Quality & guarantee", "O", "yes_no", "Can customers test purity on your karatmeter for free?", "Can I check the purity myself?", YN, "J"),
 ("Quality & guarantee", "I", "text", "How long does the gold polish / colour usually last?", "Will the colour fade?", [], "F"),
 ("Quality & guarantee", "I", "text", "Do you give a guarantee on colour or polish? How long?", "Is there a colour guarantee?", [], "F"),
 ("Quality & guarantee", "I", "yes_no", "Is your jewellery skin-friendly (nickel-free / anti-allergic)?", "Will it cause skin allergy?", YN, "F"),
 ("Quality & guarantee", "O", "text", "What care tips do you give (keep away from water, perfume, etc.)?", "How do I keep it shining?", [], "F"),
 ("Quality & guarantee", "O", "yes_no", "Do you offer insurance for jewellery bought from you?", "Can I insure this necklace?", YN, "J"),

 ("Buying & payment", "I", "text", "Which ID do customers need for big purchases (for example PAN above ₹2 lakh)?", "Do I need PAN card?", [], "J"),
 ("Buying & payment", "O", "list", "Which ways to pay do you accept?", "Can I pay by card?", ["Cash (within legal limit)", "UPI", "Debit / credit card", "Bank transfer", "Cheque / DD"], "JF"),
 ("Buying & payment", "O", "text", "Can customers exchange a piece bought from you for another design? Any deduction?", "Can I change this design later?", [], "JF"),
 ("Buying & payment", "I", "yes_no", "Do you show designs on a WhatsApp video call and take orders?", "Can you show me designs on video call?", YN, "JF"),
 ("Buying & payment", "O", "yes_no", "Do you send jewellery by insured courier to other cities?", "Can you courier it to Bangalore?", YN, "JF"),
 ("Buying & payment", "O", "yes_no", "Do you rent jewellery for weddings and functions?", "Can I rent a bridal set?", YN, "JF"),
 ("Buying & payment", "I", "yes_no", "Do you sell in wholesale to resellers?", "Do you give wholesale rates?", YN, "F"),
 ("Buying & payment", "O", "yes_no", "Do you give gift boxes or gift wrapping?", "Can you gift-wrap it?", YN, "JF"),

 ("Shop & service", "O", "yes_no", "Do you have a private room for bridal shopping?", "Is there a private room for bridal shopping?", YN, "J"),
 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada", "Marwari"], "JF"),
 ("Shop & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "JF"),
]

TYPES = [("jewellery", "Gold & diamond jewellery shop", "J"), ("imitation_jewellery", "One-gram gold & imitation jewellery shop", "F")]
PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
for key, name, tag in TYPES:
    chosen = [q for q in Q if tag in q[6]]
    assert len({q[3] for q in chosen}) == len(chosen), f"duplicate question in {key}"
    rows = sorted(enumerate(chosen), key=lambda x: (order[x[1][1]], x[0]))
    questions = []
    for n, (_, (cat, pri, typ, owner, customer, opts, _tags)) in enumerate(rows, 1):
        q = {"id": f"{key}-{n:03d}", "category": cat, "owner_question": owner, "customer_question": customer,
             "priority": PRI[pri], "answer_type": typ}
        if opts: q["options"] = opts
        questions.append(q)
    out = os.path.join(here, "..", "..", "botcraft-banks", f"{key}.json")
    json.dump({"shop_type_key": key, "name": name, "version": 2, "model": "curated",
               "generated_at": datetime.date.today().isoformat(), "question_count": len(questions), "questions": questions},
              open(out, "w"), indent=1, ensure_ascii=False)
    print(f"{key}: {len(questions)} questions", {p: sum(q["priority"] == p for q in questions) for p in PRI.values()})
