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

## Cloudflare customer website hosting (in-progress branch)

The shared hosting prototype lives in `hosting.js` and uses the existing `sitecraft-db` D1 database plus an R2 bucket named `sitecraft-media`.

### Test architecture

- A successful current checkout demo sends the selected template, selected features and customer-entered data to `POST /api/sites/publish`.
- The Worker creates a unique site slug and owner token, moves uploaded image data URLs into R2, stores the normalized site configuration in D1, and returns a URL under `/s/:slug`.
- Public site content is served at `GET /s/:slug`. Uploaded image assets use `GET /api/public/assets/:assetId`.
- The hosted customer admin is served at `/s/:slug/admin`. Its existing UI files are proxied from the repository; save operations go through an owner-token-protected API and persist the content to D1/R2.
- The downloadable ZIP remains a separate option. The current ZIP admin remains local/browser storage; use the hosted admin link for the cloud-synced prototype.
- This currently uses a shared Worker origin and path-based URLs, not customer-owned custom domains.

### Cloudflare setup required before testing

1. R2 setup is currently pending. The current branch intentionally omits the `MEDIA_BUCKET` binding so a controlled text-only D1 test can be deployed without an R2 bucket. Add the binding only after the `sitecraft-media` bucket exists in the same Cloudflare account.
2. For a fresh D1 database, apply `0001_site_data.sql`, the existing AI/chatbot migrations used by that database, and then `0004_customer_site_hosting.sql` exactly once.
3. **Current `sitecraft-db` exception:** the customer-hosting columns and indexes in migration `0004` were added manually in the D1 Console during this setup. Do not execute the full `0004_customer_site_hosting.sql` file against this database; its `ALTER TABLE ... ADD COLUMN` statements would fail because those columns already exist. Do not run Wrangler's D1 migration apply flow on this database until its migration history is reconciled with these manual changes.
4. Deploy the Worker with the `MEDIA_BUCKET` R2 binding only after the bucket exists. Keep `ENABLE_DEMO_PUBLISH=false` for now. It must not be enabled for a real customer launch; the browser checkout flag is not verified payment.
5. While R2 is pending, a controlled **text-only** prototype test can use D1 alone after the branch code is deployed and the demo-publish flag is temporarily enabled for that controlled test. Keep image fields free of embedded `data:image/...` values; image uploads and saves still require R2. Do not enable the demo endpoint for public customer traffic. Once R2 is configured, test uploaded-image sites too, then edit the hosted site through its private admin link and refresh from another tab to verify persistence.

The current D1 Console setup has these customer-hosting schema items applied: `sites.slug`, `sites.template_id`, `sites.selected_features_json`, `sites.site_data_json`, `sites.owner_token_hash`, `sites.published_at`, `assets.content_hash`, `idx_sites_slug`, `idx_sites_status`, and `idx_assets_site_content_hash`.

### Important prototype boundary

The current checkout flag is still a browser-side demo simulation. It is not proof of payment. The auto-publish endpoint is intentionally behind `ENABLE_DEMO_PUBLISH`; do not enable public publishing for a real customer launch until server-side payment verification, abuse protection/rate limits, secure customer authentication, backups, expiry handling, and production authorization are in place. Never treat the local `paid` flag as verified payment.

**Tenant-isolation warning:** the initial test URLs use one Worker origin with path-based site slugs. That is convenient for controlled tests, but it is not the final production isolation boundary for untrusted customer content. Before real customer data is used, move live sites to customer-specific subdomains/origins (or isolated per-customer Workers through Workers for Platforms), and keep owner credentials out of shared-origin local storage. Do not launch publicly with only the test path routing.
