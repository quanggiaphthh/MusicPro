import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildR3ComposerKnowledgePacket, getCanonicalKnowledgeDocsByIds, R3_REQUIRED_KNOWLEDGE_IDS } from '../../server/music/composer-knowledge-packet.ts';
const style='STYLE.VN.VPOP-BALLAD';
const packet=buildR3ComposerKnowledgePacket(style,['KNOW.MELODY.INVENTION','KNOW.MUSICXML.RULES','KNOW.ARR.SECTION-ENERGY']);
for(const id of ['META.STANDARDS','PIPE.STEP-03','KNOW.MELODY.COMPOSITION-PLANNING','KNOW.MELODY.INVENTION','KNOW.MELODY.ANTI-PATTERNS','KNOW.MELODY.QUALITY-GATE','KNOW.LYRICS.LYRIC-MELODY-FIT','KNOW.VI.TONE-MELODY','KNOW.VI.SYLLABLE-PRIORITY',style]) assert.ok(packet.includes(`DOCUMENT: ${id}`),id);
assert.ok(!packet.includes('DOCUMENT: KNOW.MUSICXML.RULES'));
assert.ok(!packet.includes('DOCUMENT: KNOW.MUSICXML.SAFE-PATTERNS'));
assert.equal((packet.match(/DOCUMENT: KNOW.MELODY.INVENTION/g)||[]).length,1);
const r3=buildR3ComposerKnowledgePacket(style,[]).length;
const legacy=getCanonicalKnowledgeDocsByIds(['META.STANDARDS','PIPE.OVERVIEW','PIPE.STEP-03','KNOW.MUSICXML.RULES','KNOW.MUSICXML.SAFE-PATTERNS','KNOW.MELODY.COMPOSITION-PLANNING','KNOW.MELODY.INVENTION','KNOW.MELODY.ANTI-PATTERNS','KNOW.MELODY.QUALITY-GATE','KNOW.LYRICS.LYRIC-MELODY-FIT','KNOW.VI.TONE-MELODY','KNOW.VI.SYLLABLE-PRIORITY','KNOW.HARMONY.PIANO-REDUCTION',style]).length;
assert.ok(r3 <= legacy*.8,`expected >=20% reduction; r3=${r3}, legacy=${legacy}`);

const previousRoot=process.env.PROJECTMUSIC_DIR;
const tempRoot=fs.mkdtempSync(path.join(os.tmpdir(),'musicpro-r3-knowledge-'));
try {
  const ids=[...R3_REQUIRED_KNOWLEDGE_IDS,style];
  const catalog=['pages:'];
  ids.forEach((id,index)=>{
    const name=`doc-${index}.md`;
    fs.writeFileSync(path.join(tempRoot,name),`TEMP_CANONICAL_${id}`);
    catalog.push(`  - id: ${id}`,`    path: docs/m-guide/${name}`,`    serves-steps: [3]`);
  });
  fs.writeFileSync(path.join(tempRoot,'catalog.yml'),catalog.join('\n'));
  process.env.PROJECTMUSIC_DIR=tempRoot;
  const tempPacket=buildR3ComposerKnowledgePacket(style,[]);
  assert.ok(tempPacket.includes('TEMP_CANONICAL_META.STANDARDS'),'PROJECTMUSIC_DIR must control both catalog and document root');
} finally {
  if(previousRoot===undefined) delete process.env.PROJECTMUSIC_DIR; else process.env.PROJECTMUSIC_DIR=previousRoot;
  fs.rmSync(tempRoot,{recursive:true,force:true});
}
console.log('r3-knowledge-packet.test.ts PASS');
