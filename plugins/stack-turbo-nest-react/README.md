# stack-turbo-nest-react — opinionated stack layer (v0, as-built)

The **technology** half of the foundation: the implementer agents and the conventions for a specific stack. This v0 is the **as-built** stack of `poc-delivery-watch-tower` (NestJS + React/Turborepo + Drizzle + Railway) — a working baseline, not yet your refined preferences.

Depends on **delivery-team** (the process layer) — declared in `plugin.json` (`"dependencies": ["delivery-team"]`), so installing this pulls it in. On older Claude Code versions that don't resolve plugin dependencies, install both explicitly.

## What's inside

| Component | Files | Role |
| --- | --- | --- |
| **Agents** | `agents/` — backend, frontend, infra | the implementers. They obey the stack rules below + the agnostic rules from delivery-team. |
| **Rules** | `rules/` — architecture, backend, frontend, delivery, docs | the stack conventions (NestJS, React/design-system, Turborepo, Railway/CI) + the C4 documentation model & ERD-on-migration rule. |
| **Scripts** | `scripts/` — `validate-docs.mjs` | the **stack-specific commit gate**: refuses a commit that stages a migration under `services/<svc>/…` without updating that service's ERD/README. `/delivery-team:init` copies it into the consumer's `.claude/scripts/` and wires it into the pre-commit alongside the agnostic board gate. |

## Status & roadmap (deferred decisions)

This is a **v0 baseline captured from a real product**, kept so future agents maintain consistency with what exists. The opinionated future work (tracked in the source repo's `docs/foundation/README.md` and memory):

- **Name and codify the de-facto design pattern** used in the source repo into explicit conventions (folder shape, file naming, import boundaries) — reacting to concrete likes/dislikes rather than inventing.
- **Add a structure-lint** (ESLint boundaries / dependency-cruiser / a `structure-lint.mjs`) so design-organization is enforced by a deterministic gate, not left to the reviewer agent.
- **Trim stack assumptions** out of the delivery-team agents (so the process layer is truly framework-agnostic and this plugin owns all the NestJS/React specifics).

Until then, treat the rules here as the current contract; refine them in the new product repo.

## Install

```
/plugin install delivery-team@agents-foundation
/plugin install stack-turbo-nest-react@agents-foundation
/delivery-team:init
```
