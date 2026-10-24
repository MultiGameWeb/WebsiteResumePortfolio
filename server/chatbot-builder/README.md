# BotCraft Gemini key router — isolated backend

BotCraft runs as a separate Cloudflare Worker and reuses the existing SiteCraft
Cloudflare D1 database through its own `DB` binding. Only new `cb_*` tables
and indexes are added by this module. No existing SiteCraft routes or tables
are altered. No real API keys are included in GitHub.

## Key-to-task policy

| Task | Primary key | Fallback order | Model variable |
|---|---:|---|---|
| interview | 1 | 5 | GEMINI_MODEL_INTERVIEW |
| extract | 2 | 5 | GEMINI_MODEL_EXTRACT |
| questions | 3 | 5 | GEMINI_MODEL_QUESTIONS |
| build | 4 | 5 | GEMINI_MODEL_BUILD |
| test | 4 | 5 | GEMINI_MODEL_TEST |
| chat | 4 | 5 | GEMINI_MODEL_CHAT |

Model IDs are configuration, not embedded in router logic. The initial model is
`gemini-3.8-flash`. Only HTTP 429, 500 and 503 trigger provider failover and
cooldown. At most three calls are made per request. A failed key slot enters a
60-second D1-backed cooldown. If the cooldown store fails, the router fails
closed. Non-retryable 4xx responses do not burn backup keys.

Five keys in one Google project do not multiply project-level quota.

## Safety and limits in this slice

- Gemini keys are Worker secrets only; never returned or logged.
- Admin key status shows only masked key endings.
- The identity/admin adapters default-deny until connected to a trusted
  server-side identity check. A client-supplied ID or localStorage flag is not
  trusted.
- Six task types are accepted, but only four primary key slots exist: Key 1
  interview, Key 2 extraction, Key 3 question intelligence, and Key 4 build,
  test, and live chat. Key 5 is a reserve-only fallback and is never primary.
- Maximum 30 messages, 4,000 characters per message, 45,000 total text
  characters, 8,000 system-prompt characters, 5 attachments, 10 MB per file,
  20 MB total attachments and 30 MB total JSON body.
- Supported inline files: JPG/PNG/WEBP/HEIC/HEIF, PDF, TXT and CSV. Office
  formats need a later extraction/conversion stage.
- D1-backed limits: 20 requests per IP/minute, 40 per session/24 hours,
  200 requests per owner/day by default and a separate daily limit per task.
- Task-specific output limits and restricted prompts. Customer-chat answers
  are constrained to 2–4 short lines and must not invent prices, hours,
  availability, allergies, offers or policies. Build output is structured JSON.
- Usage logging is asynchronous and excludes prompts, files and keys.
- A daily scheduled cleanup removes rate-counter rows older than 3 days and expired key cooldowns; it does not delete usage logs or reservations.
- Admin live tests are disabled by default and require admin authorization,
  explicit confirmation and a cooldown. A confirmed test is capped at one
  provider attempt per task (up to six provider attempts total); it does not
  test post-failure failover. Running it spends API quota. Failover is covered
  separately by automated tests.

## Question-bank core (initial module)

`question-bank.ts` defines 35 curated question intents and produces 560 stable,
category-scoped patterns across 16 business categories. Each pattern has a
stable ID, canonical wording, paraphrase variants, knowledge keys, answer type,
and mandatory/optional launch requirement. Multi-category selection collapses
repeat intents. The bank currently uses English canonical wording; multilingual
owner interviews and customer-test phrasing are a later integration task.

`knowledge-coverage.ts` is a deterministic, provider-independent coverage
engine. It links patterns to explicitly keyed facts and reports answerable,
missing, conflicting, unverified, and owner-marked not-applicable questions.
Missing/conflicting/unverified items are returned for owner follow-up. Launch
readiness is a pure calculation, not a payment or production release decision.
These modules are not yet connected to the database or frontend, and should not
be described as a complete question-bank experience until that integration lands.

## Database and migration

The `wrangler.toml` D1 binding points to the existing `sitecraft-db` database;
its ID matches `backend/sitecraft-ai/wrangler.toml`. The migration
`migrations/0001_cb_ai_usage_and_limits.sql` uses D1/SQLite syntax and creates
only `cb_*` objects.

After reviewing the migration, apply it to the existing remote database from
the repository root using Wrangler:

```powershell
npx wrangler d1 execute sitecraft-db --remote --file=server/chatbot-builder/migrations/0001_cb_ai_usage_and_limits.sql
```

Do not run this command until the SQL has been reviewed: it creates new BotCraft
tables and indexes in the shared production D1 database, although it does not
overwrite existing SiteCraft tables.

## Remaining integration gate

The current static SiteCraft UI has no server-verified owner/admin identity
adapter exposed to this separate Worker. These functions intentionally deny
access until implemented and reviewed: `getCurrentUserId(request)` and
`isAdmin(request)`. This prevents the AI endpoint from being exposed without
authorization. The public customer chatbot endpoint, trusted business-knowledge
lookup, FAQ fast-path, lead capture, unanswered-question dashboard, transcription
and plan-expiry handoff are not implemented in this router step. The front-end
BotCraft screen remains a mock and is not connected to this Worker. Do not
advertise this backend as production-ready yet.

## Local setup

1. Install Node.js 22.6+ and npm.
2. From this folder, run `npm install`.
3. The existing `sitecraft-db` D1 binding is already configured in `wrangler.toml`.
4. On Windows, run
   `powershell -ExecutionPolicy Bypass -File .\setup-secrets.ps1` from this
   folder. It asks for five Gemini keys using hidden terminal prompts and writes
   the ignored local `.dev.vars` file. That file is plaintext on your computer;
   do not share, upload or commit it.
5. Set model names and other non-secret settings as Cloudflare Worker Variables.
   Set all five `GEMINI_KEY_*` values as Worker Secrets.
6. Run `npm run typecheck` and `npm test`, then `npm run dev`.

## Endpoints in this slice

- `GET /health` — liveness status only; does not disclose configured key
  counts or database configuration.
- `POST /api/chatbot/ai` — reserved for authenticated owner tasks; denied until
  trusted identity and D1 migration are in place.
- `GET /api/chatbot/admin/key-status` — admin-only, denied until the admin
  adapter is connected.
- `POST /api/chatbot/admin/router-test` — off by default; when explicitly
  enabled and authorized, makes up to six real, potentially billable Gemini
  provider attempts (one per task).

## Rollback

Stop/delete only the dedicated BotCraft Worker after verifying no dependencies.
Drop only the `cb_*` tables after confirming their data is no longer needed.
Removing this folder does not require modifying any other SiteCraft route/page.
