import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, globSync } from 'node:fs';

const files = [...globSync('src/pages/**/*.astro'), ...globSync('src/components/*.astro'), ...globSync('src/layouts/*.astro')];

// /forge/spin is still the old self-contained page; Task 12 rewrites it onto
// Base and against the colour tokens. Until then its hex literals are known and
// listed in the tokens.css header, not an unnoticed regression. Delete this
// exclusion, and the todo below it, when that task lands.
//
// Only the colours are excused. Task 8 already moved the page off Google Fonts
// and onto the shared Astro Fonts variables, so the font-stack rule applies to
// every file with no exception.
const HEX_NOT_YET_MIGRATED = new Set(['src/pages/forge/spin.astro']);

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  test(`${file}: no literal font stacks`, () => {
    assert.doesNotMatch(src, /font-family:\s*'(Cinzel|Space Grotesk|Uncial Antiqua)'/);
  });
  if (HEX_NOT_YET_MIGRATED.has(file)) {
    test.todo(`${file}: no hex colour literals — enabled in Task 12`);
    continue;
  }
  test(`${file}: no hex colour literals`, () => {
    const hits = src.match(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/g) || [];
    assert.deepEqual(hits, [], `hex literals in ${file}: ${hits.join(' ')}`);
  });
}

// The exclusion above must never quietly outlive the page it covers. Existing is
// not enough: the file has to still carry the literals the exclusion exists for,
// otherwise the todo above is excusing a page that is already clean.
test('the hex exclusion still covers a file that still has hex literals', () => {
  for (const f of HEX_NOT_YET_MIGRATED) {
    assert.ok(files.includes(f), `${f} no longer exists — drop it from HEX_NOT_YET_MIGRATED`);
    const hits = readFileSync(f, 'utf8').match(/#[0-9a-fA-F]{3}\b|#[0-9a-fA-F]{6}\b/g) || [];
    assert.ok(
      hits.length > 0,
      `${f} has no hex colour literals left — it is already migrated, so drop it from HEX_NOT_YET_MIGRATED and enable the real assertion`,
    );
  }
});
