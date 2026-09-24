import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs';

const files = [...globSync('src/pages/**/*.astro'), ...globSync('src/components/*.astro'), ...globSync('src/layouts/*.astro')];

// Every page, component and layout, with no exceptions left. /forge/spin was the
// last file carrying hex colours; Task 12 rewrote it against the tokens, down to
// the two spin states the canvas paints, which it now reads from --bone-rgb and
// --ground-rgb rather than repeating.
for (const file of files) {
  const src = readFileSync(file, 'utf8');
  test(`${file}: no literal font stacks`, () => {
    assert.doesNotMatch(src, /font-family:\s*'(Cinzel|Space Grotesk|Uncial Antiqua)'/);
  });
  test(`${file}: no hex colour literals`, () => {
    const hits = src.match(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/g) || [];
    assert.deepEqual(hits, [], `hex literals in ${file}: ${hits.join(' ')}`);
  });
}
