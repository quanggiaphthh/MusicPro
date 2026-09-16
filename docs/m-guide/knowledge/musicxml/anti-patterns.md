---
id: KNOW.MUSICXML.ANTI-PATTERNS
type: knowledge
status: active
version: "1.3"
tags: [compose, arrange, musicxml]
serves-steps: [3, 4]
sources:
  - "https://www.w3.org/2021/06/musicxml40/"
  - "https://forums.steinberg.net/t/issues-with-musicxml-export/895215"
  - "https://musescore.org/en/comment/1138937"
  - "runs/compose/2026-09-08-vi-yeu-la-vui-v2/04-arranged.musicxml"
last-updated: "2026-09-08"
---

# MusicXML — anti-patterns

> **AI:** Kiểm tra trước khi trả file. Vi phạm **constraint** = output không chấp nhận. Spec gốc: [canonical-source](canonical-source.md). Mẫu đúng: [safe-patterns](safe-patterns.md). Importer Flat: [importer-profile](importer-profile.md).

## Constraints (cấm)

| # | Cấm | Thay bằng |
|---|-----|-----------|
| 1 | Khai báo score-part nhưng không có `<part>` đủ | Giảm part-list cho khớp số part viết được |
| 2 | Nhảy measure (1–5 rồi 56); comment thay measure | Viết đủ measure 1→N |
| 3 | Comment “omitted for length” biện minh schema invalid | Rút gọn nội dung, vẫn schema hợp lệ |
| 4 | XSD attrs trên `<score-partwise>` | Chỉ DTD DOCTYPE (profile kho) |
| 5 | `<midi-program>0</midi-program>` | 1–128 |
| 6 | `<duration>0</duration>` | duration > 0; chia lại giữa các note |
| 7 | Ký tự `&` thô trong text / part-name | `&amp;` hoặc chữ “and” |
| 8 | `<kind/>` rỗng khi đã dùng harmony/chord | `<kind>major</kind>` / `minor` / … hợp lệ |
| 9 | ID có space / control character | Chỉ `[A-Za-z0-9_-]` |
| 10 | Lyric `<extend>` sai schema | `type="start"` / `stop` đúng |
| 11 | **`words` + `dynamics` (hoặc hai loại khác) trong cùng `<direction-type>`** | Tách thành nhiều `<direction-type>` anh em — xem safe-patterns |
| 12 | **`midi-instrument` mà không có `score-instrument` cùng `id`** | Luôn khai báo cặp đủ |
| 13 | Drum kit phức tạp (nhiều unpitched / nhiều score-instrument) khi chưa kiểm importer | Bước 4 mặc định bỏ trống phức tạp hoặc 1 kit tối giản |
| 14 | **Nhiều `<pitch>` trong một `<note>`** | Chỉ 1 `<pitch>`/`<note>`. Hợp âm = nốt đầu bình thường, các nốt sau là `<note>` mới chứa `<chord/>` + 1 `<pitch>` |
| 15 | **`<chord/>` ở nốt đầu tiên** của measure/voice/staff | Xóa `<chord/>`. Nó chỉ được dùng cho các nốt theo sau nốt đầu của hợp âm |

Comment **được phép** nếu chỉ chú thích và element XML vẫn đầy đủ.

## Hints (importer-friendly)

| # | Khuyến nghị | Lý do |
|---|-------------|--------|
| H1 | `octave` / display-octave hợp lý (vocal ~1–6) | Tránh importer lỗi |
| H2 | Có `<credit>` / title | Metadata |
| H3 | Escape `& < > " '` | XML well-formed |
| H4 | Pretty-print nhiều dòng | Review + Flat debug |
| H5 | Thử mở lead sheet Bước 3 trước khi blame cả bản arranged | Thu hẹp lỗi part/direction/drums |

## Cách áp dụng

1. Đối chiếu bảng constraint + safe-patterns.
2. Nếu target Flat: đọc importer-profile.
3. Validator ngoài nếu có (`xmllint` / XSD từ W3C).
4. Musical quality gate riêng — không thay checklist này.

## Related

- `KNOW.MUSICXML.RULES`, `KNOW.MUSICXML.CANONICAL`, `KNOW.MUSICXML.SAFE-PATTERNS`, `KNOW.MUSICXML.IMPORTER-PROFILE`
