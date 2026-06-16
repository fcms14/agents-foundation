# Execution Workflow

Project execution is managed as a **markdown kanban in `/work`** (repo root, outside `.claude/` — it is product state, not reusable harness config). When this repo is reused as a template, `.claude/` travels and `/work` is born empty.

## Kanban folders (state = file location)

```
work/
  backlog/   # raw ideas, not yet specified
  ready/     # specified, Definition-of-Ready met, free to pick up
  active/    # in execution — one file = one agent working
  review/    # code done, awaiting review / verify
  done/      # completed (kept as living history)
  ROADMAP.md # macro view: epics, order, dependencies
```

A state transition is a `git mv` of the task file between folders. The commit history tells the story. **Every task also has a row in `ROADMAP.md`** — when you create a task or move it between folders, add/update its row there in the same change so the index stays complete and its state stays in sync.

## Task file

One file per task: `work/<state>/TASK-NNN-slug.md`, single file (not split), with frontmatter and sections:

```yaml
---
id: TASK-007
title: Short imperative title
agent: backend            # which worker executes it (see agents)
depends_on: [TASK-003]    # dependency graph
parallelizable: true      # may run alongside other tasks?
worktree: true            # needs an isolated git worktree? (code tasks: yes)
---
```
Sections (standardized — automation parses them; copy `work/TASK-TEMPLATE.md`): **Spec** (immutable once approved — an optional **Goal**/**Context from upstream tasks** summary, then the binding **Acceptance Criteria as a `- [ ]` checklist** and out of scope) · **Plan** (mutable — technical steps, files touched, design decisions) · **Todo** (implementer checklist) · **Verdict** (`approve` | `changes-requested`, written by `/delivery-team:apply-verdict` — not by hand) · **Log** (agents append decisions/results).

## Orchestrator + workers

- The **main session is the orchestrator**, embodying the **`product-delivery-manager`** agent (`.claude/agents/product-delivery-manager.md`): it plans, dispatches, and integrates. It does not write feature code itself.
- Workers are the agents in `.claude/agents/`. Each task declares its `agent`.
- The orchestrator reads `work/active|ready/`, builds the dependency graph from `depends_on`, and:
  - dispatches **independent tasks as parallel subagents**;
  - runs each **code task in its own git worktree** (`worktree: true`) to avoid file conflicts, then integrates results;
  - **serializes** dependent tasks.
- The **Workflow** tool (deterministic fan-out: pipeline/parallel) is reserved for massive fan-out and is opt-in only. The frontmatter (`parallelizable`, `depends_on`) already carries everything needed to adopt it later without rework.

## Lifecycle

`backlog → ready → active → review → done`. A task enters `review` only when its happy path is tested and the suite is green (`testing.md`). Feature-level living docs (`docs.md`) are produced before `done`.

**Shipping on approve.** The reviewer is the trusted gate but does **not** edit the task file. It returns a structured verdict; the orchestrator runs **`/delivery-team:apply-verdict`**, which ticks the Acceptance Criteria, stamps the `## Verdict` section, and `git mv`s the task to `done/` (on `approve`) or `review/` (on `changes-requested`). The `review/` folder is transient — used only while a task is verified or has `changes-requested`. `/delivery-team:task-ship` remains as an optional explicit human gate; in orchestrated/autonomous runs, `approve → done` directly.

**The board gate (non-bypassable).** A husky pre-commit hook (`.claude/scripts/validate-board.mjs --staged`) refuses any commit that places a task in `work/done/` without a recorded reviewer approval **and** every Acceptance Criteria box ticked. A `PreToolUse` hook (`gate-done.sh`) gives the same warning at agent-action time. This makes the gate mechanical — it cannot be skipped by an agent forgetting to mark a box (the failure mode that previously let unreviewed tasks reach `done/`). Bookkeeping is code; judgment is the agent.

## Agent pipeline & who marks what

Each task flows through agents in this order (the orchestrator chains them):

1. **Implementer** (backend/frontend/infra) — builds it, **writes its own unit + API-e2e tests** and living docs, and **checks off the Todo** as it completes each item (reconciling the Todo before reporting done). Appends to the Log. Does **not** touch the Acceptance Criteria.
2. **Docs** — ensures the feature's living docs (Mermaid + product note) match the final code. (Often the implementer already did this; `docs` is for enrichment/verification or the API overview.)
3. **QA** *(specialist, off the default path)* — dispatched **only** when the task needs load (Artillery), full-stack journeys (Playwright), resilience/degradation, or a coverage-debt sweep. It does not re-author the implementer's feature tests. Skipping QA for a small feature whose author tested it is correct, not a gap.
4. **Reviewer** — the gate, runs last. JUDGES (read-only) against the code and returns a structured `verdict` with per-criterion results. **`/delivery-team:apply-verdict` then ticks the Acceptance Criteria and moves the task** — the reviewer never edits the file. Only an approved task (verdict + all criteria ticked) passes the gate to `done`.

**Marking rule:** the implementer owns the **Todo** checkboxes; the reviewer owns the **Acceptance Criteria** *judgment*, but the ticks and the state move are applied deterministically by `/delivery-team:apply-verdict` and enforced by the board gate — never by hand. For small tasks the pipeline collapses to implementer + reviewer — KISS; scale the stages to the task.

## Replenishing `ready`

All task specs are written up front and live in `work/ready/` (runnable) or `work/backlog/` (deps unmet). After a batch reaches `done`, run **`/delivery-team:task-promote`** — a deterministic **skill** (performed in-context, no agent) that `git mv`s every backlog task whose `depends_on` are now all in `done/` into `ready/` and syncs the ROADMAP. That keeps the board flowing without re-specifying anything. (This replaces the former `scheduler` agent — backlog reconciliation is mechanical, so it is a skill, not an agent.)
