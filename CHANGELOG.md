# Changelog

## v3.1.0
- Fixed admin startup TDZ/initialization bug in `admin.js`.
- Admin opens correctly when password protection is OFF (default).
- Deleting a storage image now clears the related hero/gallery fallback image instead of silently restoring it.
- Bumped template metadata version to 3.1.0.
- Confirmed public page and admin page load successfully under a local HTTP server.

## v3.2.1
- Fixed: `[hidden]` now always hides (image picker overlay and login screen were showing on admin load; hidden WhatsApp buttons stayed visible).
- Fixed: hero blurred background never applied (invalid setProperty name).
- Fixed: scroll observers no longer pile up; tall sections cannot stay invisible.
- Added: Vimeo embeds, storage-full handling in admin uploads.

## v3.2.0
- Added subtle repeated scroll-focus motion to sections/features as they enter the reading zone.
- Strengthened mobile-first layout, touch targets, filter rows, CTA stacking and spacing.
## v4.0.0 — SiteCraft Home + Portfolio UX
- Rebuilt `index.html` as the Home page with only three main services: Website Templates, AI Websites (Coming Soon), and Portfolio Creator.
- Added `templates.html` as the dedicated Website Templates marketplace page.
- Added `ai-websites.html` as the AI Websites Coming Soon page with local-only email validation and a future Cloudflare Worker + D1 integration note.
- Updated Portfolio Creator with independent editor/preview scrolling, mobile Edit/Preview panels, keyboard preview scrolling, inline Step 1 persona selection, leave-confirm modal, fixed accordion switch classes, hidden file inputs, reset/import fixes, education reorder support, font handling, and styled standalone export.
- Added the Assistant Director theme to the Portfolio Creator theme picker and retained the Actor theme.
- Kept template flow navigation aligned with `templates.html` from `features.html` and the admin marketplace link.
- Assumed the existing marketplace `index.html` should become the Home page, and therefore used `templates.html` as the dedicated Website Templates page name.

## v4.x — AI Text to Voice
- Added `voice-studio.html`: Telugu-first text to speech. Paste text in 11 languages, get audio in the same language.
- Styles: Normal, Narration, News (Sarvam Bulbul native voice) and Conversational, Emotional, Comedy, Motivational, Whisper (Gemini TTS acting voice). Telangana, Godavari, Rayalaseema and Hyderabadi accents.
- Free text tools: "Make it spoken" rewrite and Translate (Gemini).
- 300 free words per new browser wallet; word packs ₹49 (1K), ₹79 (2K), ₹179 (5K), ₹349 (10K), ₹849 (25K) through Razorpay.
- In-app Report button for AI voices; daily word cap protects API spending.
- Backend: `backend/sitecraft-ai/voice-studio.js`, routes under `/api/voice/`.
- Text to Voice: prices in the visitor's currency (₹ India, £ UK, € Europe, $ everywhere else), 27 styles in groups (Basic, Instagram & creators, Emotions, Genres) and 47 accents across India, the US and the UK.

## BotCraft: hide / show items
- The owner can hide an item from customers without deleting it, from the owner page (Hide / Show to customers) or by chat or voice ("hide gold chain", "show silver anklet again"). Hidden items stay in the owner page and come back with all details. Hidden items are kept out of the customer page, offline copy and the assistant. Stored as stock_status "hidden", so no database change.

## BotCraft: rename item, delete photo by chat
- By chat or voice the owner can rename an item ("rename gold chain to Gold Necklace") and delete a photo without deleting the item ("delete gold chain photo", "remove main photo", "delete gallery photo 2"). The photo of a renamed item moves with it. A rename never overwrites another item with the same name (also checked on the server). Photo deletes cannot be undone.

## BotCraft: edit, hide and delete saved answers
- New "Saved answers" card on the owner page lists what the assistant tells customers (offers, delivery, policies, extra questions, notes, answers to customer questions). Each can be edited, hidden (stays saved) or deleted.
- By chat or voice the owner can also edit an answer, hide or show it, delete it, or add new information ("add: free gift above 50k"). Edit and hide can be undone; delete and add cannot.
- Hidden answers are removed on the server before the customer page, offline copy and assistant see the shop. Stored in the shop settings (hiddenAnswers), no database change. Needs the AI helper for chat; the offline planner does not understand answers.

## BotCraft: shop name and page sections
- The owner can change the shop name (owner page or chat: "change shop name to ...") and hide or show the About, Gallery and Map sections of the customer page (owner page card or chat: "hide gallery", "show map again"). Hidden sections are removed on the server before the customer page and bot see them; nothing is deleted. Stored in the shop settings (hiddenSections).

## BotCraft: premium owner voice (ElevenLabs)
- The owner page and the setup chat can use ElevenLabs Speech to Text (Scribe) for the owner mic: much better Telugu, Hindi and mixed speech than the phone voice typing. The owner taps the mic, speaks, taps again, and the text appears (owner page: sent for checking; setup chat: put in the message box to check before sending). Nothing is stored.
- Server: action transcribe on /api/botcraft/owner (botcraft-voice.js). Secret ELEVENLABS_API_KEY; optional ELEVENLABS_STT_MODEL (default scribe_v1) and ELEVENLABS_DAILY_LIMIT (default 150 per shop per day, spending cap). Without the key, or when ElevenLabs fails, the page falls back to the phone voice typing.
- Not tested against the real ElevenLabs API yet (no key in the build environment). ElevenLabs cost is not in docs/BOTCRAFT_PRICING.md yet.

## BotCraft: hosted shop page (same hosting as the website templates)
- The owner page has a new "Your web page" card. "Publish my page" puts the customer page on its own address: https://<slug>.<HOSTING_DOMAIN>/ when that domain and its wildcard route are set, else https://<worker>/s/<slug>/. The address comes from the shop name (or one the owner types). One year of hosting from the first publish, the same term and rules (HOSTING_DISABLED, HOSTING_REQUIRE_PAYMENT, daily limit) as the templates.
- Only the home page is stored in the hosting tables (template id botcraft-page, owner action publish_page, botcraft-hosting.js). The page code is served from salesbot/ in the SiteCraft source, and items, photos and answers are read live, so owner updates and code fixes show without publishing again.
- The hosted page may call the customer API (public, ask, request, requests, order, push) from its own address; owner and setup endpoints stay on the allowed origins. Once published, the open link and the QR poster use the new address.
- Needs the Worker DB binding (sitecraft-db) as the templates do. Not yet: extending the term to 2 or 3 years (waits for payment), and the demo mode does not support publishing.

## BotCraft: shopping-app item photos
- Customer page: item cards show the whole item on white (nothing cropped). The item sheet is a swipeable photo gallery with dots; tapping a photo opens it full screen (pinch to zoom).
- Each item can have up to 5 photos (first = cover). Owner page: photo strip per item with remove and add; chat can add item photos and delete one by number ("delete photo 2 of ceiling fan"). The server refuses a sixth photo.
- Item photos are tidied on the owner phone before saving (photo-enhance.js): right way up, centred on a square white canvas with space around, brighter when dark or flat. It does not remove a cluttered background; that needs AI image editing (paid, not built).
- Not run in a browser yet (checked in node only; the canvas code needs a browser).

## Browser check (demo mode, Chromium, phone size)
- Item photos tidy on upload (square, white around), up to 5 per item, strip on the owner page, swipe gallery and full-screen zoom on the customer page, hide gallery and rename and delete-photo-by-number and shop name by chat: all worked.
- Found and fixed: spoken text vanished in the setup chat when voice typing ended (the message box was rebuilt); the offline planner ignored the photo number ("delete photo 2" deleted the first); the tidy-up crushed a dark background to pure black.
- Demo mode now supports hiding sections and the shop name field.

## BotCraft: photo studio (AI clean studio photo)
- On the owner page each item photo has a ✨ button. The server asks Gemini image editing (default gemini-2.5-flash-image) to keep the item exactly as it is and put it on a plain white studio background. The owner sees Your photo and Clean photo side by side and chooses Use clean photo, Try again or Keep my photo. Nothing is saved until they accept; accepting replaces that photo in the same place (the cover stays the cover).
- Free for now, capped per shop per day (BOTCRAFT_STUDIO_DAILY_LIMIT, default 20). A failed call is not counted. Photos that skip the studio are shown as uploaded (only straightened, squared and brightened), and the owner page says so.
- Server: actions studio_photo and replace_photo (botcraft-photo-studio.js). Checked in node with a stubbed Gemini and in Chromium demo mode (demo returns the same photo, no AI). Not tried against the real Gemini image model yet.

## BotCraft: reply metering
- Every AI reply a customer gets uses one credit. A shop starts with free replies (BOTCRAFT_FREE_REPLIES, default 200). The credit is taken before the AI is asked (atomic in D1, so two customers at once never overspend) and given back if the AI fails. When a shop has none left the customer page says the assistant is resting and still gives basic answers from the saved items, prices and timings.
- The owner gets a notification at 20 replies left and at 0. The owner page has an "AI replies" card (left, used today and this month, low warning). The admin bot panel shows the balance, tokens used (in/out) and average tokens per reply, and can add or remove replies (action add_replies).
- Tables botcraft_replies and botcraft_usage (created on first use). Gemini token counts are logged per shop per day, so the real cost per reply can be worked out and the reply pack prices set.
- Not metered yet: the owner side (setup chat, update chat, photo studio, premium voice). Online recharge and payment are not built; recharge is done by the admin for now.

## Testing: end-to-end checks and three bugs they found
- New backend/sitecraft-ai/tests/ (run with: bash backend/sitecraft-ai/tests/run.sh). It starts the real Worker locally with a local database and runs 61 checks: items, rename, sections, answers, photos, publishing and serving the shop page, origins, reply credits, admin recharge and the failure paths of the AI features. No keys or deploy needed.
- Also run in Chromium against that local Worker: owner page (items, photo upload, hide, publish), the hosted shop page (items, photo gallery, chat fallback). No JavaScript errors.
- Bugs found and fixed: (1) deleting a saved answer to a required setup question made the shop look unfinished, which blocked publishing (it now becomes "skipped"); (2) the hosted shop page could not load its own data because browsers send no Origin header on a same-origin GET (now allowed when Sec-Fetch-Site is same-origin, customer endpoints only); (3) the basic fallback could not answer a typed "timings?" (now understands timing, address and phone words in English, Telugu and Hindi).

## BotCraft: daily caps on customer questions
- Each shop allows 500 AI questions a day in total and 40 per visitor (BOTCRAFT_SHOP_DAILY_REPLIES, BOTCRAFT_VISITOR_DAILY_REPLIES), so nobody can drain a shop replies by spamming its QR page. The visitor is a one-way hash of the connection address and the shop; the address is not stored. Past the cap the customer page gives basic answers and a clear message (429 daily_limit or visitor_limit). Old counters are cleaned up automatically. Covered by tests/e2e.mjs (64 checks).

## Landing page prices (ai-chatbots.html)
The old "Rs 1,999, 10,000 replies included" and "Rs 599 per 10,000 replies" are replaced by the three packages (Starter 1 year Rs 1,399, Growth 2 years Rs 1,599, Pro 3 years Rs 1,799), the Rs 199 a year renewal, 200 free replies, and a no-subscription replies note. Reply pack and photo studio prices are shown as "announced soon" because the real Gemini cost per reply is not known yet. Checked at desktop and phone width.

## BotCraft: photos in R2 (optional, switched on by binding a bucket)
- With the BOTCRAFT_PHOTOS bucket bound, new photos are stored in R2 and the D1 row keeps only the details (new column storage). Without it nothing changes. Photos already in D1 keep working, and the admin action POST /api/admin/photos {"action":"migrate"} moves them a few at a time (empty the D1 copy only after the file is in R2; safe to repeat). GET /api/admin/photos shows the counts.
- Deleting a photo, an item, a customer request, or replacing a main or owner photo also deletes the file. A file that fails to delete only costs a little storage and never fails the action.
- The binding is in wrangler.toml as a commented block: create the bucket (wrangler r2 bucket create botcraft-photos), remove the #, deploy, then migrate.
- tests/run.sh now runs two phases: the 66 checks without R2, then 17 more with a local R2 bucket on the same database (old photos still served, new ones in R2, migration byte for byte, deletes remove files). 83 checks pass.

## Website order: AI Chatbot first, website templates next
- Top menu: AI Chatbots now comes before Websites (site-navigation.js, so every page).
- Home page: the AI chatbot section comes before the website templates section; the hero buttons are Create AI Chatbot, then Browse Templates; the phone bottom bar now opens the AI chatbot section. The hero headline and text are unchanged.

## BotCraft: delete a bot and start over
- New "Delete this bot and start over" in the setup chat My bots menu and on the owner page. It asks to confirm, then deletes everything about the bot on the server: setup chat, answers, items, photos (and their R2 files), customer questions and requests, public link and QR, settings, reply credits and usage, push subscriptions, and the published web page. The browser then starts a new empty bot from the first question. The server needs the word DELETE in the request, so it cannot happen by accident.
- Create new bot still keeps the old bot; delete removes it for good.
- Checked with 98 end-to-end checks (79 + 19 with R2) and in Chromium against the local Worker.

## Fix: attaching a photo no longer wipes the typed text (setup chat)
- Adding or removing a photo or file rebuilt the whole message box, so the typed text was lost and Ctrl+Z could not bring it back. Now only the attachment tray is updated; the message box stays, so the text stays and Ctrl+Z / Ctrl+Shift+Z work. Pasting an image works the same.
- Safety net: any other redraw (voice typing ending, a reply arriving) keeps the draft text, cursor and focus. Sending still empties the box.
- Checked in Chromium: file picker, pasted image, remove attachment, send, and a draft typed while the bot answers.

## Fix: the setup chat keeps asking until the questions are answered
- Problem: after the owner sent all details in one message, the bot said the assistant was ready and only offered "Finish for now", although 18 of 57 questions were answered. The next questions were worked out from what was known before the message (already answered), and the bot only continued if the owner had answered something earlier.
- Fix: the next form is now worked out after each message (nextFormQuestions), so it moves on to the questions still open. The bot is told never to say the setup is finished while shop questions are open, to say how many are left, and that customers get no answers about unanswered topics.
- "Finish for now" with questions still open now asks first: "You have answered X of Y important questions... Finish anyway?". Cancel keeps the owner answering.
- Checked: the form logic in node (bulk message, only shop type known, Finish, all answered, 8 at most) and the Finish check in Chromium. The real AI conversation was not run here (needs the Gemini key).

## Audit of the setup chat question flow (fixes)
- Audit of the ready-made question lists: 103 shop types, 4,436 questions (249 mandatory, 1,362 important, 2,825 optional). Every list has mandatory questions and is ordered mandatory, important, optional. The lists are fine; the flow around them was the problem.
- Found: (1) the model could fill answers from a long message with no check (summaries, guesses), so questions were never asked; (2) the bot could say the assistant was fully ready while 38 important questions were open; (3) an optional photo (the owner photo) blocked the shop questions, and its Send photo / Skip buttons appeared with no question; (4) the next form was built from state before the message (fixed earlier).
- Fixes: every recorded fact and answer needs "evidence", the owner exact words, and is dropped if those words are not in what the owner wrote (photos and "not applicable" excepted; shop type is a classification); the server replaces a "ready / complete" claim while important questions are open; a photo button always comes with its question; a required photo comes before the shop questions and an optional photo after them; when everything is answered the bot lists what it marked "not applicable" so the owner can correct it; "Finish for now" warns first (earlier fix).
- Checked in node (23 checks in tests/setup-flow.mjs). The real AI conversation was not run here: it needs the Gemini key, and the model must now return the evidence field.

## Electronics store: one combined question list
- Audit: the "Electronics & home appliances showroom" list is built for TVs, fridges, washing machines, ACs and kitchen items; only 6 of its 125 questions mention phones, laptops or accessories. A shop selling mobiles, laptops, fridges, TVs and accessories only got that list, so the mobile and laptop questions (in the mobile shop and computer shop lists) were never asked, and six topics customers ask about were in no list (5G / eSIM, screen and battery replacement price, Windows / Office, accessory compatibility, old phone buyback, recharge and SIM).
- New shop type "Electronics store (mobiles, laptops, TVs, fridges & accessories)" with a combined list of 182 questions (7 mandatory, 58 important, 117 optional): the three lists merged (repeats kept once, highest priority) plus 14 new questions. The products question now offers phones, laptops and accessories. EMI basics and the phone-shop assistant rules apply to it. The words "electronics shop / store / showroom" now choose it.
- Built by scripts/build-electronics-store-bank.mjs (run it again to rebuild). A topic checklist of 56 customer questions is covered 56 of 56 (keyword check). tests/setup-flow.mjs has 44 checks.
- An existing bot keeps its old list: delete it and start over to get the new one.

## Customer page: website view on computers, bigger chat
- On screens 1024 px and wider the customer page looks like a website: a top bar with the shop name and section links, a full-width hero with a large title, sections in a 1,200 px container with alternating backgrounds, About and Info in two columns (map beside the details), a larger item grid with hover, and a dark footer. Phones keep the old layout. The hosted shop page uses the same code.
- The chat has a bigger-chat button on computer screens (460 x 740 by default, up to 1000 px wide and full height); the choice is remembered. Hidden on phones, where the chat is already full screen.
- Checked in Chromium at 1440, 1920 and phone width: no sideways scroll, no JavaScript errors.

## Owner page opens as a full page of the SiteCraft site
- "Manage my bot" now opens the owner page as its own web page, ai-chatbot-owner.html, with the SiteCraft menu on top (AI Chatbots highlighted), instead of inside the setup chat box. The page is marked noindex. The old address chatbot-builder/owner.html (a bookmark or a notification) goes to it too, keeping the query and the #hash.
- "Setup chat" on the owner page, the owner link in the "customer questions waiting" note, and the page after "Delete this bot" all go to full pages.
- Access is still by the private id kept in the browser that created the bot; only that browser opens the owner page until sign-in is built.
- Checked in Chromium: the page and its menu, the redirect, the Manage my bot button, Setup chat, and delete, with no JavaScript errors.

- The button is now called "Owner page: manage my bot" (with a hover note that only the owner can open it), and the help text uses the same name.

## "Send a photo" is off by default for electronics shops
- The customer page option "Order & requests > Send a photo" was on for every shop type. It suits shops where customers show something (medicine, repair, design). It now starts off for the electronics store and the appliances showroom; the owner can turn it on in the owner page under Bot buttons. An owner who already chose keeps the choice. The form placeholder no longer talks about medicine ("Write your question about this photo").

## Customer chat: ask with a photo (gallery, camera, voice)
- The customer chat has a + button (Take a photo / Choose from gallery) and a camera button next to the microphone button. Up to 3 photos; they show in the customer message. The AI looks at them to understand the question and answers only from the shop information (it says what it sees in a few words, never describes people or reads personal details, and says it is not sure when the photo is unclear or not an item of the shop). Photos are used for that one answer and are not saved.
- A photo alone can be sent. Talk mode (voice) sends the staged photo with the spoken question, and has its own photo button. On a phone the camera app opens; on a computer a live camera box opens (a file chooser if there is no camera or permission).
- The "Send a photo" form in Order and requests is now called "Send a photo to the shop owner" (the owner replies personally; still off by default for electronics). Escape closes the photo menu before the chat.
- Server: customer photos are checked (jpeg, png, webp, 3 at most, about 1.3 MB each, base64 only) and added to the last customer message; the ask request is limited to 7 MB. One photo question uses one reply credit. 59 checks in tests/setup-flow.mjs; checked in Chromium (gallery, alone, limit of 3, remove, live camera, voice with a photo). The real AI answer to a photo was not run (needs the Gemini key).

## Customer page review fixes
- Reviewed with 20 items, photos, a shop photo, owner photo and gallery at 1440 px, 1920 px, phone width and dark mode: no sideways scroll, no errors. Fixed: prices now line up along the bottom of every card in a row (item names take one or two lines), and a long assistant name no longer cuts off the chat button on a phone (it says "Ask the assistant"). Open: with many items there is only a search box, no categories.

## Customer chat: voice to voice
- Talk mode is now a conversation: the customer speaks, pauses, hears the answer in a natural voice, and the page listens again by itself. Tapping the orb while it listens sends at once; tapping while it speaks interrupts and listens. A photo added before speaking goes with the recording.
- How: the page records the voice (16 kHz WAV, with silence detection) and sends it to the new endpoint /api/botcraft/voice. The AI hears the recording itself (no phone speech-to-text that spoils Telugu), writes what the customer said, answers from the shop information, and the answer is turned into sound (Sarvam for Indian languages when SARVAM_API_KEY is set, otherwise Gemini speech) and sent back as a WAV. The chat shows what was said and the answer. No clear speech means no answer and no charge.
- If the server cannot do it, or the phone cannot record it, the older mode (phone speech-to-text and phone voice) takes over. Without a speech key the answer comes as text and the page reads it with the phone voice.
- One voice exchange uses one reply credit; the speech cost is not counted in the token log yet. Same daily caps and origin rules as the text chat. Checked: 84 + 19 end-to-end checks, 74 unit checks (recording and answer handling, speech engines stubbed), and Chromium with a fake microphone (listen, pause detected, send, answer, listen again, photo with voice, interrupt, older-mode fallback, no-speech case). Not tried: the real Gemini hearing the recording, the real voices (Telugu quality), delays on a phone, or the Sarvam voice.

## Customer page: one chat button on phones
- The page now has a single floating "Ask the assistant" button. The separate camera and mic buttons are gone, because three buttons ran off the screen on phones.
- The mic (voice to voice) and the camera/gallery (the + menu) are inside the chat box. Checked in Chromium at 320, 360, 412 and 1440 px: the button stays on screen, and the + / text / mic / send controls all fit.

## Owner page: suggestions use the shop's own items
- The example chips under "Update with chat" were fixed jewellery examples (gold chain, silver anklet, silk saree). They now come from the shop's items, for example "HP 15s price", "iPhone 15 out of stock", "Hide Laptop bag", plus timings and holiday. A shop with no items sees "Add first item and price". The chips refresh after every change.

## Owner: record sales and see today's sales
- The owner tells the update chat what was sold: "Sold 2 iPhone 15", "1 TV sale 24000 upi", or in Telugu ("ammanu"). The chat shows the sale (quantity, amount, payment) for Confirm, and Undo works. The amount uses the item's own price unless the owner says another price. "Sold out" still means the stock is finished, not a sale.
- New "Sales" card on the owner page: Today, last 7 days, last 30 days (amount, number of sales and items), today's items with amounts, how it was paid, and recent sales with a Remove button for mistakes.
- Asking the chat "Today sales?" or "sales this week" answers from the saved sales without the AI.
- Only sales the owner records are counted; customers' cart orders and shop counter sales that are not told to the bot are not. Item stock counts (quantity left) are not built yet.
- Backend: new table botcraft_sales (created automatically), owner actions record_sale and delete_sale, the owner view returns a sales summary, deleting a bot deletes its sales. Deploy the Worker for it to work live. Checked: 90 end-to-end checks (6 new), planner cases, and a browser run of the owner page in demo mode.

## Customer assistant no longer says "no online payment"
- The assistant's rules said "Online payment is not available", so it told customers the shop has no online payment. It now says only that it cannot take payment in the chat, sends the customer to the owner at the counter, and never states which payment methods the shop accepts unless the owner's saved information says so.

## Customer assistant sticks to the shop's facts
- The assistant agreed with a customer's guess about the shop. The rules now say: share plans and changes the owner told it (for example "vegetables start in December") exactly as written, never add dates or details that were not told, never invent plans or opinions, and never confirm a customer's guess the saved information does not confirm.

## Customer page: item icons, group filters, cart bar clear of the chat button
- An item without a photo now shows a group icon (📱 mobile, 💻 laptop, 📺 TV, 🧊 fridge, 🎧 audio, 🔌 accessories, 💍 jewellery and more, 📦 otherwise) instead of the first letter.
- Group chips above the items (All, Mobiles, Laptops, TVs ...) with counts filter the list, together with the search. They show only when there are 6 or more items in 2 or more groups. Groups are found from the item names.
- On wide screens the chat button moves above the cart bar when the cart has items, so they never overlap.
- Checked in Chromium (desktop and phone) with a 10-item electronics list in demo mode: chips, filter, icons and no overlap.

## Customer page: item popup with spec points and similar items
- Item details written as points ("8GB RAM | 512GB SSD | 1 year warranty", or one per line) show as short chips in the item popup. Plain sentences stay a paragraph. The owner's item form now explains this.
- "Similar items": up to three other in-stock items of the same group (for example other laptops) at the bottom of the popup; tapping one opens it. "Ask about this" already sent the item to the assistant and still does.
- Groups are found from item names, so an item whose name has no known word (for example "Dell Inspiron" before this change) is not grouped. More laptop model words were added.
- Checked in Chromium (desktop and phone) in demo mode.

## Stock count (how many pieces are left)
- The owner can count an item: in the update chat ("iPhone 15 stock 10", "received 5 iPhone 15", "only 2 TVs left", "fan stock 0") or in the item form ("Stock count, optional"). An item with no count works as before.
- A sale takes its pieces off the count. At 0 the item is marked out of stock by itself; new stock brings it back. Removing a sale (or Undo) puts the pieces back. Hidden items stay hidden. Renaming or editing an item keeps its count.
- Owner page: each counted item shows "N in stock" or "Low stock: N left" (3 or fewer).
- Customers never see the exact stock. When 3 or fewer are left they see "Only N left" on the item, in its popup, and the assistant can say it.
- Backend: column qty on botcraft_products (added automatically), owner action set_quantity, plan operations set_quantity and add_quantity. Deploy the Worker for it to work live. Checked: 102 end-to-end checks (12 new), planner cases, browser run in demo mode (set count, low-stock badge, customer "Only 2 left", sale, out of stock, restock).

## Owner page: Sales tab
- The owner page has two tabs: "My bot" (everything as before) and "Sales". My bot keeps a small "Sales today" card with a button to the tab.
- Sales tab: Today, Yesterday, Last 7 days, Last 30 days or picked dates (up to one year); total, number of sales, items sold and average per sale; a bar for each day; items sold with quantity and amount; how customers paid (Cash, UPI, Card, Not said); items running low (counted items with 3 or fewer left); every sale in the period with Remove for mistakes; "Download Excel (CSV)" for accounts.
- Backend: owner action sales_report (from, to; shop days in India). The tabs show only when the Worker has the sales feature, so the old page is unchanged until you deploy. Checked: 108 end-to-end checks (6 new for the report) and a browser run in demo mode (tabs, ranges, chart, CSV, remove).

## Files in the chats (the AI opens as many as it can), and item photos from the setup chat
- Customer chat: the + menu has a new "📎 Files (PDF, Word, Excel, text)". Up to 2 files go with a message (a file alone is enough: "Please read my file and help me").
- How files are opened: a PDF goes to the AI as it is (up to 2 MB). Word (.docx), Excel (.xlsx), PowerPoint (.pptx), TXT, CSV, MD, JSON, HTML files are read in the browser and their text is sent (up to 12,000 characters each). File contents are treated as data, never as instructions to the assistant.
- A file that cannot be opened (old .doc / .xls / .ppt, ZIP, video, a password-locked or damaged file, a PDF over 2 MB) is explained at once, without calling the AI: "I could not open ... Please type what is in it here in the chat, or send a photo (image) of it, and I will help."
- Setup chat (owner): the same reader now opens the owner's PDF, Word, Excel, text files (before, only photos were opened and every other file was reported as unreadable). Files that still cannot be opened are named to the AI, which then asks the owner to type the details or send a photo.
- Setup chat photos: before, a photo sent while creating the bot was used only to read names and prices; only the shop-front and owner photos were saved. Now, when the owner sends a photo of one specific item (named in the message or clearly one of the listed items), the AI says which item it shows and the photo is saved on that item. The reply says which items got a photo, and the owner can change it in "Manage my bot". Photos the AI is not sure about are not attached.
- Hosted shop pages also serve the new file-reader.js (added to the allowed page files). salesbot/file-reader.js and chatbot-builder/file-reader.js must stay identical; a test checks it.
- Checked: 109 end-to-end checks, 19 file-reader checks (Word, Excel, PowerPoint, text, PDF, unsupported and damaged files, server limits), and a browser run on a phone width (text + Word accepted, a third file and an old .doc explained, correct request body). Not tried with the real AI: how well Gemini reads a real PDF, and which item it picks for a photo in the setup chat.

## Owner AI is counted and capped (so owner changes cannot run up the Gemini bill)
- Every Gemini call made for the owner is now counted per shop per day and its tokens are saved (table botcraft_owner_ai, created automatically): the setup chat (default 80 a day), the AI helper in "Update with chat" (default 40 a day) and the About text writer (default 6 a day). Change the limits with the Worker variables BOTCRAFT_OWNER_AI_SETUP, BOTCRAFT_OWNER_AI_UPDATE and BOTCRAFT_OWNER_AI_ABOUT.
- Over the limit the owner gets a clear message (setup chat), or the page falls back to its own free rules (update chat: price, stock count, timings, hide/show, sales and more need no AI). Photo studio already had its own daily limit.
- Owners can still only make the changes the update chat knows (items, stock, sales, shop information, sections, saved answers, photos). It is not an open chat for other jobs.
- Reply credits for customers are unchanged. Deleting a bot deletes its counters. `ownerAiMonth` in the store gives a shop's last 30 days of owner AI calls and tokens (for admin; no screen yet).
- Checked: 113 end-to-end checks (4 new: limit reached gives 429, simple changes still work, setup chat is capped too).

## Cost control for customer replies: weighted credits and free answers for plain questions
- Voice, photo and file replies now use more credits than a text reply: voice 3, photo 2, file 2 (text stays 1). Change them with the Worker variables BOTCRAFT_COST_VOICE, BOTCRAFT_COST_PHOTO and BOTCRAFT_COST_FILE. A reply that needs more credits than the shop has left is refused with "a typed question still works" (text keeps working down to zero). A failed AI call gives back all of its credits. The 20-credits-left alert still fires when a heavier reply crosses 20.
- Plain questions about the shop's timings, address or phone ("shop timings entha?", "Where is the shop?", "phone number") are answered on the page from the saved shop details: instant, no AI call, no credit. Only questions made of these simple words qualify; "time to deliver", "open on Sunday late?", prices and anything about an item go to the AI. Not used with photos, files, a selected item or talk mode.
- Checked: 116 end-to-end checks (3 new for weighted credits; the test shop's daily limit became 9) and a browser run: four plain questions answered free, three others went to the AI.

## Prices: packages Rs 999 / 1,499 / 1,999 and reply recharge packs 5K / 10K / 25K
- Packages (customer price): Starter 1 year Rs 999, Growth 2 years Rs 1,499, Pro 3 years Rs 1,999 (renewal Rs 199 a year). The landing page (`ai-chatbots.html`) shows them; "200 free AI replies" is gone from the packages.
- Reply recharge packs, our Gemini cost + 30% rounded up to the next Rs 10: 5,000 replies Rs 1,010, 10,000 replies Rs 2,020, 25,000 replies Rs 5,040 (about Rs 0.20 a reply). The landing page lists them, and the owner page "AI replies" card shows them with a Recharge button that opens a WhatsApp message to SiteCraft (replies are added by admin until online payment exists). Prices are in one file, `botcraft-packs.js`.
- The cost basis is an estimate (Rs 0.155 per reply for a typical shop; gemini-3.1-flash-lite at $0.25 / $1.50 per 1M tokens; Rs 90 to the dollar). Recheck it with the real token log after use. Full working in `docs/BOTCRAFT_PRICING.md`.
- A new shop now starts with a 50-reply test allowance instead of 200 (BOTCRAFT_FREE_REPLIES), not advertised as part of a package.
- Checked: 117 end-to-end checks and a browser run of the owner page and the landing page.
