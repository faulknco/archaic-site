// Pixel-parity harness for the layout migration.
//   node scripts/parity.mjs capture baseline|after [--base http://127.0.0.1:4387]
//   node scripts/parity.mjs compare [--budget 0.5]
//   node scripts/parity.mjs nav-check [--base http://127.0.0.1:4387]
// Serve the build first: `npm run build && npm run preview` (which listens on 4387).
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

export const PAGES = ['/', '/deeper/', '/forge/', '/services/', '/principles/', '/404.html', '/forge/spin/', '/forge/critical/'];
export const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const GROUND = { r: 6, g: 6, b: 6 };

const [mode, arg] = process.argv.slice(2);
const flag = (name, dflt) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : dflt; };
const base = flag('--base', 'http://127.0.0.1:4387').replace(/\/$/, '');
const slug = (p) => p === '/' ? 'home' : p.replace(/\.html$/, '').replace(/^\/|\/$/g, '').replace(/\//g, '-');

async function capture(set) {
  const dir = `.parity/${set}`;
  mkdirSync(dir, { recursive: true });
  const browser = await chromium.launch();
  for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
    const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    for (const path of PAGES) {
      await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const file = `${dir}/${slug(path)}-${vpName}.png`;
      await page.screenshot({ path: file, fullPage: true });
      console.log('captured', file);
    }
    await ctx.close();
  }
  await browser.close();
}

function pad(png, width, height) {
  if (png.width === width && png.height === height) return png;
  const out = new PNG({ width, height });
  for (let i = 0; i < out.data.length; i += 4) { out.data[i] = GROUND.r; out.data[i + 1] = GROUND.g; out.data[i + 2] = GROUND.b; out.data[i + 3] = 255; }
  PNG.bitblt(png, out, 0, 0, png.width, png.height, 0, 0);
  return out;
}

function compare() {
  const budget = Number(flag('--budget', '0'));
  mkdirSync('.parity/diff', { recursive: true });
  let failed = false;
  for (const vpName of Object.keys(VIEWPORTS)) {
    for (const path of PAGES) {
      const name = `${slug(path)}-${vpName}.png`;
      const a = `.parity/baseline/${name}`, b = `.parity/after/${name}`;
      if (!existsSync(a) || !existsSync(b)) { console.log(`skip  ${name} (missing ${existsSync(a) ? 'after' : 'baseline'})`); continue; }
      let before = PNG.sync.read(readFileSync(a)), after = PNG.sync.read(readFileSync(b));
      const width = Math.max(before.width, after.width), height = Math.max(before.height, after.height);
      const heightDelta = after.height - before.height;
      before = pad(before, width, height); after = pad(after, width, height);
      const diff = new PNG({ width, height });
      const bad = pixelmatch(before.data, after.data, diff.data, width, height, { threshold: 0.1 });
      const pct = (100 * bad) / (width * height);
      writeFileSync(`.parity/diff/${name}`, PNG.sync.write(diff));
      const status = pct <= budget ? 'ok  ' : 'FAIL';
      if (pct > budget) failed = true;
      console.log(`${status} ${name.padEnd(28)} ${pct.toFixed(2)}% (${bad} px, height ${heightDelta >= 0 ? '+' : ''}${heightDelta})`);
    }
  }
  if (failed) { console.error(`parity exceeded budget ${budget}% — inspect .parity/diff/`); process.exit(1); }
}

// Every page carries the shared nav now; /forge/spin was the last one without it
// and Task 12 put it on Base, so there is no exclusion left here.
async function navCheck() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORTS.mobile, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  let failed = false;
  for (const path of PAGES) {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => {
      const nav = document.querySelector('.nav');
      const links = document.querySelector('.nav-links');
      const email = document.querySelector('.nav-contact');
      return {
        hasNav: !!nav,
        docWidth: document.documentElement.scrollWidth,
        linksRight: links ? links.getBoundingClientRect().right : -1,
        emailRight: email ? email.getBoundingClientRect().right : -1,
        emailVisible: email ? email.getClientRects().length > 0 : false,
        vw: innerWidth,
      };
    });
    const ok = r.hasNav && r.docWidth <= r.vw && r.linksRight <= r.vw && r.emailRight <= r.vw && r.emailVisible;
    if (!ok) failed = true;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${path.padEnd(14)} doc=${r.docWidth} links.right=${r.linksRight.toFixed(0)} email.right=${r.emailRight.toFixed(0)} vw=${r.vw}`);
  }
  await browser.close();
  if (failed) process.exit(1);
}

// Only act as a CLI when run directly; console-check.mjs imports PAGES from here.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  if (mode === 'capture' && (arg === 'baseline' || arg === 'after')) await capture(arg);
  else if (mode === 'compare') compare();
  else if (mode === 'nav-check') await navCheck();
  else { console.error('usage: parity.mjs capture baseline|after | compare [--budget N] | nav-check'); process.exit(2); }
}
