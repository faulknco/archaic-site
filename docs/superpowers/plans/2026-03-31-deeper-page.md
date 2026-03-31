# /deeper Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/deeper` page to archaic.ie with 4 case studies, an empty journal section, and a contact CTA — behind a new "Deeper" nav link on the homepage.

**Architecture:** Single new Astro page (`src/pages/deeper.astro`) with all styles inline, matching the homepage pattern. No shared layout — both pages are self-contained. No JavaScript frameworks, no build dependencies. Markdown article files will be added later when journal content exists.

**Tech Stack:** Astro 6.x, vanilla CSS, Google Fonts (Cinzel, Space Grotesk)

**Security considerations:**
- All links are static (`mailto:`, absolute URLs to own products) — no user input, no dynamic routing
- No forms, no query parameters, no cookies, no client-side state
- External links to product sites use `rel="noopener noreferrer"` and `target="_blank"`
- No third-party scripts or tracking added
- CSP-compatible: inline styles are Astro build-time only, script is minimal cursor glow

---

### Task 1: Add "Deeper" nav link to homepage

**Files:**
- Modify: `src/pages/index.astro:340-343` (nav section)

- [ ] **Step 1: Add the Deeper link to the nav**

In `src/pages/index.astro`, replace the nav section:

```html
<!-- Nav -->
<nav class="nav">
  <img class="nav-logo" src="/logo.png" alt="Archaic" />
  <a class="nav-contact" href="mailto:hello@archaic.ie">hello@archaic.ie</a>
</nav>
```

with:

```html
<!-- Nav -->
<nav class="nav">
  <img class="nav-logo" src="/logo.png" alt="Archaic" />
  <div class="nav-links">
    <a class="nav-link" href="/deeper">Deeper</a>
    <a class="nav-contact" href="mailto:hello@archaic.ie">hello@archaic.ie</a>
  </div>
</nav>
```

- [ ] **Step 2: Add styles for .nav-links and .nav-link**

In `src/pages/index.astro`, add inside the `<style>` block after the `.nav-contact:hover` rule (after line 167):

```css
.nav-links {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-link {
  font-size: 10px;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #3a3a3a;
  text-decoration: none;
  transition: color 0.3s;
}

.nav-link:hover {
  color: #888;
}
```

- [ ] **Step 3: Verify locally**

Run: `cd ~/Projects/archaic-site && npm run dev`

Open `http://localhost:4321` — verify:
- "Deeper" link appears left of the email in the nav
- Styled identically to the email link (muted grey, uppercase, small)
- Hover state works (transitions to #888)
- Clicking it navigates to `/deeper` (will 404 for now — that's expected)
- Mobile layout still looks correct at 640px width

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/archaic-site
git add src/pages/index.astro
git commit -m "feat: add Deeper nav link to homepage"
```

---

### Task 2: Create the /deeper page scaffold

**Files:**
- Create: `src/pages/deeper.astro`

- [ ] **Step 1: Create the deeper page with full structure**

Create `src/pages/deeper.astro` with the page scaffold — head, background, cursor glow, nav (matching homepage but on the deeper page), the "DEEPER" header, empty content zones, and footer. No film grain. No ghost watermark.

```astro
---
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Deeper — Archaic</title>
  <meta name="description" content="What Archaic builds. Case studies, articles, and thinking from a Dublin software studio." />
  <link rel="icon" type="image/png" href="/logo.png" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;900&family=Space+Grotesk:wght@300;400;500;700&display=swap" rel="stylesheet" />
  <style>
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  html, body {
    min-height: 100%;
    background: #060606;
    color: #888;
    font-family: 'Space Grotesk', sans-serif;
  }

  /* ── BACKGROUND IMAGE ── */
  .bg-image {
    position: fixed;
    inset: 0;
    background-image: url('/stone.jpg');
    background-size: cover;
    background-position: center 40%;
    opacity: 0.6;
    z-index: 0;
  }

  .bg-image::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(
      135deg,
      rgba(6,6,6,0.96) 0%,
      rgba(6,6,6,0.92) 40%,
      rgba(6,6,6,0.85) 100%
    );
  }

  /* ── CURSOR GLOW ── */
  #cursor-glow {
    position: fixed;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(232,228,216,0.04) 0%, transparent 70%);
    pointer-events: none;
    left: -300px;
    top: -300px;
    transition: transform 0.8s cubic-bezier(0.23, 1, 0.32, 1);
    z-index: 5;
  }

  /* ── CONTENT WRAPPER ── */
  .content {
    position: relative;
    z-index: 10;
    max-width: 720px;
    margin: 0 auto;
    padding: 0 56px;
  }

  /* ── NAV ── */
  .nav {
    padding: 32px 56px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
    z-index: 10;
  }

  .nav-logo {
    display: block;
    height: 72px;
    width: auto;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 32px;
  }

  .nav-link {
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #3a3a3a;
    text-decoration: none;
    transition: color 0.3s;
  }

  .nav-link:hover {
    color: #888;
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

  /* ── PAGE HEADER ── */
  .page-header {
    padding: 120px 0 80px;
  }

  .page-title {
    font-family: 'Cinzel', serif;
    font-size: clamp(28px, 4vw, 48px);
    font-weight: 400;
    color: #e8e4d8;
    letter-spacing: 4px;
    text-transform: uppercase;
  }

  /* ── SECTION ── */
  .section {
    padding: 60px 0;
  }

  .section-label {
    font-size: 9px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #2e2e2e;
    margin-bottom: 48px;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .section-label::before {
    content: '';
    display: block;
    width: 28px;
    height: 1px;
    background: #242424;
    flex-shrink: 0;
  }

  /* ── CASE STUDY ── */
  .case-study {
    margin-bottom: 64px;
  }

  .case-study:last-child {
    margin-bottom: 0;
  }

  .case-study-name {
    font-family: 'Cinzel', serif;
    font-size: clamp(18px, 2.5vw, 24px);
    font-weight: 400;
    color: #e8e4d8;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .case-study-tagline {
    font-size: 13px;
    color: #686868;
    margin-bottom: 24px;
    font-style: italic;
  }

  .case-study-detail {
    font-size: 13px;
    color: #686868;
    line-height: 1.75;
    margin-bottom: 8px;
  }

  .case-study-detail strong {
    color: #555;
    font-weight: 500;
    display: inline-block;
    min-width: 100px;
  }

  .case-study-tech {
    font-size: 12px;
    color: #444;
    margin-top: 16px;
    letter-spacing: 0.5px;
  }

  .case-study-link {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #4a4a4a;
    text-decoration: none;
    margin-top: 20px;
    transition: color 0.3s;
  }

  .case-study-link:hover {
    color: #888;
  }

  .case-study-link .arrow {
    display: inline-block;
    transition: transform 0.3s ease;
  }

  .case-study-link:hover .arrow {
    transform: translateX(6px);
  }

  /* ── JOURNAL (empty state) ── */
  .journal-empty {
    font-size: 13px;
    color: #333;
    font-style: italic;
  }

  /* ── CONTACT CTA ── */
  .contact {
    padding: 80px 0 40px;
    border-top: 1px solid #111;
  }

  .contact-text {
    font-size: 14px;
    color: #686868;
    line-height: 1.75;
  }

  .contact-link {
    color: #4a4a4a;
    text-decoration: none;
    transition: color 0.3s;
  }

  .contact-link:hover {
    color: #888;
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
    margin-top: 80px;
  }

  .footer-copy,
  .footer-location {
    font-size: 9px;
    letter-spacing: 1.5px;
    color: #222;
    text-transform: uppercase;
  }

  /* ── SCROLL REVEAL ── */
  .reveal {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }

  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── MOBILE ── */
  @media (max-width: 640px) {
    .nav {
      padding: 24px 28px;
    }

    .content {
      padding: 0 28px;
    }

    .page-header {
      padding: 80px 0 48px;
    }

    .footer {
      padding: 20px 28px;
    }

    #cursor-glow {
      display: none;
    }

    .nav-links {
      gap: 20px;
    }
  }
  </style>
</head>
<body>

  <!-- Cursor glow -->
  <div id="cursor-glow" aria-hidden="true"></div>

  <!-- Background image -->
  <div class="bg-image" aria-hidden="true"></div>

  <!-- Nav -->
  <nav class="nav">
    <a href="/">
      <img class="nav-logo" src="/logo.png" alt="Archaic" />
    </a>
    <div class="nav-links">
      <a class="nav-link" href="/deeper">Deeper</a>
      <a class="nav-contact" href="mailto:hello@archaic.ie">hello@archaic.ie</a>
    </div>
  </nav>

  <div class="content">

    <!-- Page header -->
    <header class="page-header">
      <h1 class="page-title">DEEPER</h1>
    </header>

    <!-- Work section -->
    <section class="section">
      <p class="section-label">Work</p>

      <article id="djangoship" class="case-study reveal">
        <h2 class="case-study-name">DJANGOSHIP</h2>
        <p class="case-study-tagline">SaaS boilerplate for European startups</p>
        <p class="case-study-detail"><strong>What it is</strong> — Production-ready Django template sold on Gumroad. Ships with Stripe payments, GDPR compliance, team management, and one-click Railway deploy.</p>
        <p class="case-study-detail"><strong>What it does</strong> — Authentication with email and OAuth, subscription billing, API tokens with quota tracking, cookie consent and data export, 150+ automated tests.</p>
        <p class="case-study-tech">Django · Stripe · PostgreSQL · Railway · GitHub Actions</p>
        <a class="case-study-link" href="https://faulknco.gumroad.com/l/djangoship" target="_blank" rel="noopener noreferrer">
          View on Gumroad <span class="arrow" aria-hidden="true">→</span>
        </a>
      </article>

      <article id="roleup" class="case-study reveal">
        <h2 class="case-study-name">ROLEUP</h2>
        <p class="case-study-tagline">Irish job board with recruiter accountability</p>
        <p class="case-study-detail"><strong>What it is</strong> — Privacy-first job board where every company gets a public response score based on how they treat candidates.</p>
        <p class="case-study-detail"><strong>What it does</strong> — Recruiter response scoring, 22 salary data ingestion pipelines, benchmarking by role and county, email alerts, recruiter tier system.</p>
        <p class="case-study-tech">Django · HTMX · Stripe · PostgreSQL · Railway</p>
        <a class="case-study-link" href="https://www.roleup.ie" target="_blank" rel="noopener noreferrer">
          Visit RoleUp <span class="arrow" aria-hidden="true">→</span>
        </a>
      </article>

      <article id="trueclarity" class="case-study reveal">
        <h2 class="case-study-name">TRUECLARITY</h2>
        <p class="case-study-tagline">AI readiness toolkit for Irish SMEs</p>
        <p class="case-study-detail"><strong>What it is</strong> — Assessment tool and resource hub that helps Irish business owners understand and implement AI, with GDPR compliance and Irish grants guidance built in.</p>
        <p class="case-study-detail"><strong>What it does</strong> — AI readiness assessment with personalised scoring, sector-specific playbooks, 50+ prompts for Irish business contexts, vetted tool directory.</p>
        <p class="case-study-tech">Next.js · Supabase · Stripe · Vercel</p>
        <a class="case-study-link" href="https://www.trueclarity.ie" target="_blank" rel="noopener noreferrer">
          Visit TrueClarity <span class="arrow" aria-hidden="true">→</span>
        </a>
      </article>

      <article id="salaries-ie" class="case-study reveal">
        <h2 class="case-study-name">SALARIES.IE</h2>
        <p class="case-study-tagline">1,019 salary pages from Irish open data</p>
        <p class="case-study-detail"><strong>What it is</strong> — Programmatic SEO site generating salary comparison pages from CSO open data, broken down by sector, county, and demographics.</p>
        <p class="case-study-detail"><strong>What it does</strong> — Automated data pipelines from the Central Statistics Office, per-county and per-sector salary breakdowns, 1,019 statically generated pages.</p>
        <p class="case-study-tech">Astro · Cloudflare Pages · CSO Open Data API</p>
        <a class="case-study-link" href="https://salaries.ie" target="_blank" rel="noopener noreferrer">
          Visit salaries.ie <span class="arrow" aria-hidden="true">→</span>
        </a>
      </article>
    </section>

    <!-- Journal section -->
    <section class="section">
      <p class="section-label">Journal</p>
      <p class="journal-empty reveal">Nothing yet. Articles will appear here.</p>
    </section>

    <!-- Contact CTA -->
    <section class="contact reveal">
      <p class="contact-text">
        If any of this is relevant to what you're building —
        <a class="contact-link" href="mailto:hello@archaic.ie">hello@archaic.ie<span class="arrow" aria-hidden="true"> →</span></a>
      </p>
    </section>

  </div>

  <!-- Footer -->
  <footer class="footer">
    <span class="footer-copy">© {new Date().getFullYear()} Archaic Limited</span>
    <span class="footer-location">Dublin, Ireland</span>
  </footer>

  <script>
    // Cursor glow
    const glow = document.getElementById('cursor-glow');
    if (glow) {
      document.addEventListener('mousemove', (e) => {
        const x = e.clientX - 300;
        const y = e.clientY - 300;
        glow.style.transform = `translate(${x}px, ${y}px)`;
      });
    }

    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    reveals.forEach((el) => observer.observe(el));
  </script>

</body>
</html>
```

- [ ] **Step 2: Verify locally**

Run: `cd ~/Projects/archaic-site && npm run dev`

Open `http://localhost:4321/deeper` — verify:
- Page loads with dark background and stone texture
- "DEEPER" header displays in Cinzel uppercase
- All 4 case studies render with correct names, taglines, details, tech stacks, and links
- External links open in new tabs
- Journal section shows "Nothing yet" placeholder
- Contact CTA renders with email link
- Footer shows copyright year and "Dublin, Ireland"
- Cursor glow works on desktop
- Scroll reveal animations trigger as case studies enter viewport
- Mobile layout works at 640px (cursor glow hidden, padding adjusted)
- Nav logo links back to homepage `/`
- "Deeper" link in nav is present (active page)

- [ ] **Step 3: Commit**

```bash
cd ~/Projects/archaic-site
git add src/pages/deeper.astro
git commit -m "feat: add /deeper page with case studies, journal, and contact CTA"
```

---

### Task 3: Verify external links and security

**Files:**
- Review: `src/pages/deeper.astro` (no changes expected)

- [ ] **Step 1: Verify all external links have security attributes**

Check that every `<a>` tag with an external URL (`https://`) has both `target="_blank"` and `rel="noopener noreferrer"`. There should be 4 external links:
- `https://faulknco.gumroad.com/l/djangoship`
- `https://www.roleup.ie`
- `https://www.trueclarity.ie`
- `https://salaries.ie`

Run:
```bash
cd ~/Projects/archaic-site
grep -n 'href="https://' src/pages/deeper.astro
```

Each match must also contain `target="_blank" rel="noopener noreferrer"` on the same element.

- [ ] **Step 2: Verify no user input vectors exist**

Confirm there are:
- No `<form>` elements
- No `<input>` elements
- No query parameter reading (`Astro.url.searchParams`, `URLSearchParams`)
- No dynamic routing (`[slug].astro` patterns)
- No cookies or localStorage usage
- No third-party scripts

Run:
```bash
cd ~/Projects/archaic-site
grep -rn 'form\|input\|searchParams\|localStorage\|cookie\|<script src' src/pages/deeper.astro
```

Expected: no matches (or only the `<script>` tag containing inline cursor glow + scroll reveal code).

- [ ] **Step 3: Run production build**

Run:
```bash
cd ~/Projects/archaic-site && npm run build
```

Expected: Clean build with no warnings. Output in `dist/` should contain `deeper/index.html`.

- [ ] **Step 4: Preview production build**

Run:
```bash
cd ~/Projects/archaic-site && npm run preview
```

Open `http://localhost:4321/deeper` — verify the production build renders identically to dev.

---

### Task 4: Verify DjangoShip Gumroad link

**Files:** None — verification only.

- [ ] **Step 1: Confirm the correct Gumroad URL for DjangoShip**

The plan uses `https://faulknco.gumroad.com/l/djangoship` — this needs to be verified against the actual Gumroad listing. Check the DjangoShip project for the real URL:

```bash
grep -ri 'gumroad' ~/Projects/djangoship/ --include="*.md" -l
```

Read any matches to find the canonical Gumroad product URL. If the URL is different, update the `href` in `src/pages/deeper.astro`.

- [ ] **Step 2: Update if needed and commit**

If the URL needed updating:
```bash
cd ~/Projects/archaic-site
git add src/pages/deeper.astro
git commit -m "fix: correct DjangoShip Gumroad link"
```

If no change needed, skip this step.

---

### Task 5: Final review and ship

**Files:**
- Review: `src/pages/index.astro`, `src/pages/deeper.astro`

- [ ] **Step 1: Cross-page consistency check**

Verify that both pages share:
- Same Google Fonts import URL
- Same background image treatment (stone.jpg, same gradient overlay values)
- Same nav styling (font-size, letter-spacing, colors)
- Same footer styling
- Same cursor glow implementation

- [ ] **Step 2: Test navigation flow**

1. Open `http://localhost:4321/` — homepage loads as before
2. Click "Deeper" — navigates to `/deeper`
3. Click the Archaic logo on `/deeper` — navigates back to `/`
4. Click "Deeper" in nav on `/deeper` — stays on `/deeper` (no error)
5. Test all 4 external case study links — each opens in a new tab

- [ ] **Step 3: Test mobile responsiveness**

At 640px viewport width on both pages:
- Nav items don't overflow
- Case study text is readable
- Footer doesn't break
- Cursor glow is hidden

- [ ] **Step 4: Final commit if any adjustments were made**

```bash
cd ~/Projects/archaic-site
git status
# If changes exist:
git add -A
git commit -m "polish: final adjustments from review"
```
