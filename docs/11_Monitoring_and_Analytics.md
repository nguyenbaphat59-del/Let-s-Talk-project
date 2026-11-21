# LET'S TALK — Monitoring, Logging and Analytics (Task 4b)

**Scope:** Google Analytics 4 (user behaviour), Sentry (error monitoring, Frontend + Backend) and structured Backend logs.
**Status:** Implemented. Both integrations are switched off until the team's real IDs are filled in (Section 2).

## 1. Overview

| Concern | Tool | Where | File(s) |
|---|---|---|---|
| User behaviour | Google Analytics 4 (`gtag.js`) | Browser, all 5 pages | `frontend/js/analytics.js` |
| Frontend errors | Sentry Browser SDK (Loader Script) | Browser, all 5 pages | `frontend/js/monitoring.js` |
| Backend errors | Sentry Node SDK (`@sentry/node`) | Express API | `backend/src/config/monitoring.js`, `backend/src/middlewares/error.middleware.js` |
| Request logs | Structured JSON access log | Express API (Render logs) | `backend/src/middlewares/request-logger.middleware.js` |
| Public IDs | Runtime config | Browser | `frontend/js/config.js` |

Script order on every page: `config.js` → `monitoring.js` → `analytics.js` → (existing) `storage.js` → `api.js` → `session.js` → page script. All are `defer`, so they do not block rendering.

## 2. Configuration

### 2.1 Google Analytics 4

1. analytics.google.com → Admin → Create property "LET'S TALK" → Web data stream with the deployed Frontend URL.
2. Copy the **Measurement ID** (`G-XXXXXXXXXX`).
3. Put it in `frontend/js/config.js` → `gaMeasurementId`.
4. Deploy the Frontend. Verify in GA → Reports → Realtime (or Admin → DebugView).

Analytics is off on `localhost` previews so development clicks do not pollute reports. To test locally, set `analyticsInDevelopment: true` temporarily.

### 2.2 Sentry — Frontend

1. sentry.io → Create project → platform **Browser JavaScript** (e.g. `lets-talk-frontend`).
2. Settings → Projects → `lets-talk-frontend` → Client Keys (DSN) → copy the DSN.
3. Put it in `frontend/js/config.js` → `sentryDsn`.

The DSN is a public identifier designed to be embedded in browser code. `monitoring.js` derives the Loader Script URL (`https://js.sentry-cdn.com/<publicKey>.min.js`) from it.

### 2.3 Sentry — Backend

1. Create a second Sentry project with platform **Node.js / Express** (e.g. `lets-talk-backend`).
2. Add `SENTRY_DSN=<dsn>` to the Backend environment (Render → Service → Environment, and `.env` locally).
3. Restart. The startup log prints `[MONITORING] Sentry error monitoring enabled.`

`SENTRY_DSN` is optional. An invalid value stops startup with a clear message (same fail-fast rule as the Supabase variables).

## 3. Google Analytics events

No personal data is sent: there are no names, no free text and no prompt content.

| Event | When | Parameters |
|---|---|---|
| `page_view` | Every page load (automatic) | page path, title |
| `select_topic` | Topic card clicked (Home) | `topic` |
| `select_session_length` | 10 / 20 / Unlimited clicked | `length` |
| `game_start` | Start Playing | `topic`, `session_length` |
| `intro_skip` | Skip intro on Gameplay | — |
| `turn_start` | Start Turn | — |
| `activity_drawn` | API returned the next activity | `activity_family`, `event_code` (Random Event) |
| `fate_choice` | Truth / Challenge / Mystery chosen | `choice` |
| `next_question` | Question Zone "Next Question" | — |
| `activity_complete` / `activity_skip` | Complete / Skip / Pass | `stage` for Pick Your Fate skip |
| `rules_open` | How to Play modal opened in game | — |
| `game_exit` / `game_end` | Exit confirmed / End Game confirmed | `reason` |
| `game_complete` | Completion page shown (once per session) | `topic`, `session_length`, `end_reason`, `completed`, `skipped` |
| `play_again` / `back_to_home` | Completion page buttons | — |
| `api_error` | Any failed API call | `endpoint`, `error_code`, `http_status` |

Suggested GA explorations for the report: the funnel `game_start → turn_start → activity_complete → game_complete`; `activity_drawn` broken down by `activity_family` (it should be close to 25% each); and the `activity_skip` rate.

How it is implemented: one capture-phase click listener maps the existing button IDs and `data-*` attributes to events, and the API wrapper in `monitoring.js` reports successful activity draws. No gameplay logic was changed.

## 4. Error monitoring and logs

### 4.1 Frontend (Sentry)

- Uncaught exceptions and unhandled promise rejections are captured. Errors raised before the SDK finishes loading are buffered (max 20) and sent once it is ready.
- Every API call goes through a transparent wrapper. Results and thrown errors are unchanged for the page scripts. Each failure is logged with:
  - `endpoint` (e.g. `nextActivity`), `status`, `code`, `durationMs`
  - **`requestId`** from the Backend error envelope
- Expected game states (`NO_ELIGIBLE_ACTIVITY`, `CONTENT_POOL_EXHAUSTED`, `RATE_LIMITED`) are recorded as breadcrumbs and console warnings, not as Sentry issues. Network failures, 5xx responses, unreadable responses and unexpected 4xx codes become Sentry issues tagged `endpoint`, `api_code`, `http_status` and `page`.
- Successful API calls are kept as breadcrumbs, so each issue shows the API calls that led up to it.

### 4.2 Backend (Sentry + logs)

- The centralized error middleware calls `reportError` for unexpected failures (500 `INTERNAL_ERROR`) and for `ApiError`s with status ≥ 500 (e.g. 503 `CONTENT_SERVICE_UNAVAILABLE` when Supabase is unreachable). Client errors (4xx) are not reported.
- Sentry events carry the tags `request_id`, `http.method` and `http.path`. Clients still receive only the safe error envelope: no stack traces and no database messages.
- Every request writes one JSON access-log line (visible in Render → Logs):

```json
{"time":"2026-11-22T10:15:02.114Z","level":"info","requestId":"9b0c…","method":"POST","path":"/api/v1/gameplay/next-activity","status":200,"durationMs":84}
```

- Level is `info` for 2xx/3xx, `warn` for 4xx and `error` for 5xx. Request bodies and headers are not logged.

### 4.3 Tracing one problem end to end

1. A Sentry Frontend issue shows `requestId = 9b0c…` and `endpoint = nextActivity`.
2. Search Render logs (or the Backend Sentry project) for `9b0c…` to find the access-log line and any Backend exception for the same request.

## 5. Verification

| Check | How |
|---|---|
| Automated | `npm test` — `backend/test/monitoring.test.js` (DSN validation, reporter called with requestId on 5xx, never on 4xx, reporter failure is isolated, access-log format) and `frontend/test/monitoring.test.js` (Loader URL from DSN, invalid DSN, wrapper keeps results and errors unchanged, buffering before SDK ready, GA disabled without ID or on localhost, event queueing). |
| Frontend error | With the DSN set, open the deployed site → DevTools console → `setTimeout(() => { throw new Error('Sentry test') })` → the issue appears in Sentry. |
| API error | Stop the Backend (or block the API URL in DevTools → Network request blocking) and click Start Playing → a `NETWORK_ERROR` issue is recorded with `endpoint = getCatalog`. |
| GA | Play one short session on the deployed site → GA Realtime shows `game_start`, `activity_drawn` and `game_complete`. |
| Lighthouse | `gtag.js` is requested only after the `load` event, and the Sentry loader is a small async script, so neither blocks rendering. |

Screenshots of the GA Realtime/DebugView report and of a Sentry issue should be added to `docs/optimization/monitoring/` for the final report.
