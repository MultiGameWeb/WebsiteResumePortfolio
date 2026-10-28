# Hand-written (curated) question bank for restaurants.
# Run: python3 scripts/curated/restaurant.py  -> writes botcraft-banks/restaurant.json
# Priorities: M = mandatory (bot cannot work without it), I = important, O = optional.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, home delivery, offers, photos) are asked separately.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options
 ("Menu & cuisine", "M", "list", "Which cuisines do you serve?", "What kind of food do you have?", ["South Indian", "North Indian", "Andhra", "Hyderabadi", "Chinese / Indo-Chinese", "Tandoor", "Fast food", "Continental"]),
 ("Menu & cuisine", "M", "options", "Is your restaurant pure veg, or do you serve both veg and non-veg?", "Is this a veg restaurant?", ["Pure veg", "Veg and non-veg", "Mostly non-veg"]),
 ("Menu & cuisine", "M", "list", "What are your top 5 signature or best-selling dishes?", "What is your speciality?", []),
 ("Menu & cuisine", "M", "image", "Please send photos of your full menu card (all pages).", "Can I see the menu?", []),
 ("Menu & cuisine", "I", "text", "Which dishes do you recommend for someone visiting for the first time?", "What should I try first?", []),
  ("Menu & cuisine", "I", "text", "What is today's special? (You can change it every day with Update.)", "What is today's special?", []),
 ("Menu & cuisine", "I", "text", "Which are your best veg and non-veg starters?", "Which veg starter is best here?", []),
 ("Menu & cuisine", "I", "list", "Apart from chicken, mutton and seafood, do you serve special meats (natu kodi, duck, quail, crab, etc.)?", "Do you have natu kodi?", ["Natu kodi (country chicken)", "Duck", "Quail (kamju)", "Crab", "Rabbit", "None"]),
 ("Menu & cuisine", "O", "yes_no", "Do you have separate menu cards for veg and non-veg?", "Is there a separate veg menu?", YN),
 ("Menu & cuisine", "O", "yes_no", "Do you have special pure-veg combos or thalis for vegetarians?", "Any veg combo?", YN),
 ("Menu & cuisine", "I", "yes_no", "Do you serve breakfast?", "Is breakfast available?", YN),
 ("Menu & cuisine", "I", "text", "At what times are breakfast, lunch and dinner served?", "What time does lunch start?", []),
 ("Menu & cuisine", "I", "options", "Do you serve meals / thali?", "Do you have meals?", ["Yes, unlimited meals", "Yes, limited meals", "Both", "No"]),
 ("Menu & cuisine", "I", "text", "What comes in your meals / thali, and what is the price?", "What's in the thali and how much?", []),
 ("Menu & cuisine", "I", "list", "Which rice items do you serve (biryani, fried rice, pulao, curd rice, etc.)?", "Which biryanis do you have?", []),
 ("Menu & cuisine", "I", "yes_no", "Do you serve tandoor items (rotis, naan, kebabs, tikkas)?", "Do you have tandoori roti?", YN),
 ("Menu & cuisine", "O", "text", "At what time does the tandoor start in the evening?", "Is tandoor available now?", []),
 ("Menu & cuisine", "I", "options", "Is the full menu available all day, or are some items only at certain times?", "Can I get biryani in the morning?", ["Full menu all day", "Some items only at certain times"]),
 ("Menu & cuisine", "I", "text", "Do you have dishes available only on certain days (for example Sunday special, Friday haleem)?", "Any special dish today?", []),
 ("Menu & cuisine", "O", "text", "Do you have seasonal specials (for example haleem in Ramzan, mango dishes in summer)?", "Do you have haleem?", []),
 ("Menu & cuisine", "O", "yes_no", "Do you have a kids' menu or dishes that are good for small children?", "What can my kids eat here?", YN),
 ("Menu & cuisine", "O", "text", "Which items usually finish early in the day?", "Is mutton biryani still available?", []),
 ("Menu & cuisine", "O", "text", "Which dishes are most popular with families and groups?", "What's good for a family of five?", []),

 ("Veg / non-veg & diet", "M", "options", "If you serve non-veg, how do you keep veg food separate?", "Is veg food cooked separately?", ["Separate kitchen", "Separate utensils and cooking area", "Same kitchen", "Pure veg (not applicable)"]),
 ("Veg / non-veg & diet", "I", "options", "Is your meat halal?", "Is the chicken halal?", ["Yes, all halal", "Some items", "No", "Pure veg (not applicable)"]),
 ("Veg / non-veg & diet", "I", "options", "Do you serve egg dishes, and are they marked on the menu?", "Does this dish have egg?", ["No egg dishes", "Yes, marked on the menu", "Yes, not marked"]),
 ("Veg / non-veg & diet", "I", "yes_no", "Do you have Jain food, or can you cook without onion and garlic on request?", "Can you make it without onion and garlic?", YN),
 ("Veg / non-veg & diet", "I", "yes_no", "Can you reduce oil or salt in a dish on request?", "Can you make it with less oil?", YN),
 ("Veg / non-veg & diet", "I", "options", "Which oil do you mainly cook with?", "Which oil do you use?", ["Sunflower", "Groundnut", "Rice bran", "Palm", "Mixed"]),
  ("Veg / non-veg & diet", "I", "options", "Do you make your own masalas, or use ready-made / branded masalas?", "Are the masalas homemade?", ["Homemade masalas", "Branded masalas", "Both"]),
 ("Veg / non-veg & diet", "O", "text", "Which dishes are made with pure ghee?", "Is the biryani made with ghee?", []),
 ("Veg / non-veg & diet", "I", "options", "Do you use Ajinomoto (MSG) in any dishes?", "Do you add Ajinomoto?", ["No MSG at all", "Only in Chinese dishes", "Yes", "Can skip on request"]),
 ("Veg / non-veg & diet", "O", "options", "Do you add artificial food colour to any dishes?", "Is there colour in the chicken 65?", ["No artificial colour", "Yes, in some dishes", "Can skip on request"]),
 ("Veg / non-veg & diet", "I", "yes_no", "Can you tell customers which dishes contain nuts, dairy or gluten?", "I'm allergic to nuts, which dishes are safe?", YN),
 ("Veg / non-veg & diet", "O", "text", "Which dishes contain nuts or cashew paste?", "Does the paneer curry have cashew?", []),
 ("Veg / non-veg & diet", "O", "yes_no", "Do you have options for diabetics or low-sugar diets?", "Any sugar-free sweets?", YN),
 ("Veg / non-veg & diet", "O", "yes_no", "Do you have vegan dishes (no dairy)?", "Do you have vegan food?", YN),
 ("Veg / non-veg & diet", "O", "yes_no", "Do you have gluten-free options?", "Anything without wheat?", YN),

 ("Timings & service time", "I", "text", "Does the kitchen close for a break between lunch and dinner? At what time?", "Is the kitchen open at 4 pm?", []),
 ("Timings & service time", "I", "text", "Until what time do you take the last order at night?", "What time is last order?", []),
 ("Timings & service time", "O", "text", "Do your timings change on festivals or special days?", "Are you open on Diwali?", []),
 ("Timings & service time", "I", "text", "On average, how long does food take to reach the table after ordering?", "How long will the food take?", []),
 ("Timings & service time", "O", "text", "Which dishes take longer to prepare (biryani, tandoor, baked items) and how long?", "How long for tandoori chicken?", []),

 ("Spice & customisation", "M", "options", "How spicy is your food normally?", "Is the food very spicy?", ["Mild", "Medium", "Spicy (Andhra style)", "Depends on the dish"]),
 ("Spice & customisation", "I", "yes_no", "Can customers ask for less spicy or extra spicy?", "Can you make it less spicy?", YN),
 ("Spice & customisation", "I", "yes_no", "Can customers customise dishes (no coriander, extra gravy, boneless, etc.)?", "Can I get it without coriander?", YN),
 ("Spice & customisation", "O", "yes_no", "Do you have boneless options for chicken dishes?", "Is boneless chicken available?", YN),

 ("Portions & prices", "M", "price", "What is the average cost for two people?", "How much for two people?", []),
 ("Portions & prices", "I", "options", "Do you offer half and full portions?", "Can I order a half plate?", ["Yes, for most dishes", "Only for some dishes", "No"]),
 ("Portions & prices", "I", "text", "How many people does one full biryani or one curry serve?", "Is one biryani enough for two?", []),
 ("Portions & prices", "I", "text", "What is the price range for starters, main course and biryani?", "How much is a biryani?", []),
 ("Portions & prices", "I", "yes_no", "Do you have combo meals or family packs?", "Any family pack?", YN),
 ("Portions & prices", "O", "text", "Which combos or family packs do you have, and what are their prices?", "What's in the family pack?", []),
 ("Portions & prices", "I", "options", "Do rotis and rice come with curries, or are they ordered separately?", "Does the curry come with roti?", ["Ordered separately", "Included with curries", "Depends on the dish"]),
 ("Portions & prices", "O", "options", "Do you charge extra for extra gravy, raita or salad?", "Is raita free?", ["Free", "Small extra charge", "Depends on the item"]),

 ("Taxes & charges", "M", "options", "Are your menu prices inclusive of GST?", "Is GST extra?", ["Inclusive of GST", "GST added at billing"]),
 ("Taxes & charges", "I", "options", "Do you add a service charge to the bill?", "Is there a service charge?", ["No service charge", "Yes, optional", "Yes, fixed"]),
 ("Taxes & charges", "I", "options", "Do you charge for parcel packaging?", "Is there a packing charge?", ["No charge", "Yes, per item", "Yes, per order"]),
  ("Taxes & charges", "O", "text", "How much is the parcel packing charge?", "How much is packing extra?", []),
 ("Taxes & charges", "O", "options", "Is GST the same for your AC and non-AC sections?", "Is GST more in the AC hall?", ["Same GST", "Different GST", "Only one section"]),
 ("Taxes & charges", "O", "list", "Which ways to pay do you accept (cash, UPI, cards, Sodexo / meal vouchers)?", "Do you take Sodexo?", ["Cash", "UPI", "Debit / credit card", "Sodexo / meal vouchers"]),
 ("Taxes & charges", "O", "text", "Do you have bank card offers (for example 10% off with a bank card)?", "Any offer on HDFC card?", []),
 ("Taxes & charges", "O", "options", "Do you add any extra charge for card payments?", "Is there extra charge for card?", ["No extra charge", "Yes, a small percentage"]),
 ("Taxes & charges", "O", "options", "Is drinking water free, or do you charge for water bottles?", "Is water free?", ["Free RO water", "Only paid bottles", "Both"]),
 ("Taxes & charges", "O", "yes_no", "Do you give a printed GST bill?", "Will I get a GST bill?", YN),

 ("Seating", "M", "number", "How many people can you seat at one time?", "Is there space for 20 people?", []),
 ("Seating", "I", "options", "Do you have AC seating?", "Is it AC?", ["AC only", "Non-AC only", "Both AC and non-AC"]),
 ("Seating", "I", "yes_no", "Do you have a family section?", "Is there family seating?", YN),
 ("Seating", "I", "options", "Is it table service, or self-service at the counter?", "Do I order at the counter?", ["Table service", "Self-service", "Both"]),
 ("Seating", "I", "text", "How long is the usual waiting time on weekends or at rush hours?", "How long is the wait right now?", []),
 ("Seating", "O", "text", "What are your busiest days and times?", "When is it less crowded?", []),
 ("Seating", "O", "yes_no", "Do you have private rooms or cabins?", "Do you have a private cabin?", YN),
 ("Seating", "O", "yes_no", "Do you have outdoor or rooftop seating?", "Is there rooftop seating?", YN),
 ("Seating", "O", "yes_no", "Do you have high chairs for small children?", "Is there a baby chair?", YN),
 ("Seating", "O", "list", "How easy is it for elderly people and wheelchair users to reach the seating?", "Is there a lift for my grandmother?", ["Ground floor seating", "Ramp", "Lift", "Stairs only"]),
 ("Seating", "O", "yes_no", "Do you have washrooms for customers?", "Is there a washroom?", YN),
 ("Seating", "O", "yes_no", "Do you have free Wi-Fi for customers?", "Is there Wi-Fi?", YN),
 ("Seating", "O", "yes_no", "Can customers watch TV or cricket matches here?", "Will the match be on TV?", YN),
  ("Seating", "O", "text", "Do you have live music or special events on weekends?", "Any live music this weekend?", []),
 ("Seating", "O", "options", "Is smoking allowed anywhere on the premises?", "Can I smoke here?", ["No smoking", "Separate smoking area"]),
 ("Seating", "I", "options", "Do you serve alcohol?", "Do you serve beer?", ["No alcohol", "Yes, licensed bar"]),

 ("Reservations & parties", "M", "options", "Do you take table reservations?", "Can I book a table?", ["Yes, by phone or WhatsApp", "Walk-in only"]),
 ("Reservations & parties", "I", "text", "How early should customers book a table for a group?", "Should I book for 10 people on Sunday?", []),
 ("Reservations & parties", "I", "yes_no", "Do you host birthday parties or small celebrations?", "Can we have a birthday party here?", YN),
 ("Reservations & parties", "I", "number", "What is the largest group you can host at once?", "Can you host 50 people?", []),
 ("Reservations & parties", "I", "text", "Do you need an advance payment for party bookings? How much?", "Is advance needed for a party?", []),
 ("Reservations & parties", "O", "text", "What is your cancellation policy for party or table bookings?", "Can I cancel my booking?", []),
 ("Reservations & parties", "O", "text", "Can you decorate the table or area for birthdays or anniversaries? Is there a charge?", "Can you decorate for a birthday?", []),
 ("Reservations & parties", "O", "options", "Can customers bring their own cake?", "Can I bring a cake?", ["Yes, free", "Yes, small charge", "No, we arrange cakes"]),

 ("Takeaway & apps", "M", "yes_no", "Do you give takeaway / parcel?", "Can I take a parcel?", YN),
 ("Takeaway & apps", "I", "text", "How long does a parcel order usually take to be ready?", "How long for a parcel?", []),
 ("Takeaway & apps", "I", "yes_no", "Can customers order a parcel in advance by phone or WhatsApp and pick it up?", "Can I order now and pick up later?", YN),
 ("Takeaway & apps", "I", "options", "Are you on Swiggy or Zomato?", "Are you on Swiggy?", ["Swiggy", "Zomato", "Both", "Neither"]),
 ("Takeaway & apps", "O", "options", "Are your Swiggy/Zomato prices the same as in the restaurant?", "Is it cheaper in the restaurant?", ["Same price", "Higher on apps", "Not on apps"]),
 ("Takeaway & apps", "O", "options", "What packaging do you use for parcels?", "Are the containers plastic?", ["Plastic containers", "Eco-friendly / paper", "Aluminium foil", "Mixed"]),
 ("Takeaway & apps", "O", "yes_no", "Do you give spoons, tissues and onion/lemon with parcels?", "Will you give spoons?", YN),
  ("Takeaway & apps", "O", "yes_no", "Do you use leak-proof, sealed containers for curries and gravies?", "Will the curry leak in the parcel?", YN),

 ("Delivery", "I", "options", "Is home delivery done by your own staff, or only through Swiggy / Zomato?", "Do you deliver yourselves?", ["Own delivery staff", "Only Swiggy / Zomato", "Both", "No delivery"]),
 ("Delivery", "I", "number", "Up to how many kilometres do you deliver?", "Do you deliver to Kukatpally?", []),
 ("Delivery", "I", "text", "How much do you charge for delivery? Does it change with distance?", "What is the delivery charge?", []),
 ("Delivery", "I", "price", "Is there a minimum order amount for delivery? How much?", "Is there a minimum order?", []),
 ("Delivery", "O", "text", "Do you give free delivery above a certain bill amount? Above how much?", "Is delivery free above 500?", []),
 ("Delivery", "O", "text", "Do you give a discount when customers order directly by phone or WhatsApp instead of through apps?", "Is it cheaper if I order directly?", []),
 ("Delivery", "O", "text", "If a customer cancels a phone or WhatsApp order, do you refund or charge a cancellation fee?", "Can I cancel my order?", []),

 ("Catering & bulk orders", "I", "yes_no", "Do you take bulk orders or outdoor catering?", "Do you do catering?", YN),
 ("Catering & bulk orders", "O", "number", "What is the minimum number of plates for a bulk or catering order?", "Minimum order for catering?", []),
 ("Catering & bulk orders", "O", "text", "How many days in advance should bulk orders be placed?", "How early should I order for 100 people?", []),
 ("Catering & bulk orders", "O", "text", "What is the price per plate for catering (veg and non-veg)?", "Catering cost per plate?", []),
 ("Catering & bulk orders", "O", "yes_no", "Do you provide serving staff and vessels for catering?", "Will you send serving staff?", YN),

 ("Hygiene & safety", "M", "yes_no", "Do you have a valid FSSAI licence?", "Is the restaurant FSSAI registered?", YN),
 ("Hygiene & safety", "I", "options", "What drinking water do you serve?", "Is the water safe?", ["RO purified water", "Packaged bottles only", "Both"]),
 ("Hygiene & safety", "I", "options", "Is your food cooked fresh daily?", "Is the food fresh?", ["Cooked fresh every day", "Some items prepared in advance"]),
  ("Hygiene & safety", "I", "yes_no", "Do you buy vegetables and meat fresh every day?", "Is the chicken fresh today?", YN),
 ("Hygiene & safety", "I", "options", "Is your seafood (fish, prawns) fresh daily or frozen?", "Is the fish fresh or frozen?", ["Fresh daily", "Frozen", "Both", "No seafood"]),
 ("Hygiene & safety", "O", "yes_no", "Do your kitchen staff wear caps, gloves and aprons?", "Is the kitchen clean?", YN),
 ("Hygiene & safety", "O", "yes_no", "Can customers see the kitchen (open kitchen)?", "Can I see the kitchen?", YN),

 ("Drinks & desserts", "I", "list", "Which drinks do you serve (tea, coffee, juices, lassi, soft drinks, mocktails)?", "What drinks do you have?", []),
 ("Drinks & desserts", "I", "list", "Which desserts or sweets do you serve?", "What desserts do you have?", []),
 ("Drinks & desserts", "O", "yes_no", "Are your juices made fresh?", "Is the juice fresh?", YN),
 ("Drinks & desserts", "O", "yes_no", "Do you serve filter coffee?", "Do you have filter coffee?", YN),

 ("Loyalty & discounts", "O", "yes_no", "Do you have a loyalty card or points for regular customers?", "Do you have a loyalty card?", YN),
 ("Loyalty & discounts", "O", "text", "Do you give discounts for students, seniors or corporate groups?", "Any student discount?", []),
 ("Loyalty & discounts", "O", "text", "Do you have weekday lunch deals or happy hours?", "Any lunch offer on weekdays?", []),

 ("Service & feedback", "I", "text", "What can a customer do if a dish is not as expected?", "This dish is too salty, what can you do?", []),
 ("Service & feedback", "I", "options", "If there is a problem in the food (hair, insect, wrong dish), what do you do?", "There is a hair in my food!", ["Replace the dish", "Remove it from the bill", "Both", "Manager decides"]),
 ("Service & feedback", "I", "yes_no", "Is a manager available in the restaurant to handle complaints right away?", "Can I talk to the manager?", YN),
 ("Service & feedback", "O", "options", "Can customers bring outside food or drinks (other than baby food)?", "Can I bring my own drinks?", ["Not allowed", "Allowed", "Allowed with a charge"]),
 ("Service & feedback", "O", "options", "Do you pack leftover food for customers to take home?", "Can you pack the leftovers?", ["Yes, free", "Yes, with a container charge", "No"]),
 ("Service & feedback", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"]),
 ("Service & feedback", "O", "text", "How should customers give feedback or a complaint?", "Where can I give feedback?", []),
 ("Service & feedback", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", []),
]

PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
rows = sorted(enumerate(Q), key=lambda x: (order[x[1][1]], x[0]))
questions = []
for n, (_, (cat, pri, typ, owner, customer, opts)) in enumerate(rows, 1):
    q = {"id": f"restaurant-{n:03d}", "category": cat, "owner_question": owner, "customer_question": customer,
         "priority": PRI[pri], "answer_type": typ}
    if opts: q["options"] = opts
    questions.append(q)

assert len({q["owner_question"] for q in questions}) == len(questions), "duplicate question"
here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, "..", "..", "botcraft-banks", "restaurant.json")
json.dump({"shop_type_key": "restaurant", "name": "Restaurant", "version": 2, "model": "curated",
           "generated_at": datetime.date.today().isoformat(), "question_count": len(questions), "questions": questions},
          open(out, "w"), indent=1, ensure_ascii=False)
print(len(questions), "questions:", {p: sum(q["priority"] == p for q in questions) for p in PRI.values()})
