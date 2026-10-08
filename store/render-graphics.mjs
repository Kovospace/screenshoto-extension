// Renders the store graphics that are generated rather than hand-made:
//   materials/promo/small-promo-tile.png  (440×280, from small-promo-tile.html)
//   materials/store-icon/icon-{128,256,512}.png  (from icon.svg: artwork at 75 % with a transparent
//                                           margin — 96 px + 16 px padding at 128, as the Web Store
//                                           icon guidelines ask — scaled for 256 and 512)
// Promo PNGs are flattened to 24-bit (no alpha) — the store rejects alpha in promo images.
//
//   node store/render-graphics.mjs
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';

const here = dirname(fileURLToPath(import.meta.url));
const promoDir = join(here, 'materials', 'promo');

const browser = await puppeteer.launch({ headless: true, args: ['--allow-file-access-from-files'] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 440, height: 280, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(join(promoDir, 'small-promo-tile.html')).href, { waitUntil: 'load' });
  const png = join(promoDir, 'small-promo-tile.png');
  await page.screenshot({ path: png });
  execFileSync('convert', [png, '-background', '#000000', '-alpha', 'remove', '-alpha', 'off', `PNG24:${png}`]);
  console.log(`wrote ${png}`);

  const iconDir = join(here, 'materials', 'store-icon');
  const svg = await readFile(join(iconDir, 'icon.svg'), 'utf8');
  for (const size of [128, 256, 512]) {
    const art = size * 0.75;
    await page.setViewport({ width: size, height: size, deviceScaleFactor: 1 });
    await page.setContent(`<style>html,body{margin:0;background:transparent}
      svg{display:block;width:${art}px;height:${art}px;margin:${(size - art) / 2}px}</style>${svg}`);
    const out = join(iconDir, `icon-${size}.png`);
    await page.screenshot({ path: out, omitBackground: true });
    console.log(`wrote ${out}`);
  }
} finally {
  await browser.close();
}

