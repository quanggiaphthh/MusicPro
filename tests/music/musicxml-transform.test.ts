import {
  midiToSpelledPitch,
  preferredFifthsForPitchClass,
  transposePitchValues,
} from '../../src/music/musicxml-transform';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

console.log('--- MusicXML transform pure pitch tests ---');

const c4 = midiToSpelledPitch(60);
assert(c4.step === 'C' && c4.alter === 0 && c4.octave === 4, 'MIDI 60 must spell C4');
const up = transposePitchValues('B', 0, 3, 1);
assert(up.step === 'C' && up.octave === 4, 'B3 + 1 semitone must become C4');
const downFlat = transposePitchValues('C', 0, 4, -1, true);
assert(downFlat.step === 'B' && downFlat.alter === 0 && downFlat.octave === 3, 'C4 - 1 semitone must become B3');
assert(preferredFifthsForPitchClass(1, 'major') === -5, 'Db major is preferred over C# major for pitch class 1');
assert(preferredFifthsForPitchClass(11, 'major') === 5, 'B major is preferred over Cb major for pitch class 11');
assert(preferredFifthsForPitchClass(5, 'minor') === -4, 'F minor must use four flats');
console.log('✅ pitch spelling and key signature selection');
console.log('🚀 MUSICXML TRANSFORM PURE TESTS PASSED');
