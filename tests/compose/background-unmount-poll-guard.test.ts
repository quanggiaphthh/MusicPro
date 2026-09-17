import fs from 'node:fs';
import assert from 'node:assert/strict';

const source = fs.readFileSync(new URL('../../src/views/ComposeView.tsx', import.meta.url), 'utf8');

assert.match(source, /autoPollActiveRef/, 'ComposeView should track whether the local polling owner is still mounted');
assert.match(source, /if \(!autoPollActiveRef\.current\) return;/, 'late poll responses must be ignored after unmount');
assert.match(source, /autoPollActiveRef\.current\s*=\s*false/, 'unmount cleanup must disable polling before clearing timers');

console.log('PASS background-unmount-poll-guard');
