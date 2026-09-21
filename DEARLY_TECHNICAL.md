# Dearly: technical reference

This document describes the Dearly application as it exists in this repository: every screen, rule, service, route, AI job and safeguard, in plain terms. It replaces the build plans that preceded the code. Where a number appears, it is the number the code uses; every price and cost lives in one file, `src/domain/constants.ts`, and `docs/pricing.md` is generated from it.

Companion documents: `DEARLY_BUSINESS.md` (the business model), `docs/architecture.md` (layer diagram), `docs/pricing.md` (generated price book), `docs/conformance/` (proof that the app matches the model), `docs/runbook.md` (operating it), `docs/adr/` (decisions).

---

## 1. What the application is

Dearly is a greeting-card service that remembers the people in a customer's life, drafts a card for each occasion ahead of time, prices it, and sends it so that it arrives on the day. The customer's work is one tap. The pilot is a complete web application: a storefront, a personalisation editor, an order pipeline with a delivery guarantee, a public page for each recipient, a business channel, a florist referral channel, and an operations console that shows the company's own economics live.

Real parts: the database, the AI calls (when a key is configured), media uploads, QR codes and the recipient pages, prices and unit economics. Simulated parts, each behind an adapter interface and labelled "simulated" in the operations console: payments, printing, postage and carrier tracking, HR-system sync, florist systems, email and SMS. There is no production login; a signed cookie selects the seeded demo account.

## 2. Stack and layout

| Concern         | Choice                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Next.js 16 (App Router), React 19, TypeScript in strict mode                                                               |
| Styling         | CSS variables for every design token, Tailwind 4 utilities mapped to them; light and dark themes                           |
| Database        | PostgreSQL through Prisma 6; an embedded PostgreSQL starts automatically for local work (`DATABASE_URL=embedded`)          |
| AI              | A server-side gateway with a provider interface: Claude through the official Anthropic SDK, a mock provider, and fallbacks |
| Background work | A `Job` table; `pnpm worker` polls it, and "Run the next step" on Orders runs due jobs too                                 |
| Storage         | A storage adapter; local disk is implemented, the S3 driver is a stub                                                      |
| Tests           | Vitest (domain, gateway, services), Playwright (journeys and UI claims), axe for accessibility                             |
| Delivery        | Multi-stage Dockerfile, `docker-compose.yml` (postgres, app, worker), GitHub Actions                                       |

```
src/
  domain/      pure TypeScript, no I/O: constants, pricing, delivery, calendar, proposals, recovery,
               routing, forecast, economics, business, florist, importPeople, lifeEvent, agentRules,
               sanitiseSvg, zod schemas. Fully unit-tested.
  catalogue/   49 card designs as shape lists, one renderer (CardMock) for screen and SVG export.
  server/      db, auth, clock, rateLimit, logger; services (the only Prisma callers); adapters
               (simulators); ai (gateway, providers, one file per job); jobs (worker); seed; render.
  app/         Next.js routes in four groups: (store), (editor), (business), (hq), plus /api and /r.
  components/  UI by area: store, editor, reminders, orders, basket, recipient, business, operations, hq.
  lib/         client helpers: fetch wrapper, formatting, serialisation, basket store, pricing lookups.
prisma/        schema, migrations, seed entry point.
e2e/           Playwright journeys and claim specs.  scripts/  local database runner, docs generators.
```

The rule that keeps this tidy: `src/domain` imports nothing from the server or the app; services are the only code that touches the database; route handlers validate input with zod, call one service, and return JSON or a problem document; server components read services directly and pass serialised views to client components, which mutate through the API and refresh.

## 3. Running it

```
cp .env.example .env
pnpm install
pnpm dev            # embedded Postgres, migrate, seed, dev server on :3000
```

With no `ANTHROPIC_API_KEY` every AI feature runs on built-in rules and the HQ header reads "Built-in rules". With a key plus `AI_MODEL_QUICK` and `AI_MODEL_DEFAULT`, the same jobs call Claude. `AI_PROVIDER=mock` gives canned but valid answers for tests. `DEARLY_FAKE_TODAY=YYYY-MM-DD` pins the server's clock for demos.

Other commands: `pnpm check` (lint, format, typecheck, unit tests), `pnpm test:service`, `pnpm build && pnpm test:e2e`, `pnpm test:e2e:noai`, `pnpm test:conformance` (all of them), `pnpm docs:pricing` (regenerate the price book), `pnpm db:reset` (back to the seed), `docker compose up --build`.

## 4. The seeded world

The seed creates one customer, Alex, with eight people and their occasions, dated relative to the day the seed runs:

| Person         | Relationship | Occasion      | Days away            | Why it is there                                        |
| -------------- | ------------ | ------------- | -------------------- | ------------------------------------------------------ |
| Margaret Ellis | mother       | 60th birthday | 19                   | A milestone: Large, Luxe, flowers proposed             |
| Dan Okafor     | friend       | birthday (34) | 9                    | The standard advance-post order                        |
| Priya and Tom  | friends      | anniversary   | 24                   | Address last confirmed 14 months ago: approval blocked |
| Bill Ellis     | grandfather  | 88th birthday | 3                    | Urgent: tracked post                                   |
| Sam Whitlock   | colleague    | leaving       | 1                    | Same-day pick-up, or a Giant group card                |
| Noor Rahman    | aunt         | Eid           | from the feast table | Community range, "subject to moon sighting"            |
| Asha Patel     | friend       | Diwali        | from the feast table | Community range                                        |
| Peter Ellis    | uncle        | birthday      | 12                   | Paused after a bereavement: no proposal, ever          |

Also seeded: two past orders (Dan's last birthday, delivered and rated five stars; a thank-you card to Priya and Tom that is in the post), three received cards in the Inventory (one about to expire), a business organisation with a deliberately messy ten-row staff list, one florist partner, and six simulated printers covering Great Britain by postcode area. "Reset demo" (footer menu, or `POST /api/demo/reset`) rebuilds all of it.

## 5. Screens

### 5.1 Storefront (layout A)

The customer-facing site. Header with search, Reminders, Account and Basket; a category row with mega-menus (a scrolling pill row on phones); a promo strip; footer with the guarantee line and a collapsed "Demo" menu; a bottom tab bar under 768px; a floating help button. Nothing on these screens names the pilot, the AI provider, or a simulator.

| Route                         | What it does                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                           | Home: hero, the "Ready for you" carousel of proposal cards (each approvable in one tap with its full price on it), shop-by-occasion tiles, featured designs, eCards entry, reassurance row.                                                                                                                                                                                              |
| `/cards`, `/cards/[occasion]` | Browse: filter chips, sort, result count, product tiles (image first, a badge, a "from" price that comes from the quote function).                                                                                                                                                                                                                                                       |
| `/ecards`                     | The same catalogue filtered to send-as-eCard.                                                                                                                                                                                                                                                                                                                                            |
| `/card/[designId]`            | Product page: the card mock, size chosen before finish (Regular and Signature preselected), all three finishes shown with prices, the delivery promise, the total including delivery, the Moonpig comparison when it favours Dearly, an "Send as an eCard instead" toggle, and "Personalise", which asks who the card is for and creates or opens the proposal.                          |
| `/reminders`                  | Three tabs. **Ready for you**: proposals inside 35 days as envelope cards, each with the drafted line, the price, Approve and pay, Edit, Skip this year; "Draft all with AI"; "New card". **Coming up**: later occasions with the date they will be ready. **People and dates**: every person, their address status, pause and resume, the paste-to-import dialog and "What's changed?". |
| `/basket`                     | Proposals the customer set aside (a per-browser list of proposal keys), each with its summary, arrival or pick-up promise and price; one "Pay" for the lot.                                                                                                                                                                                                                              |
| `/orders`                     | Every order with its stage tracker, mode, promised date, price, printer, the QR code and link to the recipient page, recovery details when a delay happened, and the demo levers ("Run the next step", "Simulate a postal delay").                                                                                                                                                       |
| `/my-cards`                   | The Inventory: received and sent cards, kept for three years, a warning 20 days before expiry, a download of the card as SVG.                                                                                                                                                                                                                                                            |
| `/help`                       | Chat with the support agent; the action it took is shown in the reply.                                                                                                                                                                                                                                                                                                                   |
| `/account`                    | Name, saved signature, the guarantee, the reset link.                                                                                                                                                                                                                                                                                                                                    |
| `/r/[slug]`                   | The public recipient page (no login): the card, the message, narration and animation when a digital card exists, a five-star rating, "Save to my Dearly", "Send one back", and a download.                                                                                                                                                                                               |

Old routes redirect: `/today` and `/people` → `/reminders`, `/studio` → `/cards`, `/inventory` → `/my-cards`, `/florists` → `/hq/partners`, `/operations` → `/hq/operations`.

### 5.2 Personalise (the editor)

`/personalise/[key]` opens one proposal full screen: the card in the centre, tools in a side panel (a bottom sheet on phones), and a sticky bar with the running total, the Moonpig line, and the primary button (Approve and pay, Add to basket, or Send eCard). Five steps:

1. **Front**: design picker (49 designs, filterable by occasion), size then finish with live prices, the "Send as an eCard" toggle.
2. **Inside message**: the drafted message, "Rewrite" (AI or the next template), four fonts.
3. **Make it yours**: photo check (reads the pixel size and says whether it prints sharply at the chosen size, or which size it suits), handwriting by photo (the paper is removed, the ink kept, optionally as a signature only), a child's drawing as the front, "Draw a front with AI".
4. **Extras**: for a printed card, the 0.29 digital copy toggle and the gift picker; for an eCard or a card with the digital copy, the opening animation (envelope, flip, confetti), narration (microphone, upload, or the device's built-in voice), a short clip, a drawing canvas.
5. **Delivery**: the date the card is for (moving it re-applies the delivery rule and reprices), the delivery modes with prices and promises, address confirmation when it is stale, the guarantee badge or the pick-up note, and a field for a guarantee code.

Every change is saved to the proposal through the API and repriced at once. "Preview as recipient" shows the card the way the recipient page will.

### 5.3 Dearly for Business (layout B)

| Route               | What it does                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/business`         | The offer for teams.                                                                                                                                                                                                                                                                                                                                                                             |
| `/business/pricing` | The three prices (posted, office drop, Automate), stated ex VAT, and a calculator: cards a year and the posted share give Dearly's annual price against Moonpig at 3.60 a card, with the saving.                                                                                                                                                                                                 |
| `/business/send`    | The workbench: paste a staff list (name, date, occasion, postcode); "Clean and schedule" (strict parser) or "Check it for me" (AI); the cleaned table with flagged rows and reasons; posted or office drop; Classic or Signature; the message template; Giant group cards for leavers; the batch price and contribution; "Schedule all". Scheduled batches are listed, and appear on Operations. |

### 5.4 Dearly HQ (layout C)

Reached from the footer's Demo menu only. Internal labels are allowed here.

| Route            | What it does                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/hq/operations` | The thesis table (what Moonpig runs against what Dearly runs, with sources), the three roles and what the AI does for each, session counters (reminders, proposals, approval rate, advance-post share, postage saved, average contribution, decisions by actor, recipients joined, batches, referrals, open jobs), the 13-week forecast with a customers slider, the unit-economics editor (every cost editable; nine contribution rows; blended contribution; break-even; team cost per order), printer scorecards, business batches, referrals, and the latest 30 decisions. |
| `/hq/partners`   | The florist channel: the sample order, "Read this order", the reading, "Add reminder and claim the first-card offer", and the ledger of fees owed and commission expected.                                                                                                                                                                                                                                                                                                                                                                                                     |
| `/hq/kit`        | The component kit: every UI primitive rendered once, for design review.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

## 6. The rules (domain layer)

### 6.1 Money and prices

Money is integer pence inside the domain. Arithmetic runs exact and each reported figure is rounded half up once at the end. Consumer prices include VAT at 20% (ex VAT = total ÷ 1.2); business prices exclude VAT. The full price book, generated from the constants, is `docs/pricing.md`; the headline tables:

Card prices, including VAT:

| Size    | Classic | Signature | Luxe  |
| ------- | ------- | --------- | ----- |
| Regular | 2.99    | 3.99      | 6.49  |
| Large   | 4.99    | 6.49      | 8.99  |
| Giant   | 9.99    | 11.99     | 14.99 |

Delivery, per card: advance post 0.95 (Regular) / 1.95 (Large), tracked 2.75 / 3.75 / 3.99 (Giant), pick-up 1.95 (Regular Classic or Signature only). Digital copy with a printed card 0.29; standalone eCard 0.79; the recipient page is free. Gifts: flowers 24.00, chocolates 14.00, fizz 19.00, plant 22.00.

`quote()` turns a card (size, finish, mode, digital copy, gift, first-card-free flag, guarantee-code flag) into the customer's lines and total, the ex-VAT amount, every cost to Dearly (print, delivery, payment at 1.5% + 0.20, AI 0.05, service 0.08, guarantee reserve 0.10 on guaranteed modes, gift cost at 62% of the ex-VAT gift price), the contribution, and the Moonpig comparison. Pick-up replaces the print cost with the partner shop's payout (1.75) plus stock (0.25). Examples: Regular Signature by advance post is 4.94 with a contribution of 1.93; by pick-up 5.94 with 2.53; a standalone eCard 0.79 with 0.32.

The Moonpig comparison appears only for printed Regular cards: 5.89 against advance post, 6.78 against tracked, and it is hidden when Dearly would cost more (Luxe). For pick-up the line reads "Moonpig has no same-day physical card."

### 6.2 Delivery modes and the rule

`chooseMode(size, daysLeft, finish)`: Giant always travels tracked; seven or more days ahead, advance post (second class, sent early, promised two days before the occasion); two to six days, tracked (next day, promised the day before); under two days, pick-up from a partner shop ("Ready today, within 2 hours") when the card is Regular Classic or Signature, otherwise tracked with an on-the-day eCard offered alongside. The customer can override the mode; changing the size or finish re-applies the rule unless they did. `allowedModes(size, finish)` is what the editor shows.

Stages: printed cards go checked → routed → printed → inspected → posted → delivered (pick-up: → ready for pick-up → collected); eCards are delivered at once.

### 6.3 The guarantee and recovery

Advance and tracked carry the guarantee. When a posted order is delayed (`delayOrder`, triggered by the demo lever or, in production, by tracking), `planRecovery` produces: an on-the-day eCard (queued as a job for 8am on the occasion), a full refund of the order through the payments adapter, a single-use code for 50% off the card price of the next order (delivery excluded), and a tracked reprint when two or more days remain. Every action is stored on the order and written to the decision log. Pick-up and eCard orders carry no guarantee and are never refunded.

Guarantee codes are redeemed on the Delivery step: `applyGuaranteeCode` checks the code against the codes issued by recoveries on the account, refuses unknown or used codes with a plain message, and the price shows a "50% off the card price (guarantee code)" line. Approval re-checks the code and marks it used.

### 6.4 The proposal engine

`proposalsDue(people, existingKeys, today)` creates a proposal for every unpaused person and every occasion inside the 150-day window; those inside 35 days are "Ready for you", the rest "Coming up". The key is `person|occasion|year`, so skipping a proposal suppresses it for that year only, and the next year's key is new. `defaultProposal` fills everything in: the design for the occasion (the big-number design for milestone birthdays: 18, 21 and every multiple of 10), size and finish (a milestone for a mother, father, partner or grandparent gets Large, Luxe and flowers; a colleague gets Regular Classic; otherwise Regular Signature), the mode from the delivery rule, the message from templates, and flags (urgent, milestone, subject to moon sighting for Eid, community range, address needs confirming).

Approval is blocked while the address has not been confirmed for 365 days, except for eCards. A paused person gets no proposal; pausing withdraws open proposals; and an order already placed for a person who is then paused is held before it is printed or posted.

First card free: an account with no printed order yet and at least three reminder dates has its first Regular Classic or Signature card at a card price of 0; delivery, the digital copy and gifts are charged. The flag is decided by the service and is not a field the client can set.

### 6.5 Calendar

`nextDate` resolves an occasion to the next date on or after today: an ad hoc date as given; a moving feast from the table (Diwali, Hanukkah, Eid, Mother's Day, through 2029); a fixed date (Christmas, Valentine's, Women's Day); or a month-day rolled forward, with 29 February falling on the last day of February in other years. Days are counted in calendar days across daylight-saving changes.

### 6.6 Routing and printers

`route(postcode, size, finish, printers)` takes the leading letters of the postcode, finds the printers that cover that area and can produce the size and finish, and picks the highest scored; anything unusual goes to the specialist in Birmingham. Six simulated printers cover the country. A printer's score is its seed score blended with customer ratings (weight 20, so one five-star rating moves 4.70 to 4.71).

### 6.7 Forecast and economics

`forecast(customers, today)` gives 13 weeks at four orders per customer per year, split 72% advance, 20% tracked, 8% pick-up, with peaks: Christmas ordering (24 November to 14 December, ×2.6), Valentine week (×1.8), the week before Mother's Day (×2.4). `economics(costs)` gives the nine-row contribution table, the blended contribution (20% Classic, 60% Signature, 20% Luxe, Regular by advance post: 2.07), the break-even orders a year (team cost ÷ blended: 159,107, or 39,777 customers), and team cost per order at a given volume. Postage saved is estimated as advance orders × 0.89 (first-class 1.80 less second-class 0.91).

### 6.8 Business and florists

Business cards are Regular Classic or Signature, ex VAT: posted 3.30, 3.10 from 250 cards a year, 2.80 from 2,000; office drop 2.30 flat; the Automate plan 49.00 a month with the first 25 cards free. Cost per card: print, delivery (0.88 posted, 0.18 office drop), AI, service, the guarantee reserve, and 1% of the invoice for payment. Contributions per card: 1.36, 1.16, 0.86 and 1.07; 600 posted cards at the 250 tier invoice 1,860.00 and contribute 695.40. `cleanStaffList` reads "name, date, occasion, postcode" lines in any common date format, flags duplicates, impossible dates and missing or malformed postcodes, and computes send dates from the next occurrence minus the lead time.

A florist referral pays the florist 1.50 per new account and earns Dearly 7% of the next flower basket (2.45 on 35.00). `parseFloristOrder` reads the recipient, relationship, occasion, date and age from an order note; `createReferral` makes the customer's account, the person, the occasion and the ledger entry only when the florist confirms.

### 6.9 Reading text: import, life events, support

`parseImportLine` reads "Jo Ellis, sister, birthday, 14 March 1990" in any order. `detectLifeEvent` matches a person by first name or relationship and proposes a pause for a bereavement, separation or estrangement. `agentFallback` answers support messages with keyword rules and one of six actions only: refund (only a late or damaged order), reprint, upgrade to tracked, send an eCard, escalate (any mention of death or distress), or none.

### 6.10 SVG safety

`sanitiseSvg` accepts only an `<svg>` document under 20 KB and strips script, foreignObject, iframe, object, embed, style, links, images, `use`, animation elements, every event attribute, every `href`, external `url()` references and protocol handlers. It runs on every AI-drawn front before storage and on every download.

## 7. Data model

Prisma models: `Account` (customer; consents as JSON, no marketing consent unless given), `Person` (relationship, address, postcode, when the address was last confirmed, pause reason), `Occasion` (type, month-day, start year, or an ad hoc date), `Proposal` (key, status, the card specification as JSON, who made it, flags, due date), `Order` (the card, the quote, total, mode, promised date, guarantee, stage and history, printer, an unguessable 22-character recipient slug, delayed flag), `Shipment` (first or reprint, carrier, tracking events, inspection score), `Recovery` (actions and cost), `DigitalCard` (animation, narration, clip, drawing, word timings; for eCards and paid digital copies), `Media` (uploads with type, size and pixel dimensions), `InventoryItem` (sent or received, kept until), `Rating`, `Printer`, `Organisation`, `StaffRow`, `Batch`, `Partner`, `Referral` (with its ledger), `Decision` (actor ai, rule or person; job; summary; estimated cost), `Job` (queued work), `Setting` (editable costs, forecast customers).

## 8. Services

`proposals` (ensure, list, get, update a card keeping only the fields sent, rewrite with rules, approve and pay, skip, create ad hoc, set the date, apply a guarantee code, open proposals for AI, apply an AI proposal, first-card-free eligibility); `orders` (list, get, get by slug, advance every open order one stage with the printer and carrier adapters and a hold for paused people, delay and recover, rate, save to the recipient's own account, send one back, printer scores, orders for the agent, apply an agent action); `ecards` (send a rich eCard: order, digital card, inventory copy); `people` (list, add, pause, resume, confirm address); `inventory`; `media` (type and size checks, pixel size from PNG and JPEG headers, storage); `business` (clean with rules, schedule a batch and its jobs); `partners` (referrals and the ledger); `operations` (counters, the whole operations screen); `settings`; `decisionLog`.

## 9. API

All inputs are parsed with zod; failures return a problem document `{type, title, status, detail}`.

| Route                                                                               | Methods                                                                                                                                                                  |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/api/proposals`                                                                    | GET the screen; POST an ad hoc card                                                                                                                                      |
| `/api/proposals/[key]`                                                              | GET; PATCH with `action`: `edit` (a partial card), `approve` (optionally with digital-copy extras), `skip`, `confirm_address`, `rewrite_rules`, `set_date`, `apply_code` |
| `/api/orders`, `/api/orders/advance`, `/api/orders/[id]/delay`, `/api/orders/ecard` | List; run the next step and due jobs; simulate a delay; send an eCard                                                                                                    |
| `/api/r/[slug]/rate`, `/save`, `/send-back`                                         | The recipient loop                                                                                                                                                       |
| `/api/people`                                                                       | GET; POST add people; PATCH pause, resume, confirm address                                                                                                               |
| `/api/ai/[job]`                                                                     | One AI job through the gateway (proposals, rewrite, import, life event, clean staff list, read florist order, card front); rate limited                                  |
| `/api/agent`                                                                        | One support turn; the chosen action is executed within the allowed list; rate limited                                                                                    |
| `/api/uploads`, `/api/uploads/[...key]`                                             | Upload media (type and size checked, rate limited); serve it with `nosniff`                                                                                              |
| `/api/business/clean`, `/api/business/schedule`                                     | The business workbench                                                                                                                                                   |
| `/api/partners/referral`                                                            | Confirm a florist referral                                                                                                                                               |
| `/api/inventory/[id]/card.svg`                                                      | Download a card                                                                                                                                                          |
| `/api/operations`                                                                   | GET the operations screen; PATCH costs and forecast customers                                                                                                            |
| `/api/demo/reset`, `/api/health`                                                    | Reseed (also clears rate limits); liveness with a database check                                                                                                         |

## 10. The AI gateway

`runJob(job, input)` builds the prompt, asks the provider, parses the reply with the job's zod schema, runs the job's validator (allowed values, sentence counts, refunds only on late orders, SVG sanitising), and on any failure returns the job's rules-based fallback. Every run writes a decision with actor `ai` or `rule`, the job, a summary and an estimated cost. Prompts follow one pattern: a role sentence, rules (British English, no emojis, the job's rules), allowed values, data as JSON, and "Reply with only JSON in this shape" with an example.

| Job                  | Tier    | Input the model sees                                                               | Fallback                           |
| -------------------- | ------- | ---------------------------------------------------------------------------------- | ---------------------------------- |
| `proposals`          | default | first names, relationships, occasions, dates, ages, current options, past messages | rules-based defaults and templates |
| `rewrite_message`    | default | first name, relationship, occasion, age, current message                           | next template                      |
| `import_people`      | quick   | the pasted text                                                                    | line parser                        |
| `life_event`         | quick   | the sentence and the people (ids, first names, relationships)                      | keywords plus a name match         |
| `clean_staff_list`   | quick   | the pasted list with every postcode replaced by a token (restored afterwards)      | strict parser                      |
| `read_florist_order` | quick   | the order note                                                                     | pattern reader                     |
| `agent_turn`         | quick   | the message, recent turns, orders by first name, stage, promise, late flag         | keyword rules                      |
| `card_front`         | default | occasion, age, design hint                                                         | the stock design                   |

Privacy: no prompt carries an address, postcode, email, phone number or surname; a unit test builds every job's prompt and asserts it. The Claude provider reads the key and the two model ids from the environment and nothing is hard-coded.

## 11. Adapters and what is simulated

`payments` (authorise, capture, refund, with ids), `printers` (submit a job, an inspection photo with a score), `carriers` (labels and tracking events), `messaging` (email and SMS), `storage` (local disk implemented; S3 a stub). Each simulator writes what it "did" into the decision log, and the operations console labels every simulated thing.

## 12. Rich media

Uploads accept JPEG, PNG and WebP images (8 to 10 MB), common audio types (10 MB) and WebM, MP4 and QuickTime video (25 MB); anything else is refused with 415 or 413. The photo check compares the long edge with 1,200, 1,800 and 2,600 pixels for Regular, Large and Giant. Handwriting is thresholded on the device: light paper becomes transparent, dark ink stays. Narration is recorded with the browser's recorder (a fake device in tests), uploaded, or read by the device's built-in voice; on the recipient page the message lights up word by word across the audio. Word timings are spaced evenly across the recording. Three opening animations. QR codes are rendered as SVG for each printed order and open the recipient page.

## 13. Security and privacy

Security headers including a content-security policy; a signed session cookie; recipient slugs from 16 random bytes; AI, agent and upload routes rate limited per session with a friendly "Try again in N seconds"; every API input and every AI output validated; SVG sanitised; logs redact addresses, postcodes and emails; the recipient page exposes no sender address, email or other recipients; no marketing consent is recorded unless a person opts in.

## 14. Testing and proof

- **Unit** (`pnpm test`, 348 tests): every domain rule, the price book against the canonical values, a full 3×3×modes snapshot, a property test over every size, finish, mode and gift, the calendar and proposal rules under five injected clocks (a weekday, 31 December, 29 February 2028, the day before Mother's Day, the day after Diwali), the gateway with the mock and with no provider, the prompt privacy scan, a scan that fails when a price literal appears outside the constants, and a scan for committed secrets.
- **Service** (`pnpm test:service`, 24 tests): the real services against the embedded PostgreSQL: proposals, approval, holds, address rules, first card free, recovery, guarantee codes, the recipient loop, inventory, referrals, batches, uploads and the decision log.
- **End to end** (`pnpm test:e2e`, 36 specs at phone and desktop sizes): nine journeys and the UI claims, with axe on the main screens and a 360px overflow check; `pnpm test:e2e:noai` repeats the key journeys with no provider.
- **Docs**: `docs/pricing.md` is generated and CI fails if it drifts. `docs/conformance/matrix.md` maps every business claim to its test; `drift.md` lists what failed and how it was fixed; `report.md` records the results.

CI (`.github/workflows/ci.yml`): a `check` job (lint, format, typecheck, unit tests with coverage, docs drift, build), a `conformance` job (service, e2e, no-provider), and a Docker image build.

## 15. Deployment

The Dockerfile builds a standalone Next.js server that runs migrations on start, answers `/api/health`, and runs as a non-root user; `docker-compose.yml` adds PostgreSQL and the worker. Any container host with a managed PostgreSQL works as is. A serverless host such as Vercel needs three things the pilot leaves open: a hosted PostgreSQL, a storage driver for uploads (Vercel Blob or S3, replacing the stub), and a scheduled function calling the due-jobs endpoint instead of the worker.

## 16. Known gaps

Recorded in `docs/backlog.md`: the S3 driver; the recipient's own session after saving a card (the account is created, the browser stays signed in as the demo customer); per-word timings from speech alignment; business message templates stored per row; a basket table and an eCard-fulfilled proposal status; real partner adapters behind feature flags (Stripe, a print API, Royal Mail); Prisma 7.
