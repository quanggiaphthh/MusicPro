import fs from 'node:fs';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const source=fs.readFileSync('src/export/project-package.ts','utf8');
for(const token of ['MASTER.musicxml','LEAD-SHEET.musicxml','MASTER.mid','production/provenance.json','production/readiness.json'])assert(source.includes(token),`package source missing ${token}`);
for(const token of ['composition-quality.json','arrangement-quality.json','song-dna.json','production-blueprint.json','lyrics.txt','chord-chart.md'])assert(source.includes(token),`package evidence source missing ${token}`);
assert(source.includes("const evidencePrefix=certificationState==='STALE'?'production/stale-evidence':'production'"),'stale evidence must be separated from current production evidence');
assert(source.includes('identityLock:snapshot.identityLock'),'package provenance must include deterministic identity lock');
for(const token of ['evaluatedRevisionId','certifiedRevisionId','certificationState','certificationCurrent','evidencePrefix'])assert(source.includes(token),`package certification provenance missing ${token}`);
assert(source.includes("certificationState==='STALE'?'CERTIFICATION STALE':snapshot.readiness.status"),'stale certification must be distinguished from current FAIL/NOT_CERTIFIED');
assert(source.includes('SoundFont/reference audio is for preview'),'package README must not mislabel reference audio as commercial master');
console.log('PASS project-package-policy');
