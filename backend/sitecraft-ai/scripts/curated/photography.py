# Hand-written (curated) question bank for photography & video studios
# (weddings, pre-wedding, baby and event shoots, studio work).
# Run: python3 scripts/curated/photography.py  -> writes botcraft-banks/photography.json
# Priorities: M = mandatory, I = important, O = optional.
# A * in the tags marks a city-only question, asked only to studios in a
# district headquarters or city.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, offers, photos, Wi-Fi) are asked separately, so they are not
# repeated here. Payment methods are not asked.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Shoots & services", "M", "list", "Which shoots and services do you do?", "Do you do baby shoots?", ["Weddings", "Engagement & reception", "Pre-wedding shoots", "Half-saree / dhoti functions", "Birthdays & cake smash", "Newborn & baby shoots", "Maternity shoots", "Seemantham / gruhapravesam", "Corporate & events", "Product / portfolio shoots", "Passport & visa photos", "Old photo restoration & framing"], "F"),

 ("Packages & prices", "M", "text", "What does your full wedding package cost, and what does it include?", "How much for the full wedding?", [], "F"),
 ("Packages & prices", "I", "text", "What do you charge for a single event (engagement, birthday, half-saree function, gruhapravesam)?", "How much for an engagement?", [], "F"),
 ("Packages & prices", "I", "text", "What is the price for traditional photo + video only, and how much more for candid photography and cinematic video?", "How much extra for candid?", [], "F"),
 ("Packages & prices", "I", "text", "Is album printing included in the package, or charged separately?", "Is the album included?", [], "F"),
 ("Packages & prices", "I", "text", "Why should customers choose you over cheaper photographers?", "Others are cheaper, why you?", [], "F"),
 ("Packages & prices", "O", "text", "What discount do you give if you cover both the bride's and groom's side?", "Any discount if you cover both sides?", [], "F"),
 ("Packages & prices", "O", "yes_no", "Do you make a custom package for the customer's budget?", "My budget is ₹50,000, what can you give?", YN, "F"),
 ("Packages & prices", "O", "text", "Do you charge per hour or per day as well?", "Can I book you for 3 hours?", [], "F"),
 ("Packages & prices", "O", "options", "Is GST included in your price?", "Is GST extra?", ["Included", "Added on the bill", "No GST"], "F"),

 ("Booking & timings", "I", "text", "How much advance blocks the date, and when is the rest paid (event day, album delivery)?", "How much advance to book the date?", [], "F"),
 ("Booking & timings", "I", "text", "If the event is postponed or cancelled, do you move the date or refund the advance?", "Will you refund if the wedding is postponed?", [], "F"),
 ("Booking & timings", "I", "text", "How many hours does your team stay at an event, and what do you charge if it runs late (muhurtham change, late makeup)?", "What if the wedding gets delayed by 3 hours?", [], "F"),
 ("Booking & timings", "O", "yes_no", "Do you cover the morning rituals at home (Gowri puja, snathakam, pellikoduku) in the same package?", "Will you cover the pellikoduku function?", YN, "F"),

 ("Team & conduct", "I", "text", "How many cameramen and assistants come to an event?", "How many photographers will come?", [], "F"),
 ("Team & conduct", "I", "yes_no", "Does the lead photographer (the same team as in your portfolio) come in person, not outside freelancers?", "Will you come yourself or send someone else?", YN, "F"),
 ("Team & conduct", "O", "yes_no", "Do you have female photographers for ladies' functions (mehendi, haldi, seemantham)?", "Is there a lady photographer?", YN, "F"),
 ("Team & conduct", "O", "yes_no", "Does your team come in a decent uniform and stay patient and polite with relatives?", "Will your team behave well with our relatives?", YN, "F"),
 ("Team & conduct", "O", "yes_no", "During the taali and key moments, does your team film without blocking the guests' view?", "Will the video guys block the stage?", YN, "F"),
 ("Team & conduct", "O", "text", "For outstation events, what travel, stay and food do you expect for the team?", "Do we pay your travel for an outstation wedding?", [], "F"),

 ("Equipment & live", "O", "text", "Which cameras do you use (full-frame mirrorless?), and do you shoot video in 4K?", "Is the video in 4K?", [], "F"),
 ("Equipment & live", "I", "list", "Which extras can you arrange?", "Do you have a drone?", ["Drone", "LED walls / screens", "Crane camera (jimmy jib)", "YouTube / Facebook live streaming", "AI face-recognition photo sharing (QR code)", "Instant photo booth / 360 spin booth", "Same-day edit video"], "F"),
 ("Equipment & live", "O", "text", "Who takes drone permission, and is the drone charge reduced if it can't fly (low ceiling)?", "Who gets drone permission?", [], "F"),
 ("Equipment & live", "O", "text", "For live streaming, who arranges the internet?", "Do we give Wi-Fi for the live stream?", [], "F"),

 ("Pre-wedding", "I", "text", "What does a pre-wedding shoot cost, which locations do you suggest, and who pays location fees?", "Where can we do a pre-wedding shoot?", [], "F"),
 ("Pre-wedding", "O", "yes_no", "Do you guide shy couples with poses?", "We don't know how to pose, will you help?", YN, "F"),
 ("Pre-wedding", "O", "list", "What do you provide for pre-wedding shoots?", "Do you give costumes?", ["Gowns & costumes", "Makeup & hair artist", "Props (vintage car, smoke bombs, guitar)", "Nothing extra"], "F"),
 ("Pre-wedding", "O", "text", "If it rains on the shoot day, do you reschedule free? How many costume changes are allowed?", "What if it rains on the shoot day?", [], "F"),

 ("Baby & maternity", "O", "text", "For newborn shoots, at what age do you shoot, and how do you keep babies safe (no harsh flash, sanitised props and clothes)?", "Is flash safe for my baby's eyes?", [], "F"),
 ("Baby & maternity", "O", "text", "How many baby shoot themes do you have?", "How many themes for a baby shoot?", [], "F"),
 ("Baby & maternity", "O", "yes_no", "Do you have a private room for feeding, and wait patiently when the baby is cranky?", "Is there a room to feed the baby?", YN, "F"),
 ("Baby & maternity", "O", "text", "For cake smash shoots, do you bring the cake or do parents?", "Do you bring the cake for cake smash?", [], "F"),
 ("Baby & maternity", "O", "yes_no", "Do you have maternity gowns (flying dresses) for the shoot?", "Do you have flying gowns?", YN, "F"),

 ("Albums & delivery", "M", "text", "How many days after the event do you deliver the edited photos, videos and album, and how do you keep customers updated?", "When will we get the album?", [], "F"),
 ("Albums & delivery", "I", "text", "When and how do you give the raw photos and videos (hard disk, pen drive, Google Drive)?", "When do we get all the raw photos?", [], "F"),
 ("Albums & delivery", "O", "yes_no", "Do you give a few edited photos and a teaser reel within 2–3 days?", "Can we get a reel for Instagram soon?", YN, "F"),
 ("Albums & delivery", "I", "text", "How many sheets and photos does the album have, and what does an extra sheet cost?", "How many pages in the album?", [], "F"),
 ("Albums & delivery", "O", "options", "Who selects the photos for the album?", "Do we select the photos?", ["Customer selects", "We select, customer approves", "Either"], "F"),
 ("Albums & delivery", "I", "yes_no", "Do you show a soft-copy proof of the album design and print only after approval? How many corrections are allowed?", "Can we see the album before printing?", YN, "F"),
 ("Albums & delivery", "O", "yes_no", "Do you retouch naturally (skin, slimming) without making faces look unnaturally white?", "Will you remove pimples in the photos?", YN, "F"),
 ("Albums & delivery", "O", "text", "What album paper and cover options do you have (Karizma, non-tearable, velvet, acrylic), and is there a warranty?", "Which album paper do you use?", [], "F"),
 ("Albums & delivery", "O", "text", "What extras come with the album (mini album, calendar, frames, album bag)?", "Do we get a mini album free?", [], "F"),
 ("Albums & delivery", "O", "yes_no", "Can customers choose the songs for the video, and do you avoid YouTube copyright problems?", "Can we choose the songs?", YN, "F"),

 ("Data & privacy", "I", "yes_no", "Do your cameras record to two memory cards at once, and do you back up the data the same day?", "What if the memory card gets corrupted?", YN, "F"),
 ("Data & privacy", "O", "text", "How long do you keep a backup of the photos and videos after delivery?", "Will you keep a copy if we lose our hard disk?", [], "F"),
 ("Data & privacy", "I", "yes_no", "Do you post customers' photos on your social media only with their permission?", "Will you post our wedding photos online?", YN, "F"),

 ("Studio", "O", "yes_no", "Do you take passport and visa photos (US, Canada and other sizes) in a few minutes?", "Can I get passport photos now?", YN, "F"),
 ("Studio", "O", "yes_no", "Do you restore old or torn photos, colour black-and-white photos and frame them?", "Can you fix my grandfather's old photo?", YN, "F"),
 ("Studio", "O", "list", "Which languages can your team speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "F"),
 ("Studio", "O", "text", "Please share your Instagram, YouTube and Google reviews links so customers can see your work.", "Where can I see your work?", [], "F"),
]

PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
key, name = "photography", "Photography & video studio"
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
