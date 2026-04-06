# Miscellaneous

> **Stuff that is not the main app.**  
> Day-to-day HarmonyForge work happens in **`../backend/`** and **`../frontend/`**. This folder is for legacy demos, PDF tooling, and small helper scripts.

---

## What is here

```text
miscellaneous/
├── chamber-music-fullstack/   ← older reference project (read its own README)
├── pdfalto/                   ← vendored PDF→ALTO build (see below)
├── run-amp.sh                 ← optional Amp automation script
└── .playwright-mcp/           ← local tooling artifacts (safe to ignore)
```

---

## `chamber-music-fullstack/`

| | |
|--|--|
| **What** | Legacy / reference full-stack from an earlier layout |
| **Important** | **Not** the canonical HarmonyForge app — do not deploy this by mistake |
| **Details** | [chamber-music-fullstack/README.md](chamber-music-fullstack/README.md) |

---

## `pdfalto/`

| | |
|--|--|
| **What** | Vendored **pdfalto** sources and build output for PDF → ALTO (used on the intake path) |
| **How to build** | From **repo root**: `make pdfalto` |
| **After build** | Binary and upstream files appear under this tree (may include an upstream readme) |

---

## `run-amp.sh`

| | |
|--|--|
| **What** | Runs [Sourcegraph Amp](https://ampcode.com/install) against a local **`PROMPT.md`**, retrying every 5s until it succeeds |
| **Needs** | **`AMP_API_KEY`** in a `.env` file **next to this script** (or exported in the shell) |
| **Tip** | If your prompt lives in **`docs/PROMPT.md`**, edit the script’s `cat PROMPT.md` line to point there |

---

## `.playwright-mcp/`

| | |
|--|--|
| **What** | Local Playwright / MCP-related files |
| **Need it?** | **No** for normal HarmonyForge development |
