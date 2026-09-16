import { evaluateCompositionQuality } from '../../src/compose/production-quality.ts';

const note=(midi:number,measure:number,duration=1)=>({midi,measure,duration});
const dna:any={
  musical:{approximateDuration:180,timeSignature:'4/4',tempoBpm:72,key:'C',mode:'major'},
  lyrics:{assembledLyric:'đây là lời bài hát đủ dài để quality gate nhận diện phần lời hoàn chỉnh trong bài hát'},
  structure:[
    {sectionName:'Verse 1',measureStart:1,measureEnd:4},
    {sectionName:'Pre-Chorus',measureStart:5,measureEnd:8},
    {sectionName:'Chorus',measureStart:9,measureEnd:12},
    {sectionName:'Bridge',measureStart:13,measureEnd:16},
    {sectionName:'Final Chorus',measureStart:17,measureEnd:20},
  ],
  melody:[
    ...[1,2,3,4].flatMap(m=>[note(60,m),note(62,m)]),
    ...[5,6,7,8].flatMap(m=>[note(60,m),note(62,m)]),
    ...[9,10,11,12].flatMap(m=>[note(67,m,.5),note(72,m,.5),note(69,m,.5)]),
    ...[13,14,15,16].flatMap(m=>[note(64,m,1),note(65,m,.5),note(71,m,.5)]),
    ...[17,18,19,20].flatMap(m=>[note(67,m,.5),note(72,m,.25),note(74,m,.25),note(69,m,.5)]),
  ],
  fingerprint:{chorusMotif:['G4','C5','A4'],midiSequence:[60,62,67,72,69],approximateRhythmicPattern:[1,1,.5,.5,.5]},
};
const measures=Array.from({length:20},(_,i)=>`<measure number="${i+1}"><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note><note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration><type>quarter</type></note></measure>`).join('');
const xml=`<score-partwise><part-list><score-part id="P1"><part-name>Vocal</part-name></score-part><score-part id="P2"><part-name>Piano</part-name></score-part></part-list><part id="P1">${measures}</part><part id="P2">${measures}</part></score-partwise>`;
const report=evaluateCompositionQuality({xml,songDna:dna,songRequest:{language:'Vietnamese',songForm:'Verse Pre-Chorus Chorus Bridge Final Chorus'}});
const contrast=report.checks.find(x=>x.id==='section-contrast');
if(contrast?.status!=='pass') throw new Error(`Verse/Chorus contrast must use real Chorus, not Pre-Chorus: ${JSON.stringify(contrast)}`);
console.log('PASS prechorus-classification');
