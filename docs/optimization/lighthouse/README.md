# LIGHTHOUSE AUDIT REPORT
## LET'S TALK – Web Design and Development Final Project

## 1. Overview

This report presents the Lighthouse audit results of the LET'S TALK web application.

The purpose of the audit is to evaluate the website's performance, accessibility, best practices, and search engine optimization (SEO) in both Desktop and Mobile environments.

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

## 3. Lighthouse Results

### 3.1 Desktop Audit

| Category | Score |
|---|---:|
| Performance | 93 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

#### Performance Metrics

| Metric | Result |
|---|---:|
| First Contentful Paint (FCP) | 1.0 s |
| Largest Contentful Paint (LCP) | 1.6 s |
| Total Blocking Time (TBT) | 0 ms |
| Cumulative Layout Shift (CLS) | 0.003 |

#### Identified Performance Issues

| Issue | Estimated Potential Savings |
|---|---:|
| Improve image delivery | 1,051 KiB |
| Render-blocking requests | 660 ms |
| Reduce unused CSS | 69 KiB |
| Minify CSS | 7 KiB |
| Minify JavaScript | 4 KiB |
| Document request latency | 3 KiB |

Other findings:
- LCP request discovery.
- Network dependency tree.
- Image elements without explicit width and height attributes.
- One non-composited animation element.

### 3.2 Mobile Audit

| Category | Score |
|---|---:|
| Performance | 71 |
| Accessibility | 100 |
| Best Practices | 100 |
| SEO | 100 |

#### Performance Metrics

| Metric | Result |
|---|---:|
| First Contentful Paint (FCP) | 2.9 s |
| Largest Contentful Paint (LCP) | 7.9 s |
| Total Blocking Time (TBT) | 0 ms |
| Cumulative Layout Shift (CLS) | 0 |

#### Identified Performance Issues

| Issue | Estimated Potential Savings |
|---|---:|
| Improve image delivery | 1,043 KiB |
| Render-blocking requests | 1,680 ms |
| Reduce unused CSS | 66 KiB |
| Minify CSS | 7 KiB |
| Minify JavaScript | 4 KiB |
| Document request latency | 3 KiB |

Other findings:
- LCP request discovery.
- Network dependency tree.
- Image elements without explicit width and height attributes.
- Minimize main-thread work: 5.0 s.
- Optimize DOM size.
- One non-composited animation element.

## 4. Desktop and Mobile Comparison

### 4.1 Lighthouse Scores

| Category | Desktop | Mobile |
|---|---:|---:|
| Performance | 93 | 71 |
| Accessibility | 100 | 100 |
| Best Practices | 100 | 100 |
| SEO | 100 | 100 |

### 4.2 Performance Metrics Comparison

| Metric | Desktop | Mobile |
|---|---:|---:|
| FCP | 1.0 s | 2.9 s |
| LCP | 1.6 s | 7.9 s |
| TBT | 0 ms | 0 ms |
| CLS | 0.003 | 0 |

The results show a noticeable difference in loading performance between Desktop and Mobile.

Mobile has a higher FCP and LCP, indicating that the page takes longer to display its initial content and largest content element under the tested mobile conditions.

Both environments recorded a Total Blocking Time of 0 ms and very low Cumulative Layout Shift values.

## 5. Evaluation

### 5.1 Performance

The Desktop audit achieved a Performance score of 93, while Mobile achieved 71.

The most notable issue is the Mobile Largest Contentful Paint of 7.9 seconds.

Both audits identified image delivery and render-blocking requests as potential optimization opportunities.

These findings suggest that image loading and resource delivery are important areas for future performance improvements.

### 5.2 Accessibility

Both Desktop and Mobile achieved a score of 100.

This indicates that the tested pages passed the accessibility checks included in these Lighthouse audits.

### 5.3 Best Practices

Both environments achieved a score of 100, indicating that the tested pages passed the evaluated Lighthouse best-practice checks.

### 5.4 SEO

Both environments achieved a score of 100, indicating that the tested pages passed the evaluated Lighthouse SEO checks.

## 6. Optimization Decision

Based on the audit results, the team identified several performance optimization opportunities, particularly in image delivery, render-blocking resources, and CSS usage.

For this evaluation, the team decided to document the current Lighthouse results without making additional performance modifications.

Therefore, the scores in this report represent the current audit results and should not be interpreted as post-optimization improvements.

## 7. Conclusion

The Lighthouse audit provided an overview of the current quality of the LET'S TALK web application across Desktop and Mobile environments.

The application achieved perfect scores in Accessibility, Best Practices, and SEO in both environments.

The Performance scores were 93 on Desktop and 71 on Mobile. The Mobile LCP of 7.9 seconds indicates that loading performance on mobile devices remains an area for potential improvement.

The audit results and screenshots are retained as supporting evidence for the project's optimization evaluation.
