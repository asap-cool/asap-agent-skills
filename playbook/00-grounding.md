## Grounding — do this first

ASAP is an invoicing / contacts / e-signature platform for a French freelancer or
micro-agency. Before reasoning about any invoice or quote:

- Call `get_org_context` first. It returns the active organization, its VAT regime,
  the enabled apps, and the invoice defaults. Do not assume any of these.
- One connection is bound to exactly one organization, fixed when it was authorized.
  Every call acts within that org; there is no in-session org switch.
- The key's scopes (`contacts` / `invoice` / `signature`) decide what you may do. A
  missing scope is a hard `403`, not something to retry.

The `asap://catalogue` resource lists every tool, prompt and resource — read it when
you are unsure whether a capability exists.
