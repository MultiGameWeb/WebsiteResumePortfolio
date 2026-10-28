# Hand-written (curated) question banks for electronics businesses: mobile
# shop, electronics & home appliances showroom, and computer & laptop shop.
# Run: python3 scripts/curated/electronics.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: P = mobile phone shop, A = appliances & TV showroom, C = computer & laptop shop.
# Each owner is asked only the questions tagged for their business.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, EMI, offers, photos)
# are asked separately, so they are not repeated here.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Products & brands", "M", "list", "Which phone brands do you sell?", "Do you have Samsung phones?", ["Apple", "Samsung", "OnePlus", "Vivo", "Oppo", "Realme", "Redmi / Xiaomi", "Motorola", "Nothing", "Google Pixel"], "P"),
 ("Products & brands", "M", "list", "Which products do you sell?", "Do you sell washing machines?", ["TVs", "Refrigerators", "Washing machines", "ACs", "Microwaves / ovens", "Water purifiers", "Kitchen appliances (mixie, grinder, induction)", "Fans & coolers", "Geysers & room heaters", "Soundbars & home theatres", "Party / Bluetooth speakers", "Personal care (iron box, trimmer, hair dryer)"], "A"),
 ("Products & brands", "M", "list", "Which brands do you sell?", "Do you have LG?", ["Samsung", "LG", "Sony", "Whirlpool", "Godrej", "Haier", "Voltas", "Daikin", "IFB", "Bosch", "Panasonic"], "A"),
 ("Products & brands", "M", "list", "Which products do you sell?", "Do you sell printers?", ["Laptops", "Desktops", "Monitors", "Printers", "Accessories (keyboard, mouse, etc.)", "Hard disks, SSDs & pen drives", "PC parts (graphics cards, RAM, SSD)", "Routers & networking", "CCTV cameras", "Software"], "C"),
 ("Products & brands", "M", "list", "Which laptop and computer brands do you sell?", "Do you have Dell laptops?", ["HP", "Dell", "Lenovo", "Asus", "Acer", "Apple", "MSI"], "C"),
 ("Products & brands", "M", "options", "Are your products brand new and original, with the company's official warranty?", "Is this original with company warranty?", ["All original with brand warranty", "Some imported / without Indian warranty", "We also sell refurbished"], "PAC"),
 ("Products & brands", "I", "options", "Do you sell refurbished or second-hand products?", "Do you have second-hand phones?", ["No, only new", "Refurbished", "Second-hand", "Both"], "PAC"),
 ("Products & brands", "I", "text", "If you sell second-hand or refurbished products, do they come with a bill and a warranty? How long?", "Is there warranty on a used phone?", [], "PAC"),
 ("Products & brands", "I", "options", "Do you sell iPhones, and are they from authorised Indian distribution?", "Is the iPhone Indian warranty?", ["Yes, Indian warranty", "Some imported", "We don't sell iPhones"], "P"),
 ("Products & brands", "I", "options", "Do you get new launches on the launch day, or can customers pre-book them?", "Is the new Samsung available?", ["Available on launch day", "Pre-booking available", "Comes later"], "PAC"),
 ("Products & brands", "I", "text", "If a model is out of stock, how many days does it take to get it?", "When will this model come?", [], "PAC"),
 ("Products & brands", "O", "text", "On which day of the week does new stock usually arrive?", "When will new models come?", [], "PAC"),
 ("Products & brands", "O", "yes_no", "Can customers reserve a product by paying an advance?", "Can you keep one aside for me?", YN, "PAC"),
 ("Products & brands", "I", "list", "Which accessories do you sell?", "Do you have a fast charger?", ["Covers & cases", "Tempered glass", "Chargers & cables", "Earbuds / ANC headphones", "Smartwatches (calling, health tracking)", "Bluetooth speakers", "Power banks", "Memory cards & pen drives"], "PC"),
 ("Products & brands", "I", "options", "Are your accessories original brand products, or compatible ones?", "Is this charger original?", ["Original brand", "Compatible / local", "Both, clearly marked"], "PC"),
 ("Products & brands", "O", "yes_no", "Do you sell energy-saving (5-star, inverter) models?", "Do you have inverter AC?", YN, "A"),
 ("Products & brands", "O", "yes_no", "Do you sell voltage stabilisers for ACs, fridges and TVs?", "Do I need a stabiliser?", YN, "A"),
 ("Products & brands", "O", "options", "Is a stabiliser given free with an AC?", "Will you give a stabiliser with the AC?", ["Free with AC", "Paid", "Not needed for inverter ACs"], "A"),
 ("Products & brands", "O", "yes_no", "Do you have budget laptops for students?", "Any laptop for college under 40,000?", YN, "C"),
 ("Products & brands", "O", "list", "Do you sell SIM cards or do mobile recharges?", "Can I get a new Jio SIM here?", ["Jio", "Airtel", "Vi", "BSNL", "None"], "P"),
 ("Products & brands", "I", "list", "Which phone price ranges do you stock?", "Any good phone under 15,000?", ["Under ₹10,000", "₹10,000–20,000", "₹20,000–30,000", "₹30,000–50,000", "Above ₹50,000"], "P"),
 ("Products & brands", "O", "yes_no", "Do you sell keypad (feature) phones?", "Do you have a basic keypad phone?", YN, "P"),
 ("Products & brands", "O", "yes_no", "Do you sell tablets / iPads?", "Do you have iPads?", YN, "PC"),
 ("Products & brands", "O", "yes_no", "Do you sell gaming accessories (triggers, coolers, controllers)?", "Do you have a phone cooler for gaming?", YN, "PC"),
 ("Products & brands", "I", "list", "Which TV sizes do you stock?", "Do you have a 55-inch TV?", ["32 inch", "43 inch", "50 / 55 inch", "65 inch", "75 inch and above"], "A"),
 ("Products & brands", "I", "list", "Which TV display types do you sell?", "Do you have OLED TVs?", ["LED", "QLED", "OLED", "Smart TVs", "Android / Google TV"], "A"),
 ("Products & brands", "O", "text", "With a smart TV, do you activate any free OTT subscriptions (Netflix, Prime, Hotstar)?", "Will Netflix be free with the TV?", [], "A"),
 ("Products & brands", "I", "list", "Which refrigerator types do you sell?", "Do you have double-door fridges?", ["Single door", "Double door", "Side-by-side", "Mini fridge"], "A"),
 ("Products & brands", "I", "list", "Which washing machine types do you sell?", "Do you have front load machines?", ["Semi-automatic", "Top load", "Front load"], "A"),
 ("Products & brands", "I", "list", "Which AC types do you sell?", "Do you have window ACs?", ["Split", "Window", "Inverter", "Portable"], "A"),
 ("Products & brands", "O", "yes_no", "Do you sell kitchen chimneys and hobs, with installation?", "Do you install chimneys?", YN, "A"),
 ("Products & brands", "O", "yes_no", "Do you sell inverters and batteries for power backup?", "Do you have inverter batteries?", YN, "A"),
 ("Products & brands", "I", "list", "Which laptop configurations do you usually stock?", "Do you have an i5 laptop?", ["Intel i3 / Ryzen 3", "Intel i5 / Ryzen 5", "Intel i7 / Ryzen 7", "Gaming laptops", "MacBooks"], "C"),
 ("Products & brands", "I", "list", "Which software do you sell or install?", "Can you install Tally?", ["Windows", "MS Office", "Antivirus", "Tally", "Adobe", "None"], "C"),
 ("Products & brands", "O", "yes_no", "Do you rent laptops or desktops?", "Can I rent a laptop for a month?", YN, "C"),
 ("Products & brands", "O", "yes_no", "Do you sell ink-tank printers?", "Do you have ink-tank printers?", YN, "C"),
 ("Products & brands", "O", "yes_no", "Do you sell display or open-box pieces at a lower price?", "Do you have any display piece for less?", YN, "PAC"),
 ("Products & brands", "O", "list", "Do you sell smart home and security devices?", "Do you have Alexa?", ["Smart bulbs & plugs", "Alexa / Google Home", "Wi-Fi smart cameras", "Digital door locks", "Video doorbells", "None"], "PAC"),

 ("Prices & bills", "M", "yes_no", "Do you give a GST bill for every product (needed for warranty)?", "Will I get a GST bill?", YN, "PAC"),
 ("Prices & bills", "I", "options", "Is GST included in the price on the tag?", "Is GST extra?", ["Included in the tag price", "Added at billing"], "PAC"),
 ("Prices & bills", "O", "yes_no", "Do you give a B2B GST invoice so business customers can claim input tax credit?", "Can I get a GST invoice with my company GSTIN?", YN, "PAC"),
 ("Prices & bills", "O", "text", "Do you have cashback or bank card offers right now? (Change them any time with Update.)", "Any HDFC card offer?", [], "PAC"),
 ("Prices & bills", "O", "text", "Do you give combo deals when buying two products together (for example TV + sound bar)?", "Any offer if I buy a fridge and washing machine?", [], "PAC"),
 ("Prices & bills", "I", "options", "Are your prices fixed, or can customers get a discount?", "Can you reduce the price?", ["Fixed price", "Small discount possible", "Negotiable"], "PAC"),
 ("Prices & bills", "I", "options", "Do you match online prices (Amazon, Flipkart)?", "It's cheaper on Amazon, can you match?", ["Yes, we match", "Sometimes, depends on the model", "No"], "PAC"),
 ("Prices & bills", "I", "text", "Do you take an old product in exchange when buying a new one? How is its value decided?", "How much will you give for my old phone?", [], "PAC"),
 ("Prices & bills", "O", "yes_no", "Do you take old products in exchange even if they are not working?", "My old TV is dead, will you still exchange it?", YN, "PAC"),
 ("Prices & bills", "O", "list", "Which ways to pay do you accept?", "Can I pay by credit card?", ["Cash", "UPI", "Debit / credit card", "Bank transfer"], "PAC"),
 ("Prices & bills", "O", "options", "Do you add any extra charge for card payments?", "Is there extra charge on card?", ["No extra charge", "Yes, a small percentage"], "PAC"),
 ("Prices & bills", "O", "yes_no", "Can customers pay part in cash and part by card or UPI?", "Can I pay half cash, half card?", YN, "PAC"),
 ("Prices & bills", "O", "yes_no", "If a customer loses the bill, can you print a duplicate using their mobile number or the serial number?", "I lost my bill, can you give a copy?", YN, "PAC"),
 ("Prices & bills", "O", "yes_no", "Do you sell gift vouchers or gift cards?", "Can I buy a gift card?", YN, "PAC"),
 ("Prices & bills", "O", "text", "Do you run lucky draws or prize contests during festivals?", "Is there a Diwali lucky draw?", [], "PAC"),
 ("Prices & bills", "O", "text", "Do you give free gifts or accessories with purchases?", "Any free gift with this TV?", [], "PAC"),
 ("Prices & bills", "O", "text", "Do you give discounts for bulk, corporate or student purchases?", "Any discount for 10 laptops?", [], "PAC"),

 ("Buying & checking", "I", "yes_no", "Do you have demo pieces customers can try before buying?", "Can I try the phone first?", YN, "PAC"),
 ("Buying & checking", "I", "yes_no", "Do you open and check the product in front of the customer before billing?", "Will you open the box and check?", YN, "PAC"),
 ("Buying & checking", "O", "yes_no", "Do you have a demo area to watch TVs and listen to sound systems?", "Can I see the TV picture quality?", YN, "A"),
 ("Buying & checking", "I", "yes_no", "Do you transfer data from the old phone and set up the new phone for free?", "Will you move my WhatsApp and photos?", YN, "P"),
 ("Buying & checking", "I", "options", "Do you put on a tempered glass and cover when someone buys a phone?", "Is screen guard free?", ["Free", "Paid", "Not available"], "P"),

 ("Delivery & installation", "I", "text", "Is installation free? For which products is it charged?", "Is AC installation free?", [], "A"),
 ("Delivery & installation", "I", "text", "For AC installation, are copper pipe, stand and extra piping charged extra? How much?", "Is extra pipe charged?", [], "A"),
 ("Delivery & installation", "I", "text", "How many days after purchase are delivery and installation done?", "When will you install it?", [], "A"),
 ("Delivery & installation", "I", "yes_no", "Is delivery of big appliances free, and do you carry them up to upper floors?", "Will you carry the fridge to the 3rd floor?", YN, "A"),
 ("Delivery & installation", "O", "yes_no", "Do you take away the old appliance when delivering the new one?", "Will you take my old fridge?", YN, "A"),
 ("Delivery & installation", "O", "options", "If a product gets damaged during delivery, who covers it?", "What if the TV breaks on the way?", ["We replace it", "Covered by transit insurance", "Customer checks before accepting"], "A"),
 ("Delivery & installation", "O", "options", "Do customers need to pay or tip the delivery and loading staff?", "Do I have to pay the delivery boys?", ["Nothing extra", "Tip is optional", "Loading charge for upper floors"], "A"),
 ("Delivery & installation", "O", "yes_no", "Do you send the delivery person's number or a tracking link when the product leaves the shop?", "Where is my delivery?", YN, "A"),
 ("Delivery & installation", "O", "text", "If a product breaks during delivery, how many days does it take to give a new one?", "When will I get a new TV?", [], "A"),
 ("Delivery & installation", "O", "text", "Do you provide a TV wall mount and fitting? Price?", "Is wall mounting free?", [], "A"),
 ("Delivery & installation", "O", "yes_no", "Do you show how to use the appliance at installation?", "Will you show how to use it?", YN, "A"),
 ("Delivery & installation", "I", "text", "Do you install Windows and MS Office? Is the licence genuine, and is it charged?", "Will Windows be installed?", [], "C"),
 ("Delivery & installation", "O", "text", "Do you send a technician to install CCTV cameras and Wi-Fi networks at homes and offices? What is the charge?", "Can you install CCTV at my house? How much?", [], "C"),

 ("Warranty & service", "M", "options", "What happens if a product is defective on the first day (dead on arrival)?", "The phone is not working on day one!", ["We replace it", "We send it to the company service centre", "Depends on the brand"], "PAC"),
 ("Warranty & service", "I", "text", "Within how many days of purchase can a defective product be replaced?", "Can I replace it after 3 days?", [], "PAC"),
 ("Warranty & service", "I", "text", "How many years of company warranty do your main products have (for example TV panel, fridge compressor, phone)?", "How many years warranty on this fridge?", [], "PAC"),
 ("Warranty & service", "I", "options", "During warranty, does the customer bring the product to you, or does the company technician visit the home?", "Will the technician come home for warranty repair?", ["Technician visits home", "Bring it to the shop / service centre", "Depends on the product"], "PAC"),
 ("Warranty & service", "I", "yes_no", "Do you help customers with warranty claims and service centre visits?", "Will you help with the warranty claim?", YN, "PAC"),
 ("Warranty & service", "O", "text", "Where are the nearest authorised service centres for the brands you sell?", "Where is the Samsung service centre?", [], "PAC"),
 ("Warranty & service", "I", "text", "Do you sell extended warranty or protection plans? Price?", "Can I get extra warranty?", [], "PAC"),
 ("Warranty & service", "O", "yes_no", "Do you sell insurance for theft or accidental damage?", "Is there screen damage insurance?", YN, "PAC"),
 ("Warranty & service", "I", "list", "Do you repair phones? Which repairs?", "Can you change my phone screen?", ["Screen", "Battery", "Charging port", "Speaker / mic", "Water damage", "Software / unlocking", "No repairs"], "P"),
 ("Warranty & service", "I", "list", "Do you repair laptops and computers? Which problems?", "My laptop is not starting, can you fix it?", ["Hardware", "Screen", "Keyboard", "Battery", "Software / virus", "Data recovery", "No repairs"], "C"),
 ("Warranty & service", "O", "options", "Do you repair or service appliances, or only through the brand's service?", "Can you repair my washing machine?", ["We repair", "Only brand service", "Both"], "A"),
 ("Warranty & service", "O", "text", "For small appliances (mixie, grinder, juicer, induction), do you give your own replacement warranty?", "If the mixie stops working, will you replace it?", [], "A"),
 ("Warranty & service", "I", "options", "For repairs, do you use original or compatible parts?", "Is the new screen original?", ["Original parts", "Compatible parts", "Customer's choice"], "PC"),
 ("Warranty & service", "I", "text", "Do you give a warranty on repairs? How long?", "Is there warranty on the repair?", [], "PC"),
 ("Warranty & service", "O", "text", "How long does a common repair (screen, battery) usually take?", "How long to change the screen?", [], "PC"),
 ("Warranty & service", "I", "text", "Is there a checking (diagnosis) charge if the customer decides not to repair?", "Do you charge just to check it?", [], "PC"),
 ("Warranty & service", "O", "yes_no", "Do you pick up and drop devices for repair?", "Can you collect my laptop for repair?", YN, "PC"),
 ("Warranty & service", "O", "yes_no", "Do you give a spare phone to use while the customer's phone is being repaired?", "Can I get a phone while mine is repaired?", YN, "P"),
 ("Warranty & service", "O", "text", "Do you visit homes or offices for service? What is the visit charge?", "Can someone come to my office?", [], "C"),
 ("Warranty & service", "I", "yes_no", "Do you do AC servicing and gas refilling?", "Can you service my AC?", YN, "A"),
 ("Warranty & service", "O", "yes_no", "Do you offer yearly service plans for ACs and water purifiers?", "Is there an AC service plan?", YN, "A"),
 ("Warranty & service", "O", "yes_no", "Do you upgrade RAM and SSD?", "Can you add more RAM?", YN, "C"),
 ("Warranty & service", "O", "yes_no", "Do you assemble custom or gaming desktops?", "Can you build a gaming PC?", YN, "C"),
 ("Warranty & service", "O", "yes_no", "Do you sell and refill printer cartridges?", "Do you refill ink cartridges?", YN, "C"),
 ("Warranty & service", "O", "yes_no", "Do you offer annual maintenance (AMC) for offices?", "Do you do AMC for offices?", YN, "C"),

 ("Shop & service", "O", "yes_no", "Do you take old electronics for safe recycling (e-waste)?", "Can I give my old phone for recycling?", YN, "PAC"),
 ("Shop & service", "O", "yes_no", "Do you have an online store or a WhatsApp catalogue?", "Can I see your products online?", YN, "PAC"),
 ("Shop & service", "O", "yes_no", "Do you send a copy of the bill on WhatsApp?", "Can you send the bill on WhatsApp?", YN, "PAC"),
 ("Shop & service", "O", "text", "Is there a separate number for complaints (product problems or late delivery)?", "Whom do I call to complain?", [], "PAC"),
 ("Shop & service", "O", "text", "Do you have other branches in the city? Can warranty service be done at any branch?", "Do you have a branch in Kukatpally?", [], "PAC"),

 ("Finance & loans", "I", "price", "What is the minimum bill amount for buying on a loan / finance?", "Can I take a loan for a ₹6,000 phone?", [], "PAC"),
 ("Finance & loans", "I", "text", "How much down payment is usually needed (percentage of the price)?", "How much do I pay first?", [], "PAC"),
 ("Finance & loans", "I", "text", "What processing fee or file charge do finance companies take?", "Is there a processing fee?", [], "PAC"),
 ("Finance & loans", "O", "yes_no", "Can customers without a credit or debit card get an instant consumer loan with just Aadhaar?", "I don't have a card, can I still get a loan?", YN, "PAC"),
 ("Finance & loans", "O", "text", "What minimum CIBIL score do finance companies usually need?", "Will I get a loan with a low CIBIL score?", [], "PAC"),
 ("Finance & loans", "O", "text", "What income proof do self-employed people or farmers need for a loan?", "I'm a farmer, can I get a loan?", [], "PAC"),
 ("Finance & loans", "O", "text", "How long does loan approval usually take in the shop?", "How long will the loan approval take?", [], "PAC"),
 ("Finance & loans", "O", "text", "Is there a penalty for paying off the loan early (foreclosure)?", "Can I close the loan early?", [], "PAC"),
 ("Shop & service", "O", "yes_no", "Do you bring products home for a demo before buying?", "Can you show the TV at my home?", YN, "A"),
 ("Shop & service", "O", "yes_no", "Do you have a loyalty or points programme for regular customers?", "Do I get points?", YN, "PAC"),
 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "PAC"),
 ("Shop & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "PAC"),
]

TYPES = [("mobile_shop", "Mobile shop", "P"), ("appliances_showroom", "Electronics & home appliances showroom", "A"),
         ("computer_shop", "Computer & laptop shop", "C")]
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
