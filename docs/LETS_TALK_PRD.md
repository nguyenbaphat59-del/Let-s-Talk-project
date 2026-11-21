# LET'S TALK — Product Requirements Document (PRD)

**Version:** 1.3  
**Status:** Step 2 baseline — consolidated and ready for implementation planning  
**Date:** 21 November 2026  
**Supersedes:** PRD v1.2 for current requirements  
**Primary references:** latest frontend prototype ZIP, Wireframe Master Specification v1.0, confirmed project decisions, deployed Supabase schema/content evidence.

> This document defines the product behavior to implement. The existing frontend is a visual and interaction prototype; its current JavaScript behavior is not automatically the final business logic. The source PRD v1.2 is retained as `LETS_TALK_PRD_v1.2_ARCHIVE.md` for traceability. Where this document records an explicit decision, it supersedes conflicting prototype or older-document behavior.

---

## 1. Product definition

LET'S TALK is a responsive web application for face-to-face conversation and party activities. Friends or family members are physically together and operate one shared browser/device. The application provides prompts and activity flows; participants decide among themselves who answers or performs an activity.

The application is **online-only** in its current target architecture. “Face-to-face” describes the play context; it does not promise offline website loading or offline-first/PWA behavior. Internet connectivity is required to load the hosted application and retrieve content through the Backend API.

### 1.1 Product goals

1. Make it easy for a group to start a conversation game without registration.
2. Provide varied questions and light group challenges through four recognizable gameplay families.
3. Keep topic and activity content pools independent, predictable, and non-repeating within a session.
4. Make progression, skipping, exhaustion, exit, and early ending understandable.
5. Preserve the approved prototype’s distinctive visual identity and interaction direction.

### 1.2 Target users and play context

| Group | Need | Product implication |
|---|---|---|
| Friends | Fun, surprising prompts and group activities | Fast setup, playful reveal, low-friction controls |
| Couples | Conversation prompts that encourage sharing | Calm, non-coercive wording; no score or competition |
| Families | Accessible prompts suitable for different generations | Clear language, ability to skip/pass, one-device controls |

“Couples” is a target audience, not a third topic. The initial topic catalog contains **Friends** and **Family** only. Love is not part of the current release.

### 1.3 Product principles

- One shared device; no online multiplayer or synchronized devices.
- No account, sign-in, player profile, player roster, or participant identity capture.
- No scoring, winners, leaderboard, or competitive rating.
- No content reuse within the active session’s dedicated pool.
- The interface explains exactly what Complete, Skip, Next Question, Exit, End Game, and Pass do.
- Visual effects support the prompt; they never make the prompt or controls harder to read.

## 2. Product scope

### 2.1 In scope

- Homepage and Game Setup section.
- Separate About and How to Play pages.
- Gameplay and Game Completion views.
- Topics: Friends and Family.
- Session length: 10 completed activities, 20 completed activities, or Unlimited.
- Main gameplay families: Question Zone, Pick Your Fate, Random Event, and Hot Seat.
- Dedicated content groups and exhaustion behavior.
- Local session persistence in browser Local Storage.
- Express REST API for catalog/content selection.
- Supabase PostgreSQL content catalog and 880 production content items.
- Responsive desktop, tablet, and mobile layouts.

### 2.2 Out of scope for this release

User accounts/authentication, remote multiplayer, game rooms, chat, realtime synchronization, participant roster/name capture, scoring, winners, leaderboard, payment, player statistics/history, admin content management UI, music/audio, fullscreen controls, Previous Question, PWA/offline-first guarantee, and persistent game/session/usage records in the database.

### 2.3 Five pages/views

| Page/view | Purpose | Primary actions |
|---|---|---|
| Homepage + Game Setup | Explain the product and configure a game without a separate setup page | Select topic, select length, Start Playing |
| About | Explain the product story, problem, solution, mission, and Mimi/brand identity | Go to Game Setup |
| How to Play | Teach the real activity rules and controls | Go to Game Setup |
| Gameplay | Run the shared-device session | Start Turn, activity actions, Hot Seat, Rules, Exit, End Game |
| Game Completion | Close the experience emotionally and offer next steps | Play Again, Back to Home |

About and How to Play must remain separate. Opening either page must not create, modify, or clear an active session. “Go to Game Setup” returns to the Homepage setup section; it must not auto-start a game.

## 3. Game setup and session lifecycle

### 3.1 Game setup

- Exactly one topic is selected: `friends` or `family`.
- Exactly one session length is selected: `10`, `20`, or `unlimited`.
- Default selection: Friends + 10, matching the latest prototype behavior unless the user has previously saved another valid setup.
- Start Playing is disabled while initialization is in progress and duplicate submissions are prevented.
- A failed catalog/API check leaves the user on Homepage, displays a readable message, and allows retry. It must not create a partial active session.

### 3.2 Definition of a progression unit

One activity is one progression unit, even when the activity contains multiple prompts. Double Challenge displays two distinct challenges but counts as one activity when completed.

- **Complete:** `completedUnits += 1`; `processedTurns += 1`; advance to the next idle state.
- **Skip:** `skippedUnits += 1`; `processedTurns += 1`; completed count does not change; advance.
- **Question Zone → Next Question:** mark the displayed QZ content ID as used and replace the prompt; do not change completed, skipped, processed turn, or progress target.
- **Hot Seat → Pass:** the current Hot Seat activity is treated as Skip. It increments skipped and processed counts, but not completed units.
- An activity can be committed only once. Duplicate taps or repeated events must not increment counters twice.

### 3.3 Finite sessions

The `10` and `20` options represent a target number of **completed activities**, not a target number of attempts or processed turns.

The session completes when `completedUnits === progressionTarget`. Skipped activities consume an attempt but do not satisfy the target. Therefore a 10-completion session may process more than 10 activities if some are skipped.

If no eligible content remains before the target is reached, the session ends as `content_exhausted`; it must not fabricate completion of the remaining units or reuse content.

### 3.4 Unlimited session

Unlimited has no configured target and no fixed completion percentage. It continues until the user chooses End Game or no usable content remains in any activity path. When all automatic activities are exhausted but Hot Seat still has available prompts, the idle state must offer manual Hot Seat or End Game. The session is exhausted only when all automatic activity paths and the manual Hot Seat pool are unavailable.

### 3.5 Exit and End Game are different

| Action | Confirmation | Confirmed result | Cancel result |
|---|---|---|---|
| Exit Game | Warns that the active session will be cleared | Clear active session and return to Homepage; no completion screen | Close dialog; preserve session |
| End Game | Warns that current incomplete activity is not counted | End early and show Game Completion; retain previously completed count internally | Close dialog; preserve current activity |

## 4. Gameplay rules

### 4.1 Automatic activity selection

The random reveal/roulette automatically chooses among **three** families only:

1. Question Zone
2. Pick Your Fate
3. Random Event

When all three are eligible, each has an equal probability of 1/3. If one family is exhausted or cannot currently provide valid content, exclude it and choose uniformly from the remaining eligible families. **Hot Seat is not in the roulette.** It is activated manually from a separate Hot Seat control in the Gameplay idle state.

The roulette animation is presentation only. The Backend chooses the result; the animation must settle on that exact result and must not independently re-randomize.

### 4.2 Question Zone

- Retrieves one unused `question` from the selected topic’s `question_zone` group.
- Displays a single prompt for group discussion.
- Actions: Next Question, Complete, Skip.
- Next Question retrieves a different unused QZ prompt without consuming the activity turn or changing progression.
- If the pool is exhausted, show a clear exhaustion message and return to the idle state/eligible activity path. Never reuse a previously displayed QZ prompt.

### 4.3 Pick Your Fate

Displays three choices: Truth, Challenge, Mystery.

| Choice | Source pool | Rule |
|---|---|---|
| Truth | `truth` / question | One unused Truth question; never from Question Zone |
| Challenge | `challenge` / challenge | One unused Challenge prompt; never from Double Challenge |
| Mystery | Resolves to Truth or Challenge | 50/50 selection, then one unused item from the resolved dedicated pool |

Mystery is selectable only when both the Truth and Challenge pools have at least one unused item. If either pool is exhausted, disable Mystery with a brief explanation; do not silently bias Mystery toward the remaining type. Direct Truth or Challenge is independently enabled/disabled according to its own pool availability. If a selected direct choice has become unavailable, return a typed exhaustion response, not content from another pool.

### 4.4 Random Event

Random Event is selected as one main family. The Backend then chooses among its four dedicated sub-activities:

| Sub-activity | Dedicated group | Eligibility |
|---|---|---|
| Double Challenge | `double_challenge` / challenge | At least 2 unused challenges |
| Everyone Answers | `everyone_answers` / question | At least 1 unused question |
| Surprise Question | `surprise_question` / question | At least 1 unused question |
| Pick a Player | `pick_a_player` / question + challenge | At least 1 unused item in both type pools |

When all four are eligible, each has an equal probability of 25%. When some are unavailable, exclude them and choose uniformly among the remaining eligible sub-activities. Do not silently substitute content from another group.

**Double Challenge:** display two distinct challenge prompts at the same time. Completing both counts as one completed activity. It is not eligible if fewer than two unused items remain.

**Everyone Answers:** show one question and invite everyone present to answer.

**Surprise Question:** show one unexpected question from its own independent pool.

**Pick a Player:** choose Question vs Challenge with equal 50/50 probability. The group chooses the person; the application never selects or assigns a player. This event is not eligible if either of its two content-type pools is empty, because the specified 50/50 ratio can no longer be maintained.

### 4.5 Hot Seat — manual only

- The user starts Hot Seat manually from the Gameplay idle state; it is never selected by the automatic roulette.
- The group verbally chooses who sits in the Hot Seat. No name or participant identity is entered into the application.
- Retrieve one unused question from the selected topic’s `hot_seat` group.
- The selected participant may answer or Pass.
- Pass is finalized as Skip: one processed turn and one skipped count, no completed increment. The same prompt is not repeated.
- If Hot Seat has no unused question, disable the manual control and show a neutral exhaustion message.

## 5. Content model and inventory

There are 8 independent content groups per topic, 16 total.

| Content group | Type | Friends | Family | Total |
|---|---|---:|---:|---:|
| Question Zone | Question | 100 | 100 | 200 |
| Truth | Question | 50 | 50 | 100 |
| Challenge | Challenge | 50 | 50 | 100 |
| Double Challenge | Challenge | 50 | 50 | 100 |
| Everyone Answers | Question | 50 | 50 | 100 |
| Surprise Question | Question | 50 | 50 | 100 |
| Pick a Player | Question + Challenge | 20 + 20 | 20 + 20 | 80 |
| Hot Seat | Question | 50 | 50 | 100 |
| **Total** |  | **440** | **440** | **880** |

Totals by type: **640 questions** and **240 challenges**.

Content rules:

- Topic isolation: Friends sessions never retrieve Family content, and vice versa.
- Each topic/group/type pool is independent. An item in one group cannot satisfy another group’s request.
- Used content IDs are tracked separately by pool in the active Local Storage session.
- No reuse within a session. Next Question also consumes the newly displayed question from the QZ pool.
- Double Challenge must return two different IDs.
- New content must be active and attached to a valid group/type mapping.
- Exact normalized duplicate text is blocked globally by the database unique index; semantic near-duplicates require editorial review.
- Production content language is English, consistent with current prototype content.

## 6. User journeys

### 6.1 Discover and navigate
Homepage → About or How to Play → read content → return to Homepage / Game Setup. No session mutation occurs on informational pages.

### 6.2 Start a session
Homepage → choose Friends/Family → choose 10/20/Unlimited → Start Playing → validate topic/catalog and connectivity → initialize Local Storage state → Gameplay. If initialization fails, show an actionable error and remain on setup.

### 6.3 Automatic turn
Gameplay Idle → Start Turn → Backend selects one eligible automatic family → roulette reveals that family → if Pick Your Fate, user chooses Truth/Challenge/Mystery → prompt appears → Complete or Skip → persist state → next Idle or Game Completion.

### 6.4 Hot Seat turn
Gameplay Idle → Hot Seat (manual) → group verbally chooses participant → Hot Seat prompt → Answer/Complete or Pass/Skip → persist state → next Idle or Game Completion.

### 6.5 Restore
Reload/reopen → validate active Local Storage session → restore the same valid current activity and counters. Do not silently start a new session or silently discard corrupted state. For invalid/old schema, explain that the saved game cannot be restored and require the user to choose Start New Game.

### 6.6 Completion
Reached 10/20 completed units, user End Game, or full exhaustion → Game Completion. Play Again starts a fresh randomized session with the same topic and length. Back to Home clears the finished session and returns to Homepage.

## 7. Screen and interaction requirements

### 7.1 Homepage + Game Setup
Use the current prototype’s hero, navigation, brand art, topic cards, session-length cards, clear selected states, and Start Playing. Keep the main composition within the target laptop viewport where practical; on mobile, stack brand/hero above setup and permit vertical scrolling.

### 7.2 About
Include product introduction, problem/disconnect, solution, mission, Meet Mimi/brand identity, and a clear Go to Game Setup action. Keep a dedicated About visual background and readable text contrast.

### 7.3 How to Play
Explain the face-to-face shared-device context, topic/session-length setup, Start Turn, the three automatic families and manual Hot Seat, Truth/Challenge/Mystery, all four Random Event sub-activities, Next Question, Complete, Skip, Hot Seat Pass, Exit, End Game, exhaustion, and completion/replay. Must describe the actual final rules in this document, not the prototype’s outdated random Hot Seat behavior.

### 7.4 Gameplay
Preserve cinematic intro, skip-intro control, Universe/reveal visual, activity theater, HUD, Rules modal, Exit modal, and End Game modal. Add a distinct manual Hot Seat control in Idle without redesigning the visual language. Make automatic roulette visually show only Question Zone, Pick Your Fate, and Random Event. Prompt text is the primary visual element.

Progress display must distinguish completed units from skipped/processed turns. For finite sessions, show `Completed x/10` or `Completed x/20` and separately show skipped/processed counts. Do not label a processed-turn index as completed progress. For Unlimited, show counts without a fixed percentage.

### 7.5 Game Completion
The agreed completion composition is intentionally minimal:

- LET'S TALK logo/mascot.
- Eyebrow: **SESSION COMPLETE**.
- Heading: **Great Conversations!**
- One short, positive, non-competitive subtitle. It may vary for normal completion, early ending, or exhaustion, but must remain celebratory and accurate.
- **PLAY AGAIN** — new session, same topic and length, all progress/content-use tracking reset.
- **BACK TO HOME** — clear completed-session state and return to Homepage.
- Closing line: **The questions may end, but the memories stay.**

Do not add a session-statistics panel, scores, winners, or a Choose Another Topic CTA to the current completion screen. This is a final product decision that supersedes older PRD/Wireframe proposals. The current prototype completion HTML already closely matches this visual direction.

## 8. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Render Homepage, About, How to Play, Gameplay, Game Completion as five distinct views/pages | P0 |
| FR-02 | Keep Game Setup within Homepage | P0 |
| FR-03 | Support Friends and Family only | P0 |
| FR-04 | Support session lengths 10, 20, Unlimited | P0 |
| FR-05 | Validate setup and catalog availability before starting | P0 |
| FR-06 | Persist active session in Local Storage | P0 |
| FR-07 | Restore a valid active session after reload | P0 |
| FR-08 | Select QZ/PYF/Random Event uniformly among eligible families | P0 |
| FR-09 | Keep Hot Seat out of roulette and expose manual activation | P0 |
| FR-10 | Retrieve an unused QZ prompt from the correct topic/group | P0 |
| FR-11 | Next Question changes only the QZ prompt and usage list | P0 |
| FR-12 | Retrieve Truth from its dedicated question group | P0 |
| FR-13 | Retrieve Challenge from its dedicated challenge group | P0 |
| FR-14 | Resolve Mystery with 50/50 probability when both outcomes eligible | P0 |
| FR-15 | Select Random Event sub-activity uniformly among eligible options | P0 |
| FR-16 | Double Challenge returns two distinct prompts and consumes one activity | P0 |
| FR-17 | Everyone Answers returns one dedicated question | P0 |
| FR-18 | Surprise Question returns one dedicated question | P0 |
| FR-19 | Pick a Player resolves Question/Challenge 50/50 and never assigns a person | P0 |
| FR-20 | Hot Seat is manually activated; the group chooses the participant | P0 |
| FR-21 | Hot Seat Pass is processed as Skip | P0 |
| FR-22 | Complete increments only completed units by one | P0 |
| FR-23 | Skip increments skipped and processed by one, not completed | P0 |
| FR-24 | Prevent double submission of activity completion/skip | P0 |
| FR-25 | Finite session ends at completed target 10 or 20 | P0 |
| FR-26 | Unlimited ends only on full content exhaustion or explicit End Game | P0 |
| FR-27 | Exclude unavailable pools and never reuse content | P0 |
| FR-28 | Exit clears the active session after confirmation | P0 |
| FR-29 | End Game finishes early without counting the current incomplete activity | P0 |
| FR-30 | Play Again resets state and retains topic/session length | P0 |
| FR-31 | Back to Home clears completed session state | P0 |
| FR-32 | Render loading, API error, empty, exhausted, and storage-error states | P0 |
| FR-33 | About/How to Play do not mutate an active session | P1 |
| FR-34 | Add visible manual Hot Seat control in Gameplay Idle | P0 |
| FR-35 | Do not expose any Supabase key in frontend source | P0 |

## 9. Non-functional requirements

| ID | Area | Requirement / target |
|---|---|---|
| NFR-01 | Responsive | No horizontal overflow at desktop, tablet, and mobile breakpoints. |
| NFR-02 | Usability | Primary action and current prompt remain clear; touch targets should be comfortably tappable (target 44×44 CSS px where practical). |
| NFR-03 | Performance | Cached/static page assets should load promptly; content API target p95 < 800 ms under the initial expected load, to be measured during Step 3. |
| NFR-04 | Reliability | Do not progress state until activity transition and updated session state are safely persisted. |
| NFR-05 | Storage | Handle disabled/full/corrupt Local Storage visibly; never silently claim the session was saved. |
| NFR-06 | Security | Supabase publishable key is server-side in this design; never include secret/service-role key in browser bundle. |
| NFR-07 | Database | RLS enabled; runtime role has SELECT only; no anonymous write privileges. |
| NFR-08 | API | Validate route params, enums, UUIDs, request size, used-ID count, and pool ownership. |
| NFR-09 | Accessibility | Keyboard-operable dialogs, visible focus, semantic controls, `aria-live` for meaningful feedback, and focus return after modal close. |
| NFR-10 | Motion | Respect `prefers-reduced-motion`; intro can be skipped and animations must not block action. |
| NFR-11 | Maintainability | Modular Express monolith; repository layer isolates Supabase queries; business rules are unit-testable. |
| NFR-12 | Compatibility | Modern evergreen browsers with ES modules/Fetch/Local Storage support. |
| NFR-13 | Privacy | No participant names or personal profiles collected. |
| NFR-14 | Data integrity | Enforce exact group/type mapping, topic separation, and unique IDs; exact duplicate text blocked in DB. |

The API p95 target is a proposed engineering target, not a measured result. It must be validated against the deployed stack and adjusted if actual usage indicates a different target.

## 10. Data and session requirements

### 10.1 Persistent database content

PostgreSQL stores only topic/catalog metadata and reusable content. It does not store active sessions, participants, progress, usage history, or player-level results.

### 10.2 Local session data

The browser stores the active session, setup selection, current activity, completed/skipped/processed counters, and used content IDs by pool. A schema version is required. The authoritative shape is in `05_Session_Management.md`.

### 10.3 Content exhaustion

- A pool with zero unused items is unavailable.
- Double Challenge is unavailable with fewer than two unused items.
- Mystery is unavailable unless both Truth and Challenge are available.
- Pick a Player is unavailable unless both its Question and Challenge pools are available.
- Main families and Random Event options are sampled uniformly only from currently eligible options.
- No automatic reset/reuse at exhaustion.
- A finite session that cannot reach its completed target due to exhaustion ends honestly with `content_exhausted`.

## 11. Acceptance criteria (release gate)

1. Homepage presents only Friends and Family, and 10/20/Unlimited.
2. About and How to Play are separate and do not create/change session state.
3. New session starts only after valid topic/catalog data is available.
4. Roulette contains only Question Zone, Pick Your Fate, and Random Event.
5. Hot Seat is available by an explicit manual control and never appears as an automatic selection.
6. Main family selection is uniform over eligible families; tests verify distribution with tolerance, not exact equality in a small sample.
7. Each activity retrieves content only from its correct topic/group/type.
8. Used items are not returned again in the same session/pool.
9. Next Question consumes a new QZ item but does not advance progress or processed turn.
10. Mystery has 50/50 outcomes only when both Truth and Challenge have inventory; it is disabled otherwise.
11. Random Event subtypes are uniform across eligible subtypes; Double Challenge requires two distinct prompts.
12. Pick a Player preserves 50/50 type selection when both type pools are non-empty; participants choose the person.
13. Hot Seat participant is chosen verbally; Pass increments Skip, not Completed.
14. Complete increments completed exactly once; Skip increments skipped/processed exactly once.
15. A 10/20 session completes only at 10/20 completed activities, irrespective of additional skipped attempts.
16. Unlimited has no target percentage and ends only on full exhaustion or End Game.
17. Exhaustion never triggers silent cross-pool substitution or content reuse.
18. Exit and End Game have distinct confirmation outcomes.
19. Play Again retains topic/length but resets session ID, progress, and used IDs.
20. Completion screen matches the minimal agreed composition and contains no stats panel or Choose Another Topic CTA.
21. Reload restores a valid session; corrupt/old version is explained and requires explicit reset.
22. Local Storage failure blocks progression and is shown to the user.
23. Frontend has no direct Supabase connection or Supabase keys.
24. API uses the documented `/api/v1` contract and same-origin path.
25. Supabase has 5 approved tables, 2 topics, 4 gameplay modes, 16 groups, 18 mappings, 880 active content items, correct RLS, and read-only anon grants.
26. Existing approved visual language and responsive behavior are preserved; UI regression tests pass.

## 12. Dependencies, risks, and assumptions

### Dependencies
- Supabase project and content schema are available.
- API service and same-origin route are reachable during play.
- Browser Local Storage is available.
- Vercel Services deployment spike validates the two-service topology before production lock-in.

### Risks
- Prototype JavaScript is question-bank oriented and conflicts with multi-pool rules.
- Local Storage is client-controlled and cannot provide tamper-proof session history without adding server persistence/authentication.
- Vercel Services remains Beta; routing/configuration must be proven with a spike.
- Exact text duplicate protection does not eliminate semantic near-duplicates; editorial review remains required.

### Explicit trade-offs
- This product prioritizes low-friction single-device use over anti-cheat guarantees. Backend validates all used IDs against topic/group membership and the browser persists used IDs, but a user deliberately editing/rolling back Local Storage is outside the current threat model.
- No database session table is created. Losing browser storage may make the active session unrecoverable.

## 13. Revision record

| Version | Date | Change |
|---|---|---|
| 1.2 | 20 Nov 2026 | Previous consolidated requirements baseline; archived unchanged. |
| **1.3** | **21 Nov 2026** | Reconciled current prototype and latest decisions; Hot Seat manual; 3 automatic families; resolved Pass=Skip; corrected finite progression and exhaustion; finalized completion screen; aligned Supabase PostgreSQL and Vercel target architecture; separated prototype behavior from production requirements. |

---

**PRD v1.3 status: Complete for Step 2.** Implementation is not claimed complete. Requirements are ready to be traced into architecture, API, session/gameplay design, and Step 3 tests.
