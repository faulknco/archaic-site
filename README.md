# archaic.ie

Company site for Archaic Limited, a software studio in Dublin.

A handful of static pages, a short journal and one live piece, built with Astro and deployed to Cloudflare Pages on every push to `main`.

## Pages

- `/` — the brand statement
- `/deeper` — case studies of live products, plus journal articles rendered from `src/content/journal/`
- `/services` — what the studio does, in broad terms
- `/principles` — how the studio works, and who runs it
- `/404` — custom not-found page
- `/forge` — index of the working pieces
- `/forge/spin` — live 2D Ising model art piece (vendored ising-rs WebAssembly; see `scripts/vendor-ising.sh`, `npm run qa:spin`)

Every page renders through one shared layout, `src/layouts/Base.astro`, which owns the document head, the fonts, the nav and the footer. A page passes it a title, a description, a canonical path, a `layout` (`scroll`, `hero` or `spin`) and a `current` nav key. Page-specific styling stays in the page's own scoped `<style>` block.

Colour, type, tracking and spacing all come from tokens in `src/styles/tokens.css`. Nothing else defines them: `npm test` fails the build on a hex literal or a hardcoded font stack anywhere in `src/`. Shared chrome styling lives in `src/styles/global.css`.

## Run

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # output in dist/
npm run preview   # http://127.0.0.1:4387 — the port the QA scripts default to
```

## QA

```bash
npm test                       # tokens, tmap, no-literals, built-HTML invariants (build first)
npm run qa:spin [url]          # Playwright: /forge/spin physics + page checks
npm run qa:parity -- …         # capture baseline|after, compare, nav-check (local acceptance)
npm run qa:console -- <url>    # zero console errors on every page (CSP check against a deploy)
npm run qa:lighthouse [url]    # desktop performance, prints LCP and its element
```

Serve the build with `npm run preview` before running anything but `npm test`.

CI runs `npm test`, the link check, `qa:parity -- nav-check` and `qa:spin` on every pull request.

`qa:console` is not in CI and is a manual step before merging. It needs a real deploy: the response headers that carry the Content Security Policy live in `public/_headers`, which Cloudflare Pages applies and `astro preview` does not, so a local run proves nothing about the CSP. Once Pages posts the preview URL on the pull request:

```bash
PREVIEW=https://<branch-hash>.archaic-site.pages.dev
npm run qa:console -- $PREVIEW   # CSP clean on every page, contact address intact
npm run qa:spin $PREVIEW         # wasm and the worker under the real CSP
npm run qa:lighthouse $PREVIEW/  # record perf, LCP and the LCP element
```

Parity screenshots are local acceptance only. Baselines live in `.parity/`, which is gitignored, so `compare` is meaningful only against baselines captured on the same machine. A change that moves pixels on purpose names the region in its commit message and re-captures the baseline.

No secrets are needed to build. `.env.local` holds only a Cloudflare DNS token reference for DNS changes, not for the site.

## Content

Journal articles are Markdown files in `src/content/journal/` with `title`, `date`, `slug` and `description` frontmatter. They render on `/deeper` on the next build. The schema is in `src/content.config.ts`.

## Conventions

- Cinzel headings are uppercase in both HTML and CSS.
- No prices, rates, timelines or headline figures anywhere on the site.
- No physical address on the site. Company name and number only.
- Article voice: short declarative paragraphs, no bullet lists, no calls to action.

## Deploy

Cloudflare Pages builds `main` automatically. Response headers, including the Content Security Policy, live in `public/_headers`. CI (`.github/workflows/ci.yml`) builds the site, runs the tests, checks links and runs the browser QA on pull requests and pushes to `main`. The build fetches the four self-hosted font faces from Fontsource, so CI needs network.
