# Hand-written (curated) question banks for tent houses, event decorators,
# DJ & sound services, and businesses that do all three.
# Run: python3 scripts/curated/tent_events.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: T = tent house (tents, chairs, tables, lights), D = decoration,
# S = DJ & sound. The combined business gets every question tagged T, D or S.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, offers, photos) are asked separately. Payment methods are not asked.
# The assistant cannot confirm a date or a final price, and never suggests
# breaking sound-time rules (see botcraft-salesbot.js).
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Functions & services", "M", "list", "For which functions do you work?", "Do you do birthday parties?", ["Weddings & receptions", "Engagements", "Haldi / mehendi / sangeet", "Birthdays", "Housewarming", "Seemantham / baby shower", "Religious functions & festivals", "Temple festivals, jataras & processions", "Corporate & office events", "Political meetings & public gatherings", "School & college events", "Funerals & last rites"], "TDS"),
 ("Functions & services", "I", "list", "What do you provide?", "Do you do the full arrangement?", ["Tents & shamianas", "Chairs, tables & sofas", "Decoration", "Stage & mandap", "Lighting & generators", "DJ & sound", "Live band / orchestra", "Special effects", "Complete event (start to finish)"], "TDS"),
 ("Functions & services", "O", "list", "Which areas do you serve?", "Do you come to villages?", ["Our town / city", "Nearby villages", "Whole district", "Other districts"], "TDS"),

 ("Tents & seating", "M", "list", "Which tents and shamianas do you have?", "Do you have waterproof tents?", ["Normal shamiana", "Waterproof tents", "German hangar / pagoda tents", "AC tents", "Side covers (rain & wind)", "Kitchen shamiana", "Dining tent", "VIP tent"], "T"),
 ("Tents & seating", "I", "text", "What tent sizes do you have, and how much space is needed for a given guest count (for example 200 or 500 guests)?", "How big a tent for 300 people?", [], "T"),
 ("Tents & seating", "O", "yes_no", "Can you put up tents on open plots, rooftops, terraces and narrow streets?", "Can you put a tent on our terrace?", YN, "T"),
 ("Tents & seating", "O", "text", "Can tents be put on the road in front of a house, and who gets the permission?", "Can you put the tent on the road?", [], "T"),
 ("Tents & seating", "M", "list", "Which seating and furniture do you have?", "Do you have cushion chairs?", ["Plastic chairs", "Cushioned / banquet chairs", "Sofas", "Round dining tables", "Rectangle tables", "Chair covers & table cloths (colour choice)", "Couple sofa for stage", "VIP seating"], "T"),
 ("Tents & seating", "I", "text", "What are your rates for chairs, tables and tents separately (per piece / per day), and can customers book only chairs and tables?", "How much per chair?", [], "T"),
 ("Tents & seating", "O", "list", "What else can you provide?", "Do you have coolers?", ["Fans", "Air coolers", "Carpets & walkway carpets", "Welcome arch", "Reception counter", "Shoe stand", "Mosquito control", "Dustbins", "Separate rooms for bride & groom", "Rest area for guests"], "T"),
 ("Tents & seating", "O", "yes_no", "Do you arrange easy access and seating for elders, children and wheelchair users?", "Is there seating for elders near the stage?", YN, "TD"),

 ("Decoration", "M", "list", "Which decoration do you do?", "Do you do flower decoration?", ["Wedding & reception", "Traditional South Indian", "Modern / theme", "Fresh flowers", "Artificial flowers", "Entrance gate", "Mandap", "Stage backdrops", "Balloon decoration", "Kids' theme (cartoon, superhero)", "Haldi / mehendi / sangeet", "Housewarming thoranams", "Temple decoration"], "D"),
 ("Decoration", "I", "text", "What is the starting price for decoration (for example stage only, full venue), with fresh and artificial flowers?", "How much for stage decoration?", [], "D"),
 ("Decoration", "I", "yes_no", "Can you copy a design from a customer's photo (Pinterest, Instagram)?", "Can you make this Instagram design?", YN, "D"),
 ("Decoration", "O", "text", "Do you show past work photos and videos, or a 3D / sample design for approval before the event?", "Can I see your previous work?", [], "D"),
 ("Decoration", "O", "text", "Until when can colours or design be changed, and is there a charge?", "Can I change the colour a day before?", [], "D"),
 ("Decoration", "O", "list", "Which printed items do you make?", "Can you make a name board?", ["Welcome boards", "Name & date flex / boards", "Photo backdrops", "LED screen photo & video slides"], "D"),
 ("Decoration", "O", "yes_no", "Do you share photos of the finished decoration?", "Will you send photos of the decoration?", YN, "D"),

 ("Stage & mandap", "I", "text", "Which stage sizes and mandap designs do you have, and can the mandap follow our tradition?", "Do you have a Telugu wedding mandap?", [], "TD"),
 ("Stage & mandap", "O", "yes_no", "Do you provide LED screens behind the stage?", "Can you put an LED screen?", YN, "TDS"),
 ("Stage & mandap", "O", "yes_no", "Are stage setup and removal included in the price?", "Is stage setup included?", YN, "TD"),

 ("Lighting & power", "I", "list", "Which lights do you provide?", "Do you have serial lights?", ["LED & serial lights", "Decorative lights (chandeliers, hanging)", "Stage lights", "Focus & halogen lights", "DJ / party lights", "Moving heads & lasers", "Parking & washroom area lights"], "TDS"),
 ("Lighting & power", "I", "text", "Do you bring a generator or backup power (what capacity for all lights, DJ and LED screens), is diesel included, is a standby generator kept, where is it placed so the noise does not disturb guests, and do you check the site's power supply beforehand? What happens if power goes off during the event?", "What if current goes off?", [], "TDS"),
 ("Lighting & power", "O", "text", "Are wiring and electrical fitting charged separately?", "Is wiring extra?", [], "TDS"),

 ("DJ & sound", "M", "list", "Which sound and music services do you provide?", "Do you have a DJ?", ["DJ with DJ operator", "Sound system only (no DJ)", "Speech & announcement sound (mics)", "Wireless mics", "Indoor & outdoor speakers", "Subwoofers / bass", "Live singer / band", "Orchestra", "Nadaswaram / band baaja", "Dance floor (LED)"], "S"),
 ("DJ & sound", "I", "text", "What is the price for DJ per event or per hour, and what is the extra charge for extra hours?", "How much for DJ for 4 hours?", [], "S"),
 ("DJ & sound", "O", "text", "Can customers give a playlist and song order in advance (entry songs, cake cutting, kids' songs), and do you play Telugu, Hindi, English and other songs?", "Can I give my song list?", [], "S"),
 ("DJ & sound", "O", "yes_no", "Can customers connect their own phone or laptop, and change songs during the event?", "Can I play songs from my phone?", YN, "S"),
 ("DJ & sound", "O", "yes_no", "Do you play clean versions (no bad words) when asked?", "Can you avoid songs with bad words?", YN, "S"),
 ("DJ & sound", "O", "yes_no", "Does the DJ make announcements between songs?", "Can the DJ make announcements?", YN, "S"),
 ("DJ & sound", "I", "text", "Until what time can DJ / loud music be played, and do you help get police or other permissions?", "Till what time can the DJ play?", [], "S"),
 ("DJ & sound", "O", "yes_no", "Do you keep sound low for residential areas, and do a sound check before the event?", "Can you keep the volume low?", YN, "S"),
 ("DJ & sound", "O", "yes_no", "If equipment fails during the event, do you replace it at once?", "What if the speaker stops?", YN, "S"),

 ("Special effects", "O", "list", "Which special effects do you have?", "Do you have cold pyro?", ["Cold pyro / cold fireworks", "Fog / smoke machine", "Bubble machine", "Confetti & flower shower", "Bride & groom grand entry", "Birthday child grand entry", "LED dance floor", "Laser shows"], "DS"),
 ("Special effects", "O", "yes_no", "Are special effects included in packages, or charged separately?", "Is cold pyro included?", YN, "DS"),

 ("Price & booking", "I", "text", "What are your package prices (for example by guest count, or full tent + decoration + DJ), and can packages be adjusted to a budget?", "What is the full package for 500 guests?", [], "TDS"),
 ("Price & booking", "I", "yes_no", "Do you give a written quotation listing every item and charge (transport, setup, generator, GST)?", "Will you give everything in writing?", YN, "TDS"),
 ("Price & booking", "O", "text", "Is transport and setup included, and is there a minimum booking amount?", "Is transport extra?", [], "TDS"),
 ("Price & booking", "O", "text", "Do you give discounts when tent, decoration and DJ are booked together?", "Any discount for booking everything?", [], "TDS"),
 ("Price & booking", "I", "text", "How much advance is needed to book, when is the balance paid (before or after the event), and do you give a receipt and GST bill?", "How much advance?", [], "TDS"),
 ("Price & booking", "O", "yes_no", "Can customers see your items at the office or godown before booking?", "Can I see the chairs first?", YN, "TDS"),

 ("Changes & cancellation", "I", "text", "If the date changes or the event is postponed, can the advance move to a new date? Any charge?", "The function is postponed, can I use the same advance?", [], "TDS"),
 ("Changes & cancellation", "I", "text", "If the booking is cancelled, how much advance is refunded, and how many days before must customers cancel?", "Will I get my advance back if I cancel?", [], "TDS"),
 ("Changes & cancellation", "O", "text", "Until when can items be added or reduced, or the booking moved to another name?", "Can I add 100 more chairs?", [], "TDS"),

 ("Setup & removal", "I", "text", "How many hours before the event do you come to set up, how long does it take, and when do you remove items after a late-night event?", "When will you come to set up?", [], "TDS"),
 ("Setup & removal", "O", "yes_no", "Do you visit the place before the event to check space?", "Will you come to see the place first?", YN, "TDS"),
 ("Setup & removal", "O", "text", "What should customers keep ready (clean space, power point, someone from the family at setup)?", "Do we need to clean the place first?", [], "TDS"),
 ("Setup & removal", "I", "yes_no", "Is a supervisor present during the event to handle problems and extra needs (more chairs, more tent)?", "Will someone from your side be there?", YN, "TDS"),
 ("Setup & removal", "O", "yes_no", "If a booked item is not available, do you give an equal or better replacement?", "What if the sofa I chose is not there?", YN, "TDS"),
 ("Setup & removal", "O", "text", "Do you clean the place after removing items? Is it charged?", "Will you clean up after?", [], "TDS"),

 ("Setup & removal", "O", "text", "How do you handle difficult sites (soft ground, cement floors without drilling, walls and ceilings that must not be damaged, low height, trees or poles in the way)?", "Can you put the tent without drilling our floor?", [], "TD"),
 ("Setup & removal", "O", "text", "For big events (thousands of guests), do you plan the layout with separate entry and exit, a VIP entry, sound for each area and extra staff?", "Can you handle 5,000 people for a meeting?", [], "TDS"),
 ("Setup & removal", "O", "yes_no", "Do you work with the customer's caterer, photographers, event manager's layout and other decorators, and change the stage between programmes?", "Will you set the dining area with our caterer?", YN, "TDS"),
 ("Setup & removal", "O", "text", "Can customers rent items and set them up themselves? Extra-day rent, deposit and refund time, and do you give a list of items with their count and condition at handover?", "Can I take 100 chairs and set them myself?", [], "T"),
 ("Weather & safety", "I", "text", "What do you do in heavy rain or strong wind (waterproof covers, ground drainage, strong fixing, alternate plan)?", "What if it rains during the function?", [], "TD"),
 ("Weather & safety", "O", "text", "In hot weather, how do you keep the tent cool (fans, coolers, AC)?", "It will be very hot, can you keep it cool?", [], "T"),
 ("Weather & safety", "O", "text", "Who is responsible if rain damages decoration, or if your staff or items damage the place or guests' things?", "Who pays if your staff break something?", [], "TDS"),
 ("Weather & safety", "O", "yes_no", "Do you take safety care (covered wires, earthing, firm stage and tent fixing, cables away from walkways, fire extinguishers, a clear emergency exit, no welding or open flame near the tent, and staff who know what to do in a fire or short circuit)?", "Are the wires safe for children?", YN, "TDS"),
 ("Weather & safety", "O", "text", "How can customers complain about a problem during or after the event, including extra charges they do not agree with?", "Whom do I call if something goes wrong?", [], "TDS"),

 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "TDS"),
 ("Shop & service", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Where can I see your work?", [], "TDS"),
]

TYPES = [("tent_house", "Tent house (tents, chairs & lights)", "T"),
         ("event_decorator", "Event decorator", "D"),
         ("dj_sound", "DJ & sound system", "S"),
         ("tent_decor_dj", "Tent house, decoration & DJ", "TDS")]
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
