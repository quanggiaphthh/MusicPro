# Music-Pro r3 Verification

Verification date: 2026-09-17

## Status

**OFFLINE / INTEGRATION CANDIDATE — NOT ACCEPTED RELEASE.**

The local checks below are fresh for the current r3 workspace. Dependency-complete lint/build, the real ten-prompt Gemini benchmark, and iPad/browser runtime acceptance remain mandatory before any `AIStudio_UPLOAD_READY` or GitHub acceptance decision.

## Provenance

- Base artifact: `music-pro (1)(1).zip`
- Base SHA-256: `e2ac43369ba9b3ddc1dab600374d8c219f94494b87d1cb286f6417e28f2fa530`
- Base role: verified r2 local-background rollback artifact.
- GitHub was not modified, committed, or pushed during r3 implementation/verification.
- `package.json` and `bun.lock` remain byte-identical to r2.
- No `package-lock.json` or `node_modules` is included in this workspace.

## Protected-scope audit

| File | Git blob hash | Result |
|---|---|---|
| `server/music/musicxml-validator.ts` | `fa2226d70ce0eba9c7072a1da93e3073bd17e9bb` | BYTE-IDENTICAL TO r2 |
| `server/music/song-dna.ts` | `6504e9082a428b83e80a7ab39b56930f8aebf8cd` | BYTE-IDENTICAL TO r2 |
| `src/components/MusicXMLViewer.tsx` | `8ee7b3eb36781a0143ce81b94a7baf5cd3ad9632` | BYTE-IDENTICAL TO r2 |
| `src/components/ScorePlayer.tsx` | `9fe1c15b12ea82b3e339589cad6a55a26dd3559d` | BYTE-IDENTICAL TO r2 |
| `src/audio/*` | directory byte comparison | NO DIFF |

## Fresh regression evidence

### Compose suite

Runner: Node 22.16.0 type stripping plus a temporary resolver outside the project workspace. No Gemini/Lyria live calls.

- test files discovered: **77**
- PASS: **77**
- FAIL: **0**

Coverage includes:

- SongCore structural validation and patch scope;
- non-demo full-song minimum-duration floor (150 seconds) with explicit short/demo/sketch exemption at orchestration level;
- Vietnamese ToneGuard, including consecutive lyric transitions across measure boundaries;
- Hook Forge scoring and the 4–8-measure candidate contract;
- deterministic score compiler;
- compact Composer knowledge packet;
- normal two-call r3 path and max-three-call targeted patch policy;
- invalid structured-output telemetry;
- cancellation during Hook Forge, Song Weave and Song Patch;
- single-request Step 3 for Auto and Manual Compose;
- background refresh/navigation/reconnect and explicit-cancel regressions;
- Step 4 retry preservation.

### Direct high-risk policy checks

The following were also rerun individually and PASS:

- `r3-composer-routing-policy.test.ts`
- `r3-no-full-regeneration.test.ts`
- `r3-provider-budget.test.ts`
- `r3-cancellation.test.ts`
- `background-refresh-e2e.test.ts`
- `background-ambiguous-start-recovery.test.ts`
- `background-unmount-poll-guard.test.ts`
- `provider-cancel-policy.test.ts`
- `provider-timeout.test.ts`
- `auto-compose-retry.test.ts`

Source scan additionally confirms:

- `generateLeadSheet()` delegates to `generateLeadSheetR3()`;
- no `FALLBACK_MODEL`, direct MusicXML-generation prompt, or “Regenerate the complete score” path exists inside Step 3;
- Auto Compose contains one `/api/compose/lead-sheet` request path;
- Manual Composition Production contains one `/api/compose/lead-sheet` request path;
- Step 4 fallback/retry logic remains outside the Step 3 function.

### Music / project suite

- test files discovered: **33**
- PASS: **28**
- real assertion/runtime FAIL: **0**
- dependency-limited: **5**

Dependency-limited tests did not reach assertions because the supplied ZIP has no installed dependencies:

| Test | Missing runtime package |
|---|---|
| `tests/music/compose-routing.test.ts` | `@google/genai` |
| `tests/music/media-playback-engine.test.ts` | `idb` |
| `tests/music/musicxml-validation.test.ts` | `fast-xml-parser` |
| `tests/music/projectmusic-knowledge.test.ts` | `js-yaml` |
| `tests/music/r3-score-compatibility.test.ts` | `fast-xml-parser` |

The 28 passing tests include the dependency-free score timeline, project package/policy, score playback visuals, backward-seek/rest-gap, Score Theater policy, audio-render policy, and arrangement-resume regressions.

### Server tests

- PASS: **3/3**
- `generation-failure-diagnostics.test.ts`: PASS
- `knowledge-admin-core.test.ts`: PASS
- `section-revision.test.ts`: PASS on the transpiled mirror because Node's strip-only mode does not support TypeScript parameter properties.

### Aggregate executable offline result

- PASS: **108** test files
- dependency-limited: **5** test files
- real assertion FAIL: **0**

### TypeScript syntax/transpile audit

- `.ts/.tsx` files scanned: **228**
- TypeScript: **5.8.3**
- transpile errors: **0**

This is a syntax/transpile audit only; it is not a substitute for dependency-complete `tsc --noEmit`.

## Dependency-complete gates — fresh result

### `npm run lint`

**ENVIRONMENT-LIMITED / NOT PASS** — exit code 2:

```text
error TS2688: Cannot find type definition file for 'vite/client'.
```

### `npm run build`

**ENVIRONMENT-LIMITED / NOT PASS** — exit code 127:

```text
sh: 1: vite: not found
```

These commands must be rerun after restoring the already-locked dependencies in the integration workspace. No dependency upgrade is authorized.

## r3 provider / SDK contract

Project lock resolves `@google/genai` to `2.21.0`. The current official Google Gen AI JavaScript SDK documentation confirms the API surface used by r3 exists: `GenerateContentConfig.abortSignal`, `httpOptions`, `responseMimeType`, `responseSchema`, `thinkingConfig`, and `ThinkingLevel.MINIMAL`.

Exact compile/runtime compatibility with the project's locked package still belongs to the dependency-complete lint/build gate above.

## Step 3 behavioral contract verified offline

- Hook Forge returns exactly three candidates and local scoring requires each candidate to contain 4–8 measures.
- Normal provider calls: **2**.
- Maximum provider calls: **3**.
- Full-song regeneration after Song Weave: **0**.
- Non-demo full-song SongCore can be validated against the **150-second minimum-duration floor**.
- One overall default Step 3 budget: **180000 ms**.
- Stage caps: Hook Forge 60000 ms; Song Weave 120000 ms; Song Patch 60000 ms.
- AbortSignal reaches each provider stage and an abort prevents the next stage from starting.
- Step 4 arrangement retry semantics are preserved.

## Exact-package verification

The delivered candidate ZIP is verified by extracting it into a clean directory and testing the extracted bytes rather than the source workspace. The final artifact verification includes:

- payload count matches `PACKAGE_MANIFEST.txt`;
- every entry covered by `SHA256SUMS.txt` verifies successfully;
- compose suite: **77/77 PASS**;
- music/project suite: **28 PASS / 5 dependency-limited / 0 real FAIL**;
- server suite: **3/3 PASS** on the transpiled mirror;
- TypeScript syntax/transpile audit: **228 files / 0 errors**;
- protected hashes, `src/audio/*`, `package.json`, and `bun.lock` remain unchanged from r2;
- dependency-complete `lint` and `build` remain environment-limited for the same missing-dependency reasons recorded above.

No production source is modified during this artifact-level verification. Temporary test loaders/transpile mirrors live outside the packaged project.

## Remaining mandatory acceptance gates

The following are **PENDING** and must not be inferred from offline fixtures:

1. dependency restore using the existing lockfile without version changes;
2. `npm run lint` exit 0;
3. `npm run build` exit 0;
4. all five dependency-limited music/project tests PASS;
5. real Gemini ten-prompt benchmark in `R3_BENCHMARK.md`;
6. four-step Development App runtime acceptance;
7. iPad audible playback and Score Theater regression acceptance.

Until all mandatory gates pass, this source is a **runtime integration candidate only**. Do not label it accepted, do not commit/push GitHub, and do not change model routing.

## Post-package audit correction — 2026-09-17

A focused re-audit of the delivered r3 candidate found two spec gaps in `server/music/lead-sheet-r3.ts`:

1. a targeted `SongCorePatch` could replace accompaniment for a section that did not intersect the authorized target measures;
2. hook lock validated only the first Chorus, allowing a non-final repeated Chorus to drift from the selected hook identity.

Both were reproduced on the prior candidate before correction.

Corrections are intentionally limited to:

- `server/music/lead-sheet-r3.ts`
- `tests/compose/lead-sheet-r3.test.ts`

Corrected behavior:

- `replaceAccompaniment` is rejected unless its `sectionId` intersects the exact targeted patch measure set;
- every non-final Chorus is hook-locked to the selected Hook Forge winner;
- the Final Chorus remains eligible for development as required by the r3 design;
- targeted patching cannot touch any hook-locked non-final Chorus.

Proportional post-fix verification (only affected/adjacent scope, per audit policy):

- `tests/compose/lead-sheet-r3.test.ts`: PASS, including out-of-scope accompaniment rejection, non-final Chorus drift rejection, and valid Final Chorus development;
- `tests/compose/song-core.test.ts`: PASS;
- `tests/compose/r3-no-full-regeneration.test.ts`: PASS;
- `tests/compose/r3-provider-budget.test.ts`: PASS;
- TypeScript 5.8.3 transpile of the two modified files: 0 errors;
- protected blob hashes remain exactly:
  - `musicxml-validator.ts`: `fa2226d70ce0eba9c7072a1da93e3073bd17e9bb`
  - `song-dna.ts`: `6504e9082a428b83e80a7ab39b56930f8aebf8cd`
  - `MusicXMLViewer.tsx`: `8ee7b3eb36781a0143ce81b94a7baf5cd3ad9632`
  - `ScorePlayer.tsx`: `9fe1c15b12ea82b3e339589cad6a55a26dd3559d`
- `package.json` and `bun.lock` hashes remain byte-identical to r2.

Unrelated full suites were intentionally not rerun because no unrelated production files changed. Their prior artifact-level results remain the baseline evidence for unchanged code. Dependency-complete lint/build/runtime gates remain mandatory in AI Studio before acceptance.
