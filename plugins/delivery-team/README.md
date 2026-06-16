# delivery-team — the agnostic delivery process

The "company in a box": a team of role agents, the `work/` markdown kanban they execute against, and the **deterministic gates** that keep the board honest. Stack-agnostic — it carries *how work flows*, not *which framework you use*. Pair it with an opinionated stack plugin (e.g. `stack-turbo-nest-react`).

## What's inside

| Component | Files | Role |
| --- | --- | --- |
| **Agents** | `agents/` — planner, reviewer, docs, qa, product-delivery-manager | the process roles. The implementer agents (backend/frontend/infra) live in the **stack** plugin. |
| **Commands** | `commands/` — `init`, `task-new`, `task-start`, `task-ship`, `task-promote`, `apply-verdict`, `docs-sync` | the workflow skills. |
| **Hooks** | `hooks/hooks.json` + `hooks/*.sh` | agent-time PreToolUse gates (`gate-done`, `guard-bash`) + PostToolUse `format`, wired via `${CLAUDE_PLUGIN_ROOT}`. |
| **Scripts** | `scripts/` — `validate-board.mjs`, `validate-docs.mjs`, `apply-verdict.mjs` | the deterministic engines behind the gates and verdict application. |
| **Rules** | `rules/` — principles, workflow, adr, docs, testing, observability | the agnostic conventions the agents obey. |
| **Templates** | `templates/TASK-TEMPLATE.md` | the standardized task shape (Spec/AC checklist/Verdict/Log). |

## Core principle

**Agents create and judge; deterministic steps apply state and hooks enforce it.** The reviewer returns a structured verdict; `/delivery-team:apply-verdict` ticks the Acceptance Criteria and moves the task; a board gate refuses `done/` without a verdict + ticked criteria; a docs gate refuses a migration without an ERD/docs update. Bookkeeping is code, not an agent's memory.

## Install & bootstrap

```
/plugin marketplace add <owner>/<marketplace-repo>
/plugin install delivery-team@agents-foundation
/delivery-team:init                      # one-time: scaffolds work/, rules, gates, CLAUDE.md in the current repo
```

`rules/` and `scripts/` are not native plugin component types — they ride along as files. The agents reference `.claude/rules/*` and the commit-gate runs `.claude/scripts/*`; **`/delivery-team:init` materializes both into the consumer repo** (see `commands/init.md` for the exact mechanism and the update trade-off).

## v0 caveat — not yet fully stack-agnostic

This layer is *intended* to be process-only, but the v0 still carries residual stack assumptions (tracked for removal):

- The **reviewer** agent checks for stack-specific concerns (throttler, honeypot, cursor pagination, `packages/shared`, design tokens/i18n). Installed without a stack plugin, those checks won't apply.
- The **docs gate** (`scripts/validate-docs.mjs`) hard-codes a `services/<svc>/.../migrations/*.sql` + service-README layout, i.e. a NestJS/Turborepo-style monorepo. On a different repo shape it simply never triggers (fail-open), so it's harmless but inert.

Both are deliberate deferrals: the opinionated specifics will be trimmed out of this layer once the `stack-*` plugins own them. Until then, pair this with `stack-turbo-nest-react` for the full experience.
