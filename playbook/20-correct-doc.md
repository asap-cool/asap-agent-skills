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
