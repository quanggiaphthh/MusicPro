import { createBackgroundRunRegistry } from '../../server/music/auto-production-runs.ts';
import { getBackgroundAutoComposition, readActiveBackgroundRunSession, startBackgroundAutoComposition } from '../../src/compose/background-auto-compose.ts';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
let runnerCalls=0;
const registry=createBackgroundRunRegistry({} as any,{terminalTtlMs:1000,runner:async()=>{runnerCalls+=1;await sleep(20);return {leadSheetXml:'<l/>',finalXml:'<f/>',context:{},compositionQuality:{status:'PASS'},arrangementQuality:{status:'PASS'},readiness:{status:'PASS'}} as any;}});
const memory=new Map<string,string>();
const storage:any={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)};
let serverCreatedId='';
const startFetch:any=async(_url:string,init:any)=>{
 const body=JSON.parse(String(init.body)); serverCreatedId=body.runId;
 registry.create({idea:body.idea,styleId:body.styleId},{runId:body.runId,maxQualityRetries:body.maxQualityRetries});
 throw new TypeError('socket reset after server accepted request');
};
let error:any; try{await startBackgroundAutoComposition({idea:'x',styleId:'STYLE.VN.VPOP-BALLAD'},{fetchImpl:startFetch,storage});}catch(e){error=e;}
assert(error instanceof Error,'ambiguous start must surface transport error to caller');
const session=readActiveBackgroundRunSession(storage);
assert(session?.runId===serverCreatedId,'ambiguous POST must retain client-generated runId for recovery');
const getFetch:any=async(url:string)=>{
 const id=decodeURIComponent(url.split('/').pop()); const snap=registry.get(id);
 return new Response(JSON.stringify(snap||{error:{code:'RUN_SESSION_LOST',message:'gone'}}),{status:snap?200:404,headers:{'Content-Type':'application/json'}});
};
const recovered=await getBackgroundAutoComposition(session!.runId,{fetchImpl:getFetch});
assert(recovered.id===serverCreatedId,'client must recover server-created run after ambiguous POST response');
assert(runnerCalls===1,'ambiguous start recovery must not launch a duplicate generation');
registry.dispose();
console.log('PASS background-ambiguous-start-recovery');
