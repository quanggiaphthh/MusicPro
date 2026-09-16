import fs from 'node:fs';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const pack=fs.readFileSync('src/export/project-package.ts','utf8');
assert(pack.includes("const evidencePrefix=certificationState==='STALE'?'production/stale-evidence':'production'"),'stale snapshot artifacts must be namespaced away from current production evidence');
assert(pack.includes('`${evidencePrefix}/song-dna.json`'),'SongDNA export must use certification-aware evidence namespace');
assert(pack.includes('`${evidencePrefix}/production-blueprint.json`'),'Blueprint export must use certification-aware evidence namespace');
console.log('PASS stale-package-evidence-policy');
