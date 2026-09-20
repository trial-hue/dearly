# Runbook

## First deploy

1. Provision PostgreSQL 15 or later and set `DATABASE_URL`.
2. Set `SESSION_SECRET` (a long random string), `APP_URL` (public address, used in QR codes), and optionally `ANTHROPIC_API_KEY`, `AI_MODEL_QUICK`, `AI_MODEL_DEFAULT`.
3. Build and run the image: `docker compose up --build`, or build with `docker build -t dearly .` and run `web` and `worker` containers from it against the managed database.
4. The entrypoint waits for the database, runs `prisma migrate deploy`, then starts `node server.js` (web) or `node dist/worker.mjs` (worker).
5. Check `GET /api/health` returns `{"status":"ok","db":"ok"}`.

## Migrations

- Locally: edit `prisma/schema.prisma`, then `pnpm db:migrate:dev` (creates a migration under `prisma/migrations`, applied to the embedded database).
- Everywhere else: `prisma migrate deploy` runs on container start. It only applies committed migrations.

## Seeding and resetting the demo

- `pnpm db:seed` upserts the seed (idempotent). `pnpm db:reset` removes demo data first.
- In Docker: `docker compose --profile seed run --rm seed`.
- In the interface: "Reset demo" on Today calls `POST /api/demo/reset`. Disable that route before any public deployment.
- Seed dates are relative to the day the seed runs, so the demo stays live. `DEARLY_FAKE_TODAY=YYYY-MM-DD` pins the server's notion of today.

## Rotating the API key

1. Create the new key in the Anthropic console.
2. Set `ANTHROPIC_API_KEY` on the web and worker services and restart them (the provider is built once per process).
3. Revoke the old key. Every AI run writes a decision with the provider name and model, so a drop to "rule" decisions after the rotation means the key or model names are wrong; the environment validator rejects a key without model names.

## Reading the decision log

Operations shows the latest 30 decisions with the actor (`ai`, `rule`, `person`), the job, a summary, and the estimated cost in pence for AI runs. For everything, query the `Decision` table:

```sql
select at, actor, job, summary, "costMicroPence" / 1e6 as pence from "Decision" order by at desc limit 100;
```

A fallback shows as `rule` with "fell back to built-in rules: <reason>" in the summary.

## When the AI provider is down

Nothing stops. `runJob` catches every provider failure (network, rate limit, refusal, invalid JSON, schema mismatch) and returns the job's rules-based result, logging the reason. The header pill still reads "AI connected" because the key is configured; the decisions list shows the fallbacks. To force rules everywhere, unset `ANTHROPIC_API_KEY` and restart. To run canned answers (demos without a key that still show "AI" labels), set `AI_PROVIDER=mock`.

## Background jobs

The worker polls `Job` every 5 seconds (`WORKER_INTERVAL_MS`). Failed jobs retry after a minute up to three attempts and then stay `failed` with `lastError`. `POST /api/orders/advance` also runs due jobs, which is what "Run the next step" calls.

## Local database

The embedded cluster lives under `.data/pg` and listens on port 54329 (`PGPORT` to change). Delete `.data/pg` to start from nothing. If a run was killed and the next start complains about a lock, delete `.data/pg/postmaster.pid`.
