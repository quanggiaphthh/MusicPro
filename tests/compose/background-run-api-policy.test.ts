import fs from 'node:fs';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const source=fs.readFileSync('server.ts','utf8');
assert(source.includes('createBackgroundRunRegistry'),'server must create one background run registry');
assert(/app\.post\(["']\/api\/compose\/runs["']/.test(source),'server must register POST /api/compose/runs');
assert(/app\.get\(["']\/api\/compose\/runs\/:runId["']/.test(source),'server must register GET /api/compose/runs/:runId');
assert(/app\.post\(["']\/api\/compose\/runs\/:runId\/cancel["']/.test(source),'server must register explicit cancel endpoint');
assert(!source.includes("res.on?.('close',()=>background"),'background API must not tie lifecycle to response close');
console.log('PASS background-run-api-policy');
