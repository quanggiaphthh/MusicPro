---
id: CRAFT.OUTPUT-CONTRACT
type: meta
status: active
version: "1.2"
tags: [prompt-craft]
serves-steps: [1]
last-updated: "2026-09-08"
---

# Output contract — Meta-prompt

File `01-meta-prompt.md` phải có các khối:

1. **ROLE** — AI nhận meta-prompt này sẽ tạo 2 prompt (compose + arrange).
2. **GOAL** — Hai prompt + DOC_REFS từ catalog; không nhét nguyên văn kho.
3. **CATALOG** — Chỉ dẫn đọc `catalog.yml` (path + raw URL nếu biết BASE). Chỉ path có trong catalog.
4. **COMPOSE_PROMPT_SPEC** — Vai trò composer **invent** giai điệu; schema; Bước 3 một lượt (XML + notes + gate); DOC_REFS (melody-invention / anti-patterns / quality-gate / lyric-melody-fit); **không** file `03a`.
5. **ARRANGE_PROMPT_SPEC** — Arranger; Flat import OK; DOC_REFS bắt buộc SAFE-PATTERNS / IMPORTER-PROFILE / ANTI-PATTERNS; `importer_self_check PASS` trong notes; cấm mixed direction-type và kit trống phức tạp.
6. **DOC_REFS_RULES** — Mỗi ref: id, path, url, why. Không path ngoài catalog.
7. **FORBIDDEN** — Không archive; không bản quyền; không sáng tác ở Bước 2; không Step 5 / Suno; không bịa file; không bắt buộc `03a-composition-plan.md`.
8. **DELIVERABLES** — `02-compose-prompt.md`, `02-arrange-prompt.md`.

Dùng [meta-prompt.template.md](../artifacts/meta-prompt.template.md) làm khung điền.
