import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs';

const files = [...globSync('src/pages/**/*.astro'), ...globSync('src/components/*.astro'), ...globSync('src/layouts/*.astro')];

// /forge/spin is still the old self-contained page; Task 12 rewrites it onto
// Base and against the tokens. Until then its literals are known and listed in
// the tokens.css header, not an unnoticed regression. Delete this exclusion,
// and the todos below it, when that task lands.
const NOT_YET_MIGRATED = new Set(['src/pages/forge/spin.astro']);

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  if (NOT_YET_MIGRATED.has(file)) {
    test.todo(`${file}: no hex colour literals — enabled in Task 12`);
    test.todo(`${file}: no literal font stacks — enabled in Task 12`);
    continue;
  }
  test(`${file}: no hex colour literals`, () => {
    const hits = src.match(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/g) || [];
    assert.deepEqual(hits, [], `hex literals in ${file}: ${hits.join(' ')}`);
  });
  test(`${file}: no literal font stacks`, () => {
    assert.doesNotMatch(src, /font-family:\s*'(Cinzel|Space Grotesk|Uncial Antiqua)'/);
  });
}

// The exclusion above must never quietly outlive the page it covers.
test('the migration exclusion still points at a real file', () => {
  for (const f of NOT_YET_MIGRATED) assert.ok(files.includes(f), `${f} no longer exists — drop it from NOT_YET_MIGRATED`);
});
