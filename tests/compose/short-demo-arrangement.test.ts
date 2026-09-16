import { evaluateArrangementQuality, evaluateCompositionQuality } from '../../src/compose/production-quality.ts';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m);}
const melody=[...Array.from({length:16},(_,i)=>({midi:60+(i%4),duration:1,measure:(i%4)+1})),...Array.from({length:16},(_,i)=>({midi:67+(i%6),duration:i%2?1:0.5,measure:5+(i%4)}))];
const dna:any={musical:{approximateDuration:60,tempoBpm:100,timeSignature:'4/4',key:'C',mode:'major'},lyrics:{assembledLyric:'demo ngắn nhưng đầy đủ ý tưởng âm nhạc cho bài hát'},structure:[{sectionName:'Verse',measureStart:1,measureEnd:4},{sectionName:'Chorus',measureStart:5,measureEnd:8}],harmony:Array.from({length:8},(_,i)=>({measure:i+1,chordSymbols:['C']})),melody,instrumentation:[{partName:'Vocal'},{partName:'Piano'}],fingerprint:{chorusMotif:['G4','A4','B4'],midiSequence:melody.map(x=>x.midi)}};
const measure=(n:number,id:string)=>`<measure number="${n}"><note><pitch><step>${id==='P1'?'C':'E'}</step><octave>4</octave></pitch><duration>1</duration></note><note><pitch><step>${id==='P1'?'D':'G'}</step><octave>4</octave></pitch><duration>1</duration></note></measure>`;
const xml=`<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"><part-name>Vocal</part-name></score-part><score-part id="P2"><part-name>Piano</part-name></score-part></part-list><part id="P1">${Array.from({length:8},(_,i)=>measure(i+1,'P1')).join('')}</part><part id="P2">${Array.from({length:8},(_,i)=>measure(i+1,'P2')).join('')}</part></score-partwise>`;
const composition=evaluateCompositionQuality({xml,songDna:dna,songRequest:{songForm:'short demo'}});
assert(composition.status==='PASS',`short/demo composition must use short-form quality contract; got ${composition.status}: ${composition.summary}`);
const report=evaluateArrangementQuality({xml,songDna:dna,leadDna:dna,leadXml:xml,songRequest:{songForm:'short demo'}});
const duration=report.checks.find(c=>c.id==='duration');
assert(duration?.status==='pass','short/demo arrangement must not fail the 150-second completeness rule');
const inst=report.checks.find(c=>c.id==='instrumentation');
assert(inst?.required!==true,'sparse instrumentation depth must be advisory, not a production blocker');
console.log('PASS short-demo-arrangement');
