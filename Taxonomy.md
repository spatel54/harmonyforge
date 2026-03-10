# HarmonyForge Theory Lexicon — RAG Source for Theory Inspector

> **Role**: This file is the canonical lexicon/taxonomy used by the Theory Inspector RAG pipeline. The Auditor detects violations; RAG retrieves from this document; the Tutor returns ante-hoc explanations. **Extracted from HFLitReview notebook sources** (Fux, Aldwell & Schachter, SchenkerGUIDE, Open Music Theory, HarmonySolver, SymPAC, gigging-musician transcripts).

---

## RAG Retrieval Flow

```
User edit → Auditor detects violation → RAG retrieves genre-specific section from Taxonomy.md
         → Tutor returns ante-hoc explanation (compact, axiomatic, source-aligned)
```

**Genre selection**: Inferred from score metadata, user selection, or chord vocabulary heuristics. Load only the active genre's section to minimize context.

---

## 1. Classical & Functional Harmony (Axiomatic Core)

*Constraint-satisfaction ground truth. Sources: Fux (Counterpoint), Aldwell & Schachter (Harmony & Voice Leading), SchenkerGUIDE.*

### 1.1 Strict Voice-Leading (Red-Line Triggers)

| Term | Definition | Flag When | Source |
|------|------------|----------|--------|
| **Parallel fifths** | Two voices move in same direction to perfect fifth. Forbidden: perfect 5th "defines triadic root" and deprives voices of independence. | Same two voices form perfect fifth in consecutive chords | Fux, Aldwell-Schachter |
| **Parallel octaves** | Two voices move in same direction to perfect octave. One part "duplicates pitch and motion of the other in different register." | Same two voices form octave in consecutive chords | Aldwell-Schachter |
| **Parallel unisons** | Both voices on same pitch. "Individuality does not exist." | Any parallel unison | Aldwell-Schachter |
| **Hidden fifths/octaves** | Perfect consonance approached by similar motion; "conceals actual parallels if intervals were filled in." Especially in outer voices when soprano leaps. | Outer voices move in similar motion to perfect 5th or 8ve | Fux, Aldwell-Schachter |
| **Consecutive 5ths/8ves by contrary motion** | Two perfect intervals in same pair of voices; "tends to cause unwanted accents." | Best avoided in most cases | Aldwell-Schachter |
| **Voice crossing** | Two voices exchange position (e.g., alto below tenor). "Soprano or bass line can become obscured." Least problematic when brief, inner voices only. | Adjacent voices intersect | Aldwell-Schachter |
| **Voice overlap** | Lower voice moves above prior upper-voice note, or upper below prior lower. "Melodic stepwise connection can be made between the two voices"; confusing in four-part vocal style. | One voice exceeds the other's prior position | Aldwell-Schachter |
| **False relation** | Chromatic contradiction split between different voices in adjacent chords. | Same pitch class as ♮ and ♭/♯ in close proximity | HarmonySolver |

### 1.2 Doubling Rules

| Term | Rule | Flag When | Source |
|------|------|-----------|--------|
| **Leading tone** | Never double when part of V or VII or inversions; "active tendency toward 1̂." | Leading tone doubled | Aldwell-Schachter |
| **Chord 7th** | "Forms a dissonance; must never be doubled." | 7th doubled | Aldwell-Schachter |
| **Root-position triads** | Double root most often; occasionally double root and omit 5th. "Double the more stable parts." | Third doubled in restricted contexts | Aldwell-Schachter, Fux |
| **Cadential ⁶₄** | "Bass is the best tone to double" (root of prevailing V). | Wrong tone doubled in ⁶₄ | Aldwell-Schachter |
| **Illegal doubled third** | Third as chord component limited by voice-leading. | Third in two+ voices where forbidden | HarmonySolver |

### 1.3 Cadence Rules

| Term | Definition | Flag When | Source |
|------|-------------|-----------|--------|
| **Clausula vera** | Conclusion by contrary stepwise motion to final perfect consonance. CF 2̂–1̂ → CP 7̂–1̂ (major 6th → octave); CF upper → minor 3rd → unison. | Cadence not approached correctly | Fux |
| **Perfect authentic cadence** | V–I with soprano on 8̂ (1̂); "most final sounding." | — | Aldwell-Schachter |
| **Imperfect authentic cadence** | V–I with soprano on 3̂ or 5̂; "less final sounding." | — | Aldwell-Schachter |
| **Semicadence (half cadence)** | Ends on V without resolving to I. | — | Aldwell-Schachter |
| **Phrygian cadence** | IV⁶–V in minor; "interior, rather than final." | — | Aldwell-Schachter |
| **Cadential ⁶₄** | Embellishes dominant at cadence; "emphasis to antecedent-consequent." | — | Aldwell-Schachter |

### 1.4 Harmonic Syntax & Phrase Model

| Term | Rule | Flag When |
|------|------|-----------|
| **Phrase model** | T → PD → D → T (Tonic → Pre-dominant → Dominant → Tonic). | Progression moves backward (e.g., D → PD) |
| **Authentic cadence** | V and I both in root position. | Dominant or tonic in inversion at cadence |

### 1.5 Schenkerian Hierarchy

| Term | Definition | Source |
|------|-------------|--------|
| **Ursatz** | Deepest archetypal progression; two-part: Urlinie + Bassbrechung. Entire piece elaborated from it. | SchenkerGUIDE |
| **Urlinie** | Fundamental line; stepwise diatonic descent toward 1̂ from Kopfton (3̂, 5̂, or 8̂). | SchenkerGUIDE |
| **Bassbrechung** | Bass arpeggiation: I → V → I. Supports Urlinie. | SchenkerGUIDE |
| **Prolongation (Auskomponierung)** | Simple structures elaborated through time. Passing tones, neighbor notes, arpeggiations; harmony "prolonged" even when not literally sounding. | SchenkerGUIDE |
| **Background (Hintergrund)** | Deepest layer; Ursatz. | SchenkerGUIDE |
| **Middleground (Mittelgrund)** | Layers between background and surface; initial ascents, interruptions (descent stops at 2̂ over V). | SchenkerGUIDE |
| **Foreground (Vordergrund)** | Surface; score as written. | SchenkerGUIDE |
| **Phrase fusion** | Pivot chords map local harmonies to deeper goals (e.g., I → IV reinterpretation). | — |

### 1.6 Algorithmic Constraints (HarmonySolver / CSP)

| Constraint | Rule | Source |
|------------|------|--------|
| **One direction** | Not all four voices moving in same direction simultaneously. | HarmonySolver |
| **Forbidden jumps** | Restrict unnatural or overly wide melodic leaps. | HarmonySolver |
| **Repeated function** | Penalize two identical chords with same function sequentially. | HarmonySolver |
| **Range** | Soprano C₄–G₅; Alto G₃–D₅; Tenor C₃–G₄; Bass F₂–D₄. | Standard SATB |
| **Spacing** | Max one octave between adjacent upper voices; max twelfth between Tenor and Bass. | Standard SATB |

---

## 2. Jazz & Blues Harmony

*Extended tertian harmony; chord-scale correlation. Auditor permits what Classical would flag. Sources: Open Music Theory.*

### 2.1 Chord-Scale Mappings

| Chord | Scale/Mode | Notes |
|-------|------------|-------|
| **Minor seventh (ii⁷)** | Dorian | Phrygian, Aeolian possible for some functions |
| **Dominant seventh (V⁷)** | Mixolydian | Altered, Whole-tone, Half-whole over V for alterations |
| **Major seventh (I⁷)** | Ionian | Lydian also common |
| **Half-diminished (ii∅⁷)** | Locrian | — |

### 2.2 ii–V–I Schema

| Context | Progression | Qualities |
|---------|-------------|-----------|
| **Major** | ii⁷–V⁷–Ima⁷ | minor7 → dominant7 → major7 |
| **Minor** | ii∅⁷–V⁷–i⁷ | half-dim7 → dominant7 → minor7 |
| **Applied ii–V** | Used to tonicize other chords (e.g., applied subdominant) | Root motion by fifth |

### 2.3 Tritone Substitution

| Term | Definition |
|------|-------------|
| **Mechanism** | Replace V⁷ with dominant a tritone away; shared tritone (guide tones). |
| **Voice leading** | Bass of substitute resolves chromatically down by minor 2nd to target root. |

### 2.4 Voicing & Extensions

| Term | Rule |
|------|------|
| **Fifth omission** | Fifth often omitted; adds little character |
| **3–7 paradigm** | 3rd of chord A → 7th of chord B; 7th → 3rd (smooth voice leading) |
| **Extensions** | 9, 11, 13 in upper voices; root/bass in lower. 13th must be above 7th or misheard as added 6th. |
| **12-bar blues** | All dominant sevenths; plagal (IV–I) emphasis, not authentic cadence |

---

## 3. Popular & Rock Music

*Cyclical schemas; chord loops; rotations. Sources: Open Music Theory, pop schema literature.*

### 3.1 Four-Chord Cyclical Schemas

| Schema | Progression | Rotations | Notes |
|--------|-------------|-----------|-------|
| **Doo-wop** | I–vi–IV–V | IV–V–I–vi | Authentic motion (V–I). Variant: I–vi–ii–V |
| **Singer/songwriter** | vi–IV–I–V | I–V–vi–IV; IV–I–V–vi | Plagal motion; tonally ambiguous (relative minor: i–VI–III–VII) |
| **Hopscotch** | IV–V–vi–I | — | Root motion by step-step-skip; tonic via skip. Minor: VI–VII–i–III |

### 3.2 Plagal & Blues-Based Schemas

| Schema | Progression | Notes |
|--------|-------------|-------|
| **Plagal vamp** | I–IV | Alternation; R&B, soul |
| **Plagal sigh** | IV–iv–I | Chromatic la–le–sol; nostalgia |
| **Double plagal** | ♭VII–IV–I | Mixolydian; "applied" IV of IV |
| **Extended plagal** | ♭VI–♭III–♭VII–IV–I | Flat side of circle of fifths |

### 3.3 Modal Schemas

| Schema | Progression | Mode |
|--------|-------------|------|
| **Subtonic shuttle** | I–♭VII (or i–♭VII) | Mixolydian / Aeolian |
| **Aeolian shuttle** | i–♭VII–♭VI–♭VII | Aeolian; ♭VII as passing |
| **Aeolian cadence** | ♭VI–♭VII–i (or ♭VI–♭VII–I Picardy) | Goal-oriented |
| **Lament** | i–♭VII–♭VI–V (or v) | Descending minor tetrachord |
| **Circle-of-fifths** | i–iv–VII–III | Root motion by fifth; modulation to relative major |

### 3.4 Mediant & Classical Schemas

| Schema | Progression | Notes |
|--------|-------------|-------|
| **Puff** | I–iii–IV | Mediant launches phrase; variant I–III♯–IV (deceptive V/vi) |

---

## 4. Mariachi & Ad-Hoc Ensembles

*"Mechanical Toil" adaptations for missing instrumentation. Sources: Gigging-musician transcripts (All_Transcripts_Anonymized), thematic analysis.*

### 4.1 Harmonic Foundation

| Term | Rule |
|------|------|
| **Basic progressions** | I–V, I–IV–V; melodies in major/minor |
| **Trumpet harmony** | Thirds or sixths between two trumpets |
| **Violin/trumpet texture** | Combined for harmonic enrichment |

### 4.2 Rhythmic Structure

| Term | Rule |
|------|------|
| **Time signatures** | 4/4, 3/4, 6/8 |
| **Sesquialtera** | Alternating 6/8 + 3/4 (son jalisciense) |
| **Rancheras** | 2/4 (polka), 3/4 (valseada), 4/4 (lenta, romántica) |
| **Sones** | 3/4 ↔ 6/8 with syncopation |

### 4.3 Part Creation & Instrument Roles

| Role | Function |
|------|----------|
| **Rhythm section** | Guitars arpeggiate; guitarrón anchors root-fifth |
| **Vihuela** | Higher harmony (*armonía*) |
| **Melody** | Violins primary; trumpets support |
| **Harmonic gap filling** | When viola/violin missing: generate secondary part from melody |
| **Doubling & transposition** | Vocal lines or brass transposed to fill texture |

### 4.4 Thematic Codes (from Transcripts)

| Term | Definition |
|------|------------|
| **Arrangement tax** | Manual composition of missing parts; "time-sink" from performer to arranger |
| **Transposition fatigue** | Cognitive tax of reading unfamiliar clefs; "reading a different language" |
| **Ear-based gap filling** | Improvising parts by ear; trial-and-error vocal harmonies; keyboard riffs on guitar |
| **Sonic thinness** | Arrangement sounds weak when supporting harmonies missing |

---

## 5. Post-Tonal & Set Theory

*Functional rules suspended. Sources: Open Music Theory.*

### 5.1 Pitch-Class Set Theory

| Term | Definition |
|------|-------------|
| **Pitch-class set** | Group of pitch classes as structural unit; criteria: rhythmic profile, contiguity, metric placement |
| **Normal order** | Most compressed ascending arrangement; "root position" of set |
| **Prime form** | Set class label; transposed to start on 0, packed left; compared to inversion |
| **Transposition** | Tₙ: add n to each integer mod 12; preserves intervallic content |
| **Inversion** | Iₙ: invert then transpose by n; (n − x) mod 12 |

### 5.2 Serialism

| Term | Definition |
|------|-------------|
| **Twelve-tone row** | Fixed ordering of all 12 pitch classes; foundation for piece |
| **Serialism** | Systematic ordering of elements (pitch, duration, dynamics, articulation); not limited to twelve-tone |
| **Integral serialism** | Serial techniques applied to non-pitch parameters |

---

## Source Attribution (HFLitReview)

| Source | Content |
|--------|---------|
| Counterpoint, Fux (Alfred Mann) | Parallels, hidden fifths, clausula vera, doubling |
| Aldwell & Schachter, Harmony & Voice Leading | Voice-leading rules, doubling, cadences, overlap |
| Pankhurst, SchenkerGUIDE | Ursatz, prolongation, structural levels |
| Open Music Theory | Chord-scale theory, jazz, pop schemas, set theory |
| HarmonySolver (Dajda et al.) | Algorithmic constraints |
