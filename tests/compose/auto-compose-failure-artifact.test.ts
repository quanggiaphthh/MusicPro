import { runAutoComposition } from '../../src/compose/auto-compose.ts';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
const badXml='<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"><part-name>Vocal</part-name></score-part></part-list><part id="P1"><measure number="1"><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><lyric><text>x</text></lyric></note></measure></part></score-partwise>';
const badDna:any={musical:{approximateDuration:30,tempoBpm:76,timeSignature:'4/4',key:'C',mode:'major'},lyrics:{assembledLyric:'x'},structure:[{sectionName:'Verse',measureStart:1,measureEnd:1}],harmony:[],melody:[{midi:60,duration:1,measure:1}],instrumentation:[{partName:'Vocal'}],fingerprint:{openingMotif:['C4'],midiSequence:[60],approximateRhythmicPattern:[1]}};
const responses=[
 {songRequest:{language:'vi',songForm:'Verse Chorus'},metaPlan:'m',composePrompt:'c',arrangePrompt:'a',composeDocRefs:[],arrangeDocRefs:[],planSummary:'p',style:{displayName:'V-Pop'}},
 {xml:badXml},
 {songDNA:badDna,blueprint:{}},
];
let i=0; const fakeFetch:any=async()=>({ok:true,json:async()=>responses[i++]}); const events:any[]=[];
let rejected=false;
try { await runAutoComposition({idea:'x',styleId:'STYLE.VN.VPOP-BALLAD'},{fetchImpl:fakeFetch,maxQualityRetries:0,onEvent:e=>{events.push(e);}}); } catch { rejected=true; }
assert(rejected,'quality failure should stop before arrangement');
assert(events.some(e=>e.kind==='artifact'&&e.step===3&&e.quality?.status==='FAIL'),'last failed lead candidate must be emitted before halt so UI can preserve it');
assert(events.some(e=>e.kind==='halted'&&e.step===3),'pipeline must emit an explicit halted state');
console.log('PASS auto-compose-failure-artifact');
