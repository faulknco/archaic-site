import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULE, TABLE, NEIGHBOURHOODS, step, run, singleSeed, randomSeed, mulberry32 } from '../public/forge/rule110/rule110.js';

const bits = (row) => Array.from(row).join('');
const fromBits = (s) => Uint8Array.from(s, (ch) => (ch === '1' ? 1 : 0));

test('the table is 110: outputs 01101110 over neighbourhoods 111 down to 000', () => {
  assert.equal(RULE, 110);
  assert.equal(NEIGHBOURHOODS.map(([, , , o]) => o).join(''), '01101110');
  assert.equal(NEIGHBOURHOODS.map(([l, c, r]) => `${l}${c}${r}`).join(' '), '111 110 101 100 011 010 001 000');
  // The binary string above, read as a number, is the rule's name.
  assert.equal(parseInt(NEIGHBOURHOODS.map(([, , , o]) => o).join(''), 2), 110);
  assert.equal(TABLE.length, 8);
});

test('from a single cell the first eight generations match the canonical pattern', () => {
  // Wolfram's space-time diagram for Rule 110 from one cell, right-aligned.
  const canonical = [
    '00000001',
    '00000011',
    '00000111',
    '00001101',
    '00011111',
    '00110001',
    '01110011',
    '11010111',
  ];
  const rows = run(singleSeed(16), 8);
  for (let g = 0; g < 8; g++) assert.equal(bits(rows[g]).slice(-8), canonical[g], `generation ${g}`);
});

test('the boundary is periodic at both edges', () => {
  // A cell at the left edge: the right edge sees it as its right neighbour
  // (001 -> 1), so the growth wraps onto the far end of the row.
  const left = new Uint8Array(8); left[0] = 1;
  assert.equal(bits(step(left, new Uint8Array(8))), '10000001');
  // The classic seed at the right edge: cell 0 sees it on its left (100 -> 0)
  // and stays off, exactly as it would in an unbounded row.
  assert.equal(bits(step(singleSeed(8), new Uint8Array(8))), '00000011');
  // The wrapped and unwrapped rows agree everywhere the pattern has not yet
  // reached the edge: 16 cells for 8 generations against a 64-cell row.
  const narrow = run(singleSeed(16), 8), wide = run(singleSeed(64), 8);
  for (let g = 0; g < 8; g++) assert.equal(bits(narrow[g]).slice(-8), bits(wide[g]).slice(-8));
});

test('a full row of ones dies and an empty row stays empty', () => {
  assert.equal(bits(step(fromBits('1111'), new Uint8Array(4))), '0000');
  assert.equal(bits(step(new Uint8Array(4), new Uint8Array(4))), '0000');
});

test('step writes only inside the row and refuses to alias', () => {
  const row = singleSeed(5);
  const out = new Uint8Array(7); out[5] = 9; out[6] = 9;
  step(row, out);
  assert.deepEqual(Array.from(out.slice(5)), [9, 9]);
  assert.throws(() => step(row, row), /alias/);
  assert.equal(step(new Uint8Array(0), new Uint8Array(0)).length, 0);
});

test('run returns the requested number of rows, seed first, none shared', () => {
  const seed = singleSeed(6);
  const rows = run(seed, 4);
  assert.equal(rows.length, 4);
  assert.equal(bits(rows[0]), bits(seed));
  assert.notEqual(rows[0], seed);
  rows[0][0] = 1;
  assert.equal(seed[0], 0);
});

test('a density seed is deterministic for a fixed generator seed', () => {
  const a = randomSeed(300, 0.5, mulberry32(42));
  const b = randomSeed(300, 0.5, mulberry32(42));
  const c = randomSeed(300, 0.5, mulberry32(43));
  assert.equal(bits(a), bits(b));
  assert.notEqual(bits(a), bits(c));
  // And the same seed keeps producing the same tape.
  assert.equal(bits(run(a, 50)[49]), bits(run(b, 50)[49]));
});

test('a density seed lands near its density', () => {
  for (const d of [0.1, 0.5, 0.9]) {
    const row = randomSeed(4000, d, mulberry32(7));
    const on = row.reduce((s, v) => s + v, 0) / row.length;
    assert.ok(Math.abs(on - d) < 0.03, `density ${d} gave ${on}`);
  }
  assert.equal(bits(randomSeed(8, 0, mulberry32(1))), '00000000');
  assert.equal(bits(randomSeed(8, 1, mulberry32(1))), '11111111');
});

test('mulberry32 stays in [0, 1) and does not repeat quickly', () => {
  const rng = mulberry32(2026);
  const seen = new Set();
  for (let i = 0; i < 10000; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1);
    seen.add(v);
  }
  assert.ok(seen.size > 9990);
});
