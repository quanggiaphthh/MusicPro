import { createBackgroundRunApiHandlers, createBackgroundRunRegistry } from '../../server/music/auto-production-runs.ts';
import { getBackgroundAutoComposition, readActiveBackgroundRunSession, startBackgroundAutoComposition } from '../../src/compose/background-auto-compose.ts';
import type { AutoComposeEvent } from '../../src/compose/types.ts';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));

let runnerCalls=0;
let release!:()=>void;
const gate=new Promise<void>(resolve=>{release=resolve;});
const deps:any={};
const registry=createBackgroundRunRegistry(deps,{
  terminalTtlMs:1000,
  runner:async(_input:any,_deps:any,options:any)=>{
    runnerCalls+=1;
    await options.onEvent?.({kind:'step-summary',step:2,progress:23,label:'Bước 2 hoàn tất',context:{metaPlan:'m',composePrompt:'c',arrangePrompt:'a',composeDocRefs:[],arrangeDocRefs:[],planSummary:'p',songRequest:{}},at:Date.now()} satisfies AutoComposeEvent);
    await options.onEvent?.({kind:'artifact',step:3,progress:55,label:'Lead',xml:'<lead/>',quality:{status:'PASS',score:90,checks:[],summary:'ok'},at:Date.now()} satisfies AutoComposeEvent);
    await gate;
    return {leadSheetXml:'<lead/>',finalXml:'<final/>',context:{metaPlan:'m',composePrompt:'c',arrangePrompt:'a',composeDocRefs:[],arrangeDocRefs:[],planSummary:'p',songRequest:{}},compositionQuality:{status:'PASS',score:90,checks:[],summary:'ok'},arrangementQuality:{status:'PASS',score:90,checks:[],summary:'ok'},readiness:{status:'PASS',label:'READY FOR PRODUCTION',score:90,summary:'ok',blockers:[],advisories:[]}} as any;
  },
});
const handlers=createBackgroundRunApiHandlers(registry);

function responseFromHandler(handler:(req:any,res:any)=>any,req:any):Promise<Response>{
  return new Promise(resolve=>{
    const res:any={statusCode:200,status(code:number){this.statusCode=code;return this;},json(value:any){resolve(new Response(JSON.stringify(value),{status:this.statusCode,headers:{'Content-Type':'application/json'}}));return this;}};
    handler(req,res);
  });
}
let createCalls=0;
const fetchImpl:any=async(url:string,init?:RequestInit)=>{
  if(url==='/api/compose/runs') { createCalls+=1; return responseFromHandler(handlers.create,{body:JSON.parse(String(init?.body||'{}')),params:{}}); }
  const cancel=url.match(/^\/api\/compose\/runs\/([^/]+)\/cancel$/);
  if(cancel)return responseFromHandler(handlers.cancel,{body:{},params:{runId:decodeURIComponent(cancel[1])}});
  const get=url.match(/^\/api\/compose\/runs\/([^/]+)$/);
  if(get)return responseFromHandler(handlers.get,{params:{runId:decodeURIComponent(get[1])}});
  return new Response('{}',{status:404});
};
const memory=new Map<string,string>();
const storage:any={getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>memory.set(k,v),removeItem:(k:string)=>memory.delete(k)};

const started=await startBackgroundAutoComposition({idea:'kỷ niệm học sinh',styleId:'STYLE.VN.VPOP-BALLAD'},{fetchImpl,storage});
await sleep(2);
const beforeRefresh=await getBackgroundAutoComposition(started.runId,{fetchImpl});
assert(beforeRefresh.status==='running','run must continue while client is attached');
assert(beforeRefresh.checkpoints.leadArtifact?.xml==='<lead/>','lead checkpoint must exist before refresh');

// Simulate route unmount / browser refresh: only localStorage survives on client; server registry stays alive.
const recoveredSession=readActiveBackgroundRunSession(storage);
assert(recoveredSession?.runId===started.runId,'refresh must recover the same runId from storage');
const afterRefresh=await getBackgroundAutoComposition(recoveredSession.runId,{fetchImpl});
assert(afterRefresh.status==='running','refresh must reconnect to the same active server run');
assert(runnerCalls===1&&createCalls===1,'refresh must not create a second generation');

release();
await sleep(5);
const completed=await getBackgroundAutoComposition(started.runId,{fetchImpl});
assert(completed.status==='completed','same run must complete after refresh/reconnect');
assert(completed.result?.finalXml==='<final/>','terminal final artifact must be recoverable after refresh');
assert(runnerCalls===1&&createCalls===1,'completion after refresh must still use one generation only');
registry.dispose();
console.log('PASS background-refresh-e2e');
