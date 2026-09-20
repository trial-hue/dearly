# Conformance report

**Summary.** After the fix commit, the running Dearly application reflects the business model: every claim in `matrix.md` passes at its lowest provable layer, the nine end-to-end journeys pass at phone and desktop sizes with the mock provider, and journeys 2, 6 and 7 pass again with no provider configured. Before the fixes, 18 claims drifted (`drift.md`): six blocked the model (B3 paused people were still printed; D3 saving a card created no account; G5 a life event paused someone without confirmation; G3 the staff-list prompt carried postcodes and the support prompt surnames; C6 the guarantee code could not be redeemed; I1 the Coming-up tab crashed), four misled a customer (D2 and A7 the paid digital copy did nothing for the recipient and unlocked nothing in the editor; the delivery date input showed the day before; phone layouts scrolled sideways), and the rest were cosmetic. One claim, F3, holds only under its own conditions: the referred customer's first card is free once three dates are saved and the card is Regular Classic or Signature, which the florist copy now states.

## Totals by status

| Suite                           | Layer                                                             | Result                                                                                                                                                                                                                                         |
| ------------------------------- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm test`                     | domain and gateway (19 files)                                     | 348 passed, 0 failed                                                                                                                                                                                                                           |
| `pnpm test:service`             | services against the embedded PostgreSQL (6 files)                | 24 passed, 0 failed                                                                                                                                                                                                                            |
| `pnpm test:e2e`                 | 36 specs × phone and desktop, mock provider                       | full post-fix run 66 passed, 6 failed; the 6 were 4 test-side mistakes, the microphone permission, and the business workbench overflow (drift 15); after those changes the affected 4 spec files were rerun at both sizes: 28 passed, 0 failed |
| `pnpm test:e2e:noai`            | journeys 2, 6, 7 and the HQ status and thesis checks, no provider | 5 passed, 0 failed                                                                                                                                                                                                                             |
| `pnpm audit --audit-level=high` | dependencies                                                      | no known vulnerabilities                                                                                                                                                                                                                       |

Claims by status (matrix): 61 claims plus 9 journeys. Pass on first run: 43 claims and 4 journeys. Failed first, fixed, now pass: 18 claims (drift 1 to 18) and 5 journeys. Pass with stated conditions: 1 (F3). Not proven: none.

Before the fix commit the same e2e suite scored 33 passed, 39 failed (27 minutes); the difference is the drift list plus the test-side corrections recorded in the commit history.

## Drift

See [`drift.md`](drift.md).

## Residual risks

- **No real model call.** G1 and G2 are proven with the mock provider and with no provider. The Claude provider is written against the official SDK but was not exercised with a key in this work, so prompt quality and live latency are unmeasured.
- **The recipient's session.** Saving a card now creates the recipient's own account and files the card under it, but the browser stays signed in as the demo customer, so a recipient's own "My cards" view is not demonstrated end to end (it is asserted at the service layer).
- **F3 is conditional.** The florist referral seeds one reminder date; the first card is free once the account holds three dates and the card is Regular Classic or Signature. The rules-based proposal for a mother's 70th is Large Luxe with flowers (B5), which the offer excludes. The partners copy now says so.
- **Dates in the running app.** The domain and service suites run under five injected clocks. The Playwright journeys run on the real date only: the server pins its clock at start (`DEARLY_FAKE_TODAY`), so a UI run per clock would need five server starts.
- **Narration by built-in voice** depends on the browser's speech synthesis, which headless Chromium does not exercise; the word-by-word reveal is proven with an uploaded recording.
- **Handwriting.** The check proves an ink-only layer on a transparent background (every pixel fully transparent or fully opaque); stroke fidelity is not measured.
- **Phone runs** use Chromium with a 390×844 viewport and touch, not a physical device.
- **The rate limiter** is in-process; the API check relies on "Reset demo" clearing it between specs, which is also what the demo promises.

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
