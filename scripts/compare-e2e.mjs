// Proves a change is invisible to users: runs the e2e scenario against the build of a git ref
// and against the working tree, and diffs every observation (UI state, canvas pixel hashes,
// stored records, saved PNG hashes).
//
//   npm run compare -- <git-ref>     e.g. npm run compare -- main, npm run compare -- HEAD~1
//
// The scenario (test-e2e/run.mjs) is always the working tree's, so both builds face the same
// script. A ref from before the TypeScript rewrite (plain JS in src/) is loaded as-is.
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const ref = process.argv[2];
if (!ref) {
  console.error('usage: npm run compare -- <git-ref>');
  process.exit(2);
}
const root = resolve('.');
const run = (cmd, args, cwd = root) => execFileSync(cmd, args, { cwd, stdio: 'inherit' });

const work = await mkdtemp(join(tmpdir(), 'screenshoto-compare-'));
const tree = join(work, 'tree');
try {
  run('git', ['worktree', 'add', '--detach', tree, ref]);
  let oldExt;
  if (existsSync(join(tree, 'scripts', 'build.mjs'))) {
    await symlink(join(root, 'node_modules'), join(tree, 'node_modules'), 'dir');
    run('node', ['scripts/build.mjs'], tree);
    oldExt = join(tree, 'dist');
  } else {
    oldExt = join(tree, 'src'); // original plain-JS layout
  }
  run('node', ['scripts/build.mjs']);

  const oldJson = join(work, 'old.json'), newJson = join(work, 'new.json');
  const e2e = (ext, out) => {
    try { run('node', ['test-e2e/run.mjs', '--ext', ext, '--json', out]); } catch { /* differences are reported below */ }
  };
  e2e(oldExt, oldJson);
  e2e(join(root, 'dist'), newJson);

  const [a, b] = await Promise.all([oldJson, newJson].map(async f => JSON.parse(await readFile(f, 'utf8'))));
  const diffs = [];
  (function walk(x, y, path) {
    if (JSON.stringify(x) === JSON.stringify(y)) return;
    if (x && y && typeof x === 'object' && typeof y === 'object') {
      for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) walk(x[k], y[k], `${path}.${k}`);
    } else diffs.push(`${path}\n    ${ref}: ${JSON.stringify(x)}\n    now: ${JSON.stringify(y)}`);
  })(a, b, '');

  if (diffs.length) {
    console.log(`\n${diffs.length} observable difference(s) against ${ref}:\n` + diffs.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`\nIDENTICAL: every e2e observation matches ${ref}.`);
  }
} finally {
  execFileSync('git', ['worktree', 'remove', '--force', tree], { cwd: root, stdio: 'ignore' });
  await rm(work, { recursive: true, force: true });
}
