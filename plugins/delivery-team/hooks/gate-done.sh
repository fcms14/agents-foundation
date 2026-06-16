#!/usr/bin/env bash
# PreToolUse hook for Bash: block moving a task into work/done/ unless it carries
# a recorded reviewer approval and all its Acceptance Criteria are ticked.
#
# It validates the MOVE SOURCE (the file in active/ or review/), because by the
# time a task is moved to done/ the reviewer / apply-verdict has already written
# the "## Verdict" section and ticked the criteria in that file.
#
# Best-effort + fail-open on ambiguity: the authoritative, non-bypassable gate is
# the husky pre-commit (.husky/pre-commit → validate-board.mjs --staged). This
# hook is the early, agent-time warning.
#
# Exit 2 => block the tool call and surface the reason. Exit 0 => allow.
set -euo pipefail

payload="$(cat)"

command_str=""
if command -v python3 >/dev/null 2>&1; then
  command_str="$(printf '%s' "$payload" | python3 -c 'import sys,json
try:
    d=json.load(sys.stdin); print(d.get("tool_input",{}).get("command",""))
except Exception:
    print("")' 2>/dev/null || true)"
elif command -v jq >/dev/null 2>&1; then
  command_str="$(printf '%s' "$payload" | jq -r '.tool_input.command // ""' 2>/dev/null || true)"
fi

[ -z "$command_str" ] && exit 0

# Only engage when the command moves something into work/done/.
printf '%s' "$command_str" | grep -Eq 'mv[[:space:]].*work/done/' || exit 0

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"
# The validator ships WITH this plugin; the task files it checks live in the project.
validator="${CLAUDE_PLUGIN_ROOT:-$root/.claude}/scripts/validate-board.mjs"
[ -f "$validator" ] || exit 0
command -v node >/dev/null 2>&1 || exit 0

# Extract candidate task files being moved (source paths in active/ or review/).
sources="$(printf '%s' "$command_str" \
  | grep -oE 'work/(active|review|backlog|ready)/TASK-[A-Za-z0-9._-]+\.md' \
  | sort -u || true)"
[ -z "$sources" ] && exit 0

blocked=0
output=""
while IFS= read -r src; do
  [ -z "$src" ] && continue
  [ -f "$root/$src" ] || continue
  if ! result="$(node "$validator" "$root/$src" 2>&1)"; then
    blocked=1
    output="$output$result"$'\n'
  fi
done <<< "$sources"

if [ "$blocked" -eq 1 ]; then
  echo "Blocked by gate-done hook — task not eligible for done/:" >&2
  printf '%s\n' "$output" >&2
  exit 2
fi

exit 0
