# Plan

### How to use this doc

Skim **Status at a glance** below, then use the numbered **Plan** checklist for implementation detail. **Living narrative** (session notes, deep dives, regressions) lives in **[progress.md](progress.md)**. **Architecture** diagram: **[context/system-map.md](context/system-map.md)**. **Full doc index:** **[docs/README.md](README.md)**. **Production deploy:** **[deployment.md](deployment.md)**.

### Status at a glance

- **Logic Core (backend):** Items **1.1–1.9** shipped, including **1.9n** symbolic intake hardening (2026-04-07); **1.9m** (production-grade PDF→MusicXML / oemer) remains the main pipeline risk.
- **Tactile Sandbox (frontend):** **RiffScore-first** editing — `EditableScore` in Zustand is the canonical score model; **`patch-package`** extends RiffScore (toolbar plugins, playback scrub via `__HF_RIFFSCORE_PLAY_FROM`). VexFlow/OSMD remain in the tree for legacy paths and fallbacks where noted in [progress.md](progress.md).
- **Flow:** Upload → Document → Generate → Sandbox; optional **`/onboarding`** and **6-step** product **tour** (`CoachmarkOverlay`, `data-coachmark="step-1"`…`step-6`, persist **`hf-coachmarks-v2`** + **`hasDismissed`**). See [progress.md — 6-step tour](progress.md#wl-coachmarks-6step-2026-04-07).
- **Theory Inspector:** `/api/theory-inspector` and `/suggest`; dual mode; fixed tutor depth (**intermediate**); notation-first FACT blocks + follow-up chat ordering; SATB audit surfaces as a **compact system line** plus **score highlights** (not a tall stack of violation cards). **2026-04-06:** split **note vs chat** panes; **`<<<IDEA_ACTIONS>>>`** one-click applies + **`NOTE_IDS_FOR_IDEA_ACTIONS`** in evidence + **`ideaActionResolve`** fallback; ghost/input pitch labels. See [progress.md](progress.md) → [Work log — Theory Inspector…](progress.md#wl-inspector-split-ideas-2026-04-06).
- **M5 (user study):** RQ1 (`reviewer_primary` / melody-only) and RQ2 (`minimal` stylist prose) plus opt-in logging — see **M5 — User study** below.
- **Active gaps (short):** **PDF/OMR (1.9m)** remains the main pipeline risk; **symbolic intake (1.9n)** **shipped** (2026-04-07) — mislabeled `.txt`/`.mxml`/MIDI sniff, Playground engine preview for non-`.xml`, Document ZIP-as-`.xml`, `musicXmlMarkers`; **MIDI** loads via `createRequire` with **`cwd` = `backend/`**; **RiffScore piano 404s mitigated** (Salamander CDN via `patch-package`); **Sandbox exports** **shipped** (2026-04-13) — live flush, MusicXML/MIDI/PNG/WAV/ZIP/JSON/chord-chart/print from tactile score; see [progress.md — Tactile Sandbox exports](progress.md#wl-sandbox-exports-2026-04-13); **`Next.js build`** may fail until **`riffscoreAdapter.ts`** **`toolbarPlugins`** is typed against patched RiffScore config; **`make lint-frontend`** exits **0** with a few **`react-hooks/exhaustive-deps` warnings** — use **`make verify-strict`** for full gate; **Theory Inspector** live evidence refresh on send **shipped** (2026-04-06); residual **idea-action** and **model** edge cases possible.
- **Generate timeout mitigation (2026-04-07):** SATB solver **`auto`** mode now tries greedy first for all slot counts, file routes default solver wall-clock to ~108s when `HF_SOLVER_MAX_MS` is unset, and Document timeout defaults to 180s with clearer copy. See [progress.md — Generate timeout mitigation](progress.md#wl-generate-timeout-2026-04-07).
- **Docs & deploy (2026-04-07):** README set + **[docs/README.md](README.md)** index + **[deployment.md](deployment.md)** (Vercel `frontend/` root, engine host, env/CORS). Root **[node_modules/README.md](../node_modules/README.md)** + **`.gitignore`** exception for tracked explainer only — see [progress.md](progress.md) work log.

### Current snapshot (detail)

- **First-run UX:** With **`COACHMARKS_ENABLED`**, the **coachmark tour** auto-starts on **`/`** (modal/coachmark cards disabled); otherwise **`OnboardingModal`** until dismissed. **`llmClient`** resolves **`OPENAI_BASE_URL` ?? `OPENAI_URL`** (see `frontend/.env.example`).
- **Preview:** Raw `.xml`/`.musicxml` in-browser (plus **ZIP-as-`.xml`** on Document: sniff → same preview API). **Everything else** (`.pdf`, `.mxl`, `.mid`, `.mxml`, `.txt`, extensionless, etc.) uses **`POST /api/to-preview-musicxml`** on Playground so the engine sniffs ZIP/MIDI/MusicXML; Zustand **`previewMusicXML`** when intake succeeds. See [progress.md — Symbolic intake](progress.md#wl-intake-symbolic-2026-04-07).
- **Generation runtime behavior:** `POST /api/generate-from-file` now prefers a greedy-first SATB fast path in auto mode, with bounded default file-route solver wall-clock (`HF_SOLVER_MAX_MS` unset → ~108s; `0` disables).
- **Inspector UX:** Deterministic panels (**What this click means**, **Verifiable score export**); **`react-markdown`** on bubbles; **InspectorScoreFocus** + **`regionExplainContext`** for measure/part; dark-theme tokens on chat and playback bar; **split column** (note details + ideas vs chat); **IDEA_ACTIONS** rows with Accept/Reject; optional **inspector debug strip** when apply fails.
- **Tests (frontend):** Vitest covers `noteExplainContext`, `noteInsightAiSplit`, **`ideaActionResolve`**, **`staffPreviewPitch`**, `regionExplainContext`, `playbackScrub`, `studyConfig`, **`needsEnginePreviewForExtension`**, **`isProbablyZipBytes`**, **`musicXmlMarkers`**, **`intakeErrorHints`**, **`scoreToMidi`**, etc.
- **Exports (2026-04-13):** Modal formats read **flushed** Zustand score; MIDI/PNG/WAV/ZIP client-side; PDF = **print** with sandbox-scoped **`@media print`**; tablature still deferred.
- **Playback scrub:** Shipped — verify toolbar **Play**, **Space**, and **P** after scrub; see [progress.md](progress.md) for regression notes.

**Milestones:** M3 complete. M4 consolidated in [#79](https://github.com/salt-family/harmonyforge/issues/79) (MVP scope). **M5:** instrumentation in-repo; protocol/surveys are researcher-owned.

## M5 — User study (RQ1 / RQ2) — app instrumentation

**RQ1 — Ownership (reviewer vs generator):**

- **`generator_primary`** (default): Document → `POST /api/generate-from-file` → Sandbox with additive harmonies (existing MVP).
- **`reviewer_primary`:** Same upload/preview/config UX; primary CTA loads **melody-only** MusicXML into Sandbox (no harmony generation). Participants add harmonies manually; Theory Inspector (audit, tutor, stylist) unchanged.

**Activation:** `NEXT_PUBLIC_HF_STUDY_CONDITION` or first-load query `?study=reviewer_primary` (persisted in `sessionStorage` via `StudySessionProvider`). Framing copy differs on Playground, Document, and Sandbox onboarding when `reviewer_primary`.

**RQ2 — Trust in explanations (stylist suggestions):**

- **`full`** (default): Stylist structured response includes `rationale` + `summary`; panel shows full suggestion copy.
- **`minimal`:** `suggestionExplanationMode` on `POST /api/theory-inspector/suggest` strips prose; `SuggestionCard` shows neutral one-line header + pitch rows + `ruleLabel` only.

**Activation:** `NEXT_PUBLIC_HF_SUGGESTION_EXPLANATION_MODE` or `?hfExplain=minimal` (sessionStorage). Client sends `suggestionExplanationMode` with each suggest request.

**Consent & logging:** Optional gate when `NEXT_PUBLIC_HF_STUDY_REQUIRES_CONSENT=true`. Opt-in interaction log (`studyEventLog.ts`): generate vs skip-generation, note click, audit, explain/suggest actions, suggestion accept/reject; **Copy JSON** on Sandbox (`StudyLogExportBar`). No score payload in events.

**Code:** `frontend/src/lib/study/studyConfig.ts`, `studyEventLog.ts`, `readMelodyXml.ts`, `components/study/*`, `vitest` `studyConfig.test.ts`. Env template: `frontend/.env.example`.

## Objective

Build **HarmonyForge** — a Glass Box co-creative system that bridges the "Repair Phase Bottleneck" in symbolic music arrangement. The system rejects probabilistic "Black Box" AI in favor of deterministic, rule-based logic and explainable artificial intelligence (XAI). Goals:

- **Expressive Sovereignty**: Provide a "Jumping Pad" that respects the user's train of thought; the musician remains the ultimate author.
- **Copyright Safety by Design**: Use axiomatic music theory (e.g., Schenkerian analysis) instead of pattern mimicry from copyrighted datasets.
- **Pedagogical Partner**: Elevate AI from a flawed oracle into a transparent, explainable Theory Tutor.

## Research

**Repository layout (2026-04-06):** Top-level folders are **`backend/`** (Node `package.json`, **`engine/`**, **`scripts/`**, CLI **`input/`** / **`output/`**), **`frontend/`** (Next.js Tactile Sandbox), **`docs/`** (plan, progress, ADRs, **`Taxonomy.md`**, context), and **`miscellaneous/`** (legacy **`chamber-music-fullstack/`**, vendored **`pdfalto/`**, ancillary scripts). Orchestration stays at the repo root: **`Makefile`**, **`README.md`**, **`.gitignore`**, **`.cursor/`**. Historical doc paths such as `engine/…` refer to **`backend/engine/…`** unless noted.

From HF LitReview notebook: 57 sources on AI-driven symbolic music generation. Key findings:

**Frontend baseline**: `frontend/` (Next.js, React, **RiffScore** as the primary editor, Tone.js for playback, Zustand for score and UI state) provides the Tactile Sandbox. VexFlow and OSMD remain for historical tooling and some fallback/display paths; the **canonical editing path** is RiffScore + `EditableScore` sync.

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
   - [x] **1.8a** Input parsers: MusicXML (partwise + timewise via fast-xml-parser; no DTD loading; namespaces, grace notes, chords), MIDI (@tonejs/midi), MXL (adm-zip + ZIP sniff). PDF: pdfalto + Poppler + oemer (`fileIntake.ts`).
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
   - [x] **1.9j** PDF input: `pdfalto` (ALTO + embedded MusicXML text fast path) → Poppler `pdftoppm` (first page) → `oemer` OMR → MusicXML; env `PDFALTO_BIN`, `POPPLER_PDFTOPPM`, `OEMER_BIN`. No Audiveris. Dropzone accepts `.pdf`.
   - [x] **1.9k** MXL support: parse compressed MusicXML (adm-zip); ZIP sniff for mislabeled `.xml`; MuseScore/MXL uploads.
   - [x] **1.9l** Document preview parity for non-XML files: `POST /api/to-preview-musicxml` + `parsedScoreToPartwiseMelodyMusicXML` (`engine/satbToMusicXML.ts`); Playground fetches before `/document` for `.pdf`/`.mxl`/`.mid`/`.midi`; `useUploadStore.previewMusicXML`; Document uses store + same `parseMusicXML` as FileReader path. Playground errors in-page; engine surfaces **oemer** stderr excerpt on failure; darwin/Homebrew **PATH** in `dev:backend`; pdfalto discovery via `argv[1]` walk + `cwd`.
   - [x] **1.9n** **Symbolic intake hardening (2026-04-07):** Engine `fileIntake` — MIDI magic sniff, `looksLikeMusicXml` + bounded UTF-8 peek, `.mxml`, mislabeled `.txt`/extensionless, prefixed embedded MusicXML roots, empty XML guard; `musicXmlMarkers.ts`; `midiParser` loads `@tonejs/midi` via `createRequire` from `backend/package.json` (expects **`cwd` = `backend/`**). Frontend — `needsEnginePreviewForExtension` (engine preview for all extensions except `.xml`/`.musicxml`), Document ZIP sniff for `.xml`, `readMelodyXml` prefers `storePreviewXml`, shared client markers + fail-fast parse. Does **not** replace **1.9m** for PDF.
   - [ ] **1.9m** **Unresolved:** **Production-ready PDF→MusicXML** — stabilize **oemer** (Python 3.10–12 venv, ONNX checkpoints downloaded or manual install, `OEMER_BIN`) and/or evaluate alternate OMR; validate in docs/CI; page-1-only PDF remains a known limitation until multi-page merge is designed.

2. **Tactile Sandbox (Frontend)** — Design around existing `frontend/`
   - **Pages (design baseline)**: `/` Playground (upload) → `/document` Config (mood, instruments) → `/sandbox` Edit (**RiffScore** editor, Theory Inspector). See [progress.md](progress.md) Phase 4 for full page table.
   - [x] Fix Next.js dev server (was missing `node_modules`; run `npm install`)
   - [x] Frontend already has: **RiffScore** (primary sandbox editor), TheoryInspectorPanel, ScoreDropzone, EnsembleBuilderPanel; legacy VexFlow / OSMD / ScoreCanvas pieces remain where historical code paths reference them
   - [x] **2a** Document page config: Add mood (major/minor) selector to EnsembleBuilderPanel. Lift instrument selections + mood; pass to backend on Generate.
   - [x] **2b** Wire backend API: `POST /api/generate-from-file` with multipart file + JSON config (instruments, mood); store MusicXML for sandbox.
   - [x] **2c** Enable direct note manipulation: MusicXML render (VexFlowScore), selection, edit tools (Undo/Redo/Cut/Copy/Paste/Delete), duration/pitch/articulation/dynamics/measure/score tools. See Tactile Sandbox Note Editor plan.
   - [x] **2d** Document page preview: Parse uploaded MusicXML client-side; render in ScorePreviewPanel left pane; support score-partwise and namespaced MusicXML. **Extension:** PDF/MXL/MIDI use server-built preview XML from store when intake succeeds (**1.9l**); **PDF OMR still unreliable** (**1.9m**).
   - [x] **2e** VexFlow multi-measure SATB: Resolved via 2g.1 (fixed 4 beats per measure; pad per measure).
   - [x] **2f** Variable-part generation: Output only parts with selected instruments (violin+cello → 2 parts; 5 instruments → 5 parts). Relaxed solver fallback when strict fails.
   - [x] **2g** Note Editor (Noteflight/MuseScore-style) — Evolve the note editor in `sandbox/page.tsx` toward industry-standard UX. See references: [Noteflight Editor UI](https://robbyshaver.com/noteflight/editorUI2/pages/), [MuseScore Note Input](https://musescore.org/en/handbook/3/note-input), HFLitReview (tactile sandbox, repair phase, voice lanes).
     - **Vision**: Direct manipulation, minimal mode switching; duration palette + pitch input (keyboard A–G, mouse click on staff, optional MIDI/virtual piano). Edit-Authority for Expressive Sovereignty.
     - [x] **2g.1** Resolve VexFlow TickMismatch: fixed 4 beats per measure, pad per measure, floating-point rounding. **Display:** Prefer OSMD when musicXML exists (blank canvas fix); VexFlow when no musicXML or on crash fallback.
     - [x] **2g.2** Click-on-staff note placement: duration tool active → click canvas inserts note; selection-based or first-measure target.
     - [x] **2g.3** Keyboard shortcuts: A–G for pitch (setPitchByLetter), 1–6 for duration, ↑/↓ semitone, Ctrl+↑/↓ octave.
     - [x] **2g.4** Action bar: SandboxActionBar with Undo, Redo, Delete always visible (Noteflight pattern).
     - [x] **2g.5** Voice lanes: activePartId tracks selected part for insertion; part isolation for bounded edits.
   - [x] **2g.6** Rest-complete measures + rest-preserving round-trip: score normalization now fills incomplete measures with rests and trims trailing filler rests on overfill; RiffScore adapter preserves rest events both directions.
   - [x] **2g.7** Modern editing affordances: compact quick-toolbar in `/sandbox` (duration palette, rest insertion, tie toggle, accidental buttons, transport controls) plus expanded keyboard set (Cmd/Ctrl+C/X/V/A, Cmd/Ctrl+Y redo, `N` note-input arm, `0` rest insertion/convert selection, `?` shortcut help).
   - [x] **2g.8** RiffScore as primary sandbox editor: `patch-package` patch adds `ui.toolbarPlugins` to native toolbar; Zustand sync (`useRiffScoreSync`); stable store selectors to avoid React snapshot loops; `.env.example` / `.env.local` for OpenAI + engine URLs.
   - [ ] JSON-based score deltas for state sync with backend (deferred to Theory Inspector Phase 3)

3. **Theory Inspector (Explainability)** — LLM-powered validation *(M4 #79 MVP wiring complete)*
   - [x] Inspector API route wired (`/api/theory-inspector`) with graceful fallback
   - [x] Auditor context wired via backend validation (`/api/validate-from-file`)
   - [x] Tutor chat wiring: Sandbox asks inspector API; replies render in panel
   - [x] Note-click explainability: clicking a generated harmony note triggers deterministic evidence + tutor LLM explanation (when API key is available)
   - [x] Original vs current pitch: generation baseline (harmony note id → pitch at load) + optional cached `validate-satb-trace`; inspector **Engine origin** vs **current pitch** sections; melody clicks = pitch-in-context only; tutor must not attribute user-edited pitch to the engine
   - [x] Engine trace source of truth: `/api/validate-satb-trace` provides per-slot rule findings consumed by inspector highlights + note explainability
   - [x] **Dual-mode Theory Inspector:** Origin Justifier vs Harmonic Guide (`inspectorMode`); `Note.originalGeneratedPitch` stamped on load + preserved across RiffScore sync; tutor API `theoryInspectorNoteMode`; SATB/additive FACT lines include next chord moment and barline neighbors; clipboard paste drops provenance
   - [x] **Multi-part note context:** Staff roster (input vs generated names); cross-part interval FACTs to every other staff at the beat; SATB note-explain only when exactly four parts (`requireExactlyFourParts`); SATB FACTs use instrument/part names; scores with 5+ staves use full additive context (`npm run test` in `frontend` for `noteExplainContext`)
   - [x] Stylist structured suggestion flow (`/api/theory-inspector/suggest`) with accept/reject + batch actions
   - [x] Grammarly-style inline suggestion ghost notes (accept/reject in-score)
   - [x] Note-level audit highlighting pipeline (red = deterministic violations, blue = theory nuance/warnings)
   - [x] Violation-card actions wired ("Explain more", "Suggest fix", "Show in score")
   - [x] **Source-aligned taxonomy + prompts (HF LitReview / NotebookLM):** `Taxonomy.md` source spine and engine-mapping table (Fux → solver motion **proxy**; Aldwell & Schachter → `constraints.ts` / `validate-satb-trace`; Caplin vocabulary + **honesty** for primary `engine/` path; Open Music Theory as **primary RAG pedagogy**); mirrored in `frontend/src/lib/ai/taxonomyIndex.ts`; auditor/tutor/stylist rules in `prompts.ts` (implementation vs heuristic; Caplin guardrails); `engine/solver.ts` comment; `miscellaneous/chamber-music-fullstack/.../harmonize-core.ts` disclaimer on `planStructuralHierarchy`
   - [x] **Tutor output policy:** `prompts.ts` — `CITATION_AND_BREVITY` + persona tuning so LLM answers cite **one** appropriate source when stating theory norms, stay **down-to-earth and short** by default, and avoid citation overload (offline fallback unchanged).
   - [x] **Honest tutor tone:** `prompts.ts` — `HONESTY_NO_SYCOPHANCY` for Auditor/Tutor/Stylist (no flattery; distinguish constraint pass vs musical quality; admit incomplete context; gray areas; correct wrong premises; Stylist tradeoffs / “one common fix”).
   - [x] **Note-inspector UX (2026-04):** `TheoryInspectorPanel` — plain-language titles + subtitles; **`aiSuggestions`** from tutor stream (`<<<SUGGESTIONS>>>`); `noteInsightAiSplit.ts` + vitest; `useTheoryInspectorStore.aiSuggestions`. **2026-04 follow-up:** panel order **What the tool first wrote → What this click means → Verifiable export → Tutor summary → Ideas to try next** (ideas after summary); deterministic **why** for axiomatic engine in **What this click means** (`buildAxiomaticEngineWhyParagraph`, additive path); tutor prompts require **what + why** on each suggestion bullet (`NOTE_EXPLAIN_TUTOR_BRIEF`, `prompts.ts` tutor).
   - [x] **Staff ↔ instrument on canvas:** `extractStaffLabelLayout` (`riffscorePositions.ts`); `RiffScoreEditor` left labels + **Staves (top → bottom)** fallback when DOM doesn’t match part count.
   - [x] **Inspector scroll + React Compiler:** `useLayoutEffect` without dependency array (avoids “useEffect final argument changed size” under Next 16 + Turbopack); see `@progress.md`.
   - [x] **Free-form chat in panel (2026-04-03):** `TheoryInspectorPanel` shows Zustand **`messages`** + always-visible composer (empty placeholder); sandbox wires **`sendMessage`** / **`inputValue`** / **`streamingMessageId`**; no automatic **`chips`** rows after assistant replies or after **`runAudit`**; conversation history built before the in-flight empty AI bubble. See `@progress.md` → **Work log — 2026-04-03**.
   - [x] **Editor focus for chat + measure/part UI (2026-04-04):** **`InspectorScoreFocus`** + **`scoreSelectionContext`**; **`Editor focus`** block in **`prompts.ts`** (Tutor/Auditor/Stylist) so the LLM reads clicked context; **`regionExplainContext.ts`** (`buildMeasureFocusFacts`, `buildPartFocusFacts`) + vitest; **`RiffScoreEditor`** measure strip, staff-label part select, selection inference, green **focus** overlays; **`TheoryInspectorPanel`** region card; route **`scoreSelectionContext`**. See `@progress.md` → **Work log — Theory Inspector: editor focus for chat + measure/part (2026-04-04)**.
   - [x] **Tutor text export + message ordering (2026-04-03):** **`SCORE_DIGEST`**, **`FACT: AUTHORITATIVE NOTATION`**, **`FULL BAR`** (measure-level `buildMeasureFocusFacts` appended to note evidence); **note-click** `userMessage` = evidence **then** **Response rules**; **chat** prepends full FACT block before user text; **SATB** path includes digest + full bar; **`prompts.ts`** / **`NOTE_EXPLAIN_TUTOR_BRIEF`** — full notation, no “pitch-only”; **UI** — **`ChatBubble`** AI variant + **`SandboxPlaybackBar`** pagination contrast for dark theme. See `@progress.md` → **Work log — LLM “sees” the score (2026-04-03)**.
   - [x] **Tutor follow-up + panels + markdown (2026-04-04):** **`sendMessage`** — snapshot **`conversationHistory`** before **`addMessage(userMsg)`** (no duplicate plain-then-rich user pair to the LLM). **Panels** — **What this click means** + **Verifiable score export**; shortened **`currentPitchGuideExplanation`**. **`react-markdown`** + **`MarkdownText.tsx`** — **`ChatBubble`** user/ai; tutor summary, ideas, origin, click-meaning in **`TheoryInspectorPanel`**. See `@progress.md` → **Work log — Tutor follow-up + panels + markdown (2026-04-04)**.
   - [x] **Live evidence refresh on chat send (2026-04-06):** Before **`POST /api/theory-inspector`**, **`sendMessage`** rebuilds **`scoreSelectionContext`** from the flushed live score (measure/part via **`regionExplainContext`**; note via **`buildLiveNoteExplainInsight`**); updates focus / **`patchSelectedNoteInsight`** while preserving AI fields. See [progress.md — Holistic refinement program](progress.md#holistic-refinement-2026-04). **Residual:** model quality; **`make lint-frontend`** warning debt (not errors).
   - [x] **Default explanation depth (2026-04-03):** Removed **Beginner / Intermediate / Professional** panel toggle; **`lib/ai/explanationLevel.ts`** — **`DEFAULT_EXPLANATION_LEVEL`**, **`resolveExplanationLevel`**; **`POST /api/theory-inspector`** and **`/api/theory-inspector/suggest`** default missing/invalid `explanationLevel`; **`useTheoryInspectorStore`** no longer persists level; **`useTheoryInspector`** / **`TheoryInspectorPanel`** — no gating before chat, suggest, or note tutor summary. See **`@docs/progress.md` → Work log — Theory Inspector: default explanation depth**.
   - [x] **Inspector split layout + actionable ideas + ghost pitch labels (2026-04-06):** **`TheoryInspectorPanel`** — equal **top / bottom** panes (note details + ideas vs chat scroll); auto-scroll only the chat pane. **Ideas:** optional tutor block **`<<<IDEA_ACTIONS>>>`** JSON (`ideaActionSchema.ts`, **`splitNoteInsightAiContent`**); **`NoteInsight.ideaActions`** + **`patchSelectedNoteInsight`**; Accept applies via **`applySuggestion`**; Reject keeps row visible; study log **`idea_action_accepted` / `idea_action_rejected`**. **Ghosts:** stylist **`RiffScoreSuggestionOverlay`** always shows **`suggestedPitch`** label; note-input mode shows preview pitch via **`findNoteInputPreviewLayout`** + **`staffPreviewPitch.ts`**. **Apply reliability:** **`NOTE_IDS_FOR_IDEA_ACTIONS`** **`FACT:`** lines in additive + SATB tutor payload; **`resolveIdeaActionNoteId`** (`ideaActionResolve.ts`) when JSON `noteId` is wrong; sandbox **`setInspectorDebugStatus`** on failure. **Vitest:** **`ideaActionResolve.test.ts`**, **`staffPreviewPitch.test.ts`**, **`noteInsightAiSplit.test.ts`**. **2026-04-06 follow-up:** **`resolveIdeaActionNoteId`** — **longest substring-matched part name** (e.g. Violin II vs Violin); duplicate identical names still ambiguous. **Open:** off-beat suggestions, omitted **NOTE_IDS** — see [progress.md — Holistic refinement](progress.md#holistic-refinement-2026-04).

4. **Supporting Features** *(M4 #79 — MVP by 3/27)*
   - [ ] Multi-clef & instrument transposition; multi-instrument selection — **scoped in [ADR 003](adr/003-multi-clef-transposition-scope.md)** (vertical slice first; tab + JSON deltas explicitly deferred there)
   - [x] Audio playback: rest-aware timing + measure-aware scheduling; pitch-safe filtering; transport stability
   - [x] **RiffScore playhead scrub (2026-04):** `PlaybackScrubOverlay` + `playbackScrub.ts` (measure-span layout, **snap to nearest measure start**); `riffscorePlaybackBridge.ts` sets **`globalThis.__HF_RIFFSCORE_PLAY_FROM`** on release; **`patches/riffscore+1.0.0-alpha.9.patch`** wires **`consumeHfRiffScorePendingPlay()`** into **`handlePlayToggle`** and **`handlePlayback`** so **toolbar Play**, plain **Space**, and **P** start from scrubbed bar (quant `0`); **`Shift+Space`** / **`Shift+⌘|Alt+Space`** unchanged (replay / from start); native SVG cursor hidden. **Open:** manual regression pass; any new RiffScore play entry points must consume pending or they will ignore scrub.
   - [x] Onboarding flow: guided first-time tour (Upload → Document → Generate → Sandbox) with localStorage completion flag
   - [x] **Export (2026-04-13):** Live-score flush (`getLiveScoreAfterFlush`); MusicXML, JSON, MIDI (`scoreToMidi.ts`), PNG (export preview via `html-to-image`), WAV (`Tone.Offline` + `scoreToWav.ts`), ZIP (`fflate` + chord-chart API), chord-chart, print/PDF (`window.print()` + print CSS); coachmark opens export with same snapshot as header. **Open:** PNG = viewport only; MP3 not in stack; **`validate-from-file`** semantics unchanged. **Tablature deferred.**

## Verification

- `make test` — Backend unit and integration tests pass
- `cd frontend && npm run test` — Vitest (`noteExplainContext`, `noteInsightAiSplit`, **`ideaActionResolve`**, **`staffPreviewPitch`**, **`regionExplainContext`**, **`playbackScrub`**, **`studyConfig`**, **`intakeErrorHints`**, **`needsEnginePreviewForExtension`**, **`isProbablyZipBytes`**, **`musicXmlMarkers`**, **`scoreToMidi`**, and other frontend unit tests)
- **Sandbox exports (2026-04-13):** After editing in RiffScore, open Export → confirm XML/MIDI/JSON/WAV/ZIP match canvas; print preview hides chrome; fix **`riffscoreAdapter`/`toolbarPlugins`** types if **`npm run build`** fails
- `make lint` — Backend ESLint passes
- `make lint-frontend` — Frontend ESLint (exit 0; may print **warnings** — see [progress.md](progress.md#holistic-refinement-2026-04))
- `make verify` — `test` + `lint` + `build`
- `make verify-strict` — `verify` + `lint-frontend` (stricter CI-minded gate)
- `make build` — Engine build plus Next production build pass
- `make test-engine` — CLI runs [`scripts/run-engine-cli.ts`](../backend/scripts/run-engine-cli.ts) with default input [`frontend/public/samples/tour_demo.xml`](../frontend/public/samples/tour_demo.xml) → `backend/output/<name>_flute_cello.xml` (or pass `-i`/`-o`)
- Manual: Upload a partwise MusicXML (e.g. `frontend/public/samples/tour_demo.xml`) → preview on `/document` → configure mood + instruments → Generate Harmonies → land on `/sandbox` with the configured parts
- **Playback scrub (2026-04):** On `/sandbox`, drag the vertical play line to a bar, release (snaps to measure start), then start with **toolbar Play**, **Space**, or **P** — audio should begin at that bar; **Shift+Space** (replay) should **not** use the scrub anchor. Re-run after `npm ci` to confirm **`patch-package`** applied.
- **File pipeline**: `POST /api/generate-from-file` returns `200` with partwise MusicXML (additive harmonies)
- **LLM (optional):** Copy `frontend/.env.example` → `.env.local`, set `OPENAI_API_KEY`, restart `make dev`; `curl http://localhost:3000/api/theory-inspector` should report `"hasApiKey":true`
- **Theory Inspector follow-up (2026-04-04):** Sandbox → open inspector → click **melody** note → after tutor summary, ask e.g. “Is this a half note?” — expect answer grounded in **`SCORE_DIGEST` / AUTHORITATIVE** (not “I can’t see notation”); chat bubbles should render **`**bold**`** when the model emits markdown
- **Theory Inspector default depth (2026-04-03):** With **`OPENAI_API_KEY`**, chat, violation actions, structured suggest, and note **Tutor summary** should work **without** any explanation-level control in the panel (depth is fixed **`intermediate`** server- and client-side)
- **Known active limitation (2026-03-24):** VexFlow edit renderer still fails to produce visible notation for some generated scores; Sandbox now auto-falls back to safe OSMD preview in Edit mode to avoid blank-canvas regressions while preserving app usability.
- **PDF / OMR (2026-04-02):** Manual upload flow should call **`/api/to-preview-musicxml`** for non-XML formats; success requires **pdfalto** built, **Poppler**, and working **oemer** (see `requirements.txt`). **Failure is expected** until oemer checkpoints + Python stack are pinned — see **`@progress.md` → Multi-format intake & PDF → Document preview**.
- **M5 study prep:** Open `http://localhost:3000/?study=reviewer_primary` → upload MusicXML → Document shows **Continue to sandbox (melody only)** → Sandbox has melody-only score. Optional `?hfExplain=minimal` → stylist suggestions omit prose in panel (requires `OPENAI_API_KEY`). Opt-in **Research log** on Sandbox copies JSON when logging is enabled.
- **Production deploy (2026-04-07):** Follow **[deployment.md](deployment.md)** — backend on separate host, Vercel **root directory = `frontend`**, **`NEXT_PUBLIC_API_URL`** + **`CORS_ORIGIN`** aligned; smoke-test upload → generate → sandbox on the live URLs.
