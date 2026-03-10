# ADR 001: Sandbox Display Mode (View vs Edit)

## Status

Accepted (2026-03-09)

## Context

The Sandbox uses two rendering engines: **OSMD** (OpenSheetMusicDisplay) for reliable MusicXML display, and **VexFlow** for editable note manipulation. When both `musicXML` and `score` exist, we must choose which to show.

## Decision

- **View mode** (default): Use OSMD when `musicXML` exists. High-fidelity display, no note editing.
- **Edit mode**: Use VexFlow when `score` exists. Enables click-on-staff, selection, duration/pitch tools.

A toggle in the Action Bar lets users switch between modes. Session state (generatedMusicXML) persists in `sessionStorage` so refresh on Sandbox keeps the score.

## Consequences

- Users can view the score reliably (OSMD) and switch to Edit when they want to modify notes.
- VexFlow may have layout differences from OSMD; Edit mode is best-effort.
- CORS is configurable via `CORS_ORIGIN` env var for non-localhost deployments.
