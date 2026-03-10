# HarmonyForge End-to-End Flow — Run Until Completion

You are an AI coding agent. Your task is to **ensure the HarmonyForge upload → document → sandbox flow works end-to-end** and to **fix any errors you encounter**. Do not stop until the flow is verified working.

## Mandatory Workflow

1. **Read context first.** Pin and read: `@docs/plan.md`, `@docs/progress.md`, `@docs/context/system-map.md`, `@.cursor/rules/architecture.mdc`.

2. **Verify the flow.** The user journey must work:
   - **Step 1 (Playground)**: Upload music (XML, MIDI) via `harmony-forge-redesign/src/app/page.tsx` → file stored in `useUploadStore` → navigate to `/document`.
   - **Step 2 (Document)**: See uploaded score preview in left pane (`ScorePreviewPanel`), configure mood (Major/Minor) and instruments in right pane (`EnsembleBuilderPanel`), click "Generate Harmonies" → POST to `http://localhost:8000/api/generate-from-file` → store generated MusicXML → navigate to `/sandbox`.
   - **Step 3 (Sandbox)**: See unified SATB score with harmonies as parts, edit via `ScorePalette` (selection, duration, pitch, articulation, dynamics, measure tools).

3. **Run verification.** Execute `make test` and `make lint` from the project root. Fix any failures.

4. **Fix errors iteratively.** If you encounter:
   - Parse errors → fix `harmony-forge-redesign/src/lib/music/musicxmlParser.ts` or backend parsers.
   - VexFlow empty canvas → fix `harmony-forge-redesign/src/components/score/VexFlowScore.tsx` (BarNote between measures, `voice.setStrict(false)`).
   - API errors → fix `engine/server.ts` or `engine/filePipeline`.
   - Redirect loops → ensure `useUploadStore` (file, generatedMusicXML) is used correctly; redirects: no file → `/`, no generatedMusicXML → `/document`.
   - React hooks / lint errors → fix declaration order, dependency arrays.

5. **Re-run verification after each fix.** Run `make test` and `make lint` again. Do not proceed until both pass.

6. **Manual test checklist.** Document that the user can:
   - Start backend: `npm run dev:backend` (port 8000)
   - Start frontend: `cd harmony-forge-redesign && npm run dev` (port 3000)
   - Upload `月亮代表我的心.xml` (or any MusicXML)
   - See sheet music in Document page left pane
   - Select mood (Major/Minor), pick instruments
   - Click Generate Harmonies, wait for overlay
   - Land in Sandbox with SATB score, edit notes

## Completion Criteria

You are **done** when:
- `make test` passes (all engine tests)
- `make lint` passes (engine ESLint)
- No blocking errors in the flow (parse, API, VexFlow, redirects)
- The manual test checklist is achievable

## Self-Correction Loop

If at any point you hit an error:
1. Diagnose the root cause.
2. Apply a minimal fix.
3. Re-run `make test` and `make lint`.
4. If they fail, fix again. Repeat until both pass.
5. Then re-verify the flow (steps 1–3 above).

Do not declare the task complete until all criteria are met. If you are unsure, run the verification again.

## Exit Behavior

When all completion criteria are met, exit with code 0. If unresolved errors remain, exit with a non-zero code. This allows a retry loop such as:

```bash
while ! cat PROMPT.md | npx --yes @sourcegraph/amp; do sleep 5; done
```

The loop will retry every 5 seconds until the agent succeeds (exit 0).
