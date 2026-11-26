# Lecturer Feedback and Improvement Process

## 1. Initial Feedback – Prototype 1

During the first prototype review, the lecturer acknowledged that the team had a good direction and a clear concept for the website. However, the visual interface and gameplay experience were considered too simple and not engaging enough.

The main feedback focused on two areas:

- **User Interface:** The visual design needed more attention to create a more attractive and engaging experience.
- **Gameplay Experience:** The gameplay was too basic and lacked excitement, which could make users feel bored during the game.

## 2. Improvements – Prototype 2

Based on the lecturer's feedback, the team revised the prototype with a stronger focus on visual design and gameplay interaction.

The improvements included:

- Improving the overall visual design, layout, and color scheme.
- Adding animations and visual effects to make interactions more engaging.
- Improving the question selection and gameplay flow.
- Creating a more enjoyable and interactive experience for players.

## 3. Re-evaluation

After presenting the second prototype, the lecturer considered the revised direction acceptable.

This feedback confirmed that the changes addressed the main concerns raised during the first review. The team therefore continued developing the project based on the approved prototype direction.

## 4. Feedback Log (Task 5b — Report Template format)

> Add every feedback item received from the lecturer and from the reviewing teams. Implemented items should link the commit/PR and include before/after screenshots (`docs/peer-review/screenshots/`). Items that are not implemented must state the reason.

| # | Feedback | Source | Decision | Reason / Commit |
|---|---|---|---|---|
| 1 | The user interface of Prototype 1 is too simple and not engaging. | Lecturer (Prototype 1 review) | ✅ Implemented | Prototype 2 redesigned the visual layer (glass panels, gradients, mascot artwork, animations). Commit `738ed76` |
| 2 | The gameplay is too simple and not exciting enough. | Lecturer (Prototype 1 review) | ✅ Implemented | Four automatic activity families (Question Zone, Pick Your Fate, Random Event, Hot Seat), a cinematic intro and a roulette reveal (PRD v1.4). Commits `738ed76`, `a6bc8c3` |

**Feedback from other teams:** on 26/11/2026 the team asked FocuSpace (in FocuSpace#164) and Thai Tu Fashion (in thai_tu_fashion#51) to review Let's Talk. As of 26/11/2026 no feedback has been received. Items will be added here verbatim, with a link, decision and PR, when they arrive.

### Decision rules agreed by the team

- Feedback that improves usability or accessibility without changing the approved gameplay rules is implemented first.
- Feedback that conflicts with the PRD (e.g. adding accounts, scores or online multiplayer, which PRD §1.3 rules out) is not implemented, and the reason is recorded above.
- Each implemented item gets its own issue, branch (`fix/peer-feedback-<n>`) and PR that references the issue.
