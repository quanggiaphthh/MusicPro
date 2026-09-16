# Rollback — Music-Pro Product V1

Audited base commit: `7da6e629ac4610bfa5537d8deec0d9d2d85fb312`.

If this package has been applied but not committed, the safest rollback in a normal Git checkout is:

```bash
git restore --source=7da6e629ac4610bfa5537d8deec0d9d2d85fb312 -- \
  server.ts \
  src/App.tsx \
  src/types.ts \
  src/services/settings.ts \
  src/services/db.ts \
  src/music/midi-export.ts \
  src/audio/soundfont-render.ts \
  src/audio/offline-render.ts \
  src/audio/media-playback-engine.ts \
  src/contexts/AudioContext.tsx \
  src/components/ResultWorkspace.tsx \
  src/components/ScorePlayer.tsx \
  src/components/Sidebar.tsx \
  src/views/ComposeView.tsx \
  src/views/RunsView.tsx \
  src/views/DemoDataView.tsx \
  src/views/SettingsView.tsx \
  src/views/HomeView.tsx \
  tests/music/media-playback-engine.test.ts \
  tests/music/midi-export.test.ts
```

Then delete the files/directories introduced only by Product V1:

```bash
rm -rf \
  src/projects \
  src/export \
  src/demo \
  src/components/workspace \
  src/components/projects \
  server/music/section-revision.ts \
  src/hooks/useOnlineStatus.ts \
  src/utils/download.ts \
  src/utils/product-errors.ts \
  src/music/musicxml-edit.ts \
  src/music/measure-range.ts \
  src/music/general-midi.ts \
  src/audio/mix-state.ts \
  src/audio/mix-render.ts \
  tests/projects \
  tests/server/section-revision.test.ts \
  tests/music/general-midi.test.ts \
  tests/music/measure-range.test.ts \
  tests/music/mix-state.test.ts \
  tests/music/multi-instrument-demo.test.ts \
  tests/music/musicxml-edit.test.ts \
  tests/music/product-errors.test.ts \
  tests/music/project-package.test.ts \
  docs/implementation/PRODUCT_V1_DESIGN.md \
  docs/implementation/PRODUCT_V1_PLAN.md \
  docs/implementation/PRODUCT_V1_AUDIT.md \
  docs/implementation/PRODUCT_V1_VERIFICATION.md \
  ROLLBACK_PRODUCT_V1.md \
  UPLOAD_PRODUCT_V1_TO_AISTUDIO.md \
  VERIFICATION_PRODUCT_V1.txt \
  SHA256SUMS.txt
```

Do not use destructive reset/clean commands if the working tree contains unrelated user work.
