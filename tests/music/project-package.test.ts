import { createStoreZip } from '../../src/export/zip-store';
import { buildProjectPackageBytes } from '../../src/export/project-package';
import type { MusicProjectBundle } from '../../src/projects/types';
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }
async function main() {
const enc = new TextEncoder();
const small = createStoreZip([{name:'a.txt',data:enc.encode('hello')},{name:'b.txt',data:enc.encode('world')}]);
assert(String.fromCharCode(...small.slice(0,4)) === 'PK\x03\x04', 'zip local header');
const bundle: MusicProjectBundle = {
 project:{id:'p1',title:'Song',idea:'Idea',style:'STYLE.VN.VPOP-BALLAD',createdAt:1,updatedAt:2,activeRevisionId:'r2',leadRevisionId:'r1',mix:{parts:{},masterGain:1,reverb:.1,normalizeExport:true},tags:[],productionSnapshot:{pipelineVersion:'auto-production-v1.4.1',qualityContractVersion:'production-quality-v1.4.1',sourceHead:'6608',input:{idea:'Idea',styleId:'STYLE.VN.VPOP-BALLAD'},compositionQuality:{status:'PASS',score:90,summary:'ok',checks:[]},arrangementQuality:{status:'PASS',score:92,summary:'ok',checks:[]},readiness:{status:'PASS',label:'READY FOR PRODUCTION',score:91,summary:'ready',blockers:[],advisories:[]},songDna:{lyrics:{assembledLyric:'Lời bài hát'}},blueprint:{harmony:[{section:'Chorus',progression:['C','G','Am','F']}]},identityLock:{partId:'P1',changed:true,mode:'lead-part-and-score-part-exact'},evaluatedRevisionId:'r2',certifiedRevisionId:'r2',generatedAt:2}},
 revisions:[
  {id:'r1',projectId:'p1',label:'Lead',reason:'compose',musicXml:'<score-partwise id="lead"/>',createdAt:1},
  {id:'r2',projectId:'p1',parentRevisionId:'r1',label:'Final',reason:'arrange',musicXml:'<score-partwise id="final"/>',createdAt:2},
 ]
};
const bytes = await buildProjectPackageBytes(bundle);
const text = new TextDecoder('latin1').decode(bytes);
for (const name of ['project.json','current.musicxml','MASTER.musicxml','lead.musicxml','LEAD-SHEET.musicxml','revisions/index.json','revisions/r1.musicxml','revisions/r2.musicxml','README.txt','PRODUCTION-READINESS.md','production/provenance.json','production/composition-quality.json','production/arrangement-quality.json','production/readiness.json','production/song-dna.json','production/production-blueprint.json','production/lyrics.txt','production/chord-chart.md']) assert(text.includes(name), `missing ${name}`);
assert(text.includes('lead-part-and-score-part-exact'),'provenance must include exact part + score-part identity lock');
assert(text.includes('CERTIFIED'),'production package must bind certification to the active revision');
assert(!text.includes('GeneralUserGS.sf3'), 'must not include SoundFont');
assert(!/GEMINI_API_KEY|AIza/.test(text), 'must not include API key');
console.log('PROJECT PACKAGE TESTS PASSED');
}
void main();
