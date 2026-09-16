# Music-Pro Product V1 Complete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the remaining single-user Music-Pro V1 workflow around the locked Composer Core so a user can compose, listen, edit, mix, version, recover, reopen, and export a project without requiring Firebase or Lyria, then deliver one audited integration ZIP for AI Studio.

**Architecture:** Keep MusicXML as the canonical score. Add a local-first project/revision layer over IndexedDB, deterministic MusicXML editing helpers, mixer-aware SoundFont rendering, a reusable tabbed ResultWorkspace, project/history management, guarded section-level AI revision, autosave/recovery, and deterministic project export. Firebase remains optional legacy/cloud persistence; Lyria remains an optional production layer. All changes are built around existing `ScoreTimeline`, MIDI, SoundFont, OSMD, and `HTMLAudioElement` playback.

**Tech Stack:** React 19, TypeScript 5.8, Vite 6, Express 4, `idb` 8, `fast-xml-parser` 5, `spessasynth_core` 4.3.22, OSMD 2.1.2, browser DOMParser/XMLSerializer, IndexedDB, Web Audio offline rendering, HTMLAudioElement.

**Spec:** `docs/superpowers/specs/2026-09-16-music-pro-product-v1-design.md`

## Global Constraints

- Audited implementation base is GitHub `main` commit `7da6e629ac4610bfa5537d8deec0d9d2d85fb312`.
- MusicXML remains MASTER COMPOSITION.
- Protect `server/music/composer.ts`, existing arrangement/lead validators, SongDNA extraction, model routing/fallback policy, and existing Lyria generation behavior unless a concrete defect is proven by a failing test.
- Composer, playback, projects/history, demo, settings, revisions, and deterministic exports must remain usable without Firebase.
- Lyria is optional and must never gate Score Preview, editing, revision history, MIDI, WAV, or project package export.
- Keep the verified iPad playback architecture: rendered audio blob -> `HTMLAudioElement`; do not restore direct live Web Audio transport.
- SoundFont remains preferred renderer; current lightweight renderer remains fallback.
- No API key is exposed, stored, or editable in the frontend.
- No billing, subscriptions, marketplace, multi-user collaboration, or social login in V1.
- Use no new runtime dependency unless implementation proves it necessary. Project ZIP must use a small internal store-only ZIP writer so `package.json` need not gain JSZip.
- Every optional subsystem failure must preserve the last valid score and current project/revision state.
- AI Studio receives exactly one final integration ZIP and is used only for extraction/install/lint/build; it must not edit code.
- Do not push the V1 product patch to GitHub before runtime acceptance unless the user explicitly instructs it.

---

## File Structure

### New domain/persistence files

- `src/projects/types.ts` — canonical MusicProject, ScoreRevision, MusicProjectBundle, summaries, repository interface.
- `src/projects/revision-utils.ts` — create/restore/rename revisions and score summary metadata.
- `src/projects/local-project-repository.ts` — IndexedDB persistence via `idb`.
- `src/projects/project-service.ts` — local-first façade, autosave target, legacy-run import, optional Firebase bridge.
- `src/projects/legacy-run.ts` — convert `CompositionRun` to project/revisions.
- `src/projects/autosave.ts` — debounce/dirty-state controller independent of React.

### New score editing files

- `src/music/musicxml-edit.ts` — title, lyrics, MIDI program mutations; namespace-safe DOM operations.
- `src/music/measure-range.ts` — range validation, extraction metadata, replacement guards, score summaries.

### New audio/mixer files

- `src/audio/mix-state.ts` — default mix construction, mute/solo resolution, gain/pan sanitization.
- `src/audio/mix-render.ts` — apply project mix to SoundFont/offline rendering outputs.

### New export/demo files

- `src/export/zip-store.ts` — deterministic uncompressed ZIP writer with CRC32.
- `src/export/project-package.ts` — build project ZIP manifest and files.
- `src/demo/multi-instrument-demo.ts` — deterministic 30–60 second 4-part MusicXML fixture.

### New UI files

- `src/components/workspace/WorkspaceTabs.tsx`
- `src/components/workspace/EditPanel.tsx`
- `src/components/workspace/MixerPanel.tsx`
- `src/components/workspace/RevisionsPanel.tsx`
- `src/components/workspace/ExportPanel.tsx`
- `src/components/workspace/SectionRevisionPanel.tsx`
- `src/components/projects/ProjectList.tsx`
- `src/components/projects/ProjectToolbar.tsx`

### New server files

- `server/music/section-revision.ts` — bounded measure-range prompt, fragment parse/merge, validation, structured errors.

### Existing files to modify

- `src/types.ts`
- `src/services/settings.ts`
- `src/services/db.ts` only to stop treating settings as cloud-only; profile helpers remain compatible.
- `src/services/runs.ts` only for legacy import compatibility, not as primary V1 project storage.
- `src/music/musicxml-transform.ts`
- `src/music/midi-export.ts`
- `src/audio/soundfont-render.ts`
- `src/audio/offline-render.ts`
- `src/audio/media-playback-engine.ts`
- `src/components/ResultWorkspace.tsx`
- `src/components/ScorePlayer.tsx`
- `src/components/ScoreQuickEdit.tsx`
- `src/views/ComposeView.tsx`
- `src/views/RunsView.tsx`
- `src/views/DemoDataView.tsx`
- `src/views/SettingsView.tsx`
- `src/views/HomeView.tsx`
- `src/App.tsx`
- `server.ts`

### Focused tests

- `tests/projects/revision-utils.test.ts`
- `tests/projects/legacy-run.test.ts`
- `tests/projects/autosave.test.ts`
- `tests/music/musicxml-edit.test.ts`
- `tests/music/measure-range.test.ts`
- `tests/music/mix-state.test.ts`
- `tests/music/project-package.test.ts`
- `tests/music/multi-instrument-demo.test.ts`
- `tests/server/section-revision.test.ts`
- extend existing `tests/music/midi-export.test.ts`
- extend existing `tests/music/media-playback-engine.test.ts`

---

### Task 1: Project and Revision Domain Model

**Files:**
- Create: `src/projects/types.ts`
- Create: `src/projects/revision-utils.ts`
- Modify: `src/types.ts`
- Test: `tests/projects/revision-utils.test.ts`

**Interfaces:**
- Produces `MusicProject`, `ScoreRevision`, `MusicProjectBundle`, `MusicProjectSummary`, `ScoreSummary`, `ProjectRepository`.
- Produces `createRevision(bundle, input)`, `restoreRevision(bundle, revisionId, now)`, `renameRevision(bundle, revisionId, label)`, `summarizeScore(xml)`.
- Later tasks consume these exact names.

- [ ] **Step 1: Write the failing revision test**

```ts
import { createRevision, restoreRevision, renameRevision } from '../../src/projects/revision-utils';
import type { MusicProjectBundle } from '../../src/projects/types';

const base: MusicProjectBundle = {
  project: {
    id: 'p1', title: 'Song', idea: 'Idea', style: 'STYLE.VN.VPOP-BALLAD',
    createdAt: 100, updatedAt: 100, activeRevisionId: 'r1', leadRevisionId: 'r1',
    mix: { parts: {}, masterGain: 1, reverb: 0.12, normalizeExport: true }, tags: [],
  },
  revisions: [{ id: 'r1', projectId: 'p1', label: 'Lead', reason: 'compose', musicXml: '<score-partwise/>', createdAt: 100 }],
};
const edited = createRevision(base, { id: 'r2', label: 'Edit 1', reason: 'edit', musicXml: '<score-partwise version="4.0"/>', createdAt: 200 });
if (edited.project.activeRevisionId !== 'r2') throw new Error('active revision');
if (edited.revisions.length !== 2) throw new Error('revision append');
const restored = restoreRevision(edited, 'r1', 300, 'r3');
if (restored.revisions.at(-1)?.reason !== 'restore') throw new Error('restore must append');
if (restored.revisions.at(-1)?.musicXml !== '<score-partwise/>') throw new Error('restore snapshot');
const renamed = renameRevision(restored, 'r3', 'Khôi phục Lead');
if (renamed.revisions.at(-1)?.label !== 'Khôi phục Lead') throw new Error('rename');
console.log('PROJECT REVISION TESTS PASSED');
```

- [ ] **Step 2: Run RED**

Run:
```bash
npx tsx tests/projects/revision-utils.test.ts
```
Expected: FAIL because project types/revision utilities do not exist.

- [ ] **Step 3: Implement the domain types**

`src/projects/types.ts` must define exactly:

```ts
export type RevisionReason = 'compose' | 'arrange' | 'edit' | 'section-ai' | 'restore' | 'duplicate';
export interface MixPartState { partId: string; volume: number; pan: number; mute: boolean; solo: boolean; midiProgram?: number; }
export interface MixState { parts: Record<string, MixPartState>; masterGain: number; reverb: number; normalizeExport: boolean; }
export interface MusicProject { id: string; title: string; idea: string; style: string; createdAt: number; updatedAt: number; activeRevisionId: string; leadRevisionId?: string; mix: MixState; tags: string[]; }
export interface ScoreRevision { id: string; projectId: string; parentRevisionId?: string; label: string; reason: RevisionReason; musicXml: string; createdAt: number; }
export interface ScoreSummary { durationSeconds: number; bpm?: number; partCount: number; noteCount: number; key?: string; mode?: string; }
export interface MusicProjectBundle { project: MusicProject; revisions: ScoreRevision[]; }
export interface MusicProjectSummary { id: string; title: string; idea: string; style: string; updatedAt: number; activeRevisionId: string; revisionCount: number; }
export interface ProjectRepository { listProjects(): Promise<MusicProjectSummary[]>; getProject(id: string): Promise<MusicProjectBundle | null>; saveProject(bundle: MusicProjectBundle): Promise<void>; deleteProject(id: string): Promise<void>; duplicateProject(id: string): Promise<string>; }
```

Add only backward-compatible aliases/exports to `src/types.ts`; do not remove `CompositionRun`.

- [ ] **Step 4: Implement immutable revision helpers**

Rules:
- append only for create/restore;
- restore copies target XML into a new revision;
- never delete previous revisions;
- update `activeRevisionId` and `updatedAt`;
- reject duplicate revision IDs;
- trim labels; empty label -> reason-specific default.

- [ ] **Step 5: Run GREEN**

```bash
npx tsx tests/projects/revision-utils.test.ts
npm run lint
```
Expected: test prints PASS; TypeScript no errors.

---

### Task 2: Local-First IndexedDB Repository and Legacy Run Conversion

**Files:**
- Create: `src/projects/local-project-repository.ts`
- Create: `src/projects/project-service.ts`
- Create: `src/projects/legacy-run.ts`
- Modify: `src/services/runs.ts`
- Test: `tests/projects/legacy-run.test.ts`

**Interfaces:**
- `legacyRunToProject(run: CompositionRun, now?: number): MusicProjectBundle`
- `localProjectRepository: ProjectRepository`
- `projectService.listProjects()`, `getProject(id)`, `saveProject(bundle)`, `createFromComposition(input)`, `importLegacyRun(run)`, `deleteProject(id)`, `duplicateProject(id, revisionId?)`.

- [ ] **Step 1: Write legacy conversion RED test**

Test must verify:
- `leadMusicXml` becomes a `compose` revision when present;
- `finalMusicXml || musicXml` becomes `arrange` revision;
- active revision is final;
- project title/style/idea preserved;
- missing lead does not create an empty revision.

- [ ] **Step 2: Run RED**

```bash
npx tsx tests/projects/legacy-run.test.ts
```
Expected: module missing.

- [ ] **Step 3: Implement IndexedDB schema**

Use existing `idb` dependency.

```ts
interface MusicProDb extends DBSchema {
  projects: { key: string; value: MusicProject; indexes: { 'by-updatedAt': number; 'by-title': string } };
  revisions: { key: string; value: ScoreRevision; indexes: { 'by-projectId': string; 'by-createdAt': number } };
}
```

Database name: `music-pro-v1`; version: `1`.

`saveProject` must use one readwrite transaction for project + all revisions. `deleteProject` deletes the project and all its revisions in the same transaction. `duplicateProject` generates a new project ID and new revision IDs; XML is copied, not referenced.

- [ ] **Step 4: Implement projectService façade**

Rules:
- local repository is primary;
- legacy Firebase runs are only imported when explicitly requested/opened;
- Firebase error must never block local save;
- expose a `cloudWarning` result only where a cloud attempt is made;
- no automatic bidirectional conflict resolution in V1.

- [ ] **Step 5: Keep runsService backward compatible**

Do not change its Firestore schema. Add only helper access needed for legacy import, e.g. `getRunById` if required. Existing saved records must remain readable.

- [ ] **Step 6: Run GREEN**

```bash
npx tsx tests/projects/legacy-run.test.ts
npm run lint
```

---

### Task 3: Autosave, Dirty State, and Unified Local Settings

**Files:**
- Create: `src/projects/autosave.ts`
- Modify: `src/types.ts`
- Modify: `src/services/settings.ts`
- Modify: `src/services/db.ts`
- Modify: `src/views/SettingsView.tsx`
- Test: `tests/projects/autosave.test.ts`

**Interfaces:**
- `createAutosaveController({ delayMs, save })` returning `{ schedule, flush, cancel, isDirty }`.
- `settingsService.getSettings(): AppSettings`
- `settingsService.saveSettings(settings): void`

- [ ] **Step 1: Write autosave RED test using fake timers implemented manually**

Avoid adding a timer-test dependency. Inject `setTimer`/`clearTimer` into the controller. Verify repeated schedule calls collapse to one save and `flush()` persists the latest snapshot.

- [ ] **Step 2: Extend AppSettings exactly**

```ts
export interface AppSettings {
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

Defaults:
- `defaultStyleId='STYLE.VN.VPOP-BALLAD'`
- `playbackQuality='standard'`
- `defaultExportFormat='wav'`
- `normalizeWav=true`
- `autoSave=true`

- [ ] **Step 3: Make SettingsView local-first**

Use `settingsService`, not cloud-only `dbService`, for the visible settings screen. Preserve `dbService` profile helpers for compatibility. Remove any UI copy claiming API key/model editing if the UI does not actually expose those fields.

- [ ] **Step 4: Run GREEN**

```bash
npx tsx tests/projects/autosave.test.ts
npm run lint
```

---

### Task 4: Deterministic MusicXML Editing and Measure-Range Utilities

**Files:**
- Create: `src/music/musicxml-edit.ts`
- Create: `src/music/measure-range.ts`
- Modify: `src/music/musicxml-transform.ts`
- Test: `tests/music/musicxml-edit.test.ts`
- Test: `tests/music/measure-range.test.ts`

**Interfaces:**
- `setMusicXMLTitle(xml, title): string`
- `setLyricsInMeasureRange(xml, range, text): string`
- `setPartMidiProgram(xml, partId, midiProgram): string`
- `validateMeasureRange(xml, range): { startMeasure: number; endMeasure: number; availableMeasures: number[] }`
- `summarizeMeasureRange(xml, range): { partIds: string[]; measureCount: number; startMeasure: number; endMeasure: number }`

- [ ] **Step 1: Write title/lyrics/program RED tests**

Fixture must include namespace-aware MusicXML, two lyric-bearing notes, and a `<score-part>` with `<midi-instrument>`. Assertions:
- title update creates/updates `<work-title>` without deleting other work metadata;
- lyric text is updated only inside selected measure range;
- program clamped to 1..128 and written to the matching part;
- score remains XML-parseable after each operation.

- [ ] **Step 2: Write measure-range RED tests**

Assertions:
- reversed range throws;
- out-of-score range throws;
- sparse measure numbering is handled by actual measure numbers, not array indexes;
- summary lists parts that contain the selected range.

- [ ] **Step 3: Implement namespace-safe DOM helpers**

Reuse conventions from current `musicxml-transform.ts`: local-name traversal and `createElementNS`. Never regex-rewrite XML note content.

Lyrics policy for V1:
- split provided text on whitespace;
- assign sequential tokens to existing `<lyric><text>` elements inside the selected range;
- if fewer tokens than lyric notes, remaining lyric texts become empty strings;
- if more tokens than lyric slots, throw `LYRIC_SLOT_MISMATCH` instead of silently dropping text;
- do not create new notes.

- [ ] **Step 4: Run GREEN**

```bash
npx tsx tests/music/musicxml-edit.test.ts
npx tsx tests/music/measure-range.test.ts
npm run lint
```

---

### Task 5: Mixer State and Mixer-Aware SoundFont/WAV Rendering

**Files:**
- Create: `src/audio/mix-state.ts`
- Create: `src/audio/mix-render.ts`
- Modify: `src/audio/soundfont-render.ts`
- Modify: `src/audio/offline-render.ts`
- Modify: `src/audio/media-playback-engine.ts`
- Modify: `src/components/ScorePlayer.tsx`
- Test: `tests/music/mix-state.test.ts`
- Extend: `tests/music/media-playback-engine.test.ts`

**Interfaces:**
- `createDefaultMix(timeline): MixState`
- `sanitizeMix(mix, timeline): MixState`
- `resolveAudibleParts(mix): Set<string>`
- `renderTimelineToWavBlob(timeline, options & { mix?: MixState }): Promise<Blob>`
- `HtmlMediaPlaybackEngine.load(timeline, trackId, mix?)`

- [ ] **Step 1: Write mix rules RED test**

Assertions:
- no solo => all non-muted audible;
- any solo => only soloed, non-muted parts audible;
- volume clamps 0..1.5;
- pan clamps -1..1;
- master gain clamps 0..1.5;
- missing part entries receive defaults.

- [ ] **Step 2: Implement renderer integration without changing transport architecture**

For SoundFont rendering:
- apply per-part gain before summing;
- stereo pan uses equal-power coefficients:
  `left = cos((pan + 1) * PI / 4)`, `right = sin((pan + 1) * PI / 4)`;
- muted/non-audible part contributes zero;
- master gain after sum;
- optional normalization only at final PCM stage;
- light reverb uses a deterministic short feedback/delay algorithm or impulse synthesized in code; no network resource;
- fallback renderer receives the same audible-part/gain/pan policy.

- [ ] **Step 3: Prevent stale preview cache when mix changes**

Playback identity must include score ID + stable mix fingerprint. A volume/pan/mute/solo change must render a new media blob; seeking/playback still use `HTMLAudioElement`.

- [ ] **Step 4: Keep ScorePlayer API backward compatible**

Add optional `mix` prop. Existing calls without it behave exactly as before.

- [ ] **Step 5: Run GREEN**

```bash
npx tsx tests/music/mix-state.test.ts
npx tsx tests/music/media-playback-engine.test.ts
npm run lint
```

---

### Task 6: MIDI Instrument Override and Project Package Export

**Files:**
- Modify: `src/music/midi-export.ts`
- Create: `src/export/zip-store.ts`
- Create: `src/export/project-package.ts`
- Test: extend `tests/music/midi-export.test.ts`
- Test: `tests/music/project-package.test.ts`

**Interfaces:**
- `timelineToMidiBytes(timeline, ppq?, mix?): Uint8Array`
- `createStoreZip(entries: Array<{ name: string; data: Uint8Array }>): Uint8Array`
- `buildProjectPackage(bundle, options?): Promise<Blob>`

- [ ] **Step 1: Add MIDI override RED test**

A part with original program 1 and mixer override 34 must emit GM program-change 33 (zero-based MIDI byte) in exported MIDI, while percussion stays channel 10 and ignores melodic program change.

- [ ] **Step 2: Implement a minimal deterministic ZIP writer**

Implement store method only (compression method 0):
- local file headers;
- CRC32;
- central directory;
- EOCD;
- UTF-8 file names;
- deterministic entry ordering.

No third-party ZIP dependency.

- [ ] **Step 3: Build project package**

Required entries:

```text
project.json
current.musicxml
lead.musicxml             # only when lead revision exists
revisions/index.json
revisions/<revisionId>.musicxml
README.txt
```

`project.json` includes project metadata and mix, not API keys or SoundFont bytes.

- [ ] **Step 4: Test ZIP structure**

Without a ZIP dependency, parse central-directory filenames in the test and assert required entries + `PK\x03\x04` signature. Verify package does not contain `GeneralUserGS.sf3`, API keys, or Firebase config.

- [ ] **Step 5: Run GREEN**

```bash
npx tsx tests/music/midi-export.test.ts
npx tsx tests/music/project-package.test.ts
npm run lint
```

---

### Task 7: Rebuild ResultWorkspace as the V1 Product Workspace

**Files:**
- Create: `src/components/workspace/WorkspaceTabs.tsx`
- Create: `src/components/workspace/EditPanel.tsx`
- Create: `src/components/workspace/MixerPanel.tsx`
- Create: `src/components/workspace/RevisionsPanel.tsx`
- Create: `src/components/workspace/ExportPanel.tsx`
- Create: `src/components/workspace/SectionRevisionPanel.tsx`
- Modify: `src/components/ResultWorkspace.tsx`
- Modify: `src/components/ScoreQuickEdit.tsx`

**Interfaces:**

`ResultWorkspace` becomes:

```ts
interface ResultWorkspaceProps {
  xmlContent: string;
  title: string;
  subtitle?: string;
  filenameBase?: string;
  projectBundle?: MusicProjectBundle;
  onProjectChange?: (bundle: MusicProjectBundle) => void;
  onChangeXml?: (nextXml: string, reason?: RevisionReason, label?: string) => void;
  readOnly?: boolean;
}
```

- [ ] **Step 1: Preserve Score tab first**

The existing visible score/player behavior must survive unchanged as the first tab. On narrow screens tab controls must scroll horizontally rather than overflow.

- [ ] **Step 2: Move quick edits into EditPanel and add redo/reset/title/lyrics/instrument**

Session undo/redo stack minimum 50 snapshots. Reset returns to the XML provided when workspace mounted or when project/revision identity changes.

Do not persist a revision on every keystroke. Commit revision on explicit Apply/Save action for title/lyrics/instrument/BPM/transpose groups.

- [ ] **Step 3: Add MixerPanel**

Per part controls:
- mute;
- solo;
- volume 0..1.5;
- pan -1..1;
- GM program selector 1..128 for non-percussion;
- button `Áp dụng nhạc cụ vào bản nhạc` explicitly writes program into MusicXML.

Mix-only changes update project metadata, not MusicXML.

- [ ] **Step 4: Add Versions panel**

Show newest first with label, reason, timestamp, score summary. Operations: rename label, restore (append restore revision), duplicate project from selected revision. Never delete individual revisions in V1.

- [ ] **Step 5: Add Export panel**

Buttons for current MusicXML, MIDI with mix instrument overrides, stereo WAV using mix, and Project ZIP. Reuse one filename sanitizer.

- [ ] **Step 6: Add dirty/save state presentation**

Visible states: `Đã lưu`, `Đang lưu…`, `Chưa lưu`. No modal for successful autosave.

- [ ] **Step 7: Static verification**

```bash
npm run lint
```

Also inspect at 375px-equivalent CSS width: no critical control depends on hover.

---

### Task 8: Local-First Composer Persistence and Recovery

**Files:**
- Modify: `src/views/ComposeView.tsx`
- Modify: `src/components/ResultWorkspace.tsx`
- Use: `src/projects/project-service.ts`, `src/projects/autosave.ts`

**Interfaces:**
- Composer creates/updates one local `MusicProjectBundle` per composition session.
- Lead generation creates `compose` revision.
- Arrangement creates `arrange` revision.
- Subsequent workspace edits create `edit` revisions only on explicit commit actions.

- [ ] **Step 1: Replace `persistCompletedRun` as primary persistence**

After valid lead result:
- create local project immediately;
- save lead revision;
- keep optional Firestore run save only as compatibility/cloud attempt.

After valid arrangement:
- append arrangement revision to same local project;
- update active revision;
- cloud failure only emits warning.

- [ ] **Step 2: Preserve result on provider errors**

When prepare/lead/arrange/Lyria/section revision returns an error, do not clear existing `leadSheetXml`, `finalXml`, local project ID, revisions, mix, or downloaded audio URL unless the operation specifically replaces that artifact on success.

- [ ] **Step 3: Add autosave and unload guard**

Autosave project metadata/mix/edit state when settings `autoSave=true`. Add `beforeunload` listener only while dirty.

- [ ] **Step 4: Use settings default style**

Initial Composer style comes from `settingsService.getSettings().defaultStyleId`.

- [ ] **Step 5: Static verification**

```bash
npm run lint
```

Manual source check: no Composer path checks `db` before allowing composition.

---

### Task 9: Projects/History Screen with Legacy Import

**Files:**
- Create: `src/components/projects/ProjectList.tsx`
- Create: `src/components/projects/ProjectToolbar.tsx`
- Modify: `src/views/RunsView.tsx`
- Modify: `src/App.tsx`
- Modify: `src/views/HomeView.tsx`

**Interfaces:**
- Existing navigation key `runs` remains for compatibility, but user-facing label becomes `Dự án / Lịch sử`.

- [ ] **Step 1: Make RunsView list local projects first**

Features:
- search title/idea, case-insensitive;
- style filter;
- sort updated newest/title A-Z;
- rename;
- duplicate;
- delete with confirmation;
- select/open project workspace;
- play/export active revision.

- [ ] **Step 2: Add legacy Firebase section only when Firebase exists**

Legacy records remain read-only until user chooses `Nhập vào dự án`. Import uses `legacyRunToProject`, then opens the new local project.

- [ ] **Step 3: Remove Firebase gating for runs/demo**

Change `App.tsx` so `needsFirebase` does not include `runs` or `demo`. Knowledge/Improver may remain cloud-dependent in V1, but their unavailability must not block core product screens.

- [ ] **Step 4: Update HomeView copy/stats**

Stats for projects come from `projectService.listProjects`, not Firebase runs. Remove misleading Settings text about frontend API-key editing.

- [ ] **Step 5: Static verification**

```bash
npm run lint
```

Manual browser acceptance later must verify reopen after refresh with Firebase absent.

---

### Task 10: Guarded Section-Level AI Revision Endpoint

**Files:**
- Create: `server/music/section-revision.ts`
- Modify: `server.ts`
- Test: `tests/server/section-revision.test.ts`

**Interfaces:**

```ts
export interface SectionRevisionRequest {
  musicXml: string;
  startMeasure: number;
  endMeasure: number;
  instruction: string;
  styleId: string;
}

export function buildSectionRevisionContext(req: SectionRevisionRequest): { systemInstruction: string; prompt: string };
export function mergeSectionReplacement(sourceXml: string, replacementXml: string, startMeasure: number, endMeasure: number): string;
```

Endpoint: `POST /api/compose/revise-section`.

- [ ] **Step 1: Write pure merge RED tests before any Gemini call**

Test must prove:
- only requested measure numbers are replaced;
- parts outside range are byte-semantic equivalent after serialization;
- replacement missing required part throws `SECTION_MERGE_FAILED`;
- malformed replacement throws;
- source argument remains unchanged.

- [ ] **Step 2: Implement bounded prompt**

Prompt sends:
- user instruction;
- style display/context;
- requested measure numbers;
- one adjacent measure of context on each side where available;
- exact part IDs.

Response contract: XML fragment wrapped in `<section-revision>` containing `<part id="...">` with only selected measures. Explicitly prohibit whole-score output.

- [ ] **Step 3: Validate merged full score using existing protected validator**

Import `validateMusicXML` from `server/music/musicxml-validator.ts`; do not modify validator. If invalid, return `SECTION_MERGE_FAILED` with validation errors and no modified score.

- [ ] **Step 4: Structured provider errors**

Map high-demand/503 to `PROVIDER_UNAVAILABLE`; 429 to `PROVIDER_RATE_LIMITED`; malformed generated XML to `SECTION_MERGE_FAILED`.

- [ ] **Step 5: Add endpoint in server.ts**

Use existing server-side `GEMINI_API_KEY`, `TEXT_MODEL`, and model client conventions. Do not add frontend model override. Do not touch `/api/compose/lead-sheet`, `/api/compose/arrange`, or Lyria logic.

- [ ] **Step 6: Run GREEN**

```bash
npx tsx tests/server/section-revision.test.ts
npm run lint
```

No real Gemini call in tests.

---

### Task 11: Multi-Instrument Deterministic Demo Fixture

**Files:**
- Create: `src/demo/multi-instrument-demo.ts`
- Modify: `src/views/DemoDataView.tsx`
- Test: `tests/music/multi-instrument-demo.test.ts`

**Interfaces:**
- `MULTI_INSTRUMENT_DEMO_XML: string`
- `createMultiInstrumentDemoProject(now?: number): MusicProjectBundle`

- [ ] **Step 1: Write RED test**

Parse fixture through `parseMusicXMLToTimeline` and assert:
- duration 30–60 seconds;
- exactly or at least 4 required named parts: Piano, Bass, Strings, Drums;
- Piano melodic program in piano family;
- Bass program in bass family;
- Strings program 49/50 family;
- Drums recognized percussion/channel 10 path;
- each part has audible events;
- score has at least 8 measures.

- [ ] **Step 2: Author fixture without Gemini**

Use 4/4, 96 BPM, 12–16 measures. Keep harmony simple and deterministic. Include explicit `<midi-channel>` and `<midi-program>` metadata; percussion uses channel 10 and `<unpitched>` notes.

- [ ] **Step 3: DemoDataView creates local project directly**

Button label: `Tạo demo nhiều nhạc cụ`. Do not require Firebase. Keep existing tiny demo only if useful for parser smoke; multi-instrument demo becomes the primary QA path.

- [ ] **Step 4: Run GREEN**

```bash
npx tsx tests/music/multi-instrument-demo.test.ts
npm run lint
```

---

### Task 12: Error UX, Offline States, Accessibility, and Product Polish

**Files:**
- Modify: `src/components/ScorePlayer.tsx`
- Modify: workspace panels from Task 7
- Modify: `src/views/ComposeView.tsx`
- Modify: `src/views/RunsView.tsx`
- Modify: `src/views/SettingsView.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Normalize UI errors to codes defined by spec: `PROVIDER_UNAVAILABLE`, `PROVIDER_RATE_LIMITED`, `INVALID_MUSICXML`, `SECTION_MERGE_FAILED`, `SOUNDFONT_UNAVAILABLE`, `AUDIO_RENDER_FAILED`, `LOCAL_STORAGE_FAILED`, `CLOUD_SYNC_FAILED`.

- [ ] **Step 1: Centralize user-facing error text**

Create a small helper in an existing utility location or `src/utils/product-errors.ts` if no suitable utility exists. It must return Vietnamese actionable copy and state what remains usable.

Examples:
- provider unavailable: `Máy chủ AI đang bận. Bản nhạc hiện tại vẫn an toàn; bạn có thể nghe, chỉnh sửa và xuất file rồi thử lại sau.`
- SoundFont unavailable: `Không tải được bộ nhạc cụ mẫu. Music-Pro sẽ dùng bộ phát dự phòng; bản nhạc và file MusicXML không bị ảnh hưởng.`

- [ ] **Step 2: Accessibility**

Every icon-only button requires `aria-label`; range controls have visible or `aria-label` names; tab controls use `role="tablist"/"tab"` and keyboard left/right navigation.

- [ ] **Step 3: Narrow-screen behavior**

At mobile widths:
- no fixed-width mixer column;
- panels stack;
- project action menu remains tappable;
- export buttons wrap;
- destructive actions are separated from primary playback.

- [ ] **Step 4: Offline indicator**

Use browser `online/offline` events. Offline state must not disable deterministic playback/edit/export/local history.

- [ ] **Step 5: Static verification**

```bash
npm run lint
```

---

### Task 13: Full Deterministic Regression Suite and Protected-Core Audit

**Files:**
- No production files unless a failing test proves a defect.
- Create: `docs/implementation/PRODUCT_V1_VERIFICATION.md`

- [ ] **Step 1: Run all existing focused tests**

```bash
npx tsx tests/music/score-timeline.test.ts
npx tsx tests/music/midi-export.test.ts
npx tsx tests/music/musicxml-transform.test.ts
npx tsx tests/music/playback-helpers.test.ts
npx tsx tests/music/score-id.test.ts
npx tsx tests/music/media-playback-engine.test.ts
npx tsx tests/music/audio-render-policy.test.ts
npx tsx tests/music/instrument-program.test.ts
```

Expected: all PASS.

- [ ] **Step 2: Run all new tests**

```bash
npx tsx tests/projects/revision-utils.test.ts
npx tsx tests/projects/legacy-run.test.ts
npx tsx tests/projects/autosave.test.ts
npx tsx tests/music/musicxml-edit.test.ts
npx tsx tests/music/measure-range.test.ts
npx tsx tests/music/mix-state.test.ts
npx tsx tests/music/project-package.test.ts
npx tsx tests/music/multi-instrument-demo.test.ts
npx tsx tests/server/section-revision.test.ts
```

- [ ] **Step 3: Run repository lint/build locally if dependencies available**

```bash
npm run lint
npm run build
```

Both must exit 0 before packaging. If the artifact environment cannot install/run the full repo, record that exact limitation and do not claim build PASS; AI Studio remains final build runner.

- [ ] **Step 4: Verify protected files**

Diff from base `7da6e629...` must show no modifications to:
- `server/music/composer.ts`
- `server/music/musicxml-validator.ts`
- `server/music/song-dna.ts`
- existing Lyria route behavior except unrelated line movement is prohibited.

If any appears, stop and justify with a concrete failing test before retaining that change.

- [ ] **Step 5: Scan placeholders/debug artifacts**

```bash
grep -RInE 'TODO|TBD|FIXME|HACK|console\.log\(' src server tests | grep -v 'tests/' || true
```

No product placeholder/debug log may remain unless documented as intentional server error logging.

---

### Task 14: One-Shot AI Studio Delivery Package

**Files:**
- Create: `docs/implementation/PRODUCT_V1_AUDIT.md`
- Create: `UPLOAD_PRODUCT_V1_TO_AISTUDIO.md`
- Create: `ROLLBACK_PRODUCT_V1.md`
- Create: `VERIFICATION_PRODUCT_V1.txt`
- Create: `SHA256SUMS.txt`
- Package: `Music-Pro_Product_V1_Complete_2026-09-16.zip`

- [ ] **Step 1: Build package from changed/new files only**

Do not include `.git`, `node_modules`, generated `dist`, private `.env`, credentials, cached SoundFont binary, or user data.

- [ ] **Step 2: Write rollback instructions**

Rollback base must be explicit:
`7da6e629ac4610bfa5537d8deec0d9d2d85fb312`.

Rollback document lists every overwritten file and every new file to remove.

- [ ] **Step 3: Generate per-file SHA256**

```bash
find <package-root> -type f ! -name SHA256SUMS.txt -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS.txt
sha256sum -c SHA256SUMS.txt
```

Expected: every entry `OK`.

- [ ] **Step 4: ZIP and verify integrity**

```bash
zip -r Music-Pro_Product_V1_Complete_2026-09-16.zip <package-root-contents>
unzip -t Music-Pro_Product_V1_Complete_2026-09-16.zip
sha256sum Music-Pro_Product_V1_Complete_2026-09-16.zip
```

Expected: no ZIP errors.

- [ ] **Step 5: One AI Studio prompt only**

The included prompt must say exactly, in substance:

```text
Apply this ZIP unchanged at project root.
Do not edit/refactor/autofix code.
Do not call Gemini or Lyria.
Do not commit/push.
Run only:
npm install --no-audit --no-fund --package-lock=false
npm run lint
npm run build
If any command fails, stop and return the exact log without fixing code.
If all pass, report only install/lint/build PASS.
```

- [ ] **Step 6: Runtime acceptance after the single upload**

User manually verifies, in this order:
1. create/open multi-instrument demo;
2. hear Piano/Bass/Strings/Drums distinctly;
3. mute/solo/volume/pan;
4. title/BPM/lyrics/instrument + undo/redo;
5. refresh and reopen local project without Firebase;
6. restore revision;
7. export MusicXML/MIDI/WAV/Project ZIP;
8. confirm provider failure does not erase score;
9. confirm iPad embedded playback audible.

Only after this runtime evidence may the V1 patch be classified PRODUCT V1 PASS and offered for GitHub commit.

---

## Self-Review

### Spec coverage

- Canonical MusicXML/project model: Tasks 1–2.
- Local-first persistence/Firebase optional: Tasks 2, 8, 9.
- Result Workspace: Task 7.
- Deterministic editor and measure ranges: Task 4 + Task 7.
- Section-level AI revisions: Task 10 + Task 7.
- Mixer/audio quality: Task 5 + Task 7.
- Revision history: Tasks 1, 7, 9.
- Projects/history UX: Task 9.
- Autosave/recovery: Tasks 3, 8, 12.
- Settings: Task 3.
- Demo fixture: Task 11.
- MusicXML/MIDI/WAV/Project ZIP export: Tasks 5–7.
- Mobile/accessibility/error model: Task 12.
- One-shot delivery/audit: Tasks 13–14.

### Type consistency

- `MixState`/`MixPartState` originate in `src/projects/types.ts` and are reused by audio and UI.
- `MusicProjectBundle` is the single project aggregate across repository, workspace, export, legacy conversion, and revisions.
- `MeasureRange` is defined once in `src/music/measure-range.ts` and imported by edit/server helpers where browser/server module boundaries permit; server may mirror the simple `{startMeasure,endMeasure}` request DTO but not duplicate client implementation code.
- `ResultWorkspace` remains usable without a project bundle for unsaved/legacy contexts.

### Scope control

- No auth/payment/collaboration.
- No piano-roll or note-head editor.
- No branch graph; revision history linear.
- No real Gemini/Lyria in deterministic tests.
- No migration that deletes legacy Firebase runs.
- No replacement of proven HTMLAudioElement transport.
