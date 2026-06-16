# Documentation

## In-code documentation

- **JSDoc only, and only above** classes, modules, and public methods/functions — describe purpose, params, return, and notable side effects.
- **Avoid comments inside method bodies.** An inline comment usually signals a method doing too much — extract and name instead. The code should read as the explanation.
- Keep JSDoc honest and current; a stale doc is worse than none.

## The documentation map (C4 model)

Documentation is a **layered C4 model**, one diagram level per scope, so every README answers exactly one question and they never overlap. Each level lives at a fixed location:

| Level | Location | Diagram | Answers |
| --- | --- | --- | --- |
| **C4 L1 — System Context** | **monorepo root `README.md`** | the whole system as one box + the people (operator, driver, m2m client) and external systems (LLM, broker, maps), **plus a container/service map showing how the services/apps/DBs/broker communicate and depend on each other** | "what is this system, who uses it, and how do its services talk?" |
| **C4 L2 — Container** | **each service root `services/<svc>/README.md`** | this service as a container: its external dependencies (its DB, broker, queues, other services it calls or is called by) and the **modules it contains** as a high-level block map | "what is this service, what does it depend on, and what are its parts?" |
| **C4 L3 — Component** | **each feature module `services/<svc>/src/<module>/README.md`** | the components inside the module (controller / service / repository / processor / gateway / guards …) and their relationships and ports | "how is this module built internally?" |
| **ERD** | **the service's db README `services/<svc>/src/db/README.md`** | an entity-relationship diagram of that service's tables/relations (Mermaid `erDiagram`) + schema notes (PostGIS/Timescale specifics, migration list) | "what is the data model?" |

**Rules:**
- The diagram a README carries is the **C4 level for its scope** — this *replaces* the old generic "architecture diagram" wording (root→L1, service→L2, module→L3). Do not put a lower level's detail in a higher level's README.
- **Sequence diagrams stay** and are **complementary**, not the C4 diagram: each module README keeps a **sequence diagram of its core flow**; a service README may add one sequence for its single most important cross-module flow. Sequence ≠ the C4 component/container diagram — keep both, each doing its job.
- Every module that holds **feature logic** gets an L3 README. **Wiring-only folders are exempt**: `e2e`, `health`, `swagger`, bootstrap/`main`. A thin module that only re-exposes a shared component (e.g. the per-audience reporting modules over a shared reporting repository) gets a **short README that points to the shared module's README** rather than duplicating it.
- Each README opens with a short **product-level explanation** — what it does and why, in plain language — before the diagram(s).

## Shared libraries (`packages/`) — reference docs, not C4

`packages/*` are libraries, not deployable services, so they do **not** use the C4 service model. Document them as **reference docs** aimed at a developer who will consume them:

- **Package root `packages/<pkg>/README.md`**: what the package is for, its **public surface** (the exports apps/services import), a one-line index of its modules, and a minimal wiring/usage example.
- **Per public module `packages/<pkg>/src/<module>/README.md`**: what the module provides, its **key exports** (classes, decorators, guards, providers, helpers), **how to use it** (a short code snippet), and notable gotchas/config (env vars it reads, ordering constraints, fail-prepared behavior). Add a small Mermaid diagram only when it genuinely clarifies relationships — optional, not required.
- Same living-doc discipline (keep current with the code) and the Mermaid authoring rules below when a diagram is included.

Examples in this repo: `@delivery/nest-common` (security, observability, redis, cors, swagger, common), `@delivery/shared`, `@delivery/ui`, `@delivery/i18n`.

## ERD is updated on every migration

The **ERD is part of the schema change, not an afterthought.** Whenever a migration is added or a Drizzle schema changes shape (table/column/relation/index/hypertable), the service's `src/db/README.md` ERD and schema notes are updated **in the same change**. This is enforced mechanically: the `docs-gate` (husky pre-commit, `.claude/scripts/validate-docs.mjs`) refuses a commit that stages a migration for a service without also staging a README under that service. Run `/delivery-team:docs-sync <service> --erd` to refresh an ERD from the live schema.

## Rule of proximity

Documentation lives as close to what it describes as possible: L1 at the repo root, L2 at the service root, L3 in the module folder, the ERD in the db folder. Distance between code and its doc is how docs rot. A file in the wrong place (e.g. a service-overview doc parked under a `docs/` subfolder, or a module note at the service root) is a bug — move it to its canonical location.

## Mermaid authoring (avoid silent parse errors)

Diagrams must actually render. These rules prevent the common parser failures:

- **Line breaks use `<br/>`, never `\n`** — `N["foo<br/>bar"]`, not `N[foo\nbar]`.
- **Quote any node label containing special characters** (`/`, `@`, `:`, `(`, `)`, `.`, `·`, …): `AKG["ApiKeyGuard<br/>@delivery/nest-common"]`. Quoting is always safe, so quote by default.
- **Alias subgraph titles that contain special characters**: `subgraph SA["services/auth"]`, not `subgraph services/auth`.
- **Never name a sequence-diagram participant after a keyword** — `opt`, `alt`, `else`, `end`, `loop`, `par`, `and`, `note`, `activate`, `rect`, `critical`, `break` (case-insensitive). A participant `OPT` collides with the `opt` fragment and breaks parsing; use `OPTSVC`/`OS` instead.
- **No `;` inside labels or messages** — it is a statement separator; use `,` or `—`.
- **`erDiagram` relations** use crow's-foot syntax (`ORDERS ||--o{ ROUTE_STOPS : has`) and quoted attribute types only when they contain special characters — keep entity names UPPER_SNAKE matching the table name.
