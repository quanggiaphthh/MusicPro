---
id: KNOW.MUSICXML.LYRICS-ENCODING
type: knowledge
status: active
version: "1.0"
tags: [compose, musicxml, lyrics]
serves-steps: [3]
sources: []
last-updated: "2026-09-07"
---

# MusicXML — gắn lời vào nốt (`<lyric>`)

> **AI:** Đọc ở Bước 3 ngay khi bắt đầu gắn lyric vào lead sheet, đặc biệt
> nếu bài có melisma (một âm tiết trải nhiều nốt) hoặc từ nhiều âm tiết
> (ít gặp ở tiếng Việt nhưng có thể gặp ở từ vay mượn / hát tiếng khác).
> `KNOW.VOCAL.WRITING` nói "lyric phải khớp âm tiết" ở mức khái niệm;
> trang này nói **cú pháp XML cụ thể** để làm điều đó đúng schema.

## Dùng ở bước nào

- Bước 3 — gắn lời vào từng `<note>` khi xuất lead sheet MusicXML.

## Constraints

- `syllabic` chỉ nhận 4 giá trị: `single` (từ đơn âm, trọn trong 1 nốt),
  `begin` (âm tiết đầu của từ nhiều âm tiết), `middle`, `end`. Không dùng
  giá trị tự đặt khác.
- Với tiếng Việt: **hầu hết âm tiết = 1 từ** → dùng `single` cho phần lớn
  trường hợp trừ khi user chủ động ghép từ láy / từ ghép thể hiện liền
  mạch qua nhiều nốt.
- `<extend type="start|stop|continue">` chỉ dùng khi một âm tiết **ngân
  dài qua nhiều nốt** (melisma): nốt đầu tiên của âm tiết mang `<text>`,
  các nốt tiếp theo cùng âm tiết đó dùng `<extend>` mà **không** lặp lại
  `<text>`. Không để `<extend type="start">` mà không có `stop` khép lại
  trước khi âm tiết tiếp theo bắt đầu.
- Nốt không mang lời mới (nốt đệm/láy melisma tiếp theo) **không** được
  gắn `<lyric>` trống hoặc `<text></text>` rỗng — dùng `<extend>` như trên,
  không tạo `<lyric>` giả.
- Nếu nhiều dòng lời cùng lúc (ví dụ 2 bè hát lời khác nhau), phân biệt
  bằng thuộc tính `number` trên `<lyric number="1">`, `<lyric number="2">`.

## Hints

- `<elision>‿</elision>` giữa hai `<syllabic>`/`<text>` dùng khi hai âm
  tiết hát dồn vào cùng một nốt (ít gặp với lời tiếng Việt monosyllabic,
  hay gặp hơn nếu bài có đoạn chêm tiếng Anh/Pháp).
- Melisma nên tiết chế ở lời tiếng Việt vì thanh điệu dễ bị "loãng" khi
  kéo dài một âm tiết qua nhiều cao độ khác thanh — xem thêm
  `KNOW.VI.TONE-MELODY` trước khi quyết định kéo dài âm tiết nào.
- Với hook / từ khóa: ưu tiên `single` rõ ràng, dễ nghe rõ từ, hạn chế
  melisma để không làm mờ nghĩa.

## Cách áp dụng khi sáng tác

1. Viết giai điệu trước (hoặc song song) theo `KNOW.MELODY.CONTOUR`.
2. Với mỗi âm tiết lời: nếu chỉ chiếm 1 nốt → `syllabic=single`.
3. Nếu một âm tiết cố ý ngân qua ≥2 nốt (melisma có chủ đích, ví dụ ở
   note cuối câu chorus) → nốt đầu `text` + `syllabic` phù hợp, các nốt
   sau `<extend>`, đóng bằng `type="stop"` ở nốt melisma cuối hoặc trước
   khi âm tiết mới bắt đầu.
4. Kiểm tra không còn `<extend type="start">` nào chưa có `stop` trước
   khi xuất file.

## Ví dụ ngắn (tự viết, không trích tác phẩm có bản quyền)

Âm tiết "yêu" đơn âm, trọn 1 nốt:

```xml
<lyric number="1">
  <syllabic>single</syllabic>
  <text>yêu</text>
</lyric>
```

Âm tiết "thương" ngân qua 2 nốt (melisma có chủ đích ở cuối câu):

```xml
<!-- nốt 1 của "thương" -->
<lyric number="1">
  <syllabic>single</syllabic>
  <text>thương</text>
  <extend type="start"/>
</lyric>
<!-- nốt 2, vẫn "thương" ngân tiếp, không lặp lại text -->
<lyric number="1">
  <extend type="stop"/>
</lyric>
```

## Conflicts / related

- `related:` `KNOW.VOCAL.WRITING`, `KNOW.VI.TONE-MELODY`,
  `KNOW.MUSICXML.RULES`, `KNOW.MUSICXML.ANTI-PATTERNS`,
  `KNOW.MUSICXML.LYRICS-AND-NOTATIONS`
- `conflicts-with:` không có — làm rõ thêm mục extend trong
  `KNOW.MUSICXML.ANTI-PATTERNS` / `LYRICS-AND-NOTATIONS`, không thay thế.
