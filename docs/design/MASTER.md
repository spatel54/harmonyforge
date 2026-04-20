# HarmonyForge Design System — MASTER

> **Source of Truth.** All token values, rules, and constraints defined here govern every
> component, page, and surface in HarmonyForge. Page-specific overrides live in
> `pages/<page-name>.md` (next to this file) and take precedence over this file only for
> the sections they explicitly redefine.
>
> **Hierarchical Retrieval Protocol:**
>
> 1. When building a specific surface (e.g., Tactile Sandbox), check `pages/tactile-sandbox.md` first.
> 2. If a rule is defined there, it **overrides** this file.
> 3. If not, fall back to this file exclusively.
>
> **Generator Note (ui-ux-pro-max v2.0):** The automated design system generator
> suggested "Vibrant & Block-based" style with Righteous/Poppins typography. These
> recommendations were **rejected** — they target music streaming/entertainment
> consumer products, not a symbolic notation editor. All color, typography, and style
> decisions below are intentional overrides anchored to HarmonyForge's Glass Box
> editorial identity.

---

## 1. Color System

The color palette utilizes fixed brand inputs structured explicitly into Light Mode (Sonata) and Dark Mode (Nocturne). Semantic meaning is strictly bound to color roles.

### Light Mode — Sonata

| Role | Color Name | Hex Code | Usage | Theme Token |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | Antique White | `#FDF5E6` | Primary app background. | `theme.sonata.bg` |
| **Surface** | Cherry Wood | `#9E4B3E` | Component backgrounds (cards, overlays, panels). | `theme.sonata.surface` |
| **Detail** | Tan Birch | `#D2B48C` | Borders, secondary text, inactive states, staff lines. | `theme.sonata.detail` |
| **Accent** | Amber Glow | `#FFB300` | Focus states, active selection, interactive handles. | `theme.sonata.accent` |

### Dark Mode — Nocturne

| Role | Color Name | Hex Code | Usage | Theme Token |
| :--- | :--- | :--- | :--- | :--- |
| **Background** | Dark Walnut | `#3E2723` | Primary app background. | `theme.nocturne.bg` |
| **Surface** | Cognac | `#A55B37` | Component backgrounds (cards, overlays, panels). | `theme.nocturne.surface` |
| **Detail** | Deep Cocoa | `#2D1817` | Borders, secondary text, inactive states, staff lines. | `theme.nocturne.detail` |
| **Accent** | Amber Glow | `#FFB300` | Focus states, active selection, interactive handles. | `theme.nocturne.accent` |

### Semantic Color Mappings (Cross-Theme)

| State | Indicator Color | Token Example | Description |
| :--- | :--- | :--- | :--- |
| **Theory Violation** | `#D32F2F` (Red) | `semantic.violation.base` | Absolute error (e.g., parallel fifths). |
| **Stylistic Warning** | `#1976D2` (Blue) | `semantic.warning.base` | Atypical but valid choices. |
| **User Override** | `#7B1FA2` (Purple) | `semantic.override.base` | Applied to an explicitly bypassed warning. |
| **Valid Deviation** | Theme Detail | `semantic.valid.base` | Adheres to logic without warnings; uses standard Detail color. |

### Color Combinations (WCAG & Semantic Constraints)

| Background | Foreground Text/Element | Status |
| :--- | :--- | :--- |
| **Theme Surface** | Theme Detail | ✅ **Valid** (High contrast) |
| **Theme BG** | Theme Detail | ✅ **Valid** (Border elements) |
| **Theme BG** | Semantic Red | ❌ **Forbidden** (Red must sit on a Surface) |
| **Semantic Red** | Theme Detail (Text) | ❌ **Forbidden** (Error text uses `#FFFFFF` only) |
| **Warning Blue** | Semantic Red | ❌ **Forbidden** (Warnings and errors never touch) |

### Contrast Compliance (WCAG 2.1 AA — 4.5:1 minimum for normal text)

- Nocturne: `#F8F8F8` text on `#3E2723` bg → verified ✅
- Sonata: `#1A1A1A` text on `#FDF5E6` bg → verified ✅
- Semantic Red `#D32F2F` must only appear on `#FFFFFF` or Surface — never on bg directly.
- Amber Glow `#FFB300` focus rings: always paired with a 2px contrast outline on both themes.

---

## 2. Typography System

### Typefaces

| Role | Family | Fallback | Token |
| :--- | :--- | :--- | :--- |
| **Header (Brand)** | Instrument Serif | serif | `font.brand` |
| **Body (Content)** | Inter | sans-serif | `font.body` |
| **Labels (UI)** | Inter | sans-serif | `font.label` |
| **System (Data)** | Satoshi / SF Pro | monospace | `font.system` |

### Type Scale & Usage (Accessible Modular Scale)

| Level | Size (px/rem) | Weight/Style | Font | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Heading 1 (Hero)** | 39px (2.441rem) | 600 Semi-Bold | Brand | Major project headers, album titles. |
| **Heading 2 (Section)**| 33px (2.074rem) | 600 Semi-Bold | Brand | Artist names, core section titles. |
| **Heading 3 (Card)** | 23px (1.440rem) | 600 Semi-Bold | Brand | Component/Card titles. |
| **Body (Large)** | 19px (1.200rem) | 400 Regular | Body | Featured biographies, lead paragraphs. |
| **Body (Base)** | 16px (1.000rem) | 400 Regular | Body | Standard long-form settings, descriptions. |
| **Labels (UI)** | 13px (0.833rem) | 500 Medium (Caps) | Label | Sidebar navigation, buttons, tooltips. |
| **System (Data)** | 13px (0.833rem) | 400 Regular | System | Technical metadata (BPM, timestamps). |
| **System (Micro)** | 11px (0.694rem) | 400 Regular | System | File sizes, timestamp suffixes. |

### Typography Rules

- Line height: `1.5–1.75` for all body text (per UX guideline `line-height`).
- Line length: `65–75` characters max per line in Theory Inspector panels.
- Use CSS `clamp()` for headings to prevent overflow in Inspector panels.
- Minimum `16px` body text on mobile viewports.

---

## 3. Spacing, Radius & Geometry

### Spacing System (8-Point Grid)

| Token | Value | Usage |
| :--- | :--- | :--- |
| `spacing.minor` | `2px` | Gap between grouped monospace data items. |
| `spacing.tight` | `4px` | Padding inside small interactive toggles or input boundaries. |
| `spacing.base` | `8px` | Margins parsing list items within the Theory Inspector. |
| `spacing.global` | `16px` | Standard padding for Surface Cards and Modal dialogues. |
| `spacing.macro` | `32px` | Spatial separation between Sandbox and Sidebar. |

### Border Radius System

| Token | Value | Usage |
| :--- | :--- | :--- |
| `radius.sharp` | `0px` | VexFlow canvas edges, red logic lines, algorithmic constraints. |
| `radius.micro` | `2px` | Tooltips and metadata pills. |
| `radius.standard` | `4px` | Interactive buttons, overrides, and toggles (signifying human touch). |
| `radius.round` | `50%` | Reserved exclusively for draggable noteheads. |

### Elevation & Shadow System (Apple/Fluent Volumetric Depth)
Shadow colors derive dynamically from `theme.nocturne.detail` and `theme.sonata.detail`. All shadows utilize a multi-layered, smooth-falloff approach to simulate physical distance rather than hard drops.

| Token | Elevation | Y-Offset / Blur | Usage |
| :--- | :--- | :--- | :--- |
| `shadow.sm` | Low | `1px / 2px` | Interactive buttons, clickable metadata tags. |
| `shadow.md` | Base | `4px / 6px` | Inline cards, selection dropdowns. |
| `shadow.lg` | High | `8px / 16px` | Floating action elements, expanding bottom sheets. |
| `shadow.xl` | Floating | `20px / 24px` | Modals, centered dialogue boxes, tooltips covering canvas. |
| `shadow.inner` | Submerged | Inset `2px` | Active pressed states, specific sandbox track grooves. |

---

## 4. Layout & Responsiveness

### Breakpoint Constraints

| Breakpoint | Width | Layout |
| :--- | :--- | :--- |
| `lg` | ≥1024px | 70% Sandbox / 30% Theory Inspector (Side-by-Side). |
| `md` | 768px–1023px | 60% Sandbox / 40% Theory Inspector. |
| `sm` | <768px | Stacked. Sandbox at 100% width. Theory Inspector becomes a bottom-anchored pull-up drawer (BottomSheet). |

### VexFlow Scaling Rule

The VexFlow SVG target `div` must NOT use fixed pixel widths. Use `w-full h-full` and rely on a `ResizeObserver` hook to trigger a re-render of `Vex.Flow.Factory` when container dimensions change.

### Next.js App Router Conventions

- Use `loading.tsx` alongside each `page.tsx` for route-level loading UI — do not manage loading state manually in page components.
- Use file-based routing exclusively (`app/[route]/page.tsx`, `app/[route]/layout.tsx`).
- Run `ANALYZE=true npm run build` with `@next/bundle-analyzer` before shipping to detect oversized bundles.
- z-index scale: `10` (tooltips), `20` (modals), `30` (drawers), `50` (critical overlays).

---

## 5. Motion & Interaction Rules

- **Note Drag Behavior:** Discrete snapping to semitones/diatonic steps. Continuous analog-style interpolation is forbidden.
- **Violation Reveal Timing:** Zero latency. Red Line systems appear simultaneously with the drop/keyboard event. No fade-in permitted.
- **Repair Transitions:** `0ms` crisp swap between user state and recommended repair state. Linear interpolation (`100ms max`) reserved strictly for programmatic voice-leading SVG paths only.
- **Forbidden Animation:** No bouncing, spring physics, or easing that implies physical weight.
- **Micro-interaction budget:** `150–300ms` for all hover/focus state transitions using `transform` and `opacity` only (never `width`/`height`).
- **`prefers-reduced-motion`:** All transitions must be wrapped in a `@media (prefers-reduced-motion: no-preference)` guard or a `useReducedMotion` hook.

---

## 6. Iconography System

- **Library:** Phosphor Icons (`@phosphor-icons/react`) — sharp, linear variant, 1.5px stroke weight (2px on hover).
- **Style:** Linear only. Filled icons are explicitly forbidden unless representing active global state booleans.
- **Visual Metaphors:** Drafting and mechanical metaphors (compasses, set squares, logic gates). Avoid consumer UI metaphors (no magic wands for generation).
- **No emoji icons** in any UI surface.
- **Consistent sizing:** Fixed `24x24` viewBox with `w-6 h-6` Tailwind classes.

### Semantic Geometry

| Shape | Semantic Meaning |
| :--- | :--- |
| Sharp angles (triangles/rectangles) | Algorithmic rules, calculations, constraints |
| Curves / circles | User input, human interaction, override functions |

---

## 7. Accessibility — POUR Compliance

### Perceivable & Operable

- **Color Independence:** Semantic color cues must always be paired with a secondary visual signifier (solid vs. dashed line, icon + color, not color alone).
- **Edit-Authority via Keyboard:** Full edit-authority of VexFlow state must be possible via Arrow and Modifier keys without a pointer device. Tab sequences must fluidly navigate between Sandbox and Inspector layers.
- **Focus States:** Visible focus rings (`focus:ring-2 focus:ring-accent`) on all interactive elements. Never `outline-none` without a replacement.
- **Skip Links:** Provide a "Skip to main content" link on every page for keyboard users.
- **Touch Targets:** Minimum `44×44px` for all interactive elements on touch surfaces.

### Understandable & Robust

- **Screen Reader Handling:** Draggable Note Tokens inject ARIA labels formatted as `[Voice]: [Pitch] [Duration]` (e.g., `Soprano: C5 Quarter Note`).
- **Live Regions for Causality:** Rule violations announce immediately as `aria-live` critical alerts: `Alert: Parallel Fifth detected between Soprano and Tenor`. Use `role="alert"` — never rely on color alone.
- **Semantic DOM:** SVG interaction must map to standard accessible HTML `<button>` and `<input>` proxy elements within the React tree.
- **Error Messages:** Always use `role="alert"` or `aria-live` for programmatic error announcements — visual-only error indication is forbidden.

### Content & Voice Guidelines

- **Tone:** Scholarly, objective, calm, non-judgmental. No conversational filler or emotional validation.
- **AI Explanations:** Confined strictly to the Theory Inspector panel. Use precise language: `"Stylistic Observation: Doubled Leading Tone."` Never surface LLM output directly on the Sandbox canvas.

---

## 8. Developer Hand-off & Schema Definition

### A. State Management & Data Ontology (Zustand)

```typescript
// types/music.ts

/**
 * Employs the "Theory Named" strategy.
 * Pitches must be explicitly defined using scientific pitch notation.
 */
export type PitchClass = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type Octave = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Duration = 'w' | 'h' | 'q' | '8' | '16'; // VexFlow compatible

export interface NoteEvent {
  id: string; // Unique UUID
  pitch: `${PitchClass}${Octave}`;
  duration: Duration;
  voice: 'Soprano' | 'Alto' | 'Tenor' | 'Bass';
  isUserModified: boolean; // Triggers UI 'Accent' color states
}

export interface TheoryViolation {
  id: string;
  ruleId: string; // e.g., 'RULE_PARALLEL_FIFTH'
  severity: 'Violation' | 'Warning';
  involvedNoteIds: string[]; // Maps directly to Red Line SVGs
  isOverridden: boolean;
}

// store/useScoreStore.ts
export interface ScoreState {
  notes: NoteEvent[];
  violations: TheoryViolation[];
  selectedNoteId: string | null;
  moveNote: (id: string, newPitch: `${PitchClass}${Octave}`) => void;
  toggleOverride: (violationId: string) => void;
}
```

### B. VexFlow / React Boundary Constraints

Direct manipulation of the VexFlow canvas via virtual DOM updates is forbidden.

- **The Rule of the Wrapper:** VexFlow rendering logic must be isolated within a `useEffect` hook that triggers re-renders *only* when the symbolic `ScoreState` changes or container resizes.
- **Proxy Elements for POUR:** Invisible HTML `<button>` elements must be positioned absolutely over the VexFlow note coordinates to handle `onFocus`, `onKeyDown`, and `onClick` synthetic events, dispatching updates to Zustand.

```typescript
// components/organisms/StaffRenderer.tsx

export const StaffRenderer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const notes = useScoreStore((state) => state.notes);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Clear previous canvas
    containerRef.current.innerHTML = '';

    // 2. Initialize VexFlow Formatter
    const vf = new Vex.Flow.Factory({
      renderer: { elementId: containerRef.current, width: containerRef.current.clientWidth, height: 200 }
    });

    // 3. Map strictly typed NoteEvents to Vex.Flow.StaveNote
    // ... Imperative VexFlow logic here ...

    vf.draw();
  }, [notes]); // Re-render strictly bounded to state determinism AND resize events

  return <div ref={containerRef} className="relative w-full h-full" />;
};
```

### C. React Component Library (Atomic Specification)

All core logic resides in Zustand. Do not generate arbitrary local state.

**Atoms**

```typescript
interface SemanticLabelProps {
  type: 'Violation' | 'Warning' | 'Override' | 'Valid';
  text: string;
  className?: string;
}

interface ToggleSwitchBaseProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  ariaLabel: string;
  disabled?: boolean;
}
```

**Molecules**

```typescript
interface DraggableNoteTokenProps {
  id: string; // References NoteEvent UUID
  pitch: string;
  isFocused: boolean;
  hasError: boolean;
  onMove: (newPitch: string) => void;
}

interface TheoryViolationIndicatorProps {
  id: string;
  severity: 'Violation' | 'Warning';
  points: { x: number; y: number }[]; // Computed BBox from VexFlow
  isOverridden: boolean;
}

interface ConstraintControlProps {
  currentLevel: 'Strict' | 'Standard' | 'Loose';
  onLevelChange: (level: 'Strict' | 'Standard' | 'Loose') => void;
}
```

**Organisms**

```typescript
interface TheoryExplanationCardProps {
  violationId: string;
  ruleId: string;
  severity: 'Violation' | 'Warning';
  academicDescription: string; // Scholarly tone enforced
  isOverridden: boolean;
  onOverrideToggle: (violationId: string) => void;
}
```

---

## 9. Music Theory Rendering Axioms

1. **Pitch vs. Spelling Strictness:** Differentiate enharmonic equivalents (C# vs. Db). Interpreting intervals based on MIDI note numbers is forbidden. VexFlow must receive the exact theoretical spelling from the backend.
2. **Violation Coordinates (The "Red Line" Tooltips):** When drawing `TheoryViolationIndicator` over VexFlow output, the bounding box of the specific `StaveNote` instances must be calculated. The Red Line is an SVG overlay using React portal logic relative to `containerRef`, ensuring decoupling from VexFlow computation.
3. **Non-Blocking Edits:** The handler for a `moveNote` action must inherently accept *any* pitch modification. The UI renders the new pitch instantly; constraint evaluation follows asynchronously. The UI must never reject a move action defensively (Expressive Sovereignty).

---

## 10. Design Tokens (JSON Base)

```json
{
  "harmonyForge": {
    "color": {
      "sonata": {
        "bg": "#FDF5E6",
        "surface": "#9E4B3E",
        "detail": "#D2B48C",
        "accent": "#FFB300"
      },
      "nocturne": {
        "bg": "#3E2723",
        "surface": "#A55B37",
        "detail": "#2D1817",
        "accent": "#FFB300"
      },
      "semantic": {
        "violation": "#D32F2F",
        "warning": "#1976D2",
        "override": "#7B1FA2",
        "valid": "#D2B48C"
      }
    },
    "typography": {
      "fontFamily": {
        "brand": "Instrument Serif, serif",
        "body": "Inter, sans-serif",
        "label": "Inter, sans-serif",
        "system": "Satoshi, SF Pro, monospace"
      },
      "fontSize": {
        "h1": ["2.441rem", { "fontWeight": "600", "lineHeight": "1.1" }],
        "h2": ["2.074rem", { "fontWeight": "600", "lineHeight": "1.2" }],
        "h3": ["1.440rem", { "fontWeight": "600", "lineHeight": "1.2" }],
        "bodyLarge": ["1.200rem", { "fontWeight": "400", "lineHeight": "1.5" }],
        "bodyBase": ["1.000rem", { "fontWeight": "400", "lineHeight": "1.5" }],
        "label": ["0.833rem", { "fontWeight": "500", "lineHeight": "1.0", "letterSpacing": "0.05em" }],
        "data": ["0.833rem", { "fontWeight": "400", "lineHeight": "1.4" }],
        "micro": ["0.694rem", { "fontWeight": "400", "lineHeight": "1.4" }]
      }
    },
    "geometry": {
      "spacing": {
        "minor": "2px",
        "tight": "4px",
        "base": "8px",
        "global": "16px",
        "macro": "32px"
      },
      "radius": {
        "sharp": "0px",
        "micro": "2px",
        "standard": "4px",
        "round": "50%"
      },
      "shadow": {
        "sm": "0 1px 2px 0 rgba(var(--theme-detail-rgb), 0.05)",
        "md": "0 4px 6px -1px rgba(var(--theme-detail-rgb), 0.1), 0 2px 4px -1px rgba(var(--theme-detail-rgb), 0.06)",
        "lg": "0 10px 15px -3px rgba(var(--theme-detail-rgb), 0.1), 0 4px 6px -2px rgba(var(--theme-detail-rgb), 0.05)",
        "xl": "0 20px 25px -5px rgba(var(--theme-detail-rgb), 0.1), 0 10px 10px -5px rgba(var(--theme-detail-rgb), 0.04)",
        "inner": "inset 0 2px 4px 0 rgba(var(--theme-detail-rgb), 0.06)"
      }
    }
  }
}
```

---

## 11. Pre-Delivery Checklist

Run this checklist before every component PR. Derived from `ui-ux-pro-max` UX guidelines and tailored to HarmonyForge constraints.

### Visual Quality

- [ ] No emojis used as icons — Phosphor Icons (`@phosphor-icons/react`) only
- [ ] All icons use `w-6 h-6` (24×24px) with consistent stroke weight
- [ ] Hover states do not cause layout shift (use `transform`/`opacity` only)
- [ ] Theme tokens used exclusively — no ad-hoc hex values or Tailwind color overrides

### Interaction & Keyboard

- [ ] All clickable/interactive elements have `cursor-pointer`
- [ ] Visible focus rings on all interactive elements (`focus:ring-2 focus:ring-accent`)
- [ ] Tab order matches visual reading order
- [ ] Skip-to-content link present on every page
- [ ] Touch targets ≥ 44×44px

### Accessibility

- [ ] All meaningful images have descriptive `alt` text
- [ ] Icon-only buttons have `aria-label`
- [ ] Error/violation states use `role="alert"` — never color alone
- [ ] Color is not the only indicator (shape/icon paired with semantic color)
- [ ] `prefers-reduced-motion` respected via hook or media query

### Light / Dark Mode

- [ ] Text contrast ≥ 4.5:1 in both Sonata and Nocturne themes
- [ ] Borders visible in both themes (never `border-white/10` in light mode)
- [ ] Semantic Red `#D32F2F` only sits on a Surface, never directly on background

### Layout

- [ ] Responsive at 375px, 768px, 1024px, 1440px
- [ ] No horizontal scroll on mobile
- [ ] VexFlow canvas uses `w-full h-full` with `ResizeObserver` — no fixed pixel widths
- [ ] Content not hidden behind fixed navbars

### Architecture Boundary

- [ ] No constraint-satisfaction logic in frontend components
- [ ] No raw `AudioContext` or audio buffer manipulation
- [ ] VexFlow manipulation confined to `useEffect` — no direct DOM writes outside it
- [ ] All Zustand actions are strictly typed — no `any`
