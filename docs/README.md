# Documentation hub

> **You are in `docs/`** — plans, architecture notes, and long-running logs.  
> **New to the repo?** Start at the root [README.md](../README.md), then come back here when you need detail.

---

## Suggested reading order

```text
1. Root README     →  what the product is + how to run
2. plan.md         →  what is built vs still open (checklist)
3. progress.md     →  how we got here (work log)
4. system-map.md   →  how pieces connect (diagram)
```

---

## Doc map (everything in this folder)

```mermaid
flowchart LR
  A[plan + progress] --> B[system-map + ADRs]
  B --> C[Taxonomy + theory prep]
  C --> D[verification prompts]
  D --> E[engine test log]
```

---

### Core workflow (read these first)

| File | Plain-English purpose |
|------|------------------------|
| [plan.md](plan.md) | Goals, research notes, and the numbered checklist (backend, frontend, inspector, verification). |
| [progress.md](progress.md) | Running log: what we tried, what worked, what is still rough. |
| [MVP-Last-Four-Roadmap.md](MVP-Last-Four-Roadmap.md) | Tight list + prompting questions for the last MVP feature bundle. |

### Architecture

| File | Plain-English purpose |
|------|------------------------|
| [context/system-map.md](context/system-map.md) | Picture of how the browser app, engine API, and inspector talk to each other. |

### Theory and AI prep

| File | Plain-English purpose |
|------|------------------------|
| [Taxonomy.md](Taxonomy.md) | Shared vocabulary linking textbooks to what the code actually does (feeds the inspector). |
| [Theory-Inspector-Prep.md](Theory-Inspector-Prep.md) | Early design notes (genre ↔ taxonomy); partly historical. |

### Verification and automation prompts

| File | Plain-English purpose |
|------|------------------------|
| [verification-prompt.md](verification-prompt.md) | Copy-paste checklist to regression-test upload → document → sandbox. |
| [PROMPT.md](PROMPT.md) | Stricter “agent” instructions: read key docs, run `make test` / `make lint`, fix until green. |

### Engine testing notes

| File | Plain-English purpose |
|------|------------------------|
| [Engine-Test-Run-Log.md](Engine-Test-Run-Log.md) | Chord-progression smoke tests and follow-up ideas. |

### Architectural Decision Records (`adr/`)

| File | Plain-English purpose |
|------|------------------------|
| [adr/001-sandbox-display-mode.md](adr/001-sandbox-display-mode.md) | Why we switch between “view” (OSMD) and “edit” (VexFlow) modes in older paths. |
| [adr/002-m4-mvp-onboarding-inspector-playback.md](adr/002-m4-mvp-onboarding-inspector-playback.md) | How we shipped onboarding, inspector wiring, and playback for the MVP milestone. |

---

## Code outside `docs/`

| Location | README |
|----------|--------|
| [../frontend/](../frontend/) | [../frontend/README.md](../frontend/README.md) |
| [../backend/](../backend/) | [../backend/README.md](../backend/README.md) |
