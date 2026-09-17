import {
  readActiveBackgroundRunSession,
  writeActiveBackgroundRunId,
  writeActiveBackgroundRunProjectId,
} from '../../src/compose/background-auto-compose.ts';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const memory=new Map<string,string>();
const storage:any={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)};
writeActiveBackgroundRunId('run-9',storage);
let session=readActiveBackgroundRunSession(storage);
assert(session?.runId==='run-9','recovery session must retain runId');
writeActiveBackgroundRunProjectId('project-3',storage);
session=readActiveBackgroundRunSession(storage);
assert(session?.runId==='run-9'&&session.projectId==='project-3','project binding must survive refresh without a second project');
// Backward compatibility with an existing plain run-id value from v1.
memory.set('music-pro:auto-compose-active-run:v1','legacy-run');
session=readActiveBackgroundRunSession(storage);
assert(session?.runId==='legacy-run','plain v1 run id must remain recoverable');
console.log('PASS background-compose-recovery');
