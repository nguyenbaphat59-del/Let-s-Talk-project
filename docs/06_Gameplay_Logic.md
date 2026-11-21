# LET'S TALK — Gameplay and Content-Selection Logic

**Version:** 1.1  
**Status:** Approved target specification  
**Source of truth:** PRD v1.4 + API v1.1 + deployed content groups

## 1. Pool map

For the selected topic, the system uses nine content pools (Pick a Player has two type-specific pools):

| Pool | Database group | Type | Items/topic |
|---|---|---|---:|
| QZ | `question_zone` | question | 100 |
| Truth | `truth` | question | 50 |
| Challenge | `challenge` | challenge | 50 |
| Double Challenge | `double_challenge` | challenge | 50 |
| Everyone Answers | `everyone_answers` | question | 50 |
| Surprise Question | `surprise_question` | question | 50 |
| Pick a Player — Question | `pick_a_player` | question | 20 |
| Pick a Player — Challenge | `pick_a_player` | challenge | 20 |
| Hot Seat | `hot_seat` | question | 50 |

## 2. General selection rules

For each API request:

1. Validate topic code.
2. Validate the used-ID snapshot keys and UUID arrays.
3. Confirm every ID belongs to the selected topic and claimed pool, and is active.
4. Load the active pool items from the correct database group/type.
5. Remove IDs already used in that pool.
6. Build the eligible candidate list.
7. Select uniformly from candidates using a cryptographically secure integer random function.
8. Return selected record(s), pool key, family/subtype, and any participant instructions.
9. Frontend persists newly used IDs before making the activity interactive.

Never fall back from an empty unused list to the full list. Never source a prompt from another content group.

## 3. Automatic main-family selection

The automatic candidate set contains exactly four main families:

- Question Zone
- Pick Your Fate
- Random Event
- Hot Seat

Eligibility:

| Main family | Eligible when |
|---|---|
| Question Zone | QZ has at least 1 unused question |
| Pick Your Fate | Truth or Challenge direct choice has at least 1 unused item; see Mystery eligibility below |
| Random Event | At least 1 Random Event subtype is eligible |
| Hot Seat | Hot Seat pool has at least 1 unused question |

Algorithm:

```text
eligible = [QZ, PickYourFate, RandomEvent, HotSeat] filtered by eligibility
if eligible is empty:
    return NO_ELIGIBLE_ACTIVITY
else:
    selected = secureUniformChoice(eligible)
    return resolve/prepare(selected)
```

Probability is 1/4 (25%) each when all four are eligible. If one or more are unavailable, each remaining candidate gets equal probability. Do not preserve a fixed percentage by selecting exhausted families or reusing content.

## 4. Pick Your Fate

Choice availability:

- Truth direct option: Truth pool has ≥1 unused question.
- Challenge direct option: Challenge pool has ≥1 unused challenge.
- Mystery: both Truth and Challenge pools have ≥1 unused item.

When the user selects Mystery, backend chooses one of two types with a secure 50/50 random decision. It then selects one unused item from the chosen type’s own pool. If the request arrives after the chosen pool is no longer available, return `CONTENT_POOL_EXHAUSTED`; never substitute the other type.

If only one direct option is available, Pick Your Fate is still eligible because that direct option remains usable. Mystery is disabled and the unavailable direct option is disabled. If neither direct option is available, Pick Your Fate is ineligible.

## 5. Random Event selection

Eligibility by subtype:

| Subtype | Availability requirement |
|---|---|
| Double Challenge | ≥2 unused Double Challenge challenges |
| Everyone Answers | ≥1 unused question |
| Surprise Question | ≥1 unused question |
| Pick a Player | ≥1 unused question AND ≥1 unused challenge in its dedicated sub-pools |

Algorithm:

```text
eligibleEvents = all four subtypes filtered by availability
if eligibleEvents is empty:
    RandomEvent is not an eligible main family
else:
    selectedEvent = secureUniformChoice(eligibleEvents)
    if DoubleChallenge:
        select 2 distinct unused challenges
    else if PickAPlayer:
        type = secureUniformChoice([question, challenge])  // exactly 50/50
        select one unused item from that type pool
    else:
        select one unused item from selected subtype pool
```

When all four are eligible each has probability 25%. If one or more are unavailable, probability is equal among the remaining eligible subtypes. This is the intended interpretation of “equal random selection” under exhaustion.

Pick a Player is not eligible when one of its two type pools is empty. This preserves its specified 50/50 ratio rather than silently biasing it toward the remaining type.

Double Challenge returns two distinct content IDs in one response. If only one unused challenge remains, it is excluded; it does not return a one-item partial challenge.

## 6. Hot Seat

Hot Seat participates in the same automatic main-family selection as Question Zone, Pick Your Fate, and Random Event. It is eligible when at least one unused question remains in the selected topic's `hot_seat` pool. When selected, Backend retrieves one unused Hot Seat question and returns it with `activityFamily = hot_seat`, `trigger = automatic`, and the participant instruction.

The group verbally chooses who takes the Hot Seat. No participant ID or player roster is captured, and the application never assigns a person. The participant may answer or Pass.

Pass is Skip: `skippedUnits += 1`, `processedTurns += 1`, `completedUnits` unchanged. The prompt ID remains consumed; do not return it later in the session. If the pool is empty, exclude Hot Seat from the automatic candidate set.

## 7. Question Zone Next Question

When QZ is active and the user requests Next Question:

- select a new unused QZ ID;
- add it to the QZ used-ID list;
- replace current prompt;
- keep the same activity slot and current turn;
- do not change completed, skipped, or processed counters.

The old displayed QZ prompt remains used. The new prompt must not match it or any other previously displayed QZ prompt.

## 8. Progression and session completion

For each completed or skipped activity:

- `processedTurns += 1`;
- on Complete, `completedUnits += 1`;
- on Skip/Pass, `skippedUnits += 1`.

Double Challenge completion increments completed by one, not two.

Finite mode:

```text
if completedUnits >= progressionTarget:
    finish(reason = target_reached)
else if no usable activity remains across all four automatic families:
    finish(reason = content_exhausted)
else:
    return to ready
```

A skipped turn does not satisfy the 10/20 completed target. The number of processed turns may exceed the configured target value.

Unlimited mode:

```text
if user confirms End Game:
    finish(reason = ended_early)
else if at least one of the four automatic families is eligible:
    remain active
else:
    finish(reason = content_exhausted)
```

No fixed completion percentage is displayed in Unlimited.

## 9. Error/exhaustion contract

| Condition | API outcome | UI outcome |
|---|---|---|
| No QZ prompt left | `409 CONTENT_POOL_EXHAUSTED` | Tell user QZ is exhausted; return to eligible choices |
| Truth/Challenge direct pool empty | Choice disabled / 409 on stale request | Explain that choice is unavailable |
| Mystery not possible | `mystery.enabled=false` | Disable Mystery; do not silently skew probability |
| Double Challenge has <2 prompts | Exclude subtype / 409 if stale | Do not start partial event |
| Pick a Player missing one type | Exclude subtype / 409 if stale | Explain unavailable if requested from stale UI |
| Hot Seat pool empty but another family remains | Exclude Hot Seat from candidates | Continue with the remaining eligible families |
| All pools empty | `409 NO_ELIGIBLE_ACTIVITY` | End as content exhausted |
| API unavailable | `503`/network error | Keep session unchanged, show Retry |
| Storage write fails | Local error | Do not unlock or progress activity |

## 10. Randomness and test strategy

- Use secure unbiased random integer selection (Node `crypto.randomInt` or a tested equivalent).
- Do not call `Math.random()` for business-rule selection in the Backend. UI animation may use visual randomness only if it does not change the selected outcome.
- Unit tests must prove eligibility/filter rules deterministically using an injected random source.
- Statistical tests should use large samples and tolerance bounds; never expect exactly 50% or 25% in a small sample.
- Add deterministic tests for 0/1/2/3/4 candidate and exhaustion edge cases.

**Gameplay Logic status: Updated for the v1.4 four-family selection rule.**
