# Miscellaneous

Supporting and legacy material **outside** the main `backend/` and `frontend/` apps.

## `chamber-music-fullstack/`

Legacy / reference stack from earlier project layout. **Do not treat as the canonical HarmonyForge app.** See:

- [chamber-music-fullstack/README.md](chamber-music-fullstack/README.md)

## `pdfalto/`

Vendored **pdfalto** build used for PDF → ALTO (and related intake). From the **repo root**:

```bash
make pdfalto
```

After a successful build, this directory contains the binary and upstream-style files (including any `Readme` shipped with the vendored tree).

## `run-amp.sh`

Runs [Sourcegraph Amp](https://ampcode.com/install) with a local **`PROMPT.md`**: retries every 5s until success. Expects **`AMP_API_KEY`** in **`.env`** next to the script (or in the environment). If your prompt file lives elsewhere (e.g. **`docs/PROMPT.md`**), adjust the `cat` path in the script.

## `.playwright-mcp/`

Local Playwright / MCP-related artifacts. **Not required** for core HarmonyForge development.
