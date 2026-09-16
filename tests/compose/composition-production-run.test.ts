import { runCompositionProduction } from '../../src/compose/composition-production-run.ts';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const badXml='<score-partwise><part-list><score-part id="P1"><part-name>Vocal</part-name></score-part></part-list><part id="P1"><measure number="1"><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><lyric><text>x</text></lyric></note></measure></part></score-partwise>';
const badDna:any={musical:{approximateDuration:20,tempoBpm:76,timeSignature:'4/4',key:'C',mode:'major'},lyrics:{assembledLyric:'x'},structure:[{sectionName:'Verse',measureStart:1,measureEnd:1}],harmony:[],melody:[{midi:60,duration:1,measure:1}],instrumentation:[{partName:'Vocal'}],fingerprint:{openingMotif:['C4'],midiSequence:[60],approximateRhythmicPattern:[1]}};
const queue=[{xml:badXml},{songDNA:badDna,blueprint:{}}];let i=0;
const fakeFetch:any=async()=>new Response(JSON.stringify(queue[i++]),{status:200,headers:{'Content-Type':'application/json'}});
const result=await runCompositionProduction({composePrompt:'c',composeDocRefs:[],metaPlan:'m',songRequest:{language:'vi'},styleId:'STYLE.VN.VPOP-BALLAD',idea:'x'},{fetchImpl:fakeFetch,maxQualityRetries:0});
assert(result.compositionQuality.status==='FAIL','manual composition runner must return the quality result instead of silently treating XML validity as PASS');
assert(result.leadSheetXml===badXml,'manual runner must preserve last candidate for review');
console.log('PASS composition-production-run');
