import { evaluateArrangementQuality } from '../../src/compose/production-quality.ts';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m);}
const melody=Array.from({length:32},(_,i)=>({midi:60+(i%8),duration:1,measure:(i%8)+1}));
const dna:any={musical:{approximateDuration:190,tempoBpm:76,timeSignature:'4/4',key:'C',mode:'major'},lyrics:{assembledLyric:'một bài hát có lời đủ dài để kiểm tra importer measure grid'},structure:[{sectionName:'Verse',measureStart:1,measureEnd:4},{sectionName:'Chorus',measureStart:5,measureEnd:8}],harmony:Array.from({length:8},(_,i)=>({measure:i+1,chordSymbols:['C']})),melody,instrumentation:[{partName:'Vocal'},{partName:'Piano'}],fingerprint:{midiSequence:melody.map(x=>x.midi)}};
const m=(n:number)=>`<measure number="${n}"><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration></note></measure>`;
const p1=Array.from({length:8},(_,i)=>m(i+1)).join('');
const wrong=[1,2,3,4,9,10,11,12].map(m).join('');
const xml=`<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"><part-name>Vocal</part-name></score-part><score-part id="P2"><part-name>Piano</part-name></score-part></part-list><part id="P1">${p1}</part><part id="P2">${wrong}</part></score-partwise>`;
const report=evaluateArrangementQuality({xml,songDna:dna,leadDna:dna,leadXml:xml,songRequest:{}});
const grid=report.checks.find(c=>c.id==='measure-grid');
assert(grid?.status==='fail','equal measure counts with mismatched measure numbers must fail importer measure-grid check');
console.log('PASS importer-measure-grid');
