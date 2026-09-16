---
id: PIPE.MERGE-POLICY
type: pipeline
status: active
version: "1.0"
tags: [pipeline, merge]
serves-steps: [1, 2, 3, 4]
last-updated: "2026-09-07"
---

# Merge policy — đề xuất → kho gốc

> **AI:** Chỉ chạy khi user nói rõ: merge / áp dụng / sửa tài liệu gốc / chấp nhận đề xuất.

## Không bao giờ merge tự động

- Chạy xong curator / improver ≠ được merge.
- MusicXML / prompt sáng tác trong `runs/compose/` **không** merge vào `docs/m-guide/`.

## Quy trình merge

1. Mở `runs/upgrade/<id>/STATUS.md`, `changelog.md`, `MERGE.md`.
2. Với mỗi mục `needs-approval: true` trong changelog: xác nhận user đã chốt (hỏi lại nếu chưa).
3. Copy từng file:
   `runs/upgrade/<id>/proposed/docs/m-guide/...` → `docs/m-guide/...`
4. Nếu có `proposed/docs/m-guide/catalog.yml` → ghi đè / merge cẩn thận vào catalog gốc.
5. Cập nhật `STATUS.md` của run: `status: merged`, ghi ngày.
6. **Giữ** thư mục run (lịch sử). Không xóa.

## MERGE.md tối thiểu (trong run upgrade)

```markdown
# MERGE
- from: runs/upgrade/<id>/proposed/
- to: docs/m-guide/
- files:
  - ...
- needs_approval_items:
  - ...
- instruction: Chỉ thực hiện khi user yêu cầu merge rõ ràng.
```
