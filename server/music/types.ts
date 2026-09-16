export interface SongDNA {
  identity: {
    title?: string;
    sourceRunId?: string;
  };
  selectedMelodyPartId?: string;
  musical: {
    key?: string;
    mode?: string;
    tempoBpm?: number;
    tempoChanges?: Array<{ measure: number; bpm: number }>;
    timeSignature?: string;
    approximateDuration?: number;
    divisions?: number;
    timingConfidence?: 'high' | 'partial';
  };
  vocal: {
    lowestNote?: string;
    highestNote?: string;
    tessitura?: string;
  };
  structure: Array<{
    sectionName: string;
    measureStart: number;
    measureEnd: number;
    estimatedTiming?: number;
    repeatInfo?: string;
  }>;
  harmony: Array<{
    measure: number;
    section?: string;
    chordSymbols: string[];
  }>;
  melody: Array<{
    pitch: string;
    octave: number;
    midi: number;
    duration: number;
    beatPosition: number;
    measure: number;
  }>;
  lyrics: {
    syllables: string[];
    assembledLyric: string;
    sections?: Record<string, string>;
  };
  instrumentation: Array<{
    partId: string;
    partName?: string;
    midiProgram?: number;
  }>;
  fingerprint: MelodyFingerprint;
}

export interface MelodyFingerprint {
  openingMotif: string[];
  chorusMotif?: string[];
  pitchSequence: string[];
  midiSequence: number[];
  intervals: number[];
  contour: ("UP" | "DOWN" | "SAME")[];
  scaleDegrees?: number[];
  cadenceNotes: string[];
  highestNote?: string;
  lowestNote?: string;
  approximateRhythmicPattern: number[];
}

export interface ProductionBlueprint {
  identity: {
    title?: string;
    language?: string;
    genre?: string;
    mood?: string;
  };
  musical: {
    key?: string;
    mode?: string;
    tempo?: number;
    meter?: string;
    targetDuration?: number;
    vocalProfile?: string;
    vocalRange?: string;
  };
  structure: Array<{ name: string; start: number; end: number }>;
  harmony: Array<{ section: string; progression: string[] }>;
  melodyIdentity: {
    mainMotif: string;
    chorusHook?: string;
    cadences: string;
    contour: string;
    constraints: string;
    normalizedRhythm?: number[];
  };
  arrangement: {
    instruments: string[];
    roles: Record<string, string>;
    energyCurve?: string;
    productionDirection?: string;
  };
  lyrics: {
    exactLyrics: string;
    sections: Array<{ name: string; text: string }>;
  };
  fidelity: "high" | "balanced" | "creative";
}
