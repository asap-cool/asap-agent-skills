# ASAP agent skills

Playbooks and client skills that teach AI agents to drive the
[ASAP](https://asap.cool) platform through its **MCP server** — French invoicing,
contacts and e-signature — correctly: grounding first, FR compliance
(`operation_nature`, amounts in cents), and NF203 sealing (a finalized document is
immutable).

These files do **not** contain the tools. They teach an agent HOW to combine the
tools the ASAP MCP server already exposes. Connect that server first.

## Layout

```
playbook/     # SINGLE SOURCE OF TRUTH — the workflow prose (edit here)
catalogue.json# pinned snapshot of the ASAP MCP surface (tools + prompts + resources)
claude/       # Claude Code / Desktop plugin (skills/asap-invoicing/SKILL.md) — GENERATED
chatgpt/      # custom GPT instructions — GENERATED
cursor/       # Cursor rule (asap.mdc) — GENERATED
windsurf/     # Windsurf rule (asap.md) — GENERATED
scripts/      # build (playbook → clients) + drift guard
```

Everything under `claude/ chatgpt/ cursor/ windsurf/` is generated from `playbook/`.
Never hand-edit them — edit the playbook and run `npm run build`.

## Install

First connect the ASAP MCP server (an ASAP API key with the `contacts` / `invoice` /
`signature` scopes). Then, per client:

- **Claude Code / Desktop** — install this repo as a plugin (it ships
  `claude/.claude-plugin/plugin.json` + the `asap-invoicing` skill).
- **ChatGPT** — paste `chatgpt/instructions.md` into a custom GPT's *Instructions* and
  add `https://mcp.asap.cool` as an Action/connector.
- **Cursor** — copy `cursor/asap.mdc` into your project's `.cursor/rules/`.
- **Windsurf** — copy `windsurf/asap.md` into your Windsurf rules.

## Single source & drift guard

The playbooks reference tools by name (`create_quote`, `finalize_invoice`, …). If the
ASAP MCP server renames or removes one, the skills would silently point at a dead
tool. `scripts/check-drift.mjs` prevents that:

1. Every tool/prompt name referenced in `playbook/` must exist in `catalogue.json`.
2. The committed client files must match what `build.mjs` regenerates from `playbook/`.

```bash
npm run build   # regenerate client files from playbook/
npm run check   # fail if a referenced name is unknown, or a client file is stale
npm test        # build + check (what CI runs)
```

When the ASAP MCP catalogue changes, refresh the pin:

```bash
cp ../asap-platform/apps/mcp/catalogue.json ./catalogue.json
npm run check
```

## License

MIT — see [LICENSE](./LICENSE).
