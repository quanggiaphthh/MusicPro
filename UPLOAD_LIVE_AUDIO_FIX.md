# Apply-only instructions — Live Audio Fix

Base repository commit expected before applying:
`5b1ee1bce75e18f015cf8956b0034fbe47e62ab2`

This ZIP contains a minimal ChatGPT-authored fix for the observed case:
**playback progress moves, but no live sound is audible in iPad / embedded AI Studio Preview, while downloaded WAV is audible.**

AI Studio must NOT author or modify code in this step.

Do only:
1. Extract this ZIP at project root, preserving paths and overwriting matching files.
2. Do not refactor, auto-fix, redesign, or add dependencies.
3. Run:
   - `npm run lint`
   - `npm run build`
4. If either fails, STOP and return the exact log. Do not repair it automatically.
5. Do not commit/push unless explicitly requested by the user.

Changed/new source files:
- `src/audio/media-playback-engine.ts` (new)
- `src/contexts/AudioContext.tsx` (replacement)
- `src/components/ScorePlayer.tsx` (replacement)
- `tests/music/media-playback-engine.test.ts` (new)
- `docs/implementation/LIVE_AUDIO_MEDIA_FIX.md` (new)

After lint/build PASS, the user—not AI Studio—will manually press **Nghe bản nhạc** once to confirm audible runtime output.
