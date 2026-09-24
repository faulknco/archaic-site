// Loads every page and fails on any console error or page error.
// CSP violations surface as console errors, so run this against the
// Cloudflare Pages preview URL before merging: node scripts/console-check.mjs https://<preview>.pages.dev
//
// It also guards the contact address at the edge. Cloudflare's Email Address
// Obfuscation rewrites every mailto into /cdn-cgi/l/email-protection# plus an
// inline decoder, so with JS off — and for crawlers — the address is gone. The
// setting is off for the archaic.ie zone; these assertions fail loudly if it
// ever comes back. They read the HTML as served, not the live DOM, because the
// decoder restores the address at runtime and would hide the rewrite from us.
import { chromium } from 'playwright';
import { PAGES } from './parity.mjs';

const base = (process.argv[2] || 'http://localhost:4321').replace(/\/$/, '');
const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
let plainMailtos = 0;
page.on('console', (m) => { if (m.type() === 'error') errors.push(`${page.url()} :: ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`${page.url()} :: pageerror ${e.message}`));
for (const path of PAGES) {
  const res = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  const served = await res.text();
  if (/cdn-cgi\/l\/email-protection|__cf_email__|cdn-cgi\/scripts\/[^"']*email-decode/.test(served)) {
    errors.push(`${path} :: mailto rewritten by Cloudflare email obfuscation — turn the zone setting off`);
  }
  // Every page carrying the nav must serve the address as a real mailto link.
  // Keyed off the element, not off a page list, so a new page is covered the
  // day it ships and no exclusion can quietly outlive its reason.
  if (/class="nav-contact"/.test(served)) {
    if (/href="mailto:hello@archaic\.ie"/.test(served)) plainMailtos++;
    else errors.push(`${path} :: has a nav-contact but no plain href="mailto:hello@archaic.ie"`);
  }
  await page.waitForTimeout(500);
}
await browser.close();
// The check above is a no-op on a page with no nav, so prove it was not a no-op
// everywhere: at least one page really did serve the plain address.
if (plainMailtos === 0) errors.push(`no page at ${base} served a plain mailto — the contact assertion went vacuous`);
if (errors.length) { console.error('console errors:\n' + errors.join('\n')); process.exit(1); }
console.log(`ok: no console errors on ${PAGES.length} pages at ${base}; plain mailto on ${plainMailtos}`);
