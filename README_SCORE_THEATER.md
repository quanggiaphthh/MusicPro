# Music-Pro Score Theater Hotfix — 2026-09-16

## Purpose

This hotfix replaces forced score-follow scrolling with an iPad-friendly **Score Theater**:

- the score is rendered inside an independent fixed-height manual-scroll viewport;
- OSMD cursor following is disabled (`follow: false`, `FollowCursor = false`);
- playback updates visual cursors/highlights but never scrolls the score;
- current measure is highlighted with a dedicated OSMD measure cursor;
- current note/chord receives a best-effort SVG glow through `GNotesUnderCursor()`;
- a new **“Đến vị trí đang phát”** button recenters the score exactly once when explicitly pressed;
- `prefers-reduced-motion` reduces glow animation and disables smooth recenter animation.

## Files changed

- `src/music/score-playback-visuals.ts` — pure playback visual-state/cursor sync helper.
- `src/components/MusicXMLViewer.tsx` — manual Score Theater viewport, measure cursor, note glow, explicit one-shot recenter.
- `src/components/ScorePlayer.tsx` — publishes playback visual state and adds the recenter button.
- `src/components/ResultWorkspace.tsx` — bridges playback state/recenter token while preserving the existing project-arrangement action.
- two regression tests under `tests/music/`.

## Protected areas intentionally untouched

This package does **not** contain or change:

- `server/music/composer.ts`
- `server/music/musicxml-validator.ts`
- SongDNA
- Gemini/Lyria routing
- SoundFont renderer / HTMLAudioElement transport
- project repository/persistence
- Knowledge Base
- export semantics

## Local verification performed before packaging

- RED/GREEN playback visual helper test: PASS after implementation.
- RED/GREEN manual-scroll policy test: PASS after implementation.
- TypeScript semantic check for the new pure helper: PASS with TypeScript 5.8.3.
- TypeScript transpile/syntax check for all 4 production files + both tests: PASS.
- OSMD API contract checked against current OpenSheetMusicDisplay documentation: multiple `cursorsOptions`, `follow:false`, `enableOrDisableCursors`, `GNotesUnderCursor`, and iterator timestamp are supported.

A full workspace `npm run lint` / `npm run build` cannot be proven by this local overlay alone; run both in the current AI Studio workspace after applying the package.

## Runtime acceptance target

On iPad during playback:

1. manually scroll the score several systems away;
2. wait through multiple measure changes — the viewport must stay where the user left it;
3. confirm measure highlight advances;
4. note/chord glow is best-effort; measure highlight is the required fallback;
5. seek — highlight changes but viewport does not move;
6. press **“Đến vị trí đang phát”** — the score recenters once;
7. continue manual scrolling immediately; it must not resume auto-follow;
8. verify Mixer / Phiên bản / Xuất file remain usable and audio remains audible.
