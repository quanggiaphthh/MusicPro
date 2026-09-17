# Upload Local Background Auto-Compose r2 candidate to Google AI Studio

This ZIP is a full source workspace derived from the AI Studio export that already contained Music-Pro v1.4.1. It is intended for **local/session-server runtime acceptance**, not GitHub commit/push.

## Rules

- Do not commit/push GitHub.
- Do not refactor unrelated code.
- Do not change Gemini/Lyria models, dependencies, quality thresholds, validator, SongDNA, SoundFont, or audio architecture.
- Do not add Firestore/Cloud Tasks in this round.
- Do not auto-fix a failing test/build. Stop and return raw log.

## Verification order

1. **Verify the artifact in a clean staging directory before overlaying it into the active workspace.** Example:

```bash
rm -rf /tmp/music-pro-local-bg-r2
mkdir -p /tmp/music-pro-local-bg-r2
unzip -q Music-Pro_Local_Background_AutoCompose_v1.4.1-local-bg-r2_AIStudio_UPLOAD_READY_2026-09-16.zip -d /tmp/music-pro-local-bg-r2
cd /tmp/music-pro-local-bg-r2
sha256sum -c SHA256SUMS.txt
```

The active AI Studio workspace may update `bun.lock` after package-manager startup. That is **not** a valid artifact-integrity check. Artifact integrity must be checked in the clean staging directory before any install/build command runs.

2. After staging verification passes, overlay/use this source snapshot while preserving environment secrets outside the ZIP.
3. Run all `tests/compose/*.test.ts` using the workspace's `tsx` runner.
4. Run targeted music/project regressions, including Score Theater and Production Package tests.
5. Run:

```bash
npm run lint
npm run build
```

6. Start local dev/runtime server.
7. Test one real Auto Composer run using a normal Vietnamese V-Pop Ballad request.
8. While Step 3 is generating:
   - navigate to another menu and return;
   - refresh the browser;
   - confirm the same `runId` resumes and only one generation exists.
9. Confirm provider-wait UI is indeterminate and shows elapsed/server-processing wording.
10. Confirm explicit `Dừng` cancels; navigation/refresh does not.
11. Controlled timeout test: temporarily set `LEAD_SHEET_PROVIDER_TIMEOUT_MS` to a small test value, verify `GENERATION_TIMEOUT`, then restore/remove the override before normal testing.
12. Confirm Step 3 Lead Sheet and Step 4 Arrangement checkpoints persist/recover.
13. Confirm Score Theater and iPad audio behavior did not regress.

## Return format

```text
package: local-background-auto-compose-r2-candidate
compose-tests: PASS|FAIL
music-project-tests: PASS|FAIL
lint: PASS|FAIL
build: PASS|FAIL
background-run-create: PASS|FAIL
same-run-after-navigation: PASS|FAIL
same-run-after-refresh: PASS|FAIL
no-duplicate-generation: PASS|FAIL
explicit-cancel-only: PASS|FAIL
provider-timeout-bounded: PASS|FAIL
lead-checkpoint-recovery: PASS|FAIL
arrangement-checkpoint-recovery: PASS|FAIL
session-loss-no-auto-restart: PASS|FAIL
score-theater-regression: PASS|FAIL
ipad-audio-regression: PASS|FAIL
FINAL_LOCAL_ACCEPTANCE: PASS|FAIL
```

If any item fails: STOP and return the failing command/action plus raw log. Do not patch automatically.
