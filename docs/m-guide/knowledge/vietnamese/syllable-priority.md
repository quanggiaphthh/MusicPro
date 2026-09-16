---
id: KNOW.VI.SYLLABLE-PRIORITY
type: knowledge
status: active
version: "1.1"
tags: [compose, vietnamese, lyrics, melody, vocal]
serves-steps: [3]
sources:
  - "docs/m-guide/knowledge/vietnamese/tone-melody.md"
  - "docs/m-guide/knowledge/lyrics/prosody-and-rhyme.md"
  - "docs/m-guide/knowledge/lyrics/lyric-melody-fit.md"
last-updated: "2026-09-08"
---

# Tiếng Việt — ưu tiên khi âm tiết, thanh điệu và melody xung đột

> **AI:** Đọc cùng `tone-melody` và `lyric-melody-fit` khi nhiều mục tiêu không thể đồng thời tối ưu. Đây là framework ra quyết định, không phải thống kê về tần suất.

## Dùng ở bước nào

- Bước 3 — resolve tradeoff giữa nghĩa, thanh điệu, trọng âm, rhyme và motif.

## Constraints

- `USER_CONFIRMED / locked` và nghĩa từ khóa phải được bảo toàn trước khi tối ưu motif.
- Tradeoff cố ý làm lệch thanh điệu ở từ khóa phải được ghi trong `COMPOSITION_NOTES`.

## Hints

Khi có xung đột, ưu tiên tương đối:

`nghĩa từ khóa → khả năng hát rõ → lyric–melody fit / speak-test (stress↔beat) → thanh điệu quan trọng (transitions) → trọng âm câu → rhyme → tối ưu motif phụ`.

- Không áp dụng thứ tự này máy móc cho mọi câu; có thể đổi ưu tiên khi user yêu cầu phong cách đặc biệt.
- Âm tiết chức năng thường linh hoạt hơn từ khóa mang nghĩa chính.
- Khi phải phá một mục tiêu, phá mục tiêu ít ảnh hưởng đến hiểu lời nhất.
- Speak-test fail trên hook → không PASS quality gate dù motif “hay trên giấy”.

## Cách áp dụng

1. Đánh dấu âm tiết khóa nghĩa.
2. Đánh dấu tone transitions và trọng âm ↔ beat.
3. Ghi xung đột với rhythm/rhyme/motif.
4. Chọn phương án ít làm biến dạng nghĩa nhất.
5. Ghi tradeoff + cập nhật `prosody_audit`.

## Related

- `KNOW.VI.TONE-MELODY`
- `KNOW.LYRICS.LYRIC-MELODY-FIT`
- `KNOW.LYRICS.PROSODY-RHYME`
- `KNOW.VOCAL.PHRASING-BREATH-MELISMA`
