# Music-Pro Playable Product Implementation Plan

**Goal:** Turn the existing Composer output into a product users can immediately hear, inspect, export, and keep using without depending on Lyria.

**Architecture:** Keep Core Composer, validator, SongDNA, and Lyria bridge unchanged. Add a browser-side deterministic `ScoreTimeline` parsed from MusicXML. All accurate playback/export functions consume this same timeline: Web Audio preview, MIDI export, WAV demo render, progress state, and result metadata.

**Tech stack:** React 19, TypeScript, browser DOMParser, Web Audio API, OfflineAudioContext, OSMD, no new runtime dependency.

## Global constraints
- MusicXML remains MASTER COMPOSITION.
- Lyria remains optional and is not used for deterministic score playback.
- No frontend model override and no Gemini/Lyria call is added.
- Composer/validator/SongDNA behavior is not changed.
- Playback must start only from a user gesture.
- Composer must work when Firebase is unavailable; history persistence failure must not invalidate successful composition.

## Tasks
1. Add `src/music/score-timeline.ts` with deterministic multi-part MusicXML timeline parsing, tempo map, timing conversion, ties, voices, backup/forward, and metadata.
2. Add `src/music/midi-export.ts` for Standard MIDI File type-1 export from the timeline.
3. Add `src/audio/playback-engine.ts` for real Web Audio playback with play/pause/seek/stop.
4. Add `src/audio/offline-render.ts` for deterministic WAV demo export using OfflineAudioContext.
5. Replace mock `AudioContext` internals with real score transport while retaining current public hook naming.
6. Add `ScorePlayer` and `ResultWorkspace` UI components.
7. Refactor ComposeView to use the result workspace and separate successful generation from optional history persistence.
8. Refactor RunsView to play and export saved scores.
9. Remove Firebase as a hard prerequisite for ComposeView.
10. Add focused deterministic tests for timing conversion and MIDI encoding; syntax-check every delivered TS/TSX file.
11. Add non-destructive quick edits for transpose (± semitone), global tempo, and undo on the final MusicXML; all deterministic exports/playback consume the edited score.

## Audit boundary after implementation

See `PLAYABLE_PRODUCT_AUDIT.md` for the roadmap cross-check and corrected defects. This patch completes the dependency-free functional playback/export layer. Sampled/SoundFont instrument realism, section-level AI edits, persisted revisions, and final product polish remain later milestones and must not be presented as completed by this package.
