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
4. **Fix frontend display** — Document preview and Sandbox render scores reliably; OSMD for display, VexFlow for editable tools when parse succeeds.
5. **Variable parts** — Generator outputs melody + harmony parts only (e.g. melody + flute + cello = 3 parts). Soprano instruments map to Alto voice; Alto/Tenor/Bass map to their voices.

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
30. **Audio playback** — `usePlayback` hook (Tone.js), `playbackUtils.ts`; play/pause/stop wired to SandboxPlaybackBar. **Issues remain:** runtime errors, wrong notes (to fix next).

---

## Current Failure We're Working On

**Audio playback (2026-03-09):** Playback in Sandbox has two issues to address next:
1. **Playback reliability** — May still throw (e.g. Tone.Part timing). Fixed "Start time must be strictly greater than previous start time" via `scheduledNotesToSeconds` (MIN_STEP offset for chords), but other runtime issues may remain.
2. **Wrong notes** — Playback does not play the correct notes; score-to-events mapping or pitch conversion needs investigation (e.g. EditableScore note ordering, chord/rest handling, MusicXML divisions vs beats).

**Deferred:** VexFlow edit tools were re-enabled via Edit mode toggle (View vs Edit in Action Bar).

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

### Milestone 3/4 Issues (2026-03-09)
- **#75 Accessibility (M4)**: Closed. Skip link and focus rings in layout.tsx/globals.css. Focus ring uses var(--hf-text-primary) for 2px contrast per WCAG §1.4.11. Contrast audit: Sonata #ffb300 on #fdf5e6 — focus rings use text-primary; skip link uses accent bg + dark text.
- **#76, #74**: Excluded per user (genres, parameter tuning).
- **Harmony validation API (M3)**: HFLitReview recommends HER, parallel fifths/octaves, voice-leading. Implemented:
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

### Audio Playback (2026-03-09)
- **Tone.js**: usePlayback hook, playbackUtils (scoreToScheduledNotes, scheduledNotesToSeconds). Play/pause/stop wired to SandboxPlaybackBar.
- **Tone.Part**: Requires strictly increasing event times; MIN_STEP 0.001s offset for simultaneous notes (chords).
- **Issues (to fix):** Runtime errors may persist; playback does not play correct notes. Likely causes: score-to-events mapping, chord/rest handling, pitch format for Tone, or MusicXML divisions vs beat conversion.

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

1. ~~**Fix Next.js dev server**~~ — Resolved: run `npm install` in `harmony-forge-redesign/`
2. ~~**Render MusicXML in ScoreCanvas**~~ — Done: parseMusicXML, VexFlowScore, useScoreStore
3. ~~**Selection + active tool**~~ — Done: useToolStore, ScorePalette onToolSelect, Escape/click to clear
4. ~~**Wire Edit tools**~~ — Done: Undo, Redo, Cut, Copy, Paste, Delete
5. ~~**Enable direct note manipulation**~~ — Done: duration/pitch/articulation/dynamics/measure/score tools
6. ~~**Document page preview**~~ — Done: parse uploaded MusicXML, VexFlowScore in ScorePreviewPanel; namespace-tolerant parser
7. ~~**Fix "Could not parse file or no melody found"**~~ — Done (Phase 14): Switched partwise parser to fast-xml-parser
8. ~~**Resolve VexFlow TickMismatch**~~ — Done (2g.1): Fixed 4 beats per measure; pad per measure; prefer OSMD when musicXML exists for reliable display (blank canvas fix)
9. ~~**Re-enable VexFlow edit tools**~~ — Done: Edit mode toggle (View/Edit) in SandboxActionBar; Edit uses VexFlow for note tools
10. **Fix audio playback** — Playback has runtime issues and plays wrong notes; verify score-to-events extraction, pitch format, chord/rest timing.
11. **Optional: reduce frontend lint debt** — Remaining `harmony-forge-redesign` lint errors are outside the restored MVP path
12. ~~**Optional: improve sandbox metadata**~~ — Done: Playback bar uses `sourceFileName` and `extractMusicXMLMetadata` for title/subtitle
13. **Connect Theory Inspector** — Replace mock replies with RAG retrieval from `Taxonomy.md`
14. **JSON-based score deltas** — State sync with backend (deferred to Theory Inspector integration)

---

## Config Flow

- **Frontend:** `EnsembleBuilderPanel` sends `{ mood, instruments }` where `instruments` is `Record<VoiceType, string[]>` (e.g. `soprano: ["Flute"], bass: ["Cello"]`).
- **Backend:** `parseConfig` maps `soprano` → `Soprano`, etc.
- **Additive harmonies:** When generating from file, melody is always Part 1 (original name). Selected instruments become **additional** harmony parts. Soprano instruments → Alto voice; Alto/Tenor/Bass → their voices. Example: Flute (soprano) + Cello (bass) → output: Melody (Violin) + Flute (Alto) + Cello (Bass).

---

## State Handover

**When context is noisy:** Paste summary here before starting fresh chat.

**Handover template (2026-03-09):**
- **End goal:** Upload → Document (preview + config) → Generate → Sandbox with editable score and working audio playback (Noteflight/MuseScore-style). Engine **adds** harmonies (melody + flute + cello = 3 parts), not replacement.
- **Approach:** Additive harmonies; partwise MusicXML 2.0 (MuseScore/OSMD); variable parts. **View mode** (OSMD) for display; **Edit mode** (VexFlow) for note tools. Session persistence for Sandbox. CORS via `CORS_ORIGIN`.
- **Current failure:** Audio playback — may still throw; plays wrong notes. Next: fix score-to-events extraction, pitch format for Tone.js, chord/rest timing.
- **Key files:** `usePlayback.ts`, `playbackUtils.ts` (scoreToScheduledNotes, scheduledNotesToSeconds), `ScoreCanvas.tsx` (displayMode), `SandboxActionBar.tsx` (View/Edit toggle), `useUploadStore.ts` (sessionStorage restore), `engine/server.ts` (CORS_ORIGIN).
- **Run:** `make dev-clean && make dev` → http://localhost:3000. `make test-engine` → CLI test (supports `-i`, `-o`, `--mood`, `--instruments`).
