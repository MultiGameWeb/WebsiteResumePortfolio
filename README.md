# Photography Template 01 — v2

A premium static HTML/CSS/JS photography website with a local demo admin panel.

## Files

- `index.html` — public photography website
- `style.css` — public website design, 3D buttons and animations
- `script.js` — public rendering + filters + enquiry handling
- `data.js` — default site data
- `admin.html` — admin control panel
- `admin.css` — admin design
- `admin.js` — add/edit/delete/save/import/export controls
- `template.json` — template metadata
- `preview.svg` — preview thumbnail

## Admin control

Open `admin.html` from the same GitHub Pages site. The admin can edit or delete:

- Studio/brand text
- Hero title, subtitle, image and CTAs
- Phone, email, WhatsApp number, location and Google Maps URL
- Instagram, Facebook, YouTube and Pinterest links
- Services/packages
- Gallery images, category and YouTube/Vimeo links
- Reviews and visibility/approval
- FAQs
- Section visibility
- Accent colour
- Top ribbon, hero badge and animations

Image uploads are supported as browser-local data URLs for the demo. All settings use the same `localStorage` key as the public page, so changes immediately appear on the same browser/device.

## Important production note

This is intentionally a static demo. `localStorage` does not provide secure or shared admin control across different devices. For a real customer product, connect the same data model to Supabase/Firebase (or another backend), add authentication/authorization, cloud image storage, image compression and server-side persistence.
