# AI Studio Integration Runner Instructions — Music-Pro r3

Use this package only as an integration/runtime candidate. Do not author, refactor, auto-fix, change dependencies, change model routing, or commit/push GitHub.

## 1. Integrity and scope

After extraction, confirm these protected files match the hashes recorded in `R3_VERIFICATION.md` and that `src/audio/*` is unchanged from r2.

Do not modify:

- `server/music/musicxml-validator.ts`
- `server/music/song-dna.ts`
- `src/components/MusicXMLViewer.tsx`
- `src/components/ScorePlayer.tsx`
- `src/audio/*`
- Step 4/Lyria/SoundFont/project persistence/model routing.

## 2. Dependency-complete verification

Run the workspace's normal dependency restore without upgrading packages, then run:

```bash
npm run lint
npm run build

for f in tests/compose/*.test.ts; do npx tsx "$f" || exit 1; done
for f in tests/music/*.test.ts; do npx tsx "$f" || exit 1; done
for f in tests/projects/*.test.ts; do npx tsx "$f" || exit 1; done
```

If any command fails, STOP. Return the exact failing command and raw error. Do not auto-fix.

## 3. Runtime acceptance

With the Development App URL, verify:

- product still has exactly four visible steps;
- Auto and Manual Compose start Step 3 once;
- normal Step 3 has exactly two provider calls;
- targeted patch, when needed, makes at most one third call;
- no complete Lead Sheet regeneration occurs after Song Weave;
- refresh/navigation reconnects to the same background run;
- explicit cancel stops the active stage and no next provider stage starts;
- Step 4 arrangement remains usable and retains its existing retry behavior;
- MusicXML opens in Score Theater and playback remains audible on iPad;
- manual score scrolling, measure highlight, backward seek/rest-gap and one-shot recenter have no regression.

## 4. Real benchmark

Run the ten fixed prompts in `R3_BENCHMARK.md`, recording only the listed aggregate metrics. Do not log full prompts, lyrics, SongCore payloads, API keys, or MusicXML into telemetry.

Do not change model routing during the benchmark.

## 5. Return report

Return exactly the evidence, not a success narrative:

```text
r3-lint: PASS|FAIL
r3-build: PASS|FAIL
r3-compose-tests: PASS|FAIL
r3-music-tests: PASS|FAIL
r3-project-tests: PASS|FAIL
r3-protected-hashes: PASS|FAIL
r3-step3-two-call-normal: PASS|FAIL
r3-step3-max-three-calls: PASS|FAIL
r3-no-full-regeneration: PASS|FAIL
r3-background-refresh-navigation: PASS|FAIL
r3-explicit-cancel: PASS|FAIL
r3-ipad-playback-regression: PASS|FAIL
r3-benchmark-terminal-artifact: <n>/10
r3-benchmark-malformed-xml: <n>/10
r3-benchmark-median-step3-ms: <number>
r3-benchmark-r2-median-step3-ms: <number>
r3-benchmark-quality-ge80: <n>/10
r3-human-musical-review: PASS|FAIL
```

Only after every mandatory gate passes should the candidate be considered `AIStudio_UPLOAD_READY` for the GitHub acceptance decision. Do not commit/push without explicit user authorization.
