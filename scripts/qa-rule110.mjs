// Verifies /forge/rule110 runs, answers its controls and loads cleanly.
// Usage: node scripts/qa-rule110.mjs [baseUrl]   (default http://127.0.0.1:4387)
// Serve the build first with `npm run preview`, which listens on that same port.
// Needs `npx playwright install chromium` once.
import { chromium } from 'playwright';

const base = (process.argv[2] || 'http://127.0.0.1:4387').replace(/\/$/, '');
const fail = (m) => { console.error('FAIL:', m); process.exitCode = 1; };
const ok = (m) => console.log('ok  :', m);
const URL_ = `${base}/forge/rule110/`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));
const mod = page.waitForResponse((r) => r.url().endsWith('/forge/rule110/rule110.js'));

await page.goto(URL_, { waitUntil: 'domcontentloaded' });
const modStatus = (await mod).status();
modStatus === 200 ? ok('step module served 200') : fail(`step module status ${modStatus}`);
await page.waitForTimeout(1200);
const hook = await page.evaluate(() => window.__rule110 ? { frames: window.__rule110.frames, generation: window.__rule110.generation } : null);
hook && hook.frames === 0 && hook.generation === 0 ? ok('nothing runs before the gate') : fail(`before the gate: ${JSON.stringify(hook)}`);

// ---- the gate ---------------------------------------------------------------
await page.evaluate(() => document.activeElement?.blur());
await page.keyboard.press('Tab');
const firstStop = await page.evaluate(() => {
  const a = document.activeElement;
  if (!a || a === document.body) return 'body';
  return `${a.id || a.className || a.tagName}${document.getElementById('gate').contains(a) ? ' (in gate)' : ' (OUTSIDE gate)'}`;
});
firstStop.endsWith('(in gate)') ? ok(`first Tab lands on ${firstStop}`) : fail(`first Tab landed on ${firstStop}`);
const reachable = await page.evaluate(() => {
  const gate = document.getElementById('gate');
  return [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')]
    .filter((el) => !gate.contains(el) && !el.closest('[inert]') && el.tabIndex >= 0)
    .map((el) => el.className || el.id || el.tagName);
});
reachable.length === 0 ? ok('no focusable control outside the gate is reachable') : fail(`reachable behind the gate: ${reachable.join(', ')}`);
const footerInert = await page.evaluate(() => !!document.querySelector('.footer[inert]'));
footerInert ? ok('footer is inert behind the gate') : fail('footer is reachable behind the gate');

await page.click('#begin');
const stillInert = await page.evaluate(() => document.querySelectorAll('[inert]').length);
stillInert === 0 ? ok('inert lifted once the gate was dismissed') : fail(`${stillInert} regions still inert after Continue`);
const gateGone = await page.evaluate(() => getComputedStyle(document.getElementById('gate')).display === 'none' && !document.body.classList.contains('gated'));
gateGone ? ok('gate closed and the page scrolls again') : fail('gate still shown or body still gated');
const seen = await page.evaluate(() => { try { return sessionStorage.getItem('spin-gate'); } catch { return null; } });
seen === 'ok' ? ok('acceptance stored under the shared spin-gate key') : fail(`sessionStorage spin-gate = ${seen}`);

// ---- the tape advances ------------------------------------------------------
await page.waitForFunction(() => window.__rule110.generation > 40, null, { timeout: 15000 });
ok('generations advancing');
const geom = await page.evaluate(() => ({ cellPx: window.__rule110.cellPx, cells: window.__rule110.cells, rows: window.__rule110.rows, mode: window.__rule110.mode, speed: window.__rule110.speed }));
geom.cellPx === 4 && geom.cells >= 300 && geom.cells <= 400 ? ok(`geometry at 1280: ${geom.cellPx}px cells, ${geom.cells} across, ${geom.rows} rows`) : fail(`geometry at 1280: ${JSON.stringify(geom)}`);
geom.mode === 'single' && geom.speed === 'normal' ? ok('defaults: single seed, normal speed') : fail(`defaults: ${JSON.stringify(geom)}`);
const posterState = await page.evaluate(() => { const el = document.getElementById('poster'); return { hidden: el.hidden, display: getComputedStyle(el).display }; });
posterState.hidden && posterState.display === 'none' ? ok('poster stood down once the tape was live') : fail(`poster still rendered: ${JSON.stringify(posterState)}`);
// Bone pixels on the tape, and ground ones: it is a picture, not a flat fill.
const pixels = await page.evaluate(() => {
  const c = document.getElementById('tape');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let light = 0, dark = 0;
  for (let i = 0; i < d.length; i += 4) { if (d[i] > 150) light++; else if (d[i] < 30) dark++; }
  return { light, dark, total: d.length / 4 };
});
pixels.light > 0 && pixels.dark > pixels.light ? ok(`tape paints bone on ground (${pixels.light} light px of ${pixels.total})`) : fail(`tape pixels: ${JSON.stringify(pixels)}`);
// Normal speed is about thirty rows a second.
const g0 = await page.evaluate(() => window.__rule110.generation);
await page.waitForTimeout(2000);
const g1 = await page.evaluate(() => window.__rule110.generation);
const normalRate = (g1 - g0) / 2;
normalRate > 20 && normalRate < 45 ? ok(`normal speed ${normalRate.toFixed(0)} rows/s`) : fail(`normal speed ${normalRate} rows/s`);
const counterAttr = await page.getAttribute('#counter', 'aria-live');
counterAttr === 'polite' ? ok('generation counter is aria-live polite') : fail(`counter aria-live: ${counterAttr}`);
const counterText = await page.textContent('#counter');
/^GENERATION \d+$/.test(counterText.trim()) ? ok(`counter reads "${counterText.trim()}"`) : fail(`counter reads "${counterText}"`);

// ---- pause / play through the button ----------------------------------------
await page.click('#play');
await page.waitForTimeout(100);
const p1 = await page.evaluate(() => window.__rule110.generation);
await page.waitForTimeout(500);
const p2 = await page.evaluate(() => window.__rule110.generation);
p1 === p2 ? ok('paused: generation holds') : fail(`paused but generation advanced ${p1} -> ${p2}`);
(await page.textContent('#play')).trim() === 'Play' ? ok('button reads Play while paused') : fail('button label did not change to Play');
await page.click('#play');
await page.waitForFunction((n) => window.__rule110.generation > n + 10, p2, { timeout: 5000 });
ok('resumed: generations flowing');

// ---- speed --------------------------------------------------------------------
await page.click('label[for="speed-fast"]');
await page.waitForTimeout(200);
const f0 = await page.evaluate(() => window.__rule110.generation);
await page.waitForTimeout(2000);
const f1 = await page.evaluate(() => window.__rule110.generation);
const fastRate = (f1 - f0) / 2;
fastRate > normalRate * 1.8 ? ok(`fast speed ${fastRate.toFixed(0)} rows/s`) : fail(`fast speed ${fastRate} rows/s is not faster than normal ${normalRate}`);
await page.click('label[for="speed-slow"]');
await page.waitForTimeout(200);
const s0 = await page.evaluate(() => window.__rule110.generation);
await page.waitForTimeout(1500);
const s1 = await page.evaluate(() => window.__rule110.generation);
const slowRate = (s1 - s0) / 1.5;
slowRate > 4 && slowRate < normalRate / 2 ? ok(`slow speed ${slowRate.toFixed(0)} rows/s`) : fail(`slow speed ${slowRate} rows/s`);
await page.click('label[for="speed-normal"]');

// ---- seeds --------------------------------------------------------------------
await page.click('label[for="seed-random"]');
await page.waitForTimeout(100);
const rnd = await page.evaluate(() => ({ mode: window.__rule110.mode, seedOn: window.__rule110.sample().seedOn, cells: window.__rule110.cells, sliderOn: !document.getElementById('density').disabled }));
const density = rnd.seedOn / rnd.cells;
rnd.mode === 'random' && density > 0.35 && density < 0.65 ? ok(`random seed at density ${density.toFixed(2)}`) : fail(`random seed: ${JSON.stringify(rnd)}`);
rnd.sliderOn ? ok('density slider enabled for the random seed') : fail('density slider stayed disabled');
// The slider changes the density; the QA drives it through the hook because a
// range input's pointer geometry is browser-specific.
await page.evaluate(() => window.__rule110.setDensity(0.1));
const thin = await page.evaluate(() => window.__rule110.sample().seedOn / window.__rule110.cells);
thin < 0.2 ? ok(`density slider at a tenth gives ${thin.toFixed(2)}`) : fail(`density a tenth gave ${thin}`);
const valuetext = await page.getAttribute('#density', 'aria-valuetext');
/percent/.test(valuetext || '') ? ok(`slider aria-valuetext "${valuetext}"`) : fail(`slider aria-valuetext ${valuetext}`);
// A reproducible random row, the way the poster script asks for one.
const rep = await page.evaluate(() => { window.__rule110.seedRandom(0.5, 42); const a = window.__rule110.seedBits(); window.__rule110.seedRandom(0.5, 42); return a === window.__rule110.seedBits(); });
rep ? ok('random seed is reproducible for a fixed generator seed') : fail('random seed differs for the same generator seed');

await page.click('label[for="seed-single"]');
await page.waitForTimeout(100);
const single = await page.evaluate(() => ({ mode: window.__rule110.mode, bits: window.__rule110.seedBits(), gen: window.__rule110.generation, slider: document.getElementById('density').disabled }));
/^0+1$/.test(single.bits) ? ok('single seed is one cell at the right edge') : fail(`single seed bits: ${single.bits.slice(-12)}`);
single.gen < 30 ? ok(`seed change restarted the counter (generation ${single.gen})`) : fail(`seed change did not reset the counter: ${single.gen}`);
single.slider ? ok('density slider disabled off the random seed') : fail('density slider left enabled for the single seed');

// ---- drawing the seed by hand -------------------------------------------------
await page.click('label[for="seed-drawn"]');
await page.waitForTimeout(100);
const drawn = await page.evaluate(() => ({ mode: window.__rule110.mode, running: window.__rule110.running, bits: window.__rule110.seedBits(), tab: document.getElementById('strip').tabIndex, ro: document.getElementById('strip').getAttribute('aria-readonly') }));
drawn.mode === 'drawn' && !drawn.running && /^0+$/.test(drawn.bits) ? ok('drawn mode: paused with an empty seed row') : fail(`drawn mode: ${JSON.stringify({ ...drawn, bits: drawn.bits.length })}`);
drawn.tab === 0 && drawn.ro === 'false' ? ok('seed row is focusable and editable') : fail(`seed row tabindex ${drawn.tab}, aria-readonly ${drawn.ro}`);
// Clicking the Drawn label scrolled the panel into view and the strip out of
// it, and a mouse click above the viewport lands nowhere: bring it back first.
await page.locator('#strip').scrollIntoViewIfNeeded();
const box = await page.locator('#strip').boundingBox();
await page.mouse.click(box.x + 2, box.y + box.height / 2);
const afterClick = await page.evaluate(() => window.__rule110.seedBits());
afterClick[0] === '1' && afterClick.slice(1).indexOf('1') === -1 ? ok('a click toggles one cell on') : fail(`after a click the seed is ${afterClick.slice(0, 12)}…`);
// A drag paints a run of cells.
await page.mouse.move(box.x + box.width - 2, box.y + box.height / 2);
await page.mouse.down();
await page.mouse.move(box.x + box.width - 42, box.y + box.height / 2, { steps: 4 });
await page.mouse.up();
const afterDrag = await page.evaluate(() => window.__rule110.seedBits());
const tail = afterDrag.slice(-11);
/^1+$/.test(tail) ? ok('a drag paints a run of cells') : fail(`after a drag the tail is ${tail}`);
// Keyboard: focus, Home, Right, Space toggles the second cell; Enter runs.
await page.focus('#strip');
await page.keyboard.press('Home');
await page.keyboard.press('ArrowRight');
await page.keyboard.press('Space');
const afterKeys = await page.evaluate(() => window.__rule110.seedBits());
afterKeys[1] === '1' ? ok('Space toggles the cell under the keyboard cursor') : fail(`after keys the seed starts ${afterKeys.slice(0, 4)}`);
await page.keyboard.press('Enter');
await page.waitForFunction(() => window.__rule110.running && window.__rule110.generation > 5, null, { timeout: 5000 });
ok('Enter runs the drawn seed');

// ---- the page around the tape -------------------------------------------------
const h1 = await page.textContent('h1');
h1?.trim() === 'RULE 110' ? ok('h1 is RULE 110') : fail(`h1: ${h1}`);
(await page.$('nav.nav')) ? ok('shared nav present') : fail('no shared nav');
(await page.$('a.nav-contact[href="mailto:hello@archaic.ie"]')) ? ok('plain mailto in the nav') : fail('no plain mailto in the nav');
(await page.$('.footer')) ? ok('footer present') : fail('no footer');
const outputs = await page.$$eval('.tile', (tiles) => tiles.map((t) => t.dataset.out).join(''));
outputs === '01101110' ? ok('rule readout tiles read 01101110') : fail(`tiles read ${outputs}`);
const tileCount = await page.$$eval('.tile', (t) => t.length);
tileCount === 8 ? ok('eight neighbourhood tiles') : fail(`${tileCount} tiles`);
const prose = await page.textContent('#prose');
const digits = (prose.match(/\d+/g) || []).filter((n) => n !== '110' && n !== '2004');
digits.length === 0 ? ok('prose carries no numerals but the rule and the year') : fail(`stray numerals in prose: ${digits.join(', ')}`);
const paras = await page.$$eval('#prose p', (ps) => ps.length);
paras === 2 ? ok('two paragraphs') : fail(`${paras} paragraphs`);
/!/.test(prose) ? fail('an exclamation mark in the prose') : ok('no exclamation in the prose');
const labelled = await page.$$eval('button, input, canvas[tabindex]', (els) => els.filter((el) => {
  const id = el.id;
  const hasLabel = el.getAttribute('aria-label') || (id && document.querySelector(`label[for="${id}"]`)) || el.closest('label') || (el.textContent || '').trim();
  return !hasLabel;
}).map((el) => el.id || el.tagName));
labelled.length === 0 ? ok('every control has a name') : fail(`unnamed controls: ${labelled.join(', ')}`);
await page.evaluate(() => window.__rule110.pause());
consoleErrors.length === 0 ? ok('no console errors at 1280') : fail(`console errors: ${consoleErrors.join(' | ')}`);
await page.close();

// ---- mobile: 390 wide, two-pixel cells, no sideways scroll -------------------
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const mobileErrors = [];
mobile.on('console', (m) => { if (m.type() === 'error') mobileErrors.push(m.text()); });
mobile.on('pageerror', (e) => mobileErrors.push(`pageerror: ${e.message}`));
await mobile.goto(URL_, { waitUntil: 'domcontentloaded' });
await mobile.click('#begin');
await mobile.waitForFunction(() => window.__rule110.generation > 10, null, { timeout: 15000 });
const m = await mobile.evaluate(() => ({ cellPx: window.__rule110.cellPx, cells: window.__rule110.cells, docWidth: document.documentElement.scrollWidth, vw: innerWidth }));
m.cellPx === 2 && m.cells >= 190 && m.cells <= 200 ? ok(`geometry at 390: ${m.cellPx}px cells, ${m.cells} across`) : fail(`geometry at 390: ${JSON.stringify(m)}`);
m.docWidth <= m.vw ? ok('no horizontal scroll at 390') : fail(`document ${m.docWidth} wider than viewport ${m.vw}`);
// A tap on the seed row in drawn mode toggles a cell.
await mobile.click('label[for="seed-drawn"]');
const mbox = await mobile.locator('#strip').boundingBox();
await mobile.tap('#strip', { position: { x: 3, y: mbox.height / 2 } });
const tapped = await mobile.evaluate(() => window.__rule110.seedBits());
tapped[1] === '1' || tapped[0] === '1' ? ok('a tap toggles a seed cell on a phone') : fail(`after a tap the seed starts ${tapped.slice(0, 6)}`);
mobileErrors.length === 0 ? ok('no console errors at 390') : fail(`mobile console errors: ${mobileErrors.join(' | ')}`);
await mobile.close();

// ---- reduced motion: a fixed diagram, nothing moves ---------------------------
const rctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const rpage = await rctx.newPage();
const reducedErrors = [];
rpage.on('console', (mm) => { if (mm.type() === 'error') reducedErrors.push(mm.text()); });
rpage.on('pageerror', (e) => reducedErrors.push(`pageerror: ${e.message}`));
await rpage.goto(URL_, { waitUntil: 'domcontentloaded' });
await rpage.click('#begin');
await rpage.waitForFunction(() => window.__rule110.frames > 0, null, { timeout: 10000 });
const r0 = await rpage.evaluate(() => ({ reduced: window.__rule110.reduced, rows: window.__rule110.rows, generation: window.__rule110.generation, running: window.__rule110.running, history: window.__rule110.historyLength, label: document.getElementById('play').textContent.trim() }));
r0.reduced && r0.rows === 400 && r0.generation === 399 && r0.history === 400 && !r0.running ? ok('reduced motion: a fixed diagram of four hundred rows') : fail(`reduced motion: ${JSON.stringify(r0)}`);
r0.label === 'Redraw' ? ok('reduced motion: the run button reads Redraw') : fail(`reduced motion button reads ${r0.label}`);
await rpage.waitForTimeout(800);
const r1 = await rpage.evaluate(() => window.__rule110.generation);
r1 === 399 ? ok('reduced motion: nothing advances') : fail(`reduced motion advanced to ${r1}`);
const speedDisabled = await rpage.$$eval('input[name="speed"]', (els) => els.every((el) => el.disabled));
speedDisabled ? ok('reduced motion: speed controls disabled') : fail('reduced motion: speed controls still enabled');
const fr0 = await rpage.evaluate(() => window.__rule110.frames);
await rpage.click('label[for="seed-random"]');
await rpage.waitForTimeout(100);
const rr = await rpage.evaluate(() => ({ frames: window.__rule110.frames, generation: window.__rule110.generation, mode: window.__rule110.mode }));
rr.frames > fr0 && rr.generation === 399 && rr.mode === 'random' ? ok('reduced motion: a seed change redraws the diagram') : fail(`reduced motion seed change: ${JSON.stringify(rr)}`);
reducedErrors.length === 0 ? ok('no console errors under reduced motion') : fail(`reduced-motion console errors: ${reducedErrors.join(' | ')}`);
await rctx.close();

await browser.close();
if (process.exitCode) process.exit(process.exitCode);
console.log('rule110 QA passed');
