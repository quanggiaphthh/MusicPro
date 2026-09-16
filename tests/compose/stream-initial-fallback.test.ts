import { runAutoCompositionStreamed } from '../../src/compose/stream-auto-compose.ts';
const calls:string[]=[];
const fakeFetch:any=async(url:string)=>{calls.push(url);if(url==='/api/compose/run-stream')throw new TypeError('connection lost after request dispatch may be ambiguous');throw new Error('legacy fallback must not run after ambiguous transport failure');};
let code='';
try{await runAutoCompositionStreamed({idea:'x',styleId:'STYLE.VN.VPOP-BALLAD'},{fetchImpl:fakeFetch,fallback:true});}catch(error:any){code=error?.code||'';}
if(code!=='STREAM_TRANSPORT_ERROR')throw new Error(`expected fail-closed STREAM_TRANSPORT_ERROR, got ${code}`);
if(calls.length!==1||calls[0]!=='/api/compose/run-stream')throw new Error(`ambiguous transport failure must not duplicate generation via legacy fallback: ${calls.join(' -> ')}`);
console.log('PASS stream-initial-fallback-safe');
