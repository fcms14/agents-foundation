#!/usr/bin/env node
/**
 * Docs gate — deterministic enforcement that a schema migration ships with a
 * documentation update for the same service, so the ERD (and the C4 docs) cannot
 * silently drift behind the schema (see .claude/rules/docs.md — "ERD is updated
 * on every migration").
 *
 * Rule: if this commit stages a migration file under a service (a `.sql` file
 * inside a `services/<svc>/.../migrations/` folder), it must also stage at least
 * one README under that same service. The canonical target is
 * `services/<svc>/src/db/README.md` (the ERD), but any service README counts so
 * the gate stays low-friction.
 *
 * Usage:
 *   node .claude/scripts/validate-docs.mjs --staged    (husky pre-commit)
 *   node .claude/scripts/validate-docs.mjs <file ...>   (check explicit paths)
 *
 * Exit 0 = ok (or nothing to check). Exit 1 = a migration without service docs.
 */
import { execSync } from 'node:child_process';

const argv = process.argv.slice(2);
const staged = argv.includes('--staged');

function run(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8' });
  } catch {
    return '';
  }
}

let changed = [];
if (staged) {
  const out = run('git diff --cached --name-status --diff-filter=ACMR');
  changed = out
    .split('\n')
    .filter(Boolean)
    .map((l) => l.split('\t').pop());
} else {
  changed = argv.filter((a) => !a.startsWith('--'));
}
if (changed.length === 0) process.exit(0);

const MIGRATION = /^services\/([^/]+)\/(?!dist\/).*\/migrations\/[^/]+\.sql$/;
const SERVICE_README = /^services\/([^/]+)\/.*README\.md$/i;

const migratedServices = new Set();
const documentedServices = new Set();
for (const f of changed) {
  const m = f.match(MIGRATION);
  if (m) migratedServices.add(m[1]);
  const r = f.match(SERVICE_README);
  if (r) documentedServices.add(r[1]);
}

const problems = [];
for (const svc of migratedServices) {
  if (!documentedServices.has(svc)) {
    problems.push(
      `services/${svc}: a migration is staged but no README under services/${svc} is — refresh services/${svc}/src/db/README.md (ERD + migration list). Run /docs-sync ${svc} --erd. If this migration truly changes no schema shape, add a one-line note to the db README and re-stage.`,
    );
  }
}

if (problems.length > 0) {
  console.error('\n✖ Docs gate (a migration must ship with its ERD/docs update):');
  for (const p of problems) console.error(`  - ${p}`);
  console.error('');
  process.exit(1);
}
process.exit(0);
