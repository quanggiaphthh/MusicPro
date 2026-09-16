import { SongDNA, ProductionBlueprint } from './types';
import { buildEnergyCurve, buildInstrumentRoles } from './production-role-map';

export function buildProductionBlueprint(
  dna: SongDNA,
  options?: { genre?: string; mood?: string; style?: string; language?: string; lyrics?: string; arrangementNotes?: string; idea?: string }
): ProductionBlueprint {
  const harmonyBySection: Array<{section: string; progression: string[]}> = [];
  const getSectionForMeasure = (m: number) => {
    const sec = dna.structure.find(s => m >= s.measureStart && m <= s.measureEnd);
    return sec ? sec.sectionName : 'Toàn bài';
  };

  const progressionMap = new Map<string, string[]>();
  for (const h of dna.harmony) {
    const secName = getSectionForMeasure(h.measure);
    if (!progressionMap.has(secName)) progressionMap.set(secName, []);
    progressionMap.get(secName)!.push(...h.chordSymbols);
  }
  for (const [section, progression] of progressionMap.entries()) harmonyBySection.push({ section, progression });

  const structure = dna.structure.length > 0
    ? dna.structure.map(s => ({ name: s.sectionName, start: s.measureStart, end: s.measureEnd }))
    : [{ name: 'Toàn bài', start: 1, end: dna.melody.length ? dna.melody[dna.melody.length - 1].measure : 1 }];

  const exactLyrics = options?.lyrics || dna.lyrics.assembledLyric;
  const lyricsSections: Array<{name: string, text: string}> = [];
  if (exactLyrics) {
    const regex = /\[(.*?)\]\n?([^\[]*)/g;
    let match;
    while ((match = regex.exec(exactLyrics)) !== null) {
      const name = match[1].trim();
      const value = match[2].trim();
      if (name && value) lyricsSections.push({ name, text: value });
    }
  }

  const instruments = dna.instrumentation.map(i => i.partName || 'Unknown');
  const roles = buildInstrumentRoles(instruments);
  const energyCurve = buildEnergyCurve(structure);
  const productionDirection = [
    options?.arrangementNotes,
    'Preserve the master melodic identity, exact lyrics, harmonic intent, key/mode, meter and initial tempo unless explicitly delegated by the user.',
    'Build section-specific density and dynamics; avoid a whole-note-only accompaniment texture across sung sections.',
    `Energy curve: ${energyCurve}`,
  ].filter(Boolean).join('\n');

  return {
    identity: {
      title: dna.identity.title || 'Bản nhạc không tên',
      language: options?.language || 'vi',
      genre: options?.genre || options?.style || 'Pop',
      mood: options?.mood || 'Tự nhiên'
    },
    musical: {
      key: dna.musical.key,
      mode: dna.musical.mode,
      tempo: dna.musical.tempoBpm,
      meter: dna.musical.timeSignature,
      vocalRange: dna.vocal.lowestNote && dna.vocal.highestNote ? `${dna.vocal.lowestNote} - ${dna.vocal.highestNote}` : undefined,
      targetDuration: dna.musical.timingConfidence === 'partial' ? undefined : dna.musical.approximateDuration
    },
    structure,
    harmony: harmonyBySection.length > 0 ? harmonyBySection : [{ section: 'Toàn bài', progression: [] }],
    melodyIdentity: {
      mainMotif: dna.fingerprint.openingMotif.join(' '),
      chorusHook: dna.fingerprint.chorusMotif?.join(' '),
      cadences: dna.fingerprint.cadenceNotes.join(' '),
      contour: dna.fingerprint.contour.slice(0, 10).join(' '),
      constraints: 'Ưu tiên giữ nhận diện giai điệu, đặc biệt motif/hook đã cung cấp.',
      normalizedRhythm: dna.fingerprint.approximateRhythmicPattern.slice(0, 10)
    },
    arrangement: {
      instruments,
      roles,
      energyCurve,
      productionDirection,
    },
    lyrics: {
      exactLyrics,
      sections: lyricsSections
    },
    fidelity: 'high'
  };
}
