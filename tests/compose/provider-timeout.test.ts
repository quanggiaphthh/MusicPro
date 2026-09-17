import { runWithProviderTimeout } from '../../server/music/provider-timeout.ts';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

let calls = 0;
const started = Date.now();
let caught: any;
try {
  await runWithProviderTimeout(async () => {
    calls += 1;
    return await new Promise<string>(() => undefined);
  }, 25, 'lead-sheet');
} catch (error) {
  caught = error;
}
const elapsed = Date.now() - started;

assert(caught?.code === 'GENERATION_TIMEOUT', 'provider wait must end with GENERATION_TIMEOUT');
assert(caught?.stage === 'lead-sheet', 'timeout error must retain stage');
assert(elapsed < 500, `provider timeout must be bounded in tests, got ${elapsed}ms`);
assert(calls === 1, 'timeout wrapper must execute provider exactly once');

console.log('PASS provider-timeout');

{
  const controller = new AbortController();
  let abortCalls = 0;
  const startedAbort = Date.now();
  const promise = runWithProviderTimeout(async () => {
    abortCalls += 1;
    return await new Promise<string>(() => undefined);
  }, 5_000, 'lead-sheet', controller.signal);
  setTimeout(() => controller.abort(), 20);
  let abortError: any;
  try { await promise; } catch (error) { abortError = error; }
  assert(abortError?.name === 'AbortError', 'explicit cancel signal must interrupt provider wait');
  assert(Date.now() - startedAbort < 500, 'explicit cancel must not wait for provider timeout');
  assert(abortCalls === 1, 'cancelled provider operation must not restart generation');
}
