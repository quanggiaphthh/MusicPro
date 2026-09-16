import { runAutoComposition } from '../../src/compose/auto-compose.ts';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
function notes(start:number,end:number,pitches:number[],durations:number[]){const out:any[]=[];let i=0;for(let m=start;m<=end;m++)for(let n=0;n<4;n++){out.push({midi:pitches[i%pitches.length],duration:durations[i%durations.length],measure:m});i++;}return out;}
const melody=[...notes(1,8,[60,62,64,62],[1,1,2,1]),...notes(9,16,[67,69,71,69],[1,1,1,2]),...notes(17,24,[72,71,69,67],[2,1,1,2]),...notes(25,32,[67,71,72,69,67],[1,.5,.5,1,2])];
const dna:any={selectedMelodyPartId:'P1',musical:{approximateDuration:190,tempoBpm:76,timeSignature:'4/4',key:'C',mode:'major'},lyrics:{assembledLyric:'quê hương trong tôi vẫn còn nguyên một dòng sông và những mùa thương nhớ'},structure:[{sectionName:'Verse 1',measureStart:1,measureEnd:8},{sectionName:'Chorus',measureStart:9,measureEnd:16},{sectionName:'Bridge',measureStart:17,measureEnd:24},{sectionName:'Final Chorus',measureStart:25,measureEnd:32}],harmony:Array.from({length:32},(_,i)=>({measure:i+1,chordSymbols:[['C','G','Am','F'][i%4]]})),melody,instrumentation:[{partName:'Vocal'},{partName:'Piano'},{partName:'Bass'},{partName:'Strings'}],fingerprint:{openingMotif:['C4','D4','E4'],chorusMotif:['G4','A4','B4'],midiSequence:melody.map(n=>n.midi),approximateRhythmicPattern:melody.map(n=>n.duration)}};
const plist='<part-list>'+['P1:Vocal','P2:Piano','P3:Bass','P4:Strings'].map(x=>{const[id,name]=x.split(':');return`<score-part id="${id}"><part-name>${name}</part-name></score-part>`;}).join('')+'</part-list>';
const part=(id:string)=>`<part id="${id}">${Array.from({length:32},(_,i)=>`<measure number="${i+1}"><note><pitch><step>${id==='P3'?'C':'G'}</step><octave>${id==='P3'?2:4}</octave></pitch><duration>1</duration>${id==='P1'?'<lyric><text>quê</text></lyric>':''}</note>${id==='P2'?'<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>':''}</measure>`).join('')}</part>`;
const xml=`<?xml version="1.0"?><score-partwise>${plist}${part('P1')}${part('P2')}${part('P3')}${part('P4')}</score-partwise>`;
const responses=[
 {songRequest:{language:'vi',concept:'quê hương',emotion:'hoài niệm',genre:'V-Pop',songForm:'Verse Chorus Bridge Final Chorus'},metaPlan:'meta',composePrompt:'compose',arrangePrompt:'arrange',composeDocRefs:['A'],arrangeDocRefs:['B'],planSummary:'plan',style:{id:'STYLE.VN.VPOP-BALLAD',displayName:'V-Pop Ballad'}},
 {xml},{songDNA:dna,blueprint:{identity:{genre:'V-Pop'},harmony:[],lyrics:{exactLyrics:dna.lyrics.assembledLyric},structure:[],arrangement:{instruments:['Vocal','Piano']}}},
 {xml},{songDNA:dna,blueprint:{identity:{genre:'V-Pop'},harmony:[],lyrics:{exactLyrics:dna.lyrics.assembledLyric},structure:[],arrangement:{instruments:['Vocal','Piano','Bass','Strings']}}},
];
let index=0; const fakeFetch:any=async()=>({ok:true,json:async()=>responses[index++]}); const events:any[]=[];
const result=await runAutoComposition({idea:'quê hương',styleId:'STYLE.VN.VPOP-BALLAD'},{fetchImpl:fakeFetch,onEvent:event=>{events.push(event);},maxQualityRetries:0});
assert(result.finalXml===xml,'must return arrangement');
assert(events.some(e=>e.kind==='step-summary'&&e.step===1),'step1 summary');
assert(events.some(e=>e.kind==='step-summary'&&e.step===2),'step2 summary');
assert(events.some(e=>e.kind==='artifact'&&e.step===3),'lead artifact');
assert(events.some(e=>e.kind==='artifact'&&e.step===4),'arrangement artifact');
assert(events[events.length-1].kind==='complete','last event complete');
console.log('PASS auto-compose');
