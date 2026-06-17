# Testing

## Layers

- **Unit tests** — pure logic, services, utils, components. Fast, isolated, mock the ports. This is the default and largest layer.
- **E2E tests** — exercise real flows through the running stack (API endpoints, and key frontend journeys). Cover the happy path of every shipped feature plus its critical failure modes.
- **Load tests — Artillery.** Every performance-sensitive endpoint (e.g. a high-traffic ingestion, feed, or compute-heavy endpoint) gets an Artillery scenario asserting latency/throughput targets. Load configs live in the repo and run in CI or on demand.

**Ownership:** the **implementing agent** writes the feature's **unit + API-e2e** tests — they are part of "done", never deferred to a separate pass. The **`qa` specialist** owns the layers a feature author shouldn't carry inline — **load (Artillery), full-stack journeys (Playwright), resilience/degradation, and coverage-debt campaigns** — and does **not** re-author feature tests. QA is dispatched per need (a perf-sensitive endpoint, a slice milestone, a debt task), not as a stage every feature passes through.

## When each layer runs (cadence)

- **Unit** — written **with the code**, in the same task. Always.
- **API e2e** (supertest against the Nest app + a test DB) — written **per feature, in the task that ships the endpoint/flow** (happy path + key failure modes). Not deferred to a final pass. It is an **acceptance criterion** for any task exposing an endpoint.
- **Full-stack e2e** (Playwright over the running stack, e.g. a critical journey like sign-up → activate → first action) — at **vertical-slice milestones**, a handful of key journeys; not every task.
- **Artillery (load)** — **just-in-time per performance-sensitive endpoint**, written in the task that ships it (e.g. a high-traffic ingestion, batch, or compute-heavy endpoint). The Artillery **harness/config is scaffolded early** so adding a scenario is cheap; there is **no single final load-test task** and we do **not** wait until the end.

## Conventions

- Test files sit next to the unit under test (`*.spec.ts`) or in the app's e2e folder.
- Resilience is tested: assert that a failing optional dependency (LLM, broker) degrades gracefully instead of breaking the flow.
- A feature is not "done" until its happy path is covered by tests and the suite is green. See the task lifecycle in `workflow.md`.

## Coverage gate

- **Minimum acceptable: 70%** (lines/functions/branches/statements). CI fails below it (`test:coverage`, thresholds in each service's `vitest.config.ts`). **Goal: 85%.**
- Wiring-only files (modules, bootstrap/`main.ts`) are excluded so the metric reflects logic, not framework glue.
- The gate is enforced in CI, not in the pre-commit hook (keep commits fast); run `pnpm --filter <svc> test:coverage` locally to check.

## Mindset

Test behavior and contracts, not implementation details. A refactor that keeps behavior should keep tests green.
