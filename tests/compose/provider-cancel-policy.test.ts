import fs from 'node:fs';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const source=fs.readFileSync('server/music/composer.ts','utf8');
assert(source.includes('generateCancelable'), 'composer must use a cancel-aware provider helper for Step 1/2');
const prepareStart=source.indexOf('export async function prepareComposition');
const leadStart=source.indexOf('export async function generateLeadSheet');
const prepare=source.slice(prepareStart,leadStart);
const count=(prepare.match(/generateCancelable\(/g)||[]).length;
assert(count>=2, `prepareComposition Step 1/2 must both use cancel-aware generation, got ${count}`);
assert(source.includes('getGenerationRunSignal()'), 'cancel-aware helper must read server-owned run AbortSignal');
console.log('PASS provider-cancel-policy');
