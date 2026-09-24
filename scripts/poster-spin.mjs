// Captures a frame of the lattice near the critical point and writes
// public/forge/spin/poster.webp — the still the page shows to crawlers, to
// readers who asked for less motion, and for the moment before the first real
// frame arrives.
//
// Near T_c on purpose: it is the one temperature where the lattice has structure
// at every size at once, so the still says what the page is about. A hot frame
// is featureless noise and a cold one is two flat blocks.
//
// Usage: node scripts/poster-spin.mjs [baseUrl]   (serve the build first)
//        default http://127.0.0.1:4387
import { chromium } from 'playwright';
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const base = (process.argv[2] || 'http://127.0.0.1:4387').replace(/\/$/, '');
const out = 'public/forge/spin/poster.webp';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto(`${base}/forge/spin/`, { waitUntil: 'domcontentloaded' });
await page.click('#begin');
await page.waitForFunction(() => window.__spin && window.__spin.frames > 5, null, { timeout: 20000 });

// Scroll to the middle of the track, which is where the temperature map puts the
// critical point, then let the lattice actually settle there before capturing.
await page.evaluate(() => scrollTo(0, 0.5 * (document.documentElement.scrollHeight - innerHeight)));
await page.waitForTimeout(8000);
await page.evaluate(() => window.__spin.pause());

const word = (await page.textContent('#readout-word'))?.trim();
if (word !== 'NEAR CRITICAL') {
  await browser.close();
  console.error(`refusing to write the poster: the lattice is ${word}, not NEAR CRITICAL`);
  process.exit(1);
}
// Read the canvas backing store rather than screenshotting the element. An
// element screenshot clips the rendered page to that element's box, and the
// canvas is fixed at inset 0 — so the nav, the vignette and the panel would all
// be baked into the still and then drawn over again by the real ones.
const dataUrl = await page.evaluate(() => document.getElementById('lattice').toDataURL('image/png'));
const png = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
await browser.close();

const webp = await sharp(png).webp({ quality: 80 }).toBuffer();
writeFileSync(out, webp);
console.log(`wrote ${out} (${(webp.length / 1024).toFixed(0)} KB)`);
