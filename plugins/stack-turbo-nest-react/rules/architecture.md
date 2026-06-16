# Architecture

## Monorepo (Turborepo)

Single repo orchestrated by Turborepo with shared tooling. Canonical layout:

Convention: **`apps/` = all frontends**, **`services/` = all backends** (any runtime), **`packages/` = shared libraries**.

```
apps/
  control-tower/     # React app — operator watch tower
  driver/            # React app — driver app (web/mobile shell)
  client-portal/     # React app — SaaS client: register, API keys, usage dashboard (ADR 0009)
services/
  auth/              # owns users + approval; register/login/logout; issues JWTs (role, status). Only identity owner
  order-routing/     # backend core: NestJS (REST, WS, queues, logging, resilience); trusts JWTs
  optimizer/         # isolated Python service for OR-Tools route optimization (optional, degradable)
packages/
  ui/                # design system: primitives, composites, templates (see frontend.md)
  nest-common/       # shared NestJS building blocks: observability, honeypot, zod pipe, circuit breaker (ADR 0010)
  shared/            # framework-agnostic code reused by frontend AND backend (types, zod schemas, utils)
  i18n/              # translation catalogs + helpers
  config/            # shared eslint / prettier / tsconfig
infra/               # docker-compose, sidecars, deploy assets
work/                # task kanban (NOT shipped config — product state)
```

- **Three React apps** in the frontend: control-tower (operator), driver, client-portal (SaaS client).
- Backend core is **NestJS** (`services/order-routing`) — auth, REST, realtime, queues, logging, resilience; it manages deliveries and drivers and assigns destinations to drivers. Another language is used only for an isolated service where it is clearly the best tool: geometric route optimization runs in a **separate Python service** (`services/optimizer`) using Google OR-Tools, called by NestJS over HTTP/queue. The optimizer is optional and degradable — if it is down, `order-routing` falls back to a nearest-neighbor heuristic and the core flow continues.

## Code sharing (frontend ⇄ backend)

- Anything useful to both sides (DTO/validation schemas, domain types, pure utils) lives in `packages/shared` and is consumed by both React and NestJS. Do not duplicate.
- `shared` must stay framework-agnostic — no React, no Nest imports.

## Event-driven & decoupling

- Prefer **event-driven** communication for side effects and cross-module reactions. Producers emit; consumers subscribe. No direct reach-across between modules.
- Heavy/slow work goes to a queue (BullMQ) and is processed out-of-band — keep request latency low.
- Realtime to clients via **WebSocket**; device/ingestion telemetry via **MQTT** when applicable (must run in Docker locally and be Railway-compatible).

## Scalability & response time

- Design every list endpoint with **cursor-based pagination** (opaque cursor, stable sort key) — never offset pagination for primary feeds.
- Keep the hot path synchronous-light: validate, enqueue, respond. Push expensive work to workers.
- Stateless services where possible; state in DB / cache / broker, not in process memory.

## Local execution

- The whole stack must come up with **one command** via Docker Compose (`docker compose up`). Every service, broker, and DB included.
- A developer cloning the repo runs one command and has a working system.

## Optional, non-blocking dependencies

- The **LLM is agnostic and optional**. Provider is swappable (README may suggest Claude; for the PoC use a free provider such as Google's for testing). If the LLM is disabled or fails, the core flow continues — the feature degrades, the request does not break. See `backend.md` resilience section.
