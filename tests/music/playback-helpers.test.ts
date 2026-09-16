import { normalizePlaybackStart } from '../../src/audio/playback-engine';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

console.log('--- Playback helper tests ---');
assert(normalizePlaybackStart(3, 10) === 3, 'mid-song playback offset must be preserved');
assert(normalizePlaybackStart(-1, 10) === 0, 'negative playback offset must clamp to zero');
assert(normalizePlaybackStart(10, 10) === 0, 'replay from exact end must restart at zero');
assert(normalizePlaybackStart(12, 10) === 0, 'replay beyond end must restart at zero');
console.log('🚀 PLAYBACK HELPER TESTS PASSED');
