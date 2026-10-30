# Hand-written (curated) question bank for hotels, lodges, resorts and service
# apartments (room stays; restaurants have their own bank).
# Run: python3 scripts/curated/hotel_stay.py  -> writes botcraft-banks/hotel_stay.json
# Priorities: M = mandatory, I = important, O = optional.
# A * in the tags marks a city-only question, asked only to hotels in a
# district headquarters or city (small lodges rarely offer these).
# Core questions (name, address, map, parking, timings, phone, WhatsApp,
# offers, photos, Wi-Fi) are asked separately, so they are not repeated here.
# Payment methods are not asked.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Rooms & rates", "M", "text", "What are your room types and rent per day (single, double, deluxe, suite, AC, non-AC)?", "How much is a room for one day?", [], "H"),
 ("Rooms & rates", "I", "options", "Is GST included in the room rate?", "Is GST extra?", ["Included in the rate", "Added on the bill", "No GST (small lodge)"], "H"),
 ("Rooms & rates", "I", "text", "How much is an extra person or extra bed, and are children charged (up to what age is it free)?", "How much for a third person?", [], "H"),
 ("Rooms & rates", "I", "options", "Do walk-in guests get the same rate as online sites (MakeMyTrip, Goibibo, Booking.com)?", "It's cheaper on MakeMyTrip, will you match it?", ["Same or better than online", "Close to online", "Online offers are only on the app"], "H"),
 ("Rooms & rates", "O", "text", "Do you give long-stay (weekly / monthly) package rates?", "Any rate for a one-month stay?", [], "H"),
 ("Rooms & rates", "O", "text", "What discount do you give on bulk bookings (weddings, meetings) and for corporate tie-ups?", "Any discount for 20 rooms?", [], "H"),
 ("Rooms & rates", "O", "text", "Do you give rooms for a few hours (short stay to freshen up)? What is the charge?", "Can I take a room for 4 hours?", [], "H"),
 ("Rooms & rates", "O", "yes_no", "Do you give a GST invoice with the company name for office claims?", "Can I get a GST bill?", YN, "H"),
 ("Rooms & rates", "I", "text", "Are mini-bar items, snacks and water bottles in the room free or charged? At what price?", "Is the water bottle in the room free?", [], "H"),

 ("Check-in & booking", "M", "options", "What is your check-in / check-out system?", "What is the check-out time?", ["24-hour check-out", "Fixed time (for example 12 noon check-out)"], "H"),
 ("Check-in & booking", "I", "text", "Do you allow early check-in and late check-out? Is there an extra charge?", "Our train comes at 5 am, can we check in?", [], "H"),
 ("Check-in & booking", "O", "yes_no", "Can guests leave luggage at the reception after check-out (cloakroom)?", "Can I keep my bags till evening?", YN, "H"),
 ("Check-in & booking", "I", "text", "How do guests book a room, how much advance is needed, and can they pay at the hotel?", "How do I book a room?", [], "H"),
 ("Check-in & booking", "I", "text", "What is your cancellation and refund policy (how many days before for a full refund), and for guests who leave earlier than booked?", "Will I get my advance back if I cancel?", [], "H"),
 ("Check-in & booking", "O", "yes_no", "Can guests see the room before booking?", "Can I see the room first?", YN, "H"),
 ("Check-in & booking", "I", "text", "Do you honour online bookings (OYO, MakeMyTrip) at the booked price, and what do you do if rooms are overbooked?", "I booked on MakeMyTrip, will you give the room at that price?", [], "H"),
 ("Check-in & booking", "O", "text", "Can someone book in their own name for another person (for example a parent or friend) to stay? What is needed?", "Can my father stay in a room booked in my name?", [], "H"),
 ("Check-in & booking", "O", "yes_no", "Can guests extend their stay in the same room?", "Can we stay 2 more days?", YN, "H"),
 ("Check-in & booking", "O", "text", "Is there a security deposit, and when is it refunded?", "Is there a deposit?", [], "H"),
 ("Check-in & booking", "O", "text", "What do you charge for damages (broken cups, stains on linen, a lost key card)?", "How much fine for a broken glass?", [], "H"),
 ("Check-in & booking", "I", "yes_no", "Do you have C-Form (FRRO) registration to host foreign guests and OCI card holders?", "Do you take foreign passport holders?", YN, "H"),

 ("ID & rules", "M", "text", "Which ID proofs do you accept (Aadhaar, driving licence, voter ID, passport), and do all guests need to show one? Is DigiLocker accepted?", "Is PAN card enough?", [], "H"),
 ("ID & rules", "I", "options", "Do you give rooms to unmarried couples (both adults with valid ID)?", "Do you allow unmarried couples?", ["Yes, with valid ID for both", "Married couples only", "Depends (ask at the reception)"], "H"),
 ("ID & rules", "I", "options", "Do you give rooms to guests with a local ID (same city)?", "I'm from this city, will you give me a room?", ["Yes", "No local IDs", "Depends"], "H"),
 ("ID & rules", "O", "text", "Can visitors come to the room (for example a beautician for wedding guests), or only meet in the lobby? Until what time?", "Can my friends come to my room?", [], "H"),
 ("ID & rules", "O", "text", "Is there a time by which guests must come back at night (gate closing time)?", "Will the gate close at night?", [], "H"),
 ("ID & rules", "O", "text", "Are smoking and alcohol allowed in the rooms? Do you have smoking rooms?", "Can I smoke in the room?", [], "H"),
 ("ID & rules", "O", "yes_no", "Are pets allowed?", "Can I bring my dog?", YN, "H"),

 ("Room amenities", "I", "list", "What is in your rooms?", "Is there hot water?", ["AC", "24-hour hot water", "Western toilet", "Bathtub", "Free Wi-Fi", "Work desk & chair", "TV with Telugu / English channels", "OTT (Netflix, YouTube)", "Kettle with tea / coffee", "Free water bottles", "Mini fridge", "Iron box", "Hair dryer", "Safe locker", "Balcony", "Blackout curtains", "Windows that open", "Sockets near the bed & extension boards", "Universal plug adapters", "Anti-skid mat, bucket & mug", "Cloth-drying stand", "Two key cards"], "H"),
 ("Room amenities", "O", "list", "Which bed types do you have?", "Is it one big bed or two beds?", ["King / queen double bed", "Twin beds", "Family rooms (4–6 beds)", "Interconnecting rooms", "Firm / orthopaedic mattresses"], "H"),
 ("Room amenities", "O", "yes_no", "Do you give free towels and toiletries (soap, shampoo, toothbrush, paste)?", "Will you give soap and shampoo?", YN, "H"),
 ("Room amenities", "I", "yes_no", "Do you have full power backup that runs the AC in a power cut?", "Will the AC work if the power goes?", YN, "H"),
 ("Room amenities", "O", "text", "Which rooms have a view (beach, hill, temple, city), and is it extra?", "Is there a sea view room?", [], "H"),
 ("Room amenities", "O", "text", "How fast is the Wi-Fi for office work?", "Is the Wi-Fi good for work calls?", [], "H"),
 ("Room amenities", "O", "yes_no", "Can guests ask for a quiet room away from the main road?", "Can I get a quiet room?", YN, "H"),

 ("Family & access", "I", "yes_no", "Do you have a lift, or ground-floor rooms for elders?", "Is there a lift?", YN, "H"),
 ("Family & access", "O", "yes_no", "Do you have a wheelchair for guests who need one?", "Is there a wheelchair?", YN, "H"),
 ("Family & access", "O", "text", "Do you have a drivers' dormitory? Is it free or charged?", "Where will my driver sleep?", [], "H"),
 ("Family & access", "O", "yes_no", "Will the kitchen warm milk or food for small children?", "Can you warm milk for my baby?", YN, "H"),
 ("Family & access", "O", "yes_no", "Do you have rooms or service apartments with a kitchen?", "Is there a room with a kitchen?", YN, "H"),

 ("Food & room service", "I", "text", "Is breakfast included in the rent? Buffet or fixed menu, and at what time?", "Is breakfast free?", [], "H"),
 ("Food & room service", "I", "options", "Do you have an in-house restaurant?", "Is there a restaurant in the hotel?", ["Pure veg", "Veg & non-veg", "No restaurant"], "H"),
 ("Food & room service", "O", "text", "Do you have room service? Until what time can guests order food?", "Can I get food in the room at night?", [], "H"),
 ("Food & room service", "O", "yes_no", "Can the kitchen make satvik / Jain food (no onion, garlic) and bland food for patients?", "Do you have food without onion and garlic?", YN, "H"),
 ("Food & room service", "O", "yes_no", "Can guests bring outside food or order from Swiggy / Zomato to the room?", "Can I order from Zomato?", YN, "H"),

 ("Location & travel", "I", "text", "How far is the hotel from the railway station, bus stand, airport and main temple or tourist spots? What do autos charge?", "How far is the railway station?", [], "H"),
 ("Location & travel", "O", "text", "Do you arrange pick-up and drop from the station or airport? Is it free?", "Can you pick us up from the station?", [], "H"),
 ("Location & travel", "O", "yes_no", "Do you have a travel desk for local sightseeing cabs, and bike or car rentals?", "Can you arrange a cab for sightseeing?", YN, "H"),
 ("Location & travel", "O", "yes_no", "Is there space for buses, and an EV charging point?", "Can our bus park inside?", YN, "H"),
 ("Pilgrims & special guests", "O", "text", "Can pilgrim groups share a room (6–8 people) with extra mattresses, blankets and pillows? What is the charge?", "Can 8 of us stay in one room?", [], "H"),
 ("Pilgrims & special guests", "O", "text", "Do you help with temple darshan timings and booking official darshan tickets?", "How long does darshan take?", [], "H"),
 ("Pilgrims & special guests", "O", "yes_no", "Do you give wake-up calls and printouts (darshan tickets, boarding passes) at the reception?", "Can you wake us at 3 am?", YN, "H"),
 ("Pilgrims & special guests", "O", "yes_no", "Will the reception keep medicines (for example insulin) in its fridge, and guests' phones or laptops safely (for exam candidates)?", "Can you keep my insulin in your fridge?", YN, "H"),
 ("Pilgrims & special guests", "O", "yes_no", "Do you help foreign guests with currency exchange?", "Can I change dollars here?", YN, "H*"),
 ("Pilgrims & special guests", "O", "yes_no", "Will the reception receive and keep guests' parcels (Amazon, Flipkart)?", "Can my parcel come to the hotel?", YN, "H"),
 ("Pilgrims & special guests", "O", "text", "Can guests do photoshoots or reels in the lobby or garden (pre-wedding shoots)? Any charge?", "Can we do a photoshoot in the garden?", [], "H"),

 ("Facilities", "I", "list", "Which facilities do you have?", "Is there a swimming pool?", ["Swimming pool", "Gym", "Spa / massage", "Bar", "Kids' play area", "Laundry", "Banquet / conference hall", "Garden / lawn"], "H"),
 ("Facilities", "O", "text", "What are the pool timings and rules (swimwear)?", "Do I need a costume for the pool?", [], "H"),
 ("Facilities", "O", "text", "Is laundry same-day? How is it charged?", "Can you wash my clothes by evening?", [], "H"),
 ("Facilities", "O", "text", "Do you decorate rooms for honeymoons, anniversaries or birthdays (flowers, cake)? What does it cost?", "Can you decorate the room for our anniversary?", [], "H"),
 ("Facilities", "O", "text", "What are the hall charges for a small party or meeting, and how many people does it hold?", "How much is the conference hall?", [], "H"),

 ("Hygiene & safety", "I", "yes_no", "Are bed sheets, blankets and pillow covers changed for every guest, and rooms kept free of pests (with mosquito repellent)?", "Are the bedsheets fresh?", YN, "H"),
 ("Hygiene & safety", "O", "yes_no", "Do rooms have an inside safety latch, and does staff enter only with the guest's permission (never with a master key unasked)?", "Will housekeeping enter when I'm out?", YN, "H"),
 ("Hygiene & safety", "O", "yes_no", "If something doesn't work (AC, drainage, noise), do you change the room right away?", "The AC isn't cooling, can you change my room?", YN, "H"),
 ("Hygiene & safety", "O", "yes_no", "Can you call a doctor at night if a guest falls sick?", "Can you call a doctor?", YN, "H"),
 ("Hygiene & safety", "I", "yes_no", "Do you check rooms regularly so there are no hidden cameras?", "Are there hidden cameras in the room?", YN, "H"),
 ("Hygiene & safety", "O", "yes_no", "Do you have fire safety (extinguishers, smoke detectors, emergency exits)?", "Is there a fire exit?", YN, "H"),
 ("Hygiene & safety", "O", "yes_no", "If guests forget things in the room, do you courier them home?", "I left my watch in the room, can you send it?", YN, "H"),
 ("Hygiene & safety", "I", "yes_no", "Do you have CCTV in common areas and a 24-hour security guard / reception (safe for solo women travellers)?", "Is it safe for a woman travelling alone?", YN, "H"),

 ("Hotel & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "H"),
 ("Hotel & service", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Where can I see your reviews?", [], "H"),
]

PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
key, name = "hotel_stay", "Hotel, lodge & resort (rooms)"
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
