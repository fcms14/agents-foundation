#!/usr/bin/env bash
# PreToolUse hook for Bash: block obviously destructive commands.
# Exit 2 => block the tool call and surface the reason to the agent. Exit 0 => allow.
set -euo pipefail

payload="$(cat)"

command_str=""
if command -v python3 >/dev/null 2>&1; then
  command_str="$(printf '%s' "$payload" | python3 -c 'import sys,json;
try:
    d=json.load(sys.stdin); print(d.get("tool_input",{}).get("command",""))
except Exception:
    print("")' 2>/dev/null || true)"
elif command -v jq >/dev/null 2>&1; then
  command_str="$(printf '%s' "$payload" | jq -r '.tool_input.command // ""' 2>/dev/null || true)"
fi

[ -z "$command_str" ] && exit 0

# Patterns we refuse to run unattended. Keep this list tight and high-confidence.
deny_patterns=(
  'rm[[:space:]]+-rf[[:space:]]+/($|[[:space:]])'   # rm -rf /
  'rm[[:space:]]+-rf[[:space:]]+~($|/)'             # rm -rf ~
  ':\(\)\{.*\|.*&.*\};:'                            # fork bomb
  'mkfs\.'                                          # format a filesystem
  'dd[[:space:]]+if=.*of=/dev/'                     # raw write to a device
  '>[[:space:]]*/dev/sd[a-z]'                       # overwrite a disk
  'git[[:space:]]+push.*--force.*origin[[:space:]]+(main|master)' # force-push protected branch
)

for p in "${deny_patterns[@]}"; do
  if printf '%s' "$command_str" | grep -Eq "$p"; then
    echo "Blocked by guard-bash hook: command matches a destructive pattern ($p). Re-run manually if truly intended." >&2
    exit 2
  fi
done

exit 0
