# Hand-written (curated) question banks for meat shops: chicken, mutton, fish &
# seafood, and all three together.
# Run: python3 scripts/curated/meat.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: C = chicken (and eggs, quail), M = mutton, F = fish & seafood. The meat
# shop type gets every question.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, offers, photos, Wi-Fi)
# are asked separately. Payment methods are not asked.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Today's rates", "M", "text", "What are today's chicken rates (skinless, with skin, live bird, country chicken)? (Update them any time.)", "Chicken rate today?", [], "C"),
 ("Today's rates", "M", "text", "What are today's mutton rates (with bone, boneless)? (Update them any time.)", "Mutton rate today?", [], "M"),
 ("Today's rates", "M", "text", "Which fish, prawns and crabs came today, and at what rates (before and after cleaning)? (Update them any time.)", "Which fish came today?", [], "F"),
 ("Today's rates", "O", "text", "Do you sell quail, duck or rabbit? At what price?", "Do you have quail?", [], "C"),
 ("Today's rates", "O", "text", "What do eggs cost (white, country eggs; dozen and tray), and are your country eggs genuine?", "Egg tray rate?", [], "C"),
 ("Today's rates", "O", "text", "Which meats do you sell, and are knives and chopping blocks kept separate for each?", "Do you sell only chicken and mutton?", [], "CMF"),

 ("Freshness & trust", "I", "yes_no", "Is all meat cut fresh the same day, never mixed with frozen or leftover meat, and never water-injected or soaked?", "Is this fresh?", YN, "CMF"),
 ("Freshness & trust", "I", "text", "What do you sell as mutton (male goat, female goat, sheep), and is it stamped by the municipality?", "Is this male goat meat?", [], "M"),
 ("Freshness & trust", "O", "text", "How young are your goats, and what do you tell customers about cooking time?", "Is the mutton tender?", [], "M"),
 ("Freshness & trust", "I", "options", "How do you sell chicken?", "Will you cut a live bird in front of me?", ["Live bird cut in front of the customer", "Ready dressed chicken", "Both"], "C"),
 ("Freshness & trust", "O", "text", "Is your country chicken real free-range natu kodi, or Giriraja / Vanaraja / cross breeds (clearly told)? Do you have Kadaknath, and hens or roosters as the customer wants?", "Is this real natu kodi?", [], "C"),
 ("Freshness & trust", "I", "text", "Is your fish live or on ice, from ponds, rivers or the sea, and free of formalin?", "Is this river fish?", [], "F"),
 ("Freshness & trust", "I", "yes_no", "Is your scale electronic, stamped by Legal Metrology, visible to customers and set to zero in front of them?", "Is your weighing correct?", YN, "CMF"),
 ("Freshness & trust", "O", "text", "Where do your birds come from, and do you sell antibiotic-free chicken?", "Is this chicken antibiotic free?", [], "C"),
 ("Freshness & trust", "O", "yes_no", "Is your shop FSSAI-registered?", "Is your shop FSSAI registered?", YN, "CMF"),

 ("Cuts", "I", "list", "Which chicken cuts do you do?", "Can you do biryani cut?", ["Curry cut", "Small fry cut", "Biryani cut (big pieces)", "Tandoori full bird / 4-piece", "Boneless", "Lollipops", "Wings", "Drumsticks", "Lean breast fillets (steak / butterfly cut)", "Keema (machine or hand-chopped)"], "C"),
 ("Cuts", "I", "list", "Which mutton cuts do you do?", "Do you have nalli bones?", ["Curry cut", "Raan (leg)", "Chops / ribs", "Nalli (marrow bones)", "Seena", "Boneless (for haleem)", "Soup bones only", "Keema (machine or hand-chopped)"], "M"),
 ("Cuts", "O", "text", "What do special cuts cost (boneless, lollipops, wings, keema)?", "How much is boneless chicken?", [], "CM"),
 ("Cuts", "I", "list", "How do you cut and clean fish?", "Can you cut fry slices?", ["Round curry slices", "Fillets", "Thin fry slices", "Head cleaned without breaking the bile", "Roe kept for the customer", "Washed with salt & turmeric", "Murrel skinned or with skin", "Crabs cleaned with shells cracked"], "F"),
 ("Cuts", "O", "text", "What count per kg are your prawns, do you peel them (tail on or off) and remove the black vein, and do you weigh fish and prawns after cleaning and without ice or water?", "What count are these prawns?", [], "F"),
 ("Cuts", "O", "text", "Which fish have few small bones (for children and elders)?", "Which fish has no small bones?", [], "F"),
 ("Cuts", "O", "text", "Which dry fish do you sell (anchovies, dry prawns, salted seer), and are they cleaned of sand?", "Do you have dry fish?", [], "F"),

 ("Weight & wastage", "I", "text", "How much meat does a live bird give after cleaning, and do you show the live weight on the scale?", "How much meat from a 2 kg bird?", [], "C"),
 ("Weight & wastage", "I", "yes_no", "Do you weigh and pack only the pieces the customer chose, adding neck, gizzard, liver or backbone only if they ask?", "Don't put neck pieces in my kilo", YN, "C"),
 ("Weight & wastage", "I", "yes_no", "Do you trim extra fat and avoid heavy bones in mutton weight?", "Please don't add too much fat", YN, "M"),

 ("Other parts", "O", "text", "What do head, paya, boti (with tripe), brain, liver, kapura, lungs and blood cost? Do you singe and clean them (boti turned inside out), and should they be booked early?", "How much is talakaya?", [], "M"),
 ("Other parts", "O", "yes_no", "Do you roast country chicken with turmeric on the flame before cutting?", "Can you roast the natu kodi?", YN, "C"),
 ("Other parts", "O", "text", "Do you sell chicken feet, heads or scraps for pet dogs? At what price?", "Do you have chicken waste for my dog?", [], "CM"),

 ("Halal & hygiene", "I", "options", "Is your meat halal or jhatka?", "Is it halal?", ["Halal", "Jhatka", "Both, as the customer asks"], "CM"),
 ("Halal & hygiene", "I", "text", "How do you keep the shop clean (blocks and knives washed, glass enclosure, no flies, gloves)?", "Is the shop clean?", [], "CMF"),

 ("Orders & delivery", "I", "text", "For home delivery, what is the minimum order, the charge and the usual time?", "Can you deliver 1 kg?", [], "CMF"),
 ("Orders & delivery", "I", "yes_no", "Can customers pre-order on WhatsApp (for example on Saturday night) and collect their packed order on Sunday morning without waiting?", "Can I book for Sunday morning?", YN, "CMF"),
 ("Orders & delivery", "I", "text", "For functions and bulk orders, what wholesale rates do you give, and can you deliver early in the morning?", "Rate for 50 kg chicken for a wedding?", [], "CMF"),
 ("Orders & delivery", "O", "text", "If customers bring their own birds or goats (functions, temple offerings), what do you charge for cleaning, singeing and cutting, and is the skin adjusted?", "How much to clean and cut our offering rooster?", [], "CM"),
 ("Orders & delivery", "O", "text", "Do you supply birds or goats for temple offerings (for example a pure black rooster)?", "Do you have a black rooster for the jatara?", [], "CM"),
 ("Orders & delivery", "O", "text", "Do you give monthly packs (for example daily chicken breast for gym-goers) at a lower rate?", "Can I get 250 g breast daily for a month?", [], "C"),
 ("Orders & delivery", "O", "text", "Do you supply restaurants and fast-food centres daily (rate below the market paper rate, weekly settlement)?", "Can you supply 20 kg chicken daily to my hotel?", [], "CMF"),
 ("Orders & delivery", "O", "text", "Do you pack for long travel (thermocol box with ice packs)? At what charge?", "Can you pack this for the bus to Bangalore?", [], "CMF"),
 ("Orders & delivery", "O", "yes_no", "Do you pack in food-grade boxes, or in the customer's own vessel?", "Can you put it in my steel box?", YN, "CMF"),
 ("Orders & delivery", "O", "list", "Which ready-to-cook items do you sell?", "Do you have marinated chicken?", ["Ginger-garlic paste", "Meat masalas", "Marinated chicken / fish", "Kebabs", "Boneless thighs (shawarma)", "Sausages, salami & burger patties", "Frozen items"], "CMF"),
 ("Orders & delivery", "O", "text", "What are your timings on festivals (Kanuma, Bakrid, Bonalu, after Karthika masam), do you prepare early-morning orders for ceremonies, and are you closed on any days?", "Will the shop open early on Kanuma?", [], "CMF"),
 ("Orders & delivery", "O", "text", "If a customer finds the meat not fresh or not tender, what do you do?", "The mutton didn't cook at all, what now?", [], "CMF"),

 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "CMF"),
 ("Shop & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "CMF"),
]

TYPES = [("chicken_shop", "Chicken shop", "C"), ("mutton_shop", "Mutton shop", "M"),
         ("fish_shop", "Fish & seafood shop", "F"), ("meat_shop", "Meat shop (chicken, mutton & fish)", "CMF")]
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
