export type R3ProviderStage = 'hook-forge' | 'song-weave' | 'song-patch';
export type ProviderStage = 'lead-sheet' | 'arrangement' | R3ProviderStage;

const DEFAULT_TIMEOUT_MS: Record<'lead-sheet'|'arrangement', number> = {
  'lead-sheet': 180_000,
  arrangement: 300_000,
};

const R3_STAGE_CAP_MS:Record<R3ProviderStage,number>={
  'hook-forge':60_000,
  'song-weave':120_000,
  'song-patch':60_000,
};

export function getR3StageCapMs(stage:R3ProviderStage):number { return R3_STAGE_CAP_MS[stage]; }

export function getProviderTimeoutMs(stage: ProviderStage): number {
  if(stage==='hook-forge'||stage==='song-weave'||stage==='song-patch') return R3_STAGE_CAP_MS[stage];
  const envName = stage === 'lead-sheet' ? 'LEAD_SHEET_PROVIDER_TIMEOUT_MS' : 'ARRANGEMENT_PROVIDER_TIMEOUT_MS';
  const raw = Number(process.env[envName]);
  if (Number.isFinite(raw) && raw > 0) return Math.max(1, Math.round(raw));
  return DEFAULT_TIMEOUT_MS[stage];
}

export interface ProviderDeadline {
  remainingMs():number;
  timeoutFor(stage:R3ProviderStage):number;
}

export function createProviderDeadline(totalMs=getProviderTimeoutMs('lead-sheet'), now:()=>number=Date.now):ProviderDeadline {
  const startedAt=now();
  const total=Math.max(1,Math.round(totalMs));
  return {
    remainingMs(){ return Math.max(0,total-(now()-startedAt)); },
    timeoutFor(stage){
      const remaining=Math.max(0,total-(now()-startedAt));
      if(remaining<=0){
        const error:any=new Error('STEP3_DEADLINE_EXCEEDED');
        error.code='STEP3_DEADLINE_EXCEEDED';
        error.stage=stage;
        throw error;
      }
      return Math.max(1,Math.min(R3_STAGE_CAP_MS[stage],remaining));
    },
  };
}

function stageLabel(stage:ProviderStage):string {
  switch(stage){
    case 'lead-sheet': return 'Lead Sheet';
    case 'arrangement': return 'Arrangement';
    case 'hook-forge': return 'Hook Forge';
    case 'song-weave': return 'Song Weave';
    case 'song-patch': return 'Song Patch';
  }
}

export async function runWithProviderTimeout<T>(operation: () => Promise<T>, timeoutMs: number, stage: ProviderStage, signal?: AbortSignal): Promise<T> {
  const bounded = Math.max(1, Math.round(timeoutMs));
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  try {
    const candidates: Promise<T>[] = [
      operation(),
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => {
          const error: any = new Error(`${stageLabel(stage)} generation exceeded ${bounded}ms provider timeout.`);
          error.code = 'GENERATION_TIMEOUT';
          error.stage = stage;
          error.timeoutMs = bounded;
          reject(error);
        }, bounded);
      }),
    ];
    if (signal) {
      candidates.push(new Promise<T>((_resolve, reject) => {
        onAbort = () => reject(new DOMException('Aborted', 'AbortError'));
        signal.addEventListener('abort', onAbort, { once:true });
      }));
    }
    return await Promise.race(candidates);
  } finally {
    if (timer) clearTimeout(timer);
    if (signal && onAbort) signal.removeEventListener('abort', onAbort);
  }
}
