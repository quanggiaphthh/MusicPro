import { runAutoCompositionStreamed } from '../../src/compose/stream-auto-compose.ts';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const enc=new TextEncoder();
const messages=[
 {type:'event',event:{kind:'progress',step:1,progress:5,label:'Bước 1',at:1}},
 {type:'event',event:{kind:'artifact',step:3,progress:56,label:'Lead',xml:'<lead/>',at:2}},
 {type:'result',result:{leadSheetXml:'<lead/>',finalXml:'<final/>',context:{metaPlan:'',composePrompt:'c',arrangePrompt:'a',composeDocRefs:[],arrangeDocRefs:[],planSummary:'',songRequest:{}},compositionQuality:{status:'PASS',score:90,checks:[],summary:'ok'},arrangementQuality:{status:'PASS',score:91,checks:[],summary:'ok'},readiness:{status:'PASS',label:'READY FOR PRODUCTION',score:90,summary:'ok',blockers:[],advisories:[]},songDna:{},blueprint:{}}},
];
const chunks=[messages.slice(0,1).map(x=>JSON.stringify(x)).join('\n')+'\n'+JSON.stringify(messages[1]).slice(0,25),JSON.stringify(messages[1]).slice(25)+'\n'+JSON.stringify(messages[2])+'\n'];
const fakeFetch:any=async()=>new Response(new ReadableStream({start(controller){for(const chunk of chunks)controller.enqueue(enc.encode(chunk));controller.close();}}),{status:200,headers:{'Content-Type':'application/x-ndjson'}});
const events:any[]=[];
const result=await runAutoCompositionStreamed({idea:'quê',styleId:'STYLE.VN.VPOP-BALLAD'},{fetchImpl:fakeFetch,onEvent:e=>{events.push(e);},fallback:false});
assert(result.finalXml==='<final/>','must return streamed result');
assert(events.length===2,'must emit streamed events across arbitrary chunk boundaries');
assert(events[1].kind==='artifact','artifact event must survive chunk splitting');
console.log('PASS stream-auto-compose');
