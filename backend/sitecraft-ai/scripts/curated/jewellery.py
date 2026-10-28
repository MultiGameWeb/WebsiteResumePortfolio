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
 ("Products & purity", "I", "yes_no", "Do you sell silver articles (pooja items, idols, plates, anklets, gifts)?", "Do you have a silver pooja set?", YN, "J"),
 ("Products & purity", "I", "text", "What purity is your silver (for example 925, 999), and is it hallmarked?", "Is this pure silver?", [], "J"),
 ("Products & purity", "O", "text", "What making charge and wastage do you take on silver, per gram?", "Making charge on silver anklets?", [], "J"),
 ("Products & purity", "O", "list", "Which silver items do you have for small children?", "Do you have silver gajjelu for my baby?", ["Gajjelu / anklets", "Molathadu (waist thread)", "Bowls & spoons", "Bangles", "None"], "J"),
 ("Products & purity", "O", "yes_no", "Do you give wholesale rates on bulk silver coins or gifts (for corporate events or functions)?", "Rate for 200 silver coins?", YN, "J"),
 ("Products & purity", "O", "yes_no", "Do you have light-weight gold jewellery for babies and kids (black-bead bracelets, small rings, studs)?", "Do you have small gold rings for my baby?", YN, "J"),
 ("Products & purity", "O", "yes_no", "Is your kids' jewellery made with smooth, rounded edges so it doesn't hurt the child?", "Will it poke my baby's skin?", YN, "JF"),
 ("Products & purity", "O", "yes_no", "Do you have 2D / 3D temple and antique-finish designs?", "Do you have 3D temple necklaces?", YN, "J"),
 ("Products & purity", "O", "yes_no", "Do you sell digital gold (buy online from ₹100) through your app or website?", "Can I buy gold online from you for ₹100?", YN, "J"),
 ("Products & purity", "O", "text", "Can digital gold bought from you be converted into jewellery or coins at your shop? Any charges?", "Can I change my digital gold into a chain?", [], "J"),
 ("Products & purity", "I", "yes_no", "Do you have anti-tarnish / waterproof jewellery for daily wear?", "Will it change colour in water?", YN, "F"),

 ("Pearls & gemstones", "O", "options", "Which pearls do you sell?", "Are these real pearls?", ["Natural", "Cultured", "Basra", "Fresh-water", "We don't sell pearls"], "J"),
 ("Pearls & gemstones", "O", "yes_no", "Do pearl and coral jewellery come with a lab certificate for quality and grading?", "Is there a certificate for the pearls?", YN, "J"),
 ("Pearls & gemstones", "O", "text", "Do you give any guarantee or replacement if pearls lose colour or shine?", "Will the pearls lose their shine?", [], "J"),
 ("Pearls & gemstones", "O", "text", "How do you judge the quality of gemstones like ruby (kempu), emerald (pacha) and sapphire (neelam)?", "How good is this ruby?", [], "J"),
 ("Pearls & gemstones", "O", "options", "Can you guarantee your gemstones are natural, unheated and untreated?", "Is this stone treated?", ["Yes, with lab certificate", "Some are treated, we tell customers", "We don't sell gemstones"], "J"),
 ("Pearls & gemstones", "O", "text", "If an astrologer advises against a gemstone, can the customer return it within some days for a full refund?", "My astrologer said no, can I return it?", [], "J"),
 ("Products & purity", "I", "text", "Do your diamonds come with a certificate? Which labs (IGI, GIA, SGL)?", "Is the diamond certified?", [], "J"),
 ("Products & purity", "O", "yes_no", "Do you give a card with the diamond's 4Cs (cut, clarity, colour, carat)?", "What is the clarity of this diamond?", YN, "J"),
 ("Products & purity", "O", "text", "Do you sell rose gold or white gold jewellery? What purity?", "Do you have white gold rings?", [], "J"),
 ("Products & purity", "O", "options", "For diamond jewellery, which gold do you use?", "Is the diamond ring in 18 carat?", ["18K", "22K", "Both"], "J"),
 ("Products & purity", "O", "text", "If you sell platinum, how is its purity certified, and how can customers check the Pt 950 stamp?", "How do I know this is real platinum?", [], "J"),
 ("Products & purity", "O", "text", "What buy-back or exchange value do you give on platinum jewellery?", "Will you buy back platinum?", [], "J"),
 ("Products & purity", "O", "yes_no", "Do you have fusion jewellery (platinum with rose or yellow gold)?", "Do you have platinum and gold mixed rings?", YN, "J"),
 ("Products & purity", "O", "yes_no", "Do you sell oxidised silver and 92.5 sterling silver fashion jewellery?", "Do you have oxidised silver earrings?", YN, "J"),
 ("Products & purity", "O", "yes_no", "Do you also sell one-gram gold / imitation jewellery?", "Do you have one gram gold sets too?", YN, "J"),
 ("Products & purity", "O", "options", "Is your jewellery hand-made or machine-made?", "Is this hand-made?", ["Mostly hand-made", "Mostly machine-made", "Both"], "J"),
 ("Products & purity", "O", "yes_no", "Are making charges higher for hand-made jewellery than machine-made?", "Why is hand-made costlier?", YN, "J"),
 ("Products & purity", "O", "yes_no", "Do you have experienced traditional goldsmiths (karigars) for hand-made custom orders?", "Do you have your own goldsmiths?", YN, "J"),
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
 ("Rates & charges", "O", "text", "Do you charge making or wastage on gold coins and bars?", "Is there wastage on a gold coin?", [], "J"),
 ("Rates & charges", "O", "text", "On custom orders or remaking old gold, who bears the melting loss — the customer or the shop?", "Who pays for the gold lost in melting?", [], "J"),
 ("Rates & charges", "O", "yes_no", "Do you weigh threads (dori, silk or leather cords), enamel and meenakari separately and deduct them from the gold weight?", "Is the thread weight counted as gold?", YN, "J"),
 ("Rates & charges", "O", "yes_no", "Is the weighing scale kept where customers can see it show zero before weighing?", "Can I see the weighing?", YN, "J"),
 ("Rates & charges", "I", "yes_no", "Do you give a computerised GST bill showing gross weight, net gold weight, stone weight, purity, rate, making, wastage and GST separately?", "Will the bill show net and gross weight?", YN, "J"),
 ("Rates & charges", "I", "yes_no", "Is the HUID number of each piece printed on the bill?", "Will the HUID be on my bill?", YN, "J"),
 ("Rates & charges", "I", "options", "Is GST (3%) included in the price or added on the bill?", "Is GST extra?", ["Included", "Added on the bill"], "JF"),
 ("Rates & charges", "O", "text", "Is the GST different for gold coins / bars and for jewellery?", "Is GST the same on coins?", [], "J"),
 ("Rates & charges", "O", "text", "When do you usually give zero making charge or zero wastage offers?", "When is zero wastage offer?", [], "J"),
 ("Rates & charges", "O", "text", "Do you give an extra exchange bonus on old jewellery when buying new?", "Any exchange bonus?", [], "J"),
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
 ("Custom orders & services", "O", "text", "If a custom piece comes out 1–2 grams heavier than planned, how is the extra charged?", "It's heavier than we said, what will I pay?", [], "J"),
 ("Custom orders & services", "O", "text", "Can a custom order be cancelled if the customer doesn't like the finish? Is the advance refunded?", "Can I cancel my custom order?", [], "J"),
 ("Custom orders & services", "I", "list", "Which services do you offer?", "Can you resize my ring?", ["Repair", "Polishing", "Resizing", "Rhodium plating", "Stone setting", "Name engraving", "Ear / nose piercing"], "J"),
 ("Custom orders & services", "O", "text", "What do you charge for polishing and repairs (for example replacing screws or locks)?", "How much to fix the lock of my chain?", [], "J"),
 ("Custom orders & services", "O", "yes_no", "Do you give free polishing or maintenance for jewellery bought from you?", "Is polishing free for my bangles?", YN, "J"),
 ("Custom orders & services", "O", "text", "If you pierce ears or noses (including for babies), what do you charge? Is it free with studs bought from you?", "How much for my baby's ear piercing?", [], "J"),
 ("Custom orders & services", "O", "yes_no", "If the antique polish on jewellery bought from you fades, do you redo it to the original colour?", "The antique colour faded, can you redo it?", YN, "J"),
 ("Custom orders & services", "O", "yes_no", "Do you clean silver that has turned black (cleaning service or liquid cleaner)?", "My silver turned black, can you clean it?", YN, "J"),
 ("Custom orders & services", "O", "text", "Do you re-polish or re-plate old one-gram jewellery? Charge?", "Can you re-polish my old set?", [], "F"),

 ("Quality & guarantee", "I", "yes_no", "Do you give a purity certificate or guarantee card with each piece?", "Will I get a certificate?", YN, "J"),
 ("Quality & guarantee", "O", "yes_no", "Can customers test purity on your karatmeter for free?", "Can I check the purity myself?", YN, "J"),
 ("Quality & guarantee", "O", "yes_no", "Is your karatmeter regularly calibrated or certified?", "Is your testing machine certified?", YN, "J"),
 ("Quality & guarantee", "I", "text", "If an outside lab finds lower purity in gold bought from you, what do you do (refund, replace, compensate)?", "What if the purity is less in another lab?", [], "J"),
 ("Quality & guarantee", "O", "text", "Can you get old jewellery without a hallmark hallmarked now? What is the charge?", "Can you hallmark my old chain?", [], "J"),
 ("Quality & guarantee", "I", "text", "How long does the gold polish / colour usually last?", "Will the colour fade?", [], "F"),
 ("Quality & guarantee", "I", "text", "Do you give a guarantee on colour or polish? How long?", "Is there a colour guarantee?", [], "F"),
 ("Quality & guarantee", "I", "yes_no", "Is your jewellery skin-friendly (nickel-free / anti-allergic)?", "Will it cause skin allergy?", YN, "F"),
 ("Quality & guarantee", "O", "text", "What care tips do you give (keep away from water, perfume, etc.)?", "How do I keep it shining?", [], "F"),
 ("Quality & guarantee", "O", "yes_no", "Do you offer insurance for jewellery bought from you?", "Can I insure this necklace?", YN, "J"),

 ("Buying & payment", "O", "yes_no", "For customers travelling abroad, do you give a bill or certificate to show at customs?", "I'm going to the US, will I have problems at customs?", YN, "J"),
 ("Buying & payment", "I", "text", "Which ID do customers need for big purchases (for example PAN above ₹2 lakh)?", "Do I need PAN card?", [], "J"),
 ("Buying & payment", "O", "text", "What is the maximum cash you accept on one bill?", "Can I pay 3 lakhs in cash?", [], "J"),
 ("Buying & payment", "O", "text", "Do you give special discounts to corporate employees (IT, bank, government)?", "Any discount for IT employees?", [], "JF"),
 ("Buying & payment", "O", "list", "Which ways to pay do you accept?", "Can I pay by card?", ["Cash (within legal limit)", "UPI", "Debit / credit card", "Bank transfer", "Cheque / DD"], "JF"),
 ("Buying & payment", "O", "text", "Can customers exchange a piece bought from you for another design? Any deduction?", "Can I change this design later?", [], "JF"),
 ("Buying & payment", "I", "yes_no", "Do you show designs on a WhatsApp video call and take orders?", "Can you show me designs on video call?", YN, "JF"),
 ("Buying & payment", "O", "yes_no", "Do you deliver jewellery safely, by insured courier or with security staff (in the city and to other cities)?", "Can you courier it to Bangalore?", YN, "JF"),
 ("Buying & payment", "O", "options", "Who pays the card charge (1.5–2%) when paying by credit card?", "Is there extra charge on credit card?", ["We pay it", "Customer pays it", "No charge on debit cards only"], "JF"),
 ("Buying & payment", "O", "yes_no", "Can one bill be paid partly in cash, partly online, or with two cards?", "Can I pay with two cards?", YN, "JF"),
 ("Buying & payment", "O", "yes_no", "Do you rent jewellery for weddings and functions?", "Can I rent a bridal set?", YN, "JF"),
 ("Buying & payment", "I", "yes_no", "Do you sell in wholesale to resellers?", "Do you give wholesale rates?", YN, "F"),
 ("Buying & payment", "O", "yes_no", "Do you give gift boxes or gift wrapping?", "Can you gift-wrap it?", YN, "JF"),

 ("Shop & service", "O", "yes_no", "Do you have a private room for bridal shopping?", "Is there a private room for bridal shopping?", YN, "J"),
 ("Shop & service", "O", "yes_no", "Can customers keep purchased jewellery in your locker until the wedding?", "Can you keep the jewellery safe till the wedding?", YN, "J"),
 ("Shop & service", "O", "list", "What security do you have for customers?", "Is it safe to carry big purchases?", ["24/7 CCTV inside and in parking", "Security guards", "Armed guards", "Staff escort to the vehicle"], "J"),
 ("Shop & service", "O", "text", "For big wedding purchases (for example 10–20 tolas), do you give free silver items or coins?", "Any free gift if I buy 15 tolas?", [], "J"),
 ("Shop & service", "O", "text", "Do you run scratch cards or lucky draws on festivals or your shop anniversary?", "Is there a lucky draw this Diwali?", [], "JF"),
 ("Shop & service", "O", "yes_no", "Do you have a privilege card or loyalty points for regular customers?", "Do I get loyalty points?", YN, "JF"),
 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada", "Marwari"], "JF"),
 ("Shop & service", "O", "text", "If a customer has a quality problem later, whom should they contact (owner or customer care number)?", "Whom do I call if there's a problem later?", [], "JF"),
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
