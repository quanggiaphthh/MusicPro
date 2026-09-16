import type { CompositionRun } from '../types';
import type { MusicProjectBundle, ScoreRevision } from './types';

function timestampFromRun(run: CompositionRun, fallback: number): number {
  const value = run.createdAt;
  if (value && typeof value.toMillis === 'function') {
    const millis = Number(value.toMillis());
    if (Number.isFinite(millis)) return millis;
  }
  if (value && typeof value.toDate === 'function') {
    const millis = Number(value.toDate()?.getTime?.());
    if (Number.isFinite(millis)) return millis;
  }
  if (value instanceof Date) return value.getTime();
  if (Number.isFinite(Number(value))) return Number(value);
  return fallback;
}

function stableLegacyId(prefix: string, runId: string, suffix?: string): string {
  return `${prefix}-legacy-${runId}${suffix ? `-${suffix}` : ''}`;
}

export function legacyRunToProject(run: CompositionRun, now = Date.now()): MusicProjectBundle {
  const createdAt = timestampFromRun(run, now);
  const projectId = stableLegacyId('project', run.id || String(createdAt));
  const revisions: ScoreRevision[] = [];

  if (run.leadMusicXml?.trim()) {
    revisions.push({
      id: stableLegacyId('revision', run.id || String(createdAt), 'lead'),
      projectId,
      label: 'Bản nhạc gốc',
      reason: 'compose',
      musicXml: run.leadMusicXml,
      createdAt,
    });
  }

  const finalXml = run.finalMusicXml?.trim() || run.musicXml?.trim();
  if (finalXml) {
    const parentRevisionId = revisions.at(-1)?.id;
    revisions.push({
      id: stableLegacyId('revision', run.id || String(createdAt), 'final'),
      projectId,
      parentRevisionId,
      label: run.finalMusicXml ? 'Bản phối' : 'Bản nhạc đã lưu',
      reason: run.finalMusicXml ? 'arrange' : 'compose',
      musicXml: finalXml,
      createdAt: Math.max(createdAt, now),
    });
  }

  if (revisions.length === 0) throw new Error('Legacy run does not contain MusicXML.');
  const active = revisions.at(-1)!;
  const lead = revisions.find(revision => revision.reason === 'compose');

  return {
    project: {
      id: projectId,
      title: (run.title || run.idea || 'Dự án Music-Pro').trim(),
      idea: run.idea || '',
      style: run.style || 'STYLE.VN.VPOP-BALLAD',
      createdAt,
      updatedAt: active.createdAt,
      activeRevisionId: active.id,
      leadRevisionId: lead?.id,
      mix: { parts: {}, masterGain: 1, reverb: 0.12, normalizeExport: true },
      tags: [],
    },
    revisions,
  };
}
