# Hand-written (curated) question banks for salon, beauty and spa businesses:
# hair salon / barber shop (men and unisex), ladies beauty parlour with bridal
# makeup, and spa & massage centre.
# Run: python3 scripts/curated/salon_spa.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: H = hair salon / barber shop, B = ladies beauty parlour, S = spa & massage centre.
# A * in the tags marks a city-only question, asked only to shops in a district
# headquarters or city (local shops rarely know these).
# Each owner is asked only the questions tagged for their business.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, offers, photos, Wi-Fi) are asked separately, so they
# are not repeated here.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Services & prices", "M", "list", "Who do you serve?", "Is this salon for ladies too?", ["Men", "Women", "Kids", "Unisex (all)"], "HS"),
 ("Services & prices", "M", "list", "Which hair services do you offer?", "Do you do hair colouring?", ["Haircut", "Beard trim / shave", "Hair wash", "Hair colour / dye", "Hair spa", "Straightening / smoothening", "Keratin", "Head massage"], "H"),
 ("Services & prices", "M", "list", "Which services do you offer?", "Do you do threading?", ["Threading", "Waxing", "Facial", "Cleanup", "Bleach", "Manicure / pedicure", "Haircut & styling", "Hair spa", "Bridal makeup", "Party makeup", "Mehendi", "Saree draping"], "B"),
 ("Services & prices", "M", "list", "Which spa services do you offer?", "Do you have a full body massage?", ["Full body massage", "Swedish", "Deep tissue", "Aromatherapy", "Balinese", "Thai massage", "Hot stone", "Abhyanga / Ayurvedic", "Shirodhara", "Head, neck & shoulder massage", "Foot reflexology", "Pre-natal (pregnancy) massage", "Body scrub / polish", "Body wrap", "Facial", "Steam / sauna", "Couple massage"], "S"),
 ("Services & prices", "M", "text", "What are the prices of your main services (for example haircut, beard, facial, massage)?", "How much for a haircut?", [], "HBS"),
 ("Services & prices", "I", "options", "Are your prices fixed for everyone, or do they change with hair length or the stylist?", "Is the price same for long hair?", ["Fixed for everyone", "Depends on hair length", "Depends on the stylist (junior / senior / master)", "Depends on both"], "HB"),
 ("Services & prices", "I", "text", "How long does each massage take (for example 60 / 90 minutes), and what is the price for each?", "How much for a 60-minute massage?", [], "S"),
 ("Services & prices", "I", "yes_no", "Is a price list shown in the shop (and online), with the same prices at the counter?", "Do you have a rate card?", YN, "HBS"),
 ("Services & prices", "I", "text", "Which massage do you recommend for back pain or muscle pain?", "Which massage is best for back pain?", [], "S"),
 ("Services & prices", "O", "text", "Is steam or sauna free with a massage, or charged separately?", "Is steam bath included?", [], "S"),
 ("Services & prices", "O", "yes_no", "Do you have a jacuzzi / hot tub? Is the water changed and the tub cleaned after every customer?", "Do you have a jacuzzi?", YN, "S*"),
 ("Services & prices", "O", "yes_no", "Do you have VIP or luxury suites (couple, family, friends) or a private entrance for VIP guests?", "Do you have a VIP room?", YN, "S*"),
 ("Services & prices", "O", "options", "Is GST included in your prices or added on the bill?", "Is GST extra?", ["Included", "Added on the bill", "No GST"], "HBS"),
 ("Services & prices", "O", "text", "How much time does each main service usually take (haircut, facial, hair colour)?", "How long will a facial take?", [], "HB"),
 ("Services & prices", "O", "yes_no", "Do you give kids' haircuts? Is there a separate price?", "Do you cut kids' hair?", YN, "HB"),
 ("Services & prices", "O", "yes_no", "Do you have kids' chairs (for example car-shaped) so small children sit happily for a haircut?", "Will my child sit for a haircut?", YN, "H"),
 ("Services & prices", "O", "yes_no", "Do you give a free hair and skin consultation before colour, treatments or makeup?", "Can you suggest a colour for me?", YN, "HB"),
 ("Services & prices", "O", "text", "How long does hair straightening, smoothening or keratin last, and do you give any guarantee?", "How long will smoothening last?", [], "HB"),
 ("Services & prices", "O", "options", "Which wax do you use?", "Do you have Rica wax?", ["Normal / honey wax", "Rica / liposoluble wax", "Both"], "B"),
 ("Services & prices", "O", "yes_no", "Do you have services for men too (haircut, facial, grooming)?", "Do you do men's facials?", YN, "B"),
 ("Services & prices", "O", "yes_no", "Do you do nail art or nail extensions?", "Do you do nail extensions?", YN, "B"),
 ("Services & prices", "O", "yes_no", "Do you do eyelash extensions or eyebrow tinting?", "Do you do lash extensions?", YN, "B*"),
 ("Services & prices", "O", "yes_no", "Do you do hair treatments for dandruff or hair fall?", "Anything for dandruff?", YN, "HB"),
 ("Services & prices", "O", "yes_no", "Do you do groom makeup and grooming packages for weddings?", "Do you have a groom package?", YN, "H"),

 ("Bridal & makeup", "I", "text", "What do your bridal makeup packages include, and what are the prices?", "How much for bridal makeup?", [], "B"),
 ("Bridal & makeup", "O", "text", "Do you have pre-bridal packages (facials, body polishing, hair care in the weeks before the wedding)? Price?", "Do you have a pre-bridal package?", [], "B"),
 ("Bridal & makeup", "I", "list", "Which makeup types do you do?", "Do you do HD makeup?", ["Normal", "HD", "Airbrush", "Waterproof", "Engagement / reception looks"], "B"),
 ("Bridal & makeup", "I", "text", "How early should a bride book, and how much advance do you take?", "How early should I book for my wedding?", [], "B"),
 ("Bridal & makeup", "O", "yes_no", "Do you do a trial makeup before the wedding? Is it paid?", "Can I get a trial makeup?", YN, "B"),
 ("Bridal & makeup", "O", "yes_no", "Do you come to the wedding venue or home for bridal makeup?", "Can you come to the marriage hall?", YN, "B"),
 ("Bridal & makeup", "O", "yes_no", "Do you do makeup and saree draping for the bride's family and relatives?", "Can you do makeup for my sisters too?", YN, "B"),
 ("Bridal & makeup", "O", "yes_no", "Do you do hairstyles with flowers, jada and hair accessories?", "Do you do jada with flowers?", YN, "B"),
 ("Bridal & makeup", "O", "yes_no", "Do you provide bridal jewellery or accessories on rent?", "Do you give jewellery for the bride?", YN, "B"),
 ("Bridal & makeup", "O", "text", "Which makeup brands do you use for brides (for example MAC, Huda, Kryolan)?", "Which brand makeup do you use?", [], "B"),

 ("Products & hygiene", "I", "yes_no", "Do you use a new blade for every customer?", "Will you use a new blade?", YN, "H"),
 ("Products & hygiene", "I", "yes_no", "Are combs, scissors and manicure / pedicure tools cleaned or sterilised (for example UV sterilizer) after every customer?", "Are your tools clean?", YN, "HBS"),
 ("Products & hygiene", "I", "yes_no", "Do you use fresh, disposable or washed towels, sheets (and for massages face-cradle covers and disposable innerwear) for every customer?", "Are the towels fresh?", YN, "HBS"),
 ("Products & hygiene", "I", "text", "Which product brands do you use for facials, bleach and hair (for example O3+, L'Oréal, Lotus, Cheryl's, VLCC), or do you make your own packs?", "Which brand facial do you use?", [], "HBS"),
 ("Products & hygiene", "O", "yes_no", "Do you have options for sensitive skin or allergies (for example ammonia-free colour)?", "I have sensitive skin, is that okay?", YN, "HB"),
 ("Products & hygiene", "O", "yes_no", "Do you do a patch test before colour, chemical treatments or a new massage oil?", "Will you do a patch test?", YN, "HBS"),
 ("Products & hygiene", "O", "text", "Which oils and products do you use for massages? Are they natural / organic?", "Which oil do you use?", [], "S"),
 ("Products & hygiene", "I", "yes_no", "Are massage rooms, steam and sauna areas cleaned and sanitised after every customer?", "Are the rooms clean?", YN, "S"),
 ("Products & hygiene", "O", "yes_no", "Can customers choose their massage oil or fragrance (including fragrance-free oil)?", "Can I choose the oil?", YN, "S"),
 ("Products & hygiene", "O", "yes_no", "Do therapists sanitise their hands in front of the customer before starting?", "Will the therapist sanitise hands?", YN, "S"),
 ("Products & hygiene", "O", "text", "Do you give bathrobes and slippers? Are they disposable or washed?", "Will you give a bathrobe?", [], "S"),
 ("Products & hygiene", "O", "options", "How are your towels and sheets washed?", "Who washes the towels?", ["Professional laundry", "Washed at the spa", "Disposable"], "S*"),
 ("Products & hygiene", "O", "yes_no", "Are your products cruelty-free or vegan?", "Are your products vegan?", YN, "BS*"),
 ("Products & hygiene", "O", "options", "What water do you use for showers?", "Is it soft water?", ["Soft / filtered water", "Normal / bore water"], "S*"),
 ("Products & hygiene", "O", "yes_no", "Do you have air purifiers in the massage rooms?", "Is there an air purifier?", YN, "S*"),
 ("Products & hygiene", "O", "yes_no", "Do you sell hair and skin products at the shop?", "Can I buy the shampoo here?", YN, "HBS"),
 ("Products & hygiene", "O", "yes_no", "Do you use organic or herbal products for some services?", "Do you have herbal facials?", YN, "B"),

 ("Booking & waiting", "M", "options", "Do customers need an appointment, or can they walk in?", "Do I need an appointment?", ["Walk-in only", "Appointment only", "Both"], "HBS"),
 ("Booking & waiting", "I", "options", "How can customers book an appointment?", "How do I book?", ["Call", "WhatsApp", "Online / app", "At the shop"], "HBS"),
 ("Booking & waiting", "I", "text", "What are your busy times (for example Sunday, evenings), and how long is the usual wait then?", "When is it less crowded?", [], "HB"),
 ("Booking & waiting", "O", "text", "What happens if a customer is late (is the session shortened?) or cancels an appointment? Any charge?", "What if I come late?", [], "BS"),
 ("Booking & waiting", "O", "yes_no", "Do you take advance booking for festivals and the wedding season?", "Can I book for Diwali morning?", YN, "HB"),
 ("Booking & waiting", "O", "yes_no", "Do you have a waiting area with seating, AC or TV?", "Is there a place to wait?", YN, "HBS"),

 ("Staff & privacy", "I", "options", "Who does the services for women?", "Is there a lady staff?", ["Only women staff", "Women staff on request", "Men and women staff"], "HS"),
 ("Staff & privacy", "I", "options", "Who gives massages?", "Can a lady therapist give the massage?", ["Same-gender therapist", "Customer can choose", "Only women therapists", "Only men therapists"], "S"),
 ("Staff & privacy", "I", "yes_no", "Do you have private rooms or cabins for facials, waxing and massages?", "Is there a private room?", YN, "BS"),
 ("Staff & privacy", "I", "yes_no", "Are your therapists trained or certified?", "Are your therapists trained?", YN, "S"),
 ("Staff & privacy", "O", "yes_no", "Do you fill a health form (BP, heart problems, allergies) before a massage?", "Will you ask about my health first?", YN, "S"),
 ("Staff & privacy", "O", "yes_no", "Can customers ask the therapist for more or less pressure during the massage?", "Can I ask for soft pressure?", YN, "S"),
 ("Staff & privacy", "O", "yes_no", "Can customers ask for a silent session (no talking during the massage)?", "Can it be a silent massage?", YN, "S"),
 ("Staff & privacy", "O", "yes_no", "Can customers change the room lighting and music?", "Can I change the music?", YN, "S"),
 ("Staff & privacy", "O", "yes_no", "Are your massage beds comfortable (face-hole cushion, heated bed) and is the room temperature controlled?", "Is the room warm in winter?", YN, "S"),
 ("Staff & privacy", "O", "options", "Where are your therapists from?", "Do you have Thai therapists?", ["Indian therapists", "Thai / international therapists", "Both"], "S*"),
 ("Staff & privacy", "O", "text", "For women customers late in the evening, what safety arrangements do you have?", "Is it safe to come at night?", [], "S"),
 ("Staff & privacy", "O", "yes_no", "Does your spa have a trade licence and health licence?", "Is your spa licensed?", YN, "S"),
 ("Staff & privacy", "O", "yes_no", "Can customers choose a particular stylist or therapist?", "Can I ask for the same stylist?", YN, "HBS"),
 ("Staff & privacy", "O", "text", "How many years of experience do your senior stylists or beauticians have?", "Are the stylists experienced?", [], "HB"),
 ("Staff & privacy", "O", "yes_no", "Do you have a separate section for men and women?", "Is there a separate ladies section?", YN, "H"),
 ("Staff & privacy", "O", "yes_no", "Are lockers or a safe box available for customers' valuables (purse, jewellery, watch)?", "Where do I keep my things?", YN, "S"),
 ("Staff & privacy", "O", "yes_no", "Do you have shower rooms with hot water and changing rooms? Attached to each room?", "Is there a shower after the massage?", YN, "S"),
 ("Staff & privacy", "O", "text", "Are there any health conditions for which you don't give massages (for example pregnancy, BP, heart problems, skin infection, recent surgery)? Is a doctor's note needed?", "Can I get a massage after surgery?", [], "S"),

 ("Packages & membership", "I", "text", "Which combo packages do you have (for example haircut + beard + facial) and prices?", "Any combo offer?", [], "HB"),
 ("Packages & membership", "I", "text", "Do you have spa packages or couple packages? What do they include?", "Do you have a couple package?", [], "S"),
 ("Packages & membership", "O", "text", "Do you have a monthly membership or prepaid card? What are the benefits?", "Is there a membership card?", [], "HBS"),
 ("Packages & membership", "O", "text", "Do you give special gifts or discounts on birthdays or anniversaries?", "Any birthday offer?", [], "HBS"),
 ("Packages & membership", "O", "yes_no", "Do you sell gift vouchers?", "Can I gift a spa voucher?", YN, "BS"),
 ("Packages & membership", "O", "text", "Do you give special prices for students, seniors, corporate employees or groups (for example a bridal party or 4–5 friends)?", "Any group discount?", [], "HBS"),

 ("Home service", "I", "options", "Do you provide home service?", "Can you come home for a facial?", ["No home service", "Yes, some services", "Yes, all services"], "HB"),
 ("Home service", "O", "text", "Which areas do you cover for home service, and is there an extra charge?", "Is there extra charge for home service?", [], "HB"),

 ("Shop & service", "O", "yes_no", "Is the shop air-conditioned?", "Is it AC?", YN, "HB"),
 ("Shop & service", "O", "yes_no", "Do you have a relaxation lounge to rest after the therapy?", "Can I relax after the massage?", YN, "S"),
 ("Shop & service", "O", "text", "Do you serve a welcome drink, herbal tea or detox drink?", "Do you give green tea?", [], "S"),
 ("Shop & service", "O", "options", "Are tips for therapists expected?", "Should I give a tip?", ["Not needed", "Optional, customer's choice", "Expected"], "HBS"),
 ("Shop & service", "O", "text", "How can customers give feedback after a service (Google review, feedback form or tablet)?", "Where can I give feedback?", [], "HBS"),
 ("Shop & service", "O", "yes_no", "Do you have a loyalty card or points for regular customers?", "Do I get points?", YN, "HBS"),
 ("Shop & service", "O", "text", "If a customer is not happy with a haircut, massage or service, what do you do (redo, another therapist, discount)?", "What if I don't like the service?", [], "HBS"),
 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "HBS"),
 ("Shop & service", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Do you have Instagram?", [], "HBS"),
]

TYPES = [("salon", "Hair salon / barber shop", "H"), ("beauty_parlour", "Ladies beauty parlour & bridal makeup", "B"),
         ("spa", "Spa & massage centre", "S")]
PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
for key, name, tag in TYPES:
    chosen = [q for q in Q if tag in q[6]]
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
