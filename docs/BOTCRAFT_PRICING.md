# BotCraft + website pricing (decided November 2026)

Rule decided by the owner of SiteCraft: for every option, our cost plus 40%, then 40% again on that price. The customer pays the final price (cost x 1.96, rounded up).

## Our cost per website
- Chatbot and web page creation: Rs 599, once.
- R2 storage (5 GB) and Cloudflare hosting: Rs 101 per year (a safe estimate; Cloudflare has no per-site fee, see below).

## Packages (website, chatbot, QR poster, owner chat and voice updates, hosting, 5 GB storage)
| Package | Our cost | Customer price |
|---|---|---|
| Starter, 1 year | Rs 700 | Rs 1,399 |
| Growth, 2 years (recommended) | Rs 801 | Rs 1,599 |
| Pro, 3 years | Rs 902 | Rs 1,799 |

Renewal after the term: Rs 101 x 1.96 = Rs 198, so Rs 199 per year (hosting and storage).

## Replies
Replies are not a subscription. They are usage packs the shop recharges when they run out (even if 10,000 are used in one day).
Price per pack = Gemini cost x 1.96, rounded up. Planned packs: 1,000, 5,000, 10,000 and 25,000 replies.
Not priced yet (the landing page says "announced soon"): needs the current Gemini Flash-Lite input and output rates (https://ai.google.dev/gemini-api/docs/pricing) and the real tokens used per reply.

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
