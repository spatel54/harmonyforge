# Progress (RALPH Loop)

## End Goal

Full flow working — **Upload → Document (preview + config) → Generate Harmonies → Sandbox** with editable score and working audio playback (Noteflight/MuseScore-style). The engine **adds** harmony parts to the user's melody (melody + flute + cello = 3 parts), rather than replacing it. User configures mood and instruments on Document page; generated MusicXML loads into the note editor for editing, playback, and export.

**Core objectives:**
- **Expressive Sovereignty**: Musician remains the ultimate author.
- **Copyright Safety by Design**: Use axiomatic music theory instead of pattern mimicry from copyrighted datasets.
- **Pedagogical Partner**: Transparent, explainable Theory Tutor.

---

## Approach

1. **Fix parsing** (backend + frontend) — MusicXML partwise/timewise, no DTD loading, correct pitch mapping.
2. **Fix SATB solver** — Handle real melodies, non-chord tones, relaxed fallback when strict voice-leading fails.
3. **Fix MusicXML output** — Preserve rhythm, variable parts (only selected instruments). **Additive harmonies**: melody stays as first part; user-selected instruments (flute, cello) are added as harmony parts.
4. **Fix frontend display** — Document preview renders reliably; **Sandbox primary editor** is **RiffScore** (third-party notation UI) with `EditableScore` in Zustand as the app’s canonical model; bidirectional sync via adapter + `useRiffScoreSync`. Legacy VexFlow/OSMD paths remain referenced historically below; current MVP editing path is RiffScore-centric.
5. **Variable parts** — Generator outputs melody + harmony parts only (e.g. melody + flute + cello = 3 parts). Soprano instruments map to Alto voice; Alto/Tenor/Bass map to their voices.
6. **Explainability** — Theory Inspector treats the **deterministic engine** as ground truth for **generated** harmony parts; **pitch-centric** note explain uses deterministic FACTs (roster, vertical stack, cross-part intervals, motion) plus optional trace; chat + highlights explain violations on harmony; taxonomy is RAG-style context; LLM is optional and must not invent rules beyond supplied context. **Melody** clicks get pitch-in-context (no engine-origin block).
7. **Source-transparent tutoring (2026-04)** — RAG lexicon (`Taxonomy.md`, `taxonomyIndex.ts`) maps **Fux**, **Aldwell & Schachter**, **Caplin**, and **Open Music Theory** to what the code actually does vs pedagogy-only claims. LLM system prompts (`prompts.ts`) require **brief citations** when stating rules (one best source per claim), **plain language first**, and **tight length** defaults so users learn without information overload.
8. **Honest, non-sycophantic tutor (2026-04)** — Same `prompts.ts`: shared **`HONESTY_NO_SYCOPHANCY`** block for Auditor/Tutor/Stylist—no flattery or false agreement; **passing the checker ≠ musically ideal**; admit **thin context** and **gray areas**; **correct wrong premises** gently from facts; Stylist notes when a fix is **one option** or has **tradeoffs**.

---

## Consolidated status (2026-04) — end goal, approach, done work, active gaps

### End goal (unchanged + clarified)

- **Product flow:** Upload → Document (preview + config) → Generate Harmonies → **Sandbox** with editable score, export, and optional playback.
- **Engine contract:** Additive harmonies (melody part preserved; new parts are generated).
- **Editor UX:** Modern notation editing (rest-complete measures, shortcuts, integrated toolbar) aligned with familiar editors (Noteflight/MuseScore-style goals).
- **Theory Inspector:** Transparent “glass box” — **pitch-centric** note explain: **Origin Justifier** (Mode A: current pitch still matches engine snapshot) vs **Harmonic Guide** (Mode B: edited or no baseline); staff roster + cross-part intervals so the tutor grounds copy in **input melody and every generated part** at the same beat (1–8+ staves). Explanations and highlights still tied to deterministic SATB validation where applicable; optional OpenAI augments wording; structured suggestions require the key. **Copy policy:** **`CITATION_AND_BREVITY`** (concise, one source per norm when citing theory) + **`HONESTY_NO_SYCOPHANCY`** (no praise theater; engine-valid ≠ necessarily “best”; admit limited facts; call style gray areas; don’t validate false theory claims).

### Approach (this arc)

- **State:** `EditableScore` + Zustand (`useScoreStore`) remain the canonical score; **RiffScore** renders and captures edits; `riffscoreAdapter` + `normalizeScoreRests` keep measures rhythmically complete.
- **Toolbar:** RiffScore’s public API did not expose custom toolbar slots — we **patch** `riffscore` (via `patch-package`) to add `ui.toolbarPlugins`, then mount HarmonyForge actions (palettes, undo/redo, transpose, XML export, etc.) inside the native toolbar.
- **Inspector (dual-mode + data):** **Comparison gate** in `theoryInspectorMode.ts`: `resolveOriginalEnginePitch` prefers `Note.originalGeneratedPitch` then Zustand baseline map; `computeTheoryInspectorMode` → `origin-justifier` | `harmonic-guide` | `melody-context`. Baseline captured in `theoryInspectorBaseline.ts` on sandbox load; `applyOriginalGeneratedPitches` stamps harmony notes; RiffScore pull preserves provenance by note id; clipboard **extractNotes** strips provenance on paste. UI: `TheoryInspectorPanel` uses Origin Justifier / Harmonic Guide copy; slim Harmonic Guide card when pitch unchanged. API: `theoryInspectorNoteMode` on `/api/theory-inspector` + **`prompts.ts`**: **`CITATION_AND_BREVITY`**, **`HONESTY_NO_SYCOPHANCY`**, persona rules (Caplin guardrails; avoid bullet dumps unless asked).
- **Inspector (multi-staff FACTs):** `noteExplainContext.ts` — `buildScorePartRosterLines`, `buildCrossPartIntervalFacts`, additive vertical lines labeled **input vs generated** with `part.name` and staff index; SATB FACT lines take optional `voiceStaffNames` and pairwise intervals from clicked voice to each other voice. **Note explain routing:** `scoreToAuditedSlots(score, { requireExactlyFourParts: true })` so **only exactly four parts** use the SATB slot path; **five or more staves** use full additive context (no hidden 5th–8th staff drop). **`runAudit`** still uses `scoreToAuditedSlots(score)` without that flag (first four mapped parts only until engine supports full multi-voice audit).
- **Frontend tests:** `harmony-forge-redesign` — `vitest` + `npm run test` (`noteExplainContext.test.ts`).

### Steps completed in this arc (high level)

| Area | What shipped |
|------|----------------|
| **Rests** | `normalizeScoreRests` in `scoreUtils`; `setScore`/`applyScore` normalize; RiffScore adapter preserves `isRest` both directions; `insertNote` can replace a rest slot. |
| **Editor / toolbar** | Removed duplicate floating palette pattern; `toolbarPlugins` patch; palette visibility + styled plugin buttons; many functional plugin actions. |
| **Stability** | Fixed React “getSnapshot / maximum update depth” by using **per-field** `useScoreStore` selectors in `RiffScoreEditor` (no object literal selector). |
| **Theory Inspector** | Dual-mode (`inspectorMode`, `theoryInspectorMode.ts`); `originalGeneratedPitch` on `Note`, sandbox stamp + RiffScore preserve; tutor `theoryInspectorNoteMode`; panel labels Origin Justifier / Harmonic Guide; **multi-part** roster + cross-part interval FACTs; `resolveSatbPartIndices` + `requireExactlyFourParts` for note-explain SATB gate; SATB FACTs show part names; vitest for `noteExplainContext`. **2026-04-02:** Source-aligned `Taxonomy.md` + `taxonomyIndex.ts` + `prompts.ts` (Fux / A&S / Caplin / OMT) with engine-mapping honesty; `engine/solver.ts` + `engine/constraints.ts` + `engine/types.ts` comments; chamber `harmonize-core.ts` Caplin disclaimer. **2026-04 (follow-up):** `prompts.ts` — `CITATION_AND_BREVITY` + **`HONESTY_NO_SYCOPHANCY`** (realistic, non-sycophantic Auditor/Tutor/Stylist). |
| **Config** | `harmony-forge-redesign/.env.example` (committed); `.env.local` template; `.gitignore` allows `.env.example` while ignoring secrets. |
| **Ops** | Documented `make dev`; port-conflict cleanup for 3000/8000 when restarting. |

### Context-Aware Theory Inspector — shipped detail (2026-04)

**Objective (product):** Pitch-only transparency: Mode A explains **engine snapshot** (with trace-backed checks where available); Mode B explains **how the live pitch sits** against vertical sonority and neighbors. Relational FACTs cover same-beat stack and prev/next musical moments (SATB slot + additive barline neighbors).

**Files (primary):** Repo-root `Taxonomy.md`, `harmony-forge-redesign/src/lib/ai/taxonomyIndex.ts`, `harmony-forge-redesign/src/lib/music/theoryInspectorMode.ts`, `theoryInspectorBaseline.ts`, `theoryInspectorSlots.ts`, `noteExplainContext.ts`, `scoreTypes.ts` (`originalGeneratedPitch`), `riffscoreAdapter.ts`, `useRiffScoreSync.ts`, `scoreUtils.ts` (paste drops provenance), `useTheoryInspector.ts`, `useTheoryInspectorStore.ts`, `TheoryInspectorPanel.tsx`, `app/api/theory-inspector/route.ts`, `lib/ai/prompts.ts` (`CITATION_AND_BREVITY`, `HONESTY_NO_SYCOPHANCY`), `app/sandbox/page.tsx` (baseline + stamp), `vitest.config.ts`, `noteExplainContext.test.ts`.

**Still thin vs aspirational copy:** Mode A “axiomatic” lines like “resolved the leading tone” are **not** fully supplied by the engine today — `validate-satb-trace` is **violation-oriented**; richer generative rationale remains a **future engine / ADR** item unless we add more client-side heuristics (e.g. chord-tone classification without Roman numerals).

### Work completed (2026-04) — theory sources, engine honesty, tutor voice and tone

This subsection records **everything shipped in this arc** so handover chats stay aligned.

**A. End goal (unchanged)**  
Same as **End Goal** above: full **Upload → Document → Sandbox** flow; additive harmonies; Theory Inspector as transparent tutor; optional LLM.

**B. Approach taken**

1. **Ground claims in real sources** — Used **NotebookLM** on the **HF LitReview** notebook to sanity-check paraphrases for Fux (*Gradus*, Mann ed.), Aldwell & Schachter (*Harmony and Voice Leading*), Caplin (*Classical Form*), and **Open Music Theory** (Gotham et al.).
2. **Document what code actually does** — Added a **source spine and engine mapping** in `Taxonomy.md`: hard constraints ↔ `engine/constraints.ts` / `validate-satb-trace`; motion heuristic ↔ `engine/solver.ts` (L1 MIDI sum = **parsimony proxy**, not species counterpoint); Caplin vocabulary ↔ honesty (primary `engine/` path does **not** run full segmentation); chamber-only `planStructuralHierarchy` labeled a **heuristic sketch** in `chamber-music-fullstack/backend/src/harmonize-core.ts`.
3. **Sync RAG strings** — `harmony-forge-redesign/src/lib/ai/taxonomyIndex.ts` classical section mirrors the spine; violation entries cite **A&S / OMT / engine files** for range and spacing.
4. **LLM behavior** — `harmony-forge-redesign/src/lib/ai/prompts.ts`: shared **`CITATION_AND_BREVITY`**; Auditor/Tutor/Stylist tuned for **brief source tags** when stating rules, **plain language first**, **no citation stacking**, default **3–8 sentences** for typical replies; note modes updated; Caplin guardrails retained.
5. **LLM honesty** — Same file: **`HONESTY_NO_SYCOPHANCY`** injected into all personas—no flattery; **constraint-satisfied ≠ musically ideal**; state when context/facts are **thin** or reference is **incomplete**; **gray areas** and **tradeoffs** (esp. Stylist); **correct wrong theory** from evidence, not agreeableness.
6. **Engine comments** — `engine/solver.ts` (motion score), `engine/constraints.ts` (A&S authority), `engine/types.ts` (range pedagogy).

**C. Steps done (checklist form)**

- [x] HF LitReview / NotebookLM narrow queries for four corpora  
- [x] `Taxonomy.md` — spine table, OMT backbone, Caplin honesty, §1.1 / §1.6 updates, source attribution table  
- [x] `taxonomyIndex.ts` — GENRE_SECTIONS + VIOLATION_ENTRIES aligned  
- [x] `prompts.ts` — source↔implementation + Caplin + **`CITATION_AND_BREVITY`** + **`HONESTY_NO_SYCOPHANCY`**  
- [x] `engine/solver.ts`, `constraints.ts`, `types.ts` — comment honesty  
- [x] `harmonize-core.ts` — `planStructuralHierarchy` disclaimer  
- [x] `docs/plan.md`, `docs/progress.md`, `docs/context/system-map.md` — synced for theory/RAG narrative + honest/non-sycophantic tutor (`HONESTY_NO_SYCOPHANCY`)  
- [x] `make test` + `harmony-forge-redesign && npm run test` passed after engine/taxonomy/prompt edits  

**D. Learnings (compact)**

- **OMT** = primary **pedagogical organization** for RAG; **A&S** = anchor for **hard** SATB rules in code; **Fux** = lineage for **smooth motion** (solver is only a proxy); **Caplin** = vocabulary only when facts support it.  
- Tutor must **teach without flooding** — one source per theoretical claim in short answers.
- Trust comes from **accuracy and limits**, not cheerleading—prompts explicitly forbid sycophancy.

### Current failures / work in progress

**Primary pain (user-visible):**

1. **RiffScore playback assets:** `GET /audio/piano/*.mp3` **404** in dev — built-in piano playback may be silent until samples are hosted under the Next app.

2. **LLM availability:** Without `OPENAI_API_KEY` (and dev server restart), Theory Inspector uses **taxonomy fallback** only; full **cited, concise, non-sycophantic** tutor behavior (`CITATION_AND_BREVITY` + `HONESTY_NO_SYCOPHANCY`) requires the key.

**Secondary / technical debt:**

3. **Monorepo / Next warning:** Turbopack **multiple lockfiles** (repo root vs `harmony-forge-redesign/`); resolve via `turbopack.root` or lockfile consolidation.

4. **Doc drift (legacy):** Older sections below may still read OSMD/VexFlow-first; **RiffScore-first** is current for editing.

5. **Audit vs note explain on large scores:** `runAudit` uses **`scoreToAuditedSlots` without `requireExactlyFourParts`** — 5+ staves may audit a **four-part slice** while note explain lists **all** staves. Needs engine/API design.

6. **Mode A narrative depth:** “Why this exact pitch” beyond violation trace still thin without **solver metadata** or richer client-side analysis.

7. **Optional engine stretch (not done):** Fux-informed **motion penalties** (contrary motion, etc.) beyond L1 sum — deferred; comments document the gap.

---

## Steps Done So Far

### Backend (Parsing & Engine)

1. **Partwise parser** — Switched from `@xmldom/xmldom` to `fast-xml-parser` (no DTD loading; parses XML to JS object). Fixes "Could not parse file or no melody found" for partwise files (Noteflight, MuseScore exports).
2. **Pitch parsing** — Fixed note step mapping in both MusicXML parsers; correct pitch classes for C, D, E, F, G, A, B.
3. **Chord inference** — Melody-aware diatonic chord selection replaces fixed I–IV–V–I loop.
4. **Solver** — Active melody notes, octave-normalize out-of-range soprano, realistic SATB doublings.
5. **"Could not find valid SATB arrangement" fix** — (a) When melody note is non-chord tone, don't fix soprano; use chord tones. (b) If strict voice-leading fails, retry with relaxed constraints (allow parallel fifths/octaves; keep range/order).
6. **Variable parts** — `satbToMusicXML.ts` outputs only voices with selected instruments.
7. **Additive harmonies** — When generating from file with melody, engine **adds** harmony parts instead of replacing. Output: melody (original part name from input) + harmony parts (flute, cello, etc.). Soprano instruments → Alto voice; Alto/Tenor/Bass → their voices. `ParsedScore.melodyPartName` extracted from part-list.
8. **MuseScore compatibility** — Output partwise MusicXML 2.0 with `<mode>` in key. API and CLI use `format: "partwise"`, `version: "2.0"`.
9. **MusicXML output** — Preserves source melody rhythm and measure structure.
10. **API** — `POST /api/generate-from-file` returns `200` with generated MusicXML for `月亮代表我的心.xml`.
11. **CLI test** — `make test-engine`: input/output folders, `scripts/run-engine-cli.ts`, copies melody to input, runs engine, writes `output/月亮代表我的心_flute_cello.xml`.

### Backend–Frontend Integration

9. **Backend** — `http://localhost:8000` (engine/server.ts, CORS for localhost:3000).
10. **Frontend** — `http://localhost:3000` (Next.js, `NEXT_PUBLIC_API_URL` or localhost:8000 default).
11. **Run** — `make dev-clean && make dev` starts full stack.

### Document Page & Sandbox Preview

12. **Sheet music display** — Added OpenSheetMusicDisplay (OSMD) for reliable MusicXML rendering. Document page and Sandbox use OSMD when raw MusicXML is available — bypasses custom parseMusicXML + VexFlow for display.
13. **OSMD load/render fix** — `cancelled` flag; `.then()` instead of `await`; `container.isConnected` check before `render()`; `opacity: 0` during load.
14. **OSMD partwise vs timewise** — Backend now returns partwise directly; `timewiseToPartwise.ts` used when backend previously returned timewise (fallback).
15. **VexFlow EasyScore** — Pitch notation `c/4/q` → `C4/q` (VexFlow 5).
16. **MusicXML parser** — Namespace-aware (`findAllByLocalName`, `findByLocalName`) for part, measure, note, pitch, step, alter, octave, type, dot.
17. **VexFlow import fix** — Default import + `as unknown as` for Factory; `as any` for factory instances.

### VexFlow Multi-Measure

18. **Too many ticks** — One voice per part spanning all measures; timeSig = total duration; bar notes between measures.
19. **TickMismatch (attempted)** — Compute `maxTotalBeats` across parts; same `timeSig` for every voice; pad shorter voices with rests via `beatsToRestNotation()`.
20. **VexFlow error handling** — Added `onError` prop to VexFlowScore; `handleVexFlowError` in ScoreCanvas; fallback to OSMD when VexFlow throws.
21. **vexflowHelpers** — 32nd rest support in `beatsToRestNotation`; floating-point rounding (`Math.round(rawBeats * 1000) / 1000`) for measureBeats to avoid TickMismatch.

### Sandbox Blank Canvas Fix (2025-03-08)

22. **Display priority** — ScoreCanvas preferred VexFlow when `score` existed; VexFlow can render blank without throwing. **Fix:** Prefer OSMD when `musicXML` exists (mirrors ScorePreviewPanel). Logic: `musicXML` → OSMD; else `score && !vexFlowCrashed` → VexFlow.
23. **Layout** — `min-h-0` → `min-h-[280px]` on ScoreCanvas base to prevent flex collapse.
24. **Stable onError** — `handleVexFlowError` wrapped in `useCallback` to avoid unnecessary VexFlowScore effect re-runs.

### Verification

25. **Browser flow** — Upload `月亮代表我的心.xml` → `/document` preview/config → Generate Harmonies → `POST /api/generate-from-file` returns `200` → `/sandbox` renders generated score via OSMD.

### Sandbox Improvements (2026-03-09)

26. **Session persistence** — `generatedMusicXML` + `sourceFileName` stored in `sessionStorage`; `restoreFromStorage()` on Sandbox mount; survives refresh.
27. **CORS** — `CORS_ORIGIN` env var (default `http://localhost:3000`).
28. **Edit mode toggle** — View (OSMD) vs Edit (VexFlow) in SandboxActionBar; enables note tools when Edit selected. ADR `docs/adr/001-sandbox-display-mode.md`.
29. **CLI args** — `-i/--input`, `-o/--output`, `--mood`, `--instruments` (e.g. `Soprano:Flute,Bass:Cello`).
30. **Audio playback** — `usePlayback` hook (Tone.js), `playbackUtils.ts`; play/pause/stop wired to SandboxPlaybackBar.
31. **Audio playback hardening (2026-03-23)** — measure-aware scheduling (time-signature support), rest-aware timing, pitch-safe filtering, transport cancellation before replay, PolySynth for stable overlapping notes.
32. **Onboarding flow (2026-03-23)** — Added first-time guided tour across Upload, Document, and Sandbox via `OnboardingCoachmark` + `localStorage` completion flag.
33. **Theory Inspector wiring (2026-03-23)** — Replaced simulated chat with `/api/theory-inspector` route; route uses backend validation context and optional OpenAI completion (`OPENAI_API_KEY`) with graceful fallback when keys are unavailable.

---

## Current Focus

**Primary editor:** Sandbox notation is **RiffScore**-driven with Zustand-backed `EditableScore` sync — not the older VexFlow-first story (see **Consolidated status (2026-04)** above for truth).

**Active work / blockers:**
1. **RiffScore sample URLs (404)** — wire or proxy `/audio/piano/*.mp3` (or disable sampler UI) so built-in playback matches user expectations.
2. **OpenAI in dev** — ensure `OPENAI_API_KEY` (and optional `OPENAI_MODEL`) live in `harmony-forge-redesign/.env.local` and restart `make dev`; verify `GET /api/theory-inspector` → `hasApiKey: true`.
3. **Turbopack lockfile warning** — align Next workspace root (`turbopack.root` or single lockfile strategy).

**Still valuable from earlier milestones:** Onboarding, session persistence, engine on `:8000`, chord-chart export path, `usePlayback`-based app audio (where still used) — coexist with RiffScore’s internal playback.

**Deferred:** JSON-based score deltas for backend sync; deeper “click any harmony note → full solver trace” beyond current deterministic slot messages.

---

## Session Log (2026-03-24)

**Browser QA + docs sync pass:**
- Ran a full in-browser pass against `docs/plan.md` and `docs/progress.md` expectations.
- Confirmed routes and controls load (`/`, `/document` guard behavior, `/sandbox` toolbar/playback/inspector shell).
- Confirmed edit-first UX state in code (no Eye/View toggle path in sandbox action bar).
- Found critical regression: notation canvas is blank on `/sandbox` during live browser pass.
- Logged this as the active blocker across docs and shifted immediate focus to render-path stabilization before M5 transition.
- Updated `docs/plan.md`, `docs/progress.md`, and `docs/context/system-map.md` to align with current architecture and blocker state.

**Ship-ready implementation pass:**
- Reproduced blank-canvas regression in live browser QA and confirmed root cause in edit-first render path.
- Added reliability-first mode controls in sandbox (`View`/`Edit`) and changed default to visible notation path.
- Implemented ScoreCanvas measure highlight overlays (red/blue) and wired inspector responses to highlight state.
- Extended Theory Inspector API to return highlight guidance (`highlights`) with OpenAI-assisted generation when `OPENAI_API_KEY` is present and deterministic fallback when unavailable.
- Added transposition-aware + instrument-aware MusicXML parse improvements (clef inference + concert-pitch conversion for common transposing instruments).
- Added chord-chart export endpoint (`POST /api/export-chord-chart`) and wired frontend Export modal with chord-chart option plus clearer format fallback behavior.
- Hardened Document-page refresh behavior: if generated score exists in session storage and upload file is missing, route recovers to `/sandbox`.
- Verified browser flow again: visible notation in View mode, inspector response rendered, red/blue highlight overlay visible, export UI includes chord-chart path.

**Browser QA pass (post-caret architecture):**
- Re-ran live browser validation on `/`, `/document`, and `/sandbox` with active dev stack (`make dev` session).
- Confirmed `/` upload screen renders correctly; `/document` recovery path redirects to `/sandbox` when session score exists (expected continuity behavior).
- Confirmed `/sandbox` editor behaviors: View/Edit mode switch, semantic beat-grid slots in Edit + duration mode, note insertion via grid, inspector chat request (`/api/theory-inspector` 200), playback toggle Play↔Pause, and Export modal includes Chord Chart option.
- Found and fixed undo-history regression: first edit was not immediately undoable because initial state was not tracked in history.
- Implemented history fix in `useScoreStore`: seed history on `setScore`, append next snapshot on `applyScore`, and route delete edits through `applyScore`; browser retest confirms first edit now enables Undo immediately.

**Full upload→generate→sandbox acceptance pass (requested):**
- Executed real file upload flow using `月亮代表我的心.xml` on `/` and confirmed navigation to `/document`.
- On `/document`, selected Soprano instrument `Flute` and generated harmonies; network request `POST /api/generate-from-file` returned `200`.
- Confirmed arrival on `/sandbox` with generated arrangement metadata (`Violin, Flute`) and visible notation.
- Re-validated core interactions on generated score: first edit enables Undo, inspector query returns (`POST /api/theory-inspector` `200`), playback Play↔Pause works, and Export modal contains Chord Chart option.
- Current state aligns with `docs/plan.md` verification flow for MVP path (Upload → Document config → Generate → Sandbox).

## Session Log (2026-04-01)

**Note editor parity pass (Noteflight/MuseScore baseline):**
- Added measure-rest normalization in the editable score pipeline: underfilled measures auto-populate with rests; overfilled measures now trim trailing filler rests first (prevents rest-padding overflow after note insertion).
- Fixed RiffScore adapter round-trip for rests: HF -> RiffScore marks true rest events (`isRest`, `pitch: null`), and RiffScore -> HF restores rest notes instead of dropping them.
- Upgraded `/sandbox` with a modern quick-toolbar above the editor:
  - Undo/Redo
  - Duration palette (whole -> 32nd)
  - Insert Rest, Tie toggle
  - Sharp/Flat/Natural accidental buttons
  - Play/Pause + Stop transport controls
  - Shortcut help toggle
- Expanded keyboard ergonomics to match common notation workflows:
  - Cmd/Ctrl+C/X/V clipboard operations
  - Cmd/Ctrl+A select all notes
  - Cmd/Ctrl+Y redo
  - `N` arms note input (quarter default)
  - `0` inserts rest at cursor, or converts selected notes to rests
  - `?` toggles inline shortcut cheat sheet
- Build verification: `npm run build` in `harmony-forge-redesign` passes.

## Session Log (2026-04-02)

**Theory Inspector reliability + Grammarly-like highlighting pass:**
- Fixed inspector interaction wiring in `/sandbox`: violation card actions now trigger real flows (`Explain more` -> tutor chat, `Suggest fix` -> stylist suggestions).
- Added note-level SATB issue mapping in `useTheoryInspector`: local per-slot rule checks now produce `issueHighlights` with severity (`error`/`warning`) tied to real `noteId`s.
- Implemented "Show in score" behavior via chips: re-runs audit and applies inline note highlights.
- Added `ScoreIssueHighlight` model and Zustand state (`issueHighlights`) in `useTheoryInspectorStore`.
- Wired issue highlights through `sandbox/page.tsx` -> `ScoreCanvas` -> `RiffScoreEditor`.
- Added in-score Grammarly-style issue overlays in `RiffScoreEditor` (red for errors, blue for nuance/warnings) alongside ghost-note suggestion overlays.
- Build + type validation: `npm run build` passes after inspector/highlight changes.

**Harmony-only inspector + transparency (same window):**
- Highlights and structured suggest context scoped to **generated harmony parts** (not melody).
- Melody note clicks (updated 2026-04-02 follow-up): inspector open → **pitch in context** vs harmony at the same beat (no engine-origin block).
- Click harmony note with inspector open: deterministic explanation referencing engine SATB constraint categories; **baseline** preserves original pitch vs user edits.
- With `OPENAI_API_KEY` available: note click now also triggers a tutor LLM explanation grounded in deterministic evidence from the clicked slot and neighboring slot context.
- `prompts.ts`: stricter “no invention” instructions for Auditor/Tutor/Stylist.

**Centralized theory-rule constants (2026-04-02):**
- Added `src/lib/music/theoryRules.ts` as a shared SATB-rules module for inspector-side range + spacing thresholds.
- `useTheoryInspector` now reads these constants for both highlight detection and deterministic note explainability text.

**Base-next-step: engine explainability trace (2026-04-02):**
- Added backend endpoint `POST /api/validate-satb-trace` in `engine/server.ts`.
- Added `validateSATBSequenceWithTrace` in `engine/validateSATB.ts` returning per-slot findings (rule, severity, involved voices, message) alongside HER metrics.
- Rewired `useTheoryInspector.runAudit` to use engine trace as the primary source for in-score highlights; local checks remain fallback only if engine trace is unreachable.
- Rewired `useTheoryInspector.explainGeneratedNote` to use slot findings from engine trace for deterministic note reasoning + LLM grounding payload.
- Added an Inspector `Engine Evidence` card (raw trace lines) per clicked harmony note so users can inspect source findings directly.

**Env for LLM:**
- Added `harmony-forge-redesign/.env.example` + `.env.local` template; `.gitignore` exception so `.env.example` is committed.

## Session Log (2026-04-02 — Theory Inspector pitch duality)

- **Baseline:** `captureGenerationBaseline` in `theoryInspectorBaseline.ts` (harmony `noteId` → pitch; optional `validate-satb-trace` + `AuditedSlot[]` when SATB-shaped). Wired from sandbox `generatedMusicXML` effect via `queueMicrotask` after `setScore`; cleared when XML cleared.
- **Slots:** `scoreToAuditedSlots` moved to `theoryInspectorSlots.ts` for reuse.
- **Explain:** `explainNotePitch` (alias `explainGeneratedNote`) — melody branch, additive fallback with baseline, SATB path uses cached trace + `originSatbContextLines` for engine-origin facts and live `buildSatbNoteContextLines` for current pitch; `buildPitchEditDeltaFact` when edited.
- **UI:** `TheoryInspectorPanel` — comparison strip, Engine origin card, Current pitch card; header copy updated.
- **Prompts:** Tutor rules in `prompts.ts` + `NOTE_EXPLAIN_TUTOR_BRIEF` for ENGINE ORIGIN vs CURRENT and pitch-only focus.

## Session Log (2026-04-03)

**Documentation sync:** Consolidated end goal, approach, completed work, and **active failures** into `docs/progress.md` (this file). Refreshed `docs/plan.md` (current-status paragraph, **2g.8** RiffScore/patch-package checkbox, LLM verification step). Updated `docs/context/system-map.md` (implementation blurb, mermaid sandbox subgraph → RiffScore + Zustand loop, component table, data-flow steps 6–7, fixed `Taxonomy.md` run-on sentence).

---

## Prior Session Summary (2025-03-07)

**Steps done:**
1. Diagnosed "Could not parse file or no melody found" — partwise parser (xmldom) failed when loading external DTD.
2. Switched partwise parser to `fast-xml-parser` — no DTD loading; parses XML to JS object.
3. Fixed backend pitch parsing in both MusicXML parsers — note steps now map to the correct pitch classes.
4. Updated solver to use active melody notes, octave-normalize out-of-range soprano pitches, and allow more realistic SATB doublings.
5. Replaced fixed `I–IV–V–I` inference with melody-aware diatonic chord selection.
6. Reworked generated MusicXML to preserve source melody rhythm and measure structure.
7. Fixed the sandbox hook-order bug and aligned upload affordances/Makefile commands with the actual MVP path.
8. Verified the live browser flow: upload `月亮代表我的心.xml` → `/document` preview/config → `POST /api/generate-from-file` returns `200` → `/sandbox` renders the generated score.

---

## Session Log (2026-03-23)

**Milestone consolidation (M3/M4 → M5 readiness):**
- **M3**: 19/19 closed; no open issues. Genre preset, harmony validation API, engine refinement complete.
- **M4**: [#79](https://github.com/salt-family/harmonyforge/issues/79) executed for MVP scope: audio playback fixes, onboarding flow, and Theory Inspector API wiring completed in app code.
- **Docs**: plan.md and progress.md updated with M3/M4 status, M5 transition readiness.

---

## Session Log (2026-03-09)

**Audio playback — known issues (to address next):**
- Playback may still have runtime errors or incorrect note output.
- `playbackUtils.ts`: `scoreToScheduledNotes` + `scheduledNotesToSeconds` (MIN_STEP 0.001 for Tone.Part strictly increasing times).
- Next: verify note extraction from EditableScore (chords, rests, multi-part timing), pitch format for Tone.js, and MusicXML divisions/beat mapping.

**Issues & fixes:**
- **Session persistence**: `generatedMusicXML` + `sourceFileName` persisted in sessionStorage; Sandbox survives refresh. `restoreFromStorage()` on mount.
- **CORS**: Configurable via `CORS_ORIGIN` env var (default `http://localhost:3000`).
- **Edit mode toggle**: View (OSMD) vs Edit (VexFlow) in Action Bar; enables note tools when Edit selected.
- **CLI args**: `-i/--input`, `-o/--output`, `--mood`, `--instruments` (e.g. `Soprano:Flute,Bass:Cello`).
- **ADR**: `docs/adr/001-sandbox-display-mode.md` added.

**Audio playback (Sandbox):**
- **Playback utils**: `playbackUtils.ts` — `scoreToScheduledNotes()`, `scheduledNotesToSeconds()`; converts EditableScore to timed events for Tone.js.
- **usePlayback hook**: Tone.js Synth + Part; play/pause/stop; `Tone.start()` on first user gesture; auto-stop when playback ends.
- **Sandbox wiring**: SandboxPlaybackBar play/pause triggers actual audio; skip back/forward, rewind, fast-forward stop playback.
- **Build**: Next.js build passes.

**#74 Engine refinement (HFLitReview/NotebookLM):**
- Validation ordering documented in constraints.ts (hard checks first).
- Solver parsimony: candidateMotionScore prefers smaller motion.
- 6 explicit chord progression tests: ii–V–I, I–vi–IV–V, i–iv–V–i, I–V–vi–IV, V7–I, ii7–V7–I.
- `docs/Engine-Test-Run-Log.md` — test matrix + future recommendations.

**Genre preset + Milestone 3:**
- **Genre preset**: Added to EnsembleBuilderPanel (Classical, Jazz, Pop). Affects harmony theory only: chord inference (triads vs 7ths vs cyclical), voice-leading strictness (strict vs relaxed). Instruments unchanged.
- **Engine**: `GenerationConfig.genre`, `inferChords(parsed, mood, genre)`, `ensureChords(parsed, mood, genre)`, `generateSATB(leadSheet, { genre })`. Jazz: 7th chords, ii–V–I transitions, relaxed first. Pop: bVII/bVI, cyclical schemas, relaxed first.
- **Theory Inspector prep**: `docs/Theory-Inspector-Prep.md` — genre→Taxonomy mapping, future RAG integration points. No AI wired.

**Next steps + Sandbox + Export:**
- **#75**: Closed on GitHub (salt-family/harmonyforge).
- **Score Preview in Export**: ScorePreviewPane now receives `musicXML` and renders via OSMDPreview; ExportModal passes score/generated MusicXML.
- **Score Review**: ExportOptionsPane has "Score Review" section with "Validate harmony" button; calls `POST /api/validate-from-file`; shows HER and violation counts.
- **Multi-select tool filter**: ScorePalette filter dropdown is multi-select (checkboxes); `activeFilters` array; select SCORE + EDIT + DURATION etc. to show multiple tool groups.
- **Backend**: Added `POST /api/validate-from-file` for MusicXML file validation.

---

## Session Log (2026-03-08)

**Blank canvas fix:**
- **Root cause:** ScoreCanvas preferred VexFlow when `score` existed. VexFlow can render nothing without throwing; OSMD fallback was never reached.
- **Fix:** Prefer OSMD when `musicXML` exists (mirrors ScorePreviewPanel). Logic: `musicXML ? OSMD : (score && !vexFlowCrashed ? VexFlow : null)`.
- **Layout:** `min-h-0` → `min-h-[280px]` on ScoreCanvas base to prevent flex collapse.
- **VexFlow error handling:** `onError` prop, `handleVexFlowError` (useCallback), fallback to OSMD on crash.
- **vexflowHelpers:** 32nd rest in beatsToRestNotation; `Math.round(rawBeats * 1000) / 1000` for measureBeats.
- **Document page:** Default instrument selections set to empty arrays (no instruments selected by default).

---

## Session Log (2025-03-08)

**Backend–frontend integration:**
- Backend: `http://localhost:8000` (engine/server.ts, CORS allows localhost:3000)
- Frontend: `http://localhost:3000` (Next.js, uses `NEXT_PUBLIC_API_URL` or defaults to localhost:8000)
- Added `harmony-forge-redesign/.env.example` for `NEXT_PUBLIC_API_URL`
- Run: `make dev-clean && make dev` (kills 8000/3000/3001, starts full stack)

**Score preview and sandbox rendering:**
- VexFlow EasyScore format: pitch notation changed from `c/4/q` to `C4/q` (VexFlow 5 expects `C4/q`).
- MusicXML parser: added namespace-aware fallbacks (`findAllByLocalName`, `findByLocalName`) for part, measure, note, pitch, step, alter, octave, type, dot — handles namespaced and DTD-based MusicXML.
- **OSMD**: Added `OSMDPreview.tsx`, `timewiseToPartwise.ts`; Document and Sandbox use OSMD when raw MusicXML available.

**VexFlow multi-measure rendering (iterative fixes):**
- **Too many ticks:** One voice per part with all measures + bar notes; timeSig = total beats (e.g. `20/4` for 5 measures).
- **TickMismatch (one voice per measure):** Tried one voice per measure per part → VexFlow expects stacked voices to have same ticks → failed.
- **TickMismatch (one voice per part):** Multiple staves (S/A/T/B) each with one voice; VexFlow `system.format()` requires all voices across staves to have same total duration.
- **Fix:** Compute `maxTotalBeats` across all parts; use same `timeSig` for every voice; pad shorter voices with rests via `beatsToRestNotation(padBeats)`.
- **Helpers:** `notesToBeats(notes)`, `beatsToRestNotation(beats)` in `vexflowHelpers.ts`.

**Generate Harmonies fix:**
- Solver: non-chord-tone handling (don't fix soprano when melody note not in chord).
- Relaxed fallback: `checkVoiceLeadingRelaxed` in `constraints.ts`; retry when strict fails.
- Variable parts: `satbToMusicXML.ts` outputs only voices with selected instruments.

**Session 2025-03-08 (Algorithmic Engine & App Integration):**
- **CLI test**: Created `input/`, `output/`, `scripts/run-engine-cli.ts`, `make test-engine`. Runs engine on `月亮代表我的心.xml` with flute+cello, major mood → outputs partwise MusicXML.
- **MuseScore "Bad format" fix**: Engine output rejected by MuseScore. Added `format: "partwise"`, `version: "2.0"` to satbToMusicXML; added `<mode>` to key. CLI and API now output MuseScore-compatible partwise.
- **Additive harmonies**: User wanted melody + additional harmonies (not replacement). Added `melodyPartName` to ParsedScore; partwise parser extracts from part-list. `satbToMusicXML` option `additiveHarmonies: true`: Part 1 = melody (original name), Parts 2+ = harmony instruments. Soprano instruments → Alto voice.
- **App integration**: API returns partwise 2.0. `useUploadStore` adds `sourceFileName` (set from file name on upload). Sandbox playback bar uses `sourceFileName` for title, `extractMusicXMLMetadata` for subtitle (part names).

---

## Steps Completed

### Phase 1: Ultimate Context Framework
- [x] Created directory structure: `.cursor/rules/`, `docs/adr/`, `docs/context/`
- [x] Created `docs/plan.md` (Objective/Research/Plan/Verification)
- [x] Created `docs/progress.md` (RALPH Loop)
- [x] Created `docs/context/system-map.md`
- [x] Created `Makefile` for tech stack
- [x] Created `.cursor/rules/architecture.mdc` (Senior Context Engineer protocol)
- [x] Created `docs/README.md` index; `docs/adr/.gitkeep`

### Phase 2: Context Population from HFLitReview
- [x] Queried HF LitReview notebook for HarmonyForge vision, architecture, MVP scope
- [x] Populated `docs/plan.md`, `docs/progress.md`, `docs/context/system-map.md` with extracted content
- [x] Documented three-stage architecture: Logic Core → Tactile Sandbox → Theory Inspector

### Phase 3: Taxonomy / RAG Lexicon
- [x] Created `Taxonomy.md` as canonical RAG source for Theory Inspector
- [x] Extracted music theory from HFLitReview sources (Classical, Schenkerian, Jazz, Pop/Rock, Mariachi, Post-tonal)
- [x] Updated docs to reference `Taxonomy.md` as RAG source

### Phase 4: Frontend Integration (Design Baseline)
- [x] Identified `harmony-forge-redesign/` as the Tactile Sandbox frontend to design around
- [x] Documented frontend stack: Next 16, React 19, Tailwind, VexFlow, Tone, Zustand, Framer Motion
- [x] Documented existing components: TheoryInspectorPanel, ScoreCanvas, ScoreDropzone, EnsembleBuilderPanel, ExportModal
- [x] Documented frontend pages (see table below)

**Frontend pages (design baseline)** — `harmony-forge-redesign/src/app/`:

| Route | Page | Role |
|-------|------|------|
| `/` | `page.tsx` (Playground) | Step 1: Upload. DropzoneCopy, BrandTitle. On drop → store file in useUploadStore, navigate to /document. |
| `/document` | `document/page.tsx` | Step 2: Config. ScorePreviewPanel (left), EnsembleBuilderPanel (right). Mood (major/minor) + instruments → Generate → POST /api/generate-from-file → store MusicXML → /sandbox. |
| `/sandbox` | `sandbox/page.tsx` | Step 3: Edit. ScoreCanvas, ScorePalette, TheoryInspectorPanel, ExportModal. Direct note manipulation wired (selection, edit/duration/pitch/articulation/dynamics/measure/score tools). |

### Phase 5: Logic Core (Backend)
- [x] Scaffolded `engine/` package (Node.js/TypeScript)
- [x] Defined shared types: `LeadSheet`, `ChordSlot`, `SATBVoices`, `ParsedScore`, `GenerationConfig`, pitch/range helpers
- [x] Implemented chord parser: Roman numerals (I, ii, V7, etc.) → pitch classes; key context (C major, A minor)
- [x] Implemented backtracking solver: assign S/A/T/B per chord slot; enforce range, spacing, parallel fifths/octaves, voice crossing
- [x] Melody placement: soprano = given melody when provided; else solver chooses within range
- [x] REST API: `POST /api/generate-satb` accepts JSON lead sheet, returns SATB JSON (port 8000)
- [x] Unit tests: chordParser, constraints, solver, api.integration (24+ tests); `make test` and `make lint` pass

### Phase 6: File Format Pipeline
- [x] Input parsers: `engine/parsers/musicxmlParser.ts` (MusicXML → ParsedScore), `engine/parsers/midiParser.ts` (MIDI → ParsedScore)
- [x] Canonical format: `ParsedScore` (key, melody, chords?) in `engine/types.ts`
- [x] Chord inference: `engine/chordInference.ts` — infers I–IV–V–I (or i–iv–v–i) when no chords in file
- [x] SATB → MusicXML: `engine/satbToMusicXML.ts` — custom builder for SATB grand staff
- [x] Endpoint: `POST /api/generate-from-file` (multipart: `file`, optional `config`) — accepts .xml, .mid, .midi; PDF/MXL return 501; returns MusicXML string

### Phase 7: Engine Config Support
- [x] Types: `GenerationConfig` { mood?: "major"|"minor", instruments?: Record<Voice, string[]> }
- [x] API: Accept `config` form field (JSON string); validate; pass to pipeline
- [x] Chord inference: mood overrides key mode when inferring chords (major vs minor progressions)
- [x] MusicXML: Use `instruments` for part names in output (first selected label per voice)

### Phase 8: Frontend–Backend Wiring (Document Page)
- [x] Created `useUploadStore` (file, generatedMusicXML)
- [x] Upload page: store file in useUploadStore on drop, navigate to /document
- [x] EnsembleBuilderPanel: added mood selector (Major/Minor); `onGenerateHarmonies` passes `{ mood, instruments }`
- [x] Document page: calls `POST /api/generate-from-file` with file + config; stores MusicXML; navigates to /sandbox; shows error on failure

### Phase 9: Tactile Sandbox Note Editor
- [x] MusicXML parser (`musicxmlParser.ts`), score types (`scoreTypes.ts`), VexFlow helpers (`vexflowHelpers.ts`)
- [x] VexFlowScore: renders EditableScore with VexFlow 5, ResizeObserver, proxy buttons for accessibility
- [x] useScoreStore: score, history, undo/redo, visibleParts, clipboard
- [x] useToolStore: activeTool, selection, toggleNoteSelection
- [x] ScorePalette: tool IDs, onToolSelect wired for all palette tools
- [x] Edit tools: Undo, Redo, Cut, Copy, Paste, Delete (keyboard: Delete, Cmd+Z, Cmd+V)
- [x] Duration tools: whole through 32nd, dotted
- [x] Pitch tools: up/down semitone, up/down octave
- [x] Articulation: staccato, tenuto, accent, marcato, fermata, trill
- [x] Dynamics: piano, crescendo, decrescendo
- [x] Measure: insert before/after, delete
- [x] Score tools: Layers (part visibility), Copy, Print, Save, Export (ExportModal)
- [x] scoreToMusicXML: serialize EditableScore for export

### Phase 10: Document Page Score Preview
- [x] Parse uploaded MusicXML client-side when file is .xml/.musicxml
- [x] extractMusicXMLMetadata: work-title, part names from part-list
- [x] ScorePreviewPanel: render VexFlowScore when score parsed; StaffLinePlaceholder when null
- [x] Support score-partwise (MuseScore exports) in addition to score-timewise
- [x] Namespace-tolerant parsing: findByLocalName, getElementsByTagName fallback for namespaced MusicXML
- [x] Min canvas height (280px) for VexFlow container

### Phase 11: Generate Harmonies UX
- [x] Disable Generate button during generation (isGenerating prop)
- [x] TransitionOverlay shows "Generating Harmonies" / "Applying voice-leading rules…" for full request

### Phase 12: VexFlow & Engine Fixes
- [x] IncompleteVoice: add whole rest (`B4/w/r`) for empty parts so VexFlow Voice has tickables
- [x] BadElementId: container.isConnected check in ResizeObserver; unique elementId; prevent render when detached
- [x] requestAnimationFrame for initial VexFlow render (wait for layout)
- [x] MIDI parser: change `import { Midi }` to default `import Midi` (@tonejs/midi ESM export)

---

## Current Status

**Working:**
- **Parsing**: Partwise MusicXML parses via `fast-xml-parser` (no DTD), and pitch conversion now maps note steps correctly. `POST /api/debug-parse` and `POST /api/generate-from-file` parse 月亮代表我的心.xml successfully.
- **VexFlow multi-measure**: One voice per part, bar notes between measures, timeSig = total beats; shared maxTotalBeats + rest padding for TickMismatch (in progress)
- **Parser**: Dotted notes (`<dot/>`) parsed
- **Sandbox**: State declarations moved before handleToolSelect (fixes use-before-declare)
- **Redirects**: /document without file → /; /sandbox without generatedMusicXML → /document
- **Playground**: 800ms delay before redirect (was 2s)
- **Solver**: Active-note matching, soprano octave normalization, and relaxed doublings allow real uploaded melodies to generate successfully.
- **Chord inference**: Deterministic melody-aware diatonic inference replaces the old fixed `I–IV–V–I` loop.
- **Generated output**: Backend emits partwise MusicXML 2.0 (additive harmonies: melody + selected instruments) that preserves source melody rhythm and reaches the sandbox intact.
- **Browser verification**: Live browser test passed for upload, document preview/config, generate request (`POST /api/generate-from-file` → `200`), sandbox navigation, and score render.

**Known follow-up (non-blocking):** Blank canvas fixed — ScoreCanvas prefers OSMD when musicXML exists. VexFlow edit tools (click-on-staff, note selection) inactive when OSMD used; re-enable when VexFlow reliable. `harmony-forge-redesign` has unrelated frontend lint debt outside the critical path; `make lint` remains backend-focused.

**To test:** Run `make dev-clean`, then `make dev-backend` (port 8000) and `make dev-frontend` (port 3000). Upload MusicXML (e.g. 月亮代表我的心.xml), configure mood + instruments, click Generate Harmonies.

**Quick verification:** `make test && make lint && make build` — backend tests/lint pass and frontend production build passes before manual flow test.

### Phase 13: Backend Partwise Fallback (2025-03-07)
- [x] Added `engine/parsers/partwiseParser.ts` — DOM-based parser for score-partwise (no xsltproc)
- [x] `parseMusicXML` now falls back to partwise parser when musicxml-interfaces fails or returns empty melody
- [x] Fixes "Could not parse file or no melody found" for partwise files (e.g. Noteflight, MuseScore exports)

### Phase 14: Partwise Parser — fast-xml-parser (2025-03-07)
- [x] **Root cause**: Original partwise parser used `@xmldom/xmldom`. When parsing MusicXML with `<!DOCTYPE>` referencing external DTD, xmldom attempted to load the DTD and failed in server env → returned `null` / "invalid doc source" → "Could not parse file or no melody found"
- [x] **Fix**: Replaced xmldom with `fast-xml-parser` in `engine/parsers/partwiseParser.ts`. No DTD loading; parses XML to JS object; traverses `score-partwise` → `part` → `measure` → `note` (pitch/rest, duration)
- [x] **Verification**: `POST /api/debug-parse` returns `parsed: { melodyCount: 14, key: { tonic: "C", mode: "major" } }` for 月亮代表我的心.xml; `POST /api/generate-from-file` now parses successfully
- [x] **Follow-up fixes**: Corrected pitch-class mapping in the backend MusicXML parsers, updated chord inference/solver behavior, and restored successful generation for `月亮代表我的心.xml`

---

## Learnings

### Milestone 3/4 Issues (2026-03-23)
- **M3 (XAI Backend & Architecture)**: Complete — 19/19 issues closed. Genre preset, harmony validation API, engine refinement, Theory Inspector RAG prep all done.
- **M4 (Frontend Development & Interactivity)**: Consolidated into [#79](https://github.com/salt-family/harmonyforge/issues/79) and executed for MVP. Completed: (1) audio playback hardening, (2) onboarding flow, (3) Theory Inspector API wiring with fallback/optional OpenAI.
- **#75 Accessibility (M4)**: Closed. Skip link and focus rings in layout.tsx/globals.css.
- **Harmony validation API (M3)**: Implemented:
  - `engine/validateSATB.ts` — `validateSATBSequence(slots)` returns `{ violations, totalSlots, her, valid }`.
  - `POST /api/validate-satb` — accepts `{ leadSheet }` or `{ slots }`; returns HER-style metrics.
  - `POST /api/validate-from-file` — accepts MusicXML file; parse → infer → generate SATB → validate.
  - Export modal Score Review: "Validate harmony" button calls validate-from-file; shows HER and violation counts.

### From HF LitReview (57 sources)
- **HarmonyForge** is a three-stage Glass Box system: (1) Logic Core, (2) Tactile Sandbox, (3) Theory Inspector.
- **Repair Phase Bottleneck**: SOTA probabilistic models cause "Structural Drift" — parallel fifths, cadential errors, voice-crossing. Time saved by AI is lost to manual auditing.
- **Deterministic > Probabilistic**: Constraint-satisfaction solver guarantees theoretically valid SATB; no hallucination.
- **Target users**: Gigging musicians, music educators/students, chamber ensemble coordinators.
- **Taxonomy.md**: RAG lexicon for Theory Inspector; extracted from HFLitReview sources.

### SATB Constraints (Taxonomy.md §1.6)
- Range: S C₄–G₅, A G₃–D₅, T C₃–G₄, B F₂–D₄
- Spacing: ≤1 octave between S–A, A–T; ≤12th T–B
- Parallel fifths/octaves forbidden; voice crossing/overlap; one-direction rule

### Note Editor 2g (2025-03-08)
- **VexFlow TickMismatch fix**: Use fixed 4 beats per measure for all parts; pad each measure to 4 beats; all voices have identical total ticks. Floating-point rounding in measureBeats; 32nd rest support in beatsToRestNotation.
- **Display priority**: Prefer **OSMD** when `musicXML` exists (reliable display); VexFlow when no musicXML (or when vexFlowCrashed fallback). VexFlow can render blank without throwing — OSMD guarantees visible score.
- **Click-on-staff**: Duration tool active → click canvas inserts note at selection cursor or first measure (VexFlow path).
- **Keyboard shortcuts**: A–G set pitch letter; 1–6 set duration; ↑/↓ semitone; Ctrl+↑/↓ octave.
- **Action bar**: SandboxActionBar (Undo, Redo, Delete) always visible.
- **Voice lanes**: activePartId tracks selected part for insertion.

### Additive Harmonies (2025-03-08)
- **Semantics**: User's melody stays as Part 1 (original part name from input). Selected instruments (flute, cello) are **added** as harmony parts, not replacements.
- **Mapping**: Soprano instruments → Alto voice (high harmony); Alto/Tenor/Bass → their voices.
- **ParsedScore.melodyPartName**: Extracted from part-list's first score-part in partwise parser.

### Parser Architecture (Phase 14)
- **MusicXML partwise**: `fast-xml-parser` — no DTD loading; parses to JS object; traverses `score-partwise` → `part` → `measure` → `note`. Used when `musicxml-interfaces` fails or returns empty melody.
- **MusicXML timewise**: `musicxml-interfaces` (uses xmldom internally; may fail on DTD).
- **Pitch conversion fix**: Backend parsers now map note steps (`C D E F G A B`) to semitone pitch classes correctly instead of using character index order.
- **Debug**: `POST /api/debug-parse` with raw XML body (express.raw) returns `{ bodyLength, hasPartwise, parsed }`.

### Audio Playback (2026-03-23)
- **Tone.js**: usePlayback + playbackUtils now handle rests and per-measure timing.
- **Timing correctness**: score scheduling uses measure time signatures when present, and keeps beat cursor aligned across measures.
- **Runtime stability**: transport cancellation before replay, PolySynth playback for overlapping notes, and pitch-safe filtering for invalid note tokens.

### API Contract
- `POST /api/generate-satb`: JSON body `LeadSheet` → SATB JSON
- `POST /api/generate-from-file`: multipart `file` + optional `config` (JSON: `{ mood, genre?, instruments }`) → partwise MusicXML 2.0 (additive harmonies). Genre affects chord inference and voice-leading strictness only.
- `POST /api/validate-satb`: JSON body `{ leadSheet?: LeadSheet }` or `{ slots?: Array<{ voices: SATBVoices }> }` → `{ violations, totalSlots, her, valid }` (HER-style metrics)
- `POST /api/validate-from-file`: multipart `file` (MusicXML .xml) → same validation result (parse → infer chords → generate SATB → validate)

### Generate Harmonies Flow (verified)
1. **Document page**: User configures mood (Major/Minor) and instruments per voice (e.g. Flute, Cello).
2. **Generate Harmonies** (button): Triggers `handleGenerate` → TransitionOverlay shows "Generating Harmonies" / "Applying voice-leading rules…".
3. **API**: POST file + config to `http://localhost:8000/api/generate-from-file`.
4. **Backend engine**: Parses file → extracts melody + `melodyPartName` → infers chords (mood) → SATB solver → **additive** MusicXML (melody + harmony parts).
5. **On success**: `setGeneratedMusicXML(musicXML)` → `router.push("/sandbox")`.
6. **Sandbox**: Parses `generatedMusicXML` → ScoreCanvas (OSMD) renders melody + harmonies; playback bar shows source file name and part names.
7. **Run**: `make dev-clean && make dev` (ports 8000 + 3000).

---

## Verification (2025-03-08)

- **make verify** (test + lint + build): Pass
- **make test-engine**: Pass — outputs `月亮代表我的心_flute_cello.xml`
- **API**: `POST /api/generate-from-file` returns 200 with partwise MusicXML (Violin + Flute + Cello)
- **VexFlow**: Guard for empty partsToRender; fallback to all parts when filter yields empty; onError + fallback to OSMD
- **Flow**: Upload → Document (preview) → Generate → Sandbox with score displayed (OSMD)

## Learnings: MIDI & PDF Parsing (2026-03-09)

**MIDI (current):** Uses @tonejs/midi; extracts melody from first track. Format 1 MIDI files often have track 0 as meta-only (tempo, time sig) — melody in tracks 1+. @tonejs/midi exposes `header.keySignatures` and `header.timeSignatures`.

**MIDI best practices:** (1) Find first track with notes (skip empty meta track). (2) Extract key from `header.keySignatures[0]` (key + scale). (3) Extract time sig from `header.timeSignatures[0]` (numerator, denominator). (4) Skip percussion (channel 9) when picking melody track.

**PDF:** Implemented: spawn Audiveris when in PATH; else 501 with conversion instructions. MXL parsing added (adm-zip) for Audiveris/MuseScore .mxl output.

---

## Learnings: Robust MusicXML Input (2026-03-09)

**User request:** App should work with any type of XML, regardless of complexity. 月亮代表我的心.xml is just one example.

**Implementation:**
- **timewiseParser.ts**: New parser for score-timewise (measure → part → note). Uses fast-xml-parser with removeNSPrefix.
- **partwiseParser.ts**: removeNSPrefix, flexible root detection (score-partwise or namespaced), grace notes skipped, chords (first pitch), zero-duration guard.
- **musicxmlParser.ts**: Tries partwise/timewise parsers first (no DTD); falls back to musicxml-interfaces only when custom parsers fail.
- **Tests**: score-timewise, namespaced (MuseScore-style) XML.

**Known limitations:** Multi-voice backup/forward not yet handled (melody from first voice). Tuplets use nominal duration.

---

## Learnings: Unique Parts Per Instrument (2026-03-09)

**User request:** Each instrument should have its own unique harmony part, even when sharing the same voice range (e.g., flute and violin both soprano → different harmonies).

**Current behavior:** In `satbToMusicXML.ts`, all instruments in the same voice group receive identical events (`allPartEvents[VOICE_ORDER.indexOf(p.voice)]`). Flute + Violin (both soprano) both get the same Alto part.

**NotebookLM (HF LitReview) best practices:**
- Use **different chord tones** via divisi; avoid over-doubling the third.
- **Octave displacement** for register transfer when parts crowd.
- **Voice-leading differentiation**: contrary motion, linear independence.
- Keep essential harmonic pitches across the ensemble.

**Implementation approach:** For N instruments in the same voice group, derive N unique parts from the SATB by assigning different chord tones (S, A, T, B) with octave transposition as needed. Rotation: inst 0 → primary voice; inst 1 → secondary (different chord tone, octave-adjusted); inst 2 → tertiary; etc.

---

## Next Steps

**MVP (M4 #79):** Core engine + upload → generate → sandbox path is in place. **M5 (User Study & Evaluation):** can proceed once dev friction below is acceptable.

**Immediate (2026-04 — see Consolidated status):**
1. **RiffScore playback samples** — Serve or proxy `/audio/piano/*.mp3` (or disable built-in sampler UX) so piano playback is not 404/no-op.
2. **LLM in dev** — `OPENAI_API_KEY` in `harmony-forge-redesign/.env.local`; restart `make dev`; confirm `GET /api/theory-inspector` → `hasApiKey: true`.
3. **Turbopack / lockfiles** — Resolve multi-lockfile warning (e.g. `turbopack.root` or single-lockfile layout).

**Deferred:** JSON-based score deltas for backend sync (Theory Inspector integration).

**Historical (completed — pre–RiffScore-primary era may reference OSMD/VexFlow toggles):**
1. ~~**Fix Next.js dev server**~~ — Resolved: run `npm install` in `harmony-forge-redesign/`
2. ~~**Render MusicXML in ScoreCanvas**~~ — Done: parseMusicXML, VexFlowScore, useScoreStore
3. ~~**Selection + active tool**~~ — Done: useToolStore, ScorePalette onToolSelect, Escape/click to clear
4. ~~**Wire Edit tools**~~ — Done: Undo, Redo, Cut, Copy, Paste, Delete
5. ~~**Enable direct note manipulation**~~ — Done: duration/pitch/articulation/dynamics/measure/score tools
6. ~~**Document page preview**~~ — Done: parse uploaded MusicXML, ScorePreviewPanel; namespace-tolerant parser
7. ~~**Fix "Could not parse file or no melody found"**~~ — Done: partwise parser → fast-xml-parser
8. ~~**Resolve VexFlow TickMismatch**~~ — Done (2g.1 era): measure padding; OSMD when `musicXML` for reliable display
9. ~~**Sandbox View/Edit + VexFlow tools**~~ — Done historically; **current primary editor is RiffScore** (see Consolidated status).
10. ~~**App-level audio (`usePlayback`)**~~ — Done: rest-aware/measure-aware scheduling; coexists with RiffScore internal playback (separate concern).
11. **Optional: reduce frontend lint debt** — Remaining `harmony-forge-redesign` lint errors may be outside hot path
12. ~~**Sandbox metadata**~~ — Done: playback bar `sourceFileName` + `extractMusicXMLMetadata`
13. ~~**Theory Inspector wiring**~~ — Done: routes + validation context + optional OpenAI; **harmony-only** highlights and suggest path refined in 2026-04-02.

---

## Config Flow

- **Frontend:** `EnsembleBuilderPanel` sends `{ mood, instruments }` where `instruments` is `Record<VoiceType, string[]>` (e.g. `soprano: ["Flute"], bass: ["Cello"]`).
- **Backend:** `parseConfig` maps `soprano` → `Soprano`, etc.
- **Additive harmonies:** When generating from file, melody is always Part 1 (original name). Selected instruments become **additional** harmony parts. Soprano instruments → Alto voice; Alto/Tenor/Bass → their voices. Example: Flute (soprano) + Cello (bass) → output: Melody (Violin) + Flute (Alto) + Cello (Bass).

---

## State Handover

**When context is noisy:** Paste summary here before starting fresh chat.

**Handover template (2026-04):**
- **End goal:** Upload → Document (preview + config) → Generate → Sandbox with editable score, export, and reliable playback where configured. Engine **adds** harmonies (melody + selected instruments), not replacement.
- **Approach:** `EditableScore` in Zustand + **RiffScore** sync (`riffscoreAdapter`, `useRiffScoreSync`, `normalizeScoreRests`); **`patch-package`** on `riffscore` for `ui.toolbarPlugins`. Theory Inspector: deterministic engine + taxonomy context; **harmony-only** in-score UX; optional OpenAI via `.env.local`.
- **Current status / failures:** (1) RiffScore `/audio/piano/*.mp3` **404** in dev, (2) LLM off until `OPENAI_API_KEY` + restart, (3) Turbopack multi-lockfile warning, (4) older doc bullets may still describe OSMD/VexFlow-first sandbox — use **Consolidated status (2026-04)** as source of truth.
- **Key files:** `RiffScoreEditor.tsx`, `useRiffScoreSync`, `riffscoreAdapter.ts`, `scoreUtils.ts` (rests), `patches/riffscore+*.patch`, `useTheoryInspector.ts`, `useTheoryInspectorStore.ts`, `inspectorTypes.ts`, `prompts.ts`, `ScoreCanvas.tsx`, `sandbox/page.tsx`, `.env.example`.
- **Run:** `make dev-clean && make dev` → http://localhost:3000 (Next) + engine on :8000. `make test-engine` for CLI.
