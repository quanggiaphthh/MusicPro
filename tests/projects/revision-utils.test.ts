import { compareScoreSummaries, createRevision, duplicateProjectBundle, restoreRevision, renameRevision, summarizeScore } from '../../src/projects/revision-utils';
import type { MusicProjectBundle } from '../../src/projects/types';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const base: MusicProjectBundle = {
  project: {
    id: 'p1', title: 'Song', idea: 'Idea', style: 'STYLE.VN.VPOP-BALLAD',
    createdAt: 100, updatedAt: 100, activeRevisionId: 'r1', leadRevisionId: 'r1',
    mix: { parts: {}, masterGain: 1, reverb: 0.12, normalizeExport: true }, tags: [],
  },
  revisions: [{ id: 'r1', projectId: 'p1', label: 'Lead', reason: 'compose', musicXml: '<score-partwise/>', createdAt: 100 }],
};
const edited = createRevision(base, { id: 'r2', label: 'Edit 1', reason: 'edit', musicXml: '<score-partwise version="4.0"/>', createdAt: 200 });
assert(edited.project.activeRevisionId === 'r2', 'active revision');
assert(edited.revisions.length === 2, 'revision append');

const recomposed = createRevision(edited, { id: 'r-compose-2', label: 'Lead mới', reason: 'compose', musicXml: '<score-partwise version="4.0"><part-list/></score-partwise>', createdAt: 250 });
assert(recomposed.project.leadRevisionId === 'r-compose-2', 'a new compose revision must become the current lead revision');

const editedLead = createRevision(base, { id: 'r-lead-edit', label: 'Sửa lead', reason: 'edit', musicXml: '<score-partwise version="4.0"/>', createdAt: 220, promoteToLead: true });
assert(editedLead.project.leadRevisionId === 'r-lead-edit', 'a promoted lead edit must update leadRevisionId');

const restored = restoreRevision(edited, 'r1', 300, 'r3');
assert(restored.revisions.at(-1)?.reason === 'restore', 'restore must append');
assert(restored.revisions.at(-1)?.musicXml === '<score-partwise/>', 'restore snapshot');
assert(restored.project.leadRevisionId === 'r3', 'restoring the lead must make the restored snapshot the current lead');

const copied = duplicateProjectBundle(
  { ...edited, project: { ...edited.project, leadRevisionId: 'r1' } },
  { projectId: 'p2', revisionIds: { r1: 'p2-r1', r2: 'p2-r2' }, createdAt: 500 },
);
assert(copied.project.id === 'p2' && copied.project.activeRevisionId === 'p2-r2', 'duplicate remaps project and active revision ids');
assert(copied.project.leadRevisionId === 'p2-r1', 'duplicate remaps lead revision id');
assert(copied.revisions.map(r => r.reason).join(',') === 'compose,edit', 'duplicate preserves revision reasons');
assert(copied.revisions[1].parentRevisionId === 'p2-r1', 'duplicate remaps parent chain');


const summaryXmlA = `<?xml version="1.0"?><score-partwise><part-list><score-part id="P1"><part-name>Piano</part-name></score-part></part-list><part id="P1"><measure number="1"><attributes><divisions>1</divisions><key><fifths>0</fifths><mode>major</mode></key><time><beats>4</beats><beat-type>4</beat-type></time></attributes><direction><sound tempo="120"/></direction><note><pitch><step>C</step><octave>4</octave></pitch><duration>4</duration></note></measure></part></score-partwise>`;
const summaryXmlB = summaryXmlA.replace('<fifths>0</fifths>', '<fifths>1</fifths>').replace('tempo="120"', 'tempo="90"');
const summaryA = summarizeScore(summaryXmlA);
const summaryB = summarizeScore(summaryXmlB);
assert(summaryA.key === 'C major', 'score summary must expose a human-readable key');
assert(summaryB.key === 'G major', 'score summary maps fifths to a human-readable key');
const comparison = compareScoreSummaries(summaryA, summaryB);
assert(comparison.key.changed && comparison.bpm.changed, 'revision comparison must identify score-level metadata changes');
assert(!comparison.partCount.changed && !comparison.noteCount.changed, 'unchanged summary fields must remain unchanged');

const renamed = renameRevision(restored, 'r3', 'Khôi phục Lead');
assert(renamed.revisions.at(-1)?.label === 'Khôi phục Lead', 'rename');
console.log('PROJECT REVISION TESTS PASSED');
