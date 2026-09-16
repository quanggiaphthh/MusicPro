import type { CompositionRun } from '../types';
import { createDefaultMix } from '../audio/mix-state';
import { parseMusicXMLToTimeline } from '../music/score-timeline';
import { invalidateProductionCertification } from '../compose/production-certification';
import { createRevision } from './revision-utils';
import { legacyRunToProject } from './legacy-run';
import { localProjectRepository } from './local-project-repository';
import type { MusicProjectBundle, RevisionReason } from './types';

function newId(prefix: string): string {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${random}`;
}

function withCurrentCertificationState(bundle: MusicProjectBundle): MusicProjectBundle {
  const snapshot = bundle.project.productionSnapshot;
  if (!snapshot?.certifiedRevisionId || snapshot.certifiedRevisionId === bundle.project.activeRevisionId) return bundle;
  return {
    ...bundle,
    project: {
      ...bundle.project,
      productionSnapshot: invalidateProductionCertification(snapshot),
    },
  };
}

export interface CreateCompositionProjectInput {
  title: string;
  idea: string;
  style: string;
  musicXml: string;
  reason?: Extract<RevisionReason, 'compose' | 'arrange'>;
  label?: string;
  now?: number;
}

export const projectService = {
  listProjects: () => localProjectRepository.listProjects(),
  getProject: (id: string) => localProjectRepository.getProject(id),
  saveProject: (bundle: MusicProjectBundle) => localProjectRepository.saveProject(withCurrentCertificationState(bundle)),
  deleteProject: (id: string) => localProjectRepository.deleteProject(id),
  duplicateProject: (id: string) => localProjectRepository.duplicateProject(id),

  async createFromComposition(input: CreateCompositionProjectInput): Promise<MusicProjectBundle> {
    const now = input.now ?? Date.now();
    const projectId = newId('project');
    const revisionId = newId('revision');
    let mix = { parts: {}, masterGain: 1, reverb: 0.12, normalizeExport: true };
    try { mix = createDefaultMix(parseMusicXMLToTimeline(input.musicXml)); } catch { /* safe default */ }
    const reason = input.reason || 'compose';
    const bundle: MusicProjectBundle = {
      project: {
        id: projectId,
        title: input.title.trim() || 'Dự án Music-Pro',
        idea: input.idea,
        style: input.style,
        createdAt: now,
        updatedAt: now,
        activeRevisionId: revisionId,
        leadRevisionId: reason === 'compose' ? revisionId : undefined,
        mix,
        tags: [],
      },
      revisions: [{
        id: revisionId,
        projectId,
        label: input.label?.trim() || (reason === 'compose' ? 'Bản nhạc' : 'Bản phối'),
        reason,
        musicXml: input.musicXml,
        createdAt: now,
      }],
    };
    await localProjectRepository.saveProject(bundle);
    return bundle;
  },

  async appendRevision(
    bundle: MusicProjectBundle,
    input: { musicXml: string; reason: RevisionReason; label?: string; now?: number; promoteToLead?: boolean },
  ): Promise<MusicProjectBundle> {
    const now = input.now ?? Date.now();
    const next = createRevision(bundle, {
      id: newId('revision'),
      label: input.label,
      reason: input.reason,
      musicXml: input.musicXml,
      createdAt: now,
      promoteToLead: input.promoteToLead,
    });
    next.project.productionSnapshot = invalidateProductionCertification(next.project.productionSnapshot);
    await localProjectRepository.saveProject(next);
    return next;
  },

  async importLegacyRun(run: CompositionRun, now = Date.now()): Promise<MusicProjectBundle> {
    const bundle = legacyRunToProject(run, now);
    await localProjectRepository.saveProject(bundle);
    return bundle;
  },

  async duplicateFromRevision(bundle: MusicProjectBundle, revisionId: string, now = Date.now()): Promise<MusicProjectBundle> {
    const target = bundle.revisions.find(revision => revision.id === revisionId);
    if (!target) throw new Error(`Revision not found: ${revisionId}`);
    const projectId = newId('project');
    const revisionIdNew = newId('revision');
    const duplicate: MusicProjectBundle = {
      project: {
        ...bundle.project,
        id: projectId,
        title: `${bundle.project.title} — Bản sao`,
        createdAt: now,
        updatedAt: now,
        activeRevisionId: revisionIdNew,
        leadRevisionId: target.reason === 'compose' ? revisionIdNew : undefined,
        productionSnapshot: invalidateProductionCertification(bundle.project.productionSnapshot),
        mix: { ...bundle.project.mix, parts: Object.fromEntries(Object.entries(bundle.project.mix.parts).map(([id, state]) => [id, { ...state }])) },
        tags: [...bundle.project.tags],
      },
      revisions: [{ ...target, id: revisionIdNew, projectId, parentRevisionId: undefined, reason: 'duplicate', label: `Bản sao: ${target.label}`, createdAt: now }],
    };
    await localProjectRepository.saveProject(duplicate);
    return duplicate;
  },
};
