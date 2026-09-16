---
id: PIPE.OVERVIEW
type: pipeline
status: active
version: "1.5"
tags: [pipeline]
serves-steps: [1, 2, 3, 4]
last-updated: "2026-09-16"
---

# Pipeline overview — 4 bước logic, có thể chạy tự động liên tục

```text
Bước 1  Hiểu ý tưởng / meta-plan
Bước 2  compose-prompt + arrange-prompt (+ DOC_REFS)
Bước 3  MusicXML lead sheet + quality gate bắt buộc
Bước 4  MusicXML phối khí + arrangement quality gate
        ↓
Production readiness report / downstream handoff
```

Chỉ **bốn** bước chính. Không invent Step 5. Production Blueprint, Music Brief, Lyria/audio là downstream tùy chọn; Final MusicXML vẫn là MASTER COMPOSITION.

## Nguyên tắc

- Bốn bước là **độc lập về artifact/API** nhưng Product runtime được phép **orchestrate tự động Bước 1 → 4 chỉ bằng một lần bấm**.
- Chế độ từng bước/manual vẫn có thể dừng sau mỗi bước để user sửa hoặc duyệt.
- Bước 3 và 4 chạy hết nội bộ trong một lượt generation; không tách plan phụ để user phải duyệt giữa chừng.
- Mỗi bước hoàn thành phải có summary rõ ràng cho UI; quality gate không được suy ra chỉ từ việc MusicXML parse được.
- Trong editor: output → `runs/compose/<run-id>/` khi workspace hỗ trợ.
- Không sửa `docs/m-guide/` trong lúc đang sáng tác.
- Bước 3: MusicXML hợp lệ ≠ quality PASS; phải qua Composition Quality Gate.
- Bước 4: phải giữ identity của lead sheet và qua Arrangement Quality Gate trước khi production readiness PASS.

## Runtime auto orchestration

Product có thể dùng một orchestrator bao ngoài các endpoint hiện có:

```text
prepare
  → summary step1
  → summary step2
lead-sheet
  → technical validation
  → SongDNA/Composition Quality Gate
  → quality retry có giới hạn nếu FAIL/required weak
arrange
  → technical + identity validation
  → SongDNA/Arrangement Quality Gate
  → quality retry có giới hạn nếu FAIL
production readiness + exact-revision certification
```

Progress/ETA là thông tin UX ước tính; Product nên học ETA từ lịch sử chạy (EWMA/median). Nếu chạy lâu hơn dự kiến, phải nói rõ `lâu hơn dự kiến`, không giả deadline chính xác. Không stream raw MusicXML chưa hoàn chỉnh ra UI như một kết quả hợp lệ.

Nếu quality retry cuối vẫn FAIL: giữ candidate tốt nhất để review/export, phát trạng thái `QUALITY REVIEW REQUIRED`, và không được tự động coi bước tiếp theo là hợp lệ. Ngưỡng cứng ở trạng thái `weak` không được coi PASS; optional weak chỉ là advisory.

Production certification phải gắn với **exact active revision**. Edit/restore/section-AI/duplicate không được kế thừa READY của revision cũ; evidence quality có thể giữ để audit nhưng trạng thái phải thành STALE.

## Playbook từng bước

| Bước | File |
|------|------|
| 1 | [step-01-meta-prompt.md](step-01-meta-prompt.md) |
| 2 | [step-02-specialized-prompts.md](step-02-specialized-prompts.md) |
| 3 | [step-03-compose.md](step-03-compose.md) |
| 4 | [step-04-arrange.md](step-04-arrange.md) |
| Merge kho | [merge-policy.md](merge-policy.md) |

## STATUS.md compose (mẫu)

```markdown
# Compose STATUS
- run_id: YYYY-MM-DD-slug
- song_request: "..."
- reference_style_id: STYLE....
- step1: pending|done|skipped
- step2: pending|done|skipped
- step3: pending|done|skipped
- step3_gate: pending|PASS|FAIL
- step4: pending|done|skipped
- step4_gate: pending|PASS|FAIL
- production_readiness: pending|PASS|FAIL
- notes: ...
```

Không đánh dấu step3/step4 hoặc production readiness PASS nếu gate tương ứng FAIL.

## Product V1 streaming/runtime contract

Khi Product chạy auto mode, ưu tiên một server orchestration request có progress stream (NDJSON/SSE tương đương) thay vì nhiều click/request rời rạc. Stream chỉ phát milestone, quality state và artifact hoàn chỉnh; không công bố partial MusicXML như kết quả hợp lệ. Nếu môi trường không hỗ trợ stream, có thể fallback tương thích nhưng UI phải nói rõ.

Mọi entry point phối khí (Auto, Manual, Project Resume) phải dùng cùng production arrangement contract; không được có đường tắt lưu raw arrangement trực tiếp.
