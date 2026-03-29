# Archaic.ie Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the single-page archaic.ie identity site in Astro + Tailwind with stone background, staggered reveal animations, cursor glow, film grain, and ghost text.

**Architecture:** Everything lives in a single `src/pages/index.astro` file — no components, no routes. All CSS is in a `<style>` block in the page. Cursor glow is ~20 lines of vanilla JS in a `<script>` block. The background image is downloaded from Unsplash and committed to `public/`.

**Tech Stack:** Astro 6, Tailwind CSS v4, Google Fonts (Cinzel + Space Grotesk), vanilla JS

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `src/pages/index.astro` | Entire page — markup, styles, scripts |
| Add | `public/stone.jpg` | Background texture image (downloaded from Unsplash) |
| Modify | `.gitignore` | Ensure `.superpowers/` is ignored |

---

### Task 1: Scaffold the Astro page skeleton

**Files:**
- Create: `src/pages/index.astro`

- [ ] **Step 1: Create the src/pages directory and index.astro**

```bash
mkdir -p /Users/faulknco/Projects/archaic-site/src/pages
```

- [ ] **Step 2: Write the base Astro page**

Create `src/pages/index.astro` with this content:

```astro
---
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Archaic — Software Studio, Dublin</title>
  <meta name="description" content="Archaic Limited builds software that endures. No trends. No bloat. Just work that holds." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Space+Grotesk:wght@300;400;500;700&display=swap" rel="stylesheet" />
</head>
<body>
  <p>Archaic</p>
</body>
</html>
```

- [ ] **Step 3: Verify dev server starts**

```bash
cd /Users/faulknco/Projects/archaic-site && npm run dev
```

Expected: server starts at `http://localhost:4321`, page shows "Archaic" in browser.

- [ ] **Step 4: Commit**

```bash
cd /Users/faulknco/Projects/archaic-site
git add src/pages/index.astro
git commit -m "feat: scaffold index page"
```

---

### Task 2: Download the background image

**Files:**
- Add: `public/stone.jpg`

- [ ] **Step 1: Download an ancient stone texture from Unsplash**

Search Unsplash for a dark ancient stone or worn marble texture. The best free option is this specific image (dark carved stone, high contrast):

```bash
curl -L "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1800&q=85&fm=jpg" \
  -o /Users/faulknco/Projects/archaic-site/public/stone.jpg
```

If that URL fails or the image is too light, find an alternative by visiting unsplash.com and searching "ancient stone texture dark" — download the highest resolution version and save to `public/stone.jpg`. The image needs to be dark granite, worn marble, or carved stone. **Not concrete, not brick.**

- [ ] **Step 2: Verify file exists and is a reasonable size**

```bash
ls -lh /Users/faulknco/Projects/archaic-site/public/stone.jpg
```

Expected: file exists, size between 200KB–1MB.

- [ ] **Step 3: Commit**

```bash
cd /Users/faulknco/Projects/archaic-site
git add public/stone.jpg
git commit -m "feat: add stone background texture"
```

---

### Task 3: Build the full page layout and styles

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Replace index.astro with the full page**

Replace the entire contents of `src/pages/index.astro` with:

```astro
---
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Archaic — Software Studio, Dublin</title>
  <meta name="description" content="Archaic Limited builds software that endures. No trends. No bloat. Just work that holds." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Space+Grotesk:wght@300;400;500;700&display=swap" rel="stylesheet" />
</head>
<body>

  <!-- Cursor glow element (C) -->
  <div id="cursor-glow" aria-hidden="true"></div>

  <!-- Film grain overlay -->
  <div class="grain" aria-hidden="true"></div>

  <div class="page">
    <!-- Background image (B) -->
    <div class="bg-image" aria-hidden="true"></div>

    <!-- Ghost text (A) -->
    <div class="ghost-text" aria-hidden="true">ARCHAIC</div>

    <!-- Nav -->
    <nav class="nav">
      <span class="nav-logo">Archaic</span>
      <a class="nav-contact" href="mailto:hello@archaic.ie">hello@archaic.ie</a>
    </nav>

    <!-- Hero -->
    <main class="hero">
      <p class="hero-eyebrow">Software Studio — Dublin</p>
      <h1 class="hero-headline">Built to last.<br />Not to impress.</h1>
      <p class="hero-body">
        Archaic Limited builds software that endures.<br />
        No trends. No bloat. Just work that holds.
      </p>
      <a class="hero-cta" href="mailto:hello@archaic.ie">
        Get in touch <span class="arrow" aria-hidden="true">→</span>
      </a>
    </main>

    <!-- Footer -->
    <footer class="footer">
      <span class="footer-copy">© 2024 Archaic Limited</span>
      <span class="footer-location">Dublin, Ireland</span>
    </footer>
  </div>

</body>
</html>
```

- [ ] **Step 2: Verify it renders in the browser**

```bash
cd /Users/faulknco/Projects/archaic-site && npm run dev
```

Expected: page loads at `http://localhost:4321`, showing plain unstyled content — nav, headline, body, footer all present.

- [ ] **Step 3: Commit**

```bash
cd /Users/faulknco/Projects/archaic-site
git add src/pages/index.astro
git commit -m "feat: add page markup structure"
```

---

### Task 4: Add all CSS — layout, typography, palette

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Add the `<style>` block inside `<head>`, after the font `<link>`**

Insert this immediately before `</head>`:

```html
<style>
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    height: 100%;
    background: #060606;
    color: #888;
    font-family: 'Space Grotesk', sans-serif;
    overflow: hidden;
  }

  /* ── PAGE ── */
  .page {
    height: 100vh;
    display: grid;
    grid-template-rows: auto 1fr auto;
    position: relative;
    overflow: hidden;
  }

  /* ── BACKGROUND IMAGE (B) ── */
  .bg-image {
    position: absolute;
    inset: 0;
    background-image: url('/stone.jpg');
    background-size: cover;
    background-position: center 40%;
    opacity: 0;
    animation: bgFadeIn 2.4s ease forwards;
    animation-delay: 0.3s;
    z-index: 0;
  }

  .bg-image::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(6,6,6,0.97) 0%,
      rgba(6,6,6,0.88) 50%,
      rgba(6,6,6,0.75) 100%
    );
  }

  @keyframes bgFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── GHOST TEXT (A) ── */
  .ghost-text {
    position: absolute;
    font-family: 'Cinzel', serif;
    font-size: 22vw;
    font-weight: 900;
    color: transparent;
    -webkit-text-stroke: 1px rgba(255,255,255,0.045);
    letter-spacing: 0.08em;
    right: -0.1em;
    bottom: -0.15em;
    line-height: 1;
    pointer-events: none;
    user-select: none;
    z-index: 1;
    opacity: 0;
    transform: translateY(30px);
    animation: ghostReveal 1.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    animation-delay: 0.8s;
  }

  @keyframes ghostReveal {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ── CURSOR GLOW (C) ── */
  #cursor-glow {
    position: fixed;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(232,228,216,0.04) 0%, transparent 70%);
    pointer-events: none;
    transform: translate(-50%, -50%);
    transition:
      left 0.8s cubic-bezier(0.23, 1, 0.32, 1),
      top  0.8s cubic-bezier(0.23, 1, 0.32, 1);
    z-index: 5;
    /* Start off-screen */
    left: -9999px;
    top: -9999px;
  }

  /* ── GRAIN ── */
  .grain {
    position: fixed;
    inset: -200%;
    width: 400%;
    height: 400%;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E");
    opacity: 0.35;
    pointer-events: none;
    z-index: 20;
    animation: grainShift 0.5s steps(1) infinite;
  }

  @keyframes grainShift {
    0%   { transform: translate(0, 0); }
    25%  { transform: translate(-2%, -3%); }
    50%  { transform: translate(3%, 1%); }
    75%  { transform: translate(-1%, 4%); }
    100% { transform: translate(2%, -2%); }
  }

  /* ── NAV ── */
  .nav {
    padding: 32px 56px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 10;
    opacity: 0;
    animation: fadeUp 0.8s ease forwards;
    animation-delay: 0.1s;
  }

  .nav-logo {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 600;
    color: #c8c4b8;
    letter-spacing: 5px;
    text-transform: uppercase;
  }

  .nav-contact {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #3a3a3a;
    text-decoration: none;
    transition: color 0.3s;
  }

  .nav-contact:hover {
    color: #888;
  }

  /* ── HERO ── */
  .hero {
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 56px;
    position: relative;
    z-index: 10;
  }

  .hero-eyebrow {
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: #2e2e2e;
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    gap: 14px;
    opacity: 0;
    animation: fadeUp 0.8s ease forwards;
    animation-delay: 0.5s;
  }

  .hero-eyebrow::before {
    content: '';
    display: block;
    width: 28px;
    height: 1px;
    background: #242424;
    flex-shrink: 0;
  }

  .hero-headline {
    font-family: 'Cinzel', serif;
    font-size: clamp(32px, 5vw, 56px);
    font-weight: 400;
    color: #e8e4d8;
    line-height: 1.2;
    letter-spacing: 2px;
    margin-bottom: 28px;
    max-width: 580px;
    opacity: 0;
    animation: fadeUp 0.9s ease forwards;
    animation-delay: 0.65s;
  }

  .hero-body {
    font-size: 14px;
    color: #484848;
    line-height: 1.75;
    max-width: 400px;
    margin-bottom: 44px;
    opacity: 0;
    animation: fadeUp 0.9s ease forwards;
    animation-delay: 0.8s;
  }

  .hero-cta {
    display: inline-flex;
    align-items: center;
    gap: 14px;
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #4a4a4a;
    text-decoration: none;
    opacity: 0;
    animation: fadeUp 0.9s ease forwards;
    animation-delay: 0.95s;
    transition: color 0.3s;
    width: fit-content;
  }

  .hero-cta:hover {
    color: #888;
  }

  .hero-cta .arrow {
    display: inline-block;
    transition: transform 0.3s ease;
  }

  .hero-cta:hover .arrow {
    transform: translateX(6px);
  }

  /* ── FOOTER ── */
  .footer {
    padding: 22px 56px;
    border-top: 1px solid #0f0f0f;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 10;
    opacity: 0;
    animation: fadeUp 0.8s ease forwards;
    animation-delay: 1.1s;
  }

  .footer-copy,
  .footer-location {
    font-size: 9px;
    letter-spacing: 1.5px;
    color: #222;
    text-transform: uppercase;
  }

  /* ── SHARED ANIMATION ── */
  @keyframes fadeUp {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* ── MOBILE ── */
  @media (max-width: 640px) {
    html, body {
      overflow: auto;
    }

    .page {
      height: auto;
      min-height: 100vh;
    }

    .nav {
      padding: 24px 28px;
    }

    .hero {
      padding: 60px 28px;
    }

    .footer {
      padding: 20px 28px;
    }

    .ghost-text {
      font-size: 35vw;
      -webkit-text-stroke: 1px rgba(255,255,255,0.03);
    }

    #cursor-glow {
      display: none;
    }
  }
</style>
```

- [ ] **Step 2: Verify in browser**

Open `http://localhost:4321`. Expected:
- Black page, all elements visible
- Stone image fading in as background (barely visible, texture only)
- Cinzel wordmark top-left, email top-right
- Large headline in warm off-white
- Ghost "ARCHAIC" text bottom-right

- [ ] **Step 3: Commit**

```bash
cd /Users/faulknco/Projects/archaic-site
git add src/pages/index.astro
git commit -m "feat: add page styles, animations, and layout"
```

---

### Task 5: Add the cursor glow script

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: Add the vanilla JS script block before `</body>`**

Insert this immediately before `</body>`:

```html
<script>
  const glow = document.getElementById('cursor-glow');

  document.addEventListener('mousemove', (e) => {
    glow.style.left = e.clientX + 'px';
    glow.style.top  = e.clientY + 'px';
  });
</script>
```

- [ ] **Step 2: Verify cursor glow works**

Open `http://localhost:4321`, move the mouse. Expected: subtle warm light follows the cursor with a slow lag.

- [ ] **Step 3: Commit**

```bash
cd /Users/faulknco/Projects/archaic-site
git add src/pages/index.astro
git commit -m "feat: add cursor glow interaction"
```

---

### Task 6: Add .gitignore entry for .superpowers

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Check current .gitignore**

```bash
cat /Users/faulknco/Projects/archaic-site/.gitignore
```

- [ ] **Step 2: Add .superpowers/ if not already present**

Open `.gitignore` and add this line if it's not there:

```
.superpowers/
```

- [ ] **Step 3: Commit**

```bash
cd /Users/faulknco/Projects/archaic-site
git add .gitignore
git commit -m "chore: ignore .superpowers brainstorm directory"
```

---

### Task 7: Production build and verify

**Files:** none modified

- [ ] **Step 1: Run production build**

```bash
cd /Users/faulknco/Projects/archaic-site && npm run build
```

Expected: build completes with no errors, `dist/` folder created.

- [ ] **Step 2: Preview the production build locally**

```bash
cd /Users/faulknco/Projects/archaic-site && npm run preview
```

Open `http://localhost:4321` (or the port shown). Verify:
- All animations fire correctly
- Background image loads
- Cursor glow works
- Mobile view at 375px width looks correct (resize browser)

- [ ] **Step 3: Push to main to trigger Cloudflare deploy**

```bash
cd /Users/faulknco/Projects/archaic-site
git push origin main
```

Expected: Cloudflare Pages auto-deploys. Check the Cloudflare Pages dashboard to confirm the deploy succeeded. Visit `https://archaic.ie` to verify live.

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| Cinzel + Space Grotesk fonts | Task 3 (markup) + Task 4 (CSS) |
| Nav: wordmark left, email right | Task 3 |
| Hero: eyebrow, headline, body, CTA | Task 3 |
| Footer: copyright + location | Task 3 |
| Reveal animations (A) | Task 4 |
| Background stone image (B) | Task 2 + Task 4 |
| Cursor glow (C) | Task 4 + Task 5 |
| Film grain | Task 4 |
| Ghost text | Task 3 + Task 4 |
| Mobile responsive | Task 4 |
| Production build + deploy | Task 7 |
| .superpowers gitignored | Task 6 |

All spec requirements covered. No gaps.
