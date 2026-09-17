import { createHash } from 'node:crypto';

export type PitchStep = 'A'|'B'|'C'|'D'|'E'|'F'|'G';
export type HarmonyKind = 'major'|'minor'|'dominant7'|'major7'|'minor7'|'sus2'|'sus4'|'diminished'|'half-diminished';
export type SectionType = 'intro'|'verse'|'pre-chorus'|'chorus'|'bridge'|'outro';
export type AccompanimentTexture = 'block'|'half-pulse'|'broken-8th'|'syncopated-pop';

export interface SongCorePitch { step:PitchStep; alter:-1|0|1; octave:number; }
export interface VocalEvent { tick:number; duration:number; pitch?:SongCorePitch; rest?:true; lyric?:string; lyricExtend?:boolean; tie?:'start'|'stop'; }
export interface HarmonyEvent { tick:number; rootStep:PitchStep; rootAlter:-1|0|1; kind:HarmonyKind; bassStep?:PitchStep; bassAlter?:-1|0|1; }
export interface SongCoreMeasure { number:number; sectionId:string; harmony:HarmonyEvent[]; vocal:VocalEvent[]; }
export interface SongCoreSection { id:string; type:SectionType; label:string; startMeasure:number; endMeasure:number; }
export interface SectionAccompanimentIntent { sectionId:string; texture:AccompanimentTexture; density:1|2|3|4; register:'low'|'mid'|'high'; energy:1|2|3|4|5; }
export interface SongCoreFrame { tempoBpm:number; key:{tonic:string;mode:'major'|'minor'}; meter:{beats:number;beatType:number}; divisions:24; }
export interface SongCoreV1 { version:'1'; title:string; language:string; frame:SongCoreFrame; sections:SongCoreSection[]; measures:SongCoreMeasure[]; accompaniment:SectionAccompanimentIntent[]; selectedHookId:string; }

export interface HookCandidate { id:string; measures:SongCoreMeasure[]; label?:string; }
export interface HookForgeResponse { frame:SongCoreFrame; candidates:HookCandidate[]; }
export interface SongCorePatch { replaceMeasures:SongCoreMeasure[]; replaceAccompaniment?:SectionAccompanimentIntent[]; frame?:never; selectedHookId?:never; }
export interface SongCoreValidationError { code:string; message:string; measure?:number; sectionId?:string; }
export interface SongCoreValidationResult { ok:boolean; errors:SongCoreValidationError[]; }
export interface SongCoreValidationOptions { minimumDurationSeconds?:number; }

const harmonyKinds = new Set<HarmonyKind>(['major','minor','dominant7','major7','minor7','sus2','sus4','diminished','half-diminished']);
const sectionTypes = new Set<SectionType>(['intro','verse','pre-chorus','chorus','bridge','outro']);
const textures = new Set<AccompanimentTexture>(['block','half-pulse','broken-8th','syncopated-pop']);
const steps = new Set<PitchStep>(['A','B','C','D','E','F','G']);

export function measureTicksForFrame(frame: Pick<SongCoreFrame,'divisions'|'meter'>):number {
  return Math.round(frame.divisions * frame.meter.beats * (4 / frame.meter.beatType));
}

function push(errors:SongCoreValidationError[], code:string, message:string, extra:Partial<SongCoreValidationError>={}) { errors.push({code,message,...extra}); }

export function validateSongCore(core:unknown,options:SongCoreValidationOptions={}):SongCoreValidationResult {
  const errors:SongCoreValidationError[]=[];
  if (!core || typeof core!=='object') return {ok:false,errors:[{code:'INVALID_ROOT',message:'SongCore must be an object'}]};
  const c=core as any;
  if(c.version!=='1') push(errors,'UNSUPPORTED_VERSION','SongCore version must be 1');
  if(!c.frame || c.frame.divisions!==24) push(errors,'INVALID_DIVISIONS','SongCore divisions must be 24');
  const tempo=Number(c.frame?.tempoBpm); if(!Number.isFinite(tempo)||tempo<=0) push(errors,'INVALID_TEMPO','tempoBpm must be positive');
  const beats=Number(c.frame?.meter?.beats), beatType=Number(c.frame?.meter?.beatType);
  if(!Number.isInteger(beats)||beats<=0||!Number.isInteger(beatType)||beatType<=0) push(errors,'INVALID_METER','meter must contain positive integer beats/beatType');
  if(!['major','minor'].includes(c.frame?.key?.mode)) push(errors,'INVALID_KEY','key mode must be major or minor');
  if(!/^[A-G](?:#|b|♯|♭)?$/.test(String(c.frame?.key?.tonic||''))) push(errors,'INVALID_KEY_TONIC','key tonic must be A-G with optional sharp/flat');
  const barTicks=(c.frame?.divisions===24&&Number.isFinite(beats)&&Number.isFinite(beatType)&&beatType>0)?measureTicksForFrame(c.frame):0;

  const measures:Array<any>=Array.isArray(c.measures)?c.measures:[];
  if(!measures.length) push(errors,'MEASURE_GRID_EMPTY','SongCore must contain measures');
  const minimumDurationSeconds=Number(options.minimumDurationSeconds);
  if(Number.isFinite(minimumDurationSeconds)&&minimumDurationSeconds>0&&Number.isFinite(tempo)&&tempo>0&&Number.isFinite(beats)&&Number.isFinite(beatType)&&beatType>0&&measures.length){
    const quarterNotesPerBar=beats*(4/beatType);
    const approximateDurationSeconds=measures.length*quarterNotesPerBar*(60/tempo);
    if(approximateDurationSeconds+1e-9<minimumDurationSeconds) push(errors,'SONG_TOO_SHORT',`SongCore duration ${approximateDurationSeconds.toFixed(1)}s is below ${minimumDurationSeconds}s minimum`);
  }
  for(let i=0;i<measures.length;i++) if(Number(measures[i]?.number)!==i+1){ push(errors,'MEASURE_GRID_GAP',`Expected measure ${i+1}`,{measure:Number(measures[i]?.number)}); break; }

  const sections:Array<any>=Array.isArray(c.sections)?c.sections:[];
  const sectionIds=new Set<string>();
  const ordered=[...sections].sort((a,b)=>Number(a.startMeasure)-Number(b.startMeasure)||Number(a.endMeasure)-Number(b.endMeasure));
  let expectedStart=1;
  for(const s of ordered){
    if(typeof s?.id!=='string'||!s.id){ push(errors,'INVALID_SECTION','Section id is required'); continue; }
    if(sectionIds.has(s.id)) push(errors,'DUPLICATE_SECTION_ID',`Duplicate section ${s.id}`,{sectionId:s.id});
    sectionIds.add(s.id);
    if(!sectionTypes.has(s.type)) push(errors,'UNSUPPORTED_SECTION_TYPE',`Unsupported section type ${String(s.type)}`,{sectionId:s.id});
    const start=Number(s.startMeasure), end=Number(s.endMeasure);
    if(!Number.isInteger(start)||!Number.isInteger(end)||start<1||end<start||end>measures.length) push(errors,'SECTION_RANGE_INVALID',`Invalid range for section ${s.id}`,{sectionId:s.id});
    if(start<expectedStart) push(errors,'SECTION_OVERLAP',`Section ${s.id} overlaps previous section`,{sectionId:s.id,measure:start});
    else if(start>expectedStart) push(errors,'SECTION_GAP',`Section grid gap before ${s.id}`,{sectionId:s.id,measure:expectedStart});
    expectedStart=Math.max(expectedStart,end+1);
  }
  if(measures.length && ordered.length && expectedStart!==measures.length+1) push(errors,'SECTION_GAP','Sections do not cover all measures',{measure:expectedStart});

  for(const m of measures){
    const number=Number(m?.number);
    if(!sectionIds.has(m?.sectionId)) push(errors,'UNKNOWN_SECTION',`Measure ${number} references unknown section ${String(m?.sectionId)}`,{measure:number,sectionId:m?.sectionId});
    const rangedSection=ordered.find(s=>Number(s.startMeasure)<=number&&number<=Number(s.endMeasure));
    if(rangedSection && m?.sectionId!==rangedSection.id) push(errors,'SECTION_MEASURE_MISMATCH',`Measure ${number} must belong to section ${rangedSection.id}`,{measure:number,sectionId:m?.sectionId});
    const harmony=Array.isArray(m?.harmony)?m.harmony:[];
    for(const h of harmony){
      const tick=Number(h?.tick);
      if(!Number.isInteger(tick)||tick<0||tick>=barTicks) push(errors,'HARMONY_OUT_OF_BAR',`Harmony tick ${tick} outside measure`,{measure:number});
      if(!steps.has(h?.rootStep)) push(errors,'INVALID_HARMONY_ROOT',`Invalid harmony root ${String(h?.rootStep)}`,{measure:number});
      if(![-1,0,1].includes(h?.rootAlter)) push(errors,'INVALID_HARMONY_ALTER','rootAlter must be -1,0,1',{measure:number});
      if(!harmonyKinds.has(h?.kind)) push(errors,'UNSUPPORTED_HARMONY',`Unsupported harmony kind ${String(h?.kind)}`,{measure:number});
      if(h?.bassStep!==undefined&&!steps.has(h.bassStep)) push(errors,'INVALID_HARMONY_BASS',`Invalid bass step ${String(h?.bassStep)}`,{measure:number});
      if(h?.bassAlter!==undefined&&![-1,0,1].includes(h.bassAlter)) push(errors,'INVALID_HARMONY_BASS_ALTER','bassAlter must be -1,0,1',{measure:number});
    }
    const vocal=Array.isArray(m?.vocal)?m.vocal:[];
    const sorted=[...vocal].sort((a,b)=>Number(a.tick)-Number(b.tick));
    let lastEnd=0;
    for(const v of sorted){
      const tick=Number(v?.tick),duration=Number(v?.duration);
      if(!Number.isInteger(tick)||tick<0||tick>=barTicks) push(errors,'EVENT_OUT_OF_BAR',`Vocal tick ${tick} outside measure`,{measure:number});
      if(!Number.isInteger(duration)||duration<=0) push(errors,'INVALID_DURATION',`Vocal duration ${duration} must be positive`,{measure:number});
      if(Number.isFinite(tick)&&Number.isFinite(duration)&&tick+duration>barTicks) push(errors,'EVENT_OUT_OF_BAR',`Vocal event exceeds measure end`,{measure:number});
      const hasPitch=!!v?.pitch, hasRest=v?.rest===true;
      if(hasPitch===hasRest) push(errors,'INVALID_VOCAL_EVENT','Vocal event must contain pitch XOR rest',{measure:number});
      if(hasPitch){
        if(!steps.has(v.pitch.step)||![-1,0,1].includes(v.pitch.alter)||!Number.isInteger(v.pitch.octave)||v.pitch.octave<2||v.pitch.octave>7) push(errors,'INVALID_PITCH','Pitch must be valid and octave 2..7',{measure:number});
      }
      if(Number.isFinite(tick)&&tick<lastEnd) push(errors,'VOCAL_OVERLAP','Vocal events overlap',{measure:number});
      if(Number.isFinite(tick)&&Number.isFinite(duration)) lastEnd=Math.max(lastEnd,tick+duration);
      if(v?.tie!==undefined&&!['start','stop'].includes(v.tie)) push(errors,'INVALID_TIE','tie must be start or stop',{measure:number});
    }
  }

  const accomp=Array.isArray(c.accompaniment)?c.accompaniment:[];
  for(const a of accomp){
    if(!sectionIds.has(a?.sectionId)) push(errors,'UNKNOWN_ACCOMPANIMENT_SECTION',`Unknown accompaniment section ${String(a?.sectionId)}`,{sectionId:a?.sectionId});
    if(!textures.has(a?.texture)) push(errors,'UNSUPPORTED_TEXTURE',`Unsupported texture ${String(a?.texture)}`,{sectionId:a?.sectionId});
    if(![1,2,3,4].includes(a?.density)) push(errors,'INVALID_DENSITY','density must be 1..4',{sectionId:a?.sectionId});
    if(!['low','mid','high'].includes(a?.register)) push(errors,'INVALID_REGISTER','register must be low|mid|high',{sectionId:a?.sectionId});
    if(![1,2,3,4,5].includes(a?.energy)) push(errors,'INVALID_ENERGY','energy must be 1..5',{sectionId:a?.sectionId});
  }
  if(typeof c.selectedHookId!=='string'||!c.selectedHookId) push(errors,'MISSING_HOOK_ID','selectedHookId is required');
  return {ok:errors.length===0,errors};
}

function identity(core:SongCoreV1){
  return {
    frame:{tempoBpm:core.frame.tempoBpm,key:{tonic:core.frame.key.tonic,mode:core.frame.key.mode},meter:{beats:core.frame.meter.beats,beatType:core.frame.meter.beatType},divisions:core.frame.divisions},
    measures:[...core.measures].sort((a,b)=>a.number-b.number).map(m=>({number:m.number,sectionId:m.sectionId,harmony:[...(m.harmony||[])].sort((a,b)=>a.tick-b.tick).map(h=>({tick:h.tick,rootStep:h.rootStep,rootAlter:h.rootAlter,kind:h.kind,bassStep:h.bassStep??null,bassAlter:h.bassAlter??null})),vocal:[...(m.vocal||[])].sort((a,b)=>a.tick-b.tick).map(v=>({tick:v.tick,duration:v.duration,pitch:v.pitch?{step:v.pitch.step,alter:v.pitch.alter,octave:v.pitch.octave}:null,rest:v.rest===true,lyric:v.lyric??'',lyricExtend:v.lyricExtend===true,tie:v.tie??null}))})),
  };
}
function digest(value:unknown):string { return createHash('sha256').update(JSON.stringify(value)).digest('hex'); }
export function songCoreFingerprint(core:SongCoreV1):string { return digest(identity(core)); }
export function hookFingerprint(candidate:HookCandidate):string { return digest(candidate.measures.map(m=>identity({version:'1',title:'',language:'',frame:{tempoBpm:120,key:{tonic:'C',mode:'major'},meter:{beats:4,beatType:4},divisions:24},sections:[],measures:[m],accompaniment:[],selectedHookId:candidate.id} as SongCoreV1).measures[0])); }

function deepClone<T>(value:T):T { return JSON.parse(JSON.stringify(value)); }
export function applySongCorePatch(core:SongCoreV1,patch:SongCorePatch):SongCoreV1 {
  const p:any=patch;
  if('frame' in p||'selectedHookId' in p) throw new Error('SongCore patch cannot change immutable frame or selectedHookId');
  if(!Array.isArray(patch.replaceMeasures)) throw new Error('SongCore patch replaceMeasures must be an array');
  const current=new Map(core.measures.map(m=>[m.number,m]));
  const seen=new Set<number>();
  for(const replacement of patch.replaceMeasures){
    if(!current.has(replacement.number)) throw new Error(`Patch measure ${replacement.number} is not present in SongCore`);
    if(seen.has(replacement.number)) throw new Error(`Patch contains duplicate measure ${replacement.number}`);
    seen.add(replacement.number); current.set(replacement.number,deepClone(replacement));
  }
  let accompaniment=deepClone(core.accompaniment);
  if(patch.replaceAccompaniment){
    const bySection=new Map(accompaniment.map(a=>[a.sectionId,a]));
    for(const item of patch.replaceAccompaniment){
      if(!core.sections.some(s=>s.id===item.sectionId)) throw new Error(`Patch accompaniment section ${item.sectionId} is not present in SongCore`);
      bySection.set(item.sectionId,deepClone(item));
    }
    accompaniment=core.sections.map(s=>bySection.get(s.id)).filter(Boolean) as SectionAccompanimentIntent[];
  }
  const result={...deepClone(core),measures:[...current.values()].sort((a,b)=>a.number-b.number),accompaniment};
  const validation=validateSongCore(result); if(!validation.ok) throw new Error(`Patched SongCore invalid: ${validation.errors.map(e=>e.code).join(', ')}`);
  return result;
}

const pitchSchema={type:'OBJECT',properties:{step:{type:'STRING',enum:['A','B','C','D','E','F','G']},alter:{type:'INTEGER',enum:[-1,0,1]},octave:{type:'INTEGER'}},required:['step','alter','octave']};
const harmonySchema={type:'OBJECT',properties:{tick:{type:'INTEGER'},rootStep:{type:'STRING',enum:['A','B','C','D','E','F','G']},rootAlter:{type:'INTEGER',enum:[-1,0,1]},kind:{type:'STRING',enum:[...harmonyKinds]},bassStep:{type:'STRING',enum:['A','B','C','D','E','F','G']},bassAlter:{type:'INTEGER',enum:[-1,0,1]}},required:['tick','rootStep','rootAlter','kind']};
const vocalSchema={type:'OBJECT',properties:{tick:{type:'INTEGER'},duration:{type:'INTEGER'},pitch:pitchSchema,rest:{type:'BOOLEAN'},lyric:{type:'STRING'},lyricExtend:{type:'BOOLEAN'},tie:{type:'STRING',enum:['start','stop']}},required:['tick','duration']};
const measureSchema={type:'OBJECT',properties:{number:{type:'INTEGER'},sectionId:{type:'STRING'},harmony:{type:'ARRAY',items:harmonySchema},vocal:{type:'ARRAY',items:vocalSchema}},required:['number','sectionId','harmony','vocal']};
const frameSchema={type:'OBJECT',properties:{tempoBpm:{type:'NUMBER'},key:{type:'OBJECT',properties:{tonic:{type:'STRING'},mode:{type:'STRING',enum:['major','minor']}},required:['tonic','mode']},meter:{type:'OBJECT',properties:{beats:{type:'INTEGER'},beatType:{type:'INTEGER'}},required:['beats','beatType']},divisions:{type:'INTEGER',enum:[24]}},required:['tempoBpm','key','meter','divisions']};
const sectionSchema={type:'OBJECT',properties:{id:{type:'STRING'},type:{type:'STRING',enum:[...sectionTypes]},label:{type:'STRING'},startMeasure:{type:'INTEGER'},endMeasure:{type:'INTEGER'}},required:['id','type','label','startMeasure','endMeasure']};
const accompanimentSchema={type:'OBJECT',properties:{sectionId:{type:'STRING'},texture:{type:'STRING',enum:[...textures]},density:{type:'INTEGER',enum:[1,2,3,4]},register:{type:'STRING',enum:['low','mid','high']},energy:{type:'INTEGER',enum:[1,2,3,4,5]}},required:['sectionId','texture','density','register','energy']};
export function buildHookForgeResponseSchema(){ return {type:'OBJECT',properties:{frame:frameSchema,candidates:{type:'ARRAY',items:{type:'OBJECT',properties:{id:{type:'STRING'},label:{type:'STRING'},measures:{type:'ARRAY',items:measureSchema}},required:['id','measures']}}},required:['frame','candidates']}; }
export function buildSongCoreResponseSchema(){ return {type:'OBJECT',properties:{version:{type:'STRING',enum:['1']},title:{type:'STRING'},language:{type:'STRING'},frame:frameSchema,sections:{type:'ARRAY',items:sectionSchema},measures:{type:'ARRAY',items:measureSchema},accompaniment:{type:'ARRAY',items:accompanimentSchema},selectedHookId:{type:'STRING'}},required:['version','title','language','frame','sections','measures','accompaniment','selectedHookId']}; }
export function buildSongCorePatchResponseSchema(){ return {type:'OBJECT',properties:{replaceMeasures:{type:'ARRAY',items:measureSchema},replaceAccompaniment:{type:'ARRAY',items:accompanimentSchema}},required:['replaceMeasures']}; }
