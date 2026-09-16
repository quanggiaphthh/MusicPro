import type { MusicProject, ScoreRevision } from './types';

/** Preserve append-only revision history when an older autosave finishes late. */
export function mergeRevisionsForPersistence(
  stored: ScoreRevision[],
  incoming: ScoreRevision[],
): ScoreRevision[] {
  const byId = new Map<string, ScoreRevision>();
  for (const revision of stored) byId.set(revision.id, revision);
  for (const revision of incoming) byId.set(revision.id, revision);
  return [...byId.values()].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

/** Never let a stale project snapshot move the active/lead pointers backwards. */
export function chooseProjectForPersistence(stored: MusicProject | undefined, incoming: MusicProject): MusicProject {
  if (!stored || incoming.updatedAt >= stored.updatedAt) return incoming;
  return stored;
}
