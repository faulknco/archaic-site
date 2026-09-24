# Spin — design

Date: 2026-09-24. Status: approved by Connor 2026-09-24 (design discussed in chat; spec written after approval).

## What it is

A full-screen, two-tone, live 2D Ising model at `archaic.ie/forge/spin`. Page scroll is temperature: the top of the page is hot noise, the middle is the critical point, the bottom is frozen domains. One line of text, one save button, nothing else. It reuses the existing `ising-rs` WebAssembly build unchanged.

Purpose for Archaic: the single strongest "we do physics and Rust" credential on the site, in the brand's own visual language, at near-zero upkeep. First piece under `/forge`.

Out of scope: any change to `ising-rs` itself (Connor may ask for that separately if the piece is not striking enough), a `/forge` index page, 3D, colour palettes, sound, analytics events, sharing cards beyond a static OG image.

## Files

In `archaic-site`:

- `src/pages/forge/spin.astro` — self-contained page (inline style + inline module script), same conventions as the other pages: no shared layout, Cinzel uppercase where Cinzel is used, Plausible snippet, canonical, OG/Twitter meta.
- `public/forge/spin/ising.js`, `public/forge/spin/ising_bg.wasm` — copied verbatim from `ising-rs/docs/pkg/` (wasm-bindgen output, 81 KB wasm).
- `public/forge/spin/worker.js` — the simulation worker (new, ~60 lines).
- `public/forge/spin/VERSION` — the `ising-rs` commit the pkg was copied from, plus the copy date.
- `public/forge/spin/og.png` — 1200×630 frame captured from the piece near the critical point.
- `scripts/vendor-ising.sh` — copies `../ising-rs/docs/pkg/{ising.js,ising_bg.wasm}` and writes VERSION.
- `scripts/qa-spin.mjs` — Playwright check (see Verification).
- `public/_headers` — CSP additions (see Security).

## Simulation (worker)

- `new IsingWasm(256, 0 /* Square2D */, 1.0, 0.0, seed)`; `randomise()` on start. Seed from `Date.now()` so every visit differs.
- Metropolis only (`step(T)`), never Wolff: at low T Metropolis freezes into coarsening domains, which is the intended look; Wolff would collapse the lattice in one flip.
- Loop: on each tick, run up to `MAX_SWEEPS_PER_TICK = 4` sweeps within a 12 ms budget (measured with `performance.now()`), then post the spins. Spins are read via `spins_ptr()` as an `Int8Array` view on WASM memory and copied into a transferable `Int8Array` buffer per post (65,536 bytes). Post rate is throttled to ~30 Hz by the main thread's `requestAnimationFrame` requesting the next frame ("pull" model: worker waits for a `{type:'tick', T}` message before computing), which also stops work when the tab is hidden.
- Messages: main → worker `{type:'init', n, seed}`, `{type:'tick', T}`; worker → main `{type:'ready'}`, `{type:'frame', spins: ArrayBuffer}`.

## Rendering (main thread)

- Fixed full-viewport `<canvas>` behind the page content. Backing canvas is 256×256; each frame writes an `ImageData` where spin +1 → bone `#e8e4d8` and −1 → `#060606`, then `drawImage` onto the visible canvas sized to `innerWidth × innerHeight` × `devicePixelRatio` with `imageSmoothingEnabled = false`. The 256-square is scaled to `max(w, h)` and centred, so it covers the viewport and crops the long axis.
- Resize handled by `ResizeObserver` on `document.body` / `resize` event: resize the visible canvas, redraw last frame.
- Tab hidden (`visibilitychange`): stop requesting ticks; resume on visible.

## Scroll → temperature

- Page height 600 vh (a `<div class="track">` that only provides scroll length). `s = scrollY / (scrollHeight − innerHeight)`, clamped to [0, 1].
- Piecewise-linear map through control points `(s, T)`: `(0, 5.0)`, `(0.25, 3.0)`, `(0.45, 2.45)`, `(0.55, 2.10)`, `(0.75, 1.5)`, `(1, 0.6)`. T_c for the 2D square lattice is 2.269, so the middle 10 % of scroll straddles the transition and the middle 50 % is 1.5–3.0.
- The current T is sent with every tick; no smoothing needed because Metropolis responds gradually anyway.

## Idle drift

- If no `wheel`, `touchstart`, `pointerdown`, `keydown` or `scroll`-by-user for 15 s, start auto-scroll: `window.scrollBy(0, dir * 0.6)` per animation frame (≈36 px/s), reversing at the ends. Any of the above events cancels it and restarts the 15 s timer. Self-initiated scrolls are marked with a flag so the `scroll` listener does not treat them as user input.
- `prefers-reduced-motion: reduce`: no auto-scroll; `MAX_SWEEPS_PER_TICK = 1`.

## On-screen elements

- Top-left: the Archaic mark (`/logo.webp`, 72 px, same as other pages) linking to `/`. No other nav.
- Bottom-left, Space Grotesk 11 px, `#686868`: "A two-dimensional Ising model, running live in your browser. Scroll to cool it." followed by a link "Source" to `https://github.com/faulknco/ising-rs` (`target=_blank rel=noopener`).
- Bottom-right: a text button "SAVE" in the site's CTA style (10 px, letter-spaced, uppercase, `#4a4a4a` → `#888` on hover, `a:focus-visible` outline). On click: draw the last frame onto an offscreen canvas at `innerWidth × innerHeight × devicePixelRatio` with smoothing off, `toBlob('image/png')`, download as `archaic-spin.png` via a temporary `<a download>`.
- No numbers anywhere on the page (site rule). Footer omitted; the company line lives on the other pages.
- Background colour `#060606` so there is no flash before the first frame; the canvas fades in over 600 ms once the first frame arrives.

## Head / SEO

- `<title>Spin — Archaic</title>`, description "A two-dimensional Ising model running live in your browser. Scroll to cool it from noise, through the critical point, into frozen domains.", canonical `https://archaic.ie/forge/spin/`, OG/Twitter tags with `/forge/spin/og.png`. Indexable; sitemap picks it up. `lang="en"`.

## Security

`public/_headers` CSP changes (enforced policy, verified live 2026-09-24):

- `script-src` add `'wasm-unsafe-eval'` (needed for `WebAssembly.instantiate` under CSP).
- add `worker-src 'self'`.
- Everything else unchanged; no new origins.

## Verification

- `scripts/qa-spin.mjs` (Playwright, run locally against `npm run preview` or the live URL): load `/forge/spin/`, wait for the first frame; at scroll top sample the 256×256 backing canvas via an exposed `window.__spin.sample()` returning `{upFraction, agreement}` where `agreement` is the mean fraction of nearest neighbours equal to each spin. Assert top: `upFraction` in [0.4, 0.6] and `agreement` < 0.7. Scroll to bottom, wait 6 s, assert `agreement` > 0.9. Also assert no console errors and that `/forge/spin/ising_bg.wasm` returned 200.
- CI (build + lychee) must stay green. Manual: check on a phone (touch scroll, no jank), and with reduced motion on.
- Screenshots at 1280×900 and 400×800 reviewed before merge.

## Delivery

Branch `forge/spin`, one PR into `main`. Merge deploys. Vault repo overview and memory updated after merge.

## Changes after Connor's review of the preview (2026-09-24)

- Section renamed from `/lab` to `/forge` (Connor's choice from forge / magic / runes / rites). All paths above read `/forge/spin`.
- Photosensitivity gate: the page opens on a full-screen notice ("THIS PAGE FLASHES", Cinzel uppercase, with a plain-language sentence and Continue / Back). The worker is not created and nothing moves until Continue is pressed. The choice is remembered for the browser session only (`sessionStorage`, wrapped in try/catch), so a return visit in a new tab shows the notice again. The QA script asserts that no frames flow before the gate and clicks through it.

## Ink wash (approved by Connor 2026-09-24, after a visual comparison of four directions)

Direction chosen: **B, ink wash**, settling dark, with copper on the domain walls. Physics unchanged; the change is rendering plus a small external field.

- **Field.** The page blends each new frame into a smoothed field (exponential moving average). The blend weight follows temperature: 0.6 when hot, so the noise stays a live stipple, down to 0.18 when cold, so the domains breathe.
- **Shader.** WebGL2 fragment shader: cover-fit of the 256² field texture with linear filtering plus a light 5-tap cross blur; contrast curve `0.5 + 0.5·tanh(4(t − 0.5))` so the wash stays inky rather than grey; palette `mix(ground, bone, t)` plus a copper tint weighted by `(4t(1−t))^1.5 · 0.35` (strongest on domain walls); per-pixel film grain of ±0.02 that changes every frame. `preserveDrawingBuffer` is on so Save and the poster script can read the canvas. Canvas 2D fallback draws the same field without copper or grain.
- **Colours** come from tokens: `--ground-rgb`, `--bone-rgb` and a new `--copper-rgb: 154 106 62`, read with the same fallback mechanism as the other two.
- **Settling dark.** The worker accepts an external field with each tick (`sim.set_params(1, h)` when it changes). `h` is 0 at and above the critical point (2.269), so the critical clusters are unbiased; it ramps in over 2.27→2.0 to −0.015 and holds all the way down. Measured: a lattice jumped straight to the bottom drifts to a ground majority within about four seconds and is fully ground within about six; a gradual scroll arrives dark. A tapered cold-end field (−0.005) was tried so that bone islands would survive: on gradual scrolls they faded anyway, and on jumps a lattice that had quenched into the bone phase stayed there for tens of seconds. Reliably ending dark won.
- **QA.** `scripts/qa-spin.mjs` additionally asserts the cold end has `upFraction < 0.45` and reports the active renderer. The poster is regenerated from the new look with `npm run poster:spin`.
