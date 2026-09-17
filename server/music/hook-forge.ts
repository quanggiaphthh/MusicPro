import { validateSongCore, type HookCandidate, type SongCoreFrame, type SongCoreMeasure, type SongCorePitch, type SongCoreV1 } from './song-core.ts';
import { evaluateVietnameseToneGuard, type ToneGuardReport } from './vietnamese-tone-guard.ts';

export interface HookScoringContext { frame:SongCoreFrame; language:string; }
export interface HookScoreBreakdown { toneGuard:number; motifRecurrence:number; singability:number; cadence:number; rhythmicIdentity:number; strongBeatText:number; }
export interface HookScore { eligible:boolean; total:number; breakdown:HookScoreBreakdown; toneGuard:ToneGuardReport; maxLeap:number; reasons:string[]; }
export interface HookSelectionItem { candidate:HookCandidate; score:HookScore; index:number; }
export interface HookSelection { winner:HookSelectionItem; ranked:HookSelectionItem[]; }

const pc:Record<string,number>={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
function midi(p:SongCorePitch):number{return (p.octave+1)*12+pc[p.step]+p.alter;}
function tempCore(candidate:HookCandidate,context:HookScoringContext):SongCoreV1{
  const measures:SongCoreMeasure[]=candidate.measures.map((m,i)=>({...JSON.parse(JSON.stringify(m)),number:i+1,sectionId:'hook'}));
  return {version:'1',title:'Hook',language:context.language,frame:context.frame,sections:[{id:'hook',type:'chorus',label:'Chorus Hook',startMeasure:1,endMeasure:measures.length}],measures,accompaniment:[{sectionId:'hook',texture:'half-pulse',density:2,register:'mid',energy:4}],selectedHookId:candidate.id};
}
function pitches(candidate:HookCandidate):number[]{return candidate.measures.flatMap(m=>m.vocal||[]).filter(v=>v.pitch).map(v=>midi(v.pitch!));}
function motifScore(seq:number[]):number{
  if(seq.length<4)return 20;
  const intervals=seq.slice(1).map((n,i)=>n-seq[i]);
  const len=Math.min(4,Math.max(2,Math.floor(intervals.length/2)));
  const seen=new Map<string,number>();
  for(let i=0;i+len<=intervals.length;i++){const k=intervals.slice(i,i+len).join(',');seen.set(k,(seen.get(k)||0)+1);}
  const max=Math.max(1,...seen.values());
  return Math.max(0,Math.min(100,(max>=2?90:45) - (new Set(intervals).size===1?25:0)));
}
function singabilityScore(seq:number[]):{score:number;maxLeap:number}{
  if(!seq.length)return{score:0,maxLeap:99};
  const range=Math.max(...seq)-Math.min(...seq); const leaps=seq.slice(1).map((n,i)=>Math.abs(n-seq[i])); const maxLeap=Math.max(0,...leaps);
  let score=100; if(range>19)score-=35; else if(range>14)score-=15; if(maxLeap>12)score-=45; else if(maxLeap>9)score-=20; const wide=leaps.filter(x=>x>7).length/Math.max(1,leaps.length); score-=Math.round(wide*30);
  return{score:Math.max(0,score),maxLeap};
}
function chordPcs(measure:SongCoreMeasure):Set<number>{
  const h=(measure.harmony||[]).at(-1); if(!h)return new Set(); const root=(pc[h.rootStep]+h.rootAlter+12)%12; const ints:Record<string,number[]>={major:[0,4,7],minor:[0,3,7],dominant7:[0,4,7,10],major7:[0,4,7,11],minor7:[0,3,7,10],sus2:[0,2,7],sus4:[0,5,7],diminished:[0,3,6],'half-diminished':[0,3,6,10]}; return new Set((ints[h.kind]||[0,4,7]).map(x=>(root+x)%12));
}
function cadenceScore(candidate:HookCandidate):number{
  let hits=0,total=0; for(const m of candidate.measures){const sung=(m.vocal||[]).filter(v=>v.pitch); if(!sung.length)continue; total++; const last=sung.at(-1)!; if(chordPcs(m).has(midi(last.pitch!)%12))hits++;} return total?Math.round(hits/total*100):40;
}
function rhythmScore(candidate:HookCandidate):number{
  const ds=candidate.measures.flatMap(m=>(m.vocal||[]).filter(v=>v.pitch).map(v=>v.duration)); if(!ds.length)return 0; const unique=new Set(ds).size; if(unique===1)return 35; if(unique>=3)return 95; return 75;
}
function strongBeatScore(candidate:HookCandidate,frame:SongCoreFrame):number{
  const beat=frame.divisions*(4/frame.meter.beatType); let total=0,hits=0; for(const m of candidate.measures)for(const v of m.vocal||[]){if(!v.pitch||!String(v.lyric||'').trim())continue;total++; if(Math.abs(v.tick/beat-Math.round(v.tick/beat))<1e-9)hits++;} return total?Math.round(hits/total*100):0;
}
export function scoreHookCandidate(candidate:HookCandidate,context:HookScoringContext):HookScore{
  const core=tempCore(candidate,context); const validation=validateSongCore(core); const reasons=validation.errors.map(e=>e.code);
  const measureCountOk=candidate.measures.length>=4&&candidate.measures.length<=8;
  if(!measureCountOk) reasons.push('HOOK_MEASURE_COUNT');
  const toneGuard=evaluateVietnameseToneGuard(core); const seq=pitches(candidate); const sing=singabilityScore(seq);
  const b:HookScoreBreakdown={toneGuard:toneGuard.status==='NOT_APPLICABLE'?100:toneGuard.score,motifRecurrence:motifScore(seq),singability:sing.score,cadence:cadenceScore(candidate),rhythmicIdentity:rhythmScore(candidate),strongBeatText:strongBeatScore(candidate,context.frame)};
  const total=Math.round((b.toneGuard*.25+b.motifRecurrence*.20+b.singability*.20+b.cadence*.15+b.rhythmicIdentity*.10+b.strongBeatText*.10)*100)/100;
  const eligible=validation.ok&&measureCountOk;
  return{eligible,total:eligible?total:0,breakdown:b,toneGuard,maxLeap:sing.maxLeap,reasons};
}
export function selectBestHook(candidates:HookCandidate[],context:HookScoringContext):HookSelection{
  if(!Array.isArray(candidates)||!candidates.length)throw new Error('Hook Forge returned no candidates');
  const ranked=candidates.map((candidate,index)=>({candidate,score:scoreHookCandidate(candidate,context),index})).sort((a,b)=> Number(b.score.eligible)-Number(a.score.eligible)||b.score.total-a.score.total||b.score.toneGuard.score-a.score.toneGuard.score||a.score.maxLeap-b.score.maxLeap||a.index-b.index);
  const winner=ranked.find(x=>x.score.eligible); if(!winner)throw Object.assign(new Error('No structurally valid hook candidate'),{code:'HOOK_NO_ELIGIBLE_CANDIDATE'});
  return{winner,ranked};
}
