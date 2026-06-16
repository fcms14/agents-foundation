---
description: Refresh living documentation to match the code — dispatch the docs agent at a scope, following the project's documentation model (as defined by the applicable docs rules)
---

Refresh living docs for: **$ARGUMENTS** — a scope to bring back in sync with the code.

The **documentation model** (where each doc lives and which diagram it carries) is defined by the applicable `.claude/rules/*`. When a stack plugin is installed it typically defines a layered model; for the `stack-turbo-nest-react` C4 model the scopes are:

- `root` — the monorepo root `README.md` (C4 **L1** system context + the service/container communication map).
- `<service>` — `services/<svc>/README.md` (C4 **L2** container) + verify every feature module has its L3 README + the db data-model doc.
- `<service>/<module>` — that module's `README.md` (C4 **L3** component + sequence of the core flow).
- `<service> --erd` — regenerate the ERD in `services/<svc>/src/db/README.md` from the live schema + migration list.
- `all` — every service and the root.

(For a different stack, use the scopes its docs rule defines.)

Steps:
1. Resolve the scope to concrete paths. Read the **actual code/schema** first — document what IS, not intent.
2. Dispatch the **docs** agent (`model: "sonnet"`) with the scope and the documentation model from the applicable rules. It obeys the agnostic `docs.md` (proximity + Mermaid authoring) and the stack's doc model, keeps sequence diagrams as a complement, and **moves any misplaced doc** to its canonical location instead of duplicating.
3. For broad scopes, dispatch one docs agent **per service/area in parallel** (disjoint folders) — instruct them to edit files only (no git), then you review and commit.
4. Report what was created/updated/moved and flag any code↔doc mismatch the agent found (propose a fix task for each).

This is the same refresh the **docs-gate** asks for after a migration: `/delivery-team:docs-sync <service> --erd`.
