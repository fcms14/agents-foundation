# Architecture

## Monorepo (Turborepo)

Single repo orchestrated by Turborepo with shared tooling. Convention: **`apps/` = all frontends**, **`services/` = all backends** (any runtime), **`packages/` = shared libraries**. A canonical layout — the app/service names below are **illustrative examples**, use your own domain names:

```
apps/
  web/               # a React app (e.g. the main product UI)
  admin/             # another React app (e.g. an internal console)
services/
  api/               # backend core: NestJS (REST, WS, queues, logging, resilience)
  auth/              # identity: register/login/logout; issues JWTs. The only identity owner
  worker/            # OPTIONAL: an isolated service in another language where it is clearly the
                     # best tool (e.g. a Python service for heavy computation), called over HTTP/queue
packages/
  ui/                # design system: primitives, composites, templates (see frontend.md)
  nest-common/       # shared NestJS building blocks: observability, security pipe, circuit breaker
  shared/            # framework-agnostic code reused by frontend AND backend (types, schemas, utils)
  i18n/              # translation catalogs + helpers
  config/            # shared eslint / prettier / tsconfig
infra/               # docker-compose, sidecars, deploy assets
work/                # task kanban (NOT shipped config — product state)
docs/                # ADRs + living docs
```

- **One or more React apps** live in `apps/`. The backend core is **NestJS**. Another language is used only for an isolated service where it is clearly the best tool (e.g. CPU-heavy computation in a Python service), called by the core over HTTP or a queue. Such a service should be **optional and degradable** — if it is down, the core degrades gracefully (e.g. a simpler fallback) and the main flow continues.

## Code sharing (frontend ⇄ backend)

- Anything useful to both sides (DTO/validation schemas, domain types, pure utils) lives in `packages/shared` and is consumed by both React and NestJS. Do not duplicate.
- `shared` must stay framework-agnostic — no React, no Nest imports.

## Event-driven & decoupling

- Prefer **event-driven** communication for side effects and cross-module reactions. Producers emit; consumers subscribe. No direct reach-across between modules.
- Heavy/slow work goes to a queue (**BullMQ**) and is processed out-of-band — keep request latency low.
- Realtime to clients via **WebSocket**; for ingestion/telemetry use a message broker when applicable (e.g. MQTT for device telemetry). Anything that must run locally has to come up in Docker and be deploy-compatible.

## Scalability & response time

- Design every list endpoint with **cursor-based pagination** (opaque cursor, stable sort key) — never offset pagination for primary feeds.
- Keep the hot path synchronous-light: validate, enqueue, respond. Push expensive work to workers.
- Stateless services where possible; state in DB / cache / broker, not in process memory.

## Local execution

- The whole stack must come up with **one command** via Docker Compose (`docker compose up`). Every service, broker, and DB included.
- A developer cloning the repo runs one command and has a working system.

## Optional, non-blocking dependencies

- Treat external/third-party dependencies (e.g. an LLM, a payment API, an optimization service) as **optional wherever possible**, with a swappable provider. If such a dependency is disabled or fails, the core flow continues — the feature degrades, the request does not break. See `backend.md` resilience section.
