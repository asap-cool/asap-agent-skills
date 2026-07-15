// Drift guard (the cross-repo seam). Two checks, both fail the process:
//
// 1. Every tool/prompt name the playbooks reference must still exist in
//    `catalogue.json` (a snapshot of the ASAP MCP surface). A tool renamed or
//    removed upstream turns this red — the signal to update the playbooks and
//    re-pin the catalogue.
// 2. The committed client files must match what `build.mjs` generates from
//    `playbook/` (single-source discipline — no hand edits under claude/ etc.).
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildOutputs } from "./build.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

/** snake_case / kebab-case field & flag names that are NOT tools or prompts. */
const PARAM_ALLOWLIST = new Set([
  "operation_nature",
  "vat_rate",
  "amount_ttc",
  "idempotency_key",
  "dry_run",
  "confirm",
  "preview",
  "percentage",
  "items",
  "next_generation_date",
  "hint",
  "retryable",
]);

const errors = [];

// --- Load the pinned catalogue --------------------------------------------
const catalogue = JSON.parse(readFileSync(join(ROOT, "catalogue.json"), "utf8"));
const known = new Set([...catalogue.tools.map((t) => t.name), ...catalogue.prompts]);

// --- Check 1: referenced names exist --------------------------------------
const playbookFiles = readdirSync(join(ROOT, "playbook")).filter((f) => f.endsWith(".md"));
for (const file of playbookFiles) {
  const text = readFileSync(join(ROOT, "playbook", file), "utf8");
  // Inline-code spans that look like an identifier (snake or kebab case).
  const tokens = text.match(/`([a-z][a-z0-9_-]*)`/g) ?? [];
  for (const raw of tokens) {
    const token = raw.slice(1, -1);
    if (!token.includes("_") && !token.includes("-")) continue; // plain word
    if (known.has(token) || PARAM_ALLOWLIST.has(token)) continue;
    errors.push(
      `playbook/${file}: \`${token}\` is not a known tool/prompt (catalogue v${catalogue.version}) ` +
        `nor an allowlisted param. Renamed upstream? Update the playbook or PARAM_ALLOWLIST.`,
    );
  }
}

// --- Check 2: generated outputs are up to date ----------------------------
for (const { path, content } of buildOutputs()) {
  let onDisk = "";
  try {
    onDisk = readFileSync(path, "utf8");
  } catch {
    errors.push(`${path.replace(ROOT, "")}: missing — run \`npm run build\`.`);
    continue;
  }
  if (onDisk !== content) {
    errors.push(`${path.replace(ROOT, "")}: stale — run \`npm run build\`.`);
  }
}

if (errors.length) {
  process.stderr.write(`drift check FAILED:\n- ${errors.join("\n- ")}\n`);
  process.exit(1);
}
process.stdout.write(
  `drift check OK — ${known.size} known names, ${playbookFiles.length} playbooks, outputs current.\n`,
);
