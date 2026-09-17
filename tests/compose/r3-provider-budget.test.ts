import assert from 'node:assert/strict';
import { createProviderDeadline, getProviderTimeoutMs, getR3StageCapMs } from '../../server/music/provider-timeout.ts';

const old=process.env.LEAD_SHEET_PROVIDER_TIMEOUT_MS;
delete process.env.LEAD_SHEET_PROVIDER_TIMEOUT_MS;
assert.equal(getProviderTimeoutMs('lead-sheet'),180_000,'r3 total Step 3 default budget');
assert.equal(getProviderTimeoutMs('arrangement'),300_000,'Step 4 timeout unchanged');
assert.equal(getR3StageCapMs('hook-forge'),60_000);
assert.equal(getR3StageCapMs('song-weave'),120_000);
assert.equal(getR3StageCapMs('song-patch'),60_000);

let now=1_000;
const deadline=createProviderDeadline(180_000,()=>now);
assert.equal(deadline.remainingMs(),180_000);
assert.equal(deadline.timeoutFor('hook-forge'),60_000);
now+=50_000;
assert.equal(deadline.remainingMs(),130_000);
assert.equal(deadline.timeoutFor('song-weave'),120_000);
now+=100_000;
assert.equal(deadline.remainingMs(),30_000);
assert.equal(deadline.timeoutFor('song-patch'),30_000);
now+=30_000;
assert.equal(deadline.remainingMs(),0);
assert.throws(()=>deadline.timeoutFor('hook-forge'),/STEP3_DEADLINE_EXCEEDED/);

if(old===undefined) delete process.env.LEAD_SHEET_PROVIDER_TIMEOUT_MS; else process.env.LEAD_SHEET_PROVIDER_TIMEOUT_MS=old;
console.log('r3-provider-budget.test.ts PASS');
