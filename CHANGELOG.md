# Changelog

## v3.1.0
- Fixed admin startup TDZ/initialization bug in `admin.js`.
- Admin opens correctly when password protection is OFF (default).
- Deleting a storage image now clears the related hero/gallery fallback image instead of silently restoring it.
- Bumped template metadata version to 3.1.0.
- Confirmed public page and admin page load successfully under a local HTTP server.

## v3.2.1
- Fixed: `[hidden]` now always hides (image picker overlay and login screen were showing on admin load; hidden WhatsApp buttons stayed visible).
- Fixed: hero blurred background never applied (invalid setProperty name).
- Fixed: scroll observers no longer pile up; tall sections cannot stay invisible.
- Added: Vimeo embeds, storage-full handling in admin uploads.

## v3.2.0
- Added subtle repeated scroll-focus motion to sections/features as they enter the reading zone.
- Strengthened mobile-first layout, touch targets, filter rows, CTA stacking and spacing.
## v4.0.0 — SiteCraft Home + Portfolio UX
- Rebuilt `index.html` as the Home page with only three main services: Website Templates, AI Websites (Coming Soon), and Portfolio Creator.
- Added `templates.html` as the dedicated Website Templates marketplace page.
- Added `ai-websites.html` as the AI Websites Coming Soon page with local-only email validation and a future Cloudflare Worker + D1 integration note.
- Updated Portfolio Creator with independent editor/preview scrolling, mobile Edit/Preview panels, keyboard preview scrolling, inline Step 1 persona selection, leave-confirm modal, fixed accordion switch classes, hidden file inputs, reset/import fixes, education reorder support, font handling, and styled standalone export.
- Added the Assistant Director theme to the Portfolio Creator theme picker and retained the Actor theme.
- Kept template flow navigation aligned with `templates.html` from `features.html` and the admin marketplace link.
- Assumed the existing marketplace `index.html` should become the Home page, and therefore used `templates.html` as the dedicated Website Templates page name.
