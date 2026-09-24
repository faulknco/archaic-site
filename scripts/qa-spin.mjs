// Verifies /forge/spin behaves like an Ising model and loads cleanly.
// Usage: node scripts/qa-spin.mjs [baseUrl]   (default http://127.0.0.1:4387)
// Serve the build first with `npm run preview`, which listens on that same port.
// Needs `npx playwright install chromium` once.
import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://127.0.0.1:4387').replace(/\/$/, '');
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

// Everything behind the gate is inert, so the first Tab from a fresh document
// lands in the gate instead of walking ten controls hidden under the overlay.
// Blur first: the page focuses Continue on load, and tabbing from there would
// pass whether or not the rest of the page is reachable.
const describe = () => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return 'body';
  return `${a.id || a.className || a.tagName}${document.getElementById('gate').contains(a) ? ' (in gate)' : ' (OUTSIDE gate)'}`;
});
await page.evaluate(() => document.activeElement?.blur());
await page.keyboard.press('Tab');
const firstStop = await describe();
firstStop === 'begin (in gate)' || firstStop.endsWith('(in gate)')
  ? ok(`first Tab before the gate lands on ${firstStop}`)
  : fail(`first Tab before the gate landed on ${firstStop}`);
const inertCount = await page.evaluate(() => document.querySelectorAll('[inert]').length);
inertCount >= 2 ? ok(`${inertCount} regions inert behind the gate`) : fail(`only ${inertCount} inert regions behind the gate`);

// The whole invariant, not just the first stop: every focusable control outside
// the gate must sit inside an inert subtree. A reader who Tabs in from the
// address bar restarts at the top of the document, and the nav is up there.
const reachable = await page.evaluate(() => {
  const gate = document.getElementById('gate');
  return [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')]
    .filter((el) => !gate.contains(el) && !el.closest('[inert]'))
    .map((el) => el.className || el.id || el.tagName);
});
reachable.length === 0
  ? ok('no focusable control outside the gate is reachable')
  : fail(`reachable behind the gate: ${reachable.join(', ')}`);

// The nav renders before the gate, so a forward Tab from the gate would pass it
// either way. What inert actually governs is whether the nav can take focus at
// all, so ask it directly.
const navFocusable = () => page.evaluate(() => {
  const mark = document.querySelector('.nav-mark');
  mark.focus();
  return document.activeElement === mark;
});
(await navFocusable()) ? fail('nav took focus while the gate was open') : ok('nav refuses focus behind the gate');

await page.click('#begin');
const stillInert = await page.evaluate(() => document.querySelectorAll('[inert]').length);
stillInert === 0 ? ok('inert lifted once the gate was dismissed') : fail(`${stillInert} regions still inert after Continue`);
(await navFocusable()) ? ok('nav takes focus once the gate is dismissed') : fail('nav still refuses focus after Continue');
// And it is in the tab order, not merely focusable: Tab from the mark walks on
// to the first nav link.
await page.keyboard.press('Tab');
const afterStop = await page.evaluate(() => {
  const a = document.activeElement;
  return a ? `${a.className || a.id || a.tagName}` : 'none';
});
/nav/.test(afterStop) ? ok(`Tab moves through the nav after Continue (${afterStop})`) : fail(`after Continue, Tab from the nav mark landed on ${afterStop}`);

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
// Ink wash (2026-09-24): the cold phase must settle with ground in the majority
// (the windowed external field picks the sign); bone islands may survive.
// Settling is stochastic: after an instant jump the field needs a few seconds
// of cold sweeps, so poll for up to 12 s rather than judging one sample.
let settled = bottom.upFraction;
for (let i = 0; i < 6 && settled >= 0.45; i++) {
  await page.waitForTimeout(2000);
  settled = (await page.evaluate(() => window.__spin.sample())).upFraction;
}
settled < 0.45 ? ok(`bottom settles dark (upFraction ${settled.toFixed(3)})`) : fail(`bottom did not settle dark within 18 s: upFraction ${settled}`);
const renderer = await page.evaluate(() => window.__spin.renderer);
renderer === 'webgl' || renderer === 'canvas' ? ok(`renderer: ${renderer}`) : fail(`renderer: ${renderer}`);
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

// ---- the page around the lattice ------------------------------------------
// The scroll to the bottom happened above, so COLD is the expected word here.
const h1 = await page.textContent('h1');
h1?.trim() === 'SPIN' ? ok('h1 is SPIN') : fail(`h1: ${h1}`);
(await page.$('nav.nav')) ? ok('shared nav present') : fail('no shared nav');
(await page.$('a.nav-contact[href="mailto:hello@archaic.ie"]')) ? ok('plain mailto in the nav') : fail('no plain mailto in the nav');
const word = (await page.textContent('#readout-word'))?.trim();
word === 'COLD' ? ok('readout says COLD at the bottom') : fail(`readout at bottom: ${word}`);
const posterAlt = await page.getAttribute('#poster', 'alt');
posterAlt && posterAlt.length > 20 ? ok('poster has alt text') : fail('poster missing alt');
// The rendered state, not the property: `display: block` on .poster is
// author-origin and outranks the UA sheet, so `hidden` alone can be set and
// change nothing at all.
const posterState = await page.evaluate(() => {
  const el = document.getElementById('poster');
  return { hidden: el.hidden, display: getComputedStyle(el).display };
});
posterState.hidden && posterState.display === 'none'
  ? ok('poster stood down once the lattice was live (display: none)')
  : fail(`poster still rendered over a live lattice: hidden=${posterState.hidden} display=${posterState.display}`);
/\d/.test(await page.textContent('#panel')) ? fail('digits in the panel') : ok('no digits in the panel');

// Save builds a canvas, calls toBlob and drives an object-URL download. None of
// that was exercised until now, so a broken export would have shipped green.
try {
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    page.click('#save'),
  ]);
  const name = download.suggestedFilename();
  name === 'archaic-spin.png' ? ok(`Save downloaded ${name}`) : fail(`Save downloaded ${name}, expected archaic-spin.png`);
  await download.delete();
} catch (e) {
  fail(`Save produced no download: ${e.message}`);
}

consoleErrors.length === 0 ? ok('no console errors') : fail(`console errors: ${consoleErrors.join(' | ')}`);

await browser.close();
if (process.exitCode) process.exit(process.exitCode);
console.log('spin QA passed');
