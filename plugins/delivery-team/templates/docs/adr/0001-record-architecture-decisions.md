# 1. Record architecture decisions

- **Status:** accepted
- **Date:** YYYY-MM-DD
- **Deciders:** the team

## Context

We need to record the significant, hard-to-reverse architectural decisions made on this project, and the reasons behind them, so future contributors understand *why* the system is the way it is instead of reverse-engineering intent from the code and commit history.

## Decision

We will use Architecture Decision Records, as described by Michael Nygard, stored as numbered markdown files under `docs/adr/`. Each record has a status (proposed / accepted / superseded) and captures Context, Decision, and Consequences. A new record copies `0000-template.md`, takes the next free number, and is listed in `README.md`. An accepted record is never rewritten — if the decision changes, a new record supersedes it.

## Consequences

Decisions gain a durable, reviewable home next to the code; onboarding is faster and settled debates are not re-litigated. The cost is light discipline: one short record per significant decision. This first record exists to bootstrap the practice — delete it only if you abandon ADRs entirely.

## Alternatives considered

- **No formal record** — rely on tribal memory and commit archaeology; rejected because intent rots and is expensive to recover.
- **A wiki or external doc tool** — drifts from the code and needs separate access/permissions; rejected in favor of version-controlled records that travel with the repo.
