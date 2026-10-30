# Hand-written (curated) question banks for clinics and diagnostic labs:
# doctor's clinic (general & specialists), dental clinic, skin & hair clinic,
# physiotherapy centre, Ayurveda / homeopathy clinic, and diagnostic lab &
# scan centre.
# Run: python3 scripts/curated/clinic_lab.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: K = clinic, D = dental, S = skin & hair, P = physiotherapy,
# A = Ayurveda / homeopathy, L = lab & scans.
# Core questions (name, address, map, parking, timings, weekly holiday, phone,
# WhatsApp, offers, photos, Wi-Fi) are asked separately. Payment methods are
# not asked. Medical questions (which medicine, what to eat, is my report
# normal) are never asked or answered: the assistant sends patients to the
# doctor, and emergencies to 108.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Doctors & services", "M", "list", "Which specialities are available?", "Is there a child specialist?", ["General physician", "Child specialist", "Gynaecologist", "Orthopaedic", "ENT", "Eye", "Diabetologist", "Cardiologist", "Dermatologist", "Psychiatrist", "General surgeon"], "K"),
 ("Doctors & services", "I", "text", "Who are the doctors, their qualifications and medical council registration numbers?", "Is the doctor an MD?", [], "KDSPA"),
 ("Doctors & services", "I", "yes_no", "Does the senior doctor see every patient personally?", "Will the main doctor see me?", YN, "KDSPA"),
 ("Doctors & services", "I", "yes_no", "Is there a lady doctor, or a lady staff member present when a male doctor examines women?", "Is there a lady doctor?", YN, "KDSPAL"),

 ("Fees & appointments", "M", "text", "What is the consultation fee, for how many days is the follow-up free, and is there a fee just to show reports?", "How much is the doctor's fee?", [], "KDSPA"),
 ("Fees & appointments", "I", "text", "Do patients need an appointment, or can they walk in? Do you give tokens by phone or WhatsApp?", "Can I book a token on the phone?", [], "KDSPA"),
 ("Fees & appointments", "O", "text", "What time does the doctor usually start, and how long is the usual wait?", "How long will I wait?", [], "KDSPA"),
 ("Fees & appointments", "O", "text", "Is the clinic open on festival days?", "Is the clinic open on Sankranti?", [], "KDSPAL"),
 ("Fees & appointments", "O", "text", "Do you offer video consultations or home visits? At what fee?", "Can the doctor come home?", [], "KDSPA"),
 ("Fees & appointments", "O", "text", "If a patient has a doubt or reaction after the visit, how can they reach the clinic?", "Whom do I call if the medicine doesn't suit me?", [], "KDSPA"),

 ("Pharmacy & tests", "I", "options", "Must medicines be bought at your pharmacy?", "Can I buy the medicines outside?", ["Patients can buy anywhere", "Some medicines only at our pharmacy", "We have no pharmacy"], "K"),
 ("Pharmacy & tests", "O", "text", "Do you give a discount on medicines, and take back unopened strips?", "Will you take back unused tablets?", [], "K"),
 ("Pharmacy & tests", "I", "yes_no", "Does the doctor accept recent reports from other labs instead of repeating the tests?", "I already did tests outside, will you see them?", YN, "KDSPA"),

 ("Procedures", "I", "list", "Which procedures do you do at the clinic?", "Can you do dressing here?", ["Injections & IV drips (with prescription)", "Wound dressing", "Stitches & stitch removal", "Nebulisation", "Ear wax cleaning", "Foreign body removal (ear, nose, eye)", "Minor surgery (warts, corns, lipoma, cysts)", "Child vaccinations"], "K"),
 ("Procedures", "O", "text", "What do the common procedures cost (injection, dressing, stitches, nebulisation)?", "How much for dressing?", [], "K"),
 ("Procedures", "O", "text", "Which child vaccines do you give (including less-painful versions), and what do they cost?", "Do you have painless vaccines?", [], "K"),
 ("Procedures", "O", "yes_no", "Does the eye doctor give the spectacle power on paper so patients can buy glasses anywhere?", "Will you give me the power to buy glasses outside?", YN, "K"),
 ("Procedures", "I", "yes_no", "Do you sterilise instruments (autoclave) and use disposable needles?", "Are the instruments sterilised?", YN, "KDS"),

 ("Dental", "M", "text", "What do extraction, scaling, root canal and crowns (metal-ceramic, zirconia) cost?", "How much is a root canal?", [], "D"),
 ("Dental", "I", "text", "How many sittings does a root canal take, how do you keep it as painless as possible, and what warranty do crowns have?", "Is root canal painful?", [], "D"),
 ("Dental", "O", "text", "What do braces and clear aligners cost, and can they be paid in instalments?", "How much for braces?", [], "D"),

 ("Skin & hair", "M", "text", "Which treatments do you offer, and what does each session cost (chemical peel, hydrafacial, laser hair removal, PRP)?", "How much is laser hair removal?", [], "S"),
 ("Skin & hair", "I", "yes_no", "Are treatments done or supervised by a dermatologist?", "Will a dermatologist do it?", YN, "S"),
 ("Skin & hair", "I", "yes_no", "Do you explain possible side effects and do a patch test before treatments?", "Will it burn my skin?", YN, "S"),

 ("Physiotherapy", "M", "text", "What is the fee per session, and for packages of 10–15 sessions?", "How much per physio session?", [], "P"),
 ("Physiotherapy", "I", "list", "Which conditions do you treat?", "Do you treat back pain?", ["Back & neck pain", "Stroke / paralysis rehab", "Sports injuries", "After surgery", "Arthritis & knee pain", "Children's therapy"], "P"),
 ("Physiotherapy", "I", "text", "Do you give physiotherapy at home? At what fee?", "Can the physio come home?", [], "P"),

 ("Ayurveda & homeopathy", "M", "text", "What are the consultation fee and usual medicine costs, and how long is a typical course?", "How many months of medicine?", [], "A"),
 ("Ayurveda & homeopathy", "I", "yes_no", "Are your medicines from licensed (AYUSH) manufacturers, and do you tell patients what is in them?", "Are there metals in these medicines?", YN, "A"),
 ("Ayurveda & homeopathy", "O", "text", "Do you offer panchakarma or other therapies? What do they cost?", "Do you do panchakarma?", [], "A"),

 ("Certificates & bills", "O", "text", "Which certificates do you issue (sick leave, fitness, Form 1A for driving licence), and what is the charge?", "Can I get a fitness certificate?", [], "KDSPA"),
 ("Certificates & bills", "O", "yes_no", "Do you give stamped prescriptions and GST bills for insurance or office reimbursement?", "Can I get bills for my insurance claim?", YN, "KDSPAL"),

 ("Lab tests", "M", "text", "What do your common tests cost (CBP, sugar, thyroid, lipid, LFT, KFT, vitamin D and B12), and what discount do you give?", "How much for a thyroid test?", [], "L"),
 ("Lab tests", "I", "text", "Which health packages do you have, and are there couple offers?", "Is there a full body checkup?", [], "L"),
 ("Lab tests", "O", "text", "How do your prices compare with online labs, and why should patients choose you?", "Online labs are cheaper, why you?", [], "L"),
 ("Lab tests", "I", "text", "Do you collect samples at home? From what time, and is there a charge?", "Can you take blood at home?", [], "L"),
 ("Lab tests", "I", "text", "What preparation do common tests need (fasting hours, water, morning medicines, post-lunch sugar timing, full bladder for scans, sample containers)?", "Should I come empty stomach?", [], "L"),
 ("Lab tests", "I", "text", "Do you open new sealed needles in front of the patient, use vacutainers, and draw blood once for all tests?", "Is the needle new?", [], "L"),
 ("Lab tests", "O", "yes_no", "Do you have experienced staff for babies, difficult veins and patients afraid of needles?", "My baby needs a blood test, can you do it gently?", YN, "L"),
 ("Lab tests", "I", "text", "Is your lab NABL accredited?", "Is your lab NABL?", [], "L"),
 ("Lab tests", "I", "options", "Are tests done in your own lab?", "Do you send samples outside?", ["All tests in-house", "Some sent to a partner lab", "Collection centre only"], "L"),
 ("Lab tests", "I", "text", "If a doctor doubts a result, do you re-test the stored sample free? How long do you keep samples?", "My report looks wrong, will you re-check?", [], "L"),
 ("Lab tests", "O", "yes_no", "Do you put barcode labels on samples in front of the patient?", "Will my sample get mixed up?", YN, "L"),
 ("Lab tests", "I", "text", "When are reports ready, can urgent reports come in 1–2 hours, and which tests take longer (culture, biopsy)?", "When will the report come?", [], "L"),
 ("Lab tests", "O", "yes_no", "Do you send reports on WhatsApp and give printed copies and films?", "Can you send the report on WhatsApp?", YN, "L"),
 ("Lab tests", "O", "yes_no", "Is a pathologist or doctor available to explain the report?", "Can someone explain my report?", YN, "L"),

 ("Scans", "I", "list", "Which scans and tests do you do?", "Do you do MRI?", ["X-ray", "Ultrasound", "Pregnancy scans (TIFFA, growth)", "Mammogram", "ECG", "2D echo", "TMT", "CT scan", "MRI", "Open MRI", "Lung function (PFT)"], "L"),
 ("Scans", "I", "yes_no", "Do you have a lady radiologist or lady technician for women's scans and ECGs?", "Is there a lady technician?", YN, "L"),
 ("Scans", "O", "yes_no", "Can one attender come inside during pregnancy scans?", "Can my husband come in for the scan?", YN, "L"),
 ("Scans", "O", "yes_no", "Before X-rays and CT, do you check for pregnancy and use lead aprons?", "I'm pregnant, is the X-ray safe?", YN, "L"),
 ("Scans", "O", "text", "For patients afraid of closed spaces, do you have open MRI or sedation? How do you screen for implants and pacemakers?", "I'm scared of the MRI tunnel", [], "L"),
 ("Scans", "O", "yes_no", "For contrast scans, do you check creatinine first and keep a doctor present?", "Is the contrast injection safe?", YN, "L"),
 ("Scans", "O", "yes_no", "Do you give scan images on CD or pen drive (DICOM) with the film?", "Will I get a CD of the scan?", YN, "L"),

 ("Privacy & service", "I", "yes_no", "Do you keep every patient's tests and reports confidential, sending reports only to the patient?", "Will my report be kept private?", YN, "KDSPAL"),
 ("Privacy & service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "KDSPAL"),
 ("Privacy & service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "KDSPAL"),
]

TYPES = [("clinic", "Clinic (doctor)", "K"), ("dental_clinic", "Dental clinic", "D"), ("skin_hair_clinic", "Skin & hair clinic", "S"),
         ("physiotherapy", "Physiotherapy centre", "P"), ("ayush_clinic", "Ayurveda / homeopathy clinic", "A"),
         ("diagnostic_lab", "Diagnostic lab & scan centre", "L")]
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
