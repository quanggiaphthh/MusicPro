# Music-Pro Product V1 — Source Audit

**Base commit:** `7da6e629ac4610bfa5537d8deec0d9d2d85fb312`

## Architecture retained

- MusicXML remains the canonical score master.
- Composer remains four steps only.
- Deterministic playback/export remains independent from Lyria.
- Live transport remains pre-rendered media + native `HTMLAudioElement` for iPad/embedded reliability.
- SoundFont remains preferred; basic deterministic synth remains fallback.
- Existing Lyria generation remains optional and separate from the master score.

## Added product layers

- local-first Music Project + append-only Score Revision domain
- IndexedDB project repository
- debounced autosave / dirty-state lifecycle
- deterministic title/lyrics/tempo/transpose/instrument editing
- measure-range section selection and guarded server-side AI section replacement
- project mixer: mute/solo/volume/pan/program/master/reverb/normalization
- mixer-aware MIDI, SoundFont preview and WAV export
- Project ZIP export with score/revisions/manifest
- reusable tabbed Result Workspace
- local Projects/History with legacy Firebase-run import compatibility
- local-first Settings
- offline indicator and mobile/accessibility refinements
- deterministic 40-second Piano/Bass/Strings/Drums QA fixture

## Important defect-prevention decisions

1. Stale autosaves merge stored revisions instead of deleting newer revisions.
2. Step 3 always edits/promotes the Lead score even if an Arrangement already exists.
3. Restoring the Lead creates a new restore revision and updates `leadRevisionId`.
4. Full project duplication remaps project/revision/parent IDs while preserving revision history.
5. MusicXML MIDI-program insertion respects MusicXML child ordering and creates/reuses a matching `score-instrument` ID.
6. Section AI never writes into the source string in place; merge happens on a returned copy and the complete score is validated server-side before success.
7. Provider 429/503 are classified separately; score state is not discarded.
8. Mixer changes do not alter note content unless **Apply instrument to score** is chosen.
9. Live preview includes mix state in track identity so changed mixer settings trigger a fresh render.
10. The media engine reports the active renderer (`soundfont` or `basic`) so fallback is visible rather than silent.

11. Full-score lyric editing is exposed via an explicit “Chọn toàn bộ lời” range shortcut while preserving measure-range editing.
12. The section-AI panel exposes the selected measure/part metadata before the request is sent.
13. Revision history includes a score-summary comparison for key, BPM, duration, part count and note count.
14. `beforeunload` now warns for both explicit dirty state and in-flight autosave/manual save state, including when autosave is disabled.
15. Preview quality setting participates in rendered-audio cache identity: standard = 32 kHz, high = 44.1 kHz.

## Protected files intentionally absent

- `server/music/composer.ts`
- `server/music/musicxml-validator.ts`
- `server/music/song-dna.ts`
- `server/music/production-blueprint.ts`
- `server/music/gemini-music-brief.ts`

`server.ts` is modified only to add the guarded `/api/compose/revise-section` endpoint and its imports/helper. A baseline reconstruction check matches the audited pre-patch Git blob exactly.

## Explicit non-goals for Product V1

- Stripe/payment/subscriptions
- social login
- multi-user collaboration
- marketplace
- piano-roll/note-head editor
- proprietary SoundFont embedding
