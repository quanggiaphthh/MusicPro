import fs from 'node:fs';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const view=fs.readFileSync('src/views/ComposeView.tsx','utf8');
assert(view.includes('compactAutoEventForUi'),'ComposeView must compact streamed event payloads before React history storage');
assert(view.includes('xml: _xml')&&view.includes('songDna: _songDna')&&view.includes('blueprint: _blueprint')&&view.includes('context: _context'),'event compaction must strip large artifact/context payloads');
assert(view.includes('setAutoEvents(current => [...current, compactAutoEventForUi(event)])'),'event history must store compact event rather than raw payload');
console.log('PASS event-history-memory-policy');
