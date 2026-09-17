import fs from 'node:fs';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const view=fs.readFileSync('src/views/ComposeView.tsx','utf8');
const types=fs.readFileSync('src/compose/types.ts','utf8');
const registry=fs.readFileSync('server/music/auto-production-runs.ts','utf8');
assert(view.includes('await persistBeforeNewRun()'),'new auto run must persist dirty current project before reset');
assert(view.includes('snapshot.checkpoints.arrangementArtifact'),'step-4 artifact must be recoverable from server checkpoint even when browser was absent');
assert(view.includes('snapshot.checkpoints.leadArtifact'),'step-3 Lead artifact must be recoverable from server checkpoint');
assert(types.includes('context?: AutoCompositionContext'),'events must be able to carry exact composition context');
assert(registry.includes('record.checkpoints.context'),'server run registry must preserve exact composition context outside compact event history');
assert(view.includes('snapshot.result?.context || snapshot.checkpoints.context'),'ComposeView must recover exact context from result/checkpoint after refresh');
console.log('PASS auto-recovery-policy');
