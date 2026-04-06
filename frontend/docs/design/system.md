# HarmonyForge Design System Specification

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
| **User Override** | `#7B1FA2` (Purple) | `semantic.override.base` | Applied to a explicitly bypassed warning. |
| **Valid Deviation** | Theme Detail | `semantic.valid.base` | Adheres to logic without warnings uses standard Detail color. |

### Color Combinations (WCAG & Semantic Constraints)

| Background | Foreground Text/Element | Status |
| :--- | :--- | :--- |
| **Theme Surface** | Theme Detail | ✅ **Valid** (High contrast) |
| **Theme BG** | Theme Detail | ✅ **Valid** (Border elements) |
| **Theme BG** | Semantic Red | ❌ **Forbidden** (Red must sit on a Surface) |
| **Semantic Red** | Theme Detail (Text) | ❌ **Forbidden** (Error text uses `#FFFFFF` only) |
| **Warning Blue** | Semantic Red | ❌ **Forbidden** (Warnings and errors never touch) |

---

## 2. Typography System

**Typefaces**

* **Header (Brand):** Instrument Serif
* **Body (Content):** Inter
* **Labels (UI):** Inter
* **System (Data):** Satoshi / SF Pro

**Type Scale & Usage (Accessible Modular Scale)**

| Level | Font Family | Size (px/rem) | Weight/Style | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Heading 1 (Hero)** | Instrument Serif | 39px (2.441rem) | 600 Semi-Bold | 1.1 | Major project headers, album titles. |
| **Heading 2 (Section)**| Instrument Serif | 33px (2.074rem) | 600 Semi-Bold | 1.2 | Artist names, core section titles. |
| **Heading 3 (Card)** | Instrument Serif | 23px (1.440rem) | 600 Semi-Bold | 1.2 | Component/Card titles. |
| **Body (Large)** | Inter | 19px (1.200rem) | 400 Regular | 1.5 | Featured biographies, lead paragraphs. |
| **Body (Base)** | Inter | 16px (1.000rem) | 400 Regular | 1.5 | Standard long-form settings, descriptions. |
| **Labels (UI)** | Inter | 13px (0.833rem) | 500 Medium (Caps) | 1.0 (Fixed) | Sidebar navigation, buttons, tooltips. |
| **System (Data)** | Satoshi / SF Pro | 13px (0.833rem) | 400 Regular (Mono) | 1.4 | Technical metadata (BPM, timestamps). |
| **System (Micro)** | Satoshi / SF Pro | 11px (0.694rem) | 400 Regular (Mono) | 1.4 | File sizes, timestamp suffixes. |

---

## 3. Spacing, Radius & Geometry

**Spacing System (8-Point Grid)**

* `2px` (Minor) — Gap between grouped monospace data items.
* `4px` (Tight) — Padding inside small interactive toggles or input boundaries.
* `8px` (Base) — Margins parsing list items within the Theory Inspector.
* `16px` (Default) — Standard padding for Surface Cards and Modal dialogues.
* `32px` (Macro) — Spatial separation between Sandbox and Sidebar.

**Border Radius System**

* `0px` (Sharp) — Edges connected to the VexFlow canvas, red logic lines, and algorithmic constraints.
* `2px` (Micro) — Tooltips and metadata pills.
* `4px` (Standard) — Interactive buttons, overrides, and toggles (signifying human touch).
* `50%` (Circular) — Singularly reserved for the draggable noteheads.

---

## 4. Layout & Responsiveness

To ensure the Glass-box UI degrades gracefully while preserving the VexFlow canvas:

* **Breakpoint Constraints:**
  * `lg` (≥1024px): 70% Sandbox / 30% Theory Inspector (Side-by-Side).
  * `md` (768px - 1023px): 60% Sandbox / 40% Theory Inspector.
  * `sm` (<768px): Stacked. The `InteractiveTactileSandbox` takes 100% width. The `TheoryInspectorSidebar` becomes a bottom-anchored pull-up drawer (BottomSheet) triggered by selection.
* **VexFlow Scaling:** The VexFlow SVG target `div` must NOT use fixed pixel widths. It must use `w-full h-full` and rely on a `ResizeObserver` hook to trigger a re-render of `Vex.Flow.Factory` when container dimensions change.
* **Typography Scaling:** Use CSS `clamp()` for headings to prevent horizontal overflow in Inspector panels.

---

## 5. Motion & Interaction Rules

* **Note Drag Behavior:** Notes move discretely via a snapping coordinate system corresponding to semitones/diatonic steps. Continuous, fluid dragging (analog-style physical interpolation) is forbidden to enforce strict symbolic logic.
* **Violation Reveal Timing:** Zero latency. Red Line systems appear simultaneously with the drop event/keyboard confirmation. No "fade-in" animations are permitted.
* **Repair Transitions:** When switching between user state and recommended repair state, employ a crisp `0ms` swap. Linear interpolation (`100ms max`) reserved strictly for programmatic voice-leading paths in SVG nodes only.
* **Forbidden Animation:** No bouncing, spring physics, or easing functions that imply weight or physical realism.

---

## 6. Iconography System

* **Style:** Sharp, linear, 1.5px stroke weight (2px on hover). Filled icons are explicitly forbidden unless representing active global state booleans.
* **Visual Metaphors:** Avoid consumer UI metaphors (no "magic wands" for generation). Use drafting and mechanical metaphors (e.g., compasses, set squares, logic gates).
* **Semantic Geometry:**
  * **Sharp Angles (Triangles/Rectangles):** Denote algorithmic rules, calculations, and constraints.
  * **Curves/Circles:** Denote user input, human interaction, or override functions.

---

## 7. Accessibility, Operability, Content & Voice (POUR)

**1. Perceivable & Operable**

* **Color Independence:** Semantic color cues must always be paired with secondary visual signifiers (e.g., solid line vs. dashed line).
* **Edit-Authority via Keyboard:** Full edit-authority of the VexFlow state must be possible via Arrow and Modifier keys without a pointer device. Tab sequences must fluidly navigate between the Sandbox and Inspector layers.

**2. Understandable & Robust**

* **Screen Reader Handling:** Draggable Note Tokens inject ARIA labels formatted as `[Voice]: [Pitch] [Duration]` (e.g., `Soprano: C5 Quarter Note`).
* **Live Regions for Causality:** Rule violations announce immediately as aria-live critical alerts: `Alert: Parallel Fifth detected between Soprano and Tenor`.
* **Semantic DOM Elements:** SVG interaction must map to standard, accessible HTML `<button>` and `<input>` proxy elements within the React application tree.

**3. Content & Voice Guidelines**

* **Tone:** Scholarly, objective, calm, and non-judgmental. Do not use conversational filler or emotional validation.
* **AI Explanations:** Confined strictly to the Theory Inspector panel to prevent cluttering the Sandbox. Use precise language like "Stylistic Observation: Doubled Leading Tone."

---

## 8. Developer Hand-off & Schema Definition

To effectively generate production-ready React/VexFlow code without hallucination, all components and logic must adhere to the following contracts.

### A. State Management & Data Ontology (Zustand)

The core of the application must rely on a strictly typed, immutable representation of musical state.

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

* **The Rule of the Wrapper:** VexFlow rendering logic must be isolated within a `useEffect` hook that triggers re-renders *only* when the symbolic `ScoreState` changes or container resizes.
* **Proxy Elements for POUR:** Invisible HTML `<button>` elements must be positioned absolutely over the VexFlow note coordinates to handle `onFocus`, `onKeyDown`, and `onClick` synthetic events, dispatching updates to Zustand.

```typescript
// components/organisms/StaffRenderer.tsx
// Required implementation pattern

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

LLMs must implement the following Prop interfaces exactly as defined. Do not generate arbitrary local state; all core logic resides in Zustand.

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

To utilize the **"Theory Named" strategy** effectively, the UI visually translates axiomatic music logic under these constraints:

1. **Pitch vs. Spelling Strictness:** The system must differentiate between enharmonic equivalents (e.g., C# vs. Db). Interpreting intervals based on MIDI note numbers is forbidden. VexFlow must receive the exact theoretical spelling from the Backend.
2. **Violation Coordinates (The "Red Line" Tooltips):** When drawing the `TheoryViolationIndicator` molecule over VexFlow output, the bounding box of the specific `StaveNote` instances involved must be calculated. The Red Line is an SVG overlay using React portal logic relative to the `containerRef`, ensuring decoupling from VexFlow computation.
3. **Non-Blocking Edits:** The handler for a `moveNote` action must inherently accept *any* pitch modification. The UI renders the new pitch instantly, and evaluating constraints follows afterwards. The UI must never reject a move action defensively (Expressive Sovereignty).

---

## 10. Design Tokens (JSON Base)

The system leverages hierarchical token mapping via JSON, easily compiled to Tailwind CSS theme schemas.

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
      }
    }
  }
}
```
