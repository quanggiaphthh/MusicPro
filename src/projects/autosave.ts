export type SaveUiState = 'saved' | 'saving' | 'dirty';

export function shouldWarnBeforeUnload(saveState: SaveUiState, autosaveDirty: boolean): boolean {
  return saveState !== 'saved' || autosaveDirty;
}

export interface AutosaveControllerOptions<T> {
  delayMs: number;
  save: (snapshot: T) => Promise<void> | void;
  setTimer?: (fn: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (timer: ReturnType<typeof setTimeout>) => void;
  onError?: (error: unknown) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSavingChange?: (saving: boolean) => void;
}

export interface AutosaveController<T> {
  schedule(snapshot: T): void;
  flush(): Promise<void>;
  cancel(): void;
  isDirty(): boolean;
}

export function createAutosaveController<T>(options: AutosaveControllerOptions<T>): AutosaveController<T> {
  const setTimer = options.setTimer ?? ((fn, delay) => setTimeout(fn, delay));
  const clearTimer = options.clearTimer ?? (timer => clearTimeout(timer));
  const delayMs = Math.max(0, Math.round(options.delayMs));
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latest: T | undefined;
  let dirty = false;
  let inFlight: Promise<void> = Promise.resolve();

  const clearPendingTimer = () => {
    if (timer !== null) clearTimer(timer);
    timer = null;
  };

  const persistLatest = async () => {
    clearPendingTimer();
    if (!dirty || latest === undefined) return;
    const snapshot = latest;
    inFlight = inFlight.catch(() => undefined).then(async () => {
      options.onSavingChange?.(true);
      try {
        await options.save(snapshot);
        if (latest === snapshot) { dirty = false; options.onDirtyChange?.(false); }
      } catch (error) {
        options.onError?.(error);
        throw error;
      } finally {
        options.onSavingChange?.(false);
      }
    });
    await inFlight;
  };

  return {
    schedule(snapshot: T) {
      latest = snapshot;
      dirty = true;
      options.onDirtyChange?.(true);
      clearPendingTimer();
      timer = setTimer(() => { void persistLatest().catch(() => undefined); }, delayMs);
    },
    async flush() {
      await persistLatest();
    },
    cancel() {
      clearPendingTimer();
      latest = undefined;
      dirty = false;
      options.onDirtyChange?.(false);
    },
    isDirty() {
      return dirty;
    },
  };
}
