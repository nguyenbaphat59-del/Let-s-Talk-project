#!/usr/bin/env bash
# LET'S TALK — repeatable Lighthouse audit (Task 4a)
#
# Usage:
#   1. npm run dev:backend      (Terminal 1, or any API on http://localhost:1702)
#   2. npm run dev:frontend     (Terminal 2, serves http://localhost:5500)
#   3. bash tools/lighthouse-audit.sh docs/optimization/lighthouse/reports/run-YYYYMMDD
#
# Runs Lighthouse (desktop preset + default mobile emulation) on the static pages
# and prints Performance / Accessibility / Best Practices / SEO plus core metrics.
# CHROME_PATH can point to a specific Chrome/Chromium binary.
set -euo pipefail

OUT="${1:-lighthouse-output}"
BASE_URL="${BASE_URL:-http://localhost:5500}"
mkdir -p "$OUT"

for page in index about how-to-play game-complete; do
  for mode in desktop mobile; do
    extra=""
    [ "$mode" = desktop ] && extra="--preset=desktop"
    npx --yes lighthouse "$BASE_URL/$page.html" $extra --quiet \
      --chrome-flags="--headless=new --no-sandbox" \
      --output=json --output=html --output-path="$OUT/$page-$mode" >/dev/null 2>&1
  done
done

node -e '
const fs = require("fs");
const dir = process.argv[1];
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".report.json")).sort()) {
  const report = JSON.parse(fs.readFileSync(`${dir}/${file}`, "utf8"));
  const c = report.categories;
  const a = report.audits;
  const scores = ["performance", "accessibility", "best-practices", "seo"]
    .map((key) => Math.round(c[key].score * 100)).join(" / ");
  console.log(
    file.replace(".report.json", "").padEnd(22), scores,
    " FCP", a["first-contentful-paint"].displayValue,
    " LCP", a["largest-contentful-paint"].displayValue,
    " TBT", a["total-blocking-time"].displayValue,
    " CLS", a["cumulative-layout-shift"].displayValue
  );
}' "$OUT"
