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
 ("Products & brands", "M", "list", "Which items do you sell?", "Do you have rice and dal?", ["Rice, atta & grains", "Dal & pulses", "Oil & ghee", "Spices & masalas", "Tea, coffee & sugar", "Snacks & biscuits", "Soaps, shampoo & personal care (sanitary pads, shaving)", "Cleaning items (detergent, floor cleaner)", "Pooja items", "Dry fruits", "Baby care (diapers, baby soap, baby food)", "Household & kitchen items (brooms, buckets, containers, scrubbers)", "Candles, matchboxes & batteries", "Disposables (plates, glasses, foil, cling wrap, garbage bags)"], "KS"),
 ("Products & brands", "M", "list", "What else does your store have?", "Do you sell vegetables too?", ["Vegetables & fruits", "Dairy (milk, curd, paneer, butter, cheese)", "Bakery (bread, cakes)", "Frozen foods & ice cream", "Meat & eggs", "Household & kitchenware", "Stationery", "Baby care", "Pet food", "Beverages & juices"], "S"),
 ("Products & brands", "M", "list", "What do you sell?", "Do you have fruits?", ["Daily vegetables", "Leafy greens (aaku kooralu)", "Fruits", "Exotic vegetables & fruits (broccoli, avocado…)", "Coconuts", "Flowers", "Fruit gift baskets", "Cut / cleaned vegetables"], "V"),
 ("Products & brands", "I", "options", "Do you sell loose items (by weight) or only packed items?", "Do you sell loose rice?", ["Loose and packed", "Only packed", "Mostly loose"], "KS"),
 ("Products & brands", "I", "text", "Which rice varieties and brands, and which oil, ghee and dal brands do you keep (for example Sona Masoori, BPT, basmati, Freedom, Fortune)?", "Do you have Sona Masoori?", [], "KS"),
 ("Products & brands", "O", "yes_no", "Do you keep organic or natural products (organic and unpolished dals, wood-pressed / ganuga groundnut, sesame and coconut oil, millets)?", "Do you have ganuga oil?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you sell millets (jowar, ragi, korralu) and millet products?", "Do you have ragi?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you have your own store brand or home-made items (pickles, podis, mill-ground turmeric / chilli / coriander powder, appadalu, vadiyalu)?", "Do you have home-made pickles?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you sell items in bulk for functions and hotels (for example 25 kg rice bags, oil tins), at a lower rate than loose?", "Is a 25 kg rice bag cheaper?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you sell imported or premium brands?", "Do you have imported chocolates?", YN, "S*"),
 ("Products & brands", "O", "yes_no", "Do you sell gas cylinders, kerosene or charcoal?", "Do you have gas?", YN, "K"),
 ("Products & brands", "O", "yes_no", "Do you take mobile recharges, bill payments or sell SIM cards?", "Can I recharge my phone here?", YN, "K"),
 ("Products & brands", "O", "yes_no", "Do you sell fresh milk packets and curd every morning? From what time?", "When does milk come?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you keep health foods (oats, olive oil, green tea, brown rice, flax / chia / pumpkin seeds, sugar-free and diabetic-friendly items)?", "Do you have sugar-free biscuits?", YN, "KS"),
 ("Products & brands", "O", "text", "Do you keep old (aged) rice, for example 1-year-old Sona Masoori, HMT or Jai Sri Ram?", "Is this old rice?", [], "KS"),
 ("Products & brands", "O", "yes_no", "Before a 25 kg rice bag, can customers take a 1 kg sample to check how it cooks?", "Can I try 1 kg first?", YN, "KS"),
 ("Products & brands", "O", "text", "If a rice bag cooks badly or has insects, do you exchange it?", "The rice is sticky, can I change the bag?", [], "KS"),
 ("Products & brands", "O", "yes_no", "Are your dry fruits fresh and premium grade (not old stock)?", "Are the cashews fresh?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you keep fresh batches of flours (idli rava, atta, besan, ragi, jowar)?", "Is the ragi flour fresh?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you sell palm jaggery, organic jaggery powder and pink / rock salt?", "Do you have palm jaggery?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you sell baking supplies (cocoa, baking powder, essence, yeast, choco chips)?", "Do you have baking powder?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you sell seedless new tamarind and old tamarind by the kg?", "Do you have new tamarind?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "In season, do you sell an avakaya (mango pickle) kit (rock salt, mustard and fenugreek powder, chilli powder, groundnut oil)?", "Do you have an avakaya kit?", YN, "KS"),
 ("Products & brands", "O", "text", "Do you bring seasonal items (Ramzan: haleem rava, semiya, dates; Sankranti: sesame, new jaggery)?", "Do you have haleem rava?", [], "KS"),
 ("Products & brands", "O", "text", "Is your honey and cow ghee pure? Which brands or farm-fresh options do you have?", "Is this honey pure?", [], "KS"),
 ("Products & brands", "O", "yes_no", "Do you make ration kit boxes for charity or ashrams (for example ₹500 or ₹1,000)?", "Can you make 50 ration kits?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you sell festival pooja kits or vratham / deeksha kits (turmeric, kumkum, thoranalu, lamp oil, Ayyappa irumudi items)?", "Do you have a Varalakshmi pooja kit?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you sell water bottles and 20-litre water cans?", "Do you have a 20 litre can?", YN, "KS"),
 ("Products & brands", "O", "yes_no", "Do you sell ice cubes packets for parties?", "Do you have ice cubes?", YN, "KS"),
 ("Products & brands", "O", "text", "Do you sell eggs (normal, brown, country / natu kodi)? Fresh daily? A tray of 30 at a lower rate? Do you replace a bad egg?", "Are the eggs fresh?", [], "KS"),
 ("Products & brands", "O", "yes_no", "Do you sell pet shampoos, belts and accessories?", "Do you have dog belts?", YN, "S*"),
 ("Products & brands", "I", "text", "Which fruits and vegetables come from local farms, and which come from outside (for example apples, kiwi)?", "Are these local vegetables?", [], "V"),
 ("Products & brands", "O", "text", "Which seasonal fruits do you sell in bulk (for example mangoes, watermelons, lemons in summer)?", "Do you have mangoes in bulk?", [], "SV"),
 ("Products & brands", "O", "yes_no", "Do you sell organic vegetables and fruits?", "Are these organic?", YN, "SV"),

 ("Prices & billing", "I", "options", "How should customers get today's prices?", "What is the rate of tomato today?", ["I'll update prices with Update", "Prices are on the board in the shop", "Customers should call or WhatsApp"], "V"),
 ("Prices & billing", "I", "options", "Do you sell at MRP or below MRP?", "Do you give discount on MRP?", ["At MRP", "Below MRP on many items", "Depends on the item"], "KS"),
 ("Prices & billing", "I", "yes_no", "Do you give a printed / computer bill showing each item's MRP and your discount?", "Will I get a bill?", YN, "KS"),
 ("Prices & billing", "O", "text", "Do you give lower rates for bulk or wholesale buying, or when apartment families order together? From what quantity?", "Any wholesale rate?", [], "KSV"),
 ("Prices & billing", "O", "yes_no", "Do you allow monthly credit (khata / udhaar) for regular customers?", "Can I pay at the end of the month?", YN, "KV"),
 ("Prices & billing", "O", "yes_no", "Can customers order their monthly grocery list (sarukulu) at once and collect or get it delivered? Any extra discount on it?", "Can I give my monthly list?", YN, "KS"),
 ("Prices & billing", "O", "text", "What is the price range for fruit baskets or gift hampers?", "How much for a fruit basket?", [], "VS"),
 ("Prices & billing", "O", "text", "On which days do you have weekly or festival offers and combo deals (for example Wednesday vegetables, weekend sale)?", "Which day is the offer?", [], "KSV"),
 ("Prices & billing", "O", "options", "Is GST included in your prices or added on the bill for some items?", "Is GST extra?", ["Included", "Added on some items", "No GST"], "KS"),
 ("Prices & billing", "O", "options", "If you have no change, what do you do?", "Will you give chocolates instead of change?", ["Take the exact amount by UPI", "Give change later / note it", "Give small items (chocolates)"], "KS"),
 ("Prices & billing", "O", "text", "If there is a billing mistake (for example an item scanned twice), who corrects it and refunds at once?", "I was billed twice, who do I tell?", [], "S"),
 ("Prices & billing", "O", "yes_no", "Do you accept food coupons or company meal cards (Sodexo / Pluxee)?", "Can I use Sodexo here?", YN, "S*"),

 ("Freshness & quality", "I", "text", "On which days and at what time does fresh stock (vegetables, fruits, milk, bread) arrive?", "When do fresh vegetables come?", [], "SV"),
 ("Freshness & quality", "I", "yes_no", "Do you check expiry dates and remove expired items from the shelves?", "Are these items fresh?", YN, "KS"),
 ("Freshness & quality", "O", "text", "If a customer gets a damaged, leaking, spoiled or expired item (or wrong MFG date), what do you do, and within how many days?", "The packet was leaking, can I change it?", [], "KSV"),
 ("Freshness & quality", "O", "yes_no", "Can customers see and choose vegetables, fruits and loose grains themselves before packing?", "Can I select the tomatoes myself?", YN, "KSV"),
 ("Freshness & quality", "O", "yes_no", "Are your fruits ripened naturally (no carbide)?", "Are these mangoes naturally ripened?", YN, "V"),
 ("Freshness & quality", "O", "yes_no", "Do you have cold storage or fridges for vegetables, dairy and frozen items?", "Is the milk kept in the fridge?", YN, "SV"),
 ("Freshness & quality", "O", "yes_no", "Are your weighing scales electronic and checked (stamped) regularly?", "Is your weighing machine correct?", YN, "KSV"),
 ("Freshness & quality", "O", "yes_no", "When weighing loose items, do you deduct the weight of the cover or container?", "Is the cover weight counted?", YN, "KSV"),
 ("Freshness & quality", "O", "text", "How do you keep stock safe from moisture, rats and insects (storage, pest control)?", "Will the sugar get wet in the rain?", [], "KS"),
 ("Freshness & quality", "O", "yes_no", "Do you sell cleaned (sortex) rice, dal and sugar without dust and stones?", "Is this dal cleaned?", YN, "KS"),

 ("Ordering & delivery", "I", "options", "How can customers order for home delivery?", "Can I order on WhatsApp?", ["Call", "WhatsApp (send list or photo)", "Own app / website", "Swiggy Instamart / Zepto / BigBasket / other apps", "No home delivery"], "KSV"),
 ("Ordering & delivery", "I", "text", "What is the minimum order for free home delivery, and the delivery charge below it?", "Is delivery free?", [], "KSV"),
 ("Ordering & delivery", "I", "text", "How quickly do you deliver (for example within 1 hour, same day), and up to what distance?", "How fast will you deliver?", [], "KSV"),
 ("Ordering & delivery", "I", "text", "If a delivered item is missing, damaged or broken (for example a glass jar), do you replace it or refund?", "The jam bottle came broken, will you replace it?", [], "KSV"),
 ("Ordering & delivery", "O", "text", "After a function, do you take back unused sealed items (oil tins, rice bags) and refund?", "Can I return unused oil tins?", [], "KS"),
 ("Ordering & delivery", "O", "yes_no", "If customers shop in the store, can you send the heavy items to their home?", "Can you send these bags home?", YN, "KS"),
 ("Ordering & delivery", "O", "yes_no", "Can customers bring dry chillies or coriander to get them ground at a mill through you?", "Can you get my chillies ground?", YN, "KS"),
 ("Ordering & delivery", "O", "yes_no", "Do your delivery staff bring items to the door (inside apartments)?", "Will you deliver to my flat door?", YN, "KSV"),
 ("Ordering & delivery", "O", "yes_no", "Can customers pay on delivery (cash or UPI)?", "Can I pay when it comes?", YN, "KSV"),
 ("Ordering & delivery", "O", "yes_no", "Do you take daily or weekly fixed orders (for example milk and vegetables every morning)?", "Can you send vegetables every morning?", YN, "SV"),
 ("Ordering & delivery", "O", "yes_no", "Do you supply to hotels, tiffin centres, hostels, caterers or functions, with wholesale rates, GST bills and free transport?", "Do you supply for functions?", YN, "KSV"),
 ("Ordering & delivery", "O", "yes_no", "Can customers call or WhatsApp to keep items packed and ready for pickup?", "Can you pack my items, I'll collect?", YN, "KSV"),
 ("Ordering & delivery", "O", "yes_no", "If an item is not available, will you get it within a day or two?", "Can you get this for me tomorrow?", YN, "KS"),

 ("Shop & service", "O", "yes_no", "Do you have trolleys and baskets for customers?", "Is there a trolley?", YN, "S"),
 ("Shop & service", "O", "options", "Are carry bags free, or charged on the bill? Can customers bring their own bags?", "Do I have to pay for the bag?", ["Free paper / cloth bag or carton", "Free plastic bag", "Charged (₹5–10)", "Bring your own bag"], "KSV"),
 ("Shop & service", "O", "yes_no", "Do you have boards showing which items are in which aisle?", "Where is the oil section?", YN, "S"),
 ("Shop & service", "O", "yes_no", "Do staff help elderly or pregnant customers, and carry bags or trolleys to their vehicle?", "Can someone carry this to my auto?", YN, "KS"),
 ("Shop & service", "O", "yes_no", "Is the store air-conditioned?", "Is it AC?", YN, "S"),
 ("Shop & service", "O", "text", "How many billing counters do you have, do you open extra counters at busy times, and how long is the queue?", "Is there a long queue in the evening?", [], "S*"),
 ("Shop & service", "O", "text", "Do you have a loyalty card or points? Is joining free (with a mobile number), and can points be used on the next bill?", "Do I get points?", [], "KSV"),
 ("Shop & service", "O", "yes_no", "Do you sell gift vouchers or festival gift boxes (dry fruits, chocolates)?", "Do you have Diwali gift boxes?", YN, "KS"),
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
