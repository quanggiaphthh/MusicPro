# Music-Pro — Sampled Instrument Preview (SoundFont)

## Goal

Improve the deterministic score preview so Piano, Guitar, Bass, Strings, Winds and percussion sound like recognizable sampled instruments while keeping MusicXML as the master composition.

## Architecture

The existing iPad-safe transport remains unchanged:

`MusicXML -> ScoreTimeline -> rendered WAV Blob -> HTMLAudioElement`

Only the WAV renderer is upgraded:

`ScoreTimeline -> Type-1 MIDI -> spessasynth_core -> GeneralUser GS -> stereo WAV`

If the sampled renderer is unavailable for any reason, Music-Pro automatically falls back to the existing lightweight Web Audio renderer. Playback therefore remains usable even if the SoundFont CDN, IndexedDB, WebAssembly, or the new renderer fails.

## SoundFont loading

Development default:

`GeneralUserGS.sf3`, approximately 8 MB, from a pinned SpessaSynth GitHub revision.

The bank is cached in IndexedDB after the first successful download. A deployment can self-host the bank by setting:

`VITE_SOUNDFONT_URL=https://.../your-bank.sf2-or-sf3`

For production, self-hosting is recommended to remove the runtime dependency on GitHub raw content.

## Instrument mapping

MusicXML `<midi-program>` remains authoritative when present. AI-generated scores often omit it, so Music-Pro now applies conservative General MIDI inference from part names, including Piano, Acoustic/Electric Guitar, Bass, Violin/Viola/Cello, String Ensemble, Vocal/Choir, Brass, Sax, Clarinet, Flute and Synth Pad/Lead.

Percussion continues to use MIDI channel 10.

## Mobile constraints

The sampled renderer is intentionally offline. It does not route live synthesis to the Web Audio destination because that path was inaudible inside the iPad embedded Preview. The finished WAV is played through `HTMLAudioElement`, which has already been verified manually on the target iPad environment.

Preview rendering defaults to 32 kHz stereo to balance sampled-instrument quality and memory use for 3–4 minute songs.

## Third-party components

- `spessasynth_core` 4.3.x — Apache-2.0.
- GeneralUser GS — GeneralUser GS License v2.0 / permissive software-project use. The upstream documentation notes historical uncertainty about the provenance of a small number of old samples. Re-evaluate the bank choice/license before commercial distribution at scale.

No SoundFont binary is redistributed in this patch; the development bank is fetched from upstream at runtime and cached locally.

## Scope boundary

This patch does **not** change:

- Core Composer prompts or model routing;
- MusicXML validation;
- SongDNA;
- Lyria / Studio Version;
- OSMD rendering;
- project persistence.

It only improves deterministic preview/export audio and MIDI instrument selection.
