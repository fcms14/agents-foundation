---
description: Run task(s) through the full agent pipeline — implement → qa ∥ docs → review — dispatching the right agents in the correct sequence
---

Run the pipeline for: **$ARGUMENTS** (a task id like `TASK-007`, several ids, or `all-ready` for everything in `work/ready/`).

You are the **orchestrator** (`.claude/rules/workflow.md`). You do not write feature code — you dispatch agents and integrate. Worker agents run on **Sonnet** (`model: "sonnet"`); the reviewer runs on **Opus**. Keep `qa`/`docs` independent so they can run in parallel.

## Steps

1. **Resolve & plan.** Locate the target task file(s) **by id under `work/**`** (they may be in `work/ready/` or `work/backlog/` — all specs are written up front). Verify each task's `depends_on` are already in `work/done/`; if a dependency is unmet, report the blocker and stop for that task. Build the dependency graph; independent tasks can have their *implement* stage run concurrently; dependent tasks serialize. `git mv` a started task into `work/active/`.

2. **Implement.** For each runnable task: `git mv` it `ready → active`, then dispatch the agent named in its frontmatter (`agent:`), `model: "sonnet"`, passing the task file as context:
   - Independent code tasks → launch implementers **as parallel subagents in one message**, each with `isolation: "worktree"` (when `worktree: true`).
   - The implementer **builds it, writes unit + API e2e tests** (cadence in `testing.md`) **and living docs, checks off the Todo** as it goes, appends to the Log, and **commits** in its worktree. It does **not** touch the Acceptance Criteria.

3. **Integrate** (orchestrator). Cherry-pick/merge each worktree branch onto `main`; resolve `pnpm-lock.yaml` conflicts by regenerating (`pnpm install`); run `pnpm build && pnpm typecheck && pnpm test` to confirm the integrated whole is green. Remove the worktrees.

4. **Docs (+ QA only if warranted).** Dispatch (Sonnet, no worktree — disjoint outputs):
   - **docs** — ensure the feature's living docs (Mermaid + product note) match the final code; update the API overview.
   - **qa** — dispatch **only** if the task needs the specialist layers (load/Artillery, full-stack journeys, resilience, coverage-debt). The implementer already owns the feature's unit + API-e2e tests, so QA is *not* a per-feature stage; skip it for a small feature its author tested. Run in parallel with docs when both apply.

5. **Review** (gate). Dispatch the **reviewer** (`model: "opus"`): it JUDGES read-only against the code and returns a structured `verdict` (`approve` / `changes-requested`) with per-criterion results. **Apply it deterministically — do not hand-tick or hand-move:**
   - **approve** → `node .claude/scripts/apply-verdict.mjs --task TASK-NNN --verdict approve` (ticks the Acceptance Criteria, stamps `## Verdict`, `git mv` → `done/`). The husky board gate re-validates on commit.
   - **changes-requested** → `/delivery-team:apply-verdict --task TASK-NNN --verdict changes-requested --blocking "..."` (→ `review/`); summarize fixes, re-dispatch the owning implementer, then re-review. (`/delivery-team:task-ship` remains an optional explicit human gate.)

6. **Sync the index.** Update each task's state row in `work/ROADMAP.md` (per `workflow.md`). Report: what ran in parallel, integration result, coverage, verdicts, and what's now in `review`.

## Notes

- **KISS — collapse the pipeline for small tasks**: a trivial change can be implementer + reviewer only; scale `qa`/`docs` to what the task needs.
- A task with unmet dependencies still in `backlog/ready` is not started — report the blocker.
- For a deterministic, reproducible run of this same pipeline, the `task-pipeline` **Workflow** does the same chaining as a script (sequential per task, `qa ∥ docs` parallel within a task).
