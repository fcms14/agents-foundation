# agents-foundation — Claude Code plugin marketplace

A reusable delivery foundation for Claude Code, packaged as a plugin marketplace. Install it into any project to get a team of role agents, a `work/` markdown kanban, and deterministic gates that keep the board honest.

It ships two plugins — install one or both:

- **`delivery-team`** — the agnostic process: role agents (planner, reviewer, docs, qa, product-delivery-manager), the `work/` kanban, the deterministic board/docs/verdict gates, and the `/delivery-team:init` scaffolder. Carries *how work flows*, not *which stack you use*.
- **`stack-turbo-nest-react`** — an opinionated stack layer (v0, as-built): NestJS + React/Turborepo implementer agents and their conventions. Depends on `delivery-team`. The `stack-*` prefix is the convention for future stacks.

## How it works

**Agents create and judge; deterministic steps apply state; hooks enforce it.** The reviewer returns a structured verdict → `/delivery-team:apply-verdict` ticks the Acceptance Criteria and moves the task → a board gate refuses `done/` without a verdict + ticked criteria → a docs gate refuses a migration without an ERD/docs update. Bookkeeping is code, not an agent's memory.

Gates run in **two layers**: agent-time `PreToolUse` hooks ship in the plugin (resolved via `${CLAUDE_PLUGIN_ROOT}`); the commit-time git gate is wired by `/delivery-team:init`, which copies the validators into the consumer repo because git hooks can't see `${CLAUDE_PLUGIN_ROOT}`.

## Structure

```
agents-foundation/
├── .claude-plugin/marketplace.json     # marketplace manifest (lists the plugins)
└── plugins/
    ├── delivery-team/                  # Plugin A — agnostic process
    │   ├── .claude-plugin/plugin.json
    │   ├── agents/ commands/ hooks/ scripts/ rules/ templates/
    │   └── README.md
    └── stack-turbo-nest-react/         # Plugin B — opinionated stack (v0)
        ├── .claude-plugin/plugin.json
        ├── agents/ rules/
        └── README.md
```

A plugin's components live at the **plugin root** (`agents/`, `commands/`, `hooks/`), never under a `.claude/` folder — that's why you don't see one here. The consumer repo *does* get a `.claude/`, created by `/delivery-team:init`: it materializes the rules + gate scripts and scaffolds `work/`. `rules/` and `scripts/` aren't native plugin component types — they ride along as files and `/delivery-team:init` copies them in.

## Use it in a project

```
/plugin marketplace add <owner>/agents-foundation         # GitHub shorthand, or a full git URL
/plugin install delivery-team@agents-foundation
/plugin install stack-turbo-nest-react@agents-foundation  # optional opinionated layer
/delivery-team:init                                       # one-time scaffold in the target repo
```

Then drive the workflow: `/delivery-team:task-new <goal> → /delivery-team:task-start → reviewer → /delivery-team:apply-verdict`.

- **Scope**: `--scope user` (default) follows you across repos and machines; `--scope project` (committed `.claude/settings.json`) shares it with a team.
- **Updates**: each `plugin.json` pins a `version` — consumers update with `/plugin marketplace update agents-foundation`.
- **Coexistence**: a project's own `.claude/` and installed plugins merge; on a name clash the project-local copy wins — so a consumer can run a pinned published version while the foundation keeps evolving.

## Contributing

A marketplace is just a git repo — no registry.

- Edit a plugin under `plugins/<name>/`; components are auto-discovered from the plugin root.
- Keep `delivery-team` stack-agnostic; put stack specifics in a `stack-*` plugin.
- **Releasing a change**: bump `version` in the relevant `plugin.json` *and* its entry in `marketplace.json`. (Omit `version` only if you'd rather every commit be an update.)
- **Conventions**: every versioned artifact in English; Conventional Commits (single imperative line, no AI signature).

## Roadmap / known caveats

- **Not yet fully stack-agnostic** — the `delivery-team` reviewer and `validate-docs.mjs` still carry NestJS/Turborepo assumptions (throttler/cursor-pagination checks; a `services/<svc>/.../migrations` docs gate). Trim these into the stack layer. (Detailed in the delivery-team README.)
- **Opinionated stack is v0 as-built** — codify the de-facto design pattern (folder shape, naming, import boundaries) into explicit conventions, and add a structure-lint (ESLint boundaries / dependency-cruiser) so organization is a deterministic gate, not a reviewer judgment call.
- **Hard plugin dependency** — `stack-turbo-nest-react` depends on `delivery-team` only in prose; confirm whether a real dependency field can enforce it.
- **`/delivery-team:init` portability** — the commit-gate wiring assumes pnpm/husky (with a plain `.git/hooks/pre-commit` fallback); the `.mjs` validators require Node. Harden and document the prerequisites.
- **End-to-end validation** — exercise the full loop (`marketplace add` → install → `/delivery-team:init` → `/delivery-team:task-new … → board-gate`) in a throwaway repo to confirm hooks fire and gates actually block.
