import { lockLeadMelodyPart } from '../../src/compose/master-identity-lock.ts';
function assert(condition:unknown,message:string):asserts condition{if(!condition)throw new Error(message);}
const lead=`<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"><part-name>Vocal</part-name></score-part><score-part id="P2"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><lyric><text>quê</text></lyric></note></measure></part><part id="P2"><measure number="1"><note><pitch><step>C</step><octave>3</octave></pitch><duration>4</duration></note></measure></part></score-partwise>`;
const arranged=`<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"><part-name>Vocal</part-name></score-part><score-part id="P2"><part-name>Piano</part-name></score-part><score-part id="P3"><part-name>Strings</part-name></score-part></part-list><part id="P1"><measure number="1"><note><pitch><step>G</step><octave>5</octave></pitch><duration>2</duration><lyric><text>SAI</text></lyric></note></measure></part><part id="P2"><measure number="1"><note><pitch><step>E</step><octave>3</octave></pitch><duration>1</duration></note></measure></part><part id="P3"><measure number="1"><note><pitch><step>G</step><octave>4</octave></pitch><duration>4</duration></note></measure></part></score-partwise>`;
const out=lockLeadMelodyPart({leadXml:lead,arrangedXml:arranged,melodyPartId:'P1'});
assert(out.changed===true,'must replace arrangement melody part');
assert(out.xml.includes('<text>quê</text>'),'must restore exact lyric from lead');
assert(!out.xml.includes('<text>SAI</text>'),'must remove mutated lyric');
assert(out.xml.includes('<part id="P3">'),'must preserve added arrangement parts');
assert(out.xml.includes('<part-name>Strings</part-name>'),'must preserve arrangement part-list');
let threw=false;try{lockLeadMelodyPart({leadXml:lead,arrangedXml:arranged,melodyPartId:'P99'});}catch(e:any){threw=e?.code==='MASTER_IDENTITY_PART_NOT_FOUND';}
assert(threw,'missing locked part must fail explicitly, not silently skip');
console.log('PASS master-identity-lock');
