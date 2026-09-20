# ADR 0001: Stack

- Context: the pilot must run locally with one command, deploy as a container, and keep AI keys on the server.
- Decision: Next.js 16 (App Router) with TypeScript strict, Tailwind 4 utilities over CSS variable tokens, PostgreSQL through Prisma 6, pnpm, Vitest and Playwright, GitHub Actions, a multi-stage Dockerfile and docker-compose.
- Alternatives: a separate SPA plus API service (two deployables, more plumbing); SQLite (not the production database); Prisma 7 (new driver-adapter configuration, less battle-tested with Next 16 at the time of writing).
- Consequences: one codebase for interface and API; server components read services directly, client mutations go through route handlers; Prisma 7 is a backlog upgrade.
- Date: 2026-09-20
