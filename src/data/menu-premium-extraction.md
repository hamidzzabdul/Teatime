# TeaTime Premium menu extraction

This is a reference dataset extracted from the Qatar PDF, not confirmation that every dish is available in Nairobi. This dataset now powers the website menu. Confirm Nairobi availability with the restaurant.

## JSON shape

`categories` contains category IDs, display names and source PDF pages. `items` is a flat list whose `category` field joins to a category ID. Every item contains a stable `id`, `name`, `description`, `image: null`, and one-based `sourcePage`. Optional `sourceName` retains original item spellings where a name was corrected; optional `sizes` retains explicitly printed serving sizes. Prices and currency fields are omitted entirely.

## Add photographs later

Put the photo in `public/images/menu/`, then replace that item's `image: null` with its URL, for example `/images/menu/tuna-melt.webp`. The website reads this JSON directly and displays photos when image paths are supplied. Items without images use compact text cards. Prices are not displayed.

## Extraction review

Read all 48 pages and visually reviewed menu pages 4-45. The PDF text layer includes off-page content and misses the visible fries items on page 7; the extraction was reconciled with the rendered pages. Pages 1-3 and 46-48 contain branding/business text; pages 23, 30 and 42 are category photography rather than extra dishes.

The salad category was renamed from the misleading source heading `Vegan Salad` to `Salads` because many dishes contain meat or dairy. No allergen, halal or dietary claims were inferred. Descriptions missing from the PDF remain blank. Unusual ingredient/brand wording is retained for owner review. Standard mojito base options appear beside the category as 7UP and Energy drink; their applicability should be confirmed before enabling ordering. Sahlab has two source amounts but no explicit size labels, so no sizes were inferred.

## Before using this as the Nairobi menu

Confirm dish availability and category names with the owner, review uncertain spellings and ingredient descriptions, supply real photographs, and add the finalized Nairobi amounts separately if needed.
