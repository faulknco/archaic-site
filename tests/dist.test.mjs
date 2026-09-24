import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs';

const files = globSync('dist/**/*.html');
assert.ok(files.length >= 6, 'run `npm run build` first — dist/ has no HTML');

// /forge/spin is a gated, full-bleed art piece: no nav, no heading, no contact
// address by design. It is not on Base yet. Delete this exclusion when it is.
const CHROMELESS = new Set(['dist/forge/spin/index.html']);

for (const file of files) {
  const html = readFileSync(file, 'utf8');
  const chromeless = CHROMELESS.has(file);
  if (!chromeless) {
    test(`${file}: exactly one <h1>`, () => assert.equal((html.match(/<h1[\s>]/g) || []).length, 1));
    test(`${file}: exactly one <nav>`, () => assert.equal((html.match(/<nav[\s>]/g) || []).length, 1));
    test(`${file}: contact address is a plain mailto`, () => assert.match(html, /href="mailto:hello@archaic\.ie"/));
    test(`${file}: logo is sized`, () => assert.match(html, /<img[^>]*class="nav-logo"[^>]*width="\d+"[^>]*height="\d+"/));
  }
  test(`${file}: exactly one Plausible loader`, () => assert.equal((html.match(/plausible\.io\/js\//g) || []).length, 1));
  test(`${file}: one lang=en document`, () => assert.match(html, /<html lang="en"/));
  // Every page, chromeless included: the CSP has no Google Fonts origins left, so
  // a page still asking for them would silently render in fallback faces.
  test(`${file}: no Google Fonts request`, () => assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/));
  test(`${file}: display face is preloaded`, () => assert.match(html, /<link rel="preload" href="\/_astro\/fonts\/[^"]+\.woff2" as="font"/));
}
