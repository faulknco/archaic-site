// Rule 110: the pure part. A row of cells, each 0 or 1, and one step of the
// elementary cellular automaton numbered 110, with periodic boundaries.
//
// The rule number is its own lookup table. Write 110 in binary, 01101110, and
// read the bits from the top: bit 7 is the output for neighbourhood 111, bit 0
// for 000. So the output for the neighbourhood (l, c, r) is bit (l·4 + c·2 + r)
// of 110. That is the whole rule, and it is Turing complete (Matthew Cook, 2004).
//
// Imported at runtime by src/pages/forge/rule110.astro (as a public/ path, so
// with `<script is:inline type="module">`) and by tests/rule110.test.mjs.
export const RULE = 110;

// TABLE[i] is the next state of a cell whose neighbourhood, read left to right,
// is the three bits of i.
export const TABLE = Uint8Array.from({ length: 8 }, (_, i) => (RULE >> i) & 1);

// The eight neighbourhoods in the order the rule's binary string lists them:
// 111 first, 000 last. Each entry is [left, centre, right, output].
export const NEIGHBOURHOODS = [7, 6, 5, 4, 3, 2, 1, 0].map((i) => [(i >> 2) & 1, (i >> 1) & 1, i & 1, TABLE[i]]);

// One generation. `row` is a Uint8Array of 0/1; `out` is a Uint8Array of the
// same length that receives the next row (it may not alias `row`). The ends
// wrap: cell 0 reads cell n−1 as its left neighbour and cell n−1 reads cell 0
// as its right. Returns `out`.
export function step(row, out) {
  const n = row.length;
  if (n === 0) return out;
  if (out === row) throw new Error('rule110.step: out must not alias row');
  let l = row[n - 1], c = row[0];
  for (let i = 0; i < n; i++) {
    const r = row[i + 1 < n ? i + 1 : 0];
    out[i] = TABLE[(l << 2) | (c << 1) | r];
    l = c; c = r;
  }
  return out;
}

// `rows` generations from `seed`, the seed itself first. Returns an array of
// Uint8Array rows, none of them shared.
export function run(seed, rows) {
  const out = [Uint8Array.from(seed)];
  for (let g = 1; g < rows; g++) out.push(step(out[g - 1], new Uint8Array(seed.length)));
  return out;
}

// The classic seed: a single on cell at the right edge. Rule 110 grows to the
// left, so from here the structure has the whole row to grow into.
export function singleSeed(n) {
  const row = new Uint8Array(n);
  if (n > 0) row[n - 1] = 1;
  return row;
}

// A small seeded generator (Tommy Ettinger's mulberry32), so a random seed row
// can be reproduced from a number: the poster script and the QA depend on that.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A row in which each cell is on with probability `density`, drawn from `rng`
// (a function returning a float in [0, 1)).
export function randomSeed(n, density, rng) {
  const row = new Uint8Array(n);
  for (let i = 0; i < n; i++) row[i] = rng() < density ? 1 : 0;
  return row;
}
