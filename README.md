# HarmonyForge

> Upload a melody, get rule-based harmonies you can **edit**, **hear**, and **ask questions about** — with a transparent engine, not a black-box model.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/salt-family/harmonyforge&root-directory=frontend)

---

## Start here

| If you want… | Go to… |
|----------------|--------|
| Run locally | [Quick start](#quick-start) |
| Repo layout | [Layout](#repository-layout) |
| Deploy | [docs/deployment.md](docs/deployment.md) |
| Roadmap / history | [docs/README.md](docs/README.md) → `plan.md`, `progress.md` |

---

## What ships in one process

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                  One Next.js app (src/server/engine + src/app)          │
├──────────────────────────┬──────────────────────────┬───────────────────┤
│   Logic Core (engine)    │    Tactile Sandbox       │ Theory Inspector  │
│   src/server/engine/*    │    src/app/sandbox       │   /api/theory-*   │
├──────────────────────────┼──────────────────────────┼───────────────────┤
│ Parse files              │ Upload & configure       │ Explain notes     │
│ Infer chords             │ Edit in RiffScore        │ Chat & stylist    │
│ Solve SATB voicings      │ Play & export            │ Optional OpenAI   │
│ Runs in /api/* handlers  │ Browser :3000            │ key in .env.local │
└──────────────────────────┴──────────────────────────┴───────────────────┘
```

- **Single deployable** — engine lives in Next.js route handlers. No separate API host.
- **You stay the author** — harmonies from theory rules; the LLM **explains** and **suggests** when enabled.
- **Inputs** — MusicXML, MIDI, MXL, PDF (preview everywhere; full OMR on self-hosted Docker — [deployment.md](docs/deployment.md)).

---

## Your journey

| Step | URL | What happens |
|------|-----|----------------|
| 1 | `/` | Upload |
| 2 | `/document` | Preview, config, **Generate** |
| 3 | `/sandbox` | RiffScore, playback, Theory Inspector |

---

## Quick start

```bash
make install    # npm in frontend/ (+ optional Python deps for local OMR)
make dev        # Next.js on :3000
```

Open **http://localhost:3000**.

**Theory Inspector:** copy [`frontend/.env.example`](frontend/.env.example) → `frontend/.env.local` and set `OPENAI_API_KEY`.

---

## Repository layout

```text
harmonyforge/
├── Makefile              install, dev, test, lint, build, pdfalto, docker-*
├── Dockerfile            optional self-hosted image (Node + pdfalto + Poppler + oemer)
├── docker-compose.yml
├── requirements.txt      Python deps for local/Docker OMR (oemer, etc.)
├── frontend/             Next.js — only Node app
├── docs/                 plan, progress, ADRs, design/, deployment
├── miscellaneous/        vendored pdfalto build
└── .cursor/              optional Cursor rules
```

CI: [`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs test + lint + build on `frontend/`.

---

## Documentation

| Doc | Use for |
|-----|---------|
| [docs/README.md](docs/README.md) | Full index |
| [docs/plan.md](docs/plan.md) | Checklist |
| [docs/progress.md](docs/progress.md) | Log |
| [docs/context/system-map.md](docs/context/system-map.md) | Deep architecture |
| [docs/deployment.md](docs/deployment.md) | Vercel + Docker |
| [docs/design/](docs/design/) | UI tokens & page overrides |
| [docs/Taxonomy.md](docs/Taxonomy.md) | Theory vocabulary |

---

## Commands (repo root)

| Command | What it does |
|---------|----------------|
| `make install` | `npm install` in `frontend/` (+ optional `pip install -r requirements.txt`) |
| `make dev` | Next dev server |
| `make dev-clean` | Free ports 3000 / 3001 + Next dev lock |
| `make test` | Vitest (UI + engine tests) |
| `make lint` | ESLint |
| `make build` | Production build |
| `make verify` | test + lint + build |
| `make pdfalto` | Build vendored pdfalto under `miscellaneous/pdfalto/` |
| `make docker-build` / `make docker-run` | Self-hosted image with full PDF stack |

---

## Related

| Link | What |
|------|------|
| [HarmonyForge LLM Stress Test](https://huggingface.co/spaces/dgeni2/HarmonyForge_LLM_Stress_Test) | Evaluation space |
| [HF Thematic Analysis Dashboard](https://huggingface.co/spaces/dgeni2/HFThematicAnalysis) | Interview themes |

---

## License

Private — see repository settings.
