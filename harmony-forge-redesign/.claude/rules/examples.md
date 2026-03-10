# Structured Block Examples

Few-shot examples of well-formed preview responses for the HarmonyForge workflow.
Pull this file when unsure how to structure a preview reply.

---

## Example 1 — UI Component Request

**User says:** "Add a playback button to the toolbar."

**Correct preview response:**

```xml
<context>
  Superman is building the HarmonyForge Tactile Sandbox. The toolbar needs a playback
  control so the composer can hear the current SATB arrangement without leaving the editor.
</context>
<task>
  Create a PlaybackButton React component that dispatches a play/pause event to the
  Tone.js symbolic scheduler via the usePlayback Zustand hook.
</task>
<constraints>
  - Next.js App Router, TypeScript strict mode
  - Tailwind CSS utility classes only — Nocturne/Sonata tokens, no ad-hoc hex values
  - aria-label="Play arrangement" and aria-pressed={isPlaying} required (POUR)
  - Tone.js receives symbolic note events only — no AudioContext or raw buffer access
  - State lives in Zustand; component is stateless beyond reading isPlaying from the store
</constraints>
<output>
  PlaybackButton.tsx component + usePlayback hook stub (if not yet created)
</output>
```

**Meta-Rewrite:**
- What is the user asking for? A UI control that triggers symbolic playback.
- Minimum surface area: one component + one hook action dispatch. No new store slice needed if isPlaying already exists.
- Ambiguities: Does the playback hook exist? If not, stub it — but do not implement Tone.js scheduling logic here.

**Shall I proceed with the implementation as described above? (Yes / No / Request changes)**

---

## Example 2 — Theory Inspector Display Request

**User says:** "Show the parallel fifth violation in the score."

**Correct preview response:**

```xml
<context>
  The backend has returned a violation JSON payload identifying a parallel fifth between
  Soprano and Alto voices at beat 3, measure 5. Superman wants this violation rendered
  inline on the VexFlow canvas as a Red Line tooltip.
</context>
<task>
  Implement the RedLineTooltip component that attaches to the VexFlow note element
  at the specified beat/measure coordinates and displays the violation label on hover.
</task>
<constraints>
  - VexFlow DOM manipulation inside useEffect only — no direct ref access outside the hook
  - Tooltip text sourced from the backend JSON payload — never derived from raw note data
  - POUR: tooltip must be keyboard-accessible (focus-visible) and have aria-describedby
  - A parallel fifth is defined as two voices moving in the same direction by a perfect
    fifth interval, per common-practice voice-leading rules (Aldwell & Schachter,
    Harmony and Voice Leading, 4th ed.) — display this definition in the tooltip body
  - Nocturne token: use --color-violation-red for the indicator line
</constraints>
<output>
  RedLineTooltip.tsx component; ViolationOverlay hook that maps backend JSON to
  VexFlow coordinate positions
</output>
```

**Meta-Rewrite:**
- What is the user asking for? Inline violation rendering on the score canvas.
- Minimum surface area: one component + one coordinate-mapping hook. No store changes needed if violation flags are already in Zustand.
- Ambiguities: What is the shape of the backend violation JSON? Need `{ measure, beat, voices, ruleLabel, definition }` at minimum.

**Shall I proceed with the implementation as described above? (Yes / No / Request changes)**

---

## Example 3 — Protocol / Non-Code Request

**User says:** "Explain what a deceptive cadence is."

**Correct preview response:**

```xml
<context>
  Superman is asking for a music theory explanation, likely for context before
  implementing a Theory Inspector feature that detects or displays cadence types.
</context>
<task>
  Define a deceptive cadence using the Theory Named strategy, anchored in academic
  sources, and explain its relevance to the SATB constraint-satisfaction context.
</task>
<constraints>
  - Theory Named strategy required: every claim must be anchored in an academic definition
  - No probabilistic guessing — if uncertain about a specific case, state the uncertainty
  - No frontend code generated unless explicitly requested
</constraints>
<output>
  A concise academic definition with source citation and one practical SATB example
</output>
```

**Meta-Rewrite:**
- What is the user asking for? A rigorous music theory definition, not an implementation.
- Minimum surface area: definition + citation + one example. No code.
- Ambiguities: None — this is a pure explanation task.

**Shall I proceed with the implementation as described above? (Yes / No / Request changes)**

---

## Anti-Patterns (what NOT to do)

**Do not blend preview and execution:**

```
# WRONG — preview and code in the same message
Here's how I'll implement it:
<context>...</context>
...
Here's the code:
const PlaybackButton = () => { ... }
```

**Do not skip the gate:**

```
# WRONG — no confirmation question at the end
<context>...</context>
<task>...</task>
...
I'll now write the component.
```

**Do not use plain text instead of XML tags:**

```
# WRONG — plain text format (pre-upgrade format)
context: ...
task: ...
constraints: ...
output: ...
```
