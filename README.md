# HarmonyForge

**HarmonyForge** is a *Glass Box* co-creative system for symbolic music arrangement. It helps musicians generate harmony parts from melodies using deterministic, rule-based music theory — not probabilistic AI — so the musician stays the ultimate author and understands how every note was chosen.

## What It Is

HarmonyForge takes your melody (from MusicXML or MIDI), infers chords, and generates SATB-style harmony parts in line with classical, jazz, or pop conventions. The engine adds harmony parts to your melody rather than replacing it. You configure mood (major/minor), instruments, and genre, then edit the result in a tactile notation sandbox.

**Core principles:**
- **Expressive sovereignty** — You remain the author; the system is a “jumping pad” for your ideas
- **Copyright safety by design** — Uses axiomatic music theory (Fux, Schenker, Aldwell & Schachter) instead of pattern mimicry from datasets
- **Pedagogical partner** — The Theory Inspector explains and suggests; you decide

## What HarmonyForge Is (and Isn’t)

**What it is:**
- A **deterministic constraint-satisfaction engine** (CSP, HarmonySolver lineage) — no probabilistic guessing
- A **Glass Box** system: ante-hoc transparency, "Red Line" validation, explainable logic
- **Symbolic only**: MusicXML/MIDI and workflow — no audio synthesis, diffusion, or waveform generation
- **Tactile sandbox** with Edit-Authority: direct manipulation; you override and refine
- **AI as assistant, not creator**: The Theory Inspector uses LLMs as explainers and suggestors — it explains violations, suggests fixes, answers questions. It does not generate notes or fixes. **Agency stays with the human.**

**What it is not:**
- **Not a Black Box**: No DeepBach-style probabilistic harmonization, no Anticipatory Transformer–style pattern mimicry
- **Not trained on copyrighted datasets**: Axiomatic theory (Fux, Aldwell & Schachter) replaces Lakh MIDI–style training
- **Not audio/synthesis**: No diffusion, text-to-audio, or mixing — strictly symbolic arrangement
- **Not full automation**: We reject "AI does everything." HarmonyForge shifts AI from generator to explainer/suggestor, giving agency back to the musician.

## Research Background

HarmonyForge is a [SALT Lab](https://ischool.illinois.edu/people/yun-huang) research project (University of Illinois). Current generative music AI (e.g., Anticipatory Music Transformer, DeepBach) is dominated by "Black Box" probabilistic models that produce structural drift — parallel fifths, voice-crossing, melodic hallucinations — forcing musicians into a strenuous "Repair Phase Bottleneck." The time saved by AI is lost to manual auditing. HarmonyForge replaces probabilistic guessing with an **Axiomatic Hierarchy**: a deterministic constraint-satisfaction engine (Logic Core) that guarantees theoretically valid SATB, paired with a tactile notation sandbox (Edit-Authority) and a future Theory Inspector (LLM as explainer, not generator).

**Target users:** (1) **Gigging musicians** — fast arrangements for ad-hoc "Random Ensembles" (e.g., violinist covering cello for tonight's gig); (2) **Music educators & students** — Theory Inspector as scaffolding; (3) **Chamber ensemble coordinators** — reducing Mechanical Toil and enabling repertoire expansion.

## User Flow

1. **Playground** (`/`) — Upload MusicXML, MIDI, or MXL
2. **Document** (`/document`) — Preview the score, set mood (Major/Minor), pick instruments (e.g. Flute, Cello), optionally choose genre, then click **Generate Harmonies**
3. **Sandbox** (`/sandbox`) — View and edit the generated score (melody + harmony parts) with notation tools, playback, and export

## Quick Start

```bash
make install       # Install dependencies
make dev           # Start backend (port 8000) + frontend (port 3000)
```

Open **http://localhost:3000**.

```bash
make dev-clean     # Clear ports if "Address already in use"
make test-engine   # CLI test: input/月亮代表我的心.xml → output/ (melody + flute + cello, major)
```

## Project Structure

| Path | Purpose |
|------|---------|
| `engine/` | Backend: constraint-satisfaction SATB solver, parsers (MusicXML, MIDI), chord inference, MusicXML output |
| `harmony-forge-redesign/` | Tactile Sandbox frontend: Next.js, VexFlow, OSMD, Tone.js, Zustand |
| `chamber-music-fullstack/` | Legacy/alternative full-stack implementation |
| `input/` | Sample input files for CLI |
| `output/` | Generated MusicXML from CLI |
| `scripts/` | CLI runner for engine (`run-engine-cli.ts`) |
| `Taxonomy.md` | Canonical music-theory lexicon for Theory Inspector RAG |

## Related Resources

| Resource | Description |
|----------|-------------|
| [**HarmonyForge LLM Stress Test**](https://huggingface.co/spaces/dgeni2/HarmonyForge_LLM_Stress_Test) | Empirical evaluation of 4 LLMs (Gemini, Grok, KimiK, ChatGPT) on harmonic generation from a single melody. Outputs checked for melodic hallucinations, voice-leading violations, rhythm/cadence errors. Findings motivate the axiomatic approach: deterministic logic for correctness; LLMs as explainers, not generators. |
| [**HF Thematic Analysis Dashboard**](https://huggingface.co/spaces/dgeni2/HFThematicAnalysis) | Thematic analysis from 21 musician interviews. Themes cover part availability, manual adaptation pain points, AI tool perceptions, human-centric design needs. MoSCoW tables for feature priorities. Formative evidence for HarmonyForge's design. |

## The `docs/` Directory — Navigation

The `docs/` folder holds plans, progress logs, ADRs, and architecture. For current status and roadmap, **go there, not this README**.

| File / Folder | What to find |
|---------------|--------------|
| `docs/plan.md` | Build plan, verification criteria |
| `docs/progress.md` | Session summaries, known issues, next steps |
| `docs/context/system-map.md` | System architecture and data flow (Mermaid) |
| `docs/adr/` | Architectural Decision Records (e.g., View vs Edit mode) |
| `docs/Engine-Test-Run-Log.md` | Engine test matrix, chord progression coverage |
| `docs/Theory-Inspector-Prep.md` | Genre → Taxonomy mapping, RAG integration |
| `docs/verification-prompt.md` | End-to-end flow verification checklist |

## Commands

| Command | Description |
|---------|-------------|
| `make install` | Install root + frontend dependencies |
| `make dev` | Run backend + frontend (full stack) |
| `make dev-backend` | Backend only (port 8000) |
| `make dev-frontend` | Frontend only (port 3000) |
| `make dev-clean` | Kill processes on ports 8000, 3000, 3001 |
| `make test` | Engine tests |
| `make lint` | Engine ESLint |
| `make build` | Build engine + Next.js production |
| `make test-engine` | CLI: run engine on `input/` → `output/` |

## License

Private. See repository settings.
