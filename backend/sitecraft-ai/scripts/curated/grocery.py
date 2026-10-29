# Hand-written (curated) question banks for grocery businesses: kirana /
# general store, supermarket / departmental store, and vegetables & fruits shop.
# Run: python3 scripts/curated/grocery.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: K = kirana / general store, S = supermarket / departmental store, V = vegetables & fruits shop.
# A * in the tags marks a city-only question, asked only to shops in a district
# headquarters or city (local shops rarely know these).
# Each owner is asked only the questions tagged for their business.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, offers, photos, Wi-Fi)
# are asked separately, so they are not repeated here. Items and prices come
# from the owner's item list and price-list photos, not from these questions.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Products & brands", "M", "list", "Which items do you sell?", "Do you have rice and dal?", ["Rice, atta & grains", "Dal & pulses", "Oil & ghee", "Spices & masalas", "Tea, coffee & sugar", "Snacks & biscuits", "Soaps, shampoo & personal care", "Cleaning items (detergent, floor cleaner)", "Pooja items", "Dry fruits"], "KS"),
 ("Products & brands", "M", "list", "What else does your store have?", "Do you sell vegetables too?", ["Vegetables & fruits", "Dairy (milk, curd, paneer)", "Bakery (bread, cakes)", "Frozen foods & ice cream", "Meat & eggs", "Household & kitchenware", "Stationery", "Baby care", "Pet food", "Beverages & juices"], "S"),
 ("Products & brands", "M", "list", "What do you sell?", "Do you have fruits?", ["Daily vegetables", "Leafy greens (aaku kooralu)", "Fruits", "Exotic vegetables & fruits (broccoli, avocado…)", "Coconuts", "Flowers", "Fruit gift baskets", "Cut / cleaned vegetables"], "V"),
 ("Products & brands", "I", "options", "Do you sell loose items (by weight) or only packed items?", "Do you sell loose rice?", ["Loose and packed", "Only packed", "Mostly loose"], "KS"),
 ("Products & brands", "I", "text", "Which rice varieties and brands do you keep (for example Sona Masoori, BPT, basmati)?", "Do you have Sona Masoori?", [], "KS"),
 ("Products & brands", "O", "yes_no", "Do you keep organic or natural products (organic dal, cold-pressed oil, millets)?", "Do you have cold-pressed oil?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you sell millets (jowar, ragi, korralu) and millet products?", "Do you have ragi?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you have your own store brand or home-made items (pickles, podis, papad)?", "Do you have home-made pickles?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you sell items in bulk for functions and hotels (for example 25 kg rice bags, oil tins)?", "Do you sell 25 kg rice bags?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you sell imported or premium brands?", "Do you have imported chocolates?", YN, "S*"),
 ("Products & brands", "O", "yes_no", "Do you sell gas cylinders, kerosene or charcoal?", "Do you have gas?", YN, "K"),
 ("Products & brands", "O", "yes_no", "Do you take mobile recharges, bill payments or sell SIM cards?", "Can I recharge my phone here?", YN, "K"),
 ("Products & brands", "O", "yes_no", "Do you sell fresh milk packets and curd every morning? From what time?", "When does milk come?", YN, "KS"),
 ("Products & brands", "I", "text", "Which fruits and vegetables come from local farms, and which come from outside (for example apples, kiwi)?", "Are these local vegetables?", [], "V"),
 ("Products & brands", "O", "yes_no", "Do you sell organic vegetables and fruits?", "Are these organic?", YN, "V"),

 ("Prices & billing", "I", "options", "How should customers get today's prices?", "What is the rate of tomato today?", ["I'll update prices with Update", "Prices are on the board in the shop", "Customers should call or WhatsApp"], "V"),
 ("Prices & billing", "I", "options", "Do you sell at MRP or below MRP?", "Do you give discount on MRP?", ["At MRP", "Below MRP on many items", "Depends on the item"], "KS"),
 ("Prices & billing", "I", "yes_no", "Do you give a printed / computer bill?", "Will I get a bill?", YN, "KS"),
 ("Prices & billing", "O", "text", "Do you give lower rates for bulk or wholesale buying? From what quantity?", "Any wholesale rate?", [], "KSV"),
 ("Prices & billing", "O", "yes_no", "Do you allow monthly credit (khata / udhaar) for regular customers?", "Can I pay at the end of the month?", YN, "KV"),
 ("Prices & billing", "O", "yes_no", "Can customers order their monthly grocery list (sarukulu) at once and collect or get it delivered?", "Can I give my monthly list?", YN, "KS"),
 ("Prices & billing", "O", "text", "What is the price range for fruit baskets or gift hampers?", "How much for a fruit basket?", [], "VS"),
 ("Prices & billing", "O", "text", "On which days do you have weekly offers (for example Wednesday vegetables, weekend sale)?", "Which day is the offer?", [], "SV"),
 ("Prices & billing", "O", "yes_no", "Do you accept food coupons or company meal cards (Sodexo / Pluxee)?", "Can I use Sodexo here?", YN, "S*"),

 ("Freshness & quality", "I", "text", "When does fresh stock (vegetables, fruits, milk, bread) arrive every day?", "When do fresh vegetables come?", [], "SV"),
 ("Freshness & quality", "I", "yes_no", "Do you check expiry dates and remove expired items from the shelves?", "Are these items fresh?", YN, "KS"),
 ("Freshness & quality", "O", "text", "If a customer gets a damaged, spoiled or expired item, what do you do?", "The packet was expired, can I change it?", [], "KSV"),
 ("Freshness & quality", "O", "yes_no", "Can customers pick and choose vegetables and fruits themselves?", "Can I select the tomatoes myself?", YN, "SV"),
 ("Freshness & quality", "O", "yes_no", "Are your fruits ripened naturally (no carbide)?", "Are these mangoes naturally ripened?", YN, "V"),
 ("Freshness & quality", "O", "yes_no", "Do you have cold storage or fridges for vegetables, dairy and frozen items?", "Is the milk kept in the fridge?", YN, "SV"),
 ("Freshness & quality", "O", "yes_no", "Are your weighing scales electronic and checked (stamped) regularly?", "Is your weighing machine correct?", YN, "KV"),
 ("Freshness & quality", "O", "yes_no", "Do you clean and grade rice, dal and grains before selling?", "Is this dal cleaned?", YN, "K"),

 ("Ordering & delivery", "I", "options", "How can customers order for home delivery?", "Can I order on WhatsApp?", ["Call", "WhatsApp (send list or photo)", "Own app / website", "Swiggy Instamart / Zepto / BigBasket / other apps", "No home delivery"], "KSV"),
 ("Ordering & delivery", "I", "text", "What is the minimum order for free home delivery, and the delivery charge below it?", "Is delivery free?", [], "KSV"),
 ("Ordering & delivery", "I", "text", "How quickly do you deliver (for example within 1 hour, same day), and up to what distance?", "How fast will you deliver?", [], "KSV"),
 ("Ordering & delivery", "O", "yes_no", "Can customers pay on delivery (cash or UPI)?", "Can I pay when it comes?", YN, "KSV"),
 ("Ordering & delivery", "O", "yes_no", "Do you take daily or weekly fixed orders (for example milk and vegetables every morning)?", "Can you send vegetables every morning?", YN, "SV"),
 ("Ordering & delivery", "O", "yes_no", "Do you supply to hotels, hostels, caterers or functions?", "Do you supply for functions?", YN, "KSV"),
 ("Ordering & delivery", "O", "yes_no", "Can customers call or WhatsApp to keep items packed and ready for pickup?", "Can you pack my items, I'll collect?", YN, "KSV"),
 ("Ordering & delivery", "O", "yes_no", "If an item is not available, will you get it within a day or two?", "Can you get this for me tomorrow?", YN, "KS"),

 ("Shop & service", "O", "yes_no", "Do you have trolleys and baskets for customers?", "Is there a trolley?", YN, "S"),
 ("Shop & service", "O", "options", "Are carry bags free, or charged on the bill?", "Do I have to pay for the bag?", ["Free paper / cloth bag", "Free plastic bag", "Charged (₹5–10)", "Bring your own bag"], "KSV"),
 ("Shop & service", "O", "yes_no", "Is the store air-conditioned?", "Is it AC?", YN, "S"),
 ("Shop & service", "O", "text", "How many billing counters do you have, and how long is the queue at busy times?", "Is there a long queue in the evening?", [], "S*"),
 ("Shop & service", "O", "yes_no", "Do you have a loyalty card or points for regular customers?", "Do I get points?", YN, "KSV"),
 ("Shop & service", "O", "yes_no", "Do you sell gift vouchers or festival gift hampers?", "Do you have Diwali hampers?", YN, "S"),
 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "KSV"),
 ("Shop & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "KSV"),
]

TYPES = [("kirana", "Kirana / general store", "K"), ("supermarket", "Supermarket / departmental store", "S"),
         ("fruits_vegetables", "Vegetables & fruits shop", "V")]
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
