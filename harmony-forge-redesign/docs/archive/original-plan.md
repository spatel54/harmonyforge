# HarmonyForge Redesign Plan & Journal

**Date:** 2026-02-25
**Time:** 11:58 CST

## Phase 1: Global System & Design Foundation (The "Clean House" Phase)

- [ ] Bootstrap the new font.
- [ ] Redesign the logo for HarmonyForge.
- [ ] Fix the design guide by formally adding shadows and radii to the styleguide.
- [ ] Rename all layers and variables structurally for maintainability.
- [ ] Apply all variables systematically across the project.
- [ ] Perform an accessibility audit to ensure the strict color scheme parity for light and dark modes (POUR principles).

> **Prompt for Claude:** "Execute Phase 1 of the HarmonyForge Redesign. Bootstrap the new fonts (Instrument Serif, Inter, Satoshi/SF Pro) and enforce the newly defined accessible modular typography scale. Apply the redesigned logo, and update the design system tokens for radii and the new *volumetric elevation shadow scale (Fluent/Apple equivalent)* based on theme detail colors. Then, systematically rename all layers and variables to match the token schema. Finally, perform an accessibility audit on the color mappings to ensure strict POUR compliance between the Sonata (Light) and Nocturne (Dark) modes. Output only the necessary CSS/Token modifications and the audit summary."

## Phase 2: Arrangement Screen - Core Layout & Navigation

> **taste-skill gate:** Before generating any Phase 2 component, load `references/taste-skill/taste-skill/SKILL.md` into context. Key dials: DESIGN_VARIANCE 8 / MOTION_INTENSITY 6 / VISUAL_DENSITY 4.

- [ ] Move the dark mode and light mode toggle to the top right of the page.
- [ ] Relocate the progress indicator to the bottom of the page, styled as an Apple-style floating dock.
- [ ] Add an expand button to allow users to maximize the music sheet display.
- [ ] Strategically fill up negative white space in the Layout.

> **Prompt for Claude:** "Execute Phase 2 of the HarmonyForge Redesign for the Arrangement Screen layout. Move the dark/light mode toggle to the top right. Relocate the progress indicator to a bottom-anchored, Apple-style floating dock. Implement an 'expand' button for the music sheet display. Fill negative whitespace according to the 8-point grid layout system defined in the design guidelines. Provide the updated layout component code (Next.js/Tailwind) ensuring no fixed widths break the VexFlow SVG target."

**redesign-skill audit (Phase 2→3 gate):** Before advancing to Phase 3, run the Scan → Diagnose → Fix checklist from `references/taste-skill/redesign-skill/SKILL.md` against all Phase 2 deliverables. Gate: font, color, layout, interaction states, copy.

## Phase 3: Arrangement Screen - Components & Metadata

- [ ] Move the '2 selected' tag closer to the text in the corresponding dropdown.
- [ ] Add a new "File Type" tag to the list of tags, complete with an intuitive icon.
- [ ] Under the sheet music, dynamically generate tags for currently supported instruments.
- [ ] **Content:** Write a longer, academically rigorous description for *The First Noel*.
- [ ] **Theory-Named Tags:** Add rigorous descriptors such as: *Strophic*, *Homophonic*, *SATB* (Soprano, Alto, Tenor, Bass), *A Cappella* (if applicable), *Common Meter*, and *Hymnody*.

> **Prompt for Claude:** "Execute Phase 3 of the HarmonyForge Redesign focusing on metadata and components. Move the '2 selected' tag closer to its dropdown. Add a 'File Type' tag with an SVG icon. Dynamically generate instrument tags beneath the sheet music. Write an academically rigorous description for the hymn *The First Noel*. Finally, implement the following 'Theory-Named' tags: *Strophic, Homophonic, SATB, Common Meter, and Hymnody*. Ensure all states map to the Zustand `ScoreState`."

## Phase 4: Interactions, State & Visual Polish

- [ ] Enforce explicit `hover` and `selected` visual states across all interactive elements (edit-authority).
- [ ] Implement the page preview and swiping mechanism for seamless navigation.
- [ ] Add a dotted glow background to the first page.
- [ ] Landing Page: Implement a highly premium noise mesh gradient background.
- [ ] Implement a dynamic cursor that adapts visually based on the element the user is hovering over.
- [ ] Define and apply specific highlight colors for both light mode (Sonata) and dark mode (Nocturne).
- [ ] Design and implement an animation screen/sequence transitioning between the landing page and the ensemble preview.

> **Prompt for Claude:** "Execute Phase 4 of the HarmonyForge Redesign focusing on interactions and visual polish. Enforce explicit `hover` and `selected` visual states for all interactive elements to support edit-authority. Implement a page preview and swiping mechanism. Add a dotted glow background to the first page, and a noise mesh gradient background to the Landing Page. Implement a dynamic cursor that adapts to hover context. Finally, define semantic highlight colors for both themes, and build an animation sequence transitioning between the landing page and the ensemble preview. Adhere strictly to the '0ms latency' rule for theoretical violations."

---
*Journal Entries*

- **[2026-02-25 11:58 CST]**: Initial plan documented and approved. Ready to begin Phase 1.
- **[2026-02-25 12:10 CST]**: Added Phase 4 items (dynamic cursor, highlight colors, transition animations) and generated Claude execution prompts for all four phases.
