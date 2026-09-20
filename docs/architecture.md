# Architecture

## Layers

```
browser ── server components ──┐
   │                            ├── services (src/server/services) ── Prisma ── PostgreSQL
   └── fetch ── route handlers ─┘          │
             (src/app/api)                 ├── adapters (payments, printers, carriers, storage, messaging)
                                           └── AI gateway (src/server/ai) ── Claude | mock | fallbacks
domain (src/domain): pure functions, integer pence, injected clock, no I/O
worker (src/server/jobs): polls the Job table for time-based work
```

- `src/domain` imports nothing from `server`, `app` or any I/O package. It owns prices, the delivery rule, the calendar (feasts, fixed dates, month-days), routing by postcode area, proposal defaults and windows, recovery planning, the forecast, unit economics, the staff-list parser, the people importer, the florist-order reader, the life-event and support rules, and the SVG sanitiser. Everything here is unit-tested (`src/domain/__tests__`, coverage threshold 90% lines).
- `src/server/services` are the only callers of Prisma. A service takes plain input, reads and writes rows, calls adapters, and writes decisions.
- `src/app/api` route handlers validate input with `zod`, call one service and return JSON or a problem document (`{type, title, status, detail}`).
- Server components under `src/app/(customer|business|internal)` read services directly and pass serialised views (`src/lib/serialize.ts` turns Dates into ISO strings) to client components, which mutate through the API and call `router.refresh()`.
- `src/server/adapters` hold the interfaces and simulators for payments, printers, carriers, storage and messaging. `getStorage()` picks the driver from the environment; the others are simulators in the pilot.
- `src/server/ai` is the gateway: `runJob(job, input)` builds the prompt, asks the provider, parses with the job's schema, validates allowed values, and on any failure returns the job's rules-based fallback. Every run writes a `Decision` row (actor `ai` or `rule`) with an estimated cost.
- `src/server/jobs` is the worker loop and its handlers (`send_ecard`, `send_batch_card`). "Run the next step" on Orders also runs due jobs so the demo needs no worker.

## Request flow: approving a card

1. `PATCH /api/proposals/[key]` with `{action: "approve"}`.
2. The route reads the session (`src/server/auth.ts`: a signed cookie or the seeded demo account) and calls `approveProposal`.
3. The service checks the address rule (`canApprove`), prices the card (`quote`, in pence), routes it (`route` by postcode area, higher score wins, the specialist otherwise), captures payment through the payments adapter, creates the `Order` with an unguessable `recipientSlug`, a `Shipment`, and for eCards a `DigitalCard` and an `InventoryItem`, marks the proposal approved and writes four decisions.
4. The client refreshes; Orders shows the stage tracker and a QR code that opens `/r/[slug]`.

## Data model

See `prisma/schema.prisma`. Money is integer pence; timestamps are UTC; JSON columns hold the card specification (`CardSpecSchema`), quotes, stage history, recovery actions, batch rows and referral ledgers. Recipient slugs are 22 characters from `crypto.randomBytes`.

## AI jobs

| Job                  | Tier    | Fallback                           |
| -------------------- | ------- | ---------------------------------- |
| `proposals`          | default | rules-based defaults and templates |
| `rewrite_message`    | default | next template in rotation          |
| `import_people`      | quick   | line parser                        |
| `life_event`         | quick   | keywords plus a name match         |
| `clean_staff_list`   | quick   | strict parser                      |
| `read_florist_order` | quick   | pattern reader                     |
| `agent_turn`         | quick   | keyword rules                      |
| `card_front`         | default | stock design                       |

Prompts follow one pattern: a role sentence, rules (British English, no emojis, job rules), allowed values, data as JSON, and "Reply with only JSON in this shape" with an example. Prompts carry first names, relationships, occasions, ages and past messages; never addresses or postcodes (a unit test asserts this).

## Security

Security headers including a CSP are set in `next.config.ts`. Uploads are checked for type and size and served through the app with `nosniff`. AI and upload routes are rate limited per session. SVG from the AI is sanitised (no script, foreignObject, event attributes, links or external references) before it is stored or rendered. Logs redact addresses, postcodes and emails.

## Theming and design

Tokens live in `src/app/globals.css` as CSS variables (light, dark by `prefers-color-scheme`, and an explicit `data-theme`). Tailwind 4 utilities map to them through `@theme inline`. Cards keep fixed paper colours in both themes. Each proposal is an envelope with a 6px airmail stripe; nothing else uses the stripe.
