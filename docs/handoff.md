# Hand-off

State of the Dearly pilot at hand-off, 20 September 2026.

## Where it is

- Repository: this directory (`dearly/`), on `main`. See `git log` for the commit sequence.
- Run locally: `cp .env.example .env && pnpm install && pnpm dev`, then http://localhost:3000. No database install is needed (embedded PostgreSQL, ADR 0002).
- Deploy: `docker compose up --build` (PostgreSQL, web, worker), or the `Dockerfile` against a managed database. Migrations run on start; `/api/health` answers.
- Checks: `pnpm check` (lint, format, types, 64 unit tests, domain coverage 93% statements / 96% lines) and `pnpm build && pnpm test:e2e` (7 Playwright scenarios, mock AI provider, fresh seeded database).

## Definition of done

| Item | State |
| --- | --- |
| Clone, copy `.env.example`, `docker compose up` gives a working app with seeded data and no API key | Built and documented. **Not run here**: the build machine has no Docker. The Dockerfile, compose file and entrypoint are written to the plan; the worker and seed bundles (`pnpm build:worker`) compile. First `docker compose up` on a machine with Docker should be watched. |
| `pnpm check` passes | Passes. |
| `pnpm test:e2e` passes the scenarios in section 11.2 | Passes locally against a production build (core flow, fallbacks, business, recovery, recipient page, accessibility smoke). |
| CI runs lint, typecheck, unit tests, build and e2e on every push | `.github/workflows/ci.yml` written (Postgres service, Playwright with Chromium, Docker image build). Not yet run on GitHub: the repository has no remote. |
| Production image builds, runs migrations on start, serves `/api/health`, runs as non-root | Written; untested for the reason above. |
| With an API key every AI job returns AI results; with none every job falls back and the header shows "Built-in rules" | Fallback path verified by unit tests and e2e. The Claude provider is written against the official SDK (`messages.create`, model identifiers from the environment) but was **not exercised with a real key** in this session. |
| Approve, advance to delivered, delay and see recovery, open the QR link, rate, find it in the Inventory | Verified end to end. |
| Prices match section 5; the editor shows the full price and the Moonpig comparison | Verified by unit tests (£4.94 against £5.89, contributions 1.24/1.94/3.33) and e2e. |
| README explains set-up, scripts, architecture, environment, deployment and what is simulated | Done. |
| No secrets; `pnpm audit` shows no high or critical issues | No secrets are committed. `pnpm audit` was not run in this session (see "Next five"). |

## What was cut and why

See `docs/backlog.md`: the S3 driver (interface and local driver exist), service tests against a database (domain and e2e cover the logic), real recipient accounts, exact word timings from recordings, and per-row business templates.

## ADRs written

- 0001 Stack (Next.js 16, Prisma 6, Tailwind 4, pnpm, Vitest, Playwright, Docker).
- 0002 Embedded PostgreSQL for local development and tests.
- 0003 Money as integer pence.

## Known defects and rough edges

- The Studio's microphone and camera recording depend on browser permission; the fallbacks (upload, built-in voice) are the tested path.
- `next build` evaluates route modules, so the environment must be valid at build time (the Dockerfile sets placeholders).
- The worker is bundled with `--packages=external`; the runtime image relies on the standalone `node_modules` containing `@prisma/client`, `pino` and `zod`, which the app also imports. Verify on the first Docker build.
- ESLint is pinned to 9.x because `eslint-plugin-react` (via `eslint-config-next`) does not yet support ESLint 10.
- `tsx` is pinned one release back because pnpm's minimum-release-age policy rejected the newest version on the build day.

## Next five tasks

1. Push to GitHub and watch the first CI run; fix anything environment-specific (Playwright deps, Docker build cache).
2. Run `docker compose up --build` on a machine with Docker; confirm migrations, health check and the worker.
3. Set a real `ANTHROPIC_API_KEY` with `AI_MODEL_QUICK=claude-haiku-4-5` and `AI_MODEL_DEFAULT=claude-opus-5`, run "Draft all with AI" and the help agent, and tune prompts against the decision log.
4. Service tests with a database (backlog item 2) and `pnpm audit` in CI.
5. Recipient accounts and the S3 driver.
