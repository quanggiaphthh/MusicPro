import fs from 'node:fs';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const view=fs.readFileSync('src/views/ComposeView.tsx','utf8');
const types=fs.readFileSync('src/compose/types.ts','utf8');
assert(view.includes('await persistBeforeNewRun()'),'new auto run must persist dirty current project before reset');
assert(view.includes("event.kind === 'artifact' && event.step === 4 && event.xml"),'step-4 artifact must be handled even when leadBundle persistence failed');
assert(!view.includes("event.kind === 'artifact' && event.step === 4 && event.xml && leadBundle"),'step-4 UI artifact must not depend on local leadBundle persistence');
assert(types.includes('context?: AutoCompositionContext'),'stream events must be able to checkpoint exact composition context');
assert(view.includes('event.context'),'ComposeView must consume streamed context checkpoint before final result');
console.log('PASS auto-recovery-policy');
