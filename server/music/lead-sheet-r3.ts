import { buildR3ComposerKnowledgePacket } from './composer-knowledge-packet.ts';
import { selectBestHook } from './hook-forge.ts';
import { compileSongCoreToMusicXml } from './score-compiler.ts';
import {
  applySongCorePatch,
  buildHookForgeResponseSchema,
  buildSongCorePatchResponseSchema,
  buildSongCoreResponseSchema,
  measureTicksForFrame,
  validateSongCore,
  type HookCandidate,
  type HookForgeResponse,
  type SongCorePatch,
  type SongCoreV1,
} from './song-core.ts';
import { evaluateVietnameseToneGuard } from './vietnamese-tone-guard.ts';
import { createProviderDeadline, getProviderTimeoutMs, runWithProviderTimeout, type R3ProviderStage } from './provider-timeout.ts';

export interface R3LeadSheetInput {
  composePrompt:string;
  composeDocRefs:string[];
  metaPlan:string;
  songRequest:any;
  styleId:string;
  model:string;
}

export interface R3ProviderParams {
  model:string;
  contents:any;
  config:any;
}

export interface R3LeadSheetDeps {
  generate:(params:R3ProviderParams)=>Promise<any>;
  validateLeadSheet:(xml:string,songRequest?:any)=>{isValid:boolean;errors:string[]};
  extractSongDNA:(xml:string)=>any;
  evaluateCompositionQuality:(input:{xml:string;songDna:any;songRequest?:any})=>any;
  emitTelemetry?:(record:{stage:R3ProviderStage;model:string;startedAt:number;endedAt:number;promptChars:number;responseChars:number;outcome:'success'|'timeout'|'error'|'validation-failed';errorCode?:string;retryReason?:string})=>void;
  signal?:AbortSignal;
  now?:()=>number;
  totalBudgetMs?:number;
}

export interface R3LeadSheetDiagnostics {
  providerCalls:number;
  patchUsed:boolean;
  selectedHookId:string;
  hookScore:number;
  toneGuardScore:number;
  qualityScore:number;
  targetMeasures:number;
}

function jsonText(response:any):string {
  const raw=String(response?.text ?? response?.response?.text ?? '').trim();
  return raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,'').trim();
}
function parseJson<T>(response:any,stage:R3ProviderStage):T {
  const raw=jsonText(response);
  try { return JSON.parse(raw) as T; }
  catch(cause){ const error:any=new Error(`${stage.toUpperCase().replace(/-/g,'_')}_INVALID_JSON`); error.code='STRUCTURED_OUTPUT_INVALID_JSON'; error.cause=cause; throw error; }
}
function promptChars(params:R3ProviderParams):number {
  try { return JSON.stringify(params.contents||'').length + JSON.stringify(params.config?.systemInstruction||'').length; } catch { return 0; }
}
function isShortRequest(songRequest:any):boolean { return /short|demo|sketch/i.test(String(songRequest?.songForm||'')); }
function targetMeasureCount(frame:SongCoreV1['frame'],songRequest:any):number {
  const requested=Number(songRequest?.targetDurationSeconds||songRequest?.durationSeconds||songRequest?.targetDuration);
  const seconds=Number.isFinite(requested)&&requested>0?requested:(isShortRequest(songRequest)?30:180);
  const barQuarterNotes=frame.meter.beats*(4/frame.meter.beatType);
  const secondsPerBar=barQuarterNotes*60/frame.tempoBpm;
  return Math.max(1,Math.ceil(seconds/secondsPerBar));
}
function normalizeMeasureIdentity(measure:any){
  return {
    harmony:[...(measure?.harmony||[])].sort((a:any,b:any)=>a.tick-b.tick).map((h:any)=>({tick:h.tick,rootStep:h.rootStep,rootAlter:h.rootAlter,kind:h.kind,bassStep:h.bassStep??null,bassAlter:h.bassAlter??null})),
    vocal:[...(measure?.vocal||[])].sort((a:any,b:any)=>a.tick-b.tick).map((v:any)=>({tick:v.tick,duration:v.duration,pitch:v.pitch?{step:v.pitch.step,alter:v.pitch.alter,octave:v.pitch.octave}:null,rest:v.rest===true,lyric:v.lyric??'',lyricExtend:v.lyricExtend===true,tie:v.tie??null})),
  };
}
function hookLockedChoruses(core:SongCoreV1){
  const choruses=[...core.sections].filter(s=>s.type==='chorus').sort((a,b)=>a.startMeasure-b.startMeasure);
  if(choruses.length<=1) return choruses;
  return choruses.slice(0,-1); // final Chorus may develop; earlier Choruses preserve hook identity exactly.
}
function assertHookLock(core:SongCoreV1,winner:HookCandidate):void {
  if(core.selectedHookId!==winner.id) throw Object.assign(new Error('HOOK_LOCK_SELECTED_ID_MISMATCH'),{code:'HOOK_LOCK_MISMATCH'});
  const lockedChoruses=hookLockedChoruses(core);
  if(!lockedChoruses.length) throw Object.assign(new Error('HOOK_LOCK_CHORUS_MISSING'),{code:'HOOK_LOCK_MISMATCH'});
  const expected=JSON.stringify(winner.measures.map(normalizeMeasureIdentity));
  for(const section of lockedChoruses){
    const measures=core.measures.filter(m=>m.number>=section.startMeasure&&m.number<=section.endMeasure);
    if(measures.length!==winner.measures.length) throw Object.assign(new Error('HOOK_LOCK_MEASURE_COUNT_MISMATCH'),{code:'HOOK_LOCK_MISMATCH',sectionId:section.id});
    const actual=JSON.stringify(measures.map(normalizeMeasureIdentity));
    if(actual!==expected) throw Object.assign(new Error('HOOK_LOCK_CONTENT_MISMATCH'),{code:'HOOK_LOCK_MISMATCH',sectionId:section.id});
  }
}
function materializeLockedHook(core:SongCoreV1,winner:HookCandidate):SongCoreV1 {
  const lockedChoruses=hookLockedChoruses(core);
  if(!lockedChoruses.length) throw Object.assign(new Error('HOOK_LOCK_CHORUS_MISSING'),{code:'HOOK_LOCK_MISMATCH'});
  const replacements=new Map<number,SongCoreV1['measures'][number]>();
  for(const section of lockedChoruses){
    const existing=core.measures.filter(m=>m.number>=section.startMeasure&&m.number<=section.endMeasure);
    if(existing.length!==winner.measures.length) throw Object.assign(new Error('HOOK_LOCK_MEASURE_COUNT_MISMATCH'),{code:'HOOK_LOCK_MISMATCH',sectionId:section.id});
    winner.measures.forEach((measure,index)=>{
      replacements.set(section.startMeasure+index,{...measure,number:section.startMeasure+index,sectionId:section.id});
    });
  }
  return {...core,measures:core.measures.map(measure=>replacements.get(measure.number)??measure)};
}
function assertExpectedMeasureBudget(core:SongCoreV1,songRequest:any,target:number):void {
  if(isShortRequest(songRequest)) return;
  if(core.measures.length!==target){
    const error:any=new Error(`SONGCORE_MEASURE_BUDGET_MISMATCH:${core.measures.length}/${target}`);
    error.code='SONGCORE_MEASURE_BUDGET_MISMATCH';
    throw error;
  }
}
function chorusLockedMeasureNumbers(core:SongCoreV1):Set<number>{
  const set=new Set<number>();
  for(const section of hookLockedChoruses(core)) for(let n=section.startMeasure;n<=section.endMeasure;n++) set.add(n);
  return set;
}
function qualityPatchTargets(core:SongCoreV1,quality:any,tone:any):number[]{
  const locked=chorusLockedMeasureNumbers(core);
  const targets=new Set<number>();
  if(tone?.status==='FAIL') for(const pair of tone.contraryPairs||[]) if(!locked.has(pair.measure)) targets.add(pair.measure);
  const failed=(quality?.checks||[]).filter((c:any)=>c.status!=='pass').map((c:any)=>String(c.id||''));
  const addSections=(types:string[])=>{
    for(const section of core.sections) if(types.includes(section.type)) for(let n=section.startMeasure;n<=section.endMeasure;n++) if(!locked.has(n))targets.add(n);
  };
  if(failed.some((id:string)=>id==='section-contrast'||id==='vocal-range')) addSections(['verse','pre-chorus']);
  if(failed.some((id:string)=>id==='bridge-contrast')) addSections(['bridge']);
  if(failed.some((id:string)=>id==='final-chorus-development')) {
    const choruses=core.sections.filter(s=>s.type==='chorus').sort((a,b)=>a.startMeasure-b.startMeasure);
    const finalChorus=choruses.length>1?choruses.at(-1):undefined;
    if(finalChorus) for(let n=finalChorus.startMeasure;n<=finalChorus.endMeasure;n++) targets.add(n);
  }
  if(failed.some((id:string)=>id==='accompaniment-texture')) addSections(['verse','pre-chorus','bridge','outro']);
  return [...targets].sort((a,b)=>a-b);
}
function validationPatchTargets(core:SongCoreV1,validation:ReturnType<typeof validateSongCore>):number[]{
  const locked=chorusLockedMeasureNumbers(core);
  return [...new Set(validation.errors.map(e=>e.measure).filter((n):n is number=>Number.isInteger(n)&&!locked.has(n!)))].sort((a,b)=>a-b);
}
function makeError(code:string,message=code,extra:Record<string,unknown>={}):any { const error:any=new Error(message); error.code=code; Object.assign(error,extra); return error; }

export async function generateLeadSheetR3(input:R3LeadSheetInput,deps:R3LeadSheetDeps):Promise<{xml:string;diagnostics:R3LeadSheetDiagnostics}> {
  const now=deps.now||Date.now;
  const signal=deps.signal;
  const deadline=createProviderDeadline(deps.totalBudgetMs??getProviderTimeoutMs('lead-sheet'),now);
  let providerCalls=0;
  const packet=buildR3ComposerKnowledgePacket(input.styleId,input.composeDocRefs);

  const call=async<T>(stage:R3ProviderStage,contents:any,config:any):Promise<T>=>{
    if(signal?.aborted) throw new DOMException('Aborted','AbortError');
    const timeoutMs=deadline.timeoutFor(stage);
    const params:R3ProviderParams={model:input.model,contents,config:{...config,httpOptions:{...(config?.httpOptions||{}),timeout:timeoutMs},...(signal?{abortSignal:signal}:{})}};
    const startedAt=now(); providerCalls++;
    try{
      const response=await runWithProviderTimeout(()=>deps.generate(params),timeoutMs,stage,signal);
      const endedAt=now(); const raw=jsonText(response);
      try {
        const parsed=parseJson<T>(response,stage);
        deps.emitTelemetry?.({stage,model:input.model,startedAt,endedAt,promptChars:promptChars(params),responseChars:raw.length,outcome:'success'});
        return parsed;
      } catch(error:any) {
        deps.emitTelemetry?.({stage,model:input.model,startedAt,endedAt,promptChars:promptChars(params),responseChars:raw.length,outcome:'validation-failed',errorCode:error?.code||error?.name});
        throw Object.assign(error,{telemetryRecorded:true});
      }
    }catch(error:any){
      if(!error?.telemetryRecorded){
        deps.emitTelemetry?.({stage,model:input.model,startedAt,endedAt:now(),promptChars:promptChars(params),responseChars:0,outcome:error?.code==='GENERATION_TIMEOUT'?'timeout':'error',errorCode:error?.code||error?.name});
      }
      throw error;
    }
  };

  const hookPrompt=`Create exactly 3 short Chorus hook candidates as structured SongCore-compatible JSON. Each candidate must contain 4 to 8 measures.\nMeta Plan:\n${input.metaPlan}\nSong Request:\n${JSON.stringify(input.songRequest)}\nTask:\n${input.composePrompt}\nAll candidates must share one frame and use divisions=24.`;
  const hookResponse=await call<HookForgeResponse>('hook-forge',[{parts:[{text:hookPrompt}]}],{
    systemInstruction:packet,temperature:0.7,thinkingConfig:{thinkingLevel:'MINIMAL'},maxOutputTokens:16_384,responseMimeType:'application/json',responseSchema:buildHookForgeResponseSchema(),
  });
  if(!hookResponse?.frame||!Array.isArray(hookResponse.candidates)||hookResponse.candidates.length!==3) throw makeError('HOOK_FORGE_INVALID','Hook Forge must return exactly 3 candidates');
  const selection=selectBestHook(hookResponse.candidates,{frame:hookResponse.frame,language:String(input.songRequest?.language||'vi')});
  const winner=selection.winner.candidate;
  const targetMeasures=targetMeasureCount(hookResponse.frame,input.songRequest);

  const weavePrompt=`Expand the selected immutable Chorus hook into one complete SongCore v1 JSON object.\nSelected hook ID: ${winner.id}\nExact target measure count: ${targetMeasures}\nThe FIRST Chorus and every non-final repeated Chorus must preserve the selected hook note-for-note, rhythm-for-rhythm, harmony-for-harmony, and lyric-for-lyric. The FINAL Chorus may develop while retaining musical identity.\nSelected hook:\n${JSON.stringify(winner)}\nMeta Plan:\n${input.metaPlan}\nSong Request:\n${JSON.stringify(input.songRequest)}\nTask:\n${input.composePrompt}`;
  let core=await call<SongCoreV1>('song-weave',[{parts:[{text:weavePrompt}]}],{
    systemInstruction:packet,temperature:0.45,thinkingConfig:{thinkingLevel:'MINIMAL'},maxOutputTokens:65_536,responseMimeType:'application/json',responseSchema:buildSongCoreResponseSchema(),
  });
  core=materializeLockedHook(core,winner);

  const structuralOptions=isShortRequest(input.songRequest)?{}:{minimumDurationSeconds:150};
  let structural=validateSongCore(core,structuralOptions);
  assertExpectedMeasureBudget(core,input.songRequest,targetMeasures);
  assertHookLock(core,winner);
  let structuralTargets=structural.ok?[]:validationPatchTargets(core,structural);
  if(!structural.ok && !structuralTargets.length) throw makeError('SONGCORE_INVALID',`SONGCORE_INVALID:${structural.errors.map(e=>e.code).join(',')}`,{errors:structural.errors});

  let tone=structural.ok?evaluateVietnameseToneGuard(core):{score:0,status:'FAIL',evaluatedPairs:0,contraryPairs:[]};
  let xml=''; let quality:any={status:'FAIL',score:0,checks:[]}; let validation={isValid:false,errors:['not-compiled']};
  if(structural.ok){
    xml=compileSongCoreToMusicXml(core);
    validation=deps.validateLeadSheet(xml,input.songRequest);
    if(!validation.isValid) throw makeError('MUSICXML_COMPILER_INVALID',`Compiled MusicXML failed validation: ${validation.errors.join(', ')}`,{xml,errors:validation.errors});
    const dna=deps.extractSongDNA(xml);
    quality=deps.evaluateCompositionQuality({xml,songDna:dna,songRequest:input.songRequest});
  }

  const needsPatch=!structural.ok || tone.status==='FAIL' || quality.status!=='PASS';
  if(needsPatch){
    const targets=structuralTargets.length?structuralTargets:qualityPatchTargets(core,quality,tone);
    if(!targets.length){
      if(!structural.ok) throw makeError('SONGCORE_INVALID','SONGCORE_INVALID',{xml,quality,tone,errors:structural.errors});
      if(tone.status==='FAIL') throw makeError('TONE_GUARD_FAIL','TONE_GUARD_FAIL',{xml,quality,tone,errors:structural.errors});
      // Quality-only failures without a safe localized patch target remain reviewable artifacts.
      return {xml,diagnostics:{providerCalls,patchUsed:false,selectedHookId:winner.id,hookScore:selection.winner.score.total,toneGuardScore:tone.score,qualityScore:Number(quality.score||0),targetMeasures}};
    }
    const locked=chorusLockedMeasureNumbers(core);
    if(targets.some(n=>locked.has(n))) throw makeError('HOOK_PATCH_FORBIDDEN');
    const measureSlice=core.measures.filter(m=>targets.includes(m.number));
    const failedChecks=(quality?.checks||[]).filter((c:any)=>c.status!=='pass').map((c:any)=>({id:c.id,status:c.status,detail:c.detail}));
    const patchPrompt=`Return ONLY a SongCorePatch JSON object. Repair only these measures: ${targets.join(', ')}. Do not change frame, selectedHookId, any hook-locked non-final Chorus, or any untouched measure/section accompaniment.\nFailed checks: ${JSON.stringify(failedChecks)}\nToneGuard status: ${tone.status}\nCurrent localized measures:\n${JSON.stringify(measureSlice)}\nCurrent accompaniment intents:\n${JSON.stringify(core.accompaniment.filter(a=>core.sections.some(s=>targets.some(n=>n>=s.startMeasure&&n<=s.endMeasure)&&s.id===a.sectionId)))}`;
    const patch=await call<SongCorePatch>('song-patch',[{parts:[{text:patchPrompt}]}],{
      systemInstruction:packet,temperature:0.3,thinkingConfig:{thinkingLevel:'MINIMAL'},maxOutputTokens:32_768,responseMimeType:'application/json',responseSchema:buildSongCorePatchResponseSchema(),
    });
    const returnedNumbers=(patch.replaceMeasures||[]).map(m=>m.number);
    const allowedAccompanimentSections=new Set(core.sections.filter(section=>targets.some(n=>n>=section.startMeasure&&n<=section.endMeasure)).map(section=>section.id));
    const returnedAccompanimentSections=(patch.replaceAccompaniment||[]).map(item=>item.sectionId);
    if(
      returnedNumbers.some(n=>!targets.includes(n)||locked.has(n)) ||
      returnedAccompanimentSections.some(sectionId=>!allowedAccompanimentSections.has(sectionId))
    ) throw makeError('PATCH_SCOPE_VIOLATION');
    core=applySongCorePatch(core,patch);
    structural=validateSongCore(core,structuralOptions);
    if(!structural.ok) throw makeError('SONGCORE_INVALID_AFTER_PATCH',`SONGCORE_INVALID_AFTER_PATCH:${structural.errors.map(e=>e.code).join(',')}`);
    assertHookLock(core,winner);
    tone=evaluateVietnameseToneGuard(core);
    xml=compileSongCoreToMusicXml(core);
    validation=deps.validateLeadSheet(xml,input.songRequest);
    if(!validation.isValid) throw makeError('MUSICXML_COMPILER_INVALID_AFTER_PATCH',`MUSICXML_COMPILER_INVALID_AFTER_PATCH:${validation.errors.join(',')}`,{xml});
    quality=deps.evaluateCompositionQuality({xml,songDna:deps.extractSongDNA(xml),songRequest:input.songRequest});
    if(tone.status==='FAIL') throw makeError('QUALITY_GATE_FAILED_AFTER_PATCH','QUALITY_GATE_FAILED_AFTER_PATCH',{xml,quality,tone});
    // Preserve the final valid MusicXML candidate even when Composition Quality still needs review.
    // The outer production runner already audits this XML, persists it as a Step-3 artifact, and halts before Step 4 when quality is FAIL.
    return {xml,diagnostics:{providerCalls,patchUsed:true,selectedHookId:winner.id,hookScore:selection.winner.score.total,toneGuardScore:tone.score,qualityScore:Number(quality.score||0),targetMeasures}};
  }

  return {xml,diagnostics:{providerCalls,patchUsed:false,selectedHookId:winner.id,hookScore:selection.winner.score.total,toneGuardScore:tone.score,qualityScore:Number(quality.score||0),targetMeasures}};
}
