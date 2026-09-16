import { buildProductionReadiness, evaluateArrangementQuality, evaluateCompositionQuality } from '../../src/compose/production-quality.ts';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

function sectionNotes(start:number,end:number,pitches:number[],durations:number[]){
  const out:any[]=[]; let idx=0; for(let m=start;m<=end;m++) for(let n=0;n<4;n++){out.push({midi:pitches[idx%pitches.length],duration:durations[idx%durations.length],measure:m});idx++;} return out;
}
const leadMelody=[
  ...sectionNotes(1,8,[60,62,64,62],[1,1,2,1]),
  ...sectionNotes(9,12,[62,64,65,67],[1,1,1,1]),
  ...sectionNotes(13,20,[67,69,71,69],[1,1,1,2]),
  ...sectionNotes(21,28,[60,62,65,64],[1,2,1,1]),
  ...sectionNotes(29,36,[67,69,71,69],[1,1,1,2]),
  ...sectionNotes(37,44,[72,71,69,67],[2,1,1,2]),
  ...sectionNotes(45,56,[67,71,72,69,67],[1,.5,.5,1,2]),
  ...sectionNotes(57,60,[64,62,60],[2,2,1]),
];
const leadDna:any={
  musical:{approximateDuration:190,tempoBpm:76,timeSignature:'4/4',key:'G',mode:'major'},
  lyrics:{assembledLyric:'Ta trở về bên dòng sông xưa nghe mùa thu đi qua ký ức và gọi tên người'},
  structure:[{sectionName:'Verse 1',measureStart:1,measureEnd:8},{sectionName:'Pre-Chorus',measureStart:9,measureEnd:12},{sectionName:'Chorus',measureStart:13,measureEnd:20},{sectionName:'Verse 2',measureStart:21,measureEnd:28},{sectionName:'Chorus 2',measureStart:29,measureEnd:36},{sectionName:'Bridge',measureStart:37,measureEnd:44},{sectionName:'Final Chorus',measureStart:45,measureEnd:56},{sectionName:'Outro',measureStart:57,measureEnd:60}],
  harmony:Array.from({length:60},(_,i)=>({measure:i+1,chordSymbols:[['G','D','Em','C'][i%4]]})),
  melody:leadMelody,
  instrumentation:[{partId:'P1',partName:'Vocal'},{partId:'P2',partName:'Piano'}],
  fingerprint:{openingMotif:['G4','A4','B4','D5','B4'],chorusMotif:['D5','E5','F#5','E5'],midiSequence:leadMelody.map(n=>n.midi),approximateRhythmicPattern:leadMelody.map(n=>n.duration)},
};
const arrDna:any={...leadDna,instrumentation:[{partName:'Vocal'},{partName:'Piano'},{partName:'Bass'},{partName:'Strings'},{partName:'Drums'}]};
const measure=(num:number,part:string,extra=false)=>`<measure number="${num}"><note><pitch><step>${part==='P3'?'G':part==='P4'?'B':'D'}</step><octave>${part==='P3'?2:4}</octave></pitch><duration>1</duration>${part==='P1'?'<lyric><text>Ta</text></lyric>':''}</note>${part==='P2'||extra?'<note><pitch><step>G</step><octave>4</octave></pitch><duration>1</duration></note>':''}</measure>`;
const part=(id:string,arranged=false)=>`<part id="${id}">${Array.from({length:60},(_,i)=>measure(i+1,id,arranged && i+1>=13 && i+1<=20)).join('')}</part>`;
const listLead='<part-list><score-part id="P1"><part-name>Vocal</part-name></score-part><score-part id="P2"><part-name>Piano</part-name></score-part></part-list>';
const listArr='<part-list><score-part id="P1"><part-name>Vocal</part-name></score-part><score-part id="P2"><part-name>Piano</part-name></score-part><score-part id="P3"><part-name>Bass</part-name></score-part><score-part id="P4"><part-name>Strings</part-name></score-part><score-part id="P5"><part-name>Drums</part-name></score-part></part-list>';
const leadXml=`<?xml version="1.0"?><score-partwise>${listLead}${part('P1')}${part('P2')}</score-partwise>`;
const arrXml=`<?xml version="1.0"?><score-partwise>${listArr}${part('P1',true)}${part('P2',true)}${part('P3',true)}${part('P4',true)}${part('P5',true)}</score-partwise>`;

const composition=evaluateCompositionQuality({xml:leadXml,songDna:leadDna,songRequest:{language:'vi',songForm:'Verse Pre Chorus Verse Chorus Bridge Final Chorus Outro'}});
assert(composition.status==='PASS',`expected composition PASS, got ${composition.status}: ${composition.summary}`);
assert(composition.checks.some(c=>c.id==='chorus-hook'&&c.status==='pass'),'chorus hook must pass');
assert(composition.checks.some(c=>c.id==='final-chorus-development'&&c.status==='pass'),'final chorus development must pass');
const arrangement=evaluateArrangementQuality({xml:arrXml,songDna:arrDna,leadDna,leadXml,songRequest:{language:'vi'}});
assert(arrangement.status==='PASS',`expected arrangement PASS, got ${arrangement.status}: ${arrangement.summary}`);
assert(arrangement.checks.some(c=>c.id==='identity-key'&&c.status==='pass'),'key identity must pass');
assert(arrangement.checks.some(c=>c.id==='harmony-preservation'&&c.status==='pass'),'harmony identity must pass');
assert(arrangement.checks.some(c=>c.id==='part-coverage'&&c.status==='pass'),'all arrangement parts must cover score');
const readiness=buildProductionReadiness(composition,arrangement);
assert(readiness.status==='PASS',`readiness must pass: ${readiness.blockers.join('; ')}`);
assert(readiness.label==='READY FOR PRODUCTION','readiness label');
const shortDna={...leadDna,musical:{...leadDna.musical,approximateDuration:90}};
const shortReport=evaluateCompositionQuality({xml:leadXml,songDna:shortDna,songRequest:{language:'vi'}});
assert(shortReport.status==='FAIL','short non-demo song must fail quality gate');
console.log('PASS production-quality');
