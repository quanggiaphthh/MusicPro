import { buildProductionReadiness, evaluateArrangementQuality, evaluateCompositionQuality } from '../../src/compose/production-quality.ts';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

const sections=[
  {sectionName:'Verse 1',measureStart:1,measureEnd:8},
  {sectionName:'Chorus',measureStart:9,measureEnd:16},
  {sectionName:'Bridge',measureStart:17,measureEnd:24},
  {sectionName:'Final Chorus',measureStart:25,measureEnd:32},
];
const melody=[] as any[];
function pushSection(start:number,end:number,pitches:number[],durations:number[]){let i=0;for(let m=start;m<=end;m++)for(let n=0;n<4;n++){melody.push({midi:pitches[i%pitches.length],duration:durations[i%durations.length],measure:m});i++;}}
pushSection(1,8,[60,62,64,62],[1,1,2,1]);
pushSection(9,16,[67,69,71,69],[1,1,1,2]);
pushSection(17,24,[72,71,69,67],[2,1,1,2]);
pushSection(25,32,[67,69,71,69],[1,1,1,2]);
const leadDna:any={
  musical:{approximateDuration:190,tempoBpm:76,timeSignature:'4/4',key:'G',mode:'major'},
  lyrics:{assembledLyric:'ta trở về bên dòng sông xưa nghe mùa thu đi qua ký ức và gọi tên người'},
  structure:sections,
  harmony:Array.from({length:32},(_,i)=>({measure:i+1,chordSymbols:[['G','D','Em','C'][i%4]]})),
  melody,
  instrumentation:[{partName:'Vocal'},{partName:'Piano'}],
  fingerprint:{openingMotif:['G4','A4','B4'],chorusMotif:['D5','E5','D5'],midiSequence:melody.map(n=>n.midi),approximateRhythmicPattern:melody.map(n=>n.duration)},
};
const changedHarmonyDna:any={...leadDna,harmony:Array.from({length:32},(_,i)=>({measure:i+1,chordSymbols:[['Am','F','C','G'][i%4]]})),instrumentation:[{partName:'Vocal'},{partName:'Piano'},{partName:'Bass'},{partName:'Strings'}]};
const scrambledLyricsDna:any={...changedHarmonyDna,harmony:leadDna.harmony,lyrics:{assembledLyric:'người tên gọi và ức ký qua đi thu mùa nghe xưa sông dòng bên về trở ta'}};
const xml=`<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"><part-name>Vocal</part-name></score-part><score-part id="P2"><part-name>Piano</part-name></score-part><score-part id="P3"><part-name>Bass</part-name></score-part><score-part id="P4"><part-name>Strings</part-name></score-part></part-list>${['P1','P2','P3','P4'].map((id,pi)=>`<part id="${id}">${Array.from({length:32},(_,i)=>`<measure number="${i+1}"><note><pitch><step>${pi===0?'G':'C'}</step><octave>${pi===2?2:4}</octave></pitch><duration>1</duration>${pi===0?'<lyric><text>ta</text></lyric>':''}</note><note><pitch><step>D</step><octave>4</octave></pitch><duration>1</duration></note></measure>`).join('')}</part>`).join('')}</score-partwise>`;

const composition=evaluateCompositionQuality({xml,songDna:leadDna,songRequest:{language:'vi',songForm:'Verse Chorus Bridge Final Chorus'}});
const finalDev=composition.checks.find(c=>c.id==='final-chorus-development');
assert(finalDev && finalDev.status !== 'pass','identical first/final chorus must not automatically pass development');

const harmonyDrift=evaluateArrangementQuality({xml,songDna:changedHarmonyDna,leadDna,leadXml:xml,songRequest:{language:'vi'}});
assert(harmonyDrift.checks.some(c=>c.id==='harmony-preservation' && c.status==='fail'),'changed harmonic progression must fail locked harmony preservation');
assert(harmonyDrift.status==='FAIL','harmony drift must fail arrangement gate');

const lyricOrder=evaluateArrangementQuality({xml,songDna:scrambledLyricsDna,leadDna,leadXml:xml,songRequest:{language:'vi'}});
assert(lyricOrder.checks.some(c=>c.id==='lyrics-preservation' && c.status!=='pass'),'same words in wrong order must not pass lyric preservation');

const readiness=buildProductionReadiness(composition,harmonyDrift) as any;
assert(Array.isArray(readiness.blockers),'production readiness must expose machine-readable blockers');
assert(readiness.blockers.length>0,'failed readiness must explain blockers');
console.log('PASS production-quality-strict');
