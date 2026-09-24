import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs';

// Every page, component and layout, and the two stylesheets. /forge/spin was the
// last file carrying hex colours; Task 12 rewrote it against the tokens, down to
// the two spin states the canvas paints, which it now reads from --bone-rgb and
// --ground-rgb rather than repeating.
//
// src/styles/*.css was outside this net until fix round 1, which left global.css
// — the file most likely to attract a shared colour — unguarded while the README
// claimed otherwise.
const astro = [...globSync('src/pages/**/*.astro'), ...globSync('src/components/*.astro'), ...globSync('src/layouts/*.astro')];
const css = globSync('src/styles/*.css');

// Both stylesheets carry hex in *comments* on purpose: tokens.css documents the
// old-hex -> token mapping the migration was built on (and tests/tokens.test.mjs
// asserts every one of those round-trips from its token), and global.css notes
// the value a role replaced. Those are documentation, not literals a renderer
// ever sees, so CSS is scanned with block comments stripped. That is the whole
// carve-out: no file is exempt, and a hex in any actual declaration still fails.
// .astro files are scanned whole — none of them needs a comment carve-out today.
const stripCssComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');

for (const file of [...astro, ...css]) {
  const raw = readFileSync(file, 'utf8');
  const src = file.endsWith('.css') ? stripCssComments(raw) : raw;
  test(`${file}: no literal font stacks`, () => {
    assert.doesNotMatch(src, /font-family:\s*'(Cinzel|Space Grotesk|Uncial Antiqua)'/);
  });
  test(`${file}: no hex colour literals`, () => {
    const hits = src.match(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/g) || [];
    assert.deepEqual(hits, [], `hex literals in ${file}: ${hits.join(' ')}`);
  });
}
