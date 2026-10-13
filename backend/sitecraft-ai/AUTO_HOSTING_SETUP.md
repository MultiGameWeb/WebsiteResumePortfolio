# Cloudflare Pages auto-hosting foundation

## Scope in this branch

This adds a **private, test-only** deployment route to validate that SiteCraft can upload a generated static website to Cloudflare Pages and receive a live `pages.dev` URL. It is not connected to the public checkout or success page yet.

The public checkout currently uses demo payment simulation. Do not enable customer auto-hosting until real payment verification/webhook handling marks the order as paid. A browser's localStorage value such as `paid: true` is not proof of payment.

## Resource model

- Reserve one Cloudflare Pages project for the SiteCraft main website.
- Allow up to 99 customer Pages projects while the account remains within the Free plan's 100-project account limit.
- Static Pages asset requests are free/unlimited under the current Free plan, but other products (Workers, D1, R2, domain registration, or optional features) have their own usage limits or charges.
- The test route uses a single reusable Pages project named `sitecraft-test-site`; remove it from the Cloudflare dashboard after testing if you do not want it to consume one of the 99 customer slots.

The route checks the account's current Pages projects before creating the test project. If `SITECRAFT_MAIN_PROJECT_NAME` names an existing project, it will count that project as the reserved main site. If the variable is absent or the named project is not present, it reserves one project slot for the future main site.

## Configure the Worker

Create an API token limited to the required Cloudflare account and **Cloudflare Pages: Edit** permission. Do not put this token in frontend HTML/JavaScript, GitHub, or chat.

From `backend/sitecraft-ai`, apply the D1 migration:

```sh
npx wrangler d1 migrations apply sitecraft-db --remote
```

Set secrets (enter the values when Wrangler prompts you):

```sh
npx wrangler secret put CLOUDFLARE_ACCOUNT_ID
npx wrangler secret put CLOUDFLARE_API_TOKEN
npx wrangler secret put HOSTING_TEST_TOKEN
```

Optionally configure the main Pages project name in `wrangler.toml` under `[vars]` after the main site has been migrated to Cloudflare Pages:

```toml
SITECRAFT_MAIN_PROJECT_NAME = "sitecraft-main"
```

Deploy the Worker using the existing project workflow.

## Private test endpoint

Endpoint: `POST /api/hosting/test-deploy`

Required header: `X-Hosting-Test-Token: <the HOSTING_TEST_TOKEN value>`

Example JSON body:

```json
{
  "files": {
    "index.html": "<!doctype html><html><head><title>SiteCraft hosting test</title></head><body><h1>It works</h1></body></html>",
    "style.css": "body { font-family: system-ui, sans-serif; padding: 2rem; }"
  }
}
```

The endpoint accepts relative text files only, requires `index.html`, and limits the request to 24 MiB (18 MiB of total file content; 200 files maximum). It does not accept arbitrary URLs or execute commands. It creates or redeploys the reusable test project and stores the URL in D1.

Use a secure terminal/local tool to make the test request. Never embed the test token in the SiteCraft website.

## Not yet production-ready

This branch does not yet:

- connect deployment to the success-page Download button;
- verify payment through Razorpay or a signed payment webhook;
- create customer hosting records from verified paid orders;
- configure customer-owned domains or automate DNS validation;
- connect generated admin edits to shared D1/R2 storage;
- enforce real customer ownership/admin sessions.

These are intentionally separate from the private deployment test. Once the API token, migration, and test deployment work, add verified-payment integration and customer auto-hosting in a follow-up change.
