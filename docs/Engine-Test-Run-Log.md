# Engine Test Run Log & Refinement Recommendations

> Per #74. Knowledge base: HFLitReview (NotebookLM).

## Test Cases (Explicit Chord Progressions)

| Progression | Key | Genre | Result |
|-------------|-----|-------|--------|
| I–IV–V7–I | C major | classical | ✓ |
| ii–V7–I | C major | classical | ✓ |
| I–vi–IV–V | C major | pop (doo-wop) | ✓ |
| i–iv–V–i | A minor | classical | ✓ |
| I–V–vi–IV | C major | pop (singer/songwriter) | ✓ |
| V7–I (with melody) | C major | classical | ✓ |
| ii7–V7–I | C major | jazz (relaxed) | ✓ |

## Implemented Refinements (HFLitReview)

1. **Validation ordering** — Hard checks first: `checkChordConstraints` (range, spacing, voice order) → parallel fifths → parallel octaves → voice overlap. Short-circuit before soft checks.

2. **Parsimonious voice-leading** — `candidateMotionScore` prefers smaller motion (common tones = 0, stepwise = 1–2, leaps = higher). Lower total motion ranks first in backtracking.

3. **Genre-based parameter tuning** — Classical: strict voice-leading first. Jazz/Pop: relaxed (allow parallel fifths/octaves) first. Chord inference: triads vs 7ths vs cyclical schemas per genre.

4. **Test coverage** — 6+ explicit chord progression tests in `engine/solver.test.ts`.

## Future Recommendations (from HFLitReview)

- **Smoothness factor (S)** — Tunable parameter: S=0 = nearest harmonic tone (smoothest); S>0 = introduce controlled leaps.
- **Continuous penalty weights** — Replace binary rule matching with continuous evaluation for soft rules (e.g., tripled seventh vs irregular doubling).
- **Leading-tone resolution** — Cadence-anchor pruning: prefer contrary motion in outer voices, stepwise soprano at cadence.
- **Scale-specific heuristics** — For stepwise diatonic melodies, prefer chord tones that match scale degrees.
