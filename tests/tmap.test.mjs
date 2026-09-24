import { test } from 'node:test';
import assert from 'node:assert/strict';
import { temperatureFor, CONTROL_POINTS, readoutFor, T_HOT, T_COLD } from '../public/forge/spin/tmap.js';

const close = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

test('hits every control point exactly', () => {
  for (const [s, t] of CONTROL_POINTS) assert.ok(close(temperatureFor(s), t), `s=${s}`);
});

test('is linear between control points', () => {
  // between (0.25,3.0) and (0.45,2.45): midpoint 0.35 -> 2.725
  assert.ok(close(temperatureFor(0.35), 2.725));
});

test('is monotonically non-increasing', () => {
  let prev = Infinity;
  for (let i = 0; i <= 1000; i++) {
    const t = temperatureFor(i / 1000);
    assert.ok(t <= prev + 1e-12, `not monotone at ${i / 1000}`);
    prev = t;
  }
});

test('clamps outside [0,1]', () => {
  assert.equal(temperatureFor(-3), 5.0);
  assert.equal(temperatureFor(7), 0.6);
  assert.equal(temperatureFor(NaN), 5.0);
});

test('the critical point sits inside the middle tenth of scroll', () => {
  const tc = 2.269;
  assert.ok(temperatureFor(0.45) > tc && temperatureFor(0.55) < tc);
});

test('readout words straddle the critical point', () => {
  assert.equal(readoutFor(T_HOT), 'HOT');
  assert.equal(readoutFor(2.269), 'NEAR CRITICAL');
  assert.equal(readoutFor(T_COLD), 'COLD');
});

test('the readout bar spans the full scroll and never leaves it', () => {
  // The marker is positioned as (T_HOT - T) / (T_HOT - T_COLD); temperatureFor
  // is clamped, so the bar must read 0% at the top and 100% at the bottom.
  const pos = (s) => (T_HOT - temperatureFor(s)) / (T_HOT - T_COLD);
  assert.equal(pos(0), 0);
  assert.equal(pos(1), 1);
  for (let i = 0; i <= 100; i++) {
    const p = pos(i / 100);
    assert.ok(p >= 0 && p <= 1, `marker off the bar at s=${i / 100}: ${p}`);
  }
});
