import { midiProgramInsertionAnchor, preferredScoreInstrumentId, setMusicXMLTitle, setLyricsInMeasureRange, setPartMidiProgram } from '../../src/music/musicxml-edit';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
// Runtime DOM behavior is exercised in browser/AI Studio; this file also documents the contract for lint/build.
assert(typeof setMusicXMLTitle === 'function', 'title editor exported');
assert(typeof setLyricsInMeasureRange === 'function', 'lyric editor exported');
assert(typeof setPartMidiProgram === 'function', 'program editor exported');
assert(midiProgramInsertionAnchor(['midi-channel','volume','pan']) === 'volume', 'midi-program must precede volume/pan');
assert(midiProgramInsertionAnchor(['midi-channel','midi-bank','midi-unpitched']) === 'midi-unpitched', 'midi-program must precede midi-unpitched');
assert(midiProgramInsertionAnchor(['midi-channel']) === null, 'append when no later schema child exists');
assert(preferredScoreInstrumentId(['P1-I4'], 'P1') === 'P1-I4', 'reuse existing score-instrument id');
assert(preferredScoreInstrumentId([], 'P1') === 'P1-I1', 'create deterministic score-instrument id');
console.log('MUSICXML EDIT API TESTS PASSED');
