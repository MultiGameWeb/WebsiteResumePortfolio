# Website Chatbot MVP (website-only)

This is an initial, controlled API prototype. It does not integrate WhatsApp, Meta, Instagram, Facebook, SMS, email or mobile apps.

## Endpoint

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

The browser must send the real `Origin` header. The site's exact allowed origin must match the `allowed_origin` row in D1. The API key remains a Cloudflare Worker secret and is never sent to the browser.

## Setup

1. Deploy the Worker only after checking the existing production routes and configured secrets.
2. Apply `migrations/0002_website_chatbot.sql` to the same D1 database.
3. Set `GEMINI_API_KEY` as a Worker secret. Set `GEMINI_MODEL` to a model ID currently available to the Google AI Studio project.
4. Add a demo site row manually for a controlled test, replacing the origin with the exact deployed demo website origin:

```sql
INSERT INTO website_chatbot_sites
  (site_id, allowed_origin, business_name, system_instructions, daily_message_limit, enabled, created_at, updated_at)
VALUES
  ('demo-shop', 'https://example.com', 'Demo Shop',
   'Use only these facts: Opening hours 9 AM to 6 PM. For orders, tell visitors to call the shop.',
   100, 1, datetime('now'), datetime('now'));
```

Do not use the placeholder origin above in production.

## MVP protections and limits

- Exact origin allowlist (CORS is not authentication by itself).
- Maximum request body of 16 KB and message size of 1,000 characters.
- At most 8 history entries are sent to the model.
- Per-site/per-IP hashed request throttling: 12 messages per minute.
- Per-site daily message cap, tracked in D1. This first prototype counts messages, not billable conversations.
- Safe fallback when the model cannot answer; the prompt tells the assistant not to invent missing business facts.

## Not production-ready yet

Before selling plans or embedding on arbitrary customer domains, add owner/admin authentication, customer self-service setup, abuse monitoring, robust atomic quota enforcement under concurrent traffic, privacy/retention controls, billing/webhook verification, cost monitoring, and browser-tested widget UX. Do not advertise a paid conversation quota based on this prototype's message counter. Test with a controlled demo site first.
