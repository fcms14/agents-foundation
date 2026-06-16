---
id: TASK-NNN
title: <short imperative title>
agent: backend # planner | frontend | backend | infra | qa | docs | reviewer
depends_on: [] # e.g. [TASK-003] — ids that must be in done/ first
parallelizable: true # may run alongside other tasks?
worktree: true # needs an isolated git worktree? (code tasks: yes)
---

<!--
  Canonical task template. The planner copies this to work/ready/TASK-NNN-slug.md
  and fills it. Section names and the Verdict tokens are STANDARDIZED — automation
  (validate-board, apply-verdict) parses them, so do not rename headings or invent
  verdict words. State is the FOLDER the file sits in (move with git mv); there is
  deliberately no `status:` frontmatter field (it always goes stale). See
  .claude/rules/workflow.md.
-->

## Spec

<!-- Immutable once approved. What & why, in plain language. Open with a short
     summary (Goal, and Context when there are dependencies) before the checklist —
     both are OPTIONAL but desired; the Acceptance Criteria are the binding part. -->

**Goal —** what this delivers and why. _(desired: 1–2 lines)_

**Context from upstream tasks** _(optional)_ — decisions/outputs from `depends_on` tasks the implementer must know to stay consistent.

### Acceptance Criteria

<!--
  The contract, as a CHECKLIST. The REVIEWER ticks these (via /delivery-team:apply-verdict),
  never the implementer. A task cannot reach done/ with any box unticked.
  Make each criterion independently verifiable against code/tests.
-->

- [ ] <criterion 1 — observable, testable>
- [ ] <criterion 2>

### Out of scope

- <explicitly excluded, to bound the work>

## Plan

<!-- Mutable. Concrete technical steps, files/modules touched, design decisions,
     which .claude/rules apply. The executing subagent gets ONLY this file as
     context, so it must stand alone. -->

## Todo

<!-- The IMPLEMENTER's checklist. The implementer ticks these as it goes and
     reconciles them before reporting done. Distinct from Acceptance Criteria. -->

- [ ] <step>

## Verdict

<!--
  Filled by /delivery-team:apply-verdict from the reviewer's structured verdict — do not write
  by hand. Standardized token, one of:
    approve
    changes-requested
  changes-requested lists Blocking items. No `## Verdict: approve` ⇒ no done/.
-->

## Log

<!-- Appended by agents: decisions, results, test counts, reviewer entries. -->
