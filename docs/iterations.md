# User-study iteration notes

Condensed product feedback from HarmonyForge user-study transcripts (Iterations 1 & 2). For the running engineering log, see [progress.md](progress.md).

---

## Iteration 1 — UI, engine, Theory Inspector

### UI / UX and sandbox

- **Selection accuracy:** Difficulty selecting/moving notes; stems highlighted instead of noteheads; cursor did not show a clear “hand” affordance for movable elements.
- **Rhythmic editing:** Struggles combining eighth + sixteenth notes; misaligned notation.
- **Toolbar:** Too many unlabeled buttons; high cognitive load.

### Deterministic generation (logic core)

- **Rhythmic monotony:** Engine defaulted to long values for harmony instead of matching input rhythm.
- **Voice independence:** Soprano and alto often unison — poor use of voices and voice-leading.
- **Clef errors:** e.g. wrong clef on tenor — hurts credibility with trained musicians.

### Theory Inspector (LLM)

- **Verbosity:** Responses too long; prefer concise, bulleted feedback.
- **Context:** Suggestions sometimes contradicted user goals (e.g. stable tonality).
- **Empty state:** Users need starter prompts (“Check voice leading”, etc.).
- **Targeted editing:** Desire to highlight measures and ask for localized changes.

---

## Iteration 2 — Context, sandbox, Inspector, stability

### Musical context

- **Pickup / anacrusis:** Misalignment when pickups not recognized; need explicit pickup control or global shift.
- **State across screens:** Key and other parameters dropped on navigation; persist configuration.
- **Terminology:** Plain-language tooltips; not everyone knows “SATB”.

### Sandbox mechanics

- **Deletes:** Deleting notes left measures visually broken; consider rest placeholders.
- **Inspector → score:** Applying suggestions felt clunky or destructive vs precise edit.
- **Rhythm control:** User wanted a clearer control over static vs active harmonic rhythm before generation.

### Theory Inspector

- **Information density:** “Wall of text” by default; prefer short actions with optional detail.
- **Actionability:** Chat sometimes ignored actionable commands (e.g. pickup) — align with intent routing (see `frontend/src/lib/ai/intentRouter.ts`) or explain limits clearly.
- **Layout:** Scrolling issues unless full-screen.

### Performance

- **Playback:** Crashes, inaudible volume — stability and level are critical.
