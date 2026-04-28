# Progress (RALPH Loop)

### How to read this file

This is a **long-running work log** (RALPH: Research, Analyze, Learn, Plan, Handover). Newest context often appears in **work log** sections near the top and in **Consolidated status**. Older **session logs** stay for archaeology—use search or the links below rather than reading top-to-bottom once.

### Quick links

- [Work log — Sandbox naturals keyboard, LLM env recovery, lay audit copy (2026-04-27)](#wl-sandbox-naturals-llm-audit-2026-04-27) — **keyboard ↑/↓** = **diatonic white-key steps** + **natural-only** stored pitches; **⌘/Ctrl+↑/↓** = octave then **natural letters**; **Salamander** pitch preview matches RiffScore clicks; **`getServerOpenAIEnv`** **swaps** mistaken **`OPENAI_API_KEY` ↔ `OPENAI_MODEL`** + **`configHint`** in Theory Inspector; **SATB audit** chat line = short **red vs blue** explanation — **open:** manual QA (arrows, preview, **Octave ↓**); confirm **Vercel** env on **Preview** + redeploy
- [Work log — Sandbox editor reliability & UX trim (2026-04-27)](#wl-sandbox-reliability-2026-04-27) — **flush-aware transpose** (**`useScoreStore.getState().score`** after RS flush); **toolbar ↔ palette parity** via **`onToolbarAction` → `handleToolSelect`** (returns **`true`**, no double **`applyOnSelection`**); chromatic **↑/↓** + pitch toolbar **`getTransposeTargetNoteIds`**; score-only print; **Advanced** Document hidden; **`make verify`** **281** tests — **open:** manual QA; **watch:** toolbar **`Octave ↓`** after unified path (Iteration 7 residual — re-verify in browser)
- [Work log — Iteration 7 follow-up (2026-04-25 PM)](#wl-iteration-7-followup-2026-04-25-pm) — playground click-burst UI, concise Harmony setup copy merge, Team footer new-tab behavior, preview scrollbar fix attempts, Theory Inspector explanation empty-state prompt, undo/redo reliability pass; **current failure: toolbar `Octave ↓` still intermittently fails for some users**
- [Work log — Iteration 7 (2026-04-25)](#wl-iteration-7-2026-04-25) — **user-study follow-up**: **interaction** (unified **↑/↓** + **⌘/Ctrl+↑/↓** pitch in `sandbox/page.tsx`); **playback** timbre map + **Piano / By part** preview; **Theory Inspector** proactive alternatives + phrasing-guarded stylist; **Ensemble** “your rhythm vs harmony engine” copy; **engine** melody-duration audit
- [Work log — Cross-surface UX, team narrative & Playground stand (2026-04-24)](#wl-ux-team-playground-2026-04-24) — **copy/UI polish** across **`/`** · **`/document`** · **`/sandbox`** · **`/team`**; **team** collapsibles + “how we work together”; **music-stand** hover pulse + **♫**-shaped aureole (no rectangular hover card)
- [Work log — Team page & global credits (2026-04-23)](#wl-team-credits-2026-04-23) — **`TeamNavButton`** in headers, **`/team`** creator profiles (bios, quotes, **`next/image`**), **`frontend/public/creators/`** headshots
- [Work log — Iteration 6 (2026-04-23)](#wl-iteration-6-2026-04-23) — **pedal bass engine option + expanded ensembles + Theory Inspector Guided/Concise + tighter prompts + float/dock inspector + Alt+bar measure selection + multi-select chat FACT + localized bar harmony API (`/api/generate-harmony-range`)**
- [Work log — Sandbox & export polish (2026-04-23)](#wl-sandbox-ux-polish-2026-04-23) — **rest ghost hardening + hotkeys dialog + export paper + RiffScore↔HF multi-select + viola alto clef + RiffScore alto/tenor layout patch + CJS/ESM toolbar parity (`pendingClefChange` runtime)**
- [Work log — Sandbox fluidity, multi-select pitch, inspector resize, UI polish (2026-04-23)](#wl-sandbox-fluidity-2026-04-23) — **multi-note pitch moves together + action bar removed + floating Theory Inspector resize/persist + `hf-pressable` + modal/backdrop/toast motion + less harsh chrome**
- [Program narrative — MVP + Inspector polish (2026-04-22)](#program-narrative-2026-04-22) — **shipped bundle + lint/QA gaps (superseded for sandbox tranche by 2026-04-23 work log above)**
- [Work log — Sandbox score UX: hotkeys, reset, rest hover ghost (2026-04-22)](#wl-sandbox-score-ux-2026-04-22) — **MuseScore-style rest replacement without duration tool**
- [Work log — MVP phase: Document, Sandbox, Theory Inspector (2026-04-22)](#wl-mvp-phase-ship-2026-04-22) — **file-level checklist**
- [Program narrative — where we are (2026-04-20)](#program-narrative-2026-04-20) — **end goal, approach, steps so far, current focus / risks**
- [Work log — LLM env & Theory Inspector gateway (2026-04-20)](#wl-llm-env-2026-04-20)
- [Work log — Palettes, rest repitch, clean export (2026-04-20)](#wl-palettes-repitch-2026-04-20)
- [Work log — Document UX: chord gating, playback, pedagogy & tooltips (2026-04-20)](#wl-document-ux-2026-04-20)
- [Work log — Ensemble Builder UI: collapsible pedagogy & grouped sections (2026-04-21)](#wl-ensemble-builder-ui-2026-04-21)
- [Work log — Learner note names, classical-only scope, bar-regenerate removal (2026-04-20)](#wl-learner-notes-scope-2026-04-20)
- [Work log — Learner pitch labels refinement: letter+accidental, DOM sync, stacking (2026-04-20)](#wl-learner-pitch-labels-refine-2026-04-20)
- [Work log — Repository hygiene & docs consolidation (2026-04-20)](#wl-repo-hygiene-2026-04-20)
- [Work log — Consolidation + PDF + residuals (2026-04-19)](#wl-consolidation-2026-04-19)
- [End Goal](#end-goal)
- [Work log — Iteration 1+2 study refinement (2026-04-18)](#wl-study-refinement-2026-04-18)
- [Work log — Glass Box pedagogy callouts (2026-04-19)](#wl-glass-box-pedagogy-2026-04-19)
- [Work log — Documentation, deployment, repo hygiene (2026-04-07)](#wl-docs-deploy-2026-04-07)
- [Work log — Generate timeout mitigation (2026-04-07)](#wl-generate-timeout-2026-04-07)
- [Work log — Symbolic intake & MusicXML markers (2026-04-07)](#wl-intake-symbolic-2026-04-07)
- [Work log — Tactile Sandbox exports (2026-04-13)](#wl-sandbox-exports-2026-04-13)
- [Holistic refinement program (2026-04)](#holistic-refinement-2026-04) — end goal, approach, completed steps, **current failure**
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

<a id="last-updated-2026-04-27-inspector-sandbox"></a>

### Last updated (2026-04-27 — naturals keyboard, LLM env, audit copy)

- **Narrative (end goal · approach · steps · failures):** **[Work log — Sandbox naturals keyboard, LLM env recovery, lay audit copy (2026-04-27)](#wl-sandbox-naturals-llm-audit-2026-04-27)** — keyboard vs toolbar transpose semantics; Salamander preview; OpenAI env swap + UI hints; concise SATB audit system message.
- **Tests:** Vitest includes **`llmClient.test.ts`**; full gate **`make test`** was **296** passing after this tranche (repo state when logged).

<a id="wl-sandbox-naturals-llm-audit-2026-04-27"></a>

#### Work log — Sandbox naturals keyboard, LLM env recovery, lay audit copy (2026-04-27)

- **End goal**
  - **Sandbox keyboard (selection):** Moving notes with **↑ / ↓** follows **white-key / C-major letter steps** only — stored pitches stay **natural letter + octave** (**no `#` / `b`** from these shortcuts). **⌘/Ctrl + ↑ / ↓** shifts by **octave** (chromatic ±12 MIDI) then **coerces spelling** to the same natural-only convention so the score does not gain accidentals from the shortcut alone.
  - **Toolbar** (**+2 / −2**, octave): Keeps **chromatic whole-step** behavior with **key-signature-friendly spelling** via existing **`transposeNotes`** / **`scheduleTransposeSelectedNotes`** (unchanged product path).
  - **Preview sound:** Short transpose audition uses the **same Salamander piano** as RiffScore note clicks (**`Tone.Sampler`**, Tone.js demo **`baseUrl`**) — not a generic synth — so ear matches click-to-hear.
  - **Production LLM:** Theory Inspector should not **401** when Vercel has **`OPENAI_API_KEY`** and **`OPENAI_MODEL`** **swapped** (model string sent as API key — OpenAI error text literally names **`gpt-4o-mini`**). Recover automatically when possible and surface a **non-secret** hint in-panel.
  - **SATB audit chat:** Replace dense **HER / chord moments / flag counts** with a **very short** line explaining **red vs blue** highlights on the score.

- **Approach**
  - **Score layer:** Add **`naturalDiatonicStepNotes`**, **`transposeNotesForceNaturalLetters`**, helpers **`snapMidiToWhiteKey`**, **`pitchStringFromNaturalWhiteKeyMidi`**, **`naturalDiatonicStepMidi`** in **`frontend/src/lib/music/scoreUtils.ts`** (with tests in **`scoreUtils.test.ts`**). Fix **`midiToPitch`** octave mapping where needed so MIDI ↔ pitch round-trips match **`pitchToMidi`**.
  - **Sandbox wiring:** **`scheduleNaturalDiatonicStep`** / **`scheduleTransposeNaturalLetters`** in **`sandboxScoreTranspose.ts`**; **`handleSandboxScoreKeyDown`** in **`sandboxScoreKeyboard.ts`** calls those for arrows (not **`scheduleTransposeSelectedNotes`**). **`sandboxPitchPreview.ts`** — lazy singleton **`Tone.Sampler`** + **`Tone.loaded()`**, shared destination volume.
  - **LLM:** **`getServerOpenAIEnv()`** in **`llmClient.ts`** — if **`OPENAI_API_KEY`** looks like a **model id** and **`OPENAI_MODEL`** looks like **`sk-…`**, **swap**; if key looks like a model and no secret in model slot, **clear** key and set **`configHint`**. **`GET /api/theory-inspector`** returns **`configHint`**; **`useTheoryInspectorStore`** + **`TheoryInspectorPanel`** show it. **`frontend/.env.example`** warns not to put the model name in **`OPENAI_API_KEY`**.
  - **Audit UX:** **`runAudit`** in **`useTheoryInspector.ts`** — single plain sentence for violations; short **clean pass** line when **`result.valid`**.

- **Steps done so far**
  1. Implemented naturals-only keyboard transpose pipeline (modules above) + **hotkey help** copy distinguishing keyboard vs toolbar.
  2. **`previewSandboxPitches`** → Salamander **`urls`** aligned with **`patches/riffscore+…`** remote sample map.
  3. **`llmClient`** env normalization + **`llmClient.test.ts`**; route **GET** JSON extended; inspector store/panel **hint** banner when **`tutorEnabled && configHint`** (recovery message).
  4. Replaced verbose **SATB audit** system chat content with red/blue explanation (and brief valid pass message).

- **Current failure / open work**
  - **Manual QA (not closed in automation):** Keyboard **↑/↓** with multi-select across odd flush timing; **audio** first load after **`Tone.loaded()`** on slow networks; **toolbar `Octave ↓`** — still listed as **Iteration 7 residual** until another **in-browser** pass after **`handleToolbarAction`** work ([§ Sandbox reliability 2026-04-27](#wl-sandbox-reliability-2026-04-27)).
  - **Vercel / env:** Users must **redeploy** after changing env vars; **Preview** deployments need vars attached to **Preview** (not only Production). Code **recovers** swapped **`OPENAI_*`** but **correct naming** in the dashboard is still the durable fix.
  - **Optional doc follow-up:** Add a short **`deployment.md`** callout linking **`configHint`** behavior (deferred unless product asks).

- **Learnings**
  - OpenAI’s **401** body echoes the **invalid credential string** — if it equals **`gpt-4o-mini`**, the **secret and model env vars are reversed** or the key slot holds a model id.
  - **RiffScore flush** + **Zustand** timing also applies to **transpose schedulers** — keep **flush → rAF → applyScore** pattern for selection consistency.

<a id="last-updated-2026-04-27"></a>

### Last updated (2026-04-27)

- **Narrative (end goal · approach · steps · failures):** **[Work log — Sandbox editor reliability & UX trim (2026-04-27)](#wl-sandbox-reliability-2026-04-27)** — single place for this tranche (includes **follow-up: flush parity + unified toolbar dispatch**).
- **Sandbox toolbar bridge:** [`toolbarActionMap.ts`](../frontend/src/components/score/toolbarActionMap.ts) maps RiffScore **`hf-action-*`** ids to **`handleToolSelect`** tool ids. **[`sandbox/page.tsx`](../frontend/src/app/sandbox/page.tsx)** passes **`onToolbarAction`** → **`handleToolbarAction`** → **`handleToolSelect(toolId)`** + **`return true`** into **`ScoreCanvas`** so **`RiffScoreEditor.runToolbarAction`** does **not** run internal **`applyOnSelection`** fallbacks (avoids **rAF** double-path vs palette). Toolbar **PRN** still uses **`onToolbarPrint`** → **`printScoreOnly`**. [`toolbarActionMap.test.ts`](../frontend/src/components/score/toolbarActionMap.test.ts) asserts stable **action → toolId** mapping.
- **Keyboard chromatic transpose + store truth:** **`getTransposeTargetNoteIds`** (**[`RiffScoreSessionContext`](../frontend/src/context/RiffScoreSessionContext.tsx)**) = **`flushToZustand`** + **`getActiveNoteIds`**. **[`sandbox/page.tsx`](../frontend/src/app/sandbox/page.tsx)** capture-phase **`keydown`** applies **`transposeNotes`** using **`useScoreStore.getState().score`** **after** flush — **not** the React **`score`** closure (which could lag one tick and mismatch post-flush note IDs). **`stopImmediatePropagation`** when transpose ids exist.
- **Document — Advanced hidden:** **[`EnsembleBuilderPanel`](../frontend/src/components/organisms/EnsembleBuilderPanel.tsx)** no longer shows **Pickup (anacrusis)** or **Prefer inferred chords** (store **`pickupBeats`** / **`preferInferredChords`** still feed **`onGenerateHarmonies`** at defaults / persisted values).
- **Theme:** [`layout.tsx`](../frontend/src/app/layout.tsx) — `defaultTheme="light"`, **`enableSystem={false}`** so the app does not follow OS dark mode until the user toggles. [`riffscoreAdapter`](../frontend/src/lib/music/riffscoreAdapter.ts) defaults RiffScore **`ui.theme`** to **`LIGHT`** when options omit it.
- **Copy:** Theory Inspector audit summary and export validation strip the HER acronym from participant-facing strings; Theory Inspector chat input placeholders tightened.
- **Build / tests:** [`RiffScoreEditor`](../frontend/src/components/score/RiffScoreEditor.tsx) imports **`cloneScore`** for multi-pitch baseline (fixes production typecheck). Vitest [`setup-storage.ts`](../frontend/src/test/setup-storage.ts) polyfills incomplete Node **`localStorage`** so **`useGenerationConfigStore`** + Zustand **`persist`** behave under Vitest 3. **`make verify`:** **281** tests, lint, build (2026-04-27).

<a id="wl-sandbox-reliability-2026-04-27"></a>

#### Work log — Sandbox editor reliability & UX trim (2026-04-27)

- **End goal**
  - **Tactile Sandbox** editing stays **trustworthy**: **RiffScore** beige toolbar (UN, RE, +1, −1, 8+/8−, DOT, RST, p, f, XML, PRN) and **F9 notation palette** apply the **same** HarmonyForge score mutations (**[`handleToolSelect`](../frontend/src/app/sandbox/page.tsx)**) with **flush-correct** **`EditableScore`** — no stale React **`score`** vs post-flush IDs.
  - **Semantic parity:** Keyboard **↑ / ↓** (and **⌘/Ctrl+↑ / ↓** for octave) match **chromatic ±1 / ±12** (**[`transposeNotes`](../frontend/src/lib/music/scoreUtils.ts)**), not RiffScore’s internal staff-step when HF owns the gesture.
  - **Document / Ensemble:** **Advanced** (pickup, prefer inferred chords) hidden from **[`EnsembleBuilderPanel`](../frontend/src/components/organisms/EnsembleBuilderPanel.tsx)** while **`useGenerationConfigStore`** still feeds generation.
  - **Product polish:** Default **light** theme; Theory Inspector copy cleanup where noted in-session.

- **Approach (evolved in-tranche)**
  - **Early direction:** Rely on **`RiffScoreEditor`** **`applyOnSelection`** fallbacks only (**flush → rAF → transpose**) so native toolbar stayed authoritative.
  - **Follow-up (flush parity + single dispatcher):** After **`flushToZustand`**, Zustand holds the merged score **synchronously**, but React’s **`score`** can lag **one frame** — **`transposeNotes(closureScore, …)`** risks wrong pitches. **Fix:** read **`useScoreStore.getState().score`** for transforms after flush / **`getTransposeTargetNoteIds()`**. Route toolbar via **`onToolbarAction`** → **`handleToolSelect`** + **`return true`** so toolbar **does not** also run **`applyOnSelection`** (removes **rAF** timing split vs palette; octave buttons share keyboard **`handleToolSelect`** path).
  - **Print:** **`onToolbarPrint`** → **`printScoreOnly`** (score-only body class), not full-page **`window.print()`**.
  - **Arrows:** **`getTransposeTargetNoteIds`** before transpose; **`stopImmediatePropagation`** when ids exist.
  - **Verification:** **`make verify`** after changes.

- **Steps done so far**
  1. **`toolbarActionMap`** — stable **`hf-action-*` → tool id**; **[`toolbarActionMap.test.ts`](../frontend/src/components/score/toolbarActionMap.test.ts)**.
  2. **`getTransposeTargetNoteIds`** on **[`RiffScoreSessionHandles`](../frontend/src/context/RiffScoreSessionContext.tsx)**; **`sandbox/page.tsx`** chromatic **↑/↓** uses **`noteIds.size > 0`** (not HF **`selection.length`** alone); transpose runs **above** note-input cursor arrows.
  3. **`EnsembleBuilderPanel`** — **Advanced** UI removed (store-driven **`pickupBeats`** / **`preferInferredChords`** unchanged).
  4. **Theme / tests / infra** — **`layout.tsx`** light default; **`cloneScore`** import; Vitest **`setup-storage.ts`** **`localStorage`** polyfill.
  5. **Follow-up — post-flush live score:** Arrow handler uses **`useScoreStore.getState().score`** after **`getTransposeTargetNoteIds()`** (guard **`null`**).
  6. **Follow-up — `handleToolSelect`:** **`flushToZustand`** + **`useScoreStore.getState().score`** for duration-on-selection, **DOT**, **RST**, dynamics; pitch tools use **`getTransposeTargetNoteIds()`** + live score (transpose works when RS has selection but HF store **`selection`** empty).
  7. **Follow-up — `handleToolbarAction`:** **`ScoreCanvas`** **`onToolbarAction={handleToolbarAction}`** — **`handleToolSelect(toolId)`** + **`return true`** (toolbar/plugin parity with F9 palette; no double-apply).

- **Current failure / open work**
  - **Iteration 7 residual (to re-test):** Toolbar **`Octave ↓` (`8-`)** was **intermittent** when toolbar used **`applyOnSelection` + rAF** alone. **Unified `handleToolSelect` path** should align **8−** with **hotkeys**; **not yet closed in docs** until **manual QA** on **`/sandbox`** (multi-select, odd click order).
  - **Manual QA checklist:** **↑/↓** / **⌘+↑/↓** vs **+1/−1/8+/8−**; **XML** / **PRN**; Theory Inspector open; note-input **cursor ↑/↓** still moves staff when **no** transpose targets (**`noteIds.size === 0`**).

- **Learnings**
  - **RS flush → Zustand is synchronous**; React **`score`** is not always co-temporal — chromatic edits must read **`useScoreStore.getState().score`** after **`flushToZustand`** / **`getTransposeTargetNoteIds`** when applying **`transposeNotes`** (and related selection mutations).

<a id="last-updated-2026-04-25"></a>

### Last updated (2026-04-25)

- **Iteration 7 (study feedback — [Iteration7.txt](Iteration7.txt)):** See **[Work log — Iteration 7 (2026-04-25)](#wl-iteration-7-2026-04-25)** for **end goal**, **approach**, and **file-level** notes. **Manual repro (baseline):** (1) **Drag** — reported wrong vertical note in dense/chord clusters; RiffScore owns pointer selection, HF **`pitchGroupRef`** + **`syncMultiPitchFromBaseline`** own multi-select propagation. (2) **Octave/arrow** — single-note **Arrow** + **⌘/Ctrl+Arrow** previously relied on RiffScore defaults; now centralized in **capture-phase** `keydown` in **`sandbox/page.tsx`** with **`e.code`**. **Verification (2026-04-25):** **`make test`** **276** · **`make lint`** clean; additive **Part 1** melody-duration case in **`filePipeline.test.ts`**.
- **Iteration 7 follow-up (2026-04-25 PM):** See **[Work log — Iteration 7 follow-up (2026-04-25 PM)](#wl-iteration-7-followup-2026-04-25-pm)** for UI polish + bugfix pass after live testing. **Current failure:** sandbox toolbar **`Octave ↓`** still intermittently fails for some users despite selection/history sync patches; root cause likely RiffScore selection timing vs HF action dispatch.

<a id="wl-iteration-7-followup-2026-04-25-pm"></a>

#### Work log — Iteration 7 follow-up (2026-04-25 PM)

- **End goal:** Convert same-day study/demo feedback into immediate UX polish and stability fixes without regressing Iteration 7 architecture constraints (ADR 003, no JSON score-delta sync detour).
- **Approach:** Ship small, reversible patches in place: remove confusing UI first, then improve affordances/copy density, then tackle interaction bugs by tightening editor/store sync and event propagation around RiffScore.
- **Steps done so far:**
  - Removed **Preview timbre selector** UI and “By instrument” references from Sandbox/Document-facing controls; reverted to standard editor playback path.
  - Updated footer **Team** link to open in a **new tab** (`target="_blank"`, `rel="noopener noreferrer"`).
  - Added Playground **click burst** effect (soft note + tech/AI glyph particles) to complement cursor trail.
  - Compressed Document **Harmony setup** copy and merged explanatory text into a single concise section for generate flow.
  - Added Theory Inspector **Explanation** empty state: “Click a note to see its explanation.”
  - Patched Configure preview scrollbar interaction twice: (1) removed full-screen play-button overlay hit area, (2) presentation-mode overflow target correction (`riff-ScoreCanvas` x-scroll ownership).
  - Added undo/redo reliability hardening: flush-before/after history ops + stronger key event propagation stops; then additional live-selection resolution for toolbar transforms.
- **Verification:** Multiple rounds of **`make test`** (276 passing) and **`make lint`** clean after each patch tranche.
- **Current failure / active investigation:** **Toolbar `Octave ↓` (`8-`) still reported as not working** in some sessions. We have added live selection reads from RiffScore API + frame-delayed apply; remaining suspicion is race between RiffScore internal selection state and HF toolbar plugin callbacks under specific interaction order. Next step: instrument action path (delta, selected note ids, API selection snapshot) and compare toolbar vs hotkey path execution in-session.

<a id="wl-iteration-7-2026-04-25"></a>

#### Work log — Iteration 7 (2026-04-25)

- **End goal:** Stabilize **click-drag** and **keyboard pitch**, improve **audition trust** (timbre + A/B), make **Theory Inspector** feel **proactive** (alternatives, not “search only”), and **separate** user **rhythmic phrasing** from **vertical harmony** in UI + stylist defaults.
- **Learnings (architecture):** Pitch transposes for toolbar/HF are **`transposeNotes`** + **`getPitchGroupNoteIds()`**; RiffScore **`play()`** still uses its **piano** sampler—HF **`usePlayback`** can use **per-part timbre** when not delegating, or a **Piano** mode. **`explanationLevel.ts`** = shared **`resolveExplanationLevel`** for API/tests; panel keeps **beginner** as default.
- **Verification:** **`make test`** **276** · **`make lint`** clean · **`make build`** green (2026-04-25; full **`make verify`**); engine regression **`satbToMusicXML additiveHarmonies preserves written melody note durations on Part 1`** in **`filePipeline.test.ts`**.
- **Open:** touch still has no hover; dense-score **RiffScore** hit-testing may need upstream patch if issues persist after HF arrow routing.

<a id="last-updated-2026-04-24"></a>

### Last updated (2026-04-24)

- **Cross-surface product copy & Playground music-stand UX:** See **[Work log — Cross-surface UX, team narrative & Playground stand (2026-04-24)](#wl-ux-team-playground-2026-04-24)** for **end goal**, **approach**, **file-level steps**, and **current failure / focus**.
- **Tests:** **`frontend` Vitest** — **273** passing after this tranche (`npm test`).
- **Program backlog (unchanged):** **Iteration 6** / sandbox polish items in **[Last updated (2026-04-23)](#last-updated-2026-04-23)** (localized range merge, touch, inspector selection drift, export narrow viewport, etc.) — not blocked by this UX slice.

<a id="last-updated-2026-04-23"></a>

### Last updated (2026-04-23)

- **Team page & global credits (same day, product):** See **[Work log — Team page & global credits (2026-04-23)](#wl-team-credits-2026-04-23)** for **end goal** (transparent “who built this,” Glass Box–aligned trust), **approach** (header icon + `/team` + static `public/creators` assets), **steps shipped** (`TeamNavButton`, `DocumentHeader` / `SandboxHeader` wiring, `app/team/*`, headshots), and **current failure / focus** — **no regression** from this slice; **ongoing engineering backlog** remains **Iteration 6** (localized range merge edge cases, touch without Alt-hover, inspector vs RiffScore selection drift, export narrow viewport, stylist/suggestion scope per **`Iteration6.txt`**). Ensure **`frontend/public/creators/**` is committed for deploys.
- **Sandbox fluidity & UI polish (same day, follow-on):** See **[Work log — Sandbox fluidity… (2026-04-23)](#wl-sandbox-fluidity-2026-04-23)** for **end goal** (study “clunky UI” / Iteration6 §1), **approach**, **file-level steps** (multi-select pitch, inspector float resize, global motion/press tokens, modals/banners/toasts), and **current open work** (responsive export optional, touch/Alt gaps, localized range merge — no failing Vitest gate; **258** tests pass locally).
- **Iteration 6 (study UX + engine):** See **[Work log — Iteration 6 (2026-04-23)](#wl-iteration-6-2026-04-23)** — pedal bass, inspector float/dock, prompts, multi-select FACT, measure-range harmony API, ensemble expansion.
- **Sandbox & export polish tranche:** See **[Work log — Sandbox & export polish (2026-04-23)](#wl-sandbox-ux-polish-2026-04-23)** for the consolidated **end goal**, **approach**, **steps done**, and **current failure / open QA**.
- **Summary:** **Rest-hover ghost** — larger, higher-contrast Bravura preview, center-based layout, expanded commit hit box, guards against **`NaN`** CSS from bad staff geometry (`staffAnchorYForPitch`, `staffLineYsFiveInContainer`, `midStaffDiatonicPitchInContainer`); rest-hover **`useEffect`** uses **primitive deps** + ref flushes to avoid stale geometry. **Keyboard shortcuts** — in-app **`SandboxHotkeysDialog`** (header keyboard button); **`sandbox/page.tsx`** keydown aligned with help text (Caps Lock, `e.code` for brackets / main-row digits / numpad, unicode minus). **Export modal** — score preview **always paper** `#F8F3EA`; **`RiffScoreEditor`** **`presentation`** forces **LIGHT** theme; **PNG** capture uses the same paper background (not OS dark). **Multi-selection** — **`mapRiffSelectedNotesToHFSelections`** + **`onEditorSelectionChange`** sync full RiffScore **`selection`** to **`useToolStore`**; session **`editorSelectAll`** / **`editorDeselectAll`**; **⌘/Ctrl+A** and **Esc** clear both sides; **marquee / shift-range** should now drive **joint** drag + palette hotkeys. **Viola / staff clef (HF adapter)** — **`hfClefToRs`** no longer maps **`alto`** through **`PART_CLEF_MAP`** (SATB alto *voice* default treble); **staff clefs** **`treble` / `bass` / `alto` / `tenor`** pass through; test in **`riffscoreAdapter.test.ts`**. **Viola / additive harmony (RiffScore layout)** — upstream **`getOffsetForPitch`** treated **alto** and **tenor** like **treble** for Y offsets, so **C-clef** looked right but **noteheads** sat on the wrong lines; **`patches/riffscore+1.0.0-alpha.9.patch`** now uses **treble/bass lookup tables only for those clefs** and **`CLEF_REFERENCE` + formula** (and **`getPitchForOffset`** inversion) for **alto/tenor**. **Runtime `pendingClefChange`** — HarmonyForge patch removes the confirm-dialog flow; **`dist/index.js`** (CJS) is now **parity-patched** with **`index.mjs`** for **`toolbarPlugins`** on **`Toolbar`**, **`ScoreEditorContent`**, and **`RiffScoreInner`** so partial bundler resolution cannot leave stale JSX; after pull run **`cd frontend && rm -rf .next && npm install`**. **Open:** manual QA on dense scores, chords, **inspector overlay** vs native selection desync; **touch** still has no hover ghost; spot-check **viola** (and any **alto/tenor** staff) after layout patch.

### Last updated (2026-04-22)

- **Sandbox score editing UX (same day, follow-on tranche):** See **[Work log — Sandbox score UX…](#wl-sandbox-score-ux-2026-04-22)**. **Goal:** MuseScore/Noteflight parity for **rest → pitched note** without forcing a **duration tool** first — **hover** a rest to show a **Bravura ghost notehead** + letter name from **staff-vertical pitch** (`pitchAtStaffVerticalInContainer`); **click** the ghost to **replace** the rest using that rest’s **`duration` / `dots`** (not the toolbar duration). **Also shipped:** **hotkeys** — capture-phase **`keydown`** + **`isTypingTarget`** so **Delete/Backspace** don’t fire in inputs; **RiffScore** keeps **arrow** transpose; **`resolveInsertionTarget`** + **`pasteNotes`** treat **rest index** as **replace** not insert-after; **header/footer** — **`ConfigurationBackFAB`** (outline, score corner), **`StepBar`** full step labels (dropped compact strip), **`SandboxHeader`** less crowded, **`AppFooterStrip`** sandbox link; **reset** — **`WorkspaceResetModal`**, **`hydrateSandboxFromMusicXml`** after **`resetWorkspaceToBaseline`**; rest positions from RiffScore **`rect[data-testid^="note-"]`** when there is no pitched **`NoteHead`**. **Current rough edge:** hover-driven UX is **pointer-first** (no hover on touch); **manual QA** still needed for overlapping rests, **Theory Inspector** overlay mode (ghost **off** when `noteInspectionEnabled`), and edge-case pitch readout on dense/ledger-line layouts.
- **MVP phase bundle (Document → Sandbox → Theory Inspector):** See **[Program narrative (2026-04-22)](#program-narrative-2026-04-22)** and **[Work log — MVP phase ship](#wl-mvp-phase-ship-2026-04-22)**. Highlights: **generation config** persisted with **Zustand `persist` + `localStorage`**; **pickup 0–3** + **prefer inferred chords** in **Advanced** on Document, **`pickupBeats`** in engine **`parseConfig`** / **`runGenerateFromFile`**; **terminology** (accompaniment, **Chordal (slow)** / **Flowing (active)**, **4-part harmony**); **ScorePreviewPanel** rhythm summary; **`buildProgressionWindowFacts`** ±**3** neighborhood + tests; **Sandbox** first-visit **`OnboardingOverlay`** + **`hf_onboarding_seen`**; **SandboxHeader** back link + **reset workspace** (baseline XML in **`useUploadStore`**); **VoiceDropdown** family groups + instrument SVGs; sandbox **arrow keys** (horizontal cursor without note-input gate); **`usePlayback`** **`Transport`** try/catch; note-explain **toast** on failure; **Theory Inspector** **Explanation | Chat** tabs, **chat tags** + streaming strip, **measure “Regenerate this bar”** with region payload; **B/S/P depth toggle removed** (again) — store fixed **`beginner`** + prompts **thorough but concise**; **suggested chats** moved **above the composer**; **RiffScoreEditor** palette **`useCallback`** hooks **above** early return — **`npm run lint`** **exits 0** (residual **warnings**: **`@next/next/no-img-element`** in **`VoiceDropdown`** / editor, unused **`_e`** in **`handleKeyDown`**).
- **Current engineering focus:** validate **rest hover ghost** in real scores (see work log); polish **lint warnings** above; continue **Iteration 3**-style product gaps (progression tutoring quality, study execution, deploy). No blocking hook-order error.

### Last updated (2026-04-21)

- **Ensemble Builder UI polish (2026-04-21):** [`GlassBoxPedagogyCallout`](../frontend/src/components/molecules/GlassBoxPedagogyCallout.tsx) is a **collapsible disclosure** (chevron + short summary label); **collapsed by default** on Document ensemble flows, **expanded by default** on Theory Inspector. [`EnsembleBuilderPanel`](../frontend/src/components/organisms/EnsembleBuilderPanel.tsx) groups **Mood + Harmony motion** into a **Sound & style** card and **SATB dropdowns** into an **Instruments (SATB)** card; the classical-only scope line is **one concise footer** inside the first card (not a separate callout block). Slightly tighter panel padding and vertical rhythm. **Always-visible Glass Box line (Document):** a **brief paragraph under the Ensemble Builder subtitle** states that **harmony generation is algorithmic** (rules + search), **not** generative AI, and that **AI appears only in Theory Inspector** on the next screen (reviewer arm: no generative harmony AI; chat-style AI in Inspector). This stays visible even when the collapsible pedagogy is closed. See **[Work log — Ensemble Builder UI…](#wl-ensemble-builder-ui-2026-04-21)**.
- **Resolved (2026-04-22):** **`react-hooks/rules-of-hooks`** on **`RiffScoreEditor`** — palette drag/drop callbacks now sit **before** `if (!score || !config) return null`.

### Last updated (2026-04-20)

- **Learner pitch labels — refinement (2026-04-20):** Labels show **letter + accidental only** (e.g. **C**, **F#**, **Bb**) for beginners — not scientific pitch with octave. **`formatLearnerLetterName()`** in [`learnerPitchLabel.ts`](../frontend/src/lib/music/learnerPitchLabel.ts) (Vitest). **Correct placement / every note:** [`riffscorePositions.ts`](../frontend/src/lib/music/riffscorePositions.ts) maps RiffScore **`rect[data-testid^="note-"]`** inside **`g.note-group-container`** to HarmonyForge note ids (`resolveRsNoteIdToHfNoteId`); legacy staff / flat walks **skip rests** so indices align with pitched **`NoteHead`** lists; **`isPreviewNotehead`** treats only heads **outside** `note-group-container` as preview (the old `pointer-events: none` ancestor check hid all real heads). **`useRiffScoreSync`** exposes **`getRsToHf()`** so selection and extraction read a **fresh** map without waiting on rerenders. **Stacking:** learner overlay **`z-[3]`**; **Notation** chip + **Ask Theory Inspector** FAB raised to **`z-50`** in [`sandbox/page.tsx`](../frontend/src/app/sandbox/page.tsx); **`useLayoutEffect`** + **`ResizeObserver`** drive **`clip-path: inset(...)`** under **`.riff-Toolbar`** so labels do not paint on the internal toolbar; **`pt-5`** when labels on; **`ScoreCanvas`** / **`ScorePreviewPanel`** use **`overflow-hidden`** (no `overflow-visible` escape). See **[Work log — Learner pitch labels refinement…](#wl-learner-pitch-labels-refine-2026-04-20)**. **`npm test`:** **223** Vitest tests (frontend).
- **Learner note names + product scope (2026-04-20 — late):** First slice: optional pitch help by noteheads — persisted in **`useScoreDisplayStore`**, toggles in **Sandbox** header and **Document** preview; **`extractNotePositions`** fix (strategy 1 no longer returns **[]** when `data-note-id` exists but maps fail — fall through to staff/flat walk). **Document / Generate:** removed **Genre** (Classical/Jazz/Pop) and **“Infer harmony from melody…”** UI; replaced with an in-panel **disclaimer** that the product currently generates **basic classical-style** harmonies only; **`POST /api/generate-from-file`** config is forced to **`genre: "classical"`** without **`preferInferredChords`**. **Sandbox:** removed **“Regenerate harmony in bar N”** bar (localized `generate-from-file` + `replaceHarmonyMeasuresRange` merge) and study event **`regenerate_harmony_bar`**. See **[Work log — Learner note names…](#wl-learner-notes-scope-2026-04-20)**. Label **format** and **DOM sync** details are in the **refinement** work log above.
- **Theory Inspector — OpenAI-compatible env wiring (2026-04-20):** Server-side LLM config is centralized in **`getServerOpenAIEnv()`** in [`frontend/src/lib/ai/llmClient.ts`](../frontend/src/lib/ai/llmClient.ts): trimmed **`OPENAI_API_KEY`**, model default **`gpt-4o-mini`** when **`OPENAI_MODEL`** is unset, and **`resolveOpenAIBaseURL()`** from **`OPENAI_BASE_URL`** or **`OPENAI_URL`** (with **`normalizeOpenAIBaseURL`** for accidental double-pasted URLs). **`POST /api/theory-inspector`** and **`POST /api/theory-inspector/suggest`** use that helper; **`GET /api/theory-inspector`** returns **`hasApiKey`** and **`hasCustomBaseUrl`**. Templates: **[`frontend/.env.example`](../frontend/.env.example)** and **[`.env.example`](../.env.example)** document **`OPENAI_API_KEY`** + **`OPENAI_BASE_URL`**; **`OPENAI_MODEL`** was **removed** from templates (optional override remains for Docker / `process.env` only). **[`frontend/next.config.ts`](../frontend/next.config.ts)** **`loadEnvConfig(appDir)`** loads all **`OPENAI_*`** from **`frontend/.env.local`**. **Troubleshooting:** a bare **`BASE_URL`** variable is **ignored** — the app only reads **`OPENAI_BASE_URL`** / **`OPENAI_URL`**. **Verification:** health JSON + streaming **`POST`** through a compatible gateway. **Current product gap (Iteration 3):** see **[Work log — LLM env…](#wl-llm-env-2026-04-20)** and **[Iteration3.txt](Iteration3.txt)** — progression-aware Inspector, localized voicing, genre/mode fidelity, expressive markings boundary — not blocked by env wiring. See also **[Program narrative — current failure / focus](#program-narrative-2026-04-20)**.
- **Document UX — chord gating, playback, pedagogy, tooltips (2026-04-20):** RiffScore **chord track / chord symbols** are shown and synced only when the score has **≥ 3 parts** (`shouldShowChordNotation` in [`riffscoreAdapter.ts`](../frontend/src/lib/music/riffscoreAdapter.ts), gated `chord` config / `chordTrack` / pull merge; [`RiffScoreEditor`](../frontend/src/components/score/RiffScoreEditor.tsx) `data-hf-chord-ui` + CSS hides `g.riff-ChordTrack` when off — avoids RiffScore’s misleading default chord hover on 1–2 staves). **Document** preview: [`AudioUnlockBanner`](../frontend/src/components/molecules/AudioUnlockBanner.tsx) under the header; **Play/Pause** as a floating control on the preview canvas with **`Tone.start()`** before RiffScore `play`; removed the old bordered footer (**bars · BPM** + play); **Re-upload** moved into the title block. [`GlassBoxPedagogyCallout`](../frontend/src/components/molecules/GlassBoxPedagogyCallout.tsx) copy tightened (baseline harmony = **algorithms**, AI = **Theory Inspector** explainer/critic only). [`EnsembleBuilderPanel`](../frontend/src/components/organisms/EnsembleBuilderPanel.tsx) **(i)** tooltips shortened for musicians + non-musicians; [`Tooltip`](../frontend/src/components/atoms/Tooltip.tsx) uses an **explicit width** so shrink-to-fit inside the 16px trigger no longer produces a tall, narrow popover. Vitest [`riffscoreAdapter.test.ts`](../frontend/src/lib/music/riffscoreAdapter.test.ts) covers 1/2/3-part chord behavior. See **[Work log — Document UX…](#wl-document-ux-2026-04-20)**. **`make test`:** **204** Vitest tests pass (as of this update).
- **Rest re-pitch, palette panel, PDF verification, export cleanup (2026-04-20 — evening):** MuseScore/Noteflight parity pass. Selecting a rest and typing **A–G** (or typing on a rest at the cursor) now restores a pitched note at the rest's **same duration**, octave inferred from neighbors — see [Work log — Palettes, rest repitch, clean export (2026-04-20)](#wl-palettes-repitch-2026-04-20). A new **SandboxPalettePanel** renders the full MuseScore taxonomy (Clefs, Key/Time, Barlines, Accidentals, Articulations & Ornaments, Dynamics, Lines, Repeats & Jumps, Tempo, Text, Tuplets, Breaths) wired through the existing `handleToolSelect` dispatcher; **F9** toggles the panel. `ExportPrintRoot` + `body.hf-printing-score` replace the blanket print CSS so PDF/Print output contains only the score (no toolbar, palette, bars strip, inspector). `ScorePreviewPane` now renders in `presentation` mode — PNG/export previews are score-only. `rasterizePdf` gained a unit test; `useClientPdfPreview` pages are now posted to `/api/to-preview-musicxml` as well, so PDF previews on Document get a parsed melody whenever the server can run OMR. **Verification:** 204/204 vitests pass (current suite; includes chord-gating adapter tests); `npm run lint` clean; `npm run build` green.
- **Repository hygiene & documentation (2026-04-20):** Removed legacy folders (`miscellaneous/chamber-music-fullstack/`, Azure/DO deploy scaffolding, duplicate frontend Dockerfile, root `node_modules`, Claude-flow tooling), consolidated design specs under **`docs/design/`**, added **`docs/archive/`** index, simplified **`.env.example`** (later extended: **`OPENAI_API_KEY`** + **`OPENAI_BASE_URL`** — see **[LLM env work log](#wl-llm-env-2026-04-20)**), tightened **`.gitignore`**, added **`.github/workflows/ci.yml`**. Updated root / `frontend` / `miscellaneous` / `docs` READMEs; repaired stale links in `plan.md`, `Taxonomy.md`, and `context/system-map.md`. See **[Work log — Repository hygiene & docs consolidation (2026-04-20)](#wl-repo-hygiene-2026-04-20)**.
- **Consolidation + PDF + residual sweep (2026-04-19):** Single-deployable Next.js app; engine under `frontend/src/server/engine/*`; PDF path: client `pdfjs-dist` + Docker OMR; **plan §1.9m resolved**. INTENT → `intentRouter.ts`; IDEA_ACTIONS + `staffIndex`; ADR 003 transpose slice; `make verify` green. See **[Work log — Consolidation + PDF + residuals (2026-04-19)](#wl-consolidation-2026-04-19)**.
- **Canonical handover:** **[Program narrative (2026-04-22)](#program-narrative-2026-04-22)**; full historical table in **[Program narrative (2026-04-20)](#program-narrative-2026-04-20)** (anchor `#program-narrative-2026-04-19` retained for old links).
- **Glass Box pedagogy (2026-04-19):** `GlassBoxPedagogyCallout` on Document (`EnsembleBuilderPanel`) and Theory Inspector — harmony generation = deterministic rules; conversational AI = Inspector only. See **[Work log — Glass Box pedagogy callouts (2026-04-19)](#wl-glass-box-pedagogy-2026-04-19)**.

### Last updated (2026-04-18; Iteration 1+2 study refinement)

- **Iteration 1+2 study refinement (2026-04-18):** Comprehensive pass addressing every friction point in [docs/iterations.md](iterations.md). Engine now emits proper tenor-treble clef (`G/2/-1`); harmony rhythm inherits melody onsets by default with selectable density (`chordal`/`mixed`/`flowing`); solver penalizes S==A octave doublings for voice independence; anacrusis is auto-detected from `implicit="yes"` or short measure 0 and drives implicit pickup output. Document page lifts mood/genre/instruments into a session-persistent store; Ensemble Builder adds a Harmony motion segmented control and plain-language tooltips (including SATB). Sandbox delete now replaces notes with same-duration rests (never alters neighbors); 8th+16th sequences rest-fill per beat boundary; RiffScore toolbar plugins show visible labels + shortcut hints; suggestion accept flushes pending edits first to avoid destructive overwrite. Theory Inspector gets empty-state starter prompts, a pinned Musical Goal field, an Edit-this-bar CTA that runs a region-scoped stylist pass, progressive disclosure for the rationale stack, honest INTENT-or-decline handling for action requests, and a near-bottom-guard scroll. Playback wraps Tone.start/Part creation in try/catch with a shared `useDestinationVolume` slider (default -6 dB, persisted to localStorage) on the sandbox header. Also fixed the pre-existing Next build type error on `riffscoreAdapter.toolbarPlugins` via a narrow cast so `make verify` is green.
- **Verification (2026-04-18):** `make verify` passes (backend 104 tests + lint + engine TS build + Next production build). Frontend vitest 70/71 pass (the lone failure, `needsEnginePreviewForExtension.test.ts`, predates this pass and is a documented baseline mismatch). `npm run lint` exits 0 with four pre-existing warnings.



- **Tactile Sandbox exports (2026-04-13):** All export formats in the modal now derive from the **live** score: **`getLiveScoreAfterFlush`** before reading Zustand; **`openExportModal`** snapshots **`scoreToMusicXML`** for preview + Score Review; toolbar copy/save/print/export use the same flush contract; coachmark **`setExportModalOpen(true)`** goes through the bridge so the tour sees fresh XML. **Formats shipped:** MusicXML, JSON, MIDI (**`scoreToMidi.ts`**, SMF type 1), PNG (**`html-to-image`** on export preview viewport), WAV (**`Tone.Offline`** + PCM16 in **`scoreToWav.ts`**), ZIP (**`fflate`**: XML + MID + JSON + server chord-chart), chord-chart (**`POST /api/export-chord-chart`**), PDF via **`window.print()`** + **`.hf-sandbox-print-target`** / **`.hf-print-hide`** in **`globals.css`**. **Deps:** `html-to-image`, `fflate`. **Tests:** `scoreToMidi.test.ts`. Full narrative: **[Work log — Tactile Sandbox exports (2026-04-13)](#wl-sandbox-exports-2026-04-13)**.
- **PDF / OMR (2026-04-19):** **[plan §1.9m](plan.md)** is **resolved** for product purposes (client preview everywhere; full OMR on self-hosted Docker). **Residual:** Vercel serverless still has no bundled oemer — by design ([deployment.md](deployment.md)). **Build:** `riffscoreAdapter.ts` narrow cast for patch-package `toolbarPlugins` remains the typing strategy until upstream types expose the field.
- **Symbolic intake (engine + frontend):** Broadened acceptance of **MusicXML / MIDI / MXL** when filenames lie (`.txt`, `.mxml`, extensionless, **MIDI without `.mid`**), aligned **Playground → Document** preview with **`POST /api/to-preview-musicxml`** for every extension except `.xml`/`.musicxml`, added **ZIP-as-`.xml`** handling on Document, shared **`musicXmlMarkers.ts`** (namespace-prefixed roots, inspired by **`newfiles/harmonize-core.ts`** validation), bounded UTF-8 sniff for binaries, **`extractEmbeddedMusicXml`** for prefixed close tags, **`readMelodyXml`** prefers server preview when present (reviewer arm + mislabeled ZIP). See **[Work log — Symbolic intake & MusicXML markers (2026-04-07)](#wl-intake-symbolic-2026-04-07)**.
- **`@tonejs/midi` under `tsx`:** Named ESM `import { Midi }` crashed **`make dev`** on Node 24; **`midiParser.ts`** now loads the package via **`createRequire(join(process.cwd(), "package.json"))`** (expects **`cwd` = `backend/`** — normal for **`make dev`** / Jest). Re-run **`npm run build:engine`** after changes.
- **Generate timeout / greedy SATB:** Document’s **120s** `AbortController` often fired while the engine had **no wall-clock cap** (`HF_SOLVER_MAX_MS` unset) and, worse, **greedy SATB only ran when N ≥ 56**, so many real scores (fewer chord slots) went **straight to backtracking** and could burn minutes. **Fix:** `auto` mode **always tries greedy first**; **generate-from-file** and **validate-from-file** default **~108s** solver `maxMs` when env is unset (set **`HF_SOLVER_MAX_MS=0`** to disable); frontend default generate timeout raised to **180s** with clearer copy (**PDF/OMR** vs symbolic file).
- **Holistic refinement docs sync:** **[Holistic refinement program](#holistic-refinement-2026-04)** consolidates end goal, phased approach, artifact table, and **current failure** (1.9m OMR first). [plan.md](plan.md) checklist + [docs/README.md](README.md) ADR index updated to match.
- **6-step product tour (Pencil / `newfiles`):** Replaced the 13-step minimal overlay with **portal spotlight** (`data-coachmark="step-1"`…`step-6`), **`useSandboxTourBridge`** (sandbox registers inspector/export setters), **tour bypass** on `/document` and `/sandbox` when `isActive`, **`/samples/tour_demo.xml`** seed for sandbox without prior generation, **`hf-coachmarks-v2`** persist including **`hasDismissed`**, **`completeOnboarding`** on skip/done, **`WelcomeGuideButton`** hidden when coachmarks enabled. See **[Work log — 6-step Pencil coachmark tour (2026-04-07)](#wl-coachmarks-6step-2026-04-07)**.
- **Theory Inspector — full session write-up:** See **[Work log — Theory Inspector: split panel, idea actions, ghost labels, apply fix (2026-04-06)](#wl-inspector-split-ideas-2026-04-06)** for end goal, approach, file-level steps, and **what was broken vs fixed** (IDEA_ACTIONS `noteId` / silent apply failure). **Residual risks** are listed there and in **[Current Focus](#current-focus)**.
- **Theory Inspector UX (shipped 2026-04-06):** Panel split (**note/recommendations** top, **chat** bottom); **`<<<IDEA_ACTIONS>>>`** JSON + Accept/Reject; **`NOTE_IDS_FOR_IDEA_ACTIONS`** in tutor evidence + **`resolveIdeaActionNoteId`** fallback + inspector debug line on failure; stylist ghost **always-visible pitch**; note-input **preview pitch** label; study log **`idea_action_accepted` / `idea_action_rejected`**.
- **Documentation overhaul (completed):** Root [README.md](../README.md) reworked (RiffScore-first, journey diagrams, Makefile, folder map). Per-folder guides: [frontend/README.md](../frontend/README.md), [miscellaneous/README.md](../miscellaneous/README.md), [.cursor/README.md](../.cursor/README.md), [docs/README.md](README.md). [plan.md](plan.md) gained reader-facing **Status at a glance** + **Current snapshot**; this file gained **How to read**, **Quick links** (with stable anchors), and **Last updated** stubs.
- **Second README pass (visual / onboarding):** Tables, ASCII + Mermaid diagrams, “start here” paths, plain-language callouts across the same README set.
- **Deployment playbook:** [deployment.md](deployment.md) — Vercel vs self-hosted Docker (single Next app; no separate API host).
- **Root `node_modules`:** Accidental installs at repo root are ignored (see root [`.gitignore`](../.gitignore)); canonical deps live in **`frontend/node_modules/`**.
- **Git workflow:** `origin/main` diverged from local once (remote “AI engine” description commit vs local README commit); reconciled with **`git pull --rebase origin main`** then **`git push`** — recommend `git config pull.rebase true` (or pass **`--rebase`** per pull) to avoid the “Need to specify how to reconcile” prompt.

**Holistic refinement (2026-04):** see **[Holistic refinement program](#holistic-refinement-2026-04)**. **Latest MVP slice:** **[Program narrative (2026-04-22)](#program-narrative-2026-04-22)**. **Symbolic intake** — **[Work log — Symbolic intake…](#wl-intake-symbolic-2026-04-07)**. **Sandbox exports** — **[Work log — Tactile Sandbox exports…](#wl-sandbox-exports-2026-04-13)**. **Iteration 1+2 + pedagogy:** **[Program narrative (2026-04-20)](#program-narrative-2026-04-20)**, **[Iteration 1+2](#wl-study-refinement-2026-04-18)**, **[Glass Box callouts](#wl-glass-box-pedagogy-2026-04-19)**. **Sharpest product-remaining risks:** deploy + study execution (see **2026-04-22** narrative), not a single blocking engine bug. **`@tonejs/midi`** loads via **`createRequire(import.meta.url)`** — no `cwd` requirement.

For checklist and verification steps, pair this file with **[plan.md](plan.md)** and **[README.md](../README.md)**.

<a id="wl-ux-team-playground-2026-04-24"></a>

## Work log — Cross-surface UX, team narrative & Playground stand (2026-04-24)

### End goal

- **Coherent product voice:** Playground, Document, Sandbox, and Team read like **one** product: Glass Box harmony, clear steps (**Playground → Configure → Sandbox**), and **transparent** people behind the tool.
- **Trustworthy first-run:** Upload stand is **legible** (no clipped copy), **inviting** (motion + musical glow, not a generic rectangle), and **accessible** (keyboard focus, reduced motion respected).
- **Team as narrative, not a brochure:** Dulf- and Shivam-first profiles, honest **complement vs distinct** story, **spec-driven** and **RAG / SOTA tooling** framed as **force multipliers** (NotebookLM, Google research surfaces) **not** load-bearing vendors; **product stack** once, at the bottom.

### Approach

- **Centralize chrome copy** in shared organisms (`DocumentHeader`, `SandboxHeader`, `AppFooterStrip`, `StepBar`, `DropzoneCopy`, `UploadPromptContent`, `ScorePreviewPanel`, `EnsembleBuilderPanel`, `GlassBoxPedagogyCallout`, `OnboardingModal`, `AudioUnlockBanner`, `WelcomeGuideButton`) rather than one-off strings only on pages.
- **Team route:** Client layout with scroll shell (`overflow-y-auto`), **Framer Motion** stagger, **ActionTooltip** on header controls, **`ProfileBody` collapsible** details (DOM kept mounted so quote expanders don’t reset), **`inert`** when collapsed, **Jump avatars**, footer nav, grouped **StackOverview** with deduped heading.
- **Playground stand:** Remove **`nowrap`** clipping inside SVG **`foreignObject`**; scale type responsively; **hover** drives **`hf-dropzone-interactive--hot`** + CSS stand/dash pulse; replace **rounded-rect box-shadow** with **blurred ♫ (U+266B)** layer + `hf-note-aureole-breathe`; **`useReducedMotion`** skips outer blur and pulse.

### Steps done (file-level)

| Area | Change |
|------|--------|
| **Atoms / tooltips** | **`ActionTooltip.tsx`**, **`Tooltip.tsx`** — portaled hover/focus, `useId`, `aria-describedby`; focus-without-`onFocusIn` DOM issues fixed. **`TeamNavButton.tsx`** — `target="_blank"`, `rel`, **`prefetch={false}`**, tooltip. |
| **Headers** | **`DocumentHeader.tsx`**, **`SandboxHeader.tsx`**, **`WelcomeGuideButton.tsx`**, **`CoachmarkTourButton.tsx`** — ActionTooltip on theme / welcome / tour / export / hotkeys / reset where applicable. |
| **Team route** | **`team/layout.tsx`** — scroll, **metadata / OpenGraph**; **`team/page.tsx`** — motion, **How we work together** after both profiles (before stack), solo-focused bios, **RAG + SOTA + NotebookLM + Google** copy (not vendor-dependent), **spec-driven development** (unbolded), conservative punctuation in that section, **Wand2** + sparkles hero, **collapsible** **`ProfileBody`** (`collapsible` prop), **Jump** copy, **TeamFooterNav** flavor, deduped **StackOverview** title. |
| **Flow labels** | **`StepBar.tsx`** — step 2 label **Configure** (was “Edit configuration”). **`AppFooterStrip.tsx`** — **Team** link to **`/team`** + focus ring; **`OpenSourceCreditsDialog`** unchanged. |
| **Playground** | **`page.tsx`** — **removed** subtitle under **HarmonyForge** (user request after A/B). **`DropzoneCopy.tsx`** — **`foreignObject`** padding/scroll, **`isHovered` + focus** → **`hf-dropzone-interactive--hot`**, **♫ aureole** layer, **`useReducedMotion`**, no rectangular hover shadow. **`UploadPromptContent.tsx`** — “**Bring your score**”, formats line with wrap-friendly sizes (iteratively enlarged). |
| **globals.css** | Stronger **hf-stand-hover-pulse**, **hf-dropzone-glow**, **`hf-note-aureole-breathe`**; **reduced-motion** disables stand/dash/note motion and **`--hot`** box-shadow (legacy safety). |
| **Document** | **`document/page.tsx`** — rhythm summary **period** not semicolon; coachmark/demo meta **·** separator; onboarding coachmark title/description polish. **`ScorePreviewPanel.tsx`** — “Score preview” kicker, **New file** button copy, letter-names line, `aria-label`s. **`EnsembleBuilderPanel.tsx`** — title **Harmony setup**, refreshed subtitles + classical footnote; **`GlassBoxPedagogyCallout.tsx`** — tighter Glass Box bodies. |
| **Sandbox header** | **`SandboxHeader.tsx`** — letter-names **HoverTooltip** copy simplified. |
| **Onboarding** | **`OnboardingModal.tsx`** — slide titles/bodies/CTA copy refresh. **`WelcomeGuideButton.tsx`** — tooltip mentions four slides. |
| **Audio** | **`AudioUnlockBanner.tsx`** — plainer unlock sentence. |

### Current failure / what we are working on now

- **No new failing automated gate** from this slice: **`make lint-frontend`** clean; **Vitest 273** passing when last run in-session.
- **Residual / verify manually:** **♫ aureole** depends on **serif + optional Noto Music** stack—on some Linux/minimal installs the glyph may **fallback or box**; mitigation if reported: swap to **inline SVG path** silhouette (no font). **Very short viewports:** dropzone content uses **`overflow-y-auto`** inside **`foreignObject`**; confirm no awkward double-scroll with page.
- **Program focus (pre-existing):** Same **Iteration 6** / study backlog as **[2026-04-23](#last-updated-2026-04-23)** — localized harmony range merge, touch without Alt-hover, inspector vs RiffScore selection drift, optional narrow export layout, stylist scope—**not introduced** by this UX tranche.

<a id="wl-team-credits-2026-04-23"></a>

## Work log — Team page & global credits (2026-04-23)

### End goal

- **Transparent authorship:** Surface the people behind HarmonyForge in line with **Glass Box** values—users should see **who** built the system, not only **what** it does.
- **Global discoverability:** A single, consistent entry point from **Playground** (`/`), **Document** (`/document`), and **Sandbox** (`/sandbox`) so “meet the team” is never hidden behind a deep link.

### Approach

- **Header control parity:** Small **people / `Users`** icon button using the same **`w-8 h-8`** bordered, **`hf-pressable`** pattern as **`CoachmarkTourButton`** (help / tour).
- **App Router page:** **`/team`** — **`PlaygroundBackground`**, compact header (logo links home, **Team** title, **`ThemeToggle`**), two profile **cards** with **`next/Image`** and semantic **`<blockquote>`** quotes.
- **Static assets:** Copy approved headshots from **`docs/CreatorPhotos/`** into **`frontend/public/creators/`** so **`next/image`** and deploys do not depend on `docs/` at runtime.
- **UX detail:** **`TeamNavButton`** is a client component that **`usePathname()`**-guards **`/team`** so the icon does not appear on the credits page itself.

### Steps done (file-level)

| Area | Change |
|------|--------|
| Nav | [`frontend/src/components/atoms/TeamNavButton.tsx`](../frontend/src/components/atoms/TeamNavButton.tsx) — `Link` → `/team`, `Users` icon, aria-label / title **Meet the team**. |
| Headers | [`DocumentHeader.tsx`](../frontend/src/components/organisms/DocumentHeader.tsx), [`SandboxHeader.tsx`](../frontend/src/components/organisms/SandboxHeader.tsx) — insert **`TeamNavButton`** after **`WelcomeGuideButton`**, before **`CoachmarkTourButton`**. |
| Route | [`frontend/src/app/team/layout.tsx`](../frontend/src/app/team/layout.tsx) — **`metadata`** (title, description). |
| UI | [`frontend/src/app/team/page.tsx`](../frontend/src/app/team/page.tsx) — **Dulf Vincent Genis** (lead backend / fullstack): pipeline, **`POST /api/*`**, engine integration, **context engineering**, **Cursor**; full bio + long quote (Professor Huang, direction vs infinite AI possibility, string quartet / Whitney Houston). **Shivam Patel** (lead frontend / fullstack): Next.js surface, RiffScore / inspector UX, **context engineering**, **Claude**; bio with **LinkedIn**, **UIUC**, **Microsoft** + quote on AI tools and continuing the project. |
| Assets | `frontend/public/creators/dulf.jpg`, `shivam-patel.jpg` (from **`Dulf.jpg`**, **`Shivam_Headshot.JPG`** in `docs/CreatorPhotos/`). |

### Current failure / open work

- **This slice:** No failing lint or tracked regression attributable to the team page; verify in-browser once per deploy (images 404 if `public/creators` omitted from artifact).
- **What we are still working on (program):** Same **Iteration 6 / study** backlog documented in **[Iteration6.txt](Iteration6.txt)** and **[Work log — Iteration 6 (2026-04-23)](#wl-iteration-6-2026-04-23)** / **[Sandbox fluidity (2026-04-23)](#wl-sandbox-fluidity-2026-04-23)** — notably **localized `generate-harmony-range` merge** when parts or alignment disagree with ensemble config, **touch** affordances without **Alt**-hover, **Theory Inspector** vs native **RiffScore** selection drift after regenerate, optional **export** narrow-viewport stack, and **stylist / suggestion scope** (breadth of structural interventions, concise explanations) per participant feedback.

<a id="wl-iteration-6-2026-04-23"></a>

## Work log — Iteration 6 product improvements (2026-04-23)

Shipped from **[Iteration6.txt](Iteration6.txt)** / study feedback: **pedal bass** (`bassRhythmMode` in engine + Document Ensemble Builder + `satbToMusicXML` per-voice density), **expanded instrument lists** and **VoiceDropdown** family keywords, **Theory Inspector** **Guided / Concise** (`setExplanationLevel` + tighter **`prompts.ts`** caps + stylist **duration / texture** guidance), **Sandbox** inspector **Dock / Float** (`localStorage` `hf-inspector-dock`) + **Alt+click** bar numbers to select all notes in the active staff for that measure (`noteSelectionsForMeasurePart`), **chat** prepends a **multi-select FACT** line when `useToolStore.selection.length > 1`, **Document** body stacks **preview above ensemble** on narrow widths (`flex-col md:flex-row` + scroll), **localized harmony** via **`POST /api/generate-harmony-range`** + **`sliceParsedScoreToMeasureRange`** + **`spliceHarmonyMeasuresFromAddonScore`** wired from **Theory Inspector** “regenerate bar” / region action (still runs stylist region suggest after). **Iteration6 §1 (interface fluidity)** — multi-select pitch, inspector float **resize**, global press/motion tokens, action bar removal — is written up in **[Sandbox fluidity (2026-04-23)](#wl-sandbox-fluidity-2026-04-23)**. Tests: **`measureRangeSlice.test.ts`**, **`filePipeline`** bass-pedal case; full frontend Vitest **258** as of **2026-04-23**.

<a id="wl-sandbox-ux-polish-2026-04-23"></a>

## Work log — Sandbox & export polish (2026-04-23)

### End goal

- **Sandbox UX that survives real scores and real keyboards:** the **rest-hover ghost** (MuseScore-style rest → pitched note without picking a duration first) must not throw **invalid layout** (`NaN` CSS) or feel “janky”; **documented hotkeys** must match **actual** `keydown` behavior (including **Caps Lock**, **numpad**, and **unicode minus**).
- **Exports that read as “paper”:** modal preview and **PNG** capture use a consistent **light score paper** (`#F8F3EA`) even when the OS or app theme is dark; RiffScore **`presentation`** mode stays visually aligned with that intent.
- **Selection parity:** when the user **marquee-selects**, **shift-extends**, or uses **⌘/Ctrl+A** in RiffScore, HarmonyForge’s tool/store selection (`useToolStore`) stays aligned so **joint drag**, **palette** typing, and **Esc** clear behave as one system.
- **Correct staff clef in RiffScore:** **Viola** (and any part whose canonical clef is **alto C-clef**) must render with **alto staff clef** in the adapter path — not treble due to conflating the word **“alto”** with the **SATB alto voice** default.
- **Correct *placement* on alto/tenor staves:** generated **additive viola** (and any **alto** or **tenor C-clef** staff) must show **noteheads and learner letter labels** that agree with **concert/written pitch** — not treble-line geometry under a C-clef (the engine/MusicXML path was already emitting sensible pitches and `<clef><sign>C</sign><line>3</line></clef>` for viola; the defect was in **RiffScore vertical layout**).
- **Stable patched editor bundle:** no **ReferenceError** from removed **`pendingClefChange`** state when Turbopack or dual **CJS/ESM** resolution loads **`riffscore`**; HarmonyForge **`toolbarPlugins`** must work on both **`dist/index.mjs`** and **`dist/index.js`** after **`patch-package`**.

### Approach

1. **Geometry guards first** — staff anchor Y and staff-line Y arrays must yield **finite** numbers before they become CSS `top`/`left`; use **`Number.isFinite`**, drop non-finite line Ys, and fall back to **`midStaffDiatonicPitchInContainer`** instead of a blind **`C4`** when the staff model is ambiguous.
2. **Hook stability** — keep rest-hover **`useEffect`** on **primitive dependencies** only; push latest score/positions/commit callbacks through **refs** updated each render so listeners do not churn or close over stale data.
3. **Physical-key hotkeys** — prefer **`KeyboardEvent.code`** where layout-independent behavior matters; document the matrix in **`SandboxHotkeysDialog`** and mirror it in **`sandbox/page.tsx`**.
4. **Export surface** — force **`presentation`** + **LIGHT** styling for the export preview subtree; match **PNG** raster background to the same paper token.
5. **Selection mapping** — implement **`mapRiffSelectedNotesToHFSelections`**, wire **`onEditorSelectionChange`**, and expose **`editorSelectAll` / `editorDeselectAll`** so session code can clear or select both sides together.
6. **Clef semantics (HF → RiffScore config)** — treat **`hfClefToRs`** input as **staff clef** (`treble`, `bass`, `alto`, `tenor`); remove **`PART_CLEF_MAP`** voice-default logic that incorrectly forced **`alto` → treble** for viola; map legacy **`soprano` → treble** only.
7. **Clef semantics (RiffScore internals)** — patch **`node_modules/riffscore/dist/*.js`** so **`getOffsetForPitch`** uses the **treble** pitch→offset table only for **`treble`**, **`grand`**, or default clef, the **bass** table only for **`bass`**, and the **`CLEF_REFERENCE`** diatonic formula for **`alto`** and **`tenor`**; patch **`getPitchForOffset`** to invert alto/tenor with **`movePitchVisual`** instead of the treble **`Y_TO_PITCH`** map.
8. **Patch-package hygiene** — keep **`ScoreProvider`** / **`ScoreEditorContent`** changes consistent (no **`pendingClefChange`** in context or JSX); mirror **`toolbarPlugins`** wiring on **`index.js`** the same as **`index.mjs`**; regenerate **`frontend/patches/riffscore+1.0.0-alpha.9.patch`**; document **`rm -rf .next`** after pull when the editor throws stale **`pendingClefChange`** errors.

### Steps completed (file-level)

| Area | What changed |
|------|----------------|
| **Rest-hover ghost** | **`RiffScoreEditor`**, **`ScoreCanvas`**, **`riffscorePositions.ts`** / pitch helpers — larger Bravura ghost, center-based layout, expanded commit hit box, **`NaN`** guards; effect deps + ref pattern for stable listeners. |
| **Hotkeys** | **`SandboxHotkeysDialog`**, **`sandbox/page.tsx`** — Caps Lock–safe behavior, `e.code` for `[/]`, digits, numpad, minus variants. |
| **Export modal** | Paper background **`#F8F3EA`**, **`presentation` → LIGHT**, PNG uses same paper (not system dark). |
| **Multi-select** | **`mapRiffSelectedNotesToHFSelections`**, **`onEditorSelectionChange`**, **`editorSelectAll` / `editorDeselectAll`**, ⌘A / Esc parity. |
| **Viola / alto clef (adapter)** | **`riffscoreAdapter.ts`** — **`hfClefToRs`** staff-clef interpretation; **`riffscoreAdapter.test.ts`** — *maps viola alto C-clef to RiffScore alto staff*. |
| **Viola / alto & tenor (RiffScore layout)** | **`patches/riffscore+1.0.0-alpha.9.patch`** — **`getOffsetForPitch`** / **`getPitchForOffset`** in **`dist/index.js`** and **`dist/index.mjs`** so **alto/tenor** staves use **C-clef geometry**, not the treble offset table. |
| **CJS / ESM parity + `pendingClefChange`** | Same patch — **`Toolbar`** accepts **`toolbarPlugins = []`** and renders plugin row; **`ScoreEditorContent`** / **`RiffScoreInner`** pass **`config.ui.toolbarPlugins`** on **`index.js`** as well as **`index.mjs`**; **`ScoreProvider`** uses **`SetSingleStaffCommand`** when collapsing grand staff (no dialog state). |

### Current failure / what we are working on now

- **Recently addressed (2026-04-23 late):**
  - **“Wrong notes” on generated viola** — **MusicXML + HF** were already correct; **RiffScore** placed pitches using **treble Y-offsets** on **alto/tenor** staves. **Fixed** in **`patches/riffscore+1.0.0-alpha.9.patch`** (see **Approach §7** above).
  - **`ReferenceError: pendingClefChange is not defined`** (stack often pointed at **`RiffScoreEditor`** / dynamic **`RiffScore`** mount) — caused by **removed** React state while a **stale Turbopack chunk** or **CJS `index.js`** path did not match the patched **`index.mjs`**. **Mitigation:** **`toolbarPlugins`** parity on **`dist/index.js`**, full **`patch-package`** regenerate, and **`cd frontend && rm -rf .next && npm install`** after pulling.
- **Still open — validation and edge cases (non-blocking):**
  - **Dense notation & chords** — rest hit order, ghost pitch vs RiffScore’s own preview, chord-heavy layouts.
  - **Theory Inspector overlay** — **`noteInspectionEnabled`** disables the ghost by design; confirm **native RiffScore selection** vs **HF overlay** do not **drift** during multi-select or inspector-driven focus.
  - **Touch / tablet** — **no hover**; rest → note still relies on **select + A–G** (and related paths); optional future **long-press** or explicit control if study feedback requires it.
  - **Spot-check** — multi-staff scores with **viola**, **tenor C-clef**, or other **alto/tenor** layouts after the layout patch.
- **Lint (carryover from 2026-04-22):** **`@next/next/no-img-element`**, unused **`_e`** in **`RiffScoreEditor`** **`handleKeyDown`** — warnings only unless CI is tightened.

---

<a id="wl-sandbox-fluidity-2026-04-23"></a>

## Work log — Sandbox fluidity, multi-select pitch, inspector resize, UI polish (2026-04-23)

This section records the **interface fluidity** tranche aligned with **[Iteration6.txt](Iteration6.txt) §1** (*non-blocking panels*, *multi-note selection/editing*, *less clunky chrome*) and the engineering follow-through in code. It sits **after** the **rest ghost / export / clef** tranche in **[Sandbox & export polish (2026-04-23)](#wl-sandbox-ux-polish-2026-04-23)** and complements **[Iteration 6](#wl-iteration-6-2026-04-23)** (engine + inspector dock/float + prompts).

### End goal

- **Expressive sovereignty in the UI:** the musician can **edit the score while the Theory Inspector stays available** — floating inspector, resizable panel, and fewer modal “walls” that feel like hard stops.
- **Multi-note workflows:** **arrow keys** and **vertical drag** move **all selected notes** together when RiffScore collapses selection during drag; palette pitch tools, **A–G**, and accidentals respect the same **pitch group**.
- **Less clunky chrome:** softer overlays (blur + tint), **modal enter** motion, **toast/banner** motion, consistent **press feedback** (`hf-pressable`), smoother **StepBar** transitions, and lighter **inspector** shadows/borders so panels do not read as stacked “cards on cards.”
- **Simpler sandbox header region:** remove the redundant **View/Edit + Undo/Redo/Delete** strip; sandbox stays in **edit** notation; power users rely on **hotkeys**, **RiffScore** toolbar, and **palette**.

### Approach

1. **Preserve multi-select through RiffScore drag collapse** — keep a **`pitchGroupRef`** and **`getPitchGroupNoteIds()`** in **`RiffScoreEditor`** so HarmonyForge still knows the full set when the editor reports a single note mid-gesture.
2. **Single sync pipeline** — extend **`useRiffScoreSync`**: merge **`api.getSelection()`** (mapped to HF ids) with **tool store** selection and the **pitch group**; **`propagateMultiSelectPitchDelta`** for live moves; **`syncMultiPitchFromBaseline`** / **`resetMultiPitchDragSync`** against a frozen baseline; dedupe with **`noteSetPitchFingerprint`** in **`scoreUtils.ts`**.
3. **Sandbox dispatch** — wire **arrows**, **A–G**, palette pitch, and accidentals through **`getPitchGroupNoteIds()`** where applicable.
4. **Inspector layout** — **float** mode: persisted **`{ left, top, width, height }`** in **`INSPECTOR_FLOAT_POS_KEY`**, **`clampInspectorFloatLayout`**, **`applyFloatResizeDelta`**, edge/corner handles on **`sandbox/page.tsx`**; sync width when docking; outer wrapper **`overflow-visible`** with inner clip for panel content.
5. **Design tokens in CSS** — **`globals.css`**: **`.hf-pressable`**, **`.hf-modal-animate`**, **`.hf-backdrop-animate`**, **`.hf-toast-animate`**, **`.hf-banner-animate`**, **`.hf-overlay-backdrop`**, **`.hf-scroll-smooth`**, with **`prefers-reduced-motion`** guards.
6. **Targeted component polish** — apply tokens to **Export**, **hotkeys**, **workspace reset** modals; **AudioUnlockBanner**; **TheoryInspectorPanel** scroll regions + shadow; **StepBar** pill/connector transitions; sandbox **note-explain** toast and **expressive sovereignty** callout; **Export** preview/options panes (corner radius, close control).

### Steps completed (file-level)

| Area | What changed |
|------|----------------|
| **Multi-select pitch** | **`RiffScoreEditor.tsx`** — `pitchGroupRef`, `getPitchGroupNoteIds`, pointer baseline + rAF **`pointermove`** sync, pointer-up flush; **`useRiffScoreSync.ts`** — selection merge, multi-pitch delta propagation, baseline sync helpers; **`scoreUtils.ts`** — **`noteSetPitchFingerprint`**; **`sandbox/page.tsx`** — group-aware arrows / letters / palette / accidentals. |
| **Sandbox chrome** | **`SandboxActionBar`** removed from **`sandbox/page.tsx`**; component deleted; **`notationMode`** fixed **`"edit"`** (no in-page View toggle). |
| **Floating inspector** | **`sandbox/page.tsx`** — float size state, resize handles, persist with position; **`setInspectorDockModePersisted`** width sync. |
| **Global interaction tokens** | **`globals.css`** — pressable, modal/backdrop/toast/banner animations, overlay backdrop, smooth scrolling. |
| **Modals** | **`ExportModal.tsx`**, **`SandboxHotkeysDialog.tsx`**, **`WorkspaceResetModal.tsx`** — animated backdrop, modal enter, Escape/outside dismiss where added, scroll smoothing. |
| **Banners / toasts** | **`AudioUnlockBanner.tsx`** — banner animation, responsive layout, pressable buttons; **`sandbox/page.tsx`** — note-explain toast + expressive callout use motion/softer borders. |
| **Inspector & nav polish** | **`TheoryInspectorPanel.tsx`** — lighter box-shadow/border, **`hf-scroll-smooth`** on scroll areas; **`StepBar.tsx`** — transition-based hover/active, softer connectors; **`ScorePreviewPane.tsx`** / **`ExportOptionsPane.tsx`** — 12px corners, softer divider, **`hf-pressable`** close on export options. |
| **Export modal layout** | Reverted experimental **stacked** (`flex-col` / `dvh`) body to **stable fixed row** (`1200×700`, `max-w`/`max-h`) after layout regression risk; kept softer border, shadow, and enter animation. |

### Current failure / what we are working on now

- **Automated tests:** **`cd frontend && npx vitest run`** — **258** tests passing as of **2026-04-23** (including **`ideaActionResolve.test.ts`**). There is **no** current CI-blocking unit failure tracked for this tranche; an earlier handoff mentioned **`Measure` `id`** typing in tests — **not** reproducing in the current tree.
- **Product / QA gaps (non-blocking, Iteration6-aligned):**
  - **Localized harmony merge** — **`POST /api/generate-harmony-range`** / client splice when **part counts** differ from config; **pickup** and **multi-bar** ranges.
  - **Touch & tablets** — no **Alt+bar** hover equivalent; no **rest ghost** hover; multi-select and inspector float rely on **pointer** assumptions.
  - **Optional responsive export** — a future pass can stack preview + options on narrow viewports with **`min-h-0` / flex** discipline (intentionally **not** shipped here to avoid export regression).
  - **Manual validation** — multi-select **drag + keyboard** across staves; **inspector float** resize + reload persistence; **modals** (export, hotkeys, reset) on small laptop screens.
  - **Lint debt (carryover):** **`@next/next/no-img-element`**, unused **`_e`** in **`RiffScoreEditor`** — warnings unless **`verify-strict`** tightens.

---

<a id="program-narrative-2026-04-22"></a>

## Program narrative — MVP polish bundle (2026-04-22)

**Prefer [Sandbox & export polish (2026-04-23)](#wl-sandbox-ux-polish-2026-04-23) for the latest sandbox/export/selection/clef tranche.** This section remains the **2026-04-22 MVP + Inspector bundle** handover. The [2026-04-20 narrative](#program-narrative-2026-04-20) below remains valid for historical context; this entry **adds** what shipped in the **HarmonyForge multi-phase MVP pass** (Theory Inspector UX, Document/ensemble, engine pickup, sandbox navigation, lint fix). **Same-day follow-on:** [Sandbox score UX — rest hover ghost](#wl-sandbox-score-ux-2026-04-22) (hotkeys, paste/insert on rest, chrome tweaks).

### End goal (unchanged in spirit)

- **Glass Box co-creative arranger:** deterministic **harmony engine** + transparent **Theory Inspector** (LLM for explanation, audit, suggestions) — user keeps **expressive sovereignty**; pedagogy stresses **algorithms vs generative AI** on Document and in Inspector.
- **Flow:** Upload → Document (preview + config) → Generate → Sandbox (RiffScore, playback, export, Inspector).
- **Research / study:** M5 instrumentation; Iteration 3 feedback themes (progression-aware tutoring, sovereignty) still guide **quality**, not a single deploy blocker.

### Approach (this bundle)

1. **Ship vertical slices in the live app** — UI + API + engine + tests in one PR-sized tranche; prefer **Zustand** + **existing routes** over new services.
2. **Inspector = two mental modes** — **Explanation** (note-anchored, violations/suggestions) vs **Chat** (free conversation + tag strip); keep **FACT blocks** as ground truth for the tutor.
3. **Config crosses pages** — generation choices persist in **`localStorage`** so Playground ⇄ Document ⇄ Sandbox stay consistent.
4. **Optional LLM env** — **`OPENAI_API_KEY`** only is enough for default OpenAI; **`OPENAI_BASE_URL`** remains optional (gateways) — see [LLM env work log](#wl-llm-env-2026-04-20) and **`frontend/.env.example`**.

### Steps completed (2026-04-22 tranche)

| Area | Shipped |
|------|---------|
| **Theory Inspector** | **Explanation \| Chat** tabs; **AI chat tags** (seed + streamed merge, dismiss); **default tutor depth** fixed to **beginner** ( **`useTheoryInspectorStore.explanationLevel`**, no user toggle); **prompts** — beginner **thorough but concise**; **B/S/P header control removed**; **suggested chats** strip **above the composer** (not in scroll); note-explain **`Promise<boolean>`** + **toast** when insight/stream fails; **measure / part focus** + **“Regenerate this bar”** CTA with structured **`onEditFocusedRegion`** payload; progression **FACTs** — **`buildProgressionWindowFacts`** widened to **±3** indices + tests. |
| **Document / Ensemble** | **Advanced** block: **pickup 0–3** (beats) + **prefer inferred chords**; **terminology** — accompaniment, **Chordal (slow)** / **Flowing (active)**, **4-part harmony** header; **`rhythmSummary`** on **`ScorePreviewPanel`**; **POST `config`** includes **`pickupBeats`** / **`preferInferredChords`** when set. |
| **Engine** | **`GenerationConfig.pickupBeats`**; **`parseConfig`** (0–3); **`runGenerateFromFile`** overlays pickup on parsed score before **`ensureChords`**; **`parseConfig`** Vitest in **`filePipeline.test.ts`**. |
| **Generation config store** | **`useGenerationConfigStore`** — **`persist` + `localStorage`** (replaces ad hoc session persistence); tests updated. |
| **Sandbox / nav** | **`SandboxHeader`** — **Back to configuration** (`/document`), **Reset** → **`WorkspaceResetModal`**; **`useUploadStore`** — **`workspaceBaselineXml`**, **`resetWorkspaceToBaseline`**, **`setFile`** clears stale session XML; **`OnboardingOverlay`** + **`hf_onboarding_seen`** for first sandbox visit; **arrow keys** — horizontal **edit cursor** when no selection (not only note-input mode). |
| **Instruments UI** | **`VoiceDropdown`** — group by **Voices / Woodwinds / Brass / Strings** + inline **SVG** icons (see lint warnings below). |
| **Playback** | **`usePlayback`** — try/catch around **`Transport.start`** / stop path hardening. |
| **RiffScore editor** | **Rules of hooks** — palette **`useCallback`** hooks moved **above** `if (!score \|\| !config) return null`; **`npm run lint`** **exits 0**. |
| **Expressive sovereignty** | Generation path audited — **no stray `<dynamics`** in **`satbToMusicXML`**; existing pipeline test expectation retained. |
| **Sandbox score UX (2026-04-22 late)** | **Rest hover ghost** — `pointermove` hit-test via **`pickRestHitAt`** + **`pitchAtStaffVerticalInContainer`**; commit uses rest **`duration`/`dots`** (`handleRestInputCommit` + **`insertNote`** replace path). **Insertion/paste** — rest slot = replace in **`resolveInsertionTarget`**, **`pasteNotes`**, **`scoreUtils.insertNote`**. **Hotkeys** — capture listener + **`isTypingTarget`**. **Chrome** — **`ConfigurationBackFAB`**, **`StepBar`** labels, reset modal + baseline re-hydrate. Details: **[Work log — Sandbox score UX](#wl-sandbox-score-ux-2026-04-22)**. |

### Current failure / what we are working on now

**No blocking lint error.** **`npm run lint`** completes with **warnings** (non-fatal):

- **`@next/next/no-img-element`** — **`VoiceDropdown`** instrument glyphs and **`RiffScoreEditor`** instrument strip use raw **`<img>`**; optional migration to **`next/image`** or a shared optimized component.
- **`@typescript-eslint/no-unused-vars`** — **`handleKeyDown`** in **`RiffScoreEditor`** uses **`_e`**; trivial rename or eslint-disable for the placeholder.

**Active validation gap (rest hover ghost):** Feature is **shipped in code** but **not fully battle-tested**. Risks to exercise manually (or follow up with tests where feasible):

- **Touch / tablet** — no **hover**; users still have **select rest + A–G** and keyboard paths; consider **long-press** or explicit **“replace rest”** if study feedback demands it.
- **Hit-test ambiguity** — dense notation or **overlapping** overlay boxes may pick the wrong rest iteration order (`pickRestHitAt` walks **`notePositions`** in array order).
- **Pitch mapping** — **`pitchAtStaffVerticalInContainer`** may drift on unusual layouts, **multi-staff zoom**, or **extreme ledger lines**; compare to RiffScore’s own note-input preview when a duration tool *is* active.
- **Inspector mode** — ghost is **disabled** when **`noteInspectionEnabled`** so inspector hit targets win; confirm this matches participant expectations.

**Product / research “failures”** (problems we are still **improving**, not crashes):

- **Iteration 3 debt** — tutor quality on **progressions** vs isolated chords; **IDEA_ACTIONS** edge cases; M5 **study execution**.
- **Partial exports** — palette metadata on **`EditableScore`** not fully mirrored in **`scoreToMusicXML`** (pre-existing).
- **Optional:** resolve **`no-img-element`** warnings for stricter CI or LCP budgets.

**Verification:** **`cd frontend && npm test`** — **231** Vitest tests passing as of this update (run locally after **`npm install`**); **`riffscorePositions.test.ts`** covers rest-position helpers used by the hover path.

---

<a id="wl-sandbox-score-ux-2026-04-22"></a>

## Work log — Sandbox score UX: hotkeys, reset, rest hover ghost (2026-04-22)

### End goal

- **MuseScore / Noteflight-style editing** on **`/sandbox`**: user can turn a **rest** into a **pitched note** with **minimal mode friction** — specifically **without** having to pick a **duration** in the toolbar first, while still preserving the rest’s **written duration** (and dots) on commit.
- **Secondary:** cleaner **navigation** (back to configuration off the crowded header), **reset-to-baseline** with correct **re-hydration**, **keyboard** behavior that does not fight **RiffScore** or **text fields**, and **paste/insert** semantics that **replace** a rest instead of inserting **before** it.

### Approach

1. **Canonical model first** — keep **`EditableScore`** + **`insertNote`** (`scoreUtils.ts`) as the single write path; the **replace-rest** branch already **splices** one new note when `measure.notes[i]?.isRest`.
2. **Geometry from RiffScore DOM** — extend **`extractNotePositions`** / **`riffscorePositions.ts`** so **rests** get stable **`x,y,w,h`** (including **`rect[data-testid^="note-"]`** when there is no **`NoteHead`**).
3. **Pitch from staff Y** — reuse **`pitchAtStaffVerticalInContainer(container, score, staffIndex, y)`** so the ghost **tracks vertical mouse position** on the staff.
4. **Hover layer** — `pointermove` on the editor **`containerRef`** (rAF-throttled), **`pickRestHitAt`** for padded bbox hit-test, **`data-hf-rest-ghost-root`** so moving onto the **commit button** does not clear the hover state; **`pointerleave`** clears.
5. **Avoid listener churn** — **`scoreHoverRef`** + **`notePositionsHoverRef`** so scroll/resize position updates do not detach/reattach handlers every frame.
6. **Hotkeys** — **capture-phase** `keydown` where needed, **`isTypingTarget`** to skip **Delete/Backspace** when editing text; delegate **arrows** to RiffScore’s native behavior where it conflicts with global handlers.

### Steps completed (file-level)

| Step | What changed |
|------|----------------|
| **Insertion / paste on rest** | **`resolveInsertionTarget`** in **`sandbox/page.tsx`** — if selection/cursor is on a **rest**, target **`noteIndex`** is the rest itself (not `+1`) so **`insertNote`** hits the **replace** path. **`pasteNotes`** in **`useScoreStore.ts`** — paste onto a **rest** **replaces** that slice instead of inserting before. |
| **Positions + pitch** | **`riffscorePositions.ts`** — rest positions from note-group rects; **`pitchAtStaffVerticalInContainer`**; tests in **`riffscorePositions.test.ts`**. |
| **Hover ghost + commit** | **`RiffScoreEditor.tsx`** — **`pickRestHitAt`**, **`restHoverGhost`** state, pointer listeners; ghost **not** gated on **`noteInputPitchLabelEnabled`** (duration tool). **`ScoreCanvas.tsx`** forwards **`onRestInputCommit`**. |
| **Commit uses rest rhythm** | **`sandbox/page.tsx`** — **`handleRestInputCommit`** reads **`duration` / `dots`** from the **rest slot**; falls back to toolbar **`durationForInput`** only if the slot is not a rest. |
| **Hotkeys / typing** | Capture-phase handling + **`isTypingTarget`**; gate **Delete/Backspace**; align tool-store **plain click** behavior with spec. |
| **Reset + onboarding** | **`WorkspaceResetModal`**, **`OnboardingOverlay`**; **`hydrateSandboxFromMusicXml`** (or equivalent) after **`resetWorkspaceToBaseline`** so the canvas matches baseline XML. |
| **Header / chrome** | **`SandboxHeader`**, **`StepBar`** (full labels), **`ConfigurationBackFAB`**, **`AppFooterStrip`** — less crowded header; **back** control at score corner. |
| **Hints** | Selected-rest hint copy updated to mention **hover + click** and **A–G** (no “pick duration tool first” requirement for the ghost path). |

### Current failure / what we are working on now

- **Not a runtime crash** — the open work is **validation and polish** on the **hover ghost** path (see **[Program narrative (2026-04-22) — Current failure](#program-narrative-2026-04-22)**): **touch** parity, **hit-test** ordering in dense scores, **pitch** accuracy vs RiffScore’s native preview, and **Inspector** mode interaction.
- **Lint** — same **warnings** as the rest of the **2026-04-22** bundle (`no-img-element`, unused **`_e`**).

---

<a id="wl-mvp-phase-ship-2026-04-22"></a>

## Work log — MVP phase: Document, Sandbox, Theory Inspector (2026-04-22)

### End goal

Close a **coherent MVP slice**: Inspector chat/explain UX, persisted ensemble config, engine honoring **user pickup**, sandbox **reset + wayfinding**, **progression-aware** tutor facts, and **CI-clean** hooks — without expanding scope into new backends.

### Approach

- **Reuse** existing stores, API routes, and **`prompts.ts`**; add fields to **`GenerationConfig`** / **`parseConfig`** rather than new endpoints where possible.
- **Test** new engine parsing and **`noteExplainContext`** progression helpers in Vitest.

### Files touched (reference)

| Topic | Paths (representative) |
|-------|-------------------------|
| Inspector UI | `frontend/src/components/organisms/TheoryInspectorPanel.tsx`, `useTheoryInspector.ts`, `useTheoryInspectorStore.ts`, `theoryInspectorTags.ts` |
| Tutor prompts | `frontend/src/lib/ai/prompts.ts`, `explanationLevel.ts` |
| Note facts | `frontend/src/lib/music/noteExplainContext.ts`, `noteExplainContext.test.ts` |
| Document | `frontend/src/app/document/page.tsx`, `EnsembleBuilderPanel.tsx`, `ScorePreviewPanel.tsx` |
| Engine | `frontend/src/server/engine/types.ts`, `runtime.ts`, `filePipeline.test.ts` |
| Config persistence | `frontend/src/store/useGenerationConfigStore.ts`, `.test.ts` |
| Sandbox | `frontend/src/app/sandbox/page.tsx`, `SandboxHeader.tsx`, `OnboardingOverlay.tsx`, `WorkspaceResetModal.tsx` |
| Upload | `frontend/src/store/useUploadStore.ts` |
| Voice UI | `frontend/src/components/molecules/VoiceDropdown.tsx` |
| Playback | `frontend/src/hooks/usePlayback.ts` |
| RiffScore | `frontend/src/components/score/RiffScoreEditor.tsx` |
| Onboarding keys | `frontend/src/lib/onboarding.ts` |

### Current failure / next

Same as **[Program narrative (2026-04-22) — Current failure](#program-narrative-2026-04-22)**: **warnings-only lint**, Iteration **3 / study** quality work, optional **`<Image>`** migration.

---

<a id="program-narrative-2026-04-20"></a>
<a id="program-narrative-2026-04-19"></a>

## Program narrative — where we are (2026-04-20)

This section is the **handover-friendly summary**: end goal, approach, what has landed (including repo hygiene), and **what we are focused on next** — not necessarily a single “broken” subsystem. Detailed file-level notes live in the dated **work logs** below. *(Anchor `#program-narrative-2026-04-19` still resolves here for older links.)*

### End goal

- **Product flow:** **Upload → Document** (preview + ensemble config) → **Generate Harmonies** (or **melody-only** continuation in the M5 reviewer arm) → **Sandbox** with RiffScore editing, playback, exports, and the **Theory Inspector**.
- **Glass Box stance:** **Harmony generation** is **deterministic** — theory rules, constraints, and search over voicings — not an LLM inventing parts. **Conversational AI** is scoped to the **Theory Inspector** (explain, audit, stylistic suggestions). **In-app pedagogy:** [`GlassBoxPedagogyCallout.tsx`](../frontend/src/components/molecules/GlassBoxPedagogyCallout.tsx) on Document and Inspector, plus an **always-visible** one-line disclosure on **Document** under the Ensemble Builder heading (algorithms vs AI; Inspector-only AI) so the stance is not hidden when the collapsible callout is collapsed.
- **Research objectives** ([plan.md](plan.md) § Objective): **expressive sovereignty**, **copyright-safe axiomatic theory**, **pedagogical transparency**.
- **M5 user study:** **RQ1** / **RQ2** instrumentation in-app; optional logging — [plan.md — M5](plan.md#m5--user-study-rq1--rq2--app-instrumentation). Condensed participant feedback: [iterations.md](iterations.md).

### Approach

1. **Single Next.js deployable:** The **engine** lives in **`frontend/src/server/engine/`** and is imported by **`/api/*` route handlers** — no separate Express service, no `NEXT_PUBLIC_API_URL`, no CORS split. Optional **root `Dockerfile`** for self-hosted full PDF/OMR.
2. **Prove changes with tests:** **Vitest** covers UI and engine (`frontend/src/**/*.test.ts`, `src/server/engine/**/*.test.ts`). **`make verify`** = test + lint + build.
3. **Two PDF stories:** (a) **Browser:** `pdfjs-dist` + `useClientPdfPreview` so Document always shows a raster preview. (b) **Server:** pdfalto + Poppler + **oemer** on Docker or a equipped host; client may attach **PNG page images** for multi-page merges (`mergeParsedScores`).
4. **Log work in dated slices:** Consolidation, symbolic intake, exports, Iteration 1+2, Glass Box copy, **repo hygiene (2026-04-20)** — each has a **work log** section so history does not depend on chat transcripts.
5. **Risk ordering:** Symbolic paths first for reliability; PDF/OMR as **environment-dependent** capability ([plan §1.9m](plan.md) **shipped** with platform caveats).

### Steps completed so far (consolidated)

| Area | What it means (pointers) |
|------|---------------------------|
| **Monorepo consolidation (2026-04-19)** | Engine migrated into Next; proxy removed; `runtime.ts` for handlers; Jest → Vitest; root Docker + `preflight-omr`; [work log](#wl-consolidation-2026-04-19). |
| **Logic core ([plan](plan.md) §1)** | SATB solver, constraints, `POST /api/generate-from-file`, chord inference, greedy-first + wall-clock caps, genre/mood/instruments/`rhythmDensity`, anacrusis, ADR 003 transpose slice in MusicXML. |
| **File intake** | MusicXML / MIDI / MXL / PDF·PNG OMR paths; symbolic hardening — [work log](#wl-intake-symbolic-2026-04-07). |
| **Tactile Sandbox ([plan](plan.md) §2)** | RiffScore-first; patch-package toolbar + scrub bridge; session persistence. |
| **Theory Inspector ([plan](plan.md) §3)** | FACT blocks, suggest, IDEA_ACTIONS + `staffIndex`, **`<<<INTENT>>>`** → **`intentRouter.ts`** + confirmation UI → store + `router.push` — [work log](#wl-inspector-split-ideas-2026-04-06), [consolidation](#wl-consolidation-2026-04-19). |
| **Iteration 1+2 (2026-04-18)** | Clefs, rhythm density, voice independence, config persistence, sandbox delete→rest, Inspector UX, playback volume — [work log](#wl-study-refinement-2026-04-18). |
| **Sandbox exports (2026-04-13)** | Live flush; XML/MIDI/PNG/WAV/ZIP/chord-chart/print — [work log](#wl-sandbox-exports-2026-04-13). |
| **Glass Box pedagogy (2026-04-19)** | Document + Inspector callouts — [work log](#wl-glass-box-pedagogy-2026-04-19). |
| **Repository hygiene (2026-04-20)** | Removed legacy demos and duplicate deploy scaffolding; **`docs/design/`** + **`docs/archive/`**; minimal **`.env.example`**; **CI** workflow; README + link sweep — [work log](#wl-repo-hygiene-2026-04-20). |
| **Sandbox parity — palettes, rest repitch, clean export (2026-04-20)** | MuseScore/Noteflight-style **palette panel** (F9); **rest → note re-pitch** (`restsToNotes`, A–G on selected rest); **export/print score-only** (`ExportPrintRoot`, `presentation` RiffScore, `body.hf-printing-score`); Document **PDF preview** posts `pages[]` to `/api/to-preview-musicxml`; Vitest **`rasterizePdf`** tests — [work log](#wl-palettes-repitch-2026-04-20). |
| **Document UX — chord gating, playback, pedagogy, tooltips (2026-04-20)** | **Chord track gated** to 3+ parts; Document **audio unlock** + floating **play**; **Glass Box** + **(i)** copy; **tooltip width** fix — [work log](#wl-document-ux-2026-04-20). |
| **Ensemble Builder UI (2026-04-21)** | **Collapsible** Glass Box pedagogy; **always-visible** algorithms-vs-AI + Theory Inspector sentence under the heading; **Sound & style** + **Instruments (SATB)** section cards; concise classical-scope line — [work log](#wl-ensemble-builder-ui-2026-04-21). |
| **Learner note names + classical-only scope + bar-regenerate removal (2026-04-20)** | Optional **letter+accidental** labels **above** noteheads (exports stay clean); RiffScore **testid → HF id** mapping + rest-aware walks; **toolbar clip** + z-order vs FAB/palette; **Genre / infer-chords** UI removed with **classical disclaimer**; **forced classical** on generate API; **sandbox bar regeneration** removed — [scope work log](#wl-learner-notes-scope-2026-04-20), [label refinement](#wl-learner-pitch-labels-refine-2026-04-20). |
| **MVP polish + Inspector bundle (2026-04-22)** | Pickup + infer-chords Advanced; **`localStorage`** generation config; progression window FACTs; Inspector tabs/tags/chat layout; sandbox reset + onboarding key; VoiceDropdown groups; engine **`pickupBeats`**; lint hook fix — [narrative](#program-narrative-2026-04-22), [work log](#wl-mvp-phase-ship-2026-04-22). |
| **Sandbox score UX — rest hover + hotkeys (2026-04-22 late)** | **Hover** rest → ghost pitch from staff Y; **click** replaces with rest’s **duration/dots**; **paste/insert** replace rest; **ConfigurationBackFAB**, **StepBar** labels, reset re-hydrate — [work log](#wl-sandbox-score-ux-2026-04-22). |

### Approach (this program, in one paragraph)

Ship a **single Next.js app** with a **deterministic engine** under `frontend/src/server/engine/` and **RiffScore** as the primary editor. Prove behavior with **Vitest** + **`make verify`**. Treat **PDF/OMR** as environment-dependent (browser rasterization everywhere; full OMR on Docker or equipped hosts). Iterate in **dated work logs** in this file so handover does not depend on chat history. For editor UX, align with **MuseScore / Noteflight** where it reduces friction (rest repitch, grouped palettes, exports that omit app chrome) while keeping **`EditableScore`** as the canonical model and RiffScore as the renderer.

### Current failure / what we are working on now

**Update (2026-04-22):** The **`RiffScoreEditor`** **`react-hooks/rules-of-hooks`** issue is **fixed** (palette callbacks above the early return). **Authoritative “current failure”** list: see **[Program narrative (2026-04-22)](#program-narrative-2026-04-22)** — **lint warnings** (`no-img-element`, unused `_e`), **Iteration 3** tutoring quality, **study** execution, partial **export** round-trip.

**Tests / build:** **`npm run test`** — **231** Vitest tests in **`frontend/`** as of **2026-04-22**; **`npm run lint`** **exits 0** with **warnings** only.

**No single “the app is blocked” runtime failure** for CI. **LLM:** **`OPENAI_API_KEY`** in **`frontend/.env.local`** is sufficient for default OpenAI; **`OPENAI_BASE_URL`** optional — see **[Work log — LLM env & Theory Inspector gateway (2026-04-20)](#wl-llm-env-2026-04-20)**.

**Study / product feedback — “Iteration 3” (current problem framing):** Condensed notes in **[Iteration3.txt](Iteration3.txt)** (from participant sessions) describe the **next wave of product risk**, not a deploy blocker. **2026-04-20 update:** we **removed** the experimental **“Regenerate harmony in bar”** sandbox control and **narrowed the Document UI** to **basic classical** harmony only (see **[Work log — Learner note names…](#wl-learner-notes-scope-2026-04-20)**), so the **localized regenerate** row below is **de-scoped in the product** until a future design; **genre** in the engine remains for future use, but **generate** is **classical-only** from the client.

| Theme | Issue | Direction |
|-------|--------|-----------|
| **Theory Inspector** | Chords analyzed **in isolation**; weak sequential / voice-leading context (e.g. ii–V–I, jazz substitutions). | Prompt + evidence architecture should emphasize **progressions** and transitions, not per-chord trivia. |
| **Sandbox scope** | *(Historical)* Participant asked for **localized** “regenerate voicing **here**.” **(2026-04-20)** That **bar-level regenerate** prototype was **removed** from the UI; full-score generate from **Document** remains. Revisit **region-scoped** harmony only when scope and quality bar are clear. |
| **Expressive sovereignty** | Harmony = framework; **phrasing / dynamics / articulation** should stay human-led. | Ensure deterministic output and UI do not **auto-flood** expressive markings; prompt user to layer expression after harmony. |
| **Parameters** | *(Historical)* genre/mode sometimes **failed to drive** expected behavior. **(2026-04-20)** **Document** no longer exposes **genre** or **infer-from-melody**; **generate** sends **`genre: classical`** only. **Engine** still supports `genre` / `preferInferredChords` for future routes; **audit** remains when multi-style generation returns. |

**Recently fixed UX issue (not a server failure):** Info **(i)** tooltips beside Mood / Genre / etc. rendered in a **tall, narrow column** because the absolutely positioned tooltip was shrink-to-fit inside the **~16px-wide** trigger; **`Tooltip`** now sets an explicit **`w-[min(20rem,…)]`** so copy wraps at a readable width.

**What is *not* done yet (residual product / tech debt):**

| Area | Gap |
|------|-----|
| **Palette → MusicXML** | New `Measure` / `Note` fields (barlines, ornaments, tuplets, lyrics-as-data, etc.) are stored on `EditableScore` but **`scoreToMusicXML`** does not yet emit all of them — round-trip to MuseScore-class files is partial until export is extended. |
| **Palette drag-and-drop** | `PaletteButton` emits `application/x-hf-palette-item`; the score canvas does not yet handle drop targets — **click-to-apply** is the supported path. |
| **SMuFL / engraved glyphs** | Palette uses Unicode / short labels; dedicated SMuFL font wiring is deferred. |
| **RiffScore built-in palettes** | Plan called for collapsing fake SCORE/EDIT/MEASURE toggles and moving “Palettes / Show all” into the HarmonyForge panel — **partially** addressed by the new docked panel; further toolbar consolidation can follow. |
| **SandboxActionBar “Repitch” toggle** | Plan specified a dedicated Repitch mode + **R** shortcut; **not shipped** — rest repitch works via selection + A–G and cursor-on-rest. |

**Active focus (choose by role):**

| Track | Status / next move |
|--------|---------------------|
| **Deploy** | Runbook: [deployment.md](deployment.md) — Vercel (**root = `frontend`**) vs **Docker** for full PDF OMR. Align env secrets (**`OPENAI_API_KEY`**, optional **`OPENAI_BASE_URL`**) with host docs. |
| **PDF / OMR** | **Vercel:** preview raster + optional melody XML when server can OMR; generation may return **501** without tooling — **expected**. **Docker / bare metal:** ensure pdfalto build + oemer checkpoints per deployment doc. *Note:* **`miscellaneous/pdfalto/`** may be empty until the vendored tree is populated — `make pdfalto` needs sources there. |
| **Product / study** | **M5** execution (sessions, surveys off-repo); participant feedback notes in **[Iteration3.txt](Iteration3.txt)** (progression-aware Inspector, localized voicing, parameter fidelity). |
| **Code health** | **`RiffScoreEditor`** hook order **fixed (2026-04-22)**. Residual **ESLint warnings** — **`@next/next/no-img-element`**, unused **`_e`**; **IDEA_ACTIONS** edge cases; optional **`react-hooks/exhaustive-deps`** cleanups; **ADR 003** follow-ons per [adr/003](adr/003-multi-clef-transposition-scope.md). |

**Deprecated narrative:** “Split `backend/engine` vs Next” — the repo is **single-app**; ignore older docs that reference a separate backend process unless marked historical.

---

<a id="wl-llm-env-2026-04-20"></a>

## Work log — LLM env & Theory Inspector gateway (2026-04-20)

### End goal (this thread)

**Theory Inspector** and **Stylist suggest** must call an **OpenAI-compatible** HTTP API reliably in dev and deploy: **`OPENAI_API_KEY`** plus an optional **custom base URL** (corporate gateway, Azure OpenAI–compatible proxy, etc.), with one code path and clear templates so contributors do not misconfigure env vars.

### Approach

1. **Single resolver** — [`getServerOpenAIEnv()`](../frontend/src/lib/ai/llmClient.ts) returns trimmed **`apiKey`**, **`model`** (default **`gpt-4o-mini`**), and **`baseURL`** via **`resolveOpenAIBaseURL()`** (**`OPENAI_BASE_URL`** ?? **`OPENAI_URL`**), reusing the same options passed into LangChain **`ChatOpenAI`** (`configuration.apiKey` + optional `baseURL`).
2. **Next loads `frontend/.env.local`** — [`loadEnvConfig(appDir)`](../frontend/next.config.ts) from the **`frontend/`** package root so Turbopack/monorepo layout does not skip **`OPENAI_*`** vars.
3. **Templates stay minimal** — **[`frontend/.env.example`](../frontend/.env.example)** lists **`OPENAI_API_KEY`** and **`OPENAI_BASE_URL`** only; **`OPENAI_MODEL`** was removed from templates (runtime default suffices; Docker/Makefile may still inject **`OPENAI_MODEL`**).
4. **Observability** — **`GET /api/theory-inspector`** exposes **`hasApiKey`** and **`hasCustomBaseUrl`** (no secrets).

### Steps completed

| Step | Detail |
|------|--------|
| Centralize env | **`getServerOpenAIEnv()`** + export **`resolveOpenAIBaseURL()`**; **`POST /api/theory-inspector`** and **`POST /api/theory-inspector/suggest`** use the helper instead of ad hoc **`process.env`** reads. |
| Health | **`GET /api/theory-inspector`** adds **`hasCustomBaseUrl`**. |
| Templates | Root **[`.env.example`](../.env.example)** and **`frontend/.env.example`** document **`OPENAI_BASE_URL`**; **`OPENAI_MODEL`** lines removed from examples. |
| **`next.config.ts`** | Comment documents loading **`OPENAI_*`** (not only the API key). |
| **Ops** | **`make dev`** / **`make dev-clean`** for local server lifecycle; port **3000** default. |

### Pitfall encountered (configuration, not code bug)

Using a variable named **`BASE_URL`** for the OpenAI gateway **does not work** — only **`OPENAI_BASE_URL`** / **`OPENAI_URL`** are read. Duplicated URLs in one line (e.g. two `https://…` pasted together) are partially mitigated by **`normalizeOpenAIBaseURL()`**; prefer a single clean origin + path (typically ending in **`/v1`** for OpenAI-compatible servers).

### Verification performed

- **`curl http://localhost:3000/api/theory-inspector`** → **`hasApiKey: true`**, **`hasCustomBaseUrl: true`** when both are set in **`frontend/.env.local`**.
- **`POST /api/theory-inspector`** with a minimal prompt returns a streamed response through the configured gateway (smoke test).

### Current failure / focus (what we are working on *next*)

Env wiring is **done**. The **open problems** are **product / research**, summarized in **[Iteration3.txt](Iteration3.txt)** and the [Program narrative — Iteration 3 table](#program-narrative-2026-04-20): **progression-aware** Inspector (not chord-in-isolation), **localized** voicing/regenerate, **parameter** fidelity (genre/mode), and **expressive** markings staying human-owned. **CI (2026-04-22):** **`RiffScoreEditor`** hook order **fixed**; **`npm run lint`** **exits 0** with **warnings** — see **[Program narrative (2026-04-22)](#program-narrative-2026-04-22)**.

---

<a id="wl-ensemble-builder-ui-2026-04-21"></a>

## Work log — Ensemble Builder UI: collapsible pedagogy & grouped sections (2026-04-21)

### End goal (this thread)

1. **Readable Document column:** The **Ensemble Builder** strip on **`/document`** should feel like a **form**, not a wall of equal-weight callouts — clearer **hierarchy**, less vertical noise, same semantics (Glass Box stance + classical-only honesty).
2. **Pedagogy without clutter:** Long **“how we use / don’t use AI”** copy remains available but **does not dominate** the first screen; users who need it can expand.
3. **Non-negotiable transparency:** Even when the collapsible is **closed**, users must still see that **harmonies are produced by algorithms** (rules + search), **not** by generative AI, and that **conversational AI** appears only in **Theory Inspector** on the next screen (with a **reviewer-arm** variant when melody-only flow applies).
4. **Grouped controls:** **Mood**, **Harmony motion**, and the **classical-style** scope note belong together; **SATB instrument** pickers read as a distinct step.

### Approach

| Topic | Decision |
|-------|----------|
| **Glass Box callout** | [`GlassBoxPedagogyCallout`](../frontend/src/components/molecules/GlassBoxPedagogyCallout.tsx) — **toggle button** (chevron + **summary** label), **`aria-expanded`**, **`role="region"`** for the expanded body. **Default:** `defaultOpen === undefined` → **collapsed** for **`ensemble-generate`** / **`ensemble-reviewer`**, **open** for **`inspector`** (Theory Inspector keeps the explanation visible). Optional **`defaultOpen`** override. |
| **Always-visible disclosure** | [`EnsembleBuilderPanel`](../frontend/src/components/organisms/EnsembleBuilderPanel.tsx) — **`font-body`** paragraph **under the subtitle**, before the collapsible: **generate** flow = harmonies from engine **algorithms**, not generative AI; **AI** only in **Theory Inspector** next screen. **Reviewer** flow = no generative harmony AI; chat-style AI in **Theory Inspector** next screen. |
| **Ensemble layout** | Same file — **`<section>`** cards with shared border/background tokens; **“Sound & style”** groups mood + rhythm density + **one-line** classical disclaimer (generate flow only); **“Instruments (SATB)”** groups four **`VoiceDropdown`**s. Tighter **`gap-5`** and horizontal padding **`px-[40px]`**. |
| **Copy** | Full pedagogy **title + body** unchanged inside the expanded region; summary labels: **“How HarmonyForge uses AI”** (ensemble), **“Conversational AI in this panel”** (inspector). |

### Steps completed (files)

- [`frontend/src/components/molecules/GlassBoxPedagogyCallout.tsx`](../frontend/src/components/molecules/GlassBoxPedagogyCallout.tsx) — collapsible UI, **`summaryLabel`** per variant, **`defaultOpen`** / variant defaults, **`lucide-react`** **`ChevronDown`**.
- [`frontend/src/components/organisms/EnsembleBuilderPanel.tsx`](../frontend/src/components/organisms/EnsembleBuilderPanel.tsx) — section cards, heading ids + **`aria-labelledby`**, consolidated classical disclaimer line, **always-visible** algorithms / Theory Inspector disclosure (generate vs **`reviewer_melody`** copy).

### Verification

- Manual: **`/document`** — with Glass Box **collapsed**, the **subtitle paragraph** still states **algorithms vs generative AI** and **Theory Inspector**; expand for full pedagogy; confirm Mood + Harmony motion + classical line in **Sound & style**; SATB in **Instruments** card.
- **`npm run lint`**: **fails** until **`RiffScoreEditor.tsx`** hook order is fixed (not introduced by these two files; see **Current failure** below).

### Current failure / focus (what we are working on *next*)

**Resolved (2026-04-22):** palette **`useCallback`** hooks moved **above** the **`!score \|\| !config`** guard. **Remaining:** optional **lint warning** cleanup (`no-img-element`, unused param); see **[Program narrative (2026-04-22)](#program-narrative-2026-04-22)**.

---

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

<a id="wl-consolidation-2026-04-19"></a>

## Work log — Consolidation + PDF + residuals (2026-04-19)

### End goal (this thread)

Merge HarmonyForge into **one deployable Next.js app**, make **PDF input truly work** (both on Vercel and self-hosted), and close every residual flagged in [plan.md](plan.md) / [progress.md](progress.md) — failing baseline test, hook-lint warnings, IDEA_ACTIONS ambiguity, tutor INTENT not wired, ADR 003 transposition slice, audio unlock, selection cursor over stems.

### Approach

1. Lift the Express engine into Next route handlers (same TypeScript, imported directly by `/api/*` handlers). No proxy, no CORS.
2. Keep the engine deps Node-only (`@tonejs/midi`, `adm-zip`, `fast-xml-parser`, `musicxml-interfaces`) via `serverExternalPackages`.
3. Two PDF stories:
   - **Browser**: `pdfjs-dist` rasterizes every PDF to PNGs client-side so Document always renders a preview.
   - **Server**: self-hosted Docker image bundles pdfalto + Poppler + Python/oemer; `intakeImagePagesToParsedScore` + `mergeParsedScores` close the "page 1 only" limit.
4. Ship residual fixes in the same pass so the repo is green: strict lint, complete test suite, working build.

### Steps completed (artifact map)

| Area | What shipped |
|------|--------------|
| **Engine migration** | `frontend/src/server/engine/*` (all files from the old `backend/engine`); imports stripped of `.js` suffixes; `@tonejs/midi` resolves via `createRequire(import.meta.url)` so cwd no longer matters. |
| **Runtime helpers** | [`frontend/src/server/engine/runtime.ts`](../frontend/src/server/engine/runtime.ts) centralizes validation + solver budgets + intake routing for every `/api/*` handler. |
| **Inline routes** | [`/api/generate-from-file`](../frontend/src/app/api/generate-from-file/route.ts), [`/api/to-preview-musicxml`](../frontend/src/app/api/to-preview-musicxml/route.ts), [`/api/validate-from-file`](../frontend/src/app/api/validate-from-file/route.ts), [`/api/validate-satb-trace`](../frontend/src/app/api/validate-satb-trace/route.ts), [`/api/export-chord-chart`](../frontend/src/app/api/export-chord-chart/route.ts), plus new [`/api/health`](../frontend/src/app/api/health/route.ts). All use `runtime: "nodejs"` + `maxDuration: 300`. |
| **Proxy retirement** | Deleted `frontend/src/lib/server/engineForward.ts`; removed the entire `backend/` folder (CLI moved to `frontend/scripts/run-engine-cli.ts`); dropped `backend/Dockerfile` + `backend/requirements.txt` (latter relocated to repo root). |
| **Makefile + env** | Single-process `make dev` (no `dev:backend`); removed `NEXT_PUBLIC_API_URL` / `CORS_ORIGIN` from [`.env.example`](../.env.example) and [`frontend/.env.example`](../frontend/.env.example); new `make docker-build` / `make docker-run` / `make preflight-omr` targets. |
| **Client PDF preview** | New [`useClientPdfPreview`](../frontend/src/hooks/useClientPdfPreview.ts) (lazy `pdfjs-dist`, worker copied to `public/pdfjs/` by postinstall). `ScorePreviewPanel` renders page 1 + caption when no MusicXML preview yet. |
| **Server PNG intake** | [`fileIntake.ts`](../frontend/src/server/engine/parsers/fileIntake.ts) — `isProbablyRasterImage`, `intakeImagePagesToParsedScore`, `runOemerOnImage` (direct PNG → oemer, no pdftoppm). `mergeParsedScores` stitches N pages. |
| **Form handling** | `readFormFile` + new `readFormFiles` in runtime.ts so routes accept `pages[]` alongside `file`. Document `/document` generates PDF uploads with rasterized pages attached. |
| **Self-hosted image** | Root [`Dockerfile`](../Dockerfile) (3-stage: pdfalto-builder → next-builder → runtime with Poppler + Python 3.11 venv + oemer). [`docker-compose.yml`](../docker-compose.yml) references it and persists oemer checkpoints via a named volume. [`preflight-omr.sh`](../frontend/scripts/preflight-omr.sh) warms the checkpoint cache on first boot. |
| **Error UX** | [`intakeErrorHints.ts`](../frontend/src/lib/ui/intakeErrorHints.ts) now classifies PDF failures (tooling missing, checkpoints missing, no staves) and emits matching copy. |
| **Baseline test fix** | `needsEnginePreviewForExtension.test.ts` updated to match the canonical "always server intake" contract. Vitest suite green (**204** tests as of 2026-04-20 Document UX pass; see [Last updated](#last-updated-2026-04-20)). |
| **Lint warnings** | Fixed the remaining four `react-hooks/exhaustive-deps` + `prefer-const` warnings. ESLint exits 0 with **0 warnings**. `public/pdfjs/**` and `.next/**` excluded from lint globs. |
| **IDEA_ACTIONS resolver** | [`ideaActionResolve.ts`](../frontend/src/lib/music/ideaActionResolve.ts) adds `staffIndex` hint (serialized by the tutor when present), and a nearest-in-measure fallback so ambiguous summaries still land somewhere plausible. [`ideaActionSchema.ts`](../frontend/src/lib/ai/ideaActionSchema.ts) extended with the optional field; `noteExplainContext.ts` emits `STAFF_HINT=<n>` on each `NOTE_ID` FACT line; `NOTE_EXPLAIN_TUTOR_BRIEF` instructs the tutor to copy the hint verbatim. New vitest covers both paths. |
| **Tutor INTENT auto-wiring** | New [`intentRouter.ts`](../frontend/src/lib/ai/intentRouter.ts) parses `<<<INTENT>>>{…}` JSON with a Zod discriminated union (set_mood / set_genre / set_rhythm_density / set_pickup_beats / regenerate / open_document_page / open_sandbox_page). `useTheoryInspector` strips the block from the rendered body and stores the parsed intent on the chat message. `TheoryInspectorPanel` renders an `IntentConfirmationBubble`; sandbox wires Apply/Dismiss to `useGenerationConfigStore` setters and `router.push`. New study log events `intent_applied` / `intent_dismissed`. |
| **Generation config store** | Added `pickupBeats` field (+ `setPickupBeats`) so INTENT JSON can request pickup-measure fixes. |
| **ADR 003 slice** | [`satbToMusicXML.ts`](../frontend/src/server/engine/satbToMusicXML.ts) — `resolveInstrumentTranspose` + `<transpose>` XML for Bb clarinet / Bb trumpet / soprano sax / A clarinet / Eb alto sax / F horn. Solver stays in concert pitch; MusicXML carries the written-pitch mapping. New [`transpose.test.ts`](../frontend/src/server/engine/transpose.test.ts). ADR status flipped to **Accepted**. |
| **Notehead over stems** | Extended [`RiffScoreEditor.tsx`](../frontend/src/components/score/RiffScoreEditor.tsx) CSS so SVG `<line>` elements (stems/beams) have `pointer-events: none` except for playback/cursor/measure lines. Complements the existing `cursor: grab/grabbing` rules from Iter1 §1. |
| **Audio unlock** | New [`AudioUnlockBanner`](../frontend/src/components/molecules/AudioUnlockBanner.tsx) detects a suspended `AudioContext` on Sandbox mount and offers a one-click unlock with a silent pre-roll. `usePlayback` now also exposes `audioUnlocked` + `unlockAudio`. |
| **Test migration** | Backend Jest → frontend Vitest. `vitest.config.ts` enables `globals: true`; tsconfig includes `vitest/globals` types so Jest-style tests compile. `fileIntake.test.ts` rewrote `jest.mock`/`jest.fn` to `vi.mock`/`vi.fn`. `musicxml-interfaces` in `musicxmlParser.ts` converted to lazy `createRequire` load so Node runs do not hit XSLTProcessor. |
| **Docs** | [`docs/deployment.md`](deployment.md) rewritten for the two supported paths (Vercel vs Docker); [`docs/plan.md`](plan.md) §1.9m marked resolved; [`docs/adr/003-multi-clef-transposition-scope.md`](adr/003-multi-clef-transposition-scope.md) status flipped to Accepted with a 2026-04-19 update block; repo-root and `frontend/README.md` updated to describe the single-deployable topology. |

### Verification

- `cd frontend && npm test` → **204 tests pass** across 36 files (UI + engine + intent + transpose + intake + sandbox parity + riffscoreAdapter chord policy as of 2026-04-20).
- `cd frontend && npm run lint` → exit 0, **0 warnings**.
- `cd frontend && npm run build` → production build succeeds; every `/api/*` handler lists under the manifest; `/api/health` returns `{ status: "ok" }`.
- Manual: MusicXML upload → Document preview → Generate → Sandbox (unchanged, faster without the HTTP proxy hop). PDF upload on local dev → Document shows the client-rendered page; Generate succeeds when pdfalto + oemer are installed (Docker path). Theory Inspector INTENT confirmation: ask "switch mood to minor and regenerate" → tutor reply includes an Apply button that jumps to `/document` with `mood=minor`.

### Residual / not fixed here

- Vercel-only hosts still cannot run Python-backed OMR; that's a fundamental platform limitation, documented in [deployment.md](deployment.md) Path A.
- `intent_applied` / `intent_dismissed` event payload is intentionally minimal (action name only) to keep the M5 study log PII-free.
- Multi-clef writer beyond transposing instruments (alto clef, soprano clef) remains scheduled as the next ADR 003 slice; not blocking this pass.

---

<a id="wl-palettes-repitch-2026-04-20"></a>

## Work log — Palettes, rest repitch, clean export (2026-04-20)

### End goal (this thread)

Bring the Sandbox to **MuseScore / Noteflight** parity along three axes flagged by the user: (1) **put a note back in a rest's place** the way canonical editors do, (2) surface all the missing **palettes** (articulations, dynamics, barlines, repeats, tempo, text, tuplets, …), and (3) **fix export** so PDF/PNG output captures only the score, not the palette/toolbar chrome.

### Approach

1. Extend [`scoreUtils.ts`](../frontend/src/lib/music/scoreUtils.ts) with a **repitch** path (`restsToNotes` + `convertRestToPitch`) that preserves the rest's duration and infers octave from pitched neighbors — matching MuseScore's [Re-pitch mode](https://musescore.org/en/handbook/2/replace-pitches-without-changing-rhythms) and Noteflight's "type over rest" keyboard behavior. Wire the sandbox keyboard handler to prefer repitch when the insertion target is a rest.
2. Publish a canonical palette taxonomy in [`paletteRegistry.ts`](../frontend/src/lib/palettes/paletteRegistry.ts), render it via [`SandboxPalettePanel.tsx`](../frontend/src/components/organisms/SandboxPalettePanel.tsx) + [`PaletteButton.tsx`](../frontend/src/components/atoms/PaletteButton.tsx), and dispatch clicks through the existing `handleToolSelect` in [`sandbox/page.tsx`](../frontend/src/app/sandbox/page.tsx) so keyboard + toolbar + palette share one undo history. Extend `EditableScore` (`Measure.barline / repeatMark / rehearsalMark / tempoText`, `Note.ornament / tuplet / lyric / chordSymbol / lineStart / lineEnd`) with optional fields so new reducers have somewhere to write.
3. PDF intake: verify the existing `useClientPdfPreview` → `/api/to-preview-musicxml` + `/api/generate-from-file` hand-off; add a test for `rasterizePdf` and forward `pages[]` to the **preview** endpoint too, so Document's preview panel parses the melody even when only the browser has Poppler.
4. Export: add `presentation` to [`RiffScoreEditor`](../frontend/src/components/score/RiffScoreEditor.tsx) (no toolbar / no bars strip / no FABs), apply it inside [`ScorePreviewPane`](../frontend/src/components/molecules/ScorePreviewPane.tsx) for PNG capture, and introduce a hidden [`ExportPrintRoot.tsx`](../frontend/src/components/organisms/ExportPrintRoot.tsx) that the new `body.hf-printing-score` CSS in [`globals.css`](../frontend/src/app/globals.css) uses as the sole print target when `printScoreOnly()` fires.

### What shipped (artifact map)

| Area | What shipped |
|------|--------------|
| **Rest → note repitch** | `restsToNotes`, `convertRestToPitch`, `nearestOctaveForLetter`, `neighborOctaveForRepitch` in `scoreUtils.ts`; `setPitchByLetter` + `transposeNotes` no longer skip rests; sandbox keyboard handler triggers `restsToNotes` when the cursor sits on a rest; Vitest coverage (`scoreUtils.test.ts` — 7 new cases). |
| **Rest hint overlay** | `RiffScoreEditor` renders a small "Type A–G to place a note" badge under the selected rest using `notePositions`. Honoured in edit mode only. |
| **Palette panel** | `SandboxPalettePanel` + `PaletteButton` + `paletteRegistry` (13 sections, 60+ items); F9 toggles visibility; draggable palette items emit `application/x-hf-palette-item` for future drop-on-score work; section filter box searches across titles. |
| **New reducers** | `setMeasureBarline`, `setMeasureRepeatMark`, `setMeasureTempoText`, `setOrnament`, `setTuplet`, `setLineOnSelection`, `setNoteLyric`, `setNoteChordSymbol`, `setScoreBpm` (exported from `scoreUtils.ts`). |
| **Extended types** | `BarlineStyle` + optional `Measure.{barline, repeatMark, rehearsalMark, tempoText}` and `Note.{ornament, tuplet, lyric, chordSymbol, lineStart, lineEnd}` in `scoreTypes.ts`. |
| **PDF intake** | Document now posts `pages[]` to `/api/to-preview-musicxml` whenever `useClientPdfPreview` has rasterized pages, so PDF previews parse a melody on Vercel even without `pdftoppm`. New `useClientPdfPreview.test.ts` covers 1-page, 3-page, and `maxPages` cases. |
| **Presentation mode** | `RiffScoreEditor` prop `presentation` hides toolbar, bars strip, staff labels, palette menu, scrub overlay, and empty-part fabs. `editableScoreToRiffConfig` in [`riffscoreAdapter.ts`](../frontend/src/lib/music/riffscoreAdapter.ts) gained `showToolbar` so the flag strips toolbar plugins when printing/exporting score-only views. |
| **Clean print / PDF** | [`ExportPrintRoot.tsx`](../frontend/src/components/organisms/ExportPrintRoot.tsx) + `body.hf-printing-score` in [`globals.css`](../frontend/src/app/globals.css); `printScoreOnly()` in [`sandbox/page.tsx`](../frontend/src/app/sandbox/page.tsx) drives both the `score-print` toolbar action and `ExportModal` PDF. Legacy `.hf-print-hide` + `.hf-sandbox-print-target` rules remain for compat. |

### Verification

- `npx vitest run` — **204 tests pass** (includes rest-repitch + PDF preview + riffscoreAdapter chord-gating cases; count as of 2026-04-20 Document UX pass).
- `npm run lint` — clean.
- `npm run build` — green Turbopack build.
- Manual smoke test instructions for the user: open Sandbox with `tour_demo.xml`, select a rest, type **A** → expect a pitched note of the rest's original duration at an octave close to neighbor notes. Press **F9** to toggle palette; click any palette item with a selection to apply the reducer. Export → **PDF** / **PNG** / **Print** should render only the score.

### Residual / deferred

- **SMuFL fidelity:** palette buttons use Unicode music glyphs (𝄞, 𝄢, ♯, ♭) as a stand-in; wiring to SMuFL fonts is deferred.
- **Drag-drop application:** palette drag payloads are sent but the score canvas does not yet implement drop handling — clicks are the primary interaction this pass.
- **Barlines / ornaments in MusicXML export:** the new `Note.ornament`, `Measure.barline`, and `Measure.repeatMark` fields round-trip into `EditableScore` but `scoreToMusicXML.ts` does not yet emit them; follow-up work.
- **Lyrics / chord symbols:** stored on the note model but RiffScore visual rendering is a follow-up.
- **Repitch mode toggle + R shortcut:** original plan mentioned a dedicated mode and **R**; behavior is covered by selection + **A–G** and cursor-on-rest — explicit toggle remains optional UX.
- **Percussion clef:** not yet listed in `paletteRegistry` / `handleToolSelect` (add when percussion staff editing is in scope).
- **RiffScore toolbar consolidation:** docked palette reduces reliance on legacy SCORE/EDIT/MEASURE toggles; full removal/relabel is follow-up.

---

<a id="wl-document-ux-2026-04-20"></a>

## Work log — Document UX: chord gating, playback, pedagogy & tooltips (2026-04-20)

### End goal (this thread)

1. **Chord UI honesty:** RiffScore draws a global **chord track** with a **hardcoded hover label** when chord mode is on; small ensembles (1–2 parts) should not show misleading chord chrome or sync **`chordTrack`** until there are enough staves for harmonic annotation to be meaningful.
2. **Document preview audio:** Users should hear the uploaded/preview score on **`/document`** with a clear **Play** control and browser **audio-unlock** affordance (same class of “first click silent” issue as Sandbox **Iter2 §4**).
3. **Pedagogy & discoverability:** **Glass Box** copy and **(i)** tooltips should read well for **musicians and non-musicians**; tooltip **layout** must not collapse to a unreadable narrow column.

### Approach

| Topic | Decision |
|-------|------------|
| **Chord policy** | `shouldShowChordNotation(score) := score.parts.length >= 3` (melody + two harmony lines). |
| **Adapter push** | `editableScoreToRiffConfig`: include `chord` block only when policy true. `editableScoreToRsScore`: set `chordTrack` only when policy true **and** `score.chords?.length`. |
| **Adapter pull** | `riffScoreToEditableScore`: populate `next.chords` from RiffScore or `previousScore` only when `shouldShowChordNotation(next)` — prevents re-injecting chords after part count drops. |
| **Editor safety net** | `RiffScoreEditor`: `data-hf-chord-ui="1"\|"0"` on `.riffscore-hf-wrapper`; CSS hides `g.riff-ChordTrack` / `[data-testid="chord-track"]` when off. |
| **Tests** | [`riffscoreAdapter.test.ts`](../frontend/src/lib/music/riffscoreAdapter.test.ts) — 1- and 2-part omit `chordTrack`; 3-part round-trips chords. |
| **Document playback** | [`AudioUnlockBanner`](../frontend/src/components/molecules/AudioUnlockBanner.tsx) on [`document/page.tsx`](../frontend/src/app/document/page.tsx); [`ScorePreviewPanel`](../frontend/src/components/organisms/ScorePreviewPanel.tsx) — `Tone.start()` then `api.play(0,0)` / `pause`; play control moved to **floating** button on canvas; **Re-upload** moved out of removed footer bar. |
| **Copy** | [`GlassBoxPedagogyCallout`](../frontend/src/components/molecules/GlassBoxPedagogyCallout.tsx) — two short sentences per variant (algorithms vs AI). [`EnsembleBuilderPanel`](../frontend/src/components/organisms/EnsembleBuilderPanel.tsx) — shorter tooltips + button `title`s + rhythm-density hints. |
| **Tooltip width** | [`Tooltip`](../frontend/src/components/atoms/Tooltip.tsx): explicit `w-[min(20rem,calc(100vw-2.5rem))]` because the trigger lives in a **~16px** [`HoverTooltip`](../frontend/src/components/atoms/HoverTooltip.tsx) wrapper — absolute children were shrink-to-fit to that width. |

### Steps completed (files)

- `frontend/src/lib/music/riffscoreAdapter.ts` — `shouldShowChordNotation`, gated chord config / `chordTrack` / merge.
- `frontend/src/components/score/RiffScoreEditor.tsx` — `data-hf-chord-ui`, scoped CSS.
- `frontend/src/lib/music/riffscoreAdapter.test.ts` — 1/2/3-part cases.
- `frontend/src/app/document/page.tsx` — `AudioUnlockBanner`.
- `frontend/src/components/organisms/ScorePreviewPanel.tsx` — floating transport, `Tone.start`, footer removal, Re-upload placement.
- `frontend/src/components/molecules/GlassBoxPedagogyCallout.tsx` — pedagogy strings.
- `frontend/src/components/organisms/EnsembleBuilderPanel.tsx` — tooltip copy + hints.
- `frontend/src/components/atoms/Tooltip.tsx` — width + padding.

### Verification

- `make test` — **204** Vitest tests pass (includes `riffscoreAdapter`).

### Current failure / residual

- **No blocking engineering failure** for this thread: tests green, change set is UX + policy + copy.
- **Follow-up (optional):** Manual QA on **`/document`** across browsers (Safari autoplay policies). Residual **IDEA_ACTIONS** / duplicate part-name edge cases unchanged from the **Current failure / what we are working on now** subsection in [Program narrative](#program-narrative-2026-04-20) above.

---

<a id="wl-learner-notes-scope-2026-04-20"></a>

## Work log — Learner note names, classical-only scope, bar-regenerate removal (2026-04-20)

### End goal (this thread)

1. **Learner affordance:** Beginners (or anyone mapping staff to pitch names) can toggle **pitch help** on the score **without** polluting export/print previews. *(Initial implementation used scientific pitch with octave; **refinement** switched to **letter + accidental** only — see **[Work log — Learner pitch labels refinement…](#wl-learner-pitch-labels-refine-2026-04-20)**.)*
2. **Product honesty:** The app **defaults** to **basic classical-style** harmony generation; **do not** imply jazz/pop or “infer over file chords” until those paths are reliable and tested.
3. **Scope control:** Remove the **localized bar regeneration** experiment from Sandbox so the surface area matches the **single-pass Document → Generate** flow.

### Approach

| Topic | Decision |
|-------|----------|
| **Note labels** | Zustand **`useScoreDisplayStore`** (`persist` key `harmonyforge-score-display`) — **`showNoteNameLabels`**. Sandbox header + Document **`ScorePreviewPanel`** checkbox; **`RiffScoreEditor`** receives **`showNoteNameLabels`** + **`allowNoteNameLabelsInPresentation`** for Document preview only; **Export modal** (`ScorePreviewPane`) stays **presentation-only** without labels. |
| **Positioning / visibility** | **`extractNotePositions`** ([`riffscorePositions.ts`](../frontend/src/lib/music/riffscorePositions.ts)): if **`[data-note-id]`** exists but **none** map through **`rsToHf`**, **do not** return early with **[]** — fall through to **`g.staff`** / flat NoteHead strategies. **Refinement** adds testid-based extraction, rest-skipping walks, preview detection, lower overlay **z-index**, **toolbar band clipping**, and **`overflow-hidden`** on score frames — see [refinement work log](#wl-learner-pitch-labels-refine-2026-04-20). |
| **Classical-only UX** | [`EnsembleBuilderPanel.tsx`](../frontend/src/components/organisms/EnsembleBuilderPanel.tsx): remove **Genre** buttons and **“Infer harmony from melody…”**; add **disclaimer** copy. Generate CTA passes **`genre: "classical"`** and **`preferInferredChords: false`** regardless of any stale persisted store. [`document/page.tsx`](../frontend/src/app/document/page.tsx): **`POST /api/generate-from-file`** **`config`** JSON uses **`genre: "classical"`** and omits **`preferInferredChords`**. |
| **Bar regenerate removed** | [`sandbox/page.tsx`](../frontend/src/app/sandbox/page.tsx): delete **`handleRegenerateHarmonyInBar`**, UI strip, **`isRegeneratingHarmonyBar`**, imports **`extractMelodyOnlyScore`**, **`replaceHarmonyMeasuresRange`**, unused **`GENERATE_TIMEOUT_MS`**. [`studyEventLog.ts`](../frontend/src/lib/study/studyEventLog.ts): drop **`regenerate_harmony_bar`** event name. |

### Steps completed (files)

- `frontend/src/store/useScoreDisplayStore.ts`, `*.test.ts` — persisted toggle.
- `frontend/src/components/score/RiffScoreEditor.tsx` — overlay, `cn` + conditional `pt-3`, effect deps include **`showNoteNameLabels`**.
- `frontend/src/components/organisms/ScoreCanvas.tsx`, `ScorePreviewPanel.tsx` — pass store + **overflow** when labels on.
- `frontend/src/components/organisms/SandboxHeader.tsx` — “Note names” checkbox + tooltip.
- `frontend/src/lib/music/riffscorePositions.ts` — strategy 1 fallback when mapped positions empty.
- `frontend/src/components/organisms/EnsembleBuilderPanel.tsx` — disclaimer; removed genre + infer UI; fixed generate payload.
- `frontend/src/app/document/page.tsx` — forced classical **`config`** + study log payloads.
- `frontend/src/app/sandbox/page.tsx` — bar regeneration removed.

### Verification

- **`npm run build`** — green.
- **`npm test`** — **223** tests (Vitest) after refinement (`learnerPitchLabel`, `riffscorePositions`, `useScoreDisplayStore`, etc.).

### Current failure / focus (what we are working on *next*)

**No failing test** from this slice. **Open work** remains the **Iteration 3** research themes in **[Iteration3.txt](Iteration3.txt)** — especially **progression-aware Theory Inspector** and **expressive-sovereignty** guarantees — **not** re-expanding genre/jazz/regenerate until the engine and prompts are ready. **`useGenerationConfigStore`** still exposes **`setGenre`** / **`preferInferredChords`** for **Theory Inspector** `<<<INTENT>>>` handlers and persistence; the **Document** path no longer surfaces those controls.

---

<a id="wl-learner-pitch-labels-refine-2026-04-20"></a>

## Work log — Learner pitch labels refinement: letter+accidental, DOM sync, stacking (2026-04-20)

### End goal (this thread)

1. **Readable beginner labels:** Show **letter + accidental only** (e.g. **C**, **F#**, **Bb**) **above** each notehead — not scientific pitch with octave — so the staff stays the source of truth for register.
2. **Correctness:** Every **real** notehead gets the label that matches **`Note.pitch`** / model order; no “all preview” or wrong-index bugs.
3. **Polish:** Labels must not sit on top of **Notation** chip, **Theory Inspector** FAB, **F9 palette**, or the **RiffScore** internal toolbar row; scrolling/clipping must stay predictable.

### Approach

| Topic | Decision |
|-------|----------|
| **Format** | **`formatLearnerLetterName()`** in [`learnerPitchLabel.ts`](../frontend/src/lib/music/learnerPitchLabel.ts) — Vitest in **`learnerPitchLabel.test.ts`**. |
| **DOM ↔ model** | Prefer **`g.note-group-container`** + **`rect[data-testid^="note-"]`** (RiffScore **`note-{rsNoteId}`**) merged with legacy staff walk; **`resolveRsNoteIdToHfNoteId`**; legacy + flat walks **skip rests** so list index matches **`NoteHead`** entries; **`isPreviewNotehead`** = **no** `closest("g.note-group-container")` (replacing the **`pointer-events: none`** parent heuristic that treated every head as preview). |
| **Fresh rs→hf map** | [`useRiffScoreSync.ts`](../frontend/src/hooks/useRiffScoreSync.ts) — **`getRsToHf()`** for position extraction and selection handlers so refs do not require a rerender to see the latest map. |
| **Placement** | Overlay in [`RiffScoreEditor.tsx`](../frontend/src/components/score/RiffScoreEditor.tsx): anchor **above** notehead (`labelAnchorY = pos.y + pos.h * 0.49 - 5`, **`translate(-50%, -100%)`**); learner layer **`z-[3]`**. |
| **Toolbar / chrome** | **`useLayoutEffect`** + **`ResizeObserver`** → **`learnerClipTopPx`** + **`clip-path: inset(Npx 0 0 0)`** under **`.riff-Toolbar`**; extra **`pt-5`** when labels on. |
| **Global z-order** | [`sandbox/page.tsx`](../frontend/src/app/sandbox/page.tsx) — Notation control + chat FAB **`z-50`**. |
| **Overflow** | [`ScoreCanvas.tsx`](../frontend/src/components/organisms/ScoreCanvas.tsx), [`ScorePreviewPanel.tsx`](../frontend/src/components/organisms/ScorePreviewPanel.tsx) — **`overflow-hidden`** on the score frame (no special `overflow-visible` path for labels). |
| **Copy / store** | [`SandboxHeader.tsx`](../frontend/src/components/organisms/SandboxHeader.tsx), **`ScorePreviewPanel`**, [`useScoreDisplayStore.ts`](../frontend/src/store/useScoreDisplayStore.ts) — tooltips / JSDoc for “above notehead”, letter+accidental. |

### Root causes fixed (engineering)

| Symptom | Cause | Fix |
|--------|--------|-----|
| Toggle on, **no labels** | **`isPreviewNotehead`** true for all heads (RiffScore wraps in `pointer-events: none`) | Detect real notes via **`note-group-container`** |
| **Wrong / missing** labels | DOM order ≠ `measure.notes`; rests in walk desynced index | **testid → HF id** + **skip rests** in positional paths |
| Labels over **FAB / palette / toolbar** | Very high overlay **z-index** + `overflow-visible` | Lower overlay **z**, raise chrome **z**, **clip** toolbar band, **overflow-hidden** containers |

### Steps completed (files)

- [`learnerPitchLabel.ts`](../frontend/src/lib/music/learnerPitchLabel.ts), **`learnerPitchLabel.test.ts`**
- [`riffscorePositions.ts`](../frontend/src/lib/music/riffscorePositions.ts), **`riffscorePositions.test.ts`**; [`vitest.config.ts`](../frontend/vitest.config.ts) **`happy-dom`** glob for DOM tests in that file
- [`useRiffScoreSync.ts`](../frontend/src/hooks/useRiffScoreSync.ts) — **`getRsToHf()`**
- [`RiffScoreEditor.tsx`](../frontend/src/components/score/RiffScoreEditor.tsx) — overlay, clip, padding, **`z-[3]`**
- [`sandbox/page.tsx`](../frontend/src/app/sandbox/page.tsx), [`ScoreCanvas.tsx`](../frontend/src/components/organisms/ScoreCanvas.tsx), [`ScorePreviewPanel.tsx`](../frontend/src/components/organisms/ScorePreviewPanel.tsx)
- [`SandboxHeader.tsx`](../frontend/src/components/organisms/SandboxHeader.tsx), [`useScoreDisplayStore.ts`](../frontend/src/store/useScoreDisplayStore.ts), **`useScoreDisplayStore.test.ts`**

### Verification

- **`npm test`** — **223** tests (Vitest), including **`riffscorePositions`** and **`learnerPitchLabel`**.

### Current failure / focus (what we are working on *next*)

**No open engineering failure** for learner labels at this snapshot. **Product “current failure”** remains **Iteration 3** framing in **[Iteration3.txt](Iteration3.txt)** — progression-aware **Theory Inspector**, voicing/expressiveness gaps, genre fidelity when multi-style generation returns — **not** blocked by this overlay work. Run **`make verify`** before release as the full gate.

---

<a id="wl-repo-hygiene-2026-04-20"></a>

## Work log — Repository hygiene & docs consolidation (2026-04-20)

### End goal (this thread)

Reduce repository noise, align documentation with the **single Next.js** architecture, and make onboarding predictable (one env template, one CI gate, clear doc map).

### Approach

1. Delete or relocate **legacy** trees that are not part of the shipping app (reference demos, unused cloud scaffolding, accidental root `node_modules`, editor-only automation folders).
2. **Merge** overlapping docs (iteration notes → [iterations.md](iterations.md); design specs → [design/README.md](design/README.md)).
3. **Fix** broken links after moves (`plan.md`, `Taxonomy.md`, `context/system-map.md`, [progress.md](progress.md) pointers).
4. Keep **`.env.example`** minimal: **`OPENAI_API_KEY` only**; document optional tuning in [deployment.md](deployment.md), not in the template.

### Steps completed

| Item | Detail |
|------|--------|
| **Removed** | `miscellaneous/chamber-music-fullstack/`, `.azure/`, `.do/`, old `deploy-azure.yml` / `deploy-do.yml`, root `node_modules`, `frontend/Dockerfile` (duplicate of root), `frontend/.claude*`, stray logs, empty `frontend/src/layouts/`, miscellaneous `.playwright-mcp` |
| **Docs merged / relocated** | `Iteration1.txt` + `Iteration2.txt` → [iterations.md](iterations.md); `frontend/design-system/` + `frontend/docs/` → [docs/design/](design/README.md) + [docs/archive/](archive/README.md); removed duplicate `system.md` (folded into `MASTER.md`) |
| **Deleted one-off prompts** | `PROMPT.md`, `verification-prompt.md`, `MVP-Last-Four-Roadmap.md`, `Engine-Test-Run-Log.md`, `Theory-Inspector-Prep.md` (superseded by plan/progress or archive) |
| **Env** | [`.env.example`](../.env.example), [`frontend/.env.example`](../frontend/.env.example) — API key line only |
| **Git** | [`.gitignore`](../.gitignore) — `/node_modules/`, `.env` / `.env*.local`, `.DS_Store` |
| **CI** | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — `npm ci`, test, lint, build in `frontend/` |
| **READMEs** | Root, `frontend/`, `miscellaneous/`, `docs/`, `docs/design/`, `docs/archive/`, `.cursor/` |

### Verification

- `make verify` after hygiene passes (same gate as before).
- Manual: follow [docs/README.md](README.md) links; no references to removed `backend/README` or chamber-music paths in index files.

### Residual

- **Historical paragraphs** deeper in [progress.md](progress.md) may still mention `backend/` or old test counts — search when editing.
- **`miscellaneous/pdfalto/`** may be an empty checkout until the vendored pdfalto tree is restored — document in [miscellaneous/README.md](../miscellaneous/README.md).

---

<a id="wl-glass-box-pedagogy-2026-04-19"></a>

## Work log — Glass Box pedagogy callouts (2026-04-19)

### Shipped

| Area | Detail |
|------|--------|
| **Molecule** | [`GlassBoxPedagogyCallout.tsx`](../frontend/src/components/molecules/GlassBoxPedagogyCallout.tsx) — three variants: `ensemble-generate`, `ensemble-reviewer`, `inspector`; plain-language separation of deterministic harmony vs LLM. |
| **Document** | [`EnsembleBuilderPanel.tsx`](../frontend/src/components/organisms/EnsembleBuilderPanel.tsx) — callout under the panel subtitle; reviewer study arm uses the melody-only copy. |
| **Sandbox** | [`TheoryInspectorPanel.tsx`](../frontend/src/components/organisms/TheoryInspectorPanel.tsx) — callout below **My musical goal**, above the note/chat split. |

**Verification:** `cd frontend && npm run lint` + `npm run build` (spot-check after edit).

---

<a id="wl-study-refinement-2026-04-18"></a>

## Work log — Iteration 1+2 study refinement (2026-04-18)

### End goal (this thread)

Close every ticket raised in [docs/iterations.md](iterations.md) — user-study participants flagged a wide array of friction across the engine (clefs, rhythm, voice independence), sandbox UX (selection, delete, labels), Theory Inspector (verbosity, starter prompts, missed goals, scroll), and audio (crashes, inaudibility). Ship a single refinement pass that raises the baseline before further user studies.

### Approach

Phased plan ordered by risk (engine correctness first, then Document UX, Sandbox, Inspector, Playback, verification). Every phase paired with unit tests so the baseline stays green.

### Steps completed (artifact map)

| Area | What shipped |
|------|--------------|
| **A1. Tenor clef** | [`satbToMusicXML.ts`](../frontend/src/server/engine/satbToMusicXML.ts) `clefXmlForPart` now emits `G/2/-1` (tenor treble clef) for the Tenor voice and explicit "tenor voice" part names; no more mezzo-soprano C-clef surprise. Regression test added to [`filePipeline.test.ts`](../frontend/src/server/engine/filePipeline.test.ts). |
| **A2. Rhythm density** | New `RhythmDensity = "chordal" \| "mixed" \| "flowing"` on `GenerationConfig`; `satbToMusicXML` subdivides slot spans on melody onsets (mixed default) or the smallest melodic value (flowing). Server route accepts `rhythmDensity` in the multipart config. Three new tests. |
| **A3. Voice independence** | [`solver.ts`](../frontend/src/server/engine/solver.ts) `candidateMotionScore` penalizes S-A unison (80) and S-A pitch-class doubling (18) and same-direction/same-distance S-A motion (6); bias visible to both greedy and backtracking passes. Guard test added. |
| **A4. Anacrusis** | Partwise + timewise parsers detect `@implicit="yes"` / `number="0"` / short measure 0 and record `pickupBeats` on `ParsedScore`. `chordInference` starts chord placement at the first downbeat; `satbToMusicXML` builds a variable-length layout that emits measure 0 with `implicit="yes"` + leading rests in harmony staves so downbeats stay aligned. New [`parsers/anacrusis.test.ts`](../frontend/src/server/engine/parsers/anacrusis.test.ts) + pipeline test. |
| **B1. Config persistence** | New [`useGenerationConfigStore`](../frontend/src/store/useGenerationConfigStore.ts) (sessionStorage-backed) holds mood, genre, rhythm density, instruments, and detected key. `EnsembleBuilderPanel` reads from the store; `DocumentPage` rehydrates + seeds detected key from the uploaded score. Five vitest cases. |
| **B2. Harmony motion UI** | Ensemble Builder adds a segmented "Harmony motion" control (Chordal / Mixed / Flowing) with live-hint copy; threaded through `GenerationConfig` → `/api/generate-from-file` → engine. |
| **B3. Plain-language tooltips** | New [`HoverTooltip`](../frontend/src/components/atoms/HoverTooltip.tsx) wraps the existing Tooltip atom with hover/focus state + info-icon trigger. Mood, Genre, Harmony motion, SATB voices now each render an `ℹ︎` tooltip button (e.g. "SATB = Soprano, Alto, Tenor, Bass"). Mood/genre/density buttons also carry `title` attributes. |
| **C1. Selection cursor** | Inline RiffScore CSS override: `cursor: grab` on the score canvas, `cursor: grabbing` while dragging, notehead path/text priority over stem lines (`pointer-events: stroke` on SVG `line`s). |
| **C2. Delete → rest** | New `deleteNotesAsRests` in [`scoreUtils.ts`](../frontend/src/lib/music/scoreUtils.ts) swaps selected events for same-duration rests (keeps IDs, strips articulations/dynamics/tie). `useScoreStore.deleteSelection` now uses it so Delete never alters neighbor durations. New vitest. |
| **C3. 8+16 alignment** | `makeBeatAwareRestNotes` + `normalizeScoreRests` update fill gaps beat-by-beat inside one quarter boundary before crossing into the next. Test covers a measure with `q q 8 16` + ensures the filler starts with a 16th, not a quarter that spans beats. |
| **C4. Labeled toolbar** | RiffScoreEditor toolbar plugins now set `showLabel: true` on every item with plain-language labels + shortcut hints ("Undo ⌘Z", "+ Semitone ↑", "Dotted (.)", "Piano", "Export XML"). |
| **C5. Non-destructive apply** | `handleAcceptCorrection` / `handleAcceptAll` in [`sandbox/page.tsx`](../frontend/src/app/sandbox/page.tsx) flush RiffScore edits to Zustand first, then read the live score — fixes the "feels like undo" regression when accepting a suggestion with unsynced edits. |
| **D1. Starter prompts** | New [`starterPrompts.ts`](../frontend/src/lib/ai/starterPrompts.ts) exports context-specific chip sets (default vs measure vs part vs note). The panel shows a "Suggested starts" card when the chat is empty; clicking a chip sends the verbatim prompt via `sendMessage`. New vitest. |
| **D2. Progressive disclosure** | `useTheoryInspectorStore` gains `showInspectorRationale` (persisted off by default). The three rationale blocks (engine origin, what this click means, verifiable export) now live behind a "Show rationale" toggle so the panel leads with the action-oriented tutor summary + ideas. |
| **D3. Musical goal** | Store adds `musicalGoal`; panel header has a pinned text field ("My musical goal"). Goal is sent on every `sendMessage`, rendered verbatim in the system prompt via `musicalGoalBlock`, so tutor/auditor/stylist align instead of silently contradicting. |
| **D4. Edit this bar** | Measure/part focus card shows an "Edit this bar" CTA that triggers a scoped `requestSuggestion` — the hook filters `scoreContext` to the focused measure (or part) before POSTing to `/api/theory-inspector/suggest`. Ghost corrections apply only to that region. |
| **D5. Honest INTENT** | New `COMMAND_INTENT_BLOCK` in prompts instructs every persona to emit `<<<INTENT>>>{...}` for actions the tutor cannot perform (pickup, key/mood changes, regenerate) or explicitly decline and point at the Document page — never silently refuse. Covered by [`prompts.test.ts`](../frontend/src/lib/ai/prompts.test.ts). |
| **D6. Scroll guard** | Inspector chat `useLayoutEffect` now only auto-scrolls when the user is within 120px of the bottom (or during active streaming). Reading older context no longer snaps back to the latest message. |
| **E1. Playback resilience** | `usePlayback` wraps Tone.start / Part construction / trigger calls in try/catch, exposes `lastError` + `clearError`, resumes AudioContext and applies persisted volume even when RiffScore is the active player. |
| **E2. Volume slider** | New [`useDestinationVolume`](../frontend/src/hooks/useDestinationVolume.ts) hook (lazy-init from localStorage, -6 dB default) + [`VolumeSlider`](../frontend/src/components/molecules/VolumeSlider.tsx) molecule. Rendered in `SandboxHeader` so both RiffScore's internal sampler and the Tone.js fallback (shared `Tone.getDestination()`) pass through the same user-controlled gain. |
| **Build unblock** | `riffscoreAdapter.ts` narrow cast on `ui` object so `toolbarPlugins` (runtime-patched into RiffScore) type-checks cleanly; `make verify` + `make build` both green. |

### Verification

- `make verify` → backend 104 tests + backend lint + engine TS build + Next production build all pass.
- `cd frontend && npm run test` → 70 pass, 1 pre-existing failure (`needsEnginePreviewForExtension.test.ts`; see baseline note above).
- `cd frontend && npm run lint` → exit 0 with 4 pre-existing warnings (matches baseline).
- Manual walkthrough: upload a piece with a pickup → confirm harmony starts on the downbeat; toggle Harmony motion between Chordal/Mixed/Flowing and re-generate; re-navigate Playground ⇄ Document to confirm mood/genre/instruments persist; delete a note in the sandbox → get a rest of the same duration; open the Inspector empty and click a starter chip; state a musical goal and send "can you reharmonize this bar?" → reply should acknowledge goal; click "Edit this bar" on a measure focus card → scoped suggestion arrives; change playback volume via header slider and reload → slider restores.

### Residual / known limitations (unchanged by this pass)

- [`plan.md §1.9m`](plan.md) — PDF→MusicXML / oemer OMR still the main pipeline risk.
- Inspector INTENT block is advisory: the app does not yet auto-route the JSON to a specific handler (e.g. open Document page automatically). Follow-up work can wire the JSON payload into `router.push` / store setters once product picks the mapping.
- RiffScore CSS hit-priority tweak is best-effort; a definitive stem-vs-notehead fix still requires patch-package internals once the library exposes the necessary hooks.

---

<a id="wl-sandbox-exports-2026-04-13"></a>

## Work log — Tactile Sandbox exports (2026-04-13)

### End goal (this slice)

Users edit in the **Tactile Sandbox** (RiffScore + Zustand **`EditableScore`**) and export **exactly what is on the canvas** — not a stale pre-edit snapshot. The export modal should offer **real** downloads for every advertised format (MusicXML, MIDI, PNG, JSON, WAV, ZIP, chord chart, print/PDF), without requiring new engine endpoints for binary/image/audio.

### Approach

1. **Single source of truth:** Treat **`flushToZustand`** as mandatory before any read of **`useScoreStore.getState().score`** for export, copy, save, print, or modal preview XML.
2. **Small shared helper:** **`getLiveScoreAfterFlush(session, getScore)`** in **`frontend/src/lib/music/liveScoreExport.ts`** so toolbar + modal + **`handleExport`** stay consistent.
3. **Modal snapshot:** **`openExportModal`** flushes, then sets **`exportModalMusicXML`** from **`scoreToMusicXML(live)`** (fallback **`generatedMusicXML`** when needed). **`useSandboxTourBridge`** registers **`setExportModalOpenForTour`** so coachmark step 6 uses the same path as the header.
4. **Client-side binaries:** MIDI from **`EditableScore`** walk (reuse **`noteDurationInBeats`** / **`parseBeatsPerMeasure`** from **`playbackUtils.ts`**); WAV from **`scoreToScheduledNotes`** + **`scheduledNotesToSeconds`** + **`Tone.Offline`**; PNG from **`html-to-image`** on the export preview scroll root (**`exportPreviewRef`**); ZIP via **`fflate`** plus existing chord-chart API.
5. **Print:** Keep **`window.print()`** for “PDF”; scope **`@media print`** so chrome (header, inspector, modals, study bar, chat FAB) hides and the score region (**`.hf-sandbox-print-target`**) expands.

### Steps completed

| Step | Outcome |
|------|---------|
| Flush helper + toolbar | **`score-copy`**, **`score-save`**, **`score-print`**, **`score-export`** call **`getLiveScoreAfterFlush`**; export opens via **`openExportModal`**. |
| Header + tour | **`SandboxHeader`** **`onExportClick={openExportModal}`**; bridge **`setExportModalOpenForTour`**. |
| **`handleExport`** | Branches for **`xml`**, **`json`**, **`pdf`**, **`chord-chart`**, **`midi`**, **`png`**, **`wav`**, **`zip`**; live score after flush; **`Blob`**/`Uint8Array` copy for **`fflate`** zip to satisfy **`BlobPart`** typing. |
| MIDI | **`pitchMidi.ts`**, **`scoreToMidi.ts`**, **`scoreToMidi.test.ts`**. |
| WAV | **`scoreToWav.ts`** (`ToneAudioBuffer.get()` → PCM16 WAV). |
| UI | **`ExportOptionsPane`**: Audio row → **WAV**; **`ExportModal`** + **`ScorePreviewPane`**: **`previewContainerRef`**. |
| Print CSS | **`globals.css`**: **`hf-print-hide`**, **`hf-sandbox-print-target`**, **`hf-sandbox-root`** on sandbox layout. |
| Docs | **`Learnings`** subsection under **## Learnings**; this work log. |

### Verification (run)

- **`cd frontend && npm run test`** — includes **`scoreToMidi.test.ts`**.
- **`make lint-frontend`** — exit 0 (existing hook warnings may remain).
- **Manual:** Edit a note → Export → XML/MIDI/JSON/WAV/ZIP reflect edit; print preview shows score-first layout; **Validate harmony** uses modal XML (still **re-solves SATB** on the engine — semantic limitation unchanged).

### Residual / not fixed here

- **PNG:** Captures the **export preview viewport** only, not full vertical stitch for very tall scores.
- **MP3:** Not implemented (WAV only).
- **`POST /api/validate-from-file`:** Still validates engine-reconstructed SATB from uploaded XML, not “user-edited score as authoritative.”
- **Production build:** **`toolbarPlugins`** — **mitigated (2026-04-18)** via narrow `ui` cast in **`riffscoreAdapter.ts`**; re-check **`npm run build`** if RiffScore types or patch drift.

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

<a id="wl-generate-timeout-2026-04-07"></a>

## Work log — Generate timeout mitigation (2026-04-07)

### End goal (for this thread)

Keep the core user flow reliable at runtime: **Upload → Document → Generate → Sandbox**, with generation either finishing quickly or failing with a clear backend budget response (422) instead of the browser hitting a generic 120s abort.

### Approach

1. Keep the existing SATB quality path, but make the fast path deterministic: in solver **`auto`** mode, always attempt greedy first, then fallback to backtracking.
2. Bound file-route wall-clock by default so backend returns explicit budget errors before the browser aborts.
3. Align product messaging and defaults (`Document` timeout + env examples + deployment docs) so operators can tune both sides coherently.
4. Record the learning in docs so this regression does not reappear.

### Steps completed

- **Solver fast path:** `backend/engine/solver.ts`
  - `auto` now always tries greedy first (`strict` then `fallback`) before backtracking.
  - `backtrack` / `exact` modes still skip greedy by design.
  - `HF_GREEDY_THRESHOLD` retained as reserved tuning (no longer gating greedy in `auto`).
- **Route-level wall-clock cap for file flows:** `backend/engine/server.ts`
  - Added `effectiveSolverMaxMsForFileGeneration()`.
  - `POST /api/generate-from-file` and `POST /api/validate-from-file` now default to ~108s solver `maxMs` when `HF_SOLVER_MAX_MS` is unset.
  - `HF_SOLVER_MAX_MS=0` keeps file routes unbounded; `/api/generate-satb` behavior remains unchanged.
- **Regression tests:** `backend/engine/solver.test.ts`
  - Added a mid-length varied progression case (32 slots) to prove greedy-first behavior below the old `N >= 56` gate.
  - Preserved budget-exceeded test behavior with `skipGreedy: true`.
- **Frontend UX + defaults:** `frontend/src/app/document/page.tsx`, `frontend/.env.example`
  - Raised default client timeout to `180000`.
  - Improved timeout copy to separate SATB time from PDF/OMR latency and call out relevant env knobs.
- **Docs synchronization:** `backend/.env.example`, `docs/deployment.md`, `docs/plan.md`, this `docs/progress.md`.

### Verification

- Backend engine suite passes: `cd backend && npm test` (79 tests passing at this checkpoint).

### Current failure we are actively tracking

- **PDF/OMR remains the dominant unresolved latency/reliability risk** (`plan.md` item **1.9m**): `oemer` environment/checkpoint variance can consume most of the request budget or fail before SATB is reached.
- For very complex symbolic scores, SATB can still hit budget; this is now expected and surfaced as a clearer solver-limit path rather than a silent client abort.

---

<a id="wl-intake-symbolic-2026-04-07"></a>

## Work log — Symbolic intake & MusicXML markers (2026-04-07)

### End goal

Users with **valid symbolic scores** (MusicXML, MXL, MIDI) should get **working Document preview and generate** even when:

- The **filename/extension is wrong** (e.g. MusicXML saved as `.txt`, MIDI renamed, `.mxml`, missing extension).
- **MXL (ZIP)** is uploaded with a **`.xml`** name (Playground skips the preview API for `.xml` — Document must still recover).
- The **reviewer-primary** study arm needs the **same melody XML** the preview used (not a raw FileReader read of a ZIP buffer).

**Non-goals (unchanged):** Arbitrary non-music XML, empty scores, and **PDF without working OMR** still fail with clear errors — see **[plan §1.9m](plan.md)**.

### Approach

1. **Single intake truth on the engine** — Extend [`fileIntake.ts`](../frontend/src/server/engine/parsers/fileIntake.ts): keep **ZIP-first** and **PDF** routing; add **`MThd`** sniff for MIDI; treat **`.mxml`** like MusicXML; use **content sniff** (`looksLikeMusicXml`) for unknown extensions; **fallback** MIDI then MusicXML before **400**; **bounded UTF-8 peek** (256 KiB) for sniff-only paths to avoid huge string allocations on random binaries; **empty/whitespace** XML short-circuit in `tryIntakeMusicXmlString`.
2. **Playground preview parity** — Any extension **other than** `.xml` / `.musicxml` calls **`POST /api/to-preview-musicxml`** ([`needsEnginePreviewForExtension.ts`](../frontend/src/lib/ui/needsEnginePreviewForExtension.ts)) so the engine sniffs **ZIP/MIDI/text** consistently; [`page.tsx`](../frontend/src/app/page.tsx), [`HomeViewOnboarding.tsx`](../frontend/src/components/organisms/HomeViewOnboarding.tsx); [`DropzoneCopy`](../frontend/src/components/organisms/DropzoneCopy.tsx) `accept` includes `.mxml`, `.txt`; [`intakeErrorHints.ts`](../frontend/src/lib/ui/intakeErrorHints.ts) broadened for non-PDF engine failures.
3. **Document edge cases** — Prefer **`previewMusicXML`** from the store when set; for `.xml`/`.musicxml` **without** store, read first bytes — if **ZIP**, call the same preview API and **`setPreviewMusicXML`** ([`isProbablyZipBytes.ts`](../frontend/src/lib/music/isProbablyZipBytes.ts)); async cleanup on unmount/file change; clear stale preview while resolving.
4. **Reviewer melody source** — [`readMelodyXml.ts`](../frontend/src/lib/study/readMelodyXml.ts): if **`storePreviewXml`** is non-empty, use it **before** FileReader (covers server-built preview for `.xml` including ZIP mislabel); still FileReader-first when no store.
5. **Markers aligned with `newfiles/harmonize-core.ts`** — Shared root detection via regex for **optional namespace prefixes** on `<score-partwise>` / `<score-timewise>`; used by engine [`musicXmlMarkers.ts`](../frontend/src/server/engine/parsers/musicXmlMarkers.ts), [`musicxmlParser.ts`](../frontend/src/server/engine/parsers/musicxmlParser.ts), and frontend [`musicXmlMarkers.ts`](../frontend/src/lib/music/musicXmlMarkers.ts) + early reject in client [`musicxmlParser.ts`](../frontend/src/lib/music/musicxmlParser.ts); **`extractEmbeddedMusicXml`** matches **prefixed closing tags**.
6. **Dev / ESM interop** — [`midiParser.ts`](../frontend/src/server/engine/parsers/midiParser.ts): **`@tonejs/midi`** is CommonJS; **`import { Midi }`** breaks under **`tsx`** + Node ESM → **`createRequire(import.meta.url)`** anchors resolution reliably.
7. **Docs / plan** — [`docs/plan.md`](plan.md) **`make test-engine`** verification uses **`tour_demo.xml`**; see [deployment.md](deployment.md) and [frontend/README.md](../frontend/README.md) for intake + OMR notes.

### Steps completed (artifact map)

| Area | What shipped |
|------|----------------|
| **Engine intake** | `fileIntake.ts`: `isProbablyMidi`, `bufferToUtf8ScoreText`, `peekUtf8ForMusicXmlSniff`, routing + `ACCEPTED_EXTENSIONS_MESSAGE` (`.mxml`); re-export `looksLikeMusicXml` from `musicXmlMarkers.ts`. |
| **Markers module** | `backend/engine/parsers/musicXmlMarkers.ts` + `musicXmlMarkers.test.ts`; `extractEmbeddedMusicXml` regex-based slice; `musicxmlParser.ts` uses markers + `trim()` guard. |
| **Frontend gate** | `needsEnginePreviewForExtension.ts` + tests; `page.tsx`, `HomeViewOnboarding.tsx`; `intakeErrorHints` + tests (`.txt`/`.mxml`). |
| **Document / ZIP** | `document/page.tsx` store-first + ZIP sniff fetch; `isProbablyZipBytes.ts` + test. |
| **Study** | `readMelodyXml.ts` store-first; `.mxml` in FileReader list when no store. |
| **Client parse** | `frontend/.../musicXmlMarkers.ts` + test; `parseMusicXML` fail-fast when not MusicXML-shaped. |
| **MIDI load** | `midiParser.ts` `createRequire`; `midiParser.test.ts` (minimal SMF). |
| **Regression tests** | `fileIntake.test.ts`: MIDI as `.txt`, MusicXML as `.txt`/extensionless, `.mxml`, prefixed embedded XML; backend **92** tests, frontend Vitest **+** `musicXmlMarkers`, `isProbablyZipBytes`, `needsEnginePreviewForExtension`. |
| **Verify** | `make verify` / `make verify-strict` (frontend lint **0 errors**, existing hook **warnings**). |

### Verification

- `cd backend && npm test` — engine suite (**92** tests at last run).
- `cd frontend && npm run test` — Vitest including **`musicXmlMarkers`**, **`isProbablyZipBytes`**, **`needsEnginePreviewForExtension`**, **`intakeErrorHints`**, **`musicxmlParser`**.
- `make verify` / `make verify-strict`.

### Current failure / what we are working on now

**Primary (unchanged):** **[PDF → MusicXML / oemer — plan §1.9m](plan.md)**. Symbolic intake improvements **do not** make arbitrary PDFs reliable; preview/generate still depend on **pdfalto**, **Poppler**, and **oemer** when ALTO has no embedded MusicXML.

**Secondary / operational:**

- **MIDI `createRequire` anchor:** Resolution uses **`process.cwd()`** + **`package.json`**. **`make dev`** and **`npm test`** run with **`cwd` = `backend/`** — correct. If an operator starts **`node engine/dist/server.js`** from another directory, **`@tonejs/midi`** may fail to load — document **start the engine from `backend/`** or set **`cwd`** accordingly (future hardening: anchor `createRequire` to **`import.meta.url`** once Jest/tsconfig allow it uniformly).
- **Frontend ESLint:** **`make verify-strict`** still reports **exhaustive-deps warnings** on a few sandbox/RiffScore files — not introduced by this pass.
- **Very large symbolic files:** Bounded sniff can miss a **`score-partwise`** root that appears only after the first 256 KiB **and** the extension gives no hint — rare; full parse still runs when extension is `.xml`/`.musicxml`/`.mxml` or path tries full buffer.

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

## Consolidated status (2026-04, updated through 2026-04-20) — end goal, approach, done work, active gaps

> **2026-04-23+ sandbox tranche:** For **RiffScore** alto/tenor vertical placement, **CJS/ESM `toolbarPlugins`** parity, **`pendingClefChange`** runtime cleanup, and **rest-hover** ref/deps hardening, see **[Last updated (2026-04-23)](#last-updated-2026-04-23)** and **[Work log — Sandbox & export polish (2026-04-23)](#wl-sandbox-ux-polish-2026-04-23)**. This section stays the broader April snapshot through **2026-04-20**.

> **Prefer the short summary first:** [Program narrative — where we are (2026-04-20)](#program-narrative-2026-04-20).

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
| **Sandbox exports (2026-04-13)** | Live-score flush (**`liveScoreExport.ts`**); modal XML snapshot + **`openExportModal`**; MIDI/PNG/WAV/ZIP + print CSS; **`html-to-image`**, **`fflate`**; Vitest **`scoreToMidi`**. See **[Work log — Tactile Sandbox exports (2026-04-13)](#wl-sandbox-exports-2026-04-13)**. |
| **Iteration 1+2 study refinement (2026-04-18)** | Engine + Document + Sandbox + Inspector + playback pass from [iterations.md](iterations.md) — see **[Work log — Iteration 1+2…](#wl-study-refinement-2026-04-18)**. |
| **Glass Box pedagogy UI (2026-04-19)** | In-app callouts: deterministic harmony vs Inspector LLM — see **[Work log — Glass Box pedagogy…](#wl-glass-box-pedagogy-2026-04-19)**. |

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
2. **Document what code actually does** — Added a **source spine and engine mapping** in `Taxonomy.md`: hard constraints ↔ `engine/constraints.ts` / `validate-satb-trace`; motion heuristic ↔ `engine/solver.ts` (L1 MIDI sum = **parsimony proxy**, not species counterpoint); Caplin vocabulary ↔ honesty (primary `engine/` path does **not** run full segmentation); legacy chamber-only `planStructuralHierarchy` sketches (external demo, not shipped) labeled heuristic.
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

<a id="multi-format-pdf-intake"></a>

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

## Holistic refinement program (2026-04)

<a id="holistic-refinement-2026-04"></a>

This section records the **end-to-end refinement pass** (backend + frontend + ops) that sequenced user-visible fixes, quality gates, Theory Inspector hardening, backlog scoping, and engine test/doc follow-through. It complements the bullet **Work log** below.

### End goal

Raise **shipping quality** and **honest UX** without claiming a single sprint “fixes the entire repo.” Concretely:

- **Users** see working built-in piano playback where RiffScore expects samples; PDF/MXL/MIDI preview failures explain what failed and where to read next (no fake “full OMR” promise).
- **Contributors** can run **`make verify`** (test + lint + build) and optionally **`make verify-strict`** (adds frontend ESLint); frontend lint is **green with warnings** rather than silently skipped.
- **Theory Inspector** sends **up-to-date score FACT lines** when the user chats after editing; **idea actions** resolve ambiguous staff names more safely when the model omits exact `noteId`s.
- **Backlog** (multi-clef / transposition / JSON deltas) stays **explicitly scoped** (ADR) rather than half-implemented.
- **Backend** intake keeps **regression tests** (e.g. namespaced MusicXML, MXL sniff); **oemer** has a **documented reproducible path** (Docker reference + README).

The open epic that **still defines “done” for file intake** is **[plan.md §1.9m](plan.md)** — production-reliable **PDF → MusicXML** (oemer/checkpoints/infra), not another frontend-only tweak.

### Approach

Work was **ordered by impact and risk** (same structure as the internal holistic refinement plan):

1. **Phase 1 — User-visible:** RiffScore sampler URLs; PDF/preview error copy + doc links.
2. **Phase 2 — Quality bar:** `verify-strict`, ESLint triage on hot paths, narrow ignores for `patches/`; Turbopack/env handled via **`loadEnvConfig(appDir)`** in `frontend/next.config.ts` (avoid `turbopack.root` breaking Tailwind).
3. **Phase 3 — Inspector:** Live evidence refresh on **`sendMessage`**; **`buildLiveNoteExplainInsight`** shared with note explain; **`ideaActionResolve`** longest-name disambiguation + tests.
4. **Phase 4 — Backlog:** **[ADR 003](adr/003-multi-clef-transposition-scope.md)** — vertical slice for transposition; tab deferred; JSON deltas require design + ADR before code.
5. **Phase 5 — Intake:** Extra **`fileIntake`** tests (namespaced XML plain + MXL); Docker/OEMR in root **`Dockerfile`**; see **[deployment.md](deployment.md)**.
6. **Phase 6 — Symbolic intake (2026-04-07):** Engine sniffing (MIDI magic, `looksLikeMusicXml`, `.mxml`, bounded UTF-8 peek); **`musicXmlMarkers`** + prefixed embedded XML; frontend **`needsEnginePreviewForExtension`**, Document ZIP-as-`.xml` + **`readMelodyXml`** store-first; **`@tonejs/midi`** via **`createRequire`** for **`tsx`**. Full narrative: **[Work log — Symbolic intake…](#wl-intake-symbolic-2026-04-07)**.

Each chunk was validated with **`make test`**, **`cd frontend && npm run test`**, **`make lint`**, **`make build`** (and frontend lint where relevant).

### Steps completed (artifact map)

| Area | What shipped |
|------|----------------|
| **RiffScore playback** | `patch-package`: piano sampler **`baseUrl`** → Tone.js **Salamander** (`frontend/patches/riffscore+1.0.0-alpha.9.patch`) — removes `/audio/piano/*.mp3` 404 spam. |
| **Intake / PDF UX** | `frontend/src/lib/ui/intakeErrorHints.ts` + tests; Playground upload errors enriched; anchor **`#multi-format-pdf-intake`**; **[deployment.md](deployment.md)** troubleshooting blurb. |
| **Makefile** | **`verify-strict`** = `verify` + `lint-frontend`. |
| **ESLint** | `frontend/eslint.config.mjs` — ignore `patches/`, `.claude/`; targeted hook fixes elsewhere (e.g. `CoachmarkTourButton`, `StudySessionProvider`, atoms empty `interface` → `type`, `RiffScoreEditor` narrow disable for toolbar refs). |
| **Theory Inspector** | `useTheoryInspector.ts`: **`sendMessage`** rebuilds measure/part FACTs and note evidence from flushed Zustand score; **`patchSelectedNoteInsight`** preserves AI fields; **`buildLiveNoteExplainInsight`** deduplicates explain vs send paths. |
| **Idea actions** | `ideaActionResolve.ts`: longest matching part name in `summary`; **`ideaActionResolve.test.ts`** (Violin vs Violin II; duplicate-name null). |
| **Engine** | `fileIntake.test.ts`: namespaced MusicXML `.musicxml` + ZIP sniff; **2026-04-07:** MIDI/`.txt`/`.mxml`/extensionless + `musicXmlMarkers.ts` + `midiParser` `createRequire`. |
| **Ops / OMR** | `backend/docker/oemer-omr.Dockerfile`; README + deployment cross-links. |
| **Symbolic intake (frontend)** | `needsEnginePreviewForExtension`, `isProbablyZipBytes`, `musicXmlMarkers`, `intakeErrorHints`; Document preview API for mislabeled ZIP; **`readMelodyXml`** prefers **`storePreviewXml`**. |
| **Sandbox exports (2026-04-13)** | **`liveScoreExport.ts`**, **`scoreToMidi.ts`**, **`pitchMidi.ts`**, **`scoreToWav.ts`**, **`html-to-image`**, **`fflate`**; sandbox **`openExportModal`** + print CSS; Vitest **`scoreToMidi.test.ts`**. |

**Optional plan item not implemented:** dev-only / feature-flag demo path that skips OMR and loads **`tour_demo.xml`** — deferred unless product asks for it.

### Current failure / what we are working on now

**Primary engineering risk (unchanged):** **[1.9m PDF → MusicXML](plan.md)** — **oemer** stability (Python 3.10–12, ONNX checkpoints, first-run download, `OEMER_BIN`), plus **pdfalto** and **Poppler** on the host. Arbitrary engraved or scanned PDFs still **often fail** preview/generate; the app now **says so clearly** and points to docs, but **OMR itself** is the remaining multi-day/infra problem.

**Build / TypeScript (resolved 2026-04-18):** **`riffscoreAdapter.ts`** uses a **narrow cast** on the `ui` config so **`toolbarPlugins`** (patch-package) satisfies `tsc`; **`make build`** / **`npm run build`** stay green. **Long-term:** module augmentation if upstream **`RiffScoreConfig`** exposes the field.

**Secondary (non-blocking but real):**

- **Frontend ESLint:** `npm run lint` exits **0** but still reports **`react-hooks/exhaustive-deps`** warnings (e.g. `sandbox/page.tsx`, `CoachmarkOverlay`, `PlaybackScrubOverlay`, `RiffScoreEditor` toolbar memo). Triage or suppress narrowly over time — **`make verify-strict`** is the stricter gate.
- **Idea actions:** Longest-name match helps; **identical duplicate part names**, **off-beat model suggestions**, and **omitted NOTE_IDS** can still block one-click apply — monitor in QA.
- **Turbopack / monorepo:** Residual **lockfile root** warnings may still appear in dev; env loading is fixed per-app via **`next.config.ts`**.
- **§4 Supporting features:** Multi-clef / transposition **not started** as a vertical slice — see **ADR 003**; JSON score deltas **explicitly deferred** until a design pass.
- **MIDI loader `cwd`:** **`@tonejs/midi`** resolves via **`createRequire(join(process.cwd(), "package.json"))`** — correct when the process **`cwd`** is **`backend/`** (`make dev`, Jest). Starting **`node engine/dist/server.js`** from another directory may break MIDI until require is anchored to the module path.

**Operational “next step” for production** (orthogonal to OMR): run the **[deployment.md](deployment.md)** playbook (engine URL → Vercel **`NEXT_PUBLIC_API_URL`** / **`NEXT_PUBLIC_ENGINE_URL`** → **`CORS_ORIGIN`**).

---

## Current Focus

**2026-04-27 session (naturals keyboard · LLM env · audit UX):** End goal, approach, completed steps, and **open failures** are summarized in **[Work log — Sandbox naturals keyboard, LLM env recovery, lay audit copy](#wl-sandbox-naturals-llm-audit-2026-04-27)** — especially **manual QA** on **toolbar `Octave ↓`** ([Iteration 7 follow-up](#wl-iteration-7-followup-2026-04-25-pm)) and **Vercel Preview** env + **redeploy** after **`OPENAI_*`** changes.

**Narrative for the 2026-04 refinement pass:** [Holistic refinement program](#holistic-refinement-2026-04) (end goal, approach, completed steps, **current failure**).

**Primary editor:** Sandbox notation is **RiffScore**-driven with Zustand-backed `EditableScore` sync — not the older VexFlow-first story (see **Consolidated status (2026-04)** above for truth).

**Docs / ops (2026-04-07):** Onboarding and deploy guidance are now in-repo (README set + **[deployment.md](deployment.md)**). **Next operational step** for production is to **execute** that playbook (backend URL → Vercel env → `CORS_ORIGIN`), not more prose. If `node_modules/` was ever fully tracked, run **`git rm -r --cached node_modules`** once, then **`git add node_modules/README.md .gitignore`** and commit.

**Active work / blockers:**
1. **PDF → MusicXML (unresolved OMR)** — Stabilize **oemer** (venv Python 3.11/3.12, checkpoints, `OEMER_BIN`) or choose an alternate path; see **Multi-format intake & PDF → Document preview**, **`requirements.txt`**, and optional reference image **`backend/docker/oemer-omr.Dockerfile`**. Preview/generate wiring exists; **melody extraction from arbitrary PDF** does not yet meet “it just works.”
2. **RiffScore sample URLs** — **Mitigated (2026-04-06):** `patch-package` points the built-in piano sampler at **Tone.js Salamander** (`https://tonejs.github.io/audio/salamander/`) instead of missing `/audio/piano/*.mp3`.
3. **OpenAI in dev / deploy** — **`OPENAI_API_KEY`** = **`sk-…`** secret only; **`OPENAI_MODEL`** = model id (e.g. **`gpt-4o-mini`**). If **swapped**, OpenAI **401** echoes the model name as the “key”; app **`getServerOpenAIEnv()`** can **recover** when one env looks like **`sk-…`** and the other like **`gpt-…`**. **`GET /api/theory-inspector`** returns **`hasApiKey`**, **`configHint`** (optional). Local: **`frontend/.env.local`** + **`make dev`**. Production: **[deployment.md](deployment.md)** — **Preview** vs **Production** env, **redeploy** after edits. See **[Work log — naturals / LLM / audit](#wl-sandbox-naturals-llm-audit-2026-04-27)**.
4. **Turbopack / monorepo env** — **`frontend/next.config.ts`** loads env via `loadEnvConfig(appDir)` so `.env.local` applies without `turbopack.root` (which broke Tailwind `@import`). Residual lockfile warnings are acceptable until Next documents a single-root strategy that preserves CSS resolution.
5. **Tutor follow-up quality** — **Live-score evidence refresh on chat send** implemented (2026-04-06): `sendMessage` rebuilds measure/part FACT lines and note-level blocks from the flushed Zustand score before `POST /api/theory-inspector`. **`make lint-frontend`** exits 0 with a few `react-hooks/exhaustive-deps` warnings; use **`make verify-strict`** for verify + lint.
6. **Idea actions (`<<<IDEA_ACTIONS>>>`)** — **Longest matching part name** in `summary` disambiguates substring collisions (e.g. Violin vs Violin II); duplicate identical names still return null. Still watch: **off-beat suggestions** and **model omitting** `NOTE_IDS`.

**Recently cleared (not a blocker):** **Tactile Sandbox exports (2026-04-13)** — live-score flush, full export modal formats (XML, JSON, MIDI, PNG viewport, WAV, ZIP, chord-chart, print), coachmark parity; see **[Work log — Tactile Sandbox exports…](#wl-sandbox-exports-2026-04-13)**. **Symbolic MusicXML/MIDI intake (2026-04-07)** — mislabeled extensions, `.mxml`, ZIP-as-`.xml` on Document, Playground preview parity via engine API, reviewer **`readMelodyXml`** uses server preview when set; **`make dev`** no longer crashes on MIDI import (`tsx` + **`@tonejs/midi`**). Details: **[Work log — Symbolic intake…](#wl-intake-symbolic-2026-04-07)**. **Theory Inspector explanation-level toggle** removed (2026-04-03); tutor depth is fixed to **`intermediate`** by default—no UI step before chat or suggest. **Inspector split layout + IDEA_ACTIONS + ghost pitch labels + note-input preview label** shipped 2026-04-06; **silent Accept** fixed same pass via **NOTE_IDS** + **`resolveIdeaActionNoteId`**.

**Still valuable from earlier milestones:** Onboarding, session persistence, engine on `:8000`, chord-chart export path, `usePlayback`-based app audio (where still used) — coexist with RiffScore’s internal playback.

**Deferred:** JSON-based score deltas for backend sync (requires design + ADR per **ADR 003**); deeper “click any harmony note → full solver trace” beyond current deterministic slot messages. **Multi-clef / transposition** backlog scoped in **ADR 003** (`docs/adr/003-multi-clef-transposition-scope.md`).

---

### Work log — holistic refinement (2026-04-06)

Short bullets; full narrative + **what we are failing on now** → **[Holistic refinement program](#holistic-refinement-2026-04)**.

- **RiffScore:** Piano sampler base URL patched to Tone.js Salamander CDN (see `frontend/patches/riffscore+*.patch`).
- **PDF / preview UX:** Intake errors link to troubleshooting (`intakeErrorHints`, `deployment.md`, `progress.md#multi-format-pdf-intake`).
- **Verify:** `Makefile` **`verify-strict`** = `verify` + `lint-frontend`; ESLint ignores for `patches/`, `.claude/`.
- **Theory Inspector:** `sendMessage` refreshes **scoreSelectionContext** from live score (measure/part FACT rebuild; note path via **`buildLiveNoteExplainInsight`**); preserves AI fields on note patch.
- **Idea actions:** `resolveIdeaActionNoteId` prefers **longest** staff name match; new Vitest cases.
- **Engine tests:** `fileIntake` covers **namespaced MusicXML** (plain + MXL sniff).
- **Symbolic intake (2026-04-07):** Markers, sniff routing, frontend preview gate, Document ZIP-as-`.xml`, `readMelodyXml` store-first, `midiParser` `createRequire` — see **[Work log — Symbolic intake…](#wl-intake-symbolic-2026-04-07)**.
- **Sandbox exports (2026-04-13):** Live flush, MIDI/PNG/WAV/ZIP, print CSS, modal snapshot — see **[Work log — Tactile Sandbox exports…](#wl-sandbox-exports-2026-04-13)**.
- **Ops:** `backend/docker/oemer-omr.Dockerfile` + README pointer for reproducible oemer.

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
**Genre preset + Milestone 3:**
- **Genre preset**: Added to EnsembleBuilderPanel (Classical, Jazz, Pop). Affects harmony theory only: chord inference (triads vs 7ths vs cyclical), voice-leading strictness (strict vs relaxed). Instruments unchanged.
- **Engine**: `GenerationConfig.genre`, `inferChords(parsed, mood, genre)`, `ensureChords(parsed, mood, genre)`, `generateSATB(leadSheet, { genre })`. Jazz: 7th chords, ii–V–I transitions, relaxed first. Pop: bVII/bVI, cyclical schemas, relaxed first.
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

### Tactile Sandbox exports (2026-04-13)
- **Live score contract:** RiffScore edits are lazy-synced; always **`flushToZustand`** (via **`getLiveScoreAfterFlush`**) before reading **`useScoreStore`** for toolbar copy/save/print, export modal snapshot, and **`handleExport`**.
- **Formats:** Client-side **`scoreToMidiBuffer`** (SMF type 1, meta tempo + one track per part), **`html-to-image`** PNG of export preview pane, **`fflate`** ZIP (MusicXML + MIDI + JSON + server chord-chart text), **`scoreToWavBuffer`** (**`Tone.Offline`** + PCM16 WAV). PDF remains **`window.print()`** with **`.hf-sandbox-print-target`** / **`.hf-print-hide`** print CSS.
- **Coachmark bridge:** **`setExportModalOpen(true)`** must refresh XML like the header — use **`openExportModal`** so preview/validation match flushed state.

### Sandbox flush parity & toolbar dispatch (2026-04-27)
- **After `flushToZustand`:** Prefer **`useScoreStore.getState().score`** for **`transposeNotes`** / selection mutations when the flush just ran — React **`score`** can lag the store by one render.
- **Single dispatcher:** **`onToolbarAction` → `handleToolSelect`** + **`return true`** keeps RiffScore plugin **`hf-action-*`** clicks aligned with F9 palette and avoids **`runToolbarAction`** internal **`applyOnSelection`** (**rAF**) racing transpose.

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

**Handover template (2026-04, refreshed 2026-04-20):**
- **Canonical summary:** **[Program narrative — where we are (2026-04-20)](#program-narrative-2026-04-20)** — end goal, approach, shipped work (including repo hygiene), **current focus** (deploy / study / residual risks — not one blocking bug).
- **End goal:** Upload → Document (preview + config) → Generate → Sandbox with editable score, **multi-format export from the live canvas**, and reliable playback where configured. Engine **adds** harmonies (melody + selected instruments), not replacement. **Glass Box product framing:** harmony generation = deterministic engine; **Theory Inspector** = LLM explain/critique/suggest — see **`GlassBoxPedagogyCallout`** + [work log](#wl-glass-box-pedagogy-2026-04-19). **PDF/MXL/MIDI:** server preview XML before Document when not raw `.xml` (see `to-preview-musicxml`).
- **Approach:** `EditableScore` in Zustand + **RiffScore** sync (`riffscoreAdapter`, `useRiffScoreSync`, `normalizeScoreRests`); **`flushToZustand`** before any export/copy/save/read of store score (**`getLiveScoreAfterFlush`**). **`patch-package`** on `riffscore` for `ui.toolbarPlugins` + playback scrub (`riffscoreAdapter` narrow `ui` cast for `tsc`). **Exports:** client MIDI/PNG/WAV/ZIP + server chord-chart + print CSS — see **[Work log — Tactile Sandbox exports (2026-04-13)](#wl-sandbox-exports-2026-04-13)**. Theory Inspector: deterministic engine + taxonomy context; optional OpenAI via `frontend/.env.local`. **Intake:** `frontend/src/server/engine/parsers/fileIntake.ts` + **`previewMusicXML`** store for Document preview parity. **Recent study-driven pass:** [Iteration 1+2 refinement](#wl-study-refinement-2026-04-18).
- **Current status / focus:** (1) **PDF OMR** — product path **shipped**; Vercel vs Docker trade-offs in **[plan §1.9m](plan.md)** and [deployment.md](deployment.md). (2) **`riffscoreAdapter` / `toolbarPlugins`:** narrow cast — watch upstream types. (3) Piano samples — see [public/audio/piano/README.md](../frontend/public/audio/piano/README.md). (4) LLM — optional `OPENAI_API_KEY`. (5) **Tutor** — residual model variance; mitigated by FACT blocks. (6) Lint — optional hook-warning cleanup. (7) Legacy paragraphs in this file may mention `:8000` / `backend/` — use **[Program narrative (2026-04-20)](#program-narrative-2026-04-20)**.
- **Key files:** `frontend/src/server/engine/parsers/fileIntake.ts`, `frontend/src/server/engine/satbToMusicXML.ts`, `frontend/src/app/api/*/route.ts`, `frontend/src/app/page.tsx`, `document/page.tsx`, `useUploadStore.ts`, `sandbox/page.tsx`, `liveScoreExport.ts`, `scoreToMidi.ts`, `scoreToWav.ts`, `RiffScoreEditor.tsx`, `useRiffScoreSync`, `riffscoreAdapter.ts`, root `requirements.txt`, `frontend/package.json`.
- **Run:** `make dev-clean && make dev` → http://localhost:3000 (single process). `make test-engine` for CLI. **`make docker-build`** / **`make install`** for full PDF OMR; **`make pdfalto`** when vendored pdfalto sources exist under `miscellaneous/pdfalto/`.
