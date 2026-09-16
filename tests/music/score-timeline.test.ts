import {
  measureNumberFromAttribute,
  metronomeToQuarterBpm,
  musicXmlMidi128ToMidi,
  dynamicsPercentToVelocity,
  pitchToMidi,
  quarterToSeconds,
  resolveMeasureDurationQuarter,
  secondsToQuarter,
} from '../../src/music/score-timeline';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

console.log('--- ScoreTimeline deterministic timing tests ---');

assert(pitchToMidi('C', 0, 4) === 60, 'C4 must map to MIDI 60');
assert(pitchToMidi('F', 1, 4) === 66, 'F#4 must map to MIDI 66');
assert(pitchToMidi('B', -1, 3) === 58, 'Bb3 must map to MIDI 58');
console.log('✅ pitchToMidi');

assert(measureNumberFromAttribute(null, 1) === 1, 'missing measure number must fall back to ordinal');
assert(measureNumberFromAttribute('', 2) === 2, 'empty measure number must fall back to ordinal');
assert(measureNumberFromAttribute('7', 2) === 7, 'numeric measure number must be preserved');
assert(measureNumberFromAttribute('X1', 3) === 3, 'non-numeric measure number must fall back to ordinal');
assert(musicXmlMidi128ToMidi(1) === 0, 'MusicXML MIDI 1 maps to MIDI 0');
assert(musicXmlMidi128ToMidi(36) === 35, 'MusicXML midi-unpitched 36 maps to MIDI note 35');
assert(musicXmlMidi128ToMidi(128) === 127, 'MusicXML MIDI 128 maps to MIDI 127');
assert(dynamicsPercentToVelocity(null) === 84, 'missing dynamics must use audible default velocity');
assert(dynamicsPercentToVelocity('') === 84, 'empty dynamics must use default velocity');
assert(dynamicsPercentToVelocity('100') === 127, '100 percent dynamics maps to MIDI maximum');
assert(dynamicsPercentToVelocity('not-a-number') === 84, 'invalid dynamics uses default velocity');
console.log('✅ MusicXML numbering and dynamics conversions');

const tempoMap = [
  { quarter: 0, bpm: 120 },
  { quarter: 4, bpm: 60 },
];
assert(Math.abs(quarterToSeconds(4, tempoMap) - 2) < 1e-9, '4 quarters at 120 BPM must be 2 seconds');
assert(Math.abs(quarterToSeconds(8, tempoMap) - 6) < 1e-9, 'tempo change integration must be correct');
assert(Math.abs(secondsToQuarter(6, tempoMap) - 8) < 1e-9, 'secondsToQuarter must invert tempo integration');
console.log('✅ tempo integration');

assert(resolveMeasureDurationQuarter(2, 4, 4, false) === 4, 'underfilled normal 4/4 measure must occupy 4 quarters');
assert(resolveMeasureDurationQuarter(2, 4, 4, true) === 2, 'implicit pickup measure must preserve written duration');
assert(resolveMeasureDurationQuarter(5, 4, 4, false) === 5, 'overfilled/cadenza measure must preserve actual duration');
console.log('✅ measure alignment');

assert(metronomeToQuarterBpm(60, 'quarter', 0) === 60, 'quarter=60 -> 60 quarter BPM');
assert(metronomeToQuarterBpm(60, 'half', 0) === 120, 'half=60 -> 120 quarter BPM');
assert(metronomeToQuarterBpm(60, 'quarter', 1) === 90, 'dotted quarter=60 -> 90 quarter BPM');
console.log('✅ metronome conversion');

console.log('🚀 SCORE TIMELINE PURE TESTS PASSED');
