---
id: KNOW.MUSICXML.STRUCTURE-VOICES
type: knowledge
status: active
version: "1.0"
tags: [compose, arrange, musicxml]
serves-steps: [3, 4]
sources: ["docs/m-guide/knowledge/musicxml/rules.md", "docs/m-guide/knowledge/musicxml/anti-patterns.md"]
last-updated: "2026-09-07"
---
# MusicXML — structure, voices và continuity

> **AI:** Đọc khi viết hoặc sửa MusicXML có nhiều voice/part. Ưu tiên structural validity trước layout.

## Dùng ở bước nào

- Bước 3 — vocal voice + harmony/piano.
- Bước 4 — nhiều part, nhiều voice và accompaniment.

## Constraints

- Giữ các constraint structural đã active trong `KNOW.MUSICXML.RULES` và `ANTI-PATTERNS`.
- Nếu dùng nhiều voice trong cùng measure, tổng thời gian phải khớp measure và không tạo event duration 0.

## Hints

- Dùng `backup` / `forward` để điều phối thời gian giữa voices khi cần; không dùng comment để bỏ qua dữ liệu music cần thiết.
- `tie` mô tả liên kết cùng cao độ qua thời gian; `slur` mô tả phrasing, không thay thế cho nhau.
- Giữ thứ tự và numbering của measure nhất quán giữa các part.
- Khi dữ liệu phức tạp, viết một voice đúng trước rồi mới thêm voice phụ.

## Cách áp dụng

1. Chọn divisions và meter.
2. Viết voice chính.
3. Kiểm tra duration theo measure.
4. Thêm voice phụ bằng `backup`/`forward` khi cần.
5. Chạy validation trước khi thêm ornament/layout.

## Related

- `KNOW.MUSICXML.RULES`
- `KNOW.MUSICXML.ANTI-PATTERNS`
- `KNOW.MUSICXML.VALIDATION-CHECKLIST`
