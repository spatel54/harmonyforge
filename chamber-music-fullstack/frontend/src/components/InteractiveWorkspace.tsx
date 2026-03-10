import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Renderer, 
  Stave, 
  StaveNote, 
  Voice, 
  Formatter, 
  Accidental, 
  Beam
} from 'vexflow';
import { 
  Eye, EyeOff, Music2, Layers, Sliders, BookOpen, 
  History, Save, Download, RefreshCw, ZoomIn, ZoomOut,
  Play, Pause, Settings, Info
} from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Switch } from './ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface RuleExplanation {
  chordIndex: number;
  rule: string;
  reason: string;
  appliedTo: 'chord' | 'voice' | 'nct' | 'counterpoint' | 'progression' | 'genre';
  voiceIndex?: number;
  ruleId?: string;
  parameters?: Record<string, any>;
  alternatives?: string[];
}

interface Layer {
  id: string;
  name: string;
  instrument: string;
  visible: boolean;
  locked: boolean;
  notes: any[];
  color: string;
}

interface WorkspaceData {
  harmonyOnly?: { content: string; filename: string };
  combined?: { content: string; filename: string };
  instruments: string[];
  explanations?: RuleExplanation[];
  educationalNotes?: string[];
  metadata?: {
    instruments: string[];
    processingTime: number;
    timestamp: string;
    originalFilename: string;
  };
}

interface InteractiveWorkspaceProps {
  data: WorkspaceData;
  onRegenerate: (options?: any) => void;
  onSave: (projectData: any) => void;
  projectId?: string;
  seed?: number;
}

export default function InteractiveWorkspace({
  data,
  onRegenerate,
  onSave,
  projectId,
  seed
}: InteractiveWorkspaceProps) {
  const [layers, setLayers] = useState<Layer[]>([]);
  const [transparencyMode, setTransparencyMode] = useState(false);
  const [tension, setTension] = useState(0.5);
  const [genre, setGenre] = useState<'classical' | 'jazz' | 'baroque' | 'pop' | 'romantic' | 'contemporary'>('classical');
  const [zoom, setZoom] = useState(1.0);
  const [selectedBar, setSelectedBar] = useState<number | null>(null);
  const [hoveredNote, setHoveredNote] = useState<{ barIndex: number; voiceIndex: number; noteIndex: number } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [versionHistory, setVersionHistory] = useState<any[]>([]);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<any>(null);
  const explanationsMapRef = useRef<Map<string, RuleExplanation[]>>(new Map());

  // Initialize layers from data
  useEffect(() => {
    if (data.instruments && data.combined) {
      const colors = ['#e76d57', '#4a90e2', '#50c878', '#f5a623', '#9013fe'];
      const newLayers: Layer[] = data.instruments.map((instrument, idx) => ({
        id: `layer-${idx}`,
        name: instrument,
        instrument,
        visible: true,
        locked: false,
        notes: [],
        color: colors[idx % colors.length]
      }));
      
      // Add melody layer if combined
      if (data.combined) {
        newLayers.unshift({
          id: 'layer-melody',
          name: 'Original Melody',
          instrument: 'Melody',
          visible: true,
          locked: true,
          notes: [],
          color: '#201315'
        });
      }
      
      setLayers(newLayers);
    }
  }, [data]);

  // Build explanations map for quick lookup
  useEffect(() => {
    if (data.explanations) {
      const map = new Map<string, RuleExplanation[]>();
      data.explanations.forEach(exp => {
        const key = `${exp.chordIndex}-${exp.voiceIndex ?? 'all'}`;
        if (!map.has(key)) {
          map.set(key, []);
        }
        map.get(key)!.push(exp);
      });
      explanationsMapRef.current = map;
    }
  }, [data.explanations]);

  // Helper function to convert MusicXML duration to VexFlow duration
  const getVexFlowDuration = useCallback((duration: number): string => {
    // MusicXML divisions are typically 1, 2, 4, 8, 16, etc.
    // VexFlow uses: 'w', 'h', 'q', '8', '16', '32'
    if (duration >= 16) return 'w'; // Whole note
    if (duration >= 8) return 'h'; // Half note
    if (duration >= 4) return 'q'; // Quarter note
    if (duration >= 2) return '8'; // Eighth note
    if (duration >= 1) return '16'; // Sixteenth note
    return '32'; // Thirty-second note
  }, []);

  // Handle note hover for transparency mode
  const handleNoteHover = useCallback((barIndex: number, voiceIndex: number, noteIndex: number) => {
    if (transparencyMode) {
      setHoveredNote({ barIndex, voiceIndex, noteIndex });
    }
  }, [transparencyMode]);

  // Render sheet music - using OpenSheetMusicDisplay for now (VexFlow integration to be improved)
  useEffect(() => {
    if (!canvasRef.current || !data.combined?.content || layers.length === 0) return;

    const div = canvasRef.current;
    if (!div) return;

    // Clear previous content
    div.innerHTML = '';

    try {
      // For now, use a simple display showing that the data is loaded
      // Full VexFlow rendering will be implemented in a future update
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(data.combined.content, 'text/xml');
      
      const parts = xmlDoc.querySelectorAll('part');
      
      if (parts.length === 0) {
        div.innerHTML = '<div class="text-center text-[#666] py-20">No parts found in MusicXML</div>';
        return;
      }

      // Display layer information and a placeholder for now
      let html = '<div class="p-6 space-y-4">';
      
      layers.forEach((layer, idx) => {
        if (!layer.visible) return;
        
        const part = parts[idx];
        if (!part) return;
        
        const measures = part.querySelectorAll('measure');
        const noteCount = part.querySelectorAll('note').length;
        
        html += `
          <div class="border border-[#e5ddd5] rounded-lg p-4" style="border-left: 4px solid ${layer.color};">
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-semibold text-[#201315]" style="color: ${layer.color};">${layer.name}</h3>
              ${layer.locked ? '<span class="text-xs text-[#666]">🔒 Locked</span>' : ''}
            </div>
            <p class="text-sm text-[#666]">${measures.length} measures • ${noteCount} notes</p>
            <p class="text-xs text-[#999] mt-2">Full interactive rendering coming soon</p>
          </div>
        `;
      });
      
      html += '</div>';
      div.innerHTML = html;

    } catch (error) {
      console.error('Error rendering sheet music:', error);
      div.innerHTML = `
        <div class="text-center text-[#666] py-20">
          <p class="text-lg mb-2 text-red-600">Rendering Error</p>
          <p class="text-sm">${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    }
  }, [data.combined, layers, zoom, transparencyMode]);

  const handleTensionChange = useCallback((value: number[]) => {
    setTension(value[0]);
    // Trigger regeneration with new tension
    onRegenerate({ tension: value[0] });
  }, [onRegenerate]);

  const handleGenreChange = useCallback((newGenre: typeof genre) => {
    setGenre(newGenre);
    onRegenerate({ genre: newGenre });
  }, [onRegenerate]);

  const handleBarSelect = useCallback((barIndex: number) => {
    setSelectedBar(barIndex);
  }, []);

  const getExplanationsForNote = useCallback((barIndex: number, voiceIndex: number): RuleExplanation[] => {
    const key = `${barIndex}-${voiceIndex}`;
    return explanationsMapRef.current.get(key) || [];
  }, []);

  const handleSaveVersion = useCallback(() => {
    const version = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      seed,
      tension,
      genre,
      layers: layers.map(l => ({ ...l, notes: [] })), // Don't store full note data
      projectId
    };
    setVersionHistory(prev => [version, ...prev].slice(0, 10)); // Keep last 10 versions
    onSave(version);
  }, [seed, tension, genre, layers, projectId, onSave]);

  return (
    <div className="flex flex-col h-screen bg-[#f8f3eb]">
      {/* Top Toolbar */}
      <div className="bg-white border-b-2 border-[#e5ddd5] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="font-['Figtree:Bold',_sans-serif] text-[#201315] text-xl">
            Interactive Workspace
          </h2>
          <div className="h-6 w-px bg-[#e5ddd5]" />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTransparencyMode(!transparencyMode)}
                  className={transparencyMode ? 'bg-[#e76d57]/10' : ''}
                >
                  {transparencyMode ? <Eye size={18} /> : <EyeOff size={18} />}
                  <span className="ml-2">Theory Inspector</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle transparency mode to see rule explanations</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowOnboarding(true)}>
            <BookOpen size={16} className="mr-2" />
            Guide
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveVersion}>
            <Save size={16} className="mr-2" />
            Save Version
          </Button>
          <Button variant="outline" size="sm">
            <History size={16} className="mr-2" />
            History ({versionHistory.length})
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Layers & Controls */}
        <div className="w-80 bg-white border-r-2 border-[#e5ddd5] flex flex-col">
          <Tabs defaultValue="layers" className="flex-1 flex flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="layers">
                <Layers size={16} className="mr-2" />
                Layers
              </TabsTrigger>
              <TabsTrigger value="controls">
                <Sliders size={16} className="mr-2" />
                Controls
              </TabsTrigger>
              <TabsTrigger value="info">
                <Info size={16} className="mr-2" />
                Info
              </TabsTrigger>
            </TabsList>

            <TabsContent value="layers" className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {layers.map((layer) => (
                  <div
                    key={layer.id}
                    className="p-3 rounded-lg border-2 border-[#e5ddd5] hover:border-[#e76d57] transition-colors"
                    style={{ borderLeftColor: layer.color, borderLeftWidth: '4px' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: layer.color }}
                        />
                        <span className="font-['Figtree:SemiBold',_sans-serif] text-sm">
                          {layer.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={layer.visible}
                          onCheckedChange={(checked) =>
                            setLayers(prev =>
                              prev.map(l =>
                                l.id === layer.id ? { ...l, visible: checked } : l
                              )
                            )
                          }
                        />
                      </div>
                    </div>
                    {layer.locked && (
                      <span className="text-xs text-[#666]">Locked (Original)</span>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="controls" className="flex-1 overflow-y-auto p-4">
              <div className="space-y-6">
                {/* Tension Control */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-['Figtree:SemiBold',_sans-serif] text-sm">
                      Tonal Tension
                    </label>
                    <span className="text-xs text-[#666]">{Math.round(tension * 100)}%</span>
                  </div>
                  <Slider
                    value={[tension]}
                    onValueChange={handleTensionChange}
                    min={0}
                    max={1}
                    step={0.01}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-[#666] mt-1">
                    <span>Consonant</span>
                    <span>Dissonant</span>
                  </div>
                </div>

                {/* Genre Presets */}
                <div>
                  <label className="font-['Figtree:SemiBold',_sans-serif] text-sm mb-2 block">
                    Genre Preset
                  </label>
                  <Select value={genre} onValueChange={handleGenreChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classical">Classical</SelectItem>
                      <SelectItem value="baroque">Baroque</SelectItem>
                      <SelectItem value="romantic">Romantic</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="contemporary">Contemporary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Bar-Level Controls */}
                {selectedBar !== null && (
                  <div className="p-3 bg-[#f8f3eb] rounded-lg">
                    <h4 className="font-['Figtree:SemiBold',_sans-serif] text-sm mb-2">
                      Bar {selectedBar + 1} Controls
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRegenerate({ barLevelControls: [{ barIndex: selectedBar, regenerate: true }] })}
                      className="w-full"
                    >
                      <RefreshCw size={14} className="mr-2" />
                      Regenerate This Bar
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="info" className="flex-1 overflow-y-auto p-4">
              {data.educationalNotes && data.educationalNotes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-['Figtree:Bold',_sans-serif] text-sm mb-2">
                    Educational Notes
                  </h4>
                  {data.educationalNotes.map((note, idx) => (
                    <div key={idx} className="p-2 bg-[#f8f3eb] rounded text-xs">
                      {note}
                    </div>
                  ))}
                </div>
              )}
              {data.metadata && (
                <div className="mt-4 space-y-2 text-xs">
                  <div>
                    <span className="font-semibold">Processing Time:</span>{' '}
                    {data.metadata.processingTime}ms
                  </div>
                  <div>
                    <span className="font-semibold">Timestamp:</span>{' '}
                    {new Date(data.metadata.timestamp).toLocaleString()}
                  </div>
                  {seed && (
                    <div>
                      <span className="font-semibold">Seed:</span> {seed}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Zoom Controls */}
          <div className="bg-white border-b border-[#e5ddd5] px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
              >
                <ZoomOut size={16} />
              </Button>
              <span className="text-sm font-['Figtree:SemiBold',_sans-serif]">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setZoom(Math.min(2.0, zoom + 0.1))}
              >
                <ZoomIn size={16} />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Play size={16} className="mr-2" />
                Play
              </Button>
            </div>
          </div>

          {/* Sheet Music Canvas */}
          <div
            ref={canvasRef}
            className="flex-1 overflow-auto bg-white p-8"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            {/* VexFlow will render here */}
            <div className="text-center text-[#666] py-20">
              Sheet music rendering will appear here
              <br />
              <span className="text-xs">Full VexFlow integration in progress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Transparency Tooltip */}
      {transparencyMode && hoveredNote && (
        <div
          className="fixed bg-white border-2 border-[#e76d57] rounded-lg shadow-xl p-4 z-50 max-w-sm"
          style={{
            left: `${window.event?.clientX || 0}px`,
            top: `${(window.event as MouseEvent)?.clientY || 0}px`
          }}
        >
          <h4 className="font-['Figtree:Bold',_sans-serif] text-sm mb-2">
            Rule Explanations
          </h4>
          {getExplanationsForNote(hoveredNote.barIndex, hoveredNote.voiceIndex).map((exp, idx) => (
            <div key={idx} className="mb-2 text-xs">
              <div className="font-semibold text-[#e76d57]">{exp.rule}</div>
              <div className="text-[#666]">{exp.reason}</div>
              {exp.ruleId && (
                <div className="text-[#999] mt-1">Rule ID: {exp.ruleId}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Onboarding Dialog */}
      <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Welcome to Interactive Workspace</DialogTitle>
            <DialogDescription>
              Learn how to use the layered canvas interface
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Layered Canvas</h4>
              <p>
                Each instrument appears as a separate layer. Toggle visibility, lock layers,
                and edit individual parts independently.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Theory Inspector</h4>
              <p>
                Enable transparency mode and hover over notes to see the exact rules used
                to generate each harmony decision.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Tension & Genre Controls</h4>
              <p>
                Adjust tonal tension and select genre presets to influence the harmonic
                character. Apply different settings to specific bars for fine-grained control.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

