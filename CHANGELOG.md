# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates reflect merge/commit activity on `main` where known.

## [Unreleased]

- Documentation: root README visuals link, this changelog, and [iteration coverage](docs/ITERATION_COVERAGE.md) aligned with course iteration rubric.

## [2026-05] — Inspector, deploy, assets

### Changed

- Theory Inspector: explanation empty-state copy and prompt refinements (`Explanation prompt` commits).
- UI polish on sandbox/document surfaces (`UI fixes`, `Letter Name Updates`, `This Note Box`).
- Removed Advanced document controls from ensemble UI in favor of store-driven defaults (`Adv removed and API replaced`).

### Fixed

- RiffScore patch regenerated against upstream package (`fix: regenerate riffscore patch`).
- Curly-quote issues in editor strings for toolchain compatibility.

## [2026-04] — Iterations 6–7, reliability, media

### Added

- Localized harmony API: `POST /api/generate-harmony-range` and client wiring for bar/range regeneration in sandbox (`Iteration 6 refinements`, sandbox handler).
- Pedal vs follow bass rhythm mode in generation config and engine path (`bassRhythmMode`).
- SVG instrument artwork under `frontend/public/instruments/` (`feat(iter6): … SVG instrument images`).
- HarmonyForge screen recording at repo root: [`HarmonyForge_Video_Demo.mov`](HarmonyForge_Video_Demo.mov).

### Changed

- Iteration 7: unified keyboard/toolbar pitch handling, Theory Inspector alternatives and rhythm guard, ensemble copy, melody-duration regression coverage (`Iteration 7`, follow-ups in `docs/progress.md`).
- Sandbox editor reliability: post-flush `useScoreStore` score for transpose; toolbar → `handleToolSelect` parity (`docs/progress.md` — 2026-04-27).
- Theory Inspector UI and RiffScore editor refinements; removed error overlay noise.

### Removed

- Stale timestamped PNGs in favor of SVG instruments (`chore: remove stale timestamped PNGs…`).
- Preview timbre selector UI (per study follow-up; standard playback path retained) — see `docs/progress.md` Iteration 7 follow-up.

### Fixed

- Turbopack / `pdfjs-dist` resolution; Vercel `vercel.json` and engine import paths.

## [2026-04] — Iteration 3, env, deployment

### Changed

- Document flow and classical-only generation scope; learner note-name labeling (`Iteration 3 changes`, `Letter Name Updates` where applicable).
- OpenAI env simplified to API-key-first templates (`chore: simplify OpenAI env…`).

### Added

- Azure Container Apps deployment workflow and related fixes (separate from single-process Vercel app; see `docs/deployment.md`).

---

Earlier history (MVP, onboarding, consolidation, PDF pipeline) is summarized in [docs/progress.md](docs/progress.md) and [docs/plan.md](docs/plan.md).
