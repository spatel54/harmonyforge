# `.cursor/` — Cursor project settings

> **For humans:** This folder tells **Cursor** how we want AI assistants to work in this repo.  
> **You can ignore it** if you only run the app and never use Cursor’s agent features.

---

## What is inside

```text
.cursor/
├── README.md      ← this file
└── rules/         ← rule files (always-on or path-specific)
```

| Path | Purpose |
|------|---------|
| **`rules/`** | Instructions the editor applies to AI chat / agent (coding style, workflow) |
| **`rules/architecture.mdc`** | Research → Plan → Implement loop, Makefile commands, pinning `docs/plan.md` + `docs/progress.md` |

---

## If you use Cursor for coding

When starting a **non-trivial** task, pin **`docs/plan.md`** and **`docs/progress.md`** in chat so answers match the project’s own roadmap and log.
