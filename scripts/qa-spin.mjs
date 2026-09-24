// Verifies /forge/spin behaves like an Ising model and loads cleanly.
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
const wasm = page.waitForResponse((r) => r.url().endsWith('/forge/spin/ising_bg.wasm'));

await page.goto(`${base}/forge/spin/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
const before = await page.evaluate(() => window.__spin ? window.__spin.frames : -1);
before === 0 ? ok('nothing runs before the gate') : fail(`frames before gate: ${before}`);
await page.click('#begin');
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

// ---- pause / reset / resume -------------------------------------------------
// Settle first: pause() cannot cancel a tick already in flight, so one more
// frame may still land. Wait for it, then require dead silence.
await page.evaluate(() => window.__spin.pause());
await page.waitForTimeout(300);
const f1 = await page.evaluate(() => window.__spin.frames);
await page.waitForTimeout(500);
const f2 = await page.evaluate(() => window.__spin.frames);
f2 === f1 ? ok('paused: no frames') : fail(`paused but frames advanced ${f1} \u2192 ${f2}`);

// reset while paused at the cold end: the only new frame is the randomised one
await page.evaluate(() => window.__spin.reset());
await page.waitForFunction(() => window.__spin.resets === 1, null, { timeout: 5000 });
const fresh = await page.evaluate(() => window.__spin.sample());
fresh.agreement < 0.7 ? ok(`reset: agreement ${fresh.agreement.toFixed(3)} (noise again)`) : fail(`reset did not randomise: ${fresh.agreement}`);

await page.evaluate(() => window.__spin.resume());
await page.waitForFunction((n) => window.__spin.frames > n + 10, f2, { timeout: 10000 });
ok('resumed: frames flowing');

consoleErrors.length === 0 ? ok('no console errors') : fail(`console errors: ${consoleErrors.join(' | ')}`);

await browser.close();
if (process.exitCode) process.exit(process.exitCode);
console.log('spin QA passed');
