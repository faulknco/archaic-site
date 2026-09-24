// Verifies /lab/spin behaves like an Ising model and loads cleanly.
// Usage: node scripts/qa-spin.mjs [baseUrl]   (default http://localhost:4321)
// Serve first, e.g. `npm run preview` (port 4321). Needs `npx playwright install chromium` once.
import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://localhost:4321').replace(/\/$/, '');
const fail = (m) => { console.error('FAIL:', m); process.exitCode = 1; };
const ok = (m) => console.log('ok  :', m);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
const wasm = page.waitForResponse((r) => r.url().endsWith('/lab/spin/ising_bg.wasm'));

await page.goto(`${base}/lab/spin/`, { waitUntil: 'domcontentloaded' });
const wasmStatus = (await wasm).status();
wasmStatus === 200 ? ok('wasm served 200') : fail(`wasm status ${wasmStatus}`);

await page.waitForFunction(() => window.__spin && window.__spin.frames > 30, null, { timeout: 20000 });
ok('frames flowing');

const top = await page.evaluate(() => window.__spin.sample());
top.upFraction > 0.4 && top.upFraction < 0.6 ? ok(`top upFraction ${top.upFraction.toFixed(3)}`) : fail(`top upFraction ${top.upFraction}`);
top.agreement < 0.7 ? ok(`top agreement ${top.agreement.toFixed(3)} (noise)`) : fail(`top agreement ${top.agreement}`);

await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
await page.waitForTimeout(6000);
const bottom = await page.evaluate(() => window.__spin.sample());
bottom.agreement > 0.9 ? ok(`bottom agreement ${bottom.agreement.toFixed(3)} (domains)`) : fail(`bottom agreement ${bottom.agreement}`);

const T = await page.evaluate(() => window.__spin.temperature());
Math.abs(T - 0.6) < 1e-6 ? ok('bottom temperature is the cold end') : fail(`bottom T ${T}`);

consoleErrors.length === 0 ? ok('no console errors') : fail(`console errors: ${consoleErrors.join(' | ')}`);

await browser.close();
if (process.exitCode) process.exit(process.exitCode);
console.log('spin QA passed');
