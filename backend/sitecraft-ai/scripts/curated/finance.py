# Hand-written (curated) question banks for local finance businesses: loan &
# finance office (NBFC branch, private finance, loan agent), gold loan / pawn
# shop, both, chit fund company, and insurance & investment advisor.
# Run: python3 scripts/curated/finance.py  -> writes botcraft-banks/<type>.json
# Priorities: M = mandatory, I = important, O = optional.
# Tags: L = loans, G = gold loans, C = chit funds, I = insurance & investments.
# The finance & gold loan type gets every question tagged L or G.
# Core questions (name, address, map, parking, timings, phone, WhatsApp,
# offers, photos, Wi-Fi) are asked separately. Payment methods are not asked.
# General banking, tax and legal questions are not asked: the assistant points
# customers to their bank, a chartered accountant or official sources.
import json, os, datetime

YN = ["Yes", "No"]
Q = [
 # category, priority, answer_type, owner question, how a customer asks, options, tags
 ("Licence & trust", "M", "text", "Which registration or licence do you have (RBI-registered NBFC, state money-lenders licence, chit fund registration, IRDAI / AMFI)? Please give the number customers can check.", "Is your finance registered?", [], "LGCI"),
 ("Licence & trust", "I", "yes_no", "Do you explain the full cost (interest, all charges) in writing, in Telugu if needed, before the customer signs?", "Will you tell all charges before I sign?", YN, "LGCI"),
 ("Licence & trust", "I", "yes_no", "Do you give a receipt for every payment and a statement or NOC whenever the customer asks?", "Will I get a receipt for every payment?", YN, "LGC"),
 ("Licence & trust", "O", "text", "Who can customers contact with a complaint, and how soon do you reply?", "Whom do I complain to?", [], "LGCI"),

 ("Loans offered", "M", "list", "Which loans do you give or arrange?", "Do you give personal loans?", ["Personal loans", "Business / MSME loans (Mudra, PMEGP)", "Home & construction loans", "Loan against property", "Vehicle loans (new, used, tractor)", "Consumer durable loans", "Education loans", "Agriculture / Kisan credit card", "Daily / weekly repayment loans", "Women's group (SHG) loans", "Credit cards"], "L"),
 ("Loans offered", "M", "options", "Do you lend yourselves, or arrange loans from banks and NBFCs?", "Is this your own finance or a bank's?", ["We lend ourselves", "Agent / DSA for banks and NBFCs", "Both"], "L"),
 ("Interest & charges", "I", "text", "How is your interest quoted (per year or per month, flat or reducing balance, fixed or floating)? What are the usual rates?", "Is the interest flat or reducing?", [], "L"),
 ("Interest & charges", "I", "text", "What are the processing and other charges (documentation, stamp duty, valuation), how much reaches the customer's account, and is the fee refunded if the loan is rejected?", "How much will I actually get in hand?", [], "L"),
 ("Interest & charges", "O", "options", "Is loan insurance compulsory?", "Do I have to take loan insurance?", ["Optional", "Compulsory for some loans", "Not offered"], "L"),
 ("Interest & charges", "O", "text", "Do you deduct any advance interest or commission from the loan amount before giving it?", "Will you cut the first month's interest in advance?", [], "L"),
 ("Interest & charges", "O", "text", "For daily or weekly repayment schemes, what is the penalty for a late payment?", "What if I miss one day's payment?", [], "L"),

 ("Eligibility & documents", "I", "text", "Who can get a loan (minimum income, cash salary, small businesses without ITR or GST, age limits)?", "My salary is ₹15,000, how much loan can I get?", [], "L"),
 ("Eligibility & documents", "O", "text", "Do you consider people with a low or no CIBIL score, or an old settled loan?", "My CIBIL is low, will I get a loan?", [], "L"),
 ("Eligibility & documents", "O", "text", "When is a guarantor or co-applicant needed, and what do you explain to guarantors about their responsibility?", "Do I need a guarantor?", [], "L"),
 ("Eligibility & documents", "I", "text", "Which documents are needed, and do you keep any originals?", "What documents do I need?", [], "LGC"),
 ("Eligibility & documents", "O", "text", "Do you take blank signed cheques or promissory notes, and are they returned when the loan is closed?", "Will you return my cheques after I close the loan?", [], "LG"),
 ("Eligibility & documents", "O", "yes_no", "Do your officers visit the home or workplace for verification?", "Will someone come home to verify?", YN, "L"),
 ("Eligibility & documents", "I", "text", "How soon is the money credited after applying?", "How soon will I get the money?", [], "L"),

 ("EMI & closing", "I", "text", "Can customers choose the EMI date, and what are the charges for a bounced EMI?", "Can my EMI date be the 10th?", [], "L"),
 ("EMI & closing", "I", "text", "Can loans be closed early or part-paid? Any lock-in period or foreclosure charge?", "Can I close the loan early?", [], "L"),
 ("EMI & closing", "I", "text", "How do you collect when EMIs are missed? Do you follow RBI's fair practice rules (no harassment, no calling the customer's contacts)?", "Will recovery agents come home?", [], "L"),
 ("EMI & closing", "O", "text", "If a customer can't pay for a while (job loss, illness), do you give time or a settlement?", "I lost my job, can you give me time?", [], "L"),
 ("EMI & closing", "O", "text", "What notices and steps come before legal action, and do you settle at Lok Adalat?", "Will you take me to court?", [], "L"),
 ("EMI & closing", "O", "text", "If the borrower dies, what happens to the loan (insurance cover, family's liability)?", "What happens to the loan if the borrower dies?", [], "L"),
 ("EMI & closing", "O", "yes_no", "Do you offer balance transfer from other lenders, with a top-up loan?", "Can I move my loan to you?", YN, "L"),
 ("EMI & closing", "O", "yes_no", "Do you help customers correct wrong entries in their CIBIL report?", "There's a wrong loan in my CIBIL, can you help?", YN, "L"),

 ("Home & property loans", "O", "text", "For home loans, how much of the value do you fund (market or guideline value), and which properties do you accept (GP layouts, plots without LRS, gramakantam, open plots, agricultural land)?", "Will you give a loan for a GP layout plot?", [], "L"),
 ("Home & property loans", "O", "text", "For construction loans, is money released stage-wise, is pre-EMI possible, and do you help with PMAY subsidy?", "Will you give the money in stages?", [], "L"),
 ("Home & property loans", "O", "text", "What does mortgage registration (MODT) cost?", "How much for MODT registration?", [], "L"),
 ("Home & property loans", "I", "text", "After the loan is closed, how many days do you take to return original documents and release the mortgage?", "When will I get my original documents back?", [], "L"),

 ("Vehicle & other loans", "O", "text", "For vehicle loans, do you give zero down payment, used-vehicle loans or refinance on an existing vehicle?", "Can I get a loan for a second-hand car?", [], "L"),
 ("Vehicle & other loans", "I", "text", "After a vehicle loan is closed, how soon do you give the NOC / Form 35 to remove the hypothecation?", "When will I get the NOC for my bike?", [], "L"),
 ("Vehicle & other loans", "O", "text", "If vehicle EMIs are missed, what is your repossession process (notice first)?", "Will you seize my bike on the road?", [], "L"),
 ("Vehicle & other loans", "O", "text", "For no-cost EMI, what fees does the customer still pay (processing fee, GST)?", "Why was I charged a fee on no-cost EMI?", [], "L"),
 ("Vehicle & other loans", "O", "text", "Do you help with Mudra / PMEGP loans and subsidy, or OD / cash credit limits?", "Can you get me a Mudra loan?", [], "L"),
 ("Vehicle & other loans", "O", "text", "For education loans, how much without collateral, is management quota allowed, and how does the moratorium work?", "How much education loan without property?", [], "L"),
 ("Vehicle & other loans", "O", "text", "For farmers, what crop loan (KCC) per acre do you arrange, with interest subvention, and loans for dairy, poultry or fish farming?", "How much crop loan per acre?", [], "L"),
 ("Vehicle & other loans", "O", "text", "For credit cards you arrange, are they lifetime free, and do you explain the interest on paying only the minimum due?", "Is the credit card free?", [], "L"),

 ("Gold loans", "M", "text", "How much loan do you give per gram of gold today, and at what interest?", "How much per gram today?", [], "G"),
 ("Gold loans", "I", "text", "How do you test purity (without scratching or acid), and how much stone weight do you deduct?", "Will you scratch my jewellery to test it?", [], "G"),
 ("Gold loans", "I", "options", "How can gold loans be repaid?", "Should I pay interest every month?", ["Monthly interest", "Pay anytime (interest + principal together)", "Both"], "G"),
 ("Gold loans", "O", "yes_no", "Can customers take back part of their jewellery and keep the rest pledged?", "Can I take back one chain only?", YN, "G"),
 ("Gold loans", "I", "text", "If interest is not paid, how much notice do you give before an auction?", "Will you auction my gold without telling me?", [], "G"),
 ("Gold loans", "I", "text", "How is pledged gold kept safe (strong room, insurance, sealed packet with the customer's signature)?", "Is my gold safe with you?", [], "G"),
 ("Gold loans", "O", "text", "What if the pledge receipt is lost, or the borrower dies (nominee)?", "I lost my gold loan receipt, what now?", [], "G"),
 ("Gold loans", "O", "yes_no", "Do you give agricultural gold loans at lower interest?", "Is there a farmer gold loan?", YN, "G"),

 ("Chit funds", "M", "yes_no", "Is your chit fund registered under the Chit Funds Act with the Registrar of Chits?", "Is your chit registered?", YN, "C"),
 ("Chit funds", "I", "text", "Which chit groups are open (chit value, months, monthly instalment)?", "Is there a ₹5 lakh chit?", [], "C"),
 ("Chit funds", "I", "text", "After winning the auction, how soon is the money paid, what sureties are needed, and what if there are no sureties?", "When will I get the money after the auction?", [], "C"),
 ("Chit funds", "I", "text", "What is the maximum bid discount and the foreman's commission?", "How much can I bid?", [], "C"),
 ("Chit funds", "O", "text", "What protects members' money (security deposit with the Registrar), and what happens if a member stops paying?", "What if the chit company closes?", [], "C"),

 ("Insurance & investments", "M", "list", "Which products do you offer?", "Do you sell health insurance?", ["Term insurance", "Health insurance", "Life insurance (LIC)", "Motor insurance", "ULIP / endowment plans", "Mutual funds (SIP)", "Corporate / post office deposits"], "I"),
 ("Insurance & investments", "I", "yes_no", "Do you explain that mutual fund returns are not guaranteed, along with exit load and taxes, before investing?", "Is the SIP return guaranteed?", YN, "I"),
 ("Insurance & investments", "I", "text", "How do you explain the free-look period and cancellation to policy buyers?", "Can I cancel the policy?", [], "I"),
 ("Insurance & investments", "O", "yes_no", "For health insurance, do you explain room-rent limits, co-pay and waiting periods before selling?", "Is there a waiting period?", YN, "I"),
 ("Insurance & investments", "I", "yes_no", "Do you help customers with claims?", "Will you help with my claim?", YN, "I"),

 ("Service", "O", "list", "Which languages can your staff speak?", "Does anyone speak Hindi?", ["Telugu", "Hindi", "English", "Urdu", "Tamil", "Kannada"], "LGCI"),
 ("Service", "O", "text", "Please share your Google reviews link, if you have one.", "Where can I see your reviews?", [], "LGCI"),
]

TYPES = [("loan_finance", "Loan & finance office", "L"), ("gold_loan", "Gold loan / pawn shop", "G"),
         ("finance_gold", "Finance & gold loans", "LG"), ("chit_fund", "Chit fund company", "C"),
         ("insurance_investment", "Insurance & investment advisor", "I")]
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
