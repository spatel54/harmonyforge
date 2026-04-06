import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Music2, BookOpen, Lightbulb } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface OnboardingStep {
  title: string;
  description: string;
  visual: React.ReactNode;
  concept?: string;
}

export default function VisualOnboarding({ 
  onComplete 
}: { 
  onComplete: () => void 
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  const steps: OnboardingStep[] = [
    {
      title: 'Understanding Keys and Scales',
      description: 'Every melody is built on a scale. The engine analyzes your melody to identify the key (like C major or A minor) and uses this foundation to generate harmonies.',
      visual: <CircleOfFifths />,
      concept: 'Circle of Fifths'
    },
    {
      title: 'Harmonic Functions',
      description: 'Chords serve different functions: Tonic (home), Predominant (preparation), and Dominant (tension). The engine creates progressions that follow these natural musical flows.',
      visual: <HarmonicFunctions />,
      concept: 'Tonic → Predominant → Dominant'
    },
    {
      title: 'Voice Leading',
      description: 'Smooth voice leading means each voice moves to the nearest note in the next chord. This creates natural, flowing harmonies instead of jarring jumps.',
      visual: <VoiceLeadingExample />,
      concept: 'Stepwise Motion'
    },
    {
      title: 'Tonal Tension',
      description: 'Tension controls how dissonant or consonant your harmonies are. Lower tension = smooth and pleasant. Higher tension = complex and adventurous.',
      visual: <TensionVisualization />,
      concept: 'Consonance ↔ Dissonance'
    },
    {
      title: 'Genre Rules',
      description: 'Different genres have different rules. Classical avoids parallel fifths, Jazz allows them. Baroque emphasizes counterpoint. The engine adapts to your chosen style.',
      visual: <GenreComparison />,
      concept: 'Style-Specific Rules'
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    onComplete();
  };

  const step = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-['Figtree:Bold',_sans-serif]">
                {step.title}
              </DialogTitle>
              <DialogDescription className="mt-2 text-base">
                {step.description}
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleComplete}
              className="absolute right-4 top-4"
            >
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-6">
          {/* Visual Component */}
          <div className="bg-gradient-to-br from-[#f8f3eb] to-white rounded-xl p-8 min-h-[400px] flex items-center justify-center border-2 border-[#e5ddd5]">
            {step.visual}
          </div>

          {/* Concept Badge */}
          {step.concept && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Lightbulb size={18} className="text-[#e76d57]" />
              <span className="font-['Figtree:SemiBold',_sans-serif] text-sm text-[#666]">
                {step.concept}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#e5ddd5]">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft size={16} className="mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === currentStep ? 'bg-[#e76d57]' : 'bg-[#e5ddd5]'
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            className="bg-gradient-to-r from-[#201315] to-[#e76d57]"
          >
            {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            <ChevronRight size={16} className="ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Visual Components

function CircleOfFifths() {
  const keys = ['C', 'G', 'D', 'A', 'E', 'B', 'F#', 'C#', 'G#', 'D#', 'A#', 'F'];
  const positions = [
    { angle: 0, x: 50, y: 10 },    // C
    { angle: 30, x: 75, y: 15 },   // G
    { angle: 60, x: 90, y: 30 },   // D
    { angle: 90, x: 95, y: 50 },   // A
    { angle: 120, x: 90, y: 70 },  // E
    { angle: 150, x: 75, y: 85 },  // B
    { angle: 180, x: 50, y: 90 },  // F#
    { angle: 210, x: 25, y: 85 },  // C#
    { angle: 240, x: 10, y: 70 }, // G#
    { angle: 270, x: 5, y: 50 },  // D#
    { angle: 300, x: 10, y: 30 }, // A#
    { angle: 330, x: 25, y: 15 }, // F
  ];

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-full max-w-md">
        <circle cx="100" cy="100" r="80" fill="none" stroke="#e5ddd5" strokeWidth="2" />
        {keys.map((key, idx) => {
          const pos = positions[idx];
          return (
            <g key={key}>
              <circle
                cx={pos.x * 2}
                cy={pos.y * 2}
                r="12"
                fill={key === 'C' ? '#e76d57' : '#fff'}
                stroke={key === 'C' ? '#e76d57' : '#201315'}
                strokeWidth="2"
                className="cursor-pointer hover:fill-[#e76d57]/20 transition-colors"
              />
              <text
                x={pos.x * 2}
                y={pos.y * 2 + 5}
                textAnchor="middle"
                className="text-xs font-bold fill-[#201315]"
              >
                {key}
              </text>
            </g>
          );
        })}
        <text x="100" y="195" textAnchor="middle" className="text-xs fill-[#666]">
          Circle of Fifths
        </text>
      </svg>
    </div>
  );
}

function HarmonicFunctions() {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-center gap-8">
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#e76d57] flex items-center justify-center text-white font-bold text-xl mb-2">
            I
          </div>
          <div className="text-sm font-semibold">Tonic</div>
          <div className="text-xs text-[#666]">Home</div>
        </div>
        <div className="text-2xl text-[#e5ddd5]">→</div>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#4a90e2] flex items-center justify-center text-white font-bold text-xl mb-2">
            IV
          </div>
          <div className="text-sm font-semibold">Predominant</div>
          <div className="text-xs text-[#666]">Preparation</div>
        </div>
        <div className="text-2xl text-[#e5ddd5]">→</div>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#f5a623] flex items-center justify-center text-white font-bold text-xl mb-2">
            V
          </div>
          <div className="text-sm font-semibold">Dominant</div>
          <div className="text-xs text-[#666]">Tension</div>
        </div>
        <div className="text-2xl text-[#e5ddd5]">→</div>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#e76d57] flex items-center justify-center text-white font-bold text-xl mb-2">
            I
          </div>
          <div className="text-sm font-semibold">Tonic</div>
          <div className="text-xs text-[#666]">Resolution</div>
        </div>
      </div>
      <div className="text-center text-sm text-[#666]">
        Natural harmonic flow creates musical satisfaction
      </div>
    </div>
  );
}

function VoiceLeadingExample() {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-center gap-4">
        <div className="text-center">
          <div className="text-xs text-[#666] mb-2">Chord 1</div>
          <div className="space-y-1">
            <div className="w-12 h-8 bg-[#e76d57] rounded text-white text-xs flex items-center justify-center">C</div>
            <div className="w-12 h-8 bg-[#4a90e2] rounded text-white text-xs flex items-center justify-center">E</div>
            <div className="w-12 h-8 bg-[#50c878] rounded text-white text-xs flex items-center justify-center">G</div>
          </div>
        </div>
        <div className="text-2xl text-[#e5ddd5]">→</div>
        <div className="text-center">
          <div className="text-xs text-[#666] mb-2">Chord 2</div>
          <div className="space-y-1">
            <div className="w-12 h-8 bg-[#e76d57] rounded text-white text-xs flex items-center justify-center">C</div>
            <div className="w-12 h-8 bg-[#4a90e2] rounded text-white text-xs flex items-center justify-center">F</div>
            <div className="w-12 h-8 bg-[#50c878] rounded text-white text-xs flex items-center justify-center">A</div>
          </div>
        </div>
      </div>
      <div className="text-center text-sm text-[#666]">
        Common tones stay, others move by step → smooth voice leading
      </div>
    </div>
  );
}

function TensionVisualization() {
  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-center gap-8">
        <div className="text-center">
          <div className="text-sm font-semibold mb-2">Low Tension</div>
          <div className="w-32 h-16 bg-gradient-to-r from-[#50c878] to-[#4a90e2] rounded-lg flex items-center justify-center text-white font-bold">
            Consonant
          </div>
          <div className="text-xs text-[#666] mt-2">Smooth, pleasant</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold mb-2">Medium Tension</div>
          <div className="w-32 h-16 bg-gradient-to-r from-[#4a90e2] to-[#f5a623] rounded-lg flex items-center justify-center text-white font-bold">
            Balanced
          </div>
          <div className="text-xs text-[#666] mt-2">Interesting, stable</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-semibold mb-2">High Tension</div>
          <div className="w-32 h-16 bg-gradient-to-r from-[#f5a623] to-[#e76d57] rounded-lg flex items-center justify-center text-white font-bold">
            Dissonant
          </div>
          <div className="text-xs text-[#666] mt-2">Complex, adventurous</div>
        </div>
      </div>
    </div>
  );
}

function GenreComparison() {
  const genres = [
    { name: 'Classical', rules: 'Strict voice leading', color: '#4a90e2' },
    { name: 'Jazz', rules: 'Parallel motion allowed', color: '#f5a623' },
    { name: 'Baroque', rules: 'Counterpoint required', color: '#50c878' },
    { name: 'Pop', rules: 'Free voice leading', color: '#e76d57' },
  ];

  return (
    <div className="w-full grid grid-cols-2 gap-4">
      {genres.map((genre) => (
        <div
          key={genre.name}
          className="p-4 rounded-lg border-2 border-[#e5ddd5]"
          style={{ borderLeftColor: genre.color, borderLeftWidth: '4px' }}
        >
          <div className="font-bold text-lg mb-1">{genre.name}</div>
          <div className="text-sm text-[#666]">{genre.rules}</div>
        </div>
      ))}
    </div>
  );
}

