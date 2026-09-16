import fs from 'node:fs';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const handler=fs.readFileSync('server/music/auto-production-stream.ts','utf8');
const installer=fs.readFileSync('scripts/apply-auto-production-v1.4.1.mjs','utf8');
const view=fs.readFileSync('src/views/ComposeView.tsx','utf8');
for(const token of ['application/x-ndjson','X-Accel-Buffering','type:\'event\'','type:\'result\'','type:\'error\''])assert(handler.includes(token),`stream handler missing ${token}`);
assert(installer.includes('/api/compose/run-stream'),'installer must register one streamed orchestration endpoint');
assert(installer.includes('AUTO_PRODUCTION_V1_4_1'),'installer must be idempotent through stable v1.4.1 marker');
assert(view.includes('runAutoCompositionStreamed'),'ComposeView must prefer streamed automatic pipeline');
assert(!handler.includes('composer.ts'),'handler must not patch Composer Core directly');
console.log('PASS server-stream-policy');
