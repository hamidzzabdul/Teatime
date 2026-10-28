# TeaTime frontend review and redesign

Completed locally on 28 October 2026. Public deployment was not performed.

## Reviewed architecture

| Surface                                   | Responsibilities                                                                                                   |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/app/layout.tsx`                      | Fonts, restaurant metadata/schema, shared navigation/footer, page motion                                           |
| `/`                                       | Venue introduction, menu discovery, featured dishes, dining context, Rewards, delivery, FAQs and visit information |
| `/menu`                                   | Complete catalogue, category links, search, price filters, saved dishes, dish details and PDF downloads            |
| `/contact`                                | Confirmed address, opening hours, phone/email enquiries, venue entrance photo and map                              |
| `/rewards`                                | Existing Supabase membership, daily spin, points, vouchers, staff tools and admin controls                         |
| `/rewards/terms`                          | Existing programme terms and privacy information                                                                   |
| `/sitemap.xml`, `/robots.txt`, Open Graph | Existing static hosting and discovery support                                                                      |

The application remains a Next.js static export. Restaurant details live in `src/lib/site.ts`; the menu comes from `src/data/menu-final.json`. The Supabase loyalty backend and permissions are unchanged.

## Main findings and changes

- The previous site repeated broad promotional messaging across large rounded cards. The new page sequence gives each section a specific purpose and uses the actual restaurant interior and menu photographs.
- Menu rendering previously filtered out every record without a photo. All 243 dishes/drinks in 39 categories are now available. Unpictured dishes use an honest neutral treatment; no dish photos or ingredients were fabricated.
- The menu now supports name/description/category search, maximum starting-price filters, locally saved dishes, category counts, shareable dish links and a detail panel with exact size variants and prices.
- Results initially render 24 entries, with a working load-more control. Search and filters operate across the whole catalogue. The full PDF menus remain available.
- The four-second welcome overlay was removed from the active shared layout so visitors can use the site immediately. Its retained source is not mounted.
- The shared header has a mobile disclosure menu, keyboard Escape support, outside-click dismissal, and inert hidden content. Current-page navigation is indicated.
- Visit information uses the confirmed restaurant details. Open/closed status follows the confirmed 6 am–midnight schedule in Africa/Nairobi; custom opening-hour configurations display their supplied hours rather than an inferred live status.
- Desktop and mobile layouts use one warm ivory/charcoal/red system. The original `#d71920` brand-red token is preserved. Logo image files were checked as byte-identical.
- Motion consists of a short hero entrance, one-time section reveals, image/arrow hover transitions and the existing Rewards wheel. Reduced-motion preferences are respected; content stays visible without JavaScript.
- Dish detail panels trap keyboard focus, close with Escape or the close button, and restore focus. Mobile search fields use readable input text sizing. Supporting copy contrast and narrow-screen overflow were refined during browser review.
- The previously built Rewards app retains its separate mobile bottom navigation. Shared website chrome stays hidden only on that app surface.

## What is real, and what is deliberately not simulated

Menu prices, serving variants and descriptions are retained from the existing final Nairobi catalogue. Previously documented source ambiguities remain in `src/data/menu-final-review.md`; this redesign does not silently change prices or infer dietary guarantees.

Saved dishes stay in this browser and are not a submitted order. Table and menu enquiries use the actual phone/email links. Delivery buttons honestly open the platforms and instruct visitors to search TeaTime; no direct restaurant listing or POS connection is invented. Rewards continues to use the already connected Supabase project.

## Verification

- TypeScript, ESLint and static production build.
- Existing 18-check loyalty regression suite.
- Browser checks for search of an unpictured dish, saving/removing a dish, the saved view, price filtering and TeaTime Karak's Medium/Large prices.
- Progressive menu loading verified from 24 to 48 cards.
- Narrow-phone checks for the homepage, contact page and menu; horizontal category overflow found and corrected.
- Mobile navigation into contact and Rewards; Rewards' five-button bottom bar and existing signed-in balance still render.
- No missing local image files referenced by the menu; all original logo asset hashes match.

## Files and maintenance

`src/app/professional.css` contains the main website design system and responsive layouts. Components remain grouped by home, menu and shared layout. `SiteMotion.tsx` owns section entrance behaviour. `VisitStatus.tsx` owns the Nairobi opening-status display. `MenuBrowser.tsx` owns client menu discovery and saved-dish state.

The previous frontend source was preserved as text backups in `site-before-20261028` under this chat's visualization output directory. Run `npm run dev -- --port 3001` for local development and `npm run build` to regenerate `out/` for the existing static host. Do not run the initial loyalty migration again against the installed Supabase schema.
