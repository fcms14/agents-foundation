# delivery-team — the agnostic delivery process

The "company in a box": a team of role agents, the `work/` markdown kanban they execute against, and the **deterministic gates** that keep the board honest. Stack-agnostic — it carries *how work flows*, not *which framework you use*. Pair it with an opinionated stack plugin (e.g. `stack-turbo-nest-react`).

## What's inside

| Component | Files | Role |
| --- | --- | --- |
| **Agents** | `agents/` — planner, reviewer, docs, qa, product-delivery-manager | the process roles. The implementer agents (backend/frontend/infra) live in the **stack** plugin. |
| **Commands** | `commands/` — `init`, `task-new`, `task-start`, `task-ship`, `task-promote`, `apply-verdict`, `docs-sync` | the workflow skills. |
| **Hooks** | `hooks/hooks.json` + `hooks/*.sh` | agent-time PreToolUse gates (`gate-done`, `guard-bash`) + PostToolUse `format`, wired via `${CLAUDE_PLUGIN_ROOT}`. |
| **Scripts** | `scripts/` — `validate-board.mjs`, `apply-verdict.mjs` | the deterministic engines behind the board gate and verdict application (both stack-agnostic). Stack-specific gates ship in the stack plugin. |
| **Rules** | `rules/` — principles, workflow, adr, docs, testing, observability | the agnostic conventions the agents obey. |
| **Templates** | `templates/TASK-TEMPLATE.md` + `templates/docs/` | the standardized task shape (Spec/AC checklist/Verdict/Log) and the `docs/adr/` scaffold (ADR template, bootstrap record, index) that `/delivery-team:init` lays down. |

## Core principle

**Agents create and judge; deterministic steps apply state and hooks enforce it.** The reviewer returns a structured verdict; `/delivery-team:apply-verdict` ticks the Acceptance Criteria and moves the task; a board gate refuses `done/` without a verdict + ticked criteria; a docs gate refuses a migration without an ERD/docs update. Bookkeeping is code, not an agent's memory.

### Agent vs. skill vs. rule vs. hook

The split isn't arbitrary — each form is chosen by what the work needs:

- **Agent** — needs fresh/isolated context, parallelism, scoped tools, or creative judgment. *(planner, implementers, docs, qa, the reviewer's judgment)*
- **Skill** (slash command) — a deterministic procedure or state transition, run in-context. *(`task-*`, `apply-verdict`, `task-promote`)*
- **Rule** — an always-on constraint the agents obey. *(principles, conventions, "no `done/` without verdict + ACs")*
- **Hook** — must be mechanical and non-bypassable. *(`gate-done`, `format`, `guard-bash`, the commit gate)*

That's why the **reviewer** spans three forms: an *agent* judges, a *skill* (`apply-verdict`) applies the verdict, and a *hook* enforces it — so judgment never touches the bookkeeping.

## Install & bootstrap

```
/plugin marketplace add <owner>/<marketplace-repo>
/plugin install delivery-team@agents-foundation
/delivery-team:init                      # one-time: scaffolds work/ + docs/, rules, gates, CLAUDE.md in the current repo
```

`rules/` and `scripts/` are not native plugin component types — they ride along as files. The agents reference `.claude/rules/*` and the commit-gate runs `.claude/scripts/*`; **`/delivery-team:init` materializes both into the consumer repo** (see `commands/init.md` for the exact mechanism and the update trade-off).

## Stack-agnostic by construction

This layer carries no stack assumptions:

- The **reviewer** is **rule-driven** — it checks against whatever `.claude/rules/*` are present, so stack opinions (throttler, cursor pagination, tokens/i18n, …) live in the stack plugin's rules, not hard-coded here.
- The **commit gates** it ships are agnostic: `validate-board.mjs` checks only the board invariant (verdict + ticked Acceptance Criteria). Stack-specific gates — e.g. the migration↔ERD docs gate (`validate-docs.mjs`) — ship in the stack plugin, and `/delivery-team:init` wires whichever gates the installed plugins provide.

- The **docs** agent and `docs.md` rule carry only universal doc discipline (JSDoc, living docs, proximity, Mermaid authoring); the concrete documentation *model* (e.g. a C4 map over services/packages, ERDs) is a stack rule the docs agent reads.

Installing this layer alone produces a fully working, framework-neutral delivery process.
