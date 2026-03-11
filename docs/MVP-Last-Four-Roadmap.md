# MVP Last Four Features — Roadmap & Prompting Questions

> **Purpose:** A specific to-do list and prompting questions for implementing the final four MVP features. Use this with `docs/plan.md` and `docs/progress.md` to keep the whole app in mind.

**End goal (from progress.md):** Full flow — Upload → Document (preview + config) → Generate Harmonies → Sandbox — with editable score, **working audio playback**, and Theory Inspector. User remains the ultimate author; additive harmonies; Expressive Sovereignty.

---

## 1. Fix Audio Playback

**Goal:** Make playback reliable and correct: resolve Tone.js runtime errors and fix score-to-events mapping (chord/rest timing, pitch format) so it plays the right notes.

### To-Do List

- [ ] **Tone.js runtime** — Reproduce and fix any remaining errors (e.g. "Start time must be strictly greater"). Verify `scheduledNotesToSeconds` MIN_STEP offset covers all chord cases.
- [ ] **Pitch format** — Ensure Note.pitch (`"C4"`, `"F#5"`) matches Tone.js Synth expectations (scientific notation). Verify parser → EditableScore → playback chain.
- [ ] **Score source** — Confirm `usePlayback` receives `score` from `useScoreStore` when Sandbox loads from `generatedMusicXML`. If OSMD displays but score is null, playback has nothing. **Prompt:** Does parsing `generatedMusicXML` → EditableScore happen on Sandbox mount? Is score populated before play?
- [ ] **Chords** — `scoreToScheduledNotes` iterates notes sequentially; chords (simultaneous notes) need same `startBeat`. Verify multi-part or chord notes share timing and MIN_STEP handles them.
- [ ] **Rests** — Current logic skips rests (only pushes notes). Confirm intended: rests = silence, no Tone event. No action unless rest handling is wrong.
- [ ] **MusicXML divisions** — `playbackUtils` uses fixed `beatsPerMeasure = 4`. Does `EditableScore.divisions` or MusicXML `<divisions>` affect beat mapping? If source has non-4/4 or different divisions, timing may be off.
- [ ] **Manual test** — Upload `月亮代表我的心.xml` → Document → Generate → Sandbox → Play. Does playback match the score?

### Prompting Questions

1. **Data flow:** When Sandbox shows the score (OSMD or VexFlow), is `useScoreStore.score` populated? Or does OSMD render from raw `musicXML` while score stays null?
2. **Pitch mapping:** Does `parseMusicXML` output pitch as `"C4"`/`"F#5"`? Does Tone.js `triggerAttackRelease("C4", duration, time)` work with that format?
3. **Multi-part timing:** All parts share the same timeline. Does `scoreToScheduledNotes` merge parts so melody + flute + cello notes at beat 0 play together?
4. **Tempo:** BPM is fixed at 120. Should tempo come from MusicXML or be user-configurable for MVP?
5. **Edge cases:** Empty measures, grace notes (if present), tuplets — do they break playback or produce wrong timing?

### Key Files

| File | Role |
|------|------|
| `harmony-forge-redesign/src/lib/music/playbackUtils.ts` | `scoreToScheduledNotes`, `scheduledNotesToSeconds` |
| `harmony-forge-redesign/src/hooks/usePlayback.ts` | Tone.Synth, Tone.Part, play/pause/stop |
| `harmony-forge-redesign/src/app/sandbox/page.tsx` | Passes `score` to usePlayback; SandboxPlaybackBar |
| `harmony-forge-redesign/src/lib/music/musicxmlParser.ts` | MusicXML → EditableScore; pitch format |

---

## 2. Get Note Editor Working

**Goal:** Fix the blank canvas in the Sandbox so the editable score (VexFlow/OSMD) displays and note tools (click-on-staff, selection, duration/pitch) work.

### To-Do List

- [ ] **Display priority (ADR 001)** — Current: `musicXML` → OSMD (View), `score` → VexFlow (Edit). If `musicXML` exists but `score` is null, Edit mode may show blank. **Prompt:** Ensure score is derived from musicXML on mount so Edit mode has data.
- [ ] **View ↔ Edit toggle** — Verify switching View → Edit shows VexFlow with correct score. If blank: is score populated? Is VexFlow receiving it?
- [ ] **VexFlow errors** — `handleVexFlowError` falls back to OSMD. Log or inspect what triggers the fallback (TickMismatch, BadElementId, etc.).
- [ ] **Click-on-staff** — Duration tool active → click canvas inserts note. Confirm `activeTool` flows to VexFlowScore/ScoreCanvas and click handler fires.
- [ ] **Selection** — Click note to select; selection highlights. Confirm useToolStore selection + onNoteClick wiring.
- [ ] **Duration/pitch tools** — ScorePalette tools (1–6, A–G, ↑/↓) update selected note. Confirm handlers call score store mutations.
- [ ] **OSMD vs VexFlow layout** — Document page uses OSMD for preview. Sandbox: View = OSMD, Edit = VexFlow. Do both render the same score structure? Any part/measure ordering mismatch?
- [ ] **Session persistence** — After refresh, `restoreFromStorage()` restores `generatedMusicXML`. Does it also restore/parse to score so Edit mode works?

### Prompting Questions

1. **When does score get set?** On Sandbox mount with `generatedMusicXML`, does `parseMusicXML` run and `useScoreStore.setScore` get called? Or is score only set after user edits?
2. **Edit mode entry:** If user lands in View (OSMD), then toggles Edit — does VexFlow receive the same data OSMD showed? Or is VexFlow fed from a different source?
3. **Blank canvas root cause:** Is the blank canvas due to (a) null/empty score, (b) VexFlow crash + fallback, (c) container size/layout, or (d) measure/voice structure (TickMismatch)?
4. **Tool activation:** Are duration/pitch tools only active when Edit mode is on? Does ScorePalette disable them in View mode?
5. **Accessibility:** Does the note editor support keyboard-only workflow (tab, arrows, shortcuts) for Expressive Sovereignty?

### Key Files

| File | Role |
|------|------|
| `harmony-forge-redesign/src/app/sandbox/page.tsx` | ScoreCanvas, displayMode (View/Edit), useScoreStore |
| `harmony-forge-redesign/src/components/score/ScoreCanvas.tsx` | OSMD vs VexFlow branch; musicXML, score, vexFlowCrashed |
| `harmony-forge-redesign/src/components/score/VexFlowScore.tsx` | VexFlow render; onNoteClick, selection |
| `docs/adr/001-sandbox-display-mode.md` | View vs Edit decision |

---

## 3. Onboarding Flow

**Goal:** Add a guided first-time experience (e.g., short tour or help panel) so new users understand Upload → Document → Generate → Sandbox.

### To-Do List

- [ ] **Define first-time** — How to detect? `localStorage`/`sessionStorage` flag (e.g. `harmonyforge_onboarding_complete`)? Or show once per session?
- [ ] **Tour vs help panel** — Tour: step-through overlay (Upload → Document → Sandbox). Help panel: always-available sidebar/modal. Choose one for MVP or combine (tour on first visit + persistent help).
- [ ] **Copy & placement** — Write concise copy per step. Where does it appear? (tooltip, modal, inline callout.)
- [ ] **Non-intrusive** — Respect "Train-of-Thought Preservation." Don’t block the flow; allow skip/dismiss.
- [ ] **Accessibility** — Keyboard navigation, focus management, screen reader labels. POUR-aligned.
- [ ] **Localization** — English-only for MVP? Plan for i18n if needed later.

### Prompting Questions

1. **User persona:** Is the primary user a gigging musician (time-crunched) or educator/student (pedagogy-focused)? Tour length and density should match.
2. **Trigger:** First visit ever? First upload? First time on Document page? First Generate?
3. **Skip/dismiss:** Can user skip entire tour? Resume later? Where is "Don’t show again" stored?
4. **Existing UI:** Does the design system (Sonata, etc.) have patterns for tours/tooltips? Reuse them.
5. **End goal:** After onboarding, user should know: (1) Upload MusicXML/MIDI, (2) Configure mood + instruments, (3) Generate Harmonies, (4) Edit in Sandbox. What’s the minimum to convey this?

### Key Files

| File | Role |
|------|------|
| `harmony-forge-redesign/src/app/page.tsx` | Playground (Upload) — possible tour start |
| `harmony-forge-redesign/src/app/document/page.tsx` | Document — step 2 |
| `harmony-forge-redesign/src/app/sandbox/page.tsx` | Sandbox — step 3 |
| `harmony-forge-redesign/design-system/` or `docs/design/` | Tour/tooltip patterns if any |

---

## 4. Configure AI (Theory Inspector)

**Goal:** After obtaining AI API keys (e.g., from SALT Lab), wire up the Theory Inspector (Auditor, Tutor, Stylist) and configure the API client and RAG from Taxonomy.md.

### To-Do List

- [ ] **API keys** — Obtain OpenAI (or other provider) keys. Store in env (e.g. `OPENAI_API_KEY`). Never commit.
- [ ] **API client** — Create server-side client (Next.js API route or backend proxy) so keys stay server-side.
- [ ] **Auditor** — On score change (or on demand), call `validateSATBSequence` (engine) → map violations to Taxonomy terms → return to TheoryInspectorPanel. **Prompt:** Trigger on edit? On explicit "Validate" click? Rate limit?
- [ ] **Tutor** — User asks "Why is this parallel 5th?" → RAG retrieve from Taxonomy.md (§1 Classical) → LLM formats explanation. No note generation; explainer only.
- [ ] **Stylist** — User says "Make this cadence more Brahms-ian" → LLM suggests candidate edits. User accepts or rejects. Maintain Expressive Sovereignty.
- [ ] **RAG** — Index Taxonomy.md by section (Classical, Jazz, Pop). Retrieve by genre (from GenerationConfig) + violation type. Chunk size? Embedding model or keyword match for MVP?
- [ ] **TheoryInspectorPanel** — Already has violation cards, chat UI, chips. Wire to real API instead of DEFAULT_MESSAGES.
- [ ] **Error handling** — API timeout, rate limit, key missing. Graceful degradation (e.g. "Theory Inspector unavailable").
- [ ] **"Explain and suggest — you decide"** — Ensure UI copy and behavior reinforce: AI explains/suggests; user has final say. No auto-apply of suggested edits without confirmation.

### Prompting Questions

1. **Provider choice:** OpenAI GPT-4o (as in plan)? Or Gemini/Claude if SALT Lab has credits? Same API shape?
2. **Orchestration:** Single prompt vs multi-agent (Auditor → Tutor → Stylist). ComposerX uses GroupChatManager. For MVP, is a single "Theory Inspector" endpoint enough, or do we need distinct Auditor/Tutor/Stylist routes?
3. **RAG scope:** Full Taxonomy.md vs genre-filtered (classical/jazz/pop). How to chunk? By section header? By term?
4. **When to validate:** Every keystroke? On measure blur? On explicit "Validate" button? Balance latency vs cost.
5. **Red Line:** Violation cards exist. Do we need visual "Red Line" markers on the score for flagged notes? If yes, how does ScoreCanvas/VexFlow receive violation positions (measure, beat, part)?
6. **Stylist output:** Candidate edits as JSON (measure, note, change)? Or natural language the user interprets? How does "accept" apply the edit to the score?

### Key Files

| File | Role |
|------|------|
| `harmony-forge-redesign/src/components/organisms/TheoryInspectorPanel.tsx` | Chat UI, violation cards, chips |
| `Taxonomy.md` | RAG source; §1 Classical, §2 Jazz, §3 Pop |
| `docs/Theory-Inspector-Prep.md` | Genre → Taxonomy mapping |
| `engine/validateSATB.ts` | `validateSATBSequence`, violation types |
| `engine/server.ts` | `POST /api/validate-from-file` (exists) |

---

## Whole-App Considerations

When implementing any of the four features, ask:

1. **Flow continuity** — Does the change preserve Upload → Document → Generate → Sandbox? Any new redirects or dead ends?
2. **Session state** — Does `useUploadStore` and `sessionStorage` still behave? Does refresh/reopen keep the user’s place?
3. **CORS & env** — `CORS_ORIGIN`, `NEXT_PUBLIC_API_URL`. Do new API calls (e.g. Theory Inspector) need new env vars?
4. **Expressive Sovereignty** — Does the feature give the user more control, or take it away? Onboarding should inform; Theory Inspector explains/suggests; playback and note editor enable direct manipulation.
5. **Verification** — After each feature: `make test && make lint && make build`. Manual: full flow with 月亮代表我的心.xml.

---

## Suggested Order

1. **Note Editor** — Foundation: if Edit mode doesn’t work, playback and Theory Inspector have less to operate on.
2. **Audio Playback** — High-impact; users expect to hear their arrangement. Depends on score being correct.
3. **Onboarding** — Improves first-run UX; can be done in parallel with AI work.
4. **Configure AI** — Requires keys and backend; can iterate after the other three are solid.

---

## Verification Checklist (Post-MVP)

- [ ] `make test` passes
- [ ] `make lint` passes
- [ ] `make build` passes
- [ ] `make test-engine` passes
- [ ] Full flow: Upload → Document → Generate → Sandbox
- [ ] Sandbox: View mode shows score (OSMD)
- [ ] Sandbox: Edit mode shows score (VexFlow), tools work
- [ ] Sandbox: Playback plays correct notes
- [ ] Onboarding: First-time user sees tour/help
- [ ] Theory Inspector: Validate + explain (with API keys)
