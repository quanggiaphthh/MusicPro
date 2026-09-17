# Music-Pro — Local Background Auto-Compose

Version scope: v1.4.1 base + local background-run hardening candidate r2.

## Purpose

This patch fixes the Auto Composer behavior where Step 3 can appear stuck while Gemini is building a complete Lead Sheet, and makes the Auto run survive browser refresh or menu navigation **within the same server process**.

It does **not** add Firestore, Cloud Tasks, or cross-restart durability. If the Node/Cloud Run process restarts, the in-memory run is intentionally lost and the UI reports `RUN_SESSION_LOST` instead of silently starting another generation.

## Architecture

- `POST /api/compose/runs` creates an idempotent server-owned run and returns immediately.
- `GET /api/compose/runs/:runId` returns a recoverable snapshot.
- `POST /api/compose/runs/:runId/cancel` is the only user-triggered cancellation path.
- `runId` and project binding are stored best-effort in localStorage so refresh/navigation can reconnect.
- Server keeps bounded event history plus Step 2 context, Lead Sheet artifact and Arrangement artifact checkpoints.
- Terminal runs are retained in memory for a bounded TTL so local persistence can be retried after refresh.

## Step 3/4 stability and speed hardening

- Lead Sheet provider wait is bounded to 240 seconds by default.
- Arrangement provider wait is bounded to 300 seconds by default.
- Optional env overrides:
  - `LEAD_SHEET_PROVIDER_TIMEOUT_MS`
  - `ARRANGEMENT_PROVIDER_TIMEOUT_MS`
- Timeout does not trigger an ambiguous second provider generation.
- Explicit cancel propagates an abort signal into Step 1/2 and Step 3/4 provider calls.
- Mandatory Knowledge + style card are de-duplicated from model-selected DOC_REFS before prompt concatenation.
- Progress during provider wait is explicitly indeterminate; fixed stage percentages are not presented as token-level completion.
- Sanitized telemetry logs timing/size/outcome and validation retry reasons only; no full prompt, lyrics, MusicXML, API key, or secret is logged.

## Preserved contracts

- Exactly four Composer steps. No Step 5.
- Final MusicXML remains the master composition.
- Composition/Arrangement Quality Gates and Production Readiness are not lowered.
- `musicxml-validator.ts`, `song-dna.ts`, Lyria, SoundFont and the iPad offline-WAV → HTMLAudioElement path are not changed by this local-background patch.
- Existing Score Theater manual-scroll behavior remains unchanged.

## Known scope boundary

This is **server-session durability**, not durable cloud execution. A server restart/redeploy invalidates the run. The UI must show session loss and must not auto-create a replacement run.

See `LOCAL_BACKGROUND_VERIFICATION.md` for evidence and remaining runtime gates.


## r2 note

Before using this full-workspace snapshot in AI Studio, verify `SHA256SUMS.txt` in a clean staging directory. Do not use the already-active workspace as the integrity reference after package-manager startup, because the environment may rewrite `bun.lock` even though the uploaded ZIP is correct.

## r3 Hook-First SongCore integration

In r3, the r2 server-owned background-run lifecycle remains unchanged, but Step 3 generation changes internally:

- the total default Step 3 provider budget is now 180 seconds;
- Hook Forge and Song Weave are the two normal structured provider calls;
- at most one localized SongCore patch call is permitted;
- the client never regenerates the complete Step 3 Lead Sheet after a quality failure;
- refresh/navigation still reconnect to the same server run ID;
- only explicit cancel aborts provider work;
- Step 4 arrangement retry behavior remains the r2 behavior.

See `README_HOOK_FIRST_SONGCORE_R3.md` and `R3_VERIFICATION.md`.
