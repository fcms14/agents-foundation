---
description: Review a task in work/review/, and on approval move it to done
---

Ship task: **$ARGUMENTS** (a task id in `work/review/`).

Steps:
1. Read the task file in `work/review/` (its Spec is the contract) and the current diff.
2. Launch the **reviewer** agent against it. It verifies spec satisfaction, rule adherence (resilience, security, observability, frontend tokens/i18n, architecture, docs, tests), and that the suite is green. It returns a structured `verdict` — it does not edit the file.
3. Apply the verdict deterministically with **`/delivery-team:apply-verdict`** and relay the findings:
   - If **changes-requested**: `node .claude/scripts/apply-verdict.mjs --task TASK-NNN --verdict changes-requested --blocking "..."` (→ `work/review/`); summarize the fixes and offer to dispatch the owning worker.
   - If **approve**: confirm living docs + green suite, then `node .claude/scripts/apply-verdict.mjs --task TASK-NNN --verdict approve` (ticks Acceptance Criteria, stamps `## Verdict`, `git mv` → `work/done/`, syncs ROADMAP).
4. A task cannot reach `done/` without a `## Verdict: approve` and every Acceptance Criterion ticked — the husky board gate enforces this on commit.

If `$ARGUMENTS` is empty, list what's currently in `work/review/` and ask which to ship.
