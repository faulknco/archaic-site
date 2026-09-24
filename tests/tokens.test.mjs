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
