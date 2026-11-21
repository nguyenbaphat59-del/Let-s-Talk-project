# LET'S TALK — Step 3 Change Inventory

**Date:** 21 November 2026  
**Scope:** Member 3 — Backend Development and Frontend API Integration

## Added

- `backend/` — Express application, configuration, Supabase client, repository, catalog/gameplay services, routes, middleware, offline tests, HTTP integration tests, and live read-only inventory checker.
- `frontend/js/api.js` — shared API client for `/api/v1`.
- `tools/validate-backend.mjs` — repeatable Backend source/security/structure checks.
- `docs/09_STEP3_BACKEND_COMPLETION_REPORT.md` — implementation, verification, and remaining environment gates.
- `docs/10_STEP3_CHANGED_FILES.md` — this inventory.

## Updated

- Root `package.json`, `.env.example`, `.gitignore`, and `README.md` for the npm workspace, local two-process development, validation commands, and secret handling.
- Frontend files were placed under the approved `frontend/` directory while preserving relative website asset paths. Homepage, Gameplay, and Game Completion script wiring now includes the API client.
- `frontend/js/homepage.js`, `frontend/js/session.js`, `frontend/js/gameplay.js`, and `frontend/js/game-complete.js` now use the Backend catalog/selection API and the agreed nine-pool Local Storage session model. These changes are the required Member 3 integration layer; they do not redesign the visual system.
- `frontend/gameplay.html` and `frontend/how-to-play.html` expose all four automatic families, including Hot Seat. The separate manual Hot Seat control and its CSS adjustment have been removed.
- Architecture, API, database, session, roadmap, and Step 2 review documents have had their stale implementation-status statements clarified. The detailed report is `docs/09_STEP3_BACKEND_COMPLETION_REPORT.md`.

## Preserved unchanged

- `frontend/js/storage.js` is byte-for-byte identical to the uploaded Member 1 storage helper.
- `database/schema.sql`, `database/seeds/001_reference_data.sql`, and `database/seeds/002_production_content.sql` are unchanged.
- `frontend/data/questions.json` and `frontend/data/activities.json` are unchanged and remain prototype/reference data only; production gameplay code no longer loads them.
- The main site CSS, images, and existing visual assets are retained. Gameplay CSS removes the obsolete manual Hot Seat spacing rule; the existing four-item roulette layout is reused.

## Not included / not performed

- No `.env`, Supabase URL, API key, database credential, or Vercel secret is included.
- No Supabase migration, schema write, content write, or session write was performed.
- No Vercel deployment, routing configuration, production domain, or production environment was created.

## Hot Seat automatic-family update (21 November 2026)

- Backend: `backend/src/services/gameplay.service.js` now includes Hot Seat in the eligible automatic family set and rejects the retired manual trigger.
- Frontend: `frontend/js/session.js`, `frontend/js/gameplay.js`, and `frontend/gameplay.html` send automatic requests, persist Hot Seat usage in its own pool, reveal it in roulette, and remove the separate manual control.
- Tests and validators: Backend service/HTTP tests, Frontend session tests, and project/Backend validation scripts enforce the four-family behavior.
- Documentation: PRD v1.4, API v1.1, gameplay logic v1.1, architecture, session, traceability, README, and Step 3 reports have been aligned.
- Supabase schema and content seed files remain unchanged.
