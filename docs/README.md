# HarmonyForge — documentation index

Canonical map of markdown under **`docs/`**. For repo layout and commands, start at the root **[README.md](../README.md)**.

## Core workflow

| Doc | Purpose |
|-----|---------|
| [plan.md](plan.md) | Objectives, research notes, numbered checklist (Logic Core, Sandbox, Theory Inspector, verification). |
| [progress.md](progress.md) | RALPH work log, session notes, consolidated status, gaps. |
| [MVP-Last-Four-Roadmap.md](MVP-Last-Four-Roadmap.md) | Focused roadmap and prompting questions for the last MVP feature cluster. |

## Context and architecture

| Doc | Purpose |
|-----|---------|
| [context/system-map.md](context/system-map.md) | System diagram and data flow between frontend, backend, and inspector. |

## Theory and AI prep

| Doc | Purpose |
|-----|---------|
| [Taxonomy.md](Taxonomy.md) | RAG lexicon for the Theory Inspector (theory sources ↔ engine behavior). |
| [Theory-Inspector-Prep.md](Theory-Inspector-Prep.md) | Early inspector prep notes (genre ↔ taxonomy mapping; historical “no AI yet” status). |

## Verification and agent prompts

| Doc | Purpose |
|-----|---------|
| [verification-prompt.md](verification-prompt.md) | Copy-paste prompt to regression-test upload → document → sandbox. |
| [PROMPT.md](PROMPT.md) | Stricter agent workflow: read plan/progress/system-map, run `make test` / `make lint`, fix until flow passes. |

## Engine and tests

| Doc | Purpose |
|-----|---------|
| [Engine-Test-Run-Log.md](Engine-Test-Run-Log.md) | Chord-progression smoke results and refinement notes (HFLitReview). |

## Architectural Decision Records (`adr/`)

| ADR | Purpose |
|-----|---------|
| [adr/001-sandbox-display-mode.md](adr/001-sandbox-display-mode.md) | View (OSMD) vs edit (VexFlow) display mode decision. |
| [adr/002-m4-mvp-onboarding-inspector-playback.md](adr/002-m4-mvp-onboarding-inspector-playback.md) | M4 MVP strategy: playback, onboarding, inspector wiring. |

## Application code (outside `docs/`)

| Path | Purpose |
|------|---------|
| [../frontend/](../frontend/) | Next.js Tactile Sandbox — see [frontend/README.md](../frontend/README.md). |
| [../backend/](../backend/) | Deterministic engine + HTTP API — see [backend/README.md](../backend/README.md). |
