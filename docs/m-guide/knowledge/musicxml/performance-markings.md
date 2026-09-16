---
id: KNOW.MUSICXML.PERFORMANCE-MARKINGS
type: knowledge
status: active
version: "1.0"
tags: [compose, arrange, musicxml]
serves-steps: [3, 4]
sources: []
last-updated: "2026-09-07"
---

# MusicXML — dynamics, articulation, phrasing (nhóm PERFORMANCE)

> **AI:** Đọc ở Bước 3/4 khi `PERFORMANCE.dynamics / articulation / expression /
> phrasing` trong schema đã DEFINED hoặc khi bài cần rõ sắc thái diễn tấu
> (climax, đoạn tha thiết, đoạn dồn dập...). Trang `KNOW.MUSICXML.RULES` nói
> về cấu trúc file hợp lệ; trang này nói riêng về cách **mã hóa sắc thái**
> — không lặp lại quy tắc measure/part ở đó.

## Dùng ở bước nào

- Bước 3 — đánh dấu dynamics/phrasing cơ bản cho lead sheet nếu
  `PERFORMANCE` đã DEFINED hoặc cảm xúc bài cần thể hiện rõ.
- Bước 4 — mở rộng dynamics/articulation theo từng part khi phối khí
  (ví dụ dây kéo dài legato, bộ gõ accent).

## Constraints

- `<dynamics>` (trong `<direction><direction-type>`) chỉ dùng các phần tử
  chuẩn MusicXML (`<p/>`, `<pp/>`, `<ppp/>`, `<f/>`, `<ff/>`, `<fff/>`,
  `<mf/>`, `<mp/>`, `<sf/>`, `<sfz/>`, …) — **không** nhét chữ tùy ý vào
  trong `<dynamics>` (dùng `<words>` nếu cần ghi chú tự do như "dần nhỏ").
- `<notations><articulations>` chỉ dùng phần tử enum hợp lệ của schema
  (`<staccato/>`, `<accent/>`, `<tenuto/>`, `<staccatissimo/>`,
  `<strong-accent/>`, …) — không tạo tên phần tử tùy ý.
- `<wedge type="crescendo|diminuendo|stop">` phải có `stop` khép lại mỗi
  `crescendo`/`diminuendo` đã mở, không để hairpin "treo" không đóng.
- Không dùng `<dynamics>` để thay cho `<sound dynamics="...">` (âm lượng
  MIDI) — hai mục đích khác nhau, có thể dùng cùng lúc nếu cần.

## Hints

### Dynamics theo cường độ cảm xúc (gợi ý, không phải luật)

| Cảm xúc / vị trí | Dynamics gợi ý |
|---|---|
| Verse thân mật, mở đầu | `mp`–`mf` |
| Pre-chorus, dồn lên | crescendo (`wedge`) → `mf`–`f` |
| Chorus / cao trào | `f`–`ff` |
| Bridge trầm lắng, tương phản | tụt xuống `p`–`mp` trước khi dồn lại |
| Outro tan dần | diminuendo → `pp` |

### Articulation theo thể loại

- Hành khúc / khí thế: `accent`, `staccato` nhẹ ở tiết tấu gõ để tạo dứt
  khoát.
- Ballad: hạn chế articulation rời rạc, ưu tiên legato (slur) để giữ mạch
  câu hát.
- Dance/upbeat: `staccato` ở bè đệm để giữ groove gọn.

### Phrasing

- `<slur type="start"/"stop">` nên bao trọn một câu hát / một motif nhạc
  cụ, không cắt giữa từ có nghĩa liền mạch.
- Với lời tiếng Việt đơn âm tiết: slur chủ yếu dùng cho nhạc cụ hoặc
  melisma có chủ đích, không lạm dụng trên vocal vì mỗi âm tiết thường
  độc lập về nghĩa.

## Cách áp dụng khi sáng tác / phối khí

1. Đọc `PERFORMANCE` trong schema; nếu `UNSPECIFIED`, chọn theo
   `EMOTION.intensity` / `emotional_arc` của bài.
2. Đánh dấu dynamics chính ở đầu mỗi section (không cần mọi nốt).
3. Thêm hairpin (`wedge`) ở các đoạn chuyển cường độ rõ (trước chorus,
   trước outro).
4. Bước 4: bổ sung articulation riêng theo nhạc cụ (dây, bộ gõ, piano)
   thay vì copy nguyên dynamics của vocal cho mọi part.
5. Ghi lựa chọn dynamics/phrasing chính vào `COMPOSITION_NOTES` /
   arrangement notes nếu có tradeoff.

## Ví dụ ngắn (tự viết, không trích tác phẩm có bản quyền)

```xml
<direction placement="below">
  <direction-type>
    <wedge type="crescendo"/>
  </direction-type>
</direction>
<!-- ... các note của đoạn dồn lên ... -->
<direction placement="below">
  <direction-type>
    <wedge type="stop"/>
  </direction-type>
  <direction-type>
    <dynamics><f/></dynamics>
  </direction-type>
</direction>
```

## Conflicts / related

- `related:` `KNOW.MUSICXML.RULES`, `KNOW.MUSICXML.ANTI-PATTERNS`,
  `KNOW.MUSICXML.LYRICS-AND-NOTATIONS`, `KNOW.ARR.ORCHESTRATION`,
  `KNOW.ARR.SECTION-ENERGY`
- `conflicts-with:` không có.
