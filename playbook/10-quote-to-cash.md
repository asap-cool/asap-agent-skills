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
