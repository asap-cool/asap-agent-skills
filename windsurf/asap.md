<!-- GENERATED from playbook/ by scripts/build.mjs — do not edit by hand. -->

# ASAP invoicing (Windsurf rules)

You operate the ASAP platform (French invoicing, contacts, e-signature) through its MCP server. The tools referenced below are provided by that server — connect it first (see the repository README). These playbooks tell you HOW to combine those tools correctly; they never replace them.

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

## Compliance invariants (France)

These cause most 4xx errors. Internalize them before mutating anything.

- **operation_nature is mandatory to finalize.** A fiscal document (facture, avoir,
  acompte) needs an explicit `operation_nature` — `'biens'` | `'services'` | `'mixte'`.
  There is no org default. Set it at creation, or `finalize_invoice` blocks with
  HTTP 422 (2026 mention).
- **Money is in cents.** All amounts are integers in cents. `quantity` and `vat_rate`
  are decimal tokens passed as strings — e.g. `"1"`, `"20"`, `"0"`. Use `vat_rate`
  `"0"` for franchise-en-base (VAT-exempt micro-entrepreneurs).
- **Finalizing is irreversible.** `finalize_invoice` assigns a gapless legal number
  (NF203) and seals the document. Preview it first with `dry_run: true`.
- **Sealing makes a document immutable.** Only a DRAFT can be edited or deleted. Once
  finalized, `update_invoice` / `delete_invoice` return `409`. A sealed document is
  corrected by issuing a new document — never by forcing an edit. See the
  correct-document playbook.

Safety: destructive tools (finalize, credit note, merge, cancel, delete) are
irreversible — confirm intent, and pass `confirm: true` when the tool requires it.
On any error, read the `hint` / `retryable` lines: they state the concrete next step.
When retrying a mutating call after a timeout, reuse the same `idempotency_key` so the
server de-duplicates instead of creating a double.

## Quote to cash

The happy path from a quote (devis) to a paid invoice. Host prompt: `quote-to-sent`,
then `quote-lifecycle`.

1. `get_org_context` to confirm the VAT regime and invoice defaults.
2. Resolve or create the contact (`list_contacts` / `create_contact`).
3. `create_quote` with line items — amounts in cents, `vat_rate` as a token like `"20"`.
   Set `operation_nature` now so finalize won't block later.
4. `finalize_invoice` with `dry_run: true` to preview the assigned number, then
   `finalize_invoice` for real.
5. `send_invoice` to email it.

After the quote is sent, drive its lifecycle:

- On the client's decision, `accept_quote` (marks it accepted) or `reject_quote`
  (closes it). Neither needs a body.
- Once accepted, `convert_quote_to_invoice` creates the linked invoice — a fresh
  DRAFT that inherits the quote lines. Review it with `get_invoice`, then finalize
  and send as above.
- To bill only part of the amount upfront instead of converting the whole quote, use
  the recurring/deposit path: `create_deposit` with either `percentage` or
  `amount_ttc` (not both), carrying `operation_nature`, `dry_run: true` first.
- Record incoming money with `record_payment`; chase overdue invoices with
  `schedule_reminders`.

Reuse one `idempotency_key` per create/finalize/send if you retry.

## Correcting a document (draft vs sealed)

Host prompt: `correct-document`. The whole decision hinges on one thing — is the
document still a draft, or sealed?

1. `get_invoice` on the document and read its `status`.
2. **DRAFT** → edit in place with `update_invoice` (its `items` are replace-all, at
   least one line). You may also `delete_invoice` a draft outright (`confirm: true`).
3. **FINALIZED (sealed)** → it is immutable. `update_invoice` / `delete_invoice`
   return `409`. Do not fight it. Instead:
   - To correct amounts: `create_credit_note` (avoir) that offsets the sealed invoice,
     then issue a new, correct invoice.
   - To void a sealed document that was already sent: `cancel_document`
     (`confirm: true`).

Rule of thumb: a sealed document is corrected by a new document (avoir / cancel),
never by editing the original. The same applies to products (`update_product` /
`delete_product`) and recurring schedules, which are freely editable because they are
not fiscal records.

## Attaching & analyzing document PDFs

Host prompt: `analyze-pdf`. Every document in the app can be pulled into the chat as
an embedded PDF the model reads directly — no download step.

- **Invoices, quotes, credit notes, deposits:** `get_invoice_pdf`. Returns the sealed
  Factur-X PDF. For a document still in draft, pass `preview: true` to get the rendered
  preview instead.
- **E-signature envelopes:**
  - `get_envelope_document` — the source PDF before signatures are stamped.
  - `get_signed_document` — the completed, stamped PDF. Available only once the
    envelope is completed; otherwise `409`.
  - `get_signature_proof` — the eIDAS proof certificate (hash chain, timestamps,
    signer identities).

Each returns an embedded resource (base64 PDF) that the host attaches to the chat.
Use these to summarize a document, verify totals, extract line items, or confirm a
signature is complete — analyze it in place.

## Recurring schedules

Host prompts: `manage-recurring`, `monthly-recurring-run`.

- `list_recurring_invoices` to review schedules and their `next_generation_date`;
  `get_recurring_invoice` for one full definition.
- `update_recurring_invoice` **replaces the whole model** — send the complete desired
  set of fields, like `create_recurring_invoice`, not a partial patch.
- `pause_recurring_invoice` / `activate_recurring_invoice` toggle whether a schedule
  generates.
- `run_recurring_invoice` triggers a generation now for a due schedule.
- `delete_recurring_invoice` removes a schedule (`confirm: true`).

Manage the product catalogue the same way: `list_products` / `get_product` /
`create_product` / `update_product` / `delete_product`. Reuse one `idempotency_key`
per mutating call if you retry.
