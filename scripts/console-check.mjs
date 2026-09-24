// Loads every page and fails on any console error or page error.
// CSP violations surface as console errors, so run this against the
// Cloudflare Pages preview URL before merging: node scripts/console-check.mjs https://<preview>.pages.dev
import { chromium } from 'playwright';
import { PAGES } from './parity.mjs';

const base = (process.argv[2] || 'http://localhost:4321').replace(/\/$/, '');
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(`${page.url()} :: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`${page.url()} :: pageerror ${e.message}`));
for (const path of PAGES) {
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
}
await browser.close();
if (errors.length) { console.error('console errors:\n' + errors.join('\n')); process.exit(1); }
console.log(`ok: no console errors on ${PAGES.length} pages at ${base}`);
