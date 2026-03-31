# Archaic.ie — Site Enhancements Design

**Date:** 2026-03-31
**Status:** Approved

---

## Overview

Six independent enhancements to archaic.ie: OG image + social meta tags, Plausible analytics, proper favicon, robots.txt, sitemap, and journal article template. All are additive — no changes to existing page content or styling.

---

## 1. OG Image + Social Meta Tags

**OG Image:**
- Static 1200x630 PNG at `public/og.png`
- Dark background (#060606), triskelion logo centered, "BUILT TO LAST. NOT TO IMPRESS." below in Cinzel-like styling
- Generated once, same image for both pages (brand-level, not page-specific)

**Meta tags added to both `index.astro` and `deeper.astro` `<head>`:**

```html
<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:url" content="https://archaic.ie/" />
<meta property="og:title" content="Archaic — Software Studio, Dublin" />
<meta property="og:description" content="Archaic Limited builds software that endures. No trends. No bloat. Just work that holds." />
<meta property="og:image" content="https://archaic.ie/og.png" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Archaic — Software Studio, Dublin" />
<meta name="twitter:description" content="Archaic Limited builds software that endures. No trends. No bloat. Just work that holds." />
<meta name="twitter:image" content="https://archaic.ie/og.png" />
```

For `deeper.astro`, the `og:url` changes to `https://archaic.ie/deeper` and the title/description change to match the deeper page's existing `<title>` and `<meta name="description">`.

---

## 2. Plausible Analytics

Add to both pages' `<head>`:

```html
<script defer data-domain="archaic.ie" src="https://plausible.io/js/script.js"></script>
```

- Plausible Cloud — user will activate subscription separately
- Script is safe to add before account is active (silently no-ops)
- < 1KB, no cookies, GDPR-compliant, no cookie banner needed
- No other analytics or tracking

---

## 3. Favicon

Replace the default Astro favicon with the triskelion logo.

**Files to create:**
- `public/favicon.ico` — 32x32, generated from `logo.png`
- `public/favicon-16x16.png` — 16x16
- `public/favicon-32x32.png` — 32x32
- `public/apple-touch-icon.png` — 180x180

**Files to delete:**
- `public/favicon.ico` (existing Astro default)
- `public/favicon.svg` (existing Astro default)

**Update `<head>` in both pages:**

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

Replaces the existing `<link rel="icon" type="image/png" href="/logo.png" />` (which serves a 120KB full-size logo as favicon — wasteful).

---

## 4. robots.txt

Create `public/robots.txt`:

```
User-agent: *
Allow: /
Sitemap: https://archaic.ie/sitemap-index.xml
```

Static file, served as-is by Cloudflare Pages.

---

## 5. Sitemap

Install `@astrojs/sitemap` and configure in `astro.config.mjs`:

```js
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://archaic.ie',
  output: 'static',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()]
  }
});
```

Generates `sitemap-index.xml` and `sitemap-0.xml` at build time containing all pages.

---

## 6. Journal Article Template

Create a content directory and example frontmatter template:

```
src/content/journal/
  _example.md   (prefixed with _ so Astro ignores it)
```

Example frontmatter:

```markdown
---
title: "Article Title Here"
date: 2026-03-31
slug: "article-slug"
description: "One-line description for meta tags."
---

Article body in markdown.
```

This establishes the format for when the user writes their first article. No rendering logic — that's a separate task.

---

## Security Considerations

- Plausible script is loaded from `plausible.io` — a trusted third-party. No cookies, no user tracking, GDPR-compliant.
- OG image is a static asset, no dynamic generation.
- robots.txt allows all crawlers — appropriate for a public marketing site.
- No new user input vectors introduced.

---

## What This Design Does NOT Include

- RSS feed (add when articles exist)
- Article rendering on `/deeper` (separate task when first article is written)
- Any homepage visual or content changes
- Cookie banner (Plausible doesn't need one)
