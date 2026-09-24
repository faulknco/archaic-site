// Simulation worker for the Forge pieces (/forge/spin and /forge/critical).
// Pull model: the page sends one 'tick' per animation frame with the current
// temperature; we run as many Metropolis sweeps as fit in the budget and post
// the spin buffer back, with the magnetisation of that frame.
import init, { IsingWasm } from './ising.js';

const BUDGET_MS = 12;
let sim = null;
let n = 0;
let memory = null;
let maxSweeps = 4;
let h = 0;

// Equilibration burst for /forge/critical: Wolff cluster flips, valid only at
// h = 0 (the engine falls back to Metropolis otherwise). Budgeted in flipped
// spins, with a cap on cluster count because above T ≈ 2.4 the clusters are a
// few spins each and Metropolis equilibrates faster there anyway. Measured on
// the vendored build (256², from random): ordered at T = 1.5 in ~25 ms; the
// finite-size critical state at T_c in ~150 ms.
const SETTLE_SPINS_PER_SITE = 48;
const SETTLE_FLIP_CAP = 6000;
let settleSpins = 0;   // spins still to flip in the current burst
let settleFlips = 0;   // clusters flipped so far in it
let settleT = 0;
// Echoed on every frame so the page can tell which settle request a frame
// answers: a tick posted before a 'settle' message is processed before it, and
// its frame must not be mistaken for the end of the new burst.
let settleSeq = 0;

function spinsView() {
  // Zero-copy view into WASM memory; must be re-created if memory grows.
  return new Int8Array(memory.buffer, sim.spins_ptr(), n * n);
}
function postFrame(extra) {
  const copy = new Int8Array(spinsView()); // copy out of WASM memory
  self.postMessage({ type: 'frame', spins: copy.buffer, m: sim.magnetisation(), ...extra }, [copy.buffer]);
}
// Run the burst until it is spent or the time is up. Returns true while there
// is burst left.
function settleFor(T, deadline) {
  while (settleSpins > 0 && settleFlips < SETTLE_FLIP_CAP) {
    settleSpins -= sim.step_wolff(T);
    settleFlips++;
    if (performance.now() >= deadline) break;
  }
  return settleSpins > 0 && settleFlips < SETTLE_FLIP_CAP;
}

self.onmessage = async (e) => {
  const msg = e.data;
  try {
    if (msg.type === 'init') {
      const out = await init();
      memory = out.memory;
      n = msg.n;
      maxSweeps = msg.maxSweeps ?? 4;
      // msg.h: a whisper of external field so the cold phase is reproducible (negative favours -1).
      h = msg.h ?? 0.0;
      sim = new IsingWasm(n, 0, 1.0, h, BigInt(msg.seed >>> 0));
      sim.randomise();
      self.postMessage({ type: 'ready', n });
      return;
    }
    if (msg.type === 'tick') {
      if (!sim) return;
      // The page ramps the external field with temperature; only touch the
      // engine when it actually changes.
      if (typeof msg.h === 'number' && msg.h !== h) { h = msg.h; sim.set_params(1.0, h); }
      const start = performance.now();
      let settling = false;
      if (settleSpins > 0 && settleFlips < SETTLE_FLIP_CAP) {
        // Mid-burst: spend half the budget on clusters, then one Metropolis
        // sweep so the lattice keeps moving on screen.
        settling = settleFor(settleT, start + BUDGET_MS / 2);
        sim.step(msg.T);
      } else {
        let sweeps = 0;
        do {
          sim.step(msg.T);
          sweeps++;
        } while (sweeps < maxSweeps && performance.now() - start < BUDGET_MS);
      }
      postFrame({ settling, seq: settleSeq, T: msg.T });
    }
    if (msg.type === 'settle') {
      // /forge/critical: the slider has come to rest at msg.T. Start (or
      // restart) the burst; the following ticks spend it.
      if (!sim) return;
      settleT = msg.T;
      settleSeq = msg.seq ?? 0;
      settleSpins = SETTLE_SPINS_PER_SITE * n * n;
      settleFlips = 0;
    }
    if (msg.type === 'sample') {
      // /forge/critical under reduced motion: no ticks flow. Run the whole
      // burst now, then a short Metropolis run, and answer with one frame whose
      // m is the mean over that run.
      if (!sim) return;
      settleT = msg.T;
      settleSeq = msg.seq ?? 0;
      settleSpins = SETTLE_SPINS_PER_SITE * n * n;
      settleFlips = 0;
      settleFor(msg.T, Infinity);
      const runs = msg.sweeps ?? 20;
      let sum = 0;
      for (let i = 0; i < runs; i++) { sim.step(msg.T); sum += sim.magnetisation(); }
      const copy = new Int8Array(spinsView());
      self.postMessage({ type: 'frame', spins: copy.buffer, m: sum / runs, settling: false, single: true, seq: settleSeq, T: msg.T }, [copy.buffer]);
    }
    if (msg.type === 'reset') {
      if (!sim) return;
      // Re-draw every spin from the instance's own RNG. No re-init() and no
      // second IsingWasm, so the WASM memory (and spinsView) stays valid and
      // nothing leaks. The frame is flagged so the page can count resets even
      // while it is paused and asking for no ticks.
      settleSpins = 0;
      sim.randomise();
      postFrame({ reset: true });
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err && err.message || err) });
  }
};
