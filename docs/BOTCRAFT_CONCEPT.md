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
3. **In the background**, Gemini prepares a **question bank of 200+ questions** that jewellery-shop customers ask (see §4).
4. BotCraft asks: *"Please send your shop's full details."* Vinay sends photos, files (price lists, catalogues) and chat messages.
5. The AI reads everything and **fills in every answer it can** from what Vinay sent.
6. BotCraft asks Vinay **only the remaining questions**, one at a time, each with quick options, *Skip* (when allowed) or *Mandatory*.
7. The bot is ready. Vinay tests it, pays, and **downloads the QR code poster**.
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
- Payments are built **last**.

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
| `backend/sitecraft-ai/website-chatbot.js` | Visitor chat endpoint with reply limits, rate limits and a server-side key. It was built for a website embed (origin check); Phase 1–2 will adapt it for the QR bot page. |

## 11. Open questions

- Owner login method: phone OTP or email?
- Monthly sales report: where does sales data come from? The owner entering sales in chat, or a billing/POS integration?
- Is the "3 times" rule in §5 correct (the bot tries up to 3 times, then refers the customer to the owner)?
