# HarmonyForge: Complete Architecture & Features Overview

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Backend Overview](#backend-overview)
3. [Frontend Overview](#frontend-overview)
4. [Integration & Data Flow](#integration--data-flow)
5. [Feature Matrix](#feature-matrix)

---

## System Architecture

### High-Level Architecture
```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Frontend      │         │   Backend API    │         │  Harmonization  │
│   (React/Vite)  │◄───────►│   (Express.js)   │◄───────►│     Engine      │
│                 │  HTTP   │                  │  TS/JS  │  (harmonize-    │
│  - UI Components│         │  - File Upload   │         │    core.ts)     │
│  - State Mgmt   │         │  - Route Handler │         │                 │
│  - API Client   │         │  - Adapter       │         │  - Music Theory │
└─────────────────┘         └──────────────────┘         │  - Algorithms   │
                                                           └─────────────────┘
```

### Technology Stack

**Backend:**
- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.18
- **File Handling**: Multer (memory storage)
- **XML Processing**: @xmldom/xmldom
- **Language**: TypeScript (harmonize-core.ts)

**Frontend:**
- **Framework**: React 18.3
- **Build Tool**: Vite 5.4
- **Styling**: Tailwind CSS 4.1
- **UI Components**: Radix UI (shadcn/ui)
- **Music Rendering**: 
  - OpenSheetMusicDisplay (OSMD) 1.9.2
  - VexFlow 5.0 (interactive editing)
- **State Management**: React Hooks
- **Storage**: LocalStorage (project persistence)

---

## Backend Overview

### Server Architecture (`server.js`)

**Express Server Setup:**
- Port: 3001 (configurable via `PORT` env var)
- CORS: Enabled for localhost:5173, 5174, 3000, and custom frontend URL
- File Upload: Multer middleware with 50MB limit
- File Validation: Only accepts `.xml` and `.musicxml` files

**Endpoints:**
1. `GET /health` - Health check endpoint
2. `POST /api/harmonize` - Main harmonization endpoint

### Harmonization Route (`routes/harmonize.js`)

**Request Processing:**
- Validates file upload presence
- Parses instruments (comma-separated, max 4)
- Converts Express request to Next.js-compatible format
- Calls harmonization engine via adapter
- Enriches response with metadata (processing time, timestamp)

**Response Format:**
```json
{
  "harmonyOnly": {
    "content": "<MusicXML>...</MusicXML>",
    "filename": "original_harmony.musicxml"
  },
  "combined": {
    "content": "<MusicXML>...</MusicXML>",
    "filename": "original_combined.musicxml"
  },
  "explanations": [...],  // Optional: XAI explanations
  "educationalNotes": [...],  // Optional: Educational content
  "metadata": {
    "instruments": ["Violin", "Cello"],
    "processingTime": 1234,
    "timestamp": "2025-01-XX...",
    "originalFilename": "melody.xml"
  }
}
```

### Harmonization Engine (`harmonize-core.ts`)

**Core Capabilities:**

#### 1. **Music Theory Foundation**
- **Scales**: Major and Minor scale definitions
- **Voice Ranges**: SATB ranges (Soprano, Alto, Tenor, Bass)
- **Harmonic Functions**: Tonic → Predominant → Dominant flow
- **Chord Qualities**: Major, Minor, Diminished, Augmented, 7th chords
- **Roman Numeral Analysis**: Automatic chord labeling (I, V, V7, etc.)

#### 2. **Deterministic Variation Control**
- **Seeded Random Generator**: Linear Congruential Generator (LCG)
- **Reproducible Outputs**: Same input + seed = identical output
- **Hash-based Seeds**: Automatic seed generation from content
- **Version Tracking**: Seed stored with each project version

#### 3. **Genre-Specific Rule Sets**
Supports 7 genres with distinct rule modifications:

| Genre | Parallel Motion | Voice Leading | Counterpoint | Tension |
|-------|----------------|---------------|--------------|---------|
| **Classical** | ❌ Strict | Strict | Optional | 0.3 |
| **Baroque** | ❌ Strict | Strict | ✅ Required | 0.2 |
| **Romantic** | ❌ Moderate | Moderate | Optional | 0.4 |
| **Jazz** | ✅ Allowed | Moderate | Optional | 0.6 |
| **Pop** | ✅ Allowed | Free | Optional | 0.4 |
| **Contemporary** | ✅ Allowed | Free | Optional | 0.5 |
| **Mariachi** | ✅ (except octaves) | Moderate | Optional | 0.35 |

#### 4. **Controllable Tonal Tension**
- **Parameter**: `tension` (0-1)
  - 0.0 = Very consonant (simple triads)
  - 0.5 = Balanced
  - 1.0 = Very dissonant (complex harmonies, extended chords)
- **Implementation**: Modulates chord quality selection, NCT frequency, harmonic complexity

#### 5. **Sophisticated Non-Chord Tone (NCT) Engine**
- **Types Detected**:
  - Passing Tones (stepwise motion)
  - Neighbor Tones (decorative)
  - Suspensions (delayed resolution)
  - Appoggiaturas (leap + step resolution)
  - Anticipations
  - Escape Tones
- **Frequency Control**: `nctFrequency` parameter (0-1)
- **Transparency**: Explains each NCT type and resolution

#### 6. **Counterpoint Generation**
- **Independent Melodic Lines**: Creates polyphonic texture vs. block chords
- **Rules**: Stepwise motion preferred, chord tone emphasis
- **Enable Flag**: `enableCounterpoint: true`
- **Voice Assignment**: Maps instruments to SATB voices

#### 7. **Perfect Transparency (XAI Core)**
- **Rule Explanations**: Every decision explained
- **Format**: `RuleExplanation` interface with:
  - `rule`: Human-readable rule name
  - `reason`: Why this decision was made
  - `ruleId`: Unique identifier
  - `parameters`: Exact values used
  - `alternatives`: Other options considered
- **Enable Flag**: `transparencyMode: true`
- **Output**: Array of explanations indexed by chord/voice

#### 8. **Granular Infilling & Correction**
- **Infilling**: Generate notes for missing segments
- **Correction Targets**:
  - Bar-level regeneration
  - Voice-level regeneration
  - Chord-level regeneration
- **Context Preservation**: Maintains surrounding harmony
- **Enable Flag**: `correctionMode: true` + `correctionTarget`

#### 9. **Bar-Level Controls**
- **Density Control**: Sparse, Moderate, Dense
- **Polyphony**: Number of simultaneous voices
- **Rhythmic Complexity**: Simple, Moderate, Complex
- **Voice Locking**: Lock specific voices from regeneration
- **Articulation**: Staccato, Legato, Tenuto, Marcato
- **Dynamics**: pp, p, mp, mf, f, ff

#### 10. **Compositional Techniques**
- **Fragmentation**: Break motifs into smaller units
- **Sequence**: Transpose motifs up/down
- **Inversion**: Invert melodic intervals
- **Augmentation**: Lengthen note durations
- **Diminution**: Shorten note durations

#### 11. **Structural Hierarchy Planning**
- **Phrase Detection**: Identifies musical phrases
- **Section Analysis**: Divides into sections
- **Cadence Placement**: Plans cadences (authentic, plagal, deceptive)
- **Multi-level Planning**: Background → Middleground → Foreground

#### 12. **Schenkerian Analysis**
- **Background Level**: Fundamental structure
- **Middleground Level**: Intermediate reductions
- **Foreground Level**: Surface details
- **Enable Flag**: `schenkerianAnalysis: true`

#### 13. **Dynamic Difficulty Control**
- **Levels**: Beginner, Intermediate, Expert
- **Beginner**: 
  - Middle 60% of range
  - Avoids large leaps
  - Simple rhythms
- **Expert**: Full range, complex rhythms, advanced techniques

#### 14. **Semantic Sliders**
- **Conventional ↔ Surprising**: Predictability control
- **Happy ↔ Sad**: Emotional character
- **Simple ↔ Complex**: Harmonic complexity
- **Stable ↔ Unstable**: Tonal stability

#### 15. **Instrument Support**
**Strings:**
- Violin (G3-E7)
- Viola (C3-E6)
- Cello (C2-A5)

**Woodwinds:**
- Flute (C4-C7)
- Oboe (Bb3-A6)
- B-flat Clarinet (D3-Bb6)
- Bassoon (Bb1-Eb5)

**Brass:**
- B-flat Trumpet (E3-Bb5)
- F Horn (B2-F5)
- Tuba (D1-F4)

**Voices:**
- Soprano (C4-C6)
- Tenor Voice (C3-C5)

#### 16. **Voice Leading Rules**
- **Common Tone Preservation**: Prefers keeping common tones
- **Stepwise Motion**: Minimizes leaps
- **Avoid Parallel Motion**: Prevents parallel fifths/octaves (genre-dependent)
- **Spacing Rules**: Maintains proper voice spacing
- **Doubling Strategy**: Smart chord tone doubling
- **Inversion Selection**: Chooses inversions for smooth voice leading

#### 17. **Harmonic Progression Generation**
- **Scale Degree Analysis**: Analyzes melody notes
- **Chord Selection**: Chooses appropriate chords per scale degree
- **Function Flow**: Follows Tonic → Predominant → Dominant
- **Cadence Planning**: Strong cadences at phrase endings
- **Secondary Dominants**: Detects and handles V/V, V/vi, etc.
- **Borrowed Chords**: Mode mixture (e.g., iv in major)

#### 18. **MusicXML Generation**
- **Two Output Formats**:
  - `harmonyOnly`: Just the generated harmony parts
  - `combined`: Original melody + harmony parts
- **Proper Formatting**: Valid MusicXML 3.1
- **Instrument Mapping**: Correct clefs, transpositions, ranges
- **Metadata**: Preserves original key, time signature, tempo

#### 19. **Caching System**
- **In-Memory Cache**: Stores recent harmonizations
- **Cache Key**: Hash of content + instruments
- **TTL**: 30 minutes
- **Max Size**: 100 entries
- **Auto-Cleanup**: Removes old entries periodically

#### 20. **Alternative Generation**
- **Multiple Solutions**: Generate N alternative harmonizations
- **Variation**: Slight tension adjustments per alternative
- **Seed-Based**: Each alternative uses variant seed
- **Enable Flag**: `generateAlternatives: N`

---

## Frontend Overview

### Application Structure

**Main Entry Point:**
- `main.tsx` - React app initialization
- `App.tsx` - Main application component with routing

**Screen Flow:**
```
Home (Upload) → Processing → Instrument Selection → Interactive Workspace
                                                          ↓
                                                    Projects Page
                                                          ↓
                                                    Profile Page
```

### Core Screens

#### 1. **Home Page (Upload Screen)**
**File**: `components/home/` + `App.tsx`

**Features:**
- Drag-and-drop file upload
- Click-to-upload button
- File validation (MIDI/XML, 50MB max)
- Visual feedback (hover states, error messages)
- Animated title component
- Auto-advance to Processing Screen

**Components:**
- `UploadZone` - Main drop area
- `AnimatedTitle` - "Create harmonies in a flash" animation
- `UploadMessage` - File name display / error messages

#### 2. **Processing Screen**
**File**: `components/ProcessingScreen.tsx`

**Features:**
- Animated musical staff with floating notes
- 4-step progress indicator:
  1. Validating format
  2. Extracting pitch
  3. Identifying key
  4. Setting tempo
- Visual progress bar
- Success overlay with confetti
- Accessibility features (ARIA labels, screen reader support)

**Visual Elements:**
- 5-line staff with treble clef
- Animated note symbols (♪, ♫, ♬, ♩)
- Progress fill on staff lines
- Check circles with animations

#### 3. **Instrument Selection Screen**
**File**: `components/InstrumentSelectionScreen.tsx`

**Features:**
- **4 Categories**:
  - Strings (Violin, Viola, Cello)
  - Woodwinds (Flute, Oboe, Clarinet, Bassoon)
  - Brass (Trumpet, Horn, Tuba)
  - Voices (Soprano, Tenor)
- **Instrument Cards**:
  - Visual icons (images for strings, placeholders for others)
  - Range information
  - Descriptions
  - Selection limit: 4 instruments
- **Toast Notification**: Shows selection count
- **Generate Button**: Calls API with selected instruments
- **Error Handling**: User-friendly error messages

**API Integration:**
- Sends file + instruments to `/api/harmonize`
- Includes `transparencyMode: true` and `educationalMode: true` by default
- Generates deterministic seed for version tracking

#### 4. **Interactive Workspace** ⭐ NEW
**File**: `components/InteractiveWorkspace.tsx`

**Features:**

**Layered Canvas:**
- DAW-like interface with multiple layers
- Each instrument = separate layer
- Layer visibility toggles
- Layer locking (for original melody)
- Color-coded layers
- Synchronized editing

**Transparency Mode (XAI):**
- Toggleable "Theory Inspector" button
- Hover tooltips on notes showing:
  - Rule name
  - Reason for decision
  - Rule ID
  - Parameters used
  - Alternatives considered
- Real-time explanation lookup

**Tension & Genre HUD:**
- **Tonal Tension Slider**: 0-1 (consonant ↔ dissonant)
- **Genre Preset Selector**: 6 genres
- **Bar-Level Controls**: Regenerate specific bars
- Real-time regeneration on parameter change

**VexFlow Integration:**
- Direct in-browser sheet music rendering
- MusicXML parsing
- Multi-stave display (one per layer)
- Note hover detection
- Zoom controls (50%-200%)
- Playback controls (placeholder)

**Sidebar Tabs:**
- **Layers**: Manage layer visibility/locking
- **Controls**: Tension, genre, bar-level controls
- **Info**: Educational notes, metadata, seed

**Version Management:**
- "Save Version" button
- Version history sidebar
- Seed tracking for reproducibility

#### 5. **Results Screen** (Legacy)
**File**: `components/ResultsScreen.tsx`

**Features:**
- OpenSheetMusicDisplay (OSMD) preview
- Expandable full-screen modal
- Export options (Full Score, Harmony Only, Individual Parts)
- Instrument tag editing
- Regenerate button
- Project name editing

**Note**: Can be toggled off in favor of Interactive Workspace

#### 6. **Projects Page**
**File**: `components/ProjectsPage.tsx`

**Features:**
- Project grid display
- Project cards with:
  - Music icon badge
  - Project name
  - Instrument tags
  - Style badge
  - Last modified timestamp
- Hover effects
- Empty state message

**Current State**: Mock data (needs backend integration)

#### 7. **Profile Page**
**File**: `components/ProfilePage.tsx`

**Features:**
- User profile card
- Statistics:
  - Projects Created
  - Achievements
  - Days Active
- Settings button

**Current State**: Mock data (needs backend integration)

#### 8. **Visual Onboarding**
**File**: `components/VisualOnboarding.tsx`

**Features:**
- 5-step interactive tutorial:
  1. **Circle of Fifths**: Interactive SVG visualization
  2. **Harmonic Functions**: Tonic → Predominant → Dominant flow
  3. **Voice Leading**: Stepwise motion example
  4. **Tonal Tension**: Consonance ↔ Dissonance spectrum
  5. **Genre Comparison**: Style-specific rules comparison
- Step-by-step navigation
- Progress indicators
- Accessible via "Guide" button in workspace

### Supporting Components

#### **Sidebar Navigation**
**File**: `components/Sidebar.tsx`

**Features:**
- Draggable sidebar (6 positions: corners + top/bottom center)
- Expandable on hover
- Navigation items: Home, Projects, Profile
- Gradient background (coral/orange)
- Responsive (horizontal/vertical layouts)

#### **UI Component Library**
**Location**: `components/ui/`

**Components**: 40+ shadcn/ui components including:
- Button, Dialog, Select, Slider, Switch, Tabs
- Tooltip, Accordion, Alert, Card, Form
- All styled to match design system

### Services

#### **API Service**
**File**: `services/api.ts`

**Methods:**
- `harmonize(params)` - Main harmonization call
- `healthCheck()` - Backend health check

**Enhanced Parameters:**
```typescript
{
  file: File,
  instruments: string[],
  tension?: number,
  genre?: string,
  transparencyMode?: boolean,
  educationalMode?: boolean,
  seed?: number,
  barLevelControls?: Array<{barIndex: number, regenerate?: boolean}>
}
```

#### **Project Service**
**File**: `services/projectService.ts`

**Features:**
- LocalStorage-based persistence
- Project CRUD operations
- Version history (last 20 versions per project)
- Seed tracking
- Export/Import functionality

**Methods:**
- `saveProject()`, `getProject()`, `deleteProject()`
- `saveVersion()`, `getVersions()`, `getVersion()`
- `createProject()`, `exportProject()`, `importProject()`

### Design System

**Color Palette:**
- Primary: `#e76d57` (coral)
- Background: `#f8f3eb` (warm beige)
- Text: `#201315` (dark brown)
- Borders: `#e5ddd5` (light beige)
- Accent: `#6B6563` (gray)

**Typography:**
- Headings: Figtree Bold
- Body: SF Pro Rounded Regular
- Labels: Figtree SemiBold

**Responsive Breakpoints:**
- `sm`: 640px+
- `md`: 768px+
- `lg`: 1024px+

---

## Integration & Data Flow

### Request Flow

```
1. User uploads file (Home Page)
   ↓
2. File validated (size, format)
   ↓
3. Processing screen shows progress
   ↓
4. User selects instruments (Instrument Selection)
   ↓
5. Frontend calls POST /api/harmonize
   {
     file: File,
     instruments: ["Violin", "Cello"],
     transparencyMode: true,
     educationalMode: true,
     seed: 123456
   }
   ↓
6. Backend validates & processes
   ↓
7. Harmonization engine generates:
   - Harmonic progression
   - Voice leading
   - Explanations (if transparencyMode)
   - Educational notes (if educationalMode)
   ↓
8. MusicXML generated (harmonyOnly + combined)
   ↓
9. Response sent to frontend
   {
     harmonyOnly: {content, filename},
     combined: {content, filename},
     explanations: [...],
     educationalNotes: [...],
     metadata: {...}
   }
   ↓
10. Frontend displays in Interactive Workspace
    - Creates project
    - Renders with VexFlow
    - Shows layers
    - Enables transparency mode
```

### State Management

**App-Level State:**
- `currentPage`: 'home' | 'projects' | 'profile'
- `uploadedFile`: File object
- `harmonyData`: Harmonization result
- `currentProjectId`: Active project ID
- `currentSeed`: Deterministic seed
- `useInteractiveWorkspace`: Toggle new/old UI

**Component-Level State:**
- Workspace: layers, transparency mode, tension, genre, zoom
- Projects: project list, version history
- Onboarding: current step, completion status

### Data Persistence

**LocalStorage Keys:**
- `harmonyforge_projects`: Project data
- `harmonyforge_versions`: Version history

**Project Structure:**
```typescript
{
  id: string,
  name: string,
  createdAt: string,
  updatedAt: string,
  instruments: string[],
  versions: ProjectVersion[],
  currentVersionId?: string
}
```

**Version Structure:**
```typescript
{
  id: string,
  timestamp: string,
  seed?: number,
  tension?: number,
  genre?: string,
  layers: Layer[],
  projectId: string,
  harmonyOnly?: {content, filename},
  combined?: {content, filename}
}
```

---

## Feature Matrix

### Backend Features

| Feature | Status | Parameter | Description |
|---------|--------|-----------|-------------|
| **Basic Harmonization** | ✅ | - | Core harmonization algorithm |
| **Deterministic Output** | ✅ | `seed` | Reproducible results |
| **Genre Rules** | ✅ | `genre` | 7 genre presets |
| **Tonal Tension** | ✅ | `tension` | 0-1 control |
| **Transparency Mode** | ✅ | `transparencyMode` | XAI explanations |
| **Educational Mode** | ✅ | `educationalMode` | Learning content |
| **NCT Engine** | ✅ | `enableNCT`, `nctFrequency` | Non-chord tones |
| **Counterpoint** | ✅ | `enableCounterpoint` | Polyphonic lines |
| **Infilling** | ✅ | `enableInfilling`, `infillingRange` | Fill gaps |
| **Correction** | ✅ | `correctionMode`, `correctionTarget` | Regenerate parts |
| **Bar Controls** | ✅ | `barLevelControls` | Per-bar settings |
| **Compositional Techniques** | ✅ | `compositionalTechniques` | Motif transformations |
| **Schenkerian Analysis** | ✅ | `schenkerianAnalysis` | Structural analysis |
| **Difficulty Levels** | ✅ | `difficultyLevel` | Beginner/Expert |
| **Semantic Sliders** | ✅ | `semanticSliders` | High-level controls |
| **Alternatives** | ✅ | `generateAlternatives` | Multiple solutions |
| **Caching** | ✅ | Auto | Performance optimization |

### Frontend Features

| Feature | Status | Location | Description |
|---------|--------|----------|-------------|
| **File Upload** | ✅ | Home Page | Drag-drop + click |
| **Processing UI** | ✅ | ProcessingScreen | Animated progress |
| **Instrument Selection** | ✅ | InstrumentSelectionScreen | 4 categories, 13 instruments |
| **Interactive Workspace** | ✅ | InteractiveWorkspace | Layered canvas, editing |
| **Transparency Mode** | ✅ | InteractiveWorkspace | Hover tooltips |
| **Tension/Genre HUD** | ✅ | InteractiveWorkspace | Real-time controls |
| **VexFlow Rendering** | ✅ | InteractiveWorkspace | In-browser editing |
| **Visual Onboarding** | ✅ | VisualOnboarding | 5-step tutorial |
| **Project Persistence** | ✅ | projectService | LocalStorage |
| **Version History** | ✅ | InteractiveWorkspace | Seed tracking |
| **Export Options** | ✅ | ResultsScreen | 3 export formats |
| **Responsive Design** | ✅ | All components | Mobile-first |
| **Accessibility** | ✅ | All components | ARIA, keyboard nav |

### Integration Status

| Feature | Backend | Frontend | Integration |
|---------|---------|----------|-------------|
| **Transparency Mode** | ✅ | ✅ | ✅ Complete |
| **Educational Mode** | ✅ | ✅ | ✅ Complete |
| **Tension Control** | ✅ | ✅ | ✅ Complete |
| **Genre Selection** | ✅ | ✅ | ✅ Complete |
| **Bar-Level Controls** | ✅ | ✅ | ✅ Complete |
| **Seed Tracking** | ✅ | ✅ | ✅ Complete |
| **Project Persistence** | ⚠️ Partial | ✅ | ⚠️ Frontend-only |
| **Version History** | ⚠️ Partial | ✅ | ⚠️ Frontend-only |

---

## Performance Characteristics

### Backend
- **Processing Time**: Typically 100-2000ms depending on:
  - File size
  - Number of instruments
  - Complexity of harmonization options
- **Caching**: Reduces repeat requests to <10ms
- **Memory**: In-memory cache (max 100 entries)
- **Concurrency**: Handles multiple simultaneous requests

### Frontend
- **Initial Load**: ~2-3s (includes React + dependencies)
- **File Upload**: Instant validation, async processing
- **Rendering**: VexFlow rendering ~100-500ms for typical scores
- **Storage**: LocalStorage (5-10MB typical per project)

---

## Security Considerations

### Backend
- **File Size Limit**: 50MB max
- **File Type Validation**: Only XML/MusicXML
- **CORS**: Restricted to known frontend URLs
- **Error Handling**: Sanitized error messages
- **Input Validation**: All parameters validated

### Frontend
- **File Validation**: Client-side + server-side
- **XSS Protection**: React's built-in escaping
- **LocalStorage**: User's browser only
- **No Sensitive Data**: No authentication/user data stored

---

## Future Enhancements

### Backend
- [ ] Database integration for project persistence
- [ ] User authentication
- [ ] Cloud storage for projects
- [ ] MIDI file support (currently XML only)
- [ ] Real-time collaboration
- [ ] WebSocket support for live updates

### Frontend
- [ ] Full VexFlow note editing (drag-drop, pitch changes)
- [ ] MIDI playback using Web Audio API
- [ ] Collaborative editing
- [ ] Cloud sync
- [ ] Advanced visualizations (Schenkerian graphs)
- [ ] Probe intervention UI
- [ ] Example-based steering interface

---

## Conclusion

HarmonyForge is a **sophisticated, deterministic harmonization engine** with a **modern, interactive frontend**. The system combines:

- **Advanced Music Theory**: Comprehensive rule-based harmonization
- **Explainable AI**: Perfect transparency for every decision
- **User Control**: Fine-grained parameters for creative expression
- **Educational Focus**: Learning scaffold for music students
- **Professional Tools**: DAW-like workspace for serious musicians

The architecture supports both **novice users** (through onboarding and educational mode) and **expert musicians** (through granular controls and transparency), making it a versatile platform for music harmonization and education.

