# TeaTime web app

The existing static Next.js site is now a Progressive Web App. The original logo and restaurant catalogue remain unchanged.

## Navigation
- `/`: restaurant landing page on tablet/desktop (768 px and above); app home with menu, saved dishes, Rewards and visit shortcuts on phones (below 768 px).
- `/menu/`: complete menu, search, price filter, local favourites and dish details.
- `/rewards/`: existing Supabase-backed member, staff and admin flows.
- `/contact/`: live opening status, contact details and map.
- `/our-place/`: the restaurant presentation, delivery information and FAQs.
- `/app/`: install guidance, connection status, offline readiness and shortcuts.
- `/offline.html`: lightweight searchable reference for all 243 dishes.

On phones, the shared bottom navigation links Home, Menu, Rewards, Visit and App. Rewards has separate section tabs above its content. Tablet and desktop layouts use the existing header navigation.

## Build and checks
`npm run build` generates the static `out` folder. Its prebuild script prepares install icons, an exact-price public menu snapshot and a versioned service worker. Original logo files are not overwritten.

`npm run lint`, `npx tsc --noEmit`, `npm run test:loyalty` and `npm run test:webapp` verify the source and behaviour. Run the web app tests after building because they inspect exported install assets.

## Installation and offline behaviour
Deploy all contents of `out` to the HTTPS root of teatime.co.ke. No public deployment was performed in this task. The manifest assumes root hosting. On supported browsers, use the install action under App. Safari provides Add to Home Screen through its Share menu. Browser support determines the available install prompt.

Service worker registration only runs in production over HTTPS or localhost. Keep the initial app page open until App settings reports that the offline menu is ready. New versions wait until the user chooses Update & reload. Offline reference prices carry a build date and a warning to confirm current availability.

Only public same-origin documents, application assets and restaurant images are cached. Supabase traffic, Rewards documents, authentication query URLs and non-GET requests bypass the worker. No private API response is cached and no financial or rewards transaction is queued. Sign-in, daily spins, points and redemption require internet access.

Saved dishes use the existing device-local storage key and are not orders or account-synchronised favourites. The source menu is `src/data/menu-final.json`; update it before rebuilding when prices change.

## Responsive verification
Browser checks: 320 px phone menu and Rewards; 390 px home, App and visit pages; 768 px Rewards and visit; 1440 px home. No horizontal page overflow in those checks. Offline menu search, offline readiness and explicit app update were also exercised. Existing reduced-motion settings and zoom remain supported.

