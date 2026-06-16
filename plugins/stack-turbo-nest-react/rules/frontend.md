# Frontend (React)

## Layered design system — `packages/ui`

The UI package is the single source of visual truth. Three layers:

1. **Primitives** — shadcn/ui components and our own base elements (Button, Input, Card). Dumb, generic. **Primitives are internal to `packages/ui` and never exported** — they exist only to build composites and templates.
2. **Composites** — reusable assemblies built from primitives, shared across pages (e.g. `Pill`, `DataTable`, `KpiTile`). Part of the package's public surface.
3. **Templates** — page-level layout skeletons that arrange composites and define slots. Public surface.

Only composites and templates are exported. Apps (`apps/*`) own **routes and pages**. A page implements a template and *mounts* composites — it never builds UI from primitives and never reaches into them.

## Component contract

- Components are **dumb / controlled** — they receive state and callbacks via props and render. No data fetching, no global-store coupling inside `packages/ui`.
- **Product-agnostic names — understandable without knowing the product.** Name by generic UI role or appearance (`Pill`, `Badge`, `Tag`, `GreenPill`), **never** by a product concept (`DeliveryStatusBadge` leaks the domain into the design system). Any developer should grasp the component from its name alone, with zero product knowledge.
- Build new components following the shadcn philosophy (composable, copy-into-codebase, unstyled-then-tokened).

## Theming & color

- **Tailwind tokens only — never hardcode a color.** Use semantic tokens (`bg-background`, `text-foreground`, `border-border`, `bg-primary`...). No `#hex`, no `bg-[...]` arbitrary colors in app/page code.
- Colors are defined **once, in the UI layer** (token/theme config). Pages and composites only consume tokens.
- **Dark and light themes** are first-class from day one.

## Internationalization

- **i18n from birth.** No hardcoded user-facing strings — every label goes through the i18n layer (`packages/i18n`). Adding a language must require zero code changes in components.

## Product analytics

- **PostHog** instruments the frontend (page views, key funnel events, feature usage). Event names are centralized and semantic. Analytics must fail silently — a blocked/erroring PostHog never breaks the UI (fail-prepared).

## Pages & state

- **One folder per page**, named after the page: `pages/LoginPage/` holds `LoginPage.tsx`, its hook(s) (`useLoginPage.ts`), and an `index.ts` barrel re-exporting the component (`export { LoginPage } from './LoginPage'`). The page's hooks are internal to its folder; the barrel exports only the component. Every page implements a **Template** and mounts **composites** — pages never import primitives and never build layout from scratch.
- **All page logic lives in hooks** (`useXxx`) — data fetching, derived state, handlers. The page component stays a thin wiring layer: call hooks, pass their values/callbacks down to composites.
- **No React Context** in app code. State is handled with `useState` / `useEffect` for local UI state and **TanStack Query** (`useQuery`, `useInfiniteQuery`, `useMutation`) for server state. `useInfiniteQuery` is the natural pair for the backend's cursor-based pagination.
- Server state is never duplicated into local state or a global store — Query's cache is the source of truth.

## Routing

- **Routes live in a dedicated `src/routes.tsx`**, defined as a typed **array** (`RouteObject[]`) consumed by `createBrowserRouter` (the React Router data API). **Never inline route definitions in `App.tsx`** — the table grows, and a single place keeps it maintainable.
- `App.tsx` stays thin: build the router from the `routes` array and render `<RouterProvider>`. Protected routes wrap their element in a per-app `RequireAuth` guard (a plain component using `useSession`, **no Context**).

## HTTP

- **Use `axios`, not raw `fetch`.** Pairs naturally with TanStack Query and is the market standard. Centralize a shared `axios` instance with **interceptors** for cross-cutting concerns — attach the bearer token on request, clear it + normalize errors on a 401 response — instead of repeating headers and status handling at every call site (single responsibility). Test it with `axios-mock-adapter` so the real interceptors run.

## Reuse

- Shared, framework-agnostic logic (types, validation, formatting) comes from `packages/shared`, not re-implemented per app.
