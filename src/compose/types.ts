export type ComposeStep = 1 | 2 | 3 | 4;
export type QualityStatus = 'pass' | 'weak' | 'fail';

export interface QualityCheck {
  id: string;
  label: string;
  status: QualityStatus;
  detail: string;
  required?: boolean;
}

export interface QualityReport {
  status: 'PASS' | 'FAIL';
  score: number;
  checks: QualityCheck[];
  summary: string;
}

export interface ProductionReadinessReport {
  status: 'PASS' | 'FAIL';
  label: 'READY FOR PRODUCTION' | 'QUALITY REVIEW REQUIRED';
  score: number;
  summary: string;
  blockers: string[];
  advisories: string[];
}

export interface AutoCompositionContext {
  metaPlan: string;
  composePrompt: string;
  arrangePrompt: string;
  composeDocRefs: string[];
  arrangeDocRefs: string[];
  planSummary: string;
  songRequest: unknown;
}

export interface AutoComposeStepSummary {
  title: string;
  items: Array<{ label: string; value: string }>;
  quality?: QualityReport;
}

export interface AutoComposeEvent {
  kind: 'progress' | 'step-summary' | 'quality' | 'retry' | 'artifact' | 'halted' | 'cancelled' | 'complete';
  step: ComposeStep;
  progress: number;
  label: string;
  detail?: string;
  summary?: AutoComposeStepSummary;
  quality?: QualityReport;
  xml?: string;
  songDna?: unknown;
  blueprint?: unknown;
  readiness?: ProductionReadinessReport;
  identityLock?: { partId:string; changed:boolean; mode:'lead-part-and-score-part-exact' };
  context?: AutoCompositionContext;
  at: number;
}

export interface ProductionSnapshot {
  pipelineVersion?: string;
  qualityContractVersion?: string;
  sourceHead?: string;
  input?: { idea: string; styleId: string };
  compositionQuality: QualityReport;
  arrangementQuality: QualityReport;
  readiness: ProductionReadinessReport;
  songDna?: unknown;
  blueprint?: unknown;
  identityLock?: { partId:string; changed:boolean; mode:'lead-part-and-score-part-exact' };
  evaluatedRevisionId?: string;
  certifiedRevisionId?: string;
  generatedAt: number;
}
