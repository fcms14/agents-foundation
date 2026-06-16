#!/usr/bin/env node
/**
 * apply-verdict — deterministically apply a reviewer's verdict to a task file.
 *
 * The reviewer agent JUDGES (read-only) and returns a structured verdict; this
 * script does the bookkeeping the agent must never be trusted to do by hand:
 * tick the confirmed Acceptance Criteria, stamp a standardized `## Verdict`
 * section + a dated Log entry, and move the task to its new state. This is the
 * judgment-vs-bookkeeping split (docs/foundation/README.md).
 *
 * Usage:
 *   node .claude/scripts/apply-verdict.mjs --task TASK-042 --verdict approve [--ac all|1,3,4] [--note "..."]
 *   node .claude/scripts/apply-verdict.mjs --task TASK-042 --verdict changes-requested --blocking "fix X;add test Y"
 *
 * Defaults: approve ⇒ tick ALL Acceptance Criteria; changes-requested ⇒ tick none.
 * approve ⇒ git mv to work/done/. changes-requested ⇒ git mv to work/review/.
 * Updates the task's state cell in work/ROADMAP.md (best-effort). Never commits.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}
function fail(msg) {
  console.error(`apply-verdict: ${msg}`);
  process.exit(1);
}

const taskArg = arg('task');
const verdict = arg('verdict');
const acArg = arg('ac');
const note = arg('note');
const blocking = arg('blocking');
const dateArg = arg('date'); // tests/cron may pin a date; else derived from git

if (!taskArg) fail('missing --task TASK-NNN');
if (verdict !== 'approve' && verdict !== 'changes-requested') {
  fail('missing/invalid --verdict (approve | changes-requested)');
}

const STATES = ['backlog', 'ready', 'active', 'review', 'done'];
const id = taskArg.startsWith('TASK-') ? taskArg : `TASK-${taskArg}`;
const num = id.replace(/^TASK-/, '');

let current = null;
let file = null;
for (const st of STATES) {
  let entries = [];
  try {
    entries = readdirSync(`work/${st}`);
  } catch {
    continue;
  }
  const hit = entries.find((f) => f === `${id}.md` || f.startsWith(`${id}-`));
  if (hit) {
    current = st;
    file = `work/${st}/${hit}`;
    break;
  }
}
if (!file) fail(`task ${id} not found under work/**`);

let content = readFileSync(file, 'utf8');
const lines = content.split('\n');

const today =
  dateArg ||
  (() => {
    try {
      return execSync('git log -1 --format=%cs', { encoding: 'utf8' }).trim() || '';
    } catch {
      return '';
    }
  })();

const tickAll = acArg === 'all' || (!acArg && verdict === 'approve');
const tickIdx =
  acArg && acArg !== 'all'
    ? new Set(acArg.split(',').map((s) => parseInt(s.trim(), 10)))
    : new Set();

let inAc = false;
let acSeen = 0;
let acTicked = 0;
for (let i = 0; i < lines.length; i++) {
  if (/^#+\s/.test(lines[i])) {
    inAc = /^#+\s*Acceptance/i.test(lines[i]);
    continue;
  }
  if (inAc && /^\s*-\s*\[[ xX]\]/.test(lines[i])) {
    acSeen++;
    const shouldTick = tickAll || tickIdx.has(acSeen);
    if (shouldTick) {
      lines[i] = lines[i].replace(/^(\s*-\s*)\[[ xX]\]/, '$1[x]');
      acTicked++;
    }
  }
}
content = lines.join('\n');

const verdictBlock = [
  `## Verdict`,
  ``,
  `${verdict}`,
  note ? `\n${note}` : ``,
  blocking && verdict === 'changes-requested'
    ? `\nBlocking:\n${blocking
        .split(';')
        .map((b) => `- ${b.trim()}`)
        .join('\n')}`
    : ``,
]
  .filter((l) => l !== ``)
  .join('\n');

if (/^##\s*Verdict\s*$/im.test(content)) {
  content = content.replace(/^##\s*Verdict[\s\S]*?(?=\n##\s|\n*$)/im, verdictBlock + '\n');
} else if (/^##\s*Log\s*$/im.test(content)) {
  content = content.replace(/^##\s*Log\s*$/im, `${verdictBlock}\n\n## Log`);
} else {
  content = content.replace(/\s*$/, '') + `\n\n${verdictBlock}\n`;
}

const logEntry = `\n### ${today} — Reviewer (Opus) verdict\n${verdict.toUpperCase()} — ${acTicked}/${acSeen} acceptance criteria ticked.${
  note ? ` ${note}` : ''
}\n`;
if (/^##\s*Log\b/im.test(content)) {
  content = content.replace(/(^##\s*Log\b.*$)/im, `$1\n${logEntry.trimStart()}`);
} else {
  content = content.replace(/\s*$/, '') + `\n\n## Log\n${logEntry.trimStart()}`;
}

writeFileSync(file, content);

const target = verdict === 'approve' ? 'done' : 'review';
const dest = file.replace(`work/${current}/`, `work/${target}/`);
if (current !== target) {
  try {
    execSync(`git mv "${file}" "${dest}"`, { stdio: 'pipe' });
  } catch {
    execSync(`mkdir -p work/${target} && mv "${file}" "${dest}"`);
  }
}

try {
  const roadmap = 'work/ROADMAP.md';
  const rm = readFileSync(roadmap, 'utf8').split('\n');
  let synced = false;
  for (let i = 0; i < rm.length; i++) {
    const cells = rm[i].split('|');
    if (cells.length < 3) continue;
    // Match the row by scanning every cell for the task id — the id column is not
    // assumed to be first (the canonical board is `# | Task | agent | … | state`).
    const matches = cells.some((c) => c.trim() === id || c.trim() === `TASK-${num}`);
    if (matches) {
      let last = cells.length - 1;
      while (last > 0 && cells[last].trim() === '') last--;
      cells[last] = ` ${target} `;
      rm[i] = cells.join('|');
      synced = true;
      break;
    }
  }
  if (synced) writeFileSync(roadmap, rm.join('\n'));
  else console.error(`apply-verdict: note — no ROADMAP row matched ${id} (state cell not synced)`);
} catch {
  /* ROADMAP sync is best-effort */
}

console.log(
  `apply-verdict: ${id} → ${verdict} (${acTicked}/${acSeen} ACs ticked), moved ${current} → ${target}.`,
);
console.log(`Review the change, then commit (the gate will validate done/ on commit).`);
