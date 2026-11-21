# LET'S TALK — Step 3 Implementation Roadmap

**Version:** 1.0  
**Status:** Planning baseline; implementation has not started  
**Prerequisite:** Step 2 package v1.3 approved  
**Working principle:** small, reviewable tasks; preserve the prototype UI; no large unverified AI-generated rewrite.

## 1. Step 3 entry conditions

Before coding:

- PRD v1.3, Architecture v1.3, Database Schema 1.1.0, API 1.0, Session Management 1.0, and Gameplay Logic 1.0 are the source of truth.
- The current Supabase schema, reference data, and production content have been deployed and manually verified by the project owner.
- Repository structure and ownership are agreed.
- Vercel Services deployment spike is the first platform task; production deployment design remains conditional until it passes.

## 2. Phase 0 — Repository baseline and deployment spike

### Tasks
1. Create/confirm the single GitHub repository.
2. Create target `frontend/`, `backend/`, `database/`, `docs/`, `tools/` layout.
3. Move existing website source files into `frontend/` preserving all relative paths (HTML, CSS, JS, images, local JSON). Keep the current static `server.mjs` inside `frontend/` for local preview only.
4. Keep database SQL and docs at repository root as shown in `02_Solution_Architecture.md`.
5. Add root `.gitignore`, `.env.example`, and top-level README; never commit `.env` or secrets.
6. Run existing validator and browser smoke test after moving frontend; update its paths only where necessary.
7. Build the smallest possible Express health endpoint in a spike branch.
8. Test one Vercel Project with Frontend and Backend Services, path routing `/` and `/api/v1/health`, service roots, Express entrypoint, environment variables, preview deployment, logs, and failed-build behavior.

### Exit criteria
- All 5 existing pages and assets serve correctly from `frontend/`.
- `/api/v1/health` reaches Express and does not fall through to static hosting.
- Vercel routing/service topology is proven. If not, stop and reassess before building the full Backend.

## 3. Phase 1 — Backend foundation

1. Create `backend/package.json` with Node >=20 and required dependencies only (`express`, `@supabase/supabase-js`, validation library only if justified, security middleware).
2. Create environment validation (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `PORT`, optional dev `ALLOWED_ORIGIN`).
3. Create Express app, request ID middleware, JSON body limit, explicit CORS dev config, not-found middleware, and centralized error handler.
4. Create Supabase client server-side using the publishable key.
5. Create repository modules for topics and content.
6. Add health and topic/catalog endpoints.
7. Add unit tests for config, error envelope, parameter validation, and repository mapping.

### Exit criteria
- Missing environment variables fail with a clear startup error and no secret is logged.
- Health route responds.
- Topic list returns Friends/Family.
- Catalog endpoint returns 9 pool counts for one topic.
- No frontend code imports Supabase SDK or reads Supabase keys.

## 4. Phase 2 — Gameplay API and deterministic business rules

1. Implement used-ID snapshot validator and pool membership verification.
2. Implement secure uniform selection helper with injectable random source.
3. Implement automatic main-family eligibility and selection (3 families only).
4. Implement QZ retrieval and Next Question.
5. Implement Pick Your Fate choice metadata and resolver.
6. Implement Random Event eligibility/resolution, including Double Challenge two-item rule and Pick a Player 50/50.
7. Implement manual Hot Seat endpoint trigger.
8. Implement exhaustion and unavailable responses.
9. Add unit tests for every selection rule and edge case.

### Exit criteria
- All API examples in `04_API_Documentation.md` pass schema tests.
- No test can select used IDs, wrong-topic IDs, inactive content, or wrong-group types.
- Hot Seat cannot be selected by automatic roulette API trigger.
- Probability tests use tolerance and seeded/injected randomness.

## 5. Phase 3 — Frontend integration and session refactor

1. Move Frontend source into `frontend/` while retaining page styles and structure.
2. Replace prototype local JSON selection with calls to relative `/api/v1` endpoints.
3. Refactor `session.js` into Local Storage schema v2; preserve global integration points or update all call sites consistently.
4. Refactor `gameplay.js`: only 3 automatic families; add manual Hot Seat control; remove fallback-to-used content; add group-specific pools.
5. Implement current progress model: completed target separate from skipped/processed turns.
6. Implement Mystery eligibility, Random Event eligibility, Double Challenge IDs, Pick a Player type pool, and Hot Seat Pass=Skip.
7. Persist new content IDs/current prompt before showing active controls.
8. Implement error, loading, exhaustion, stale-session, and Local Storage failure feedback.
9. Update How to Play to explain manual Hot Seat and final rules.
10. Keep completion screen minimal; do not add session statistics or Choose Another Topic.

### Exit criteria
- All PRD v1.3 functional requirements pass manual and automated checks.
- No content group pulls from another group.
- Refresh restores the same current activity.
- Every Complete/Skip/Pass is committed once.

## 6. Phase 4 — Quality and regression

### Unit tests
- Selection eligibility and probability helper.
- Used-ID validator and group membership.
- Finite/unlimited progression.
- Next Question behavior.
- Local Storage schema, restore, corruption, and failure handling.
- API response/error shape.

### Integration tests
- Supabase read and topic filtering.
- API catalog and selection.
- Wrong-topic/wrong-group ID rejection.
- Empty/exhausted pools.
- Double Challenge two-item selection.
- Pick Your Fate and Pick a Player 50/50 eligibility.

### End-to-end tests
- Friends 10 session with all activities represented via deterministic test fixtures.
- Family 20 session.
- Unlimited exhaustion including manual Hot Seat remaining.
- Next Question does not advance progress.
- Complete and Skip accounting.
- Hot Seat pass.
- Exit Game vs End Game.
- Play Again and Back to Home.
- Refresh while ready, awaiting fate, and activity active.
- Mobile/tablet/desktop visual regression and keyboard navigation.

## 7. Phase 5 — Deployment and release readiness

1. Configure Vercel environment variables in Preview and Production.
2. Verify Vercel rewrite and service roots again after code integration.
3. Verify Supabase read access using the publishable key, not a secret key.
4. Run database inventory assertion and security check.
5. Run npm/project checks, backend test suite, API integration suite, and E2E suite.
6. Test browser Local Storage persistence and behavior across reloads.
7. Human playtest all 880 prompt items for tone, repetition by meaning, appropriateness, and readability.
8. Record known limitations and rollback procedure.

### Release gate
- No P0 bugs.
- All 26 PRD acceptance criteria pass.
- API and RLS verification pass.
- Deployment spike and production deployment pass.
- No credentials committed or exposed.
- No scope additions without written decision.

## 8. AI Coding Agent operating protocol

For every task passed to an AI Coding Agent:

1. State exact source files allowed to change.
2. Point to the relevant PRD/API/DB requirement IDs.
3. Require the agent to inspect existing files before editing.
4. Ask for a short plan before code changes.
5. Implement one bounded feature/vertical slice.
6. Require a list of changed files and reasons.
7. Require unit/integration tests and commands run.
8. Review the diff; reject unrelated redesign or extra dependencies.
9. Run tests locally before merging.

Never ask the agent to “finish the whole project” in one prompt. Do not combine database changes, Backend logic, and UI redesign in one task.

**Roadmap status: Complete as a Step 2 planning deliverable. Coding remains Step 3.**
