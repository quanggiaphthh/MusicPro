import { runServerAutoProduction, type ServerAutoProductionDeps, type ServerAutoProductionOptions } from './auto-production-stream.ts';
import type { AutoComposeInput, AutoComposeResult } from '../../src/compose/auto-compose.ts';
import type { AutoComposeEvent, AutoCompositionContext } from '../../src/compose/types.ts';
import { withGenerationRunContext } from './generation-telemetry.ts';

export type BackgroundRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

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

export interface BackgroundRunCheckpoints {
  context?: AutoCompositionContext;
  leadArtifact?: BackgroundRunArtifactCheckpoint;
  arrangementArtifact?: BackgroundRunArtifactCheckpoint;
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
  checkpoints: BackgroundRunCheckpoints;
  result?: AutoComposeResult;
  error?: {
    code?: string;
    message: string;
    quality?: AutoComposeEvent['quality'];
    tone?: { score:number; status:string; evaluatedPairs:number; contraryPairCount:number };
  };
}

interface BackgroundRunRecord extends BackgroundRunSnapshot {
  abortController: AbortController;
  cleanupTimer?: ReturnType<typeof setTimeout>;
}

export interface BackgroundRunRegistryOptions {
  maxEvents?: number;
  terminalTtlMs?: number;
  runner?: (
    input: AutoComposeInput,
    deps: ServerAutoProductionDeps,
    options?: ServerAutoProductionOptions,
  ) => Promise<AutoComposeResult>;
  now?: () => number;
  setTimer?: (fn: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
}

export interface CreateBackgroundRunOptions { maxQualityRetries?: number; runId?: string; }

export interface BackgroundRunRegistry {
  create(input: AutoComposeInput, options?: CreateBackgroundRunOptions): BackgroundRunSnapshot;
  get(id: string): BackgroundRunSnapshot | undefined;
  cancel(id: string): BackgroundRunSnapshot | undefined;
  dispose(): void;
}

export function createBackgroundRunApiHandlers(registry: Pick<BackgroundRunRegistry, 'create'|'get'|'cancel'>) {
  return {
    create(req: any, res: any) {
      const idea = String(req.body?.idea || '').trim();
      const styleId = String(req.body?.styleId || 'STYLE.VN.VPOP-BALLAD');
      const maxQualityRetries = Math.max(0, Math.min(2, Number(req.body?.maxQualityRetries ?? 1) || 0));
      if (!idea) return res.status(400).json({ error: { code: 'IDEA_REQUIRED', message: 'Idea is required' } });
      const requestedRunId = typeof req.body?.runId === 'string' ? req.body.runId.trim() : undefined;
      if (requestedRunId !== undefined && !isValidBackgroundRunId(requestedRunId)) {
        return res.status(400).json({ error: { code: 'INVALID_RUN_ID', message: 'Invalid background run id.' } });
      }
      const run = registry.create({ idea, styleId }, { maxQualityRetries, runId: requestedRunId });
      return res.status(202).json({ runId: run.id, status: run.status, createdAt: run.createdAt });
    },
    get(req: any, res: any) {
      const run = registry.get(String(req.params?.runId || ''));
      if (!run) return res.status(404).json({ error: { code: 'RUN_SESSION_LOST', message: 'Background composition run is no longer available in this server session.' } });
      return res.json(run);
    },
    cancel(req: any, res: any) {
      const run = registry.cancel(String(req.params?.runId || ''));
      if (!run) return res.status(404).json({ error: { code: 'RUN_SESSION_LOST', message: 'Background composition run is no longer available in this server session.' } });
      return res.json(run);
    },
  };
}

function compactEvent(event: AutoComposeEvent): AutoComposeEvent {
  const { xml: _xml, songDna: _songDna, blueprint: _blueprint, context: _context, ...rest } = event;
  return rest as AutoComposeEvent;
}

function publicSnapshot(record: BackgroundRunRecord): BackgroundRunSnapshot {
  return {
    id: record.id,
    input: { ...record.input },
    maxQualityRetries: record.maxQualityRetries,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    startedAt: record.startedAt,
    completedAt: record.completedAt,
    events: record.events.map(event => ({ ...event })),
    checkpoints: {
      context: record.checkpoints.context ? { ...record.checkpoints.context } : undefined,
      leadArtifact: record.checkpoints.leadArtifact ? { ...record.checkpoints.leadArtifact } : undefined,
      arrangementArtifact: record.checkpoints.arrangementArtifact ? { ...record.checkpoints.arrangementArtifact } : undefined,
    },
    result: record.result,
    error: record.error ? { ...record.error } : undefined,
  };
}

function isValidBackgroundRunId(value: string): boolean {
  return /^compose-run-[A-Za-z0-9_-]{8,160}$/.test(value);
}

function newRunId(): string {
  const random = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `compose-run-${random}`;
}

export function createBackgroundRunRegistry(deps: ServerAutoProductionDeps, options: BackgroundRunRegistryOptions = {}): BackgroundRunRegistry {
  const maxEvents = Math.max(1, Math.round(options.maxEvents ?? 80));
  const terminalTtlMs = Math.max(1, Math.round(options.terminalTtlMs ?? 30 * 60_000));
  const runner = options.runner ?? runServerAutoProduction;
  const now = options.now ?? (() => Date.now());
  const setTimer = options.setTimer ?? ((fn, delay) => setTimeout(fn, delay));
  const clearTimer = options.clearTimer ?? (timer => clearTimeout(timer));
  const runs = new Map<string, BackgroundRunRecord>();

  const scheduleCleanup = (record: BackgroundRunRecord) => {
    if (record.cleanupTimer) clearTimer(record.cleanupTimer);
    record.cleanupTimer = setTimer(() => {
      const current = runs.get(record.id);
      if (!current || current.status === 'queued' || current.status === 'running') return;
      runs.delete(record.id);
    }, terminalTtlMs);
  };

  const captureEvent = async (record: BackgroundRunRecord, event: AutoComposeEvent) => {
    const timestamp = now();
    record.updatedAt = timestamp;
    if (event.context) record.checkpoints.context = event.context;
    if (event.kind === 'artifact' && event.xml && event.step === 3) {
      record.checkpoints.leadArtifact = {
        step: 3, xml: event.xml, songDna: event.songDna, blueprint: event.blueprint,
        quality: event.quality, readiness: event.readiness, identityLock: event.identityLock, at: event.at,
      };
    }
    if (event.kind === 'artifact' && event.xml && event.step === 4) {
      record.checkpoints.arrangementArtifact = {
        step: 4, xml: event.xml, songDna: event.songDna, blueprint: event.blueprint,
        quality: event.quality, readiness: event.readiness, identityLock: event.identityLock, at: event.at,
      };
    }
    record.events.push(compactEvent(event));
    if (record.events.length > maxEvents) record.events.splice(0, record.events.length - maxEvents);
  };

  const start = (record: BackgroundRunRecord) => {
    queueMicrotask(async () => {
      if (record.status === 'cancelled') return;
      record.status = 'running';
      record.startedAt = now();
      record.updatedAt = record.startedAt;
      try {
        const result = await withGenerationRunContext(record.id, () => runner(record.input, deps, {
          maxQualityRetries: record.maxQualityRetries,
          signal: record.abortController.signal,
          onEvent: event => captureEvent(record, event),
        }), record.abortController.signal);
        if (record.abortController.signal.aborted) return;
        record.result = result;
        record.status = 'completed';
        record.completedAt = now();
        record.updatedAt = record.completedAt;
        if (!record.checkpoints.context) record.checkpoints.context = result.context;
        scheduleCleanup(record);
      } catch (error: any) {
        if (record.abortController.signal.aborted || error?.name === 'AbortError') {
          record.status = 'cancelled';
          record.completedAt = record.completedAt || now();
          record.updatedAt = record.completedAt;
          scheduleCleanup(record);
          return;
        }
        record.status = 'failed';
        const payloadError=error?.payload?.error;
        record.error = {
          code: error?.code,
          message: error?.message || 'Auto production failed.',
          ...((error?.quality||payloadError?.quality)?{quality:error?.quality||payloadError?.quality}:{}),
          ...((error?.tone||payloadError?.tone)?{tone:error?.tone||payloadError?.tone}:{}),
        };
        record.completedAt = now();
        record.updatedAt = record.completedAt;
        scheduleCleanup(record);
      }
    });
  };

  return {
    create(input: AutoComposeInput, createOptions: CreateBackgroundRunOptions = {}): BackgroundRunSnapshot {
      const requestedRunId = String(createOptions.runId || '').trim();
      const acceptedRunId = isValidBackgroundRunId(requestedRunId) ? requestedRunId : undefined;
      if (acceptedRunId) {
        const existing = runs.get(acceptedRunId);
        if (existing) return publicSnapshot(existing);
      }
      const createdAt = now();
      const record: BackgroundRunRecord = {
        id: acceptedRunId || newRunId(), input: { ...input }, maxQualityRetries: Math.max(0, Math.min(2, createOptions.maxQualityRetries ?? 1)),
        status: 'queued', createdAt, updatedAt: createdAt, events: [], checkpoints: {}, abortController: new AbortController(),
      };
      runs.set(record.id, record);
      start(record);
      return publicSnapshot(record);
    },
    get(id: string): BackgroundRunSnapshot | undefined {
      const record = runs.get(id);
      return record ? publicSnapshot(record) : undefined;
    },
    cancel(id: string): BackgroundRunSnapshot | undefined {
      const record = runs.get(id);
      if (!record) return undefined;
      if (record.status === 'queued' || record.status === 'running') {
        record.status = 'cancelled';
        record.completedAt = now();
        record.updatedAt = record.completedAt;
        record.abortController.abort();
        scheduleCleanup(record);
      }
      return publicSnapshot(record);
    },
    dispose(): void {
      for (const record of runs.values()) {
        if (record.cleanupTimer) clearTimer(record.cleanupTimer);
        if (record.status === 'queued' || record.status === 'running') record.abortController.abort();
      }
      runs.clear();
    },
  };
}
