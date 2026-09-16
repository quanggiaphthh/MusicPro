import { workspaceTargetForStep } from '../../src/projects/composition-session';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
assert(workspaceTargetForStep(3, false) === 'lead', 'Step 3 edits the lead sheet');
assert(workspaceTargetForStep(3, true) === 'lead', 'Step 3 must still edit lead even when a final arrangement exists');
assert(workspaceTargetForStep(4, false) === 'lead', 'Step 4 without arrangement edits the lead');
assert(workspaceTargetForStep(4, true) === 'final', 'Step 4 with arrangement edits final score');
console.log('COMPOSITION SESSION TARGET TESTS PASSED');
