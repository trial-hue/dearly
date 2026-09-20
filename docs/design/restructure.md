# Storefront restructure

A presentation-layer rebuild of the Dearly pilot. The domain, database, services, AI gateway,
adapters and API contracts are untouched; every existing feature keeps working and moves to a
home that reads like a modern consumer card retailer.

## Three layouts

| Layout              | Who                   | Shape                                                                                                                                                                                                                                                                                                                     |
| ------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Storefront       | Customers             | Promo strip, top header (logo, search, Reminders, Account, Basket), category row with mega-menus, footer with the airmail stripe on its top edge, bottom tab bar under 768px. A "Demo" menu in the footer links to B and C and holds Reset demo, the theme switch and the AI status. Nothing else on A reveals the pilot. |
| B. Business console | "Dearly for Business" | Its own header, calmer and denser.                                                                                                                                                                                                                                                                                        |
| C. HQ               | Internal              | "Dearly HQ": dashboard style, tables and charts, never linked from A or B except the Demo menu.                                                                                                                                                                                                                           |

## Route map

| Route                | Layout           | Replaces                     | Content                                                                                                                                   |
| -------------------- | ---------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                  | A                | new                          | Home: promo strip, hero, "Ready for you" carousel, occasion tiles, carousels, reassurance, footer                                         |
| `/cards`             | A                | new                          | All cards with filter chips, sort, 4/2 column grid                                                                                        |
| `/cards/[occasion]`  | A                | new                          | Occasion landing (birthday, anniversary, mothers-day, womens-day, eid, diwali, hanukkah, christmas, thank-you, leaving, work-anniversary) |
| `/card/[designId]`   | A                | new                          | Product page: gallery, size and finish tiles, delivery promise, Personalise                                                               |
| `/personalise/[key]` | A (editor shell) | `/today?edit=` and `/studio` | Five steps: Front, Inside message, Make it yours, Extras, Delivery; sticky total bar                                                      |
| `/reminders`         | A                | `/today` and `/people`       | Tabs: Ready for you, Coming up, People and dates                                                                                          |
| `/basket`            | A                | new                          | Line items over proposals, pay through the existing approve service                                                                       |
| `/orders`            | A                | `/orders`                    | One card per order with a horizontal stepper; demo controls in a drawer                                                                   |
| `/my-cards`          | A                | `/inventory`                 | Received and Sent grids (model name unchanged)                                                                                            |
| `/help`              | A                | `/help`                      | Chat with quick replies; floating help button on every A page                                                                             |
| `/account`           | A                | new                          | Account hub: orders, my cards, people and dates, help                                                                                     |
| `/r/[slug]`          | own              | `/r/[slug]`                  | Public recipient page, minimal                                                                                                            |
| `/business`          | B                | `/business`                  | Overview                                                                                                                                  |
| `/business/send`     | B                | `/business`                  | Staff list clean-up, options, schedule, batches                                                                                           |
| `/business/pricing`  | B                | `/business`                  | Calculator against Moonpig                                                                                                                |
| `/hq/operations`     | C                | `/operations`                | Thesis, counters, forecast, economics, scorecards, decisions                                                                              |
| `/hq/partners`       | C                | `/florists`                  | Florist order reader, referral ledger                                                                                                     |
| `/hq/kit`            | C                | new                          | Component demos                                                                                                                           |

Redirects (permanent): `/today` → `/reminders`, `/people` → `/reminders?tab=people`,
`/studio` → `/cards`, `/inventory` → `/my-cards`, `/florists` → `/hq/partners`,
`/operations` → `/hq/operations`.

## Where each feature lives

| Feature                                                                                  | Old           | New                                                                     |
| ---------------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------------------------- |
| AI proposals, approve, edit, skip, draft all                                             | Today         | `/reminders` tab Ready for you; also the Home carousel                  |
| Later list, paused people                                                                | Today         | `/reminders` tab Coming up                                              |
| People, import, pause, address, "what changed"                                           | People        | `/reminders` tab People and dates (dialogs)                             |
| Size, finish, message, fonts, gift, digital copy, delivery override, price, Moonpig line | editor drawer | `/card/[designId]` and `/personalise/[key]`                             |
| Photo check, handwriting, signature, drawing, AI front                                   | editor drawer | `/personalise/[key]` step Make it yours                                 |
| Drawing canvas, animations, narration, clip, preview as recipient, eCard only £0.79      | Studio        | `/personalise/[key]` steps Front (eCard toggle), Extras, Preview dialog |
| Orders lifecycle, run next step, simulate delay, recovery, QR                            | Orders        | `/orders`; demo controls in a drawer                                    |
| Inventory, download, 20-day warning                                                      | Inventory     | `/my-cards`                                                             |
| Recipient page                                                                           | `/r/[slug]`   | `/r/[slug]`                                                             |
| Help agent                                                                               | Help          | `/help` and the floating button                                         |
| Business sends, calculator, group card                                                   | Business      | `/business/send`, `/business/pricing`                                   |
| Florist referrals and ledger                                                             | Florists      | `/hq/partners`                                                          |
| Operations                                                                               | Operations    | `/hq/operations`                                                        |

## Data mapping without schema changes

- A catalogue design is stored on a proposal as `cardSpec.customFront = {kind: "svg", svg}`
  (the existing custom-front slot), generated from the design's scene with the recipient's first
  name. The legacy `design` field keeps one of its twelve values as the inside and download fallback.
  Every catalogue design serialises under the sanitiser's 20 KB limit (unit-tested).
- The basket is a per-browser list of proposal keys (localStorage); paying calls the existing
  approve action per key. See ADR 0004.
- The date a card is for can be chosen in the recipient dialog and moved on the Delivery step;
  this needed one additive service change and a `set_date` action. See ADR 0005.
- eCard-only sends with narration, clip, drawing or animation use the existing
  `POST /api/orders/ecard` contract; the source proposal is then skipped so it leaves
  "Ready for you". See ADR 0004.

## Component list

Header, PromoStrip, CategoryNav with MegaMenu, SearchField with suggestions, BottomTabBar, Footer,
Hero, OccasionTile, Carousel, ProductTile, FilterChips, SortSelect, Badge, PriceFrom, OptionTiles,
DeliveryPromise, GuaranteeBadge, StickyBuyBar, StepIndicator, EditorShell, ToolPanel, BottomSheet,
ReminderCard, PersonRow, EmptyState, OrderTimeline, RatingStars, ChatBubble, Toast, Dialog,
Skeleton, CardMock. Each has a demo on `/hq/kit`.

## Design tokens

Colour, type (Plus Jakarta Sans; Caveat only inside card previews), spacing, radius, shadow and
motion as specified in the brief, held as CSS variables in `src/app/globals.css` and mapped into
Tailwind through `@theme inline`. Light is the default and the one judged; dark derives from the
same roles.

## Screenshot checklist

Captured by `pnpm screenshots` (Playwright) at 390×844 and 1440×900 into `docs/design/screens/`, against a running `pnpm start:local`. All sixteen files are checked in; every check below was confirmed against them on 20 September 2026.

| Screen      | File                     | Check                                                                                                                                                                                          |
| ----------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Home        | home-{phone,desktop}.png | Promo strip, hero with one button, "Ready for you" carousel, 8 occasion tiles, carousels with See all, reassurance row, footer stripe; tab bar on phone                                        |
| Browse      | browse-*.png             | Result count, filter chips, sort, 2/4 columns, image-first tiles with only a badge and a price                                                                                                 |
| Product     | product-*.png            | Card at 420px+ desktop, thumbnails, size and finish tiles with prices, Signature preselected and "Most popular", delivery promise, one primary button, total with delivery, quiet Moonpig line |
| Personalise | personalise-*.png        | Full-screen shell, card centred, step indicator, side panel on desktop, bottom sheet on phone, sticky total bar                                                                                |
| Reminders   | reminders-*.png          | Three tabs, ReminderCards with three actions, no key-value tables, no internal chips                                                                                                           |
| Basket      | basket-*.png             | Line items with CardMock, delivery, extras, total, guarantee badge, pay                                                                                                                        |
| Orders      | orders-*.png             | CardMock per order, horizontal stepper, arrival promise, recovery panel, demo drawer collapsed                                                                                                 |
| Recipient   | recipient-*.png          | Envelope opens, large card, message, narration, rating, save                                                                                                                                   |

## Order of work

1. This document.
2. Test selectors moved to `data-testid` before layouts change.
3. Tokens and type.
4. Layouts A, B, C with redirects.
5. CardMock and the catalogue (48 or more designs).
6. Home, Browse, Product, Personalise, Reminders, Basket, Orders, My cards, Help, Recipient,
   Business, HQ, each its own commit.
7. Screenshots, dead code removal, docs and hand-off.

## Test selector contract (`data-testid`)

The end-to-end suite only uses these. New components keep them.

| Area        | Selectors                                                                                                                                                                                                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Global      | `toast`, `ai-status` and `demo-reset` (footer Demo menu), `basket-link`, `basket-count`, `header-search`                                                                                                                                                                                    |
| Reminders   | `ready-list`, `reminder-<personId>`, `reminder-approve`, `reminder-edit`, `reminder-skip`, `draft-all`, `people-list`, `person-<id>`, `import-open`, `import-text`, `import-example`, `import-preview`, `import-add-all`, `life-open`, `life-text`, `life-event-check`, `life-event-result` |
| Personalise | `editor`, `size-<size>`, `finish-<finish>`, `mode-<mode>`, `message-input`, `price-total`, `moonpig-compare`, `approve`, `add-to-basket`, `ecard-toggle`, `step-<n>`                                                                                                                        |
| Storefront  | `occasion-tile-<occasion>`, `product-tile-<designId>`, `product-personalise`, `recipient-dialog`, `recipient-select`, `recipient-continue`, `basket-item-<key>`, `basket-pay`                                                                                                               |
| Orders      | `orders-list`, `order-<id>`, `stage-current`, `run-next-step`, `delay`, `open-recipient`, `recovery`                                                                                                                                                                                        |
| Recipient   | `recipient-view`, `star-<n>`, `save-to-dearly`, `send-one-back`, `download-card`                                                                                                                                                                                                            |
| My cards    | `mycard-<id>`, `download-card`                                                                                                                                                                                                                                                              |
| Help        | `chat-input`, `chat-send`, `chat-log`                                                                                                                                                                                                                                                       |
| Business    | `staff-text`, `clean-rules`, `clean-ai`, `staff-rows`, `option-posted`, `option-officeDrop`, `batch-pricing`, `schedule-all`, `batches`                                                                                                                                                     |
| HQ          | `printer-<id>`, `printer-score`, `counters`, `decisions`, `ops-batch`, `read-order`, `florist-reading`, `claim-referral`                                                                                                                                                                    |
