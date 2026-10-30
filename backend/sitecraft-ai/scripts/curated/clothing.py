# Hand-written (curated) question banks for clothing businesses: saree &
# textile showroom, readymade garments store, boutique & designer wear, and
# kids wear shop.
# Run: python3 scripts/curated/clothing.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: S = saree & textile showroom, G = readymade garments / family fashion store,
#       B = boutique & designer wear, K = kids wear shop, T = tailor shop.
# Each owner is asked only the questions tagged for their business.
# A * in the tags marks a city-only question, asked only to shops in a district
# headquarters or city (local shops rarely know these).
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, main items, return/exchange, home delivery, EMI, offers, photos)
# are asked separately, so they are not repeated here.
import json, os, datetime

YN = ["Yes", "No"]
SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL and above"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Products & collections", "M", "list", "Which sarees do you sell?", "Do you have pattu sarees?", ["Pattu / silk", "Cotton", "Handloom", "Fancy / georgette / chiffon", "Designer / party wear", "Bridal", "Daily wear", "Kora / organza"], "S"),
 ("Products & collections", "I", "list", "Which traditional sarees do you have?", "Do you have Kanchi pattu?", ["Kanchipuram", "Dharmavaram", "Gadwal", "Pochampally / ikkat", "Uppada", "Venkatagiri", "Mangalagiri", "Narayanpet", "Banarasi", "Paithani"], "S"),
 ("Products & collections", "I", "list", "What else do you sell besides sarees?", "Do you have dress materials?", ["Dress materials", "Shirting & suiting", "Dhotis / pancha & kanduva", "Lehengas & half-sarees", "Blouse pieces & lining cloth", "Readymade blouses", "Bed sheets & towels", "Readymade garments"], "S"),
 ("Products & collections", "M", "list", "Whose clothes do you sell?", "Do you have men's wear?", ["Men", "Women", "Kids", "Teens", "Plus size"], "G"),
 ("Products & collections", "M", "list", "Which clothes do you sell?", "Do you have kurtis?", ["Shirts & T-shirts", "Jeans & trousers", "Formals / office wear", "Ethnic wear (kurtas, sherwanis)", "Indo-western / fusion", "Kurtis & sets", "Western wear (tops, dresses)", "Nightwear & innerwear", "Sportswear", "Winter & rain wear (jackets)"], "G"),
 ("Products & collections", "M", "list", "What do you make or sell?", "Do you make bridal blouses?", ["Designer blouses", "Bridal lehengas & half-sarees", "Designer dresses / gowns", "Kurtis & salwar suits", "Kids' designer wear", "Men's ethnic (sherwani, kurta)", "Indo-western", "Readymade designer collection"], "B"),
 ("Products & collections", "M", "list", "Which age groups do you have clothes for?", "Do you have clothes for a 1-year-old?", ["Newborn (0–6 months)", "Babies (6–24 months)", "2–5 years", "6–10 years", "11–15 years"], "K"),
 ("Products & collections", "M", "list", "Which kids' clothes do you sell?", "Do you have pattu langa for girls?", ["Daily wear", "Party wear & frocks", "Ethnic (pattu langa, kurta-pyjama, dhoti sets)", "Night suits", "Baby essentials (jablas, nappies, wrappers)", "School wear", "Winter wear", "Fancy dress costumes"], "K"),
 ("Products & collections", "I", "text", "Which brands do you sell?", "Do you have Peter England?", [], "GK"),
 ("Products & collections", "I", "options", "Are your clothes branded, your own label, or non-branded?", "Is this a branded shirt?", ["Branded", "Our own label", "Non-branded", "Mix of all"], "GK"),
 ("Products & collections", "I", "list", "Which collections do you have?", "Do you have office wear?", ["Daily wear", "Office wear", "Party wear", "Festival wear", "Wedding wear", "Casual / college wear"], "SGB"),
 ("Products & collections", "I", "text", "What is the price range of your sarees (lowest to highest)?", "Do you have sarees under ₹1,000?", [], "S"),
 ("Products & collections", "I", "text", "What is the price range of your clothes?", "Shirts start from how much?", [], "GK"),
 ("Products & collections", "I", "text", "What is the starting price for a designer blouse and for a bridal lehenga?", "How much for a bridal blouse?", [], "B"),
 ("Products & collections", "O", "yes_no", "Do your staff drape a saree on the customer (single pleat) to see it in the mirror, and can customers take photos to send home?", "Can you drape it on me so I can send a photo home?", YN, "S"),
 ("Products & collections", "O", "text", "If a customer buys a readymade lehenga, do you fit it (side zip, latkans, blouse stitching)? Free or charged?", "Will you fit the lehenga to my size?", [], "B"),
 ("Products & collections", "O", "yes_no", "Do you have a separate wedding collection (bridal lehengas, pattu sarees, sherwanis)?", "Where is the wedding collection?", YN, "SGB"),
 ("Products & collections", "O", "yes_no", "Do you sell matching sets for the whole family (same colour for couple, kids, family)?", "Do you have matching dresses for the family?", YN, "SGBK"),
 ("Products & collections", "O", "yes_no", "Do you also sell unstitched shirting & suiting cloth?", "Do you have shirt cloth?", YN, "G"),
 ("Products & collections", "O", "text", "Which latest trending styles do you have right now?", "Do you have the latest trend?", [], "GBK"),
 ("Products & collections", "O", "yes_no", "Do you have return-gift sarees or clothes in bulk for functions?", "Do you have sarees for return gifts?", YN, "S"),
 ("Products & collections", "O", "text", "After the function, do you take back unused return-gift sarees (folds unopened) and give other clothes instead?", "Can I return the extra return-gift sarees after the wedding?", [], "S"),
 ("Products & collections", "O", "yes_no", "Do you sell groom combos (sherwani with matching pagdi, mojari and dupatta)?", "Do you have a full groom set?", YN, "GB"),
 ("Products & collections", "O", "yes_no", "Do you have iron-free / crease-resistant shirts?", "Do you have non-iron shirts?", YN, "G*"),
 ("Products & collections", "O", "list", "Which size systems do your clothes follow?", "Is this UK size?", ["Indian sizes", "UK sizes", "US sizes", "Mixed (depends on the brand)"], "G*"),
 ("Products & collections", "O", "yes_no", "Do you have jeans in different lengths (short, regular, long) for the same waist size?", "Do you have this jeans in a longer length?", YN, "G*"),
 ("Products & collections", "O", "yes_no", "Do you have different fits (slim, regular, comfort)?", "Do you have a regular fit shirt?", YN, "G"),
 ("Products & collections", "O", "yes_no", "Do you have loose / broader fits for healthier kids?", "Do you have a loose fit for my chubby son?", YN, "K"),
 ("Products & collections", "O", "yes_no", "Do you have a seconds section (small defects at lower prices)?", "Do you sell seconds?", YN, "SGK"),
 ("Products & collections", "O", "yes_no", "Do you have cotton / breathable clothes for summer?", "Any cotton clothes for summer?", YN, "GK"),
 ("Products & collections", "O", "yes_no", "Do you sell maternity and feeding wear?", "Do you have feeding kurtis?", YN, "G"),
 ("Products & collections", "O", "yes_no", "Do you sell school uniforms?", "Do you have uniforms for my child's school?", YN, "GK"),
 ("Products & collections", "O", "yes_no", "Do you sell innerwear, socks, thermals, sweaters and raincoats?", "Do you have innerwear?", YN, "GK"),
 ("Products & collections", "O", "options", "Is trial or exchange allowed on innerwear?", "Can I exchange innerwear?", ["No trial or exchange", "Exchange only if the pack is unopened", "Trial and exchange allowed"], "GK"),
 ("Products & collections", "O", "yes_no", "Do you sell matching accessories (dupattas, belts, wallets, ties, handkerchiefs, caps, hair accessories, handbags)?", "Do you have a matching dupatta?", YN, "SGBK"),

 ("Fabric & quality", "I", "yes_no", "Are your pure silk sarees Silk Mark certified?", "Is this pure silk?", YN, "S"),
 ("Fabric & quality", "I", "options", "What zari do your silk sarees have?", "Is this real zari?", ["Pure (silver with gold coating)", "Half-fine / tested zari", "Imitation zari", "All types, clearly told"], "S"),
 ("Fabric & quality", "O", "text", "How can customers check if a saree is pure silk or handloom?", "How do I know it's real handloom?", [], "S"),
 ("Fabric & quality", "I", "yes_no", "Is the fabric (cotton, silk, polyester, rayon) written on the tag or told to customers?", "Is this pure cotton?", YN, "SGBK"),
 ("Fabric & quality", "O", "yes_no", "Will the colour run in the first wash for some clothes? Do you tell customers?", "Will the colour come out in washing?", YN, "SGK"),
 ("Fabric & quality", "O", "yes_no", "Will cotton clothes shrink after washing? Do you tell customers?", "Will it shrink?", YN, "SGK"),
 ("Fabric & quality", "I", "yes_no", "Are your baby and newborn clothes made of soft, organic or anti-allergy cotton?", "Is it soft for my baby's skin?", YN, "K"),
 ("Fabric & quality", "O", "yes_no", "Do your kids' clothes avoid sharp buttons, hard zips, loose beads and net or zari that pricks the skin (soft cotton lining inside)?", "Will the beads come off in my baby's mouth?", YN, "K"),
 ("Fabric & quality", "I", "text", "If a customer finds a defect at home (tear, loose threads, missing button, stain), do you replace it or give another colour? Within how many days?", "There's a hole in the shirt, will you change it?", [], "SGK"),
 ("Fabric & quality", "O", "yes_no", "Do you give a free saree cover / bag with silk sarees?", "Will I get a saree cover?", YN, "S"),
 ("Fabric & quality", "O", "text", "How do you check the quality of non-branded clothes before selling them?", "Is this non-branded shirt good quality?", [], "SGK*"),
 ("Fabric & quality", "O", "yes_no", "Do you sell eco-friendly fabrics (organic cotton, natural dyes, recycled fabric)?", "Do you have eco-friendly clothes?", YN, "SGBK*"),
 ("Fabric & quality", "O", "yes_no", "Before billing, do you open the full saree and check it with the customer for pulled threads, holes and print mistakes?", "Can you open the saree and check it?", YN, "S"),
 ("Fabric & quality", "O", "text", "Do you give any guarantee on colour (fading or bleeding) or bobbles (pilling) after washing? Do you replace it?", "What if the colour fades or bobbles come?", [], "SGK"),
 ("Fabric & quality", "O", "text", "Which clothes need dry cleaning only, and how should customers wash, iron (zari, heavy work) and care for the rest?", "Can I wash this at home?", [], "SGBK"),
 ("Fabric & quality", "O", "options", "Do your sarees come with a blouse piece?", "Is the blouse piece included?", ["Yes, all sarees", "Most sarees", "No"], "S"),
 ("Fabric & quality", "O", "text", "What is the usual length of your sarees (with and without blouse piece)?", "How many metres is this saree?", [], "S"),
 ("Fabric & quality", "O", "text", "Do your dress materials come with a dupatta and bottom cloth? How many metres each?", "Is the dupatta included?", [], "S"),

 ("Sizes & fit", "M", "list", "Which sizes do you stock?", "Do you have XXL?", SIZES, "G"),
 ("Sizes & fit", "I", "yes_no", "Do you have plus sizes (3XL and above)?", "Do you have 5XL?", YN, "GB"),
 ("Sizes & fit", "I", "yes_no", "Do you have a trial room?", "Can I try this on?", YN, "GBKT"),
 ("Sizes & fit", "O", "yes_no", "Do you have a size chart (by age, height or measurements)?", "Which size for a 5-year-old?", YN, "GK"),
 ("Sizes & fit", "O", "yes_no", "Do you have a full mirror and good lighting to see saree colours properly?", "Can I see the saree in daylight?", YN, "S"),
 ("Sizes & fit", "O", "text", "If a size is not available, can you get it? How many days?", "Can you get this in M size?", [], "GK"),

 ("Stitching & alterations", "I", "yes_no", "Do you do fall and pico for sarees bought here?", "Will you do fall and pico?", YN, "S"),
 ("Stitching & alterations", "I", "text", "What is the charge for fall and pico, and how many days does it take?", "How much for fall pico?", [], "S"),
 ("Stitching & alterations", "I", "yes_no", "Do you have in-house tailors to stitch new clothes (blouses, dresses, shirts, safari suits)?", "Do you stitch blouses?", YN, "SGB"),
 ("Stitching & alterations", "I", "text", "What are your stitching charges (blouse with and without lining, designer cuts like princess, boat neck, high neck, sabyasachi or backless, padded blouse, salwar, lehenga with can-can, kids' pattu pavadai and frocks)?", "Blouse stitching charge?", [], "SBT"),
 ("Stitching & alterations", "I", "text", "How many days does stitching take, do you give an exact delivery date and time, and is urgent (same-day) stitching available? Extra charge?", "Can I get the blouse in 2 days?", [], "SBT"),
 ("Stitching & alterations", "I", "list", "Which work do you do?", "Do you do maggam work?", ["Hand maggam / aari work", "Computer embroidery", "Couple portraits & names in embroidery", "Zardosi", "Stone / bead work", "Hand painting", "Tassels / latkans"], "BT"),
 ("Stitching & alterations", "M", "list", "What do you stitch?", "Do you stitch gents shirts?", ["Ladies blouses", "Salwar / churidar / kurtis", "Lehengas & long frocks", "Kids' wear (pattu pavadai, frocks)", "Western wear (formal pants, blazers, jumpsuits, dhoti pants)", "Maternity / feeding kurtis", "Gents shirts & pants", "Suits, blazers & sherwanis", "Uniforms (school, office, police, doctor coats)", "Curtains, cushion & sofa covers", "Alterations"], "T"),
 ("Stitching & alterations", "I", "text", "Do you provide lining cloth (pure cotton, pre-shrunk), or should customers bring it?", "Do I bring the lining cloth?", [], "BT"),
 ("Stitching & alterations", "I", "yes_no", "Can customers check on WhatsApp or by phone whether their order is ready?", "Is my blouse ready?", YN, "BT"),
 ("Stitching & alterations", "I", "yes_no", "Do you use non-tarnish beads and zari, lock-stitch the work so beads don't fall, and keep underarms free of beads?", "Will the maggam beads turn black?", YN, "BT"),
 ("Stitching & alterations", "O", "text", "Do you stitch blouses with maggam work done elsewhere? Is there an extra charge?", "Can you stitch my maggam blouse piece?", [], "BT"),
 ("Stitching & alterations", "I", "text", "How do you avoid common fitting problems (shoulders slipping, armhole wrinkles, front hook gaps), and design for plus sizes?", "My blouse shoulders keep slipping, can you fix that?", [], "BT"),
 ("Stitching & alterations", "O", "list", "Which finishing do you offer?", "Can you add latkans?", ["Piping", "Latkans / tassels", "Rust-free hooks", "Hand-made hook loops", "Overlock inside", "Extra margin to loosen later", "Saree pin holder loop", "Concealed feeding zips", "Leftover pieces returned"], "BT"),
 ("Stitching & alterations", "O", "text", "If the cloth is short (for example for elbow sleeves), how do you adjust it?", "My blouse piece is short, can you still do elbow sleeves?", [], "BT"),
 ("Stitching & alterations", "O", "yes_no", "Can you convert old sarees into dresses or mother-daughter combos?", "Can you make frocks from my old pattu saree?", YN, "BT"),
 ("Stitching & alterations", "O", "text", "What discount do you give on bulk orders (for example 5–10 wedding blouses)?", "Any discount for 10 blouses?", [], "BT"),
 ("Stitching & alterations", "I", "text", "Do you alter readymade clothes (length, side stitches, zips) and repair tears?", "Can you shorten my jeans?", [], "T"),
 ("Stitching & alterations", "O", "text", "For gents shirts and pants, what are the charges, and do you use good pocket cloth and branded zips?", "How much for a shirt and pant?", [], "T"),
 ("Stitching & alterations", "O", "yes_no", "For school uniforms, do you leave extra length to let out next year?", "Can you leave extra length in the uniform?", YN, "T"),
 ("Stitching & alterations", "O", "text", "Do you sell fabric and do colour-matched dyeing (colour-fast)?", "Can you dye cloth to match my saree?", [], "BT"),
 ("Stitching & alterations", "O", "yes_no", "Do you visit homes for measurements and deliver stitched clothes, and stitch for outstation or NRI customers from video-call measurements?", "Can you take measurements at home?", YN, "BT"),
 ("Stitching & alterations", "I", "text", "If you spoil a customer's cloth (wrong cut, iron burn, oil stain), lose a sample blouse, or stitch a different design, what do you do?", "You ruined my pattu blouse, what now?", [], "BT"),
 ("Stitching & alterations", "O", "text", "How are maggam / aari work charges decided (simple to heavy bridal), and how many days does it take?", "How long for maggam work on my bridal blouse?", [], "SBT"),
 ("Stitching & alterations", "I", "text", "How much advance do you take for stitching orders?", "How much advance should I pay?", [], "BT"),
 ("Stitching & alterations", "I", "options", "How do you take measurements?", "Should I bring a sample blouse?", ["At the shop", "From a sample garment", "Customer sends measurements", "Both"], "SBT"),
 ("Stitching & alterations", "O", "yes_no", "Do you have women tailors / staff to take measurements for ladies?", "Is there a lady to take measurements?", YN, "SBT"),
 ("Stitching & alterations", "I", "text", "How many trial fittings do you give, are small alterations done on the spot, and is re-stitching free if the fitting or work is not right?", "If the fitting is wrong, will you correct it free?", [], "SBT"),
 ("Stitching & alterations", "O", "yes_no", "Can customers bring their own cloth for stitching?", "Can I bring my own cloth?", YN, "B"),
 ("Stitching & alterations", "O", "yes_no", "Can you make a design from a photo the customer shows?", "Can you make this design from Instagram?", YN, "BT"),
 ("Stitching & alterations", "O", "text", "During the wedding season, how early should customers order?", "How early should I give my bridal blouse?", [], "BT"),
 ("Stitching & alterations", "I", "options", "Do you alter clothes bought from you (length, waist, sleeves)?", "Can you shorten the pant?", ["Free alteration", "Paid alteration", "No alteration"], "GK"),
 ("Stitching & alterations", "O", "text", "Is a tailor available at the shop, and how long do alterations take?", "When will the alteration be ready?", [], "GK"),
 ("Stitching & alterations", "O", "yes_no", "Do you stitch dhoti / pancha kattu or pre-stitched sarees?", "Can you make a ready-to-wear saree?", YN, "SBT"),
 ("Stitching & alterations", "O", "list", "Which saree works do you do?", "Can you put fall and pico?", ["Fall & pico", "Hand-hemmed fall", "Kuchulu / crochet / bead tassels", "Pre-pleating & box folding", "Zari border patchwork from old sarees", "Invisible darning (raffu)"], "SBT"),
 ("Stitching & alterations", "O", "text", "What do saree works cost (fall & pico, kuchulu, pre-pleating)?", "How much for fall and pico?", [], "SBT"),

 ("Prices & billing", "I", "options", "Are your prices fixed, or can customers bargain?", "Is there any discount on this price?", ["Fixed price", "Small discount possible", "Bargaining allowed"], "SGBK"),
 ("Prices & billing", "I", "yes_no", "Is the price (MRP) printed on the tag of every item?", "Where is the price tag?", YN, "SGK"),
 ("Prices & billing", "O", "options", "Is GST included in the price or added on the bill?", "Is GST extra?", ["Included", "Added on the bill"], "SGBKT"),
 ("Prices & billing", "O", "text", "Do you give wholesale rates or extra discount on big wedding purchases (for example above ₹50,000, or 10+ sarees)?", "Any discount if we buy for the whole wedding?", [], "SG"),
 ("Prices & billing", "O", "text", "In which months do you have sales (Sankranti, Dasara, Diwali, end of season, stock clearance)?", "When is your sale?", [], "SGK"),
 ("Prices & billing", "O", "yes_no", "Do you sell gift vouchers / gift cards?", "Do you have a gift card?", YN, "SGK"),
 ("Prices & billing", "O", "yes_no", "Do you accept Sodexo / Pluxee or other company gift coupons?", "Can I pay with Sodexo coupons?", YN, "SG"),
 ("Prices & billing", "O", "text", "Do you give special discounts for students (college ID) or corporate employees?", "Any student discount?", [], "SGBK"),
 ("Prices & billing", "O", "yes_no", "Do you sell to resellers or small shops at wholesale rates?", "Do you give wholesale rates?", YN, "SGK"),
 ("Prices & billing", "O", "text", "Do you give discounts for corporate, school or group orders (uniforms, T-shirts)?", "Can you do 100 T-shirts for our office?", [], "GK"),

 ("Exchange details", "O", "text", "Can a saree be exchanged after fall and pico or blouse cutting is done?", "Can I exchange it after fall pico?", [], "S"),
 ("Exchange details", "O", "text", "Do exchange and alteration apply to sale or discount items too?", "Can I exchange a sale item?", [], "SGK"),
 ("Exchange details", "O", "text", "What if a stitched dress doesn't fit or the customer doesn't like it? Refund, redo or correction?", "What if I don't like the stitched dress?", [], "BT"),
 ("Exchange details", "O", "text", "For exchange, are the original price tag and bill both needed? Can gifts be exchanged with only the tag?", "Do I need the bill to exchange?", [], "SGK"),
 ("Exchange details", "O", "yes_no", "Do you exchange clothes that are already washed or altered?", "I washed it once, can I still exchange it?", YN, "GK"),
 ("Exchange details", "O", "options", "On returns, do you give money back or a store credit?", "Will I get my money back?", ["Money back", "Store credit / credit note", "Exchange only"], "SGK"),

 ("Stock & orders", "I", "yes_no", "Can customers see new designs on WhatsApp (photos or video call) and order?", "Can you send me photos of new sarees?", YN, "SGBK"),
 ("Stock & orders", "O", "text", "How often does new stock come in, and on which day usually?", "When does the new collection come?", [], "SGK"),
 ("Stock & orders", "O", "yes_no", "Can customers reserve a piece for a few days by paying an advance?", "Can you keep this aside for me?", YN, "SGBK"),
 ("Stock & orders", "O", "yes_no", "Can you get the same design in another colour?", "Do you have this in green?", YN, "SGK"),
 ("Stock & orders", "O", "yes_no", "Do you send sarees / clothes for selection to the customer's home (for weddings or elders)?", "Can you bring sarees to our house for selection?", YN, "SB"),
 ("Stock & orders", "O", "text", "Do you courier to other cities and abroad? What are the charges?", "Can you send it to the USA?", [], "SGBK"),
 ("Stock & orders", "O", "options", "If a customer doesn't like clothes sent by courier, how do they return them?", "Will you pick it up if I don't like it?", ["We arrange return pickup", "Customer sends it back", "Exchange at the shop only"], "SGBK"),
 ("Stock & orders", "O", "yes_no", "Do you take custom weaving orders (name or design woven into the saree)?", "Can you weave our names in the saree?", YN, "S"),
 ("Stock & orders", "O", "yes_no", "Do you rent bridal lehengas, sherwanis or costumes?", "Can I rent a lehenga?", YN, "BK"),

 ("Shop & service", "O", "options", "Are carry bags free, or charged on the bill?", "Do I have to pay for the bag?", ["Free paper / cloth bag", "Free plastic bag", "Charged (₹5–10)"], "SGBK"),
 ("Shop & service", "O", "yes_no", "Do you send the bill on WhatsApp or SMS?", "Can you send the bill on WhatsApp?", YN, "SGBK"),
 ("Shop & service", "O", "yes_no", "Do you do gift wrapping or gift box packing?", "Can you gift-pack it?", YN, "SGBK"),
 ("Shop & service", "O", "yes_no", "Do you have seating for families and a kids' play area?", "Is there a place to sit?", YN, "SGK"),
 ("Shop & service", "O", "text", "What are your busy hours, and how long is the wait for trial rooms then?", "Is there a long queue for trial rooms?", [], "GK"),
 ("Shop & service", "O", "yes_no", "Do you have a private room or bridal lounge for bride and groom shopping?", "Is there a private room for bridal shopping?", YN, "SGB"),
 ("Shop & service", "O", "yes_no", "Do you take appointments for bridal or designer consultation?", "Can I book an appointment?", YN, "SB"),
 ("Shop & service", "O", "text", "Do you give loyalty points, and can they be used on the next bill?", "Do I get points?", [], "SGBK"),
 ("Shop & service", "O", "yes_no", "Does a sales assistant help each customer with selection?", "Can someone help me choose?", YN, "SGBK"),
 ("Shop & service", "O", "text", "If customers have a complaint (staff behaviour, billing delay), whom can they talk to?", "Can I talk to the manager?", [], "SGBK"),
 ("Shop & service", "O", "yes_no", "If customers forget a bag or item in the trial room, do you keep it safe for them?", "I left my bag in the trial room, do you have it?", YN, "SGBK"),
 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "SGBKT"),
 ("Shop & service", "O", "text", "Please share your Instagram page and Google reviews link, if you have them.", "Do you have Instagram?", [], "SGBKT"),
]

TYPES = [("saree_textiles", "Saree & textile showroom", "S"), ("readymade_garments", "Readymade garments / family fashion store", "G"),
         ("tailor_shop", "Tailor shop (ladies & gents)", "T"),
         ("boutique", "Boutique & designer wear", "B"), ("kids_wear", "Kids wear shop", "K")]
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
