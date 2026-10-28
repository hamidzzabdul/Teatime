# TeaTime Restaurant

Next.js 16 restaurant website with a landing page, category menu and contact page.

## Development

```sh
npm install
npm run dev
npm run lint
npm run build
```

## Before publishing

Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SITE_URL` to the actual public origin (including https). Rebuild after changing deployment configuration. Without a confirmed domain, canonical links and sitemap URLs are deliberately omitted rather than pointing at an invented domain. `/robots.txt` and `/sitemap.xml` are implemented; the sitemap is empty until the domain is configured.

Set the confirmed address, opening hours and Google Maps link in the environment. The owner confirmed the phone number, Legend Valley Business Park address in Lavington, Nairobi, and 6 am–midnight opening hours. The email was preserved from the original project and still needs verification. The finalized Nairobi food and drinks PDFs now supply menu items and KSh prices in `src/data/menu-final.json`. The earlier Qatar extraction is retained as a reference only. All featured items and category links now come from the actual menu data.

The site has page-specific titles/descriptions, canonical URLs when configured, Open Graph/Twitter metadata, a generated social preview and basic Restaurant JSON-LD. The Restaurant schema includes the confirmed phone and postal address. The owner has not confirmed operating days, so structured weekly opening hours are not inferred. No fabricated ratings, reviews or opening hours are included. Real dish/interior photographs should replace the illustrative Unsplash images in `src/data/menu.ts`, `Hero.tsx` and `AboutSection.tsx`.

After deployment, verify the domain in Google Search Console, submit `/sitemap.xml`, inspect the three public URLs and validate Restaurant markup with Google's Rich Results Test. Ensure the business name, address and phone match the restaurant's verified Google Business Profile.

## Site review and improvements

- Replaced nonexistent homepage menu categories and unrelated featured meals with the shared menu data.
- Added meal inspiration and accessible FAQ sections to extend the landing page.
- Replaced the placeholder map and address with useful contact and visit guidance.
- Made phone/email links actionable and gave the contact page a primary heading.
- Optimized hero/category/feature/about images with responsive sizing, eager hero loading and lazy below-fold images.
- Added skip navigation, active page indicators, Escape handling, and inert closed mobile navigation.
- Kept all menu descriptions server-rendered through the mobile category sections, so the full menu is in the initial HTML.
- Pending client facts: public domain, email verification, operating days, clarification of ambiguous PDF labels and genuine photography.

## Delivery and welcome screen

The owner confirmed deliveries through Glovo, Bolt Food and Uber Eats. Delivery cards currently open the platform websites and tell guests to search TeaTime; replace these with confirmed restaurant listing URLs when available.

The branded welcome screen appears for four seconds on the first page load in a browser tab session. It does not repeat during internal navigation or later reloads in that session. Site content remains server-rendered for SEO. Background interaction is paused during the intro, reduced-motion preferences are respected, and a CSS fallback dismisses it when JavaScript is unavailable.

## Optional coming soon mode

The full website is enabled by default. Set `TEATIME_COMING_SOON=true` and rebuild only if you explicitly want the optional coming soon view. Set `NEXT_PUBLIC_SITE_URL` to the real domain for canonical links. Menu data and all completed website sections are preserved.
