---
description: Bootstrap a repository to use the delivery foundation — scaffold the work/ kanban and docs/ tree, materialize the rules, wire the commit-time gates, and write a starter CLAUDE.md
---

Bootstrap the **current repository** to run the delivery foundation. A plugin contributes agents/commands/hooks, but it cannot create project files — this command does that one-time setup. Run it once, right after installing the plugin in a new repo.

The plugin's own files live at **`${CLAUDE_PLUGIN_ROOT}`** (the install dir). Claude Code substitutes this variable inline wherever it appears in this command body, so reference the plugin's files through it directly (e.g. `${CLAUDE_PLUGIN_ROOT}/templates/TASK-TEMPLATE.md`).

## Steps

1. **Scaffold the `work/` kanban.** Create the folders `work/{backlog,ready,active,review,done}/` and a starter `work/ROADMAP.md` (a title + an empty Task-graph table with the columns `# | Task | agent | depends on | parallel | state`). Copy the task template: `${CLAUDE_PLUGIN_ROOT}/templates/TASK-TEMPLATE.md` → `work/TASK-TEMPLATE.md`. The board ships **empty** — it is product state, not foundation config.

2. **Scaffold the `docs/` tree.** Create `docs/` at the repo root (parallel to `work/`) and copy the docs templates preserving structure: `${CLAUDE_PLUGIN_ROOT}/templates/docs/` → `docs/`. This seeds `docs/adr/` with the ADR template (`0000-template.md`), a bootstrap record (`0001-record-architecture-decisions.md`), and the index (`README.md`) — a working base contributors maintain over time. The ADR process lives in `.claude/rules/adr.md`. **Do not overwrite an existing `docs/adr/`** — if it already has records, only add the template files that are missing and leave the index alone.

3. **Materialize the rules** so the agents' `.claude/rules/*` references resolve. Copy `${CLAUDE_PLUGIN_ROOT}/rules/*.md` into the repo's `.claude/rules/`. If a stack plugin is installed (e.g. `stack-turbo-nest-react`), copy its `rules/*.md` too. (Trade-off: these are **copies versioned with the project**, so a plugin upgrade does not auto-update them — re-run `/delivery-team:init --refresh-rules` to re-copy after upgrading. This is deliberate: a project pins the conventions it was built against.)

4. **Wire the commit-time gates (git-level, non-bypassable).** The agent-time gates (`gate-done`, `format`, `guard-bash`) already come from the plugin's `hooks.json` automatically — no action needed. For the **commit-time** gates, set up a git hook:
   - Ensure husky is present (`pnpm dlx husky init` or the repo's equivalent; if the project doesn't use husky, write a plain `.git/hooks/pre-commit` instead).
   - Copy the **agnostic board gate** `${CLAUDE_PLUGIN_ROOT}/scripts/validate-board.mjs` into the repo's `.claude/scripts/` (the git hook runs outside Claude Code, so it cannot use `${CLAUDE_PLUGIN_ROOT}` — it needs local copies).
   - **If a stack plugin ships commit-gate scripts, copy those too.** Stack-specific gates live in the stack plugin (e.g. `stack-turbo-nest-react`'s `scripts/validate-docs.mjs`, the migration↔ERD gate). Locate the installed stack plugin in the Claude Code plugin cache (`~/.claude/plugins/`) and copy each `scripts/*.mjs` it provides into `.claude/scripts/`.
   - Append to `.husky/pre-commit` (after any existing lint-staged line) **one line per validator you copied** — always the board gate, plus any stack gate:
     ```
     node .claude/scripts/validate-board.mjs --staged
     node .claude/scripts/validate-docs.mjs --staged   # only if the stack docs-gate was copied
     ```

5. **Write a starter `CLAUDE.md`.** If none exists, create one with the golden rules (English-only artifacts; Conventional Commits, single imperative line, no AI signature; JSDoc-only comments; SOLID/KISS/YAGNI/fail-prepared) and a short "How work is executed" section pointing at `.claude/rules/workflow.md` and the `/delivery-team:task-new → /delivery-team:task-start → /delivery-team:apply-verdict` flow. If a `CLAUDE.md` already exists, **append a short "Delivery foundation" section** rather than overwriting it.

6. **Report** what was created (`work/`, `docs/`, copied rules, gate wiring, CLAUDE.md) and the next step: `/delivery-team:task-new <goal>` to specify the first task.

## Flags

- `--refresh-rules` — only re-copy the plugin rules into `.claude/rules/` (use after upgrading the plugin). Do not touch `work/`, CLAUDE.md, or the gates.
- `--no-gates` — skip the husky/commit-gate wiring (for repos that enforce the gate in CI instead).

Do not commit — leave everything staged for the user to review. English only.
