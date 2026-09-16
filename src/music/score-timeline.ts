export interface TempoEvent {
  quarter: number;
  bpm: number;
}

export interface TimeSignatureEvent {
  quarter: number;
  beats: number;
  beatType: number;
}

export interface MeasureStartEvent {
  measure: number;
  quarter: number;
}

export interface ScoreNoteEvent {
  id: string;
  partId: string;
  midi: number;
  startQuarter: number;
  durationQuarter: number;
  velocity: number;
  measure: number;
  voice: string;
  staff: string;
}

export interface ScorePartTimeline {
  partId: string;
  name: string;
  midiProgram?: number;
  isPercussion?: boolean;
  events: ScoreNoteEvent[];
}

export interface ScoreTimeline {
  title?: string;
  tempoMap: TempoEvent[];
  timeSignatures: TimeSignatureEvent[];
  measureStarts: MeasureStartEvent[];
  parts: ScorePartTimeline[];
  totalQuarters: number;
  totalDurationSeconds: number;
}

interface ParsedNoteEvent extends ScoreNoteEvent {
  tieStart?: boolean;
  tieStop?: boolean;
}

const DEFAULT_BPM = 120;
const DEFAULT_VELOCITY = 84;

function elementName(element: Element): string {
  return element.localName || element.tagName;
}

function directChildren(parent: Element, tagName: string): Element[] {
  return Array.from(parent.children).filter(child => elementName(child) === tagName);
}

function directChild(parent: Element, tagName: string): Element | undefined {
  return directChildren(parent, tagName)[0];
}

function textOf(parent: Element | undefined, tagName: string): string | undefined {
  if (!parent) return undefined;
  const child = directChild(parent, tagName);
  const value = child?.textContent?.trim();
  return value || undefined;
}

function numberOf(parent: Element | undefined, tagName: string): number | undefined {
  const value = textOf(parent, tagName);
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function measureNumberFromAttribute(value: string | null, ordinal: number): number {
  if (value === null || value.trim() === '') return ordinal;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : ordinal;
}

export function musicXmlMidi128ToMidi(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(127, Math.round(value) - 1));
}


export function dynamicsPercentToVelocity(value: string | null): number {
  if (value === null || value.trim() === '') return DEFAULT_VELOCITY;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_VELOCITY;
  return Math.max(1, Math.min(127, Math.round(parsed * 1.27)));
}

export function pitchToMidi(step: string, alter: number, octave: number): number {
  const semitoneByStep: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  const normalized = step.toUpperCase();
  const semitone = semitoneByStep[normalized];
  if (semitone === undefined || !Number.isFinite(octave)) {
    throw new Error(`Invalid pitch: ${step}${octave}`);
  }
  return Math.max(0, Math.min(127, (octave + 1) * 12 + semitone + alter));
}

export function resolveMeasureDurationQuarter(
  actualQuarter: number,
  beats: number,
  beatType: number,
  implicit: boolean,
): number {
  const actual = Math.max(0, actualQuarter);
  if (implicit) return actual;
  const expected = Math.max(0, beats) * (4 / Math.max(1, beatType));
  return Math.max(actual, expected);
}

export function metronomeToQuarterBpm(perMinute: number, beatUnit: string, dotCount = 0): number {
  const beatUnitQuarterFactor: Record<string, number> = {
    whole: 4,
    half: 2,
    quarter: 1,
    eighth: 0.5,
    '16th': 0.25,
    '32nd': 0.125,
  };
  let factor = beatUnitQuarterFactor[beatUnit] || 1;
  let dotFactor = 1;
  let addition = 0.5;
  for (let index = 0; index < Math.max(0, dotCount); index++) {
    dotFactor += addition;
    addition /= 2;
  }
  factor *= dotFactor;
  return perMinute * factor;
}

function parseTempoFromDirection(
  direction: Element,
  measureStartQuarter: number,
  cursorQuarter: number,
  divisions: number,
): TempoEvent[] {
  const events: TempoEvent[] = [];
  const offsetDivisions = numberOf(direction, 'offset') || 0;
  const quarter = measureStartQuarter + cursorQuarter + offsetDivisions / Math.max(1, divisions);

  for (const sound of directChildren(direction, 'sound')) {
    const raw = sound.getAttribute('tempo');
    const bpm = raw ? Number(raw) : NaN;
    if (Number.isFinite(bpm) && bpm > 0) events.push({ quarter, bpm });
  }

  for (const directionType of directChildren(direction, 'direction-type')) {
    for (const metronome of directChildren(directionType, 'metronome')) {
      const perMinute = numberOf(metronome, 'per-minute');
      const beatUnit = textOf(metronome, 'beat-unit') || 'quarter';
      if (!perMinute || perMinute <= 0) continue;
      const dotCount = directChildren(metronome, 'beat-unit-dot').length;
      events.push({ quarter, bpm: metronomeToQuarterBpm(perMinute, beatUnit, dotCount) });
    }
  }

  return events;
}

function mergeTempoEvents(events: TempoEvent[]): TempoEvent[] {
  const byQuarter = new Map<number, TempoEvent>();
  for (const event of events) {
    if (!Number.isFinite(event.quarter) || !Number.isFinite(event.bpm) || event.bpm <= 0) continue;
    const quarter = Math.max(0, Number(event.quarter.toFixed(6)));
    byQuarter.set(quarter, {
      quarter,
      bpm: event.bpm,
    });
  }
  const sorted = [...byQuarter.values()].sort((a, b) => a.quarter - b.quarter);
  if (sorted.length === 0 || sorted[0].quarter > 0) {
    sorted.unshift({ quarter: 0, bpm: DEFAULT_BPM });
  }
  return sorted;
}

function mergeTimeSignatures(events: TimeSignatureEvent[]): TimeSignatureEvent[] {
  const byQuarter = new Map<number, TimeSignatureEvent>();
  for (const event of events) {
    if (!Number.isFinite(event.quarter) || !Number.isFinite(event.beats) || !Number.isFinite(event.beatType)) continue;
    byQuarter.set(Number(event.quarter.toFixed(6)), {
      ...event,
      quarter: Number(event.quarter.toFixed(6)),
    });
  }
  const sorted = [...byQuarter.values()].sort((a, b) => a.quarter - b.quarter);
  if (sorted.length === 0 || sorted[0].quarter > 0) {
    sorted.unshift({ quarter: 0, beats: 4, beatType: 4 });
  }
  return sorted;
}

function mergeMeasureStarts(events: MeasureStartEvent[]): MeasureStartEvent[] {
  const byMeasure = new Map<number, number>();
  for (const event of events) {
    if (!Number.isFinite(event.measure) || !Number.isFinite(event.quarter)) continue;
    const previous = byMeasure.get(event.measure);
    if (previous === undefined || event.quarter < previous) byMeasure.set(event.measure, event.quarter);
  }
  return [...byMeasure.entries()]
    .map(([measure, quarter]) => ({ measure, quarter: Number(quarter.toFixed(6)) }))
    .sort((a, b) => a.quarter - b.quarter || a.measure - b.measure);
}

function mergeTiedEvents(events: ParsedNoteEvent[]): ScoreNoteEvent[] {
  const sorted = [...events].sort((a, b) => {
    if (a.startQuarter !== b.startQuarter) return a.startQuarter - b.startQuarter;
    return a.midi - b.midi;
  });
  const result: ScoreNoteEvent[] = [];
  const openTies = new Map<string, ScoreNoteEvent>();

  for (const event of sorted) {
    const key = `${event.voice}|${event.staff}|${event.midi}`;
    const pending = openTies.get(key);

    if (event.tieStop && pending) {
      const endQuarter = event.startQuarter + event.durationQuarter;
      pending.durationQuarter = Math.max(pending.durationQuarter, endQuarter - pending.startQuarter);
      if (!event.tieStart) openTies.delete(key);
      continue;
    }

    const cleanEvent: ScoreNoteEvent = {
      id: event.id,
      partId: event.partId,
      midi: event.midi,
      startQuarter: event.startQuarter,
      durationQuarter: event.durationQuarter,
      velocity: event.velocity,
      measure: event.measure,
      voice: event.voice,
      staff: event.staff,
    };
    result.push(cleanEvent);
    if (event.tieStart) openTies.set(key, cleanEvent);
  }

  return result.sort((a, b) => a.startQuarter - b.startQuarter || a.midi - b.midi);
}

interface PartPlaybackMeta {
  name: string;
  midiProgram?: number;
  isPercussion?: boolean;
  midiUnpitchedByInstrument: Map<string, number>;
}

function parsePartMeta(score: Element): Map<string, PartPlaybackMeta> {
  const result = new Map<string, PartPlaybackMeta>();
  const partList = directChild(score, 'part-list');
  if (!partList) return result;

  for (const scorePart of directChildren(partList, 'score-part')) {
    const id = scorePart.getAttribute('id') || '';
    if (!id) continue;
    const name = textOf(scorePart, 'part-name') || id;
    let midiProgram: number | undefined;
    let isPercussion = false;
    const midiUnpitchedByInstrument = new Map<string, number>();
    for (const midiInstrument of directChildren(scorePart, 'midi-instrument')) {
      const program = numberOf(midiInstrument, 'midi-program');
      if (midiProgram === undefined && program !== undefined) {
        midiProgram = Math.max(1, Math.min(128, Math.round(program)));
      }
      const channel = numberOf(midiInstrument, 'midi-channel');
      if (channel === 10) isPercussion = true;
      const unpitched = numberOf(midiInstrument, 'midi-unpitched');
      const instrumentId = midiInstrument.getAttribute('id');
      if (instrumentId && unpitched !== undefined) {
        // MusicXML stores MIDI 1.0 note numbers as 1..128; SMF uses 0..127.
        midiUnpitchedByInstrument.set(instrumentId, musicXmlMidi128ToMidi(unpitched));
        isPercussion = true;
      }
    }
    result.set(id, { name, midiProgram, isPercussion, midiUnpitchedByInstrument });
  }
  return result;
}

function parseTieTypes(note: Element): Set<string> {
  const types = new Set<string>();
  for (const tie of directChildren(note, 'tie')) {
    const type = tie.getAttribute('type');
    if (type) types.add(type);
  }
  const notations = directChild(note, 'notations');
  if (notations) {
    for (const tied of directChildren(notations, 'tied')) {
      const type = tied.getAttribute('type');
      if (type) types.add(type);
    }
  }
  return types;
}

export function parseMusicXMLToTimeline(xml: string): ScoreTimeline {
  if (typeof DOMParser === 'undefined') {
    throw new Error('MusicXML playback requires a browser DOMParser environment.');
  }

  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = document.getElementsByTagName('parsererror')[0] || document.getElementsByTagNameNS('*', 'parsererror')[0];
  if (parserError) throw new Error(`Invalid MusicXML: ${parserError.textContent || 'XML parse error'}`);

  const score = document.documentElement;
  if (!score || elementName(score) !== 'score-partwise') {
    throw new Error('Only MusicXML <score-partwise> is supported for playback.');
  }

  const work = directChild(score, 'work');
  const title = textOf(work, 'work-title') || textOf(score, 'movement-title');
  const partMeta = parsePartMeta(score);
  const tempoCandidates: TempoEvent[] = [];
  const timeCandidates: TimeSignatureEvent[] = [];
  const measureStartCandidates: MeasureStartEvent[] = [];
  const parts: ScorePartTimeline[] = [];
  let totalQuarters = 0;

  for (const part of directChildren(score, 'part')) {
    const partId = part.getAttribute('id') || `P${parts.length + 1}`;
    const meta = partMeta.get(partId) || {
      name: partId,
      midiUnpitchedByInstrument: new Map<string, number>(),
    };
    const parsedEvents: ParsedNoteEvent[] = [];
    let measureStartQuarter = 0;
    let divisions = 1;
    let beats = 4;
    let beatType = 4;
    let eventIndex = 0;
    let measureOrdinal = 0;
    let transposeSemitones = 0;
    let isPercussion = meta.isPercussion === true || /drum|percussion|kit|trống|bộ gõ/i.test(meta.name);

    for (const measure of directChildren(part, 'measure')) {
      measureOrdinal += 1;
      const measureNumber = measureNumberFromAttribute(measure.getAttribute('number'), measureOrdinal);
      measureStartCandidates.push({ measure: measureNumber, quarter: measureStartQuarter });
      let cursorQuarter = 0;
      let maxCursorQuarter = 0;
      const lastStartByVoiceStaff = new Map<string, number>();

      for (const child of Array.from(measure.children)) {
        const childName = elementName(child);
        if (childName === 'attributes') {
          const nextDivisions = numberOf(child, 'divisions');
          if (nextDivisions && nextDivisions > 0) divisions = nextDivisions;
          const time = directChild(child, 'time');
          if (time) {
            beats = numberOf(time, 'beats') || beats;
            beatType = numberOf(time, 'beat-type') || beatType;
            timeCandidates.push({ quarter: measureStartQuarter + cursorQuarter, beats, beatType });
          }
          const transpose = directChild(child, 'transpose');
          if (transpose) {
            const chromatic = numberOf(transpose, 'chromatic') || 0;
            const octaveChange = numberOf(transpose, 'octave-change') || 0;
            transposeSemitones = chromatic + octaveChange * 12;
          }
          continue;
        }

        if (childName === 'direction') {
          tempoCandidates.push(...parseTempoFromDirection(child, measureStartQuarter, cursorQuarter, divisions));
          continue;
        }

        if (childName === 'sound') {
          const raw = child.getAttribute('tempo');
          const bpm = raw ? Number(raw) : NaN;
          if (Number.isFinite(bpm) && bpm > 0) {
            tempoCandidates.push({ quarter: measureStartQuarter + cursorQuarter, bpm });
          }
          continue;
        }

        if (childName === 'backup') {
          const duration = numberOf(child, 'duration') || 0;
          cursorQuarter = Math.max(0, cursorQuarter - duration / Math.max(1, divisions));
          continue;
        }

        if (childName === 'forward') {
          const duration = numberOf(child, 'duration') || 0;
          cursorQuarter += duration / Math.max(1, divisions);
          maxCursorQuarter = Math.max(maxCursorQuarter, cursorQuarter);
          continue;
        }

        if (childName !== 'note') continue;

        const voice = textOf(child, 'voice') || '1';
        const staff = textOf(child, 'staff') || '1';
        const voiceStaff = `${voice}|${staff}`;
        const isChord = directChild(child, 'chord') !== undefined;
        const isGrace = directChild(child, 'grace') !== undefined;
        const rawDuration = numberOf(child, 'duration') || 0;
        const durationQuarter = isGrace ? 0.125 : rawDuration / Math.max(1, divisions);
        const noteStartInMeasure = isChord
          ? (lastStartByVoiceStaff.get(voiceStaff) ?? cursorQuarter)
          : cursorQuarter;

        if (!isChord) {
          lastStartByVoiceStaff.set(voiceStaff, noteStartInMeasure);
          if (!isGrace) cursorQuarter += durationQuarter;
        }
        if (!isGrace) {
          maxCursorQuarter = Math.max(maxCursorQuarter, cursorQuarter, noteStartInMeasure + durationQuarter);
        }

        const isRest = directChild(child, 'rest') !== undefined;
        if (isRest) continue;

        const pitch = directChild(child, 'pitch');
        const unpitched = directChild(child, 'unpitched');
        let midi: number | undefined;
        if (pitch) {
          const step = textOf(pitch, 'step');
          const octave = numberOf(pitch, 'octave');
          if (!step || octave === undefined) continue;
          const alter = numberOf(pitch, 'alter') || 0;
          midi = pitchToMidi(step, alter, octave) + transposeSemitones;
          midi = Math.max(0, Math.min(127, midi));
        } else if (unpitched) {
          isPercussion = true;
          const instrumentId = directChild(child, 'instrument')?.getAttribute('id') || undefined;
          const mappedMidi = instrumentId ? meta.midiUnpitchedByInstrument.get(instrumentId) : undefined;
          if (mappedMidi !== undefined) {
            midi = mappedMidi;
          } else {
            // Fallback keeps unpitched notes audible even when MusicXML omits playback mapping.
            const displayStep = textOf(unpitched, 'display-step') || 'C';
            const displayOctave = numberOf(unpitched, 'display-octave') ?? 2;
            midi = pitchToMidi(displayStep, 0, displayOctave);
          }
        }
        if (midi === undefined) continue;

        const velocity = dynamicsPercentToVelocity(child.getAttribute('dynamics'));
        const ties = parseTieTypes(child);

        parsedEvents.push({
          id: `${partId}-${measureNumber}-${eventIndex++}`,
          partId,
          midi,
          startQuarter: measureStartQuarter + noteStartInMeasure,
          durationQuarter: Math.max(0.03125, durationQuarter),
          velocity,
          measure: measureNumber,
          voice,
          staff,
          tieStart: ties.has('start'),
          tieStop: ties.has('stop'),
        });
      }

      const implicit = measure.getAttribute('implicit') === 'yes';
      const measureDuration = resolveMeasureDurationQuarter(maxCursorQuarter, beats, beatType, implicit);
      measureStartQuarter += measureDuration;
    }

    const events = mergeTiedEvents(parsedEvents);
    const partEnd = events.reduce(
      (max, event) => Math.max(max, event.startQuarter + event.durationQuarter),
      measureStartQuarter,
    );
    totalQuarters = Math.max(totalQuarters, partEnd);
    parts.push({ partId, name: meta.name, midiProgram: meta.midiProgram, isPercussion, events });
  }

  const tempoMap = mergeTempoEvents(tempoCandidates);
  const timeSignatures = mergeTimeSignatures(timeCandidates);
  const measureStarts = mergeMeasureStarts(measureStartCandidates);
  const totalDurationSeconds = quarterToSeconds(totalQuarters, tempoMap);

  return {
    title,
    tempoMap,
    timeSignatures,
    measureStarts,
    parts,
    totalQuarters,
    totalDurationSeconds,
  };
}

export function quarterToSeconds(quarter: number, tempoMap: TempoEvent[]): number {
  const target = Math.max(0, quarter);
  const tempos = mergeTempoEvents(tempoMap);
  let seconds = 0;
  let previousQuarter = 0;
  let bpm = tempos[0]?.bpm || DEFAULT_BPM;

  for (let index = 1; index < tempos.length; index++) {
    const change = tempos[index];
    if (change.quarter >= target) break;
    const segmentEnd = Math.max(previousQuarter, change.quarter);
    seconds += (segmentEnd - previousQuarter) * (60 / bpm);
    previousQuarter = segmentEnd;
    bpm = change.bpm;
  }

  seconds += (target - previousQuarter) * (60 / bpm);
  return Math.max(0, seconds);
}

export function secondsToQuarter(seconds: number, tempoMap: TempoEvent[]): number {
  let remaining = Math.max(0, seconds);
  const tempos = mergeTempoEvents(tempoMap);
  let quarter = 0;
  let bpm = tempos[0]?.bpm || DEFAULT_BPM;

  for (let index = 1; index < tempos.length; index++) {
    const change = tempos[index];
    const segmentQuarters = Math.max(0, change.quarter - quarter);
    const segmentSeconds = segmentQuarters * (60 / bpm);
    if (remaining <= segmentSeconds) return quarter + remaining / (60 / bpm);
    remaining -= segmentSeconds;
    quarter = change.quarter;
    bpm = change.bpm;
  }

  return quarter + remaining / (60 / bpm);
}

export function getCurrentMeasure(timeline: ScoreTimeline, seconds: number): number | undefined {
  if (timeline.measureStarts.length === 0) return undefined;
  const quarter = secondsToQuarter(seconds, timeline.tempoMap);
  let low = 0;
  let high = timeline.measureStarts.length - 1;
  let best = 0;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (timeline.measureStarts[middle].quarter <= quarter) {
      best = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return timeline.measureStarts[best]?.measure;
}
