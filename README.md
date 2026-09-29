# SiteCraft Generic Builder v1

This package establishes the one-time architecture for many website templates.

## Flow

**1. Templates → 2. Features → 3. Details + live preview → 4. Checkout → 5. Done**\n\nThe customer opens directly on the template marketplace. Current order: Restaurants first, then Photography as one category containing two designs (Editorial and Cinematic). Checkout asks for domain and customer online-payment requirements. When online payments are selected, the UI shows: “Our executive will call you in 10 min. You can continue payment and download your website now.” Payment is still a demo simulation in this prototype.

## Important architecture

The builder/checkout/success code is generic. Each template provides only:

- `template.json` — metadata, features, fields and demo data
- `template.js` — `render(data, selectedFeatures)` and `renderFullHtml(data, selectedFeatures)`
- `style.css` — template-specific styling
- `assets/` — template-specific images/assets if needed

To add Template 03, create a new folder under `templates/`, add its manifest/module/styles, then add one registry object to `core/registry.js`.

No new builder, payment or success flow should be written for a new template.

## GitHub Pages

This is plain HTML/CSS/JS. It can run as a static site. The builder uses browser localStorage for the prototype state and uses dynamic ES modules for template modules. Serve over HTTP (GitHub Pages, Cloudflare Pages, or a local HTTP server); do not open `builder.html` as a `file://` URL because fetch/import requests are blocked by browser security.

## Production

For real customers, replace localStorage with a backend, authenticated admin, cloud media storage, real payment gateway and domain provisioning.
\n## Current templates\n\n- Restaurants → Restaurant — Signature\n- Photography → Editorial, Cinematic\n