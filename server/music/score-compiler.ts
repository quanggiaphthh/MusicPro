import {
  measureTicksForFrame,
  validateSongCore,
  type AccompanimentTexture,
  type HarmonyEvent,
  type HarmonyKind,
  type SectionAccompanimentIntent,
  type SongCorePitch,
  type SongCoreV1,
  type VocalEvent,
} from './song-core.ts';

export interface RealizedPianoEvent {
  tick: number;
  duration: number;
  pitches: SongCorePitch[];
}

export interface RealizedPianoMeasure {
  number: number;
  sectionId: string;
  events: RealizedPianoEvent[];
}

export interface RealizedPianoPart {
  measures: RealizedPianoMeasure[];
}

const STEP_TO_PC:Record<string,number>={C:0,D:2,E:4,F:5,G:7,A:9,B:11};
const PC_TO_SHARP:Array<{step:SongCorePitch['step'];alter:-1|0|1}>=[
  {step:'C',alter:0},{step:'C',alter:1},{step:'D',alter:0},{step:'D',alter:1},
  {step:'E',alter:0},{step:'F',alter:0},{step:'F',alter:1},{step:'G',alter:0},
  {step:'G',alter:1},{step:'A',alter:0},{step:'A',alter:1},{step:'B',alter:0},
];

function escapeXml(value:unknown):string {
  return String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

function mod(n:number,m:number):number { return ((n%m)+m)%m; }
function rootPc(h:HarmonyEvent):number { return mod(STEP_TO_PC[h.rootStep]+h.rootAlter,12); }

function chordIntervals(kind:HarmonyKind):number[] {
  switch(kind){
    case 'major': return [0,4,7];
    case 'minor': return [0,3,7];
    case 'dominant7': return [0,4,7,10];
    case 'major7': return [0,4,7,11];
    case 'minor7': return [0,3,7,10];
    case 'sus2': return [0,2,7];
    case 'sus4': return [0,5,7];
    case 'diminished': return [0,3,6];
    case 'half-diminished': return [0,3,6,10];
  }
}

function midiToPitch(midi:number):SongCorePitch {
  const spelling=PC_TO_SHARP[mod(midi,12)];
  return {step:spelling.step,alter:spelling.alter,octave:Math.floor(midi/12)-1};
}

function chooseBassMidi(harmony:HarmonyEvent):number {
  const bassPc=harmony.bassStep ? mod(STEP_TO_PC[harmony.bassStep]+(harmony.bassAlter||0),12) : rootPc(harmony);
  let midi=36+bassPc; // C2..B2
  if(midi<36) midi+=12;
  if(midi>47) midi-=12;
  return midi;
}

function chordCandidates(harmony:HarmonyEvent):number[][] {
  const pcs=chordIntervals(harmony.kind).map(interval=>mod(rootPc(harmony)+interval,12));
  const base=pcs.map(pc=>{
    let midi=48+pc; // C3..B3
    if(midi<48) midi+=12;
    return midi;
  }).sort((a,b)=>a-b);
  const inversions:number[][]=[];
  for(let i=0;i<Math.min(base.length,4);i++){
    const inv=[...base];
    for(let j=0;j<i;j++) inv[j]+=12;
    inv.sort((a,b)=>a-b);
    while(inv[inv.length-1]>72) inv.forEach((_,idx)=>{ if(inv[idx]>60) inv[idx]-=12; });
    inv.sort((a,b)=>a-b);
    inversions.push(inv);
  }
  return inversions;
}

function voicingDistance(a:number[]|undefined,b:number[]):number {
  if(!a?.length) return b.reduce((sum,n)=>sum+Math.abs(n-60),0);
  const count=Math.min(a.length,b.length);
  let score=0;
  for(let i=0;i<count;i++) score+=Math.abs(a[i]-b[i]);
  score+=Math.abs(a.length-b.length)*6;
  return score;
}

function chooseRhVoicing(harmony:HarmonyEvent,previous:number[]|undefined):number[] {
  const candidates=chordCandidates(harmony);
  return candidates.sort((a,b)=>voicingDistance(previous,a)-voicingDistance(previous,b))[0];
}

function attackTicks(texture:AccompanimentTexture,density:number,barTicks:number,divisions:number):number[] {
  const q=divisions;
  const eighth=Math.max(1,Math.round(divisions/2));
  let ticks:number[];
  switch(texture){
    case 'block': ticks=[0,Math.floor(barTicks/2)]; break;
    case 'half-pulse': ticks=Array.from({length:Math.ceil(barTicks/q)},(_,i)=>i*q); break;
    case 'broken-8th': ticks=Array.from({length:Math.ceil(barTicks/eighth)},(_,i)=>i*eighth); break;
    case 'syncopated-pop': {
      ticks=Array.from({length:Math.ceil(barTicks/q)},(_,i)=>i*q);
      if(density>=3) ticks.push(...ticks.map(t=>t+Math.round(q*0.75)));
      break;
    }
  }
  return [...new Set(ticks.filter(t=>t>=0&&t<barTicks).map(Math.round))].sort((a,b)=>a-b);
}

function intentForSection(core:SongCoreV1,sectionId:string):SectionAccompanimentIntent {
  return core.accompaniment.find(a=>a.sectionId===sectionId) || {sectionId,texture:'half-pulse',density:2,register:'mid',energy:3};
}

function harmonyAtTick(events:HarmonyEvent[],tick:number,carried:HarmonyEvent):HarmonyEvent {
  let selected=carried;
  for(const event of [...events].sort((a,b)=>a.tick-b.tick)){
    if(event.tick<=tick) selected=event; else break;
  }
  return selected;
}

export function realizePiano(core:SongCoreV1):RealizedPianoPart {
  const validation=validateSongCore(core);
  if(!validation.ok) throw new Error(`SONGCORE_INVALID:${validation.errors.map(e=>e.code).join(',')}`);
  const barTicks=measureTicksForFrame(core.frame);
  let carried:HarmonyEvent={tick:0,rootStep:(core.frame.key.tonic[0]?.toUpperCase() as any)||'C',rootAlter:core.frame.key.tonic.includes('#')?1:core.frame.key.tonic.includes('b')?-1:0,kind:core.frame.key.mode==='minor'?'minor':'major'};
  let previousVoicing:number[]|undefined;
  const measures:RealizedPianoMeasure[]=[];

  for(const measure of core.measures){
    const sortedHarmony=[...(measure.harmony||[])].sort((a,b)=>a.tick-b.tick);
    if(sortedHarmony.length && sortedHarmony[0].tick===0) carried=sortedHarmony[0];
    const intent=intentForSection(core,measure.sectionId);
    const ticks=new Set(attackTicks(intent.texture,intent.density,barTicks,core.frame.divisions));
    for(const harmony of sortedHarmony) ticks.add(harmony.tick);
    ticks.add(0);
    const ordered=[...ticks].filter(t=>t>=0&&t<barTicks).sort((a,b)=>a-b);
    const events:RealizedPianoEvent[]=[];
    for(let i=0;i<ordered.length;i++){
      const tick=ordered[i];
      const next=ordered[i+1]??barTicks;
      if(next<=tick) continue;
      const harmony=harmonyAtTick(sortedHarmony,tick,carried);
      const rh=chooseRhVoicing(harmony,previousVoicing);
      previousVoicing=rh;
      const bass=chooseBassMidi(harmony);
      const pitches=[midiToPitch(bass),...rh.map(midiToPitch)];
      events.push({tick,duration:next-tick,pitches});
      carried=harmony;
    }
    if(sortedHarmony.length) carried=sortedHarmony[sortedHarmony.length-1];
    measures.push({number:measure.number,sectionId:measure.sectionId,events});
  }
  return {measures};
}

function keyFifths(tonic:string,mode:'major'|'minor'):number {
  const normalized=tonic.replace('♯','#').replace('♭','b');
  const major:Record<string,number>={Cb:-7,Gb:-6,Db:-5,Ab:-4,Eb:-3,Bb:-2,F:-1,C:0,G:1,D:2,A:3,E:4,B:5,'F#':6,'C#':7};
  const minor:Record<string,number>={Ab:-7,Eb:-6,Bb:-5,F:-4,C:-3,G:-2,D:-1,A:0,E:1,B:2,'F#':3,'C#':4,'G#':5,'D#':6,'A#':7};
  return (mode==='minor'?minor:major)[normalized] ?? 0;
}

function durationNotation(duration:number,divisions:number):{type:string;dots:number} {
  const candidates=[
    {ticks:divisions*4,type:'whole',dots:0},
    {ticks:divisions*3,type:'half',dots:1},
    {ticks:divisions*2,type:'half',dots:0},
    {ticks:divisions*1.5,type:'quarter',dots:1},
    {ticks:divisions,type:'quarter',dots:0},
    {ticks:divisions*.75,type:'eighth',dots:1},
    {ticks:divisions*.5,type:'eighth',dots:0},
    {ticks:divisions*.25,type:'16th',dots:0},
    {ticks:divisions*.125,type:'32nd',dots:0},
  ];
  const exact=candidates.find(c=>Math.round(c.ticks)===duration);
  if(exact) return {type:exact.type,dots:exact.dots};
  const nearest=[...candidates].sort((a,b)=>Math.abs(a.ticks-duration)-Math.abs(b.ticks-duration))[0];
  return {type:nearest.type,dots:0};
}

function pitchXml(pitch:SongCorePitch):string {
  return `<pitch><step>${pitch.step}</step>${pitch.alter?`<alter>${pitch.alter}</alter>`:''}<octave>${pitch.octave}</octave></pitch>`;
}

function noteXml(options:{pitch?:SongCorePitch;rest?:boolean;duration:number;voice?:number;staff?:number;chord?:boolean;lyric?:string;lyricExtend?:boolean;tie?:'start'|'stop'} ,divisions:number):string {
  const notation=durationNotation(options.duration,divisions);
  const head=options.chord?'<chord/>':'';
  const body=options.rest?'<rest/>':pitchXml(options.pitch!);
  const tie=options.tie?`<tie type="${options.tie}"/>`:'';
  const staff=options.staff?`<staff>${options.staff}</staff>`:'';
  const tiedNotation=options.tie?`<notations><tied type="${options.tie}"/></notations>`:'';
  const lyric=options.lyric!==undefined ? `<lyric><text>${escapeXml(options.lyric)}</text>${options.lyricExtend?'<extend/>':''}</lyric>` : (options.lyricExtend?'<lyric><extend/></lyric>':'');
  return `<note>${head}${body}<duration>${options.duration}</duration>${tie}<voice>${options.voice||1}</voice><type>${notation.type}</type>${'<dot/>'.repeat(notation.dots)}${staff}${tiedNotation}${lyric}</note>`;
}

function harmonyKindXml(kind:HarmonyKind):string {
  const map:Record<HarmonyKind,string>={
    major:'major', minor:'minor', dominant7:'dominant', major7:'major-seventh', minor7:'minor-seventh',
    sus2:'suspended-second', sus4:'suspended-fourth', diminished:'diminished', 'half-diminished':'half-diminished',
  };
  return map[kind];
}

function harmonyXml(harmony:HarmonyEvent):string {
  const rootAlter=harmony.rootAlter?`<root-alter>${harmony.rootAlter}</root-alter>`:'';
  const bass=harmony.bassStep?`<bass><bass-step>${harmony.bassStep}</bass-step>${harmony.bassAlter?`<bass-alter>${harmony.bassAlter}</bass-alter>`:''}</bass>`:'';
  const offset=harmony.tick>0?`<offset>${harmony.tick}</offset>`:'';
  return `<harmony><root><root-step>${harmony.rootStep}</root-step>${rootAlter}</root><kind>${harmonyKindXml(harmony.kind)}</kind>${bass}${offset}</harmony>`;
}

function filledVocalEvents(events:VocalEvent[],barTicks:number):VocalEvent[] {
  const sorted=[...events].sort((a,b)=>a.tick-b.tick);
  const out:VocalEvent[]=[];
  let cursor=0;
  for(const event of sorted){
    if(event.tick>cursor) out.push({tick:cursor,duration:event.tick-cursor,rest:true});
    out.push(event);
    cursor=Math.max(cursor,event.tick+event.duration);
  }
  if(cursor<barTicks) out.push({tick:cursor,duration:barTicks-cursor,rest:true});
  return out;
}

function attributesXml(core:SongCoreV1,part:'vocal'|'piano'):string {
  const clef=part==='vocal'
    ? '<clef><sign>G</sign><line>2</line></clef>'
    : '<staves>2</staves><clef number="1"><sign>G</sign><line>2</line></clef><clef number="2"><sign>F</sign><line>4</line></clef>';
  return `<attributes><divisions>${core.frame.divisions}</divisions><key><fifths>${keyFifths(core.frame.key.tonic,core.frame.key.mode)}</fifths><mode>${core.frame.key.mode}</mode></key><time><beats>${core.frame.meter.beats}</beats><beat-type>${core.frame.meter.beatType}</beat-type></time>${clef}</attributes>`;
}

function tempoXml(bpm:number):string {
  return `<direction placement="above"><direction-type><metronome><beat-unit>quarter</beat-unit><per-minute>${bpm}</per-minute></metronome></direction-type><sound tempo="${bpm}"/></direction>`;
}

function rehearsalXml(label:string):string {
  return `<direction placement="above"><direction-type><rehearsal>${escapeXml(label)}</rehearsal></direction-type></direction>`;
}

export function compileSongCoreToMusicXml(core:SongCoreV1):string {
  const validation=validateSongCore(core);
  if(!validation.ok) throw new Error(`SONGCORE_INVALID:${validation.errors.map(e=>e.code).join(',')}`);
  const piano=realizePiano(core);
  const pianoByMeasure=new Map(piano.measures.map(m=>[m.number,m]));
  const sectionByStart=new Map(core.sections.map(section=>[section.startMeasure,section]));
  const barTicks=measureTicksForFrame(core.frame);

  const vocalMeasures=core.measures.map(measure=>{
    const startSection=sectionByStart.get(measure.number);
    const prefix=`${measure.number===1?attributesXml(core,'vocal')+tempoXml(core.frame.tempoBpm):''}${startSection?rehearsalXml(startSection.label):''}${[...(measure.harmony||[])].sort((a,b)=>a.tick-b.tick).map(harmonyXml).join('')}`;
    const notes=filledVocalEvents(measure.vocal||[],barTicks).map(event=>noteXml({pitch:event.pitch,rest:event.rest,duration:event.duration,voice:1,staff:1,lyric:event.lyric,lyricExtend:event.lyricExtend,tie:event.tie},core.frame.divisions)).join('');
    return `<measure number="${measure.number}">${prefix}${notes}</measure>`;
  }).join('');

  const pianoMeasures=core.measures.map(measure=>{
    const realized=pianoByMeasure.get(measure.number)!;
    let upperNotes='';
    let lowerNotes='';
    for(const event of realized.events){
      const [bass,...rightHand]=event.pitches;
      // Keep each chord on one voice/staff. MusicXML <chord/> is only valid when it
      // follows a note in the same voice/staff; the lower staff is therefore emitted
      // as a separate voice after backing up one complete measure.
      rightHand.forEach((pitch,index)=>{
        upperNotes+=noteXml({pitch,duration:event.duration,voice:1,staff:1,chord:index>0},core.frame.divisions);
      });
      if(bass) lowerNotes+=noteXml({pitch:bass,duration:event.duration,voice:2,staff:2},core.frame.divisions);
    }
    const backup=lowerNotes?`<backup><duration>${barTicks}</duration></backup>`:'';
    const notes=`${upperNotes}${backup}${lowerNotes}`;
    return `<measure number="${measure.number}">${measure.number===1?attributesXml(core,'piano'):''}${notes}</measure>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>`+
    `<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">`+
    `<score-partwise version="4.0"><work><work-title>${escapeXml(core.title)}</work-title></work>`+
    `<part-list>`+
    `<score-part id="P1"><part-name>Vocal</part-name><score-instrument id="P1-I1"><instrument-name>Voice</instrument-name></score-instrument><midi-instrument id="P1-I1"><midi-channel>1</midi-channel><midi-program>54</midi-program></midi-instrument></score-part>`+
    `<score-part id="P2"><part-name>Piano</part-name><score-instrument id="P2-I1"><instrument-name>Piano</instrument-name></score-instrument><midi-instrument id="P2-I1"><midi-channel>2</midi-channel><midi-program>1</midi-program></midi-instrument></score-part>`+
    `</part-list><part id="P1">${vocalMeasures}</part><part id="P2">${pianoMeasures}</part></score-partwise>`;
}
