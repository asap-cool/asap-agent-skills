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
