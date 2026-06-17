# Testing tooling (stack)

The concrete test stack that implements the discipline in `delivery-team`'s `testing.md`. (Names are this stack's choices — swap them if your stack differs.)

## Tools

- **Unit + API e2e — Vitest.** Unit specs live next to the unit under test (`*.spec.ts`). API e2e uses **supertest** against the running Nest app + a test DB, covering the happy path plus key failure modes.
- **Full-stack e2e — Playwright** over the running stack (`docker compose up`), exercised at vertical-slice milestones.
- **Load — Artillery.** Scenarios for performance-sensitive endpoints with explicit latency/throughput assertions; configs live in the repo and run in CI or on demand.

## Coverage

- **Minimum acceptable: 70%** (lines/functions/branches/statements); **goal: 85%**. Thresholds live in each service's `vitest.config.ts`; CI fails below the minimum (`test:coverage`).
- Wiring-only files (modules, bootstrap/`main.ts`) are excluded so the metric reflects logic, not framework glue.
- Enforced in **CI**, not the pre-commit hook (keep commits fast). Run `pnpm --filter <svc> test:coverage` locally to check.

## Conventions

- Resilience tests assert a failing optional dependency (e.g. an LLM or a broker) degrades gracefully instead of breaking the flow.
- Tests live next to the unit (`*.spec.ts`) or in the app's e2e/load folder.
