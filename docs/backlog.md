# Backlog

What was cut or deferred to ship the pilot, in priority order, with the reason.

## Cut from the plan

1. **S3 storage driver.** The `StorageAdapter` interface and the local-disk driver are built; `S3Storage` throws with a clear message. Add `@aws-sdk/client-s3`, implement `put`, `get` and `url` with signed URLs, and switch by `STORAGE_DRIVER=s3`. Cut because the pilot runs on one host and the plan listed it last.
2. ~~Service tests against a test database.~~ Done: `pnpm test:service` runs the services against the embedded PostgreSQL (`src/server/__tests__`), and CI runs it in the `conformance` job.
3. **Real recipient sessions.** "Save to my Dearly" now creates the recipient's own account and files the card under it; the browser still stays signed in as the demo customer. Signing the recipient in from `/r/[slug]` is the remaining step.
4. **Word timings from the recording.** Narration timings are spaced evenly across the audio duration. Speech-to-text alignment would give exact per-word timings.
5. **Business template rendering.** The `{first_name}` template is captured in the interface and shown as a preview; the per-card message is not yet stored on each scheduled row.

## After the storefront rebuild (branch `ui/storefront`)

6. **Basket and eCard status in the schema.** The basket is a per-browser list of proposal keys and an eCard-only send skips its source proposal (ADR 0004). A `Basket` table and a `fulfilled_by_ecard` proposal status are the first schema follow-ups.
7. **Catalogue id on the card specification.** A chosen design is stored as the custom front SVG with its id embedded; a `catalogueDesignId` field would make it queryable.
8. ~~Narration and animation on printed cards with a digital copy.~~ Done: approving a printed card with the 0.29 digital copy creates its digital card with the same extras as an eCard.
9. **Lighthouse performance headroom.** Home scores 92 on a throttled run with the LCP on the hero heading; trimming the home carousels or subsetting the display font would add margin.
10. **Dark theme polish.** It derives from the same roles and works, but it was not judged screen by screen.

## Product questions surfaced while building

- Noor Rahman's Eid (10 March 2027) is beyond the 150-day Later window at the plan date, so she appears under "Further ahead" on Today rather than in Later. Either extend the window or keep the extra list.
- The plan's `proposeDaysAhead` (21) was never used and has been removed; a proposal moves to "Ready for you" 35 days out (`proposalWindowDays`), earlier than the plan's 21.
- The FEASTS table was extended by one year (2029) so the calendar test holds through the pilot's horizon; the dates are approximate like the others.
- Refund in the help agent requires a late or damaged order. The seeded posted order for Priya and Tom is promised in two days, so "refund the card for Priya" is declined until it is late or delayed.

## Next five tasks

1. S3 driver and a `docker compose` override for an S3-compatible local bucket.
2. Recipient sign-in from `/r/[slug]` so the saved card is visible to the recipient in the browser.
3. Prisma 7 upgrade (driver adapters, `prisma.config.ts`) once the toolchain settles; ADR 0001 records the decision to stay on 6.
4. Real partner adapters behind feature flags: Stripe for payments, a print API for one printer, Royal Mail Click and Drop for labels.
