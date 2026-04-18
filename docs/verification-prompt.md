# HarmonyForge Flow Verification Prompt

Use this prompt to iteratively verify and fix the upload → document → sandbox flow. The agent should run through the task continuously until it is complete, correcting errors and fixing issues without stopping.

---

## Prompt (copy and run)

```
Verify the HarmonyForge end-to-end flow is ready for testing:

1. **Flow**: Upload (/) → Document (/document) → Generate → Sandbox (/sandbox)
   - User uploads MusicXML or MIDI
   - Document page shows preview (left) + mood/instruments config (right)
   - User clicks Generate Harmonies → backend returns SATB MusicXML
   - Sandbox shows unified score with harmonies for editing

2. **Tasks** (run in order; fix any failure before proceeding):
   - Run `make test` — all engine tests must pass
   - Run `make lint` — engine lint must pass
   - Run `cd frontend && npm run build` — frontend must build
   - Trace the data flow: useUploadStore (file, generatedMusicXML), parseMusicXML, VexFlowScore
   - Ensure redirects: /document without file → /; /sandbox without generatedMusicXML → /document
   - Ensure Document page parses .xml/.musicxml for preview; MIDI shows "Preview after Generate"
   - Ensure EnsembleBuilderPanel passes { mood, instruments } to handleGenerate
   - Ensure backend POST /api/generate-from-file accepts file + config, returns MusicXML

3. **Iterative loop**: If any step fails:
   - Fix the error
   - Re-run the failed step
   - Continue until all steps pass
   - Do NOT stop until the flow is verified end-to-end

4. **Final check**: Update @progress.md "Current Status" if any fixes were made.
```

---

## How to Use

1. Pin `@docs/plan.md`, `@docs/progress.md`, `@docs/context/system-map.md`
2. Paste the prompt above
3. The agent will run tests, fix failures, and iterate until complete
4. Inspired by iterative refinement patterns (e.g. SPARC Refinement, NotebookLM task completion)

---

## Manual Test Steps (after verification)

1. `make dev-clean` — clear ports 8000, 3000
2. Terminal 1: `cd backend && npm run dev:backend` (port 8000)
3. Terminal 2: `cd frontend && npm run dev` (port 3000)
4. Open http://localhost:3000
5. Upload 月亮代表我的心.xml (or any .xml/.mid)
6. On Document: see preview, set mood (Major/Minor), pick instruments, click Generate Harmonies
7. Wait for overlay, then Sandbox loads with SATB score
8. Edit notes (select, duration, pitch, etc.), open **Export** — confirm **MusicXML / JSON / MIDI / WAV / ZIP / chord chart** reflect edits (live score after RiffScore **flush**); **PNG** captures export preview viewport; **PDF** uses browser print (chrome hidden via print CSS). See **[progress.md — Tactile Sandbox exports](progress.md#wl-sandbox-exports-2026-04-13)**.
