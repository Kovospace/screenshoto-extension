// Zips dist/ into screenshoto-web.zip (top-level folder "screenshoto-web", as the README install steps expect).
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const zip = resolve('screenshoto-web.zip');
const stage = await mkdtemp(join(tmpdir(), 'screenshoto-web-'));
try {
  await cp('dist', join(stage, 'screenshoto-web'), { recursive: true, filter: src => !src.endsWith('.map') });
  await rm(zip, { force: true });
  execFileSync('zip', ['-qr', zip, 'screenshoto-web'], { cwd: stage, stdio: 'inherit' });
  console.log(`wrote ${zip}`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
