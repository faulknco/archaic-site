import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

// RFC 9116. Astro copies public/ into dist/ verbatim, dot-directories
// included, so the source file is the one guarded here; the built copy is
// checked below only when dist/ exists, so `npm test` still runs unbuilt.
const file = 'public/.well-known/security.txt';

test('security.txt exists in public/', () => {
  assert.ok(existsSync(file), `${file} is missing`);
});

test('security.txt names a contact', () => {
  assert.match(readFileSync(file, 'utf8'), /^Contact: mailto:hello@archaic\.ie$/m);
});

test('security.txt has a future Expires', () => {
  const m = readFileSync(file, 'utf8').match(/^Expires: (.+)$/m);
  assert.ok(m, 'no Expires field');
  const expires = new Date(m[1]);
  assert.ok(!Number.isNaN(expires.getTime()), `Expires is not a date: ${m[1]}`);
  assert.ok(expires.getTime() > Date.now(), `security.txt expired on ${m[1]} — renew it`);
});

test('security.txt is canonical at archaic.ie', () => {
  assert.match(readFileSync(file, 'utf8'), /^Canonical: https:\/\/archaic\.ie\/\.well-known\/security\.txt$/m);
});

test('security.txt is copied into the build', { skip: !existsSync('dist') && 'run `npm run build` first' }, () => {
  assert.equal(readFileSync('dist/.well-known/security.txt', 'utf8'), readFileSync(file, 'utf8'));
});
