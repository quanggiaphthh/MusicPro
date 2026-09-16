import { lockLeadMelodyPart } from '../../src/compose/master-identity-lock.ts';
function assert(c:unknown,m:string):asserts c{if(!c)throw new Error(m)}
const lead=`<score-partwise><part-list><score-part id="P1"><part-name>Vocal Master</part-name><score-instrument id="P1-I1"><instrument-name>Voice</instrument-name></score-instrument><midi-instrument id="P1-I1"><midi-program>54</midi-program></midi-instrument></score-part></part-list><part id="P1"><measure number="1"><note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration><lyric><text>quê</text></lyric></note></measure></part></score-partwise>`;
const arranged=`<score-partwise><part-list><score-part id="P1"><part-name>Wrong</part-name><score-instrument id="P1-X"><instrument-name>Synth</instrument-name></score-instrument><midi-instrument id="P1-X"><midi-program>81</midi-program></midi-instrument></score-part></part-list><part id="P1"><measure number="1"><note><pitch><step>G</step><octave>5</octave></pitch><duration>1</duration><lyric><text>sai</text></lyric></note></measure></part></score-partwise>`;
const result=lockLeadMelodyPart({leadXml:lead,arrangedXml:arranged,melodyPartId:'P1'});
assert(result.xml.includes('<part-name>Vocal Master</part-name>'),'score-part metadata must be restored from lead');
assert(result.xml.includes('<text>quê</text>')&&!result.xml.includes('<text>sai</text>'),'lead part must be restored exactly');
console.log('PASS master-identity-metadata');
