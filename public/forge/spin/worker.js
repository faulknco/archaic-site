// Simulation worker for /lab/spin. Pull model: the page sends one 'tick'
// per animation frame with the current temperature; we run as many
// Metropolis sweeps as fit in the budget and post the spin buffer back.
import init, { IsingWasm } from './ising.js';

const BUDGET_MS = 12;
let sim = null;
let n = 0;
let memory = null;
let maxSweeps = 4;
let h = 0;

function spinsView() {
  // Zero-copy view into WASM memory; must be re-created if memory grows.
  return new Int8Array(memory.buffer, sim.spins_ptr(), n * n);
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
      let sweeps = 0;
      do {
        sim.step(msg.T);
        sweeps++;
      } while (sweeps < maxSweeps && performance.now() - start < BUDGET_MS);
      const copy = new Int8Array(spinsView()); // copy out of WASM memory
      self.postMessage({ type: 'frame', spins: copy.buffer }, [copy.buffer]);
    }
    if (msg.type === 'reset') {
      if (!sim) return;
      // Re-draw every spin from the instance's own RNG. No re-init() and no
      // second IsingWasm, so the WASM memory (and spinsView) stays valid and
      // nothing leaks. The frame is flagged so the page can count resets even
      // while it is paused and asking for no ticks.
      sim.randomise();
      const copy = new Int8Array(spinsView());
      self.postMessage({ type: 'frame', spins: copy.buffer, reset: true }, [copy.buffer]);
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: String(err && err.message || err) });
  }
};
