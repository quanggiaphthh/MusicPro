# Music-Pro Product V1 — Verification Report

**Date:** 2026-09-16  
**Audited integration base:** `7da6e629ac4610bfa5537d8deec0d9d2d85fb312`  
**Delivery mode:** one-shot source patch for AI Studio integration

## Verified locally

1. **Product V1 TypeScript integration harness:** PASS (`tsc -p tsconfig.harness.json --pretty false`, exit 0).
2. **Deterministic test suite:** PASS — 22 test files, 0 failures.
3. **HTML media playback engine integration test:** PASS.
4. **Server baseline preservation:** PASS. Removing only the Product V1 section-revision imports/helper/route from `server.ts` reconstructs GitHub base blob SHA `cb21b6ad6d040907566355e89f3dd5b1cc566e6c` exactly.
5. **Protected Composer core:** PASS by package boundary. This package does not contain `server/music/composer.ts`, `server/music/musicxml-validator.ts`, `server/music/song-dna.ts`, `server/music/production-blueprint.ts`, or `server/music/gemini-music-brief.ts`.
6. **Dependency boundary:** PASS. Product V1 uses dependencies already present in the audited base (`idb`, `spessasynth_core`, React, Firebase compatibility layer); `package.json` is not changed by this package.
7. **Static placeholder/debug scan:** no TODO/TBD/FIXME/HACK markers in delivered source. User-facing HTML placeholders are intentional form hints. Existing server startup `console.log` is inherited from the base.
8. **Multi-instrument deterministic fixture:** PASS — Piano, Bass, Strings and GM channel-10 percussion; 16 measures at 96 BPM, approximately 40 seconds.
9. **Product V1 completion audit:** PASS for source-level scope — full-lyrics range shortcut, section-range metadata, revision comparison summaries, manual-save/before-unload safety, settings-driven preview quality (32 kHz standard / 44.1 kHz high), and default-export labeling are integrated.

## Deterministic test coverage

- audio render fallback policy
- all 128 General MIDI program names
- instrument program inference
- measure-range extraction, full-score lyric range selection
- mixer-aware Type-1 MIDI export
- mix sanitization / solo / mute behavior
- multi-instrument demo structure and duration
- MusicXML edit API helpers and schema-safe MIDI-program insertion
- MusicXML transpose helpers
- playback helpers
- product error classification
- project-package ZIP writer/manifest
- score identity and timeline timing
- autosave dirty/saving lifecycle and before-unload warning policy
- Composer workspace target selection
- legacy run conversion
- append-preserving persistence merge
- project list search/filter/sort
- immutable revision/create/restore/duplicate behavior and score-summary comparison
- guarded section revision merge/provider classification
- native HTML media playback engine

## What cannot be truthfully marked PASS locally

The isolated implementation environment does not contain the repository's full `node_modules`, and outbound package/network access is unavailable. Therefore these commands must be run after the single AI Studio upload:

```bash
npm install --no-audit --no-fund --package-lock=false
npm run lint
npm run build
```

Until those commands run successfully in the real project, **FULL REPOSITORY LINT/BUILD = PENDING AI STUDIO**.

Browser/runtime acceptance also remains pending for the final combined Product V1 patch. The previous live-audio and SoundFont milestones were already manually verified on the iPad embedded preview, but the combined V1 workspace/mixer/revision/export flow must be smoke-tested after integration.

## Runtime acceptance after the one upload

1. Open **Dữ liệu mẫu** and create the 4-instrument Product V1 demo.
2. Open it in **Dự án / Lịch sử** and confirm Piano/Bass/Strings/Drums are distinguishable.
3. Test mute/solo, volume, pan and instrument selection; confirm playback reloads with the changed mix.
4. Edit title/BPM/lyrics/instrument, then Undo/Redo and Reset.
5. Confirm each committed score edit creates a revision; Restore creates a new revision rather than deleting history.
6. Reload the app and confirm the local project remains available without Firebase.
7. Export MusicXML, MIDI, WAV and Project ZIP; open the ZIP and verify manifest/revision files.
8. Confirm Composer still creates Lead Sheet/Arrangement when Firebase is absent.
9. If section-AI is tested, a provider 429/503 must leave the current score unchanged.
10. Confirm live playback remains audible in the embedded iPad preview.
