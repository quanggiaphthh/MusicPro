import assert from 'node:assert/strict';
import fs from 'node:fs';

const source=fs.readFileSync('server/music/composer.ts','utf8');
const leadStart=source.indexOf('export async function generateLeadSheet(');
const arrangeStart=source.indexOf('export async function generateArrangement(');
assert.ok(leadStart>=0 && arrangeStart>leadStart,'composer must expose Step 3 and Step 4 public APIs');
const lead=source.slice(leadStart,arrangeStart);
const arrangement=source.slice(arrangeStart);
assert.match(lead,/generateLeadSheetR3\s*\(/,'Step 3 must delegate to r3 pipeline');
for(const forbidden of [
  'FALLBACK_MODEL',
  'Create a Lead Sheet (melody, lyrics, chords) in MusicXML 4.0 format',
  'OUTPUT: Output ONLY the MusicXML code',
  'Regenerate the complete score',
]) assert.equal(lead.includes(forbidden),false,`Step 3 must not contain legacy direct/full-regeneration policy: ${forbidden}`);
assert.match(arrangement,/FALLBACK_MODEL/,'Step 4 fallback routing remains unchanged');
assert.match(arrangement,/Regenerate the complete score/,'Step 4 existing retry feedback remains unchanged');
console.log('r3-composer-routing-policy.test.ts PASS');
