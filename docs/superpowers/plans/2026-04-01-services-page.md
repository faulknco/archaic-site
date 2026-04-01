# Services Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/services` page to archaic.ie with three productised service packages and update the nav on all existing pages.

**Architecture:** Single new Astro page (`services.astro`) following the same self-contained pattern as `index.astro` and `deeper.astro` — inline styles, no shared components. Nav updated on both existing pages to add the "Services" link.

**Tech Stack:** Astro, inline CSS, static HTML

---

### Task 1: Create the services page

**Files:**
- Create: `src/pages/services.astro`

- [ ] **Step 1: Create `src/pages/services.astro` with full page content**

Write the complete services page. This is a self-contained `.astro` file with inline `<style>` matching the existing site patterns. The page structure follows `deeper.astro` closely — same nav, background, cursor glow, footer, scroll reveal, and mobile breakpoints.

```astro
---
---
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Services — Archaic</title>
  <meta name="description" content="Fixed-scope software services from a Dublin studio. Django audits, AI readiness reports, and build sprints. No calls, no day rates." />

  <!-- Favicon -->
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />

  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://archaic.ie/services" />
  <meta property="og:title" content="Services — Archaic" />
  <meta property="og:description" content="Fixed-scope software services from a Dublin studio. Django audits, AI readiness reports, and build sprints. No calls, no day rates." />
  <meta property="og:image" content="https://archaic.ie/og.png" />

  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="Services — Archaic" />
  <meta name="twitter:description" content="Fixed-scope software services from a Dublin studio. Django audits, AI readiness reports, and build sprints. No calls, no day rates." />
  <meta name="twitter:image" content="https://archaic.ie/og.png" />

  <!-- Analytics -->
  <script defer data-domain="archaic.ie" src="https://plausible.io/js/script.js"></script>

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
    padding: 120px 0 40px;
  }

  .page-title {
    font-family: 'Cinzel', serif;
    font-size: clamp(28px, 4vw, 48px);
    font-weight: 400;
    color: #e8e4d8;
    letter-spacing: 4px;
    text-transform: uppercase;
  }

  .page-intro {
    font-size: 14px;
    color: #686868;
    line-height: 1.75;
    max-width: 520px;
    margin-top: 24px;
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

  /* ── SERVICE BLOCK ── */
  .service {
    margin-bottom: 72px;
  }

  .service:last-child {
    margin-bottom: 0;
  }

  .service-name {
    font-family: 'Cinzel', serif;
    font-size: clamp(18px, 2.5vw, 24px);
    font-weight: 400;
    color: #e8e4d8;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .service-tagline {
    font-size: 13px;
    color: #686868;
    margin-bottom: 24px;
    font-style: italic;
  }

  .service-body {
    font-size: 13px;
    color: #686868;
    line-height: 1.75;
    margin-bottom: 20px;
  }

  .service-includes {
    list-style: none;
    padding: 0;
    margin-bottom: 24px;
  }

  .service-includes li {
    font-size: 13px;
    color: #686868;
    line-height: 1.75;
    padding-left: 20px;
    position: relative;
  }

  .service-includes li::before {
    content: '\2014';
    position: absolute;
    left: 0;
    color: #333;
  }

  .service-price-from {
    font-size: 11px;
    color: #444;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .service-price {
    font-family: 'Cinzel', serif;
    font-size: 20px;
    color: #e8e4d8;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .service-timeline {
    font-size: 11px;
    color: #444;
    letter-spacing: 1px;
    margin-bottom: 24px;
  }

  .service-cta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #4a4a4a;
    text-decoration: none;
    transition: color 0.3s;
  }

  .service-cta:hover {
    color: #888;
  }

  .service-cta .arrow {
    display: inline-block;
    transition: transform 0.3s ease;
  }

  .service-cta:hover .arrow {
    transform: translateX(6px);
  }

  /* ── HOW IT WORKS ── */
  .how-it-works {
    padding: 60px 0;
    border-top: 1px solid #111;
  }

  .step {
    margin-bottom: 32px;
  }

  .step:last-child {
    margin-bottom: 0;
  }

  .step-number {
    font-family: 'Cinzel', serif;
    font-size: 14px;
    color: #333;
    letter-spacing: 2px;
    margin-bottom: 8px;
  }

  .step-text {
    font-size: 13px;
    color: #686868;
    line-height: 1.75;
  }

  .step-text strong {
    color: #555;
    font-weight: 500;
  }

  /* ── CONTACT CTA ── */
  .contact {
    padding: 60px 0 40px;
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

  .contact-template {
    margin-top: 24px;
    padding: 20px;
    border: 1px solid #151515;
    background: #0a0a0a;
    font-size: 12px;
    color: #555;
    line-height: 1.8;
  }

  .contact-template strong {
    color: #686868;
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

  .footer-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 6px;
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
      align-items: flex-start;
      flex-direction: column;
      gap: 10px;
    }

    .footer-meta {
      align-items: flex-start;
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
      <a class="nav-link" href="/services" style="color:#686868;">Services</a>
      <a class="nav-contact" href="mailto:hello@archaic.ie">hello@archaic.ie</a>
    </div>
  </nav>

  <div class="content">

    <!-- Page header -->
    <header class="page-header">
      <h1 class="page-title">SERVICES</h1>
      <p class="page-intro">Fixed scope. Fixed price. No calls, no day rates. You describe the problem, we deliver the solution — on your timeline, through email.</p>
    </header>

    <!-- Services -->
    <section class="section">
      <p class="section-label">What We Offer</p>

      <article class="service reveal">
        <h2 class="service-name">CODE AUDIT</h2>
        <p class="service-tagline">Find what's broken before your users do</p>
        <p class="service-body">A thorough review of your Django or Python application covering security vulnerabilities, performance bottlenecks, architecture issues, and deployment risks. You get a prioritised report with specific fixes — not vague recommendations.</p>
        <ul class="service-includes">
          <li>Security review (OWASP Top 10, auth, data exposure)</li>
          <li>Performance analysis (queries, caching, load patterns)</li>
          <li>Architecture assessment (maintainability, scaling risks)</li>
          <li>Deployment and infrastructure review</li>
          <li>Prioritised findings with code-level fix suggestions</li>
        </ul>
        <p class="service-price-from">From</p>
        <p class="service-price">&euro;2,500</p>
        <p class="service-timeline">Delivered in 5–7 business days</p>
        <a class="service-cta" href="mailto:hello@archaic.ie?subject=Code%20Audit">
          Request an audit <span class="arrow" aria-hidden="true">→</span>
        </a>
      </article>

      <article class="service reveal">
        <h2 class="service-name">AI READINESS REPORT</h2>
        <p class="service-tagline">Know where AI fits before you spend a cent on it</p>
        <p class="service-body">An honest assessment of where AI and automation can save time in your business — and where it can't. No hype, no vendor pitch. You get a practical roadmap with specific tools, estimated costs, and implementation priorities tailored to your operations.</p>
        <ul class="service-includes">
          <li>Review of your current workflows and pain points</li>
          <li>Identification of high-impact automation opportunities</li>
          <li>Tool and platform recommendations (with costs)</li>
          <li>GDPR and data handling considerations</li>
          <li>Phased implementation roadmap</li>
        </ul>
        <p class="service-price-from">From</p>
        <p class="service-price">&euro;1,500</p>
        <p class="service-timeline">Delivered in 3–5 business days</p>
        <a class="service-cta" href="mailto:hello@archaic.ie?subject=AI%20Readiness%20Report">
          Request a report <span class="arrow" aria-hidden="true">→</span>
        </a>
      </article>

      <article class="service reveal">
        <h2 class="service-name">BUILD SPRINT</h2>
        <p class="service-tagline">From spec to working software, fixed price</p>
        <p class="service-body">A focused build engagement for a clearly scoped product or feature. We agree the specification over email before any work starts. You get production-ready code, deployed and documented — not a prototype that needs another six months.</p>
        <ul class="service-includes">
          <li>Written specification agreed before work begins</li>
          <li>Production-ready Django application or feature</li>
          <li>Automated tests and CI pipeline</li>
          <li>Deployment to Railway, Vercel, or your infrastructure</li>
          <li>30 days of bug fixes after delivery</li>
        </ul>
        <p class="service-price-from">From</p>
        <p class="service-price">&euro;8,000</p>
        <p class="service-timeline">Delivered in 2–4 weeks</p>
        <a class="service-cta" href="mailto:hello@archaic.ie?subject=Build%20Sprint">
          Start a conversation <span class="arrow" aria-hidden="true">→</span>
        </a>
      </article>
    </section>

    <!-- How it works -->
    <section class="how-it-works">
      <p class="section-label">How It Works</p>

      <div class="step reveal">
        <p class="step-number">01</p>
        <p class="step-text"><strong>Email us</strong> — describe what you have, what's not working, and your timeline. We'll reply within one business day.</p>
      </div>
      <div class="step reveal">
        <p class="step-number">02</p>
        <p class="step-text"><strong>We scope it</strong> — we'll ask a few follow-up questions over email and send you a fixed-price proposal. No surprises.</p>
      </div>
      <div class="step reveal">
        <p class="step-number">03</p>
        <p class="step-text"><strong>We deliver</strong> — you get the finished work on the agreed date. Payment on delivery.</p>
      </div>
    </section>

    <!-- Contact CTA -->
    <section class="contact reveal">
      <p class="contact-text">
        Ready to start? Email <a class="contact-link" href="mailto:hello@archaic.ie">hello@archaic.ie</a> with:
      </p>
      <div class="contact-template">
        <strong>What you've built</strong> — a brief description of your product or business<br/>
        <strong>What's not working</strong> — the problem you want solved<br/>
        <strong>Your timeline</strong> — when you need it done by
      </div>
    </section>

  </div>

  <!-- Footer -->
  <footer class="footer">
    <span class="footer-copy">&copy; {new Date().getFullYear()} Archaic Limited</span>
    <div class="footer-meta">
      <span class="footer-location">Registered in Ireland · Co. No. 811858</span>
      <span class="footer-location">7 Marlmount Close, Dundalk, Co. Louth</span>
    </div>
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

- [ ] **Step 2: Verify the build succeeds**

Run: `cd ~/Projects/archaic-site && npm run build`
Expected: Build completes with no errors. Output includes `src/pages/services.astro` in the generated pages.

- [ ] **Step 3: Verify locally in browser**

Run: `cd ~/Projects/archaic-site && npm run dev`
Visit: `http://localhost:4321/services`
Check: Page renders with all 3 services, correct pricing, scroll reveal works, mobile responsive at 640px breakpoint, cursor glow on desktop. All mailto links have correct subjects.

- [ ] **Step 4: Commit**

```bash
cd ~/Projects/archaic-site
git add src/pages/services.astro
git commit -m "feat: add /services page with three productised service packages"
```

---

### Task 2: Add "Services" nav link to homepage

**Files:**
- Modify: `src/pages/index.astro` (nav section, ~lines 398-404)

- [ ] **Step 1: Add Services link to homepage nav**

In `src/pages/index.astro`, find the nav links section:

```html
      <div class="nav-links">
        <a class="nav-link" href="/deeper">Deeper</a>
        <a class="nav-contact" href="mailto:hello@archaic.ie">hello@archaic.ie</a>
      </div>
```

Replace with:

```html
      <div class="nav-links">
        <a class="nav-link" href="/deeper">Deeper</a>
        <a class="nav-link" href="/services">Services</a>
        <a class="nav-contact" href="mailto:hello@archaic.ie">hello@archaic.ie</a>
      </div>
```

- [ ] **Step 2: Verify the build succeeds**

Run: `cd ~/Projects/archaic-site && npm run build`
Expected: Build completes with no errors.

- [ ] **Step 3: Commit**

```bash
cd ~/Projects/archaic-site
git add src/pages/index.astro
git commit -m "feat: add Services nav link to homepage"
```

---

### Task 3: Add "Services" nav link to /deeper page

**Files:**
- Modify: `src/pages/deeper.astro` (nav section, ~lines 418-426)

- [ ] **Step 1: Add Services link to deeper page nav**

In `src/pages/deeper.astro`, find the nav links section:

```html
      <div class="nav-links">
        <a class="nav-link" href="/deeper">Deeper</a>
        <a class="nav-contact" href="mailto:hello@archaic.ie">hello@archaic.ie</a>
      </div>
```

Replace with:

```html
      <div class="nav-links">
        <a class="nav-link" href="/deeper">Deeper</a>
        <a class="nav-link" href="/services">Services</a>
        <a class="nav-contact" href="mailto:hello@archaic.ie">hello@archaic.ie</a>
      </div>
```

- [ ] **Step 2: Verify the build succeeds**

Run: `cd ~/Projects/archaic-site && npm run build`
Expected: Build completes with no errors.

- [ ] **Step 3: Commit**

```bash
cd ~/Projects/archaic-site
git add src/pages/deeper.astro
git commit -m "feat: add Services nav link to /deeper page"
```

---

### Task 4: Final verification

**Files:** None (verification only)

- [ ] **Step 1: Run full build**

Run: `cd ~/Projects/archaic-site && npm run build`
Expected: Build completes with no errors. Three pages generated: `/`, `/deeper`, `/services`.

- [ ] **Step 2: Start dev server and verify all pages**

Run: `cd ~/Projects/archaic-site && npm run dev`

Check each page:
- `http://localhost:4321/` — homepage has Deeper, Services, hello@archaic.ie in nav
- `http://localhost:4321/deeper` — deeper page has Deeper, Services, hello@archaic.ie in nav
- `http://localhost:4321/services` — services page renders fully, Services link has active state (`color:#686868`)
- All mailto links work with correct subjects
- Mobile responsive at 640px on all three pages

- [ ] **Step 3: Verify sitemap includes /services**

Run: `cat ~/Projects/archaic-site/dist/sitemap-0.xml | grep services`
Expected: Output contains `https://archaic.ie/services`
