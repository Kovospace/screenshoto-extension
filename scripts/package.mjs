// Zips dist/ into shotkit.zip (top-level folder "shotkit", as the README install steps expect).
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const zip = resolve('shotkit.zip');
const stage = await mkdtemp(join(tmpdir(), 'shotkit-'));
try {
  await cp('dist', join(stage, 'shotkit'), { recursive: true, filter: src => !src.endsWith('.map') });
  await rm(zip, { force: true });
  execFileSync('zip', ['-qr', zip, 'shotkit'], { cwd: stage, stdio: 'inherit' });
  console.log(`wrote ${zip}`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
