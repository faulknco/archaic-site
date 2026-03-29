# Archaic.ie — Site Design Spec

**Date:** 2026-03-29
**Status:** Approved

---

## Overview

A single-page identity statement for Archaic Limited. The design plays on the core brand tension: *archaic* means ancient and obsolete — the company is anything but. The site communicates this through restraint, not explanation. No case studies, no services list, no portfolio. Just name, tagline, and contact. The page earns authority by saying almost nothing.

---

## Design Direction

**Tone:** Stoic Monolith
**Palette:** Near-black background (`#0a0a0a`), warm off-white headline (`#e8e4d8`), mid-grey body (`#404040`), muted footer/eyebrow (`#222`–`#333`)
**Typefaces:**
- `Cinzel` (Google Fonts) — headline only. Inscriptional, Roman-derived. Must be used in all-caps.
- `Uncial Antiqua` (Google Fonts) — ghost text. Celtic/ancient feel, matches logo direction.
- `Space Grotesk` (Google Fonts) — all other text. Clean, modern grotesque. The contrast is the point.
- Logo wordmark — runic angular typeface, AI-generated PNG (`public/logo.png`), not a web font.

---

## Page Structure

Single page. One scroll. No sub-pages at launch.

### Nav
- Left: `ARCHAIC` wordmark in Cinzel, spaced caps
- Right: `hello@archaic.ie` as a plain mailto link — understated, no button

### Hero
- Eyebrow: `Software Studio — Dublin` (Space Grotesk, 10px, 4px letter-spacing, uppercase, muted)
- Headline: `Built to last. / Not to impress.` (Cinzel, ~52px, weight 400, warm off-white)
- Body: `Archaic Limited builds software that endures. No trends. No bloat. Just work that holds.` (Space Grotesk, 14px, #404040)
- CTA: `Get in touch →` as a mailto link — arrow animates right on hover

### Footer
- Left: `© 2024 Archaic Limited`
- Right: `Dublin, Ireland`
- Both in 9px Space Grotesk, very muted (`#222`)

---

## Visual Effects

### A — Reveal animation (load)
All elements fade up on load with staggered delays (nav → eyebrow → headline → body → CTA → footer). Ghost text drifts up from bottom-right. Timing: 0.8–1.8s total, `cubic-bezier(0.16, 1, 0.3, 1)`.

### B — Background image
Full-bleed ancient stone/marble/carved surface texture (Unsplash, sourced at build time — search: `ancient stone texture`, `worn marble`, `carved stone surface`). Fades in on load at ~2.4s delay. Heavy dark gradient overlay: `rgba(6,6,6,0.97)` left → `rgba(6,6,6,0.75)` right. The image is felt more than seen.

### C — Cursor glow
Soft radial light (`rgba(232,228,216,0.04)`, 600px diameter) follows the cursor with a slow lag (`transition: 0.8s cubic-bezier(0.23,1,0.32,1)`). Like candlelight moving across stone.

### Grain overlay
Animated SVG fractal noise at low opacity, shifts position every frame to simulate film grain. Adds physicality to the otherwise digital surface.

### Ghost text
`ARCHAIC` in Cinzel 900, ~22vw, rendered as outline only (`-webkit-text-stroke: 1px rgba(255,255,255,0.045)`), bottom-right of the hero. Arrives via the reveal animation.

---

## Copy

| Element | Text |
|---|---|
| Wordmark | ARCHAIC |
| Eyebrow | Software Studio — Dublin |
| Headline | Built to last. Not to impress. |
| Body | Archaic Limited builds software that endures. No trends. No bloat. Just work that holds. |
| CTA | Get in touch → |
| Footer left | © 2024 Archaic Limited |
| Footer right | Dublin, Ireland |
| Nav contact | hello@archaic.ie |

---

## Technical

- **Framework:** Astro + Tailwind CSS v4
- **Hosting:** Cloudflare Pages (auto-deploy on push to `main`)
- **Fonts:** Google Fonts (Cinzel + Space Grotesk), loaded via `<link>` in `<head>`
- **Image:** Unsplash source URL or downloaded and committed to `public/` — pick one high-quality ancient stone texture, ideally > 1600px wide
- **No JavaScript framework** — cursor glow is vanilla JS (20 lines), everything else is CSS animation
- **Single page:** `src/pages/index.astro` only
- **No routes, no components needed** — everything inline in the index page at this scale

---

## Design Rationale & Decisions

This section records *why* each decision was made, so future changes start from understanding not guesswork.

### Why a single page with almost nothing on it

Archaic has no case studies, no client list, no testimonials yet. A services page or products page at this stage would be thin and undermine the confidence the aesthetic is projecting. A single identity statement — name, tagline, contact — says "we don't need to convince you." That restraint *is* the message. When DjangoShip or TrueClarity has real traction, a `/work` page gets added. Not before.

### Why "Stoic Monolith" over other directions

Three design directions were considered during brainstorming:
- **Stoic Monolith** (chosen) — pure black, Cinzel inscriptional serif, total restraint
- **Stone & Light** — warm parchment, Cormorant italic, classical editorial feel
- **Ink & Gold** — dark background, amber gold accent, ancient manuscript meets dark mode

Stoic Monolith was chosen because it most directly embodies the brand tension: the name is ancient, the attitude is modern and unimpressed. It doesn't explain itself.

### Why "Built to last. Not to impress."

Three copy tones were considered:
- **Confrontational** — "The name is a provocation." Names the paradox head-on.
- **Stoic** (chosen) — "Built to last. Not to impress." Doesn't explain the name. The copy embodies permanence.
- **Wry** — "The name is the only thing we inherited." Acknowledges with a half-smile.

Stoic was chosen because it doesn't over-explain. The name does the work. The copy reinforces the attitude without being clever about it.

### Why Cinzel + Space Grotesk

Cinzel is derived from classical Roman inscriptional lettering — it literally looks like stone carvings. Using it for the headline creates an immediate visual connection to antiquity. Space Grotesk is clean, modern, and confident. The contrast between the two typefaces is the whole brand in microcosm: ancient name, modern craft.

**Note:** Cinzel must be used in all-caps (`text-transform: uppercase` or uppercase HTML). Cinzel renders mixed-case text as small caps — capital letters at full size, lowercase at reduced size — which looks like unintentional title case. The headline is set as `BUILT TO LAST. / NOT TO IMPRESS.` in the HTML for this reason.

### Why the background image is "barely visible"

The image should be *felt*, not seen. A fully visible background competes with the copy. The current approach fades the image to 60% opacity then applies a heavy dark gradient overlay (96%→85% black). The result is texture and depth without distraction. The warm brown parchment tones bleed through subtly and complement the `#e8e4d8` off-white headline.

### Logo — triskelion mark + runic wordmark

The logo went through two rounds of iteration away from the original Roman/Cinzel direction:

1. **Roman wordmark (rejected)** — Cinzel in the nav as a text wordmark. Too expected for a company named Archaic.
2. **Triskelion mark + runic ARCHAIC (chosen)** — AI-generated in ElevenLabs nano-banana. Triple spiral (Newgrange triskelion) enclosed in a worn circle, with ARCHAIC in an angular runic typeface below.

The Newgrange triple spiral was chosen deliberately: it is carved into the entrance stone at Newgrange, County Meath — a passage tomb 5,200 years old, predating Stonehenge and the Egyptian pyramids. It is genuinely Irish and genuinely archaic. The logo is stored as `public/logo.png`.

**PNG gotcha:** The logo was generated with a black background. Black pixels were made transparent in post using PIL/numpy (`pixels with r,g,b < 30 → alpha = 0`) so the mark floats on the site background without a visible rectangle. `mix-blend-mode: lighten` was tried first but did not work reliably — direct alpha transparency is the correct fix.

### Why Uncial Antiqua for ghost text

The ghost text originally used Cinzel (Roman serif). After the logo direction shifted to runic/Celtic, Cinzel felt wrong as the ghost text typeface. A PNG image of the wordmark was tried but produced a white blob (the stone texture background of the PNG was inverted by the CSS filter). `Uncial Antiqua` (Google Fonts) is a Celtic-style display font — rounded, ancient, closer to the logo aesthetic — and renders cleanly as CSS outline text via `-webkit-text-stroke`.

**Ghost text sizing gotcha:** At large `vw` sizes (22vw), 7 letters × font-size overflows the viewport width and clips letters from both ends even with `overflow: hidden` on `.page`. The text is set to `13vw` with `left: 0; right: 0; text-align: center` so all letters are always visible.

### Why parchment/papyrus over stone

The background went through three iterations:
1. **Wrong Unsplash photo** — accidentally downloaded a man at a workbench
2. **Paint swirl** — colourful, too visible, wrong mood entirely
3. **Aged parchment** (final) — AI-generated, warm dark browns, torn edges, fibrous texture

Parchment was chosen because it's warmer than grey stone and complements the off-white headline colour. It also reinforces the manuscript/archival quality of the brand — something that has survived time.

### Why no form, no button — just a mailto link

A contact form adds complexity (server, spam, validation) and signals "we get a lot of enquiries." A plain mailto link signals "just talk to us." For a company at this stage, direct contact is better than managed contact.

### The body copy colour

Launched at `#484848` — too dark against the near-black background, body copy was nearly invisible. Updated to `#686868` so it reads as a supporting line, not an afterthought.

### Trade-offs accepted

- **Cold discovery is hard** — a visitor who doesn't already know Archaic may not understand what it does. This is acceptable at the current stage. The site is for people who look you up, not for strangers finding you via search.
- **No SEO beyond meta description** — no blog, no content, no long-tail keywords. Correct for now; revisit when content becomes part of distribution strategy.
- **Single typeface pair forever** — Cinzel is distinctive but also legible only at display sizes. This limits how much text the site can ever carry. That constraint is a feature, not a bug.

---

## What Gets Built Later (Not Now)

- `/work` page — when DjangoShip or TrueClarity has real traction to show
- Products section — when there are 3+ live products worth listing
- Blog or content — if/when content becomes part of the distribution strategy

---

## Success Criteria

The site is correct when:
- It loads fast (< 1s LCP on Cloudflare edge)
- The reveal animation feels unhurried, not sluggish
- The background image is barely visible — texture only
- A visitor understands what Archaic is in under 5 seconds without reading the body copy
- It looks correct on mobile (single column, headline scales down)
