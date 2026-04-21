# Documentation

Plans, ADRs, design specs, and long-running logs. **New here?** Read the root [README.md](../README.md), then use the table below.

---

## Reading order

1. [README.md](../README.md) — run the app, repo layout  
2. [plan.md](plan.md) — checklist and verification  
3. [progress.md](progress.md) — start at **[Program narrative (2026-04-20)](progress.md#program-narrative-2026-04-20)** (end goal, approach, consolidated steps, **current focus / residuals**), then work logs (e.g. **[Ensemble Builder UI (2026-04-21)](progress.md#wl-ensemble-builder-ui-2026-04-21)**, **[LLM env & gateway (2026-04-20)](progress.md#wl-llm-env-2026-04-20)**, **[Document UX — chord gating & tooltips (2026-04-20)](progress.md#wl-document-ux-2026-04-20)**, **[Learner note names & classical scope (2026-04-20)](progress.md#wl-learner-notes-scope-2026-04-20)**, **[Learner pitch labels refinement (2026-04-20)](progress.md#wl-learner-pitch-labels-refine-2026-04-20)**)  
4. [context/system-map.md](context/system-map.md) — architecture (dense)  
5. [deployment.md](deployment.md) — Vercel vs Docker  

---

## Index

| Topic | File |
|-------|------|
| Checklist & verification | [plan.md](plan.md) |
| History & decisions | [progress.md](progress.md) (see [Program narrative 2026-04-20](progress.md#program-narrative-2026-04-20), [Ensemble Builder UI 2026-04-21](progress.md#wl-ensemble-builder-ui-2026-04-21), [LLM env 2026-04-20](progress.md#wl-llm-env-2026-04-20), [Document UX 2026-04-20](progress.md#wl-document-ux-2026-04-20), [Learner notes & classical scope 2026-04-20](progress.md#wl-learner-notes-scope-2026-04-20), [Learner pitch labels refinement 2026-04-20](progress.md#wl-learner-pitch-labels-refine-2026-04-20), [Palettes / rest repitch / export 2026-04-20](progress.md#wl-palettes-repitch-2026-04-20), [Repo hygiene 2026-04-20](progress.md#wl-repo-hygiene-2026-04-20)) |
| Architecture diagram | [context/system-map.md](context/system-map.md) |
| Deploy targets | [deployment.md](deployment.md) |
| Theory vocabulary (inspector / RAG) | [Taxonomy.md](Taxonomy.md) |
| User-study takeaways (scratch notes) | [iteration1.txt](iteration1.txt), [Iteration2.txt](Iteration2.txt), [Iteration3.txt](Iteration3.txt) |
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
