# SiteCraft AI + Website Data Backend

This backend is the shared API layer for customer websites.

## Storage model

- D1: customer/site data, leads, appointments and metadata.
- R2: images, PDFs/files and uploaded website media.
- Direct video uploads are limited to 50 MB per video.
- Website storage plans are separate from the platform products (Resume, Portfolio, PDF and PPT).
- Initial plan: 5 GB for ₹119/year.
- Storage validity: 365 days.
- Grace period: 7 days.
- After the grace period, stored website data/media can be automatically deleted according to the customer-facing policy. No recovery should be promised after deletion.

## Tenant isolation

Every customer record and asset is keyed by `site_id`. Never run cross-tenant queries. Public website forms may write only to the site's own lead endpoint. Admin operations must be authenticated before production launch.

## Cloudflare bindings

Add these bindings to the deployed Worker:

- D1 binding: `DB`
- R2 binding: `MEDIA_BUCKET`

Secrets/vars:

- `GEMINI_API_KEY` as a secret
- `SITE_API_TOKEN` only for the current prototype upload endpoints; replace with proper per-site authorization before production.

## API

- `GET /api/health`
- `POST /api/ai/generate`
- `GET /api/sites/:siteId/storage`
- `POST /api/sites/:siteId/leads`
- `POST /api/sites/:siteId/assets?kind=image|video`
- `DELETE /api/sites/:siteId/assets/:assetId`

The asset endpoint uses the site's storage quota and rejects direct video uploads over 50 MB.

## Important production hardening before real customer launch

Add authenticated customer/admin sessions, per-site write credentials, rate limiting/abuse protection, virus scanning or safe file policies, automated expiry cleanup, payment webhook handling, backups/export, and a proper public website origin allowlist.

## AI Website Generator (separate from templates)

The AI website generator is a second, independent customer path. It does NOT select or reuse the prebuilt template marketplace.

Flow:

1. Customer enters a plain-language request, for example: "Create a photography website for me."
2. Key 1 (Master) identifies the business and returns the dynamic details form.
3. Customer fills the required details.
4. Key 1 creates the design/site manifest.
5. Keys 2, 3 and 4 generate independent base parts with a small stagger so the three worker calls can run concurrently.
6. The backend assembles the site and Key 5 performs QA and returns the first feature suggestions.
7. The customer can add one feature at a time. The selected worker creates only the new feature package; the site is patched instead of regenerated from scratch.
8. Key 5 checks the updated version and supplies more suggestions.
9. Suggestions are filtered by backend state so installed or previously shown features are never repeated.
10. The backend, not Gemini, owns feature prices and the current customer total.

### Five Gemini secrets

Create five API keys in the same Google AI Studio project and store their values only as Cloudflare Worker secrets:

- GEMINI_API_KEY_1 — Master planner/intake
- GEMINI_API_KEY_2 — UI/Home specialist
- GEMINI_API_KEY_3 — Sections/content specialist
- GEMINI_API_KEY_4 — Functions/integrations specialist
- GEMINI_API_KEY_5 — QA/recommendations

Never commit the secret values to GitHub. The five keys are role-separated credentials; they do not create five independent project-level quota pools.

For a Cloudflare Worker, configure them with the secret mechanism (for example, `wrangler secret put GEMINI_API_KEY_1`) rather than putting the values in `wrangler.toml`.

### AI builder endpoints

- `GET /api/ai-builder/health`
- `POST /api/ai-builder/analyze` — prompt → dynamic intake form + job ID
- `POST /api/ai-builder/build-base` — details → base site + preview + first suggestions
- `GET /api/ai-builder/status/:jobId` — current version/price/state
- `POST /api/ai-builder/add-feature` — add one feature incrementally
- `POST /api/ai-builder/suggestions` — request the next non-repeating suggestions

### Pricing control

Base AI website price is currently `₹499`. Add-on prices are defined only in `ai-feature-catalog.js`. Gemini may recommend feature IDs, but it cannot set or modify prices.

The current catalog contains 50+ configurable features and can be edited without changing the core generation flow.

### Important deployment note

The code is pushed as the backend architecture and remains safe to deploy without API keys, but the Worker will report missing Gemini/D1 bindings until the Cloudflare secrets and D1 migration are configured.

The existing template marketplace remains a separate path in the frontend. Do not replace its template registry or rendering engine with this AI workflow.
