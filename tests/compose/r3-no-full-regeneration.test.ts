import assert from 'node:assert/strict';
import { runAutoComposition } from '../../src/compose/auto-compose.ts';

const prepare = {
  songRequest:{language:'vi',concept:'test',emotion:'test',genre:'V-Pop',songForm:'Verse Chorus Bridge Final Chorus'},
  metaPlan:'meta',composePrompt:'compose',arrangePrompt:'arrange',composeDocRefs:[],arrangeDocRefs:[],planSummary:'plan',
  style:{id:'STYLE.VN.VPOP-BALLAD',displayName:'V-Pop Ballad'},
};
const weakXml='<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"><part-name>Vocal</part-name></score-part></part-list><part id="P1"><measure number="1"><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><lyric><text>ma</text></lyric></note></measure></part></score-partwise>';
const weakDna:any={selectedMelodyPartId:'P1',musical:{approximateDuration:8,tempoBpm:120,timeSignature:'4/4',key:'C',mode:'major'},lyrics:{assembledLyric:'ma'},structure:[],harmony:[],melody:[],instrumentation:[{partName:'Vocal'}],fingerprint:{midiSequence:[],approximateRhythmicPattern:[]}};
let leadRequests=0;
const fakeFetch:any=async (url:string)=>{
  if(url==='/api/compose/prepare') return {ok:true,json:async()=>prepare};
  if(url==='/api/compose/lead-sheet') { leadRequests++; return {ok:true,json:async()=>({xml:weakXml})}; }
  if(url==='/api/music/blueprint') return {ok:true,json:async()=>({songDNA:weakDna,blueprint:{}})};
  if(url==='/api/compose/arrange') return {ok:true,json:async()=>({xml:weakXml})};
  throw new Error(`Unexpected URL ${url}`);
};

await assert.rejects(
  () => runAutoComposition({idea:'test',styleId:'STYLE.VN.VPOP-BALLAD'},{fetchImpl:fakeFetch,maxQualityRetries:1}),
  /./,
);
assert.equal(leadRequests,1,'r3 client orchestration must never request a second full Step-3 generation');
console.log('r3-no-full-regeneration.test.ts PASS');
