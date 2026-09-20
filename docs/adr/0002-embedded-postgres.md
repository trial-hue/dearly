# ADR 0002: Embedded PostgreSQL for local development and tests

- Context: the machine building the pilot has neither Docker nor PostgreSQL installed, and the plan requires `pnpm dev` and the tests to work locally.
- Decision: `scripts/with-db.ts` starts a real PostgreSQL cluster from the `embedded-postgres` package under `.data/pg` when `DATABASE_URL` is unset or `embedded`. Docker Compose, CI and production use a normal `DATABASE_URL`.
- Alternatives: SQLite for development (a second Prisma provider and diverging migrations); requiring Docker (blocks zero-install onboarding); PGlite (no official Prisma adapter).
- Consequences: same engine everywhere, one migration history; `.data/` is git-ignored; the first run downloads nothing extra because the binaries ship with the npm package.
- Date: 2026-09-20
