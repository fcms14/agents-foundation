#!/usr/bin/env bash
# PostToolUse hook: format the file just written/edited with Prettier.
# Fail-prepared: if anything is missing (jq/python, prettier, config), exit 0 silently.
set -euo pipefail

payload="$(cat)"

# Extract tool_input.file_path from the hook JSON without hard-failing.
file_path=""
if command -v python3 >/dev/null 2>&1; then
  file_path="$(printf '%s' "$payload" | python3 -c 'import sys,json;
try:
    d=json.load(sys.stdin); print(d.get("tool_input",{}).get("file_path",""))
except Exception:
    print("")' 2>/dev/null || true)"
elif command -v jq >/dev/null 2>&1; then
  file_path="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // ""' 2>/dev/null || true)"
fi

[ -z "$file_path" ] && exit 0
[ -f "$file_path" ] || exit 0

case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs|*.cjs|*.json|*.css|*.scss|*.md|*.mdx|*.yml|*.yaml) ;;
  *) exit 0 ;;
esac

# Only format if a Prettier config exists somewhere up the tree and prettier is runnable.
if command -v npx >/dev/null 2>&1; then
  npx --no-install prettier --write "$file_path" >/dev/null 2>&1 || true
fi

exit 0
