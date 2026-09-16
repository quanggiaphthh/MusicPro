import {
  categoryFromKnowledgePath,
  firstMarkdownHeading,
  resolveKnowledgePath,
  matchesKnowledgeFilters,
} from '../../server/projectmusic/knowledge-admin-core';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

console.log('--- Knowledge admin core tests ---');

assert(categoryFromKnowledgePath('docs/m-guide/meta/purpose.md') === 'meta', 'meta path must map to meta');
assert(categoryFromKnowledgePath('docs/m-guide/pipeline/step-03-compose.md') === 'pipeline', 'pipeline path must map to pipeline');
assert(categoryFromKnowledgePath('docs/m-guide/knowledge/lyrics/craft.md') === 'lyrics', 'lyrics path must map to lyrics');
assert(categoryFromKnowledgePath('docs/m-guide/knowledge/harmony/modulation.md') === 'harmony', 'harmony path must map to harmony');
assert(categoryFromKnowledgePath('docs/m-guide/knowledge/arrangement/orchestration.md') === 'arrangement', 'arrangement path must map to arrangement');
assert(categoryFromKnowledgePath('docs/m-guide/styles/vpop-ballad.md') === 'styles', 'styles path must map to styles');
assert(categoryFromKnowledgePath('docs/m-guide/artifacts/meta-prompt.template.md') === 'artifacts', 'artifacts path must map to artifacts');

assert(firstMarkdownHeading('# Tiêu đề chính\nNội dung', 'Fallback') === 'Tiêu đề chính', 'first heading must be used as title');
assert(firstMarkdownHeading('Nội dung không heading', 'Fallback') === 'Fallback', 'fallback title must be used when heading is absent');

const base = '/repo/docs/m-guide';
assert(resolveKnowledgePath(base, 'docs/m-guide/knowledge/harmony/basics.md') === '/repo/docs/m-guide/knowledge/harmony/basics.md', 'catalog path must resolve under base');
let traversalRejected = false;
try {
  resolveKnowledgePath(base, '../../secret.txt');
} catch {
  traversalRejected = true;
}
assert(traversalRejected, 'path traversal must be rejected');

const sample = {
  id: 'KNOW.HARMONY.MODULATION',
  title: 'Kỹ thuật chuyển giọng',
  category: 'harmony',
  summary: 'Chuyển giọng trong bài hát',
  tags: ['compose', 'arrange', 'harmony'],
  servesSteps: [3, 4],
};
assert(matchesKnowledgeFilters(sample, { query: 'chuyển giọng' }), 'query must match title/summary');
assert(matchesKnowledgeFilters(sample, { query: 'modulation' }), 'query must match id');
assert(matchesKnowledgeFilters(sample, { step: 4 }), 'step filter must match servesSteps');
assert(!matchesKnowledgeFilters(sample, { step: 2 }), 'step filter must reject unrelated step');
assert(matchesKnowledgeFilters(sample, { tag: 'harmony' }), 'tag filter must match');
assert(!matchesKnowledgeFilters(sample, { tag: 'lyrics' }), 'tag filter must reject unrelated tag');
assert(matchesKnowledgeFilters(sample, { category: 'harmony' }), 'category filter must match');

console.log('🚀 KNOWLEDGE ADMIN CORE TESTS PASSED');
