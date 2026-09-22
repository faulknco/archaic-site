# Archaic Limited — Company Site

Marketing/landing site for Archaic Limited (Connor's company). Astro + Tailwind, deployed on Cloudflare Pages.

## Stack
- Astro + Tailwind CSS
- Cloudflare Pages (hosting)
- Cloudflare DNS

## Run
```bash
npm run dev      # local dev
npm run build    # production build
```

## Deploy
Cloudflare Pages auto-deploys on push to `main`.

## Secrets
- `CLOUDFLARE_ARCHAIC_DNS_TOKEN` → `op://Personal/Cloudflare DNS Token - archaic.ie/token`

## Key paths
- `src/` — pages and components
- `public/` — static assets
- `dist/` — build output (gitignored)

## Notes
- This is archaic.ie — the company site, not a product
- Legal docs (company registration, director info) in Obsidian `projects/archaic-limited.md`
