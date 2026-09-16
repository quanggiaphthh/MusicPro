import fs from 'node:fs';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const source=fs.readFileSync('src/compose/production-quality.ts','utf8');
assert(source.includes("return report(checks,'Composition Quality Gate',{minScore:80,maxWeak:2})"),'Composition gate threshold must align with readiness minimum 80');
assert(source.includes("return report(checks,'Arrangement Quality Gate',{minScore:84,maxWeak:2})"),'Arrangement gate threshold must align with readiness minimum 84');
console.log('PASS readiness-threshold-alignment');
