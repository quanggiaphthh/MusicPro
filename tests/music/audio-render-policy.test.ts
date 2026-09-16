import { renderWithAudioFallback } from '../../src/audio/render-policy.ts';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

console.log('--- Audio render policy tests ---');
let preferredCalls = 0;
let basicCalls = 0;
const preferred = async () => { preferredCalls += 1; return 'soundfont'; };
const basic = async () => { basicCalls += 1; return 'basic'; };

let result = await renderWithAudioFallback('auto', preferred, basic);
assert(result.value === 'soundfont' && result.renderer === 'soundfont', 'auto must prefer SoundFont');
assert(preferredCalls === 1 && basicCalls === 0, 'fallback must not run on SoundFont success');

preferredCalls = 0; basicCalls = 0;
result = await renderWithAudioFallback('auto', async () => { preferredCalls += 1; throw new Error('offline'); }, basic);
assert(result.value === 'basic' && result.renderer === 'basic', 'auto must fall back to basic renderer');
assert(preferredCalls === 1 && basicCalls === 1, 'both renderers must be attempted on fallback');

preferredCalls = 0; basicCalls = 0;
result = await renderWithAudioFallback('basic', preferred, basic);
assert(result.renderer === 'basic' && preferredCalls === 0 && basicCalls === 1, 'basic mode must skip SoundFont');

let threw = false;
try {
  await renderWithAudioFallback('soundfont', async () => { throw new Error('soundfont unavailable'); }, basic);
} catch (error) {
  threw = error instanceof Error && error.message === 'soundfont unavailable';
}
assert(threw, 'soundfont mode must surface renderer errors without fallback');
console.log('🚀 AUDIO RENDER POLICY TESTS PASSED');
