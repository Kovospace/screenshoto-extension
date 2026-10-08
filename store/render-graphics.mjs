// Renders the store graphics that are generated rather than hand-made:
//   materials/promo/small-promo-tile.png  (440×280, from small-promo-tile.html)
//   materials/store-icon/icon-128.png      (the 128 px icon scaled to 96 px with 16 px transparent padding,
//                                           as the Web Store icon guidelines ask)
// Promo PNGs are flattened to 24-bit (no alpha) — the store rejects alpha in promo images.
//
//   node store/render-graphics.mjs
import { execFileSync } from 'node:child_process';
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
  execFileSync('convert', [png, '-background', '#0c0d10', '-alpha', 'remove', '-alpha', 'off', `PNG24:${png}`]);
  console.log(`wrote ${png}`);
} finally {
  await browser.close();
}

const icon = join(here, 'materials', 'store-icon', 'icon-128.png');
execFileSync('convert', [join(here, '..', 'public', 'icons', '128.png'), '-resize', '96x96',
  '-background', 'none', '-gravity', 'center', '-extent', '128x128', `PNG32:${icon}`]);
console.log(`wrote ${icon}`);
