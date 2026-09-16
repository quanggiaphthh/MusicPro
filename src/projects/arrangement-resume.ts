import type { CompositionContext, MusicProjectBundle, ScoreRevision } from './types';

function stringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

export function hasArrangementContext(context: CompositionContext | undefined): context is CompositionContext {
  return Boolean(context?.arrangePrompt?.trim() && Array.isArray(context.arrangeDocRefs) && context.songRequest != null);
}

export function normalizeCompositionContext(value: any): CompositionContext {
  const arrangePrompt = typeof value?.arrangePrompt === 'string' ? value.arrangePrompt.trim() : '';
  if (!arrangePrompt) throw new Error('prepare response is missing arrangePrompt');
  if (value?.songRequest == null) throw new Error('prepare response is missing songRequest');
  return {
    metaPlan: typeof value?.metaPlan === 'string' ? value.metaPlan : '',
    composePrompt: typeof value?.composePrompt === 'string' ? value.composePrompt : '',
    arrangePrompt,
    composeDocRefs: stringArray(value?.composeDocRefs),
    arrangeDocRefs: stringArray(value?.arrangeDocRefs),
    planSummary: typeof value?.planSummary === 'string' ? value.planSummary : '',
    songRequest: value.songRequest,
  };
}

export function getArrangementLeadRevision(bundle: MusicProjectBundle): ScoreRevision | undefined {
  if (bundle.project.leadRevisionId) {
    const lead = bundle.revisions.find(revision => revision.id === bundle.project.leadRevisionId);
    if (lead) return lead;
  }
  return [...bundle.revisions].reverse().find(revision => revision.reason === 'compose');
}


export function isArrangementSourceRevision(bundle: MusicProjectBundle, revisionId: string | undefined): boolean {
  if (!revisionId) return false;
  return getArrangementLeadRevision(bundle)?.id === revisionId;
}

export function withCompositionContext(
  bundle: MusicProjectBundle,
  context: CompositionContext,
  now = Date.now(),
): MusicProjectBundle {
  return {
    ...bundle,
    project: {
      ...bundle.project,
      updatedAt: now,
      compositionContext: {
        ...context,
        composeDocRefs: [...(context.composeDocRefs || [])],
        arrangeDocRefs: [...context.arrangeDocRefs],
      },
    },
    revisions: bundle.revisions.map(revision => ({ ...revision })),
  };
}
