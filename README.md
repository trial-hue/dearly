# Dearly pilot

Greeting cards run by three people and an AI. This repository is the Dearly pilot: a deployable web application that walks through every Dearly flow with real AI calls and simulated partners, and makes the company thesis visible on its Operations screen.

The pilot shows three things:

1. Every edge over Moonpig: one-tap AI proposals, the life-event guard, advance post with a price comparison, the delivery guarantee with automatic recovery, same-day pick-up, the AI help agent, three finishes in three sizes, the QR recipient loop, the Inventory, business sends and florist referrals.
2. The AI doing operating work: importing people, drafting messages, choosing options, cleaning staff lists, reading florist orders, detecting life events, answering support.
3. The thesis: an Operations screen with three roles, an automation log, a forecast and unit economics.

## Run it locally in one command

Requirements: Node 24 (see `.nvmrc`) and pnpm 12 (`corepack enable`). No database install is needed: an embedded PostgreSQL starts under `.data/pg`.

```bash
git clone <this repository> dearly && cd dearly
cp .env.example .env
pnpm install
pnpm dev
```

Open http://localhost:3000. The database is migrated and seeded on first start. With no `ANTHROPIC_API_KEY` set every AI feature runs on built-in rules and the header reads "Built-in rules". Add a key (and the two model identifiers) to `.env` and restart to get live AI.

Other scripts:

| Script                        | What it does                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------- |
| `pnpm dev`                    | Embedded Postgres, migrate, seed, Next.js dev server                         |
| `pnpm worker`                 | Background worker for time-based jobs (on-the-day eCards, staff batch sends) |
| `pnpm check`                  | Lint, Prettier check, `tsc --noEmit`, unit tests                             |
| `pnpm test -- --coverage`     | Unit tests with domain coverage (threshold 90% lines)                        |
| `pnpm build && pnpm test:e2e` | Production build, then Playwright scenarios against a fresh seeded database  |
| `pnpm db:reset`               | Put the demo data back to the seeded state                                   |
| `pnpm db:migrate:dev`         | Create a migration after editing `prisma/schema.prisma`                      |
| `pnpm db:studio`              | Prisma Studio against the local database                                     |

The "Reset demo" button on Today does the same as `pnpm db:reset`.

## Run it with Docker

```bash
cp .env.example .env
docker compose up --build
```

`docker compose up` starts PostgreSQL, the web app on http://localhost:3000 and the worker. Migrations run on start; seed the demo with `docker compose --profile seed run --rm seed`. The image runs as a non-root user and answers `/api/health`.

## Three layouts and the route map

| Layout                                                                   | Routes                                                                                                                                                                                                   |
| ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Storefront (top header, category row, footer, phone tab bar)          | `/`, `/cards`, `/cards/[occasion]`, `/ecards`, `/card/[designId]`, `/personalise/[key]`, `/reminders`, `/basket`, `/orders`, `/my-cards`, `/help`, `/account`, and the public recipient page `/r/[slug]` |
| B. Dearly for Business (own header, denser)                              | `/business`, `/business/send`, `/business/pricing`                                                                                                                                                       |
| C. Dearly HQ (dashboard style, reached only from the footer's Demo menu) | `/hq/operations`, `/hq/partners`, `/hq/kit`                                                                                                                                                              |

The old routes redirect: `/today` and `/people` to `/reminders`, `/studio` to `/cards`, `/inventory` to `/my-cards`, `/florists` to `/hq/partners`, `/operations` to `/hq/operations`. `docs/design/restructure.md` maps every feature to its home.

Cards are the product: a catalogue of 49 layered SVG designs in `src/catalogue` renders through one `CardMock` component everywhere, and a chosen design is stored on a proposal as its custom front so the domain and schema stay untouched (ADR 0004).

## Architecture in one paragraph

Next.js App Router with TypeScript in strict mode. `src/domain` is pure TypeScript with no I/O: pricing in integer pence, the delivery rule, the calendar, routing, proposals, recovery, forecast and unit economics, each unit-tested. `src/server/services` are the only callers of Prisma. Route handlers under `src/app/api` validate input with `zod`, call one service and return problem JSON on failure. Server components read services directly; client components mutate through the API and refresh. Simulated partners (payments, printers, carriers, messaging, storage) sit behind adapter interfaces in `src/server/adapters`. The AI gateway in `src/server/ai` has a provider interface, a Claude provider on Anthropic's official SDK, a mock provider for tests, and one file per job with its prompt, `zod` schema, validator and rules-based fallback. Every AI or rules decision is written to the `Decision` table that Operations shows. See `docs/architecture.md`.

## Environment variables

All variables are validated at start-up by `src/env.ts`; a missing or invalid value fails fast with a message.

| Variable                             | Purpose                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------- |
| `DATABASE_URL`                       | Postgres URL, or `embedded` to start a local cluster under `.data/pg` (development only) |
| `SESSION_SECRET`                     | Signs the demo-session cookie (16 characters or more)                                    |
| `APP_URL`                            | Base address used in QR codes and recipient links                                        |
| `ANTHROPIC_API_KEY`                  | Optional. Without it the gateway uses fallbacks                                          |
| `AI_MODEL_QUICK`, `AI_MODEL_DEFAULT` | Model identifiers for the two tiers; required when a key is set; nothing is hard-coded   |
| `AI_PROVIDER`                        | `claude` or `mock` (the tests use `mock`)                                                |
| `RATE_LIMIT_AI_PER_MIN`              | Per-session limit on the AI and agent routes                                             |
| `STORAGE_DRIVER`, `STORAGE_PATH`     | `local` writes uploads under `STORAGE_PATH`; `s3` is the documented seam                 |
| `S3_*`                               | For the S3 driver (not built in the pilot, see the backlog)                              |
| `LOG_LEVEL`                          | pino level                                                                               |
| `DEARLY_FAKE_TODAY`                  | Optional `YYYY-MM-DD` to pin "today" for demos                                           |

## What is simulated

Payments, printing, postage and carrier tracking, HR sync, florist systems, email and SMS. Each is an adapter with a simulator, labelled "simulated" in the interface, and logged as a decision. Media uploads, the database, the QR codes and the recipient pages are real.

## Dependencies worth a word

- `embedded-postgres`: a real PostgreSQL for local development and tests without Docker (ADR 0002).
- `prisma` 6: mature migrations and client; Prisma 7 is a backlog upgrade (ADR 0001).
- `qrcode`: SVG QR codes for the recipient link on every printed order.
- `pino`: structured JSON logs with personal fields redacted.
- `zod` 4: every API input and every AI output is parsed before use.
- `@anthropic-ai/sdk`: the official client; model identifiers come from the environment.
- `esbuild`: bundles the worker for the container image.
- `lucide-react`: the icon set for navigation and controls (20px, 1.75 stroke, always with a text label in navigation). Dialogs, sheets and carousels use native `<dialog>` and CSS scroll-snap, so no primitive library was needed.

## Documentation

- `docs/architecture.md`: layers, data model, request flow, AI gateway.
- `docs/runbook.md`: deploy, migrate, seed and reset, rotate the key, read the decision log, provider outage.
- `docs/adr/`: decisions with context and consequences.
- `docs/backlog.md`: what was cut and what comes next.
- `docs/handoff.md`: state of the pilot at hand-off.

## Licence

MIT.
