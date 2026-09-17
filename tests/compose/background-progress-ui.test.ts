import fs from 'node:fs';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

const ui = fs.readFileSync('src/components/compose/AutoComposeProgress.tsx','utf8');
const types = fs.readFileSync('src/compose/types.ts','utf8');
const orchestration = fs.readFileSync('src/compose/auto-compose.ts','utf8');

assert(types.includes('indeterminate?: boolean'), 'AutoComposeEvent must carry explicit indeterminate provider-wait state');
assert(orchestration.includes('indeterminate:true') || orchestration.includes('indeterminate: true'), 'provider heartbeat events must mark indeterminate=true');
assert(ui.includes('current?.indeterminate'), 'progress UI must render from explicit indeterminate state');
assert(ui.includes('server vẫn đang xử lý'), 'provider wait UI must explain server is still processing');
assert(ui.includes('cập nhật cuối'), 'provider wait UI must show last server update age');
assert(ui.includes('Mốc công đoạn'), 'numeric percentage must be described as a stage marker, not token completion');

console.log('PASS background-progress-ui');
