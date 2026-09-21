# Dearly: the business

_A greeting-card company run by three people and an AI. This document is the business model as the pilot implements it: the product, the economics, the growth loops and the operating model. Every Dearly figure below is the one the application runs on, and every one is a pilot assumption until a supplier quote or a live customer replaces it. The technical detail is in `DEARLY_TECHNICAL.md`. Market size, competition, funding, milestones and legal points are in the commercial business plan._

---

## 1. The idea in one paragraph

People forget cards, or remember too late, or buy one and never post it. Moonpig's answer was to sell the card online and send a reminder that sends the customer off to choose one. Dearly reminds its customers too, by email, push and text; the difference is what the reminder contains. Dearly's answer is to do the whole job: remember the person, draft the card, choose the size, finish and delivery, price it, and put it in front of the customer about three weeks ahead so that the only thing left to do is tap "Approve and pay". The card is sent early so that it arrives before the day, backed by a refund guarantee, and the recipient gets a page of their own that can turn them into the next customer. Because an AI does the drafting, choosing, reading and support work, the company that runs this is designed to need three people.

## 2. The thesis, against the incumbent

Moonpig is the benchmark: a listed UK card business with published figures.

| Area                 | What Moonpig runs                                                                                | What Dearly runs                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Customers and orders | 12.3m customers, 36.0m orders (FY26)                                                             | A pilot account today; the same flows at any size                                                                      |
| Reminders            | Reminder emails and app notifications that send the customer off to choose a card                | Reminders by email, push and text that arrive as a finished card proposal, approved with one tap                       |
| Marketing            | £38.7m a year (FY26)                                                                             | Unpaid channels first: the card's own QR page, florist referrals, business accounts. Target under £5 a new customer    |
| Data and engineering | 242 data scientists, analysts and engineers (FY24)                                               | One product and AI engineer; the AI drafts, chooses, cleans, reads and answers                                         |
| Production           | Own factories                                                                                    | Partner printers routed by postcode, with a specialist for Luxe and Giant. Six simulated printers in the pilot         |
| Customer care        | An AI assistant around the clock; human agents 9am to 5:30pm; no phone line listed               | An AI agent around the clock that can act (refund, reprint, upgrade, eCard), escalating to one person; voice to follow |
| Card stock           | 250 to 300gsm                                                                                    | Three finishes from 300gsm to 400gsm, three sizes up to A3                                                             |
| Team                 | Several hundred people (third-party estimates of about 600 to 670; confirm in the annual report) | Three: product and AI; operations and partners; growth and care                                                        |

Both companies remind their customers. Dearly's reminder is the finished card.

Sources: Moonpig Group plc annual reports (FY26 for customers, orders and marketing; FY24 for data and technology staff) and Moonpig help pages. Headcount is a third-party estimate and must be replaced with the figure in the staff note of Moonpig's annual report. Dearly figures are pilot assumptions.

## 3. What the customer experiences

**Set up once.** Add the people who matter, with their occasions and addresses. Paste a list, type a line, or arrive from a florist's order confirmation (section 6). An address is checked once a year; a card is never sent to a stale one.

**Then, every occasion:**

1. **About three weeks ahead a card is ready.** Proposals are created 21 days before the occasion, and the Reminders screen looks 35 days ahead. Dearly has chosen the design, written the message in the customer's voice, picked the size and finish that fit the relationship and the moment (a mother's 60th gets Large, Luxe and flowers; a colleague's leaving card is Regular Classic), chosen how it travels, and priced it, delivery included.
2. **One tap approves and pays.** Or the customer edits anything: the front (49 designs, their own photo, a child's drawing, an AI-drawn front), the words, handwriting from a photo, a gift, a digital copy with their voice reading the message, or the date.
3. **It arrives before the day.** Cards seven or more days out go by advance post, sent early and promised two days before the occasion. Two to six days out: tracked, next day, promised the day before. Under two days: printed at a partner shop near the sender, who collects it within two hours and hands it over in person (Regular Classic or Signature only). Giant cards always travel tracked.
4. **If the post lets them down, Dearly acts before they have to ask.** On advance and tracked orders, a card that will miss its promised date triggers an eCard on the morning of the day, a full refund, a single-use code for half off the next card, and a tracked reprint when there is still time. Pick-up orders and eCards are not covered by the guarantee.
5. **The recipient gets a page of their own.** The card carries a QR code. The page shows the card and the message, plays the narration if one was bought, and offers three things: rate it, save it to their own Dearly, and send one back. Saving creates their account, with no media spend behind it.
6. **Life happens, cards stop.** One sentence, "Uncle Peter passed away in June", proposes pausing every card for that person; the customer confirms, and nothing goes out, not even a card already in the pipeline.

## 4. Every edge over Moonpig

1. **Reminders that arrive as the finished card**: both companies remind; Moonpig's reminder sends the customer off to choose a card, Dearly's is the drafted, chosen and priced proposal, approved with one tap.
2. **The life-event guard**: a paused person never gets a card, at proposal time or at print time.
3. **Advance post**: £4.94 for a Regular Signature card delivered against Moonpig's £5.89, shown side by side, and cheaper postage for Dearly.
4. **A delivery guarantee with automatic recovery** on advance and tracked orders: refund, eCard, reprint and a next-card code without a support ticket.
5. **Same-day pick-up** from a partner shop, which Moonpig does not offer today.
6. **An AI help agent that acts** (refund, reprint, upgrade, eCard, escalate) within strict rules, around the clock. Moonpig's assistant answers questions; its human agents work office hours.
7. **Three finishes in three sizes**, Classic to Luxe, Regular to A3, with every design in every size.
8. **The QR recipient loop**: every printed card invites its recipient to join.
9. **The Inventory**: sent and received cards kept for three years, downloadable, with a warning before they expire.
10. **Business sends**: a staff list pasted in any state becomes a year of birthday, work-anniversary and leaving cards.
11. **Florist referrals**: a customer's flower order becomes next year's reminder.
    Moonpig can copy several of these. The ones that are hardest to copy are the proposal engine with the life-event guard, the automatic recovery, the recipient Inventory and the business integrations.

## 5. Pricing and unit economics

### 5.1 Prices (including VAT)

| Size    | Classic | Signature | Luxe   |
| ------- | ------- | --------- | ------ |
| Regular | £2.99   | £3.99     | £6.49  |
| Large   | £4.99   | £6.49     | £8.99  |
| Giant   | £9.99   | £11.99    | £14.99 |

Delivery: advance post £0.95 (Regular) or £1.95 (Large); tracked £2.75, £3.75 or £3.99 (Giant); pick-up £1.95 (Regular Classic or Signature only). A digital copy of a printed card £0.29; a standalone eCard £0.79. Gifts: flowers £24.00, chocolates £14.00, fizz £19.00, a plant £22.00.

### 5.2 What each card contributes

Every order pays its print cost, delivery cost, payment fee (1.5% plus £0.20), AI (£0.05), service (£0.08) and, on guaranteed modes, a £0.10 reserve for recovery. What is left after VAT is the contribution towards the team.

| Card, mode                                | Price                    | Contribution          |
| ----------------------------------------- | ------------------------ | --------------------- |
| Regular Classic, advance post             | £3.94                    | £1.24                 |
| Regular Signature, advance post           | £4.94                    | £1.93                 |
| Regular Luxe, advance post                | £7.44                    | £3.33                 |
| Regular Signature, tracked                | £6.74                    | £1.99                 |
| Regular Signature, pick-up                | £5.94                    | £2.53                 |
| Regular Classic, pick-up                  | £4.94                    | £1.71                 |
| Regular Signature, advance + digital copy | £5.23                    | £2.17                 |
| Regular Signature, advance + flowers      | £28.94                   | £9.17                 |
| Large Classic / Signature / Luxe, advance | £6.94 / £8.44 / £10.94   | £2.48 / £3.48 / £4.67 |
| Giant Classic / Signature / Luxe, tracked | £13.98 / £15.98 / £18.98 | £4.16 / £5.50 / £7.15 |
| Standalone eCard                          | £0.79                    | £0.32                 |

Pick-up contributes more than the same Classic or Signature card sent by post (£2.53 against £1.93 for Signature), because the partner shop is paid £1.75 plus £0.25 of stock and there is no postage and no guarantee reserve. Regular Luxe by advance post still contributes more, at £3.33.

Three cautions on this table. Print costs, the shop payout and postage costs are estimates, not supplier quotes. Creator royalties are not yet in the cost stack, and a per-card royalty will reduce every figure by that amount. The standalone eCard keeps only £0.32 because the fixed payment fee falls on a £0.79 sale; selling eCards in packs would raise that.

### 5.3 The company's break-even

With an assumed mix of 20% Classic, 60% Signature and 20% Luxe on Regular advance post, the blended contribution is **£2.07** a card. A team of three with its tools costs **£330,000** a year. The company breaks even at **about 159,000 orders a year**. At an assumed four cards per customer that is about 40,000 customers; at Moonpig's observed rate of about 2.9 orders per customer (36.0m orders across 12.3m customers) it is about 55,000. At 210,000 orders a year the team costs £1.57 per order. Every one of these inputs is editable on the Operations screen and recomputes the whole table.

This break-even covers the team only. It excludes customer acquisition spend, the cost of free first cards, florist referral fees, hosting and infrastructure, creator royalties, and recovery costs above the reserve. The commercial business plan carries those in its scenarios.

Postage is the other lever: each advance-post card saves about £0.89 against first class at public stamp prices (£1.80 against £0.91), because the card is sent early on purpose. The model depends on most customers approving early; if they still order at the last minute, the saving disappears.

### 5.4 The guarantee, costed

A full recovery on a £4.94 card costs roughly £10: the £4.94 refund, a tracked reprint at about £3.10 (print £0.80 plus tracked delivery £2.30), and about £2.00 if the half-price code is redeemed. The £0.10 reserve per guaranteed card therefore holds at a failure rate of about 1%. At 2% it would need to be about £0.20. The failure rate is unknown until cards are posted for real, and it is the number to watch. The code halves the card price only, once; delivery is charged.

### 5.5 First card free

An account that adds at least three dates gets its first Regular Classic or Signature card free; delivery, extras and gifts are paid. The customer's first experience is the whole loop at low cost, and three dates mean three more proposals are already on their way. Each free card costs Dearly about £1.33 for Signature or £1.20 for Classic by advance post. That is an acquisition cost and is budgeted as one.

## 6. Growth through unpaid channels first

None of these channels needs media spend, but none is free, and their conversion rates are unproven. The planning target is under £5 to acquire a customer, against an estimated £6 to £23 for a first order won through Google.

**The recipient loop.** Every printed card carries a QR code to a page made for the recipient. Rate it (which tunes the printer network), save it (which creates their account, with no marketing consent unless they give it), send one back (which creates a thank-you reminder a week out). No media spend is involved. The share of recipients who save a card is an assumption (10% in the plan) until a live pilot measures it. The pilot counts recipients joined on the Operations screen.

**Florists.** After a flower checkout, the florist shows its customer a Dearly link: "Want this date remembered next year? First card free." The customer opts in on Dearly and can paste or forward their own order confirmation. Dearly reads the occasion, the relationship and the date, and nothing is saved until the customer confirms the reading. The florist never hands over customer data. Dearly pays the florist **£1.50** for each new account. Next year Dearly's proposal includes flowers from the same florist, the florist gets a repeat order it would not otherwise have had, and Dearly earns **7%** of the basket (£2.45 on a £35.00 bouquet).

**Business.** A company pastes its staff list, in whatever state it is in. Dearly cleans it (with AI or with strict rules), flags the rows it cannot use, and schedules a year of birthday, work-anniversary and leaving cards, posted to homes or dropped at the office in one batch. Prices, excluding VAT and including delivery: **£3.30** a posted card, £3.10 from 250 a year, £2.80 from 2,000; office drop **£2.30** flat. Every business account gets its first 25 cards free as a trial. The optional **Automate** plan costs £49.00 a month for HR sync, approvals, a brand kit and reporting. Moonpig's listed business price is £3.60. Contribution per card: £1.36 posted, £1.16 and £0.86 at the tiers, £1.07 by office drop; a 600-card posted batch invoices £1,860.00 and contributes £695.40. Business accounts come first in the go-to-market plan because they bring revenue without advertising and put cards in front of employees and clients.

## 7. Seasonality

The forecast assumes four orders per customer per year, 72% by advance post, 20% tracked, 8% pick-up, with three peaks: Christmas ordering (24 November to 14 December, ×2.6), Valentine week (×1.8) and the week before Mother's Day (×2.4). These multipliers are planning assumptions. The Operations screen shows 13 weeks for any number of customers from 500 to 100,000.

## 8. The operating model: three people

| Role                    | Owns                                                    | What the AI does for them                                                                                                                        |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Product and AI engineer | The product, the prompts, the gateway                   | Drafts every message and chooses every option; draws card fronts and checks photos; reads what customers paste and tell it                       |
| Operations and partners | Printers, pick-up shops, florists, business accounts    | Routes every order by postcode and score; cleans staff lists; reads florist orders; plans recovery when the post is late                         |
| Growth and care         | The recipient loop, referrals, the one escalation queue | Answers support around the clock within six allowed actions; refunds only late or damaged orders; escalates bereavement and distress to a person |

Every automated step is written to a decision log with its actor: the AI, a rule, or a person. The Operations screen shows the counts, the latest decisions, and the estimated AI cost, so the claim "the AI does the operating work" is auditable, not asserted. Every AI job also has a rules-based fallback, so the business runs, more plainly, with no AI provider at all.

Guardrails the model cannot cross: prompts never carry an address, postcode, email, phone number or surname; every AI answer is validated against a schema and a list of allowed values before it touches anything; unsafe or oversized card art is discarded; the support agent can only refund a late or damaged order; a life event is a proposal until the customer confirms it.

## 9. What the pilot demonstrates today

The application in this repository runs every flow above with real AI calls (when a key is configured) and simulated partners for payments, printing, postage, tracking and messaging, each labelled as such. A conformance suite (`docs/conformance/`) maps 61 business claims and nine end-to-end journeys to automated tests at the lowest layer that can prove them, and runs them with the mock provider and again with no provider. At the time of writing every claim passes; 18 disagreements between the app and this model were found and fixed on the way, and are recorded with their severity.

That proves the software matches the model. It does not prove the model works in the market: the pilot has had no paying customers, no real printers and no real post.

Figures the app reproduces: a Regular Signature card by advance post at £4.94 against Moonpig's £5.89; Sam's leaving card by pick-up at £4.94, ready today within two hours; Bill's tracked card at £6.74; a blended contribution of £2.07 and a break-even of about 159,000 orders on the Operations screen.

## 10. What is next

1. **Real partners behind the same interfaces**: Stripe for payments, one print API in one city, Royal Mail Click and Drop for labels, a pick-up shop. The adapters exist; the simulators are swapped one at a time behind feature flags.
2. **Hosting**: a managed PostgreSQL, a storage bucket for uploads and a scheduled job runner; the container image already runs migrations and health checks.
3. **A live pilot** with a few hundred customers through the business, florist and recipient channels, to replace the pilot assumptions (contribution mix, advance-post share, pick-up uptake, recovery rate, recipient sign-up rate, orders per customer) with observed ones. The Operations screen is built to be updated from data rather than from a plan.
4. **Real accounts** for recipients who save a card, so that the loop closes in the browser as it already does in the database.
5. **Supplier quotes** for printing, mailers, the pick-up payout and a Royal Mail business account, so that the cost table rests on quotes and not on estimates.

## 11. Risks and how the pilot treats them

| Risk                                       | Mitigation in the product                                                                                                        |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| The AI writes something wrong or unsafe    | Schema validation, allowed-value lists, sanitising, and a rules fallback for every job; nothing reaches a customer unvalidated   |
| The post is late                           | The guarantee bundle is automatic; the £0.10 reserve holds at about a 1% failure rate and is editable on Operations              |
| A card lands after a bereavement           | The life-event guard pauses the person at proposal time and holds anything already in the pipeline                               |
| Prices drift between plan, code and screen | One constants file; the price book is generated from it; a test fails on any stray price literal                                 |
| Personal data reaches the model            | Prompts are built from a whitelisted view; a test asserts every prompt is free of addresses and surnames                         |
| Volume and cost assumptions are wrong      | Every economic input is editable on Operations and the break-even recomputes live; supplier quotes replace estimates first       |
| Customers still order at the last minute   | Advance-post share is tracked on Operations; without it the postage saving and much of the margin go                             |
| Pick-up is hard to run                     | Print shops close early, volumes per shop are low and quality varies; pilot in one city with Dearly's stock before relying on it |
| Moonpig or Card Factory copies features    | Price is a tactic, not the moat; the reminder list, the Inventory and business integrations are the assets to build              |

## 12. Assumptions still to validate

These inputs drive the numbers above and have not been tested with a supplier or a customer: print costs by size and finish; the £1.75 pick-up payout; second-class and tracked postage at business rates; the 20/60/20 finish mix; four orders per customer a year; 72% of orders by advance post; a 1% delivery failure rate; a 10% recipient sign-up rate; the florist opt-in rate; creator royalties; and an acquisition cost under £5. The commercial business plan lists how each will be validated, along with the market, the competition, the funding requirement, the milestones and the legal points (consent for automated orders, recipient data, user content, voice recordings and design licences).
