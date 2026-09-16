import type { ScorePartTimeline } from './score-timeline';

function includesAny(value: string, patterns: RegExp[]): boolean {
  return patterns.some(pattern => pattern.test(value));
}

/**
 * Resolve a General MIDI program using MusicXML playback metadata first, then
 * a conservative name-based fallback for AI-generated scores that omit
 * <midi-program>. Return values follow MusicXML's 1..128 convention.
 */
export function resolveMidiProgram(part: Pick<ScorePartTimeline, 'name' | 'midiProgram'>): number {
  if (Number.isFinite(part.midiProgram)) {
    return Math.max(1, Math.min(128, Math.round(part.midiProgram as number)));
  }

  const name = (part.name || '').trim().toLowerCase();

  if (includesAny(name, [/violin/, /vĩ cầm/])) return 41;
  if (includesAny(name, [/viola/, /viola/])) return 42;
  if (includesAny(name, [/cello/, /violoncello/])) return 43;
  if (includesAny(name, [/contrabass/, /double bass/, /upright bass/])) return 44;
  if (includesAny(name, [/string ensemble/, /^strings?$/, /dàn dây/, /strings pad/])) return 49;
  if (includesAny(name, [/choir/, /choral/, /hợp xướng/])) return 53;
  if (includesAny(name, [/vocal/, /voice/, /singer/, /giọng hát/, /melody/])) return 54;

  if (includesAny(name, [/nylon.*guitar/, /guitar.*nylon/])) return 25;
  if (includesAny(name, [/acoustic guitar/, /steel.*guitar/, /guitar.*steel/, /guitar thùng/])) return 26;
  if (includesAny(name, [/clean.*guitar/, /electric guitar/, /guitar điện/])) return 28;
  if (includesAny(name, [/distort.*guitar/, /overdrive.*guitar/])) return 30;
  if (includesAny(name, [/electric bass/, /bass guitar/, /bass điện/])) return 34;
  if (includesAny(name, [/fretless bass/])) return 36;

  if (includesAny(name, [/grand piano/, /^piano$/, /piano acoustic/, /piano chính/])) return 1;
  if (includesAny(name, [/electric piano/, /e\.?piano/])) return 5;
  if (includesAny(name, [/organ/, /đàn organ/])) return 20;

  if (includesAny(name, [/trumpet/, /kèn trumpet/])) return 57;
  if (includesAny(name, [/trombone/])) return 58;
  if (includesAny(name, [/french horn/, /horn/])) return 61;
  if (includesAny(name, [/brass/, /kèn đồng/])) return 62;
  if (includesAny(name, [/alto sax/])) return 66;
  if (includesAny(name, [/tenor sax/])) return 67;
  if (includesAny(name, [/soprano sax/])) return 65;
  if (includesAny(name, [/clarinet/])) return 72;
  if (includesAny(name, [/flute/, /sáo/])) return 74;

  if (includesAny(name, [/synth pad/, /^pad$/, /ambient pad/])) return 89;
  if (includesAny(name, [/synth lead/, /^lead synth/])) return 81;

  return 1;
}
