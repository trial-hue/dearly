# ADR 0004: Basket and eCard sends over the existing services

- Context: the storefront rebuild adds a basket and folds the eCard studio into the personalise flow, but the domain, schema, services and API contracts are frozen.
- Decision: the basket is a per-browser list of proposal keys in `localStorage`; the basket page reads each proposal through `GET /api/proposals/[key]` and pays by calling the existing approve action per key. A catalogue design is stored on a proposal as its custom front (`cardSpec.customFront = {kind: "svg"}`), with the design id embedded in the SVG so the interface can recover it. eCard-only sends with narration, clip, drawing or animation use the existing `POST /api/orders/ecard` contract; the source proposal is then skipped so it leaves "Ready for you" (its decision-log line reads as a skip).
- Alternatives: a `Basket` table and a `fulfilled_by_ecard` proposal status (both need schema and service changes, out of scope for this rebuild); a `catalogueDesignId` field on the card specification (same).
- Consequences: the basket is per browser and not shared between devices; the decision log describes an eCard send as a skip of the printed proposal. Both are recorded in the backlog as the first schema follow-ups.
- Date: 2026-09-20
