// End-to-end test: drives the real extension in Chrome for Testing (headless) through region
// capture, element capture, editing, saving and persistence, and asserts what a user would see.
//
//   npm run test:e2e                               build, then test dist/
//   node test-e2e/run.mjs --ext <dir> [--json f]   test any unpacked build; --json writes every
//                                                  observation (used to prove a refactoring
//                                                  changed nothing: run old and new, diff the JSON)
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const here = dirname(fileURLToPath(import.meta.url));
const arg = name => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
const extDir = resolve(arg('--ext') ?? join(here, '..', 'dist'));
const jsonOut = arg('--json');
const sha = buf => createHash('sha256').update(buf).digest('hex').slice(0, 16);
const sleep = ms => new Promise(r => setTimeout(r, ms));

const fixture = await readFile(join(here, 'fixture.html'));
const server = createServer((_, res) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(fixture); });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const pageUrl = `http://127.0.0.1:${server.address().port}/`;

// A throwaway profile whose download folder is a temp dir: chrome.downloads keeps the extension's
// file names there (CDP's Browser.setDownloadBehavior would rename every file to a GUID).
const work = await mkdtemp(join(tmpdir(), 'screenshoto-e2e-'));
const downloads = join(work, 'downloads');
await mkdir(join(work, 'profile', 'Default'), { recursive: true });
await writeFile(join(work, 'profile', 'Default', 'Preferences'),
  JSON.stringify({ download: { default_directory: downloads, prompt_for_download: false } }));
const browser = await puppeteer.launch({
  headless: true, pipe: true, enableExtensions: true, defaultViewport: null, userDataDir: join(work, 'profile'),
  args: ['--window-size=1280,900', '--hide-scrollbars', '--font-render-hinting=none'],
});
const observed = {};
let failures = 0;

async function step(name, fn) {
  try {
    observed[name] = await fn();
    console.log(`  ok  ${name}`);
  } catch (e) {
    failures++;
    console.log(`  FAIL ${name}\n       ${String(e.message).split('\n').slice(0, 24).join('\n       ')}`);
  }
}

try {
  const extId = await browser.installExtension(extDir);
  const extension = (await browser.extensions()).get(extId);
  await browser.defaultBrowserContext().overridePermissions(`chrome-extension://${extId}`, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
  console.log(`extension ${extension.name} ${extension.version} from ${extDir}`);

  // ---------- helpers ----------
  const openFixture = async () => {
    const page = await browser.newPage();
    await page.goto(pageUrl, { waitUntil: 'load' });
    return page;
  };
  const pickerOpen = page => page.evaluate(() => !!document.querySelector('screenshoto-picker'));
  const waitForEditor = async () => {
    const target = await browser.waitForTarget(t => t.url().includes('/editor.html#'), { timeout: 20000 });
    const page = await target.page();
    await page.waitForFunction(() => /px · view/.test(document.querySelector('#info')?.textContent || ''), { timeout: 10000 });
    return page;
  };
  /** Canvas-relative point from fractions of the canvas box. */
  const at = async (editor, fx, fy) => {
    const r = await editor.$eval('#canvas', c => { const b = c.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
    return { x: r.x + fx * r.w, y: r.y + fy * r.h };
  };
  const drag = async (editor, from, to, { shift = false, steps = 8 } = {}) => {
    const a = await at(editor, ...from), b = await at(editor, ...to);
    if (shift) await editor.keyboard.down('Shift');
    await editor.mouse.move(a.x, a.y);
    await editor.mouse.down();
    await editor.mouse.move(b.x, b.y, { steps });
    await editor.mouse.up();
    if (shift) await editor.keyboard.up('Shift');
  };
  const click = async (editor, f) => { const p = await at(editor, ...f); await editor.mouse.click(p.x, p.y); };
  const doubleClick = async (editor, f) => {
    const p = await at(editor, ...f);
    await editor.mouse.move(p.x, p.y);
    for (const clickCount of [1, 2]) { await editor.mouse.down({ clickCount }); await editor.mouse.up({ clickCount }); }
  };
  const ui = editor => editor.evaluate(() => {
    const on = sel => [...document.querySelectorAll(sel)].filter(b => b.classList.contains('on')).map(b => b.dataset.scale ?? b.dataset.tool ?? b.dataset.size ?? b.dataset.color);
    const q = s => document.querySelector(s);
    return {
      title: document.title, info: q('#info').textContent, save: q('#save').textContent,
      scale: on('[data-scale]'), tool: on('[data-tool]'), size: on('[data-size]'), color: on('[data-color]'),
      disabledScales: [...document.querySelectorAll('[data-scale]')].filter(b => b.disabled).map(b => b.dataset.scale),
      undo: !q('#undo').disabled, redo: !q('#redo').disabled, del: !q('#del').disabled,
      cursor: q('#canvas')?.dataset.cursor, canvas: q('#canvas') && [q('#canvas').width, q('#canvas').height],
      toast: q('#toast').classList.contains('show') ? q('#toast').textContent : null,
    };
  });
  const canvasHash = editor => editor.$eval('#canvas', c => c.toDataURL('image/png')).then(sha);
  const storedCapture = editor => editor.evaluate(async () => {
    const id = decodeURIComponent(location.hash.slice(1));
    const db = await new Promise((res, rej) => { const r = indexedDB.open('shotkit'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const cap = await new Promise((res, rej) => { const g = db.transaction('captures').objectStore('captures').get(id); g.onsuccess = () => res(g.result); g.onerror = () => rej(g.error); });
    const images = {};
    for (const [s, blob] of Object.entries(cap.images)) {
      const bmp = await createImageBitmap(blob);
      images[s] = [bmp.width, bmp.height];
    }
    const round = v => v === undefined ? v : JSON.parse(JSON.stringify(v, (_, x) => typeof x === 'number' ? Math.round(x * 1000) / 1000 : x));
    return { images, failed: cap.failed, rect: round(cap.rect), url: cap.url, title: cap.title, annotations: round(cap.annotations), lastScale: cap.lastScale };
  });
  const savedFiles = async (expected, timeout = 10000) => {
    const dir = join(downloads, 'Screenshoto Web');
    for (const end = Date.now() + timeout; Date.now() < end; await sleep(100)) {
      const names = (await readdir(dir).catch(() => [])).filter(n => n.endsWith('.png'));
      if (names.length >= expected) {
        await sleep(300);
        const files = {};
        for (const n of names.sort()) files[n.replace(/^.*_\d{4}-\d\d-\d\d_\d\d-\d\d-\d\d/, '<host_time>')] = sha(await readFile(join(dir, n)));
        await rm(dir, { recursive: true, force: true });
        return files;
      }
    }
    throw new Error(`expected ${expected} downloaded file(s)`);
  };

  // ---------- picker ----------
  await step('picker: toolbar button opens it, pressing again closes it', async () => {
    const page = await openFixture();
    await page.triggerExtensionAction(extension);
    await page.waitForSelector('screenshoto-picker');
    await page.triggerExtensionAction(extension);
    await page.waitForFunction(() => !document.querySelector('screenshoto-picker'));
    await page.triggerExtensionAction(extension);
    await page.waitForSelector('screenshoto-picker');
    await page.keyboard.press('Escape');
    const afterEscape = await pickerOpen(page);
    assert.equal(afterEscape, false, 'Esc cancels');
    // A tiny drag (< 4 px) is ignored and the picker stays open.
    await page.triggerExtensionAction(extension);
    await page.waitForSelector('screenshoto-picker');
    await page.mouse.move(100, 100); await page.mouse.down(); await page.mouse.move(102, 102); await page.mouse.up();
    await sleep(300);
    const afterTinyDrag = await pickerOpen(page);
    assert.equal(afterTinyDrag, true, 'tiny drag ignored');
    // A finished rectangle waits for confirmation; Enter captures it.
    await page.mouse.move(200, 150); await page.mouse.down(); await page.mouse.move(300, 250, { steps: 4 }); await page.mouse.up();
    await page.mouse.move(250, 200); await page.mouse.down(); await page.mouse.move(270, 230, { steps: 4 }); await page.mouse.up(); // move it
    await page.keyboard.press('Enter');
    const ed = await waitForEditor();
    const moved = (await storedCapture(ed)).rect;
    assert.deepEqual(moved, { x: 220, y: 180, width: 100, height: 100 });
    await ed.close();
    await page.close();
    return { afterEscape, afterTinyDrag, moved };
  });

  // ---------- region capture + editing ----------
  let editor;
  await step('region capture opens the editor with all four scales', async () => {
    const page = await openFixture();
    await page.evaluate(() => scrollTo(0, 40));
    await page.triggerExtensionAction(extension);
    await page.waitForSelector('screenshoto-picker');
    await page.mouse.move(60, 30); await page.mouse.down(); await page.mouse.move(470, 345, { steps: 6 }); await page.mouse.up();
    await sleep(400);
    assert.equal(await pickerOpen(page), true, 'a finished rectangle is offered for adjusting, not captured');
    // Resize with the bottom-right handle back to 400×300, then press the camera button
    // (right-aligned under the box; the overlay's shadow root is closed, so click by position).
    await page.mouse.move(470, 345); await page.mouse.down(); await page.mouse.move(460, 330, { steps: 4 }); await page.mouse.up();
    await page.mouse.click(440, 351);
    editor = await waitForEditor();
    await editor.bringToFront();
    const state = await ui(editor);
    assert.deepEqual(state.scale, ['2']);
    assert.equal(state.save, 'Save 2×');
    assert.deepEqual(state.tool, ['arrow']);
    assert.deepEqual(state.size, ['M']);
    assert.deepEqual(state.color, ['#e5243b']);
    assert.match(state.title, /^Screenshoto Web — Screenshoto Web fixture$/);
    assert.equal(state.undo || state.redo || state.del, false);
    const stored = await storedCapture(editor);
    assert.deepEqual(Object.keys(stored.images), ['1', '2', '3', '4']);
    assert.deepEqual(stored.rect, { x: 60, y: 70, width: 400, height: 300 }); // page coords: scrolled by 40
    assert.deepEqual(stored.images['1'], [400, 300]);
    assert.deepEqual(stored.images['4'], [1600, 1200]);
    return { state, stored, canvas: await canvasHash(editor) };
  });

  const edits = [
    ['arrow (default tool)', e => drag(e, [0.1, 0.1], [0.4, 0.3])],
    ['rect with Shift = square', async e => { await e.keyboard.press('r'); await drag(e, [0.5, 0.5], [0.8, 0.6], { shift: true }); }],
    ['ellipse in another colour and size', async e => {
      await e.keyboard.press('o');
      await e.click('[data-color="#16a34a"]');
      await e.click('[data-size="L"]');
      await drag(e, [0.15, 0.55], [0.35, 0.9]);
    }],
    ['click without drag creates nothing', async e => { await e.keyboard.press('r'); await click(e, [0.9, 0.1]); }],
    ['step markers 1 and 2 (second dragged into place)', async e => {
      await e.keyboard.press('n');
      await click(e, [0.6, 0.15]);
      await drag(e, [0.7, 0.2], [0.75, 0.3]);
    }],
    ['multi-line text', async e => {
      await e.keyboard.press('t');
      await click(e, [0.45, 0.75]);
      await e.waitForSelector('.text-edit');
      await e.keyboard.type('Hello');
      await e.keyboard.down('Shift'); await e.keyboard.press('Enter'); await e.keyboard.up('Shift');
      await e.keyboard.type('World  ');
      await e.keyboard.press('Enter');
    }],
    ['select tool picks the arrow, Shift+→ nudges, recolour, resize', async e => {
      await e.keyboard.press('v');
      await click(e, [0.25, 0.2]);
      await e.keyboard.down('Shift'); await e.keyboard.press('ArrowRight'); await e.keyboard.up('Shift');
      await e.keyboard.press('ArrowDown');
      await e.click('[data-color="#2563eb"]');
      await e.click('[data-size="S"]');
    }],
    ['drag the arrow head handle', async e => drag(e, [0.4 + 11 / 400, 0.3 + 1 / 300], [0.45, 0.45])],
    ['select and delete the ellipse, undo, redo', async e => {
      await click(e, [0.15, 0.725]);
      await e.keyboard.press('Delete');
      await e.keyboard.down('Control'); await e.keyboard.press('z'); await e.keyboard.up('Control');
      await e.keyboard.down('Control'); await e.keyboard.down('Shift'); await e.keyboard.press('z');
      await e.keyboard.up('Shift'); await e.keyboard.up('Control');
      await e.keyboard.down('Control'); await e.keyboard.press('z'); await e.keyboard.up('Control');
    }],
    ['double-click text, change it, Escape keeps the old text', async e => {
      await doubleClick(e, [0.47, 0.77]);
      await e.waitForSelector('.text-edit');
      await e.keyboard.type('XYZ');
      await e.keyboard.press('Escape');
    }],
    ['text tool on an existing (unselected) text edits it', async e => {
      await e.keyboard.press('Escape'); // a press on the *selected* text would just grab it
      await e.keyboard.press('t');
      await click(e, [0.47, 0.77]);
      await e.waitForSelector('.text-edit');
      await e.keyboard.press('End');
      await e.keyboard.type('!');
      await e.keyboard.press('Enter');
    }],
    ['moving the selected step with a drawing tool active', async e => {
      await e.keyboard.press('v');
      await click(e, [0.6, 0.15]);
      await e.keyboard.press('a');
      await drag(e, [0.6, 0.15], [0.62, 0.2]);
    }],
    ['Escape deselects', async e => e.keyboard.press('Escape')],
  ];
  for (const [name, act] of edits) {
    await step(`edit: ${name}`, async () => {
      await act(editor);
      await sleep(50);
      return { ui: await ui(editor), canvas: await canvasHash(editor) };
    });
  }

  await step('switching to 3× keeps annotations in place and remembers the scale', async () => {
    await editor.keyboard.press('3');
    await sleep(600); // autosave debounce
    const state = await ui(editor);
    assert.deepEqual(state.scale, ['3']);
    assert.equal(state.save, 'Save 3×');
    const stored = await storedCapture(editor);
    assert.equal(stored.lastScale, 3);
    assert.deepEqual(stored.annotations.map(a => a.type), ['arrow', 'rect', 'ellipse', 'step', 'step', 'text']);
    assert.deepEqual(stored.annotations.filter(a => a.type === 'step').map(a => a.n), [1, 2]);
    assert.equal(stored.annotations.find(a => a.type === 'text').text, 'Hello\nWorld!');
    const rect = stored.annotations.find(a => a.type === 'rect');
    assert.equal(Math.abs(rect.x2 - rect.x1), Math.abs(rect.y2 - rect.y1), 'Shift makes a square');
    return { state, annotations: stored.annotations, canvas: await canvasHash(editor) };
  });

  await step('reopening the editor restores annotations and scale', async () => {
    const url = editor.url();
    await editor.reload();
    await editor.waitForFunction(() => /px · view/.test(document.querySelector('#info')?.textContent || ''));
    const state = await ui(editor);
    assert.deepEqual(state.scale, ['3']);
    assert.equal(editor.url(), url);
    return { state, canvas: await canvasHash(editor) };
  });

  await step('Save all writes one annotated PNG per scale', async () => {
    await editor.click('#saveAll');
    const files = await savedFiles(4);
    assert.deepEqual(Object.keys(files), ['<host_time>@1x.png', '<host_time>@2x.png', '<host_time>@3x.png', '<host_time>@4x.png']);
    await sleep(100);
    const state = await ui(editor);
    assert.equal(state.toast, 'Saved 4 files to Downloads/Screenshoto Web');
    return { files, toast: state.toast };
  });

  await step('Ctrl+S saves the current scale', async () => {
    await editor.keyboard.down('Control'); await editor.keyboard.press('s'); await editor.keyboard.up('Control');
    const files = await savedFiles(1);
    const state = await ui(editor);
    assert.equal(state.toast, 'Saved 3× to Downloads/Screenshoto Web');
    return { files, toast: state.toast };
  });

  await step('Copy reports its outcome', async () => {
    await editor.click('#copy');
    await editor.waitForFunction(() => !document.querySelector('#toast').textContent.startsWith('Saved'), { timeout: 5000 });
    const { toast } = await ui(editor);
    assert.match(toast, /^(Copied 3× image|Copy failed: .+)$/);
    return { toast: toast.startsWith('Copied') ? toast : 'Copy failed: …' };
  });
  await editor?.close();

  // ---------- element capture ----------
  await step('element capture: hover, ↑ parent, ↓ child, Enter', async () => {
    const page = await openFixture();
    await page.triggerExtensionAction(extension);
    await page.waitForSelector('screenshoto-picker');
    await page.keyboard.press('e');
    const leaf = await page.$eval('#leaf', el => { const r = el.getBoundingClientRect(); return { x: r.left + 5, y: r.top + 5 }; });
    await page.mouse.move(leaf.x, leaf.y);
    await page.keyboard.press('ArrowUp'); // .inner
    await page.keyboard.press('ArrowUp'); // #target
    await page.keyboard.press('ArrowUp'); // main
    await page.keyboard.press('ArrowDown'); // back to #target
    const r3 = v => Math.round(v * 1000) / 1000;
    const expected = await page.$eval('#target', el => { const r = el.getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }; });
    for (const k in expected) expected[k] = r3(expected[k]);
    await page.keyboard.press('Enter');
    const ed = await waitForEditor();
    const stored = await storedCapture(ed);
    assert.deepEqual(stored.rect, expected);
    const state = await ui(ed);
    await ed.close();
    await page.close();
    return { stored, state };
  });

  await step('element capture by click, after switching modes with the toolbar', async () => {
    const page = await openFixture();
    await page.triggerExtensionAction(extension);
    await page.waitForSelector('screenshoto-picker');
    const handle = await page.evaluateHandle(() => document.querySelector('screenshoto-picker'));
    // The overlay's shadow root is closed: switch with keys, which the toolbar mirrors.
    await page.keyboard.press('e'); await page.keyboard.press('r'); await page.keyboard.press('E');
    await handle.dispose();
    const card = await page.$eval('.card h2', el => { const r = el.getBoundingClientRect(); return { x: r.left + 5, y: r.top + 5 }; });
    await page.mouse.move(card.x, card.y);
    await page.mouse.down(); await page.mouse.up();
    const ed = await waitForEditor();
    const stored = await storedCapture(ed);
    await ed.close();
    await page.close();
    return { stored };
  });

  // ---------- editor without a capture ----------
  await step('editor explains a missing capture', async () => {
    const page = await browser.newPage();
    await page.goto(`chrome-extension://${extId}/editor.html#does-not-exist`);
    await page.waitForSelector('.fatal');
    const text = await page.$eval('.fatal', d => d.textContent);
    assert.equal(text, 'This capture is no longer stored. Captures are kept for 7 days.');
    await page.goto(`chrome-extension://${extId}/editor.html`);
    await page.reload();
    await page.waitForSelector('.fatal');
    const noId = await page.$eval('.fatal', d => d.textContent);
    assert.equal(noId, 'Nothing to edit — start a capture from the toolbar button.');
    await page.close();
    return { text, noId };
  });
} finally {
  await browser.close();
  server.close();
  await rm(work, { recursive: true, force: true });
}

if (jsonOut) await writeFile(jsonOut, JSON.stringify(observed, null, 2).replaceAll(pageUrl, 'http://fixture/'));
console.log(failures ? `\n${failures} e2e step(s) failed` : '\nall e2e steps passed');
process.exit(failures ? 1 : 0);
