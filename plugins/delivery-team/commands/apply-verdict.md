---
description: Deterministically apply a reviewer's verdict — tick Acceptance Criteria, stamp the Verdict section, move the task to its new state
---

Apply a reviewer verdict to a task. This is the **bookkeeping half** of the
review gate: the reviewer agent JUDGES (read-only) and returns a structured
verdict; this command APPLIES it deterministically so nothing depends on an
agent remembering to tick a box (see `.claude/rules/workflow.md` and
`docs/foundation/README.md` — judgment vs bookkeeping).

Arguments: **$ARGUMENTS** — at minimum a task id and a verdict.

Run the script (never hand-edit the checkboxes or the state move yourself):

```
node .claude/scripts/apply-verdict.mjs --task <TASK-NNN> --verdict <approve|changes-requested> \
  [--ac all|<comma-separated 1-based indices>] [--note "<one line>"] [--blocking "item1;item2"]
```

Rules:
- `--verdict approve` ticks **all** Acceptance Criteria by default and moves the task to `work/done/`. Pass `--ac 1,3,4` only if the reviewer confirmed a subset (the rest stay unticked → the gate will then refuse `done/`, which is correct).
- `--verdict changes-requested` ticks nothing by default and moves the task to `work/review/`. Pass `--blocking "..."` with the required fixes.
- The script also syncs the task's state cell in `work/ROADMAP.md` and writes a dated `Reviewer (Opus) verdict` Log entry. It does **not** commit — review the diff, then commit (the husky gate validates `done/` on commit).

After it runs, relay: the verdict, how many Acceptance Criteria were ticked, and the new state. If `changes-requested`, summarize the blocking items and offer to re-dispatch the owning implementer.
