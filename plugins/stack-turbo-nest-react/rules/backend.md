# Backend (NestJS default)

## Logging & observability (single responsibility)

- A **global logging interceptor** emits **one** structured log per request, at completion (no separate start line), carrying method, route, status, latency, correlation id, and any `appendContext` fields. The log level reflects the outcome (info / warn for 4xx / error for 5xx). The logging logic lives in **one class** with that sole responsibility.
- The same log responsibility is reused outside the HTTP pipeline. A **BullMQ processor**, a cron, or a WebSocket gateway that does not pass through the interceptor must still delegate to the same logger class (inject/extend it) — never reimplement logging inline.
- Logs are **structured** (JSON), carry a correlation/request id, and are rich enough for observability (inputs summarized, outcomes, timings, errors with stack).
- The logger exposes **`appendContext(fields)`** to enrich the current log scope with specific structured fields (e.g. a relevant entity id) — use it instead of inline logging.
- **PII/secret redaction is centralized in the logger class** (single responsibility = single place to enforce it, including `appendContext` fields). Business code never logs directly and never decides what is safe to log.

## Resilience (fail-prepared)

- **Circuit breaker** on at least one critical outbound integration (e.g. an external API or a heavy computation service). Open on repeated failures, short-circuit fast, half-open to probe recovery.
- **Optional dependencies degrade, never block.** Wrap non-critical integrations so a failure/timeout returns a safe fallback and the core flow completes.
- Timeouts on every outbound call. Retries with backoff only where idempotent.

## Security

- **Rate limiting / throttler** is mandatory on public endpoints (per-IP and/or per-user). Tighter limits on auth and write endpoints.
- **Honeypot** — at least one decoy endpoint/field that real clients never touch; hits are logged and can feed blocking. Document where it lives.
- Validate all input at the edge with a **schema-validation pipe** (e.g. a `ZodValidationPipe` from `packages/nest-common`), against **schemas shared via `packages/shared`** (one contract front+back). Reject unknown fields. Derive DTOs from the schemas and generate **Swagger from the schemas** (no class-validator duplication). Shape responses with a response schema + mapper, never leaking sensitive fields.
- **Reuse cross-cutting from a shared package** (e.g. `packages/nest-common`): observability (logger/interceptor/correlation), honeypot, validation pipe, circuit breaker. Do **not** re-copy these per service. Health stays per-service (checks that service's own critical deps).

## Authentication & authorization

- Identity lives in a **separate `services/auth`** that owns users (register/login/logout) and issues JWTs (`sub`, `role`, `status`, and whatever claims you need). Other services **trust and verify** the JWT — they never own credentials or a user table.
- If registration must be gated, model it explicitly (e.g. self-registered users start `pending` and an admin activates them; login works while `pending` but protected actions require `status = active`). Seed one initial admin so the system is usable from a clean DB.
- A **`JwtAuthGuard`** verifies the signature; a **`RolesGuard`** authorizes on the `role` claim. **Guards own authorization, never controllers.**
- Give a role a local domain table only when aggregates reference it (e.g. an `id = sub` projection holding that role's domain state). Roles that need no domain state get **no table** — stamp their `sub` on the events/actions they trigger for audit.

## Structure

- Feature modules own their controller, service, DTOs, events, and processors.
- Services depend on abstractions (ports), not on concrete infra clients — swap implementations without touching business logic.
- Background work via **BullMQ**; queue names and job schemas are typed and shared where the producer/consumer split needs it.
- Data layer is **Drizzle ORM** + drizzle-kit. Relational aggregates are typed Drizzle schema. Reach for specialized column types or extensions only when the domain needs them — e.g. **PostGIS** geometry via `customType` and `sql` templates, or **TimescaleDB** hypertables/policies via raw SQL migrations. Wrap the Drizzle client in a small Nest module/provider.

## Database naming conventions

- **Tables: plural, `snake_case`** (e.g. `users`, `orders`, `order_items`). **Columns: `snake_case`**. **Never use reserved words** as identifiers (`order` → `orders`). In Drizzle, TS schema properties are `camelCase` mapped to `snake_case` DB columns.

## Migrations

- **Name migration files for the change they make, not random words.** drizzle-kit defaults to names like `0001_careless_chameleon` — always pass a descriptive name (`drizzle-kit generate --name add_user_table` → `0001_add_user_table.sql`) so the history reads as a changelog. Keep the numeric prefix; the suffix must describe the schema delta.

## Database access — least privilege

- **The application connects with a limited DB user**, granted only what the runtime needs (`SELECT`/`INSERT`/`UPDATE`/`DELETE` on its own tables, `USAGE` on sequences) — **never a superuser/owner**. A SQL-injection or leaked credential must not be able to `DROP`/`ALTER` tables or read another service's data.
- **Migrations run as a separate, higher-privileged user** used only by the deploy pipeline — it owns the schema and may run DDL (`CREATE`/`ALTER`/`DROP` table, indexes, extensions) — but is **still not a cluster superuser** (no `CREATEROLE`, no `CREATEDB`, no `SUPERUSER`). Two roles, two connection strings: the app's `DATABASE_URL` (limited) and the migration `MIGRATION_DATABASE_URL` (DDL-capable, pipeline-only). See `delivery.md` for the pipeline step and `principles.md` for the principle.

## Scheduling & triggers

- **No cron / `setInterval` inside the API.** Periodic or time-based work uses **BullMQ delayed/repeatable jobs**, or — if a real periodic sweep is needed — a **separate scheduled job**, never the API process.
- Accumulation/threshold triggers are **event-driven** (emit on state change → Redis/BullMQ accumulator); deadline-based triggers are **BullMQ delayed jobs** scheduled at ingestion. Do not poll the DB for "things to process". Persistent data stays in the DB; Redis holds only the trigger signal/counters (rebuildable from the DB).

## API keys for machine-to-machine clients

- For m2m/service clients, authenticate with **API keys** (not JWT): store a key id + **hashed** secret tied to the client; a guard (e.g. `ApiKeyGuard`) validates. Keys are revocable. When you serve both public and internal consumers, expose a **public client-facing Swagger** plus a **full dev Swagger**.

## API documentation (Swagger)

- **Controllers are born documented**: every endpoint carries Swagger annotations (`@nestjs/swagger` — `@ApiTags`, `@ApiOperation`, request/response schemas, status codes). This is an acceptance criterion for any task that adds endpoints, not an afterthought.

## Living docs

- Each feature module carries its own doc (see `docs.md`): the C4 component diagram + a sequence of its core flow + a product-level explanation, kept next to the code.
