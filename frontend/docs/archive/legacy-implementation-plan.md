# HarmonyForge Frontend Implementation Plan (For AI Assistants)

**Objective**: Systematically translate the provided Pencil (`.pen`) UI designs into a production-ready, highly modular Frontend using Next.js, strictly-typed TypeScript, Tailwind CSS v4, and Zustand state management.
**Context Paradigm**: The UI operates as a "Glass Box" co-creative tool. The system consists of two primary zones: the **Tactile Sandbox** (visualizing notation via VexFlow with Tone.js playback) and the **Theory Inspector** (a sidebar for rigorous, LLM-driven music theory explanations).

## Guiding Directives

- **Intrinsic Determinism**: The frontend must remain purely declarative and deterministic. Do not hallucinate probabilistic "Black Box" audio logic. State flows predictably from the backend's symbolic API payloads (MusicXML/JSON) to Zustand, which dictates VexFlow/Tone.js actions.
- **Ante-hoc Explainability ("Theory Named")**: Embed theoretical logic directly into the UI state. Tooltips, highlights, and sidebars must use explicit, academically rigorous terminology (e.g., "Parallel 5th Violation").
- **Edit-Authority & Accessibility (POUR)**: The user must maintain definitive "Edit-Authority" over the Sandbox and Inspector. All components must be keyboard navigable, focus-visible, and screen-reader accessible.

---

## Phase 1: Architectural Foundation & Design Token Mapping (Tailwind v4)

1.  **Initialize Tailwind v4 Globals**:
    - Do not use older `@tailwind base` syntax or manual preflight resets. Ensure `globals.css` begins explicitly with `@import "tailwindcss";`.
2.  **Extract & Map Design Variables**:
    - Audit the `.pen` file for variables (`colors`, `spacing`, `radius`).
    - Map these purely as CSS Custom Properties within the `:root` pseudo-class (e.g., `--color-primary: #8b5cf6;`, `--spacing-base: 16px;`). Do NOT map font-stacks here.
3.  **Performant Font Loading**:
    - Rely exclusively on `next/font/local` or `google` loaders within `layout.tsx`.
    - Project font variables via the body class (`<body className={font.variable}>`).
    - Map them solely within `@layer base` utility classes in `globals.css` (e.g., `.font-primary { font-family: var(--font-name), sans-serif; }`). Never use `font-(--var)` utility syntax.
4.  **Enforce Viewport Sizing**:
    - Apply `height: 100%;` to `html` and `body` in `@layer base`. Utilize `w-full h-full` on the root application wrappers.

## Phase 2: Systematic Component Extraction & Typing

1.  **Node Traversal & Component Identification**:
    - Analyze the target `.pen` frame. Extract the base definitions of `ref` nodes.
    - Document the total number of instances per component and map precisely which descendant properties are overridden versus universally applied.
2.  **Synthesis of `ReactNode` Interfaces**:
    - Create strict `.tsx` component definitions inside `/src/components`.
    - Base the TypeScript interfaces explicitly on the mapped overrides. If a subcomponent is conditionally toggled in the design, type it as optional; if persistent, type it as required. Use `ReactNode` or typed discriminated unions (e.g., `"success" | "warning" | "error"`) for stateful slots.
3.  **Exact Geometry Extraction for SVGs**:
    - When dealing with musical glyphs (SMuFL) or custom UI icons (like a "Theory Inspector" logo), extract the raw `geometry` string directly into the `<path d="...">`.
    - Never approximate or simplify vector math.

## Phase 3: Absolute Tailwind Class Implementation

1.  **Eradicate Inline Styles**: Ensure zero usage of inline `style={{...}}`.
2.  **Translating Layout Constraints**:
    - Map `fill_container` horizontally within flex parents to `flex-1 min-w-0`.
    - Map `fill_container` vertically to `h-full`.
    - Map `fit_content` to `w-fit` or `h-fit`.
3.  **Translating Spacing & Sizing**: Use arbitrary Tailwind classes exactly matching `.pen` specs when a token does not exist (e.g., `w-[280px]`, `gap-[16px]`, `p-4`).
4.  **Translating Colors & Strokes**: Leverage the mapped CSS custom properties explicitly (e.g., `bg-[var(--color-background)]`, `border-[var(--color-border)]`, `fill-[var(--color-primary)]`).

## Phase 4: High-Context Microinteractions & Accessibility (POUR)

1.  **Tactile "Edit-Authority" Hover States**:
    - For interactive nodes (especially musical notes in VexFlow or Sandbox buttons), provide immediate, tactile visual feedback using purely Tailwind utility variants.
    - Implement smooth transitions: `transition-all duration-200 ease-in-out hover:scale-[1.02] hover:shadow-md`.
2.  **Deterministic Active Actions**: Ensure satisfying input confirmation by scaling down elements down upon interaction: `active:scale-95`.
3.  **Group-Hover Explainability**:
    - For the Theory Inspector and complex nested cards, designate the parent as `group`.
    - Trigger explanatory "Red Line" tooltips, academic terminology subtext, or action icons seamlessly on parent hover: `group-hover:opacity-100 group-hover:translate-x-1`.
4.  **Strict Focus Management (POUR)**:
    - All interactive elements must aggressively silence default browser outlines (`focus:outline-none`) and replace them with semantic, high-visibility focus rings.
    - Implement: `focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2`.
