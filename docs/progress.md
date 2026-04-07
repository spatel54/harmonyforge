# Progress (RALPH Loop)

### How to read this file

This is a **long-running work log** (RALPH: Research, Analyze, Learn, Plan, Handover). Newest context often appears in **work log** sections near the top and in **Consolidated status**. Older **session logs** stay for archaeology—use search or the links below rather than reading top-to-bottom once.

### Quick links

- [End Goal](#end-goal)
- [Work log — Documentation, deployment, repo hygiene (2026-04-07)](#wl-docs-deploy-2026-04-07)
- [Work log — Theory Inspector: split panel, idea actions, ghost labels, apply fix (2026-04-06)](#wl-inspector-split-ideas-2026-04-06)
- [Work log — Repository layout (2026-04-06)](#wl-repo-layout)
- [Work log — Onboarding, transitions, coachmarks, AI env (2026-04-06)](#wl-onboarding-coachmarks)
- [Work log — 6-step Pencil coachmark tour (2026-04-07)](#wl-coachmarks-6step-2026-04-07)
- [Approach](#approach)
- [Research protocol (M5)](#research-protocol-m5--in-app-conditions-reference)
- [Consolidated status (2026-04)](#consolidated-status-2026-04)
- [Steps Done So Far](#steps-done-so-far)
- [Current Focus](#current-focus)
- [Current Status](#current-status)
- [Next Steps](#next-steps)
- [Learnings](#learnings)
- [State Handover](#state-handover)

### Last updated (2026-04-07)

- **6-step product tour (Pencil / `newfiles`):** Replaced the 13-step minimal overlay with **portal spotlight** (`data-coachmark="step-1"`…`step-6`), **`useSandboxTourBridge`** (sandbox registers inspector/export setters), **tour bypass** on `/document` and `/sandbox` when `isActive`, **`/samples/tour_demo.xml`** seed for sandbox without prior generation, **`hf-coachmarks-v2`** persist including **`hasDismissed`**, **`completeOnboarding`** on skip/done, **`WelcomeGuideButton`** hidden when coachmarks enabled. See **[Work log — 6-step Pencil coachmark tour (2026-04-07)](#wl-coachmarks-6step-2026-04-07)**.
- **Theory Inspector — full session write-up:** See **[Work log — Theory Inspector: split panel, idea actions, ghost labels, apply fix (2026-04-06)](#wl-inspector-split-ideas-2026-04-06)** for end goal, approach, file-level steps, and **what was broken vs fixed** (IDEA_ACTIONS `noteId` / silent apply failure). **Residual risks** are listed there and in **[Current Focus](#current-focus)**.
- **Theory Inspector UX (shipped 2026-04-06):** Panel split (**note/recommendations** top, **chat** bottom); **`<<<IDEA_ACTIONS>>>`** JSON + Accept/Reject; **`NOTE_IDS_FOR_IDEA_ACTIONS`** in tutor evidence + **`resolveIdeaActionNoteId`** fallback + inspector debug line on failure; stylist ghost **always-visible pitch**; note-input **preview pitch** label; study log **`idea_action_accepted` / `idea_action_rejected`**.
- **Documentation overhaul (completed):** Root [README.md](../README.md) reworked (RiffScore-first, journey diagrams, Makefile, folder map). Per-folder guides: [frontend/README.md](../frontend/README.md), [backend/README.md](../backend/README.md), [miscellaneous/README.md](../miscellaneous/README.md), [.cursor/README.md](../.cursor/README.md), [backend/engine/README.md](../backend/engine/README.md). [docs/README.md](README.md) expanded into a full index; [plan.md](plan.md) gained reader-facing **Status at a glance** + **Current snapshot** (replacing the wall-of-text blockquote); this file gained **How to read**, **Quick links** (with stable anchors), and **Last updated** stubs.
- **Second README pass (visual / onboarding):** Tables, ASCII + Mermaid diagrams, “start here” paths, plain-language callouts across the same README set.
- **Deployment playbook (new doc):** [deployment.md](deployment.md) — Vercel (**`frontend/`** root), separate backend host, **`NEXT_PUBLIC_*` vs secrets**, **`CORS_ORIGIN`** on the engine, preview-deploy caveat.
- **Root `node_modules` hygiene:** [node_modules/README.md](../node_modules/README.md) explains non-canonical root installs; root [`.gitignore`](../.gitignore) ignores `/node_modules/*` but **keeps** `!/node_modules/README.md` so the explainer can be committed without tracking dependencies.
- **Git workflow:** `origin/main` diverged from local once (remote “AI engine” description commit vs local README commit); reconciled with **`git pull --rebase origin main`** then **`git push`** — recommend `git config pull.rebase true` (or pass **`--rebase`** per pull) to avoid the “Need to specify how to reconcile” prompt.

**Still the active product blockers (unchanged):** see **[Current Focus](#current-focus)** — PDF/OMR (**1.9m**), RiffScore **`/audio/piano/*.mp3` 404s**, **`make lint-frontend`** not green, residual tutor/focus edge cases. Doc work does **not** close those; it orients contributors and deployers.

For checklist and verification steps, pair this file with **[plan.md](plan.md)** and **[README.md](../README.md)**.

## End Goal

Full flow working — **Upload → Document (preview + config) → Generate Harmonies → Sandbox** with editable score and working audio playback (Noteflight/MuseScore-style). The engine **adds** harmony parts to the user's melody (melody + flute + cello = 3 parts), rather than replacing it. User configures mood and instruments on Document page; generated MusicXML loads into the note editor for editing, playback, and export.

**Core objectives:**
- **Expressive Sovereignty**: Musician remains the ultimate author.
- **Copyright Safety by Design**: Use axiomatic music theory instead of pattern mimicry from copyrighted datasets.
- **Pedagogical Partner**: Transparent, explainable Theory Tutor.

---

<a id="wl-repo-layout"></a>

## Work log — Repository layout (2026-04-06)

Reorganized the monorepo into **`backend/`** (Node package: `engine/`, `scripts/`, CLI `input/` / `output/`), **`frontend/`** (former `harmony-forge-redesign/`, flattened), **`docs/`** (includes **`docs/Taxonomy.md`**, **`docs/PROMPT.md`**), and **`miscellaneous/`** (`chamber-music-fullstack/`, `pdfalto/`, `run-amp.sh`, `.playwright-mcp/`). Root keeps **`Makefile`**, **`README.md`**, **`.gitignore`**, **`.cursor/`**. **`make dev`** / **`make install`** / **`make test`** run via **`backend/`** and **`frontend/`**; **`make pdfalto`** builds **`miscellaneous/pdfalto/`**; engine pdfalto discovery checks both **`pdfalto/pdfalto`** and **`miscellaneous/pdfalto/pdfalto`**. **Follow-up:** set deploy **root directory** to **`frontend/`** if a host still pointed at the old folder name; remove stale repo-root **`node_modules`** if present (no root **`package.json`**).

---

<a id="wl-onboarding-coachmarks"></a>

## Work log — Onboarding, transitions, coachmarks, AI env (2026-04-06)

**Learnings:** Ported **`newfiles/`** patterns into **`frontend/`** without dropping M5: root layout keeps **`StudySessionProvider`** + **`StudyConsentGate`** and adds **`CoachmarkOverlay`** under **`ThemeProvider`**. **`TransitionOverlay`** uses merged book/notes + percent for **`parsing`/`generating`** and retains **`melody_only`**. Playground **`/`** uses **`OnboardingModal`** + **`completeOnboarding`** on dismiss; **`/onboarding`** uses **`HomeViewOnboarding`** (same upload/`to-preview-musicxml` path as home). **`useCoachmarkStore`** + **`STEP_ROUTES`** drive navigation; **`data-coachmark="1"`–`"10"`** on stable regions (document preview/ensemble/CTA, sandbox editor/inspector/export); steps without a dedicated node fall back in **`CoachmarkOverlay`**. **`llmClient`** resolves base URL from **`OPENAI_BASE_URL ?? OPENAI_URL`**; **`frontend/.env.example`** and theory-inspector offline copy mention these vars.

---

<a id="wl-coachmarks-6step-2026-04-07"></a>

## Work log — 6-step Pencil coachmark tour (2026-04-07)

**Supersedes:** the earlier **13-step** numeric **`data-coachmark`** tour described in the log above.

### Shipped

| Area | Detail |
|------|--------|
| **Store** | [`useCoachmarkStore.ts`](../frontend/src/store/useCoachmarkStore.ts) — `TOTAL_STEPS = 6`, `STEP_ROUTES`, persist key **`hf-coachmarks-v2`**, **`hasDismissed`** persisted |
| **Bridge** | [`useSandboxTourBridge.ts`](../frontend/src/store/useSandboxTourBridge.ts) — sandbox registers `setInspectorOpen` / `setExportModalOpen` |
| **Overlay** | [`CoachmarkOverlay.tsx`](../frontend/src/components/organisms/CoachmarkOverlay.tsx) — cutout dimming, carets, dots, celebration, auto-start on **`/`** when not dismissed |
| **Anchors** | `step-1` … `step-6` on Playground, Ensemble panel, sandbox column, inspector, Export header, [`ExportOptionsPane`](../frontend/src/components/molecules/ExportOptionsPane.tsx) |
| **Guards** | [`document/page.tsx`](../frontend/src/app/document/page.tsx) / [`sandbox/page.tsx`](../frontend/src/app/sandbox/page.tsx) — skip strict redirects when tour **`isActive`**; sandbox fetches **`/samples/tour_demo.xml`** when needed |
| **Legacy** | **`OnboardingModal`** / **`OnboardingCoachmark`** gated off when **`COACHMARKS_ENABLED`**; tour skip/done calls **`completeOnboarding()`** |
| **Chrome** | [`CoachmarkTourButton`](../frontend/src/components/organisms/CoachmarkTourButton.tsx) — Help icon, **`router.push("/")`** on replay; [`WelcomeGuideButton`](../frontend/src/components/organisms/WelcomeGuideButton.tsx) hidden when coachmarks on |

**Verification:** `cd frontend && npm run test`; `npm run build`.

---

<a id="wl-docs-deploy-2026-04-07"></a>

## Work log — Documentation, deployment, and repo hygiene (2026-04-07)

### End goal (restated for this thread)

Ship and maintain **HarmonyForge** as a **glass-box** symbolic harmony tool: **Upload → Document → Generate → Sandbox** with **RiffScore**-centric editing, reliable engine API, optional **Theory Inspector** (LLM explain/suggest only), and **M5** study switches when needed. Long-term gaps (PDF/OMR, frontend lint debt, playback assets) remain on the **product** track, not the **docs** track.

### Approach we took here

1. **Documentation as product:** Make onboarding for humans and agents cheap — one root story, folder READMEs, indexed `docs/`, readable **plan** header, navigable **progress**.
2. **Honesty about architecture:** Call out **two deployables** (Next frontend + Express backend) so Vercel-only expectations do not strand the engine.
3. **Secrets hygiene:** Encode in-repo guidance that **`OPENAI_*`** stays server-side and **`NEXT_PUBLIC_*`** is public; never document committing **`.env.local`**.
4. **Repo cleanliness:** Discourage accidental root **`node_modules`** tracking while preserving a tracked explainer **`node_modules/README.md`**.

### Steps completed (this thread)

| Step | Outcome |
|------|---------|
| README + docs plan | Executed attached “Documentation and README overhaul” plan (without editing the plan file in-repo): root README, **plan.md** / **progress.md** top matter, **docs/README.md** index, **frontend** / **backend** / **miscellaneous** / **.cursor** / **backend/engine** READMEs; consistency grep for stale paths. |
| Visual README pass | Second pass: Mermaid/ASCII, “start here” tables, callouts, skimmable env and route tables. |
| Deployment guidance | Captured step-by-step **Vercel + engine host + env + CORS** in **[deployment.md](deployment.md)** (was previously chat-only). |
| `node_modules` README | Added **[../node_modules/README.md](../node_modules/README.md)**; root **`.gitignore`** exception so only that file under root `node_modules/` is intended to be tracked. |
| Git | Divergent **main**: local “node_modules README” vs remote “AI engine” description — resolved via **rebase** and push. |

### Current failure / blockers (product — not introduced by docs work)

The **documentation session did not fix** runtime or CI failures. **Current Focus** below remains authoritative; in short:

| Blocker | Nature |
|---------|--------|
| **PDF → MusicXML / oemer** | **1.9m** — unreliable for “any PDF” in the wild; needs env/tooling hardening or alternate OMR. |
| **RiffScore piano sample 404s** | UX/audio expectation gap for built-in sampler URLs. |
| **`make lint-frontend`** | Not green; RiffScore/editor/compiler debt. |
| **Tutor / focus** | Residual LLM grounding after heavy edits; optional live evidence refresh still open. |

**Deployment “failure mode” to watch:** If only Vercel is configured, the UI will load but **browser calls to the engine will fail** until **`NEXT_PUBLIC_API_URL`** points at a live backend and **`CORS_ORIGIN`** on the engine matches the Vercel origin. Preview deployments need a **multi-origin** or **staging API** story; single **`CORS_ORIGIN`** does not cover every `*.vercel.app` preview URL.

### Learnings

- **Rebase vs merge** on divergent **main**: `git pull --rebase origin main` avoided a merge commit noise when both sides had one commit off the same parent.
- **Tracking `node_modules`:** Ignoring `node_modules/*` with one negated `README.md` is a workable pattern; teammates may still need **`git rm -r --cached node_modules`** once if history already tracked packages.

---

<a id="wl-inspector-split-ideas-2026-04-06"></a>

## Work log — Theory Inspector: split panel, idea actions, ghost labels, apply fix (2026-04-06)

### End goal (this thread)

Improve **Theory Inspector** on `/sandbox` so that:

1. **Layout:** Note-level panels and “Ideas to try next” stay visually separate from **free-form chat** (two scroll regions).
2. **Actionable ideas:** When the tutor proposes a **concrete pitch change**, the user can **Accept** (apply immediately to `EditableScore` / RiffScore sync) or **Reject** (dismiss but keep the row visible).
3. **Ghost / preview clarity:** Stylist **ghost noteheads** show **scientific pitch** (e.g. `G4`) without requiring hover; **note-input** hover shows the **preview pitch** next to RiffScore’s phantom notehead.

Underlying product end goal (unchanged): **Upload → Document → Generate → Sandbox** with **glass-box** explanations and **expressive sovereignty** — the musician stays author; AI explains and suggests, deterministic engine + editor state remain ground truth.

### Approach

- **Split UI:** `TheoryInspectorPanel` uses two equal `flex-1` panes: top = measure/part card + full `noteInsight` stack (including Ideas); bottom = `messages` + typing indicator. **`useLayoutEffect` auto-scroll** only the **chat** pane so long note content does not reset chat scroll.
- **Machine-readable idea applies:** Tutor may append **`<<<IDEA_ACTIONS>>>`** + JSON array validated by **`ideaActionSchema.ts`** (`id`, `noteId`, `suggestedPitch`, `summary`). Parsed in **`splitNoteInsightAiContent`** (`noteInsightAiSplit.ts`); stored on **`NoteInsight`** (`ideaActions`, `ideaActionStatuses`); **`patchSelectedNoteInsight`** updates accept/reject state.
- **Same apply path as Stylist:** Sandbox **`handleAcceptIdeaAction`** calls **`flushToZustand`**, **`applySuggestion`** + **`applyScore`** (same as structured suggestions).
- **Reliability fix (post-QA):** Evidence previously lacked **editor `noteId`s**, so the model invented JSON ids and **`getNoteById` returned null** → **silent no-op**. Mitigation: **`NOTE_IDS_FOR_IDEA_ACTIONS`** **`FACT:`** lines in **additive** (`buildAdditiveNoteContextLines`) and **SATB** (`useTheoryInspector` evidence); prompt requires **verbatim** copy; **`resolveIdeaActionNoteId`** (`ideaActionResolve.ts`) falls back to **unique part name in `summary` + same measure/beat as clicked note**; **`setInspectorDebugStatus`** explains failures.
- **Ghost labels:** **`RiffScoreSuggestionOverlay`** — always-on mono label; **`findNoteInputPreviewLayout`** + **`staffPreviewPitch.ts`** + **`requestAnimationFrame`** in **`RiffScoreEditor`** when **`noteInputPitchLabelEnabled`** (from sandbox **`isNoteInputMode`**).
- **M5 / study:** **`idea_action_accepted` / `idea_action_rejected`** in **`studyEventLog.ts`**; consent copy in **`StudyConsentGate.tsx`**.

### Steps completed (implementation checklist)

| Area | What shipped |
|------|----------------|
| Panel layout | [`TheoryInspectorPanel.tsx`](../frontend/src/components/organisms/TheoryInspectorPanel.tsx) — top/bottom panes, `chatScrollRef` |
| Parse + types | [`ideaActionSchema.ts`](../frontend/src/lib/ai/ideaActionSchema.ts), [`noteInsightAiSplit.ts`](../frontend/src/lib/ai/noteInsightAiSplit.ts), [`useTheoryInspectorStore.ts`](../frontend/src/store/useTheoryInspectorStore.ts) — `ideaActions`, `patchSelectedNoteInsight` |
| Tutor prompt | [`useTheoryInspector.ts`](../frontend/src/hooks/useTheoryInspector.ts) — `NOTE_EXPLAIN_TUTOR_BRIEF` + `NOTE_IDS_FOR_IDEA_ACTIONS` in SATB evidence; streaming merge preserves statuses |
| Evidence IDs | [`noteExplainContext.ts`](../frontend/src/lib/music/noteExplainContext.ts) — `NOTE_IDS_FOR_IDEA_ACTIONS` block; **`startBeatOfNoteIndex`** exported |
| Apply + UX | [`sandbox/page.tsx`](../frontend/src/app/sandbox/page.tsx) — `handleAcceptIdeaAction` / `handleRejectIdeaAction`, resolver, debug status |
| Resolver | [`ideaActionResolve.ts`](../frontend/src/lib/music/ideaActionResolve.ts) + [`ideaActionResolve.test.ts`](../frontend/src/lib/music/ideaActionResolve.test.ts) |
| Stylist ghost | [`RiffScoreSuggestionOverlay.tsx`](../frontend/src/components/score/RiffScoreSuggestionOverlay.tsx) |
| Input preview | [`staffPreviewPitch.ts`](../frontend/src/lib/music/staffPreviewPitch.ts), [`riffscorePositions.ts`](../frontend/src/lib/music/riffscorePositions.ts) — `findNoteInputPreviewLayout`, [`RiffScoreEditor.tsx`](../frontend/src/components/score/RiffScoreEditor.tsx), [`ScoreCanvas.tsx`](../frontend/src/components/organisms/ScoreCanvas.tsx) |
| Tests | Vitest: `noteInsightAiSplit.test.ts`, `staffPreviewPitch.test.ts`, `ideaActionResolve.test.ts` (`cd frontend && npm test`) |
| Docs | [`plan.md`](plan.md) (snapshot + checklist + vitest line); [`docs/README.md`](README.md) quick link to this work log; this **Learnings** subsection |

### Failure we hit — and current status

| Issue | Status |
|-------|--------|
| **Accept on “One-click pitch edits” did nothing** | **Addressed:** Root cause was **missing / wrong `noteId`** in JSON. **NOTE_ID FACT lines** + **resolver** + **user-visible debug message**; users should **re-open the note** once so the tutor sees the new block (old streamed replies lack `NOTE_IDS`). |
| **Ambiguous resolver** | **Open / residual:** Fallback matches **part name substring** in `summary` at **clicked note’s measure+beat**. Fails if **no unique match**, **two parts share a name fragment**, or the suggestion targets a **different beat** than the click. |
| **Input preview pitch vs RiffScore DOM** | **Open / residual:** Label derives from **staff line + preview `NoteHead` geometry**; internal SVG changes could desync. |
| **Product blockers (unchanged)** | PDF/OMR (**1.9m**), RiffScore **piano 404s**, **`make lint-frontend`** not green, tutor/focus edge cases — see **Current Focus** below. |

### Ops note

- **Run app:** `make dev` (backend **:8000**, Next **:3000**). **Stop:** `make dev-clean` clears those ports and Next dev lock.

---

## Approach

1. **Fix parsing** (backend + frontend) — MusicXML partwise/timewise, no DTD loading, correct pitch mapping.
2. **Fix SATB solver** — Handle real melodies, non-chord tones, relaxed fallback when strict voice-leading fails.
3. **Fix MusicXML output** — Preserve rhythm, variable parts (only selected instruments). **Additive harmonies**: melody stays as first part; user-selected instruments (flute, cello) are added as harmony parts.
4. **Fix frontend display** — Document preview renders reliably; **Sandbox primary editor** is **RiffScore** (third-party notation UI) with `EditableScore` in Zustand as the app’s canonical model; bidirectional sync via adapter + `useRiffScoreSync`. Legacy VexFlow/OSMD paths remain referenced historically below; current MVP editing path is RiffScore-centric.
5. **Variable parts** — Generator outputs melody + harmony parts only (e.g. melody + flute + cello = 3 parts). Soprano instruments map to Alto voice; Alto/Tenor/Bass map to their voices.
6. **Explainability** — Theory Inspector treats the **deterministic engine** as ground truth for **generated** harmony parts; **note explain** uses deterministic **full-notation** FACTs (pitch **and** rhythm/duration, roster, vertical stack, cross-part intervals, motion, **full-bar measure dump** for the clicked bar) plus optional trace; chat + highlights explain violations on harmony; taxonomy is RAG-style context; LLM is optional and must not invent rules beyond supplied context. The tutor does **not** receive staff images—it receives **structured text** (`SCORE_DIGEST`, `FACT:` lines, `FULL BAR`); prompts and **user-message ordering** are tuned so that block is treated as visible notation. **Melody** clicks get context without engine-origin block. **Editor focus for chat (2026-04):** **`InspectorScoreFocus`** (note | measure | whole part): **`Editor focus`** in `prompts.ts` + **`scoreSelectionContext`**; **follow-up** chat **prepends** the same FACT block to the user message (not only the system prompt). **`conversationHistory` for follow-ups (2026-04-04):** built **before** appending the new user bubble so the API does **not** receive two consecutive `user` messages (plain question then notation)—see **Work log — Tutor follow-up + panels + markdown**. Measure bar strip + staff labels + RiffScore multi-select inference; green **focus highlights** (`regionExplainContext.ts`). **Tutor audience depth (2026-04-03):** **No Beginner/Intermediate/Professional UI toggle**—fixed **`intermediate`** depth via **`DEFAULT_EXPLANATION_LEVEL`** and **`resolveExplanationLevel`** on inspector APIs; chat, suggest, and note-summary streams are **not** gated on choosing a level (see **Work log — Theory Inspector: default explanation depth**).
7. **Source-transparent tutoring (2026-04)** — RAG lexicon (`docs/Taxonomy.md`, `taxonomyIndex.ts`) maps **Fux**, **Aldwell & Schachter**, **Caplin**, and **Open Music Theory** to what the code actually does vs pedagogy-only claims. LLM system prompts (`prompts.ts`) require **brief citations** when stating rules (one best source per claim), **plain language first**, and **tight length** defaults so users learn without information overload.
8. **Honest, non-sycophantic tutor (2026-04)** — Same `prompts.ts`: shared **`HONESTY_NO_SYCOPHANCY`** block for Auditor/Tutor/Stylist—no flattery or false agreement; **passing the checker ≠ musically ideal**; admit **thin context** and **gray areas**; **correct wrong premises** gently from facts; Stylist notes when a fix is **one option** or has **tradeoffs**.
9. **M5 study prep (2026-04)** — **RQ1:** `study=reviewer_primary` or env → Document **Continue to sandbox (melody only)** skips `generate-from-file`. **RQ2:** `hfExplain=minimal` or env → stylist API/UI suppresses suggestion prose; `buildStylistStructuredPrompt` + server strip. **Logging:** opt-in `studyEventLog` + Sandbox **Research log** strip; optional **`NEXT_PUBLIC_HF_STUDY_REQUIRES_CONSENT`** modal. See **`@docs/plan.md` → M5 — User study**.

---

## Research protocol (M5) — in-app conditions (reference)

| Factor | Level | In-app behavior |
|--------|--------|------------------|
| RQ1 arm | `generator_primary` | Generate Harmonies calls engine; additive parts in Sandbox. |
| RQ1 arm | `reviewer_primary` | Melody-only XML to Sandbox; user-authored harmonies. |
| RQ2 explanation | `full` | Default stylist `summary` / `rationale` + panel prose. |
| RQ2 explanation | `minimal` | Empty summary/rationale in API response; neutral card copy. |

**Dependent variables (outside app):** ownership / agency scales, trust or skepticism measures — collected via your survey instrument, not stored in HarmonyForge by default.

**Verification:** `cd frontend && npm run test` (`studyConfig.test.ts`); `?study=reviewer_primary` manual path; `?hfExplain=minimal` + stylist suggestion smoke test with `OPENAI_API_KEY`.

---

<a id="consolidated-status-2026-04"></a>

## Consolidated status (2026-04) — end goal, approach, done work, active gaps

### End goal (unchanged + clarified)

- **Product flow:** Upload → Document (preview + config) → Generate Harmonies → **Sandbox** with editable score, export, and optional playback.
- **Engine contract:** Additive harmonies (melody part preserved; new parts are generated).
- **Editor UX:** Modern notation editing (rest-complete measures, shortcuts, integrated toolbar) aligned with familiar editors (Noteflight/MuseScore-style goals).
- **Theory Inspector:** Transparent “glass box” — **full-notation** note explain (pitch + rhythm + per-bar dump): **Origin Justifier** (Mode A: current pitch still matches engine snapshot) vs **Harmonic Guide** (Mode B: edited or no baseline); staff roster + cross-part intervals; **`SCORE_DIGEST`** + **`AUTHORITATIVE NOTATION`** + **`FULL BAR`** (`buildMeasureFocusFacts`) so the LLM gets an explicit text “view” of the score (no vision model required). **Chat grounding:** **Editor focus** + **`scoreSelectionContext`**; **follow-up** messages **repeat** FACT text at the start of the user turn; note-click stream sends **evidence before** response rules. Users can focus a **measure** or **whole part**; panel shows **This measure** / **This part**. **Copy policy:** **`CITATION_AND_BREVITY`** + **`HONESTY_NO_SYCOPHANCY`**. **Tutor depth (2026-04-03):** single fixed **`intermediate`** audience instruction—**no** per-session Beginner/Intermediate/Professional toggle. **Active risk:** models may still ignore embedded FACT lines—mitigated by **follow-up chat history fix (2026-04-04)**; residual risk in **Work log — Tutor follow-up + panels + markdown (2026-04-04)**.

### Approach (this arc)

- **State:** `EditableScore` + Zustand (`useScoreStore`) remain the canonical score; **RiffScore** renders and captures edits; `riffscoreAdapter` + `normalizeScoreRests` keep measures rhythmically complete.
- **Toolbar:** RiffScore’s public API did not expose custom toolbar slots — we **patch** `riffscore` (via `patch-package`) to add `ui.toolbarPlugins`, then mount HarmonyForge actions (palettes, undo/redo, transpose, XML export, etc.) inside the native toolbar.
- **Inspector (dual-mode + data):** **Comparison gate** in `theoryInspectorMode.ts`: `resolveOriginalEnginePitch` prefers `Note.originalGeneratedPitch` then Zustand baseline map; `computeTheoryInspectorMode` → `origin-justifier` | `harmonic-guide` | `melody-context`. Baseline captured in `theoryInspectorBaseline.ts` on sandbox load; `applyOriginalGeneratedPitches` stamps harmony notes; RiffScore pull preserves provenance by note id; clipboard **extractNotes** strips provenance on paste. UI: `TheoryInspectorPanel` uses Origin Justifier / Harmonic Guide copy; slim Harmonic Guide card when pitch unchanged. API: `theoryInspectorNoteMode` on `/api/theory-inspector` + **`prompts.ts`**: **`CITATION_AND_BREVITY`**, **`HONESTY_NO_SYCOPHANCY`**, persona rules (Caplin guardrails; avoid bullet dumps unless asked).
- **Inspector (multi-staff FACTs):** `noteExplainContext.ts` — `buildScorePartRosterLines`, `buildCrossPartIntervalFacts`, additive vertical lines labeled **input vs generated** with `part.name` and staff index; SATB FACT lines take optional `voiceStaffNames` and pairwise intervals from clicked voice to each other voice. **Note explain routing:** `scoreToAuditedSlots(score, { requireExactlyFourParts: true })` so **only exactly four parts** use the SATB slot path; **five or more staves** use full additive context (no hidden 5th–8th staff drop). **`runAudit`** still uses `scoreToAuditedSlots(score)` without that flag (first four mapped parts only until engine supports full multi-voice audit).
- **Frontend tests:** `frontend` — `vitest` + `npm run test` (`noteExplainContext.test.ts`).

### Steps completed in this arc (high level)

| Area | What shipped |
|------|----------------|
| **Rests** | `normalizeScoreRests` in `scoreUtils`; `setScore`/`applyScore` normalize; RiffScore adapter preserves `isRest` both directions; `insertNote` can replace a rest slot. |
| **Editor / toolbar** | Removed duplicate floating palette pattern; `toolbarPlugins` patch; palette visibility + styled plugin buttons; many functional plugin actions. |
| **Stability** | Fixed React “getSnapshot / maximum update depth” by using **per-field** `useScoreStore` selectors in `RiffScoreEditor` (no object literal selector). |
| **Theory Inspector** | Dual-mode (`inspectorMode`, `theoryInspectorMode.ts`); `originalGeneratedPitch` on `Note`, sandbox stamp + RiffScore preserve; tutor `theoryInspectorNoteMode`; **2026-04 (UX):** note panel **deterministic blocks → Tutor summary → Ideas to try next** (plain-language section titles), **`aiSuggestions`** via `<<<SUGGESTIONS>>>` + `noteInsightAiSplit.ts`; **multi-part** roster + cross-part interval FACTs; `resolveSatbPartIndices` + `requireExactlyFourParts` for note-explain SATB gate; SATB FACTs show part names; vitest for `noteExplainContext` + `noteInsightAiSplit`. **2026-04-02:** Source-aligned `Taxonomy.md` + `taxonomyIndex.ts` + `prompts.ts` (Fux / A&S / Caplin / OMT) with engine-mapping honesty; `engine/solver.ts` + `engine/constraints.ts` + `engine/types.ts` comments; chamber `harmonize-core.ts` Caplin disclaimer. **2026-04 (follow-up):** `prompts.ts` — `CITATION_AND_BREVITY` + **`HONESTY_NO_SYCOPHANCY`**. **2026-04-03:** **Free-form chat** in the same panel (empty default messages, no auto chips after chat/audit; persistent composer; `streamingMessageId` for chat-only typing indicator). **2026-04-04:** **Editor focus for chat** — `InspectorScoreFocus` + `scoreSelectionContext`; **`Editor focus`** block in all inspector personas’ system prompts; **measure bar strip** + **clickable staff labels** + RiffScore **`selectAll('measure'|'staff')`** + multi-select **inference**; **`buildMeasureFocusFacts` / `buildPartFocusFacts`** (`regionExplainContext.ts`, vitest); green **focus** note overlays; panel **This measure / This part** card; `setSelectedNoteInsight(null)` preserves measure/part focus. **2026-04-03 (later):** **LLM notation export** — `SCORE_DIGEST`, `AUTHORITATIVE NOTATION`, **FULL BAR** measure dump; note stream **evidence-first** `userMessage`; chat **prepends** FACT block; SATB path measure dump; **ChatBubble** / **SandboxPlaybackBar** dark-theme contrast; full-notation prompt framing (not pitch-only). **2026-04-04 (later):** **Follow-up chat** — `conversationHistory` excludes the in-flight user message (no duplicate plain-then-rich user pair); panels **What this click means** + **Verifiable score export**; short **`currentPitchGuideExplanation`**; **`react-markdown`** via **`MarkdownText`** for chat + tutor blocks. **2026-04-03 (default depth):** Removed **Beginner / Intermediate / Professional** toggle; fixed **`intermediate`** via **`lib/ai/explanationLevel.ts`** (`DEFAULT_EXPLANATION_LEVEL`, `resolveExplanationLevel`); APIs no longer **400** on missing `explanationLevel`; Zustand **`explanationLevel`** + localStorage hydration removed; **`TheoryInspectorPanel`** drops the level strip; chat input locks only while a **chat** stream is active (`streamingMessageId`). |
| **Score canvas (staff IDs)** | **2026-04:** `extractStaffLabelLayout` in `riffscorePositions.ts`; `RiffScoreEditor` part-name overlays or **Staves (top → bottom)** fallback. |
| **Config** | `frontend/.env.example` (committed); `.env.local` template; `.gitignore` allows `.env.example` while ignoring secrets. |
| **Ops** | Documented `make dev`; **`make dev-clean`** clears ports **8000 / 3000 / 3001** and Next **`.next/dev/lock`** when restarting (see **Work log — 2026-04-03**). |
| **Playback scrub** | `PlaybackScrubOverlay` + `playbackScrub.ts` + `riffscorePlaybackBridge.ts`; **`patch-package`** aligns RiffScore **toolbar Play**, **Space**, **P** with scrub via **`__HF_RIFFSCORE_PLAY_FROM`**; **manual QA** for regressions still advised — see **Playback scrub** subsection below. |
| **Docs & deploy (2026-04-07)** | Root + folder READMEs (two passes: accuracy then visual/onboarding); **docs/README.md** index; **plan.md** reader header; **progress.md** navigation; **[deployment.md](deployment.md)** (Vercel `frontend/` root, engine host, env/CORS); **[node_modules/README.md](../node_modules/README.md)** + root **`.gitignore`** negation; GitHub **rebase** workflow note. |

### Playback scrub — draggable playhead & “Play starts where I dropped” (2026-04)

**End goal (this slice):** In the Sandbox, the user can **drag a vertical playhead** over the RiffScore canvas, **release** to choose where playback should begin, and when they press **Play** (toolbar), **Space**, or **P**, audio starts from that intent. **Product simplification:** on release, the playhead **snaps to the nearest measure beginning** (quant `0` in RiffScore’s timeline) so start position is stable and matches user mental model (“play from this bar”).

**Why it’s hard (root cause):** RiffScore bundles **two playback paths**: (1) **`MusicEditorAPI.play()`** / `pause()` / `stop()` — module-level `lastPlayPosition` + `scheduleTonePlayback`; (2) **internal React `usePlayback`** — `playScore` / `handlePlayToggle` / keyboard **`handlePlayback`** — `playbackPosition` state + `scheduleScorePlayback`. The **toolbar Play** button and **shortcuts** use path (2). HarmonyForge scrub originally only updated path (1), so **Play jumped back** to stale internal state.

**Approach:**

1. **Overlay playhead** — `PlaybackScrubOverlay` on `RiffScoreEditor`: draggable line; **`lineLeftPx`** state (avoid React resetting `left` each render); sync from hidden SVG `[data-testid="playback-cursor"]` only while transport is moving (`playingRef` and/or **frame-to-frame DOM motion**) so **paused** scrub position is not overwritten by a **stale** SVG transform.
2. **Layout → measure** — `playbackScrub.ts`: `buildMeasurePlaybackSpans` from `extractNotePositions`; `contentXToMeasureQuant`; **`contentXToNearestMeasureStart`** for bar snap + `snapContentX`.
3. **Seek after drop** — `seekTo`: `api.play(measureIndex, 0)` then `pause()` if not resuming (arms Tone); `suppressDomSyncRef` during the async gap; **`setPendingRiffScorePlayFrom`** + **`clearRiffScoreInternalPlaybackAnchor`** (custom event) so internal resume state can be cleared.
4. **`patch-package` on `riffscore`** (`patches/riffscore+1.0.0-alpha.9.patch`), **`dist/index.mjs`** + **`dist/index.js`**:
   - **`globalThis.__HF_RIFFSCORE_PLAY_FROM`** `{ measureIndex, quant }` — set from HF on scrub release; **consumed** when starting playback.
   - **`consumeHfRiffScorePendingPlay()`** — read + clear pending; used by **`handlePlayToggle`**, **`handlePlayback`** (**`P`** and plain **`Space`** when not playing). **Unchanged:** `Shift+Space` / `Shift+⌘|Alt+Space` (replay / from start) do **not** consume pending.
   - **`handlePlayToggle` `else` branch** — pending first, then existing `playbackPosition` / `lastPlayPosition` fallback.
   - **`playScore` entry** — assign **`lastPlayPosition`** immediately so API and internal stay aligned.
   - **Position callback** during `scheduleScorePlayback` — mirror **`lastPlayPosition`** on each tick; **stop** / **end** reset `lastPlayPosition` and clear pending where applicable.
   - **`useEffect`** listens for **`riffscore-clear-playback-anchor`** to null internal `playbackPosition` (works with HF event after scrub).
5. **Bridge module** — `frontend/src/lib/music/riffscorePlaybackBridge.ts` — `setPendingRiffScorePlayFrom`; documents toolbar + **Space** + **P**.
6. **CSS** — Native RiffScore playback cursor hidden (`opacity: 0`); user sees HF line only.

**Steps completed (files):**

| Item | Location |
|------|-----------|
| Span + clamp helpers + nearest measure start | `lib/music/playbackScrub.ts`, `playbackScrub.test.ts` |
| Pending play global + types | `lib/music/riffscorePlaybackBridge.ts` |
| Overlay + rAF + drag + seek | `components/score/PlaybackScrubOverlay.tsx` |
| Hide native cursor | `components/score/RiffScoreEditor.tsx` (inline `<style>`) |
| RiffScore fork patch | `patches/riffscore+1.0.0-alpha.9.patch` (includes existing `toolbarPlugins` + playback hooks) |

**Verification:** `cd frontend && npm run test` (`playbackScrub` tests + rest). **Manual:** scrub → toolbar Play; scrub → **Space**; scrub → **P**; pause/resume; stop clears pending.

**Current failure / open issues (actively watch):**

- **User-reported regressions** — Earlier iterations lost visible line, snap-back on scrub, or no follow-audio motion; mitigations shipped (stateful `left`, DOM-motion detection, pending global). If **Play still ignores drop** in a specific browser or focus state, capture: **toolbar vs keyboard**, **single vs multi editor**, and **console** for RiffScore errors.
- **Dual schedulers** — `api.play` vs `playScore` both touch Tone; we rely on **`stopTonePlayback`** before each start. Edge cases (rapid scrub + play, sample load failures) may still glitch; **`/audio/piano/*.mp3` 404** remains a separate **silent playback** risk (see system map).
- **Other play entry points** — Any RiffScore code that calls **`playScore`** without going through **`handlePlayToggle`** or **`handlePlayback`** would **not** consume **`__HF_RIFFSCORE_PLAY_FROM`**; grep upstream if new shortcuts appear.
- **Multi-instance** — One global pending object; **multiple RiffScore roots** on one page would race (not current Sandbox layout).

---

### Context-Aware Theory Inspector — shipped detail (2026-04)

**Objective (product):** Pitch-only transparency: Mode A explains **engine snapshot** (with trace-backed checks where available); Mode B explains **how the live pitch sits** against vertical sonority and neighbors. Relational FACTs cover same-beat stack and prev/next musical moments (SATB slot + additive barline neighbors).

**Files (primary):** `docs/Taxonomy.md`, `frontend/src/lib/ai/taxonomyIndex.ts`, `frontend/src/lib/music/theoryInspectorMode.ts`, `theoryInspectorBaseline.ts`, `theoryInspectorSlots.ts`, **`noteExplainContext.ts`** (`SCORE_DIGEST`, `formatAuthoritativeDurationFact`, `formatScoreDigestForFoundHit`, `describeNotationForTutor`, additive + **`buildMeasureFocusFacts`** full-bar appendix), **`regionExplainContext.ts`** (measure/part FACTs + note id collection), `scoreTypes.ts` (`originalGeneratedPitch`), `riffscoreAdapter.ts`, `useRiffScoreSync.ts`, `scoreUtils.ts` (paste drops provenance), **`useTheoryInspector.ts`** (evidence-first tutor `userMessage`, chat FACT prefix, SATB measure dump, **follow-up `conversationHistory` without duplicate user turn**), `useTheoryInspectorStore.ts` (`InspectorScoreFocus`), `TheoryInspectorPanel.tsx` (**`MarkdownText`** on summary/suggestions/origin/click-meaning), `app/api/theory-inspector/route.ts` (`scoreSelectionContext`), **`lib/ai/prompts.ts`** (`Editor focus`, `SCORE_DIGEST` / FULL BAR rules), `lib/ai/noteInsightAiSplit.ts`, `riffscorePositions.ts` (`extractStaffLabelLayout`), **`components/molecules/ChatBubble.tsx`**, **`components/molecules/MarkdownText.tsx`**, **`components/molecules/SandboxPlaybackBar.tsx`**, `RiffScoreEditor.tsx` (staff labels, measure strip, focus highlights), `ScoreCanvas.tsx`, `app/sandbox/page.tsx` (baseline + stamp + inspector wiring), `vitest.config.ts`, **`noteExplainContext.test.ts`**, `noteInsightAiSplit.test.ts`, **`regionExplainContext.test.ts`**.

**Still thin vs aspirational copy:** Mode A “axiomatic” lines like “resolved the leading tone” are **not** fully supplied by the engine today — `validate-satb-trace` is **violation-oriented**; richer generative rationale remains a **future engine / ADR** item unless we add more client-side heuristics (e.g. chord-tone classification without Roman numerals).

### Work completed (2026-04) — theory sources, engine honesty, tutor voice and tone

This subsection records **everything shipped in this arc** so handover chats stay aligned.

**A. End goal (unchanged)**  
Same as **End Goal** above: full **Upload → Document → Sandbox** flow; additive harmonies; Theory Inspector as transparent tutor; optional LLM.

**B. Approach taken**

1. **Ground claims in real sources** — Used **NotebookLM** on the **HF LitReview** notebook to sanity-check paraphrases for Fux (*Gradus*, Mann ed.), Aldwell & Schachter (*Harmony and Voice Leading*), Caplin (*Classical Form*), and **Open Music Theory** (Gotham et al.).
2. **Document what code actually does** — Added a **source spine and engine mapping** in `Taxonomy.md`: hard constraints ↔ `engine/constraints.ts` / `validate-satb-trace`; motion heuristic ↔ `engine/solver.ts` (L1 MIDI sum = **parsimony proxy**, not species counterpoint); Caplin vocabulary ↔ honesty (primary `engine/` path does **not** run full segmentation); chamber-only `planStructuralHierarchy` labeled a **heuristic sketch** in `miscellaneous/chamber-music-fullstack/backend/src/harmonize-core.ts`.
3. **Sync RAG strings** — `frontend/src/lib/ai/taxonomyIndex.ts` classical section mirrors the spine; violation entries cite **A&S / OMT / engine files** for range and spacing.
4. **LLM behavior** — `frontend/src/lib/ai/prompts.ts`: shared **`CITATION_AND_BREVITY`**; Auditor/Tutor/Stylist tuned for **brief source tags** when stating rules, **plain language first**, **no citation stacking**, default **3–8 sentences** for typical replies; note modes updated; Caplin guardrails retained.
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
- [x] `make test` + `frontend && npm run test` passed after engine/taxonomy/prompt edits  
- [x] **Theory Inspector UX + staff labels (2026-04):** panel order: **Tutor summary** then **Ideas to try next** (after verifiable export); **Ideas** + tutor stream require **what + why** per suggestion; **What this click means** hammers **why** the axiomatic engine placed the original harmony pitch (`buildAxiomaticEngineWhyParagraph` / additive copy); plain-language blocks, `<<<SUGGESTIONS>>>` split (`noteInsightAiSplit.ts`, `NoteInsight.aiSuggestions`), `extractStaffLabelLayout` + `RiffScoreEditor` labels, `useLayoutEffect` autoscroll — see **Theory Inspector UX (2026-04)** above; docs re-synced  
- [x] **Theory Inspector free-form chat (2026-04-03):** persistent composer, empty default messages, no auto chips after chat/audit, `streamingMessageId` + history fix, optional note context on `sendMessage`; `frontend` tests + build pass  
- [x] **Docs sync (2026-04-03):** `@progress.md` work log + table row; `@plan.md` status blurb + §3 checkbox; `@docs/context/system-map.md` banner + Theory Inspector row + data-flow §7  
- [x] **Docs sync (2026-04-04):** `@progress.md` — **Work log — Theory Inspector: editor focus for chat + measure/part (2026-04-04)**, consolidated table + Context-Aware file list + approach §6 + current-failures item 11; `@plan.md` status blurb + §3 checkbox + verification test name; `@docs/context/system-map.md` banner + Theory Inspector / RiffScore rows + data-flow §7  
- [x] **Theory Inspector LLM grounding + UI contrast (2026-04-03):** `SCORE_DIGEST`, `AUTHORITATIVE NOTATION`, `FULL BAR` measure dump; evidence-first `userMessage` on note stream; chat prepends FACT block; SATB parity; `prompts.ts` + `NOTE_EXPLAIN_TUTOR_BRIEF`; `ChatBubble` / `SandboxPlaybackBar` dark-theme text tokens; vitest updates; **Work log** + **current failure #12** in `@progress.md`  
- [x] **Theory Inspector follow-up + panels + markdown (2026-04-04):** `sendMessage` conversationHistory snapshot before user message; shortened `currentPitchGuideExplanation` + panel rename; `react-markdown` + `MarkdownText.tsx`; `ChatBubble` + `TheoryInspectorPanel` wiring; **`@progress.md`** work log + failure #12 update; **`@plan.md`** + **`@docs/context/system-map.md`** sync  
- [x] **Theory Inspector default explanation depth (2026-04-03):** removed Beginner/Intermediate/Professional toggle; `DEFAULT_EXPLANATION_LEVEL` + `resolveExplanationLevel`; API + client + store + panel; Vitest + `tsc` pass; **`@progress.md`** work log; **`@plan.md`** + **`@docs/context/system-map.md`** sync  

**D. Learnings (compact)**

- **OMT** = primary **pedagogical organization** for RAG; **A&S** = anchor for **hard** SATB rules in code; **Fux** = lineage for **smooth motion** (solver is only a proxy); **Caplin** = vocabulary only when facts support it.  
- Tutor must **teach without flooding** — one source per theoretical claim in short answers.
- Trust comes from **accuracy and limits**, not cheerleading—prompts explicitly forbid sycophancy.

### Theory Inspector UX — average-user clarity, suggestions, staff labels (2026-04)

**End goal (this slice):** Non-expert musicians can use the note-level Theory Inspector without jargon-first layout: deterministic blocks read in plain language, **Tutor summary** synthesizes after the facts, then **optional “Ideas to try next” bullets** from the tutor, and the **score canvas shows which staff is which part** (instrument / input melody).

**Approach:**

1. **Panel order** — After “This note”, show **What the tool first wrote** (origin snapshot), **What this click means** (plain read + **why** HarmonyForge’s axiomatic pass chose the original pitch), **Verifiable score export** (monospace FACT block), **Tutor summary** (LLM wrap-up), then **Ideas to try next** (parsed suggestions; each bullet should state what to try and why). *(Ideas follow the summary so the wrap-up reads before concrete next steps.)*
2. **Single-stream LLM split** — Tutor user brief requires a line `<<<SUGGESTIONS>>>` then bullets; `splitNoteInsightAiContent` in `noteInsightAiSplit.ts` splits streamed/JSON text into `NoteInsight.aiExplanation` + `NoteInsight.aiSuggestions`. `prompts.ts` allows that bullet block after the delimiter.
3. **Staff ↔ part** — RiffScore `Staff` has no label in types; **`extractStaffLabelLayout`** (`riffscorePositions.ts`) measures `g.staff` rects vs the editor container; **`RiffScoreEditor`** draws left-edge **part name** overlays (with **Input** badge on first staff when multiple parts) or a **“Staves (top → bottom)”** fallback strip if geometry doesn’t match `score.parts.length`.
4. **React 19 / Compiler quirk** — `useEffect(..., [messages, noteInsight, …])` triggered **“The final argument passed to useEffect changed size between renders”** under **Next 16.1.6 + Turbopack + React Compiler** (dependency array shape differed across renders—e.g. compiler treating `messages` as expanded deps). **Mitigation:** autoscroll uses **`useLayoutEffect` with no dependency array** (scroll after every paint—cheap for this panel). Revisit if we add a stable single-string digest + one dep without compiler rewrite.

**Steps completed (files):**

| Item | Location |
|------|-----------|
| Panel copy + order + suggestions cards | `frontend/src/components/organisms/TheoryInspectorPanel.tsx` |
| `hasApiKey` for offline copy | same (reads `useTheoryInspectorStore`) |
| `aiSuggestions` on model | `useTheoryInspectorStore.ts` |
| Stream/json split | `useTheoryInspector.ts` + `NOTE_EXPLAIN_TUTOR_BRIEF` |
| Split helper + tests | `lib/ai/noteInsightAiSplit.ts`, `noteInsightAiSplit.test.ts` |
| Tutor rule for delimiter section | `lib/ai/prompts.ts` |
| Staff geometry | `lib/music/riffscorePositions.ts` — `extractStaffLabelLayout` |
| Overlays + fallback strip | `components/score/RiffScoreEditor.tsx` |

**Verification:** `cd frontend && npm run test` (includes `noteInsightAiSplit`); `npm run build` passes. **`npm run lint`** still reports broader repo debt (including pre-existing `RiffScoreEditor` `useMemo` / React Compiler warnings)—not introduced solely by this slice.

**Current status / failure we addressed:** Console error from **changing `useEffect` dependency array length** under Turbopack—**workaround shipped** (`useLayoutEffect` without deps). **Still open:** prettier scroll triggers without tripping compiler; full-project lint green; optional **scroll/resize** re-measure if staff labels drift inside nested scroll containers (only add if QA shows drift).

---

### Multi-format intake & PDF → Document preview (2026-04-02)

**End goal (this slice):** Treat **PDF (and MXL/MIDI)** like **raw MusicXML** on the Document step: the user sees a real melody preview (RiffScore / `parseMusicXML`) before “Generate Harmonies,” not an empty staff or “preview after generate” placeholder.

**Approach:**

1. **Engine — unified intake** — `engine/parsers/fileIntake.ts` already routes ZIP sniff (MXL), MusicXML, MIDI, and PDF (pdfalto → embedded MusicXML in ALTO text → `pdftoppm` page 1 → **oemer** OMR). Audiveris removed.
2. **Engine — preview serialization** — `parsedScoreToPartwiseMelodyMusicXML()` in `engine/satbToMusicXML.ts` builds single-part **score-partwise** MusicXML (no DTD) from `ParsedScore` for client parsing.
3. **Engine — API** — `POST /api/to-preview-musicxml` (multipart `file`): `intakeFileToParsedScore(..., { allowPdfOm: true })` → preview XML. Same intake as `generate-from-file` for melody extraction.
4. **Engine — host/tooling robustness** — `resolvePdfAltoBin()` walks up from `dirname(process.argv[1])` and `cwd` to find `pdfalto/pdfalto` (not only repo-root `cwd`). On **darwin**, `pdftoppm` / `oemer` resolve common paths (`/opt/homebrew/bin`, `/usr/local/bin`, `~/.local/bin`, Python.framework `Versions/*/bin/oemer`). **`package.json` `dev:backend`** prefixes `PATH` with Homebrew so GUI-launched Node finds Poppler. **`make pdfalto`** / submodule init documented in Makefile.
5. **Frontend — Playground** — For `.pdf`, `.mxl`, `.mid`, `.midi`: show parsing overlay → `fetch(NEXT_PUBLIC_API_URL/api/to-preview-musicxml)` → `setPreviewMusicXML(xml)` in Zustand → `/document`. `.xml`/`.musicxml` skip preview API (FileReader on Document). Errors shown in a **dismissible in-page panel** (not `alert`), including full engine **Details** lines.
6. **Frontend — Document** — `useUploadStore.previewMusicXML` for non-XML extensions; XML/MusicXML still via FileReader; same `extractMusicXMLMetadata` + `parseMusicXML` as a direct XML upload.
7. **Frontend — store** — `setFile` clears `previewMusicXML` to avoid stale previews.
8. **Ops** — `make dev-clean` kills ports 8000/3000/3001 and removes Next `.next/dev/lock`. **`requirements.txt`** documents Python **3.10–3.12** for oemer/onnxruntime, first-run **HTTPS** checkpoint download, manual checkpoints ([BreezeWhite/oemer releases — checkpoints](https://github.com/BreezeWhite/oemer/releases/tag/checkpoints)), **`OEMER_BIN`**.
9. **Diagnostics** — On **oemer** non-zero exit, engine appends a **truncated stderr/stdout excerpt** to API error details; OMR default timeout raised to **15 minutes** for slow first-time downloads.

**Steps completed (checklist):**

- [x] `engine/parsers/fileIntake.ts` + tests (mocked `spawnSync`); PDF pipeline wiring; remove Audiveris narrative
- [x] `parsedScoreToPartwiseMelodyMusicXML` + `POST /api/to-preview-musicxml` in `engine/server.ts`
- [x] `useUploadStore.previewMusicXML` / `setPreviewMusicXML`; `setFile` clears preview
- [x] `frontend/src/app/page.tsx` — async preview fetch before navigate for pdf/mxl/mid/midi
- [x] `frontend/src/app/document/page.tsx` — consume `storePreviewXml` + parse like XML
- [x] Binary resolution + `PATH` in `dev:backend`; `requirements.txt` Python/OMR notes
- [x] In-page upload error UI; oemer stderr excerpt in failure payload; longer OMR timeout

**Unresolved — PDF → MusicXML (OMR) feature:**

- **Product status:** Wiring for “PDF previews like XML” is **in place**, but **reliable PDF→melody conversion is not** for typical scores and dev machines.
- **Observed failure chain:** pdfalto often finds **no MusicXML embedded** in ALTO text (normal for engraved/scanned PDFs). Fallback **oemer** then must run; **oemer** ships **without ONNX checkpoints** and tries to **download** them on first run. Failures seen include **HTTPS/download errors** (urllib) and **Python 3.14** + **onnxruntime** mismatch (wheels/targets aimed at 3.10–3.12).
- **Mitigations documented / partial:** Use a **Python 3.11/3.12 venv**, `make install`, set **`OEMER_BIN`** to that venv’s `oemer`; allow **network** on first run; or **install checkpoints manually** from the oemer checkpoint release; keep **`PDFALTO_BIN` / `POPPLER_PDFTOPPM` / `OEMER_BIN`** explicit if PATH is stripped.
- **Still open:** No in-repo guarantee that OMR succeeds; no alternate OMR backend; multi-page PDF still **page 1 only**. Treat **PDF→XML** as **unresolved / environment-dependent** until oemer (or replacement) is validated in CI or docs with a reproducible venv recipe.

---

### Work log — 2026-04-03 (recent sessions)

**End goal (unchanged for this slice):** Same as **End Goal** at top of this file — full **Upload → Document → Sandbox** with additive harmonies, RiffScore editing, and Theory Inspector as a transparent tutor.

**Approach (this slice):**

1. **Run the full stack reliably** — Use repo **`Makefile`** targets only: `make dev` runs engine (`tsx watch engine/server.ts`, port **8000**) and Next (`frontend`, port **3000**). If **EADDRINUSE** or Next **`.next/dev/lock`** errors appear, run **`make dev-clean`** first (kills listeners on 8000/3000/3001 and removes the lock), then `make dev`.
2. **Theory Inspector = note explain + user-driven chat** — The panel already had note-click FACTs and streamed **Tutor summary** / **Ideas to try next**; we **surfaced the existing Zustand chat** in the same scroll area with a **persistent composer** so users type their own questions (no demo thread, no placeholder suggestion text in the input, no automatic quick-reply chip rows after each assistant reply or after SATB audit).
3. **Ground free chat when a note is selected** — `sendMessage` originally passed **`violationContext`** + **`theoryInspectorNoteMode`**; **2026-04-04** extended this to **`scoreSelectionContext`** from unified **`inspectorScoreFocus`** and fixed the **Tutor prompt** so focus facts are actually read (see **Work log — editor focus**, below).
4. **Chat / note stream UX** — **`streamingMessageId`** is set only for the **free-form chat** placeholder message; note-insight tutor streaming clears it, so the bottom input stays usable while a note summary generates, and the pulsing “typing” dots appear only for **chat** streams.

**Steps completed (2026-04-03):**

| Item | Detail |
|------|--------|
| **TheoryInspectorPanel** | Removed demo **`DEFAULT_MESSAGES`** (default `messages` = `[]`). Note-detail cards when a note is selected; **`messages.map`** renders audit/violation/chat history below; **always-visible** input row with **empty `placeholder`**, `aria-label="Theory Inspector message"`; typing indicator when **`isStreaming && streamingMessageId != null`**. |
| **Sandbox** | Wires **`messages`**, **`inputValue`**, **`setInputValue`**, **`onSend`**, **`onChipClick(chip, score)`**, **`streamingMessageId`**. |
| **useTheoryInspector** | Stops injecting **quick-reply `chips` messages** after streamed/JSON chat responses and after **`runAudit`** violations; builds **conversation history after user message, before empty AI placeholder** (avoids sending the in-flight empty bubble as history); exports **`streamingMessageId`**. |
| **Verification** | `cd frontend && npm run test` and **`npm run build`** pass after these edits. |
| **GitHub issues (process)** | Creating/updating issues from the agent shell was **not possible** without `gh` or `GITHUB_TOKEN` and with a **private** repo (API 404 unauthenticated). A **PDF → MusicXML** issue spec was drafted for manual/MCP creation; tracking remains **`plan.md` → 1.9m** until CI/venv guarantees land. |

**Current failure we are still working on (unchanged as primary product risk):**

- **PDF → MusicXML / oemer (1.9m)** — Wiring for preview and generate is in place; **reliable OMR** is still blocked by **environment** (Python 3.10–12 venv, ONNX checkpoints, `OEMER_BIN`, network on first run) and **quality** (page-1-only, no alternate OMR in repo). See **Multi-format intake & PDF → Document preview** and **`plan.md` 1.9m**.

---

### Work log — Theory Inspector: editor focus for chat + measure/part (2026-04-04)

**End goal (this slice):** When the user uses the Theory Inspector **chat**, the LLM (when enabled) should **see the same score focus** as the user: a **clicked note**, a **whole measure**, or a **whole part**. The canvas should make measure and part focus **obvious** (selection + **green highlight** over all notes in that region), and the panel should show a short **This measure** / **This part** summary with deterministic FACT lines.

**Approach:**

1. **Fix the real chat bug** — `sendMessage` already sent note evidence as `violationContext`, but **`buildTutorPrompt` did not include it** in the system prompt (only Stylist paths used it). Add a shared **`editorFocusPromptBlock`** in `prompts.ts` (via `resolveScoreFocus` from `scoreSelectionContext` / `violationContext`) and append it to **Auditor**, **Tutor**, and **Stylist** prompts (including structured stylist). **`POST /api/theory-inspector`** accepts optional **`scoreSelectionContext`** (merged into prompt context).
2. **Unify focus state** — Zustand **`InspectorScoreFocus`**: `{ kind: 'note', insight }` | `{ kind: 'measure', measureIndex, evidenceLines, noteIds }` | `{ kind: 'part', partId, partName, evidenceLines, noteIds }`. **`setInspectorScoreFocus`** keeps **`selectedNoteInsight`** in sync for note focus. **`setSelectedNoteInsight(null)`** clears focus only when it was a **note**, so clearing note insight does not wipe measure/part focus.
3. **Deterministic region FACTs** — **`regionExplainContext.ts`**: `buildMeasureFocusFacts`, `buildPartFocusFacts` (capped strings + truncation lines); **`regionExplainContext.test.ts`** (vitest).
4. **RiffScore UI** — When inspector is open: **Bars** strip (measure index buttons) calls `api.select(m+1,0,0)` + `selectAll('measure')`; **staff labels** (overlay + fallback list) call `select(1, staffIndex, 0)` + `selectAll('staff')`. **`api.on('selection')`**: if multiple selected notes share one **measure** across **multiple staves** → measure focus; same **staff** across **multiple measures** → part focus. **`focusHighlightNoteIds`** renders **green** overlays distinct from red/blue **issueHighlights**.
5. **Sandbox / panel** — `sandbox/page.tsx` builds focus + highlight ids; **`ScoreCanvas`** forwards props; **`TheoryInspectorPanel`** shows region card when `noteInsight` is null and focus is measure/part.

**Steps completed (checklist):**

- [x] `prompts.ts` — `editorFocusPromptBlock` + `resolveScoreFocus`; Tutor/Auditor/Stylist (+ structured) updated  
- [x] `app/api/theory-inspector/route.ts` — `scoreSelectionContext` on request body; pass into `buildSystemPrompt`  
- [x] `useTheoryInspector.ts` — `sendMessage` builds context from `inspectorScoreFocus`; POST **`scoreSelectionContext`** + **`theoryInspectorNoteMode`** (note only); note stream uses `scoreSelectionContext`; hook exports **`setInspectorScoreFocus`** / **`inspectorScoreFocus`**  
- [x] `useTheoryInspectorStore.ts` — `InspectorScoreFocus`, `inspectorScoreFocus`, `setInspectorScoreFocus`; safe **`setSelectedNoteInsight(null)`**  
- [x] `regionExplainContext.ts` + `regionExplainContext.test.ts`  
- [x] `RiffScoreEditor.tsx`, `ScoreCanvas.tsx`, `sandbox/page.tsx`, `TheoryInspectorPanel.tsx`  
- [x] `cd frontend && npm run test` + **`npm run build`** pass; **`make test`** (engine) pass  

**Verification:** Vitest includes **`regionExplainContext`**; production Next build succeeds.

**Residual / not a blocker for this slice:** Full-repo **`npm run lint`** still fails on **legacy paths** and **React Compiler** `preserve-manual-memoization` warnings on **`RiffScoreEditor`** `useMemo` (largely pre-existing). Measure strip sits **`top: 48px`** to clear the RiffScore toolbar—if layout shifts, QA may need a tweak. Optional future: prefix the **live user message** with focus text (not stored in history) if models still under-attend system context.

**Current failure we are still working on (unchanged):** **PDF → MusicXML (oemer / 1.9m)** remains the **primary product risk**; this inspector slice does not address OMR. See **Multi-format intake** and **`plan.md` 1.9m**.

---

### Work log — Theory Inspector: LLM “sees” the score (text export) + UI contrast (2026-04-03)

**End goal (this slice):** The Theory Inspector tutor must answer from **live notation**—including **rhythm and duration** (e.g. half vs quarter)—without telling the user that information was “not shared.” The product does **not** send rendered score images to the LLM; **grounding** is **deterministic text** derived from `EditableScore` / RiffScore sync. Separately, **dark theme** chat and playback UI must keep **readable contrast**.

**Approach:**

1. **Treat exports as the model’s “view” of the score** — Build explicit, redundant lines: **`SCORE_DIGEST`** (one line: bar, beat, pitch/rest, human duration, quarter-note span, meter), **`FACT: AUTHORITATIVE NOTATION`** (clicked note duration spelled out), existing **`FACT:`** vertical snapshot lines, and a **`FULL BAR`** appendix from **`buildMeasureFocusFacts`** (`regionExplainContext.ts`) so every staff’s events in that measure appear as compact tokens (e.g. pitch + duration code).
2. **Message ordering** — For **note-click** streaming, **`userMessage`** is now **`evidence` first**, then `---` and **`**Response rules**`** (`NOTE_EXPLAIN_TUTOR_BRIEF`). Previously the long instruction block preceded facts; models often **under-attended** duration buried after instructions.
3. **Follow-up chat** — **`sendMessage`** prepends the full **`scoreSelectionContext`** again under a header (**exported notation for this turn**) **before** the user’s sentence, so the latest user turn still carries the score block (not only the system prompt).
4. **SATB path parity** — Four-part scores get **`formatScoreDigestForFoundHit`**, **`clickedAuthoritative`**, rhythm FACTs, slot FACTs, plus the same **`FULL BAR`** measure dump as additive/fallback paths.
5. **Prompt contract** — **`prompts.ts`** **`editorFocusPromptBlock`** and Tutor rules state that **`SCORE_DIGEST` / AUTHORITATIVE / FULL BAR** mean notation **was** supplied; **`NOTE_EXPLAIN_TUTOR_BRIEF`** tells the model never to claim missing duration when those lines exist.
6. **Full notation framing (not pitch-first)** — Prior “pitch-only / pitch-first” wording was removed; tutor copy and `NoteInsight` store comments describe a **unified notation snapshot** (pitch + rhythm + voicing).
7. **UI contrast** — **`ChatBubble.tsx`** AI variant: `var(--hf-text-primary)`, `var(--hf-detail)`, stronger surface tint (aligned with user/system bubbles). **`SandboxPlaybackBar.tsx`** pagination: `var(--hf-text-primary)` instead of `--text-on-light` on dark `hf-bg`.

**Steps completed (files):**

| Item | Location |
|------|-----------|
| `SCORE_DIGEST`, `formatScoreDigestLine`, `formatScoreDigestForFoundHit` | `frontend/src/lib/music/noteExplainContext.ts` |
| `FULL BAR` append via `buildMeasureFocusFacts` | `noteExplainContext.ts` (additive path); `useTheoryInspector.ts` (SATB evidence) |
| `AUTHORITATIVE NOTATION` line | `formatAuthoritativeDurationFact` in `noteExplainContext.ts`; SATB + additive |
| Stream `userMessage` order + follow-up prefix | `useTheoryInspector.ts` (`streamTutorNoteInsight`, `sendMessage`) |
| Tutor / editor-focus prompt rules | `frontend/src/lib/ai/prompts.ts` |
| `NOTE_EXPLAIN_TUTOR_BRIEF` | `useTheoryInspector.ts` |
| `NoteInsight` Block B comment | `useTheoryInspectorStore.ts` |
| AI bubble + playback bar colors | `ChatBubble.tsx`, `SandboxPlaybackBar.tsx` |
| Vitest | `noteExplainContext.test.ts` (`formatScoreDigestLine`, additive expectations) |

**Verification:** `cd frontend && npm run test` (Vitest) passes after these edits.

**Current failure / risk we are working on:** Some LLM replies may **still** ignore embedded FACT lines and claim duration or notation was not provided—**observed in the wild** even after the above. **Mitigations shipped:** redundancy (`SCORE_DIGEST` + AUTHORITATIVE + FULL BAR), evidence-before-instructions, user-message repeat on follow-ups. **Additional mitigation (2026-04-04):** **`sendMessage`** no longer puts the **current** user turn into **`conversationHistory`** before the API call—previously the model saw **two consecutive `user` messages** (plain question, then full notation block), which primed “I can’t see the notation” hedging; see **Work log — Tutor follow-up + panels + markdown (2026-04-04)**. **Still open / next levers:** (a) **Refresh `inspectorScoreFocus` evidence** when the score changes after click (stale FACTs until re-click); (b) **server-side logging** of prompt lengths / truncated bodies if a gateway strips input; (c) **multimodal** (staff screenshot + vision model) only if product explicitly chooses image-based grounding; (d) regression tests that mock API payload shape (optional).

---

### Work log — Tutor follow-up + panels + markdown (2026-04-04)

**End goal (this slice):** The Theory Inspector tutor should **use the exported notation** the app already sends (structured text, not staff images) when the user asks follow-ups such as “Is this a half note?”—without claiming it cannot “see” the score. The panel should make **deterministic** sections **obviously useful** to musicians (not “facts passed to the tutor” jargon). Chat and tutor summary text should **render markdown** (`**bold**`, lists, inline code) instead of showing raw asterisks.

**Approach:**

1. **Fix API message shape for follow-ups** — In `useTheoryInspector.ts` **`sendMessage`**, build **`conversationHistory`** from a **Zustand snapshot taken before** `addMessage(userMsg)`. The previous bug: the new user message was already in `store.messages`, so history ended with **`user: "plain question"`** and the request then appended **`user: "...exported notation...\nUser: question"`** → two consecutive user turns, first without FACTs → models hedged (“I can’t see the notation”).
2. **De-duplicate deterministic UI** — **`currentPitchGuideExplanation`** (melody, SATB, additive fallback) shortened to **plain English** using **`describeNotationForTutor`**; full **`evidenceLines`** stay in one monospace block only.
3. **Rename panels** — **“What this click means”** + melody/harmony subtitles; **“Verifiable score export”** + subtitle about checking rhythm, meter, and each staff (`TheoryInspectorPanel.tsx`).
4. **Markdown rendering** — Add **`react-markdown`**; **`MarkdownText.tsx`** (safe subset: `p`, `strong`, `em`, `code`, lists); wire **`ChatBubble`** user/ai bodies; **Tutor summary**, **Ideas to try next**, **What the tool first wrote**, **What this click means**.

**Steps completed (files):**

| Item | Location |
|------|-----------|
| History snapshot before user bubble | `frontend/src/hooks/useTheoryInspector.ts` — `sendMessage` |
| Short prose + `describeNotationForTutor` | same — `explainNotePitch` / `buildFallbackNoteInsight` |
| Panel titles + subtitles | `TheoryInspectorPanel.tsx` |
| `react-markdown` + `MarkdownText` | `package.json` / `package-lock.json`, `MarkdownText.tsx` |
| Chat bubbles | `ChatBubble.tsx` |

**Verification:** `make test` (engine Jest); `cd frontend && npm run test` + `npm run build`; ESLint on touched files clean. **`make lint-frontend`** still fails on **pre-existing** repo debt (`.claude/helpers`, `RiffScoreEditor` React Compiler / `useMemo`, etc.)—not introduced by this slice.

**Current failure / what we are still working on (post-slice):**

- **Primary product risk unchanged:** **PDF → MusicXML / oemer (1.9m)** — see **Multi-format intake** and **`plan.md`**.  
- **Tutor quality (residual):** After the history fix, follow-ups should **improve**; still watch for **stale `inspectorScoreFocus`** after score edits, occasional **model ignore** of FACT lines, and **full-repo lint** not green.  
- **Optional next implementation:** Recompute evidence from **live `EditableScore`** on each send (requires passing **score** into `sendMessage` or a store)—not done in this slice.

---

### Work log — Theory Inspector: default explanation depth (no level toggle) (2026-04-03)

This section records the **explanation-level removal** slice so handovers stay aligned with code and product intent.

#### End goal (this slice)

- **Product:** Theory Inspector should **not** force users to pick **Beginner / Intermediate / Professional** before chat, violation actions, structured suggestions, or the note **Tutor summary**.
- **Engineering:** One **consistent** audience instruction in LLM prompts (**`intermediate`**-style depth), with **no** client-side null state or localStorage key for a retired toggle.
- **API contract:** Inspector routes remain backward-compatible: optional `explanationLevel` body field; **invalid or omitted** values **default** server-side instead of returning **400** when `OPENAI_API_KEY` is set.

#### Approach

1. **Single default constant** — `frontend/src/lib/ai/explanationLevel.ts`: `DEFAULT_EXPLANATION_LEVEL = "intermediate"`; `resolveExplanationLevel(unknown)` returns a valid level or the default; `isExplanationLevel` unchanged for validation; removed **`EXPLANATION_LEVELS`** UI list, **`EXPLANATION_LEVEL_STORAGE_KEY`**, and **`readStoredExplanationLevel`** (no persisted user choice).
2. **Server** — `POST /api/theory-inspector` and `POST /api/theory-inspector/suggest`: after auth/intake checks, **`explanationLevel = resolveExplanationLevel(body.explanationLevel)`**; pass resolved value into **`buildSystemPrompt`** / **`buildStylistStructuredPrompt`** (prompts still branch on level string via `appendExplanationLevel`).
3. **Client** — `useTheoryInspector.ts`: import **`DEFAULT_EXPLANATION_LEVEL`**; remove gates that blocked **`sendMessage`**, **`requestSuggestion`**, and **`streamTutorNoteInsight`** when `hasApiKey && !explanationLevel`; always include **`explanationLevel: DEFAULT_EXPLANATION_LEVEL`** in JSON bodies when the live path needs it (chat with key, suggest, note stream).
4. **Zustand** — `useTheoryInspectorStore.ts`: delete **`explanationLevel`**, **`setExplanationLevel`**, **`hydrateExplanationLevelFromStorage`**; drop re-export of **`ExplanationLevel`** from the store.
5. **UI** — `TheoryInspectorPanel.tsx`: remove the entire **explanation depth** strip (helper text + three buttons); remove **`chatLlmBlocked`** tied to missing level; **`ViolationCard`** / **`QuickReplyChips`** no longer receive **disable** solely for level; composer **placeholder** / **disabled** use **`chatInputLocked = isStreaming && streamingMessageId != null`** (chat typing only). Tutor summary / Ideas blocks no longer show “choose level above” copy.
6. **Docs / hygiene** — `ViolationCard.tsx` prop comment generalized (**disableLlmActions** is not “level not chosen” anymore).

#### Steps completed (files)

| Item | Location |
|------|-----------|
| Default + resolver + storage cleanup | `frontend/src/lib/ai/explanationLevel.ts` |
| Store: remove level state | `frontend/src/store/useTheoryInspectorStore.ts` |
| Hooks: gates removed; default in POST bodies | `frontend/src/hooks/useTheoryInspector.ts` |
| Panel: strip removed; input lock semantics | `frontend/src/components/organisms/TheoryInspectorPanel.tsx` |
| API defaulting | `frontend/src/app/api/theory-inspector/route.ts`, `.../suggest/route.ts` |
| Molecule comment | `frontend/src/components/molecules/ViolationCard.tsx` |

#### Verification

- `cd frontend && npm run test` — **Vitest** (30 tests) **passed** after the change.
- `npx tsc --noEmit` in **`frontend/`** — **passed**.
- **`npm run lint`** — **not** green for the **whole** redesign tree (**pre-existing** debt: **RiffScoreEditor**, **StudySessionProvider**, **`.claude/helpers`**, etc.); this slice did not target lint cleanup.

#### Current failure / what we are still working on (post-slice)

**This slice did not resolve the primary product or tooling failures.** Active work remains:

1. **PDF → MusicXML (oemer / `plan.md` 1.9m)** — Still the **main user-visible risk** for non-XML uploads; see **Multi-format intake** and **Current failures** below.
2. **`make lint-frontend` / full ESLint** — Still **red** on unrelated files; explanation-level removal is **not** the blocker.
3. **Residual tutor behavior** — **FACT-line** grounding variance and **stale `inspectorScoreFocus`** after score edits remain (**Current failures** item **12**).
4. **RiffScore `/audio/piano/*.mp3` 404** — Playback / sampler silence risk unchanged.

If a **new** regression appears (e.g. inspector **400**s from older clients omitting `explanationLevel`), **`resolveExplanationLevel`** should prevent it; file an issue with request body + route if not.

---

### Current failures / work in progress

**Primary pain (user-visible):**

1. **PDF → MusicXML (unresolved):** Preview and generate both depend on **oemer** when pdfalto finds no embedded XML. **Checkpoint download + Python version + onnx** often break; see **Multi-format intake & PDF → Document preview** above. Not fixed — **environment and OMR quality** remain the blocker.

2. **RiffScore playback assets:** `GET /audio/piano/*.mp3` **404** in dev — built-in piano playback may be silent until samples are hosted under the Next app.

3. **LLM availability:** Without `OPENAI_API_KEY` (and dev server restart), Theory Inspector uses **taxonomy fallback** only; full **cited, concise, non-sycophantic** tutor behavior (`CITATION_AND_BREVITY` + `HONESTY_NO_SYCOPHANCY`) requires the key.

**Secondary / technical debt:**

4. **Monorepo / Next warning:** Turbopack **multiple lockfiles** (repo root vs `frontend/`); resolve via `turbopack.root` or lockfile consolidation.

5. **Doc drift (legacy):** Older sections below may still read OSMD/VexFlow-first; **RiffScore-first** is current for editing.

6. **Audit vs note explain on large scores:** `runAudit` uses **`scoreToAuditedSlots` without `requireExactlyFourParts`** — 5+ staves may audit a **four-part slice** while note explain lists **all** staves. Needs engine/API design.

7. **Mode A narrative depth:** “Why this exact pitch” beyond violation trace still thin without **solver metadata** or richer client-side analysis.

8. **Optional engine stretch (not done):** Fux-informed **motion penalties** (contrary motion, etc.) beyond L1 sum — deferred; comments document the gap.

9. **Theory Inspector panel scroll:** **`useLayoutEffect` runs every render** by design (React Compiler / `useEffect` deps array size bug). Acceptable for now; refine if perf or a compiler-safe single-dep pattern is validated.

10. **Staff labels:** If RiffScore DOM or scroll containers change, **`extractStaffLabelLayout`** may fail → fallback list only; watch QA on multi-staff scores.

11. **ESLint / React Compiler vs RiffScoreEditor:** Full `npm run lint` may still flag **`RiffScoreEditor`** `useMemo` / **`react-hooks/preserve-manual-memoization`**; treat as **technical debt** unless CI starts gating on it.

12. **Theory Inspector LLM vs text export (2026-04-03, updated 2026-04-04):** Tutor is grounded on **deterministic strings**, not rendered notation. Despite **`SCORE_DIGEST`**, **`AUTHORITATIVE NOTATION`**, **`FULL BAR`**, and message-order fixes, models may **still** hallucinate that rhythm was “not mentioned.” **2026-04-04:** **Duplicate user-turn bug fixed** in **`sendMessage`** (`conversationHistory` snapshot **before** adding the new user bubble)—reduces back-to-back plain-then-rich `user` messages to the API. **Residual risk:** model variance, **`HONESTY_NO_SYCOPHANCY`** “thin context” phrasing, or stale focus if the score edits after click. Next steps remain in **Work log — LLM “sees” the score** + **Work log — Tutor follow-up + panels + markdown** below.

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

**Docs / ops (2026-04-07):** Onboarding and deploy guidance are now in-repo (README set + **[deployment.md](deployment.md)**). **Next operational step** for production is to **execute** that playbook (backend URL → Vercel env → `CORS_ORIGIN`), not more prose. If `node_modules/` was ever fully tracked, run **`git rm -r --cached node_modules`** once, then **`git add node_modules/README.md .gitignore`** and commit.

**Active work / blockers:**
1. **PDF → MusicXML (unresolved OMR)** — Stabilize **oemer** (venv Python 3.11/3.12, checkpoints, `OEMER_BIN`) or choose an alternate path; see **Multi-format intake & PDF → Document preview** and **`requirements.txt`**. Preview/generate wiring exists; **melody extraction from arbitrary PDF** does not yet meet “it just works.”
2. **RiffScore sample URLs (404)** — wire or proxy `/audio/piano/*.mp3` (or disable sampler UI) so built-in playback matches user expectations.
3. **OpenAI in dev** — ensure `OPENAI_API_KEY` (and optional `OPENAI_MODEL`) live in `frontend/.env.local` and restart `make dev`; verify `GET /api/theory-inspector` → `hasApiKey: true`.
4. **Turbopack lockfile warning** — align Next workspace root (`turbopack.root` or single lockfile strategy).
5. **Tutor follow-up quality (residual, 2026-04-04)** — **History duplicate-user bug fixed**; manual QA on melody “half note?” follow-ups; optional **live-score evidence refresh** on send still not implemented. **`make lint-frontend`** remains red on legacy paths—use ESLint on touched files or accept debt until cleanup pass.
6. **Idea actions (`<<<IDEA_ACTIONS>>>`) — residual (2026-04-06)** — **Apply path fixed** for common cases (verbatim `NOTE_ID` + name/beat fallback). Still watch: **stale tutor replies** (re-click note after deploy), **ambiguous part names** in `summary`, **off-beat suggestions**, and **model omitting** `NOTE_IDS` despite prompt. Manual QA on multi-part additive scores (e.g. Clarinet + Viola) recommended.

**Recently cleared (not a blocker):** **Theory Inspector explanation-level toggle** removed (2026-04-03); tutor depth is fixed to **`intermediate`** by default—no UI step before chat or suggest. **Inspector split layout + IDEA_ACTIONS + ghost pitch labels + note-input preview label** shipped 2026-04-06; **silent Accept** fixed same pass via **NOTE_IDS** + **`resolveIdeaActionNoteId`**.

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
- Build verification: `npm run build` in `frontend` passes.

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
- Added `frontend/.env.example` + `.env.local` template; `.gitignore` exception so `.env.example` is committed.

## Session Log (2026-04-02 — Theory Inspector pitch duality)

- **Baseline:** `captureGenerationBaseline` in `theoryInspectorBaseline.ts` (harmony `noteId` → pitch; optional `validate-satb-trace` + `AuditedSlot[]` when SATB-shaped). Wired from sandbox `generatedMusicXML` effect via `queueMicrotask` after `setScore`; cleared when XML cleared.
- **Slots:** `scoreToAuditedSlots` moved to `theoryInspectorSlots.ts` for reuse.
- **Explain:** `explainNotePitch` (alias `explainGeneratedNote`) — melody branch, additive fallback with baseline, SATB path uses cached trace + `originSatbContextLines` for engine-origin facts and live `buildSatbNoteContextLines` for current pitch; `buildPitchEditDeltaFact` when edited.
- **UI:** `TheoryInspectorPanel` — comparison strip, Engine origin card, Current pitch card; header copy updated.
- **Prompts:** Tutor rules in `prompts.ts` + `NOTE_EXPLAIN_TUTOR_BRIEF` for ENGINE ORIGIN vs CURRENT and **full notation export** (supersedes earlier pitch-only emphasis); see **Work log — Theory Inspector: LLM “sees” the score (2026-04-03)**.

## Session Log (2026-04-03)

**Documentation sync:** Consolidated end goal, approach, completed work, and **active failures** into `docs/progress.md` (this file). Refreshed `docs/plan.md` (current-status paragraph, **2g.8** RiffScore/patch-package checkbox, LLM verification step). Updated `docs/context/system-map.md` (implementation blurb, mermaid sandbox subgraph → RiffScore + Zustand loop, component table, data-flow steps 6–7, fixed `Taxonomy.md` run-on sentence).

## Session Log (2026-04-04)

**Theory Inspector — tutor follow-up, panel purpose, markdown:** Shipped **`sendMessage` conversationHistory fix** (snapshot before user bubble), **What this click means** + **Verifiable score export** panels with de-duplicated copy, **`react-markdown`** + **`MarkdownText`** for chat and tutor UI. **Docs:** **`@progress.md`** — new **Work log — Tutor follow-up + panels + markdown**, updates to approach §6, consolidated table, Context-Aware file list, failure #12, handover template, **Current Focus**; **`@plan.md`** — status blurb + §3 checkboxes; **`@docs/context/system-map.md`** — banner, Theory Inspector row, data-flow §7. **Verification:** `make test`, `frontend` `npm run test` + `npm run build`; **`make lint-frontend`** still red on pre-existing paths.

## Session Log (2026-04-02 — PDF preview + intake hardening)

**End goal:** PDF (and MXL/MIDI) uploads obtain **server-built preview MusicXML** before `/document`, so the Document page parses and displays like a direct **.xml** upload.

**Shipped:**

- `POST /api/to-preview-musicxml`; `parsedScoreToPartwiseMelodyMusicXML` in `engine/satbToMusicXML.ts`.
- Playground async `fetch` + `useUploadStore.previewMusicXML`; Document branch for `storePreviewXml`.
- `fileIntake` binary resolution: walk from `process.argv[1]` for **pdfalto**; darwin paths for **pdftoppm** / **oemer**; `dev:backend` **PATH** prefix for Homebrew.
- Playground **in-page error** panel; **oemer** failure returns **stderr excerpt** in API details; **DEFAULT_OMR_MS** = 15m.
- `requirements.txt` — Python 3.10–3.12, checkpoint download, manual checkpoint link, **`OEMER_BIN`**.

**Current failure (user-visible):** pdfalto often has **no embedded MusicXML**; **oemer** fails (e.g. missing checkpoints + failed HTTPS download, **Python 3.14** vs onnxruntime). **PDF→XML remains unresolved** for production-like use until OMR stack is pinned and validated (venv + checkpoints or alternate OMR).

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
- **RiffScore playhead scrub (2026-04):** See **Playback scrub — draggable playhead & “Play starts where I dropped”** above — `PlaybackScrubOverlay`, `playbackScrub.ts`, `riffscorePlaybackBridge.ts`, and **`patch-package`** (`__HF_RIFFSCORE_PLAY_FROM`, `consumeHfRiffScorePendingPlay`, toolbar + **Space** + **P**); drop snaps to **measure start** (quant `0`).
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
- Added `frontend/.env.example` for `NEXT_PUBLIC_API_URL`
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
- [x] Identified `frontend/` as the Tactile Sandbox frontend to design around
- [x] Documented frontend stack: Next 16, React 19, Tailwind, VexFlow, Tone, Zustand, Framer Motion
- [x] Documented existing components: TheoryInspectorPanel, ScoreCanvas, ScoreDropzone, EnsembleBuilderPanel, ExportModal
- [x] Documented frontend pages (see table below)

**Frontend pages (design baseline)** — `frontend/src/app/`:

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
- [x] Endpoint: `POST /api/generate-from-file` (multipart: `file`, optional `config`) — accepts .xml, .musicxml, .mxl, .mid, .midi, .pdf (via `fileIntake`); returns MusicXML string

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

**Known follow-up (non-blocking):** Blank canvas fixed — ScoreCanvas prefers OSMD when musicXML exists. VexFlow edit tools (click-on-staff, note selection) inactive when OSMD used; re-enable when VexFlow reliable. `frontend` has unrelated frontend lint debt outside the critical path; `make lint` remains backend-focused.

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

### Theory Inspector layout & ghost labels (2026-04-06)
- **Split scroll:** Keep `useLayoutEffect` auto-scroll on the **chat** pane only so long note-insight content does not reset chat scroll position.
- **IDEA_ACTIONS:** Prose bullets stay human-readable; machine apply requires a **second delimiter** and strict JSON so partial tutor output does not break the Ideas markdown block.
- **NOTE_ID contract:** Tutor evidence must expose **`FACT: NOTE_ID … noteId=<uuid>`** under **`NOTE_IDS_FOR_IDEA_ACTIONS`**; otherwise the model **invents** ids and **`getNoteById`** fails. Client **`resolveIdeaActionNoteId`** is a safety net, not a substitute for good exports.
- **Input preview pitch:** RiffScore preview heads are already flagged by **`isPreviewNotehead`**; staff line **`getBoundingClientRect`** centers must align with notehead rects (container-relative) for **`pitchFromStaffGeometry`** to match click placement.

### Milestone 3/4 Issues (2026-03-23)
- **M3 (XAI Backend & Architecture)**: Complete — 19/19 issues closed. Genre preset, harmony validation API, engine refinement, Theory Inspector RAG prep all done.
- **M4 (Frontend Development & Interactivity)**: Consolidated into [#79](https://github.com/salt-family/harmonyforge/issues/79) and executed for MVP. Completed: (1) audio playback hardening, (2) onboarding flow, (3) Theory Inspector API wiring with fallback/optional OpenAI.
- **#75 Accessibility (M4)**: Closed. Skip link and focus rings in layout.tsx/globals.css.
- **Harmony validation API (M3)**: Implemented:
  - `engine/validateSATB.ts` — `validateSATBSequence(slots)` returns `{ violations, totalSlots, her, valid }`.
  - `POST /api/validate-satb` — accepts `{ leadSheet }` or `{ slots }`; returns HER-style metrics.
  - `POST /api/validate-from-file` — accepts MusicXML / MXL / MIDI (not PDF); parse → infer → generate SATB → validate.
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
- `POST /api/validate-from-file`: multipart `file` (.xml, .musicxml, .mxl, .mid, .midi) → same validation result (parse → infer chords → generate SATB → validate); PDF not allowed

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

**PDF:** `engine/parsers/fileIntake.ts` — pdfalto (vendored repo `pdfalto/`) for ALTO + optional embedded MusicXML in extracted text; then `pdftoppm` page 1 + **oemer** (MIT, PyPI) for engraved PDFs. No Audiveris. Validate/export endpoints reject PDF (`allowPdfOm: false`). MXL via adm-zip + ZIP magic sniff on `.xml`. **2026-04:** **`POST /api/to-preview-musicxml`** + **`parsedScoreToPartwiseMelodyMusicXML`** feed Document preview for PDF/MXL/MIDI; **PDF→XML via oemer remains unresolved** for many environments (checkpoints, Python version) — see **Multi-format intake & PDF → Document preview** above.

**ALTO vs MusicXML:** pdfalto emits **ALTO** (layout/text), not automatic pitch recognition. A melody appears only if extracted text embeds a `score-partwise`/`score-timewise` document or **oemer** succeeds on the first rasterized page. Multi-page PDFs are not merged in this MVP.

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
1. **PDF→MusicXML (oemer)** — Pin **Python 3.11/3.12 venv**, `make install`, prefetch or manually install **oemer checkpoints**, set **`OEMER_BIN`**; or spike alternate OMR (**1.9m** in `@plan.md`).
2. **RiffScore playback samples** — Serve or proxy `/audio/piano/*.mp3` (or disable built-in sampler UX) so piano playback is not 404/no-op.
3. **LLM in dev** — `OPENAI_API_KEY` in `frontend/.env.local`; restart `make dev`; confirm `GET /api/theory-inspector` → `hasApiKey: true`.
4. **Turbopack / lockfiles** — Resolve multi-lockfile warning (e.g. `turbopack.root` or single-lockfile layout).

**Deferred:** JSON-based score deltas for backend sync (Theory Inspector integration).

**Historical (completed — pre–RiffScore-primary era may reference OSMD/VexFlow toggles):**
1. ~~**Fix Next.js dev server**~~ — Resolved: run `npm install` in `frontend/`
2. ~~**Render MusicXML in ScoreCanvas**~~ — Done: parseMusicXML, VexFlowScore, useScoreStore
3. ~~**Selection + active tool**~~ — Done: useToolStore, ScorePalette onToolSelect, Escape/click to clear
4. ~~**Wire Edit tools**~~ — Done: Undo, Redo, Cut, Copy, Paste, Delete
5. ~~**Enable direct note manipulation**~~ — Done: duration/pitch/articulation/dynamics/measure/score tools
6. ~~**Document page preview**~~ — Done: parse uploaded MusicXML, ScorePreviewPanel; namespace-tolerant parser
7. ~~**Fix "Could not parse file or no melody found"**~~ — Done: partwise parser → fast-xml-parser
8. ~~**Resolve VexFlow TickMismatch**~~ — Done (2g.1 era): measure padding; OSMD when `musicXML` for reliable display
9. ~~**Sandbox View/Edit + VexFlow tools**~~ — Done historically; **current primary editor is RiffScore** (see Consolidated status).
10. ~~**App-level audio (`usePlayback`)**~~ — Done: rest-aware/measure-aware scheduling; coexists with RiffScore internal playback (separate concern).
11. **Optional: reduce frontend lint debt** — Remaining `frontend` lint errors may be outside hot path
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
- **End goal:** Upload → Document (preview + config) → Generate → Sandbox with editable score, export, and reliable playback where configured. Engine **adds** harmonies (melody + selected instruments), not replacement. **PDF/MXL/MIDI:** server preview XML before Document when not raw `.xml` (see `to-preview-musicxml`).
- **Approach:** `EditableScore` in Zustand + **RiffScore** sync (`riffscoreAdapter`, `useRiffScoreSync`, `normalizeScoreRests`); **`patch-package`** on `riffscore` for `ui.toolbarPlugins`. Theory Inspector: deterministic engine + taxonomy context; **harmony-only** in-score UX; optional OpenAI via `.env.local`. **Intake:** `engine/parsers/fileIntake.ts` + **`previewMusicXML`** store for Document preview parity.
- **Current status / failures:** (1) **PDF→MusicXML / oemer unresolved** — OMR env fragile (Python version, checkpoint download, PATH); wiring done, reliability not. (2) RiffScore `/audio/piano/*.mp3` **404** in dev. (3) LLM off until `OPENAI_API_KEY` + restart. (4) Turbopack multi-lockfile warning. (5) **Tutor text grounding** — mitigated by **follow-up chat history fix** + text export (**Work log — Tutor follow-up + panels + markdown (2026-04-04)**); residual model/stale-focus risk in **current failures #12**. (6) **`make lint-frontend`** not green (pre-existing debt). (7) older doc bullets may still describe OSMD/VexFlow-first sandbox — use **Consolidated status (2026-04)** + **Multi-format intake & PDF → Document preview** as source of truth.
- **Key files:** `engine/parsers/fileIntake.ts`, `engine/satbToMusicXML.ts` (`parsedScoreToPartwiseMelodyMusicXML`), `engine/server.ts`, `frontend/src/app/page.tsx`, `document/page.tsx`, `useUploadStore.ts`, `RiffScoreEditor.tsx`, `useRiffScoreSync`, `riffscoreAdapter.ts`, `requirements.txt`, `package.json` (`dev:backend` PATH).
- **Run:** `make dev-clean && make dev` → http://localhost:3000 (Next) + engine on :8000. `make test-engine` for CLI. **`make pdfalto`** + **`make install`** (Python) for PDF path.
