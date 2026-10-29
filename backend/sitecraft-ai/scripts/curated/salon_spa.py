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
 ("Services & prices", "M", "list", "Which spa services do you offer?", "Do you have a full body massage?", ["Full body massage", "Head, neck & shoulder massage", "Foot reflexology", "Aromatherapy", "Deep tissue", "Thai massage", "Abhyanga / Ayurvedic", "Body scrub / polish", "Steam / sauna", "Couple massage"], "S"),
 ("Services & prices", "M", "text", "What are the prices of your main services (for example haircut, beard, facial, massage)?", "How much for a haircut?", [], "HBS"),
 ("Services & prices", "I", "options", "Are your prices fixed for everyone, or do they change with hair length or the stylist?", "Is the price same for long hair?", ["Fixed for everyone", "Depends on hair length", "Depends on the stylist (senior / junior)", "Depends on both"], "HB"),
 ("Services & prices", "I", "text", "How long does each massage take (for example 60 / 90 minutes), and what is the price for each?", "How much for a 60-minute massage?", [], "S"),
 ("Services & prices", "I", "yes_no", "Is a price list shown in the shop?", "Do you have a rate card?", YN, "HBS"),
 ("Services & prices", "O", "text", "How much time does each main service usually take (haircut, facial, hair colour)?", "How long will a facial take?", [], "HB"),
 ("Services & prices", "O", "yes_no", "Do you give kids' haircuts? Is there a separate price?", "Do you cut kids' hair?", YN, "HB"),
 ("Services & prices", "O", "yes_no", "Do you have services for men too (haircut, facial, grooming)?", "Do you do men's facials?", YN, "B"),
 ("Services & prices", "O", "yes_no", "Do you do nail art or nail extensions?", "Do you do nail extensions?", YN, "B"),
 ("Services & prices", "O", "yes_no", "Do you do eyelash extensions or eyebrow tinting?", "Do you do lash extensions?", YN, "B*"),
 ("Services & prices", "O", "yes_no", "Do you do hair treatments for dandruff or hair fall?", "Anything for dandruff?", YN, "HB"),
 ("Services & prices", "O", "yes_no", "Do you do groom makeup and grooming packages for weddings?", "Do you have a groom package?", YN, "H"),

 ("Bridal & makeup", "I", "text", "What do your bridal makeup packages include, and what are the prices?", "How much for bridal makeup?", [], "B"),
 ("Bridal & makeup", "I", "list", "Which makeup types do you do?", "Do you do HD makeup?", ["Normal", "HD", "Airbrush", "Waterproof", "Engagement / reception looks"], "B"),
 ("Bridal & makeup", "I", "text", "How early should a bride book, and how much advance do you take?", "How early should I book for my wedding?", [], "B"),
 ("Bridal & makeup", "O", "yes_no", "Do you do a trial makeup before the wedding? Is it paid?", "Can I get a trial makeup?", YN, "B"),
 ("Bridal & makeup", "O", "yes_no", "Do you come to the wedding venue or home for bridal makeup?", "Can you come to the marriage hall?", YN, "B"),
 ("Bridal & makeup", "O", "yes_no", "Do you do makeup and saree draping for the bride's family and relatives?", "Can you do makeup for my sisters too?", YN, "B"),
 ("Bridal & makeup", "O", "yes_no", "Do you do hairstyles with flowers, jada and hair accessories?", "Do you do jada with flowers?", YN, "B"),
 ("Bridal & makeup", "O", "yes_no", "Do you provide bridal jewellery or accessories on rent?", "Do you give jewellery for the bride?", YN, "B"),
 ("Bridal & makeup", "O", "text", "Which makeup brands do you use for brides (for example MAC, Huda, Kryolan)?", "Which brand makeup do you use?", [], "B"),

 ("Products & hygiene", "I", "yes_no", "Do you use a new blade for every customer?", "Will you use a new blade?", YN, "H"),
 ("Products & hygiene", "I", "yes_no", "Are combs, scissors and tools cleaned or sterilised after every customer?", "Are your tools clean?", YN, "HBS"),
 ("Products & hygiene", "I", "yes_no", "Do you use fresh, disposable or washed towels and sheets for every customer?", "Are the towels fresh?", YN, "HBS"),
 ("Products & hygiene", "I", "text", "Which product brands do you use (for example L'Oréal, Lakme, VLCC, O3+)?", "Which brand facial do you use?", [], "HB"),
 ("Products & hygiene", "O", "yes_no", "Do you have options for sensitive skin or allergies (for example ammonia-free colour)?", "I have sensitive skin, is that okay?", YN, "HB"),
 ("Products & hygiene", "O", "yes_no", "Do you do a patch test before colour or chemical treatments?", "Will you do a patch test?", YN, "HB"),
 ("Products & hygiene", "O", "text", "Which oils and products do you use for massages?", "Which oil do you use?", [], "S"),
 ("Products & hygiene", "O", "yes_no", "Do you sell hair and skin products at the shop?", "Can I buy the shampoo here?", YN, "HBS"),
 ("Products & hygiene", "O", "yes_no", "Do you use organic or herbal products for some services?", "Do you have herbal facials?", YN, "B"),

 ("Booking & waiting", "M", "options", "Do customers need an appointment, or can they walk in?", "Do I need an appointment?", ["Walk-in only", "Appointment only", "Both"], "HBS"),
 ("Booking & waiting", "I", "options", "How can customers book an appointment?", "How do I book?", ["Call", "WhatsApp", "Online / app", "At the shop"], "HBS"),
 ("Booking & waiting", "I", "text", "What are your busy times (for example Sunday, evenings), and how long is the usual wait then?", "When is it less crowded?", [], "HB"),
 ("Booking & waiting", "O", "text", "What happens if a customer is late or cancels an appointment? Any charge?", "What if I come late?", [], "BS"),
 ("Booking & waiting", "O", "yes_no", "Do you take advance booking for festivals and the wedding season?", "Can I book for Diwali morning?", YN, "HB"),
 ("Booking & waiting", "O", "yes_no", "Do you have a waiting area with seating, AC or TV?", "Is there a place to wait?", YN, "HBS"),

 ("Staff & privacy", "I", "options", "Who does the services for women?", "Is there a lady staff?", ["Only women staff", "Women staff on request", "Men and women staff"], "HS"),
 ("Staff & privacy", "I", "options", "Who gives massages?", "Can a lady therapist give the massage?", ["Same-gender therapist", "Customer can choose", "Only women therapists", "Only men therapists"], "S"),
 ("Staff & privacy", "I", "yes_no", "Do you have private rooms or cabins for facials, waxing and massages?", "Is there a private room?", YN, "BS"),
 ("Staff & privacy", "I", "yes_no", "Are your therapists trained or certified?", "Are your therapists trained?", YN, "S"),
 ("Staff & privacy", "O", "yes_no", "Can customers choose a particular stylist or therapist?", "Can I ask for the same stylist?", YN, "HBS"),
 ("Staff & privacy", "O", "text", "How many years of experience do your senior stylists or beauticians have?", "Are the stylists experienced?", [], "HB"),
 ("Staff & privacy", "O", "yes_no", "Do you have a separate section for men and women?", "Is there a separate ladies section?", YN, "H"),
 ("Staff & privacy", "O", "yes_no", "Are lockers available for customers' belongings?", "Where do I keep my things?", YN, "S"),
 ("Staff & privacy", "O", "yes_no", "Do you have shower and changing rooms?", "Is there a shower after the massage?", YN, "S"),
 ("Staff & privacy", "O", "text", "Are there any health conditions for which you don't give massages (for example pregnancy, BP, recent surgery)?", "Can I get a massage during pregnancy?", [], "S"),

 ("Packages & membership", "I", "text", "Which combo packages do you have (for example haircut + beard + facial) and prices?", "Any combo offer?", [], "HB"),
 ("Packages & membership", "I", "text", "Do you have spa packages or couple packages? What do they include?", "Do you have a couple package?", [], "S"),
 ("Packages & membership", "O", "text", "Do you have a monthly membership or prepaid card? What are the benefits?", "Is there a membership card?", [], "HBS"),
 ("Packages & membership", "O", "yes_no", "Do you sell gift vouchers?", "Can I gift a spa voucher?", YN, "BS"),
 ("Packages & membership", "O", "text", "Do you give special prices for students, seniors or groups (for example a bridal party)?", "Any student discount?", [], "HBS"),

 ("Home service", "I", "options", "Do you provide home service?", "Can you come home for a facial?", ["No home service", "Yes, some services", "Yes, all services"], "HB"),
 ("Home service", "O", "text", "Which areas do you cover for home service, and is there an extra charge?", "Is there extra charge for home service?", [], "HB"),

 ("Shop & service", "O", "yes_no", "Is the shop air-conditioned?", "Is it AC?", YN, "HB"),
 ("Shop & service", "O", "yes_no", "Do you have a loyalty card or points for regular customers?", "Do I get points?", YN, "HBS"),
 ("Shop & service", "O", "text", "If a customer is not happy with a haircut or service, what do you do (redo, correction)?", "What if I don't like my haircut?", [], "HB"),
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
