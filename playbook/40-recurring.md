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
