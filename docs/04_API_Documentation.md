# LET'S TALK — API Documentation

**Version:** 1.0  
**Status:** Approved contract for Step 3 implementation  
**Base path:** `/api/v1`  
**Transport:** HTTPS in production; JSON request/response  
**Authentication:** None in current release  
**Session storage:** Client-side Local Storage; API is stateless

> These are the target API contracts. The existing ZIP does not contain an Express API yet. Do not mistake this document for an implementation or a live endpoint.

## 1. API conventions

- Frontend calls relative same-origin routes such as `/api/v1/topics`.
- Express owns the full `/api/v1` path because Vercel Services rewrites to Backend without stripping the original path.
- Request and response bodies use UTF-8 JSON.
- All successful responses use a `data` envelope and a request ID in `meta`.
- All errors use a stable machine-readable `error.code` and readable `error.message`.
- The Backend never creates or stores an active game session.
- The Frontend sends the used content IDs per dedicated pool on each content-selection request. The Backend validates every supplied ID against the chosen topic and pool before selecting a new item.
- Maximum JSON request body: 128 KB. Maximum total unique used IDs across all pools: 880.
- All endpoints are read-only with respect to persistent database rows. The API does not expose content write endpoints.

### 1.1 Success response envelope

```json
{
  "data": {},
  "meta": {
    "requestId": "9fd6f8c4-13e6-4b98-9e25-5ed3af4cc772"
  }
}
```

### 1.2 Error response envelope

```json
{
  "error": {
    "code": "CONTENT_POOL_EXHAUSTED",
    "message": "No unused questions remain in the Question Zone.",
    "details": {
      "topicCode": "friends",
      "poolCode": "question_zone"
    },
    "requestId": "9fd6f8c4-13e6-4b98-9e25-5ed3af4cc772"
  }
}
```

### 1.3 HTTP status codes

| Status | Meaning | Example codes |
|---:|---|---|
| 200 | Successful read/selection | `OK` |
| 400 | Invalid parameter/body/enum | `VALIDATION_ERROR`, `INVALID_TOPIC`, `INVALID_USED_IDS` |
| 404 | Topic/route not found | `TOPIC_NOT_FOUND`, `ROUTE_NOT_FOUND` |
| 409 | Valid request but state/pool cannot satisfy it | `CONTENT_POOL_EXHAUSTED`, `NO_ELIGIBLE_ACTIVITY`, `INVALID_ACTIVITY_STATE` |
| 413 | Payload too large | `PAYLOAD_TOO_LARGE` |
| 429 | Rate limit exceeded | `RATE_LIMITED` |
| 500 | Unexpected server error | `INTERNAL_ERROR` |
| 503 | Supabase unavailable or required config missing at runtime | `CONTENT_SERVICE_UNAVAILABLE` |

Never return raw SQL/PostgREST errors, stack traces, environment values, or credentials to the browser.

## 2. Domain enums

```text
topicCode: friends | family
sessionLength: 10 | 20 | unlimited
activityFamily: question_zone | pick_your_fate | random_event | hot_seat
fateChoice: truth | challenge | mystery
randomEventCode: double_challenge | everyone_answers | surprise_question | pick_a_player
contentType: question | challenge
selectionTrigger: automatic | hot_seat_manual
```

Pool codes used in `usedContentIdsByPool`:

```text
question_zone
truth
challenge
double_challenge
everyone_answers
surprise_question
pick_a_player_question
pick_a_player_challenge
hot_seat
```

## 3. Endpoints

### 3.1 `GET /api/v1/health`

Purpose: liveness endpoint for the Express service. Does not expose secrets. It may report application status only; database readiness is checked by the catalog endpoints or a separate internal readiness probe.

Success `200`:

```json
{
  "data": { "status": "ok", "service": "lets-talk-api" },
  "meta": { "requestId": "..." }
}
```

### 3.2 `GET /api/v1/topics`

Purpose: return active product topics and supported session lengths.

Success `200` example:

```json
{
  "data": {
    "topics": [
      { "code": "friends", "name": "Friends" },
      { "code": "family", "name": "Family" }
    ],
    "sessionLengths": [10, 20, "unlimited"]
  },
  "meta": { "requestId": "..." }
}
```

Do not include Love in this release.

### 3.3 `GET /api/v1/topics/:topicCode/catalog`

Purpose: verify topic is active and return active content counts used to determine eligible activities before creating a local session.

Path param: `topicCode` = `friends` or `family`.

Success `200` example (counts below are illustrative; return live active counts):

```json
{
  "data": {
    "topic": { "code": "friends", "name": "Friends" },
    "pools": {
      "question_zone": { "contentType": "question", "available": 100 },
      "truth": { "contentType": "question", "available": 50 },
      "challenge": { "contentType": "challenge", "available": 50 },
      "double_challenge": { "contentType": "challenge", "available": 50 },
      "everyone_answers": { "contentType": "question", "available": 50 },
      "surprise_question": { "contentType": "question", "available": 50 },
      "pick_a_player_question": { "contentType": "question", "available": 20 },
      "pick_a_player_challenge": { "contentType": "challenge", "available": 20 },
      "hot_seat": { "contentType": "question", "available": 50 }
    }
  },
  "meta": { "requestId": "..." }
}
```

The API should return pool counts per content group/type. Counts are not per-session counts; the Frontend subtracts its current used IDs when calculating the active session's remaining availability, and the Backend independently validates on each selection request.

Errors: `400 INVALID_TOPIC`, `404 TOPIC_NOT_FOUND`, `503 CONTENT_SERVICE_UNAVAILABLE`.

### 3.4 `POST /api/v1/gameplay/next-activity`

Purpose: retrieve the next activity selection. It supports automatic roulette or manual Hot Seat.

Request:

```json
{
  "topicCode": "friends",
  "trigger": "automatic",
  "usedContentIdsByPool": {
    "question_zone": [],
    "truth": [],
    "challenge": [],
    "double_challenge": [],
    "everyone_answers": [],
    "surprise_question": [],
    "pick_a_player_question": [],
    "pick_a_player_challenge": [],
    "hot_seat": []
  }
}
```

For manual Hot Seat, set `trigger` to `hot_seat_manual`. The Frontend may send all pool keys; omitted unused keys are treated as empty arrays. Reject unknown pool keys.

Automatic selection rules:

- Candidate families are Question Zone, Pick Your Fate, and Random Event only.
- Hot Seat is excluded from automatic selection.
- Each eligible candidate family has equal probability.
- Question Zone is eligible with at least one unused QZ question.
- Pick Your Fate is eligible if Truth or Challenge is available (the user can choose a valid direct option; Mystery additionally requires both pools).
- Random Event is eligible if at least one sub-activity is eligible under Section 3.5.

Success variants:

**Question Zone**
```json
{
  "data": {
    "activityFamily": "question_zone",
    "content": { "id": "uuid", "contentType": "question", "text": "..." },
    "usedPool": "question_zone"
  },
  "meta": { "requestId": "..." }
}
```

**Pick Your Fate** — return choices/eligibility; do not consume a Truth or Challenge prompt yet:
```json
{
  "data": {
    "activityFamily": "pick_your_fate",
    "requiresChoice": true,
    "choices": {
      "truth": { "enabled": true },
      "challenge": { "enabled": true },
      "mystery": { "enabled": true, "probability": "50/50" }
    }
  },
  "meta": { "requestId": "..." }
}
```

When one pool is exhausted, its direct choice has `enabled:false`; Mystery is enabled only when both Truth and Challenge are enabled. Include a short reason for disabled options.

**Random Event** — the Backend selects the event subtype and its content in the same call:
```json
{
  "data": {
    "activityFamily": "random_event",
    "eventCode": "double_challenge",
    "content": [
      { "id": "uuid-1", "contentType": "challenge", "text": "..." },
      { "id": "uuid-2", "contentType": "challenge", "text": "..." }
    ],
    "usedPool": "double_challenge"
  },
  "meta": { "requestId": "..." }
}
```

The `content` array contains two distinct items only for Double Challenge; all other event subtypes return one item. For Pick a Player, response also includes `selectedContentType` (`question` or `challenge`) and `participantInstruction` stating that the group chooses a person.

**Manual Hot Seat**
```json
{
  "data": {
    "activityFamily": "hot_seat",
    "trigger": "manual",
    "content": { "id": "uuid", "contentType": "question", "text": "..." },
    "usedPool": "hot_seat",
    "participantInstruction": "The group chooses who takes the Hot Seat. The participant may pass."
  },
  "meta": { "requestId": "..." }
}
```

If no automatic family is eligible but Hot Seat has remaining content, return `409 NO_ELIGIBLE_ACTIVITY` with details `{ "manualHotSeatAvailable": true }`; the UI offers manual Hot Seat or End Game. If all pools are exhausted, return `409 NO_ELIGIBLE_ACTIVITY` with `{ "manualHotSeatAvailable": false }`.

Errors: `400 VALIDATION_ERROR`, `400 INVALID_USED_IDS`, `409 NO_ELIGIBLE_ACTIVITY`, `503 CONTENT_SERVICE_UNAVAILABLE`.

### 3.5 `POST /api/v1/gameplay/resolve-fate`

Purpose: resolve a selected Truth, Challenge, or Mystery option and return one unused item.

Request:
```json
{
  "topicCode": "friends",
  "choice": "mystery",
  "usedContentIdsByPool": {
    "truth": [],
    "challenge": []
  }
}
```

- `truth` selects only the Truth question pool.
- `challenge` selects only the Challenge challenge pool.
- `mystery` randomly chooses Truth or Challenge with 50/50 probability, only if both pools have at least one remaining item.
- No silent fallback. If an explicit choice's pool is empty, return `409 CONTENT_POOL_EXHAUSTED`.

Success:
```json
{
  "data": {
    "activityFamily": "pick_your_fate",
    "resolvedChoice": "truth",
    "content": { "id": "uuid", "contentType": "question", "text": "..." },
    "usedPool": "truth"
  },
  "meta": { "requestId": "..." }
}
```

### 3.6 `POST /api/v1/gameplay/question-zone/next`

Purpose: get a replacement QZ prompt while keeping the current activity slot open.

Request:
```json
{
  "topicCode": "friends",
  "usedContentIdsByPool": { "question_zone": ["previously-used-uuid"] }
}
```

Success returns one unused Question Zone item and `usedPool:"question_zone"`. Frontend must persist the new ID. This endpoint does not know or mutate session progress.

Error: `409 CONTENT_POOL_EXHAUSTED` if no QZ item remains.

### 3.7 No session/progression endpoints

There are deliberately no endpoints for Complete, Skip, Pass, Exit Game, End Game, progress, or Play Again. Those actions mutate the client-owned session record only. Play Again calls the catalog endpoint, then creates a new local session and retrieves the next content when gameplay starts.

## 4. Used-ID snapshot contract

Allowed pool keys are exactly:

```json
{
  "question_zone": [],
  "truth": [],
  "challenge": [],
  "double_challenge": [],
  "everyone_answers": [],
  "surprise_question": [],
  "pick_a_player_question": [],
  "pick_a_player_challenge": [],
  "hot_seat": []
}
```

Validation rules:

- Each value must be an array of unique UUID strings.
- Combined count across all arrays must be at most 880.
- An ID may appear in only one pool array.
- Every ID must exist, be active, and belong to the selected topic and corresponding content group/type.
- A group’s used IDs cannot exceed the pool's active size.
- The API must not echo all IDs in responses; return only selected prompt(s) and relevant pool key.

This makes normal session selection deterministic with respect to the client’s saved usage snapshot. It does not make the session tamper-proof against deliberate Local Storage rollback; this is an accepted single-device/no-account trade-off.

## 5. Selection algorithms and security

- Use `crypto.randomInt()` (or equivalent cryptographically secure unbiased integer selection) for main family, Random Event subtype, Mystery, and Pick a Player type.
- Build the candidate list after filtering by availability; select uniformly from that list.
- Do not implement “if empty, choose from the original full pool”.
- Query only active rows and verify group/topic relationship in the repository/service.
- Double Challenge selects two distinct available records without replacement in the same response.
- Validate body size and IDs before querying; rate-limit public endpoints.
- Use same-origin production routing; development CORS allowlist must be explicit.

## 6. Frontend integration sequence

1. Load topics/catalog during setup.
2. Create and persist local session after catalog validation.
3. On Start Turn, request `next-activity` with `trigger=automatic` and used IDs.
4. Persist returned prompt and new used IDs before rendering/advancing UI state.
5. If response says Pick Your Fate, show choice UI; then call `resolve-fate`.
6. If Random Event, render server-selected subtype and returned prompt(s).
7. Hot Seat button calls `next-activity` with `trigger=hot_seat_manual`.
8. Next Question calls the QZ replacement endpoint; it does not advance counters.
9. Complete/Skip/Pass update Local Storage only.

**Machine-readable contract:** `docs/openapi.yaml` (OpenAPI 3.1.0).

**API documentation status: Complete for Step 2; implementation and contract tests are Step 3 work.**
