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
