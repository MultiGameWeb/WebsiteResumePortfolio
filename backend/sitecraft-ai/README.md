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