# Local Background Auto-Compose Design

## Goal

Make Auto Composer reliable in the current single-server/local deployment before introducing durable cloud infrastructure. A composition run must survive client refreshes and navigation changes while the same server process is alive, and Step 3 must stop hanging indefinitely without weakening composition quality.

## Scope

This design is intentionally limited to the current server process. It does **not** survive Cloud Run process restart/redeploy. Durable cross-restart execution remains a later phase using persistent storage/queue infrastructure.

Protected behavior remains unchanged:

- Composer Core remains exactly four logical steps.
- Final MusicXML remains the master composition.
- `server/music/musicxml-validator.ts`, `server/music/song-dna.ts`, Lyria, SoundFont, and the iPad audio path are unchanged.
- No partial MusicXML is exposed as a valid artifact.
- Existing Composition/Arrangement quality gates and identity lock remain authoritative.

## Root causes being addressed

1. Step 3 sends one large Gemini request for a complete 150–240 second Lead Sheet with lyrics, melody, harmony, and piano reduction. The UI currently reports a fixed progress point while waiting, so repeated heartbeat text can look like a hang.
2. Provider requests have no bounded timeout at the generation boundary. A stalled upstream request can therefore remain pending for an unbounded period.
3. The current streamed HTTP request owns the server orchestration lifetime. `ComposeView` aborts when unmounted, and the server aborts when the stream closes. Refresh/navigation can therefore terminate the run.
4. Step 3 knowledge can include documents already present in mandatory core material, increasing prompt size without adding information.

## Architecture

### 1. Server-owned in-memory run registry

Create a focused module `server/music/auto-production-runs.ts` that owns background run state in memory.

Each run has:

```ts
type BackgroundRunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

interface BackgroundRunRecord {
  id: string;
  input: { idea: string; styleId: string; maxQualityRetries: number };
  status: BackgroundRunStatus;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  events: AutoComposeEvent[];
  result?: AutoComposeResult;
  error?: { code?: string; message: string };
  abortController: AbortController;
}
```

The registry starts `runServerAutoProduction()` asynchronously after creating the record. The browser connection is no longer the owner of the generation lifecycle. The client generates and persists a validated `compose-run-*` ID **before** `POST /api/compose/runs`; the server treats repeated creation with the same ID idempotently. This closes the ambiguous “server accepted the run but the POST response was lost” race without launching a duplicate Gemini generation.

Run records keep a compact event history with a hard cap. Large XML/SongDNA/Blueprint payloads are kept only in the authoritative run result/checkpoint fields, not duplicated repeatedly in event history.

Completed/failed/cancelled runs are evicted after a TTL. Active runs are never evicted.

### 2. HTTP API

Add endpoints next to the existing compose routes:

- `POST /api/compose/runs`
  - validates input;
  - creates a run;
  - responds immediately with `{ runId, status }`;
  - does not wait for Gemini.

- `GET /api/compose/runs/:runId`
  - returns a snapshot of run status, compact events, checkpoints/result/error.

- `POST /api/compose/runs/:runId/cancel`
  - the only user-initiated action that calls `AbortController.abort()`;
  - marks the run cancelled.

The old `/api/compose/run-stream` route may remain for compatibility/testing, but Auto UI no longer depends on keeping that connection open.

### 3. Client recovery

Create `src/compose/background-auto-compose.ts` for API interaction and local run-id persistence.

Use one local-storage key:

```ts
music-pro:auto-compose-active-run:v1
```

`ComposeView` behavior:

- Start: create and persist an idempotent `runId`, then `POST /api/compose/runs` with that ID and immediately begin polling. A transport failure keeps the ID for recovery; definite 4xx input rejection clears it.
- Poll approximately every 1.5 seconds while status is queued/running.
- Navigation/unmount: stop polling only; do **not** cancel the server run.
- Remount/refresh: read saved `runId`, fetch its snapshot, reconstruct progress UI, then continue polling if active.
- Terminal state: apply result/checkpoints to current UI/project storage. Clear the active-run key only after persistence succeeds; if local persistence fails and a recoverable artifact exists, retain the key so refresh can retry while the server record is inside its TTL.
- Explicit “Dừng”: call cancel endpoint, then clear active run only after the server reports cancelled. The same run AbortSignal is propagated to Step 1/2 and Step 3/4 provider waits so cancellation does not merely change UI state.

If the saved run ID no longer exists because the server restarted, show a clear message that the local background run was lost because the server session ended. Never silently start a duplicate generation.

### 4. Checkpoints and recovery

The server run record stores enough state to recover UI after refresh:

- Step 1/2 context from emitted event.
- Latest Lead Sheet artifact after Step 3.
- Step 3 quality report.
- Latest Arrangement artifact after Step 4.
- Production Readiness, SongDNA, Blueprint, identity lock from final result/event.

The client persists project/revision state when it observes an artifact, exactly as today. If the browser is absent when the artifact is produced, it is persisted locally after reconnect from the run snapshot.

### 5. Step 3 provider timeout

Add a provider request timeout at the generation boundary without changing model selection or output budget.

Use the supported `@google/genai` HTTP timeout capability or an equivalent wrapper at the generation call boundary. The timeout must be explicit and configurable with a conservative default suitable for long MusicXML output.

Recommended initial default:

```text
LEAD_SHEET_PROVIDER_TIMEOUT_MS = 240000
ARRANGEMENT_PROVIDER_TIMEOUT_MS = 300000
```

Timeout behavior:

- throw a specific error such as `GENERATION_TIMEOUT`;
- do not automatically launch a second generation when completion state at the provider is ambiguous;
- preserve any previously completed checkpoint;
- expose actionable UI text instead of leaving the run apparently stuck.

Validation-based retry remains unchanged: fallback/retry only occurs after a completed provider response fails deterministic validation/quality criteria.

### 6. Knowledge de-duplication

Before building Step 3 prompt context, remove references that are already present in mandatory Step 3 core material. Preserve order and do not remove unique user-selected/style-specific references.

This optimization must be deterministic and testable. It does not remove mandatory knowledge and does not lower any quality gate.

### 7. Progress semantics

During a provider call there is no reliable token-level completion percentage. The UI must stop implying that `32%` is live provider progress.

Keep overall step milestones, but render the current Step 3/4 provider phase as indeterminate with:

- elapsed time;
- last server update age;
- text such as “Gemini đang dựng Lead Sheet · server vẫn đang xử lý”.

The numeric overall progress may remain as a stage marker, but the visual provider indicator must be indeterminate while a single generation request is pending.

### 8. Telemetry

Record lightweight diagnostics per provider call:

- run ID;
- step;
- model name;
- start/end timestamp and duration;
- prompt character length or approximate token count if available cheaply;
- response character length;
- timeout vs success vs validation failure;
- retry reason.

Do not log full prompt, lyrics, MusicXML, API keys, or personal content.

## Error handling

- Browser refresh/navigation: no server cancellation.
- Explicit cancel: abort server-owned run.
- Provider timeout: terminal failure for that attempt; no ambiguous duplicate provider call.
- Server restart: run disappears; client reports `RUN_SESSION_LOST` and does not auto-restart.
- Project local-storage failure: artifact remains in run registry until TTL; reconnect can retry local persistence.
- Unknown/expired run ID: clear stale local run ID only after informing the user.

## Performance and quality policy

The first optimization pass is limited to:

- prompt de-duplication;
- removing duplicate event payloads;
- bounded provider timeout;
- eliminating client-held long-lived orchestration connection.

Do **not** split the Lead Sheet into multiple model calls yet. Do **not** lower song duration, MusicXML validation, Composition Quality, Arrangement Quality, or Production Readiness thresholds for speed.

If runtime telemetry still shows unacceptable Step 3 latency after this work, a separate design can evaluate staged composition generation.

## Acceptance criteria

The implementation is accepted locally only when all of the following are demonstrated:

```text
background-run-create: PASS
run-survives-route-change: PASS
run-survives-browser-refresh: PASS
recover-active-run-by-id: PASS
no-duplicate-generation-on-refresh: PASS
no-duplicate-generation-on-ambiguous-start: PASS
explicit-cancel-only: PASS
cancel-propagates-to-provider-wait: PASS
provider-timeout-bounded: PASS
provider-timeout-no-ambiguous-retry: PASS
step3-knowledge-dedup: PASS
lead-artifact-checkpoint: PASS
arrangement-artifact-checkpoint: PASS
terminal-result-recovery: PASS
terminal-artifact-persistence-retry: PASS
run-registry-memory-cleanup: PASS
existing-v1.4.1-tests: PASS
lint: PASS
build: PASS
composer-core-quality-regression: PASS
score-theater-regression: PASS
ipad-audio-source-regression: PASS
```
