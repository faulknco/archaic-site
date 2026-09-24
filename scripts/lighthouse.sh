#!/usr/bin/env bash
# Desktop performance run. Usage: scripts/lighthouse.sh [url]   (default http://localhost:4321/)
set -euo pipefail
URL="${1:-http://localhost:4321/}"
mkdir -p .parity
export CHROME_PATH="$(node -e "console.log(require('playwright').chromium.executablePath())")"
npx --yes lighthouse@12 "$URL" --preset=desktop --only-categories=performance \
  --chrome-flags="--headless=new" --output=json --output-path=.parity/lh.json --quiet
node -e '
const r = require("./.parity/lh.json");
const a = r.audits;
const el = a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node?.selector;
const lcp = a["largest-contentful-paint"];
// The homepage hero paints every element at opacity 0 and fades it in, so Chrome
// never records an LCP candidate and Lighthouse scores the whole category 0. Say
// so instead of printing "undefined" and a score that means nothing.
const lcpText = lcp.errorMessage === "NO_LCP"
  ? "NO_LCP (no element ever became an LCP candidate — see the fade-in note in the plan)"
  : lcp.displayValue;
const score = r.categories.performance.score;
console.log(`perf ${score === null ? "n/a" : Math.round(score*100)}  LCP ${lcpText}  FCP ${a["first-contentful-paint"].displayValue}  SI ${a["speed-index"].displayValue}  CLS ${a["cumulative-layout-shift"].displayValue}  LCP element: ${el ?? "none"}`);
'
