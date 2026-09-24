// Scroll fraction (0 = top, 1 = bottom) → Ising temperature (J/k_B units).
// Piecewise-linear through control points chosen so the middle of the
// scroll range straddles the 2D square-lattice critical point (2.269).
export const CONTROL_POINTS = [
  [0.0, 5.0],
  [0.25, 3.0],
  [0.45, 2.45],
  [0.55, 2.10],
  [0.75, 1.5],
  [1.0, 0.6],
];

export function temperatureFor(s) {
  if (!(s > 0)) return CONTROL_POINTS[0][1];            // NaN or <= 0
  if (s >= 1) return CONTROL_POINTS[CONTROL_POINTS.length - 1][1];
  for (let i = 1; i < CONTROL_POINTS.length; i++) {
    const [s0, t0] = CONTROL_POINTS[i - 1];
    const [s1, t1] = CONTROL_POINTS[i];
    if (s <= s1) return t0 + ((s - s0) / (s1 - s0)) * (t1 - t0);
  }
  return CONTROL_POINTS[CONTROL_POINTS.length - 1][1];
}

// The ends of the scroll, and the word for a temperature. The page shows a word
// and a bar, never a number: a reading of "2.269" means nothing to anyone who
// has not met this model, and the spin page has no numbers on it anywhere.
// The thresholds sit either side of the critical point (2.269), far enough out
// that the word settles while the lattice is visibly doing one thing.
export const T_HOT = CONTROL_POINTS[0][1];                          // 5.0
export const T_COLD = CONTROL_POINTS[CONTROL_POINTS.length - 1][1]; // 0.6

export function readoutFor(T) {
  if (T > 2.6) return 'HOT';
  if (T < 2.0) return 'COLD';
  return 'NEAR CRITICAL';
}
