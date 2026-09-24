import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  T_MIN, T_MAX, T_C, T_C_LABEL, SNAP_ZONE, onsager, clampTemperature, snapTemperature,
  sliderValueFor, phaseWordFor, valueTextFor, keyFor, addSample, meanOf, xFor, yFor,
} from '../public/forge/critical/instrument.js';

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ── Onsager ──────────────────────────────────────────────────────────────────
test('T_c is 2 / ln(1 + √2) and labels as 2.269', () => {
  assert.ok(close(T_C, 2.269185314213022, 1e-12));
  assert.equal(T_C.toFixed(3), T_C_LABEL);
});

test('onsager is zero at and above T_c', () => {
  assert.equal(onsager(T_C), 0);
  assert.equal(onsager(T_C + 1e-9), 0);
  assert.equal(onsager(3), 0);
  assert.equal(onsager(T_MAX), 0);
});

test('onsager tends to one as T tends to zero', () => {
  assert.ok(onsager(0.5) > 0.9999);
  assert.ok(onsager(T_MIN) > 0.999 && onsager(T_MIN) < 1);
});

test('onsager gives the textbook value at T = 2', () => {
  // (1 − sinh(1)^−4)^(1/8) = 0.9113…
  assert.ok(close(onsager(2), 0.9113, 5e-4));
});

test('onsager is strictly decreasing below T_c and continuous into zero', () => {
  let prev = 2;
  for (let i = 0; i <= 1000; i++) {
    const T = T_MIN + (T_C - T_MIN) * (i / 1000);
    const m = onsager(T);
    assert.ok(m <= prev, `not decreasing at ${T}`);
    assert.ok(m >= 0 && m <= 1, `out of range at ${T}: ${m}`);
    prev = m;
  }
  // The curve falls to zero at the transition rather than jumping. β = 1/8 makes
  // it steep, m ~ (T_c − T)^(1/8), so it has to be very close to T_c to be small.
  assert.ok(onsager(T_C - 1e-9) < 0.2);
  assert.ok(onsager(T_C - 1e-3) > onsager(T_C - 1e-9));
});

test('onsager is safe on garbage', () => {
  assert.equal(onsager(NaN), 0);
  assert.equal(onsager(-1), 0);
  assert.equal(onsager(0), 0);
});

// ── Slider ───────────────────────────────────────────────────────────────────
test('clampTemperature holds the slider range and recovers from NaN', () => {
  assert.equal(clampTemperature(0), T_MIN);
  assert.equal(clampTemperature(9), T_MAX);
  assert.equal(clampTemperature(2.5), 2.5);
  assert.equal(clampTemperature(NaN), T_C);
});

test('snap catches the critical point on the way in', () => {
  assert.equal(snapTemperature(2.25, 2.0), T_C);
  assert.equal(snapTemperature(2.29, 2.5), T_C);
  assert.equal(snapTemperature(T_C - SNAP_ZONE, 2.0), T_C);
  assert.equal(snapTemperature(2.269, 2.0), T_C);
});

test('snap leaves temperatures outside the zone alone', () => {
  assert.equal(snapTemperature(2.2, 2.0), 2.2);
  assert.equal(snapTemperature(2.35, 2.0), 2.35);
  assert.equal(snapTemperature(1.5, T_C), 1.5);
});

test('snap releases from T_c so a keyboard step is never stuck', () => {
  // From T_c, a one-hundredth step either way is inside the zone but must leave.
  assert.equal(snapTemperature(2.28, T_C), 2.28);
  assert.equal(snapTemperature(2.26, T_C), 2.26);
  // And the next step back in is caught again.
  assert.equal(snapTemperature(2.27, 2.28), T_C);
});

test('snap never lands outside the range', () => {
  for (let i = -50; i <= 550; i++) {
    const T = snapTemperature(i / 100, 2.0);
    assert.ok(T >= T_MIN && T <= T_MAX, `snap left the range at ${i / 100}: ${T}`);
  }
});

test('the slider shows T_c at the nearest hundredth', () => {
  assert.equal(sliderValueFor(T_C), '2.27');
  assert.equal(sliderValueFor(1.5), '1.50');
  assert.equal(sliderValueFor(3.999), '4.00');
});

test('phase words straddle the critical point', () => {
  assert.equal(phaseWordFor(1.0), 'ORDERED');
  assert.equal(phaseWordFor(T_C), 'CRITICAL');
  assert.equal(phaseWordFor(4.0), 'DISORDERED');
});

test('the slider names the critical temperature for a screen reader', () => {
  assert.match(valueTextFor(T_C), /2\.269, the critical temperature/);
  assert.equal(valueTextFor(1.5), '1.50');
});

// ── Points ───────────────────────────────────────────────────────────────────
test('points are keyed to two places and T_c keeps its own key', () => {
  assert.equal(keyFor(1.5), '1.50');
  assert.equal(keyFor(1.504), '1.50');
  assert.equal(keyFor(T_C), '2.269');
  assert.notEqual(keyFor(2.27), keyFor(T_C));
});

test('the running mean is a mean', () => {
  let p = { T: 1.5, n: 0, sum: 0 };
  assert.equal(meanOf(p), 0);
  for (const m of [0.9, 1.0, 0.8]) p = addSample(p, m);
  assert.equal(p.n, 3);
  assert.ok(close(meanOf(p), 0.9));
});

// ── Axes ─────────────────────────────────────────────────────────────────────
test('the temperature axis spans the slider and the magnetisation axis is inverted for the canvas', () => {
  assert.equal(xFor(T_MIN), 0);
  assert.equal(xFor(T_MAX), 1);
  assert.ok(close(xFor(T_C), (T_C - 1) / 3));
  assert.equal(yFor(0), 1);
  assert.equal(yFor(1), 0);
  assert.equal(yFor(1.7), 0);
  assert.equal(yFor(-0.2), 1);
});
