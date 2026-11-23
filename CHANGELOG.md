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
