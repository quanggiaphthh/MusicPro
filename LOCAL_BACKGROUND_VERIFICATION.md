# Local Background Auto-Compose r2 — Verification

## Fresh sandbox evidence

The following verification was re-run on r2 without live Gemini/Lyria calls:

- Background refresh/reconnect end-to-end harness: PASS.
- Compose regression suite: 67/67 PASS.
- Independent regressions: 8/8 PASS:
  - audio-render-policy
  - lyria-contract
  - project-package-policy
  - stale-package-evidence-policy
  - score-playback-backward-gap
  - score-playback-visuals
  - score-theater-policy
  - arrangement-resume
- Full offline test-tree classification: 102 total = 78 PASS, 24 environment-limited by missing dependencies/import resolution, 0 real FAIL.
- TypeScript/TSX syntax transpile: 211 files, 0 errors.
- TypeScript 5.8 diagnostic sweep after the r2 test fix: no remaining TS2367 diagnostics.
- Protected scope comparison against the base AI Studio export:
  - `musicxml-validator.ts`: unchanged
  - `song-dna.ts`: unchanged
  - `MusicXMLViewer.tsx`: unchanged
  - `ScorePlayer.tsx`: unchanged
  - `src/audio/*`: unchanged
  - `package.json`: unchanged
  - `bun.lock`: unchanged

## Sandbox limitation — NOT CLAIMED

The sandbox does not have project `node_modules` and has no usable npm cache. The source export **does include `bun.lock`**; the lockfile is preserved byte-for-byte from the AI Studio base export. Therefore the following are intentionally **not** claimed here:

- `npm run lint`
- `npm run build`
- browser/runtime refresh-navigation acceptance with a real Gemini call
- controlled real-provider timeout acceptance
- real iPad playback acceptance

These must be run in the current AI Studio/local workspace before this candidate is treated as runtime-accepted.

## Required local runtime acceptance

1. Start one Auto run and capture the `runId`.
2. Navigate to another menu and return. The same `runId` must still be running; no second `POST /api/compose/runs` is allowed.
3. Refresh the browser. The same `runId` must reconnect and recover progress/checkpoints.
4. When Step 3 completes, Lead Sheet must be visible/persisted even if the user was away from the Compose page.
5. Explicit `Dừng` must cancel the run; route change/refresh must not.
6. If the server process restarts, the client must report session loss and must not silently generate again.
7. Use a controlled low provider timeout in a non-production test to verify `GENERATION_TIMEOUT` terminates instead of hanging indefinitely.
8. Run `npm run lint` and `npm run build` with exit code 0.
9. Re-run Score Theater/iPad audio regressions.


## r2 pre-flight correction

- Fixed TypeScript lint regression in `tests/compose/background-run-api.test.ts`: the cancel counter is now read through `cancelCount()` so TypeScript 5.8 control-flow analysis does not incorrectly retain the earlier literal narrowing across an indirect callback mutation. Runtime assertion semantics are unchanged.
- Re-audited `bun.lock`: ZIP/base-export hash remains `2dfd2844af5f5ee90eb06d6d85c03323e069604cddf2eadd1391286dca72a36e`. The previously reported workspace hash `94489abb...` occurred after workspace/environment mutation, not in the packaged artifact.
- Integrity must therefore be verified in a clean staging directory before package-manager startup/overlay.
