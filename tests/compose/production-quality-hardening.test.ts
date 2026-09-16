import { evaluateArrangementQuality, evaluateCompositionQuality } from '../../src/compose/production-quality.ts';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const melody=Array.from({length:160},(_,i)=>({midi:60+(i%8),duration:i%3===0?2:1,measure:1+Math.floor(i/5)}));
const base:any={musical:{approximateDuration:190,tempoBpm:76,timeSignature:'4/4',key:'C',mode:'major'},lyrics:{assembledLyric:'quê hương trong tôi vẫn còn nguyên một dòng sông và những mùa thương nhớ'},structure:[{sectionName:'Verse 1',measureStart:1,measureEnd:8},{sectionName:'Chorus',measureStart:9,measureEnd:16},{sectionName:'Bridge',measureStart:17,measureEnd:24},{sectionName:'Final Chorus',measureStart:25,measureEnd:32}],harmony:Array.from({length:32},(_,i)=>({measure:i+1,chordSymbols:[['C','G','Am','F'][i%4]]})),melody,fingerprint:{chorusMotif:['G4','A4','B4'],midiSequence:melody.map(n=>n.midi),approximateRhythmicPattern:melody.map(n=>n.duration)}};
const plist='<part-list><score-part id="P1"><part-name>Vocal</part-name></score-part><score-part id="P2"><part-name>Piano</part-name></score-part><score-part id="P3"><part-name>Guitar</part-name></score-part><score-part id="P4"><part-name>Bass</part-name></score-part><score-part id="P5"><part-name>Drums</part-name></score-part></part-list>';
const vocal=`<part id="P1">${Array.from({length:32},(_,i)=>`<measure number="${i+1}"><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><lyric><text>quê</text></lyric></note></measure>`).join('')}</part>`;
const wholePiano=`<part id="P2">${Array.from({length:32},(_,i)=>`<measure number="${i+1}"><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type></note></measure>`).join('')}</part>`;
const guitar=`<part id="P3">${Array.from({length:32},(_,i)=>`<measure number="${i+1}">${'<note><pitch><step>G</step><octave>3</octave></pitch><duration>1</duration></note>'.repeat(4)}</measure>`).join('')}</part>`;
const bass=`<part id="P4">${Array.from({length:32},(_,i)=>`<measure number="${i+1}"><note><pitch><step>C</step><octave>2</octave></pitch><duration>1</duration></note></measure>`).join('')}</part>`;
const drums=`<part id="P5">${Array.from({length:32},(_,i)=>`<measure number="${i+1}">${['D1','D2','D3'].map((id,j)=>`<note><unpitched><display-step>C</display-step><display-octave>5</display-octave></unpitched><instrument id="${id}"/><duration>1</duration></note>`).join('')}</measure>`).join('')}</part>`;
const compXml=`<score-partwise>${plist}${vocal}${wholePiano}</score-partwise>`;
const comp=evaluateCompositionQuality({xml:compXml,songDna:{...base,instrumentation:[{partName:'Vocal'},{partName:'Piano'}]},songRequest:{language:'vi',songForm:'Verse Chorus Bridge Final Chorus'}});
assert(comp.checks.find(x=>x.id==='accompaniment-texture')?.status==='fail','whole-note dominant piano must fail Step 3 texture gate');
const arrXml=`<score-partwise>${plist}${vocal}${wholePiano}${guitar}${bass}${drums}</score-partwise>`;
const arr=evaluateArrangementQuality({xml:arrXml,songDna:{...base,instrumentation:[{partName:'Vocal'},{partName:'Piano'},{partName:'Guitar'},{partName:'Bass'},{partName:'Drums'}]},leadDna:base,leadXml:compXml,songRequest:{language:'vi'}});
assert(arr.checks.find(x=>x.id==='accompaniment-texture')?.status==='pass','Step 4 may pass when another pitched groove layer carries rhythm');
assert(arr.checks.find(x=>x.id==='unpitched-complexity')?.status==='fail','complex unpitched kit must be a required fail');
console.log('PASS production-quality-hardening');
