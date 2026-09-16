import { runArrangementProduction } from '../../src/compose/arrangement-production-run.ts';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const melody:any[]=[];
function addSection(start:number,end:number,pitches:number[],durations:number[]){let i=0;for(let m=start;m<=end;m++)for(let n=0;n<4;n++){melody.push({midi:pitches[i%pitches.length],duration:durations[i%durations.length],measure:m});i++;}}
addSection(1,8,[60,62,64,62],[1,1,2,1]);
addSection(9,16,[67,69,71,69],[1,1,1,2]);
addSection(17,24,[72,71,69,67],[2,1,1,2]);
addSection(25,32,[67,71,72,69,67],[1,.5,.5,1,2]);
const dna:any={selectedMelodyPartId:'P1',musical:{approximateDuration:190,tempoBpm:76,timeSignature:'4/4',key:'C',mode:'major'},lyrics:{assembledLyric:'quê hương trong tôi vẫn còn nguyên một dòng sông và những mùa thương nhớ'},structure:[{sectionName:'Verse 1',measureStart:1,measureEnd:8},{sectionName:'Chorus',measureStart:9,measureEnd:16},{sectionName:'Bridge',measureStart:17,measureEnd:24},{sectionName:'Final Chorus',measureStart:25,measureEnd:32}],harmony:Array.from({length:32},(_,i)=>({measure:i+1,chordSymbols:[['C','G','Am','F'][i%4]]})),melody,instrumentation:[{partId:'P1',partName:'Vocal'},{partId:'P2',partName:'Piano'},{partId:'P3',partName:'Bass'},{partId:'P4',partName:'Strings'}],fingerprint:{openingMotif:['C4','D4','E4'],chorusMotif:['G4','A4','B4'],midiSequence:melody.map(n=>n.midi),approximateRhythmicPattern:melody.map(n=>n.duration)}};
const plist='<part-list>'+['P1:Vocal','P2:Piano','P3:Bass','P4:Strings'].map(x=>{const[id,name]=x.split(':');return`<score-part id="${id}"><part-name>${name}</part-name></score-part>`;}).join('')+'</part-list>';
const part=(id:string,lyric='quê')=>`<part id="${id}">${Array.from({length:32},(_,i)=>`<measure number="${i+1}"><note><pitch><step>${id==='P3'?'C':'G'}</step><octave>${id==='P3'?2:4}</octave></pitch><duration>1</duration>${id==='P1'?`<lyric><text>${lyric}</text></lyric>`:''}</note>${id==='P2'?'<note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>':''}</measure>`).join('')}</part>`;
const lead=`<?xml version="1.0"?><score-partwise>${plist}${part('P1')}${part('P2')}${part('P3')}${part('P4')}</score-partwise>`;
const raw=`<?xml version="1.0"?><score-partwise>${plist}${part('P1','SAI')}${part('P2')}${part('P3')}${part('P4')}</score-partwise>`;
const queue=[{songDNA:dna,blueprint:{lead:true}},{xml:raw},{songDNA:dna,blueprint:{final:true}}];let i=0;
const fakeFetch:any=async()=>new Response(JSON.stringify(queue[i++]),{status:200,headers:{'Content-Type':'application/json'}});
const result=await runArrangementProduction({leadSheetXml:lead,arrangePrompt:'a',arrangeDocRefs:[],songRequest:{language:'vi',songForm:'Verse Chorus Bridge Final Chorus'},styleId:'STYLE.VN.VPOP-BALLAD',idea:'quê'},{fetchImpl:fakeFetch,maxQualityRetries:0});
assert(result.finalXml.includes('<text>quê</text>')&&!result.finalXml.includes('<text>SAI</text>'),'runner must lock exact lead melody/lyrics');
assert(result.identityLock.partId==='P1','runner must report lock provenance');
assert(result.arrangementQuality.status==='PASS','good arrangement must pass arrangement quality');
assert(result.readiness.score>0,'runner must always return readiness report');
console.log('PASS arrangement-production-run');
