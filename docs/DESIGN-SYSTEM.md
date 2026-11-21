# LET'S TALK — Design System Baseline

**Version:** 1.0  
**Source:** `css/site.css`, `css/gameplay.css`, five HTML pages, and approved visual direction.  
**Purpose:** preserve the current visual identity while the prototype is connected to production services.

## 1. Visual identity

- Overall: modern, premium, warm, playful, with cinematic treatment concentrated in Gameplay.
- Base atmosphere: dark purple/blue with soft lavender, pink, and blue accents.
- Surfaces: translucent glass panels, backdrop blur, restrained borders, soft shadows and subtle inner highlights.
- Brand: current LET'S TALK logo/mascot artwork; preserve proportions, whitespace, contrast, and existing asset paths.
- Voice: welcoming, social, concise, non-competitive. Avoid scorekeeping, winner language, humiliating copy, or pressure.

## 2. Core color tokens

These tokens are read from the current CSS custom properties; new components should reuse them rather than introducing unrelated colors.

| Token | Current value | Usage |
|---|---|---|
| `--bg` | `#10072f` | Main dark background |
| `--bg-2` | `#170b43` | Secondary background |
| `--surface` | `rgba(25, 12, 67, .72)` | Glass surface |
| `--surface-strong` | `rgba(25, 12, 67, .88)` | Stronger glass surface |
| `--surface-soft` | `rgba(44, 30, 84, .58)` | Soft panel |
| `--purple` | `#7b35e8` | Primary purple |
| `--violet` | `#a94bff` | Highlight violet |
| `--lavender` | `#d4bbff` | Soft highlight |
| `--pink` | `#f044b8` | Primary accent pink |
| `--pink-soft` | `#ffaeda` | Soft pink |
| `--blue` | `#6d8bff` | Secondary cool accent |
| `--text` | `#ffffff` | Primary text |
| `--muted` | `#d4c6ef` | Secondary text |
| `--muted-2` | `#aa9bc9` | Muted metadata |

Use semantic color tokens. Do not rely on color alone to show selected, disabled, error, or success states.

## 3. Typography

- Body/interface: Inter, with system fallback.
- Expressive headings/brand labels: Sora, with Inter fallback.
- Headings: bold, compact, high contrast, often tight letter spacing.
- Prompt content in Gameplay: large and centered; it has the highest visual priority.
- Avoid overly small text on mobile; helper copy and labels must remain readable.

The prototype currently loads Google Fonts. Local fallbacks remain available; Google Fonts may require Internet connectivity.

## 4. Layout and surfaces

- Shared site header/footer for informational and setup pages; Gameplay uses its dedicated full-screen HUD.
- Use the existing `--header-h`, `--footer-h`, and radius tokens as the source of spacing/shell behavior where possible.
- Glass panel styling uses layered translucent gradients, blur, soft border, and shadow. Do not add thick card outlines or dense nested containers.
- Homepage desktop: hero/setup grouped on the left, brand artwork on the right; fit primary setup within target laptop viewport where feasible.
- Mobile/tablet: stack hero/brand before setup; allow vertical scrolling; keep actions and selections tappable.
- Gameplay: prompt-first theater, HUD secondary, controls clear and consistently placed.

## 5. Motion and interaction

- Preserve the short cinematic introduction, Skip Intro, roulette/reveal, and gentle prompt transitions.
- Decorative effects stay behind primary content.
- The roulette is visual presentation of the Backend-selected activity; it cannot determine or alter the actual result.
- Respect `prefers-reduced-motion`; replace long animations with short transitions.
- Disable controls during in-flight actions and show clear loading/pressed/disabled states.
- Do not add music, sound, fullscreen, Previous Question, or new gamification without a product decision.

## 6. Buttons and states

- Primary action: existing purple-to-pink gradient pill button with clear label.
- Secondary/ghost action: translucent neutral surface, clear text, subtle border.
- Selection cards: one clear selected state; use border/highlight plus text/checkmark/ARIA state, not color alone.
- Disabled controls: visibly unavailable and not interactive; explain why when the disabled state is due to content exhaustion.
- Error feedback: human-readable near the relevant control or activity; never rely on console-only logging.

## 7. Accessibility requirements

- Every actionable control must be keyboard-operable and have an accessible name.
- Use visible `:focus-visible` styling and do not remove focus outlines without replacement.
- Dialogs must move focus into the dialog, trap focus while open, and return focus when closed.
- Important state transitions and error feedback should be announced via `aria-live` where appropriate.
- Maintain readable contrast on background images and glass panels.
- Respect reduced motion.
- Target minimum touch area around 44×44 CSS px where practical.
- Text and selected state must remain meaningful without relying on color alone.

## 8. Page-specific visual hierarchy

| Page | Visual priority |
|---|---|
| Homepage | Product headline → setup selector → Start Playing; brand art supports but does not compete |
| About | Product story/problem/solution/mission → Mimi identity → setup CTA |
| How to Play | Simple ordered instructions → activity summaries → control explanations → setup CTA |
| Gameplay | Current prompt/activity → participant scope/helper → Complete/Skip/Next Question controls → HUD |
| Game Completion | Logo → SESSION COMPLETE → Great Conversations! → short subtitle → Play Again/Back to Home → closing line |

## 9. Do not change during Step 3 without a separate decision

- Do not replace the visual language with a new theme.
- Do not convert to React/Vue or add a frontend build system without a separate architecture decision.
- Do not merge About and How to Play.
- Do not add a separate Game Setup page.
- Do not add scoring, player avatars/roster, player selection UI, stats/leaderboards, or a completion metrics dashboard.
- Do not change the approved minimal completion screen.

**Design System status: Complete as the visual baseline.**
