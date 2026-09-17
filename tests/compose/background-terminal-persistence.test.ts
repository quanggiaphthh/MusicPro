import { shouldClearBackgroundRunSession, type BackgroundRunSnapshot } from '../../src/compose/background-auto-compose.ts';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

const base: BackgroundRunSnapshot = {
  id:'run-1', input:{idea:'x',styleId:'STYLE.VN.VPOP-BALLAD'}, maxQualityRetries:1,
  status:'completed', createdAt:1, updatedAt:2, events:[], checkpoints:{
    leadArtifact:{step:3,xml:'<score-partwise/>',at:2},
  },
};

assert(shouldClearBackgroundRunSession(base, true) === true, 'successful terminal persistence should clear saved run session');
assert(shouldClearBackgroundRunSession(base, false) === false, 'failed persistence with recoverable artifact must retain run session for refresh recovery');
assert(shouldClearBackgroundRunSession({...base,status:'failed',checkpoints:{}}, false) === true, 'terminal failure without recoverable artifact may clear stale run session');
assert(shouldClearBackgroundRunSession({...base,status:'running'}, true) === false, 'active run must never clear its session');

console.log('PASS background-terminal-persistence');
