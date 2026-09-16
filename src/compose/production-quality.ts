import type { ProductionReadinessReport, QualityCheck, QualityReport, QualityStatus } from './types.ts';

interface SectionLike { sectionName?: string; measureStart?: number; measureEnd?: number; }
interface MelodyNoteLike { midi?: number; duration?: number; measure?: number; }
interface SongDnaLike {
  musical?: { approximateDuration?: number; tempoBpm?: number; timeSignature?: string; key?: string; mode?: string };
  lyrics?: { assembledLyric?: string; syllables?: string[] };
  structure?: SectionLike[];
  harmony?: Array<{ measure?: number; chordSymbols?: string[] }>;
  melody?: MelodyNoteLike[];
  instrumentation?: Array<{ partId?: string; partName?: string }>;
  fingerprint?: {
    openingMotif?: string[];
    chorusMotif?: string[];
    midiSequence?: number[];
    approximateRhythmicPattern?: number[];
  };
}

export interface CompositionQualityInput { xml: string; songDna: SongDnaLike; songRequest?: any; }
export interface ArrangementQualityInput { xml: string; songDna: SongDnaLike; leadDna: SongDnaLike; leadXml: string; songRequest?: any; }

const PASS_POINTS = 10;
const WEAK_POINTS = 6;

function check(id:string,label:string,status:QualityStatus,detail:string,required=false):QualityCheck { return {id,label,status,detail,required}; }
function sectionName(section:SectionLike):string { return String(section.sectionName||'').toLocaleLowerCase('vi-VN').trim(); }
function isSection(section:SectionLike,token:string):boolean {
  const name=sectionName(section);
  if(token==='chorus'&&/(?:^|[\s-])pre[\s-]*chorus/.test(name))return false;
  if(token==='điệp khúc'&&/(tiền|trước)[\s-]*điệp khúc/.test(name))return false;
  return name.includes(token);
}
function sections(dna:SongDnaLike):SectionLike[] { return Array.isArray(dna.structure)?dna.structure:[]; }
function melody(dna:SongDnaLike):MelodyNoteLike[] { return Array.isArray(dna.melody)?dna.melody:[]; }

function notesForSection(dna:SongDnaLike,section:SectionLike|undefined):MelodyNoteLike[] {
  if(!section)return[]; const start=Number(section.measureStart||0),end=Number(section.measureEnd||start);
  return melody(dna).filter(note=>Number(note.measure||0)>=start&&Number(note.measure||0)<=end);
}
function noteStats(notes:MelodyNoteLike[]):{meanMidi:number;meanDuration:number;range:number;density:number}|null {
  const pitched=notes.filter(note=>Number.isFinite(note.midi)); if(!pitched.length)return null;
  const midis=pitched.map(note=>Number(note.midi)); const durations=pitched.map(note=>Number.isFinite(note.duration)?Number(note.duration):0);
  const measures=new Set(pitched.map(note=>note.measure).filter(Number.isFinite));
  return {meanMidi:midis.reduce((a,b)=>a+b,0)/midis.length,meanDuration:durations.reduce((a,b)=>a+b,0)/Math.max(1,durations.length),range:Math.max(...midis)-Math.min(...midis),density:pitched.length/Math.max(1,measures.size)};
}
function contrastStatus(a:ReturnType<typeof noteStats>,b:ReturnType<typeof noteStats>):QualityStatus {
  if(!a||!b)return'weak'; const pitchDiff=Math.abs(a.meanMidi-b.meanMidi); const durationBase=Math.max(.001,(a.meanDuration+b.meanDuration)/2);
  const durationDiff=Math.abs(a.meanDuration-b.meanDuration)/durationBase; const densityBase=Math.max(.001,(a.density+b.density)/2);
  const densityDiff=Math.abs(a.density-b.density)/densityBase; const rangeDiff=Math.abs(a.range-b.range);
  return pitchDiff>=1.5||durationDiff>=.15||densityDiff>=.18||rangeDiff>=2?'pass':'weak';
}
function xmlComplete(xml:string):boolean { return /<score-partwise\b/i.test(xml)&&/<part-list\b/i.test(xml)&&/<\/score-partwise>\s*$/i.test(xml.trim()); }
function partIds(xml:string,tag:'score-part'|'part'):string[] { const re=tag==='score-part'?/<score-part\b[^>]*\bid=["']([^"']+)["']/gi:/<part\b[^>]*\bid=["']([^"']+)["']/gi; return [...xml.matchAll(re)].map(m=>m[1]); }

interface PartTexture { id:string;name:string;measures:number;measureNumbers:number[];pitchedNotes:number;wholeNotes:number;avgNotesPerMeasure:number; }
interface MeasureRange { start:number; end:number; }
function sungRanges(dna:SongDnaLike):MeasureRange[] {
  const marked=sections(dna).filter(section=>!/(intro|outro|interlude|solo|break|mở đầu|kết)/i.test(sectionName(section))).map(section=>({start:Number(section.measureStart||0),end:Number(section.measureEnd||section.measureStart||0)})).filter(range=>range.start>0&&range.end>=range.start);
  return marked;
}
function inRanges(measure:number,ranges:MeasureRange[]):boolean { return !ranges.length||ranges.some(range=>measure>=range.start&&measure<=range.end); }
function partTextures(xml:string,ranges:MeasureRange[]=[]):PartTexture[] {
  const names=new Map<string,string>();
  for(const match of xml.matchAll(/<score-part\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/score-part>/gi)) names.set(match[1],match[2].match(/<part-name[^>]*>([\s\S]*?)<\/part-name>/i)?.[1]?.replace(/<[^>]+>/g,'').trim()||match[1]);
  const result:PartTexture[]=[];
  for(const match of xml.matchAll(/<part\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/part>/gi)) {
    const body=match[2]; let measures=0; const measureNumbers:number[]=[]; const noteBodies:string[]=[];
    for(const measure of body.matchAll(/<measure\b[^>]*\bnumber=["']([^"']+)["'][^>]*>([\s\S]*?)<\/measure>/gi)){
      const number=Number(measure[1]); if(!Number.isFinite(number)||!inRanges(number,ranges))continue; measures++; measureNumbers.push(number);
      noteBodies.push(...[...measure[2].matchAll(/<note\b[^>]*>([\s\S]*?)<\/note>/gi)].map(m=>m[1]));
    }
    const pitched=noteBodies.filter(note=>Boolean(note.match(/<pitch\b/i))); const whole=pitched.filter(note=>Boolean(note.match(/<type>\s*whole\s*<\/type>/i)));
    result.push({id:match[1],name:names.get(match[1])||match[1],measures,measureNumbers,pitchedNotes:pitched.length,wholeNotes:whole.length,avgNotesPerMeasure:pitched.length/Math.max(1,measures)});
  }
  return result;
}
function textureStatus(part:PartTexture):QualityStatus {
  const wholeRatio=part.wholeNotes/Math.max(1,part.pitchedNotes);
  if(part.avgNotesPerMeasure>=1.5&&wholeRatio<.8)return'pass';
  if(part.avgNotesPerMeasure>=1&&wholeRatio<.8)return'weak';
  return'fail';
}
function accompanimentTextureCheck(xml:string,dna:SongDnaLike,mode:'composition'|'arrangement'):QualityCheck {
  const ranges=sungRanges(dna); const textures=partTextures(xml,ranges); const isHarmonic=(p:PartTexture)=>!(/vocal|voice|melody|drum|percussion|trống|bộ gõ|bass/i.test(p.name))&&p.pitchedNotes>0;
  const piano=textures.find(p=>/piano|keys|keyboard/i.test(p.name)); const harmonic=textures.filter(isHarmonic);
  if(!harmonic.length)return check('accompaniment-texture','Piano / lớp hòa âm','fail','Không phát hiện lớp pitched accompaniment nghe được ở sung sections.',true);
  if(mode==='composition'){
    const target=piano||harmonic[0],status=textureStatus(target),wholeRatio=target.wholeNotes/Math.max(1,target.pitchedNotes);
    return check('accompaniment-texture','Piano / lớp hòa âm',status,status==='pass'?`${target.name}: ${target.avgNotesPerMeasure.toFixed(1)} nốt/ô hát; whole-note ${(wholeRatio*100).toFixed(0)}%.`:status==='weak'?`${target.name} còn thưa ở sung sections; cần pulse/comp rõ hơn.`:`${target.name} whole-note/pad-dominant hoặc quá thưa ở sung sections.`,true);
  }
  const groove=harmonic.find(part=>textureStatus(part)==='pass');
  if(groove)return check('accompaniment-texture','Lớp hòa âm/groove pitched','pass',`${groove.name} đảm nhiệm pitched groove ở sung sections (${groove.avgNotesPerMeasure.toFixed(1)} nốt/ô).`,true);
  const weak=harmonic.find(part=>textureStatus(part)==='weak');
  if(weak)return check('accompaniment-texture','Lớp hòa âm/groove pitched','weak',`${weak.name} có chuyển động nhưng rhythmic groove còn thưa ở sung sections.`,true);
  return check('accompaniment-texture','Lớp hòa âm/groove pitched','fail','Các lớp pitched accompaniment đều pad/whole-note-dominant hoặc quá thưa ở sung sections.',true);
}
function partCoverageCheck(xml:string):QualityCheck {
  const textures=partTextures(xml); if(!textures.length)return check('part-coverage','Độ phủ ô nhịp theo part','fail','Không đọc được part.',true);
  const max=Math.max(...textures.map(p=>p.measures)); if(max<4)return check('part-coverage','Độ phủ ô nhịp theo part','weak',`Score chỉ có ${max} ô nhịp để đánh giá coverage.`);
  const short=textures.filter(p=>p.measures/max<.8); return check('part-coverage','Độ phủ ô nhịp theo part',short.length?'fail':'pass',short.length?`Part thiếu coverage: ${short.map(p=>`${p.name} ${p.measures}/${max}`).join(', ')}`:`Tất cả ${textures.length} part phủ ≥80% số ô nhịp.`,true);
}
function measureGridCheck(xml:string):QualityCheck {
  const textures=partTextures(xml); if(!textures.length)return check('measure-grid','Measure grid importer','fail','Không đọc được measure grid.',true);
  const all=[...new Set(textures.flatMap(part=>part.measureNumbers))].sort((a,b)=>a-b);
  if(!all.length)return check('measure-grid','Measure grid importer','fail','Không có measure number dạng số để kiểm tra.',true);
  const min=all[0],max=all[all.length-1],expected=Array.from({length:max-min+1},(_,i)=>min+i);
  const globalContinuous=all.length===expected.length&&all.every((value,index)=>value===expected[index]);
  const expectedKey=all.join(',');
  const bad=textures.filter(part=>{const nums=[...new Set(part.measureNumbers)].sort((a,b)=>a-b);return nums.join(',')!==expectedKey||nums.length!==part.measureNumbers.length;});
  const ok=globalContinuous&&bad.length===0;
  return check('measure-grid','Measure grid importer',ok?'pass':'fail',ok?`Tất cả ${textures.length} part dùng cùng measure grid ${min}→${max}.`:`Measure grid không liên tục hoặc lệch giữa part${bad.length?`: ${bad.map(p=>p.name).join(', ')}`:''}.`,true);
}
function scoreInstrumentPairsCheck(xml:string):QualityCheck {
  const scoreIds=new Set([...xml.matchAll(/<score-instrument\b[^>]*\bid=["']([^"']+)["']/gi)].map(m=>m[1]));
  const midiIds=[...xml.matchAll(/<midi-instrument\b[^>]*\bid=["']([^"']+)["']/gi)].map(m=>m[1]);
  const missing=[...new Set(midiIds.filter(id=>!scoreIds.has(id)))];
  return check('score-instrument-pairs','Score/MIDI instrument pairs',missing.length?'fail':'pass',missing.length?`Thiếu score-instrument cho: ${missing.join(', ')}`:midiIds.length?`${midiIds.length} midi-instrument có cặp score-instrument.`:'Không dùng midi-instrument metadata mở rộng.',true);
}
function unpitchedComplexityCheck(xml:string):QualityCheck {
  const ids=new Set<string>(); for(const note of xml.matchAll(/<note\b[^>]*>([\s\S]*?<unpitched\b[\s\S]*?)<\/note>/gi)){ const id=note[1].match(/<instrument\b[^>]*\bid=["']([^"']+)["']/i)?.[1]; if(id)ids.add(id); }
  return check('unpitched-complexity','Độ phức tạp percussion importer',ids.size<=2?'pass':'fail',ids.size<=2?`${ids.size} unpitched instrument id.`:`${ids.size} unpitched instrument id; vượt giới hạn importer-safety của V1.`,true);
}

function densityForSection(xml:string,section:SectionLike|undefined):number|undefined {
  if(!section)return undefined; const start=Number(section.measureStart||0),end=Number(section.measureEnd||start),counts=new Map<number,number>();
  for(const part of xml.matchAll(/<part\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/part>/gi)) for(const measure of part[2].matchAll(/<measure\b[^>]*\bnumber=["']([^"']+)["'][^>]*>([\s\S]*?)<\/measure>/gi)) {
    const n=Number(measure[1]); if(!Number.isFinite(n)||n<start||n>end)continue; const notes=[...measure[2].matchAll(/<note\b[^>]*>([\s\S]*?)<\/note>/gi)].filter(m=>Boolean(m[1].match(/<pitch\b|<unpitched\b/i))).length; counts.set(n,(counts.get(n)||0)+notes);
  }
  return counts.size?[...counts.values()].reduce((a,b)=>a+b,0)/counts.size:undefined;
}
function densityContrastStatus(a:number|undefined,b:number|undefined):QualityStatus { if(a===undefined||b===undefined)return'weak'; const base=Math.max(.001,(a+b)/2); return Math.abs(a-b)/base>=.18?'pass':'weak'; }
function normalizeText(value:string|undefined):string { return(value||'').toLocaleLowerCase('vi-VN').normalize('NFKC').replace(/[^a-z0-9à-ỹđ]+/gi,''); }
function normalizeSectionLabel(value:string|undefined):string { return(value||'').toLocaleLowerCase('vi-VN').normalize('NFKC').replace(/\b(final|1|2|3|i|ii|iii)\b/g,'').replace(/[^a-zà-ỹđ]+/gi,' ').trim(); }
function sequenceLcsRatio<T extends string|number>(a:T[],b:T[],cap=700):number { const x=a.slice(0,cap),y=b.slice(0,cap); if(!x.length)return 1; const dp=new Uint16Array(y.length+1); for(let i=1;i<=x.length;i++){let prev=0;for(let j=1;j<=y.length;j++){const saved=dp[j];dp[j]=x[i-1]===y[j-1]?prev+1:Math.max(dp[j],dp[j-1]);prev=saved;}}return dp[y.length]/x.length; }
function textOrderSimilarity(a:string|undefined,b:string|undefined):number { return sequenceLcsRatio([...normalizeText(a)],[...normalizeText(b)],900); }
function harmonySequence(dna:SongDnaLike):string[] { return (dna.harmony||[]).flatMap(item=>item.chordSymbols||[]).map(chord=>String(chord).replace(/\s+/g,'').toUpperCase()); }
function harmonyMeasureSignature(dna:SongDnaLike):string[] { return (dna.harmony||[]).map(item=>`${Number(item.measure||0)}:${(item.chordSymbols||[]).map(chord=>String(chord).replace(/\s+/g,'').toUpperCase()).join('|')}`).filter(item=>!item.startsWith('0:')); }
function structureSequence(dna:SongDnaLike):string[] { return sections(dna).map(s=>normalizeSectionLabel(s.sectionName)).filter(Boolean); }
function intervals(notes:MelodyNoteLike[]):number[] { const midis=notes.map(n=>Number(n.midi)).filter(Number.isFinite),out:number[]=[]; for(let i=1;i<midis.length;i++)out.push(midis[i]-midis[i-1]); return out; }
function durations(notes:MelodyNoteLike[]):number[] { return notes.map(n=>Math.round(Number(n.duration||0)*100)/100); }
function finalChorusDevelopmentCheck(dna:SongDnaLike):QualityCheck {
  const choruses=sections(dna).filter(s=>isSection(s,'chorus')||isSection(s,'điệp khúc')); if(choruses.length<2)return check('final-chorus-development','Phát triển Final Chorus','weak','Không nhận diện được ít nhất hai vùng Chorus/Final Chorus.');
  const first=notesForSection(dna,choruses[0]),last=notesForSection(dna,choruses[choruses.length-1]); if(!first.length||!last.length)return check('final-chorus-development','Phát triển Final Chorus','weak','Thiếu dữ liệu nốt để so sánh Chorus đầu và cuối.');
  const a=noteStats(first),b=noteStats(last); const rhythmSim=sequenceLcsRatio(durations(first),durations(last),160),intervalSim=sequenceLcsRatio(intervals(first),intervals(last),160);
  const densityDiff=a&&b?Math.abs(a.density-b.density)/Math.max(.001,(a.density+b.density)/2):0; const rangeDiff=a&&b?Math.abs(a.range-b.range):0; const registerDiff=a&&b?Math.abs(a.meanMidi-b.meanMidi):0;
  const developed=rhythmSim<.9||intervalSim<.9||densityDiff>=.15||rangeDiff>=2;
  if(developed)return check('final-chorus-development','Phát triển Final Chorus','pass',`Rhythm similarity ${Math.round(rhythmSim*100)}%, contour ${Math.round(intervalSim*100)}%, density Δ ${Math.round(densityDiff*100)}%.`);
  if(registerDiff>=1.5)return check('final-chorus-development','Phát triển Final Chorus','weak',`Chủ yếu thay đổi register (${registerDiff.toFixed(1)} semitone), chưa thấy phát triển rhythm/contour/density rõ.`);
  return check('final-chorus-development','Phát triển Final Chorus','weak','Final Chorus gần như lặp nguyên pitch/rhythm skeleton của Chorus đầu.');
}

interface ReportOptions { minScore:number; maxWeak:number; }
function report(checks:QualityCheck[],gateName:string,options:ReportOptions):QualityReport {
  const score=Math.round(checks.reduce((sum,item)=>sum+(item.status==='pass'?PASS_POINTS:item.status==='weak'?WEAK_POINTS:0),0)/Math.max(1,checks.length*PASS_POINTS)*100);
  const failCount=checks.filter(item=>item.status==='fail').length,weakCount=checks.filter(item=>item.status==='weak').length,requiredNotPass=checks.some(item=>item.required&&item.status!=='pass');
  const status:'PASS'|'FAIL'=!requiredNotPass&&failCount===0&&weakCount<=options.maxWeak&&score>=options.minScore?'PASS':'FAIL';
  return {status,score,checks,summary:`${gateName}: ${status} · ${score}/100 · ${failCount} fail · ${weakCount} weak`};
}

export function evaluateCompositionQuality(input:CompositionQualityInput):QualityReport {
  const {xml,songDna:dna,songRequest}=input,checks:QualityCheck[]=[]; const complete=xmlComplete(xml); checks.push(check('musicxml-complete','MusicXML hoàn chỉnh',complete?'pass':'fail',complete?'Có score-partwise/part-list và closing tag.':'MusicXML không hoàn chỉnh.',true));
  const duration=Number(dna.musical?.approximateDuration||0),isDemo=/short|demo|sketch/i.test(String(songRequest?.songForm||'')); checks.push(check('duration','Thời lượng',isDemo||duration>=150?'pass':duration>=135?'weak':'fail',duration?`${Math.round(duration)} giây.`:'Không xác định thời lượng.',!isDemo));
  const lyrics=String(dna.lyrics?.assembledLyric||'').trim(),vocalExpected=Boolean(songRequest?.language||songRequest?.vocalDirection||songRequest?.lyricDirection); checks.push(check('lyrics','Lời bài hát',!vocalExpected||lyrics.length>=40?'pass':lyrics.length?'weak':'fail',lyrics?`${lyrics.length} ký tự lời được nhận diện.`:'Không nhận diện được lời.',vocalExpected));
  const secs=sections(dna),chorus=secs.find(s=>isSection(s,'chorus')||isSection(s,'điệp khúc')),verse=secs.find(s=>isSection(s,'verse')||isSection(s,'phiên khúc')),bridge=secs.find(s=>isSection(s,'bridge')||isSection(s,'chuyển'));
  const structureStatus:QualityStatus=isDemo?(secs.length>=2&&!!chorus?'pass':secs.length>=1?'weak':'fail'):(secs.length>=4&&!!chorus?'pass':secs.length>=3?'weak':'fail');
  checks.push(check('structure','Cấu trúc bài',structureStatus,`${secs.length} section; ${chorus?'có Chorus':'thiếu Chorus'}${isDemo?' · short/demo contract':''}.`,true));
  const hook=dna.fingerprint?.chorusMotif||[]; checks.push(check('chorus-hook','Hook điệp khúc',hook.length>=3?'pass':hook.length?'weak':'fail',hook.length?`Motif: ${hook.join(' ')}`:'Không trích xuất được chorus motif.',true));
  const sectionContrast=contrastStatus(noteStats(notesForSection(dna,verse)),noteStats(notesForSection(dna,chorus))); checks.push(check('section-contrast','Tương phản Verse/Chorus',sectionContrast,sectionContrast==='pass'?'Có khác biệt register/rhythm/density.':'Khác biệt Verse/Chorus còn yếu.',true));
  const bridgeExpected=/bridge|chuyển/i.test(String(songRequest?.songForm||'')); const bridgeContrast=contrastStatus(noteStats(notesForSection(dna,bridge)),noteStats(notesForSection(dna,chorus))); checks.push(check('bridge-contrast','Tương phản Bridge',bridge?bridgeContrast:(bridgeExpected?'fail':'weak'),bridge?(bridgeContrast==='pass'?'Bridge có tương phản định lượng.':'Bridge còn gần Chorus.'):(bridgeExpected?'Song form yêu cầu Bridge nhưng không nhận diện được.':'Không có Bridge trong form.'),bridgeExpected||Boolean(bridge)));
  { const finalChorus=finalChorusDevelopmentCheck(dna); checks.push({...finalChorus,required:!isDemo}); }
  const midis=melody(dna).map(n=>Number(n.midi)).filter(Number.isFinite),range=midis.length?Math.max(...midis)-Math.min(...midis):0; checks.push(check('vocal-range','Quãng giai điệu',range>=7&&range<=24?'pass':range>=5&&range<=30?'weak':'fail',`${range} semitone.`,true));
  checks.push(accompanimentTextureCheck(xml,dna,'composition'));
  return report(checks,'Composition Quality Gate',{minScore:80,maxWeak:2});
}

export function evaluateArrangementQuality(input:ArrangementQualityInput):QualityReport {
  const {xml,songDna:dna,leadDna}=input,checks:QualityCheck[]=[]; const complete=xmlComplete(xml); checks.push(check('musicxml-complete','MusicXML hoàn chỉnh',complete?'pass':'fail',complete?'Cấu trúc XML hoàn chỉnh.':'MusicXML không hoàn chỉnh.',true));
  const duration=Number(dna.musical?.approximateDuration||0),leadDuration=Number(leadDna.musical?.approximateDuration||0),isDemo=/short|demo|sketch/i.test(String(input.songRequest?.songForm||'')); checks.push(check('duration','Thời lượng bản phối',isDemo||duration>=150&&(!leadDuration||duration>=leadDuration*.85)?'pass':duration>=135?'weak':'fail',`${Math.round(duration)} giây; lead ${Math.round(leadDuration)} giây${isDemo?' · short/demo được user yêu cầu':''}.`,!isDemo));
  const parts=dna.instrumentation?.length||0; checks.push(check('instrumentation','Instrumentation metadata',parts>=2?'pass':parts===1?'weak':'fail',`${parts} part/nhạc cụ; độ dày phối khí phụ thuộc style/ARRANGEMENT đã khóa, không dùng số part như hard gate.`,false));
  const sameKey=(dna.musical?.key||'')===(leadDna.musical?.key||'')&&(dna.musical?.mode||'')===(leadDna.musical?.mode||''); checks.push(check('identity-key','Giữ giọng/mode',sameKey?'pass':'fail',`${leadDna.musical?.key||'?'} ${leadDna.musical?.mode||''} → ${dna.musical?.key||'?'} ${dna.musical?.mode||''}`,true));
  const sameMeter=(dna.musical?.timeSignature||'')===(leadDna.musical?.timeSignature||''); checks.push(check('identity-meter','Giữ nhịp',sameMeter?'pass':'fail',`${leadDna.musical?.timeSignature||'?'} → ${dna.musical?.timeSignature||'?'}`,true));
  const leadTempo=Number(leadDna.musical?.tempoBpm||0),arrTempo=Number(dna.musical?.tempoBpm||0),sameTempo=!leadTempo||!arrTempo||Math.abs(leadTempo-arrTempo)<.5; checks.push(check('identity-tempo','Giữ BPM',sameTempo?'pass':'fail',`${leadTempo||'?'} → ${arrTempo||'?'}`,true));
  const lyricSimilarity=textOrderSimilarity(leadDna.lyrics?.assembledLyric,dna.lyrics?.assembledLyric); checks.push(check('lyrics-preservation','Giữ lời theo đúng thứ tự',lyricSimilarity>=.9?'pass':lyricSimilarity>=.75?'weak':'fail',`Ordered lyric similarity ${Math.round(lyricSimilarity*100)}%.`,true));
  const melodySimilarity=sequenceLcsRatio(leadDna.fingerprint?.midiSequence||[],dna.fingerprint?.midiSequence||[]); checks.push(check('melody-preservation','Giữ nhận diện giai điệu',melodySimilarity>=.8?'pass':melodySimilarity>=.65?'weak':'fail',`LCS melody ${Math.round(melodySimilarity*100)}%.`,true));
  const leadHarmony=harmonyMeasureSignature(leadDna),arrHarmony=harmonyMeasureSignature(dna),harmonyExact=leadHarmony.length===arrHarmony.length&&leadHarmony.every((item,index)=>item===arrHarmony[index]); checks.push(check('harmony-preservation','Giữ harmonic progression theo ô nhịp',!leadHarmony.length?'pass':harmonyExact?'pass':'fail',leadHarmony.length?(harmonyExact?`${leadHarmony.length} harmony measure signature khớp chính xác.`:`Harmony-by-measure drift: lead=${leadHarmony.slice(0,8).join(', ')} / arrangement=${arrHarmony.slice(0,8).join(', ')}`):'Lead Sheet không có chord sequence để khóa.',true));
  const leadStructure=structureSequence(leadDna),arrStructure=structureSequence(dna),structureSimilarity=sequenceLcsRatio(leadStructure,arrStructure); checks.push(check('structure-preservation','Giữ cấu trúc section',!leadStructure.length?'pass':structureSimilarity>=.9?'pass':structureSimilarity>=.75?'weak':'fail',leadStructure.length?`Section sequence similarity ${Math.round(structureSimilarity*100)}%.`:'Lead Sheet không có section marker.',true));
  const scoreIds=partIds(xml,'score-part').sort(),actualIds=partIds(xml,'part').sort(),idsUnique=new Set(scoreIds).size===scoreIds.length&&new Set(actualIds).size===actualIds.length,idsMatch=idsUnique&&scoreIds.length===actualIds.length&&scoreIds.every((id,i)=>id===actualIds[i]); checks.push(check('importer-part-ids','Part-list khớp score parts',idsMatch?'pass':'fail',idsMatch?`${actualIds.length} part id khớp và duy nhất.`:`part-list=${scoreIds.join(',')} / parts=${actualIds.join(',')} / unique=${idsUnique}`,true));
  checks.push(scoreInstrumentPairsCheck(xml)); checks.push(partCoverageCheck(xml)); checks.push(measureGridCheck(xml)); checks.push(accompanimentTextureCheck(xml,dna,'arrangement')); checks.push(unpitchedComplexityCheck(xml));
  const verse=sections(dna).find(s=>isSection(s,'verse')||isSection(s,'phiên khúc')),chorus=sections(dna).find(s=>isSection(s,'chorus')||isSection(s,'điệp khúc')),verseDensity=densityForSection(xml,verse),chorusDensity=densityForSection(xml,chorus),densityContrast=densityContrastStatus(verseDensity,chorusDensity);
  checks.push(check('section-density','Tương phản năng lượng section',densityContrast,densityContrast==='pass'?`Mật độ Verse ${verseDensity?.toFixed(1)} → Chorus ${chorusDensity?.toFixed(1)} nốt/ô.`:'Section density của bản phối còn ít tương phản.'));
  return report(checks,'Arrangement Quality Gate',{minScore:84,maxWeak:2});
}

const CRITICAL_READINESS_IDS=new Set(['chorus-hook','section-contrast','bridge-contrast','final-chorus-development','accompaniment-texture','lyrics-preservation','melody-preservation','harmony-preservation','structure-preservation','importer-part-ids','score-instrument-pairs','part-coverage','measure-grid','unpitched-complexity']);
export function buildProductionReadiness(composition:QualityReport,arrangement:QualityReport):ProductionReadinessReport {
  const score=Math.round((composition.score+arrangement.score)/2),all=[...composition.checks,...arrangement.checks];
  const isBlocker=(item:QualityCheck)=>item.status==='fail'||(CRITICAL_READINESS_IDS.has(item.id)&&item.required===true&&item.status!=='pass');
  const blockers=all.filter(isBlocker).map(item=>`${item.label}: ${item.status.toUpperCase()} — ${item.detail}`);
  const advisories=all.filter(item=>item.status==='weak'&&!isBlocker(item)).map(item=>`${item.label}: ${item.detail}`);
  if(composition.score<80)blockers.push(`Composition score ${composition.score}/100 < 80.`); if(arrangement.score<84)blockers.push(`Arrangement score ${arrangement.score}/100 < 84.`);
  const pass=composition.status==='PASS'&&arrangement.status==='PASS'&&score>=82&&blockers.length===0;
  return {status:pass?'PASS':'FAIL',label:pass?'READY FOR PRODUCTION':'QUALITY REVIEW REQUIRED',score,summary:pass?`Production-ready composition · ${score}/100 · Final MusicXML đủ điều kiện handoff.`:`Cần rà soát ${blockers.length} blocker trước production · ${score}/100.`,blockers,advisories};
}
export function buildQualityRetryFeedback(report:QualityReport):string { const issues=report.checks.filter(item=>item.status!=='pass'); if(!issues.length)return''; return ['QUALITY REVIEW FAILED. Regenerate the complete artifact; do not patch isolated notes.',...issues.map(item=>`- ${item.label}: ${item.status.toUpperCase()} — ${item.detail}`),'Preserve all locked musical identity required by the current step and return complete valid MusicXML.'].join('\n'); }
