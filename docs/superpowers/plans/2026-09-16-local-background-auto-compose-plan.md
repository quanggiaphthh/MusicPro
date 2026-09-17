# Local Background Auto-Compose Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Keep Auto Composer running across refresh/navigation in the same server process, bound Step 3/4 provider waits, and reduce avoidable prompt/event overhead without weakening Music-Pro quality contracts.

**Architecture:** Move orchestration ownership from a long-lived browser NDJSON connection to an in-memory server run registry. The client starts a run, stores its `runId`, polls snapshots, and reconnects after refresh/navigation; explicit cancel is the only client action that aborts the server run. Provider timeout and knowledge de-duplication are added at the generation boundary while existing Composer/quality behavior remains intact.

**Tech Stack:** React 19, TypeScript, Express, `@google/genai`, current Music-Pro local project repository, localStorage, Node timers/AbortController.

**Spec:** `docs/superpowers/specs/2026-09-16-local-background-auto-compose-design.md`

## Global Constraints

- Exactly four logical Composer steps; no Step 5.
- Final MusicXML remains the master composition.
- Do not change `server/music/musicxml-validator.ts`, `server/music/song-dna.ts`, Lyria, SoundFont, or the iPad offline-WAV/HTMLAudioElement playback path.
- Do not lower Composition Quality, Arrangement Quality, Production Readiness, or duration requirements for full songs.
- No auto GitHub commit/push in this execution.
- Server-session survival only; cross-restart/redeploy durability is explicitly out of scope.

---

### Task 1: Server-owned run registry

**Files:**
- Create: `server/music/auto-production-runs.ts`
- Test: `tests/compose/background-run-registry.test.ts`

**Interfaces:**
- Consumes: `runServerAutoProduction()` and `AutoComposeEvent`/`AutoComposeResult`.
- Produces: `createBackgroundRunRegistry(deps, options)` with `create`, `get`, `cancel`, and `dispose` methods.

- [x] **Step 1: Write failing registry lifecycle tests**

Cover create→running→completed, explicit cancel, compact event history, TTL cleanup, and preservation of active runs.

- [x] **Step 2: Run the test and confirm RED**

Run:

```bash
npx tsx tests/compose/background-run-registry.test.ts
```

Expected: module/function missing.

- [x] **Step 3: Implement the minimal registry**

Use a `Map<string, BackgroundRunRecord>`, one `AbortController` per run, asynchronous execution, bounded event history, and terminal TTL cleanup. A dropped HTTP client must never call `abort()`.

- [x] **Step 4: Run the lifecycle test and confirm GREEN**

```bash
npx tsx tests/compose/background-run-registry.test.ts
```

Expected: PASS.

---

### Task 2: Background run HTTP API

**Files:**
- Modify: `server.ts`
- Modify: `server/music/auto-production-runs.ts`
- Test: `tests/compose/background-run-api-policy.test.ts`
- Test: `tests/compose/background-run-api.test.ts`

**Interfaces:**
- Consumes: registry from Task 1.
- Produces:
  - `POST /api/compose/runs`
  - `GET /api/compose/runs/:runId`
  - `POST /api/compose/runs/:runId/cancel`

- [x] **Step 1: Write failing route/policy tests**

Assert that creating a run returns immediately with `runId`, GET returns a recoverable snapshot, disconnecting does not cancel, and explicit cancel does.

- [x] **Step 2: Confirm RED**

```bash
npx tsx tests/compose/background-run-api-policy.test.ts
npx tsx tests/compose/background-run-api.test.ts
```

- [x] **Step 3: Register the API beside existing compose routes**

Reuse the same server dependencies already supplied to `createAutoProductionStreamHandler`; do not duplicate Composer logic.

- [x] **Step 4: Confirm GREEN**

Run both tests again; expected PASS.

---

### Task 3: Client background-run API and run-ID persistence

**Files:**
- Create: `src/compose/background-auto-compose.ts`
- Test: `tests/compose/background-auto-compose.test.ts`

**Interfaces:**
- Produces:
  - `startBackgroundAutoComposition(input): Promise<{runId:string}>`
  - `getBackgroundAutoComposition(runId): Promise<BackgroundRunSnapshot>`
  - `cancelBackgroundAutoComposition(runId): Promise<void>`
  - `readActiveBackgroundRunId(): string | undefined`
  - `writeActiveBackgroundRunId(runId?: string): void`

- [x] **Step 1: Write failing API/storage tests**

Include localStorage unavailable/quota failure as best-effort behavior; storage failure must not cancel the server run.

- [x] **Step 2: Confirm RED**

```bash
npx tsx tests/compose/background-auto-compose.test.ts
```

- [x] **Step 3: Implement the API client and storage helper**

Use `music-pro:auto-compose-active-run:v1`. Treat 404/410 as expired/session-lost; never auto-start a replacement run.

- [x] **Step 4: Confirm GREEN**

Run the test; expected PASS.

---

### Task 4: ComposeView recovery and explicit cancellation

**Files:**
- Modify: `src/views/ComposeView.tsx`
- Test: `tests/compose/background-compose-ui-policy.test.ts`
- Test: `tests/compose/background-compose-recovery.test.ts`

**Interfaces:**
- Consumes: Task 3 API.
- Produces: start/poll/recover/apply-terminal-result behavior in `ComposeView`.

- [x] **Step 1: Write failing UI policy tests**

Assert removal of unmount-triggered auto-run abort, persistence of runId, polling after remount, explicit cancel endpoint usage, and no duplicate `POST /api/compose/runs` on recovery.

- [x] **Step 2: Confirm RED**

```bash
npx tsx tests/compose/background-compose-ui-policy.test.ts
npx tsx tests/compose/background-compose-recovery.test.ts
```

- [x] **Step 3: Replace long-lived stream ownership in Auto mode**

Keep existing artifact→project persistence code, but feed it from run snapshots. Navigation cleanup stops timers only. Explicit stop calls the cancel endpoint.

- [x] **Step 4: Add initial recovery effect**

On mount, read the saved run ID, fetch snapshot, reconstruct context/events/artifacts, and resume polling if queued/running. For `RUN_SESSION_LOST`, show a clear toast and clear the stale ID without starting a replacement generation.

- [x] **Step 5: Confirm GREEN**

Run both tests; expected PASS.

---

### Task 5: Provider timeout with no ambiguous duplicate retry

**Files:**
- Modify: `server/music/composer.ts`
- Test: `tests/compose/provider-timeout.test.ts`

**Interfaces:**
- Existing exported function signatures remain unchanged.
- Timeout failure uses error code `GENERATION_TIMEOUT`.

- [x] **Step 1: Write a failing timeout test using injected `GenerateFn`**

Use a generate stub that never resolves. Assert timeout is bounded and no second provider call occurs because timeout completion state is ambiguous.

- [x] **Step 2: Confirm RED**

```bash
npx tsx tests/compose/provider-timeout.test.ts
```

- [x] **Step 3: Add a narrow timeout wrapper at the provider call boundary**

Use the SDK-supported request timeout where available, with conservative defaults equivalent to 240s Lead / 300s Arrangement. Keep validation-based fallback behavior unchanged after completed invalid responses.

- [x] **Step 4: Confirm GREEN**

Run the test; expected PASS.

---

### Task 6: Step 3/4 knowledge de-duplication

**Files:**
- Modify: `server/music/composer.ts`
- Test: `tests/compose/knowledge-dedup.test.ts`

**Interfaces:**
- No public API changes.

- [x] **Step 1: Write a failing de-duplication test**

Provide refs that overlap mandatory Step 3/4 docs and verify each document appears at most once while unique refs are preserved in order.

- [x] **Step 2: Confirm RED**

```bash
npx tsx tests/compose/knowledge-dedup.test.ts
```

- [x] **Step 3: Implement deterministic de-duplication**

Deduplicate by canonical document ID/path before prompt concatenation. Do not remove mandatory docs and do not alter quality checks.

- [x] **Step 4: Confirm GREEN**

Run the test; expected PASS.

---

### Task 7: Honest indeterminate provider progress

**Files:**
- Modify: `src/components/compose/AutoComposeProgress.tsx`
- Modify: `src/compose/types.ts` only if a small explicit provider-wait flag is required
- Test: `tests/compose/background-progress-ui.test.ts`

**Interfaces:**
- UI must distinguish stage milestone progress from indeterminate provider wait.

- [x] **Step 1: Write failing UI policy tests**

Assert that Step 3/4 provider waiting renders server-processing/elapsed text and an indeterminate visual state rather than presenting the stage marker as live token completion.

- [x] **Step 2: Confirm RED**

```bash
npx tsx tests/compose/background-progress-ui.test.ts
```

- [x] **Step 3: Implement the minimum UI change**

Keep step cards and stage milestones. Make provider-wait bar indeterminate and display last update age/elapsed time.

- [x] **Step 4: Confirm GREEN**

Run the test; expected PASS.

---

### Task 8: Lightweight generation telemetry

**Files:**
- Create: `server/music/generation-telemetry.ts`
- Modify: `server/music/composer.ts`
- Modify: `server/music/auto-production-runs.ts`
- Test: `tests/compose/generation-telemetry.test.ts`

**Interfaces:**
- Produces sanitized timing/size records only; never full prompt/XML/lyrics.

- [x] **Step 1: Write failing telemetry tests**

Assert presence of run/step/model/duration/size/outcome and absence of raw content.

- [x] **Step 2: Confirm RED**

```bash
npx tsx tests/compose/generation-telemetry.test.ts
```

- [x] **Step 3: Implement sanitized telemetry**

Use structured server logs; no persistence dependency.

- [x] **Step 4: Confirm GREEN**

Run the test; expected PASS.

---

### Task 9: Regression and local acceptance suite

**Files:**
- Modify only tests/docs if verification reveals a test harness issue; do not change production behavior without returning to the failing task.

**Interfaces:**
- Produces evidence for the design acceptance matrix.

- [x] **Step 1: Run all new background-run tests**

```bash
for f in \
  tests/compose/background-run-registry.test.ts \
  tests/compose/background-run-api-policy.test.ts \
  tests/compose/background-run-api.test.ts \
  tests/compose/background-auto-compose.test.ts \
  tests/compose/background-compose-ui-policy.test.ts \
  tests/compose/background-compose-recovery.test.ts \
  tests/compose/provider-timeout.test.ts \
  tests/compose/knowledge-dedup.test.ts \
  tests/compose/background-progress-ui.test.ts \
  tests/compose/generation-telemetry.test.ts; do npx tsx "$f" || exit 1; done
```

Expected: all PASS.

- [x] **Step 2: Run existing v1.4.1 compose/music/project regression tests**

Use the existing targeted suite from `UPLOAD_AUTO_PRODUCTION_PIPELINE_TO_AISTUDIO.md`. No live Gemini/Lyria calls in automated tests.

- [ ] **Step 3: Run lint**

```bash
npm run lint
```

Expected: exit 0.

- [ ] **Step 4: Run production build**

```bash
npm run build
```

Expected: exit 0.

- [ ] **Step 5: Manual local recovery acceptance**

Start one Auto run, navigate to another menu and return, then refresh the browser. Verify the same `runId` continues and no second generation is created. Verify explicit cancel is the only action that stops it.

- [ ] **Step 6: Manual Step 3 timeout/error acceptance**

Using a controlled test timeout/config, verify the UI terminates with `GENERATION_TIMEOUT` and retains completed checkpoints rather than staying indefinitely at a fixed percentage.

- [ ] **Step 7: Record the exact acceptance matrix from the spec**

Do not claim PASS for lint/build/manual runtime without fresh command/manual evidence.


## Execution checkpoint — 2026-09-16

Implemented and locally verified without live Gemini/Lyria calls:

- Server-owned in-memory run registry with bounded history and terminal TTL.
- Client-generated idempotent `runId` persisted before POST; ambiguous POST loss reconnects to the same server run instead of starting a duplicate.
- Auto UI survives refresh/navigation within the same server process; unmount stops polling only.
- Explicit cancel endpoint is the only user action that aborts a run; Step 1/2 and Step 3/4 provider calls are cancel-aware.
- Terminal run ID is retained when local project persistence fails but a recoverable artifact exists, so refresh can retry persistence within TTL.
- Lead/Arrangement provider timeout is bounded at 240s/300s by default, with no ambiguous timeout-triggered provider retry.
- Step 3/4 knowledge refs are deduplicated against mandatory core docs and the separately loaded style card.
- Provider wait UI is indeterminate and no longer presents the stage marker as token-level progress.
- Sanitized telemetry covers Step 1/2/3/4 provider calls and deterministic validation failures without raw prompt, lyrics, MusicXML, or API keys.

Fresh automated evidence in the isolated sandbox:

```text
compose tests: 66/66 PASS
selected music/project regressions: 14/14 PASS
TS/TSX syntax-transpile: 207 files, 0 errors
targeted semantic TypeScript: PASS
```

Not claimed locally because the sandbox has no installed project dependencies/browser runtime:

- `npm run lint`
- `npm run build`
- manual browser refresh/navigation with a real Gemini call
- controlled real-provider timeout acceptance

Those remain mandatory before the patch is considered runtime-accepted.
