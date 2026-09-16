import { scoreTrackId } from '../../src/music/score-id';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

console.log('--- Score identity tests ---');
const prefix = '<score-partwise>' + 'x'.repeat(5000);
const a = `${prefix}A</score-partwise>`;
const b = `${prefix}B</score-partwise>`;
assert(scoreTrackId(a) !== scoreTrackId(b), 'track id must change when any MusicXML character changes');
assert(scoreTrackId(a) === scoreTrackId(a), 'track id must be deterministic');
console.log('🚀 SCORE ID TESTS PASSED');
