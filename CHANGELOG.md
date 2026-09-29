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
