import { evaluateCompositionQuality } from '../../src/compose/production-quality.ts';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const structure=[
 {sectionName:'Verse 1',measureStart:1,measureEnd:8},
 {sectionName:'Chorus',measureStart:9,measureEnd:16},
 {sectionName:'Bridge',measureStart:17,measureEnd:24},
 {sectionName:'Final Chorus',measureStart:25,measureEnd:32},
];
const melody:any[]=[];
function add(start:number,end:number,pitches:number[],durations:number[]){let i=0;for(let m=start;m<=end;m++)for(let n=0;n<4;n++){melody.push({midi:pitches[i%pitches.length],duration:durations[i%durations.length],measure:m});i++;}}
add(1,8,[60,61],[1,1,2,1]);
add(9,16,[64,66],[1,1,1,2]);
add(17,24,[60,62],[2,1,1,2]);
add(25,32,[64,66],[.5,.5,1,2]);
const dna:any={
 musical:{approximateDuration:190,tempoBpm:76,timeSignature:'4/4',key:'G',mode:'major'},
 lyrics:{assembledLyric:'ta trở về bên dòng sông xưa nghe mùa thu đi qua ký ức và gọi tên người'},
 structure,
 harmony:Array.from({length:32},(_,i)=>({measure:i+1,chordSymbols:[['G','D','Em','C'][i%4]]})),
 melody,
 instrumentation:[{partId:'P1',partName:'Vocal'},{partId:'P2',partName:'Piano'}],
 fingerprint:{openingMotif:['C4','Db4','C4'],chorusMotif:['E4','F#4','E4'],midiSequence:melody.map(n=>n.midi),approximateRhythmicPattern:melody.map(n=>n.duration)},
};
const list='<part-list><score-part id="P1"><part-name>Vocal</part-name></score-part><score-part id="P2"><part-name>Piano</part-name></score-part></part-list>';
const vocal=`<part id="P1">${Array.from({length:32},(_,i)=>`<measure number="${i+1}"><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><lyric><text>ta</text></lyric></note></measure>`).join('')}</part>`;
const piano=`<part id="P2">${Array.from({length:32},(_,i)=>`<measure number="${i+1}"><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note><note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration></note></measure>`).join('')}</part>`;
const xml=`<?xml version="1.0"?><score-partwise>${list}${vocal}${piano}</score-partwise>`;
const report=evaluateCompositionQuality({xml,songDna:dna,songRequest:{language:'vi',songForm:'Verse Chorus Bridge Final Chorus'}});
const range=report.checks.find(item=>item.id==='vocal-range');
assert(range?.status==='weak',`fixture must produce required weak vocal-range, got ${range?.status}`);
assert(report.status==='FAIL',`a required hard-threshold check at WEAK must fail the gate, got ${report.status}: ${report.summary}`);
console.log('PASS required-weak-gate');
