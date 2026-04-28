import { readPlaybackVolumeDb } from "@/hooks/useDestinationVolume";

/** Same remote Salamander map as riffscore `loadPianoSampler` after patch (Tone.js demo assets). */
const SALAMANDER_BASE_URL = "https://tonejs.github.io/audio/salamander/";

const SALAMANDER_FILES = [
  "A0.mp3",
  "C1.mp3",
  "Ds1.mp3",
  "Fs1.mp3",
  "A1.mp3",
  "C2.mp3",
  "Ds2.mp3",
  "Fs2.mp3",
  "A2.mp3",
  "C3.mp3",
  "Ds3.mp3",
  "Fs3.mp3",
  "A3.mp3",
  "C4.mp3",
  "Ds4.mp3",
  "Fs4.mp3",
  "A4.mp3",
  "C5.mp3",
  "Ds5.mp3",
  "Fs5.mp3",
  "A5.mp3",
  "C6.mp3",
  "Ds6.mp3",
  "Fs6.mp3",
  "A6.mp3",
  "C7.mp3",
  "Ds7.mp3",
  "Fs7.mp3",
  "A7.mp3",
  "C8.mp3",
] as const;

function salamanderNoteKeyFromFile(file: string): string {
  const base = file.slice(0, -4);
  if (base.startsWith("Ds")) return `D#${base.slice(2)}`;
  if (base.startsWith("Fs")) return `F#${base.slice(2)}`;
  return base;
}

function buildSalamanderUrls(): Record<string, string> {
  const urls: Record<string, string> = {};
  for (const f of SALAMANDER_FILES) {
    urls[salamanderNoteKeyFromFile(f)] = f;
  }
  return urls;
}

const SALAMANDER_URLS = buildSalamanderUrls();

let previewSamplerPromise: Promise<import("tone").Sampler> | null = null;

async function getSandboxPreviewSampler(): Promise<import("tone").Sampler> {
  if (previewSamplerPromise) return previewSamplerPromise;
  previewSamplerPromise = (async () => {
    const Tone = await import("tone");
    await Tone.start();
    const sampler = new Tone.Sampler({
      urls: SALAMANDER_URLS,
      baseUrl: SALAMANDER_BASE_URL,
    }).toDestination();
    await Tone.loaded();
    return sampler;
  })();
  return previewSamplerPromise;
}

/**
 * Short audition of one or more pitches after transpose (same Salamander piano as note clicks in RiffScore).
 * Fire-and-forget; safe if Tone fails or audio is locked.
 */
export function previewSandboxPitches(pitches: string[]): void {
  if (pitches.length === 0 || typeof window === "undefined") return;
  void (async () => {
    try {
      const Tone = await import("tone");
      await Tone.start();
      Tone.getDestination().volume.rampTo(readPlaybackVolumeDb(), 0.05);
      const sampler = await getSandboxPreviewSampler();
      const t = Tone.now() + 0.02;
      sampler.triggerAttackRelease(pitches, 0.2, t);
    } catch {
      /* ignore */
    }
  })();
}
