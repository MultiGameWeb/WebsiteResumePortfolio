# BotCraft Gemini Key Router — isolated backend

This is a separate Cloudflare Worker module. It neither edits nor replaces the
existing SiteCraft Worker/routes. It is not deployed by the static GitHub Pages
site. No real Gemini keys are included.

## Key-to-task policy

| Task | Primary key | Fallback order | Model variable |
|---|---:|---|---|
| interview | 1 | 4, then 5 | GEMINI_MODEL_INTERVIEW |
| extract | 2 | 4, then 5 | GEMINI_MODEL_EXTRACT |
| test | 3 | 4, then 5 | GEMINI_MODEL_TEST |
| chat | 4 | 5 | GEMINI_MODEL_CHAT |
| voice | 5 | 4 | GEMINI_MODEL_VOICE |

Each model name is explicit configuration. No model fallback is hardcoded.
Only HTTP 429, 500 and 503 trigger cooldown/failover. At most three Gemini
attempts are made per request. A failed key slot enters Cloudflare KV cooldown
for 60 seconds. If the key/cooldown store fails, the router fails closed.
Malformed requests and non-retryable Gemini 4xx responses do not burn backups.

IMPORTANT: five keys from the same Google AI Studio/Cloud project do not
automatically multiply the project's quota. They separate credentials and task
routing; project-level quotas still apply.

## Server-side restrictions in this slice

- Gemini keys are Cloudflare secrets only; never returned or logged.
- Admin key status exposes only the final four characters, never the full key.
- Adapter stubs default-deny until connected to the existing auth/Supabase logic.
- Only the five known tasks are accepted.
- Max 30 conversation messages, 4,000 characters per message, 45,000 total
  text characters, 8,000 system-prompt characters, 5 attachments, 10 MB per
  file, 20 MB total attachments and 30 MB total JSON request body.
- Supported inline attachments in this slice: JPG/PNG/WEBP/HEIC/HEIF, PDF,
  TXT and CSV. Office formats must be converted/extracted in the future
  document-ingestion step.
- SQL-backed limits: 20 requests per IP/minute, 40 per session/24 hours,
  200 requests per owner/day by default and a separate daily limit per task.
- Task-specific output-token limits, temperature and non-overridable prompts.
  Chat/voice replies are constrained to 2–4 short lines and must not invent
  prices, opening times, availability, allergies, offers or policies.
- Usage logs are asynchronous and never contain prompts, file contents or keys.
- Admin live test is disabled by default, requires isAdmin and explicit
  confirmation, has a 60-second KV cooldown, and performs five real billable test calls when enabled.

Rate-limit reservations count attempts even when the model call fails; this
prevents repeated failure retries from bypassing limits. Cloudflare KV is
eventually consistent, so its 60-second cooldown is a best-effort global flag;
SQL rate counters are atomic.

## Adapters

Connect exactly the three existing-app boundaries in adapters.ts:
- getCurrentUserId(request)
- getSupabase(env)
- isAdmin(request)

They currently return null/false, so protected routes cannot perform AI calls
until connected. This is intentional: use the existing authentication and
Supabase project, not a second auth or database system. Review/apply the SQL
migration to that existing Supabase project.

## Endpoints

- GET /health — returns configuration count and adapter status only.
- POST /api/chatbot/ai — authenticated owner endpoint for one task request.
- GET /api/chatbot/admin/key-status — admin protected; recent usage by key.
- POST /api/chatbot/admin/router-test — disabled unless
  CB_ENABLE_ADMIN_TEST=true; also requires isAdmin and JSON {"confirm":true}.
  It tests each task once with the fixed prompt "Say hello in Telugu" and
  returns task/key slot/model/token counts only. No key values are returned.

The public customer chat endpoint, approved business knowledge lookup, FAQ
fast-path, lead capture, unanswered-question dashboard, voice transcription
and plan-expiry handoff are not enabled in this key-router step. They must be
implemented before this Worker is exposed to customers. The existing BotCraft
screen remains mock-only in this step.

## Local setup

1. Install Node.js 22.6 or newer and npm.
2. Run npm install inside this folder.
3. Create a dedicated Cloudflare KV namespace and replace the placeholder ID in
   wrangler.toml.
4. Copy .env.example to .dev.vars, enter development-only keys, models and
   Supabase values, and never commit .dev.vars.
5. For deployed Worker, set model names as non-secret Variables in Cloudflare.
   Put the five Gemini keys, SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY into
   Secrets, never plaintext variables or browser JavaScript.
6. Run npm run typecheck and npm test; run npm run dev for an isolated local
   Worker.

## Cloudflare secrets

From this folder, use the commands below and paste values directly into the
hidden terminal prompt, not into source code or chat:

- npx wrangler secret put GEMINI_KEY_1
- npx wrangler secret put GEMINI_KEY_2
- npx wrangler secret put GEMINI_KEY_3
- npx wrangler secret put GEMINI_KEY_4
- npx wrangler secret put GEMINI_KEY_5
- npx wrangler secret put SUPABASE_URL
- npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

Alternatively use Cloudflare Dashboard → Workers & Pages → your BotCraft Worker
→ Settings → Variables and Secrets. Add key values as Secret and models/origins
as non-secret Variables, then deploy the new Worker version.

## Deployment gate

Do not deploy until all of these are done:
1. Connect and review the three adapters.
2. Apply the SQL migration to the existing Supabase project.
3. Replace the KV namespace ID.
4. Configure all five keys as secrets and five model names as variables.
5. Confirm CORS origins, run tests, deploy as a separate Worker, and check its URL.

The Worker does not yet connect to the front-end mock send function. Do not expose
the generic owner endpoint to the public chatbot.

## Rollback

Stop/delete only the dedicated BotCraft Worker after verifying that nothing else
depends on it. Remove the chatbot KV namespace and cb_* tables/functions only
after confirming their operational data is no longer needed. Removing this folder
from Git does not require any other SiteCraft page or route to be rolled back.
