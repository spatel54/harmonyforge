# ADR 003: Multi-clef, transposition, and score-sync backlog

## Status

Proposed (2026-04-06)

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
