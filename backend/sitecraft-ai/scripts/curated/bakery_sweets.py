# Hand-written (curated) question banks for bakeries and sweet shops: bakery &
# cake shop, sweet shop (mithai & savouries), and bakery & sweet shop (both).
# Run: python3 scripts/curated/bakery_sweets.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: K = bakery & cake shop, W = sweet shop. The combined bakery & sweet shop
# gets every question tagged K or W.
# A * in the tags marks a city-only question, asked only to shops in a district
# headquarters or city (local shops rarely know these).
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, offers, photos, Wi-Fi)
# are asked separately, so they are not repeated here.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Products", "M", "list", "Which cakes and bakery items do you make?", "Do you have pastries?", ["Cakes", "Pastries", "Bread & buns", "Cookies & biscuits", "Puffs, burgers & pizza", "Cupcakes & brownies", "Cheesecakes, donuts & macarons", "Chocolates", "Kids' candies & lollipops"], "K"),
 ("Products", "M", "list", "Which sweets and savouries do you make?", "Do you have kaju katli?", ["Ghee sweets (laddu, mysore pak)", "Kaju & dry-fruit sweets", "Bengali sweets (rasgulla, rasmalai)", "Milk sweets (kalakand, peda)", "Traditional sweets (pootharekulu, ariselu, bobbatlu)", "Savouries (mixture, chekkalu, murukulu)", "Hot snacks (samosa, kachori)", "Jaggery / millet sweets", "Sugar-free sweets"], "W"),
 ("Products", "I", "options", "Are your cakes eggless?", "Is this cake eggless?", ["All eggless", "Eggless on order", "Both, clearly marked", "With egg only"], "K"),
 ("Products", "I", "text", "Which cake flavours do you make (for example black forest, red velvet, butterscotch, fruit)?", "Do you have red velvet?", [], "K"),
 ("Products", "I", "yes_no", "Are 1/2 kg and 1 kg ready-made birthday cakes always available at the counter without ordering?", "Do you have a ready cake now?", YN, "K"),
 ("Products", "I", "yes_no", "Are your sweets made fresh every day?", "Are these sweets fresh?", YN, "W"),
 ("Products", "I", "options", "Which fat do you use in ghee sweets?", "Is this pure ghee?", ["100% pure ghee", "Ghee and vanaspati", "Depends on the sweet (we tell customers)"], "W"),
 ("Products", "O", "yes_no", "Do you bake your bread, buns and rusk in your own bakery?", "Is the bread made here?", YN, "K"),
 ("Products", "O", "yes_no", "Do you have brown, multigrain or whole-wheat bread?", "Do you have brown bread?", YN, "K"),
 ("Products", "O", "yes_no", "Are puffs, burgers and pizzas served hot?", "Are the puffs hot?", YN, "K"),
 ("Products", "O", "text", "Are the ketchup and chutneys you serve with snacks branded or made fresh?", "Is the chutney fresh?", [], "KW"),
 ("Products", "O", "yes_no", "Do you have trending cakes (bento, pinata, pull-me-up)?", "Do you have a pinata cake?", YN, "K*"),
 ("Products", "O", "yes_no", "Do you have jaggery or millet sweets and biscuits for people who avoid white sugar?", "Any jaggery sweets?", YN, "KW"),
 ("Products", "O", "yes_no", "Do you have sugar-free sweets or cakes for diabetics?", "Do you have sugar-free sweets?", YN, "KW"),
 ("Products", "O", "yes_no", "Is your chhena / paneer for Bengali sweets made from fresh milk?", "Is the rasgulla made from fresh milk?", YN, "W"),
 ("Products", "O", "yes_no", "Do you have sweets with silver varq? Is the varq pure and edible?", "Is the silver on this sweet real?", YN, "W"),
 ("Products", "O", "text", "What grade of almonds, pistachios and cashews do you use in sweets?", "Are the cashews good quality?", [], "W"),
 ("Products", "O", "text", "Which oil do you use for frying savouries (groundnut, sunflower, palm), and do you avoid reusing oil?", "Which oil is this mixture fried in?", [], "W"),
 ("Products", "O", "yes_no", "Do you make festival and vratham items on order (boondi, poornam boorelu, bobbatlu)?", "Can you make bobbatlu for Ugadi?", YN, "W"),
 ("Products", "O", "yes_no", "Do you sell candles, name toppers, musical candles and party items?", "Do you have number candles?", YN, "K"),
 ("Products", "O", "yes_no", "Do you have home-made chocolates or cupcake boxes for return gifts?", "Do you have return-gift chocolates?", YN, "K"),

 ("Custom cakes & orders", "I", "yes_no", "Do you make customised theme or photo cakes from a customer's picture?", "Can you make a Spider-Man cake?", YN, "K"),
 ("Custom cakes & orders", "I", "text", "How many hours or days before should customers order a birthday or custom cake?", "How early should I order?", [], "K"),
 ("Custom cakes & orders", "I", "text", "What is the minimum weight for fondant or theme cakes, and how is the price worked out?", "Minimum how many kg for a fondant cake?", [], "K"),
 ("Custom cakes & orders", "I", "text", "How much advance do you take for custom cakes or bulk orders, and what is the refund policy if it is cancelled or rescheduled?", "How much advance should I pay?", [], "KW"),
 ("Custom cakes & orders", "O", "yes_no", "Are the paper and ink for photo cakes edible?", "Is the photo on the cake edible?", YN, "K"),
 ("Custom cakes & orders", "O", "yes_no", "Can customers change the flavour of a design cake?", "Can I have this design in chocolate?", YN, "K"),
 ("Custom cakes & orders", "O", "options", "Do you colour cream with natural or artificial colours?", "Are the colours safe?", ["Natural colours", "Food-grade artificial colours", "Both"], "K"),
 ("Custom cakes & orders", "O", "yes_no", "Can you make nut-free or gluten-free cakes on order?", "Do you have gluten-free cake?", YN, "K*"),
 ("Custom cakes & orders", "O", "text", "Do you write names on a chocolate plaque? Any extra charge?", "Can you write the name on chocolate?", [], "K"),
 ("Custom cakes & orders", "O", "yes_no", "Do you make 2- or 3-tier wedding cakes and send a chef to assemble them at the venue?", "Can you make a 3-tier cake?", YN, "K*"),
 ("Custom cakes & orders", "O", "yes_no", "Do you make a cake live in front of the customer in 10–15 minutes?", "Can you make the cake now?", YN, "K"),
 ("Custom cakes & orders", "O", "yes_no", "Do you give a free birthday kit (candles, caps, knife) with cakes?", "Will I get candles with the cake?", YN, "K"),

 ("Bulk, functions & gifts", "I", "text", "Do you take bulk orders for weddings and functions (sweets, hot snacks)? Wholesale rates?", "Can you supply sweets for 500 people?", [], "KW"),
 ("Bulk, functions & gifts", "I", "yes_no", "Do you pack festival sweet gift boxes (Diwali, Dasara, Sankranti)?", "Do you have Diwali gift boxes?", YN, "KW"),
 ("Bulk, functions & gifts", "O", "yes_no", "Do you deliver bulk orders to the function hall on time? Free?", "Can you deliver to the hall?", YN, "KW"),
 ("Bulk, functions & gifts", "O", "yes_no", "Do you pack traditional saare trays for gruhapravesam, engagement or seemantham?", "Do you make saare trays?", YN, "W"),
 ("Bulk, functions & gifts", "O", "yes_no", "Do you vacuum-pack sweets, podis and savouries for sending abroad (USA, UK, Australia)?", "Can you pack sweets for the USA?", YN, "W"),

 ("Freshness & safety", "I", "yes_no", "Is your shop FSSAI-registered, with a clean kitchen and covered display (no flies)?", "Is your kitchen clean?", YN, "KW"),
 ("Freshness & safety", "I", "yes_no", "Do you write the expiry / best-before date on boxes?", "How many days will this keep?", YN, "KW"),
 ("Freshness & safety", "O", "text", "How long do dry cakes, tea cakes, cookies and sweets keep?", "How long will the fruit cake last?", [], "KW"),
 ("Freshness & safety", "O", "yes_no", "Do you use food-grade boxes and butter-paper lining for sweets and cakes?", "Is the box food safe?", YN, "KW"),
 ("Freshness & safety", "O", "text", "For long travel, do you pack cream cakes with ice gel packs, or suggest butter-cream cakes?", "Will the cake melt on the way?", [], "K"),

 ("Ordering & delivery", "I", "text", "If a cake is damaged or loses shape in delivery, do you replace or refund?", "The cake came damaged, what now?", [], "K"),
 ("Ordering & delivery", "O", "yes_no", "Do you deliver cakes at midnight for birthdays and anniversaries? Extra charge?", "Can you deliver at 12 midnight?", YN, "K"),
 ("Ordering & delivery", "O", "yes_no", "Are you on Swiggy or Zomato?", "Can I order on Swiggy?", YN, "KW*"),
 ("Ordering & delivery", "O", "yes_no", "Do you use insulated bags so puffs and snacks stay hot in delivery?", "Will the puffs be hot?", YN, "K*"),

 ("Shop & service", "O", "yes_no", "Can customers taste a small sample before buying sweets?", "Can I taste this?", YN, "W"),
 ("Shop & service", "O", "yes_no", "Do you have seating or a kids' area to eat in the shop?", "Can we sit and eat here?", YN, "KW"),
 ("Shop & service", "O", "options", "Is GST included in your prices or added on the bill?", "Is GST extra?", ["Included", "Added on the bill", "No GST"], "KW"),
 ("Shop & service", "O", "options", "If you have no change, what do you do?", "Will you give chocolates instead of change?", ["Take the exact amount by UPI", "Give small items (chocolates)", "Round off"], "KW"),
 ("Shop & service", "O", "text", "Do you have loyalty points, a membership discount or coupons for regular customers?", "Any discount for regular customers?", [], "KW"),
 ("Shop & service", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Do you have Instagram?", [], "KW"),
]

TYPES = [("bakery", "Bakery & cake shop", "K"), ("sweet_shop", "Sweet shop (mithai & savouries)", "W"),
         ("bakery_sweets", "Bakery & sweet shop", "KW")]
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
