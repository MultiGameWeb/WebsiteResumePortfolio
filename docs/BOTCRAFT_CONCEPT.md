# BotCraft — Product Concept

Status: concept agreed with the owner of SiteCraft (October 2026). This is the reference for all BotCraft work.

## 1. What BotCraft is

BotCraft is software that lets shop owners create their own **AI salesman chatbot** by chatting with BotCraft. We do not build each bot by hand; the software builds it.

- **Problem:** When the owner is busy with one customer, other customers wait or leave. The owner speaks only 2–3 languages and sometimes forgets to share details.
- **Solution:** A QR poster in the shop. A customer scans it, the shop's bot opens on their phone, and it answers in any language, shows items with photos, prices and full details. The customer decides what to buy, then goes to the counter.
- **For the owner:** The bot is a salesman and a helper. It never forgets shop information, and the owner keeps it up to date by sending photos or chat messages.

AI provider: **Gemini, paid API key**, used only on the server (Cloudflare Worker). The key is never sent to a browser or included in any download.

## 2. The four parts of the software

| Part | Who uses it | What it does |
|---|---|---|
| **A. BotCraft Builder** | Owner (new) | Chat-based onboarding that creates the shop's bot |
| **B. Salesman Bot** | Shop customers (via QR) | Answers questions and shows items, photos, prices and details |
| **C. Owner Update** | Owner (logged in) | Update items, prices, stock and offers by photo or chat |
| **D. Owner Dashboard & Reports** | Owner (logged in) | Customer questions and interest; monthly sales and in/out reports (paid add-on) |

## 3. Example flow — Vinay's jewellery shop

1. Vinay opens BotCraft and writes: *"Hi, I am Vinay. I need a chatbot for my jewellery shop."*
2. BotCraft greets him: *"Hi sir, nice to meet you. Of course, we can build an AI chatbot for your jewellery shop."*
2a. **Vinay pays the setup charge first.** Setup uses paid Gemini calls, so no setup starts before payment; an owner who stops before paying costs us nothing.
3. **In the background**, Gemini prepares a **question bank of 200+ questions** that jewellery-shop customers ask (see §4).
4. BotCraft asks: *"Please send your shop's full details."* Vinay sends photos, files (price lists, catalogues) and chat messages.
5. The AI reads everything and **fills in every answer it can** from what Vinay sent.
6. BotCraft asks Vinay **only the remaining questions**, 3–5 at a time as a small form: each question has its options to pick and a box to write an answer, *Skip* for optional questions, and one *Send answers* button. Photo questions are asked one at a time.
7. The bot is ready. Vinay tests it and **downloads the QR code poster**. The monthly subscription starts when the bot goes live.
8. When the shop is busy, Vinay says: *"Sir, please use my salesman bot."* The customer scans and chats.

## 4. Question bank — generated, never fixed

We do **not** hard-code questions. Gemini generates them, following rules we give it.

**Generation (Gemini + Google Search grounding):**
- Input: business type and location (e.g. "jewellery shop, Hyderabad").
- Output: 200+ questions that real customers of that business ask, as structured JSON.
- Each question has:
  - `category` (products, pricing, making charges, purity, exchange, timings, payment, offers…)
  - `priority`: `mandatory` / `important` / `optional`
  - `answer_type`: text / options / yes-no / number / price / image / list
  - `suggested_options`
  - `why_customers_ask`
- Rules: no duplicates, simple language, nothing illegal or unsafe, nothing that collects customer personal data.

**Core questions (every shop, fixed, mandatory unless marked):** shop name, owner name, owner photo (optional), shop front photo, address with landmark, shop area (village, town / mandal, district headquarters or city), Google Maps location link, parking, opening times, weekly holiday, call number, WhatsApp number, main items sold, return/exchange policy, home delivery, EMI (if yes: which items, EMI options such as credit/debit card EMI, Bajaj Finserv, TVS Credit, HDB; documents needed) and current offers. Follow-up questions are asked only when the earlier answer needs them (no EMI → no EMI follow-ups). Payment methods are not asked. Generated questions never repeat these. As with every question, BotCraft first fills core answers from what the owner sent; it asks only the core questions still unanswered, and the bot cannot go live until all of them are answered.

**Each owner is asked only the questions that fit their business** (owner's rule, October 2026). Curated banks are written per business type and tagged; for example the food banks (restaurant, fast food, tiffin centre, catering) come from one source (`scripts/curated/food.py`) where every question says which of the four businesses it applies to. Questions that small-town shops rarely know (for example international size charts or eco-friendly fabrics) are marked city-only and are asked only when the shop area is a district headquarters or city.

**Never asked:**
- A shop summary or description. BotCraft writes it from the items and answers.
- Individual items, prices or photos. These come from the uploads, as item cards.

**Cost saving:** store a generated bank per business type and reuse it for the next owner of the same type (refresh it periodically). Only shop-specific extras are generated per owner.

**Auto-fill from owner uploads:**
- Gemini reads images (product photos, boards, price lists) and documents, then fills answers with a confidence score.
- Low-confidence answers are shown to the owner to confirm, never published silently.
- Products found in uploads become **product cards** (name, photo, price, details, stock).

**Asking the rest:**
- Mandatory questions come first, then important, then optional.
- Questions are grouped by topic so the owner is not tired out.
- The progress bar shows real numbers, for example "38 of 212 answered, 6 mandatory left".
- The owner can stop and continue later; progress is saved.

## 5. Salesman Bot rules (customer side)

- Open by QR scan on a mobile phone; no app and no login for customers.
- **Chat only in v1.** Voice comes later.
- Reply in the customer's language (any language).
- **Always show items as cards:** photo, name, price, and full details. Text-only answers are not enough.
- Answer **only from the shop's verified data.** Never invent prices, stock, offers or policies.
- Out-of-stock items are shown as out of stock, with similar items suggested.
- Daily-changing data (for example the gold rate) is shown with its "last updated" date.
- Contact buttons for customers: **Call**, **WhatsApp** and **Directions** (Google Maps).
- If the bot cannot answer after up to 3 attempts, or the customer wants a person: *"Please speak to the owner at the counter."* The shop is small, so the owner is always nearby.
- **Buying (v1):** the bot helps the customer choose, then sends them to the counter, for example with a "Show this to the owner" summary of the chosen items. Online ordering and payment come later.

## 6. Owner Update

- One **Update** button in the owner's BotCraft.
- The owner sends a photo, a chat message (later also voice), for example:
  - *"New bangles arrived"* plus photos
  - *"Today's 22K rate is ₹X"*
  - *"Item Y is out of stock"*
- The AI works out what changed, shows a short **"I will update this — confirm?"** summary, and applies it after the owner confirms.
- No big forms, and no need to contact SiteCraft.

## 7. Owner Dashboard & Reports

- **Included:**
  - What customers asked
  - Most-viewed items
  - Questions the bot could not answer, so the owner can add those answers
- **Paid add-on:** monthly report covering sales, money in and out, and totals.

## 8. Pricing (draft — validate against real Gemini costs before launch)

- One-time setup: ₹2,999 (draft)
- Monthly subscription: ₹599 or ₹999, covering hosting, updates, storage and a reply allowance
- Reports add-on: separate charge
- **Payment comes before setup** (decided October 2026). The setup chat must not call paid Gemini models for an unpaid owner.
- Cost estimates use paid-tier prices only; free-tier quota is treated as profit, not counted.
- Final prices are set at the end of the build, with a 40% profit margin over the maximum cost (Gemini, R2 photos, D1 text data, Workers plan share and payment gateway fees).
- Payments are built **last**, but the setup chat must be gated behind payment before launch.

## 9. Build phases

| Phase | Scope |
|---|---|
| 1 | Builder with real Gemini: question bank, uploads, auto-fill, ask remaining questions, save shop profile and products (D1 + R2) |
| 2 | Salesman Bot page on our domain (`/bot/<shop-id>`) with product cards, plus QR poster download |
| 3 | Owner login and Owner Update mode |
| 4 | Owner Dashboard (customer questions, interest, unanswered questions) |
| 5 | Payments and monthly subscription |
| 6 | Monthly sales / in-out reports (add-on) |
| Later | Voice to voice, customer image search ("do you have this design?"), reserve/order in chat |

## 10. What already exists in the repo

| Component | Status |
|---|---|
| `ai-chatbots.html` and the homepage section | Updated to the QR AI-salesman concept |
| `ai-chatbot-software.html` | The BotCraft page; shows the chat UI only |
| `ai-chatbot-builder.html` | Old form builder removed; now redirects to BotCraft |
| `chatbot-builder/` | BotCraft chat UI. Its opening flow follows this concept, but replies are still simulated in `mockChat.js`, and progress stays empty until a real question bank exists. Phase 1 replaces the mock. |
| `salesbot/` + `botcraft-salesbot.js` | Phase 2 first version: once the core questions are done, the owner gets a bot link (`salesbot/?s=<publicId>`), a QR code and a printable QR poster. The customer page is an installable PWA with Call / WhatsApp / Directions buttons; it answers only from the owner's saved answers and items (no item photos yet). Owners may optionally share the shop's Wi-Fi; the poster then gets a Wi-Fi QR code (the password is never sent to the public page or the salesbot). The page keeps a copy of the answers and items, so without internet, or when the AI is busy, it still answers basics (items & prices, timings, address, offers, saved answers) by plain search, without AI. A Listen button reads answers aloud with the phone's voice. The public id is separate from the owner's private shop id. |
| `backend/sitecraft-ai/website-chatbot.js` | Visitor chat endpoint with reply limits, rate limits and a server-side key. It was built for a website embed (origin check); Phase 1–2 will adapt it for the QR bot page. |

## 11. Open questions

- Owner login method: phone OTP or email?
- Monthly sales report: where does sales data come from? The owner entering sales in chat, or a billing/POS integration?
- Is the "3 times" rule in §5 correct (the bot tries up to 3 times, then refers the customer to the owner)?

## 12. Future idea: small business websites from the same setup

The owner's idea (October 2026): the BotCraft engine (shop type → ready-made questions → owner answers, photos and items) could also build small business websites.

- Scope: small sites with up to about 15 main features that every business needs, for example home, about, items/menu with prices and photos, offers, gallery, timings, location map, call and WhatsApp buttons, enquiry form and reviews.
- Not for e-commerce: no carts, online payments or inventory systems.
- The same saved data would feed both the salesman bot and the website, so the owner answers once.
- This is not started; it comes after BotCraft's core phases.
