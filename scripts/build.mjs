// Builds the unpacked extension into dist/.
//
// esbuild, not Vite: picker.js is injected with chrome.scripting.executeScript({ files }), so it must be
// one self-contained classic script. esbuild bundles every entry on its own (no shared chunks), which is
// exactly what three independent extension contexts need.
//
//   node scripts/build.mjs           one-off build
//   node scripts/build.mjs --watch   rebuild on change (reload the extension in chrome://extensions)
import * as esbuild from 'esbuild';
import { cp, mkdir, rm } from 'node:fs/promises';

const watch = process.argv.includes('--watch');
const outdir = 'dist';

const common = { bundle: true, target: 'chrome116', sourcemap: 'linked', logLevel: 'info', legalComments: 'none' };

/** @type {esbuild.BuildOptions[]} */
const entries = [
  // Service worker ("type": "module" in the manifest).
  { ...common, entryPoints: { background: 'src/background/background.ts' }, format: 'esm', outdir },
  // Editor page (<script type="module">).
  { ...common, entryPoints: { editor: 'src/editor/editor.ts' }, format: 'esm', outdir },
  // Injected into the inspected page: must be a classic script.
  { ...common, entryPoints: { picker: 'src/picker/picker.ts' }, format: 'iife', outdir },
];

async function copyStatic() {
  await cp('public', outdir, { recursive: true });
  await cp('src/editor/editor.html', `${outdir}/editor.html`);
  await cp('src/editor/editor.css', `${outdir}/editor.css`);
}

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });
await copyStatic();

if (watch) {
  const contexts = await Promise.all(entries.map(e => esbuild.context(e)));
  await Promise.all(contexts.map(c => c.watch()));
  console.log('watching… (static files are copied once; restart to pick up manifest/html/css changes)');
} else {
  await Promise.all(entries.map(e => esbuild.build(e)));
}
