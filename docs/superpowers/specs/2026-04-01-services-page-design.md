# Services Page — archaic.ie/services

**Date:** 2026-04-01
**Status:** Approved

---

## Summary

Add a dedicated `/services` page to archaic.ie that positions Archaic Limited as a fixed-scope, fixed-price software studio. The page offers three productised service packages, all engaged via email — no calls, no day rates.

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Page location | `/services` (new standalone page) | Clean URL to share, separates services from portfolio (`/deeper`) and brand (`/`) |
| Layout style | Editorial (vertical sections) | Matches `/deeper` aesthetic, feels premium, room to explain each service |
| Pricing display | "From €X" starting prices shown | Filters tyre-kickers, signals transparency, "from" gives upward flexibility |
| Intake process | Structured email template | Zero infrastructure, no form backend, guides the client without a call |
| Target audience | Irish-first, international welcome | Irish positioning as differentiator (GDPR, compliance, timezone) but don't exclude international |

## Page Structure

### 1. Nav

Add "Services" link to the nav bar on all pages, between "Deeper" and "hello@archaic.ie".

### 2. Page Header

- Title: `SERVICES` (Cinzel, uppercase, matching `/deeper` header)
- Intro: "Fixed scope. Fixed price. No calls, no day rates. You describe the problem, we deliver the solution — on your timeline, through email."

### 3. Service Listings

Section label: "What We Offer"

Each service follows this structure:
- Service name (Cinzel heading, uppercase)
- Tagline (italic, one line)
- Description paragraph
- "What you get" bullet list (dash-prefixed)
- "From" label + price (Cinzel, large)
- Timeline
- Email CTA with `mailto:` link and pre-filled subject

#### Service 1: Code Audit

- **Tagline:** "Find what's broken before your users do"
- **Description:** Thorough review of Django/Python application — security, performance, architecture, deployment. Prioritised report with specific code-level fixes.
- **Includes:**
  - Security review (OWASP Top 10, auth, data exposure)
  - Performance analysis (queries, caching, load patterns)
  - Architecture assessment (maintainability, scaling risks)
  - Deployment and infrastructure review
  - Prioritised findings with code-level fix suggestions
- **Price:** From €2,500
- **Timeline:** 5–7 business days
- **CTA:** "Request an audit →" → `mailto:hello@archaic.ie?subject=Code%20Audit`

#### Service 2: AI Readiness Report

- **Tagline:** "Know where AI fits before you spend a cent on it"
- **Description:** Honest assessment of where AI/automation helps and where it doesn't. Practical roadmap with tools, costs, and implementation priorities.
- **Includes:**
  - Review of current workflows and pain points
  - Identification of high-impact automation opportunities
  - Tool and platform recommendations (with costs)
  - GDPR and data handling considerations
  - Phased implementation roadmap
- **Price:** From €1,500
- **Timeline:** 3–5 business days
- **CTA:** "Request a report →" → `mailto:hello@archaic.ie?subject=AI%20Readiness%20Report`

#### Service 3: Build Sprint

- **Tagline:** "From spec to working software, fixed price"
- **Description:** Focused build engagement for a clearly scoped product or feature. Spec agreed over email before work starts. Production-ready, deployed, documented.
- **Includes:**
  - Written specification agreed before work begins
  - Production-ready Django application or feature
  - Automated tests and CI pipeline
  - Deployment to Railway, Vercel, or your infrastructure
  - 30 days of bug fixes after delivery
- **Price:** From €8,000
- **Timeline:** 2–4 weeks
- **CTA:** "Start a conversation →" → `mailto:hello@archaic.ie?subject=Build%20Sprint`

### 4. How It Works

Section label: "How It Works"

Three numbered steps:

1. **Email us** — describe what you have, what's not working, and your timeline. We'll reply within one business day.
2. **We scope it** — we'll ask a few follow-up questions over email and send you a fixed-price proposal. No surprises.
3. **We deliver** — you get the finished work on the agreed date. Payment on delivery.

### 5. Contact CTA

"Ready to start? Email hello@archaic.ie with:"

Structured template box (dark background, bordered):
- **What you've built** — a brief description of your product or business
- **What's not working** — the problem you want solved
- **Your timeline** — when you need it done by

### 6. Footer

Same footer as all other pages (© 2026 Archaic Limited, company number, registered address).

## Styling

All styling matches the existing site:

- Background: `#060606` with stone texture and gradient overlay
- Headings: Cinzel, `#e8e4d8`
- Body text: Space Grotesk, `#686868`
- Section labels: 9px uppercase, `#2e2e2e`, with dash prefix
- CTAs: 10px uppercase, `#4a4a4a`, arrow on hover
- Scroll reveal animation on each service block
- Cursor glow effect (desktop only)
- Mobile responsive (single column, reduced padding)

## Nav Updates (All Pages)

Add "Services" link to the nav on:
- `index.astro` (homepage)
- `deeper.astro`
- `services.astro` (new page, active state)

Nav order: Logo | Deeper | Services | hello@archaic.ie

## SEO

- Title: "Services — Archaic"
- Description: "Fixed-scope software services from a Dublin studio. Django audits, AI readiness reports, and build sprints. No calls, no day rates."
- OG image: existing `/og.png`
- Page included in sitemap via existing `@astrojs/sitemap` integration

## What This Does NOT Include

- No form backend or contact form
- No Stripe/payment integration
- No new content collections
- No changes to `/deeper` content or homepage hero
- No new fonts or design system changes
