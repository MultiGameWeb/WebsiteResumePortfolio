# Hand-written (curated) question banks for stationery shops, xerox &
# printing shops, MeeSeva / online service centres, and shops that do all
# three.
# Run: python3 scripts/curated/stationery_online.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: S = stationery, X = xerox & printing, M = MeeSeva / online centre.
# The combined shop gets every question tagged S, X or M.
# Core questions (name, address, map, parking, timings, holiday, phone,
# WhatsApp, return/exchange, home delivery, offers, photos) are asked
# separately. Payment methods are not asked.
# The assistant never helps make fake or edited documents and never asks for
# OTPs (see botcraft-salesbot.js).
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Stationery", "M", "list", "Which stationery items do you sell?", "Do you have record books?", ["Notebooks & long books", "Record books", "Pens, pencils & markers", "Drawing books, colour pencils & crayons", "Chart, graph & project sheets", "Exam pads & clipboards", "Geometry boxes & calculators", "School bags, bottles & lunch boxes", "Office stationery (files, registers, staplers)", "Guides & study material", "File covers & document folders"], "S"),
 ("Stationery", "I", "yes_no", "If parents give the school book list, do you pack the full set (or a ready set for a particular school)?", "Can you give the full 5th class set for our school?", YN, "S"),
 ("Stationery", "I", "text", "Do you give discounts for bulk buying (full book lists, schools, offices)?", "Any discount for the full list?", [], "S"),
 ("Stationery", "O", "yes_no", "Can customers send their list or photos on WhatsApp and collect the packed order later?", "Can I send the list on WhatsApp?", YN, "S"),
 ("Stationery", "O", "yes_no", "Are prices printed (MRP) or shown on a price list?", "Is there a price list?", YN, "S"),

 ("Xerox & printing", "M", "list", "Which print and document services do you offer?", "Do you do colour xerox?", ["Black & white xerox", "Colour xerox", "A3 printing", "Both-side printing", "ID card front & back on one page", "Print from WhatsApp / email / pen drive", "Colour photo prints", "Passport-size photos", "Scan to PDF (and old photo scanning)", "Lamination (small & large)", "Spiral binding", "Hard binding (thesis)", "Typing (Telugu & English)", "Resume / biodata", "Photo & signature resize for applications"], "X"),
 ("Xerox & printing", "I", "text", "What are your rates: black & white and colour per page (A4, A3), bulk rate, lamination, binding and passport photos?", "How much per page for xerox?", [], "X"),
 ("Xerox & printing", "O", "yes_no", "Can you copy selected pages of a book without removing its binding?", "Can you copy only page 45 without opening the book?", YN, "X"),
 ("Xerox & printing", "O", "text", "For bulk jobs (100+ pages, project reports, thesis binding), how long does it take?", "When will my project binding be ready?", [], "X"),
 ("Xerox & printing", "O", "text", "Do you type from handwriting, letters or forms, and correct mistakes and reprint? What is the charge?", "Can you type my handwritten letter?", [], "X"),
 ("Xerox & printing", "I", "yes_no", "Do you delete customers' files from your computer and phone after printing or scanning, and send scans only to the customer?", "Will you delete my Aadhaar file after printing?", YN, "XM"),

 ("MeeSeva & certificates", "I", "list", "What kind of centre are you?", "Is this an official MeeSeva?", ["Authorised MeeSeva centre", "CSC (Common Service Centre)", "Aadhaar update centre", "Private online centre (help with applications)"], "M"),
 ("MeeSeva & certificates", "M", "list", "Which certificate services do you offer?", "Can I apply for an income certificate here?", ["Income", "Caste", "Residence", "Birth", "Death", "Family member", "EWS", "Land records (pahani / adangal / 1-B)", "Encumbrance certificate (EC)"], "M"),
 ("MeeSeva & certificates", "I", "text", "For each certificate or service, which documents should customers bring, and what is the government fee plus your service charge?", "What documents for a caste certificate?", [], "M"),
 ("MeeSeva & certificates", "I", "text", "How many days do certificates usually take, and can you check the application status?", "When will my income certificate come?", [], "M"),

 ("Online applications", "M", "list", "Which online applications do you help with?", "Can you fill my job application?", ["Government job applications", "Hall tickets & results", "Scholarships", "College admissions", "Government schemes", "Pensions", "Ration card", "Passport", "PAN card (new, corrections, PAN–Aadhaar link)", "Voter ID (new, voter list search, e-EPIC download)", "Driving licence services", "Aadhaar update (address, name, mobile link check)", "Aadhaar download & PVC card", "University exam fees, memos & duplicate certificates", "Entrance exam & counselling registration", "Private job applications & job portal accounts", "Udyam (MSME) registration", "GST registration", "Trade licence & shop registration", "FSSAI food licence"], "M"),
 ("Online applications", "I", "yes_no", "Before submitting, do you show the filled form to the customer to check, and give a printed copy or receipt?", "Can I check the form before you submit?", YN, "M"),
 ("Online applications", "I", "text", "If an application has a mistake, is rejected, is pending, or its number is lost, do you help correct it, find the reason, re-apply, recover the number and follow up? Whom should customers contact for long delays?", "My application was rejected, can you check why?", [], "M"),
 ("Online applications", "O", "list", "Which banking help do you give?", "Can you download my bank statement?", ["Bank account opening (online)", "KYC document upload", "Statement download & print", "Bank complaints", "Failed or double UPI payment complaints", "Aadhaar–bank link (DBT) check", "Government fee payment & receipts", "None"], "M"),
 ("Online applications", "O", "yes_no", "Do you tell customers when job notifications or scheme last dates come?", "Will you tell me when the police notification comes?", YN, "M"),
 ("Online applications", "O", "text", "Can application fees be paid at your centre, and is there an extra charge?", "Can I pay the exam fee here?", [], "M"),
 ("Online applications", "O", "yes_no", "Does the applicant need to come in person for OTP or fingerprint (Aadhaar, PAN), and do you ask for OTPs only in person, never on call or chat?", "Do I have to come for the OTP?", YN, "M"),
 ("Online applications", "O", "list", "Which tickets do you book?", "Can you book a train ticket?", ["Train", "Bus", "Flight", "None"], "M"),
 ("Online applications", "O", "text", "On busy days (last dates), how long is the wait, and do you give tokens?", "Is it crowded on the last date?", [], "XM"),

 ("Shop & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "SXM"),
 ("Shop & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "SXM"),
]

TYPES = [("stationery_shop", "Stationery shop", "S"),
         ("xerox_printing", "Xerox & printing shop", "X"),
         ("meeseva_online", "MeeSeva / online service centre", "M"),
         ("stationery_xerox_online", "Stationery, xerox & online centre", "SXM")]
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
