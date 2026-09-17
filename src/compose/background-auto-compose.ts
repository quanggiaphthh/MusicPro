import type { AutoComposeInput, AutoComposeResult } from './auto-compose.ts';
import type { AutoComposeEvent, AutoCompositionContext } from './types.ts';

export const ACTIVE_BACKGROUND_RUN_KEY = 'music-pro:auto-compose-active-run:v1';
export const ACTIVE_BACKGROUND_RUN_PROJECT_KEY = 'music-pro:auto-compose-active-project:v1';

export type BackgroundRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ActiveBackgroundRunSession {
  runId: string;
  projectId?: string;
}

export interface BackgroundRunArtifactCheckpoint {
  step: 3 | 4;
  xml: string;
  songDna?: unknown;
  blueprint?: unknown;
  quality?: AutoComposeEvent['quality'];
  readiness?: AutoComposeEvent['readiness'];
  identityLock?: AutoComposeEvent['identityLock'];
  at: number;
}

export interface BackgroundRunSnapshot {
  id: string;
  input: AutoComposeInput;
  maxQualityRetries: number;
  status: BackgroundRunStatus;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  events: AutoComposeEvent[];
  checkpoints: {
    context?: AutoCompositionContext;
    leadArtifact?: BackgroundRunArtifactCheckpoint;
    arrangementArtifact?: BackgroundRunArtifactCheckpoint;
  };
  result?: AutoComposeResult;
  error?: { code?: string; message: string };
}


export function shouldClearBackgroundRunSession(snapshot: BackgroundRunSnapshot, persistenceSucceeded: boolean): boolean {
  if (snapshot.status === 'queued' || snapshot.status === 'running') return false;
  const hasRecoverableArtifact = Boolean(
    snapshot.result?.leadSheetXml ||
    snapshot.result?.finalXml ||
    snapshot.checkpoints.leadArtifact?.xml ||
    snapshot.checkpoints.arrangementArtifact?.xml
  );
  if (!persistenceSucceeded && hasRecoverableArtifact) return false;
  return true;
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface BackgroundAutoComposeClientOptions {
  fetchImpl?: typeof fetch;
  storage?: StorageLike;
}

export interface BackgroundAutoComposeStartInput extends AutoComposeInput {
  maxQualityRetries?: number;
}

async function readJson(response: Response): Promise<any> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error: any = new Error(data?.error?.message || `HTTP ${response.status}`);
    error.code = data?.error?.code || (response.status === 404 || response.status === 410 ? 'RUN_SESSION_LOST' : 'BACKGROUND_RUN_REQUEST_FAILED');
    error.status = response.status;
    throw error;
  }
  return data;
}

export function createBackgroundRunId(): string {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `compose-run-${random}`;
}

export async function startBackgroundAutoComposition(
  input: BackgroundAutoComposeStartInput,
  options: BackgroundAutoComposeClientOptions = {},
): Promise<{ runId: string; status: BackgroundRunStatus }> {
  const fetchImpl = options.fetchImpl || fetch;
  const storage = options.storage ?? defaultStorage();
  const runId = createBackgroundRunId();
  writeActiveBackgroundRunId(runId, storage);
  try {
    const data = await readJson(await fetchImpl('/api/compose/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        runId,
        idea: input.idea,
        styleId: input.styleId,
        maxQualityRetries: Math.max(0, Math.min(2, input.maxQualityRetries ?? 1)),
      }),
    }));
    if (!data?.runId) throw Object.assign(new Error('Server không trả runId.'), { code: 'BACKGROUND_RUN_ID_MISSING' });
    if (String(data.runId) !== runId) throw Object.assign(new Error('Server trả runId không khớp request idempotent.'), { code: 'BACKGROUND_RUN_ID_MISMATCH' });
    return { runId, status: data.status || 'queued' };
  } catch (error: any) {
    if (Number(error?.status) >= 400 && Number(error?.status) < 500) writeActiveBackgroundRunId(undefined, storage);
    throw error;
  }
}

export async function getBackgroundAutoComposition(
  runId: string,
  options: BackgroundAutoComposeClientOptions = {},
): Promise<BackgroundRunSnapshot> {
  const fetchImpl = options.fetchImpl || fetch;
  return readJson(await fetchImpl(`/api/compose/runs/${encodeURIComponent(runId)}`, {
    method: 'GET', headers: { Accept: 'application/json' },
  }));
}

export async function cancelBackgroundAutoComposition(
  runId: string,
  options: BackgroundAutoComposeClientOptions = {},
): Promise<BackgroundRunSnapshot> {
  const fetchImpl = options.fetchImpl || fetch;
  return readJson(await fetchImpl(`/api/compose/runs/${encodeURIComponent(runId)}/cancel`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
  }));
}

function defaultStorage(): StorageLike | undefined {
  try { return (globalThis as any).localStorage as StorageLike | undefined; } catch { return undefined; }
}

export function readActiveBackgroundRunId(storage: StorageLike | undefined = defaultStorage()): string | undefined {
  try {
    const value = storage?.getItem(ACTIVE_BACKGROUND_RUN_KEY)?.trim();
    return value || undefined;
  } catch { return undefined; }
}

export function writeActiveBackgroundRunId(runId?: string, storage: StorageLike | undefined = defaultStorage()): void {
  try {
    if (!storage) return;
    if (runId?.trim()) storage.setItem(ACTIVE_BACKGROUND_RUN_KEY, runId.trim());
    else storage.removeItem(ACTIVE_BACKGROUND_RUN_KEY);
  } catch { /* best-effort only; server run must continue */ }
}


export function readActiveBackgroundRunSession(storage: StorageLike | undefined = defaultStorage()): ActiveBackgroundRunSession | undefined {
  const runId = readActiveBackgroundRunId(storage);
  if (!runId) return undefined;
  try {
    const projectId = storage?.getItem(ACTIVE_BACKGROUND_RUN_PROJECT_KEY)?.trim() || undefined;
    return { runId, projectId };
  } catch {
    return { runId };
  }
}

export function writeActiveBackgroundRunProjectId(projectId?: string, storage: StorageLike | undefined = defaultStorage()): void {
  try {
    if (!storage) return;
    if (projectId?.trim()) storage.setItem(ACTIVE_BACKGROUND_RUN_PROJECT_KEY, projectId.trim());
    else storage.removeItem(ACTIVE_BACKGROUND_RUN_PROJECT_KEY);
  } catch { /* best-effort only */ }
}

export function clearActiveBackgroundRunSession(storage: StorageLike | undefined = defaultStorage()): void {
  writeActiveBackgroundRunId(undefined, storage);
  writeActiveBackgroundRunProjectId(undefined, storage);
}
