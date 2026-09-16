---
id: KNOW.MUSICXML.LYRICS-AND-NOTATIONS
type: knowledge
status: active
version: "1.0"
tags: [compose, arrange, musicxml, lyrics, vocal]
serves-steps: [3, 4]
sources: ["docs/m-guide/knowledge/vocal/writing.md", "docs/m-guide/knowledge/musicxml/rules.md", "docs/m-guide/knowledge/musicxml/anti-patterns.md"]
last-updated: "2026-09-07"
---
# MusicXML — lyric alignment và notation semantics

> **AI:** Đọc khi đưa lyric, slur, tie, dynamics hoặc articulation vào XML. Không dùng notation như trang trí nếu nó làm sai semantics.

## Dùng ở bước nào

- Bước 3 — gắn lyric vào vocal melody.
- Bước 4 — giữ nguyên semantic melody và bổ sung expressive notation.

## Constraints

- Lyric phải gắn với note/event đúng vị trí; không để lyric “treo” ngoài sequence nhạc.
- Không dùng `extend` sai semantics để thay cho dữ liệu lyric thông thường.
- Không phá dữ liệu đã khóa khi thêm notation ở Bước 4.

## Hints

- Một âm tiết có thể trải qua nhiều note; cần thể hiện đúng melisma thay vì nhân bản lyric text.
- Lyric punctuation nên hỗ trợ phrasing nhưng không dùng punctuation để che lỗi alignment.
- `tie`/`slur`/`dynamics`/`articulation` nên phản ánh ý định biểu diễn, không chỉ tạo file “đẹp”.

## Cách áp dụng

1. Xác định syllable-to-note mapping.
2. Gắn lyric cơ bản trước.
3. Xử lý melisma/extension sau.
4. Thêm expressive notation.
5. Kiểm tra lại mapping sau mọi chỉnh sửa note duration.

## Related

- `KNOW.VOCAL.WRITING`
- `KNOW.MUSICXML.STRUCTURE-VOICES`
- `KNOW.MUSICXML.ANTI-PATTERNS`
- `KNOW.MUSICXML.LYRICS-ENCODING` — cú pháp `syllabic` / `extend` chi tiết
- `KNOW.MUSICXML.PERFORMANCE-MARKINGS` — dynamics / articulation / phrasing
