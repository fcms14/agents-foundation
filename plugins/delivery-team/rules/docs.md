# Documentation

Universal documentation discipline. *How* docs are structured for a given stack (e.g. a C4 model over services/packages, ERDs per database) is defined by that stack's own docs rule — this file carries only what is true for any project.

## In-code documentation

- **JSDoc only, and only above** classes, modules, and public methods/functions — describe purpose, params, return, and notable side effects.
- **Avoid comments inside method bodies.** An inline comment usually signals a method doing too much — extract and name instead. The code should read as the explanation.
- Keep JSDoc honest and current; a stale doc is worse than none.

## Living docs

- **Docs describe what the code IS, not what it was meant to be.** Write docs from the actual code; if a doc and the code disagree, the doc is a bug — fix it (or report the mismatch and propose a fix task) rather than paper over it.
- **Each doc opens with a short product-level explanation** — what it does and why, in plain language — before any diagram or detail.
- Keep docs current with the code in the **same change** that alters behavior. Documentation that lags the code rots.

## Rule of proximity

Documentation lives as close to what it describes as possible (a module's doc beside the module, a service's overview at the service root, the data model beside the schema). Distance between code and its doc is how docs rot. A file in the wrong place is a bug — `git mv` it to its canonical location rather than leaving a duplicate.

## Mermaid authoring (avoid silent parse errors)

Diagrams must actually render. These rules prevent the common parser failures:

- **Line breaks use `<br/>`, never `\n`** — `N["foo<br/>bar"]`, not `N[foo\nbar]`.
- **Quote any node label containing special characters** (`/`, `@`, `:`, `(`, `)`, `.`, `·`, …): `AKG["ApiKeyGuard<br/>@scope/pkg"]`. Quoting is always safe, so quote by default.
- **Alias subgraph titles that contain special characters**: `subgraph SA["services/auth"]`, not `subgraph services/auth`.
- **Never name a sequence-diagram participant after a keyword** — `opt`, `alt`, `else`, `end`, `loop`, `par`, `and`, `note`, `activate`, `rect`, `critical`, `break` (case-insensitive). A participant `OPT` collides with the `opt` fragment and breaks parsing; use `OPTSVC`/`OS` instead.
- **No `;` inside labels or messages** — it is a statement separator; use `,` or `—`.
- **`erDiagram` relations** use crow's-foot syntax (`ORDERS ||--o{ ROUTE_STOPS : has`) and quoted attribute types only when they contain special characters — keep entity names UPPER_SNAKE matching the table name.
