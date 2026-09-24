// The pure part of /forge/critical: the exact solution, the slider snap, the
// running mean and the axis mapping. No DOM, so tests/critical.test.mjs can
// import it under Node. Temperatures are in units of J/k_B.
export const T_MIN = 1.0;
export const T_MAX = 4.0;
// Onsager (1944): the square lattice orders below 2 / ln(1 + √2) = 2.26918…
export const T_C = 2 / Math.log(1 + Math.SQRT2);
export const T_C_LABEL = '2.269';
// How close the slider has to land to be caught by the critical point.
export const SNAP_ZONE = 0.03;
// The phase words either side of the critical point, far enough out that the
// word settles while the lattice is visibly doing one thing.
export const T_ORDERED = 2.2;
export const T_DISORDERED = 2.35;

// Spontaneous magnetisation of the infinite square lattice (Yang 1952):
// m = (1 − sinh(2/T)^−4)^(1/8) below T_c, zero at and above it.
export function onsager(T) {
  if (!(T > 0) || T >= T_C) return 0;
  const s = Math.sinh(2 / T);
  const inner = 1 - 1 / (s * s * s * s);
  return inner > 0 ? Math.pow(inner, 1 / 8) : 0;
}

export function clampTemperature(T) {
  if (!Number.isFinite(T)) return T_C;
  return Math.min(T_MAX, Math.max(T_MIN, T));
}

// Catch the critical point when the slider lands near it. From T_c itself a
// step in either direction leaves, so a keyboard user stepping 0.01 at a time
// is never stuck: the zone only catches on the way in.
export function snapTemperature(raw, prev, zone = SNAP_ZONE) {
  const T = clampTemperature(raw);
  if (prev === T_C) return T;
  return Math.abs(T - T_C) <= zone ? T_C : T;
}

// The value the native range input holds for a temperature: its step is 0.01,
// so T_c is shown at the nearest hundredth while the model runs at T_c exactly.
export function sliderValueFor(T) {
  return (Math.round(T * 100) / 100).toFixed(2);
}

export function phaseWordFor(T) {
  if (T <= T_ORDERED) return 'ORDERED';
  if (T >= T_DISORDERED) return 'DISORDERED';
  return 'CRITICAL';
}

// What a screen reader hears for the slider. Numbers are allowed on the
// instrument: this is the temperature itself.
export function valueTextFor(T) {
  return T === T_C ? `${T_C_LABEL}, the critical temperature` : T.toFixed(2);
}

// Points on the phase diagram are keyed by temperature to two places, so a
// return to a temperature resumes its mean rather than starting a second point.
export function keyFor(T) {
  return T === T_C ? T_C_LABEL : T.toFixed(2);
}

// Running mean: {T, n, sum}. Pure; returns a new object.
export function addSample(point, m) {
  return { T: point.T, n: point.n + 1, sum: point.sum + m };
}
export function meanOf(point) {
  return point.n > 0 ? point.sum / point.n : 0;
}

// Axis mapping for the phase diagram, as fractions of the plot box.
export function xFor(T) {
  return (clampTemperature(T) - T_MIN) / (T_MAX - T_MIN);
}
export function yFor(m) {
  return 1 - Math.min(1, Math.max(0, m));
}
