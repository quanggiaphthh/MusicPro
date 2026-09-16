import { legacyRunToProject } from '../../src/projects/legacy-run';
import type { CompositionRun } from '../../src/types';

function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(message); }

const run: CompositionRun = {
  id: 'legacy-1', idea: 'Nhớ quê', style: 'STYLE.VN.VPOP-BALLAD', metaPrompt: 'm', composePrompt: 'c', arrangePrompt: 'a',
  musicXml: '<score-partwise id="final"/>', leadMusicXml: '<score-partwise id="lead"/>', finalMusicXml: '<score-partwise id="final"/>',
  title: 'Nhớ quê', status: 'completed', createdAt: { toMillis: () => 1234 },
};
const bundle = legacyRunToProject(run, 2000);
assert(bundle.project.title === 'Nhớ quê', 'title');
assert(bundle.project.style === run.style, 'style');
assert(bundle.revisions.length === 2, 'lead + final');
assert(bundle.revisions[0].reason === 'compose', 'lead reason');
assert(bundle.revisions[1].reason === 'arrange', 'final reason');
assert(bundle.project.activeRevisionId === bundle.revisions[1].id, 'active final');
assert(bundle.revisions[0].musicXml.includes('lead'), 'lead XML preserved');

const noLead = legacyRunToProject({ ...run, id: 'legacy-2', leadMusicXml: undefined }, 3000);
assert(noLead.revisions.length === 1, 'missing lead must not create empty revision');
assert(noLead.revisions[0].musicXml.includes('final'), 'final preserved');
console.log('LEGACY RUN CONVERSION TESTS PASSED');
