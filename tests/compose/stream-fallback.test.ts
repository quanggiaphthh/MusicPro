import { runAutoCompositionStreamed } from '../../src/compose/stream-auto-compose.ts';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
let calls=0;const fakeFetch:any=async(url:string)=>{calls++;if(url==='/api/compose/run-stream')return new Response('',{status:404});throw new Error('fallback entered legacy requests as expected');};
const events:any[]=[];let failed=false;
try{await runAutoCompositionStreamed({idea:'quê',styleId:'STYLE.VN.VPOP-BALLAD'},{fetchImpl:fakeFetch,onEvent:e=>{events.push(e);}});}catch{failed=true;}
assert(failed,'test intentionally stops after proving fallback path starts');
assert(calls>=2,'404 stream endpoint must trigger compatibility orchestration');
assert(events.some(e=>e.label==='Chế độ tương thích'),'fallback must be visible to user instead of silent');
console.log('PASS stream-fallback');
