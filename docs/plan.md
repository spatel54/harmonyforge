# Plan

> **Current status:** Logic Core complete (1.1–1.9). Tactile Sandbox feature scope complete (2a–2d, 2f, 2g): MusicXML render, selection/edit tooling, Document preview, Generate flow, variable-part generation, and keyboard-first note input conventions. **Additive harmonies:** Engine adds harmony parts to melody (melody + flute + cello = 3 parts). **API/CLI:** Partwise MusicXML 2.0 (MuseScore/OSMD compatible). **CLI:** `make test-engine`; supports `-i`, `-o`, `--mood`, `--instruments`. **End-to-end flow:** Upload → Document → Generate → Sandbox. **Display model:** reliability-first View mode (OSMD) with Edit mode fallback path and safety overlay while VexFlow edit renderer stabilizes. Session persistence via sessionStorage; CORS configurable via `CORS_ORIGIN`. **Audio playback:** stabilized (rest-aware timing, measure-aware scheduling, chord-safe transport). **Theory Inspector:** wired to `/api/theory-inspector` with validation context + OpenAI optional fallback mode and measure highlights (red/blue) returned to canvas.
>
> **Milestones:** M3 (XAI Backend & Architecture) complete (19/19 closed). M4 (Frontend) consolidated in [#79](https://github.com/salt-family/harmonyforge/issues/79) and now complete for MVP scope (audio, onboarding, inspector wiring). **M5 (User Study)** next.

## Objective

Build **HarmonyForge** — a Glass Box co-creative system that bridges the "Repair Phase Bottleneck" in symbolic music arrangement. The system rejects probabilistic "Black Box" AI in favor of deterministic, rule-based logic and explainable artificial intelligence (XAI). Goals:

- **Expressive Sovereignty**: Provide a "Jumping Pad" that respects the user's train of thought; the musician remains the ultimate author.
- **Copyright Safety by Design**: Use axiomatic music theory (e.g., Schenkerian analysis) instead of pattern mimicry from copyrighted datasets.
- **Pedagogical Partner**: Elevate AI from a flawed oracle into a transparent, explainable Theory Tutor.

## Research

From HF LitReview notebook: 57 sources on AI-driven symbolic music generation. Key findings:

**Frontend baseline**: `harmony-forge-redesign/` (Next 16, React 19, VexFlow, Tone, Zustand) provides the Tactile Sandbox UI. MVP will integrate backend and Theory Inspector with this existing design.

- Modern frameworks prioritize **musical structure and coherence** via subtask decomposition (high-level planning vs. note-level creation).
- "Glass Box" explainability and **deterministic logic** build user trust by aligning outputs with established music theory.
- The "Repair Phase" bottleneck is addressed by tactile workspaces for manual editing, ensuring **creative agency**.
- Neuro-symbolic integration and hierarchical modeling enable AI to capture nuanced thematic development.

## Plan

Build order (from MVP scope):

1. **Logic Core (Backend)** — Deterministic constraint-satisfaction solver
   - [x] **1.1** Scaffold backend: `engine/` package (Node.js/TypeScript), `package.json` with `test`, `lint`, `dev:backend`; wire Makefile
   - [x] **1.2** Define shared types: `LeadSheet`, `ChordSlot`, `SATBVoices`, pitch/range helpers; JSON schema for input/output
   - [x] **1.3** Implement chord parser: Roman numerals (I, ii, V7, etc.) → pitch classes; key context (C major, A minor)
   - [x] **1.4** Implement backtracking solver: assign S/A/T/B per chord slot; enforce range, spacing, parallel fifths/octaves, voice crossing
   - [x] **1.5** Melody placement: soprano = given melody when provided; else solver chooses within range
   - [x] **1.6** REST API: `POST /api/generate-satb` accepts JSON lead sheet, returns SATB JSON; Express or Hono on port 8000
   - [x] **1.7** Unit tests: chord parser, constraint checks, solver; integration test for API
   - [x] **1.8** File format pipeline: accept XML, PDF, MIDI; convert to canonical format; extract melody; generate harmonies; output MusicXML
   - [x] **1.8a** Input parsers: MusicXML (partwise + timewise via fast-xml-parser; no DTD loading; namespaces, grace notes, chords), MIDI (@tonejs/midi). PDF: 501 + "Use XML or MIDI" for MVP.
   - [x] **1.8b** Canonical format: internal `ParsedScore` (melody notes, key, chords if present). XML/MIDI → ParsedScore.
   - [x] **1.8c** Chord inference: if no chords in file, infer simple diatonic progression from melody (e.g. I–IV–V–I per phrase).
   - [x] **1.8d** Output: SATB solver result → MusicXML (SATB grand staff) via custom builder.
   - [x] **1.8e** New endpoint: `POST /api/generate-from-file` (multipart: file) → returns MusicXML string for Tactile Sandbox.
   - [x] **1.9** Engine config support: Extend `generate-from-file` to accept optional JSON config (instruments, mood). Use config in chord inference and MusicXML output.
   - [x] **1.9a** Types: Add `GenerationConfig` { instruments?: Record<Voice, string[]>, mood?: "major"|"minor" }.
   - [x] **1.9b** API: Accept `config` form field (JSON string). Validate; pass to pipeline.
   - [x] **1.9c** Chord inference: mood → key mode when inferring chords (major vs minor progressions).
   - [x] **1.9d** MusicXML: Use `instruments` for part names in output (one label per voice).
   - [x] **1.9e** Additive harmonies: melody stays as Part 1; selected instruments added as harmony parts. Partwise output for MuseScore/OSMD.
   - [x] **1.9f** CLI test: `make test-engine`, `scripts/run-engine-cli.ts`, input/output folders.
   - [x] **1.9g** Unique parts per instrument: When multiple instruments share a voice range (e.g., flute + violin both soprano), each gets a distinct harmony part via different chord tones + octave displacement (HFLitReview: divisi, register transfer).
   - [x] **1.9h** Robust MusicXML input: score-partwise and score-timewise; namespaced XML (MuseScore 4.x); grace notes skipped; chords (first pitch); no DTD loading.
   - [x] **1.9i** Robust MIDI parsing: first track with notes (Format 1); extract key + time sig from header.
   - [x] **1.9j** PDF input: attempt Audiveris OMR when `audiveris` in PATH; else 501 with conversion instructions. Add .pdf to dropzone accept.
   - [x] **1.9k** MXL support: parse compressed MusicXML (adm-zip); enables MuseScore/Audiveris .mxl uploads.

2. **Tactile Sandbox (Frontend)** — Design around existing `harmony-forge-redesign/`
   - **Pages (design baseline)**: `/` Playground (upload) → `/document` Config (mood, instruments) → `/sandbox` Edit (ScoreCanvas, Theory Inspector). See `@progress.md` Phase 4 for full page table.
   - [x] Fix Next.js dev server (was missing `node_modules`; run `npm install`)
   - [x] Frontend already has: VexFlow, ScoreCanvas, TheoryInspectorPanel, ScoreDropzone, EnsembleBuilderPanel
   - [x] **2a** Document page config: Add mood (major/minor) selector to EnsembleBuilderPanel. Lift instrument selections + mood; pass to backend on Generate.
   - [x] **2b** Wire backend API: `POST /api/generate-from-file` with multipart file + JSON config (instruments, mood); store MusicXML for sandbox.
   - [x] **2c** Enable direct note manipulation: MusicXML render (VexFlowScore), selection, edit tools (Undo/Redo/Cut/Copy/Paste/Delete), duration/pitch/articulation/dynamics/measure/score tools. See Tactile Sandbox Note Editor plan.
   - [x] **2d** Document page preview: Parse uploaded MusicXML client-side; render in ScorePreviewPanel left pane; support score-partwise and namespaced MusicXML.
   - [x] **2e** VexFlow multi-measure SATB: Resolved via 2g.1 (fixed 4 beats per measure; pad per measure).
   - [x] **2f** Variable-part generation: Output only parts with selected instruments (violin+cello → 2 parts; 5 instruments → 5 parts). Relaxed solver fallback when strict fails.
   - [x] **2g** Note Editor (Noteflight/MuseScore-style) — Evolve the note editor in `sandbox/page.tsx` toward industry-standard UX. See references: [Noteflight Editor UI](https://robbyshaver.com/noteflight/editorUI2/pages/), [MuseScore Note Input](https://musescore.org/en/handbook/3/note-input), HFLitReview (tactile sandbox, repair phase, voice lanes).
     - **Vision**: Direct manipulation, minimal mode switching; duration palette + pitch input (keyboard A–G, mouse click on staff, optional MIDI/virtual piano). Edit-Authority for Expressive Sovereignty.
     - [x] **2g.1** Resolve VexFlow TickMismatch: fixed 4 beats per measure, pad per measure, floating-point rounding. **Display:** Prefer OSMD when musicXML exists (blank canvas fix); VexFlow when no musicXML or on crash fallback.
     - [x] **2g.2** Click-on-staff note placement: duration tool active → click canvas inserts note; selection-based or first-measure target.
     - [x] **2g.3** Keyboard shortcuts: A–G for pitch (setPitchByLetter), 1–6 for duration, ↑/↓ semitone, Ctrl+↑/↓ octave.
     - [x] **2g.4** Action bar: SandboxActionBar with Undo, Redo, Delete always visible (Noteflight pattern).
     - [x] **2g.5** Voice lanes: activePartId tracks selected part for insertion; part isolation for bounded edits.
   - [ ] JSON-based score deltas for state sync with backend (deferred to Theory Inspector Phase 3)

3. **Theory Inspector (Explainability)** — LLM-powered validation *(M4 #79 MVP wiring complete)*
   - [x] Inspector API route wired (`/api/theory-inspector`) with graceful fallback
   - [x] Auditor context wired via backend validation (`/api/validate-from-file`)
   - [x] Tutor chat wiring: Sandbox asks inspector API; replies render in panel
   - [ ] Stylist: structured candidate-edit application flow (post-MVP)

4. **Supporting Features** *(M4 #79 — MVP by 3/27)*
   - [ ] Multi-clef & instrument transposition; multi-instrument selection
   - [x] Audio playback: rest-aware timing + measure-aware scheduling; pitch-safe filtering; transport stability
   - [x] Onboarding flow: guided first-time tour (Upload → Document → Generate → Sandbox) with localStorage completion flag
  - [ ] Export: PDF + chord-chart path implemented; tablature deferred

## Verification

- `make test` — Backend unit and integration tests pass
- `make lint` — Backend ESLint passes
- `make build` — Engine build plus Next production build pass
- `make test-engine` — CLI runs engine on `input/月亮代表我的心.xml` → `output/月亮代表我的心_flute_cello.xml` (melody + flute + cello, major)
- Manual: Upload `月亮代表我的心.xml` → preview on `/document` → configure mood + instruments → Generate Harmonies → land on `/sandbox` with 3 parts (Violin, Flute, Cello)
- **File pipeline**: `POST /api/generate-from-file` returns `200` with partwise MusicXML (additive harmonies)
- **Known active limitation (2026-03-24):** VexFlow edit renderer still fails to produce visible notation for some generated scores; Sandbox now auto-falls back to safe OSMD preview in Edit mode to avoid blank-canvas regressions while preserving app usability.
