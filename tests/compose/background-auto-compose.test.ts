import {
  ACTIVE_BACKGROUND_RUN_KEY,
  cancelBackgroundAutoComposition,
  getBackgroundAutoComposition,
  readActiveBackgroundRunId,
  startBackgroundAutoComposition,
  writeActiveBackgroundRunId,
} from '../../src/compose/background-auto-compose.ts';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}

const calls:any[]=[];
let serverRunId='';
const fetchImpl:any=async(url:string,init?:RequestInit)=>{
  calls.push({url,init});
  if(url==='/api/compose/runs') { serverRunId=JSON.parse(String(init?.body||'{}')).runId; return new Response(JSON.stringify({runId:serverRunId,status:'queued'}),{status:202,headers:{'Content-Type':'application/json'}}); }
  if(url===`/api/compose/runs/${serverRunId}`) return new Response(JSON.stringify({id:serverRunId,status:'running',events:[],checkpoints:{},createdAt:1,updatedAt:2,input:{idea:'x',styleId:'s'},maxQualityRetries:1}),{status:200,headers:{'Content-Type':'application/json'}});
  if(url===`/api/compose/runs/${serverRunId}/cancel`) return new Response(JSON.stringify({id:serverRunId,status:'cancelled'}),{status:200,headers:{'Content-Type':'application/json'}});
  return new Response(JSON.stringify({error:{code:'RUN_SESSION_LOST',message:'gone'}}),{status:404,headers:{'Content-Type':'application/json'}});
};

const created=await startBackgroundAutoComposition({idea:' x ',styleId:'s'},{fetchImpl});
assert(created.runId===serverRunId&&serverRunId.startsWith('compose-run-'),'start must return the same client-generated run id acknowledged by server');
assert(calls.filter(c=>c.url==='/api/compose/runs').length===1,'start must POST exactly once');
const snapshot=await getBackgroundAutoComposition(created.runId,{fetchImpl});
assert(snapshot.status==='running','get must return recoverable snapshot');
await cancelBackgroundAutoComposition(created.runId,{fetchImpl});
assert(calls.some(c=>c.url===`/api/compose/runs/${created.runId}/cancel`),'cancel must call explicit cancel endpoint');
let lost:any; try{await getBackgroundAutoComposition('missing',{fetchImpl});}catch(e){lost=e;}
assert(lost?.code==='RUN_SESSION_LOST','404 must map to RUN_SESSION_LOST and never auto-start replacement');
assert(calls.filter(c=>c.url==='/api/compose/runs').length===1,'session loss must not create a replacement run');

const memory=new Map<string,string>();
const storage:any={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{memory.set(k,v);},removeItem:(k:string)=>{memory.delete(k);}};
writeActiveBackgroundRunId('run-7',storage);
assert(memory.get(ACTIVE_BACKGROUND_RUN_KEY)==='run-7','write must persist active run id');
assert(readActiveBackgroundRunId(storage)==='run-7','read must recover active run id');
writeActiveBackgroundRunId(undefined,storage);
assert(!memory.has(ACTIVE_BACKGROUND_RUN_KEY),'undefined must clear active run id');

const broken:any={getItem(){throw new Error('blocked');},setItem(){throw new Error('quota');},removeItem(){throw new Error('blocked');}};
writeActiveBackgroundRunId('run-x',broken);
assert(readActiveBackgroundRunId(broken)===undefined,'storage failures must be best-effort and non-fatal');

console.log('PASS background-auto-compose');
