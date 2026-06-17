# Observability

## Logging philosophy

- **One log per request/process, emitted at the end.** Do NOT log a separate start/entry line. Each request, queue job, or gateway message produces exactly **one** structured log on completion that carries the full picture (method/path or job id, status/outcome, latency, plus everything attached via `appendContext`). The single line must be self-sufficient to reconstruct what happened.
- **The level reflects the outcome**, not the call site: success → `info`, client error (4xx) → `warn`, server error/failure (5xx) → `error`. The level itself is the filter for "show me only failures".
- Logging is a **single responsibility** owned by a dedicated class, reused across every entry point (HTTP requests, queue workers, realtime gateways). The stack's backend rule covers the concrete implementation.
- Correlation id flows through request → queue → downstream so a single request is traceable end-to-end.
- The logger exposes an **`appendContext(fields)`** API so a unit can attach specific structured fields to the current log scope (e.g. a relevant entity id or job metadata) **without** scattering `console.log` calls. Context is enriched through the abstraction, never by ad-hoc logging in business code.

## PII & secret safety

- **Redaction lives in one place — the logger class.** Because logging is a single responsibility, there is exactly one boundary to enforce PII/secret redaction; the risk of a leak comes precisely from scattering logging across the codebase. Keep it centralized.
- The logger redacts known-sensitive keys (tokens, passwords, auth headers, personal data) before anything is written, including fields passed via `appendContext`. Business code never decides what is safe to log — the logger does.

## Sidecar

- Implement a **sidecar** for a cross-cutting operational concern (e.g. log shipping/forwarding, metrics scraping, or health/heartbeat reporting) running as a separate container next to its app in `infra/`.
- The sidecar must not be on the critical request path — if it dies, the app keeps serving.

## Frontend analytics

- A product-analytics tool (e.g. PostHog — see the stack's frontend rule) is observability for user behavior; keep it separate from backend operational logs.

## Principle

Observability is added at the **infrastructure/cross-cutting layer**, never by scattering `console.log` into business logic. If you feel the need to log inside a method body, route it through the logger abstraction instead.
