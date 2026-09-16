import { evaluateCompositionQuality } from '../../src/compose/production-quality.ts';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const structure=[{sectionName:'Intro',measureStart:1,measureEnd:4},{sectionName:'Verse 1',measureStart:5,measureEnd:12},{sectionName:'Chorus',measureStart:13,measureEnd:20},{sectionName:'Bridge',measureStart:21,measureEnd:24},{sectionName:'Final Chorus',measureStart:25,measureEnd:32}];
const melody:any[]=[];for(let m=5;m<=32;m++)for(let i=0;i<4;i++)melody.push({midi:60+((m+i)%12),duration:i%2?1:2,measure:m});
const dna:any={musical:{approximateDuration:190,tempoBpm:76,timeSignature:'4/4',key:'C',mode:'major'},lyrics:{assembledLyric:'quê hương trong tôi vẫn còn nguyên một dòng sông và những mùa thương nhớ'},structure,melody,fingerprint:{chorusMotif:['G4','A4','B4'],midiSequence:melody.map(x=>x.midi),approximateRhythmicPattern:melody.map(x=>x.duration)},instrumentation:[{partName:'Vocal'},{partName:'Piano'}]};
const plist='<part-list><score-part id="P1"><part-name>Vocal</part-name></score-part><score-part id="P2"><part-name>Piano</part-name></score-part></part-list>';
const vocal=`<part id="P1">${Array.from({length:32},(_,i)=>`<measure number="${i+1}"><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><lyric><text>quê</text></lyric></note></measure>`).join('')}</part>`;
const piano=`<part id="P2">${Array.from({length:32},(_,i)=>{const n=i+1;return `<measure number="${n}">${n<=4?'<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>'.repeat(4):'<note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note>'}</measure>`}).join('')}</part>`;
const xml=`<score-partwise>${plist}${vocal}${piano}</score-partwise>`;
const report=evaluateCompositionQuality({xml,songDna:dna,songRequest:{language:'vi',songForm:'Intro Verse Chorus Bridge Final Chorus'}});
const texture=report.checks.find(x=>x.id==='accompaniment-texture');
assert(texture?.status==='fail',`dense Intro must not hide whole-note pad in sung sections, got ${texture?.status}: ${texture?.detail}`);
console.log('PASS sung-section-texture');
