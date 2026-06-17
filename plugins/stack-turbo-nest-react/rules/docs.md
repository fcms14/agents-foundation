# Documentation model (C4 over the monorepo)

The stack's concrete documentation map. This extends the agnostic doc discipline in `delivery-team`'s `docs.md` (JSDoc, living docs, proximity, Mermaid authoring) with *where* each doc lives and *which* diagram it carries for this Turborepo (`apps/`, `services/`, `packages/`).

## The documentation map (layered C4)

One diagram level per scope, so every README answers exactly one question and they never overlap. Each level lives at a fixed location:

| Level | Location | Diagram | Answers |
| --- | --- | --- | --- |
| **C4 L1 — System Context** | **monorepo root `README.md`** | the whole system as one box + the people who use it (your user roles) and external systems it talks to (e.g. an LLM, a broker, a third-party API), **plus a container/service map showing how the services/apps/DBs/broker communicate and depend on each other** | "what is this system, who uses it, and how do its services talk?" |
| **C4 L2 — Container** | **each service root `services/<svc>/README.md`** | this service as a container: its external dependencies (its DB, broker, queues, other services it calls or is called by) and the **modules it contains** as a high-level block map | "what is this service, what does it depend on, and what are its parts?" |
| **C4 L3 — Component** | **each feature module `services/<svc>/src/<module>/README.md`** | the components inside the module (controller / service / repository / processor / gateway / guards …) and their relationships and ports | "how is this module built internally?" |
| **ERD** | **the service's db README `services/<svc>/src/db/README.md`** | an entity-relationship diagram of that service's tables/relations (Mermaid `erDiagram`) + schema notes (any extension specifics — e.g. PostGIS/Timescale — and the migration list) | "what is the data model?" |

**Rules:**
- The diagram a README carries is the **C4 level for its scope** (root→L1, service→L2, module→L3). Do not put a lower level's detail in a higher level's README.
- **Sequence diagrams stay** and are **complementary**, not the C4 diagram: each module README keeps a **sequence diagram of its core flow**; a service README may add one sequence for its single most important cross-module flow.
- Every module that holds **feature logic** gets an L3 README. **Wiring-only folders are exempt**: `e2e`, `health`, `swagger`, bootstrap/`main`. A thin module that only re-exposes a shared component gets a **short README that points to the shared module's README** rather than duplicating it.

## Shared libraries (`packages/`) — reference docs, not C4

`packages/*` are libraries, not deployable services, so they do **not** use the C4 service model. Document them as **reference docs** aimed at a developer who will consume them:

- **Package root `packages/<pkg>/README.md`**: what the package is for, its **public surface** (the exports apps/services import), a one-line index of its modules, and a minimal wiring/usage example.
- **Per public module `packages/<pkg>/src/<module>/README.md`**: what the module provides, its **key exports**, **how to use it** (a short snippet), and notable gotchas/config (env vars it reads, ordering constraints, fail-prepared behavior). Add a small Mermaid diagram only when it genuinely clarifies relationships.

## ERD is updated on every migration

The **ERD is part of the schema change, not an afterthought.** Whenever a migration is added or a Drizzle schema changes shape (table/column/relation/index/hypertable), the service's `src/db/README.md` ERD and schema notes are updated **in the same change**. This is enforced mechanically: the `docs-gate` (husky pre-commit, `.claude/scripts/validate-docs.mjs` — shipped by this stack plugin) refuses a commit that stages a migration for a service without also staging a README under that service. Run `/delivery-team:docs-sync <service> --erd` to refresh an ERD from the live schema.
