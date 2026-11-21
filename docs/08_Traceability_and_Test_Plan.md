# LET'S TALK — Requirements Traceability and Test Plan

**Version:** 1.0  
**Status:** Step 2 test design baseline

## 1. Traceability map

| Requirement area | PRD IDs | Architecture/API/DB reference | Test evidence expected |
|---|---|---|---|
| Page/navigation | FR-01–FR-03, FR-33 | Design System; prototype pages | E2E navigation, informational isolation |
| Topic/setup | FR-03–FR-05 | API `GET /topics`, catalog | UI validation, API catalog, invalid topic |
| Automatic selection | FR-08–FR-09 | Gameplay Logic §3; API next-activity | Unit eligibility + statistical distribution |
| Question Zone | FR-10–FR-11 | API QZ selection; DB QZ pool | No reuse, next-question counter invariance |
| Pick Your Fate | FR-12–FR-14 | API resolve-fate; DB Truth/Challenge | Direct choice, Mystery 50/50, exhaustion |
| Random Event | FR-15–FR-19 | API next-activity; DB four event pools | Equal eligible selection, Double Challenge, Pick Player |
| Hot Seat | FR-20–FR-21, FR-34 | Automatic `next-activity` selection; DB Hot Seat pool | Fourth eligible main family, group chooses participant, Pass=Skip |
| Progression | FR-22–FR-25 | Session Management §5; Gameplay Logic §8 | Complete, Skip, finite target, over-target attempts |
| Unlimited/exhaustion | FR-26–FR-27 | Gameplay Logic §8–9 | Eligibility/exhaustion across all four main families; no reuse |
| Session lifecycle | FR-06–FR-07, FR-28–FR-31 | Session Management §2–9 | Restore, corruption, Exit vs End, Play Again |
| Error states | FR-32 | API §1.3; Session Management §7–8 | 400/404/409/413/429/500/503 and storage failure |
| Data integrity/security | FR-35; NFR-06–NFR-14 | DB Schema §5–6; API §4–5 | SQL validation, RLS/grants, key scan |
| Visual/accessibility | NFR-01,02,09,10; FR-01 | `DESIGN-SYSTEM.md` | Responsive screenshots, keyboard, reduced motion |

## 2. Test layers

### Unit tests

- Pure eligibility helpers for 4 main auto families and 4 Random Event subtypes.
- Secure uniform selection helper tested through injected deterministic RNG.
- Used-ID snapshot validation, topic/group/type ownership, duplicate detection.
- Pick Your Fate and Pick a Player 50/50 rule preconditions.
- Double Challenge requires 2 unique unused prompts.
- Progression counters and finite/unlimited ending predicates.
- Local Storage schema validation, restore, legacy-version handling, and write failure.

### API integration tests

- Health, topics, catalog.
- Every selection endpoint with valid and invalid payloads.
- Wrong-topic, wrong-pool, inactive, duplicate, malformed, and over-limit IDs rejected.
- Each content endpoint returns the correct topic/group/type.
- Supabase unavailability maps to safe 503 response.
- No API endpoint writes session or content records to Supabase.

### Database tests

Run `database/validation/validate_inventory.sql` and `database/validation/security_check.sql` in a privileged SQL Editor context. The assertion script validates total counts, each exact group/type count, mappings, active status, and normalized duplicates. The security script checks RLS, policies, and SQL grants. API-level Data API tests are separate; SQL Editor `has_table_privilege` alone does not prove that the Express environment key is configured correctly.

### End-to-end tests

| ID | Scenario | Expected result |
|---|---|---|
| E2E-01 | Homepage default state | Friends + 10 selected, setup visible |
| E2E-02 | Navigate About/How to Play during an existing session | Session is unchanged |
| E2E-03 | Start Friends 10 | Valid local session initialized; Gameplay opens |
| E2E-04 | Start Family 20 | Only Family content returned |
| E2E-05 | Automatic roulette | QZ, PYF, Random Event, and Hot Seat are the four displayed main families |
| E2E-06 | Hot Seat automatic eligibility | When Hot Seat is the only eligible family, Start Turn returns a Hot Seat question and the group chooses the participant |
| E2E-07 | QZ Next Question | Prompt changes, counters/current turn unchanged |
| E2E-08 | Skip 3 activities in 10 session | Completed remains 0, skipped/processed become 3 |
| E2E-09 | Complete 10 activities with skips interleaved | Ends only at completed=10 |
| E2E-10 | Double Challenge | Two unique items, one completed unit |
| E2E-11 | Pick a Player | 50/50 type; group decides person |
| E2E-12 | Hot Seat Pass | Skipped +1; completed unchanged |
| E2E-13 | Refresh at activity state | Same prompt and session restore |
| E2E-14 | Corrupt Local Storage | Recovery message; no silent replacement |
| E2E-15 | Exit Game | Clears active session and returns Home, no completion |
| E2E-16 | End Game | Goes to completion; current unfinished activity not counted |
| E2E-17 | Play Again | Same topic/length, new session ID, zero counters/used IDs |
| E2E-18 | Exhaust all four main-family paths | Session ends with `content_exhausted`; no separate Hot Seat option remains |
| E2E-19 | Exhaust all pools in Unlimited | Finishes with accurate exhaustion reason |
| E2E-20 | Mobile viewport | No horizontal overflow; controls usable |

## 3. Statistical test guidance

For equal choice among `n` eligible candidates, test a large number of trials (for example 10,000) using a deterministic/injectable RNG for exact branch coverage and a separate empirical statistical test with a pre-agreed tolerance band. Small-sample tests should not require exact 50/50, 1/3, or 1/4 equality.

## 4. Release gate

A release candidate passes only when:

- all PRD v1.4 acceptance criteria are satisfied;
- database inventory and security checks pass;
- API integration tests pass;
- session and gameplay tests pass;
- all five screens pass visual/regression/responsive checks;
- no secret key is included in frontend build or repository;
- Vercel route spike and full deployment pass;
- known trade-offs and recovery behavior are documented.
