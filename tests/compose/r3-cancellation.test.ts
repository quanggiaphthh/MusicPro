import assert from 'node:assert/strict';
import { generateLeadSheetR3 } from '../../server/music/lead-sheet-r3.ts';
import type { HookForgeResponse, SongCorePatch, SongCoreV1 } from '../../server/music/song-core.ts';

const frame={tempoBpm:96,key:{tonic:'C',mode:'major' as const},meter:{beats:4,beatType:4},divisions:24 as const};
const measure=(number:number,sectionId:string,step:'C'|'E'|'G'='C')=>({
  number,sectionId,
  harmony:[{tick:0,rootStep:'C' as const,rootAlter:0 as const,kind:'major' as const}],
  vocal:[
    {tick:0,duration:24,pitch:{step:'C' as const,alter:0 as const,octave:4},lyric:'ma'},
    {tick:24,duration:24,pitch:{step:'E' as const,alter:0 as const,octave:4},lyric:'ma'},
    {tick:48,duration:48,pitch:{step,alter:0 as const,octave:4},lyric:'ma'},
  ],
});
const hookMeasures=[1,2,3,4].map(n=>measure(n,'hook'));
const hookResponse:HookForgeResponse={frame,candidates:[
  {id:'hook-a',measures:hookMeasures},
  {id:'hook-b',measures:[1,2,3,4].map(n=>measure(n,'hook','G'))},
  {id:'hook-c',measures:[1,2,3,4].map(n=>measure(n,'hook','G'))},
]};
const core:SongCoreV1={
  version:'1',title:'Abort fixture',language:'vi',frame,selectedHookId:'hook-a',
  sections:[{id:'chorus',type:'chorus',label:'Chorus',startMeasure:1,endMeasure:4},{id:'verse',type:'verse',label:'Verse',startMeasure:5,endMeasure:6}],
  measures:[...hookMeasures.map((m,i)=>({...m,number:i+1,sectionId:'chorus'})),measure(5,'verse'),measure(6,'verse')],
  accompaniment:[{sectionId:'chorus',texture:'half-pulse',density:3,register:'mid',energy:4},{sectionId:'verse',texture:'broken-8th',density:2,register:'mid',energy:2}],
};
const patch:SongCorePatch={replaceMeasures:[{...measure(5,'verse'),vocal:[{tick:0,duration:96,rest:true}]}]};
const response=(v:unknown)=>({text:JSON.stringify(v)}) as any;
const input={composePrompt:'test',composeDocRefs:[],metaPlan:'plan',songRequest:{songForm:'short demo',language:'vi'},styleId:'STYLE.VN.VPOP-BALLAD',model:'gemini-test'};

async function abortAt(targetCall:number, initialQuality:'PASS'|'FAIL'){
  const controller=new AbortController(); let calls=0; let qualityCalls=0;
  const generate=async()=>{
    calls++;
    if(calls===targetCall){ queueMicrotask(()=>controller.abort()); return await new Promise<any>(()=>undefined); }
    if(calls===1)return response(hookResponse);
    if(calls===2)return response(core);
    return response(patch);
  };
  let error:any;
  try{
    await generateLeadSheetR3(input,{
      generate,
      validateLeadSheet:()=>({isValid:true,errors:[]}),
      extractSongDNA:()=>({musical:{approximateDuration:30},structure:[],lyrics:{assembledLyric:'abc'},melody:[]}),
      evaluateCompositionQuality:()=>{qualityCalls++; return initialQuality==='FAIL'&&qualityCalls===1?{status:'FAIL',score:70,checks:[{id:'section-contrast',status:'fail',label:'contrast',detail:'weak',required:true}]}:{status:'PASS',score:90,checks:[]};},
      signal:controller.signal,
    });
  }catch(cause){error=cause;}
  assert.equal(error?.name,'AbortError',`call ${targetCall} must reject with AbortError`);
  assert.equal(calls,targetCall,`abort at provider call ${targetCall} must not start a later stage`);
}

await abortAt(1,'PASS');
await abortAt(2,'PASS');
await abortAt(3,'FAIL');
console.log('r3-cancellation.test.ts PASS');
