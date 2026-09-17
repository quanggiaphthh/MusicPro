import { createBackgroundRunRegistry } from '../../server/music/auto-production-runs.ts';
import { startBackgroundAutoComposition, readActiveBackgroundRunId } from '../../src/compose/background-auto-compose.ts';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

let runnerCalls = 0;
let release!: () => void;
const blocked = new Promise<void>(resolve => { release = resolve; });
const registry = createBackgroundRunRegistry({} as any, {
  terminalTtlMs: 1000,
  runner: async (input:any) => {
    runnerCalls += 1;
    await blocked;
    return { context:{}, leadSheetXml:'<lead/>', finalXml:'<final/>', compositionQuality:{status:'PASS'}, arrangementQuality:{status:'PASS'}, readiness:{status:'PASS'} } as any;
  },
});

const requestedId = 'compose-run-idempotency-12345678';
const first = registry.create({ idea:'same', styleId:'STYLE.VN.VPOP-BALLAD' }, { runId: requestedId } as any);
const second = registry.create({ idea:'same', styleId:'STYLE.VN.VPOP-BALLAD' }, { runId: requestedId } as any);
await new Promise(resolve => setTimeout(resolve, 0));
assert(first.id === requestedId && second.id === requestedId, 'registry must honor a valid client-generated run id');
assert(runnerCalls === 1, `same run id must be idempotent, runner calls=${runnerCalls}`);
release();
registry.dispose();

const memory = new Map<string,string>();
const storage:any = { getItem:(k:string)=>memory.get(k)??null, setItem:(k:string,v:string)=>memory.set(k,v), removeItem:(k:string)=>memory.delete(k) };
let postedRunId = '';
const fetchImpl:any = async (_url:string, init:any) => {
  postedRunId = JSON.parse(String(init.body)).runId;
  return new Response(JSON.stringify({ runId: postedRunId, status:'queued' }), { status:202, headers:{'Content-Type':'application/json'} });
};
const started = await startBackgroundAutoComposition({ idea:'x', styleId:'STYLE.VN.VPOP-BALLAD' }, { fetchImpl, storage } as any);
assert(Boolean(postedRunId), 'client must send a client-generated runId before server work starts');
assert(started.runId === postedRunId, 'server response must bind to the same runId');
assert(readActiveBackgroundRunId(storage) === postedRunId, 'runId must be persisted before/through start so refresh can recover an ambiguous POST');

console.log('PASS background-start-idempotency');
