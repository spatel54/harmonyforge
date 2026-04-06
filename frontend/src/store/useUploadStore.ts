import { create } from "zustand";

const STORAGE_KEY = "harmonyforge-sandbox-state";

export type VoiceType = "soprano" | "alto" | "tenor" | "bass";

export interface UploadState {
  file: File | null;
  setFile: (file: File | null) => void;
  generatedMusicXML: string | null;
  setGeneratedMusicXML: (xml: string | null) => void;
  /** Server-built MusicXML for Document preview (PDF / MXL / MIDI after intake) */
  previewMusicXML: string | null;
  setPreviewMusicXML: (xml: string | null) => void;
  /** Source file name (for sandbox playback bar) */
  sourceFileName: string | null;
  setSourceFileName: (name: string | null) => void;
  /** Restore generatedMusicXML from sessionStorage. Returns true if restored. */
  restoreFromStorage: () => boolean;
}

function loadFromStorage(): { xml: string | null; sourceFileName: string | null } {
  if (typeof window === "undefined") return { xml: null, sourceFileName: null };
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { xml: null, sourceFileName: null };
    const data = JSON.parse(raw) as { xml?: string; sourceFileName?: string };
    return {
      xml: typeof data.xml === "string" ? data.xml : null,
      sourceFileName: typeof data.sourceFileName === "string" ? data.sourceFileName : null,
    };
  } catch {
    return { xml: null, sourceFileName: null };
  }
}

function saveToStorage(xml: string | null, sourceFileName: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (xml) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ xml, sourceFileName }));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore quota / privacy errors
  }
}

export const useUploadStore = create<UploadState>((set, get) => ({
  file: null,
  setFile: (file) =>
    set({
      file,
      sourceFileName: file ? file.name.replace(/\.[^/.]+$/, "") : null,
      previewMusicXML: null,
    }),
  generatedMusicXML: null,
  setGeneratedMusicXML: (xml) => {
    const sourceFileName = get().sourceFileName;
    saveToStorage(xml, sourceFileName);
    set({ generatedMusicXML: xml });
  },
  previewMusicXML: null,
  setPreviewMusicXML: (previewMusicXML) => set({ previewMusicXML }),
  sourceFileName: null,
  setSourceFileName: (name) => {
    set({ sourceFileName: name });
    const xml = get().generatedMusicXML;
    if (xml) saveToStorage(xml, name);
  },
  restoreFromStorage: () => {
    const { xml, sourceFileName } = loadFromStorage();
    if (xml) {
      set({ generatedMusicXML: xml, sourceFileName: sourceFileName ?? null });
      return true;
    }
    return false;
  },
}));
