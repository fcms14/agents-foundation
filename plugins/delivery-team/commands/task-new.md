---
description: Specify a new task — delegate to the planner agent to produce a task file in work/ready/
---

Create a new task for: **$ARGUMENTS**

Steps:
1. Determine the next free task number by listing `work/**/TASK-*.md`.
2. Launch the **planner** agent (via the Agent tool) with the goal above. Instruct it to follow `.claude/rules/workflow.md` and write the task to `work/ready/TASK-NNN-slug.md` (Spec immutable, Plan/Todo/Log).
3. When it returns, show me: the task file path, the chosen executing `agent`, its `depends_on`, and a one-paragraph summary.
4. Do NOT start implementation — this command only specifies. Leave the file in `work/ready/`.

If `$ARGUMENTS` is empty, ask me what the task should accomplish before proceeding.
