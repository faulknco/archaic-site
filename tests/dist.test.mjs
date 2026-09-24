import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs';

const files = globSync('dist/**/*.html');
assert.ok(files.length >= 6, 'run `npm run build` first — dist/ has no HTML');

// Every page, with no exceptions left. /forge/spin was the last chromeless one
// and Task 12 put it on Base, so it carries the h1, the nav and the address like
// the rest.
for (const file of files) {
  const html = readFileSync(file, 'utf8');
  test(`${file}: exactly one <h1>`, () => assert.equal((html.match(/<h1[\s>]/g) || []).length, 1));
  test(`${file}: exactly one <nav>`, () => assert.equal((html.match(/<nav[\s>]/g) || []).length, 1));
  test(`${file}: contact address is a plain mailto`, () => assert.match(html, /href="mailto:hello@archaic\.ie"/));
  test(`${file}: logo is sized`, () => assert.match(html, /<img[^>]*class="nav-logo"[^>]*width="\d+"[^>]*height="\d+"/));
  test(`${file}: exactly one Plausible loader`, () => assert.equal((html.match(/plausible\.io\/js\//g) || []).length, 1));
  test(`${file}: one lang=en document`, () => assert.match(html, /<html lang="en"/));
  // Every page, chromeless included: the CSP has no Google Fonts origins left, so
  // a page still asking for them would silently render in fallback faces.
  test(`${file}: no Google Fonts request`, () => assert.doesNotMatch(html, /fonts\.(googleapis|gstatic)\.com/));
  test(`${file}: display face is preloaded`, () => assert.match(html, /<link rel="preload" href="\/_astro\/fonts\/[^"]+\.woff2" as="font"/));
}

// ── The Forge section ───────────────────────────────────────────────────────
// One nav key, "forge", covers the index and the piece, so the link is marked
// current on both. The gate's escape hatch lands on the section now that there
// is a section to land on; before Task 13 it went to the homepage.
const read = (p) => readFileSync(p, 'utf8');

for (const piece of ['spin', 'critical', 'rule110']) {
  test(`the ${piece} gate goes back to /forge/`, () => {
    assert.match(read(`dist/forge/${piece}/index.html`), /class="gate-back" href="\/forge\/"/);
  });
}

// The index lists every piece, each by its own route.
test('the forge index links every piece', () => {
  const html = read('dist/forge/index.html');
  assert.match(html, /class="piece-link" href="\/forge\/spin\/"/);
  assert.match(html, /class="piece-link" href="\/forge\/critical\/"/);
  assert.match(html, /class="piece-link" href="\/forge\/rule110\/"/);
});

// Numbers are allowed on the instrument (temperatures, the magnetisation) and
// nowhere in the prose: the two paragraphs under the bench carry no digits.
test('the critical prose has no digits', () => {
  const html = read('dist/forge/critical/index.html');
  const prose = html.match(/<section class="prose"[^>]*>([\s\S]*?)<\/section>/);
  assert.ok(prose, 'no prose section');
  assert.doesNotMatch(prose[1].replace(/<[^>]+>/g, ''), /\d/);
});

for (const page of ['dist/forge/index.html', 'dist/forge/spin/index.html', 'dist/forge/critical/index.html', 'dist/forge/rule110/index.html']) {
  test(`${page}: the Forge nav link is current`, () => {
    assert.match(read(page), /<a class="nav-link" href="\/forge" aria-current="page">Forge<\/a>/);
  });
}

test('the Forge nav link is not current off the section', () => {
  assert.match(read('dist/index.html'), /<a class="nav-link" href="\/forge">Forge<\/a>/);
});
