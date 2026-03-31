# Archaic.ie — "/deeper" Page Design

**Date:** 2026-03-31
**Status:** Approved

---

## Overview

Add a single new page (`/deeper`) to archaic.ie that surfaces case studies and articles behind the existing minimalist homepage. The homepage stays untouched except for a new "Deeper" nav link. The concept: the homepage is the entrance to the passage tomb — `/deeper` is the chamber inside.

When article volume reaches ~8 posts, migrate to a multi-page structure. Design content formats for clean migration from day one.

---

## Site Structure

### Homepage Changes

- Add "Deeper" link to the nav bar, positioned left of the existing `hello@archaic.ie` mailto link
- Styled identically to the existing nav text (muted grey, Space Grotesk)
- Links to `/deeper`
- No other homepage changes

### /deeper Page

Single long-scroll page with three zones:

1. **Header** — "DEEPER" in Cinzel uppercase, no subtitle or preamble
2. **Work** — 4 case studies
3. **Journal** — articles section (launches empty, articles added over time)
4. **Contact** — closing CTA with email link

### URL Structure (Migration-Ready)

- Case studies use anchor IDs now: `#djangoship`, `#roleup`, `#trueclarity`, `#salaries-ie`
- Articles use anchor IDs now: `#article-slug`
- Future migration: case studies become `/deeper/work/[slug]`, articles become `/deeper/journal/[slug]`
- The `/deeper` page then becomes a hub linking to individual pages

---

## Case Studies

### Format

Each case study follows a consistent inscription-style layout:

```
[PROJECT NAME]          ← Cinzel uppercase
[One-line description]  ← Space Grotesk, body grey

What it is   — 1-2 sentences
What it does — 2-3 key capabilities
Built with   — tech tags as quiet inline text (not pills/badges)
[Link to live site →]
```

No screenshots. Live links are the proof.

### The Four Studies (in order)

1. **DjangoShip** — "SaaS boilerplate for European startups"
   - What it is: Production-ready Django template sold on Gumroad at €249. Ships with Stripe payments, GDPR compliance, team management, and one-click Railway deploy.
   - What it does: Authentication (email + OAuth), subscription billing, API tokens with quota tracking, cookie consent and data export, 150+ automated tests.
   - Built with: Django, Stripe, PostgreSQL, Railway, GitHub Actions
   - Link: Gumroad product page

2. **RoleUp** — "Irish job board with recruiter accountability"
   - What it is: Privacy-first job board where every company gets a public response score based on how they treat candidates.
   - What it does: Recruiter response scoring (0-100), 22 salary data ingestion pipelines, salary benchmarking by role and county, email job alerts, recruiter tier system.
   - Built with: Django, HTMX, Stripe, PostgreSQL, Railway
   - Link: roleup.ie

3. **TrueClarity** — "AI readiness toolkit for Irish SMEs"
   - What it is: Assessment tool and resource hub that helps Irish business owners understand and implement AI, with GDPR compliance and Irish grants guidance baked in.
   - What it does: AI readiness assessment (20 questions, personalised scoring), sector-specific playbooks, 50+ copy-paste prompts for Irish business contexts, vetted tool directory.
   - Built with: Next.js, Supabase, Stripe, Vercel
   - Link: trueclarity.ie

4. **salaries.ie** — "1,019 salary pages from Irish open data"
   - What it is: Programmatic SEO site generating salary comparison pages from CSO open data, broken down by sector, county, and demographics.
   - What it does: Automated data pipelines from Central Statistics Office, per-county and per-sector salary breakdowns, 1,019 statically generated pages.
   - Built with: Astro, Cloudflare Pages, CSO Open Data API
   - Link: salaries.ie

### Ordering Rationale

DjangoShip first (real product with paying customers), RoleUp second (most technically ambitious), TrueClarity third (AI/business angle), salaries.ie fourth (data engineering + SEO).

---

## Journal (Articles)

### Format

- Articles render full-text inline on `/deeper`, below the case studies
- Each article block: title (Cinzel uppercase), date, full article body
- No "read more" truncation — if you're going deeper, you read everything
- Short-form: 300-800 words per article. Dense, opinionated, no padding.

### Content Direction

Two tracks:
- **Technical:** Django patterns, deployment, AI integration, development approaches
- **Business:** Irish tech landscape, lessons from building products, AI adoption for SMEs

### Source Format

- Markdown files in the Astro project
- Rendered at build time (static)
- Frontmatter: title, date, slug

### Launch Plan

Ship `/deeper` with zero articles. The case studies carry the page. Write the first article when there's something worth saying.

### Migration Trigger

When article count reaches ~8, split to individual pages at `/deeper/journal/[slug]`. The `/deeper` page then shows title + first line + link for each article.

---

## Contact CTA

Bottom of `/deeper`. Simple and direct:

> If any of this is relevant to what you're building — [hello@archaic.ie →](mailto:hello@archaic.ie)

No contact form. No Calendly. Consistent with the homepage.

---

## Visual Design

### Inherited from Homepage

- Background: stone.jpg with dark gradient overlay (97%→75% black)
- Headings: Cinzel, uppercase, warm off-white (#e8e4d8)
- Body text: Space Grotesk, mid-grey (#686868)
- Background: near-black (#060606)
- Cursor glow effect (soft radial, 0.8s lag)

### Specific to /deeper

- **No film grain overlay** — distracting with denser content
- **No ghost watermark text** — the homepage has "ARCHAIC", this page lets the work speak
- **Section dividers:** generous whitespace between zones, optionally subtle horizontal lines in #222
- **Tech tags:** quiet inline text in body grey, not colourful pills or badges
- **Scroll reveal animations:** staggered fade-in as sections enter viewport (same feel as homepage entrance sequence, but triggered on scroll)
- **Page header:** "DEEPER" in Cinzel at the top, then content begins — no subtitle, no description

---

## What This Design Does NOT Include

- Service packages or pricing (deferred — revisit when company matures)
- Screenshots or mockups in case studies (live links are the proof)
- Contact form or scheduling tool
- Any changes to the homepage hero, footer, or visual effects
- SEO optimisation or meta tags (add when migrating to multi-page)
- Analytics or tracking beyond what already exists

---

## Success Criteria

- A visitor who clicks "Deeper" immediately understands what Archaic builds and the technical depth behind it
- The page feels like a natural extension of the homepage, not a jarring shift
- Case studies demonstrate range: SaaS product, data platform, AI toolkit, programmatic SEO
- The page works with zero articles (case studies alone justify the page)
- Content format migrates cleanly to individual pages when volume grows
