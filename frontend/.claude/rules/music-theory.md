# Music Theory Constraints

## Theory Named Strategy (REQUIRED)
Every music theory claim must be anchored in a rigorous academic definition.

**Format:** "X is defined as [academic definition], per [source/tradition]."

**Example:** "A parallel fifth is defined as two voices moving in the same direction by a perfect fifth interval, per common-practice voice-leading rules (Aldwell & Schachter, *Harmony and Voice Leading*, 4th ed.)."

Never state music theory as folk knowledge. Always name the principle.

## Intrinsic Determinism Boundary
- **Deterministic logic** (constraint satisfaction, voice-leading rules, SATB validation) → handled by the **TypeScript Logic Core** (backend). Never implement in the frontend.
- **LLM explanation** (Glass Box reasoning, violation narration) → handled by the **Theory Inspector** API. The frontend only *displays* structured JSON responses.
- **Frontend role:** Render, schedule, and surface. Never compute theory.

## SATB Constraints (Reference Only — Do Not Implement Frontend Logic)
- Range constraints: Soprano B3–G5, Alto G3–C5, Tenor C3–G4, Bass E2–C4 (SATB standard ranges, per Aldwell & Schachter).
- Forbidden parallels: parallel fifths, parallel octaves (common-practice rules).
- Voice crossing: soprano must not drop below alto pitch, alto below tenor, tenor below bass.
- Doubling: root doubled in root-position triads unless diminished (where the third is doubled).

## Violation Flags ("Red Line")
- Violations are computed server-side and delivered as structured JSON.
- The frontend renders inline `RedLineTooltip` annotations on the VexFlow canvas.
- Never derive violation state in the frontend from raw note data.
