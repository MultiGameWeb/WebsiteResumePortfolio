# Hand-written (curated) question bank for pet shops (pets, food, accessories,
# aquarium, grooming and boarding).
# Run: python3 scripts/curated/pet_shop.py  -> writes botcraft-banks/pet_shop.json
# Priorities: M = mandatory, I = important, O = optional.
# A * in the tags marks a city-only question, asked only to shops in a district
# headquarters or city (local shops rarely offer these).
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, offers, photos, Wi-Fi)
# are asked separately, so they are not repeated here.
# Pet care and health advice (feeding amounts, potty training, illness signs,
# rabies) is not asked: the assistant points customers to the shop staff or a vet.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Pets for sale", "M", "list", "Which pets do you sell?", "Do you have puppies?", ["Puppies", "Kittens", "Birds", "Aquarium fish", "Rabbits & guinea pigs", "Hamsters", "Turtles (legal species only)", "No pets, only food & accessories"], "P"),
 ("Pets for sale", "I", "list", "Which dog breeds do you usually have?", "Do you have a Shih Tzu?", ["Labrador", "Golden Retriever", "German Shepherd", "Beagle", "Shih Tzu", "Pug", "Pomeranian", "Rottweiler", "Doberman", "Husky", "Indian breeds (Indie, Rajapalayam, Mudhol)"], "P"),
 ("Pets for sale", "O", "list", "Which cat breeds do you usually have?", "Do you have a Persian cat?", ["Persian (doll face / punch face)", "Himalayan", "Siamese", "Maine Coon", "Bengal", "Indian cats"], "P"),
 ("Pets for sale", "O", "list", "Which birds do you sell?", "Do you have talking birds?", ["Budgies / lovebirds", "Cockatiels", "Finches", "African grey parrots (captive-bred, with papers)", "Macaws & other exotic birds (with papers)", "Hand-tamed birds"], "P"),
 ("Pets for sale", "I", "yes_no", "Do you sell only birds and animals that are legal to keep, and never Indian parrots, star tortoises or other protected wildlife?", "Can I buy a green parrot here?", YN, "P"),
 ("Pets for sale", "I", "yes_no", "Is your shop registered with the State Animal Welfare Board for selling pets?", "Is your pet shop registered?", YN, "P"),
 ("Pets for sale", "I", "text", "How do your staff help customers choose a pet for their home (flat size, kids and elders, time alone, shedding, barking, hot weather)?", "Which puppy suits a small flat?", [], "P"),
 ("Pets for sale", "I", "text", "What are the price ranges of your puppies and kittens, and why do male and female prices differ?", "How much is a Labrador puppy?", [], "P"),
 ("Pets for sale", "I", "text", "Where do your puppies and kittens come from? Can customers see the parents, or their photos and videos?", "Can I see the puppy's parents?", [], "P"),
 ("Pets for sale", "I", "text", "Do puppies come with KCI registration papers and a microchip?", "Does the puppy have KCI papers?", [], "P"),
 ("Pets for sale", "I", "text", "At what age do you sell puppies and kittens (weaned, at least 8 weeks old)?", "How old is this puppy?", [], "P"),
 ("Pets for sale", "I", "text", "If a pet falls sick in the first few days (for example parvo), do you replace it or refund? What proof do you need?", "What if the puppy gets sick after I take it home?", [], "P"),
 ("Pets for sale", "O", "text", "Do you take a pet back within a few days if it doesn't adjust at home?", "Can I return the puppy if it doesn't suit us?", [], "P"),
 ("Pets for sale", "O", "text", "Do you offer EMI or a discount on costly pets?", "Can I pay for the puppy in EMI?", [], "P"),
 ("Pets for sale", "O", "yes_no", "Do you guide customers on municipal pet registration and local rules for some breeds?", "Do I need to register my dog?", YN, "P"),
 ("Pets for sale", "O", "text", "Do you arrange safe transport of pets to other towns? How, and at what charge?", "Can you send the puppy to Vijayawada?", [], "P"),
 ("Pets for sale", "O", "yes_no", "Can you tell the male and female birds apart, and do you sell breeding pairs?", "Is this a male or female budgie?", YN, "P"),

 ("Health & vet", "I", "yes_no", "Are your puppies and kittens given their first vaccination and deworming before sale, with a vaccination card?", "Is the puppy vaccinated?", YN, "P"),
 ("Health & vet", "O", "yes_no", "Do you give the vaccination schedule with costs and remind customers when the next dose is due?", "When is the next vaccine?", YN, "P"),
 ("Health & vet", "I", "options", "Is a vet available?", "Is there a vet at your shop?", ["Vet at the shop", "Vet visits on fixed days", "We refer a nearby vet", "No vet"], "P"),
 ("Health & vet", "O", "text", "Do you arrange spaying / neutering with a vet? What does it cost?", "Where can I get my dog neutered?", [], "P"),
 ("Health & vet", "O", "text", "Do you arrange stud service (mating)? What is the charge?", "Do you have a male Labrador for mating?", [], "P"),

 ("Food & supplements", "M", "list", "Which pet food brands do you sell?", "Do you have Royal Canin?", ["Pedigree", "Royal Canin", "Drools", "Farmina", "Purepet", "Kennel Kitchen", "Whiskas", "Me-O", "Sheba", "Veg dog food", "Fish food", "Bird seed", "Rabbit & hamster food"], "P"),
 ("Food & supplements", "I", "yes_no", "Do you give a feeding chart (what, how much, how often) with every pet?", "How much should I feed the puppy?", YN, "P"),
 ("Food & supplements", "I", "list", "Which supplements and treats do you sell?", "Do you have salmon oil?", ["Appetite / liver tonics", "Salmon oil (skin & coat)", "Multivitamins", "Calcium bones & treats", "Dental chews", "Puppy milk replacer"], "P"),
 ("Food & supplements", "I", "text", "How fresh is your pet food stock (expiry dates), and what discount do you give on bulk or big packs?", "Any discount on 3 bags?", [], "P"),
 ("Food & supplements", "O", "options", "How do your pet food prices compare with online stores (Amazon, Supertails, Heads Up For Tails)?", "It's 20% cheaper online, can you match?", ["Same as online", "Close to online", "MRP with a small discount"], "P"),

 ("Hygiene & training", "I", "list", "Which hygiene products do you sell?", "Do you have cat litter?", ["Potty training sprays & pads", "Cat litter & litter boxes", "Dog diapers (heat cycle)", "Odour cleaners & room fresheners", "Dry shampoo & wipes", "Lint rollers / hair removers", "Poop scoopers & bags"], "P"),
 ("Hygiene & training", "I", "list", "Which tick and flea products do you sell?", "Do you have tick medicine?", ["Tick shampoo", "Tick powder", "Spot-on drops", "Tick collars", "Home tick spray"], "P"),
 ("Hygiene & training", "O", "text", "Do you arrange a dog trainer? What does it cost per month?", "Do you have a dog trainer?", [], "P"),

 ("Grooming", "I", "list", "Which grooming services do you offer?", "Do you do dog grooming?", ["Bath & blow dry", "Haircut / styling", "Nail clipping", "Ear cleaning", "Tick & flea treatment", "Home grooming", "No grooming"], "P"),
 ("Grooming", "I", "text", "What are your grooming package prices for small and big dogs and for cats?", "How much is grooming?", [], "P"),
 ("Grooming", "O", "text", "Do you groom without sedation? How do you handle nervous or biting pets?", "Will you give my dog an injection for grooming?", [], "P"),

 ("Accessories", "I", "list", "Which accessories do you sell?", "Do you have a harness?", ["Collars & harnesses", "Leashes", "Crates & cages (all sizes)", "IATA travel crates", "Carrier bags & car seat covers", "Clothes, sweaters & raincoats", "Dog shoes", "Beds & mats", "Bowls & water dispensers", "Chew toys", "Cat scratching posts & trees", "Bird cages", "Hamster & rabbit cages"], "P"),
 ("Accessories", "O", "yes_no", "Do your staff help choose the right collar or harness and crate size for the pet?", "Collar or harness for my puppy?", YN, "P"),

 ("Aquarium", "I", "list", "Which fish do you sell?", "Do you have Flowerhorn?", ["Goldfish", "Guppy & molly", "Tetras", "Angel fish", "Betta", "Oscar", "Flowerhorn", "Arowana", "Sucker / algae eaters", "Shrimps & snails"], "P"),
 ("Aquarium", "I", "list", "Which aquarium items do you sell?", "Do you have a battery air pump?", ["Tanks (custom sizes)", "Filters & air pumps", "Battery air pumps (power cuts)", "Water conditioner (anti-chlorine)", "Lights & heaters", "Automatic fish feeders", "Plants & decor", "Fish medicines", "Turtle food & UVB lights"], "P"),
 ("Aquarium", "O", "yes_no", "Do you guide customers on tank setup, which fish can live together, water changes and feeding?", "Can goldfish and Oscar be in one tank?", YN, "P"),
 ("Aquarium", "O", "text", "Do you send staff home for aquarium setup and cleaning? What does it cost?", "Can you clean my aquarium at home?", [], "P"),

 ("Boarding & services", "I", "text", "Do you have pet boarding or daycare? What is the charge per day?", "Can I leave my dog with you for 5 days?", [], "P"),
 ("Boarding & services", "O", "yes_no", "During boarding, do you share photos or video calls of the pet every day?", "Will you show me my dog on video call?", YN, "P"),
 ("Boarding & services", "O", "text", "Do you know a pet burial or cremation service you can suggest?", "Where can I bury my dog?", [], "P"),
 ("Boarding & services", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "P"),
 ("Boarding & services", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Do you have Instagram?", [], "P"),
]

PRI = {"M": "mandatory", "I": "important", "O": "optional"}
order = {"M": 0, "I": 1, "O": 2}
here = os.path.dirname(os.path.abspath(__file__))
key, name = "pet_shop", "Pet shop"
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
