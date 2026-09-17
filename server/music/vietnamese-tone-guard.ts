import type { SongCoreV1, SongCorePitch } from './song-core.ts';

export type VietnameseTone='ngang'|'sắc'|'huyền'|'hỏi'|'ngã'|'nặng';
export interface ToneGuardContraryPair { measure:number; tick:number; fromLyric:string; toLyric:string; melodicInterval:number; weight:number; }
export interface ToneGuardReport { score:number; status:'PASS'|'WEAK'|'FAIL'|'NOT_APPLICABLE'; evaluatedPairs:number; contraryPairs:ToneGuardContraryPair[]; }

const combiningToTone:Record<string,VietnameseTone>={
  '\u0301':'sắc', // acute
  '\u0300':'huyền', // grave
  '\u0309':'hỏi', // hook above
  '\u0303':'ngã', // tilde
  '\u0323':'nặng', // dot below
};
export function detectVietnameseTone(text:string):VietnameseTone {
  const nfd=String(text||'').normalize('NFD');
  for(const ch of nfd) if(combiningToTone[ch]) return combiningToTone[ch];
  return 'ngang';
}

function midi(p:SongCorePitch):number {
  const pc:Record<string,number>={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
  return (p.octave+1)*12+pc[p.step]+p.alter;
}
function tendency(t:VietnameseTone):number {
  if(t==='sắc'||t==='ngã') return 1;
  if(t==='huyền'||t==='nặng') return -1;
  return 0; // ngang/hỏi are context-sensitive for this deliberately soft guard
}
function sectionType(core:SongCoreV1,id:string):string { return core.sections.find(s=>s.id===id)?.type||''; }
function isStrongBeat(tick:number,core:SongCoreV1):boolean {
  const beatTicks=core.frame.divisions*(4/core.frame.meter.beatType);
  if(!Number.isFinite(beatTicks)||beatTicks<=0)return false;
  return Math.abs((tick/beatTicks)-Math.round(tick/beatTicks))<1e-9;
}
function isVietnameseLanguage(language:string):boolean { return /^(vi|vie|vietnamese)(-|$)/i.test(String(language||'').trim()); }

export function evaluateVietnameseToneGuard(core:SongCoreV1):ToneGuardReport {
  if(!isVietnameseLanguage(core.language)) return {score:100,status:'NOT_APPLICABLE',evaluatedPairs:0,contraryPairs:[]};
  const contraryPairs:ToneGuardContraryPair[]=[];
  let evaluatedPairs=0;
  let penalty=0;
  let previous:{event:any;measure:number;sectionId:string}|undefined;
  for(const measure of [...core.measures].sort((a,b)=>a.number-b.number)){
    const sung=[...(measure.vocal||[])].filter(v=>v.pitch&&String(v.lyric||'').trim()).sort((a,b)=>a.tick-b.tick);
    if(previous && previous.sectionId!==measure.sectionId) previous=undefined;
    for(const current of sung){
      if(previous && previous.event.pitch && current.pitch){
        evaluatedPairs++;
        const from=previous.event,to=current;
        const fromTone=detectVietnameseTone(from.lyric||''),toTone=detectVietnameseTone(to.lyric||'');
        const desired=tendency(toTone)-tendency(fromTone);
        const interval=midi(to.pitch)-midi(from.pitch);
        const actual=Math.abs(interval)<=1?0:(interval>0?1:-1);
        // Similar/ambiguous tendency and oblique melodic motion are accepted.
        if(desired!==0 && actual!==0 && Math.sign(desired)!==Math.sign(actual)){
          const sectionWeight=sectionType(core,measure.sectionId)==='chorus'?2:1;
          const weight=sectionWeight*(isStrongBeat(from.tick,core)?1.25:1);
          const magnitude=Math.abs(interval)>=5?25:Math.abs(interval)>=3?15:6;
          penalty+=weight*magnitude;
          contraryPairs.push({measure:measure.number,tick:to.tick,fromLyric:from.lyric||'',toLyric:to.lyric||'',melodicInterval:interval,weight});
        }
      }
      previous={event:current,measure:measure.number,sectionId:measure.sectionId};
    }
  }
  const score=Math.max(0,Math.min(100,Math.round(100-penalty)));
  const status=score>=75?'PASS':score>=60?'WEAK':'FAIL';
  return {score,status,evaluatedPairs,contraryPairs};
}
