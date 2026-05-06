# Iteration coverage (course rubric)

This document maps the **official iteration product improvements** (same list as `Iterations.pdf` / course handoff) to the current codebase and logs. Status per ask:

- **Full** — implemented and treated as done in team docs, or clearly satisfied in code.
- **Partial** — meaningful progress; gaps, edge cases, or open QA remain (see **Evidence**).
- **Not** — not implemented, removed, or explicitly deferred.
- **N/A** — no ask applies.

**Iteration-level verdict:** an iteration is **fully addressed** only if **every** ask below is **Full** or **N/A**. As of the last doc pass, **no iteration 1–8 meets that bar** (several **Partial**); **Iteration 9** has no listed asks.

Evidence abbreviations: **P** = [progress.md](progress.md), **PL** = [plan.md](plan.md), **C** = commit message / API surface in repo.

---

## Iteration 1 A/B

| Ask | Status | Evidence |
|-----|--------|----------|
| Cursor / selection (stems vs heads, hand cursor, fewer accidental adds) | Partial | RiffScore owns hit-testing; HF multi-pitch sync, drag fixes in P §2026-04-23 / §2026-04-27; dense-score issues may persist. |
| Complex rhythmic edits (e.g. 8th + 16th) | Partial | Editor + engine rhythm modes; complex tuplet-like cases not guaranteed. |
| Unlabelled toolbar cognitive load | Full | Toolbar / palette labelling, hotkeys dialog, coachmarks — P §2026-04-18, §2026-04-22. |
| Rhythmic monotony → derive from source | Full | `chordal` / `mixed` / `flowing` (rhythm density) + engine — P §2026-04-18, generation config. |
| Voice independence (no SAT unison forever) | Full | Engine / voice-leading bias — P §2026-04-18. |
| Tenor clef (not mezzo on tenor) | Full | Clef / engraving fixes — P §2026-04-18. |
| Inspector: concise bulleted output | Partial | Prompts + Guided/Concise paths; verbosity still tuned over time — P, `prompts.ts`. |
| Inspector: align with user musical goals | Partial | INTENT / FACT blocks, progression window; contradictions reduced, not formally verified. |
| Starter prompts | Full | Chat seeds / suggested tags — inspector UI, P §2026-04-22. |
| Targeted: highlight measures + AI apply changes | Partial | Stylist / idea actions / range harmony API exist; not full “natural language measure edit” for all flows — `TheoryInspectorPanel`, `/api/generate-harmony-range`. |

**Iteration verdict:** **Partial**

---

## Iteration 2 B/A

| Ask | Status | Evidence |
|-----|--------|----------|
| Pickup / anacrusis user control | Partial | `pickupBeats` persisted; Advanced UI later hidden — store still feeds engine (P §2026-04-27). |
| Persistence across views | Full | Zustand `persist` for generation config, upload flow — P §2026-04-22. |
| Plain-language tooltips (e.g. SATB) | Partial | Ensemble / document tooltips and copy; not every term everywhere. |
| Rest placeholders on delete | Full | Rest hover ghost + replace flow — P §2026-04-22–23. |
| Apply inspector suggestions (not clunky / destructive) | Partial | Suggestion overlay / apply paths; UX still iterated — P. |
| Whole-note vs running notes parameter | Full | Harmony rhythm / density controls before generate — P §2026-04-18. |
| Inspector default simplified + expand rationale | Partial | Tabs / streaming UI; “wall of text” mitigated, not eliminated. |
| Chat maps commands or explains limits | Partial | System prompts; pickup “fix via chat” historically brittle — Iteration3 note in P. |
| Inspector scrolling bugs | Partial | Float/dock, overflow fixes; P notes scrollbar follow-ups. |
| MIDI playback stable and audible | Partial | `usePlayback` / Transport hardening — P §2026-04-18; edge cases possible. |

**Iteration verdict:** **Partial**

---

## Iteration 3 A/B

| Ask | Status | Evidence |
|-----|--------|----------|
| Progression-aware Inspector (ii–V–I, etc.) | Partial | Windowed FACT / prompts improved; full progression tutor not closed — PL, P §2026-04-20. |
| Localized highlight-to-generate | Partial | `/api/generate-harmony-range` + sandbox/inspector range actions — P; range-merge edge cases **open** (P §2026-04-23). |
| No auto expressives; prompt user sovereignty | Partial | Stylist duration guard (`useTheoryInspectorStore`); engine should not add dynamics — verify per score path. |
| Parameter accuracy (mode/genre without corrupting melody) | Partial | Classical-only simplify from Document; jazz/genre UI removed — Iteration3.txt note in P. |

**Iteration verdict:** **Partial**

---

## Iteration 4 A/B

| Ask | Status | Evidence |
|-----|--------|----------|
| Clarify generative terminology | Partial | Tooltips, renamed labels (Chordal / Flowing, etc.); “portal” wording evolved. |
| Rename document tab to actionable label | Partial | Step bar uses **Configure** for `/document` — `StepBar.tsx` (not literally “Edit Configuration”). |
| Edit-authority cues (cursor, hover, onboarding) | Full | Onboarding overlay, coachmarks, playground affordances — P §2026-04-22–24. |
| Inspector does not obstruct workspace | Partial | Float/dock, layout; overlap cases still in backlog — P. |
| Immediate tactile feedback | Partial | `hf-pressable`, toasts, click burst; “failed to render” class glitches reduced, not proven zero. |

**Iteration verdict:** **Partial**

---

## Iteration 5 B/A

| Ask | Status | Evidence |
|-----|--------|----------|
| Plain-language theory translations | Partial | Pedagogy strings, Taxonomy; rough-theory audience not fully validated. |
| Progressive disclosure / reset | Partial | Advanced hidden; workspace reset modal — P. |
| Instrument previews / families / icons | Partial | **Icons + families** shipped (`VoiceDropdown`, SVGs); **auditory previews** not a sustained product feature — P Iteration 7 follow-up removed timbre preview UI. |
| Trackpad optimization | Partial | Hotkeys, larger hit targets; touch / trackpad parity still open — P. |

**Iteration verdict:** **Partial**

---

## Iteration 6 B/A

| Ask | Status | Evidence |
|-----|--------|----------|
| Non-blocking Inspector while editing | Full | Float/dock inspector — P §2026-04-23. |
| Multi-note and measure-level selection | Full | Multi-select + Alt+bar selection + FACT merge — P §2026-04-23. |
| Pedal bass / rhythmic independence | Full | `bassRhythmMode` `pedal` \| `follow`, engine + API — `useGenerationConfigStore`, P. |
| Expanded ensembles | Full | `VOICE_INSTRUMENTS` expansion — P, `feat(iter6)` assets. |
| Inspector concise actionable | Partial | Guided/Concise + prompts; subjective. |
| Wider suggestions (rests, structure) | Partial | Idea actions / stylist; “illusion of decision” not fully resolved — P. |
| Section-by-section / localized generation | Partial | Range API + UI; merge when part counts differ **open** — P §2026-04-23. |

**Iteration verdict:** **Partial**

---

## Iteration 7 A/B

| Ask | Status | Evidence |
|-----|--------|----------|
| UI / hotkey stability (drag pitch, octave arrows) | Partial | Unified `handleToolSelect`, post-flush score — P §2026-04-27; toolbar **`Octave ↓` (`8-`)** still **open** pending QA — P §2026-04-25 PM. |
| Playback fidelity + preview across instruments | Partial | Playback hardened; **timbre / cross-instrument preview** UI **removed** — P Iteration 7 follow-up. |
| Inspector proactive alternatives | Full | Alternatives + idea-action JSON path — `useTheoryInspector.ts`, P §2026-04-25. |
| Separate phrasing from vertical harmony | Partial | Copy + `suggestedDuration` guard; full separation not formally closed — P. |

**Iteration verdict:** **Partial**

---

## Iteration 8 A/B

Same four bullets as **Iteration 7** in the course packet (duplicate tranche).

**Coverage:** identical assessment → **Partial** (for the same reasons as §7).

---

## Iteration 9 B/A

No product improvements were listed for this iteration in the course materials.

**Coverage:** **N/A** — no asks to implement or verify.

---

## Suggested “successfully addressed” summary (strict)

Under the rule *all bullets Full or N/A*:

| Iteration | Fully addressed? |
|-----------|-------------------|
| 1 | No |
| 2 | No |
| 3 | No |
| 4 | No |
| 5 | No |
| 6 | No |
| 7 | No |
| 8 | No |
| 9 | N/A (no asks) |

For a **course narrative** emphasizing shipped value, cite **Partial** completions above and point readers to **P**/**PL** for the living backlog.
