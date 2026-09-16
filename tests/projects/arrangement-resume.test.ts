import assert from 'node:assert/strict';
import {
  getArrangementLeadRevision,
  hasArrangementContext,
  isArrangementSourceRevision,
  normalizeCompositionContext,
  withCompositionContext,
} from '../../src/projects/arrangement-resume.ts';
import type { MusicProjectBundle } from '../../src/projects/types.ts';

const bundle: MusicProjectBundle = {
  project: {
    id: 'p1', title: 'Song', idea: 'Idea', style: 'STYLE.VN.VPOP-BALLAD',
    createdAt: 1, updatedAt: 1, activeRevisionId: 'r1', leadRevisionId: 'r1',
    mix: { parts: {}, masterGain: 1, reverb: 0.12, normalizeExport: true }, tags: [],
  },
  revisions: [
    { id: 'r1', projectId: 'p1', label: 'Lead Sheet', reason: 'compose', musicXml: '<lead/>', createdAt: 1 },
    { id: 'r2', projectId: 'p1', parentRevisionId: 'r1', label: 'Bản phối', reason: 'arrange', musicXml: '<arr/>', createdAt: 2 },
  ],
};

assert.equal(getArrangementLeadRevision(bundle)?.id, 'r1', 'must use the canonical lead revision');
assert.equal(isArrangementSourceRevision(bundle, 'r1'), true, 'lead revision exposes arrangement action');
assert.equal(isArrangementSourceRevision(bundle, 'r2'), false, 'arrangement revision must not expose lead-only arrangement action');
assert.equal(hasArrangementContext(bundle.project.compositionContext), false, 'old projects have no stored context');

const prepared = normalizeCompositionContext({
  metaPlan: 'meta',
  composePrompt: 'compose',
  arrangePrompt: 'arrange this score',
  composeDocRefs: ['KNOW.MELODY.CONTOUR'],
  arrangeDocRefs: ['KNOW.ARRANGEMENT.ORCHESTRATION'],
  planSummary: 'summary',
  songRequest: { genre: 'V-Pop Ballad' },
});
assert.equal(hasArrangementContext(prepared), true, 'prepared context must be arrangement-ready');
assert.deepEqual(prepared.arrangeDocRefs, ['KNOW.ARRANGEMENT.ORCHESTRATION']);

const next = withCompositionContext(bundle, prepared, 99);
assert.equal(next.project.compositionContext?.arrangePrompt, 'arrange this score');
assert.equal(next.project.updatedAt, 99);
assert.equal(bundle.project.compositionContext, undefined, 'helper must not mutate source bundle');

assert.throws(
  () => normalizeCompositionContext({ arrangePrompt: ' ', arrangeDocRefs: [], songRequest: {} }),
  /arrangePrompt/i,
  'invalid prepare payload must fail before calling arrange',
);

console.log('arrangement-resume tests: PASS');
