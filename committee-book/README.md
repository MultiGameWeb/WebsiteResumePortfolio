# Committee Book

`committee-book.html` is the template selector:
- Template 01: `fixed-discount-chit-manager.html`
- Template 02: `auction-chit-manager.html`

## Templates 03 and 04

- `lottery-kuri-chit-manager.html` — Lottery Chit / Kuri Chit Manager, a pure-luck demo draw with a visible wheel, a confirm-before-record step, one-time winners, random seed/time log and CSV reports.
- `fixed-rotation-bc-chit-manager.html` — Committee / BC Fixed Rotation Manager, an editable drag-and-drop order before start, a lock after start, timeline/turn tracking and an optional early-taker interest ledger.
- `lottery-rotation-app.js` — shared responsive front-end app engine for both templates.
- `lottery-rotation-i18n.js` — shared English/Telugu translation dictionaries.
- `lottery-rotation.css` — lucky wheel, confetti, order editor and timeline styles.
- `lottery-rotation-schema.sql` — additive Supabase schema/RPC scaffold for server-side lottery draws, fixed rotation order and interest ledger.

Both templates currently run sample data in page memory. Refresh resets the sample. The draw wheel uses a locally generated demo seed and is **not a production fairness guarantee**. Do not record or use live financial events until the server-side RPCs, RLS, authenticated organizer roles, payment verification and compliance have been configured and tested.

## Auction Chit Manager files

- `auction-app.js` — mobile-friendly organizer/member-preview UI, sample bids, lowest-approved-bid preview, floor-price calculation, month awards, payment demo controls and CSV export.
- `auction-styles.css` — responsive fintech UI styles.
- `auction-i18n.js` — central English/Telugu UI dictionary.
- `auction-supabase-config.js` — intentionally blank browser-safe configuration placeholder.
- `auction-schema.sql` — Supabase table, row-level security, private document bucket, bid and payment RPC definitions.

## Current implementation status

The deployed HTML/JS template is a front-end demonstration with in-memory sample data. Refreshing resets the demo. Google OAuth, shared Supabase database reads/writes, KYC/document uploads, payment screenshot uploads, and payment-provider verification are **not live-connected in this repository yet**. The sign-in button intentionally reports that configuration is missing instead of pretending the demo session is authenticated.

The UPI QR preview, when an Organizer UPI ID is entered in the demo setup, opens a UPI payment intent. It does not verify a payment or automatically mark an installment paid.

## Supabase activation checklist

1. Create a Supabase project and run `auction-schema.sql` in its SQL editor.
2. Enable Google in Supabase Auth and configure the correct redirect URL for the deployed site.
3. Add the project URL and public publishable/anon key to `auction-supabase-config.js`. Never put a `service_role` key in browser code.
4. Create the chit, attach the correct member/auth-user IDs, and call `initialize_chit_cycles(chit_id)` after the configured member count is present.
5. After allowed setup edits, call `sync_open_auction_cycles(chit_id)` to update only open/upcoming cycle snapshots. Completed cycles remain preserved.
6. Schedule `auto_declare_due_auctions()` with Supabase Cron/pg_cron. A function definition alone does not schedule a recurring job.
7. Test all RLS rules with separate Organizer and Member accounts before loading any real member or financial data.
8. Configure a real payment provider/webhook separately if verified payment status is required. A UPI intent/QR by itself is not payment confirmation.

## Core calculation behaviour

All money in the SQL schema and demo calculation engine is represented as integer paise. The floor-price model is:

`floor = max(starting floor, pot − floor(pot × max discount % × remaining months / total months))`

The lowest approved valid bid wins; the earliest submitted bid wins a tie. The backend RPC rechecks membership, bid floor/pot bounds, auction timing, repeat winners, commission and dividend distribution before writing a completed cycle. Browser demo calculations are for preview only and must not be used as production financial records until the Supabase functions and policies are deployed and verified.

**Legal reminder:** The product is software for recordkeeping. Chit registration, applicable state rules, bidder/member terms, commission and disclosures must be reviewed by a qualified professional before operating a live commercial chit.
