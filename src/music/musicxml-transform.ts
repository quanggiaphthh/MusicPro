export interface SpelledPitch {
  step: string;
  alter: number;
  octave: number;
  midi: number;
}

const SHARP_NAMES = [
  ['C', 0], ['C', 1], ['D', 0], ['D', 1], ['E', 0], ['F', 0],
  ['F', 1], ['G', 0], ['G', 1], ['A', 0], ['A', 1], ['B', 0],
] as const;

const FLAT_NAMES = [
  ['C', 0], ['D', -1], ['D', 0], ['E', -1], ['E', 0], ['F', 0],
  ['G', -1], ['G', 0], ['A', -1], ['A', 0], ['B', -1], ['B', 0],
] as const;

const STEP_PC: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const MAJOR_FIFTHS_BY_PC: Record<number, number> = {
  0: 0, 1: -5, 2: 2, 3: -3, 4: 4, 5: -1, 6: 6, 7: 1, 8: -4, 9: 3, 10: -2, 11: 5,
};
const MINOR_FIFTHS_BY_PC: Record<number, number> = {
  0: -3, 1: 4, 2: -1, 3: 6, 4: 1, 5: -4, 6: 3, 7: -2, 8: 5, 9: 0, 10: -5, 11: 2,
};
const MAJOR_PC_BY_FIFTHS: Record<number, number> = {
  [-7]: 11, [-6]: 6, [-5]: 1, [-4]: 8, [-3]: 3, [-2]: 10, [-1]: 5,
  0: 0, 1: 7, 2: 2, 3: 9, 4: 4, 5: 11, 6: 6, 7: 1,
};
const MINOR_PC_BY_FIFTHS: Record<number, number> = {
  [-7]: 8, [-6]: 3, [-5]: 10, [-4]: 5, [-3]: 0, [-2]: 7, [-1]: 2,
  0: 9, 1: 4, 2: 11, 3: 6, 4: 1, 5: 8, 6: 3, 7: 10,
};

export function preferredFifthsForPitchClass(pitchClass: number, mode: string): number {
  const pc = ((Math.round(pitchClass) % 12) + 12) % 12;
  return (mode.toLowerCase() === 'minor' ? MINOR_FIFTHS_BY_PC : MAJOR_FIFTHS_BY_PC)[pc] ?? 0;
}

export function midiToSpelledPitch(midi: number, preferFlats = false): SpelledPitch {
  const safeMidi = Math.max(0, Math.min(127, Math.round(midi)));
  const pitchClass = ((safeMidi % 12) + 12) % 12;
  const octave = Math.floor(safeMidi / 12) - 1;
  const [step, alter] = (preferFlats ? FLAT_NAMES : SHARP_NAMES)[pitchClass];
  return { step, alter, octave, midi: safeMidi };
}

export function transposePitchValues(
  step: string,
  alter: number,
  octave: number,
  semitones: number,
  preferFlats = false,
): SpelledPitch {
  const pitchClass = STEP_PC[step.toUpperCase()];
  if (pitchClass === undefined) throw new Error(`Invalid pitch step: ${step}`);
  const midi = (octave + 1) * 12 + pitchClass + alter + semitones;
  return midiToSpelledPitch(midi, preferFlats);
}

function parseXml(xml: string): XMLDocument {
  if (typeof DOMParser === 'undefined') throw new Error('MusicXML editing requires a browser DOMParser environment.');
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = document.getElementsByTagName('parsererror')[0] || document.getElementsByTagNameNS('*', 'parsererror')[0];
  if (parserError) throw new Error(`Invalid MusicXML: ${parserError.textContent || 'XML parse error'}`);
  if (document.documentElement?.localName !== 'score-partwise') throw new Error('Only score-partwise MusicXML can be edited.');
  return document;
}

function serializeXml(document: XMLDocument): string {
  const body = new XMLSerializer().serializeToString(document);
  return body.startsWith('<?xml') ? body : `<?xml version="1.0" encoding="UTF-8"?>\n${body}`;
}

function directChild(parent: Element, tagName: string): Element | undefined {
  return Array.from(parent.children).find(child => (child.localName || child.tagName) === tagName);
}

function elementsByLocalName(root: Document | Element, tagName: string): Element[] {
  return Array.from(root.getElementsByTagNameNS('*', tagName));
}

function createElementForParent(document: XMLDocument, parent: Element, tagName: string): Element {
  const namespace = parent.namespaceURI;
  return namespace ? document.createElementNS(namespace, tagName) : document.createElement(tagName);
}

function setTextChild(document: XMLDocument, parent: Element, tagName: string, value: string): Element {
  let child = directChild(parent, tagName);
  if (!child) {
    child = createElementForParent(document, parent, tagName);
    parent.appendChild(child);
  }
  child.textContent = value;
  return child;
}

function pitchClass(step: string, alter: number): number {
  return ((STEP_PC[step.toUpperCase()] ?? 0) + alter + 12) % 12;
}

function transposePitchClass(
  step: string,
  alter: number,
  semitones: number,
  preferFlats: boolean,
): { step: string; alter: number } {
  const pc = (pitchClass(step, alter) + semitones + 120) % 12;
  const [nextStep, nextAlter] = (preferFlats ? FLAT_NAMES : SHARP_NAMES)[pc];
  return { step: nextStep, alter: nextAlter };
}

function tonicPitchClassFromFifths(fifths: number, mode: string): number {
  const clamped = Math.max(-7, Math.min(7, Math.round(fifths)));
  const map = mode.toLowerCase() === 'minor' ? MINOR_PC_BY_FIFTHS : MAJOR_PC_BY_FIFTHS;
  return map[clamped] ?? (mode.toLowerCase() === 'minor' ? 9 : 0);
}

export function transposeMusicXML(xml: string, semitones: number): string {
  const shift = Math.max(-12, Math.min(12, Math.round(semitones)));
  if (shift === 0) return xml;
  const document = parseXml(xml);

  const firstKey = elementsByLocalName(document, 'key')[0];
  const firstFifths = Number(directChild(firstKey, 'fifths')?.textContent || 0);
  const firstMode = (directChild(firstKey, 'mode')?.textContent || 'major').trim().toLowerCase();
  const firstTonicPc = tonicPitchClassFromFifths(firstFifths, firstMode);
  const targetFifths = preferredFifthsForPitchClass(firstTonicPc + shift, firstMode);
  const preferFlats = targetFifths < 0;

  for (const note of elementsByLocalName(document, 'note')) {
    const pitch = directChild(note, 'pitch');
    if (!pitch) continue;
    const stepElement = directChild(pitch, 'step');
    const octaveElement = directChild(pitch, 'octave');
    if (!stepElement || !octaveElement) continue;
    const step = stepElement.textContent?.trim() || 'C';
    const alterElement = directChild(pitch, 'alter');
    const alter = Number(alterElement?.textContent || 0);
    const octave = Number(octaveElement.textContent || 4);
    const next = transposePitchValues(step, alter, octave, shift, preferFlats);
    stepElement.textContent = next.step;
    octaveElement.textContent = String(next.octave);
    if (next.alter === 0) {
      alterElement?.remove();
    } else if (alterElement) {
      alterElement.textContent = String(next.alter);
    } else {
      // MusicXML pitch child order is step, alter, octave. Appending alter after
      // octave produces XML that is well-formed but schema-invalid.
      const createdAlter = createElementForParent(document, pitch, 'alter');
      createdAlter.textContent = String(next.alter);
      pitch.insertBefore(createdAlter, octaveElement);
    }

    // Explicit accidentals describe the old spelling. Remove them and let the
    // renderer infer the correct accidental from the new pitch + key signature.
    directChild(note, 'accidental')?.remove();
  }

  for (const harmony of elementsByLocalName(document, 'harmony')) {
    for (const pair of [
      ['root', 'root-step', 'root-alter'],
      ['bass', 'bass-step', 'bass-alter'],
    ] as const) {
      const container = directChild(harmony, pair[0]);
      if (!container) continue;
      const stepElement = directChild(container, pair[1]);
      if (!stepElement) continue;
      const alterElement = directChild(container, pair[2]);
      const next = transposePitchClass(
        stepElement.textContent?.trim() || 'C',
        Number(alterElement?.textContent || 0),
        shift,
        preferFlats,
      );
      stepElement.textContent = next.step;
      if (next.alter === 0) alterElement?.remove();
      else setTextChild(document, container, pair[2], String(next.alter));
    }
  }

  for (const key of elementsByLocalName(document, 'key')) {
    const fifthsElement = directChild(key, 'fifths');
    if (!fifthsElement) continue;
    const fifths = Number(fifthsElement.textContent || 0);
    const mode = (directChild(key, 'mode')?.textContent || 'major').trim().toLowerCase();
    const tonicPc = tonicPitchClassFromFifths(fifths, mode);
    const nextPc = (tonicPc + shift + 120) % 12;
    fifthsElement.textContent = String(preferredFifthsForPitchClass(nextPc, mode));
    directChild(key, 'cancel')?.remove();
  }

  return serializeXml(document);
}

export function setMusicXMLTempo(xml: string, bpm: number): string {
  const nextBpm = Math.max(30, Math.min(240, Math.round(bpm)));
  const document = parseXml(xml);
  let changed = false;

  for (const sound of elementsByLocalName(document, 'sound')) {
    if (!sound.hasAttribute('tempo')) continue;
    sound.setAttribute('tempo', String(nextBpm));
    changed = true;
  }

  for (const metronome of elementsByLocalName(document, 'metronome')) {
    // Normalize the visual metronome to the simple schema form
    // beat-unit + per-minute. Keeping stale metronome-note/relation children
    // alongside these values can produce schema-invalid MusicXML.
    while (metronome.firstChild) metronome.removeChild(metronome.firstChild);
    const beatUnit = createElementForParent(document, metronome, 'beat-unit');
    beatUnit.textContent = 'quarter';
    const perMinute = createElementForParent(document, metronome, 'per-minute');
    perMinute.textContent = String(nextBpm);
    metronome.append(beatUnit, perMinute);
    changed = true;
  }

  if (!changed) {
    const firstPart = elementsByLocalName(document, 'part')[0];
    const firstMeasure = firstPart ? Array.from(firstPart.children).find(child => (child.localName || child.tagName) === 'measure') : undefined;
    if (!firstMeasure) throw new Error('MusicXML does not contain a measure for tempo insertion.');
    const direction = createElementForParent(document, firstMeasure, 'direction');
    direction.setAttribute('placement', 'above');
    const directionType = createElementForParent(document, direction, 'direction-type');
    const metronome = createElementForParent(document, directionType, 'metronome');
    const beatUnit = createElementForParent(document, metronome, 'beat-unit');
    beatUnit.textContent = 'quarter';
    const perMinute = createElementForParent(document, metronome, 'per-minute');
    perMinute.textContent = String(nextBpm);
    metronome.append(beatUnit, perMinute);
    directionType.appendChild(metronome);
    const sound = createElementForParent(document, direction, 'sound');
    sound.setAttribute('tempo', String(nextBpm));
    direction.append(directionType, sound);
    const firstNote = Array.from(firstMeasure.children).find(child => (child.localName || child.tagName) === 'note');
    if (firstNote) firstMeasure.insertBefore(direction, firstNote);
    else firstMeasure.appendChild(direction);
  }

  return serializeXml(document);
}
