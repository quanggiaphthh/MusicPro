---
id: PIPE.STEP-01
type: pipeline
status: active
version: "1.0"
tags: [pipeline]
serves-steps: [1]
last-updated: "2026-09-07"
---

# Bước 1 — Meta-prompt

## Input bắt buộc

- Yêu cầu kiểu: tạo 2 prompt (viết lời+nhạc, và phối khí); mỗi prompt chỉ dẫn trang cần đọc
- (Workspace) hoặc link `for-ai.md`

## Fetch

- [../prompt-craft/README.md](../prompt-craft/README.md)
- [../prompt-craft/principles.md](../prompt-craft/principles.md)
- [../prompt-craft/output-contract.md](../prompt-craft/output-contract.md)
- [../artifacts/meta-prompt.template.md](../artifacts/meta-prompt.template.md)

## AI làm

Viết meta-prompt theo contract prompt-craft:

- Nhiệm vụ của AI Bước 2: đọc catalog nhiều trang → sinh **hai** prompt chuyên biệt + `DOC_REFS`
- Cấm nhét nguyên văn kho vào prompt
- Tách compose vs arrange
- Tôn trọng [song-request-schema](../meta/song-request-schema.md) (dùng ở Bước 3; không điền bài hát ở Bước 1 trừ khi user đã đưa)

## Output

```text
runs/compose/<run-id>/01-meta-prompt.md
runs/compose/<run-id>/STATUS.md   # step1: done
```

Dừng để user sửa. Không workspace: xuất markdown theo template trong chat.
