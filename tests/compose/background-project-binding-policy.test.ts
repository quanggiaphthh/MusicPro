import fs from 'node:fs';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const source = fs.readFileSync('src/views/ComposeView.tsx','utf8');
assert(source.includes('activeBackgroundProjectIdRef'), 'background run must have its own project binding ref');
const start = source.indexOf('const persistBackgroundArtifacts');
const end = source.indexOf('const applyBackgroundSnapshot', start);
const block = source.slice(start, end);
assert(!block.includes('let bundle = projectBundle'), 'background persistence must not seed from generic projectBundle stale closure');
assert(block.includes('activeBackgroundProjectIdRef.current'), 'background persistence must resolve project from run-scoped project binding');
console.log('PASS background-project-binding-policy');
