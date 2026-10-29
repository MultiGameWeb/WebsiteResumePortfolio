# Hand-written (curated) question bank for footwear shops.
# Run: python3 scripts/curated/footwear.py  -> writes botcraft-banks/footwear.json
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
 ("Products & brands", "M", "list", "Whose footwear do you sell?", "Do you have kids' shoes?", ["Men", "Women", "Kids", "Babies & toddlers"], "F"),
 ("Products & brands", "M", "list", "Which types of footwear do you sell?", "Do you have sports shoes?", ["Daily-wear chappals", "Formal shoes", "Sports & running shoes", "Sneakers & loafers", "Sandals", "Doctor / ortho / diabetic", "Bridal & party wear", "Ethnic (Kolhapuri, mojari, jutti)", "School shoes", "Court & spikes shoes", "Safety shoes & gum boots", "Rain wear (clogs, jelly)", "Home & bathroom slippers", "Boots"], "F"),
 ("Products & brands", "I", "text", "Which brands do you sell (for example Bata, Paragon, VKC, Sparx, Campus, Puma, Adidas), and are they original stock?", "Is this original Adidas?", [], "F"),
 ("Products & brands", "I", "yes_no", "Do you keep big sizes (UK 10, 11, 12)?", "Do you have size 11?", YN, "F"),
 ("Products & brands", "I", "text", "Which daily-wear chappals last longest in water and sun?", "Which chappal is strong for daily use?", [], "F"),
 ("Products & brands", "I", "yes_no", "Do you tell customers clearly whether shoes are pure leather or synthetic / rexine?", "Is this pure leather?", YN, "F"),
 ("Products & brands", "I", "text", "What is the price range of your sports / running shoes?", "Running shoes start from how much?", [], "F"),
 ("Products & brands", "O", "yes_no", "Do you have models with soft inner lining (no shoe bite)?", "Will this shoe bite?", YN, "F"),
 ("Products & brands", "O", "yes_no", "Do you have anti-skid soles for tiles, wet floors and bathrooms?", "Will I slip on tiles?", YN, "F"),
 ("Products & brands", "O", "text", "Which of your footwear is single-moulded (PU) and which is pasted, and which lasts longer?", "Is this sole pasted?", [], "F"),
 ("Products & brands", "O", "yes_no", "Do you have new trending models (white sneakers, loafers, Korean ankle boots, chunky sneakers)?", "Do you have white sneakers?", YN, "F*"),

 ("Comfort & health", "I", "list", "Which comfort / doctor footwear do you have?", "Do you have diabetic chappals?", ["Diabetic (MCR / MCP)", "Heel-pain ortho slippers", "Arch support (flat foot)", "Memory foam", "Slip-on / velcro for elders", "Comfort sandals for pregnancy", "Ultra-light (EVA)", "Wide-fit (broad feet, bunions)", "Fancy-looking doctor sandals", "Cross-strap chappals (no toe-post)"], "F"),
 ("Comfort & health", "O", "yes_no", "Do you sell or fit extra insoles and silicone heel cups (for loose shoes or heel pain)?", "Do you have heel pads?", YN, "F"),

 ("Ladies & bridal", "I", "list", "Which ladies' footwear do you have?", "Do you have block heels?", ["Bridal heels & wedges (stones, pearls)", "Block / platform heels", "Flats & ballerinas", "Punjabi juttis", "Cut shoes & soft sneakers", "Metallic party colours (gold, silver, rose gold, copper)", "Jelly bellies & waterproof sandals"], "F"),
 ("Ladies & bridal", "O", "text", "Do gold / silver party-wear colours fade quickly? Any guarantee?", "Will the gold colour fade?", [], "F"),
 ("Ladies & bridal", "O", "yes_no", "Are stones and work on fancy footwear fixed firmly so they don't fall off?", "Will the stones come off?", YN, "F"),
 ("Ladies & bridal", "O", "yes_no", "Do you tighten back straps, punch extra buckle holes or replace worn heel tips at the shop?", "Can you change my heel tip?", YN, "F"),

 ("Kids & school", "I", "list", "Which kids' footwear do you have?", "Do you have school shoes?", ["Black school shoes (all sizes)", "White canvas / sports school shoes", "Velcro school shoes", "Squeaky & LED shoes for toddlers", "Back-strap sandals & clogs", "Dance shoes & gajjela chappals", "Roller / inline skates & safety gear"], "F"),
 ("Kids & school", "O", "yes_no", "If a child can't come, can customers bring an old shoe as the size reference?", "Can I bring his old shoe for size?", YN, "F"),

 ("Warranty & repairs", "I", "text", "If a sole comes unpasted or stitching breaks within a few months (or leather cracks), do you repair or replace it free? For how long?", "The sole came off in 2 months, what now?", [], "F"),
 ("Warranty & repairs", "O", "yes_no", "Do you add side stitching to leather footwear so the sole lasts longer?", "Can you stitch the sole?", YN, "F"),

 ("Accessories", "O", "list", "Which accessories do you sell?", "Do you have shoe polish?", ["Socks (cotton, ankle, formal, school)", "Shoe polish, whitener & brushes", "Sneaker cleaner, shoe deodorant, anti-fungal powder & odour balls", "Suede / nubuck brushes & protector spray", "Shoe laces", "Shoe horns", "Belts, wallets & handbags"], "F"),

 ("Prices & service", "I", "options", "Do you sell at MRP or give a discount on MRP?", "Any discount on MRP?", ["At MRP", "Flat discount on MRP", "Depends on the brand"], "F"),
 ("Prices & service", "I", "yes_no", "If a customer tells their size on WhatsApp (for example UK 7), do you send photos of models in that size?", "Can you send size 8 models on WhatsApp?", YN, "F"),
 ("Prices & service", "O", "yes_no", "Do you check UK vs Euro sizes for each brand so the customer gets the right fit?", "Is size 7 the same as 41?", YN, "F"),
 ("Prices & service", "O", "yes_no", "Do you give a wholesale rate for 20–50 pairs at once (for example vayanam gifts)?", "Any rate for 30 pairs?", YN, "F"),
 ("Prices & service", "O", "text", "Which sole lasts longest for daily walking (EVA, rubber, TPR)?", "Which sole is best for walking?", [], "F"),
 ("Prices & service", "O", "options", "Are your prices fixed, or can customers bargain?", "Can you reduce the price?", ["Fixed price", "Bargaining allowed", "Fixed on branded, bargain on local"], "F"),
 ("Prices & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "F"),
 ("Prices & service", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Do you have Instagram?", [], "F"),
]

PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
key, name = "footwear", "Footwear shop"
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
