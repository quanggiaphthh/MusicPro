import fs from 'node:fs';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const source=fs.readFileSync('server/music/composer.ts','utf8');
assert(source.includes("'prepare-step1'"), 'Step 1 provider call must emit sanitized telemetry stage prepare-step1');
assert(source.includes("'prepare-step2'"), 'Step 2 provider call must emit sanitized telemetry stage prepare-step2');
const telemetry=fs.readFileSync('server/music/generation-telemetry.ts','utf8');
assert(telemetry.includes("'prepare-step1'")&&telemetry.includes("'prepare-step2'"),'telemetry stage type must represent Step 1/2 provider calls');
console.log('PASS prepare-telemetry-policy');
