#!/usr/bin/env bash
# LET'S TALK — create labels and the Week-3 backlog issues on GitHub (Task 1d).
#
# Requirements: GitHub CLI authenticated with write access (`gh auth login`).
# Usage:        bash tools/github/create-issues.sh [owner/repo]
#
# Assignees are left empty on purpose: the Leader assigns each issue to the
# owner listed in docs/02_Project_Plan.md §4 after running the script.
# The script is idempotent for labels; running it twice creates duplicate issues.
set -euo pipefail

REPO="${1:-nguyenbaphat59-del/Let-s-Talk-project}"

label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; }
label "task-1"      "5319e7" "Brief Task 1 — Planning & teamwork"
label "task-2"      "1d76db" "Brief Task 2 — User interface"
label "task-3"      "0e8a16" "Brief Task 3 — Database & dynamic content"
label "task-4"      "fbca04" "Brief Task 4 — Optimization & monitoring"
label "task-5"      "d93f0b" "Brief Task 5 — Peer review"
label "frontend"    "c5def5" "Frontend (HTML/CSS/JS)"
label "backend"     "bfdadc" "Express API"
label "database"    "c2e0c6" "Supabase PostgreSQL"
label "docs"        "0075ca" "Documentation"
label "optimization" "f9d0c4" "Lighthouse / performance"
label "monitoring"  "fef2c0" "Google Analytics / Sentry / logs"
label "peer-review" "e99695" "UI/UX peer review"
label "deliverable" "000000" "Submission deliverable"

issue() { # title, labels, body
  gh issue create --repo "$REPO" --title "$1" --label "$2" --body "$3"
}

issue "fix(frontend): align API client tests with Render production base" "task-1,frontend,bug" \
"Two tests in \`frontend/test/api.test.js\` and one check in \`tools/validate-backend.mjs\` still expect the relative \`/api/v1\` base after the API moved to Render (eef76c9).

Branch: \`fix/frontend-api-tests\` · Owner: M4"

issue "perf(frontend): Lighthouse fixes and re-run (fonts, image sizes, LCP priority)" "task-4,optimization,frontend" \
"Implement fixes for render-blocking Google Fonts, unsized images and LCP request discovery without changing the UI or image files; re-run Lighthouse and document the before/after results.

Branch: \`perf/lighthouse-optimization\` · Owner: M4 · Reviewer: M2"

issue "feat(backend): Sentry error monitoring and structured request logs" "task-4,monitoring,backend" \
"Optional SENTRY_DSN, report 5xx with requestId, JSON access log, tests.

Branch: \`feature/analytics-monitoring\` · Owner: M3"

issue "feat(frontend): Google Analytics 4 events and Sentry browser monitoring" "task-4,monitoring,frontend" \
"Implement config.js, monitoring.js and analytics.js, plus the event catalogue in docs/11.

Branch: \`feature/analytics-monitoring\` · Owner: M4"

issue "chore(monitoring): create GA4 property and Sentry projects, fill IDs, capture dashboards" "task-4,monitoring,deliverable" \
"- [ ] GA4 Measurement ID → frontend/js/config.js
- [ ] Sentry Frontend DSN → frontend/js/config.js
- [ ] Sentry Backend DSN → Render env SENTRY_DSN
- [ ] Screenshots of GA Realtime and a Sentry issue → docs/optimization/monitoring/

Owner: M4"

issue "docs: team roles, project plan, CONTRIBUTING, issue/PR templates" "task-1,docs" \
"Branch: \`docs/project-management\` · Owner: M1"

issue "peer-review: UI/UX review for team #1" "task-5,peer-review" \
"Fill section 1 of docs/peer-review/reviews-given.md (Usability, Aesthetics, User-friendliness) and discuss it with the team.

Owners: M1, M2"

issue "peer-review: UI/UX review for team #2" "task-5,peer-review" \
"Fill section 2 of docs/peer-review/reviews-given.md.

Owners: M3, M4"

issue "peer-review: record and handle feedback received from other teams" "task-5,peer-review" \
"Add each feedback item to docs/peer-review/received-feedback.md §4 with a decision, a reason and the commit link. Implemented items need before/after screenshots.

Owner: M2 (+ module owners)"

issue "docs: README following the Report Template + screenshots" "task-1,docs,deliverable" \
"Fill team info, MSSV, video link and screenshots of the main pages/features.

Owner: M1"

issue "docs: self-reports for all members" "deliverable,docs" \
"Each member reviews and commits docs/self-reports/self-report-[MSSV].md from their own account.

Owners: M1–M4"

issue "deliverable: demo video (≤10 min, ≥720p, unlisted)" "deliverable" \
"Cover every task: pages and navigation, interactions, responsive, dynamic data, Lighthouse, GA, Sentry, and peer review.

Owner: M1"

echo "Done. Assign each issue to its owner (docs/02_Project_Plan.md §4)."
