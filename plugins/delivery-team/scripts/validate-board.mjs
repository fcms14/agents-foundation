#!/usr/bin/env node
/**
 * Board gate — deterministic enforcement that a task may only live in
 * `work/done/` once it carries a recorded reviewer approval AND every
 * Acceptance Criteria checkbox is ticked.
 *
 * This is the "no done without a verdict" rule made mechanical, so the gate
 * cannot be skipped by an agent forgetting to mark a box (see the
 * judgment-vs-bookkeeping principle in docs/foundation/README.md).
 *
 * Usage:
 *   node .claude/scripts/validate-board.mjs <file.md> [<file.md> ...]
 *       Validate explicit task files as if they were destined for done/.
 *       Used by the gate-done PreToolUse hook on the move SOURCE (the file
 *       already carries the verdict by the time it is moved).
 *   node .claude/scripts/validate-board.mjs --staged
 *       Validate every task file added/renamed into work/done/ in the staged
 *       diff. Used by the husky pre-commit hook. Scopes enforcement to the
 *       transition happening in THIS commit, so legacy done/ files are not
 *       re-validated.
 *
 * Exit 0 = all good (or nothing to check). Exit 1 = at least one violation
 * (the husky hook aborts the commit; the bash hook maps this to a block).
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const staged = argv.includes('--staged');
let files = argv.filter((a) => !a.startsWith('--'));

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' });
  } catch {
    return '';
  }
}

function stagedContent(path) {
  try {
    return execSync(`git show :"${path}"`, { encoding: 'utf8' });
  } catch {
    return null;
  }
}

function diskContent(path) {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return null;
  }
}

if (staged) {
  const out = run('git diff --cached --name-status --diff-filter=ARM');
  files = [];
  for (const line of out.split('\n')) {
    if (!line.trim()) continue;
    const parts = line.split('\t');
    const path = parts[parts.length - 1];
    if (/^work\/done\/TASK-[\w.-]+\.md$/.test(path)) files.push(path);
  }
}

if (files.length === 0) process.exit(0);

/** Count unticked `- [ ]` checkboxes inside the section opened by headerRe. */
function uncheckedInSection(content, headerRe) {
  const lines = content.split('\n');
  let inSection = false;
  let count = 0;
  for (const ln of lines) {
    if (/^#+\s/.test(ln)) {
      inSection = headerRe.test(ln);
      continue;
    }
    if (inSection && /^\s*-\s*\[ \]/.test(ln)) count++;
  }
  return count;
}

const APPROVE_VERDICT = /##\s*Verdict[\s\S]*?\bapprove\b/i;
const CHANGES_VERDICT = /##\s*Verdict[\s\S]*?\bchanges-requested\b/i;
const APPROVE_LOG =
  /reviewer[\s\S]{0,40}?(approve|changes-requested)|verdict:\s*approve|approved\s*[→>-]+\s*done|reviewer\s*\(opus\)/i;

const problems = [];
for (const f of files) {
  const content = staged
    ? (stagedContent(f) ?? diskContent(f))
    : (diskContent(f) ?? stagedContent(f));
  if (content == null) continue;

  const approved = APPROVE_VERDICT.test(content) || APPROVE_LOG.test(content);
  const changesOnly = !APPROVE_VERDICT.test(content) && CHANGES_VERDICT.test(content);
  const unticked = uncheckedInSection(content, /^#+\s*Acceptance/i);

  if (!approved) {
    problems.push(
      `${f}: no recorded reviewer approval — add a "## Verdict" section with \`approve\` (run /apply-verdict).`,
    );
  } else if (changesOnly) {
    problems.push(
      `${f}: Verdict is changes-requested — a task with open changes must not sit in done/.`,
    );
  }
  if (unticked > 0) {
    problems.push(
      `${f}: ${unticked} unticked Acceptance Criteria checkbox(es) — the reviewer must confirm or the task is not done.`,
    );
  }
}

if (problems.length > 0) {
  console.error('\n✖ Board gate (no done/ without verdict + ticked Acceptance Criteria):');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('');
  process.exit(1);
}
process.exit(0);
