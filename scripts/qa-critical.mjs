// Verifies /forge/critical measures like an Ising model and loads cleanly.
// Usage: node scripts/qa-critical.mjs [baseUrl]   (default http://127.0.0.1:4387)
// Serve the build first with `npm run preview`, which listens on that same port.
// Needs `npx playwright install chromium` once.
import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://127.0.0.1:4387').replace(/\/$/, '');
const fail = (m) => { console.error('FAIL:', m); process.exitCode = 1; };
const ok = (m) => console.log('ok  :', m);
const T_C = 2 / Math.log(1 + Math.SQRT2);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
const wasm = page.waitForResponse((r) => r.url().endsWith('/forge/spin/ising_bg.wasm'));

await page.goto(`${base}/forge/critical/`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1500);
const before = await page.evaluate(() => window.__critical ? window.__critical.frames : -1);
before === 0 ? ok('nothing runs before the gate') : fail(`frames before gate: ${before}`);

// ---- the gate ----------------------------------------------------------------
const describe = () => page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return 'body';
  return `${a.id || a.className || a.tagName}${document.getElementById('gate').contains(a) ? ' (in gate)' : ' (OUTSIDE gate)'}`;
});
await page.evaluate(() => document.activeElement?.blur());
await page.keyboard.press('Tab');
const firstStop = await describe();
firstStop.endsWith('(in gate)') ? ok(`first Tab before the gate lands on ${firstStop}`) : fail(`first Tab before the gate landed on ${firstStop}`);
const inertCount = await page.evaluate(() => document.querySelectorAll('[inert]').length);
inertCount >= 3 ? ok(`${inertCount} regions inert behind the gate`) : fail(`only ${inertCount} inert regions behind the gate (nav, bench, footer expected)`);
const reachable = await page.evaluate(() => {
  const gate = document.getElementById('gate');
  return [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')]
    .filter((el) => !gate.contains(el) && !el.closest('[inert]'))
    .map((el) => el.className || el.id || el.tagName);
});
reachable.length === 0 ? ok('no focusable control outside the gate is reachable') : fail(`reachable behind the gate: ${reachable.join(', ')}`);
// Tab wraps inside the gate: Shift+Tab from Continue lands on Back.
await page.focus('#begin');
await page.keyboard.press('Shift+Tab');
const wrapped = await describe();
wrapped.startsWith('gate-back') ? ok('Shift+Tab from Continue wraps to Back') : fail(`Shift+Tab from Continue landed on ${wrapped}`);
const navFocusable = () => page.evaluate(() => { const mark = document.querySelector('.nav-mark'); mark.focus(); return document.activeElement === mark; });
(await navFocusable()) ? fail('nav took focus while the gate was open') : ok('nav refuses focus behind the gate');

await page.click('#begin');
const stillInert = await page.evaluate(() => document.querySelectorAll('[inert]').length);
stillInert === 0 ? ok('inert lifted once the gate was dismissed') : fail(`${stillInert} regions still inert after Continue`);
(await navFocusable()) ? ok('nav takes focus once the gate is dismissed') : fail('nav still refuses focus after Continue');
const gateKey = await page.evaluate(() => { try { return sessionStorage.getItem('spin-gate'); } catch { return null; } });
gateKey === 'ok' ? ok("Continue remembered under Spin's key") : fail(`gate key: ${gateKey}`);

const wasmStatus = (await wasm).status();
wasmStatus === 200 ? ok('wasm served 200') : fail(`wasm status ${wasmStatus}`);

await page.waitForFunction(() => window.__critical && window.__critical.frames > 30, null, { timeout: 20000 });
ok('frames flowing');
const renderer = await page.evaluate(() => window.__critical.renderer);
renderer === 'webgl' || renderer === 'canvas' ? ok(`renderer: ${renderer}`) : fail(`renderer: ${renderer}`);
const posterState = await page.evaluate(() => { const el = document.getElementById('poster'); return { hidden: el.hidden, display: getComputedStyle(el).display }; });
posterState.hidden && posterState.display === 'none' ? ok('poster stood down once the lattice was live') : fail(`poster still rendered: ${JSON.stringify(posterState)}`);

// ---- the slider moves the temperature ------------------------------------------
const setSlider = (v) => page.$eval('#temp', (el, value) => { el.value = value; el.dispatchEvent(new Event('input', { bubbles: true })); }, v);
await setSlider('1.50');
let T = await page.evaluate(() => window.__critical.temperature());
Math.abs(T - 1.5) < 1e-9 ? ok('slider input moves T to 1.50') : fail(`slider set 1.50 but T = ${T}`);
const startT = await page.textContent('#t-val');
startT?.trim() === '1.50' ? ok('readout shows 1.50') : fail(`readout shows ${startT}`);

// Cold: |m| must reach near one within a bounded wait (the cluster burst does
// the ordering; Metropolis alone would sit in domains for minutes).
const waitForM = async (pred, ms) => {
  const t0 = Date.now();
  let v = await page.evaluate(() => window.__critical.m);
  while (!pred(v) && Date.now() - t0 < ms) { await page.waitForTimeout(250); v = await page.evaluate(() => window.__critical.m); }
  return v;
};
const cold = await waitForM((v) => v > 0.9, 15000);
cold > 0.9 ? ok(`cold |m| ${cold.toFixed(3)} (ordered)`) : fail(`cold |m| only ${cold.toFixed(3)} after 15 s`);
// And the diagram gets a point there once the hold begins.
await page.waitForFunction(() => window.__critical.phase === 'holding', null, { timeout: 10000 }).catch(() => {});
await page.waitForTimeout(1500);
const coldPoints = await page.evaluate(() => window.__critical.points());
const coldPoint = coldPoints.find((p) => Math.abs(p.T - 1.5) < 1e-9);
coldPoint && coldPoint.n > 0 && coldPoint.mean > 0.9
  ? ok(`point at 1.50: mean ${coldPoint.mean.toFixed(3)} over ${coldPoint.n} samples`)
  : fail(`no ordered point at 1.50: ${JSON.stringify(coldPoints)}`);
const stateWord = (await page.textContent('#state-word'))?.trim();
stateWord === 'HOLDING' ? ok('state word is HOLDING') : fail(`state word: ${stateWord}`);
const phaseWord = (await page.textContent('#phase-word'))?.trim();
phaseWord === 'ORDERED' ? ok('phase word is ORDERED at 1.50') : fail(`phase word: ${phaseWord}`);

// Hot: |m| must fall small.
await setSlider('3.50');
const hot = await waitForM((v) => v < 0.15, 15000);
hot < 0.15 ? ok(`hot |m| ${hot.toFixed(3)} (disordered)`) : fail(`hot |m| still ${hot.toFixed(3)} after 15 s`);

// Snap: landing near the critical temperature is caught, exactly.
await setSlider('2.25');
T = await page.evaluate(() => window.__critical.temperature());
Math.abs(T - T_C) < 1e-12 ? ok('2.25 snaps to the critical temperature') : fail(`2.25 gave T = ${T}`);
const tcText = await page.textContent('#t-val');
tcText?.trim() === '2.269' ? ok('readout shows 2.269 when snapped') : fail(`readout shows ${tcText}`);
const valueText = await page.getAttribute('#temp', 'aria-valuetext');
/critical temperature/.test(valueText || '') ? ok('aria-valuetext names the critical temperature') : fail(`aria-valuetext: ${valueText}`);
// And a keyboard step leaves it: ArrowRight from the snapped value must move.
await page.focus('#temp');
await page.keyboard.press('ArrowRight');
T = await page.evaluate(() => window.__critical.temperature());
Math.abs(T - T_C) > 1e-6 ? ok(`ArrowRight leaves the critical point (T = ${T.toFixed(2)})`) : fail('ArrowRight stayed stuck on the critical point');

// ---- the page around the bench ----------------------------------------------------
const h1 = await page.textContent('h1');
h1?.trim() === 'CRITICAL' ? ok('h1 is CRITICAL') : fail(`h1: ${h1}`);
(await page.$('nav.nav')) ? ok('shared nav present') : fail('no shared nav');
(await page.$('a.nav-contact[href="mailto:hello@archaic.ie"]')) ? ok('plain mailto in the nav') : fail('no plain mailto in the nav');
(await page.$('footer.footer, .footer')) ? ok('footer present') : fail('no footer');
const live = await page.$eval('#announce', (el) => ({ role: el.getAttribute('role'), live: el.getAttribute('aria-live'), text: el.textContent }));
live.role === 'status' && live.live === 'polite' ? ok('readout live region is polite') : fail(`live region: ${JSON.stringify(live)}`);
live.text && live.text.length > 0 ? ok(`live region says: "${live.text}"`) : fail('live region never spoke');
const proseDigits = await page.$eval('#prose', (el) => /\d/.test(el.textContent));
proseDigits ? fail('digits in the prose') : ok('no digits in the prose');
const label = await page.$eval('label[for="temp"]', (el) => el.textContent.trim());
label ? ok(`slider labelled "${label}"`) : fail('slider has no label');

// Reset randomises and settles again; Clear forgets the points.
await page.evaluate(() => window.__critical.reset());
await page.waitForTimeout(200);
const afterReset = await page.evaluate(() => window.__critical.phase);
afterReset === 'settling' ? ok('reset puts the bench back to settling') : fail(`after reset phase is ${afterReset}`);
await page.evaluate(() => window.__critical.clearPoints());
const cleared = await page.evaluate(() => window.__critical.points().length);
cleared === 0 ? ok('clear forgets the points') : fail(`${cleared} points remain after clear`);

// Mobile: one column, lattice above the panel, no horizontal scroll.
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(300);
const mobile = await page.evaluate(() => {
  const s = document.getElementById('stage').getBoundingClientRect();
  const p = document.querySelector('.panel').getBoundingClientRect();
  return { docWidth: document.documentElement.scrollWidth, vw: innerWidth, stageBottom: s.bottom, panelTop: p.top, stageW: s.width, stageH: s.height };
});
mobile.docWidth <= mobile.vw ? ok(`no horizontal scroll at 390 (doc ${mobile.docWidth})`) : fail(`horizontal scroll at 390: doc ${mobile.docWidth}`);
mobile.panelTop >= mobile.stageBottom ? ok('lattice stacks above the panel at 390') : fail(`panel top ${mobile.panelTop} above stage bottom ${mobile.stageBottom}`);
Math.abs(mobile.stageW - mobile.stageH) < 2 ? ok('lattice stays square at 390') : fail(`stage ${mobile.stageW}×${mobile.stageH}`);

consoleErrors.length === 0 ? ok('no console errors') : fail(`console errors: ${consoleErrors.join(' | ')}`);
await page.close();

// ---- reduced motion: a still, one sample per temperature --------------------------
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const rm = await ctx.newPage();
const rmErrors = [];
rm.on('console', (m) => { if (m.type() === 'error') rmErrors.push(m.text()); });
rm.on('pageerror', (e) => rmErrors.push(`pageerror: ${e.message}`));
await rm.goto(`${base}/forge/critical/`, { waitUntil: 'domcontentloaded' });
await rm.click('#begin');
await rm.waitForFunction(() => window.__critical && window.__critical.frames >= 1, null, { timeout: 20000 });
await rm.waitForTimeout(1500);
const rmFrames = await rm.evaluate(() => window.__critical.frames);
rmFrames === 1 ? ok('reduced motion: one still frame, then nothing moves') : fail(`reduced motion: ${rmFrames} frames`);
const rmPoints = await rm.evaluate(() => window.__critical.points());
rmPoints.length === 1 ? ok(`reduced motion: one point from the single sample (|m| ${rmPoints[0].mean.toFixed(3)} at ${rmPoints[0].T.toFixed(3)})`) : fail(`reduced motion: ${rmPoints.length} points`);
await rm.$eval('#temp', (el) => { el.value = '1.50'; el.dispatchEvent(new Event('input', { bubbles: true })); });
await rm.waitForFunction(() => window.__critical.frames >= 2, null, { timeout: 20000 });
await rm.waitForTimeout(500);
const rmAfter = await rm.evaluate(() => ({ frames: window.__critical.frames, points: window.__critical.points() }));
const rmCold = rmAfter.points.find((p) => Math.abs(p.T - 1.5) < 1e-9);
rmAfter.frames === 2 && rmCold && rmCold.mean > 0.9
  ? ok(`reduced motion: the slider took one more sample (|m| ${rmCold.mean.toFixed(3)} at 1.50)`)
  : fail(`reduced motion after slider: ${JSON.stringify(rmAfter)}`);
rmErrors.length === 0 ? ok('reduced motion: no console errors') : fail(`reduced motion console errors: ${rmErrors.join(' | ')}`);
await ctx.close();

await browser.close();
if (process.exitCode) process.exit(process.exitCode);
console.log('critical QA passed');
