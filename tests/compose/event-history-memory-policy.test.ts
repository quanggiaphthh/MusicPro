import fs from 'node:fs';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const view=fs.readFileSync('src/views/ComposeView.tsx','utf8');
const registry=fs.readFileSync('server/music/auto-production-runs.ts','utf8');
assert(view.includes('compactAutoEventForUi'),'ComposeView must compact recovered event payloads before React history storage');
assert(view.includes('xml: _xml')&&view.includes('songDna: _songDna')&&view.includes('blueprint: _blueprint')&&view.includes('context: _context'),'UI event compaction must strip large artifact/context payloads');
assert(view.includes('snapshot.events.map(compactAutoEventForUi)'),'recovered history must store compact events rather than raw payloads');
assert(registry.includes('record.events.push(compactEvent(event))'),'server registry must compact event history before retention');
assert(registry.includes('record.events.splice'),'server registry must bound retained event count');
console.log('PASS event-history-memory-policy');
