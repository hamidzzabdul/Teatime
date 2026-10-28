# TeaTime Rewards

The loyalty feature is at `/rewards/`, with terms at `/rewards/terms/`. The header links to Rewards. Existing menu, contact, images, logo, static-export configuration and homepage remain in place.

## Current setup and backend reference

The Supabase connection and migration are already installed for this PC. The steps below document rebuilding the setup for another environment; do not rerun the initial migration against this installed schema.

1. Create or select a Supabase project dedicated to TeaTime. In its SQL editor, run `supabase/001_loyalty.sql` once. This migration targets a new loyalty schema; it creates the auth signup trigger and all access policies.
2. Copy `.env.example` to `.env.local` if you do not already have one. Add the project URL and **public anon/publishable key**:

   ```dotenv
   NEXT_PUBLIC_SITE_URL=https://teatime.co.ke
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-PUBLIC-KEY
   ```

   Never put a service-role key in a `NEXT_PUBLIC_` variable. No service-role key is needed by this app.
3. In Supabase Authentication → URL Configuration, set the Site URL to `https://teatime.co.ke` and allow `https://teatime.co.ke/rewards/` and `http://localhost:3001/rewards/` as redirect URLs. Keep email confirmation enabled, configure the email sender/SMTP, and enable appropriate authentication rate limits. Password-reset links return to the Rewards page.
4. Restart `npm run dev -- --port 3001`. Environment values are baked into static exports: rebuild after changing them.
5. Register your own account in Rewards and confirm its email. In the Supabase SQL editor, promote **only your verified account**, replacing the email below:

   ```sql
   update public.loyalty_members
   set role = 'admin'
   where id = (
     select id from auth.users
     where email = 'YOUR-ADMIN-EMAIL' and email_confirmed_at is not null
   );
   ```

6. Sign out and back in. Open Admin, review each reward's exact eligible menu item, terms, points cost, stock and validity, then activate the reviewed rewards. Review prize probabilities and draft terms/privacy notice, then enable the programme and wheel in Programme settings.
7. Staff create and verify their own normal accounts; an admin assigns `staff` access from Members and staff access. Revoke access by changing their role back to `customer` or suspending the account. This MVP uses verified signup plus admin role assignment rather than email invitation delivery.

Before backend configuration, the page openly shows an unconnected preview, disables account submission, and does not fabricate balances or save loyalty transactions in browser storage. No demo credentials ship in production. The existing Supabase project yudhekrzatjswgiyymos is connected in .env.local, and the migration was applied successfully on 27 October 2026. A live rollback-only transaction verified spins, purchase points, reward retries and voucher reuse protection without retaining test users or transactions. No public website deployment was performed.

## Local verification

```sh
npm install
npm run test:loyalty
npm run lint
npx tsc --noEmit
npm run build
npm run dev -- --port 3001
```

The database test uses a real isolated PostgreSQL engine (PGlite with pgcrypto), builds a minimal Supabase auth fixture, runs the exact migration, and tests database permissions and business rules. It never contacts a cloud database. It does not substitute for testing Supabase email delivery and multiple independent concurrent network connections.

### Manual walkthrough after connection

1. Register a customer, accept programme terms, leave optional marketing consent unchecked, and verify email.
2. Spin once. Refresh and retry: the saved result appears and no additional prize is issued. Check after midnight EAT for renewed eligibility.
3. Copy or scan the membership code from Profile. As staff, look up that membership and record a KSh 1,250 purchase with a unique receipt reference. The default rate awards 12 points. Reusing that receipt must fail.
4. Earn sufficient points, choose a reward and confirm the deduction. Its QR voucher appears under Rewards.
5. As staff, paste the voucher code, validate its terms, then confirm the reward has been served. A second attempt must fail.
6. Verify customer activity, available balance, admin counts and staff-recorded purchase value. Admin metrics are programme totals plus new members in the past 30 days; they do not claim sales attribution.
7. Test a suspended account, unavailable reward, zero-stock reward, expired voucher, purchase reversal, and staff attempts to access admin controls.

## Implementation and data rules

- Auth: Supabase JS manages session persistence and refresh, confirmation and password reset.
- Access: RLS permits customers to read only their own private records; no client may directly write ledger, spin, role or voucher tables. Mutations run through a role-checked SQL transaction function.
- Accounting: append-only points ledger; balances are calculated, with no mutable client-side balance. Money is integer minor units. Purchase receipts are unique.
- Spins: cryptographic rejection sampling, versioned probability configuration and unique `(member, local_day)` constraints. Member row locks serialize balance changes and repeated spins. Retried spins return the saved result.
- Claims: client request UUID retained through retries; atomic points deduction, stock change and voucher creation. Terms are copied to each voucher. Database errors roll the whole transaction back.
- Vouchers: high-entropy UUID codes, staff-only validation, expiry checks and locked single-use redemption. Staff lookup and code validation have an additional 30-per-minute audit-backed limit. Supabase auth limits still apply separately.
- Membership and voucher QR codes carry only opaque IDs. Scanning uses the browser BarcodeDetector API where supported, requests camera permission only on click and closes the camera afterward. Manual entry is always available; some browsers support only manual entry.
- Admin: activation, earning rate, catalogue create/edit, stock, wheel probability versions, member search (first 50 matches), staff role assignment, suspension, points adjustment, reversals and aggregate metrics. Timezone, location and branding follow existing website settings; this MVP is single-branch.
- Activity is paginated in groups of 20. Customer voucher display loads the latest 100 records. These caps should be expanded with cursor pagination as the programme grows.
- No POS, payment processing, online ordering, paid spins, automatic marketing campaigns or public deployment is included.

The remaining original-prompt enhancements are email-based staff invitations, editable branding/timezone inside Admin, arbitrary analytics date ranges, and richer customer profile detail beyond the included paginated points and purchase history. The website's existing configuration remains the source for those brand/location settings.

## Source references

- Official reference: https://teatime.co.ke (attempted 27 October 2026; live retrieval unavailable from this environment).
- Actual implementation sources: existing `src/lib/site.ts` (owner-confirmed address/contact/hours), `src/data/menu-final.json`, `src/data/menu.ts`, and existing restaurant-owned images under `public/images/`.
- Reused menu photos: `teatime-karak.jpeg` and `banana-chocolate-croissant.jpeg`. Photos illustrate the proposed reward categories; they do not promise those specific items until an admin reviews the terms.
- Proposed loyalty offers and wheel odds are new MVP defaults, not claims about an existing TeaTime promotion.

## Deployment

`npm run build` retains `output: 'export'` and writes the website to `out/`. Deploy the rebuilt complete `out/` to your existing static host; retain trailing-slash directory routing. Supabase provides the separate secure backend. Adding public credentials without running the migration produces a visible error rather than a simulated account. Run a live multi-session concurrency and email walkthrough before activating the programme for customers.


## App-style Rewards interface

The Rewards route has its own compact app header. Below 768px it uses a fixed five-item bottom navigation with safe-area padding: Home, Rewards, Spin, Activity and Profile. Staff and Admin workspaces are available from Profile; desktop retains the full section navigation. The website header, footer and timed welcome splash are omitted only for the Rewards app surface. Existing authentication and database rules are unchanged.

The new presentation layer is `src/app/rewards/mobile-app.css`. The prior Rewards design is saved in `rewards-design-backup/`. The Next.js development indicator is disabled because it overlapped the mobile Home button; compile and runtime errors still surface normally.

Verified at 390px and 320px: fixed bottom navigation, no page-level horizontal overflow, navigation across customer sections and Admin access through Profile. TypeScript, lint and static production build pass.
