---
id: KNOW.LYRICS.PROSODY-RHYME
type: knowledge
status: active
version: "1.1"
tags: [compose, lyrics]
serves-steps: [3]
sources:
  - "docs/m-guide/knowledge/lyrics/craft.md"
  - "docs/m-guide/meta/song-request-schema.md"
  - "docs/m-guide/knowledge/lyrics/lyric-melody-fit.md"
last-updated: "2026-09-08"
---

# Lời — prosody, rhyme và trọng âm

> **AI:** Đọc ở Bước 3 khi viết lời đã có melody/form. **Rhyme ≠ khớp lời–nhạc (text-setting).** Khớp stress↔beat, duration, breath, tone transitions: xem [lyric-melody-fit](lyric-melody-fit.md). Không dùng quy tắc này để ép mọi bài có vần hoặc cùng số chữ.

## Dùng ở bước nào

- Bước 3 — biến ý tưởng thành câu hát có nhịp ngôn ngữ, điểm nhấn và liên kết giữa các câu.

## Constraints

- Tôn trọng `LYRIC.forbidden_elements`, `syllable_target` và yêu cầu user đã locked.
- Không hy sinh nghĩa câu hoặc từ khóa đã yêu cầu chỉ để lấy vần.
- Từ khóa / trọng âm ngữ nghĩa phải được đặt với ý thức về beat mạnh (chi tiết bắt buộc ở lyric-melody-fit); không chỉ “có vần là xong”.

## Hints

- Ưu tiên từ mang thông tin chính ở vị trí nhấn mạnh của phrase.
- Phân biệt `end_rhyme`, `internal_rhyme` và `assonance`; không cần dùng cả ba.
- Với chorus, một mẫu vần ổn định giúp ghi nhớ; verse có thể linh hoạt hơn.
- Đặt từ khó phát âm hoặc phụ âm dày vào nốt ngắn hơn khi có lựa chọn tương đương.
- Đọc lời theo nhịp nói **và** theo nhịp melody (speak-test) trước khi khóa — xem lyric-melody-fit.

## Cách áp dụng khi sáng tác

1. Chốt nghĩa và từ khóa trước khi chốt vần.
2. Đánh dấu trọng tâm ngữ nghĩa từng câu → map beat (lyric-melody-fit).
3. Chọn mẫu vần phù hợp section.
4. Speak-test trước khi đặt toàn bộ nốt.
5. Kiểm tra lại singability sau khi melody hoàn tất.

## Ví dụ ngắn (tự viết)

- AABB: hai cặp câu cùng vần để tạo cảm giác ổn định.
- ABAB: tạo chuyển động dài hơn giữa các câu.

## Related

- `KNOW.LYRICS.LYRIC-MELODY-FIT`
- `KNOW.LYRICS.CRAFT`
- `KNOW.VI.RHYME-METER` — vần/thể thơ tiếng Việt chi tiết hơn
- `KNOW.MELODY.PHRASE-STRUCTURE`
- `KNOW.VI.SYLLABLE-PRIORITY`
