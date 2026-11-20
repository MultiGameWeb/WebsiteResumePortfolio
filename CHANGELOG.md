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
