Apply this patch to the CURRENT AI Studio workspace only. Do not reset to GitHub base.

1. Extract at project root and overwrite matching files.
2. Do not auto-fix/refactor/change dependencies.
3. Run `npm run lint`; if PASS run `npm run build`.
4. If both PASS, reproduce Step 3 exactly once.
5. If it fails, use the new `Chẩn đoán lỗi Lead Sheet` panel in Step 3 and press `Sao chép JSON`.
6. Return the JSON verbatim. Do not retry or edit code.
