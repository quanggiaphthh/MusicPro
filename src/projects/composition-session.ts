export type WorkspaceScoreTarget = 'lead' | 'final';

/**
 * The score shown in Step 3 is always the lead sheet. Step 4 edits the final
 * arrangement only after one exists; otherwise it is still editing the lead.
 */
export function workspaceTargetForStep(step: 3 | 4, hasFinalArrangement: boolean): WorkspaceScoreTarget {
  if (step === 3) return 'lead';
  return hasFinalArrangement ? 'final' : 'lead';
}
