import { createAutosaveController, shouldWarnBeforeUnload } from '../../src/projects/autosave';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

assert(shouldWarnBeforeUnload('dirty', false), 'explicit dirty UI state must warn even when autosave is disabled');
assert(shouldWarnBeforeUnload('saved', true), 'pending autosave controller state must warn');
assert(shouldWarnBeforeUnload('saving', false), 'in-flight manual save must still warn before unload');
assert(!shouldWarnBeforeUnload('saved', false), 'clean saved state must not warn');

async function main() {
let pending: (() => void) | null = null;
let saves: string[] = [];
const dirtyStates: boolean[] = [];
const savingStates: boolean[] = [];
const controller = createAutosaveController<string>({
  delayMs: 100,
  save: async value => { saves.push(value); },
  setTimer: fn => { pending = fn; return 1 as unknown as ReturnType<typeof setTimeout>; },
  clearTimer: () => { pending = null; },
  onDirtyChange: value => dirtyStates.push(value),
  onSavingChange: value => savingStates.push(value),
});
controller.schedule('a');
controller.schedule('b');
assert(controller.isDirty(), 'dirty after scheduling');
assert(dirtyStates.at(-1) === true, 'schedule must notify dirty state');
assert(pending !== null, 'timer scheduled');
const fire = pending as unknown as () => void;
fire();
await new Promise(resolve => setTimeout(resolve, 0));
assert(saves.length === 1 && saves[0] === 'b', 'debounce saves latest only');
assert(savingStates.includes(true) && savingStates.at(-1) === false, 'autosave must expose saving lifecycle');
controller.schedule('c');
await controller.flush();
assert(saves.at(-1) === 'c', 'flush saves latest snapshot');
assert(!controller.isDirty(), 'clean after flush');
assert(dirtyStates.at(-1) === false, 'successful flush must notify clean state');
controller.schedule('d');
controller.cancel();
assert(!controller.isDirty(), 'cancel clears dirty');

let autosaveError = '';
const failing = createAutosaveController<string>({
  delayMs: 0,
  save: async () => { throw new Error('disk full'); },
  setTimer: fn => { pending = fn; return 2 as unknown as ReturnType<typeof setTimeout>; },
  clearTimer: () => { pending = null; },
  onError: error => { autosaveError = (error as Error).message; },
});
failing.schedule('x');
let failed = false;
try { await failing.flush(); } catch { failed = true; }
assert(failed, 'flush must surface save failure');
assert(failing.isDirty(), 'failed autosave must remain dirty');
assert(autosaveError === 'disk full', 'autosave failure callback must receive the error');

console.log('AUTOSAVE TESTS PASSED');
}
void main();
