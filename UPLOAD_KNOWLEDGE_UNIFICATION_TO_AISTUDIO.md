# AI Studio instructions

Apply this hotfix to the current Product V1 workspace. Do not edit code manually.

1. Extract ZIP at project root and overwrite matching files.
2. Do not refactor or auto-fix.
3. Do not change dependencies.
4. Do not call Gemini or Lyria.
5. Do not commit/push.
6. Run only:

```bash
npm run lint
npm run build
```

If both pass, report exactly:

```text
lint: PASS
build: PASS
```

If either fails, stop and return the full raw log without modifying code.
