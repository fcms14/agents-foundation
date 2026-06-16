---
description: Refresh living documentation to match the code — dispatch the docs agent for the C4 README at a scope (root / service / module) and/or the ERD
---

Refresh living docs for: **$ARGUMENTS** — one of:

- `root` — the monorepo root `README.md` (C4 **L1** system context + the service/container communication map).
- `<service>` — `services/<svc>/README.md` (C4 **L2** container) + verify every feature module has its L3 README + the db ERD.
- `<service>/<module>` — that module's `README.md` (C4 **L3** component + sequence of the core flow).
- `<service> --erd` — just regenerate the ERD in `services/<svc>/src/db/README.md` from the live Drizzle schema + migration list.
- `all` — every service and the root.

Steps:
1. Resolve the scope to concrete paths. Read the **actual code/schema** first (modules, controllers, repositories, `src/db/schema`, migrations) — document what IS, not intent.
2. Dispatch the **docs** agent (`model: "sonnet"`) with the scope and the C4 level for it (root→L1, service→L2, module→L3, db→ERD). It obeys `.claude/rules/docs.md` (the C4 map + Mermaid authoring rules), keeps sequence diagrams as a complement, and **moves any misplaced doc** to its canonical location instead of duplicating.
3. For broad scopes, dispatch one docs agent **per service in parallel** (disjoint folders) — instruct them to edit files only (no git), then you review and commit.
4. Report what was created/updated/moved and flag any code↔doc mismatch the agent found (propose a fix task for each).

This is the same refresh the **docs-gate** asks for after a migration: `/delivery-team:docs-sync <service> --erd`.
