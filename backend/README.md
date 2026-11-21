# LET'S TALK Backend

Express REST API for the LET'S TALK single-device party game.

## Architecture and constraints

- Node.js 20+ and Express 5.
- Supabase PostgreSQL is read-only at runtime through `@supabase/supabase-js`.
- Runtime uses `SUPABASE_PUBLISHABLE_KEY`, which maps to the low-privilege `anon` role under RLS. Do not use a Supabase secret/service-role key.
- No user accounts, player roster, active-session table, usage-history table, or database writes.
- The browser owns active session/progress/used-content snapshots in Local Storage schema v2.
- Frontend requests same-origin `/api/v1/...` endpoints in production.
- Automatic families are Question Zone, Pick Your Fate, Random Event, and Hot Seat. The Backend selects uniformly among eligible families; when all four are eligible, each has a 25% probability.
- No pool fallbacks or reuse. Double Challenge requires two unused items. Pick a Player is eligible only when both its type-specific pools remain available.

## Local setup

1. From the repository root, copy `.env.example` to `.env`.
2. Set:
   - `SUPABASE_URL`
   - `SUPABASE_PUBLISHABLE_KEY`
3. Keep `ALLOWED_ORIGIN` set to the exact local frontend origin, such as `http://localhost:5500,http://127.0.0.1:5500`.
4. Install dependencies from the repository root:

   ```bash
   npm install
   ```

5. Start the API in one terminal:

   ```bash
   npm run dev:backend
   ```

6. Start the static Frontend in another terminal:

   ```bash
   npm run dev:frontend
   ```

7. Open `http://localhost:5500`.

Local API base defaults to `http://localhost:1702/api/v1` when the Frontend is served on port 5500. Override it before loading the page with `window.LT_API_BASE_URL` only when a custom local setup is needed.

## API endpoints

- `GET /api/v1/health`
- `GET /api/v1/topics`
- `GET /api/v1/topics/:topicCode/catalog`
- `POST /api/v1/gameplay/next-activity`
- `POST /api/v1/gameplay/resolve-fate`
- `POST /api/v1/gameplay/question-zone/next`

The authoritative request/response contract is `docs/04_API_Documentation.md` and `docs/openapi.yaml`.

## Tests and checks

From the repository root:

```bash
npm test
npm run validate
npm run validate:step2
npm run validate:backend
npm run check
```

The dependency-free tests use deterministic mock repositories and do not require live Supabase credentials. Express HTTP integration tests are included and run with `npm test` after dependencies are installed. To verify the actual Supabase connection and all nine live pool counts, run `npm --workspace @lets-talk/backend run db:check` with the project's local `.env`. Never paste credentials into chat or commit `.env`.

## Deployment notes

`server.js` exports the Express app and is the backend service entrypoint. Vercel's Express runtime supports a default-exported Express app. The project documentation selected a Vercel Frontend/Backend Services topology, but Vercel Services are currently documented as Private Beta/access-by-request. Treat deployment as a gated spike: prove service access, service roots, route-prefix behavior (`/api` reaches the Backend while retaining the original path), environment setup, preview deployment, and logs before declaring production deployment complete.

For production same-origin routing, configure the Frontend service at `/` and Backend service at `/api` if the Vercel Services feature is enabled for the account. The Express routes already include `/api/v1`; do not strip `/api` in Vercel routing. If Services access is unavailable, do not invent a rewrite configuration—choose a separately deployed Express service plus an explicit Frontend API base URL or reassess the host topology.

## Security checklist

- No service-role/secret key is used or expected.
- Runtime repository methods only issue SELECT queries.
- RLS and SELECT grants on all five approved tables remain required.
- Request bodies are limited to 128 KB.
- Used ID snapshots are validated against selected topic/group/type and capped at 880 unique UUIDs.
- Gameplay endpoints are rate-limited.
- Internal Supabase errors, stack traces, and secrets are never returned to clients.


## Live Supabase verification

After copying the root `.env.example` to `.env` and entering `SUPABASE_URL` plus `SUPABASE_PUBLISHABLE_KEY`, run from the repository root:

```bash
npm --workspace @lets-talk/backend run db:check
```

This read-only check confirms that the two approved topics are active and that every one of the nine pool counts matches the approved 440-item-per-topic inventory (880 total). It does not write to Supabase. Never use a secret/service-role key for this check.
