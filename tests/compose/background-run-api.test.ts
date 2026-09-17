import { createBackgroundRunApiHandlers } from '../../server/music/auto-production-runs.ts';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
function makeRes(){return {statusCode:200,body:undefined as any,status(code:number){this.statusCode=code;return this;},json(value:any){this.body=value;return this;}};}
const store=new Map<string,any>(); let cancels=0; const cancelCount=()=>cancels;
const registry:any={
 create(input:any,options:any){const snap={id:'run-1',input,maxQualityRetries:options.maxQualityRetries,status:'queued',createdAt:1,updatedAt:1,events:[],checkpoints:{}};store.set('run-1',snap);return snap;},
 get(id:string){return store.get(id);},
 cancel(id:string){cancels++;const snap=store.get(id);if(!snap)return undefined;snap.status='cancelled';return snap;},
};
const handlers=createBackgroundRunApiHandlers(registry);
{
 const req:any={body:{idea:'  quê hương  ',styleId:'STYLE.VN.VPOP-BALLAD',maxQualityRetries:1}}; const res:any=makeRes();
 handlers.create(req,res);
 assert(res.statusCode===202,'create must return 202 immediately');
 assert(res.body.runId==='run-1'&&res.body.status==='queued','create must return runId and status only');
}
{
 const req:any={params:{runId:'run-1'}}; const res:any=makeRes(); handlers.get(req,res);
 assert(res.statusCode===200&&res.body.id==='run-1','GET must return recoverable snapshot');
 assert(cancelCount()===0,'GET/disconnect-equivalent must never cancel run');
}
{
 const req:any={params:{runId:'run-1'}}; const res:any=makeRes(); handlers.cancel(req,res);
 assert(res.statusCode===200&&res.body.status==='cancelled','cancel endpoint must cancel run');
 assert(cancelCount()===1,'cancel must be explicit');
}
{
 const req:any={params:{runId:'missing'}}; const res:any=makeRes(); handlers.get(req,res);
 assert(res.statusCode===404&&res.body.error.code==='RUN_SESSION_LOST','unknown run must report session lost');
}

{
 const req:any={body:{idea:'x',styleId:'STYLE.VN.VPOP-BALLAD',runId:'bad'}}; const res:any=makeRes(); handlers.create(req,res);
 assert(res.statusCode===400&&res.body.error.code==='INVALID_RUN_ID','invalid client run id must be rejected before orphan server work starts');
}

console.log('PASS background-run-api');
