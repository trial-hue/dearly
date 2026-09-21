# Dearly: the business

_A greeting-card company run by three people and an AI. This document is the business model as the pilot implements it: the product, the economics, the growth loops and the operating model. Every figure below is the one the application runs on; the technical detail is in `DEARLY_TECHNICAL.md`._

---

## 1. The idea in one paragraph

People forget cards, or remember too late, or buy one and never post it. Moonpig's answer was to sell the card online and send a reminder email. Dearly's answer is to do the whole job: remember the person, draft the card, choose the size, finish and delivery, price it, and put it in front of the customer 35 days ahead so that the only thing left to do is tap "Approve and pay". The card then arrives on the day, guaranteed, and the recipient gets a page of their own that turns them into the next customer. Because an AI does the drafting, choosing, reading and support work, the company that runs this needs three people, not thousands.

## 2. The thesis, against the incumbent

Moonpig is the benchmark: a listed UK card business with published figures.

| Area                 | What Moonpig runs                                  | What Dearly runs                                                                               |
| -------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Customers and orders | 12.3m customers, 36.0m orders (FY26)               | A pilot account today; the same flows at any size                                              |
| Marketing            | £38.7m a year (FY26)                               | Recipients join from the card's own QR page and from florist referrals, at no acquisition cost |
| Data and engineering | 242 data scientists, analysts and engineers (FY24) | One product and AI engineer; the AI drafts, chooses, cleans, reads and answers                 |
| Production           | Own factories                                      | Six partner printers routed by postcode; a specialist for anything unusual                     |
| Customer care        | Humans 9am to 5:30pm, no phone line                | An AI agent around the clock, escalating to one person                                         |
| Card stock           | 250 to 300gsm                                      | Three finishes up to 400gsm, three sizes up to A3                                              |
| Team                 | Thousands of people                                | Three: product and AI; operations and partners; growth and care                                |

Sources: Moonpig Group plc annual reports (FY26 for customers, orders and marketing; FY24 for staff) and Moonpig help pages. Dearly figures are pilot assumptions.

## 3. What the customer experiences

**Set up once.** Add the people who matter, with their occasions and addresses. Paste a list, type a line, or let a florist do it (section 6). An address is checked once a year; a card is never sent to a stale one.

**Then, every occasion:**

1. **Thirty-five days ahead a card is ready.** Dearly has chosen the design, written the message in the customer's voice, picked the size and finish that fit the relationship and the moment (a mother's 60th gets Large, Luxe and flowers; a colleague's leaving card is Regular Classic), chosen how it travels, and priced it, delivery included.
2. **One tap approves and pays.** Or the customer edits anything: the front (49 designs, their own photo, a child's drawing, an AI-drawn front), the words, handwriting from a photo, a gift, a digital copy with their voice reading the message, or the date.
3. **It arrives on the day.** Cards seven or more days out go by advance post, sent early, promised two days before the occasion. Two to six days out: tracked, next day. Under two days: printed at a partner shop near the recipient and ready within two hours. Giant cards always travel tracked.
4. **If the post lets them down, Dearly fixes it before they notice.** A delayed card triggers an eCard on the morning of the day, a full refund, a single-use code for half off the next card, and a tracked reprint when there is still time.
5. **The recipient gets a page of their own.** The card carries a QR code. The page shows the card and the message, plays the narration if one was bought, and offers three things: rate it, save it to their own Dearly, and send one back. Saving creates their account. Nothing was spent to acquire them.
6. **Life happens, cards stop.** One sentence, "Uncle Peter passed away in June", proposes pausing every card for that person; the customer confirms, and nothing goes out, not even a card already in the pipeline.

## 4. Every edge over Moonpig

1. **One-tap proposals**, not reminder emails: the card is drafted, chosen and priced before the customer looks.
2. **The life-event guard**: a paused person never gets a card, at proposal time or at print time.
3. **Advance post**: 4.94 for a Regular Signature card delivered against Moonpig's 5.89, shown side by side, and cheaper postage for Dearly.
4. **A delivery guarantee with automatic recovery**: refund, eCard, reprint and a next-card code without a support ticket.
5. **Same-day pick-up** from a partner shop, which Moonpig cannot offer.
6. **An AI help agent** that acts (refund, reprint, upgrade, eCard, escalate) within strict rules, around the clock.
7. **Three finishes in three sizes**, Classic to Luxe, Regular to A3.
8. **The QR recipient loop**: every printed card recruits its recipient.
9. **The Inventory**: sent and received cards kept for three years, downloadable, with a warning before they expire.
10. **Business sends**: a staff list pasted in any state becomes a year of birthday, work-anniversary and leaving cards.
11. **Florist referrals**: a florist's order becomes next year's reminder and a customer.

## 5. Pricing and unit economics

### 5.1 Prices (including VAT)

| Size    | Classic | Signature | Luxe  |
| ------- | ------- | --------- | ----- |
| Regular | 2.99    | 3.99      | 6.49  |
| Large   | 4.99    | 6.49      | 8.99  |
| Giant   | 9.99    | 11.99     | 14.99 |

Delivery: advance post 0.95 (Regular) or 1.95 (Large); tracked 2.75, 3.75 or 3.99 (Giant); pick-up 1.95 (Regular Classic or Signature only). A digital copy of a printed card 0.29; a standalone eCard 0.79. Gifts: flowers 24.00, chocolates 14.00, fizz 19.00, a plant 22.00.

### 5.2 What each card contributes

Every order pays its print cost, delivery cost, payment fee (1.5% plus 0.20), AI (0.05), service (0.08) and, on guaranteed modes, a 0.10 reserve for recovery. What is left after VAT is the contribution towards the team.

| Card, mode                                | Price                 | Contribution       |
| ----------------------------------------- | --------------------- | ------------------ |
| Regular Classic, advance post             | 3.94                  | 1.24               |
| Regular Signature, advance post           | 4.94                  | 1.93               |
| Regular Luxe, advance post                | 7.44                  | 3.33               |
| Regular Signature, tracked                | 6.74                  | 1.99               |
| Regular Signature, pick-up                | 5.94                  | 2.53               |
| Regular Signature, advance + digital copy | 5.23                  | 2.17               |
| Regular Signature, advance + flowers      | 28.94                 | 9.17               |
| Large Classic / Signature / Luxe, advance | 6.94 / 8.44 / 10.94   | 2.48 / 3.48 / 4.67 |
| Giant Classic / Signature / Luxe, tracked | 13.98 / 15.98 / 18.98 | 4.16 / 5.50 / 7.15 |
| Standalone eCard                          | 0.79                  | 0.32               |

Pick-up is the most profitable Regular card: the partner shop is paid 1.75 plus 0.25 of stock, and there is no postage and no guarantee reserve.

### 5.3 The company's break-even

With a mix of 20% Classic, 60% Signature and 20% Luxe on Regular advance post, the blended contribution is **2.07** a card. A team of three costs **330,000** a year. The company breaks even at **159,107 orders a year**, which at four cards per customer is **39,777 customers**. Moonpig has 12.3 million. At 210,000 orders a year the team costs 1.57 per order. Every one of these figures is editable on the Operations screen and recomputes the whole table.

Postage is the other lever: each advance-post card saves about 0.89 against first class (1.80 against 0.91), because the card is sent early on purpose.

### 5.4 The guarantee, costed

A refund on a 4.94 card costs 4.94; the reserve is 0.10 per guaranteed card. The recovery bundle also issues a 50% next-card code, which brings the customer back rather than paying them to leave. The code halves the card price only, once; delivery is charged.

### 5.5 First card free

An account that adds at least three dates gets its first Regular Classic or Signature card free; delivery, extras and gifts are paid. The customer's first experience is the whole loop at almost no cost, and three dates mean three more proposals are already on their way.

## 6. Growth without a marketing budget

**The recipient loop.** Every printed card carries a QR code to a page made for the recipient. Rate it (which tunes the printer network), save it (which creates their account, with no marketing consent unless they give it), send one back (which creates a thank-you reminder a week out). Acquisition cost: zero. The pilot counts recipients joined on the Operations screen.

**Florists.** A florist's delivery note already says who matters to whom and when. Dearly reads it, sets a reminder for next year, and pays the florist **1.50** for the new account. Next year the flowers are ordered through Dearly and the florist earns **7%** of the basket (2.45 on a 35.00 bouquet). Nothing is saved until the florist confirms the reading.

**Business.** A company pastes its staff list, in whatever state it is in. Dearly cleans it (with AI or with strict rules), flags the rows it cannot use, and schedules a year of birthday, work-anniversary and leaving cards, posted to homes or dropped at the office in one batch. Prices, ex VAT and delivery included: **3.30** a posted card, 3.10 from 250 a year, 2.80 from 2,000; office drop **2.30** flat; the **Automate** plan at 49.00 a month with the first 25 cards free. Moonpig's business price is 3.60. Contribution per card: 1.36 posted, 1.16 and 0.86 at the tiers, 1.07 by office drop; a 600-card posted batch invoices 1,860.00 and contributes 695.40.

## 7. Seasonality

The forecast runs four orders per customer per year, 72% by advance post, 20% tracked, 8% pick-up, with three peaks: Christmas ordering (24 November to 14 December, ×2.6), Valentine week (×1.8) and the week before Mother's Day (×2.4). The Operations screen shows 13 weeks for any number of customers from 500 to 100,000.

## 8. The operating model: three people

| Role                    | Owns                                                    | What the AI does for them                                                                                                                        |
| ----------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Product and AI engineer | The product, the prompts, the gateway                   | Drafts every message and chooses every option; draws card fronts and checks photos; reads what customers paste and tell it                       |
| Operations and partners | Printers, pick-up shops, florists, business accounts    | Routes every order by postcode and score; cleans staff lists; reads florist orders; plans recovery when the post is late                         |
| Growth and care         | The recipient loop, referrals, the one escalation queue | Answers support around the clock within six allowed actions; refunds only late or damaged orders; escalates bereavement and distress to a person |

Every automated step is written to a decision log with its actor: the AI, a rule, or a person. The Operations screen shows the counts, the latest decisions, and the estimated AI cost, so the claim "the AI does the operating work" is auditable, not asserted. Every AI job also has a rules-based fallback, so the business runs, more plainly, with no AI provider at all.

Guardrails the model cannot cross: prompts never carry an address, postcode, email, phone number or surname; every AI answer is validated against a schema and a list of allowed values before it touches anything; unsafe or oversized card art is discarded; the support agent can only refund a late or damaged order; a life event is a proposal until the customer confirms it.

## 9. What the pilot proves today

The application in this repository runs every flow above with real AI calls (when a key is configured) and simulated partners for payments, printing, postage, tracking and messaging, each labelled as such. A conformance suite (`docs/conformance/`) maps 61 business claims and nine end-to-end journeys to automated tests at the lowest layer that can prove them, and runs them with the mock provider and again with no provider. At the time of writing every claim passes; 18 disagreements between the app and this model were found and fixed on the way, and are recorded with their severity.

Verified numbers, live in the app: a Regular Signature card by advance post at 4.94 against Moonpig's 5.89; Sam's leaving card by pick-up at 4.94, ready today within two hours; Bill's tracked card at 6.74; a blended contribution of 2.07 and a break-even of 159,107 orders on the Operations screen.

## 10. What is next

1. **Real partners behind the same interfaces**: Stripe for payments, one print API in one city, Royal Mail Click and Drop for labels, a pick-up shop. The adapters exist; the simulators are swapped one at a time behind feature flags.
2. **Hosting**: a managed PostgreSQL, a storage bucket for uploads and a scheduled job runner; the container image already runs migrations and health checks.
3. **A live pilot** with a few hundred customers through the florist and recipient loops, to replace the pilot assumptions (contribution mix, advance-post share, pick-up uptake, recovery rate) with observed ones. The Operations screen is built to be updated from data rather than from a plan.
4. **Real accounts** for recipients who save a card, so that the loop closes in the browser as it already does in the database.

## 11. Risks and how the pilot treats them

| Risk                                       | Mitigation in the product                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| The AI writes something wrong or unsafe    | Schema validation, allowed-value lists, sanitising, and a rules fallback for every job; nothing reaches a customer unvalidated |
| The post is late                           | The guarantee bundle is automatic and costed at 0.10 per card in the contribution                                              |
| A card lands after a bereavement           | The life-event guard pauses the person at proposal time and holds anything already in the pipeline                             |
| Prices drift between plan, code and screen | One constants file; the price book is generated from it; a test fails on any stray price literal                               |
| Personal data reaches the model            | Prompts are built from a whitelisted view; a test asserts every prompt is free of addresses and surnames                       |
| Volume assumptions are wrong               | Every economic input is editable on Operations and the break-even recomputes live                                              |
