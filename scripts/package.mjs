// Packages a release build of dist/.
//
//   node scripts/package.mjs           screenshoto-web.zip — top folder "screenshoto-web", for
//                                      unzipping and "Load unpacked" (README install steps)
//   node scripts/package.mjs --store   store/screenshoto-web-<version>.zip — manifest.json at the
//                                      zip root, as the Chrome Web Store upload requires
import { execFileSync } from 'node:child_process';
import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const store = process.argv.includes('--store');
const { version } = JSON.parse(await readFile('dist/manifest.json', 'utf8'));
const zip = resolve(store ? `store/screenshoto-web-${version}.zip` : 'screenshoto-web.zip');
const stage = await mkdtemp(join(tmpdir(), 'screenshoto-web-'));
const folder = 'screenshoto-web';
try {
  await cp('dist', join(stage, folder), { recursive: true, filter: src => !src.endsWith('.map') });
  await rm(zip, { force: true });
  execFileSync('zip', store ? ['-qr', '-X', zip, '.'] : ['-qr', '-X', zip, folder],
    { cwd: store ? join(stage, folder) : stage, stdio: 'inherit' });
  console.log(`wrote ${zip}`);
} finally {
  await rm(stage, { recursive: true, force: true });
}
