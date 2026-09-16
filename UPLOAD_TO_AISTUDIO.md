# Music-Pro SoundFont Audio Quality Patch

Base: GitHub `main` after live-audio commit `a8fc93552a8e099fca86b6f6d9160008a9d24f50`.

## AI Studio role

The source changes in this package were prepared by ChatGPT. AI Studio must **not** rewrite, refactor, auto-fix or redesign them.

After extracting this ZIP into the project root:

1. preserve the relative paths and overwrite matching files;
2. run `npm install --no-audit --no-fund --package-lock=false` because this patch adds the pinned `spessasynth_core@4.3.22`;
3. run `npm run lint`;
4. run `npm run build`;
5. if any command fails, stop and return the complete unedited error log. Do not modify source code.

Do not call Gemini or Lyria during these checks.
Do not commit/push until the user explicitly asks after runtime verification.

## New files

- `src/music/instrument-program.ts`
- `src/audio/render-policy.ts`
- `src/audio/soundfont-cache.ts`
- `src/audio/soundfont-render.ts`
- `tests/music/instrument-program.test.ts`
- `tests/music/audio-render-policy.test.ts`
- `docs/implementation/SOUNDFONT_AUDIO_QUALITY.md`

## Replacement files

- `src/music/midi-export.ts`
- `src/audio/offline-render.ts`
- `src/audio/media-playback-engine.ts`
- `package.json`

## Expected behavior

- Score preview first attempts sampled General MIDI rendering.
- GeneralUser GS is downloaded once and cached in IndexedDB.
- The existing HTMLAudioElement playback path remains in place for iPad embedded Preview reliability.
- If SoundFont loading/rendering fails, the existing lightweight renderer is used automatically.
- Exported MIDI receives sensible General MIDI programs when MusicXML omits `<midi-program>`.
