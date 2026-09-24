// Captures the lattice held at the critical temperature and writes
// public/forge/critical/poster.webp (the still under the canvas, square) and
// public/forge/critical/og.png (1200×630, the same frame cropped for cards).
//
// At T_c on purpose: it is the temperature the piece is about, and the one
// where the lattice has structure at every size at once.
//
// Usage: node scripts/poster-critical.mjs [baseUrl]   (serve the build first)
//        default http://127.0.0.1:4387
import { chromium } from 'playwright';
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';

const base = (process.argv[2] || 'http://127.0.0.1:4387').replace(/\/$/, '');
const dir = 'public/forge/critical';
mkdirSync(dir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await page.goto(`${base}/forge/critical/`, { waitUntil: 'domcontentloaded' });
await page.click('#begin');
await page.waitForFunction(() => window.__critical && window.__critical.frames > 5, null, { timeout: 20000 });
// The page opens at the critical temperature and settles there on its own;
// wait for the hold so the burst is spent and the ink wash has caught up.
await page.waitForFunction(() => window.__critical.phase === 'holding', null, { timeout: 30000 });
await page.waitForTimeout(3000);

const T = await page.evaluate(() => window.__critical.temperature());
const word = (await page.textContent('#phase-word'))?.trim();
if (word !== 'CRITICAL' || Math.abs(T - 2.269185314213022) > 1e-9) {
  await browser.close();
  console.error(`refusing to write the poster: the lattice is ${word} at ${T}, not at the critical temperature`);
  process.exit(1);
}
// Read the canvas backing store rather than screenshotting the element, so the
// still carries only the lattice: no border, no page chrome.
const dataUrl = await page.evaluate(() => document.getElementById('lattice').toDataURL('image/png'));
const png = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
await browser.close();

const poster = await sharp(png).resize(800, 800, { fit: 'cover' }).webp({ quality: 80 }).toBuffer();
writeFileSync(`${dir}/poster.webp`, poster);
console.log(`wrote ${dir}/poster.webp (${(poster.length / 1024).toFixed(0)} KB)`);
// The per-pixel film grain defeats lossless PNG (a megabyte at full colour,
// still half that on a palette). A small median filter takes the grain out and
// leaves the wash, which then compresses to a sensible card image.
const og = await sharp(png).resize(1200, 630, { fit: 'cover' }).median(5).png({ palette: true, colours: 16, dither: 0, compressionLevel: 9 }).toBuffer();
writeFileSync(`${dir}/og.png`, og);
console.log(`wrote ${dir}/og.png (${(og.length / 1024).toFixed(0)} KB)`);
