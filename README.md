# archaic.ie

Company site for Archaic Limited, a software studio in Dublin.

Three static pages and a short journal, built with Astro and deployed to Cloudflare Pages on every push to `main`.

## Pages

- `/` — the brand statement
- `/deeper` — case studies of live products, plus journal articles rendered from `src/content/journal/`
- `/services` — what the studio does, in broad terms
- `/404` — custom not-found page
- `/forge/spin` — live 2D Ising model art piece (vendored ising-rs WebAssembly; see `scripts/vendor-ising.sh`, `npm run qa:spin`)

Each page is a self-contained `.astro` file with its own styles and scripts. There is no shared layout on purpose.

## Run

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # output in dist/
npm run preview   # http://127.0.0.1:4387 — the port the QA scripts default to
```

No secrets are needed to build. `.env.local` holds only a Cloudflare DNS token reference for DNS changes, not for the site.

## Content

Journal articles are Markdown files in `src/content/journal/` with `title`, `date`, `slug` and `description` frontmatter. They render on `/deeper` on the next build. The schema is in `src/content.config.ts`.

## Conventions

- Cinzel headings are uppercase in both HTML and CSS.
- No prices, rates, timelines or headline figures anywhere on the site.
- No physical address on the site. Company name and number only.
- Article voice: short declarative paragraphs, no bullet lists, no calls to action.

## Deploy

Cloudflare Pages builds `main` automatically. Response headers live in `public/_headers`. CI (`.github/workflows/ci.yml`) builds the site and checks links on pull requests and pushes to `main`.
