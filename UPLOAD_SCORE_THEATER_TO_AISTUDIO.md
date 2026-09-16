# Apply Score Theater to the CURRENT AI Studio workspace

Do not start from a clean workspace. Apply this package on top of the current workspace that already passed project arrangement runtime.

1. Extract the ZIP into the project root, preserving paths and overwriting only matching files.
2. Do not auto-fix or refactor.
3. Do not change dependencies.
4. Do not modify Composer, MusicXML validator, SongDNA, SoundFont, Lyria, Knowledge Base, project persistence, or the arrangement-resume behavior.
5. Do not commit/push GitHub.

Run exactly:

```bash
npx tsx tests/music/score-playback-visuals.test.ts
npx tsx tests/music/score-theater-policy.test.ts
npm run lint
npm run build
```

If any command fails, STOP and return the full raw output. Do not fix automatically.

If all PASS, open the Development App URL and test the arranged project on iPad:

- start playback;
- scroll the score manually up/down while playback continues;
- confirm no automatic snap-back;
- confirm current measure highlight;
- confirm note/chord glow where available;
- seek to another position without viewport movement;
- press “Đến vị trí đang phát” and confirm one-time recenter;
- scroll manually again and confirm auto-follow remains off;
- open Mixer / Phiên bản / Xuất file while playback remains usable.

Return exactly:

```text
score-theater-tests: PASS
lint: PASS
build: PASS
score-theater-manual-scroll: PASS|FAIL
score-theater-measure-highlight: PASS|FAIL
score-theater-note-glow: PASS|DEGRADED|FAIL
score-theater-recenter: PASS|FAIL
score-theater-regression: PASS|FAIL
```

`DEGRADED` is acceptable only for note glow when measure highlight remains correct and no wrong note is highlighted.
