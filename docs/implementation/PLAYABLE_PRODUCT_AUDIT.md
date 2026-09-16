# Music-Pro Playable Product — Audit & Roadmap Cross-check

**Audited base:** GitHub `main` commit `1542974a0274d41791bd2209521eff139d3b83f1`  
**Audit date:** 2026-09-15  
**Principle:** keep Core Composer Engine V1 locked; add product capabilities around the MusicXML master.

## 1. Product target

A normal user should be able to go from idea → composition → score → playback → arrangement → playback → export, without needing Lyria. MusicXML remains the master. Deterministic playback/MIDI/WAV are score-derived outputs; Lyria remains an optional Studio Version.

## 2. Cross-check against the previously agreed roadmap

| Roadmap item | Patch status | Evidence / boundary |
| --- | --- | --- |
| P0.1 MusicXML → deterministic ScoreTimeline | IMPLEMENTED | `src/music/score-timeline.ts`; multi-part notes, rests, chord timing, voices, staff, backup/forward, ties, tempo, time signature, transpose metadata, percussion mapping. |
| P0.1 Real Play/Pause/Seek/Stop | IMPLEMENTED | `ScorePlaybackEngine` + real `AudioContext`; replaces the previous mock 180-second timer. |
| P0.1 OSMD playback position | IMPLEMENTED AT MEASURE LEVEL | `getCurrentMeasure()` drives OSMD cursor to the current measure. Exact note-head highlighting is not implemented. |
| P0.1 Desktop/mobile browser acceptance | REQUIRES RUNTIME SMOKE | Static/type tests pass in this package; iPhone/iPad Safari must be smoke-tested after integration because Web Audio/OfflineAudioContext behavior is runtime-specific. |
| P0.2 MIDI export | IMPLEMENTED | Custom dependency-free Standard MIDI File Type-1 writer. This intentionally replaces the earlier `midi-writer-js` suggestion to avoid a new runtime dependency. |
| P0.2 Deterministic WAV | IMPLEMENTED AS DEMO RENDER | OfflineAudioContext generates a WAV from the same ScoreTimeline. |
| P0.2 SoundFont / sampled instruments | NOT YET IMPLEMENTED | Current preview uses a lightweight oscillator synth with instrument/program profiles. It is accurate enough for score checking, not a studio-quality instrument renderer. SoundFont/SpessaSynth remains the next audio-quality upgrade. |
| P0.3 Result Workspace | IMPLEMENTED | Lead Sheet and Arrangement expose playback, score, MusicXML, MIDI and WAV in one workspace. |
| P0.3 Firebase-independent Composer | IMPLEMENTED | Compose is removed from `needsFirebase`; persistence is optional. |
| P0.3 Persistence failure must not invalidate composition | IMPLEMENTED | Arrangement success is committed to UI before optional `runsService.saveRun`; save errors show a separate warning. |
| P0.3 History play/export | IMPLEMENTED WHEN FIREBASE EXISTS | Saved final MusicXML can be played and exported from RunsView. |
| P1 Key/BPM edit | PARTIALLY IMPLEMENTED | ±1 semitone, global BPM and Undo are implemented for the current final score. |
| P1 Lyric/section editing | NOT YET IMPLEMENTED | Editing lyrics, regenerating Chorus/Verse and selective AI revisions remain a later feature. |
| P1 Project + revision history | NOT YET IMPLEMENTED | Data type now has lead/final/version fields, but quick edits are not persisted as revision records yet. |
| P1.5 Lyria Studio Version | EXISTING / UNCHANGED | Existing feature-flagged Lyria bridge remains separate from deterministic score playback. |
| P2 Auth/payment/storage/performance polish | NOT IN THIS PATCH | Intentionally deferred. |

## 3. Audit defects found and corrected before packaging

1. **Missing note dynamics could become velocity 1.** `Number(null)` evaluates to `0`, which made ordinary notes almost inaudible. Missing/invalid dynamics now use the audible default velocity (`84`).
2. **Missing MusicXML measure numbers could become measure 0.** Missing/blank/non-numeric values now fall back to ordinal measure numbering.
3. **MusicXML percussion mapping needed MIDI-128 conversion.** `<midi-unpitched>` values are normalized to MIDI 0–127 and channel-10 parts are recognized as percussion.
4. **Transposition could produce schema-invalid pitch child order.** Newly created `<alter>` is inserted before `<octave>` (`step → alter → octave`).
5. **Namespaced MusicXML edits were fragile.** Transform traversal/element creation now uses local-name/namespace-aware DOM APIs.
6. **Tempo normalization could retain incompatible metronome children.** Visual metronome content is normalized to a valid `quarter + per-minute` form when global BPM is edited.
7. **Long-score playback previously risked scheduling the whole song at once.** Playback uses a rolling look-ahead window and cleans up ended oscillator/gain nodes.
8. **Replay from the exact end could remain stuck at end.** Playback start normalization restarts from zero when the requested position is at/beyond duration.
9. **Editing an actively loaded score could leave stale playback.** Full MusicXML track identity changes on edits; the active score reloads from the edited master.
10. **OSMD had no score-position feedback.** The current playback measure now drives a best-effort OSMD cursor.

## 4. Deliberate implementation choices

- No new npm dependency is required by this package.
- Custom MIDI generation is small and deterministic; it avoids a package change during this integration step.
- The browser synth is intentionally a **Score Preview**, not a studio renderer. It maps part name/MIDI program to simple envelopes/waveforms and keeps Lyria conceptually separate.
- WAV is labeled **demo WAV** for the same reason.
- Core Composer, validator, SongDNA and server model routing are untouched.

## 5. Remaining gates after upload

AI Studio is only an integration runner for this package, not an editor. Run:

```bash
npm run lint
npm run build
```

Then manually smoke-test:

1. Composer opens with Firebase absent.
2. A valid Lead Sheet plays; Play/Pause/Seek/Stop work.
3. Current measure advances on the rendered score.
4. MIDI downloads and opens in MuseScore/DAW with correct tempo/notes.
5. WAV demo downloads and plays outside Music-Pro.
6. Arrangement repeats the same checks.
7. ±1 semitone, BPM and Undo update score/playback/MIDI/WAV.
8. History-save failure does not turn a successful arrangement into a composition failure.
9. History playback/export works when Firebase is configured.
10. Lyria OFF does not disable Score Preview/MIDI/WAV.
11. Repeat the playback/WAV smoke on iPhone/iPad Safari.

## 6. Recommended next product milestone after this patch passes

**Audio Quality Upgrade:** replace or augment the lightweight oscillator preview with a lazily loaded SoundFont/SF2 playback layer (SpessaSynth or equivalent), while keeping the same `ScoreTimeline` interface. This improves instrument realism without changing Composer or the deterministic MusicXML/MIDI architecture.

After that: section-level editing/revision history, then Studio/Lyria productization and product polish.
