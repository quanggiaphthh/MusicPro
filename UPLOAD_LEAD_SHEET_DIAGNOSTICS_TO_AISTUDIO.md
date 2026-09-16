Apply this diagnostic patch to the CURRENT workspace only. Do not revert prior Product V1/Knowledge hotfixes.

1. Extract at project root and overwrite only matching files.
2. Do not edit code, dependencies, prompts, model routing, validator, token limits, or MusicXML rules.
3. Run `npm run lint`; if PASS run `npm run build`.
4. If both PASS, reproduce the SAME Step 3 composition request exactly once.
5. Immediately retrieve `GET /api/compose/diagnostics/lead-sheet` and report the complete JSON unchanged.
6. Also report HTTP status/code/message from the failed `/api/compose/lead-sheet` request if it fails again.
7. Do not regenerate a second time. Do not auto-fix. Do not commit/push.
