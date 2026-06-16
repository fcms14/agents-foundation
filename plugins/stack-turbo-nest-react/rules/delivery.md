# Tooling, CI & Deployment

## Local tooling (mandatory)

- **Prettier** — formatting is automated, never debated. Single shared config in `packages/config`.
- **ESLint** — for React and NestJS (and the equivalent linter for any other language adopted, e.g. `golangci-lint`, `ruff`). Shared base config; app overrides only when justified.
- **Husky** — pre-commit hooks run lint + format (and fast checks) so broken code never reaches a commit. Keep hooks fast; heavy checks belong in CI.

## Environment

- Maintain `.env.example` (committed, documented, no secrets) and a local `.env` (gitignored). Every config value the app reads is listed in `.env.example`.

## CI — GitHub Actions

- Workflows in `.github/workflows/` run on PR: install, lint, typecheck, unit tests, build. E2E and Artillery run on demand or on a dedicated job.
- CI mirrors the local checks so "green locally" means "green in CI".

## Deployment — Railway

- Backend and frontend deploy to **Railway**.
- Provide a **`railway.toml`**, a **`Dockerfile`** per deployable, and a **`Caddyfile`** for the frontend (static serving / reverse proxy), all Railway-compatible.
- Docker images must be the same ones used locally where practical — parity between local and deploy.
- MQTT/broker and DB provisioned as Railway services or compatible managed equivalents.

## Database migrations in the pipeline (least privilege)

- **Migrations run as a dedicated deploy step**, before the new app version serves traffic — never from the application process at boot.
- That step authenticates with a **DDL-capable migration user** (`MIGRATION_DATABASE_URL`) that owns the schema; the **running app uses a separate limited user** (`DATABASE_URL`, CRUD-only). Neither is a cluster superuser. Provision both roles when the DB is set up (the migration role grants the limited role's privileges on new tables). See `backend.md` and `principles.md`.

## Principle

Everything that can be automated (format, lint, test, build, deploy) is automated and runs the same way locally and in CI. Manual steps are bugs.
