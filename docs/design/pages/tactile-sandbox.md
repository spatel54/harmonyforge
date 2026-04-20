# Tactile Sandbox — Page-Specific Overrides

> Rules here override [`../MASTER.md`](../MASTER.md) for the Tactile Sandbox surface only.
> Any rule NOT listed here falls back to [`../MASTER.md`](../MASTER.md).

## Surface Identity
The Tactile Sandbox is the primary score editing surface. It hosts the VexFlow SVG canvas,
draggable note tokens, Red Line violation overlays, and playback controls.

## Layout Override
- VexFlow canvas occupies the full available width after the sidebar breakpoint split.
- No padding on the canvas container — `p-0` always.
- Playback toolbar: fixed at bottom of sandbox panel, `h-12`, `z-index: 20`.

## Motion Override
- Note drag snapping: discrete, `0ms` transition — no interpolation on note movement.
- Red Line SVG overlays: `0ms` appear/disappear — no opacity fade.
- Playhead cursor: linear `transform: translateX()` only, driven by Tone.js transport time.

## Iconography Override
- Playback controls (play, pause, stop, rewind): Phosphor `fill` variant permitted for
  active/playing boolean state only.
- All other icons: linear variant, `w-5 h-5` (20×20px) for toolbar density.

## Accessibility Override
- Each `StaveNote` proxy `<button>` must emit: `aria-label="[Voice]: [Pitch] [Duration]"`
- Active playhead position must be announced via `aria-live="polite"` at measure boundaries.
- Keyboard shortcut map for note editing must be surfaced via a `<dialog>` accessible
  via a visible "Keyboard Shortcuts" button in the toolbar.
