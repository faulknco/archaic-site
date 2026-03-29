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
- `Cinzel` (Google Fonts) — wordmark, headline. Inscriptional, Roman-derived. Carries the weight of stone.
- `Space Grotesk` (Google Fonts) — all other text. Clean, modern grotesque. The contrast is the point.

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
