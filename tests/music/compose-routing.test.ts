import fs from 'node:fs';
import { generateArrangement, GenerateFn } from '../../server/music/composer';

const source=fs.readFileSync('server/music/composer.ts','utf8');
const leadStart=source.indexOf('export async function generateLeadSheet(');
const arrangeStart=source.indexOf('export async function generateArrangement(');
if(leadStart<0||arrangeStart<=leadStart) throw new Error('Composer public API boundaries not found');
const leadSource=source.slice(leadStart,arrangeStart);
if(!/generateLeadSheetR3\s*\(/.test(leadSource)) throw new Error('Step 3 must delegate to r3');
for(const forbidden of ['FALLBACK_MODEL','Create a Lead Sheet (melody, lyrics, chords) in MusicXML 4.0 format','OUTPUT: Output ONLY the MusicXML code','Regenerate the complete score']){
  if(leadSource.includes(forbidden)) throw new Error(`Legacy Step 3 routing/prompt remains: ${forbidden}`);
}

const validXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0"><part-list><score-part id="P1"><part-name>Melody</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time><clef><sign>G</sign><line>2</line></clef></attributes><sound tempo="120"/><harmony><root><root-step>C</root-step></root><kind>major</kind></harmony><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration><type>whole</type><lyric><text>Test lyric</text></lyric></note></measure></part></score-partwise>`;
const invalidXml = `<score-partwise><part><measure><note><rest/></note></measure></part></score-partwise>`;

async function runTests(){
  {
    let calls=0; const mock:GenerateFn=async()=>{calls++;return{text:validXml} as any};
    await generateArrangement(validXml,'Arrange prompt',[],{vocalDirection:'Vocal',songForm:'short demo'},'STYLE.VN.VPOP-BALLAD',mock);
    if(calls!==1)throw new Error(`Arrangement first-valid expected 1 call, got ${calls}`);
  }
  {
    let calls=0; const mock:GenerateFn=async()=>{calls++;return{text:calls===1?invalidXml:validXml} as any};
    await generateArrangement(validXml,'Arrange prompt',[],{vocalDirection:'Vocal',songForm:'short demo'},'STYLE.VN.VPOP-BALLAD',mock);
    if(calls!==2)throw new Error(`Arrangement fallback expected 2 calls, got ${calls}`);
  }
  {
    let calls=0; const mock:GenerateFn=async()=>{calls++;return{text:invalidXml} as any}; let caught:any;
    try{await generateArrangement(validXml,'Arrange prompt',[],{vocalDirection:'Vocal',songForm:'short demo'},'STYLE.VN.VPOP-BALLAD',mock);}catch(error){caught=error;}
    if(caught?.code!=='MUSICXML_INVALID_AFTER_RETRY')throw new Error(`Expected arrangement MUSICXML_INVALID_AFTER_RETRY, got ${caught?.code}`);
    if(calls!==2)throw new Error(`Invalid arrangement must stop after fallback, got ${calls} calls`);
  }
  {
    let calls=0; const mock:GenerateFn=async()=>{calls++;throw new Error('Arrangement network timeout')}; let caught:any;
    try{await generateArrangement(validXml,'Arrange prompt',[],{vocalDirection:'Vocal',songForm:'short demo'},'STYLE.VN.VPOP-BALLAD',mock);}catch(error){caught=error;}
    if(calls!==1||caught?.message!=='Arrangement network timeout')throw new Error('Arrangement network error must not fallback');
  }
  console.log('ALL COMPOSE ROUTING TESTS PASSED');
}
runTests().catch(error=>{console.error(error);process.exit(1)});
