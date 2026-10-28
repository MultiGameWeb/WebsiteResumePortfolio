# SiteCraft Website Chatbot MVP

> **Direction changed (October 2026).** BotCraft is now a QR-based AI salesman for shops, hosted on our own domain, not a widget embedded on the customer's website. See [`docs/BOTCRAFT_CONCEPT.md`](../../docs/BOTCRAFT_CONCEPT.md). The rate limits, reply limits and server-side Gemini key handling below will be reused. The `allowed_origin` website-embed model and the reply-credit pricing will be replaced in Phase 1–2.

The product direction is a self-service **website-only chatbot builder**. A customer enters business information, configures an assistant, tests a local preview, pays for activation, and receives a website embed package. This branch is still a prototype: the builder UI does not yet save profiles to the backend, accept payments, or create production downloads.

No WhatsApp, Meta, Instagram, Facebook, SMS, email, or mobile-app integration is in scope for this phase.

## Existing prototype endpoint

`POST /api/website-chatbot/chat`

JSON body:
```json
{
  "siteId": "demo-shop",
  "message": "What time do you open?",
  "history": [
    { "role": "user", "text": "Hello" },
    { "role": "model", "text": "Hi! How can I help?" }
  ]
}
```

The browser must send the real `Origin` header. The origin must exactly match the site's `allowed_origin` in D1. Origin/CORS checks are not authentication; production must include stronger abuse protection because browser headers can be spoofed by non-browser clients.

The Gemini API key remains a Cloudflare Worker secret and is never placed in the downloaded widget or browser code.

## D1 setup for a controlled demo

1. Deploy only after reviewing existing Worker routes and configured secrets.
2. Apply `migrations/0002_website_chatbot.sql` to the configured D1 database.
3. Set `CHATBOT_GEMINI_API_KEY` as a separate Worker secret for cost monitoring and access isolation (the current code falls back to `GEMINI_API_KEY` for development only). Set `CHATBOT_GEMINI_MODEL` to an enabled model; the default in this prototype is `gemini-2.5-flash-lite`, chosen as a cost-efficient starting point for short FAQ replies.
4. Insert a demo site using a real controlled HTTPS origin and dummy/non-confidential business information.

Example only; replace the origin and details, and only use a profile you have permission to test:

```sql
INSERT INTO website_chatbot_sites
  (site_id, owner_id, allowed_origin, business_name, business_profile_json,
   system_instructions, daily_message_limit, reply_credits_remaining,
   enabled, created_at, updated_at)
VALUES
  ('demo-shop', NULL, 'https://example.com', 'Demo Shop',
   '{"business":{"description":"A demo shop open 9 AM to 6 PM","services":"Demo product A: sample item","policies":"Orders require confirmation by phone","faqs":[{"q":"What time do you open?","a":"We open at 9 AM."}]},"assistant":{"language":"Match the visitor language","tone":"Friendly and helpful"}}',
   'Use only the verified business information. Escalate unknown requests to the business.',
   100, 20000, 1, datetime('now'), datetime('now'));
```

Do not seed real reply credits for a customer until the payment is confirmed by a server-side payment webhook. The example row is for a controlled test only.

## Reply counting

- One successfully returned AI answer consumes one reply credit.
- A request reserves a credit before calling Gemini. A successful answer consumes it; a failed API request or empty answer releases the reservation.
- Daily message limit and per-minute rate limit are abuse controls, not the paid reply balance.
- Purchased recharge credits must be added only after verified payment-webhook confirmation. Payment verification and customer account ownership are not implemented yet.
- The current builder UI uses a local rule-based simulation and downloads a draft JSON profile only. It does not call this endpoint or produce a live widget.

## Gemini key and cost notes

- The planned five task roles are: (1) classify and normalize business intake; (2) extract FAQs and searchable knowledge; (3) assemble assistant instructions and tone; (4) test a set of business-specific questions and flag unsupported answers; (5) answer live website visitors. These are future task modules; this branch currently implements only the runtime-reply route and local UI preview.
- Use one server-side key for the runtime prototype first. Later, separate keys may be assigned to roles 1–5 for access isolation, cost attribution or revocation, but five keys in the same Google AI Studio project **do not multiply the project's RPM/TPM/RPD quotas**; rate limits are applied per project. See [Google's rate-limit documentation](https://ai.google.dev/gemini-api/docs/rate-limits).
- Do not put any API key in the customer download. Separate keys should not be designed as a quota-bypass strategy.
- Use a cost-efficient supported model for short business FAQ answers and measure actual input/output token usage, error rates and context size before publishing any reply-pack pricing. The current official pricing page lists Gemini 2.5 Flash-Lite at $0.10 per million input text tokens and $0.40 per million output tokens on the paid tier; confirm the live model availability and rate card before launch.
- Free-tier content may be used to improve Google's products, while the paid tier states that prompts and responses are not used for that purpose. Do not enter real customer-confidential business data in free-tier testing without reviewing Google's current terms and obtaining the required customer permission. See [Gemini API pricing](https://ai.google.dev/gemini-api/docs/pricing) and [additional terms](https://ai.google.dev/gemini-api/terms).

## Current protections in the endpoint

- Request body capped at 16 KB; visitor message capped at 1,000 characters.
- Up to 6 history turns/entries sent to Gemini, each clipped to 700 characters.
- Per-site/per-IP hashed throttle: 12 requests per minute.
- Daily message cap recorded in D1.
- Exact origin allowlist, with site disabled and zero reply credits by default.
- Business facts are retrieved from the stored profile using simple keyword matching and included as reference data. This is a prototype retrieval method, not a production document-search pipeline.

## Required before customers can buy/download

- Customer login and authenticated ownership/admin endpoints.
- Secure onboarding endpoint that validates website URL and writes a business profile only for the authenticated owner.
- File upload/text extraction, document size limits, data retention/deletion, and per-customer data isolation.
- Better retrieval for large business documents, prompt-injection evaluation, and answer-quality test set.
- Cloudflare Turnstile or equivalent abuse checks, robust cost budgets and alerts.
- Verified payment webhooks for first package and recharges; atomic reply-credit accounting and an audit ledger.
- Actual embeddable widget/ZIP, versioning, usage reporting, customer support, and browser/mobile QA.
- Confirm the selected Gemini plan/model's data handling and current pricing before production use.

Do not advertise this branch as production-ready or charge customers based only on the local demo.
