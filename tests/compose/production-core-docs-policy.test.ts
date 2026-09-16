import fs from 'node:fs';
function assert(condition: unknown, message: string): asserts condition { if(!condition) throw new Error(message); }
const source=fs.readFileSync('server/projectmusic/knowledge.ts','utf8');
for(const id of ['KNOW.MELODY.QUALITY-GATE','KNOW.MELODY.COMPOSITION-PLANNING','KNOW.MELODY.INVENTION','KNOW.MELODY.ANTI-PATTERNS','KNOW.VI.TONE-MELODY','KNOW.VI.SYLLABLE-PRIORITY','KNOW.LYRICS.LYRIC-MELODY-FIT','KNOW.HARMONY.PIANO-REDUCTION','KNOW.MUSICXML.SAFE-PATTERNS','KNOW.MUSICXML.IMPORTER-PROFILE','KNOW.ARR.SECTION-ENERGY']) assert(source.includes(id),`missing mandatory core doc ${id}`);
console.log('PASS production-core-docs-policy');
