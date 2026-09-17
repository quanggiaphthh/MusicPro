import { emitGenerationTelemetry, withGenerationRunContext } from '../../server/music/generation-telemetry.ts';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

const captured: any[] = [];
await withGenerationRunContext('run-telemetry-1', async () => {
  const record = emitGenerationTelemetry({
    stage: 'lead-sheet', model: 'gemini-test', startedAt: 100, endedAt: 145,
    promptChars: 12000, responseChars: 90000, outcome: 'success',
  }, (_label, value) => captured.push(value));
  assert(record.runId === 'run-telemetry-1', 'telemetry must inherit background run id');
});
assert(captured.length === 1, 'telemetry must emit one structured record');
const serialized = JSON.stringify(captured[0]);
assert(serialized.includes('lead-sheet') && serialized.includes('durationMs'), 'telemetry must include stage and duration');
assert(serialized.includes('promptChars') && serialized.includes('responseChars'), 'telemetry must include sanitized size metrics');
for (const forbidden of ['prompt','musicXml','lyrics','apiKey','xml']) {
  assert(!Object.prototype.hasOwnProperty.call(captured[0], forbidden), `telemetry must not expose raw ${forbidden}`);
}
console.log('PASS generation-telemetry');

import { emitValidationFailureTelemetry } from '../../server/music/generation-telemetry.ts';
const validationCaptured:any[]=[];
const validationRecord = emitValidationFailureTelemetry({
  stage:'lead-sheet', model:'gemini-test', responseChars:88000,
  retryReason:'musicxml-validation', errorCode:'MUSICXML_INVALID',
}, (_label,value)=>validationCaptured.push(value));
assert(validationRecord.outcome==='validation-failed','validation telemetry must distinguish deterministic validation failure');
assert(validationRecord.retryReason==='musicxml-validation','validation telemetry must retain sanitized retry reason');
assert(validationRecord.responseChars===88000,'validation telemetry may retain response size only');
assert(validationCaptured.length===1,'validation telemetry must emit one structured record');


const r3Captured:any[]=[];
for (const stage of ['hook-forge','song-weave','song-patch'] as const) {
  const record=emitGenerationTelemetry({stage,model:'gemini-test',startedAt:1,endedAt:2,promptChars:10,responseChars:20,outcome:'success'},(_label,value)=>r3Captured.push(value));
  assert(record.stage===stage,`telemetry must accept r3 stage ${stage}`);
}
assert(r3Captured.length===3,'all r3 provider stages must be telemetry-safe');
