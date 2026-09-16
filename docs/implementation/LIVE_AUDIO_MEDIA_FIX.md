# Live Audio Media Transport Fix

## Symptom reproduced by the user

On iPad inside Google AI Studio Preview:

- Score Preview progress advanced normally after pressing **Nghe bản nhạc**.
- No live sound was audible.
- The WAV generated from the same MusicXML was downloaded and played audibly outside the live transport.

The supplied demo WAV was independently inspected: mono PCM, 32 kHz, ~2.35 s, non-zero signal, dominant frequency ~261.5 Hz (C4). This proves the deterministic MusicXML → ScoreTimeline → synth → offline WAV path is producing audible audio.

## Root-cause boundary

The failure is isolated to the direct Web Audio destination transport used by `ScorePlaybackEngine` in the embedded iPad Preview. Its clock can advance while the output remains inaudible in this environment. Parser/timeline/synth output are not the failing boundary.

## Fix

For score preview transport, use a native `HTMLAudioElement` backed by a pre-rendered WAV Blob:

`MusicXML → ScoreTimeline → OfflineAudioContext WAV Blob → HTMLAudioElement`

This reuses the already-working deterministic renderer and routes audible playback through the browser media pipeline instead of direct Web Audio destination output.

### Integration details

- New `HtmlMediaPlaybackEngine` owns one native media element.
- Preview audio is rendered at 24 kHz mono to reduce memory/latency; explicit WAV downloads remain unchanged.
- ScorePlayer pre-renders the selected score before enabling the Play button, preserving iOS user-gesture semantics for the actual `HTMLMediaElement.play()` call.
- Play / pause / seek / stop and the global Now Playing progress continue through the existing Audio context API.
- Object URLs are revoked on replacement/dispose.
- Same `scoreTrackId` reuses the already prepared preview.
- Existing direct Web Audio engine remains in the repository but is no longer the active score-preview transport.

## Scope deliberately not changed

- Composer / Gemini routing
- MusicXML validator
- SongDNA
- MIDI export
- explicit WAV download
- Lyria / Studio Version
- Firebase persistence

## Verification boundary

Automated deterministic tests and TypeScript checks pass locally for this patch. Runtime audibility in AI Studio Preview must be confirmed by the user after applying the patch; it is not claimed by build/test evidence alone.
