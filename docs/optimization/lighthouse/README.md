# LIGHTHOUSE AUDIT REPORT
## LET'S TALK – Web Design and Development Final Project

## 1. Overview

This report presents the Lighthouse audit results of the LET'S TALK web application.

The purpose of the audit is to evaluate the website's Performance, Accessibility, Best Practices, and SEO in both Desktop and Mobile environments.

The audits were conducted locally using Google Chrome DevTools Lighthouse.

## 2. Testing Environment

| Item | Description |
|---|---|
| Application | LET'S TALK |
| Testing URL | http://localhost:5500/ |
| Testing Tool | Google Chrome DevTools Lighthouse |
| Testing Date | November 21, 2026 |
| Testing Environments | Desktop and Mobile |
| Audit Mode | Navigation |

## 3. Latest Lighthouse Results

### 3.1 Desktop Audit

| Category | Score |
|---|---:|
| Performance | 94 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

### 3.2 Mobile Audit

| Category | Score |
|---|---:|
| Performance | 71 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

## 4. Desktop and Mobile Comparison

| Category | Desktop | Mobile |
|---|---:|---:|
| Performance | 94 | 71 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

The latest results show that Desktop achieved a Performance score of 94, while Mobile achieved 71.

Both environments achieved perfect scores in Accessibility, Best Practices, and SEO.

The difference in Performance scores indicates that the mobile experience has more room for improvement in loading performance.

## 5. Detailed Performance Metrics

The following detailed metrics were captured in the earlier audit screenshots.

### 5.1 Desktop Metrics

| Metric | Recorded Result |
|---|---:|
| First Contentful Paint (FCP) | 1.0 s |
| Largest Contentful Paint (LCP) | 1.6 s |
| Total Blocking Time (TBT) | 0 ms |
| Cumulative Layout Shift (CLS) | 0.003 |

### 5.2 Mobile Metrics

| Metric | Recorded Result |
|---|---:|
| First Contentful Paint (FCP) | 2.9 s |
| Largest Contentful Paint (LCP) | 7.9 s |
| Total Blocking Time (TBT) | 0 ms |
| Cumulative Layout Shift (CLS) | 0 |

Note: These detailed metrics are retained from the previously captured audit screenshots. The latest screenshots confirm the category scores but do not display updated detailed metrics.

## 6. Identified Performance Issues

The detailed audit screenshots identified the following potential optimization opportunities.

### 6.1 Desktop Findings

| Issue | Estimated Potential Savings |
|---|---:|
| Improve image delivery | 1,051 KiB |
| Render-blocking requests | 660 ms |
| Reduce unused CSS | 69 KiB |
| Minify CSS | 7 KiB |
| Minify JavaScript | 4 KiB |
| Document request latency | 3 KiB |

Additional findings:
- LCP request discovery.
- Network dependency tree.
- Image elements without explicit width and height attributes.
- One non-composited animation element.

### 6.2 Mobile Findings

| Issue | Estimated Potential Savings |
|---|---:|
| Improve image delivery | 1,043 KiB |
| Render-blocking requests | 1,680 ms |
| Reduce unused CSS | 66 KiB |
| Minify CSS | 7 KiB |
| Minify JavaScript | 4 KiB |
| Document request latency | 3 KiB |

Additional findings:
- LCP request discovery.
- Network dependency tree.
- Image elements without explicit width and height attributes.
- Minimize main-thread work: 5.0 s.
- Optimize DOM size.
- One non-composited animation element.

These values are Lighthouse estimates and diagnostic findings, not measured optimization results.

## 7. Evaluation

### 7.1 Performance

The latest Desktop audit achieved a Performance score of 94, while Mobile achieved 71.

The earlier detailed audit identified image delivery, render-blocking requests, and unused CSS as potential areas for improvement.

The Mobile audit also recorded a Largest Contentful Paint of 7.9 seconds, indicating that mobile loading performance deserves further attention.

### 7.2 Accessibility

Both Desktop and Mobile achieved a score of 100.

This indicates that the tested pages passed the accessibility checks included in the Lighthouse audits.

### 7.3 Best Practices

Both environments achieved a score of 100, indicating that the tested pages passed the evaluated Lighthouse best-practice checks.

### 7.4 SEO

Both environments achieved a score of 100, indicating that the tested pages passed the evaluated Lighthouse SEO checks.

## 8. Optimization Decision

The team reviewed the Lighthouse findings and identified several opportunities to improve performance, particularly image delivery and render-blocking resources.

For this evaluation, the team decided to record the current audit results without making additional performance modifications.

Therefore, this report documents the current Lighthouse assessment and does not claim that performance optimization improvements have been implemented.

> **Update (22/11/2026):** This section records the decision at the time of the first audit. The optimizations that were implemented afterwards, and the re-run results, are documented in Section 10.

## 9. Conclusion

The latest Lighthouse results show that LET'S TALK achieved strong scores in Accessibility, Best Practices, and SEO across both Desktop and Mobile environments.

The latest Performance scores were 94 on Desktop and 71 on Mobile.

Although the website achieved a strong Desktop Performance score, mobile loading performance remains an area for potential improvement.

The audit screenshots are retained in the project repository as supporting evidence for the optimization evaluation.


## 10. Optimization Implemented and Re-run (Task 4a)

### 10.1 Scope

The optimization pass followed two team constraints:

- The approved UI must look exactly the same.
- The image files themselves are **not** changed (no conversion, compression or resizing of `lets-talk-logo.png`).

The changes therefore target how resources are discovered and loaded, not the resources themselves.

### 10.2 Issues and fixes

| Lighthouse finding | Fix applied | Files |
|---|---|---|
| Render-blocking requests (Google Fonts stylesheet) | Fonts stylesheet is preloaded and applied asynchronously (`rel="preload"` + `media="print" onload="this.media='all'"`), with a `<noscript>` fallback. The fonts already used `display=swap`, so text rendering behaviour is unchanged. | all 5 HTML pages |
| Image elements without explicit `width` and `height` | Logo `<img>` elements declare their intrinsic size (`width="1200" height="957"`). CSS still controls the rendered size, so the layout is identical, but the browser can reserve space earlier. | `index.html`, `about.html`, `how-to-play.html`, `game-complete.html`, `gameplay.html` |
| LCP request discovery (`fetchpriority=high should be applied`) | The LCP image (homepage mascot) is preloaded with `fetchpriority="high"` and the `<img>` itself carries `fetchpriority="high"`. The header logo uses the same file, so the preload is what lets the browser fetch it with high priority. | `index.html`, `game-complete.html` |

Visual regression check: full-page screenshots of all 5 pages were captured at 375×812, 768×1024 and 1440×900 before and after the change and compared pixel by pixel. No visible difference was found (maximum 2 anti-aliasing pixels per screenshot).

### 10.3 Before / after (same machine, same method)

Both runs used Lighthouse 13 in headless Chrome against the local preview (`npm run dev:frontend` on port 5500 with a local API on port 1702). Command: `bash tools/lighthouse-audit.sh <output-folder>`.

> These numbers come from a different machine and network profile than the screenshots in Sections 3–5, so they are compared only with each other.

| Page / device | Performance before → after | FCP before → after | LCP before → after | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|---|
| Home — Mobile | 75 → 76 | 1.5 s → 1.3 s | 7.8 s → 7.9 s | 100 | 100 | 100 |
| Home — Desktop | 96 → 96 | 0.4 s → 0.3 s | 1.4 s → 1.4 s | 100 | 100 | 100 |
| About — Mobile | 100 → 100 | 1.5 s → 1.3 s | 1.5 s → 1.3 s | 100 | 100 | 100 |
| How to Play — Mobile | 99 → 100 | 1.6 s → 1.3 s | 1.6 s → 1.3 s | 100 | 100 | 100 |

Audit status after the fixes (Home, Mobile):

| Audit | Before | After |
|---|---|---|
| Image elements have explicit width and height | Failed | **Passed** |
| LCP request discovery | Failed | **Passed** |
| Render-blocking requests | 890 ms estimated savings | 620 ms (only `css/site.css` remains, which is required for first paint) |
| Improve image delivery | ~1,037 KiB | ~1,037 KiB (unchanged — image files intentionally not modified) |

Full HTML reports: `reports/before/` and `reports/after/` (open in a browser).

### 10.4 Remaining limitation

First Contentful Paint improved by about 0.2–0.3 s on every page, and the Lighthouse findings related to loading order are resolved. The homepage mobile LCP stays around 7–8 s because the LCP element is the 1,060 KB `lets-talk-logo.png` (1200×957) displayed at about 250 px wide on mobile. The single change that would move mobile Performance above 90 is serving a compressed/resized WebP copy of that image; the team chose not to modify image assets in this iteration.
