# ADR 003: Multi-clef, transposition, and score-sync backlog

## Status

Accepted (2026-04-19) — vertical slice shipped. See `frontend/src/server/engine/satbToMusicXML.ts`
(`resolveInstrumentTranspose`) and `frontend/src/server/engine/transpose.test.ts`.

## Context

[plan.md](../plan.md) §4 calls for **multi-clef layouts**, **transposing instruments** end-to-end, richer **multi-instrument selection**, and eventually **JSON-based score deltas** for editor sync. Today the MVP path assumes a constrained staff model (melody + generated harmony, SATB when aligned).

## Decision

1. **Vertical slice first:** Before broad multi-clef work, ship **one transposing instrument** correctly in **parse → internal pitch → display/export** (single clef change + concert vs written pitch), with tests. Expand only after that slice is stable.
2. **Tablature:** Chord-chart export remains the tab-adjacent path; **full tablature** stays **deferred** until product reprioritizes.
3. **JSON score deltas:** No implementation until a short **design note + ADR** covers conflict resolution, versioning, and RiffScore round-trip guarantees. This item is explicitly **out of scope** for opportunistic PRs.

## Consequences

- Parser and `EditableScore` changes stay reviewable and testable per slice.
- Avoids half-finished transposition that breaks inspector, playback, or export.
- JSON sync remains a deliberate architecture step, not a drive-by feature.

## 2026-04-19 update — first slice landed

- `satbToMusicXML.ts` emits `<transpose><diatonic/><chromatic/></transpose>` per part for
  Bb clarinet / Bb trumpet / Bb soprano sax / A clarinet / Eb alto sax / F horn.
- Solver keeps operating in concert pitch; the `<transpose>` element drives
  written-pitch display in MuseScore / OSMD while playback uses the sounding notes.
- `transpose.test.ts` covers detection + XML output. Concert-pitch instruments
  (flute, cello, violin) remain untransposed.
- Next slice candidates: multi-clef writer (soprano clef, alto clef), written↔concert toggle in the Ensemble Builder.
