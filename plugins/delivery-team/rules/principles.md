# Core Principles

These are non-negotiable defaults. When a rule here conflicts with a quick hack, the rule wins unless the user explicitly overrides it for a task.

## Design principles

- **SOLID** — every class/module has one reason to change. Depend on abstractions, not concretions. Keep interfaces small and segregated.
- **KISS** — the simplest design that satisfies the spec. Prefer boring, readable code over clever code.
- **YAGNI** — build only what the current task requires. No speculative abstractions, no "we might need it later" parameters.
- **Fail-prepared** — assume every external dependency (LLM, broker, DB, third-party API) will fail. Degrade gracefully; never let a non-critical dependency block the core flow. See `resilience` guidance in `backend.md`.

## Single responsibility for cross-cutting concerns

- Logging, metrics, auth, rate-limiting, and i18n are **cross-cutting** — they live in dedicated, reusable units (interceptors, guards, middlewares, providers), never copy-pasted into business code.
- A concern that cannot ride the standard pipeline (e.g. a BullMQ worker outside the HTTP interceptor) must still delegate to the same responsibility-owning class — extend/implement it, do not reinvent it.

## Least privilege

- **Every credential, role, and token grants the minimum needed — nothing rides as superuser/root "to be safe".** A leaked secret or an injection must have a small blast radius by construction.
- **Database**: the application runs as a **limited DB user** (CRUD on its own tables only — no DDL, not the owner), so it can never `DROP`/`ALTER` schema or read another service's data. **Schema migrations run as a separate, DDL-capable user** owned by the deploy pipeline — but still **not a cluster superuser** (no role/DB creation). Two roles, two connection strings. See `backend.md` (access) and `delivery.md` (pipeline).
- The same principle extends to tokens, API keys, broker users, and cloud IAM: scope to the operation, prefer revocable + expiring credentials, and separate the "run" identity from the "deploy/admin" identity.

## Repository conventions

- **Language: English.** Everything committed is English — code, identifiers, docs, specs, README, `.claude/`, comments, commit messages, `/work` task files. Conversation with the user may be in another language; the artifact is always English.
- **Commits: Conventional Commits, single line, no AI signature.** Prefix with a type (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `build:`, `perf:`), with an optional scope (`feat(order-routing): …`). One concise imperative line. No `Co-Authored-By` / "Generated with Claude" trailers.
- **Comments: minimal.** See `docs.md` — JSDoc above classes/modules/methods only; avoid comments inside method bodies (they usually signal a function that should be split).

## Decision heuristic

When unsure between two approaches: pick the one that is (1) easier to delete, (2) easier to test, (3) fails more loudly in dev and more softly in prod.
