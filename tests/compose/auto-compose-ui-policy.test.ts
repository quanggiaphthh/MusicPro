import fs from 'node:fs';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const progress=fs.readFileSync('src/components/compose/AutoComposeProgress.tsx','utf8');
const compose=fs.readFileSync('src/views/ComposeView.tsx','utf8');
assert(progress.includes('Ước tính còn'), 'progress UI must show ETA');
assert(progress.includes('Đã chạy'), 'progress UI must show elapsed time');
assert(progress.includes('Bước 1')&&progress.includes('Bước 2')&&progress.includes('Bước 3')&&progress.includes('Bước 4'), 'must expose exactly four step labels');
assert(progress.includes('summary'), 'must render step summaries');
assert(compose.includes("'auto' | 'manual'"), 'ComposeView must expose auto/manual mode');
assert(compose.includes("useState<'auto' | 'manual'>('auto')"), 'auto mode must be default');
assert(compose.includes('Tạo bài hát'), 'single primary auto CTA');
assert(compose.includes('startBackgroundAutoComposition'), 'ComposeView must start the server-owned auto orchestrator');
assert(!compose.includes('runAutoCompositionStreamed'), 'ComposeView must not own the long-lived streamed generation request');
assert(!compose.includes('Bước 5'), 'must not invent Step 5');
console.log('PASS auto-compose-ui-policy');
