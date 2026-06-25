# `.cursor/` — Cursor project settings

> **For humans:** This folder tells **Cursor** how we want AI assistants to work in this repo.  
> **You can ignore it** if you only run the app and never use Cursor’s agent features.

---

## What is inside

```text
.cursor/
├── README.md              ← this file
└── rules/                 ← rule files (always-on or path-specific)
    ├── architecture.mdc   ← Research → Plan → Implement, Makefile, docs pinning
    └── mcp-tools.mdc        ← MCP servers, task routing, CallMcpTool protocol
```

| Path | Purpose |
|------|---------|
| **`rules/`** | Instructions the editor applies to AI chat / agent (coding style, workflow) |
| **`rules/architecture.mdc`** | Research → Plan → Implement loop, Makefile commands, pinning `docs/plan.md` + `docs/progress.md` |
| **`rules/mcp-tools.mdc`** | **Use MCP tools by default** when they fit; which server for which task |

---

## MCP plugins (not in this repo)

All MCP servers are configured in the **user-level** file:

**[`/Users/dvgenis/.cursor/mcp.json`](/Users/dvgenis/.cursor/mcp.json)**

That file lists: `github`, `overleaf`, `brave-search`, `sequential-thinking`, `notebooklm-mcp`, `memory-bank`, `playwright`, `whatsapp`, `gemini`, `slack`, and any Cursor-bundled servers (e.g. **cursor-ide-browser**, **plugin-sanity-Sanity** when enabled).

- **Do not** commit `mcp.json` or copy API keys into this repository.
- After changing `mcp.json`, reload Cursor or restart MCP so new servers appear under the project’s `mcps/` tool descriptors.

Agents should read tool schemas from the workspace MCP descriptor folder (exposed to the agent as `mcps/<server>/tools/*.json`) before calling `CallMcpTool`.

---

## If you use Cursor for coding

When starting a **non-trivial** task, pin **`docs/plan.md`** and **`docs/progress.md`** in chat so answers match the project’s own roadmap and log.

For UI verification (sandbox playback, export modal, document flow), run **`make dev`** locally and let the agent use **`cursor-ide-browser`** MCP per **`rules/mcp-tools.mdc`**.
