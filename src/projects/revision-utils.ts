import { parseMusicXMLToTimeline } from '../music/score-timeline';
import type { MusicProjectBundle, RevisionReason, ScoreRevision, ScoreSummary } from './types';

export interface CreateRevisionInput {
  id: string;
  label?: string;
  reason: RevisionReason;
  musicXml: string;
  createdAt: number;
  parentRevisionId?: string;
  promoteToLead?: boolean;
}

const DEFAULT_LABELS: Record<RevisionReason, string> = {
  compose: 'Bản nhạc',
  arrange: 'Bản phối',
  edit: 'Chỉnh sửa',
  'section-ai': 'Chỉnh đoạn bằng AI',
  restore: 'Khôi phục',
  duplicate: 'Bản sao',
};

function cleanLabel(label: string | undefined, reason: RevisionReason): string {
  const trimmed = label?.trim();
  return trimmed || DEFAULT_LABELS[reason];
}

function cloneBundle(bundle: MusicProjectBundle): MusicProjectBundle {
  return {
    project: {
      ...bundle.project,
      tags: [...bundle.project.tags],
      mix: {
        ...bundle.project.mix,
        parts: Object.fromEntries(
          Object.entries(bundle.project.mix.parts).map(([key, value]) => [key, { ...value }]),
        ),
      },
    },
    revisions: bundle.revisions.map(revision => ({ ...revision })),
  };
}

export function createRevision(bundle: MusicProjectBundle, input: CreateRevisionInput): MusicProjectBundle {
  if (bundle.revisions.some(revision => revision.id === input.id)) {
    throw new Error(`Revision already exists: ${input.id}`);
  }
  const next = cloneBundle(bundle);
  const parentRevisionId = input.parentRevisionId ?? (next.project.activeRevisionId || undefined);
  const revision: ScoreRevision = {
    id: input.id,
    projectId: next.project.id,
    parentRevisionId,
    label: cleanLabel(input.label, input.reason),
    reason: input.reason,
    musicXml: input.musicXml,
    createdAt: input.createdAt,
  };
  next.revisions.push(revision);
  next.project.activeRevisionId = revision.id;
  next.project.updatedAt = input.createdAt;
  if (input.reason === 'compose' || input.promoteToLead) next.project.leadRevisionId = revision.id;
  return next;
}

export function restoreRevision(
  bundle: MusicProjectBundle,
  revisionId: string,
  now: number,
  newRevisionId = `rev-${now}`,
): MusicProjectBundle {
  const target = bundle.revisions.find(revision => revision.id === revisionId);
  if (!target) throw new Error(`Revision not found: ${revisionId}`);
  const next = createRevision(bundle, {
    id: newRevisionId,
    label: `Khôi phục: ${target.label}`,
    reason: 'restore',
    musicXml: target.musicXml,
    createdAt: now,
  });
  if (target.reason === 'compose' || bundle.project.leadRevisionId === target.id) {
    next.project.leadRevisionId = newRevisionId;
  }
  return next;
}

export function renameRevision(bundle: MusicProjectBundle, revisionId: string, label: string): MusicProjectBundle {
  const next = cloneBundle(bundle);
  const target = next.revisions.find(revision => revision.id === revisionId);
  if (!target) throw new Error(`Revision not found: ${revisionId}`);
  target.label = cleanLabel(label, target.reason);
  return next;
}

export function activeRevision(bundle: MusicProjectBundle): ScoreRevision {
  const revision = bundle.revisions.find(item => item.id === bundle.project.activeRevisionId);
  if (!revision) throw new Error(`Active revision not found: ${bundle.project.activeRevisionId}`);
  return revision;
}


const MAJOR_KEY_BY_FIFTHS: Record<number, string> = {
  [-7]: 'Cb', [-6]: 'Gb', [-5]: 'Db', [-4]: 'Ab', [-3]: 'Eb', [-2]: 'Bb', [-1]: 'F',
  0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#', 7: 'C#',
};
const MINOR_KEY_BY_FIFTHS: Record<number, string> = {
  [-7]: 'Ab', [-6]: 'Eb', [-5]: 'Bb', [-4]: 'F', [-3]: 'C', [-2]: 'G', [-1]: 'D',
  0: 'A', 1: 'E', 2: 'B', 3: 'F#', 4: 'C#', 5: 'G#', 6: 'D#', 7: 'A#',
};

export function keyNameFromFifths(fifths: number | undefined, mode: string | undefined): string | undefined {
  if (!Number.isFinite(fifths)) return undefined;
  const normalizedMode = (mode || 'major').trim().toLowerCase() === 'minor' ? 'minor' : 'major';
  const key = (normalizedMode === 'minor' ? MINOR_KEY_BY_FIFTHS : MAJOR_KEY_BY_FIFTHS)[Math.max(-7, Math.min(7, Math.round(fifths as number)))];
  return key ? `${key} ${normalizedMode}` : undefined;
}

export interface ScoreSummaryComparisonField<T> {
  before: T | undefined;
  after: T | undefined;
  changed: boolean;
}

export interface ScoreSummaryComparison {
  durationSeconds: ScoreSummaryComparisonField<number>;
  bpm: ScoreSummaryComparisonField<number>;
  partCount: ScoreSummaryComparisonField<number>;
  noteCount: ScoreSummaryComparisonField<number>;
  key: ScoreSummaryComparisonField<string>;
}

function compareField<T>(before: T | undefined, after: T | undefined): ScoreSummaryComparisonField<T> {
  return { before, after, changed: before !== after };
}

export function compareScoreSummaries(before: ScoreSummary, after: ScoreSummary): ScoreSummaryComparison {
  return {
    durationSeconds: compareField(Math.round(before.durationSeconds), Math.round(after.durationSeconds)),
    bpm: compareField(before.bpm === undefined ? undefined : Math.round(before.bpm), after.bpm === undefined ? undefined : Math.round(after.bpm)),
    partCount: compareField(before.partCount, after.partCount),
    noteCount: compareField(before.noteCount, after.noteCount),
    key: compareField(before.key, after.key),
  };
}

export function summarizeScore(xml: string): ScoreSummary {
  try {
    const timeline = parseMusicXMLToTimeline(xml);
    const noteCount = timeline.parts.reduce((sum, part) => sum + part.events.length, 0);
    const keyMatch = xml.match(/<fifths>\s*(-?\d+)\s*<\/fifths>/i);
    const modeMatch = xml.match(/<mode>\s*([^<]+)\s*<\/mode>/i);
    const mode = modeMatch?.[1]?.trim() || 'major';
    return {
      durationSeconds: timeline.totalDurationSeconds,
      bpm: timeline.tempoMap[0]?.bpm,
      partCount: timeline.parts.length,
      noteCount,
      key: keyNameFromFifths(keyMatch ? Number(keyMatch[1]) : undefined, mode),
      mode,
    };
  } catch {
    const partCount = (xml.match(/<part\b/gi) || []).length;
    const noteCount = (xml.match(/<note\b/gi) || []).length;
    const bpmMatch = xml.match(/(?:tempo\s*=\s*["']|<per-minute>\s*)(\d+(?:\.\d+)?)/i);
    const keyMatch = xml.match(/<fifths>\s*(-?\d+)\s*<\/fifths>/i);
    const modeMatch = xml.match(/<mode>\s*([^<]+)\s*<\/mode>/i);
    const mode = modeMatch?.[1]?.trim() || 'major';
    return {
      durationSeconds: 0,
      bpm: bpmMatch ? Number(bpmMatch[1]) : undefined,
      partCount,
      noteCount,
      key: keyNameFromFifths(keyMatch ? Number(keyMatch[1]) : undefined, mode),
      mode,
    };
  }
}

export interface DuplicateProjectBundleInput {
  projectId: string;
  revisionIds: Record<string, string>;
  createdAt: number;
  title?: string;
}

export function duplicateProjectBundle(
  bundle: MusicProjectBundle,
  input: DuplicateProjectBundleInput,
): MusicProjectBundle {
  const missing = bundle.revisions.find(revision => !input.revisionIds[revision.id]);
  if (missing) throw new Error(`Missing duplicate revision id for ${missing.id}`);
  const revisions = bundle.revisions.map(revision => ({
    ...revision,
    id: input.revisionIds[revision.id],
    projectId: input.projectId,
    parentRevisionId: revision.parentRevisionId ? input.revisionIds[revision.parentRevisionId] : undefined,
  }));
  return {
    project: {
      ...bundle.project,
      id: input.projectId,
      title: input.title?.trim() || `${bundle.project.title} — Bản sao`,
      createdAt: input.createdAt,
      updatedAt: input.createdAt,
      activeRevisionId: input.revisionIds[bundle.project.activeRevisionId],
      leadRevisionId: bundle.project.leadRevisionId ? input.revisionIds[bundle.project.leadRevisionId] : undefined,
      tags: [...bundle.project.tags],
      mix: {
        ...bundle.project.mix,
        parts: Object.fromEntries(Object.entries(bundle.project.mix.parts).map(([key, value]) => [key, { ...value }])),
      },
    },
    revisions,
  };
}
