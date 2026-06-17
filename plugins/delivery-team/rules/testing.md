# Testing

Universal testing discipline. The concrete tools (test runner, e2e/load frameworks, coverage config) are a stack concern — see the stack's `testing-tooling.md` when one is installed.

## Layers

- **Unit tests** — pure logic, services, utils, components. Fast, isolated, mock the ports. This is the default and largest layer.
- **Integration / e2e tests** — exercise real flows through the running app (API endpoints, and key frontend journeys). Cover the happy path of every shipped feature plus its critical failure modes.
- **Load tests** — every performance-sensitive endpoint (e.g. a high-traffic ingestion, feed, or compute-heavy endpoint) gets a load scenario asserting latency/throughput targets, kept in the repo and run in CI or on demand.

**Ownership:** the **implementing agent** writes the feature's **unit + API-e2e** tests — they are part of "done", never deferred to a separate pass. The **`qa` specialist** owns the layers a feature author shouldn't carry inline — **load, full-stack journeys, resilience/degradation, and coverage-debt campaigns** — and does **not** re-author feature tests. QA is dispatched per need (a perf-sensitive endpoint, a slice milestone, a debt task), not as a stage every feature passes through.

## When each layer runs (cadence)

- **Unit** — written **with the code**, in the same task. Always.
- **API e2e** — written **per feature, in the task that ships the endpoint/flow** (happy path + key failure modes). Not deferred to a final pass. It is an **acceptance criterion** for any task exposing an endpoint.
- **Full-stack e2e** — at **vertical-slice milestones** (e.g. a critical journey like sign-up → activate → first action), a handful of key journeys; not every task.
- **Load** — **just-in-time per performance-sensitive endpoint**, written in the task that ships it. Scaffold the load harness early so adding a scenario is cheap; there is **no single final load-test task** and we do **not** wait until the end.

## Conventions

- Test files sit next to the unit under test or in the app's e2e/load folder.
- Resilience is tested: assert that a failing optional dependency degrades gracefully instead of breaking the flow.
- A feature is not "done" until its happy path is covered by tests and the suite is green. See the task lifecycle in `workflow.md`.

## Coverage gate

- A **minimum coverage threshold** is enforced **in CI** (not in the pre-commit hook — keep commits fast). Wiring-only files (modules, bootstrap) are excluded so the metric reflects logic, not framework glue. The concrete threshold and tooling live in the stack's `testing-tooling.md`.

## Mindset

Test behavior and contracts, not implementation details. A refactor that keeps behavior should keep tests green.
