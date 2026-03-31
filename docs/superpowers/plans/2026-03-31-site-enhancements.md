# Site Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add OG image, social meta tags, Plausible analytics, proper favicon, robots.txt, sitemap, and journal article template to archaic.ie.

**Architecture:** Six independent additions to the existing Astro static site. Each task modifies or creates files independently — no task depends on another. Both pages (`index.astro`, `deeper.astro`) are self-contained with inline styles, so meta tag changes go in each file separately.

**Tech Stack:** Astro 6.x, @astrojs/sitemap, Python (Pillow via uv) for image generation, macOS sips for favicon resizing

---

### Task 1: Generate OG image

**Files:**
- Create: `public/og.png`

- [ ] **Step 1: Generate the OG image using Python + Pillow**

Run this script to create a 1200x630 OG image with the logo centered and tagline below:

```bash
cd ~/Projects/archaic-site
uv run --with Pillow python3 -c "
from PIL import Image, ImageDraw, ImageFont

# Create dark background
img = Image.new('RGB', (1200, 630), '#060606')

# Load and resize logo (maintain aspect ratio, fit within 300px height)
logo = Image.open('public/logo.png')
logo_h = 200
logo_w = int(logo.width * (logo_h / logo.height))
logo = logo.resize((logo_w, logo_h), Image.LANCZOS)

# Center logo vertically (slightly above center)
x = (1200 - logo_w) // 2
y = 160

# Paste logo (handle transparency)
if logo.mode == 'RGBA':
    img.paste(logo, (x, y), logo)
else:
    img.paste(logo, (x, y))

# Save
img.save('public/og.png', 'PNG', optimize=True)
print(f'Created og.png: {img.size}')
"
```

Expected: `public/og.png` created, 1200x630.

- [ ] **Step 2: Verify the image**

```bash
sips -g pixelWidth -g pixelHeight ~/Projects/archaic-site/public/og.png
```

Expected: pixelWidth: 1200, pixelHeight: 630

- [ ] **Step 3: Commit**

```bash
cd ~/Projects/archaic-site
git add public/og.png
git commit -m "feat: add OG image for social sharing"
```

---

### Task 2: Generate favicon files

**Files:**
- Create: `public/favicon-32x32.png`, `public/favicon-16x16.png`, `public/apple-touch-icon.png`
- Delete: `public/favicon.svg`
- Replace: `public/favicon.ico`

- [ ] **Step 1: Generate favicon PNGs from logo using sips**

```bash
cd ~/Projects/archaic-site/public

# 32x32
sips -z 32 32 logo.png --out favicon-32x32.png

# 16x16
sips -z 16 16 logo.png --out favicon-16x16.png

# Apple touch icon 180x180
sips -z 180 180 logo.png --out apple-touch-icon.png
```

- [ ] **Step 2: Generate favicon.ico from the 32x32 PNG using Pillow**

```bash
cd ~/Projects/archaic-site
uv run --with Pillow python3 -c "
from PIL import Image
img = Image.open('public/favicon-32x32.png')
img.save('public/favicon.ico', format='ICO', sizes=[(32, 32), (16, 16)])
print('Created favicon.ico')
"
```

- [ ] **Step 3: Delete the old Astro default favicon.svg**

```bash
cd ~/Projects/archaic-site
rm public/favicon.svg
```

- [ ] **Step 4: Verify all favicon files exist**

```bash
ls -la ~/Projects/archaic-site/public/favicon* ~/Projects/archaic-site/public/apple-touch-icon.png
```

Expected: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`. No `favicon.svg`.

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/archaic-site
git add public/favicon-32x32.png public/favicon-16x16.png public/apple-touch-icon.png public/favicon.ico
git rm public/favicon.svg
git commit -m "feat: replace default Astro favicon with triskelion logo"
```

---

### Task 3: Add meta tags, favicon links, and Plausible to both pages

**Files:**
- Modify: `src/pages/index.astro` (lines 8-13 in `<head>`)
- Modify: `src/pages/deeper.astro` (lines 8-13 in `<head>`)

- [ ] **Step 1: Update index.astro `<head>`**

In `src/pages/index.astro`, replace these lines:

```html
  <meta name="description" content="Archaic Limited builds software that endures. No trends. No bloat. Just work that holds." />
  <link rel="icon" type="image/png" href="/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
```

with:

```html
  <meta name="description" content="Archaic Limited builds software that endures. No trends. No bloat. Just work that holds." />

  <!-- Favicon -->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

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

  <!-- Analytics -->
  <script defer data-domain="archaic.ie" src="https://plausible.io/js/script.js"></script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
```

- [ ] **Step 2: Update deeper.astro `<head>`**

In `src/pages/deeper.astro`, replace these lines:

```html
  <meta name="description" content="What Archaic builds. Case studies, articles, and thinking from a Dublin software studio." />
  <link rel="icon" type="image/png" href="/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
```

with:

```html
  <meta name="description" content="What Archaic builds. Case studies, articles, and thinking from a Dublin software studio." />

  <!-- Favicon -->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://archaic.ie/deeper" />
  <meta property="og:title" content="Deeper — Archaic" />
  <meta property="og:description" content="What Archaic builds. Case studies, articles, and thinking from a Dublin software studio." />
  <meta property="og:image" content="https://archaic.ie/og.png" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Deeper — Archaic" />
  <meta name="twitter:description" content="What Archaic builds. Case studies, articles, and thinking from a Dublin software studio." />
  <meta name="twitter:image" content="https://archaic.ie/og.png" />

  <!-- Analytics -->
  <script defer data-domain="archaic.ie" src="https://plausible.io/js/script.js"></script>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
```

- [ ] **Step 3: Verify both pages build**

```bash
cd ~/Projects/archaic-site && npm run build
```

Expected: Clean build, both pages generated.

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/archaic-site
git add src/pages/index.astro src/pages/deeper.astro
git commit -m "feat: add OG meta tags, favicon links, and Plausible analytics"
```

---

### Task 4: Add robots.txt

**Files:**
- Create: `public/robots.txt`

- [ ] **Step 1: Create robots.txt**

Create `public/robots.txt` with this content:

```
User-agent: *
Allow: /
Sitemap: https://archaic.ie/sitemap-index.xml
```

- [ ] **Step 2: Commit**

```bash
cd ~/Projects/archaic-site
git add public/robots.txt
git commit -m "feat: add robots.txt"
```

---

### Task 5: Add Astro sitemap integration

**Files:**
- Modify: `astro.config.mjs`
- Modify: `package.json` (via npm install)

- [ ] **Step 1: Install @astrojs/sitemap**

```bash
cd ~/Projects/archaic-site && npm install @astrojs/sitemap
```

- [ ] **Step 2: Update astro.config.mjs**

Replace the entire contents of `astro.config.mjs` with:

```js
// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://archaic.ie',
  output: 'static',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()]
  }
});
```

- [ ] **Step 3: Build and verify sitemap is generated**

```bash
cd ~/Projects/archaic-site && npm run build
ls -la dist/sitemap*
```

Expected: `dist/sitemap-index.xml` and `dist/sitemap-0.xml` exist.

- [ ] **Step 4: Verify sitemap content**

```bash
cat ~/Projects/archaic-site/dist/sitemap-0.xml
```

Expected: Contains `https://archaic.ie/` and `https://archaic.ie/deeper/`.

- [ ] **Step 5: Commit**

```bash
cd ~/Projects/archaic-site
git add astro.config.mjs package.json package-lock.json
git commit -m "feat: add sitemap generation via @astrojs/sitemap"
```

---

### Task 6: Create journal article template

**Files:**
- Create: `src/content/journal/_example.md`

- [ ] **Step 1: Create the content directory and example template**

Create `src/content/journal/_example.md` with:

```markdown
---
title: "Article Title Here"
date: 2026-03-31
slug: "article-slug"
description: "One-line description for meta tags and social sharing."
---

Article body in markdown. Keep it short (300-800 words), dense, and opinionated.

No fluff. Say something real.
```

The `_` prefix ensures Astro's content collections ignore this file.

- [ ] **Step 2: Commit**

```bash
cd ~/Projects/archaic-site
git add src/content/journal/_example.md
git commit -m "feat: add journal article template for future content"
```

---

### Task 7: Final build verification

**Files:** None — verification only.

- [ ] **Step 1: Clean build**

```bash
cd ~/Projects/archaic-site && rm -rf dist && npm run build
```

Expected: Clean build, no errors.

- [ ] **Step 2: Verify all new assets in dist/**

```bash
ls -la ~/Projects/archaic-site/dist/og.png
ls -la ~/Projects/archaic-site/dist/favicon*
ls -la ~/Projects/archaic-site/dist/apple-touch-icon.png
ls -la ~/Projects/archaic-site/dist/robots.txt
ls -la ~/Projects/archaic-site/dist/sitemap*
```

All files should exist.

- [ ] **Step 3: Verify meta tags in built HTML**

```bash
grep -c 'og:image' ~/Projects/archaic-site/dist/index.html
grep -c 'og:image' ~/Projects/archaic-site/dist/deeper/index.html
grep -c 'plausible.io' ~/Projects/archaic-site/dist/index.html
grep -c 'plausible.io' ~/Projects/archaic-site/dist/deeper/index.html
grep -c 'favicon-32x32' ~/Projects/archaic-site/dist/index.html
grep -c 'favicon-32x32' ~/Projects/archaic-site/dist/deeper/index.html
```

Expected: All commands return `1` (one match per file).

- [ ] **Step 4: Verify no old favicon references remain**

```bash
grep -r 'favicon.svg\|href="/logo.png"' ~/Projects/archaic-site/src/
```

Expected: No matches.
