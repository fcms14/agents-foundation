# Architecture Decision Records (ADR)

Significant, hard-to-reverse decisions are recorded as ADRs under `docs/adr/`. An ADR captures **why** a choice was made so future contributors don't have to reverse-engineer intent.

## When to write one

- A choice that shapes architecture, a technology/runtime selection, or a cross-cutting convention.
- A trade-off with viable alternatives that were rejected.
- Anything where someone would later ask "why is it this way?".

Routine, easily-reversible changes do not need an ADR — keep the bar at "would reversing this be costly or contentious?".

## How

1. Copy `docs/adr/0000-template.md` to `docs/adr/NNNN-kebab-title.md` (next free number).
2. Fill Context / Decision / Consequences / Alternatives. Keep it short and concrete.
3. Set `Status: proposed`; move to `accepted` once agreed.
4. **Never rewrite an accepted ADR's decision.** If it changes, write a new ADR and mark the old one `superseded by NNNN`.
5. Add the entry to `docs/adr/README.md`.

ADRs are English like the rest of the repo. They are living context, not bureaucracy — one screen is usually enough.
