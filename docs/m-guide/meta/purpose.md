---
id: META.PURPOSE
type: meta
status: active
version: "1.0"
tags: [meta]
serves-steps: [1, 2, 3, 4]
last-updated: "2026-09-07"
---

# Mục đích kho m-guide

## Đây là gì

Kho Markdown công khai để **bất kỳ AI nào** (hoặc người) có thể:

1. **Sáng tác** bài hát (ưu tiên tiếng Việt) qua **4 bước độc lập**, xuất **MusicXML 4.0**.
2. **Tự cải thiện** kho: curator (bổ sung) + improver (sau lần chạy không đạt), với merge vào gốc **chỉ khi người dùng yêu cầu**.

## Đây không phải

- Bách khoa âm nhạc chung không gắn sáng tác.
- Kế hoạch Song DSL / ontology / compiler (`archive/music-language/` là lịch sử, không dùng).
- Ứng dụng server, RAG, hay pipeline vendor (Suno/Udio…).
- Nơi lưu bài hát hoàn chỉnh của người dùng — bài hát nằm ở `runs/compose/`.

## Hai nơi ghi file

| Nơi | Vai trò |
|-----|---------|
| `docs/m-guide/` | Kho gốc — chuẩn GitHub, AI trên web đọc cái này |
| `runs/` | Kết quả chạy trong editor — theo dõi sáng tác / đề xuất nâng cấp |

## Nguyên tắc thành công

- Một URL (`for-ai.md`) đủ để AI bắt đầu.
- Catalog chọn trang; không nhồi cả kho vào một prompt.
- Constraint ≠ hint. Thẻ phong cách = đặc trưng khái quát, không sao chép tác phẩm.
- Archive không tham gia sáng tác.
