export interface KnowledgeDoc {
  id: string;
  title: string;
  category: string;
  content: string;
  updatedAt: number;
  source?: 'canonical' | 'custom';
  path?: string;
  tags?: string[];
  servesSteps?: number[];
  summary?: string;
  readOnly?: boolean;
}

export interface KnowledgeCatalog {
  version: string;
  updated: string;
  documentCount: number;
  writable: boolean;
  documents: KnowledgeDoc[];
}

export interface CompositionRun {
  id: string;
  idea: string;
  style: string;
  metaPrompt: string;
  composePrompt: string;
  arrangePrompt: string;
  musicXml: string;
  leadMusicXml?: string;
  finalMusicXml?: string;
  title?: string;
  durationSeconds?: number;
  version?: number;
  parentRevisionId?: string;
  status: 'draft' | 'completed' | 'failed';
  createdAt: any;
}

export interface UpgradeSuggestion {
  id: string;
  runId: string;
  critique: string;
  suggestion: string;
  targetDocId: string;
  title: string;
  category: string;
  newContent: string;
  status: 'pending' | 'merged' | 'rejected';
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  lastSynced: number;
}

export interface AppSettings {
  userName: string;
  userRole: string;
  temperature: number;
  defaultStyleId: string;
  playbackQuality: 'standard' | 'high';
  defaultExportFormat: 'wav' | 'midi' | 'musicxml';
  normalizeWav: boolean;
  autoSave: boolean;
}

export type {
  MixPartState,
  MixState,
  MusicProject,
  MusicProjectBundle,
  MusicProjectSummary,
  ProjectRepository,
  RevisionReason,
  ScoreRevision,
  ScoreSummary,
} from './projects/types';
