# Documentation

Plans, ADRs, design specs, and long-running logs. **New here?** Read the root [README.md](../README.md), then use the table below.

---

## Reading order

1. [README.md](../README.md) — run the app, repo layout  
2. [plan.md](plan.md) — checklist and verification  
3. [progress.md](progress.md) — start at **[Program narrative (2026-04-20)](progress.md#program-narrative-2026-04-20)**, then work logs  
4. [context/system-map.md](context/system-map.md) — architecture (dense)  
5. [deployment.md](deployment.md) — Vercel vs Docker  

---

## Index

| Topic | File |
|-------|------|
| Checklist & verification | [plan.md](plan.md) |
| History & decisions | [progress.md](progress.md) (see [Program narrative 2026-04-20](progress.md#program-narrative-2026-04-20), [Repo hygiene 2026-04-20](progress.md#wl-repo-hygiene-2026-04-20)) |
| Architecture diagram | [context/system-map.md](context/system-map.md) |
| Deploy targets | [deployment.md](deployment.md) |
| Theory vocabulary (inspector / RAG) | [Taxonomy.md](Taxonomy.md) |
| User-study takeaways (condensed) | [iterations.md](iterations.md) |
| Design tokens & surfaces | [design/README.md](design/README.md) |
| Legacy planning drafts | [archive/](archive/) |

### ADRs (`adr/`)

| ADR | Subject |
|-----|---------|
| [001](adr/001-sandbox-display-mode.md) | Sandbox display modes (historical paths) |
| [002](adr/002-m4-mvp-onboarding-inspector-playback.md) | MVP onboarding / inspector / playback |
| [003](adr/003-multi-clef-transposition-scope.md) | Transposing instruments & scope |

---

## Code

| Location | Notes |
|----------|--------|
| [../frontend/](../frontend/) | Next.js app — UI, `src/server/engine/`, `/api/*` |
| [../miscellaneous/](../miscellaneous/) | `pdfalto` vendored build |
