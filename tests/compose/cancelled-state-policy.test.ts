import fs from 'node:fs';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const types=fs.readFileSync('src/compose/types.ts','utf8');
const view=fs.readFileSync('src/views/ComposeView.tsx','utf8');
const progress=fs.readFileSync('src/components/compose/AutoComposeProgress.tsx','utf8');
assert(types.includes("'cancelled'"),'AutoComposeEvent must have a distinct cancelled state');
assert(view.includes("kind:'cancelled'")||view.includes("kind: 'cancelled'"),'Abort handling must append cancelled event');
assert(progress.includes("event.kind==='cancelled'")||progress.includes("event.kind === 'cancelled'"),'progress UI must recognize cancelled event');
assert(progress.includes('Đã dừng quy trình'),'progress UI must visibly distinguish user cancellation');
console.log('PASS cancelled-state-policy');
