import fs from 'node:fs';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const source=fs.readFileSync('src/views/ComposeView.tsx','utf8');
assert(source.includes("from '../compose/background-auto-compose'"),'ComposeView must use background run client');
assert(!source.includes('runAutoCompositionStreamed'),'Auto mode must no longer own a long-lived NDJSON generation request');
assert(!source.includes('autoAbortRef.current?.abort()'),'navigation/unmount must not abort the server run');
assert(source.includes('readActiveBackgroundRunSession'),'ComposeView must recover saved run session on mount');
assert(source.includes('getBackgroundAutoComposition'),'ComposeView must poll/recover server snapshot');
assert(source.includes('cancelBackgroundAutoComposition'),'Stop button must use explicit server cancel endpoint');
assert(source.includes('clearAutoPollTimer'),'navigation cleanup must stop polling timer only');
console.log('PASS background-compose-ui-policy');
