import { createBackgroundRunRegistry } from '../../server/music/auto-production-runs.ts';
import type { AutoComposeEvent } from '../../src/compose/types.ts';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const sleep = (ms:number) => new Promise(resolve => setTimeout(resolve, ms));

const deps:any={prepareComposition:async()=>({}),generateLeadSheet:async()=>'',generateArrangement:async()=>'',analyze:async()=>({})};

{
  let release!:()=>void;
  const gate=new Promise<void>(resolve=>{release=resolve;});
  const registry=createBackgroundRunRegistry(deps,{
    maxEvents:3,
    terminalTtlMs:30,
    runner:async(_input:any,_deps:any,options:any)=>{
      await options.onEvent?.({kind:'step-summary',step:2,progress:23,label:'Bước 2 hoàn tất',context:{metaPlan:'m',composePrompt:'c',arrangePrompt:'a',composeDocRefs:[],arrangeDocRefs:[],planSummary:'p',songRequest:{}},at:Date.now()} satisfies AutoComposeEvent);
      await options.onEvent?.({kind:'artifact',step:3,progress:55,label:'Lead',xml:'<lead/>',songDna:{lead:true},blueprint:{lead:true},at:Date.now()} satisfies AutoComposeEvent);
      for(let i=0;i<5;i++) await options.onEvent?.({kind:'progress',step:3,progress:32,label:'waiting',detail:String(i),at:Date.now()} satisfies AutoComposeEvent);
      await gate;
      return {leadSheetXml:'<lead/>',finalXml:'<final/>',context:{metaPlan:'m',composePrompt:'c',arrangePrompt:'a',composeDocRefs:[],arrangeDocRefs:[],planSummary:'p',songRequest:{}},compositionQuality:{status:'PASS',score:90,checks:[],summary:'ok'},arrangementQuality:{status:'PASS',score:90,checks:[],summary:'ok'},readiness:{status:'PASS',label:'READY FOR PRODUCTION',score:90,summary:'ok',blockers:[],advisories:[]},songDna:{final:true},blueprint:{final:true},identityLock:{partId:'P1',changed:false,mode:'lead-part-and-score-part-exact'}};
    },
  });
  const created=registry.create({idea:'x',styleId:'STYLE.VN.VPOP-BALLAD'},{maxQualityRetries:1});
  assert(created.status==='queued'||created.status==='running','create must return active run immediately');
  await sleep(5);
  const running=registry.get(created.id)!;
  assert(running.status==='running','run must execute asynchronously under server ownership');
  assert(running.events.length<=3,'event history must be bounded');
  assert(running.checkpoints.context?.metaPlan==='m','Step 2 context checkpoint must be preserved outside compact events');
  assert(running.checkpoints.leadArtifact?.xml==='<lead/>','Step 3 Lead artifact checkpoint must be preserved');
  release();
  await sleep(5);
  const completed=registry.get(created.id)!;
  assert(completed.status==='completed','run must complete after runner resolves');
  assert(completed.result?.finalXml==='<final/>','terminal result must be recoverable');
  await sleep(40);
  assert(registry.get(created.id)===undefined,'terminal run must be evicted after TTL');
  registry.dispose();
}

{
  let observedAbort=false;
  const registry=createBackgroundRunRegistry(deps,{
    terminalTtlMs:100,
    runner:async(_input:any,_deps:any,options:any)=>new Promise((_resolve,reject)=>{
      options.signal?.addEventListener('abort',()=>{observedAbort=true; const err:any=new Error('Aborted'); err.name='AbortError'; reject(err);},{once:true});
    }),
  });
  const created=registry.create({idea:'cancel',styleId:'STYLE.VN.VPOP-BALLAD'});
  await sleep(2);
  const cancelled=registry.cancel(created.id);
  assert(cancelled?.status==='cancelled','explicit cancel must mark run cancelled');
  await sleep(2);
  assert(observedAbort,'explicit cancel must abort server runner');
  assert(registry.get(created.id)?.status==='cancelled','runner abort must not overwrite cancelled status');
  registry.dispose();
}

console.log('PASS background-run-registry');
