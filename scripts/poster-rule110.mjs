// Captures the Rule 110 tape and writes the two stills the page ships with:
//   public/forge/rule110/poster.webp — 1600×600, shown before the first frame
//                                      and to crawlers
//   public/forge/rule110/og.png      — 1200×630, the social image
//
// Both come from a random first row at half density, drawn from a fixed
// generator seed, so the stills are reproducible and show what the piece is
// about: a repeating background crossed by gliders. A single-cell seed fills only
// a corner of a wide tape at these sizes.
//
// Usage: node scripts/poster-rule110.mjs [baseUrl]   (serve the build first)
//        default http://127.0.0.1:4387
import { chromium } from 'playwright';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const base = (process.argv[2] || 'http://127.0.0.1:4387').replace(/\/$/, '');
const RNG_SEED = 110;
const DENSITY = 0.5;

// The tape's own geometry decides the picture: at 1600 wide the cells are 4 px
// and 150 rows tall, which is 1600×600; at 1200 they are 3 px and 200 rows,
// which is 1200×600, and a band of ground on top makes the 1200×630 social
// size without scaling a single cell.
async function capture(browser, width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(`${base}/forge/rule110/`, { waitUntil: 'domcontentloaded' });
  await page.click('#begin');
  await page.waitForFunction(() => window.__rule110 && window.__rule110.frames > 0, null, { timeout: 20000 });
  await page.evaluate(({ d, s }) => { window.__rule110.pause(); window.__rule110.setSpeed('fast'); window.__rule110.seedRandom(d, s); window.__rule110.play(); }, { d: DENSITY, s: RNG_SEED });
  // Let the tape fill and then a little more, so the seed row's noise has
  // scrolled off and only the settled texture is left.
  await page.waitForFunction(() => window.__rule110.generation >= window.__rule110.rows + 60, null, { timeout: 30000 });
  await page.evaluate(() => window.__rule110.pause());
  const geom = await page.evaluate(() => ({ cellPx: window.__rule110.cellPx, cells: window.__rule110.cells, rows: window.__rule110.rows }));
  const dataUrl = await page.evaluate(() => document.getElementById('tape').toDataURL('image/png'));
  await page.close();
  return { png: Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'), geom };
}

const browser = await chromium.launch();
const poster = await capture(browser, 1600, 1000);
const og = await capture(browser, 1200, 1050);
await browser.close();

const posterOut = 'public/forge/rule110/poster.webp';
const webp = await sharp(poster.png).resize(1600, 600, { fit: 'cover', position: 'right top', kernel: 'nearest' }).webp({ quality: 80 }).toBuffer();
writeFileSync(posterOut, webp);
console.log(`wrote ${posterOut} (${(webp.length / 1024).toFixed(0)} KB) from ${poster.geom.cells}×${poster.geom.rows} cells at ${poster.geom.cellPx}px`);

const ogOut = 'public/forge/rule110/og.png';
const GROUND = { r: 6, g: 6, b: 6 };   // --ground-rgb; scripts are outside the token net
const png = await sharp(og.png).resize(1200, 600, { fit: 'cover', position: 'right top', kernel: 'nearest' }).extend({ top: 30, background: GROUND }).png({ palette: true, colours: 8 }).toBuffer();
writeFileSync(ogOut, png);
console.log(`wrote ${ogOut} (${(png.length / 1024).toFixed(0)} KB) from ${og.geom.cells}×${og.geom.rows} cells at ${og.geom.cellPx}px`);
