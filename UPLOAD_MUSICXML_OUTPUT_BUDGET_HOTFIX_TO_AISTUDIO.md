Upload this ZIP into the CURRENT AI Studio workspace. Extract it at project root, then run exactly:

node tools/apply-musicxml-output-budget-hotfix.mjs
npm run lint
npm run build

Do not manually edit code, auto-fix, refactor, change dependencies, change validators, or commit/push.

If lint and build PASS, return to Preview and reproduce the same Lead Sheet request exactly once. If it still fails, copy the existing response-level diagnostic JSON and stop.
