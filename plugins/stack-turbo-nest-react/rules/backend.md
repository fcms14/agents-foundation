# Backend (NestJS default)

## Logging & observability (single responsibility)

- A **global logging interceptor** emits **one** structured log per request, at completion (no separate start line), carrying method, route, status, latency, correlation id, and any `appendContext` fields. The log level reflects the outcome (info / warn for 4xx / error for 5xx). The logging logic lives in **one class** with that sole responsibility.
- The same log responsibility is reused outside the HTTP pipeline. A **BullMQ processor**, a cron, or a WebSocket gateway that does not pass through the interceptor must still delegate to the same logger class (inject/extend it) — never reimplement logging inline.
- Logs are **structured** (JSON), carry a correlation/request id, and are rich enough for observability (inputs summarized, outcomes, timings, errors with stack).
- The logger exposes **`appendContext(fields)`** to enrich the current log scope with specific structured fields (e.g. `routeId`, `driverId`) — use it instead of inline logging.
- **PII/secret redaction is centralized in the logger class** (single responsibility = single place to enforce it, including `appendContext` fields). Business code never logs directly and never decides what is safe to log.

## Resilience (fail-prepared)

- **Circuit breaker** on at least one critical outbound integration (e.g. the LLM call or an external optimization/distance service). Open on repeated failures, short-circuit fast, half-open to probe recovery.
- **Optional dependencies degrade, never block.** Wrap the LLM and other non-critical integrations so a failure/timeout returns a safe fallback and the core flow completes.
- Timeouts on every outbound call. Retries with backoff only where idempotent.

## Security

- **Rate limiting / throttler** is mandatory on public endpoints (per-IP and/or per-user). Tighter limits on auth and write endpoints.
- **Honeypot** — at least one decoy endpoint/field that real clients never touch; hits are logged and can feed blocking. Document where it lives.
- Validate all input at the edge with the **`ZodValidationPipe`** from `@delivery/nest-common`, against **zod schemas shared via `@delivery/shared`** (one contract front+back, ADR 0011). Reject unknown fields. Derive DTOs with `nestjs-zod` (`createZodDto`) and generate **Swagger from the zod schemas** (no class-validator). Shape responses with a response zod schema + mapper (e.g. `PublicUser`), never leaking sensitive fields.
- **Reuse cross-cutting from `@delivery/nest-common`** (ADR 0010): observability (logger/interceptor/correlation), honeypot, zod pipe, circuit breaker. Do **not** re-copy these per service. Health stays per-service (checks that service's own critical deps).

## Authentication & authorization (see ADR 0005)

- Identity lives in a **separate `services/auth`** that owns users (register/login/logout) and issues JWTs (`sub`, `role` of `m2m | driver | operator`, `name`, `status`). Other services **trust and verify** the JWT — they never own credentials or a user table.
- **Registration is gated by approval** (ADR 0006): self-registered users are `pending`; a driver is approved by an operator, an operator by another operator. Login works for `pending` users but domain access requires `status = active`. A seed creates one initial active operator. Guards in other services require `status = active` for protected actions.
- A **`JwtAuthGuard`** verifies the signature; a **`RolesGuard`** authorizes on the `role` claim. **Guards own authorization, never controllers.**
- Only **`driver`** has a local domain projection (`drivers` table, `id = sub`, holding domain state: online status, capacity, current route) because aggregates reference it. **Operator and m2m get no table** — their `sub` is stamped on the events/actions they trigger for audit.

## Structure

- Feature modules own their controller, service, DTOs, events, and processors.
- Services depend on abstractions (ports), not on concrete infra clients — swap implementations without touching business logic.
- Background work via **BullMQ**; queue names and job schemas are typed and shared where the producer/consumer split needs it.
- Data layer is **Drizzle ORM** + drizzle-kit (ADR 0007). Relational aggregates are typed Drizzle schema; **PostGIS** geometry via `customType` and `sql` templates; **TimescaleDB** DDL (`create_hypertable`, compression/retention policies, continuous aggregates) via raw SQL migrations. Wrap the Drizzle client in a small Nest module/provider.

## Database naming conventions

- **Tables: plural, `snake_case`** (`orders`, `route_stops`, `gps_positions`, `user_integrations`). **Columns: `snake_case`**. **Never use reserved words** as identifiers (`order` → `orders`). In Drizzle, TS schema properties are `camelCase` mapped to `snake_case` DB columns.

## Migrations

- **Name migration files for the change they make, not random words.** drizzle-kit defaults to names like `0001_careless_chameleon` — always pass a descriptive name (`drizzle-kit generate --name add_user_integrations`) so the history reads as a changelog (`0001_add_user_integrations.sql`). Keep the numeric prefix; the suffix must describe the schema delta.

## Database access — least privilege

- **The application connects with a limited DB user**, granted only what the runtime needs (`SELECT`/`INSERT`/`UPDATE`/`DELETE` on its own tables, `USAGE` on sequences) — **never a superuser/owner**. A SQL-injection or leaked credential must not be able to `DROP`/`ALTER` tables or read another service's data.
- **Migrations run as a separate, higher-privileged user** used only by the deploy pipeline — it owns the schema and may run DDL (`CREATE`/`ALTER`/`DROP` table, indexes, extensions) — but is **still not a cluster superuser** (no `CREATEROLE`, no `CREATEDB`, no `SUPERUSER`). Two roles, two connection strings: the app's `DATABASE_URL` (limited) and the migration `MIGRATION_DATABASE_URL` (DDL-capable, pipeline-only). See `delivery.md` for the pipeline step and `principles.md` for the principle.

## Scheduling & triggers (ADR 0008)

- **No cron / `setInterval` inside the API.** Periodic or time-based work uses **BullMQ delayed/repeatable jobs**, or — if a real periodic sweep is needed — a **separate Railway scheduled job**, never the API process.
- Accumulation/threshold triggers are **event-driven** (emit on state change → Redis/BullMQ accumulator); deadline-based triggers are **BullMQ delayed jobs** scheduled at ingestion. Do not poll the DB for "things to process". Persistent data stays in Postgres; Redis holds only the trigger signal/counters (rebuildable from Postgres).

## API keys for m2m clients (ADR 0009)

- m2m clients authenticate with **API keys** (not JWT): `user_integrations` stores key id + **hashed** secret tied to the client user; an `ApiKeyGuard` validates. Keys are revocable. Expose a **public client-facing Swagger** plus a **full dev Swagger**.

## API documentation (Swagger)

- **Controllers are born documented**: every endpoint carries Swagger annotations (`@nestjs/swagger` — `@ApiTags`, `@ApiOperation`, request/response schemas, status codes). This is an acceptance criterion for any task that adds endpoints, not an afterthought.
- **Dual Swagger** (ADR 0009): a **public, client-facing** document (only client routes) linked from the client portal, and a **full dev** document covering everything.

## Living docs

- Each feature module carries its own doc (see `docs.md`): architecture + sequence Mermaid diagrams plus a product-level explanation, kept next to the code.
