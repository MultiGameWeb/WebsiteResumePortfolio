# Photography Template 01 — v3

A premium, GitHub Pages-friendly photography website template with a separate local admin panel.

## Files

- `index.html` — public photography website
- `style.css` — public website UI, 3D buttons and animations
- `script.js` — public rendering, filters, enquiry form and local sync
- `data.js` — default content/data model
- `admin.html` — admin control panel
- `admin.css` — admin UI
- `admin.js` — admin logic, storage picker, CRUD and settings
- `template.json` — template metadata
- `assets/preview.svg` — optional marketplace thumbnail

## Admin controls

The admin controls the public-facing content instead of asking the customer to paste image URLs or write long forms.

Business: business name, owner name, motto, experience and specialty line.
Home: ribbon, hero heading/subtitle, hero badge, CTA labels, proof points and middle CTA.
Images & Storage: upload images, browser-side compression, choose hero image, delete images.
Gallery: choose stored images, category, title, optional featured video, show/hide, delete.
Video: add/edit/delete YouTube/Vimeo videos and show/hide.
Services: add/edit/delete and show/hide.
Reviews: add/edit/delete, rating/source and show/hide.
Contact & Links: WhatsApp, Call, Email, Location, Maps and social links.
About Us: about text and specialty/experience lines.
FAQ: add/edit/delete and show/hide.
Privacy: edit the privacy text.
Section Visibility: turn sections and animations on/off.
Security: password protection is OFF by default; password can be enabled later. In this static demo it is browser-local and not production authentication.

## Run on GitHub Pages

Upload the files at repository root. Open `index.html` as the public site. Open `admin.html` for administration.

## Data behavior

The public site and admin share `localStorage` keys in the same browser/device. The public tab listens for storage updates and can refresh visible content after an admin change.

Enquiries are stored under `sitecraft-enquiries` in the same browser.

## Production upgrade

For real customer websites, move content/media to a backend such as Supabase/Firebase, add authentication, cloud image storage and image transformation/compression on upload.


## Latest UI update
- Added subtle scroll-focus shake when important sections/features enter the reading zone.
- Improved mobile-first spacing, touch targets, buttons and sticky CTA behavior.
