# BotCraft + website pricing (decided November 2026)

Older rule (cost plus 40%, then 40% again, x 1.96) was replaced in November 2026 by direct package prices and a cost + 30% rule for reply packs, below.

## Our cost per website
- Chatbot and web page creation: Rs 599, once.
- R2 storage (5 GB) and Cloudflare hosting: Rs 101 per year (a safe estimate; Cloudflare has no per-site fee, see below).

## Packages (website, chatbot, QR poster, owner chat and voice updates, hosting, 5 GB storage, AI replies included) (final, November 2026)
The owner of SiteCraft decided: the price of the build includes some AI replies, called "included replies" in marketing, so a new owner can try the assistant with real customers instead of buying a pack first. The cost of those replies is paid by the price: build price (Rs 999 / 1,499 / 1,999) plus the replies at Rs 0.20 each (our cost + about 30%).
| Package | Customer price | Build price | Included replies | Value at Rs 0.20 | Our cost of the replies |
|---|---|---|---|---|---|
| Starter, 1 year | Rs 1,099 | Rs 999 | 500 | Rs 100 | Rs 78 |
| Growth, 2 years (recommended) | Rs 1,699 | Rs 1,499 | 1,000 | Rs 200 | Rs 155 |
| Pro, 3 years | Rs 2,299 | Rs 1,999 | 1,500 | Rs 300 | Rs 233 |

Our cost of the build and hosting: Rs 700 / 801 / 902 (see above), so the margin on the build is unchanged (Rs 299 / 698 / 1,097) and the replies add about 30%.
Renewal after the term: Rs 199 per year (hosting and storage; our cost Rs 101).
Defined in backend/sitecraft-ai/botcraft-packs.js (PLANS) and checked by tests/pricing.test.mjs.
There is no online payment yet. After a shop pays, the admin adds the included replies to it (admin bot panel, add replies). Until then a new shop starts with a 50-reply test allowance (BOTCRAFT_FREE_REPLIES, default 50) so the owner can try the assistant; it is not advertised.
Included replies are used like bought ones: text 1, photo or file 2, voice 3.

## Reply recharge packs (rule changed: our Gemini cost + 30%, rounded up to the next Rs 10)
Replies are not a subscription. They are usage packs the shop recharges when they run out. The owner page lists the packs and each Recharge button opens a WhatsApp message to SiteCraft (the replies are added by admin until online payment exists).

| Pack | Our estimated cost | Price |
|---|---|---|
| 5,000 replies | Rs 775 | Rs 1,010 |
| 10,000 replies | Rs 1,550 | Rs 2,020 |
| 25,000 replies | Rs 3,875 | Rs 5,040 |

How the cost was worked out (an estimate, to check against the real token log after use):
- Model gemini-3.1-flash-lite: $0.25 per 1M input tokens, $1.50 per 1M output tokens (https://ai.google.dev/gemini-api/docs/pricing). Fallback gemini-3.5-flash-lite: $0.30 and $2.50. Rs 90 to the dollar.
- A typical shop (60 items, 50 saved answers) sends about 5,700 tokens in and 200 out per reply, which is about Rs 0.155. A small shop (10 items) costs about Rs 0.08, a big shop (200 items) about Rs 0.30.
- Prices live in one file, backend/sitecraft-ai/botcraft-packs.js (REPLY_COST_RUPEES and PACK_MARGIN).
- Credits per answer: text 1, photo or file 2, voice 3 (BOTCRAFT_COST_PHOTO / _FILE / _VOICE). Voice also pays for speech output; Gemini TTS audio output is $9 (Flash) or $6 (Flash-Lite) per 1M tokens until 31 December 2026 and twice that from 1 January 2027, so the voice credits may need to go up to 4 then.
- Plain timing, address and phone questions are answered on the page for free (no AI).
- A big shop sends much more input per reply. Idea not built yet: send only the items that match the question to cut the cost by about half.
- Owner AI (setup chat, update chat AI helper, About text) is not charged from credits. It is counted and capped per shop per day (80, 40 and 6; BOTCRAFT_OWNER_AI_SETUP / _UPDATE / _ABOUT) and its tokens are saved in botcraft_owner_ai. Setup costs about Rs 15-30 per shop once.

## Not counted yet
- Payment gateway fee and GST.
- Custom domain (separate yearly cost, if the customer wants one).

## Cloudflare notes (checked November 2026)
- Workers paid plan: minimum $5 per month per account, not per website. Static asset requests are free. https://developers.cloudflare.com/workers/platform/pricing/
- R2: $0.015 per GB-month, 10 GB free per account, no egress fee. https://developers.cloudflare.com/r2/pricing

## Still to build
- Reply metering (token usage per reply), reply balance, recharge and the out-of-replies behaviour.
- Payment gate. The landing page (`ai-chatbots.html`) still says "Rs 1,999, 10,000 replies included" and must be updated.

## Premium owner voice (ElevenLabs)
The owner mic uses ElevenLabs Speech to Text when the Worker has the key. Cost is per minute of audio and is not in the package prices yet; it must be added (cost x 1.96) once the real ElevenLabs rate is known. The daily limit per shop (ELEVENLABS_DAILY_LIMIT, default 150) caps spending.

## Photo studio (AI clean studio photo)
Estimated Gemini cost about $0.039 per image (1,290 output tokens at $30 per million; not confirmed on the official page; check before pricing). At Rs 88 per dollar that is about Rs 3.4, so about Rs 7 per photo after the x 1.96 rule. Planned as a separate pack (for example 50 photos Rs 349, 100 photos Rs 699). Until payment exists it is free with a daily cap per shop. Retries cost again and are not in these numbers.

## Reply metering (built)
Each customer AI reply uses one credit; shops start with 200 free (BOTCRAFT_FREE_REPLIES). Tokens used are logged per shop per day (admin bot panel shows average tokens per reply), so the real Gemini cost per reply can be read after a few days of use and the pack prices set (cost x 1.96). Recharge is added by the admin until payment is built. Owner-side AI (setup chat, update chat, photo studio, voice) is not metered and is a cost to us.

## Voice to voice (customer chat)
Each voice exchange has two extra costs not in the token log yet: the recording the AI hears (audio input) and the spoken answer (speech output; Sarvam or Gemini speech). Check both on the official pricing pages and read a few days of real use before setting a price; today one exchange uses one reply credit.
