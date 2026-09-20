# Backlog

What was cut or deferred to ship the pilot, in priority order, with the reason.

## Cut from the plan

1. **S3 storage driver.** The `StorageAdapter` interface and the local-disk driver are built; `S3Storage` throws with a clear message. Add `@aws-sdk/client-s3`, implement `put`, `get` and `url` with signed URLs, and switch by `STORAGE_DRIVER=s3`. Cut because the pilot runs on one host and the plan listed it last.
2. **Service tests against a test database.** The domain is covered at 93% statements and the API is exercised end to end by Playwright against a seeded database, but there is no Vitest suite that runs the services directly. Add a `globalSetup` that starts a second embedded cluster on another port, runs `prisma migrate deploy`, and test `approveProposal`, `advanceAll`, `delayOrder` and `seedDemo` idempotence.
3. **Real recipient accounts.** "Save to my Dearly" and "Send one back" act on the demo account; a real recipient would create their own account from the recipient page. The `Account` model and `auth.ts` seam exist.
4. **Word timings from the recording.** Narration timings are spaced evenly across the audio duration. Speech-to-text alignment would give exact per-word timings.
5. **Business template rendering.** The `{first_name}` template is captured in the interface and shown as a preview; the per-card message is not yet stored on each scheduled row.

## Product questions surfaced while building

- Noor Rahman's Eid (10 March 2027) is beyond the 150-day Later window at the plan date, so she appears under "Further ahead" on Today rather than in Later. Either extend the window or keep the extra list.
- `RULES.proposeDaysAhead` is defined in the plan but unused; the Later list explains that a proposal moves to Today 35 days out (`proposalWindowDays`).
- The FEASTS table was extended by one year (2029) so the calendar test holds through the pilot's horizon; the dates are approximate like the others.
- Refund in the help agent requires a late or damaged order. The seeded posted order for Priya and Tom is promised in two days, so "refund the card for Priya" is declined until it is late or delayed.

## Next five tasks

1. Service tests with a database (item 2 above), then raise the CI gate to include them.
2. S3 driver and a `docker compose` override for an S3-compatible local bucket.
3. Recipient accounts: sign-up from `/r/[slug]`, moving "Save to my Dearly" onto the recipient's own account.
4. Prisma 7 upgrade (driver adapters, `prisma.config.ts`) once the toolchain settles; ADR 0001 records the decision to stay on 6.
5. Real partner adapters behind feature flags: Stripe for payments, a print API for one printer, Royal Mail Click and Drop for labels.
