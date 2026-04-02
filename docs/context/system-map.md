# System Map

> **Implementation status:** Logic Core (`engine/`) complete. Flow: Document → `POST /api/generate-from-file` → Sandbox. **Additive harmonies** preserved in output. **Clefs:** Engine `satbToMusicXML.ts` emits per-part `<clef>` from instrument name + SATB voice; frontend `musicxmlParser.ts` infers clef from part name **before** fixed `P1–P4` defaults. **Theory sources in code/docs:** `Taxonomy.md` + `harmony-forge-redesign/src/lib/ai/taxonomyIndex.ts` define **Open Music Theory** (primary RAG pedagogy), **Aldwell & Schachter** (hard SATB constraints in `constraints.ts` / trace), **Fux** (motion heuristic **lineage** only—`solver.ts` uses L1 MIDI sum, not species counterpoint), **Caplin** (vocabulary; no full segmentation in primary `engine/`). **Sandbox editor (current):** **RiffScore** in `harmony-forge-redesign/` with **`EditableScore`** in Zustand; `riffscoreAdapter` + `useRiffScoreSync` + `normalizeScoreRests`. **RiffScore forkless extension:** `patch-package` applies `patches/riffscore+*.patch` (`ui.toolbarPlugins`, plugin button state props). **Legacy:** VexFlow/OSMD paths still exist in repo history and some preview surfaces; **primary editing path is RiffScore.** **Theory Inspector:** `/api/theory-inspector` (+ `theoryInspectorNoteMode` for note-click tutor), `/api/theory-inspector/suggest`; **`POST /api/validate-satb-trace`** for trace-backed highlights; **dual-mode** Origin Justifier vs Harmonic Guide vs melody-context (`theoryInspectorMode.ts`, `Note.originalGeneratedPitch` + Zustand baseline)—**UI copy** is plain-language (tutor summary, “what the tool first wrote,” “facts passed to the tutor”). **Note-click LLM:** streamed text split in **`noteInsightAiSplit.ts`** into **`aiExplanation`** + **`aiSuggestions`** after delimiter `<<<SUGGESTIONS>>>`. **`lib/ai/prompts.ts`** — **`CITATION_AND_BREVITY`** + **`HONESTY_NO_SYCOPHANCY`**. **`noteExplainContext.ts`** — staff roster, same-beat vertical snapshot, **cross-part intervals**, SATB slot motion + `resolveSatbPartIndices`; SATB path when **exactly four parts**; **5+ staves** additive FACTs. **`runAudit`** still uses four-staff mapping without `requireExactlyFourParts`. **Canvas:** **`extractStaffLabelLayout`** + **`RiffScoreEditor`** part-name overlays or numbered **Staves (top → bottom)** fallback. OpenAI optional via `OPENAI_API_KEY`. **Panel scroll:** **`useLayoutEffect` (no deps)** to avoid React Compiler / Turbopack rewriting `useEffect` dependency array length. **Tests:** vitest (`noteExplainContext`, `noteInsightAiSplit`). **Known dev gap:** RiffScore `/audio/piano/*.mp3` → **404**. **CLI:** `make test-engine`. See `@progress.md` **Theory Inspector UX (2026-04)**.

## Overview

HarmonyForge is a three-stage Glass Box architecture for symbolic music arrangement.

**Repository layout:**
- `harmony-forge-redesign/` — Tactile Sandbox frontend (Next.js); RiffScore-based score editor, Theory Inspector UI, `patch-package` for `riffscore`
- `docs/` — Plan, progress, ADRs, context
- `Taxonomy.md` — RAG lexicon for Theory Inspector; **source spine** maps treatises (Fux, Aldwell & Schachter, Caplin, Open Music Theory) to **engine behavior** vs pedagogy-only; mirrored in `harmony-forge-redesign/src/lib/ai/taxonomyIndex.ts`; LLM **`prompts.ts`** — concise citations + **non-sycophantic** honesty when `OPENAI_API_KEY` is set.

```mermaid
flowchart TB
    subgraph input [Input]
        LeadSheet[Lead Sheet: melody + chords]
    end

    subgraph logic [Logic Core]
        Solver[Backtracking Constraint Solver]
        SATB[SATB Foundation]
    end

    subgraph sandbox [Tactile Sandbox]
        UI[React/Next.js UI]
        RiffScore[RiffScore Editor]
        Zustand[Zustand EditableScore]
        Edits[User Edits]
    end

    subgraph explain [Theory Inspector]
        Auditor[Auditor Agent]
        Tutor[Tutor Agent]
        Stylist[Stylist Agent]
    end

    subgraph output [Output]
        MusicXML[MusicXML]
        PDF[PDF]
        ChordCharts[Chord Charts]
    end

    LeadSheet --> Solver
    Solver --> SATB
    SATB --> UI
    UI --> RiffScore
    RiffScore --> Zustand
    Zustand --> RiffScore
    RiffScore --> Edits
    Edits --> Auditor
    Auditor --> Tutor
    Auditor --> Stylist
    UI --> MusicXML
    UI --> PDF
    UI --> ChordCharts
```

## Components

| Component | Role | Tech |
|-----------|------|------|
| **Logic Core** | Deterministic constraint-satisfaction solver; generates valid SATB from lead sheet; variable parts (selected instruments only) | Node.js, TypeScript |
| **Tactile Sandbox** | **RiffScore**-centric notation editor; `EditableScore` ↔ RiffScore sync; rest normalization; native toolbar plugins (patched `riffscore`). Session persistence; onboarding tour. **Note:** RiffScore built-in playback may 404 on `/audio/piano/*.mp3` until static assets exist. **Lives in** `harmony-forge-redesign/` | Next 16, React 19, Tailwind, RiffScore, Zustand, patch-package |
| **Theory Inspector** | Chat + chips; SATB audit via **`/api/validate-satb-trace`** + local fallback; **harmony-only** highlights/suggest; note-click: **Tutor summary first**, **suggestions** (`aiSuggestions` / `noteInsightAiSplit.ts`), plain-language deterministic sections, **roster + multi-staff intervals + dual-mode** FACTs; tutor `theoryInspectorNoteMode`; RAG + **`CITATION_AND_BREVITY`** + **`HONESTY_NO_SYCOPHANCY`**. Panel autoscroll: **`useLayoutEffect` without deps** (Compiler-safe). | Next.js API routes, `Taxonomy.md`, `taxonomyIndex.ts`, `useTheoryInspector.ts`, `TheoryInspectorPanel.tsx`, `noteInsightAiSplit.ts`, `theoryInspectorBaseline.ts`, `theoryInspectorSlots.ts`, `prompts.ts` |
| **RiffScore canvas (labels)** | Maps each rendered staff to **`EditableScore.parts[].name`** via SVG `g.staff` geometry; fallback list if layout mismatch. | `riffscorePositions.ts` (`extractStaffLabelLayout`), `RiffScoreEditor.tsx` |

## Data Flow

1. **Input**: User uploads score as **XML, MIDI, or PDF** (PDF: 501 for MVP; use XML/MIDI).
2. **Document page**: Left pane parses uploaded MusicXML client-side and renders preview; right pane Ensemble Builder for mood + instruments. Generate Harmonies → POST to backend.
3. **Parse & normalize**: Backend converts to canonical format (ParsedScore); extracts melody, `melodyPartName`, key, chords (or infers chords using mood). fast-xml-parser for score-partwise (avoids DTD loading).
4. **Generation**: Backend solver processes ParsedScore + config (mood affects chord inference) → outputs valid SATB. **Additive harmonies:** melody stays as Part 1; selected instruments (flute, cello) added as harmony parts (Alto, Bass voices).
5. **Output**: Backend returns **partwise MusicXML 2.0** (melody + harmony parts, MuseScore/OSMD compatible) for Tactile Sandbox / note editor.
6. **Frontend (Sandbox):** Generated MusicXML → parsed → `EditableScore` → **RiffScore** display/edit; changes pulled back into Zustand. Session persistence for `generatedMusicXML`; CORS configurable.
7. **Explainability:** User query or chip → `/api/theory-inspector` (optional stream) with **`getTaxonomyContext`**; SATB audit/highlights prefer **`POST /api/validate-satb-trace`**; structured fixes via `/api/theory-inspector/suggest` when API key present; **harmony note click** → baseline + `originalGeneratedPitch` gate → dual-mode FACTs → **Tutor** stream split into **summary** + **suggestions** (`<<<SUGGESTIONS>>>`); panel shows **plain-language** section order (AI first, then origin/live/evidence). `noteExplainContext` **staff roster**, same-beat snapshot, **intervals** to each staff, SATB motion when four parts. **Canvas:** part names on staves (`extractStaffLabelLayout` + `RiffScoreEditor`). **`useLayoutEffect`** scroll (no deps) avoids Compiler `useEffect` dependency-array size bug under Turbopack. **Gaps:** (a) Roman-numeral per slot not on client; (b) audit vs 5+ staves; (c) Mode A rationale thin without engine metadata; (d) offline = taxonomy fallback; (e) scroll-every-render tradeoff until a stable single-dep pattern is validated.
8. **Export**: MusicXML, PDF, chord charts, tablature.

## Entry Points

- **API**: REST endpoints for solver (POST lead sheet → SATB JSON).
- **UI** (`harmony-forge-redesign/src/app/`): Three-step flow — `/` Playground (upload) → `/document` Config (mood, instruments) → `/sandbox` Edit (ScoreCanvas, Theory Inspector, Export). Upload, generate, edit, export.
- **Theory Inspector**: Triggered by symbolic state changes; user queries flagged notes. RAG: `Taxonomy.md` + `taxonomyIndex.ts` (genre sections + violation entries; source–engine mapping in classical blob). LLM: `prompts.ts` — `CITATION_AND_BREVITY` + `HONESTY_NO_SYCOPHANCY` when API key present.
