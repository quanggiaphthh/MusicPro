import type { ProductionSnapshot } from '../compose/types';

export type RevisionReason = 'compose' | 'arrange' | 'edit' | 'section-ai' | 'restore' | 'duplicate';

export interface MixPartState {
  partId: string;
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  midiProgram?: number;
}

export interface MixState {
  parts: Record<string, MixPartState>;
  masterGain: number;
  reverb: number;
  normalizeExport: boolean;
}

export interface CompositionContext {
  metaPlan?: string;
  composePrompt?: string;
  arrangePrompt: string;
  composeDocRefs?: string[];
  arrangeDocRefs: string[];
  planSummary?: string;
  songRequest: unknown;
}

export interface MusicProject {
  id: string;
  title: string;
  idea: string;
  style: string;
  createdAt: number;
  updatedAt: number;
  activeRevisionId: string;
  leadRevisionId?: string;
  mix: MixState;
  tags: string[];
  compositionContext?: CompositionContext;
  productionSnapshot?: ProductionSnapshot;
}

export interface ScoreRevision {
  id: string;
  projectId: string;
  parentRevisionId?: string;
  label: string;
  reason: RevisionReason;
  musicXml: string;
  createdAt: number;
}

export interface ScoreSummary {
  durationSeconds: number;
  bpm?: number;
  partCount: number;
  noteCount: number;
  key?: string;
  mode?: string;
}

export interface MusicProjectBundle {
  project: MusicProject;
  revisions: ScoreRevision[];
}

export interface MusicProjectSummary {
  id: string;
  title: string;
  idea: string;
  style: string;
  updatedAt: number;
  activeRevisionId: string;
  revisionCount: number;
}

export interface ProjectRepository {
  listProjects(): Promise<MusicProjectSummary[]>;
  getProject(id: string): Promise<MusicProjectBundle | null>;
  saveProject(bundle: MusicProjectBundle): Promise<void>;
  deleteProject(id: string): Promise<void>;
  duplicateProject(id: string): Promise<string>;
}
