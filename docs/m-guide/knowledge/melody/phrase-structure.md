---
id: KNOW.MELODY.PHRASE-STRUCTURE
type: knowledge
status: active
version: "1.1"
tags: [compose, melody]
serves-steps: [3]
sources: ["docs/m-guide/knowledge/melody/contour.md", "docs/m-guide/knowledge/rhythm-form/form-and-tempo.md"]
last-updated: "2026-09-08"
---
# Giai điệu — phrase, cadence và điểm nhấn

> **AI:** Đọc ở Bước 3 khi contour đã có nhưng cần biến thành câu nhạc có điểm đi, điểm dừng và cao trào.

## Dùng ở bước nào

- Bước 3 — tổ chức motif thành phrase và liên kết phrase với section.

## Constraints

- Không vượt `VOCAL.range` / `tessitura` đã DEFINED hoặc locked.
- Khi `MELODY.character` hoặc contour đã USER_EXPLICIT, không tự thay đổi mục tiêu đó để phục vụ cadence.
- Các phrase trong cùng section **không** được chia sẻ cùng skeleton pitch+rhythm trừ biến thể A/A' có chủ đích và ghi trong plan/notes (xem [anti-patterns](anti-patterns.md)).

## Hints

- Một phrase nên có mục tiêu rõ: mở, phát triển, trì hoãn hoặc kết.
- Cadence mạnh phù hợp điểm kết; cadence mở giúp nối sang phrase kế tiếp.
- Chorus thường cần một hoặc vài điểm cao hơn verse, nhưng không bắt buộc phải có nốt cao nhất ở mọi câu.
- Lặp motif với thay đổi rhythm hoặc ending thường hiệu quả hơn thay motif hoàn toàn.

## Cách áp dụng

1. Chia section thành phrase.
2. Gán role cho từng phrase: setup → lift → release.
3. Đặt điểm nhấn vào từ khóa quan trọng (lyric–melody fit).
4. Kiểm tra phrase length, breath và cadence.
5. Sau cùng mới tối ưu ornaments.

## Ví dụ ngắn (tự viết)

`A: mở → B: nâng → A': lặp có biến đổi → C: giải quyết`.

## Related

- `KNOW.MELODY.CONTOUR`
- `KNOW.MELODY.ANTI-PATTERNS`
- `KNOW.LYRICS.PROSODY-RHYME`
- `KNOW.LYRICS.LYRIC-MELODY-FIT`
- `KNOW.VOCAL.PHRASING-BREATH-MELISMA`
