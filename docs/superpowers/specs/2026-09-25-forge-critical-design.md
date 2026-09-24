# Critical — design

Date: 2026-09-25. Status: built overnight on Connor's brief; second piece under `/forge`.

## What it is

An instrument at `archaic.ie/forge/critical/`. The same two-dimensional Ising model as Spin, on the same vendored `ising-rs` WebAssembly, held at one temperature chosen on a slider instead of by scroll. Beside the lattice, three readings: the temperature, a live trace of the magnetisation, and a phase diagram on which the exact Onsager curve is drawn faintly and the visitor's own measurements accumulate as they hold each temperature. Two short paragraphs beneath say what a phase transition is and why the critical point looks the way it does.

Spin is the art piece; Critical is the bench. It exists so the site can show a measurement being made, not only a picture being drawn. The external field is zero throughout: this is the pure model.

Out of scope: any change to `ising-rs` (the vendored build already exposes `magnetisation()`, `step_wolff()` and `set_params()`), any change to Spin's visuals, a third piece, susceptibility or heat-capacity readings, exporting the points.

## Files

- `src/pages/forge/critical.astro` — the page, on `Base` with `layout="scroll"` (nav, stone ground, footer) and `current="forge"`. Inline style; one `<script is:inline type="module">` because it imports runtime paths out of `public/`.
- `public/forge/critical/instrument.js` — the pure module: Onsager's curve, the slider snap, the running mean, axis mapping. The only unit-tested code.
- `public/forge/critical/poster.webp`, `public/forge/critical/og.png` — a still of the lattice at the critical temperature, written by `scripts/poster-critical.mjs`.
- `public/forge/shared/gate.js` — the photosensitivity gate, lifted out of Spin unchanged in behaviour: same `sessionStorage` key (`spin-gate`), same Tab wrap. Spin imports it too; accepting either page covers both for the browser session.
- `public/forge/shared/inkwash.js` — the ink-wash renderer (WebGL2 shader with the Canvas 2D fallback) as a factory, so the two pieces can share the shader without Spin having to change. Spin keeps its own inline copy for now; its visuals are not touched.
- `public/forge/spin/worker.js` — the one simulation worker, extended additively: every frame now carries `m`, and two new messages (`settle`, `sample`) exist for this page. Spin ignores both.
- `scripts/qa-critical.mjs`, `scripts/poster-critical.mjs`, `tests/critical.test.mjs`; `npm run qa:critical` in CI beside `qa:spin`; `/forge/critical/` added to the parity and console page list; a second entry on `/forge/`.

## Layout

Desktop (from 900px): a two-column grid under the page header. Left, the lattice: a square, `aspect-ratio: 1`, the poster underneath it until the first frame. Right, the instrument panel: the slider, the readout, the trace, the phase diagram, the controls. Beneath both columns, the two paragraphs at the site's reading measure. Mobile (390px): one column, lattice above panel, both at full width inside the mobile gutter.

The palette is the site's: ground, bone, copper from the tokens. Calmer than Spin: the copper on the domain walls is weighted lower and the film grain halved. Nothing is coupled to scroll. The stone ground and footer of the ordinary pages stay, so the piece reads as a page in the site rather than a screen of its own.

## Instrument definitions

**Temperature.** `T` in `[1.0, 4.0]`, in units of `J/k_B`, from `<input type="range" step="0.01">`. The critical temperature of the square lattice, `T_c = 2 / ln(1 + √2) ≈ 2.269`, is marked on the track with its value. `snapTemperature(raw, prev)` returns `T_c` when the raw value lands within `±0.03` of it and the previous value was not already `T_c`; from `T_c` a step in either direction leaves, so a keyboard user is never stuck. `aria-valuetext` reads the temperature and adds "the critical temperature" when snapped.

**Lattice.** `256 × 256`, square, `J = 1`, `h = 0`, Metropolis sweeps for everything the visitor watches, up to four per tick within a twelve-millisecond budget, pulled at animation-frame rate. Stops when the tab is hidden.

**Equilibration.** The visitor's drag is live: every tick carries the current `T` and the lattice responds under Metropolis as it is dragged. Once the slider has been still for 350 ms the page sends `settle`. The worker then runs a Wolff cluster burst, valid because `h = 0`: flips until either `48 · N²` spins have been flipped or 6000 clusters, spread over ticks under the same time budget and with one Metropolis sweep per tick so the lattice keeps moving. Measured in Node on the vendored build: from a random start the burst orders the lattice at `T = 1.5` in about 25 ms and reaches the finite-size critical state at `T_c` in about 150 ms; above `T ≈ 2.4` the clusters are small, the flip cap ends the burst early, and Metropolis, which is fast there, finishes the job. Frames report `settling` until the burst is spent.

**Sampling.** After the burst, a hold of 1.5 s of Metropolis. Then every frame's `|m|` (the wasm's `magnetisation()`, the absolute mean spin) goes into the running mean for the current temperature. The point on the phase diagram is that mean, updated live; its key is `T` rounded to two decimals, so returning to a temperature resumes its mean rather than starting a second point. Points are kept for the browser session (`sessionStorage`, in a try/catch). Reset randomises the lattice and settles again; Clear forgets the points.

**Trace.** A Canvas 2D line of the last 240 frames of `|m|`, about eight seconds, `y` from zero to one. Every frame, settling included: the trace is what the lattice is doing, the diagram is what it has measured.

**Phase diagram.** Canvas 2D. `x` is `T` over `[1, 4]`, `y` is `|m|` over `[0, 1]`. Onsager's exact result for the infinite lattice, `m = (1 − sinh(2/T)^−4)^{1/8}` below `T_c` and zero above, drawn faintly in the label rule colour; a faint vertical at `T_c`; the visitor's points as small bone squares, the one being measured in copper. Numbers on this instrument are temperatures only: `1`, `2.269`, `4` on the temperature axis. The magnetisation axis has ticks and the label `|m|`, no figures.

**Readout.** `T`, `|m|` to two places, a phase word (`ORDERED` / `CRITICAL` / `DISORDERED`, thresholds at 2.2 and 2.35) and a state word (`SETTLING` / `HOLDING`). The visible readout updates every frame and is `aria-hidden`; a visually hidden `role="status" aria-live="polite"` region beside it is written on each settled temperature, when the hold begins, and then at most every three seconds with the running mean, so a screen reader hears a sentence, not a stream.

**Reduced motion.** With `prefers-reduced-motion: reduce` nothing animates. The worker is still started after the gate, and each settled temperature sends `sample` instead of ticks: the worker runs the whole burst, then twenty Metropolis sweeps, and posts one frame with the mean `|m|` over those sweeps. The page paints that one still, adds one point, and waits for the next slider change. The trace holds one value per sample.

**Finite size, stated plainly.** For a 256² lattice the mean `|m|` at `T_c` is about 0.5, not zero; the exact curve is for an infinite lattice. Metropolis decorrelates slowly near `T_c`, so the point there depends on where the burst left the lattice and may sit anywhere from about 0.3 to 0.65. The diagram shows this honestly; the prose does not put a number on it.

## Physics text

Two paragraphs, site voice: short, declarative, no bullets, no exclamation, no numbers. The first says what a phase transition is: the same rule, one dial, and a temperature at which the collective answer changes from ordered to disordered. The second says why the critical point looks the way it does: correlation length diverging, fluctuations at every scale at once, no characteristic size, the reason the picture looks the same when magnified. Final wording is in the page and reproduced in the ship report.

## Accessibility

- Gate first, as on Spin: opaque overlay, Continue and Back, Tab wrapped inside it, everything else `inert` (the instrument from the server, the nav by an inline script at parse time, the footer by the module) until Continue; all lifted together in `start()`. Remembered for the session under Spin's key.
- The slider is a native range: arrows step by 0.01, Home/End reach the ends, `<label>` bound, `aria-valuetext` as above.
- Readout as above. Canvases are `aria-hidden`; the trace and the diagram carry `<figcaption>`s that say what they show.
- Focus rings are the site's. Nothing depends on hover.
- Mobile 390: no horizontal scroll, the nav check in `parity.mjs` covers the page.

## QA

- `tests/critical.test.mjs`: Onsager is zero at and above `T_c`, tends to one as `T → 0`, is monotone below `T_c`, and gives `m(2) ≈ 0.911`; the snap catches within the zone, releases from `T_c`, and never lands outside `[1, 4]`; the running mean and the axis mapping.
- `scripts/qa-critical.mjs` (Playwright, `[baseUrl]` like `qa-spin`): no frames before the gate; first Tab lands in the gate and the nav refuses focus; Continue lifts `inert`; wasm 200; frames flow; the slider moves `T`; set to `1.5`, `|m| > 0.9` within a bounded wait, with a point on the diagram whose mean is above 0.9; set to `3.5`, `|m| < 0.15` within a bounded wait; `2.25` snaps to `T_c`; the live region is polite; the prose has no digits; `h1` is `CRITICAL`; the renderer is `webgl` or `canvas`; no console errors. A second context with reduced motion: one frame after the gate, none after a second, one more with a new point after a slider change.
- `npm test`, `npm run build`, `qa:console`, `qa:spin` (unchanged behaviour after the gate extraction), `qa:parity -- nav-check`, parity baseline captured on this machine, screenshots at 1280 and 390 reviewed.

## Delivery

Branch `forge/critical`, one PR into `main`, spec committed first. Poster and OG images generated from the local preview before the PR. Merge deploys; live check with `npm run qa:critical -- https://archaic.ie`.
