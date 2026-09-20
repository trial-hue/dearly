# Conformance report

_Summary to be completed from the final run._

## Totals by status

_To be completed._

## Drift

See [`drift.md`](drift.md).

## Residual risks

_To be completed._

## Reproduce

```
pnpm install
pnpm test                 # domain and gateway claims, the price literal scan, the secrets scan
pnpm test:service         # service claims against the embedded PostgreSQL (starts it for you)
pnpm build
pnpm test:e2e             # journeys and UI claims, mock provider, phone and desktop
pnpm test:e2e:noai        # journeys 2, 6 and 7 with no provider configured
pnpm test:conformance     # all of the above in one command
pnpm audit --audit-level=high
```

CI runs the same sequence in the `conformance` job (`.github/workflows/ci.yml`).
