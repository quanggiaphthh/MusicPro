import { AsyncLocalStorage } from 'node:async_hooks';

export type GenerationTelemetryOutcome = 'success' | 'timeout' | 'error' | 'validation-failed';
export type GenerationTelemetryStage = 'prepare-step1' | 'prepare-step2' | 'lead-sheet' | 'arrangement' | 'hook-forge' | 'song-weave' | 'song-patch';

export interface GenerationTelemetryInput {
  stage: GenerationTelemetryStage;
  model: string;
  startedAt: number;
  endedAt: number;
  promptChars: number;
  responseChars: number;
  outcome: GenerationTelemetryOutcome;
  retryReason?: string;
  errorCode?: string;
}

export interface GenerationTelemetryRecord extends GenerationTelemetryInput {
  runId?: string;
  durationMs: number;
}

type TelemetrySink = (label: string, record: GenerationTelemetryRecord) => void;
const runContext = new AsyncLocalStorage<{ runId: string; signal?: AbortSignal }>();

export function withGenerationRunContext<T>(runId: string, fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  return runContext.run({ runId, signal }, fn);
}

export function getGenerationRunSignal(): AbortSignal | undefined {
  return runContext.getStore()?.signal;
}

export function emitGenerationTelemetry(input: GenerationTelemetryInput, sink: TelemetrySink = (label, record) => console.info(label, record)): GenerationTelemetryRecord {
  const record: GenerationTelemetryRecord = {
    runId: runContext.getStore()?.runId,
    stage: input.stage,
    model: input.model,
    startedAt: input.startedAt,
    endedAt: input.endedAt,
    durationMs: Math.max(0, input.endedAt - input.startedAt),
    promptChars: Math.max(0, Math.round(input.promptChars)),
    responseChars: Math.max(0, Math.round(input.responseChars)),
    outcome: input.outcome,
    retryReason: input.retryReason,
    errorCode: input.errorCode,
  };
  sink('[music-pro:generation]', record);
  return record;
}

export interface GenerationValidationTelemetryInput {
  stage: GenerationTelemetryStage;
  model: string;
  responseChars: number;
  retryReason: string;
  errorCode?: string;
}

export function emitValidationFailureTelemetry(
  input: GenerationValidationTelemetryInput,
  sink: TelemetrySink = (label, record) => console.info(label, record),
): GenerationTelemetryRecord {
  const at = Date.now();
  return emitGenerationTelemetry({
    stage: input.stage,
    model: input.model,
    startedAt: at,
    endedAt: at,
    promptChars: 0,
    responseChars: input.responseChars,
    outcome: 'validation-failed',
    retryReason: input.retryReason,
    errorCode: input.errorCode,
  }, sink);
}
