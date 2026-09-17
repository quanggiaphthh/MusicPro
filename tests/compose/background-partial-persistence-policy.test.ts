import fs from 'node:fs';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const source=fs.readFileSync('src/views/ComposeView.tsx','utf8');
const start=source.indexOf('const persistBackgroundArtifacts');
const end=source.indexOf('const applyBackgroundSnapshot',start);
const block=source.slice(start,end);
const createAt=block.indexOf('projectService.createFromComposition');
const bindAt=block.indexOf('activeBackgroundProjectIdRef.current = bundle.project.id');
const contextAt=block.indexOf('withCompositionContext');
assert(createAt>=0&&bindAt>createAt,'new background project must bind its id immediately after create');
assert(contextAt<0||bindAt<contextAt,'project binding must be persisted before optional context save can fail');
assert(block.includes('if (bundle && context)'), 'existing bound project must be able to retry composition-context persistence');
console.log('PASS background-partial-persistence-policy');
