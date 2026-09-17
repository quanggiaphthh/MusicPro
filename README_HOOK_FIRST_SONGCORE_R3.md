# Music-Pro r3 — Hook-First SongCore

Status: offline/runtime-candidate verification, not yet real-provider accepted.

## Purpose

r3 replaces direct full-song MusicXML generation in Step 3 with a typed musical intermediate representation while preserving the visible four-step product and MusicXML as the canonical composition master.

Step 3 now runs:

1. Hook Forge — one structured provider call returning exactly three short Chorus candidates.
2. Local deterministic hook scoring — ToneGuard, motif recurrence, singability, cadence, rhythm, strong-beat text placement.
3. Song Weave — one structured provider call returning a complete SongCore v1.
4. Local guards — SongCore structure, selected-hook lock, Vietnamese ToneGuard, target measure budget.
5. Deterministic piano realization + MusicXML 4.0 compiler.
6. Existing MusicXML validator, SongDNA and Composition Quality Gate.
7. Optional one targeted SongCore patch for localized failures only.

Normal provider calls: exactly 2. Maximum: 3. Full-song regeneration after Song Weave: 0.

Hook Forge candidates are locally constrained to 4–8 measures. For non-demo full songs, server-side SongCore validation also enforces a 150-second minimum-duration floor; explicit short/demo/sketch requests are exempt.

## Provider budget

The total Step 3 budget is 180000 ms by default (`LEAD_SHEET_PROVIDER_TIMEOUT_MS` may override it). Stage safety caps are:

- Hook Forge: 60000 ms
- Song Weave: 120000 ms
- Song Patch: 60000 ms

Each stage receives `min(stageCap, remainingStep3Budget)`. The existing background-run AbortSignal reaches every provider call.

## Client behavior

Auto Compose and Manual Composition Production request Step 3 exactly once. If the final server-owned Step 3 artifact unexpectedly fails the client quality audit, the client preserves the artifact and halts before Step 4. It never requests a second complete Lead Sheet. Step 4 arrangement retry semantics remain unchanged.

## Protected scope

The following r2 files are intentionally byte-identical in r3:

- `server/music/musicxml-validator.ts`
- `server/music/song-dna.ts`
- `src/components/MusicXMLViewer.tsx`
- `src/components/ScorePlayer.tsx`
- `src/audio/*`

No dependency, Gemini model route, Lyria path, SoundFont renderer, Score Theater behavior, project schema, or background-run lifecycle was intentionally changed.

## Rollback

Rollback artifact: the verified r2 ZIP supplied as `music-pro (1)(1).zip`, SHA-256:

`e2ac43369ba9b3ddc1dab600374d8c219f94494b87d1cb286f6417e28f2fa530`

Do not replace that rollback artifact with this r3 candidate.

## Acceptance boundary

Offline verification is recorded in `R3_VERIFICATION.md`. Real Gemini benchmark/runtime acceptance is recorded in `R3_BENCHMARK.md` and must be completed in a dependency-complete integration runner before this candidate is labeled accepted or committed/pushed to GitHub.
