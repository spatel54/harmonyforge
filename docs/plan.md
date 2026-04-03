# Plan

> **Current status:** Logic Core complete (1.1–1.9). Tactile Sandbox editing is **RiffScore-first** (`harmony-forge-redesign/`): `EditableScore` in Zustand syncs bidirectionally with RiffScore; rests normalized; **riffscore** extended via **`patch-package`** (`ui.toolbarPlugins`) for native-toolbar HarmonyForge actions. **Document preview:** raw `.xml`/`.musicxml` via FileReader; **PDF / MXL / MIDI** via **`POST /api/to-preview-musicxml`** + Zustand **`previewMusicXML`** when intake succeeds. **Additive harmonies:** Engine adds harmony parts to melody. **Flow:** Upload → Document → Generate → Sandbox. **Theory Inspector:** `/api/theory-inspector` + `/api/theory-inspector/suggest`; **dual-mode** + plain-language UI; **note-click** tutor stream sends **exported notation first** (`SCORE_DIGEST`, `FACT: AUTHORITATIVE NOTATION`, vertical FACTs, **`FULL BAR`** from `buildMeasureFocusFacts`), then **Response rules**; **free-form chat** repeats **`scoreSelectionContext` at the top of the user message** on follow-ups (in addition to **Editor focus** in the system prompt). **Follow-up chat (2026-04-04):** **`conversationHistory`** is built **before** adding the new user message so the API does not get **two consecutive `user` turns** (plain question without FACTs, then full block)—reduces “I can’t see the notation” hedging. **Deterministic panels:** **What this click means** (short prose via `describeNotationForTutor`) + **Verifiable score export** (monospace FACT block); **`react-markdown`** + **`MarkdownText`** for user/AI bubbles and tutor summary/suggestions. **InspectorScoreFocus** + `regionExplainContext.ts` for measure/part. **Dark theme:** AI **ChatBubble** + playback bar pagination use **`hf-text-primary`** / **`hf-detail`**. RAG + **`CITATION_AND_BREVITY`** + **`HONESTY_NO_SYCOPHANCY`**. **Tests:** vitest — `noteExplainContext`, `noteInsightAiSplit`, `regionExplainContext`. **Active gaps:** **PDF→MusicXML (oemer)**; RiffScore `/audio/piano/*.mp3` 404s; Turbopack multi-lockfile; **residual LLM variance** / stale focus if score edits after click; **`make lint-frontend`** not green (**RiffScoreEditor** compiler/memo + `.claude` helpers).
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
   - [ ] **1.9m** **Unresolved:** **Production-ready PDF→MusicXML** — stabilize **oemer** (Python 3.10–12 venv, ONNX checkpoints downloaded or manual install, `OEMER_BIN`) and/or evaluate alternate OMR; validate in docs/CI; page-1-only PDF remains a known limitation until multi-page merge is designed.

2. **Tactile Sandbox (Frontend)** — Design around existing `harmony-forge-redesign/`
   - **Pages (design baseline)**: `/` Playground (upload) → `/document` Config (mood, instruments) → `/sandbox` Edit (ScoreCanvas, Theory Inspector). See `@progress.md` Phase 4 for full page table.
   - [x] Fix Next.js dev server (was missing `node_modules`; run `npm install`)
   - [x] Frontend already has: VexFlow, ScoreCanvas, TheoryInspectorPanel, ScoreDropzone, EnsembleBuilderPanel
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
   - [x] **Multi-part note context:** Staff roster (input vs generated names); cross-part interval FACTs to every other staff at the beat; SATB note-explain only when exactly four parts (`requireExactlyFourParts`); SATB FACTs use instrument/part names; scores with 5+ staves use full additive context (`npm run test` in `harmony-forge-redesign` for `noteExplainContext`)
   - [x] Stylist structured suggestion flow (`/api/theory-inspector/suggest`) with accept/reject + batch actions
   - [x] Grammarly-style inline suggestion ghost notes (accept/reject in-score)
   - [x] Note-level audit highlighting pipeline (red = deterministic violations, blue = theory nuance/warnings)
   - [x] Violation-card actions wired ("Explain more", "Suggest fix", "Show in score")
   - [x] **Source-aligned taxonomy + prompts (HF LitReview / NotebookLM):** `Taxonomy.md` source spine and engine-mapping table (Fux → solver motion **proxy**; Aldwell & Schachter → `constraints.ts` / `validate-satb-trace`; Caplin vocabulary + **honesty** for primary `engine/` path; Open Music Theory as **primary RAG pedagogy**); mirrored in `harmony-forge-redesign/src/lib/ai/taxonomyIndex.ts`; auditor/tutor/stylist rules in `prompts.ts` (implementation vs heuristic; Caplin guardrails); `engine/solver.ts` comment; `chamber-music-fullstack/.../harmonize-core.ts` disclaimer on `planStructuralHierarchy`
   - [x] **Tutor output policy:** `prompts.ts` — `CITATION_AND_BREVITY` + persona tuning so LLM answers cite **one** appropriate source when stating theory norms, stay **down-to-earth and short** by default, and avoid citation overload (offline fallback unchanged).
   - [x] **Honest tutor tone:** `prompts.ts` — `HONESTY_NO_SYCOPHANCY` for Auditor/Tutor/Stylist (no flattery; distinguish constraint pass vs musical quality; admit incomplete context; gray areas; correct wrong premises; Stylist tradeoffs / “one common fix”).
   - [x] **Note-inspector UX (2026-04):** `TheoryInspectorPanel` — **Tutor summary** before origin/live/evidence blocks; plain-language titles + subtitles; **`aiSuggestions`** from tutor stream (`<<<SUGGESTIONS>>>`); `noteInsightAiSplit.ts` + vitest; `useTheoryInspectorStore.aiSuggestions`.
   - [x] **Staff ↔ instrument on canvas:** `extractStaffLabelLayout` (`riffscorePositions.ts`); `RiffScoreEditor` left labels + **Staves (top → bottom)** fallback when DOM doesn’t match part count.
   - [x] **Inspector scroll + React Compiler:** `useLayoutEffect` without dependency array (avoids “useEffect final argument changed size” under Next 16 + Turbopack); see `@progress.md`.
   - [x] **Free-form chat in panel (2026-04-03):** `TheoryInspectorPanel` shows Zustand **`messages`** + always-visible composer (empty placeholder); sandbox wires **`sendMessage`** / **`inputValue`** / **`streamingMessageId`**; no automatic **`chips`** rows after assistant replies or after **`runAudit`**; conversation history built before the in-flight empty AI bubble. See `@progress.md` → **Work log — 2026-04-03**.
   - [x] **Editor focus for chat + measure/part UI (2026-04-04):** **`InspectorScoreFocus`** + **`scoreSelectionContext`**; **`Editor focus`** block in **`prompts.ts`** (Tutor/Auditor/Stylist) so the LLM reads clicked context; **`regionExplainContext.ts`** (`buildMeasureFocusFacts`, `buildPartFocusFacts`) + vitest; **`RiffScoreEditor`** measure strip, staff-label part select, selection inference, green **focus** overlays; **`TheoryInspectorPanel`** region card; route **`scoreSelectionContext`**. See `@progress.md` → **Work log — Theory Inspector: editor focus for chat + measure/part (2026-04-04)**.
   - [x] **Tutor text export + message ordering (2026-04-03):** **`SCORE_DIGEST`**, **`FACT: AUTHORITATIVE NOTATION`**, **`FULL BAR`** (measure-level `buildMeasureFocusFacts` appended to note evidence); **note-click** `userMessage` = evidence **then** **Response rules**; **chat** prepends full FACT block before user text; **SATB** path includes digest + full bar; **`prompts.ts`** / **`NOTE_EXPLAIN_TUTOR_BRIEF`** — full notation, no “pitch-only”; **UI** — **`ChatBubble`** AI variant + **`SandboxPlaybackBar`** pagination contrast for dark theme. See `@progress.md` → **Work log — LLM “sees” the score (2026-04-03)**.
   - [x] **Tutor follow-up + panels + markdown (2026-04-04):** **`sendMessage`** — snapshot **`conversationHistory`** before **`addMessage(userMsg)`** (no duplicate plain-then-rich user pair to the LLM). **Panels** — **What this click means** + **Verifiable score export**; shortened **`currentPitchGuideExplanation`**. **`react-markdown`** + **`MarkdownText.tsx`** — **`ChatBubble`** user/ai; tutor summary, ideas, origin, click-meaning in **`TheoryInspectorPanel`**. See `@progress.md` → **Work log — Tutor follow-up + panels + markdown (2026-04-04)**. **Open:** optional **live evidence refresh** on send; **residual** model/stale-focus risk; **`make lint-frontend`** debt.

4. **Supporting Features** *(M4 #79 — MVP by 3/27)*
   - [ ] Multi-clef & instrument transposition; multi-instrument selection
   - [x] Audio playback: rest-aware timing + measure-aware scheduling; pitch-safe filtering; transport stability
   - [x] Onboarding flow: guided first-time tour (Upload → Document → Generate → Sandbox) with localStorage completion flag
   - [ ] Export: PDF + chord-chart path implemented; tablature deferred

## Verification

- `make test` — Backend unit and integration tests pass
- `cd harmony-forge-redesign && npm run test` — Vitest (`noteExplainContext`, `noteInsightAiSplit`, **`regionExplainContext`**, and future frontend unit tests)
- `make lint` — Backend ESLint passes
- `make build` — Engine build plus Next production build pass
- `make test-engine` — CLI runs engine on `input/月亮代表我的心.xml` → `output/月亮代表我的心_flute_cello.xml` (melody + flute + cello, major)
- Manual: Upload `月亮代表我的心.xml` → preview on `/document` → configure mood + instruments → Generate Harmonies → land on `/sandbox` with 3 parts (Violin, Flute, Cello)
- **File pipeline**: `POST /api/generate-from-file` returns `200` with partwise MusicXML (additive harmonies)
- **LLM (optional):** Copy `harmony-forge-redesign/.env.example` → `.env.local`, set `OPENAI_API_KEY`, restart `make dev`; `curl http://localhost:3000/api/theory-inspector` should report `"hasApiKey":true`
- **Theory Inspector follow-up (2026-04-04):** Sandbox → open inspector → click **melody** note → after tutor summary, ask e.g. “Is this a half note?” — expect answer grounded in **`SCORE_DIGEST` / AUTHORITATIVE** (not “I can’t see notation”); chat bubbles should render **`**bold**`** when the model emits markdown
- **Known active limitation (2026-03-24):** VexFlow edit renderer still fails to produce visible notation for some generated scores; Sandbox now auto-falls back to safe OSMD preview in Edit mode to avoid blank-canvas regressions while preserving app usability.
- **PDF / OMR (2026-04-02):** Manual upload flow should call **`/api/to-preview-musicxml`** for non-XML formats; success requires **pdfalto** built, **Poppler**, and working **oemer** (see `requirements.txt`). **Failure is expected** until oemer checkpoints + Python stack are pinned — see **`@progress.md` → Multi-format intake & PDF → Document preview**.
