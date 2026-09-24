# archaic.ie Foundation + Forge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put all six archaic.ie pages on one shared layout with an OKLCH token system (pixel-identical), fix the mobile nav and the `mailto:` route, self-host the fonts (LCP under 1.5 s), add cross-document view transitions, and turn `/forge/spin` into a real page under a new `/forge` index.

**Architecture:** One `src/layouts/Base.astro` owns the document head, nav, footer, background, shared chrome script and global styles; pages keep only their own content and scoped content styles. `src/styles/tokens.css` is the single source of colour, type and spacing; `src/styles/global.css` holds the reset and the shared chrome. Acceptance for the migration is a Playwright + pixelmatch parity harness: baselines are captured from the current build before anything changes, and every refactor task must diff to zero; every intended visual change is made in its own task and re-bases the baselines.

**Tech Stack:** Astro 7.3.4 (static, `compressHTML: true`), Astro Fonts API (`fontProviders.fontsource()`), Cloudflare Pages with an enforced CSP in `public/_headers`, Playwright 1.63 (already a devDependency), pixelmatch + pngjs (added), Lighthouse via `npx`, existing `ising-rs` wasm build under `public/forge/spin/` (untouched).

**Spec:** `/Users/faulknco/Projects/notes/projects/websites-craft-research-2026-09-24.md` (section 5 "archaic.ie under the hood" and section 1 for `/forge`). Inputs: `/private/tmp/claude-501/-Users-faulknco/dc9e6a5f-54d0-480c-9259-4a244ea07ed5/scratchpad/site-audit.md` (archaic.ie findings), `docs/superpowers/specs/2026-09-24-spin-design.md` (the piece this plan re-frames).

## Global Constraints

- **Cinzel is uppercase everywhere.** Any text set in `var(--font-display)` is uppercase in the HTML *and* carries `text-transform: uppercase`. Mixed-case Cinzel renders as accidental small caps.
- **No prices, day rates, timelines, or headline figures anywhere on the site.** The `/forge/spin` readout is words and a bar, not digits (open question flagged in Task 12).
- **No physical address on the site.** The footer stays "Registered in Ireland · Co. No. 811858". Registered-office disclosure is a separate, blocked decision. Out of scope.
- **Archaic voice for any new copy:** short declarative sentences, no bullets, no CTAs, no engagement hooks, no buzzwords, no emoji.
- **Pixel parity is the acceptance test for every refactor task.** `npm run qa:parity -- compare` must report `0.00%` mismatch on every page at 1440 and 390 for Tasks 3–6 and 9. Tasks that intentionally change pixels (7, 8, 11, 12, 13, 14) say exactly which region may differ, and end by re-capturing the baseline.
- **CSP stays enforced.** Every new asset is same-origin (`/_astro/*`, `/forge/spin/*`) or already allow-listed. No new origins. After Task 8 the policy gets *tighter* (Google Fonts origins removed). The pre-merge check is `npm run qa:console -- <pages-preview-url>`: zero console errors on every page.
- **The wasm build is untouched.** `public/forge/spin/ising.js`, `ising_bg.wasm`, `VERSION` and `scripts/vendor-ising.sh` do not change. `public/forge/spin/worker.js` and `tmap.js` are site code and may change.
- **`npm run qa:spin` must pass after every task that touches `/forge/spin`**, and it runs in CI from Task 15 on.
- **Out of scope:** journal migration, registered-office disclosure, prices, connorfaulkner.com changes, the `'unsafe-inline'` in `script-src` (Cloudflare and Plausible still inject inline scripts).
- **Branch:** `foundation/layout-and-forge` off `main` (`2d41aa3`). One PR. Do not commit `.parity/`.

---

## File structure

| File | Responsibility |
|---|---|
| `src/styles/tokens.css` | Every colour (OKLCH), font stack, size, tracking and space value. Nothing else defines one. |
| `src/styles/global.css` | Reset, `html`/`body`, background, cursor glow, grain, nav, footer, scroll-reveal, focus, reduced-motion, mobile chrome, view-transition rules. |
| `src/layouts/Base.astro` | `<html>` to `</html>`: head (meta, canonical, OG, favicons, fonts, Plausible), chrome (glow, grain, background), `<Nav>`, `<slot>`, `<Footer>`, the shared chrome script. Props drive the three layouts: `scroll`, `hero`, `spin`. |
| `src/components/Nav.astro` | The mark + four links + email. `current` prop sets `aria-current`. |
| `src/components/Footer.astro` | Company line + colophon link. |
| `src/pages/{index,deeper,services,principles,404}.astro` | Content and scoped content styles only. |
| `src/pages/forge/index.astro` | The `/forge` index: one piece listed. |
| `src/pages/forge/spin.astro` | The piece: gate, poster, canvas, panel with `h1`, readout and controls, on `Base` with `layout="spin"`. |
| `public/forge/spin/worker.js` | Adds a `reset` message. |
| `public/forge/spin/poster.webp` | Static frame near the critical point, for reduced-motion and crawlers. Generated by `scripts/poster-spin.mjs`. |
| `scripts/parity.mjs` | Screenshot capture + pixelmatch compare + mobile-nav DOM check. |
| `scripts/console-check.mjs` | Loads every page on a given base URL, fails on any console error (this is the CSP check against a real deploy). |
| `scripts/lighthouse.sh` | Lighthouse desktop performance run, prints score, LCP and the LCP element. |
| `scripts/poster-spin.mjs` | Generates `poster.webp`. |
| `scripts/tokenize.sed` | One-off hex/type/space → token substitution used while migrating pages. Deleted in Task 6. |
| `tests/tokens.test.mjs` | Proves each OKLCH token round-trips to the hex it replaces. |
| `tests/no-literals.test.mjs` | No hex colours or literal font-family stacks left in `src/pages` or `src/components`. |
| `tests/dist.test.mjs` | Built HTML invariants: one `h1`, one `nav`, one Plausible loader, a `mailto:hello@archaic.ie`, no Google Fonts, sized logo. |
| `.github/workflows/ci.yml` | build → tests → lychee → preview → `qa:spin`. |

---

### Task 1: Parity harness and baselines

**Files:**
- Create: `scripts/parity.mjs`
- Create: `scripts/console-check.mjs`
- Modify: `package.json` (scripts, devDependencies)
- Modify: `.gitignore`

**Interfaces:**
- Produces: `npm run qa:parity -- capture baseline|after [--base URL]`, `npm run qa:parity -- compare [--budget 0.5]`, `npm run qa:parity -- nav-check [--base URL]`, `npm run qa:console -- <baseURL>`. Screenshots land in `.parity/{baseline,after,diff}/`. Page list and viewports are constants in `scripts/parity.mjs`; later tasks add `/forge/` to `PAGES`.

- [ ] **Step 1: Create the branch and install the diff dependencies**

```bash
cd /Users/faulknco/Projects/archaic-site
git checkout -b foundation/layout-and-forge
npm install --save-dev pixelmatch@^7.1.0 pngjs@^7.0.0
npx playwright install chromium
```

- [ ] **Step 2: Write the parity script**

Create `scripts/parity.mjs`:

```js
// Pixel-parity harness for the layout migration.
//   node scripts/parity.mjs capture baseline|after [--base http://localhost:4321]
//   node scripts/parity.mjs compare [--budget 0.5]
//   node scripts/parity.mjs nav-check [--base http://localhost:4321]
// Serve the build first: `npm run build && npm run preview`.
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';

export const PAGES = ['/', '/deeper/', '/services/', '/principles/', '/404.html', '/forge/spin/'];
export const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const GROUND = { r: 6, g: 6, b: 6 };

const [mode, arg] = process.argv.slice(2);
const flag = (name, dflt) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : dflt; };
const base = flag('--base', 'http://localhost:4321').replace(/\/$/, '');
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

async function navCheck() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: VIEWPORTS.mobile, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  let failed = false;
  for (const path of PAGES) {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    const r = await page.evaluate(() => {
      const links = document.querySelector('.nav-links');
      const email = document.querySelector('.nav-contact');
      return {
        docWidth: document.documentElement.scrollWidth,
        linksRight: links ? links.getBoundingClientRect().right : -1,
        emailRight: email ? email.getBoundingClientRect().right : -1,
        emailVisible: email ? email.getClientRects().length > 0 : false,
        vw: innerWidth,
      };
    });
    const ok = r.docWidth <= r.vw && r.linksRight <= r.vw && r.emailRight <= r.vw && r.emailVisible;
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
```

- [ ] **Step 3: Write the console check (the CSP check against a real deploy)**

Create `scripts/console-check.mjs`:

```js
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
```

- [ ] **Step 4: Wire the scripts and ignore the output**

In `package.json` `"scripts"` add:

```json
"qa:parity": "node scripts/parity.mjs",
"qa:console": "node scripts/console-check.mjs"
```

Append to `.gitignore`:

```
# parity screenshots (local acceptance only)
.parity/
```

- [ ] **Step 5: Capture the baseline from the untouched site**

```bash
npm run build && (npm run preview -- --host 127.0.0.1 --port 4321 &) && sleep 2
npm run qa:parity -- capture baseline
npm run qa:parity -- capture after
npm run qa:parity -- compare
```

Expected: 12 files in `.parity/baseline/`, and `compare` prints `ok` with `0.00%` for all twelve (same build against itself). If the homepage is not `0.00%`, the grain or ghost animation is not frozen by `reducedMotion: 'reduce'`; fix the harness before continuing, not the site.

- [ ] **Step 6: Record the current mobile-nav failure**

Run: `npm run qa:parity -- nav-check`
Expected: `FAIL` on `/deeper/`, `/services/`, `/principles/`, `/404.html` (links.right ≈ 519 > 390) and `FAIL` on `/` (email.right > 390). This is the bug Task 7 fixes; keep the output for the PR.

- [ ] **Step 7: Commit**

```bash
git add scripts/parity.mjs scripts/console-check.mjs package.json package-lock.json .gitignore
git commit -m "qa: pixel-parity harness, mobile-nav check, console check"
```

---

### Task 2: Design tokens and the global stylesheet

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `scripts/tokenize.sed`
- Test: `tests/tokens.test.mjs`

**Interfaces:**
- Produces: the custom properties listed in `tokens.css` (names are the contract every later task uses: `--ground`, `--bone`, `--text`, `--text-strong`, `--text-hover`, `--text-nav`, `--text-cta`, `--text-label`, `--text-faint`, `--text-footer`, `--rule`, `--rule-strong`, `--rule-label`, `--panel`, `--panel-border`, `--focus`, `--ground-rgb`, `--bone-rgb`, `--font-display`, `--font-body`, `--font-ghost`, `--fs-*`, `--ls-*`, `--s-*`, `--gutter`, `--gutter-mobile`, `--measure`), and the global class names `.page`, `.page--scroll`, `.page--hero`, `.page--spin`, `.bg-image`, `#cursor-glow`, `.grain`, `.nav`, `.nav-mark`, `.nav-logo`, `.nav-links`, `.nav-link`, `.nav-contact`, `.footer`, `.footer-copy`, `.footer-meta`, `.footer-location`, `.footer-link`, `.reveal`, `.visible`.

- [ ] **Step 1: Write the failing token round-trip test**

Create `tests/tokens.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Documented mapping: every hex that existed in src/pages before the migration → the token that replaced it.
const MAPPING = {
  '#060606': '--grey-12', '#0a0a0a': '--grey-14', '#0f0f0f': '--grey-17', '#111111': '--grey-18',
  '#151515': '--grey-20', '#222222': '--grey-25', '#242424': '--grey-26', '#2e2e2e': '--grey-30',
  '#333333': '--grey-32', '#3a3a3a': '--grey-35', '#4a4a4a': '--grey-41', '#555555': '--grey-45',
  '#686868': '--grey-52', '#888888': '--grey-63', '#e8e4d8': '--bone',
};
// Merged on purpose (≤ 6/255 apart, invisible): #444 → --grey-41, #8a8a8a → --grey-63.
const MERGED = { '#444444': ['--grey-41', 6], '#8a8a8a': ['--grey-63', 2] };

const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries([...css.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));

function oklchToHex(str) {
  const m = str.match(/oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*\)/);
  assert.ok(m, `not an oklch() literal: ${str}`);
  const L = Number(m[1]) / 100, C = Number(m[2]), h = (Number(m[3]) * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
  const l = l_ ** 3, mm = m_ ** 3, s = s_ ** 3;
  const R = 4.0767416621 * l - 3.3077115913 * mm + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * mm - 0.3413193965 * s;
  const B = -0.0041960863 * l - 0.7034186147 * mm + 1.7076147010 * s;
  const enc = (c) => { c = Math.max(0, Math.min(1, c)); c = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; return Math.round(c * 255); };
  return '#' + [R, G, B].map((c) => enc(c).toString(16).padStart(2, '0')).join('');
}

test('every documented hex round-trips exactly from its OKLCH token', () => {
  for (const [hex, token] of Object.entries(MAPPING)) {
    assert.ok(tokens[token], `missing token ${token}`);
    assert.equal(oklchToHex(tokens[token]), hex, `${token} should render as ${hex}`);
  }
});

test('merged greys are within their documented distance', () => {
  for (const [hex, [token, maxDelta]] of Object.entries(MERGED)) {
    const got = parseInt(oklchToHex(tokens[token]).slice(1, 3), 16);
    const want = parseInt(hex.slice(1, 3), 16);
    assert.ok(Math.abs(got - want) <= maxDelta, `${token} is ${Math.abs(got - want)} from ${hex}`);
  }
});

test('role tokens only reference the scale', () => {
  for (const role of ['--ground', '--text', '--text-hover', '--text-nav', '--text-cta', '--rule', '--panel', '--focus']) {
    assert.match(tokens[role], /^var\(--(grey-\d+|bone)\)$/, `${role} = ${tokens[role]}`);
  }
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test tests/tokens.test.mjs`
Expected: FAIL — `ENOENT ... src/styles/tokens.css`.

- [ ] **Step 3: Write `tokens.css`**

The lightness values are the exact OKLCH lightness of each hex (computed with the standard Ottosson matrices), so the browser's conversion lands on the same 8-bit grey.

```css
/* src/styles/tokens.css
   The only file that defines a colour, a font stack, a size, a tracking or a space.
   Greys are neutral OKLCH (chroma 0); each L is the exact lightness of the hex it
   replaced, so rendering is unchanged. Mapping (old hex → token):
     #060606 --grey-12   #0a0a0a --grey-14   #0f0f0f --grey-17   #111    --grey-18
     #151515 --grey-20   #222    --grey-25   #242424 --grey-26   #2e2e2e --grey-30
     #333    --grey-32   #3a3a3a --grey-35   #4a4a4a --grey-41   #555    --grey-45
     #686868 --grey-52   #888    --grey-63   #e8e4d8 --bone
   Merged: #444 → --grey-41 (6/255 apart, one use), #8a8a8a → --grey-63 (2/255 apart).
   Dropped: #b0b0b0 (spin caption hover; that caption is replaced in Task 12). */
:root {
  /* scale */
  --grey-12: oklch(12.21% 0 0);
  --grey-14: oklch(14.48% 0 0);
  --grey-17: oklch(16.84% 0 0);
  --grey-18: oklch(17.76% 0 0);
  --grey-20: oklch(19.57% 0 0);
  --grey-25: oklch(25.20% 0 0);
  --grey-26: oklch(26.03% 0 0);
  --grey-30: oklch(30.12% 0 0);
  --grey-32: oklch(32.11% 0 0);
  --grey-35: oklch(34.85% 0 0);
  --grey-41: oklch(40.91% 0 0);
  --grey-45: oklch(44.95% 0 0);
  --grey-52: oklch(51.73% 0 0);
  --grey-63: oklch(62.68% 0 0);
  --bone:    oklch(91.87% 0.0166 91.6);
  /* rgb triplets for the few alpha uses (gradients, glow, ghost stroke) */
  --ground-rgb: 6 6 6;
  --bone-rgb: 232 228 216;
  --white-rgb: 255 255 255;

  /* roles */
  --ground:       var(--grey-12);
  --panel:        var(--grey-14);
  --panel-border: var(--grey-20);
  --rule:         var(--grey-17);
  --rule-strong:  var(--grey-18);
  --rule-label:   var(--grey-26);
  --text-footer:  var(--grey-25);
  --text-label:   var(--grey-30);
  --text-faint:   var(--grey-32);
  --text-nav:     var(--grey-35);
  --text-cta:     var(--grey-41);
  --text-strong:  var(--grey-45);
  --text:         var(--grey-52);
  --text-hover:   var(--grey-63);
  --focus:        var(--grey-63);
  --text-display: var(--bone);

  /* type — Task 8 swaps the stacks for the Astro Fonts variables */
  --font-display: 'Cinzel', serif;
  --font-body:    'Space Grotesk', sans-serif;
  --font-ghost:   'Uncial Antiqua', serif;
  --fs-9: 9px;  --fs-10: 10px; --fs-11: 11px; --fs-12: 12px; --fs-13: 13px; --fs-14: 14px;
  --fs-h2:   clamp(18px, 2.5vw, 24px);
  --fs-h1:   clamp(28px, 4vw, 48px);
  --fs-hero: clamp(32px, 5vw, 56px);
  --lh-body: 1.75; --lh-article: 1.85; --lh-caption: 1.7;
  --ls-05: 0.5px; --ls-1: 1px; --ls-15: 1.5px; --ls-2: 2px; --ls-3: 3px; --ls-4: 4px;

  /* space — the values in use today; new work picks from this list */
  --s-6: 6px;   --s-8: 8px;   --s-10: 10px; --s-14: 14px; --s-16: 16px; --s-20: 20px;
  --s-22: 22px; --s-24: 24px; --s-28: 28px; --s-32: 32px; --s-40: 40px; --s-44: 44px;
  --s-48: 48px; --s-56: 56px; --s-60: 60px; --s-64: 64px; --s-72: 72px; --s-80: 80px; --s-120: 120px;
  --gutter: var(--s-56);
  --gutter-mobile: var(--s-28);
  --measure: 720px;
}
```

- [ ] **Step 4: Run the test to see it pass**

Run: `node --test tests/tokens.test.mjs`
Expected: 3 passing.

- [ ] **Step 5: Write `global.css` (the shared chrome, byte-for-byte the rules the pages share today)**

```css
/* src/styles/global.css — reset + shared chrome. Page content styles stay in the page. */
@import './tokens.css';

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  min-height: 100%;
  background: var(--ground);
  color: var(--text-hover);            /* was #888 */
  font-family: var(--font-body);
}
/* hero layout (homepage): the viewport is the page */
html.hero, html.hero body { height: 100%; overflow: hidden; }

/* ── PAGE WRAPPER ── */
.page--hero {
  height: 100vh;
  display: grid;
  grid-template-rows: auto 1fr auto;
  position: relative;
  overflow: hidden;
}

/* ── BACKGROUND ── */
.bg-image {
  inset: 0;
  background-image: url('/stone.webp');
  background-size: cover;
  background-position: center 40%;
  z-index: 0;
}
.page--scroll .bg-image { position: fixed; opacity: 0.6; }
.page--hero .bg-image {
  position: absolute;
  opacity: 0;
  animation: bgFadeIn 2.4s ease forwards;
  animation-delay: 0.3s;
}
.bg-image::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    rgb(var(--ground-rgb) / 0.96) 0%,
    rgb(var(--ground-rgb) / 0.92) 40%,
    rgb(var(--ground-rgb) / 0.85) 100%);
}
@keyframes bgFadeIn { from { opacity: 0; } to { opacity: 0.6; } }

/* ── CURSOR GLOW ── */
#cursor-glow {
  position: fixed;
  width: 600px; height: 600px;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(var(--bone-rgb) / 0.04) 0%, transparent 70%);
  pointer-events: none;
  left: -300px; top: -300px;
  transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  z-index: 5;
}

/* ── GRAIN (hero only) ── */
.grain {
  position: fixed;
  inset: -200%;
  width: 400%; height: 400%;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
  opacity: 0.35;
  pointer-events: none;
  z-index: 20;
  animation: grainShift 0.5s steps(1) infinite;
}
@keyframes grainShift {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(-2%, -3%); }
  50%  { transform: translate(3%, 1%); }
  75%  { transform: translate(-1%, 4%); }
  100% { transform: translate(2%, -2%); }
}

/* ── NAV ── */
.nav {
  padding: var(--s-32) var(--gutter);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 10;
}
.nav-mark { display: block; }
.nav-logo { display: block; height: 72px; width: auto; }
.nav-links { display: flex; align-items: center; gap: var(--s-32); }
.nav-link, .nav-contact {
  font-size: var(--fs-10);
  letter-spacing: var(--ls-2);
  text-transform: uppercase;
  color: var(--text-nav);
  text-decoration: none;
  transition: color 0.3s;
}
.nav-link:hover, .nav-contact:hover { color: var(--text-hover); }
.nav-link[aria-current="page"] { color: var(--text); }

/* ── FOOTER ── */
.footer {
  padding: var(--s-22) var(--gutter);
  border-top: 1px solid var(--rule);
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  z-index: 10;
}
.page--scroll .footer { margin-top: var(--s-80); }
.footer-copy, .footer-location, .footer-link {
  font-size: var(--fs-9);
  letter-spacing: var(--ls-15);
  color: var(--text-footer);
  text-transform: uppercase;
}
.footer-link { text-decoration: none; transition: color 0.3s; }
.footer-link:hover { color: var(--text-hover); }
.footer-meta { display: flex; flex-direction: column; align-items: flex-end; gap: var(--s-6); }

/* ── SCROLL REVEAL ── */
.reveal { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
.reveal.visible { opacity: 1; transform: translateY(0); }

/* ── SHARED ANIMATION ── */
@keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }

/* ── MOBILE ── */
@media (max-width: 640px) {
  html.hero, html.hero body { overflow: auto; }
  .page--hero { height: auto; min-height: 100vh; }
  .nav { padding: var(--s-24) var(--gutter-mobile); }
  .nav-links { gap: var(--s-20); }
  .footer { padding: var(--s-20) var(--gutter-mobile); align-items: flex-start; flex-direction: column; gap: var(--s-10); }
  .footer-meta { align-items: flex-start; }
  #cursor-glow { display: none; }
}

/* ── ACCESSIBILITY ── */
a:focus-visible, button:focus-visible { outline: 1px solid var(--focus); outline-offset: 4px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .reveal { opacity: 1; transform: none; }
}
```

Note the deliberate exceptions to "byte-for-byte": `.nav-links { gap: 20px }` at mobile is the *current* (broken) rule and stays until Task 7; `.nav-link[aria-current]` replaces the per-page inline `style="color:#686868"`; `.footer-link` is unused until Task 14.

- [ ] **Step 6: Write the one-off substitution script for page styles**

Create `scripts/tokenize.sed` (used by Tasks 3–6, deleted in Task 6):

```sed
s/#060606/var(--ground)/g
s/#0a0a0a/var(--panel)/g
s/#0f0f0f/var(--rule)/g
s/#111\b/var(--rule-strong)/g
s/#151515/var(--panel-border)/g
s/#222\b/var(--text-footer)/g
s/#242424/var(--rule-label)/g
s/#2e2e2e/var(--text-label)/g
s/#333\b/var(--text-faint)/g
s/#3a3a3a/var(--text-nav)/g
s/#444\b/var(--text-cta)/g
s/#4a4a4a/var(--text-cta)/g
s/#555\b/var(--text-strong)/g
s/#686868/var(--text)/g
s/#8a8a8a/var(--focus)/g
s/#888\b/var(--text-hover)/g
s/#e8e4d8/var(--text-display)/g
s/rgba(6,6,6,\([0-9.]*\))/rgb(var(--ground-rgb) \/ \1)/g
s/rgba(232,228,216,\([0-9.]*\))/rgb(var(--bone-rgb) \/ \1)/g
s/rgba(255,255,255,\([0-9.]*\))/rgb(var(--white-rgb) \/ \1)/g
s/font-family: 'Cinzel', serif;/font-family: var(--font-display);/g
s/font-family: 'Space Grotesk', sans-serif;/font-family: var(--font-body);/g
s/font-family: 'Space Grotesk', system-ui, sans-serif;/font-family: var(--font-body);/g
s/font-family: 'Uncial Antiqua', serif;/font-family: var(--font-ghost);/g
s/font-size: clamp(18px, 2.5vw, 24px);/font-size: var(--fs-h2);/g
s/font-size: clamp(28px, 4vw, 48px);/font-size: var(--fs-h1);/g
s/font-size: clamp(32px, 5vw, 56px);/font-size: var(--fs-hero);/g
s/font-size: \(9\|10\|11\|12\|13\|14\)px;/font-size: var(--fs-\1);/g
s/letter-spacing: 0.5px;/letter-spacing: var(--ls-05);/g
s/letter-spacing: 1px;/letter-spacing: var(--ls-1);/g
s/letter-spacing: 1.5px;/letter-spacing: var(--ls-15);/g
s/letter-spacing: \([234]\)px;/letter-spacing: var(--ls-\1);/g
s/line-height: 1.75;/line-height: var(--lh-body);/g
s/line-height: 1.85;/line-height: var(--lh-article);/g
s/\(padding\|margin\|margin-top\|margin-bottom\|gap\): \(6\|8\|10\|14\|16\|20\|22\|24\|28\|32\|40\|44\|48\|56\|60\|64\|72\|80\|120\)px;/\1: var(--s-\2);/g
s/padding: 60px 0;/padding: var(--s-60) 0;/g
s/padding: 60px 0 40px;/padding: var(--s-60) 0 var(--s-40);/g
s/padding: 80px 0 40px;/padding: var(--s-80) 0 var(--s-40);/g
s/padding: 80px 0 48px;/padding: var(--s-80) 0 var(--s-48);/g
s/padding: 120px 0 40px;/padding: var(--s-120) 0 var(--s-40);/g
s/padding: 120px 0 80px;/padding: var(--s-120) 0 var(--s-80);/g
s/padding: 0 56px;/padding: 0 var(--gutter);/g
s/padding: 0 28px;/padding: 0 var(--gutter-mobile);/g
s/padding: 60px 28px;/padding: var(--s-60) var(--gutter-mobile);/g
s/max-width: 720px;/max-width: var(--measure);/g
```

The script uses GNU basic-regex extensions (`\b`, `\|`), which macOS BSD `sed` does not support. Install GNU sed once (`brew install gnu-sed`) and run it as `gsed -i -f scripts/tokenize.sed <file>`. Every later task's command uses `gsed`.

- [ ] **Step 7: Build to prove nothing imports the new CSS yet and nothing broke**

Run: `npm run build`
Expected: builds; `dist/` identical to before (no page imports the stylesheet yet).

- [ ] **Step 8: Commit**

```bash
git add src/styles/tokens.css src/styles/global.css scripts/tokenize.sed tests/tokens.test.mjs
git commit -m "design: OKLCH tokens, type and space scale, shared chrome stylesheet"
```

---

### Task 3: Base layout, Nav, Footer, and the 404 page on them

**Files:**
- Create: `src/layouts/Base.astro`
- Create: `src/components/Nav.astro`
- Create: `src/components/Footer.astro`
- Modify: `src/pages/404.astro` (rewrite)
- Test: `tests/dist.test.mjs`, `tests/no-literals.test.mjs`

**Interfaces:**
- Produces `Base` props:
  ```ts
  interface Props {
    title: string;                 // full <title>, e.g. "Principles — Archaic"
    description?: string;          // omitted on 404
    path: string;                  // '/', '/deeper/', '/forge/spin/' — canonical and og:url are derived
    ogImage?: string;              // default '/og.png'
    noindex?: boolean;             // 404 only: robots noindex, no canonical, no OG
    layout?: 'scroll' | 'hero' | 'spin';  // default 'scroll'
    current?: 'deeper' | 'forge' | 'services' | 'principles';
    ghostFont?: boolean;           // homepage only (Uncial Antiqua)
  }
  ```
  Slots: default (page content, rendered inside `.page` between nav and footer), `head` (extra head tags, e.g. JSON-LD), `page-start` (rendered inside `.page` before the nav, after the background — the homepage ghost text).
- Produces `Nav` prop `current` (same union) and `Footer` (no props).

- [ ] **Step 1: Write the failing dist invariants test**

Create `tests/dist.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs';

const files = globSync('dist/**/*.html');
assert.ok(files.length >= 6, 'run `npm run build` first — dist/ has no HTML');

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  test(`${file}: exactly one <h1>`, () => assert.equal((html.match(/<h1[\s>]/g) || []).length, 1));
  test(`${file}: exactly one <nav>`, () => assert.equal((html.match(/<nav[\s>]/g) || []).length, 1));
  test(`${file}: exactly one Plausible loader`, () => assert.equal((html.match(/plausible\.io\/js\//g) || []).length, 1));
  test(`${file}: contact address is a plain mailto`, () => assert.match(html, /href="mailto:hello@archaic\.ie"/));
  test(`${file}: one lang=en document`, () => assert.match(html, /<html lang="en"/));
  // Task 8 turns this into a real test; until then it is recorded as pending, not skipped silently.
  test.todo(`${file}: logo is sized (width/height attributes) — enabled in Task 8`);
}
```

`globSync` exists in `node:fs` from Node 22. Until every page is on `Base`, the `<nav>` and Plausible counts hold because each old page also has exactly one of each; the tests are a guard, not a migration tracker.

- [ ] **Step 2: Write the failing no-literals test**

Create `tests/no-literals.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs';

const files = [...globSync('src/pages/**/*.astro'), ...globSync('src/components/*.astro'), ...globSync('src/layouts/*.astro')];

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  test(`${file}: no hex colour literals`, () => {
    const hits = src.match(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/g) || [];
    assert.deepEqual(hits, [], `hex literals in ${file}: ${hits.join(' ')}`);
  });
  test(`${file}: no literal font stacks`, () => {
    assert.doesNotMatch(src, /font-family:\s*'(Cinzel|Space Grotesk|Uncial Antiqua)'/);
  });
}
```

Run: `node --test tests/no-literals.test.mjs`
Expected: FAIL on every page (they are full of hex).

- [ ] **Step 3: Write `Nav.astro`**

```astro
---
// src/components/Nav.astro
interface Props { current?: 'deeper' | 'forge' | 'services' | 'principles' }
const { current } = Astro.props;
const cur = (k: string) => (current === k ? 'page' : undefined);
---
<nav class="nav">
  <a class="nav-mark" href="/"><img class="nav-logo" src="/logo.webp" alt="Archaic" /></a>
  <div class="nav-links">
    <a class="nav-link" href="/deeper" aria-current={cur('deeper')}>Deeper</a>
    <a class="nav-link" href="/services" aria-current={cur('services')}>Services</a>
    <a class="nav-link" href="/principles" aria-current={cur('principles')}>Principles</a>
    <a class="nav-contact" href="mailto:hello@archaic.ie">hello@archaic.ie</a>
  </div>
</nav>
```

(The `Forge` link is added in Task 13, together with the page it points at, so lychee never sees a dead internal link.)

- [ ] **Step 4: Write `Footer.astro`**

```astro
---
// src/components/Footer.astro
---
<footer class="footer">
  <span class="footer-copy">&copy; {new Date().getFullYear()} Archaic Limited</span>
  <div class="footer-meta">
    <span class="footer-location">Registered in Ireland · Co. No. 811858</span>
  </div>
</footer>
```

- [ ] **Step 5: Write `Base.astro`**

```astro
---
// src/layouts/Base.astro — the one document shell. See docs/superpowers/plans/2026-09-24-foundation-and-forge.md
import '../styles/global.css';
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';

interface Props {
  title: string;
  description?: string;
  path: string;
  ogImage?: string;
  noindex?: boolean;
  layout?: 'scroll' | 'hero' | 'spin';
  current?: 'deeper' | 'forge' | 'services' | 'principles';
  ghostFont?: boolean;
}
const {
  title, description, path, ogImage = '/og.png', noindex = false,
  layout = 'scroll', current, ghostFont = false,
} = Astro.props;
const site = 'https://archaic.ie';
const url = `${site}${path}`;
const googleFonts = ghostFont
  ? 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Space+Grotesk:wght@300;400;500;700&family=Uncial+Antiqua&display=swap'
  : 'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Space+Grotesk:wght@300;400;500;700&display=swap';
---
<!DOCTYPE html>
<html lang="en" class={layout === 'hero' ? 'hero' : undefined}>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  {description && <meta name="description" content={description} />}
  {noindex && <meta name="robots" content="noindex" />}
  {!noindex && <link rel="canonical" href={url} />}

  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

  {!noindex && (
    <Fragment>
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${site}${ogImage}`} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${site}${ogImage}`} />
    </Fragment>
  )}

  <slot name="head" />

  <!-- Fonts: replaced by the Astro Fonts API in Task 8 -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href={googleFonts} rel="stylesheet" />

  <!-- Privacy-friendly analytics by Plausible -->
  <script async src="https://plausible.io/js/pa-KH7rq97DQVWnsgrzlvbnO.js" is:inline></script>
  <script is:inline>
    window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
    plausible.init()
  </script>
</head>
<body class={layout === 'spin' ? 'gated' : undefined}>
  {layout !== 'spin' && <div id="cursor-glow" aria-hidden="true"></div>}
  {layout === 'hero' && <div class="grain" aria-hidden="true"></div>}

  <div class={`page page--${layout}`}>
    {layout !== 'spin' && <div class="bg-image" aria-hidden="true"></div>}
    <slot name="page-start" />
    <Nav current={current} />
    <slot />
    {layout !== 'spin' && <Footer />}
  </div>

  <script>
    // Cursor glow (desktop only; hidden by CSS on mobile)
    const glow = document.getElementById('cursor-glow');
    if (glow) {
      document.addEventListener('mousemove', (e) => {
        glow.style.transform = `translate(${e.clientX - 300}px, ${e.clientY - 300}px)`;
      });
    }
    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
        });
      }, { threshold: 0.15 });
      reveals.forEach((el) => observer.observe(el));
    }
  </script>
</body>
</html>
```

Two parity notes. (1) On the current homepage the nav `<img>` is not wrapped in a link; wrapping it in `.nav-mark` is invisible because flex items are blockified. (2) The current scroll pages have `.footer { margin-top: 80px }` inside the page; it now lives in `.page--scroll .footer`.

- [ ] **Step 6: Rewrite `404.astro` on the layout**

Replace the whole file with:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Not Found — Archaic" path="/404" noindex>
  <div class="content">
    <header class="page-header">
      <h1 class="page-title">NOT FOUND</h1>
      <p class="page-intro">There is nothing at this address. It may have moved, or it may never have existed.</p>
    </header>

    <section class="contact reveal">
      <p class="contact-text">
        <a class="contact-link" href="/">Back to the start<span class="arrow" aria-hidden="true"> →</span></a>
      </p>
    </section>
  </div>
</Base>

<style>
  .content { position: relative; z-index: 10; max-width: var(--measure); margin: 0 auto; padding: 0 var(--gutter); }
  .page-header { padding: var(--s-120) 0 var(--s-40); }
  .page-title {
    font-family: var(--font-display);
    font-size: var(--fs-h1);
    font-weight: 400;
    color: var(--text-display);
    letter-spacing: var(--ls-4);
    text-transform: uppercase;
  }
  .page-intro { font-size: var(--fs-14); color: var(--text); line-height: var(--lh-body); max-width: 520px; margin-top: var(--s-24); }
  .contact { padding: var(--s-60) 0 var(--s-40); border-top: 1px solid var(--rule-strong); }
  .contact-text { font-size: var(--fs-14); color: var(--text); line-height: var(--lh-body); }
  .contact-link { color: var(--text-cta); text-decoration: none; transition: color 0.3s; }
  .contact-link:hover { color: var(--text-hover); }
  @media (max-width: 640px) {
    .content { padding: 0 var(--gutter-mobile); }
    .page-header { padding: var(--s-80) 0 var(--s-48); }
  }
</style>
```

Before replacing, read the current `src/pages/404.astro` lines 60–380 and confirm the content rules above are the only ones the page's markup uses (`.content`, `.page-header`, `.page-title`, `.page-intro`, `.contact`, `.contact-text`, `.contact-link`, `.arrow`). The rest of that block (`.service`, `.step`, `.contact-template`…) is dead copy-paste from `/services` and is dropped.

- [ ] **Step 7: Build, run the tests, run parity**

```bash
npm run build && node --test tests/
```
Expected: `tokens` and `dist` pass (dist `logo is sized` is todo); `no-literals` passes for `404.astro`, `Base.astro`, `Nav.astro`, `Footer.astro` and still fails for the four unmigrated pages.

```bash
(npm run preview -- --host 127.0.0.1 --port 4321 &) && sleep 2
npm run qa:parity -- capture after && npm run qa:parity -- compare
```
Expected: `404-desktop.png` and `404-mobile.png` at `0.00%`. All other pages `0.00%` (untouched). If 404 differs, open `.parity/diff/404-*.png`: the usual causes are the footer `margin-top` (must be 80px), the `<a class="nav-mark">` wrapper, and the stylesheet `<link>` shifting nothing but confirming the scoped `:where()` specificity.

- [ ] **Step 8: Commit**

```bash
git add src/layouts/Base.astro src/components/Nav.astro src/components/Footer.astro src/pages/404.astro tests/dist.test.mjs tests/no-literals.test.mjs
git commit -m "layout: Base, Nav, Footer; 404 on the shared layout (pixel-identical)"
```

---

### Task 4: `/principles` and `/services` on the layout

**Files:**
- Modify: `src/pages/principles.astro`, `src/pages/services.astro`

**Interfaces:**
- Consumes: `Base` props (`title`, `description`, `path`, `current`), tokens from Task 2.

- [ ] **Step 1: Run the substitution on both pages**

```bash
gsed -i -f scripts/tokenize.sed src/pages/principles.astro src/pages/services.astro
grep -nE '#[0-9a-fA-F]{3,6}\b' src/pages/principles.astro src/pages/services.astro
```
Expected: the only remaining hex hits are the inline `style="color:#686868;"` on the current nav link (removed in Step 2).

- [ ] **Step 2: Replace the shell of `principles.astro`**

Delete lines 1–37 (frontmatter through the Google Fonts `<link>`) and replace with:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base
  title="Principles — Archaic"
  description="How Archaic works and why. Small on purpose, scope in writing, proof over promises. Plus who runs it and how this site is built."
  path="/principles/"
  current="principles"
>
```

Then, inside the old `<style>` block, **delete** these whole rule groups (they now live in `global.css`): the `*, *::before, *::after` reset; `html, body`; `/* ── BACKGROUND IMAGE ── */` (`.bg-image` and `.bg-image::after`); `/* ── CURSOR GLOW ── */`; `/* ── NAV ── */` (`.nav`, `.nav-logo`, `.nav-links`, `.nav-link`, `.nav-link:hover`, `.nav-contact`, `.nav-contact:hover`); `/* ── FOOTER ── */` (`.footer`, `.footer-copy, .footer-location`, `.footer-meta`); `/* ── SCROLL REVEAL ── */`; inside `@media (max-width: 640px)` the `.nav`, `.footer`, `.footer-meta`, `#cursor-glow`, `.nav-links` rules (keep `.content` and `.page-header`); the whole `/* ── ACCESSIBILITY ── */` section. Keep everything else (`.content`, `.page-header`, `.page-title`, `.page-intro`, `.section`, `.section-label`, `.service*`, `.how-it-works`, `.step*`, `.contact*`).

Change the opening `<style>` tag to a plain `<style>` **placed after the closing `</Base>` tag** (Astro scoped style; it only needs to match this page's own markup).

In the body: delete `<div id="cursor-glow" …>`, `<div class="bg-image" …>`, the whole `<nav class="nav">…</nav>`, the whole `<footer class="footer">…</footer>`, and the trailing `<script>…</script>` (glow + reveal now come from Base). Delete `</body></html>` and `<body>`; the remaining `<div class="content">…</div>` becomes the child of `<Base …>`; close with `</Base>`.

The result has this shape:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base title="Principles — Archaic" description="…" path="/principles/" current="principles">
  <div class="content">
    …unchanged content markup…
  </div>
</Base>

<style>
  .content { … }
  …page-specific rules only…
</style>
```

- [ ] **Step 3: Same for `services.astro`**

Replacement head:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base
  title="Services — Archaic"
  description="Software services from a Dublin studio. Reviews, advisory, and builds. Scoped in writing, delivered by email. No calls, no day rates."
  path="/services/"
  current="services"
>
```

Delete the same shell rules and markup as in Step 2. `/services` additionally keeps `.contact-template` and `.contact-template strong` (page-specific).

- [ ] **Step 4: Build, tests, parity**

```bash
npm run build && node --test tests/
(npm run preview -- --host 127.0.0.1 --port 4321 &) && sleep 2
npm run qa:parity -- capture after && npm run qa:parity -- compare
```
Expected: `no-literals` now passes for these two pages; parity `0.00%` on `principles-*` and `services-*` at both viewports. Known trap: the old pages had `og:url` pointing at `/services` on the Principles page — Base derives it from `path`, a metadata fix with no pixels, so it is allowed.

- [ ] **Step 5: Commit**

```bash
git add src/pages/principles.astro src/pages/services.astro
git commit -m "layout: /principles and /services on Base (pixel-identical)"
```

---

### Task 5: `/deeper` on the layout

**Files:**
- Modify: `src/pages/deeper.astro`

- [ ] **Step 1: Substitute and re-shell**

```bash
gsed -i -f scripts/tokenize.sed src/pages/deeper.astro
```

The frontmatter of `deeper.astro` already contains the content-collection code (`getCollection('journal')`, `render`, `rendered`). Keep it and add the import:

```astro
---
import Base from '../layouts/Base.astro';
import { getCollection, render } from 'astro:content';
// …existing lines unchanged…
---
<Base
  title="Deeper — Archaic"
  description={/* copy the existing meta description verbatim */}
  path="/deeper/"
  current="deeper"
>
  <div class="content">
    …existing content markup, unchanged…
  </div>
</Base>

<style>
  …page-specific rules only (`.content`, `.page-header*`, `.section*`, `.case-study*`, `.journal*`, `.contact*`, mobile `.content`/`.page-header`)…
</style>
```

Copy the `<title>` and `description` values from the current file's `<head>` verbatim before deleting it. Delete the same shell rules and markup listed in Task 4 Step 2.

- [ ] **Step 2: Build, tests, parity**

```bash
npm run build && node --test tests/
(npm run preview -- --host 127.0.0.1 --port 4321 &) && sleep 2
npm run qa:parity -- capture after && npm run qa:parity -- compare
```
Expected: `deeper-desktop.png` and `deeper-mobile.png` `0.00%`. The journal article bodies (`.journal-article-body p`) are rendered by the content collection inside the page, so the scoped style still reaches them; if article paragraphs lose their 16px margin, add `:global(p)` there — `.journal-article-body :global(p) { margin-bottom: var(--s-16); }`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/deeper.astro
git commit -m "layout: /deeper on Base (pixel-identical)"
```

---

### Task 6: Homepage on the layout (`hero`), delete the migration script

**Files:**
- Modify: `src/pages/index.astro`
- Delete: `scripts/tokenize.sed`

- [ ] **Step 1: Substitute, then rewrite the shell**

```bash
gsed -i -f scripts/tokenize.sed src/pages/index.astro
```

Replace the head/shell so the file reads:

```astro
---
import Base from '../layouts/Base.astro';
---
<Base
  title="Archaic — Software Studio, Dublin"
  description="Archaic Limited builds software that endures. No trends. No bloat. Just work that holds."
  path="/"
  layout="hero"
  ghostFont
>
  <Fragment slot="head">
    <script type="application/ld+json" is:inline>{"@context":"https://schema.org","@type":"Organization","name":"Archaic Limited","alternateName":"Archaic","url":"https://archaic.ie/","logo":"https://archaic.ie/apple-touch-icon.png","email":"hello@archaic.ie","foundingDate":"2026-03-25","areaServed":"IE"}</script>
  </Fragment>

  <div slot="page-start" class="ghost-text" aria-hidden="true">ARCHAIC</div>

  <main class="hero">
    <p class="hero-eyebrow">Software Studio — Dublin</p>
    <h1 class="hero-headline">BUILT TO LAST.<br />NOT TO IMPRESS.</h1>
    <p class="hero-body">
      Archaic Limited builds software that endures.<br />
      No trends. No bloat. Just work that holds.
    </p>
    <a class="hero-cta" href="mailto:hello@archaic.ie">
      Get in touch <span class="arrow" aria-hidden="true">→</span>
    </a>
  </main>
</Base>

<style is:global>
  /* Homepage entrance choreography on the shared chrome. Global because Nav/Footer render in Base. */
  .page--hero .nav    { opacity: 0; animation: fadeUp 0.8s ease forwards; animation-delay: 0.1s; }
  .page--hero .footer { opacity: 0; animation: fadeUp 0.8s ease forwards; animation-delay: 1.1s; }
</style>

<style>
  .ghost-text { …unchanged, tokenised… }
  @keyframes ghostReveal { … }
  .hero { … } .hero-eyebrow { … } .hero-eyebrow::before { … }
  .hero-headline { … } .hero-body { … } .hero-cta { … } .hero-cta .arrow { … } .hero-cta:hover .arrow { … }
  @media (max-width: 640px) {
    .hero { padding: var(--s-60) var(--gutter-mobile); }
    .ghost-text { font-size: 35vw; -webkit-text-stroke: 1px rgb(var(--white-rgb) / 0.03); }
  }
</style>
```

Delete from the old style block: reset, `html, body`, `.page`, `.bg-image*`, `@keyframes bgFadeIn`, `#cursor-glow`, `.grain`, `@keyframes grainShift`, `.nav*`, `.footer*`, `@keyframes fadeUp`, the mobile rules for `html, body`, `.page`, `.nav`, `.footer`, `.footer-meta`, `#cursor-glow`, `.nav-links`, and the accessibility section. Delete the old `<body>` chrome (`#cursor-glow`, `.grain`, `.page`, `.bg-image`, nav, footer, glow script).

Note the `@keyframes ghostReveal` stays in the scoped block; Astro scopes keyframe names too, and `.ghost-text` is in the same block, so it resolves.

- [ ] **Step 2: Build, tests, parity**

```bash
npm run build && node --test tests/
(npm run preview -- --host 127.0.0.1 --port 4321 &) && sleep 2
npm run qa:parity -- capture after && npm run qa:parity -- compare
```
Expected: `home-desktop.png` and `home-mobile.png` `0.00%`; `no-literals` passes on every file. Traps: (a) `html.hero` must carry `overflow: hidden` on desktop and `overflow: auto` under 640px; (b) the ghost text must be inside `.page` (it is, via `slot="page-start"`) because it positions against `.page { position: relative }`.

- [ ] **Step 3: Delete the migration helper and commit**

```bash
git rm scripts/tokenize.sed
git add src/pages/index.astro
git commit -m "layout: homepage on Base as the hero layout (pixel-identical); drop tokenize.sed"
```

---

### Task 7: Mobile nav that fits at 390 px (intended change)

**Files:**
- Modify: `src/styles/global.css` (the mobile block)

**Pattern decision:** "wrap under the mark". Below 640 px the nav becomes a column: the mark on its own row, then the links row, which wraps. No JavaScript, no toggle, no hamburger. Four short links and an email address do not justify a disclosure control, and the site's restraint argues against one. Alternative if Connor prefers a single row: keep `flex-direction: row` and let `.nav-links` wrap right-aligned (`flex-wrap: wrap; justify-content: flex-end`) — the email then drops to a second line under the links. Both fit at 390; the column version reads better with the 72 px mark.

- [ ] **Step 1: Confirm the failure is still there**

Run: `npm run qa:parity -- nav-check` (against the current build)
Expected: five `FAIL` lines as in Task 1 Step 6.

- [ ] **Step 2: Change the mobile nav rules**

In `src/styles/global.css` replace, inside `@media (max-width: 640px)`:

```css
  .nav { padding: var(--s-24) var(--gutter-mobile); }
  .nav-links { gap: var(--s-20); }
```

with:

```css
  .nav { padding: var(--s-24) var(--gutter-mobile); flex-direction: column; align-items: flex-start; gap: var(--s-20); }
  .nav-links { flex-wrap: wrap; gap: var(--s-14) var(--s-20); }
```

- [ ] **Step 3: Verify**

```bash
npm run build && (npm run preview -- --host 127.0.0.1 --port 4321 &) && sleep 2
npm run qa:parity -- nav-check
npm run qa:parity -- capture after && npm run qa:parity -- compare
```
Expected: `nav-check` all `ok`. Parity: every `*-desktop.png` `0.00%`; every `*-mobile.png` differs **only** in the nav band and the vertical offset below it (page height `+N`, where N is the added row). Open `.parity/diff/home-mobile.png` and `.parity/diff/deeper-mobile.png` and confirm the diff is the nav region plus a uniform shift. Also look at `.parity/after/home-mobile.png`: the email address is now visible.

- [ ] **Step 4: Re-base and commit**

```bash
npm run qa:parity -- capture baseline
git add src/styles/global.css
git commit -m "nav: wrap under the mark below 640px so all links and the email fit at 390px"
```

---

### Task 8: Self-hosted fonts, tighter CSP, sized logo, LCP

**Files:**
- Modify: `astro.config.mjs`
- Modify: `src/layouts/Base.astro` (font head)
- Modify: `src/styles/tokens.css` (font stacks)
- Modify: `src/components/Nav.astro` (logo size, `fetchpriority`)
- Modify: `public/_headers` (CSP)
- Create: `scripts/lighthouse.sh`
- Modify: `tests/dist.test.mjs` (un-todo the logo test; add the no-Google-Fonts test)

**Interfaces:**
- Produces: `--font-cinzel`, `--font-grotesk`, `--font-uncial` (Astro-generated family stacks with metric-matched fallbacks), consumed by `tokens.css`.

- [ ] **Step 1: Extend the dist test**

In `tests/dist.test.mjs` replace the `test.todo(...)` line with the real assertion and add the two font checks:

```js
  test(`${file}: logo is sized`, () => assert.match(html, /<img[^>]*class="nav-logo"[^>]*width="\d+"[^>]*height="\d+"/));
  test(`${file}: no Google Fonts request`, () => assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/));
  test(`${file}: display face is preloaded`, () => assert.match(html, /<link rel="preload" href="\/_astro\/fonts\/[^"]+\.woff2" as="font"/));
```

Run: `npm run build && node --test tests/dist.test.mjs`
Expected: FAIL on the three new/un-todo'd assertions for every page.

- [ ] **Step 2: Configure the Fonts API**

`astro.config.mjs`:

```js
// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://archaic.ie',
  output: 'static',
  integrations: [sitemap()],
  compressHTML: true,
  fonts: [
    {
      provider: fontProviders.fontsource(),
      name: 'Cinzel',
      cssVariable: '--font-cinzel',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['Georgia', 'serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Space Grotesk',
      cssVariable: '--font-grotesk',
      weights: [400, 500],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['system-ui', 'sans-serif'],
    },
    {
      provider: fontProviders.fontsource(),
      name: 'Uncial Antiqua',
      cssVariable: '--font-uncial',
      weights: [400],
      styles: ['normal'],
      subsets: ['latin'],
      display: 'swap',
      fallbacks: ['serif'],
    },
  ],
  vite: { plugins: [tailwindcss()] },
});
```

Weights are the ones actually used: every Cinzel rule is `font-weight: 400`; Space Grotesk uses 400 and 500 (`strong`); the old Google request also pulled Cinzel 600/900 and Grotesk 300/700, which nothing references. Fontsource is the documented choice for self-hosting; files are emitted under `/_astro/fonts/` (already `immutable` in `_headers`).

- [ ] **Step 3: Swap the head in `Base.astro`**

Add to the frontmatter: `import { Font } from 'astro:assets';` and delete the `googleFonts` const. Replace the three Google Fonts lines with:

```astro
  <Font cssVariable="--font-cinzel" preload />
  <Font cssVariable="--font-grotesk" preload />
  {ghostFont && <Font cssVariable="--font-uncial" />}
```

Cinzel is the display face and is preloaded; Space Grotesk is also above the fold on every page (nav, eyebrow, body) and is preloaded too — two small latin woff2 files. Uncial is homepage-only and not preloaded (it is a decorative ghost behind the fold line).

- [ ] **Step 4: Point the token stacks at the generated variables**

In `tokens.css`:

```css
  --font-display: var(--font-cinzel);
  --font-body:    var(--font-grotesk);
  --font-ghost:   var(--font-uncial);
```

- [ ] **Step 5: Size the logo**

`logo.webp` is 378×216 (intrinsic). In `Nav.astro`:

```astro
  <a class="nav-mark" href="/"><img class="nav-logo" src="/logo.webp" alt="Archaic" width="378" height="216" fetchpriority="high" decoding="async" /></a>
```

`.nav-logo { height: 72px; width: auto }` in `global.css` keeps the rendered size (126×72); the attributes give the browser the aspect ratio before load.

- [ ] **Step 6: Tighten the CSP**

`public/_headers` first block becomes (only `style-src` and `font-src` change):

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://plausible.io https://static.cloudflareinsights.com; worker-src 'self'; connect-src 'self' https://plausible.io; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests
```

`style-src 'unsafe-inline'` stays: the `<Font>` component emits an inline `<style>` with the `@font-face` rules, and Astro inlines small stylesheets.

- [ ] **Step 7: Lighthouse script**

Create `scripts/lighthouse.sh`:

```bash
#!/usr/bin/env bash
# Desktop performance run. Usage: scripts/lighthouse.sh [url]   (default http://localhost:4321/)
set -euo pipefail
URL="${1:-http://localhost:4321/}"
mkdir -p .parity
export CHROME_PATH="$(node -e "console.log(require('playwright').chromium.executablePath())")"
npx --yes lighthouse@12 "$URL" --preset=desktop --only-categories=performance \
  --chrome-flags="--headless=new" --output=json --output-path=.parity/lh.json --quiet
node -e '
const r = require("./.parity/lh.json");
const a = r.audits;
const el = a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.selector;
console.log(`perf ${Math.round(r.categories.performance.score*100)}  LCP ${a["largest-contentful-paint"].displayValue}  FCP ${a["first-contentful-paint"].displayValue}  CLS ${a["cumulative-layout-shift"].displayValue}  LCP element: ${el}`);
'
```

`chmod +x scripts/lighthouse.sh` and add `"qa:lighthouse": "bash scripts/lighthouse.sh"` to `package.json`.

- [ ] **Step 8: Build, tests, parity, Lighthouse**

```bash
npm run build && node --test tests/
ls dist/_astro/fonts/
(npm run preview -- --host 127.0.0.1 --port 4321 &) && sleep 2
npm run qa:parity -- capture after && npm run qa:parity -- compare --budget 1
npm run qa:lighthouse
```
Expected: all tests pass; `dist/_astro/fonts/` contains three (or four) `.woff2` files; parity shows small sub-1% diffs on text edges only (Fontsource and Google serve the same upstream families but different builds/hinting; confirm in `.parity/diff/*` that the diff is glyph edges, not layout — any page-height change is a failure). Lighthouse on local preview: LCP well under 1.5 s and the LCP element is the `h1` or `.nav-logo`. Paste the line into the PR description. The authoritative number is the run against the Cloudflare Pages preview URL in Task 15.

- [ ] **Step 9: Re-base and commit**

```bash
npm run qa:parity -- capture baseline
git add astro.config.mjs src/layouts/Base.astro src/styles/tokens.css src/components/Nav.astro public/_headers scripts/lighthouse.sh package.json tests/dist.test.mjs
git commit -m "perf: self-host Cinzel/Space Grotesk/Uncial via Astro Fonts, preload display face, size the logo, drop Google Fonts from CSP"
```

---

### Task 9: Cross-document view transitions

**Files:**
- Modify: `src/styles/global.css`

Astro 7 needs no component for this: the docs' "browser-native, cross-document view transitions" section says they work in an MPA without `<ClientRouter />`. The CSS opt-in is the platform's `@view-transition { navigation: auto; }` (MDN). Chrome 126+ and Safari 18.2+ animate; Firefox ignores the rule and navigates normally.

- [ ] **Step 1: Add the rules**

Append to `global.css` before the accessibility section:

```css
/* ── CROSS-DOCUMENT VIEW TRANSITIONS ── (Chrome 126+, Safari 18.2+; others navigate normally) */
@media (prefers-reduced-motion: no-preference) {
  @view-transition { navigation: auto; }
  ::view-transition-old(root), ::view-transition-new(root) { animation-duration: 0.3s; animation-timing-function: ease; }
  .nav    { view-transition-name: site-nav; }
  .footer { view-transition-name: site-footer; }
}
```

The nav and footer get their own snapshot groups, so they hold still while the content crossfades. Because the rule is inside a `prefers-reduced-motion: no-preference` block, reduced-motion users get instant navigation with no transition at all.

- [ ] **Step 2: Verify**

```bash
npm run build && grep -o '@view-transition{navigation:auto}' dist/_astro/*.css dist/index.html | head -1
(npm run preview -- --host 127.0.0.1 --port 4321 &) && sleep 2
npm run qa:parity -- capture after && npm run qa:parity -- compare
```
Expected: the grep finds the rule (in a bundled CSS file or inlined); parity `0.00%` everywhere (static screenshots are unaffected). Manual: open `http://localhost:4321/` in Chrome, click Deeper — the page crossfades and the nav does not flicker. Toggle "Emulate CSS prefers-reduced-motion: reduce" in DevTools Rendering and click again — no crossfade.

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "nav: cross-document view transitions, nav and footer held; off under reduced motion"
```

---

### Task 10: Contact route without JavaScript

**Files:**
- Modify: `scripts/console-check.mjs` (add the live mailto assertion)

Cloudflare's **Email Address Obfuscation** rewrites every `mailto:hello@archaic.ie` on the edge into `/cdn-cgi/l/email-protection#…` plus an inline script; with JS off, or for crawlers, the address is gone. It is a **zone setting**, not something the repo controls. The fix is to turn it off for the `archaic.ie` zone.

- [ ] **Step 1 (Connor-confirm step): turn Email Address Obfuscation off for the zone**

Either path; the plan recommends the API because it is recorded in the PR.

Dashboard: Cloudflare → archaic.ie → Security → Settings → "Email Address Obfuscation" → Off. (Older UI: Scrape Shield → Email Address Obfuscation.)

API: needs a token with `Zone → Zone Settings → Edit` on archaic.ie. The DNS token in `.env.local` (`CLOUDFLARE_ARCHAIC_DNS_TOKEN`) has DNS scope only and will get a 403 here, so **Connor must create the token or click the dashboard toggle**. With a suitable token:

```bash
ZONE_ID="$(curl -s -H "Authorization: Bearer $CF_TOKEN" 'https://api.cloudflare.com/client/v4/zones?name=archaic.ie' | node -pe 'JSON.parse(require("fs").readFileSync(0)).result[0].id')"
curl -s -X PATCH -H "Authorization: Bearer $CF_TOKEN" -H 'Content-Type: application/json' \
  "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/email_obfuscation" --data '{"value":"off"}'
```
Expected: `"success":true` and `"value":"off"`. (Endpoint verified in the Cloudflare OpenAPI spec: `PATCH /zones/{zone_id}/settings/{setting_id}`.)

- [ ] **Step 2: Add the live assertion to the console check**

In `scripts/console-check.mjs`, after `waitUntil: 'networkidle'` inside the loop, add:

```js
  const html = await page.content();
  if (/cdn-cgi\/l\/email-protection/.test(html)) errors.push(`${page.url()} :: mailto rewritten by Cloudflare email obfuscation`);
  if (!/href="mailto:hello@archaic\.ie"/.test(html)) errors.push(`${page.url()} :: no plain mailto:hello@archaic.ie`);
```

- [ ] **Step 3: Verify against production now (the setting is live immediately)**

```bash
curl -s https://archaic.ie/ | grep -c 'email-protection'      # expect 0
curl -s https://archaic.ie/ | grep -c 'mailto:hello@archaic.ie' # expect 2
npm run qa:console -- https://archaic.ie
```
Expected: `0`, `2`, and `ok: no console errors`. If `email-protection` still appears, the zone setting did not take; do not work around it in code.

- [ ] **Step 4: Commit**

```bash
git add scripts/console-check.mjs
git commit -m "qa: assert the contact address survives the edge (Cloudflare email obfuscation off)"
```

---

### Task 11: Spin worker: `reset`, and the page hooks for pause

**Files:**
- Modify: `public/forge/spin/worker.js`
- Modify: `scripts/qa-spin.mjs`

**Interfaces:**
- Produces worker messages: main → worker `{type:'reset', seed:number}`; worker → main `{type:'frame', spins:ArrayBuffer, reset:true}`.
- Produces `window.__spin` additions used by QA and Task 12: `paused` (getter), `pause()`, `resume()`, `reset()`, `resets` (count of reset frames received).

- [ ] **Step 1: Extend the QA script with the failing checks**

Append to `scripts/qa-spin.mjs` before `consoleErrors.length === 0 ? …`:

```js
// pause: no frames flow while paused; resume: they flow again
await page.evaluate(() => window.__spin.pause());
const f1 = await page.evaluate(() => window.__spin.frames);
await page.waitForTimeout(500);
const f2 = await page.evaluate(() => window.__spin.frames);
f2 === f1 ? ok('paused: no frames') : fail(`paused but frames advanced ${f1} → ${f2}`);

// reset while paused at the cold end: the only new frame is the randomised one
await page.evaluate(() => window.__spin.reset());
await page.waitForFunction(() => window.__spin.resets === 1, null, { timeout: 5000 });
const fresh = await page.evaluate(() => window.__spin.sample());
fresh.agreement < 0.7 ? ok(`reset: agreement ${fresh.agreement.toFixed(3)} (noise again)`) : fail(`reset did not randomise: ${fresh.agreement}`);

await page.evaluate(() => window.__spin.resume());
await page.waitForFunction((n) => window.__spin.frames > n + 10, f2, { timeout: 10000 });
ok('resumed: frames flowing');
```

Run: `npm run build && (npm run preview -- --host 127.0.0.1 --port 4321 &) && sleep 2 && npm run qa:spin`
Expected: FAIL at `window.__spin.pause is not a function`.

- [ ] **Step 2: Add `reset` to the worker**

In `public/forge/spin/worker.js`, inside `self.onmessage`, after the `tick` branch:

```js
    if (msg.type === 'reset') {
      if (!sim) return;
      sim.randomise();
      const copy = new Int8Array(spinsView());
      self.postMessage({ type: 'frame', spins: copy.buffer, reset: true }, [copy.buffer]);
    }
```

`randomise()` re-draws every spin from the instance's RNG; no re-`init()` and no second `IsingWasm` (so no leak). The wasm build is not touched.

- [ ] **Step 3: Add pause/resume/reset to the page script (current `spin.astro`)**

In `src/pages/forge/spin.astro` (still the old self-contained page; Task 12 moves it onto Base and keeps these lines):

After `let visible = !document.hidden;` add `let paused = false; let resets = 0;`.

In `onWorkerMessage`, in the `frame` branch, after `frames++;` add `if (m.reset) resets++;`.

Change `loop()` to:

```js
    function loop() {
      if (!visible || !worker || paused) return;
      if (!pending) { pending = true; worker.postMessage({ type: 'tick', T: temperature() }); }
      requestAnimationFrame(loop);
    }
    function pause() { paused = true; drifting = false; clearTimeout(idleTimer); }
    function resume() { if (!paused) return; paused = false; loop(); armIdle(); }
    function reset() { if (worker) worker.postMessage({ type: 'reset' }); }
```

In `armIdle()` add `if (paused) return;` right after `clearTimeout(idleTimer);`.

Extend the test hook:

```js
    window.__spin = {
      get frames() { return frames; },
      get resets() { return resets; },
      get paused() { return paused; },
      temperature, pause, resume, reset,
      sample() { /* unchanged */ },
    };
```

- [ ] **Step 4: Run tests and QA**

```bash
node --test tests/ && npm run build && (npm run preview -- --host 127.0.0.1 --port 4321 &) && sleep 2 && npm run qa:spin
```
Expected: `spin QA passed` including the three new `ok` lines.

- [ ] **Step 5: Commit**

```bash
git add public/forge/spin/worker.js src/pages/forge/spin.astro scripts/qa-spin.mjs
git commit -m "forge/spin: pause, resume and reset (worker reset message), QA covers them"
```

---

### Task 12: `/forge/spin` as a real page (intended change)

**Files:**
- Modify: `src/pages/forge/spin.astro` (rewrite around the existing script)
- Create: `scripts/poster-spin.mjs`
- Create: `public/forge/spin/poster.webp` (generated)
- Modify: `public/forge/spin/tmap.js` (export the temperature bounds)
- Modify: `scripts/qa-spin.mjs` (h1, readout, poster checks)
- Modify: `package.json` (`poster:spin`)

**Interfaces:**
- Consumes: `Base` with `layout="spin"` (no background, glow, grain or footer; body starts `gated`), worker `reset`, `__spin` hooks from Task 11.
- Produces: `#panel`, `#readout-word`, `#readout-marker`, `#pause`, `#reset`, `#save`, `#poster` and the existing `#gate`, `#begin`, `#lattice`.

**Design (fits the spin spec and the site rules):** the shared nav sits fixed at the top over the existing vignette; a bottom-left `<main class="panel">` on a near-opaque ground carries the `h1` "SPIN" in Cinzel caps, one short paragraph, the temperature readout as a **word and a bar** (HOT / NEAR CRITICAL / COLD; no digits, per the spin spec's "no numbers anywhere on the page"), and four text controls: Pause, Reset, Save, Source. Under `prefers-reduced-motion: reduce` the gate still shows; after Continue the poster stays and the sim does not start until the user presses Run (the Pause button's other state). Crawlers get the poster `<img>` with a real `alt`.

- [ ] **Step 1: Export the bounds from `tmap.js`**

`public/forge/spin/tmap.js` already exports `CONTROL_POINTS` and `temperatureFor`. Add:

```js
export const T_HOT = CONTROL_POINTS[0][1];                         // 5.0
export const T_COLD = CONTROL_POINTS[CONTROL_POINTS.length - 1][1]; // 0.6
export function readoutFor(T) {
  if (T > 2.6) return 'HOT';
  if (T < 2.0) return 'COLD';
  return 'NEAR CRITICAL';
}
```

Add to `tests/tmap.test.mjs`:

```js
import { readoutFor, T_HOT, T_COLD } from '../public/forge/spin/tmap.js';
test('readout words straddle the critical point', () => {
  assert.equal(readoutFor(T_HOT), 'HOT');
  assert.equal(readoutFor(2.269), 'NEAR CRITICAL');
  assert.equal(readoutFor(T_COLD), 'COLD');
});
```

Run: `node --test tests/tmap.test.mjs` → PASS after the edit.

- [ ] **Step 2: Extend the QA script with the page checks**

Append to `scripts/qa-spin.mjs` (before the console-errors line):

```js
const h1 = await page.textContent('h1');
h1?.trim() === 'SPIN' ? ok('h1 is SPIN') : fail(`h1: ${h1}`);
(await page.$('nav.nav')) ? ok('shared nav present') : fail('no shared nav');
const word = (await page.textContent('#readout-word'))?.trim();
word === 'COLD' ? ok('readout says COLD at the bottom') : fail(`readout at bottom: ${word}`);
const posterAlt = await page.getAttribute('#poster', 'alt');
posterAlt && posterAlt.length > 20 ? ok('poster has alt text') : fail('poster missing alt');
/\d/.test(await page.textContent('#panel')) ? fail('digits in the panel') : ok('no digits in the panel');
```

(The scroll-to-bottom happened earlier in the script, so `COLD` is the expected word here.)

- [ ] **Step 3: Rewrite `spin.astro`**

```astro
---
// Spin — a live 2D Ising model. Scroll is temperature.
// Spec: docs/superpowers/specs/2026-09-24-spin-design.md; page framing: docs/superpowers/plans/2026-09-24-foundation-and-forge.md
import Base from '../../layouts/Base.astro';
---
<Base
  title="Spin — Archaic"
  description="A two-dimensional Ising model running live in your browser. Scroll to cool it from noise, through the critical point, into frozen domains."
  path="/forge/spin/"
  ogImage="/forge/spin/og.png"
  layout="spin"
  current="forge"
>
  <div class="gate" id="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
    <div class="gate-inner">
      <p class="gate-title" id="gate-title">THIS PAGE FLASHES</p>
      <p class="gate-text">It is a live physical simulation. At its hottest it becomes a rapidly flickering pattern across the whole screen. If flashing light affects you, go back.</p>
      <div class="gate-actions">
        <button class="gate-continue" id="begin" type="button">Continue</button>
        <a class="gate-back" href="/forge/">Back</a>
      </div>
    </div>
  </div>

  <img class="poster" id="poster" src="/forge/spin/poster.webp" width="1600" height="1000" decoding="async"
       alt="A square lattice of the two-dimensional Ising model near its critical temperature: bone and black domains at every size, from single cells to patches that span the frame." />
  <canvas class="lattice" id="lattice" aria-hidden="true"></canvas>
  <div class="vignette" aria-hidden="true"></div>
  <div class="track" aria-hidden="true"></div>

  <main class="panel" id="panel">
    <h1 class="panel-title">SPIN</h1>
    <p class="panel-text">A two-dimensional Ising model, running live in your browser. Every cell is a spin that wants to match its neighbours. Heat fights that. At the top of the page the lattice is hot and it is noise. At the bottom it is cold and it freezes into domains. In between, at one temperature, structure appears at every size at once. That point is why physicists still study this model. Scroll to cool it.</p>
    <p class="readout" role="status" aria-live="polite">
      <span class="readout-word" id="readout-word">HOT</span>
      <span class="readout-track" aria-hidden="true"><span class="readout-marker" id="readout-marker"></span></span>
    </p>
    <div class="controls">
      <button class="control" id="pause" type="button">Pause</button>
      <button class="control" id="reset" type="button">Reset</button>
      <button class="control" id="save" type="button">Save</button>
      <a class="control" href="https://github.com/faulknco/ising-rs" target="_blank" rel="noopener noreferrer">Source</a>
    </div>
  </main>
</Base>

<style is:global>
  /* The spin layout: nav floats over the canvas; nothing else from the chrome. */
  .page--spin .nav { position: fixed; top: 0; left: 0; right: 0; z-index: 2; }
  .page--spin .nav-link, .page--spin .nav-contact { color: var(--text); text-shadow: 0 0 12px var(--ground), 0 0 4px var(--ground); }
  .page--spin .nav-link:hover, .page--spin .nav-contact:hover { color: var(--text-display); }
  body.gated { overflow: hidden; }
</style>

<style>
  .track { height: 600vh; width: 100%; pointer-events: none; }

  .poster, canvas.lattice { position: fixed; inset: 0; width: 100vw; height: 100vh; display: block; }
  .poster { object-fit: cover; image-rendering: pixelated; z-index: 0; }
  canvas.lattice { image-rendering: pixelated; opacity: 0; transition: opacity 0.6s ease; z-index: 0; }
  canvas.lattice.live { opacity: 1; }

  .vignette {
    position: fixed; inset: 0; z-index: 1; pointer-events: none;
    background:
      linear-gradient(to bottom, rgb(var(--ground-rgb) / 0.85), rgb(var(--ground-rgb) / 0) 160px),
      linear-gradient(to top, rgb(var(--ground-rgb) / 0.9), rgb(var(--ground-rgb) / 0) 180px);
  }

  .panel {
    position: fixed; left: var(--s-40); bottom: var(--s-32); z-index: 2;
    max-width: 46ch;
    padding: var(--s-20);
    background: rgb(var(--ground-rgb) / 0.88);
    border: 1px solid var(--panel-border);
  }
  .panel-title {
    font-family: var(--font-display); text-transform: uppercase;
    font-size: var(--fs-h2); font-weight: 400; letter-spacing: var(--ls-2); color: var(--text-display);
    margin-bottom: var(--s-10);
  }
  .panel-text { font-size: var(--fs-12); line-height: var(--lh-caption); color: var(--text); margin-bottom: var(--s-16); }

  .readout { display: flex; align-items: center; gap: var(--s-14); margin-bottom: var(--s-16); }
  .readout-word {
    font-family: var(--font-display); text-transform: uppercase;
    font-size: var(--fs-10); letter-spacing: var(--ls-3); color: var(--text-display);
    min-width: 12ch;
  }
  .readout-track { position: relative; flex: 1; height: 1px; background: var(--rule-label); }
  .readout-marker {
    position: absolute; top: -3px; left: 0; width: 7px; height: 7px; margin-left: -3px;
    background: var(--text-display); transition: left 0.2s linear;
  }

  .controls { display: flex; flex-wrap: wrap; gap: var(--s-20); }
  .control {
    font: inherit; font-size: var(--fs-10); letter-spacing: var(--ls-2); text-transform: uppercase;
    color: var(--text-cta); background: none; border: 0; cursor: pointer; text-decoration: none;
    transition: color 0.3s; padding: 0;
  }
  .control:hover { color: var(--text-hover); }

  .gate {
    position: fixed; inset: 0; z-index: 3;
    background: var(--ground);
    display: flex; align-items: center; justify-content: center;
    padding: var(--s-24);
  }
  .gate.closed { display: none; }
  .gate-inner { max-width: 44ch; }
  .gate-title {
    font-family: var(--font-display); text-transform: uppercase;
    font-size: var(--fs-h2); letter-spacing: var(--ls-2); color: var(--text-display);
    margin-bottom: var(--s-20);
  }
  .gate-text { font-size: var(--fs-13); line-height: var(--lh-body); color: var(--text); margin-bottom: var(--s-32); }
  .gate-actions { display: flex; gap: var(--s-32); align-items: center; }
  .gate-continue, .gate-back {
    font: inherit; font-size: var(--fs-10); letter-spacing: var(--ls-2); text-transform: uppercase;
    background: none; border: 0; cursor: pointer; text-decoration: none;
    color: var(--focus); transition: color 0.3s;
  }
  .gate-continue:hover, .gate-back:hover { color: var(--text-display); }

  @media (max-width: 640px) {
    .panel { left: var(--s-16); right: var(--s-16); bottom: var(--s-16); max-width: none; padding: var(--s-16); }
    .panel-text { font-size: var(--fs-11); }
  }
  @media (prefers-reduced-motion: reduce) {
    canvas.lattice { transition: none; }
    .readout-marker { transition: none; }
  }
</style>

<script type="module" is:inline>
  import { temperatureFor, readoutFor, T_HOT, T_COLD } from '/forge/spin/tmap.js';
  // …the whole existing script from Task 11, with these additions…
</script>
```

The script keeps everything from Task 11 (rendering, scroll→temperature, worker start, idle drift, save, gate, focus trap, `__spin`) and adds:

```js
  // ---- readout ----------------------------------------------------------
  const word = document.getElementById('readout-word');
  const marker = document.getElementById('readout-marker');
  function updateReadout() {
    const T = temperature();
    const w = readoutFor(T);
    if (word.textContent !== w) word.textContent = w;
    marker.style.left = `${(100 * (T_HOT - T)) / (T_HOT - T_COLD)}%`;
  }
  addEventListener('scroll', updateReadout, { passive: true });
  updateReadout();

  // ---- pause button (also the Run button under reduced motion) ------------
  const pauseBtn = document.getElementById('pause');
  function syncPauseLabel() { pauseBtn.textContent = paused ? 'Run' : 'Pause'; }
  pauseBtn.addEventListener('click', () => { paused ? resume() : pause(); syncPauseLabel(); });
  document.getElementById('reset').addEventListener('click', reset);

  // ---- poster hand-off ------------------------------------------------------
  const poster = document.getElementById('poster');
  // in onWorkerMessage, frame branch, where `canvas.classList.add('live')` runs on the first frame:
  //   poster.hidden = true;
```

and changes `start()` for reduced motion:

```js
  function start() {
    if (worker) return;
    document.body.classList.remove('gated');
    document.getElementById('gate').classList.add('closed');
    worker = new Worker('/forge/spin/worker.js', { type: 'module' });
    worker.onmessage = onWorkerMessage;
    worker.onerror = (e) => console.error('spin worker failed:', e.message);
    worker.postMessage({ type: 'init', n: N, seed: Date.now() % 4294967296, maxSweeps: reduced ? 1 : 4 });
    if (reduced) { paused = true; syncPauseLabel(); }   // poster stays until the user presses Run
    else armIdle();
  }
```

With `paused` true before `ready` arrives, the `ready` branch calls `loop()`, which returns immediately, so no frame is produced and the poster stays visible. Pressing Run calls `resume()` → `loop()`.

- [ ] **Step 4: Poster generator**

Create `scripts/poster-spin.mjs`:

```js
// Captures a frame of the lattice near the critical point and writes public/forge/spin/poster.webp.
// Usage: node scripts/poster-spin.mjs [baseUrl]   (serve first; default http://localhost:4321)
import { chromium } from 'playwright';
import sharp from 'sharp';   // a dependency of astro; present in node_modules
import { writeFileSync } from 'node:fs';

const base = (process.argv[2] || 'http://localhost:4321').replace(/\/$/, '');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
await page.goto(`${base}/forge/spin/`, { waitUntil: 'domcontentloaded' });
await page.click('#begin');
await page.waitForFunction(() => window.__spin && window.__spin.frames > 5, null, { timeout: 20000 });
await page.evaluate(() => scrollTo(0, 0.5 * (document.documentElement.scrollHeight - innerHeight)));
await page.waitForTimeout(8000);              // let the lattice settle at T ≈ T_c
await page.evaluate(() => window.__spin.pause());
const png = await page.locator('#lattice').screenshot({ type: 'png' });
await browser.close();
const webp = await sharp(png).webp({ quality: 80 }).toBuffer();
writeFileSync('public/forge/spin/poster.webp', webp);
console.log(`wrote public/forge/spin/poster.webp (${(webp.length / 1024).toFixed(0)} KB)`);
```

Add `"poster:spin": "node scripts/poster-spin.mjs"` to `package.json`. If `sharp` is not resolvable, install it as a devDependency (`npm i -D sharp`); Astro's default image service already pulls it in.

- [ ] **Step 5: Build, generate the poster, QA**

```bash
npm run build && (npm run preview -- --host 127.0.0.1 --port 4321 &) && sleep 2
npm run poster:spin
npm run build          # poster is now in public/, rebuild so preview serves it
node --test tests/ && npm run qa:spin
```
Expected: `poster.webp` under ~150 KB; `spin QA passed` with the new `ok` lines. Then by hand at `http://localhost:4321/forge/spin/`: gate → Continue; the nav is readable over noise; the panel is readable at top (noise) and bottom (domains); Pause freezes, Run resumes, Reset scrambles, Save downloads. In DevTools emulate reduced motion, reload: after Continue the poster stays and the button reads "Run".

- [ ] **Step 6: Parity (intended change) and re-base**

```bash
npm run qa:parity -- capture after && npm run qa:parity -- compare
```
Expected: all pages other than `forge-spin-*` at `0.00%`. The spin screenshots show the gate (it is `z-index: 3` and covers the nav and panel), so they should be near-identical too; the only expected difference is the gate's "Back" link, which now points at `/forge/`. Then `npm run qa:parity -- capture baseline`.

- [ ] **Step 7: Commit**

```bash
git add src/pages/forge/spin.astro public/forge/spin/tmap.js public/forge/spin/poster.webp scripts/poster-spin.mjs scripts/qa-spin.mjs tests/tmap.test.mjs package.json
git commit -m "forge/spin: real page — h1, shared nav, panel with readout and controls, poster for reduced motion and crawlers"
```

---

### Task 13: `/forge` index and the nav link (intended change)

**Files:**
- Create: `src/pages/forge/index.astro`
- Modify: `src/components/Nav.astro`
- Modify: `scripts/parity.mjs` (`PAGES`)

- [ ] **Step 1: The index page**

```astro
---
import Base from '../../layouts/Base.astro';
---
<Base
  title="Forge — Archaic"
  description="Working pieces from the Archaic forge. Real models, running live in the browser, built from the studio's own code."
  path="/forge/"
  current="forge"
>
  <div class="content">
    <header class="page-header">
      <h1 class="page-title">FORGE</h1>
      <p class="page-intro">Working pieces. Each one is a real model, running live, built from the studio's own code.</p>
    </header>

    <section class="section">
      <p class="section-label">Pieces</p>

      <article class="piece reveal">
        <h2 class="piece-name"><a class="piece-link" href="/forge/spin/">SPIN</a></h2>
        <p class="piece-tagline">A two-dimensional Ising model. Scroll is temperature.</p>
        <p class="piece-body">Hot at the top, frozen at the bottom, and the critical point in between. This page flashes; it asks before it starts.</p>
        <a class="piece-cta" href="/forge/spin/">Open Spin <span class="arrow" aria-hidden="true">→</span></a>
      </article>
    </section>
  </div>
</Base>

<style>
  .content { position: relative; z-index: 10; max-width: var(--measure); margin: 0 auto; padding: 0 var(--gutter); }
  .page-header { padding: var(--s-120) 0 var(--s-40); }
  .page-title { font-family: var(--font-display); font-size: var(--fs-h1); font-weight: 400; color: var(--text-display); letter-spacing: var(--ls-4); text-transform: uppercase; }
  .page-intro { font-size: var(--fs-14); color: var(--text); line-height: var(--lh-body); max-width: 520px; margin-top: var(--s-24); }
  .section { padding: var(--s-60) 0; }
  .section-label { font-size: var(--fs-9); letter-spacing: var(--ls-3); text-transform: uppercase; color: var(--text-label); margin-bottom: var(--s-48); display: flex; align-items: center; gap: var(--s-14); }
  .section-label::before { content: ''; display: block; width: 28px; height: 1px; background: var(--rule-label); flex-shrink: 0; }
  .piece { margin-bottom: var(--s-72); }
  .piece:last-child { margin-bottom: 0; }
  .piece-name { font-family: var(--font-display); font-size: var(--fs-h2); font-weight: 400; letter-spacing: var(--ls-2); text-transform: uppercase; margin-bottom: var(--s-6); }
  .piece-link { color: var(--text-display); text-decoration: none; }
  .piece-tagline { font-size: var(--fs-13); color: var(--text); margin-bottom: var(--s-24); font-style: italic; }
  .piece-body { font-size: var(--fs-13); color: var(--text); line-height: var(--lh-body); margin-bottom: var(--s-24); }
  .piece-cta { display: inline-flex; align-items: center; gap: var(--s-10); font-size: var(--fs-10); letter-spacing: var(--ls-2); text-transform: uppercase; color: var(--text-cta); text-decoration: none; transition: color 0.3s; }
  .piece-cta:hover { color: var(--text-hover); }
  .piece-cta .arrow { display: inline-block; transition: transform 0.3s ease; }
  .piece-cta:hover .arrow { transform: translateX(6px); }
  @media (max-width: 640px) {
    .content { padding: 0 var(--gutter-mobile); }
    .page-header { padding: var(--s-80) 0 var(--s-48); }
  }
</style>
```

This mirrors the `/services` and `/principles` article rhythm, so the section reads as part of the same site.

- [ ] **Step 2: Add the nav link**

In `Nav.astro`, after the Deeper link:

```astro
    <a class="nav-link" href="/forge" aria-current={cur('forge')}>Forge</a>
```

- [ ] **Step 3: Add the page to the harness and verify**

In `scripts/parity.mjs` change `PAGES` to `['/', '/deeper/', '/forge/', '/services/', '/principles/', '/404.html', '/forge/spin/']`.

```bash
npm run build && node --test tests/
(npm run preview -- --host 127.0.0.1 --port 4321 &) && sleep 2
npm run qa:parity -- nav-check
npm run qa:parity -- capture after && npm run qa:parity -- compare
npm run qa:spin
```
Expected: `nav-check` all `ok` (five links + email still fit at 390 with the wrap); `dist` tests pass for the new page; parity shows every page differing only in the nav links band (one extra word) — confirm in `.parity/diff/`; `forge-*` reports `skip` (no baseline yet). Then `npm run qa:parity -- capture baseline`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/forge/index.astro src/components/Nav.astro scripts/parity.mjs
git commit -m "forge: index page listing Spin; Forge in the nav"
```

---

### Task 14: Cross-links (intended change)

**Files:**
- Modify: `src/pages/principles.astro` (one sentence)
- Modify: `src/components/Footer.astro` (one link)

- [ ] **Step 1: Cite the dead ends from Proof Over Promises**

In `principles.astro`, the `PROOF OVER PROMISES` article body becomes:

```astro
        <p class="service-body">Everything on the <a class="contact-link" href="/deeper">Deeper</a> page is live and in use. If we say we can build something, there is a working example of it. We also publish what failed. The <a class="contact-link" href="https://connorfaulkner.com/dead-ends" target="_blank" rel="noopener noreferrer">dead ends</a> are public.</p>
```

The author line in "The Studio" ("Archaic Limited is run by Connor Faulkner…") is unchanged.

- [ ] **Step 2: Colophon link in the footer**

`Footer.astro`:

```astro
<footer class="footer">
  <span class="footer-copy">&copy; {new Date().getFullYear()} Archaic Limited</span>
  <div class="footer-meta">
    <span class="footer-location">Registered in Ireland · Co. No. 811858</span>
    <a class="footer-link" href="https://connorfaulkner.com" rel="noopener">Made by Connor Faulkner</a>
  </div>
</footer>
```

`.footer-link` styling already exists in `global.css` (Task 2): 9 px, tracked, uppercase, footer grey, hover to `--text-hover`.

- [ ] **Step 3: Verify**

```bash
npm run build && node --test tests/
(npm run preview -- --host 127.0.0.1 --port 4321 &) && sleep 2
npm run qa:parity -- capture after && npm run qa:parity -- compare
curl -s -o /dev/null -w '%{http_code}\n' https://connorfaulkner.com/dead-ends
```
Expected: diffs confined to the footer band on every page (one extra line; page height `+15` px or so) and the one paragraph on `/principles`; `200` for the dead-ends URL (lychee will check it in CI too). Then `npm run qa:parity -- capture baseline`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/principles.astro src/components/Footer.astro
git commit -m "content: cite the public dead ends from Principles; footer links connorfaulkner.com"
```

---

### Task 15: CI, preview verification, Lighthouse on the real deploy

**Files:**
- Modify: `.github/workflows/ci.yml`
- Modify: `README.md` (QA commands)

- [ ] **Step 1: CI runs the tests and the spin QA**

Replace the `build` job steps in `.github/workflows/ci.yml` with:

```yaml
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v7
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Unit and built-HTML tests
        run: npm test
      - name: Check links in built HTML
        uses: lycheeverse/lychee-action@v2
        with:
          args: >-
            --root-dir "${{ github.workspace }}/dist"
            --exclude-path dist/_astro
            --exclude 'mailto:'
            --exclude 'https://archaic.ie'
            --accept 200,204,301,302,307,308,403,429
            --no-progress
            "dist/**/*.html"
          fail: true
      - name: Install Chromium for Playwright
        run: npx playwright install --with-deps chromium
      - name: Serve the build
        run: |
          npx astro preview --host 127.0.0.1 --port 4321 &
          for i in $(seq 1 30); do curl -sf http://127.0.0.1:4321/ >/dev/null && break; sleep 1; done
      - name: Spin QA (physics sanity, gate, pause/reset, page semantics)
        run: npm run qa:spin
```

`npm test` runs `tests/tokens`, `tests/tmap`, `tests/no-literals` and `tests/dist` (which needs `dist/`, hence after build). The Fonts API downloads from Fontsource at build time; CI and Cloudflare Pages both have network.

- [ ] **Step 2: README**

Under "Run" in `README.md` add:

```
npm test                       # tokens, tmap, no-literals, built-HTML invariants (build first)
npm run qa:spin [url]          # Playwright: /forge/spin physics + page checks
npm run qa:parity -- …         # capture baseline|after, compare, nav-check (local acceptance)
npm run qa:console -- <url>    # zero console errors on every page (CSP check against a deploy)
npm run qa:lighthouse [url]    # desktop performance, prints LCP and its element
```

- [ ] **Step 3: Push, open the PR, verify on the Pages preview**

```bash
git add .github/workflows/ci.yml README.md
git commit -m "ci: run tests and spin QA; document the QA commands"
git push -u origin foundation/layout-and-forge
gh pr create --title "Foundation: shared layout + tokens, self-hosted fonts, mobile nav, /forge" --body-file - <<'EOF'
…summary, the `nav-check` before/after output, the local Lighthouse line from Task 8…
EOF
```

When Cloudflare Pages posts the preview URL on the PR:

```bash
PREVIEW=https://<branch-hash>.archaic-site.pages.dev
npm run qa:console -- $PREVIEW        # CSP: zero console errors on all seven pages, mailto intact
npm run qa:spin $PREVIEW              # wasm + worker under the real CSP
npm run qa:lighthouse $PREVIEW/       # record: perf, LCP, LCP element
```
Expected: `ok` from both QA scripts; Lighthouse LCP under 1.5 s with the LCP element the `h1` or the sized logo. Paste the Lighthouse line into the PR. If LCP is above 1.5 s on the preview, check in order: the preload `<link>` for Cinzel is present in the served HTML; `/_astro/fonts/*.woff2` returns with `immutable` caching; `logo.webp` carries `fetchpriority="high"`; then the Cloudflare bot-challenge script (outside our control, the audit already noted it costs best-practice points, not LCP).

- [ ] **Step 4: Final parity summary for the reviewer**

```bash
npm run qa:parity -- compare
```
Expected: `0.00%` on every page (baseline was re-captured after the last intended change). Put the diff summary from Tasks 7, 8, 12, 13, 14 in the PR as the record of *what* changed visually.

---

## Self-review against the spec

- **Shared layout + tokens (spec §5, brief item 1):** Tasks 2–6; 18 hex → 15 OKLCH tokens with a documented, tested mapping; type and space scales; pixel-parity harness with 1440/390 before/after diffs (Task 1).
- **Mobile nav (item 2):** Task 7, DOM-asserted at 390 on every page, no JS.
- **Contact route (item 3):** Task 10, zone setting via API or dashboard, marked Connor-confirm; live assertion in `qa:console`.
- **Fonts / LCP (item 4):** Task 8 — `fontProviders.fontsource()`, `display: 'swap'`, `<Font preload>`, sized logo with `fetchpriority`, CSP tightened, Lighthouse script; measured on the Pages preview in Task 15.
- **View transitions (item 5):** Task 9 — native `@view-transition { navigation: auto }` (Astro 7 needs no `<ClientRouter />` for cross-document), inside `prefers-reduced-motion: no-preference`.
- **`/forge/spin` as a real page (item 6):** Tasks 11–12 — `h1`, shared nav, panel, readout, pause/reset, gate kept, poster, reduced-motion path; `/forge` index in Task 13; wasm untouched; `qa:spin` extended and in CI (Task 15).
- **Cross-links (item 7):** Task 14 — Principles cites `/dead-ends`; footer links connorfaulkner.com; author line unchanged.
- **Constraints:** Cinzel uppercase in every new Cinzel element (`SPIN`, `FORGE`, readout words, gate); no digits in the spin panel (asserted); no address; archaic voice in the two new paragraphs; CSP only tightened.

## Open questions for Connor

1. **Mobile nav pattern** — column (mark, then wrapping links; recommended) vs single row with the email wrapping under the links. Task 7.
2. **Cloudflare zone setting** — Email Address Obfuscation off for archaic.ie: dashboard toggle, or a token with Zone Settings:Edit for the API call. Task 10.
3. **Readout digits** — words + bar (recommended, honours the spin spec's "no numbers on the page") vs showing `T / T_c`. Task 12.
4. **Nav order** — "Forge" after "Deeper" (as planned) or last. Task 13.
5. **Footer wording** — "Made by Connor Faulkner" vs "connorfaulkner.com". Task 14.
