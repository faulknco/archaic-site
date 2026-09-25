# Rule 110 — design

Date: 2026-09-25. Status: built overnight on Connor's brief (third forge piece); for his review on the merged page.

## Purpose

`archaic.ie/forge/rule110/`, title RULE 110. A one-dimensional elementary cellular automaton, running live in plain JavaScript, drawn as a scrolling space-time tape in the house palette. Sits beside Spin and the second piece on `/forge`. It shows that a lookup table with eight entries is enough to compute anything (Matthew Cook, 2004), and that the studio can make a piece out of that fact without a framework, a worker or a wasm build.

Out of scope: any other rule (the piece is Rule 110, not a rule explorer), saving images, sound, analytics events, a worker (a 400-cell row steps in microseconds on the main thread).

## Files

- `src/pages/forge/rule110.astro` — the page, on `Base` with `layout="scroll"`, the shared nav and footer.
- `public/forge/rule110/rule110.js` — the pure module: `TABLE`, `step(row, out)`, `run(row, rows)`, `singleSeed(n)`, `randomSeed(n, density, rng)`, `mulberry32(seed)`, `NEIGHBOURHOODS`. Imported by the page with `<script is:inline type="module">` (a runtime path out of `public/`) and by the node tests.
- `public/forge/rule110/poster.webp`, `public/forge/rule110/og.png` — the still shown before the first frame and for crawlers, and the 1200×630 social image, both written by `scripts/poster-rule110.mjs` from a deterministic random seed.
- `tests/rule110.test.mjs` — node:test for the step function.
- `scripts/qa-rule110.mjs`, `npm run qa:rule110` — Playwright acceptance, also a CI step.

## Rendering

- The tape is a canvas the width of the viewport, opaque ground. One cell is `cellPx` CSS pixels square: 2 below 640 px, otherwise `max(3, ceil(width / 400))`, so 320 cells at 1280, 195 at 390, and never more than about 400.
- Rows: `clamp(round(0.6 · innerHeight / cellPx), 80, 200)` visible rows in the animated mode; exactly 400 rows under `prefers-reduced-motion`.
- Each row is drawn once, into an offscreen canvas at one pixel per cell, then scaled onto the visible canvas with smoothing off. New rows land at the bottom and the history rises one row per generation. Off cells are ground, on cells are bone. A cell that is on now and was off in the previous row is drawn in a faint copper mix (bone with copper at 35 %), the same tint Spin puts on its domain walls, so the leading edges of the structures carry a little warmth. Colours come from `--ground-rgb`, `--bone-rgb` and `--copper-rgb` with written fallbacks, as Spin does.
- The clock is `requestAnimationFrame` with an accumulator: slow 8 rows/s, normal 30 rows/s, fast 90 rows/s, at most eight generations per frame. Nothing flashes: no cell ever changes once drawn, and the whole picture moves by one row at a time.
- Boundary is periodic. The row wraps, so a structure leaving the left edge returns at the right.
- Tab hidden: the loop stops asking for frames and resumes on return. Resize: cell size and row count are recomputed and the tape is redrawn from history.

## Controls

Instrument panel under the tape, in the forge's control style (small uppercase Space Grotesk, no boxes).

- Play / Pause. One button whose label follows the state. Space or Enter works because it is a button.
- Seed: Single (one cell at the right edge, the classic), Random (with a density slider from a tenth to nine tenths, default a half), Drawn. Changing the seed clears the tape and restarts from generation zero. Random draws from a seeded generator so the poster script and the QA are reproducible; the page reseeds the generator on every Random reset so the reader sees a fresh row each time.
- Drawn: a seed strip above the tape, the same cell size, tall enough to hit. Click or drag paints; the first cell under the pointer decides whether the stroke turns cells on or off. Keyboard: the strip takes focus, Left/Right move a cursor, Home/End jump, Space toggles, Enter starts the run. Entering Drawn mode pauses the tape with the strip empty; every edit reseeds; Play runs it. In the other two modes the strip shows the seed and is read-only.
- Speed: Slow / Normal / Fast as a radio group. Under reduced motion the speed group is disabled.
- Rule readout: the eight neighbourhood tiles, 111 down to 000, each three cells over one output cell, in the same bone and ground. Beneath them the outputs read as the binary string 01101110 and the number 110. Fixed, not editable.
- Generation counter, `aria-live="polite"`, written at most twice a second while running and at once on any reset.

## The text

Two paragraphs under the panel, in the site voice: short declarative sentences, no bullets, no exclamation, no numerals except the rule's name and Cook's year. The first says what the rule is (a row, a clock, eight entries, no memory beyond the previous row). The second says why a table that small computes: a repeating background, gliders as signals, collisions as logic, rows as a program.

## Accessibility

- Photosensitivity gate reused from Spin: same markup, but its own `sessionStorage` key `rule110-gate`, so accepting this mild notice never clears Spin's or Critical's flashing gates (changed 2026-09-25 from a shared key). The title is "THIS PAGE MOVES" and the text says plainly that it does not flash. Everything behind the gate is `inert` until Continue, including the nav (same inline script as Spin), and focus is trapped inside it.
- `prefers-reduced-motion: reduce`: the page renders a fixed 400-row diagram once and never animates. Seed and drawing controls redraw it; the Play button reads Redraw and does the same.
- Every control has a visible label or an `aria-label`; the tape canvas is `aria-hidden` with the poster's `alt` and the text carrying the meaning; the seed strip is a focusable `role="application"` with an `aria-describedby` hint.
- Mobile at 390 px: 2 px cells, the panel wraps, no horizontal scroll.

## QA

- `tests/rule110.test.mjs`: the table is 110; from a single cell the first eight generations match the canonical Wolfram pattern; wraparound at both edges; `step` never writes outside the row; a density seed is deterministic for a fixed RNG seed and its density is roughly right; `run` returns the requested number of rows.
- `scripts/qa-rule110.mjs`: nothing runs before the gate, the gate is the first Tab stop and everything else is inert, Continue lifts it; generations advance; Pause stops them and Play resumes; Fast is measurably faster than Normal; Random seeds at the slider's density and resets the counter; Single seeds exactly one cell; Drawn accepts a click and a keyboard toggle and Enter starts the run; the counter is `aria-live="polite"`; the tape paints bone pixels; no digits in the prose but 110 and 2004; the nav and the plain mailto are present; at 390 px the cells are 2 px and the document does not scroll sideways; under reduced motion the diagram is 400 rows and the counter holds; no console errors.
- `npm test`, `npm run build`, `npm run qa:parity -- capture baseline`, screenshots at 1280 and 390 reviewed, CI step `Rule 110 QA`.

## Delivery

Branch `forge/rule110`, one PR into `main`, merged when green, verified on the live URL with the QA script.
