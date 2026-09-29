# Photography Template 01

This is the first photography template for the modular Website-s-Builder project.

## Folder

`templates/photography-01/`

## Files

- `index.html` — page structure
- `style.css` — template-only styles
- `script.js` — gallery filters, FAQ accordion, mobile navigation, WhatsApp link and enquiry handling
- `data.js` — all editable demo content
- `template.json` — metadata / builder contract

## How the builder can customize it

The template reads content from:

```js
window.PHOTOGRAPHY_TEMPLATE_DATA
```

The simplest integration is to replace that object before `script.js` runs. This keeps the template independent from the main builder code.

## Features included

- Home / hero
- About
- Services packages
- Category-based gallery filtering
- YouTube/Vimeo “Watch film” links
- Reviews and rating summary
- Contact / enquiry form
- WhatsApp click-to-chat
- Google Maps button
- Instagram / Facebook / YouTube / Pinterest links
- FAQ accordion
- Privacy policy footer
- Responsive mobile/tablet/desktop layout
- Optional-field hiding
- Demo enquiry storage in browser localStorage

## Important

The current template is a front-end website template. Real image upload/compression, admin authentication, production enquiry storage, online payments and domain provisioning belong to the main Website-s-Builder/backend layer.
