---
description: Replenish work/ready/ — promote backlog tasks whose dependencies are now all in done
---

Reconcile the task board. Call this after a batch of `ready` tasks has gone through review and reached `done`. This is **backlog reconciliation as a skill** — a deterministic file operation you perform in-context (no agent needed; it replaces the former `scheduler` agent).

## Procedure

1. **Build the state map.** List task files under `work/{backlog,ready,active,review,done}/` and read each file's frontmatter (`id`, `depends_on`). `done` = the set of ids whose file currently sits in `work/done/`.
2. **Promote the eligible.** For each task in `work/backlog/`: if **every** id in its `depends_on` is in `done`, `git mv` it to `work/ready/` and set its state cell to `ready` in `work/ROADMAP.md`. Handle both dependency id forms (`001` and `TASK-001`). A single unmet dependency blocks promotion.
3. **Do not touch** tasks in `active/`, `review/`, or `done/`, and never promote a task with an unmet dependency.
4. **Commit** (only if something was promoted):
   `git add -A && git commit --no-verify -m "chore(work): promote ready tasks (<promoted-ids>)"`.
5. **Report (concise):** count per state (done/active/review/ready/backlog); what was promoted and which now-done dependency unblocked each; what is still blocked and on which exact dependency id(s); and the suggested next critical-path task(s) to `/delivery-team:task-start`.

For a large backlog, you may offload the read-and-classify scan to an `Explore` agent, but the `git mv` + ROADMAP sync stays here so the state transition is deterministic and auditable.
