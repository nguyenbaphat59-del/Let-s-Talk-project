# LET'S TALK

LET'S TALK is an online party-game web application designed for friends and family physically together around one shared browser/device. “Face-to-face” describes the play context; the website itself is online-only.

## Current architecture

- **Frontend:** HTML, CSS, Vanilla JavaScript in `frontend/`.
- **Backend:** Node.js 20+ and Express 5 in `backend/`.
- **Database:** Supabase PostgreSQL, accessed read-only by the Backend through `@supabase/supabase-js`.
- **Session ownership:** Browser Local Storage schema v2. The Backend does not persist sessions, players, turn counts, or usage history.
- **API:** Stateless REST endpoints under `/api/v1`.
- **Content:** 880 production prompts across Friends and Family (640 questions + 240 challenges) stored in Supabase.
- **Prototype JSON:** `frontend/data/` is retained as reference/legacy sample data; production gameplay JavaScript no longer loads those JSON files.

## Project structure

```text
lets-talk/
├── frontend/
│   ├── index.html
│   ├── about.html
│   ├── how-to-play.html
│   ├── gameplay.html
│   ├── game-complete.html
│   ├── css/
│   ├── js/
│   │   ├── api.js
│   │   ├── storage.js
│   │   ├── session.js
│   │   ├── homepage.js
│   │   ├── gameplay.js
│   │   └── game-complete.js
│   ├── data/                 # prototype/reference only
│   ├── assets/images/
│   └── server.mjs            # local static preview only
├── backend/
│   ├── server.js             # Express entrypoint; default export for Vercel
│   ├── package.json
│   ├── README.md
│   ├── src/
│   │   ├── app.js
│   │   ├── config/
│   │   ├── errors/
│   │   ├── middlewares/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── test/
├── database/
├── docs/
├── tools/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Gameplay rules implemented by the API

- Automatic main families are Question Zone, Pick Your Fate, Random Event, and Hot Seat, selected uniformly among currently eligible families. When all four are eligible, each has a 25% probability.
- Hot Seat is part of the automatic roulette; the group verbally chooses the participant and the participant may pass.
- Truth and Challenge use independent pools. Mystery is a secure 50/50 choice only when both pools have remaining content.
- Random Event selects uniformly among eligible subtypes. Double Challenge requires two distinct unused prompts. Pick a Player is available only when both its Question and Challenge pools remain, and its type is selected 50/50; the group chooses the participant verbally.
- Used IDs are validated against the selected topic, group, and content type. No silent pool substitution or reuse is allowed.
- Complete increments Completed and Processed. Skip and Hot Seat Pass increment Skipped and Processed. Next Question consumes another Question Zone item but does not advance progression.
- Finite sessions end only when 10 or 20 activities have been completed. Unlimited ends on full content exhaustion or End Game.

## Local setup

Requirements: Node.js 20+ and npm.

1. Copy `.env.example` to `.env` at the repository root.
2. Set your Supabase project URL and **publishable** key:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
3. For local development, keep `ALLOWED_ORIGIN` set to the exact Frontend origin(s), such as `http://localhost:5500,http://127.0.0.1:5500`.
4. Install workspace dependencies:

   ```bash
   npm install
   ```

5. Start the Backend in Terminal 1:

   ```bash
   npm run dev:backend
   ```

6. Start the Frontend in Terminal 2:

   ```bash
   npm run dev:frontend
   ```

7. Open `http://localhost:5500`.

The Frontend development API client routes requests to `http://localhost:1702/api/v1` when the site is served on port 5500. For another development port or API host, set `window.LT_API_BASE_URL` before the application scripts load.

## API endpoints

- `GET /api/v1/health`
- `GET /api/v1/topics`
- `GET /api/v1/topics/:topicCode/catalog`
- `POST /api/v1/gameplay/next-activity`
- `POST /api/v1/gameplay/resolve-fate`
- `POST /api/v1/gameplay/question-zone/next`

See `docs/04_API_Documentation.md` and `docs/openapi.yaml` for the full contract.

The Member 3 implementation and verification summary is in `docs/09_STEP3_BACKEND_COMPLETION_REPORT.md`; the file-by-file change inventory is in `docs/10_STEP3_CHANGED_FILES.md`.

## Validation and tests

From the repository root:

```bash
npm test                 # full suite, including Express HTTP integration tests
npm run test:offline     # dependency-free service/session/API-client test subset
npm run validate
npm run validate:step2
npm run validate:backend
npm run check            # full check, requires npm install
npm run check:offline    # static checks + dependency-free tests
```

The Backend service, repository, configuration, Frontend API-client, and Local Storage session tests use deterministic mocks and do not require a production Supabase connection. The HTTP integration tests exercise the real Express app and require the dependencies installed by `npm install`. A live Supabase readiness check requires your own `.env` values. Run `npm --workspace @lets-talk/backend run db:check` to verify the read-only connection and exact inventory. No credentials are included in this ZIP. Never paste Supabase credentials into chat or commit `.env`.

## Database

Supabase contains five approved tables:

1. `topics`
2. `gameplay_modes`
3. `content_groups`
4. `content_group_allowed_types`
5. `content_items`

Expected production inventory: 2 topics, 4 gameplay modes, 16 groups, 18 allowed-type mappings, 880 active content items. The application runtime performs SELECT operations only using the publishable key and the existing `anon`-scoped RLS policies. Do not use or introduce a service-role/secret key.

## Deployment status and Vercel

`backend/server.js` exports the Express app for the Vercel Express runtime. The originally selected Frontend/Backend Vercel Services topology is conditional: Vercel documents Services as Private Beta with access by request. Before treating deployment as complete, verify the account has access, confirm service roots and routing, and test `/api/v1/health` in a Preview deployment. The Backend already retains `/api/v1` in its route path; do not strip `/api` at the service boundary.

If Services access is unavailable, use a separately deployed Express service and configure a deliberate API base URL or select another host topology. Do not add an unverified rewrite file.

## Security baseline

- Never commit `.env`.
- Never put Supabase keys in browser JavaScript.
- Runtime uses only the Supabase publishable key and existing read-only RLS grants.
- JSON body limit is 128 KB.
- Gameplay endpoints are rate-limited.
- Every used content ID is a unique UUID validated against its declared active pool.
- Database errors, credentials, and stack traces are not returned to API clients.
