import { dedupeKnowledgeRefsAgainstCore } from '../../server/music/knowledge-dedup.ts';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

const core = [
  '--- DOCUMENT: KNOW.MELODY.INVENTION ---\nA',
  '--- DOCUMENT: KNOW.LYRICS.LYRIC-MELODY-FIT ---\nB',
].join('\n');
const refs = [
  'KNOW.MELODY.INVENTION',
  'STYLE.UNIQUE.ONE',
  'STYLE.UNIQUE.ONE',
  'KNOW.LYRICS.LYRIC-MELODY-FIT',
  'STYLE.UNIQUE.TWO',
  'STYLE.VN.VPOP-BALLAD',
];
const result = dedupeKnowledgeRefsAgainstCore(refs, core, ['STYLE.VN.VPOP-BALLAD']);
assert(JSON.stringify(result) === JSON.stringify(['STYLE.UNIQUE.ONE','STYLE.UNIQUE.TWO']), `unexpected refs: ${JSON.stringify(result)}`);
console.log('PASS knowledge-dedup');
