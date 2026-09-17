import assert from 'node:assert/strict';
import { generateLeadSheetR3 } from '../../server/music/lead-sheet-r3.ts';
import type { HookForgeResponse, SongCorePatch, SongCoreV1 } from '../../server/music/song-core.ts';

const frame={tempoBpm:96,key:{tonic:'C',mode:'major' as const},meter:{beats:4,beatType:4},divisions:24 as const};
const measure=(number:number,sectionId:string,base=60)=>({
  number,sectionId,
  harmony:[{tick:0,rootStep:'C' as const,rootAlter:0 as const,kind:'major' as const}],
  vocal:[
    {tick:0,duration:24,pitch:{step:'C' as const,alter:0 as const,octave:4},lyric:'ma'},
    {tick:24,duration:24,pitch:{step:'E' as const,alter:0 as const,octave:4},lyric:'ma'},
    {tick:48,duration:48,pitch:{step:base>60?'G' as const:'C' as const,alter:0 as const,octave:4},lyric:'ma'},
  ],
});
const hookMeasures=[1,2,3,4].map(n=>measure(n,'hook'));
const hookResponse:HookForgeResponse={frame,candidates:[
  {id:'hook-a',measures:hookMeasures},
  {id:'hook-b',measures:hookMeasures.map((m,i)=>measure(i+1,'hook',67))},
  {id:'hook-c',measures:hookMeasures.map((m,i)=>measure(i+1,'hook',67))},
]};
const core:SongCoreV1={
  version:'1',title:'Test',language:'vi',frame,selectedHookId:'hook-a',
  sections:[
    {id:'chorus',type:'chorus',label:'Chorus',startMeasure:1,endMeasure:4},
    {id:'verse',type:'verse',label:'Verse',startMeasure:5,endMeasure:6},
  ],
  measures:[
    ...hookResponse.candidates[0].measures.map((m,i)=>({...m,number:i+1,sectionId:'chorus'})),
    measure(5,'verse'),measure(6,'verse'),
  ],
  accompaniment:[
    {sectionId:'chorus',texture:'half-pulse',density:3,register:'mid',energy:4},
    {sectionId:'verse',texture:'broken-8th',density:2,register:'mid',energy:2},
  ],
};
const patch:SongCorePatch={replaceMeasures:[{...measure(5,'verse',67),vocal:[{tick:0,duration:96,rest:true}]}]};

function response(value:unknown){return {text:JSON.stringify(value)} as any;}
function baseDeps(generate:any,quality:any){return {
  generate,
  validateLeadSheet:()=>({isValid:true,errors:[]}),
  extractSongDNA:()=>({musical:{approximateDuration:30},structure:[],lyrics:{assembledLyric:'abc'},melody:[]}),
  evaluateCompositionQuality:quality,
  emitTelemetry:()=>{},
};}
const input={composePrompt:'Viết bài test',composeDocRefs:[],metaPlan:'plan',songRequest:{songForm:'short demo',language:'vi'},styleId:'STYLE.VN.VPOP-BALLAD',model:'gemini-test'};

{
  const calls:any[]=[];
  const generate=async(params:any)=>{calls.push(params); return calls.length===1?response(hookResponse):response(core);};
  const result=await generateLeadSheetR3(input,baseDeps(generate,()=>({status:'PASS',score:92,checks:[]})) as any);
  assert.equal(calls.length,2,'normal r3 path has exactly two provider calls');
  assert.equal(result.diagnostics.providerCalls,2);
  assert.equal(result.diagnostics.patchUsed,false);
  assert.equal(result.diagnostics.selectedHookId,'hook-a');
  assert.match(result.xml,/<score-partwise version="4\.0">/);
  assert.ok(calls.every(c=>c.model==='gemini-test'),'no fallback model');
  assert.ok(calls.every(c=>c.config?.responseMimeType==='application/json'),'structured output only');
  assert.match(String(calls[0].contents?.[0]?.parts?.[0]?.text||''),/4\s*(?:to|-)\s*8\s*measures/i,'Hook Forge prompt must require 4-8 measures per candidate');
}

{
  const calls:any[]=[]; let qualityCount=0;
  const generate=async(params:any)=>{calls.push(params); return calls.length===1?response(hookResponse):calls.length===2?response(core):response(patch);};
  const quality=()=> ++qualityCount===1
    ? {status:'FAIL',score:72,checks:[{id:'section-contrast',status:'fail',label:'contrast',detail:'weak',required:true}]}
    : {status:'PASS',score:90,checks:[]};
  const result=await generateLeadSheetR3(input,baseDeps(generate,quality) as any);
  assert.equal(calls.length,3,'one targeted patch is the only allowed repair call');
  assert.equal(result.diagnostics.patchUsed,true);
  assert.equal(result.diagnostics.providerCalls,3);
  assert.match(String(calls[2].contents?.[0]?.parts?.[0]?.text||''),/measure 5|"number":5/i,'patch prompt contains localized measure slice');
}

{
  let calls=0;
  const generate=async()=>response(++calls===1?hookResponse:core);
  const result=await generateLeadSheetR3(input,baseDeps(generate,()=>({status:'FAIL',score:78,checks:[{id:'lyrics',status:'weak',label:'lyrics',detail:'needs review',required:true}]})) as any);
  assert.equal(calls,2,'a valid but non-patchable quality candidate must not trigger an extra provider call');
  assert.equal(result.diagnostics.patchUsed,false,'non-patchable quality review must preserve the current candidate without a fake patch');
  assert.equal(result.diagnostics.qualityScore,78);
  assert.match(result.xml,/<score-partwise version="4\.0">/,'non-patchable quality review must still return valid MusicXML');
}

{
  let calls=0;
  const generate=async()=>{calls++; if(calls>3) throw new Error('FOURTH_CALL_FORBIDDEN'); return calls===1?response(hookResponse):calls===2?response(core):response(patch);};
  const result=await generateLeadSheetR3(input,baseDeps(generate,()=>({status:'FAIL',score:74,checks:[{id:'section-contrast',status:'weak',label:'contrast',detail:'still needs review',required:true}]})) as any);
  assert.equal(calls,3,'fourth provider call is impossible');
  assert.equal(result.diagnostics.patchUsed,true,'final failed quality candidate must still report the single targeted patch');
  assert.equal(result.diagnostics.qualityScore,74,'reviewable candidate must preserve the final quality score');
  assert.match(result.xml,/<score-partwise version="4\.0">/,'reviewable final candidate must be returned instead of discarded');
}


{
  const calls:any[]=[];
  const fullSongInput={...input,songRequest:{songForm:'verse chorus',language:'vi',targetDurationSeconds:10}};
  const shortCore:SongCoreV1={...core,sections:[core.sections[0]],measures:core.measures.slice(0,4),accompaniment:[core.accompaniment[0]]};
  const generate=async(params:any)=>{calls.push(params); return calls.length===1?response(hookResponse):response(shortCore);};
  await assert.rejects(
    ()=>generateLeadSheetR3(fullSongInput,baseDeps(generate,()=>({status:'PASS',score:92,checks:[]})) as any),
    /SONG_TOO_SHORT/,
    'non-demo full songs below the 150-second floor must be rejected server-side',
  );
  assert.equal(calls.length,2,'duration-floor rejection must not trigger a full-song regeneration or patch call');
}


{
  const telemetry:any[]=[];
  const generate=async()=>({text:'{not-json'} as any);
  await assert.rejects(
    ()=>generateLeadSheetR3(input,{...baseDeps(generate,()=>({status:'PASS',score:90,checks:[]})),emitTelemetry:(record:any)=>telemetry.push(record)} as any),
    /HOOK_FORGE_INVALID_JSON/,
  );
  assert.equal(telemetry.length,1,'invalid structured output must emit one terminal telemetry record');
  assert.equal(telemetry[0].stage,'hook-forge');
  assert.equal(telemetry[0].outcome,'validation-failed');
  assert.ok(!('fromLyric' in telemetry[0])&&!('toLyric' in telemetry[0]),'telemetry must not contain lyric payload');
}


{
  const calls:any[]=[]; let qualityCount=0;
  const outOfScopePatch:SongCorePatch={
    replaceMeasures:[{...measure(5,'verse',67),vocal:[{tick:0,duration:96,rest:true}]}],
    replaceAccompaniment:[{sectionId:'chorus',texture:'syncopated-pop',density:4,register:'high',energy:5}],
  };
  const generate=async(params:any)=>{calls.push(params); return calls.length===1?response(hookResponse):calls.length===2?response(core):response(outOfScopePatch);};
  const quality=()=> ++qualityCount===1
    ? {status:'FAIL',score:72,checks:[{id:'section-contrast',status:'fail',label:'contrast',detail:'weak',required:true}]}
    : {status:'PASS',score:90,checks:[]};
  await assert.rejects(
    ()=>generateLeadSheetR3(input,baseDeps(generate,quality) as any),
    /PATCH_SCOPE_VIOLATION/,
    'targeted patch must reject accompaniment changes outside sections intersecting target measures',
  );
  assert.equal(calls.length,3,'scope rejection happens after the single allowed patch response');
}

{
  const chorus2=[5,6,7,8].map(n=>{ const m=measure(n,'chorus-2',67); return {...m,vocal:m.vocal.map((v,i)=>i===0?{...v,lyric:'DRIFT'}:v)}; });
  const finalChorus=[9,10,11,12].map(n=>measure(n,'chorus-final',67));
  const repeatedCore:SongCoreV1={
    version:'1',title:'Repeated Chorus',language:'vi',frame,selectedHookId:'hook-a',
    sections:[
      {id:'chorus-1',type:'chorus',label:'Chorus 1',startMeasure:1,endMeasure:4},
      {id:'chorus-2',type:'chorus',label:'Chorus 2',startMeasure:5,endMeasure:8},
      {id:'chorus-final',type:'chorus',label:'Final Chorus',startMeasure:9,endMeasure:12},
    ],
    measures:[
      ...hookResponse.candidates[0].measures.map((m,i)=>({...m,number:i+1,sectionId:'chorus-1'})),
      ...chorus2,
      ...finalChorus,
    ],
    accompaniment:[
      {sectionId:'chorus-1',texture:'half-pulse',density:3,register:'mid',energy:4},
      {sectionId:'chorus-2',texture:'half-pulse',density:3,register:'mid',energy:4},
      {sectionId:'chorus-final',texture:'syncopated-pop',density:4,register:'high',energy:5},
    ],
  };
  let calls=0;
  const generate=async()=>response(++calls===1?hookResponse:repeatedCore);
  const result=await generateLeadSheetR3(input,baseDeps(generate,()=>({status:'PASS',score:92,checks:[]})) as any);
  assert.equal(calls,2,'non-final Chorus drift is repaired locally without a third provider call');
  assert.equal(result.diagnostics.providerCalls,2);
  assert.equal(result.diagnostics.patchUsed,false);
  assert.doesNotMatch(result.xml,/DRIFT/,'drifted non-final Chorus lyric must not survive deterministic hook anchoring');
}


{
  const chorus2=hookResponse.candidates[0].measures.map((m,i)=>({...m,number:i+5,sectionId:'chorus-2'}));
  const finalChorus=[9,10,11,12].map(n=>measure(n,'chorus-final',67));
  const finalDevelopmentCore:SongCoreV1={
    version:'1',title:'Final Chorus Development',language:'vi',frame,selectedHookId:'hook-a',
    sections:[
      {id:'chorus-1',type:'chorus',label:'Chorus 1',startMeasure:1,endMeasure:4},
      {id:'chorus-2',type:'chorus',label:'Chorus 2',startMeasure:5,endMeasure:8},
      {id:'chorus-final',type:'chorus',label:'Final Chorus',startMeasure:9,endMeasure:12},
    ],
    measures:[
      ...hookResponse.candidates[0].measures.map((m,i)=>({...m,number:i+1,sectionId:'chorus-1'})),
      ...chorus2,
      ...finalChorus,
    ],
    accompaniment:[
      {sectionId:'chorus-1',texture:'half-pulse',density:3,register:'mid',energy:4},
      {sectionId:'chorus-2',texture:'half-pulse',density:3,register:'mid',energy:4},
      {sectionId:'chorus-final',texture:'syncopated-pop',density:4,register:'high',energy:5},
    ],
  };
  let calls=0;
  const generate=async()=>response(++calls===1?hookResponse:finalDevelopmentCore);
  const result=await generateLeadSheetR3(input,baseDeps(generate,()=>({status:'PASS',score:94,checks:[]})) as any);
  assert.equal(calls,2,'valid non-final hook lock plus Final Chorus development stays on normal two-call path');
  assert.match(result.xml,/<measure number="12">/,'Final Chorus development remains compilable');
}

console.log('lead-sheet-r3.test.ts PASS');
