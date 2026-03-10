# Interactive Workspace Implementation Notes

## Overview
This document outlines the implementation of the 6 major features that transform HarmonyForge from a linear workflow into an interactive co-creation platform.

## ✅ Completed Features

### 1. Interactive Workspace (Layered Canvas)
**File**: `frontend/src/components/InteractiveWorkspace.tsx`

**Features**:
- DAW-like layered interface replacing static Results Screen
- Layer management (visibility toggles, locking)
- Synchronized multi-layer editing
- Zoom controls
- Playback controls (placeholder)

**Integration**: 
- Updated `App.tsx` to conditionally render InteractiveWorkspace vs ResultsScreen
- Toggle controlled by `useInteractiveWorkspace` state (default: true)

### 2. Transparency Mode (XAI Interface)
**File**: `frontend/src/components/InteractiveWorkspace.tsx` (lines 50-60, 200-220)

**Features**:
- Toggleable "Theory Inspector" button
- Hover tooltips showing rule explanations
- Displays: rule name, reason, rule ID, parameters, alternatives
- Real-time explanation lookup from backend data

**Backend Support**:
- Backend already returns `explanations` array when `transparencyMode: true`
- Each explanation includes: `chordIndex`, `rule`, `reason`, `ruleId`, `parameters`

### 3. Tension & Genre HUD
**File**: `frontend/src/components/InteractiveWorkspace.tsx` (lines 250-320)

**Features**:
- Tonal Tension slider (0-1, 0=consonant, 1=dissonant)
- Genre preset selector (Classical, Baroque, Romantic, Jazz, Pop, Contemporary)
- Bar-level controls for selected bars
- Real-time regeneration on parameter change

**API Integration**:
- Updated `ApiService.harmonize()` to accept `tension`, `genre`, `barLevelControls`
- Parameters passed to backend via FormData

### 4. Visual Onboarding
**File**: `frontend/src/components/VisualOnboarding.tsx`

**Features**:
- 5-step interactive tutorial
- Visualizations:
  1. Circle of Fifths (interactive SVG)
  2. Harmonic Functions (Tonic → Predominant → Dominant)
  3. Voice Leading Example
  4. Tension Visualization
  5. Genre Comparison
- Step-by-step navigation with progress indicators
- Accessible via "Guide" button in workspace

**Integration**: 
- Triggered from InteractiveWorkspace toolbar
- Can be shown on first visit (future enhancement)

### 5. Project Persistence & Version History
**File**: `frontend/src/services/projectService.ts`

**Features**:
- LocalStorage-based persistence
- Project CRUD operations
- Version history tracking (last 20 versions per project)
- Seed tracking for deterministic regeneration
- Export/Import functionality

**Integration**:
- Projects auto-created on harmonization
- Versions saved via "Save Version" button
- Version history accessible via sidebar

## ⚠️ Partial Implementation

### 6. Direct In-Browser Symbolic Editing (VexFlow)
**Status**: Component structure created, full VexFlow integration pending

**What's Done**:
- Component structure with canvas ref
- Layer management system
- Note hover detection system
- Zoom and viewport controls

**What's Needed**:
1. Install VexFlow: `npm install vexflow` (requires npm permissions fix)
2. Parse MusicXML to VexFlow StaveNote objects
3. Implement note selection and editing
4. Handle note drag/drop for pitch changes
5. Sync edits back to MusicXML format

**Next Steps**:
```bash
# Fix npm permissions or use npx
cd frontend
npm install vexflow

# Then complete the rendering logic in InteractiveWorkspace.tsx
# See TODO comments around line 150-200
```

## API Updates

### Enhanced HarmonizeParams
```typescript
interface HarmonizeParams {
  file: File;
  instruments: string[];
  tension?: number;              // NEW
  genre?: string;                // NEW
  transparencyMode?: boolean;    // NEW
  educationalMode?: boolean;     // NEW
  seed?: number;                 // NEW
  barLevelControls?: Array<{     // NEW
    barIndex: number;
    regenerate?: boolean;
  }>;
}
```

### Enhanced HarmonizeResponse
```typescript
interface HarmonizeResponse {
  harmonyOnly: { content: string; filename: string };
  combined: { content: string; filename: string };
  explanations?: RuleExplanation[];      // NEW
  educationalNotes?: string[];            // NEW
  metadata?: { ... };
}
```

## State Management

### App.tsx Updates
- `useInteractiveWorkspace`: Toggle between new/old UI (default: true)
- `currentProjectId`: Tracks active project
- `currentSeed`: Tracks deterministic seed for versioning
- `showOnboarding`: Controls onboarding dialog

### Project Service
- LocalStorage-based persistence
- Version history with seed tracking
- Export/Import support

## UI/UX Improvements

1. **Layered Canvas**: Each instrument is a separate, editable layer
2. **Transparency Tooltips**: Hover over notes to see rule explanations
3. **Real-time Controls**: Tension and genre changes trigger regeneration
4. **Visual Learning**: Onboarding teaches music theory concepts
5. **Version Control**: Save and return to previous arrangements

## Backend Compatibility

All new features leverage existing backend capabilities:
- `transparencyMode` → Returns `explanations` array
- `educationalMode` → Returns `educationalNotes` array
- `tension` → Modulates harmonic complexity
- `genre` → Applies genre-specific rules
- `seed` → Ensures deterministic output
- `barLevelControls` → Enables granular regeneration

## Testing Checklist

- [ ] Install VexFlow and complete note editing
- [ ] Test transparency mode tooltips
- [ ] Verify tension slider updates harmonies
- [ ] Test genre preset switching
- [ ] Verify project saving/loading
- [ ] Test version history navigation
- [ ] Complete onboarding flow
- [ ] Test bar-level regeneration

## Future Enhancements

1. **Full VexFlow Integration**: Complete note editing functionality
2. **MIDI Playback**: Add actual audio playback using Web Audio API
3. **Collaborative Editing**: Real-time multi-user editing
4. **Cloud Sync**: Move from LocalStorage to cloud backend
5. **Advanced Visualizations**: Schenkerian analysis display
6. **Probe Intervention**: UI for probe-assisted editing
7. **Example-Based Steering**: Upload example harmonies to guide generation

## Notes

- VexFlow installation requires npm permissions fix (see earlier conversation)
- All components use existing UI library (shadcn/ui)
- Design system maintained (colors, fonts, spacing)
- Responsive design preserved
- Accessibility features included (ARIA labels, keyboard nav)

