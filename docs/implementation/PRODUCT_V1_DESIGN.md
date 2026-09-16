# Music-Pro Product V1 Complete — Design Specification

**Date:** 2026-09-16  
**Audited GitHub base:** `7da6e629ac4610bfa5537d8deec0d9d2d85fb312`  
**Scope:** Complete the remaining user-facing product capabilities around the locked Composer Core, then deliver one integration ZIP for AI Studio.

## 1. Product objective

Music-Pro V1 must support a complete single-user workflow:

**Idea → Compose → Lead Sheet → Listen → Arrange → Listen → Edit → Mix → Revisions → Export → Reopen later**

The product must remain useful when Gemini/Lyria or Firebase are unavailable. MusicXML remains the canonical composition master. Deterministic score playback/export remains independent from Lyria.

## 2. Locked boundaries

The following are protected unless a concrete defect is discovered during implementation:

- `server/music/composer.ts`
- MusicXML validator
- SongDNA extraction
- text-model routing / fallback policy
- existing Lyria generation logic and feature flag

No payment, subscription, marketplace, multi-user collaboration, or social-login system is in V1.

## 3. Existing capabilities retained

- Four-step Composer UI.
- MusicXML score rendering with OSMD.
- Deterministic ScoreTimeline parsing.
- MIDI export.
- SoundFont sampled rendering with oscillator fallback.
- WAV export.
- iPad-compatible live playback through pre-rendered media + `HTMLAudioElement`.
- Basic transpose, BPM editing, and undo.
- Optional Firebase history.
- Knowledge and Improver modules.
- Optional Lyria Studio Version.

## 4. V1 architecture

### 4.1 Canonical score and project model

MusicXML remains the source of truth for notes, rhythm, lyrics, harmony, instrumentation metadata, key, meter, and tempo.

A lightweight project layer stores product metadata without replacing MusicXML:

```ts
interface MusicProject {
  id: string;
  title: string;
  idea: string;
  style: string;
  createdAt: number;
  updatedAt: number;
  activeRevisionId: string;
  leadRevisionId?: string;
  mix: MixState;
  tags: string[];
}

interface ScoreRevision {
  id: string;
  projectId: string;
  parentRevisionId?: string;
  label: string;
  reason: 'compose' | 'arrange' | 'edit' | 'section-ai' | 'restore' | 'duplicate';
  musicXml: string;
  createdAt: number;
}
```

### 4.2 Persistence

Persistence uses a local-first repository abstraction:

```ts
interface ProjectRepository {
  listProjects(): Promise<MusicProjectSummary[]>;
  getProject(id: string): Promise<MusicProjectBundle | null>;
  saveProject(bundle: MusicProjectBundle): Promise<void>;
  deleteProject(id: string): Promise<void>;
  duplicateProject(id: string): Promise<string>;
}
```

Primary local storage: IndexedDB (`idb`, already installed). Firebase becomes optional synchronization/storage, not a gate for Composer, History, Demo, Settings, or revision access.

No automatic destructive conflict resolution. For V1, local is authoritative in-session; cloud save failures surface as non-blocking warnings.

## 5. Result Workspace

The current ResultWorkspace becomes a tabbed product workspace with:

1. **Score** — notation + playback cursor.
2. **Edit** — deterministic MusicXML edits.
3. **Mixer** — instrument/mute/solo/volume/pan/reverb state.
4. **Versions** — revision list, restore, duplicate.
5. **Export** — MusicXML, MIDI, WAV, project ZIP.

The workspace is reused by Composer and History.

## 6. Editing

### 6.1 Deterministic edits

Supported without Gemini:

- Title / work-title update.
- Global transpose ± semitone.
- Global BPM 30–240.
- Lyrics edit for selected measure range or all lyrics.
- Per-part MIDI program/instrument update.
- Undo and redo, minimum 50 snapshots per workspace session.
- Reset to the revision loaded when the workspace opened.

Every committed edit produces a revision when the workspace belongs to a saved project.

### 6.2 Section selection

Selection is measure-range based for V1:

```ts
interface MeasureRange {
  startMeasure: number;
  endMeasure: number;
}
```

The UI allows a user to choose a range and inspect its section metadata. Exact note-head editing/piano-roll editing is explicitly outside V1.

### 6.3 AI section revision

A server endpoint accepts:

```ts
{
  musicXml: string;
  startMeasure: number;
  endMeasure: number;
  instruction: string;
  styleId: string;
}
```

The server extracts the target measure range plus bounded musical context, requests only a replacement fragment, merges it into a copy of the master XML, validates the complete result, and returns the revised full MusicXML.

The endpoint must never overwrite the caller's source score on failure. Provider/network errors return structured errors and preserve the current revision.

## 7. Mixer and audio

### 7.1 Mix state

```ts
interface MixPartState {
  partId: string;
  volume: number; // 0..1.5
  pan: number;    // -1..1
  mute: boolean;
  solo: boolean;
  midiProgram?: number;
}

interface MixState {
  parts: Record<string, MixPartState>;
  masterGain: number; // 0..1.5
  reverb: number;     // 0..1
  normalizeExport: boolean;
}
```

Mixer settings are project metadata and do not mutate note content. Instrument program changes may optionally be written back to MusicXML when the user chooses **Apply instrument to score**.

### 7.2 Rendering

- Keep SoundFont renderer as preferred path.
- Keep current lightweight renderer as fallback.
- Live transport remains `HTMLAudioElement` backed by a rendered media blob for embedded iPad reliability.
- Mixer state is applied during render.
- WAV export supports stereo, pan, master gain, optional normalization and light algorithmic reverb.
- Rendering errors fall back only when technically safe and expose the active renderer label in the UI.

## 8. Revision history

Each project shows a linear revision history for V1. Branch visualization is not required.

Operations:

- create revision
- rename revision label
- restore revision (creates a new restore revision; never deletes history)
- duplicate project from any revision
- compare revision metadata and score-level summary (duration, key, BPM, part count, note count); raw XML diff is not user-facing

## 9. History / Projects screen

Replace flat run-oriented UX with a Projects view while preserving backward compatibility with existing Firebase `runs` records.

Features:

- search by title/idea
- style filter
- sort by updated date/title
- rename
- duplicate
- delete with confirmation
- open project workspace
- play current revision
- export current revision
- import legacy run as local project on open

## 10. Autosave and recovery

- Debounced local autosave after meaningful project edits.
- Dirty-state indicator while a save is pending.
- `beforeunload` warning only when unsaved changes remain.
- Provider generation failures never erase the last valid score.
- SoundFont/network failures do not remove the score or revision state.

## 11. Settings

Unify current duplicated settings sources behind `settingsService`.

Settings fields:

```ts
interface AppSettings {
  userName: string;
  userRole: string;
  temperature: number;
  defaultStyleId: string;
  playbackQuality: 'standard' | 'high';
  defaultExportFormat: 'wav' | 'midi' | 'musicxml';
  normalizeWav: boolean;
  autoSave: boolean;
}
```

API keys remain server-side environment variables and are never stored or editable in the frontend.

## 12. Demo / QA fixture

Add a deterministic 30–60 second MusicXML fixture containing at minimum:

- Piano
- Electric/Acoustic Bass
- String Ensemble
- GM percussion on channel 10

The fixture validates instrument mapping, percussion, SoundFont, pan/mix, export and playback without Gemini/Lyria.

## 13. Export

Export panel provides:

- current MusicXML
- Type-1 MIDI
- high-quality WAV
- project package ZIP

Project ZIP contains:

```text
project.json
current.musicxml
lead.musicxml        (when available)
revisions/index.json
revisions/*.musicxml
README.txt
```

No third-party proprietary SoundFont file is embedded in project exports.

## 14. UI / mobile requirements

- Must remain usable in AI Studio embedded preview on iPad.
- No hover-only critical controls.
- Mixer and revision panels collapse cleanly on narrow screens.
- Buttons have visible loading/disabled/error states.
- Player controls expose accessible labels.
- Empty/offline/provider-error states explain what remains usable.

## 15. Error model

User-facing failures are separated into categories:

- `PROVIDER_UNAVAILABLE`
- `PROVIDER_RATE_LIMITED`
- `INVALID_MUSICXML`
- `SECTION_MERGE_FAILED`
- `SOUNDFONT_UNAVAILABLE`
- `AUDIO_RENDER_FAILED`
- `LOCAL_STORAGE_FAILED`
- `CLOUD_SYNC_FAILED`

A failure in one optional subsystem must not invalidate a valid composition.

## 16. Testing strategy

### Unit

- MusicXML title/lyrics/program transforms.
- Measure-range extraction/merge guards.
- Revision reducer/repository behavior.
- mixer normalization, solo/mute rules, pan/gain math.
- project package manifest/ZIP structure.
- legacy-run conversion.

### Integration/static

- ResultWorkspace wiring.
- local project repository.
- section-revision API validation and failure preservation.
- TypeScript `npm run lint`.
- production `npm run build`.

### Runtime acceptance after one AI Studio upload

1. Open demo multi-instrument project.
2. Play and distinguish Piano/Bass/Strings/Drums.
3. Mute/solo and change volume/pan.
4. Edit BPM/title/lyrics/instrument and undo/redo.
5. Save and reopen project locally without Firebase.
6. Create/restore revision.
7. Export MusicXML/MIDI/WAV/project ZIP.
8. Confirm Composer still works with Firebase absent.
9. Confirm provider 503 does not erase score.
10. Confirm iPad embedded playback remains audible.

## 17. Delivery constraints

- Deliver exactly one integration ZIP after implementation and audit.
- AI Studio performs extraction/install/lint/build only; it must not edit code.
- ZIP includes `SHA256SUMS.txt`, implementation/audit notes, rollback note and one copy/paste integration prompt.
- Do not push the product patch to GitHub before runtime acceptance unless the user explicitly instructs it.
