// Assemble the per-client instruction files from the single source of truth in
// `playbook/`. Each client file is FULLY generated — never hand-edit the files
// under claude/ chatgpt/ cursor/ windsurf/; edit `playbook/*.md` and re-run
// `npm run build`. `check-drift.mjs` fails CI if the committed outputs drift
// from the source.
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const PLAYBOOK_DIR = join(ROOT, "playbook");

const GEN_NOTICE =
  "<!-- GENERATED from playbook/ by scripts/build.mjs — do not edit by hand. -->";

/** Concatenate every playbook fragment, in filename order, into one body. */
export function readCore() {
  const files = readdirSync(PLAYBOOK_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();
  return files.map((f) => readFileSync(join(PLAYBOOK_DIR, f), "utf8").trim()).join("\n\n");
}

const INTRO =
  "You operate the ASAP platform (French invoicing, contacts, e-signature) through its " +
  "MCP server. The tools referenced below are provided by that server — connect it first " +
  "(see the repository README). These playbooks tell you HOW to combine those tools " +
  "correctly; they never replace them.";

/** Build every client output as `{ path, content }`. */
export function buildOutputs() {
  const core = readCore();

  const claude = [
    "---",
    "name: asap-invoicing",
    "description: >-",
    "  Use when the user manages French invoicing through the ASAP MCP server — creating,",
    "  finalizing or sending quotes and invoices (devis/factures), deposits (acomptes),",
    "  credit notes (avoirs), recurring schedules, or e-signature envelopes. Enforces FR",
    "  compliance: operation_nature, amounts in cents, and NF203 sealing (a finalized",
    "  document is immutable). Requires the ASAP MCP server to be connected.",
    "---",
    "",
    `${GEN_NOTICE}`,
    "",
    `# ASAP invoicing`,
    "",
    INTRO,
    "",
    core,
    "",
  ].join("\n");

  const chatgpt = [
    `${GEN_NOTICE}`,
    "",
    "# ASAP invoicing — custom GPT instructions",
    "",
    "Paste this into a custom GPT's *Instructions*, and add the ASAP MCP server as an",
    "Action / connector (`https://mcp.asap.cool`, authenticated with the user's ASAP API",
    "key). The GPT then drives ASAP through those tools using the playbooks below.",
    "",
    INTRO,
    "",
    core,
    "",
  ].join("\n");

  const cursor = [
    "---",
    "description: ASAP invoicing via MCP — French compliance playbooks (devis, factures, signature)",
    "alwaysApply: false",
    "---",
    "",
    `${GEN_NOTICE}`,
    "",
    INTRO,
    "",
    core,
    "",
  ].join("\n");

  const windsurf = [
    `${GEN_NOTICE}`,
    "",
    "# ASAP invoicing (Windsurf rules)",
    "",
    INTRO,
    "",
    core,
    "",
  ].join("\n");

  return [
    { path: join(ROOT, "claude", "skills", "asap-invoicing", "SKILL.md"), content: claude },
    { path: join(ROOT, "chatgpt", "instructions.md"), content: chatgpt },
    { path: join(ROOT, "cursor", "asap.mdc"), content: cursor },
    { path: join(ROOT, "windsurf", "asap.md"), content: windsurf },
  ];
}

// Write outputs when invoked directly (`node scripts/build.mjs`).
if (import.meta.url === `file://${process.argv[1]}`) {
  for (const { path, content } of buildOutputs()) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
    process.stdout.write(`wrote ${path}\n`);
  }
}
