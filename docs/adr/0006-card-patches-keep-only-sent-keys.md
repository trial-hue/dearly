# ADR 0006: Card edits change only the fields that were sent

- Context: `updateCard` in the proposals service validated edit patches with `CardSpecSchema.partial()`. With zod 4, `.partial()` on fields that carry defaults still applies those defaults for absent keys, so a patch such as `{size: "large"}` came back as `{size: "large", message: "", digital: false, gift: "none", font: "hand", modeOverridden: false}` and was spread over the stored card: every edit wiped the message and reset the extras. The storefront's eCard send exposed it (the API rejected an empty message); the drawer editor had the same bug unnoticed.
- Decision: `updateCard` keeps only the keys present in the raw patch after validation. No schema, domain or contract change; the fix is eight lines in the service.
- Alternatives: a separate patch schema without defaults in the domain (a domain change); building the patch on the client with every field (fragile, and the bug would remain for other callers).
- Consequences: the eCard and browse-to-order scenarios assert that the message survives edits. The domain tests are unchanged.
- Date: 2026-09-20
