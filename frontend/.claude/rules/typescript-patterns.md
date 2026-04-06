# TypeScript & Code Style Patterns

## Stack
- **Framework:** Next.js App Router (TypeScript)
- **Styling:** Tailwind CSS utility classes only — no ad-hoc color values
- **Score Rendering:** VexFlow (symbolic only)
- **Playback:** Tone.js (symbolic event scheduling — no raw audio synthesis)
- **State:** Zustand stores
- **LLM Sidebar:** Theory Inspector (REST/streaming API consumer only)

## Code Style Rules
- All components: modular, component-driven, strictly typed TypeScript
- No `any` types — define explicit interfaces/types for all props and state
- Zustand stores: typed slices, no implicit `any` in actions
- VexFlow: wrap in typed React components; never manipulate DOM outside `useEffect`
- Tone.js: schedule symbolic events only; no `AudioContext` or raw buffer manipulation
- POUR accessibility: `aria-label`, keyboard nav, and screen-reader annotations required on all interactive elements

## Design Token Rule
Use only HarmonyForge design system tokens:
- Dark palette: **Nocturne**
- Light palette: **Sonata**
- Never introduce ad-hoc hex values or Tailwind color overrides outside the token system

### ui-ux-pro-max Skill — Suggestion Protocol
When the ui-ux-pro-max skill surfaces color palette, typography, or style recommendations:
- **Surface them as labelled suggestions** — prefix with `[ui-ux-pro-max suggestion]` so the user can evaluate them explicitly.
- **Never auto-apply** color or font values from the skill. Nocturne/Sonata tokens and the HarmonyForge type scale are the locked baseline.
- **UX pattern suggestions** (`--domain ux`, `--domain react`, `--domain web`) may be adopted directly — they carry no token risk.
- **Deviations from the locked design system** require Superman's explicit approval before implementation. Present the deviation, its rationale, and the specific token it would override.

## Architecture Boundary
| Concern | Location |
|---|---|
| Score rendering | VexFlow React component |
| Playback scheduling | Tone.js hook (`usePlayback`) |
| Editor state | Zustand store |
| Violation display | `RedLineTooltip` on VexFlow canvas |
| Theory explanation | Theory Inspector sidebar (API consumer) |
| Constraint logic | Backend only — never frontend |
