import { resolveMidiProgram } from '../../src/music/instrument-program.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const part = (name: string, midiProgram?: number) => ({
  partId: 'P1',
  name,
  midiProgram,
  events: [],
});

console.log('--- Instrument program mapping tests ---');
assert(resolveMidiProgram(part('Piano')) === 1, 'Piano must map to Acoustic Grand Piano');
assert(resolveMidiProgram(part('Acoustic Guitar')) === 26, 'Acoustic Guitar must map to steel guitar');
assert(resolveMidiProgram(part('Electric Bass')) === 34, 'Electric Bass must map to fingered bass');
assert(resolveMidiProgram(part('Strings')) === 49, 'Strings must map to String Ensemble 1');
assert(resolveMidiProgram(part('Violin')) === 41, 'Violin must map to GM Violin');
assert(resolveMidiProgram(part('Cello')) === 43, 'Cello must map to GM Cello');
assert(resolveMidiProgram(part('Flute')) === 74, 'Flute must map to GM Flute');
assert(resolveMidiProgram(part('Vocal')) === 54, 'Vocal must map to Voice Oohs');
assert(resolveMidiProgram(part('Piano', 12)) === 12, 'Explicit MusicXML midi-program must win');
assert(resolveMidiProgram(part('Unknown Instrument')) === 1, 'Unknown instruments must fall back to piano');
console.log('🚀 INSTRUMENT PROGRAM TESTS PASSED');
