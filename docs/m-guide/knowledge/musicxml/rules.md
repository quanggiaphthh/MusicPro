---
id: KNOW.MUSICXML.RULES
type: knowledge
status: active
version: "1.1"
tags: [compose, arrange, musicxml]
serves-steps: [3, 4]
sources:
  - "https://www.w3.org/2021/06/musicxml40/"
  - "https://www.musicxml.com/for-developers/"
last-updated: "2026-09-08"
---

# MusicXML 4.0 — quy tắc xuất (profile ProjectMusic00)

> **AI:** Đọc trước khi xuất `.musicxml`. Chuẩn gốc = [W3C MusicXML 4.0](https://www.w3.org/2021/06/musicxml40/) — xem [canonical-source](canonical-source.md). Trang này = **profile thắt** của kho, không thay thế toàn bộ schema.

## Constraints

- Format: MusicXML 4.0 **partwise**.
- Dùng DOCTYPE DTD partwise. **Không** thêm `xmlns:xsi` / `xsi:noNamespaceSchemaLocation` trên `<score-partwise>` (profile kho; XSD vẫn là chuẩn validate bên ngoài nếu có).
- `số score-part trong part-list` = `số element <part>` thực tế.
- Mọi part: measure `number` liên tục từ 1 đến MAX.
- `midi-program`: **1–128** (không 0).
- Mọi `<duration>` > 0. Tổng duration (trừ chord/grace; tính backup/forward) trên voice trong measure = `divisions × beats × (4 / beat-type)`.
- Mỗi `midi-instrument` có `score-instrument` **cùng id**.
- Mỗi `<direction-type>` chỉ chứa **một** loại nội dung (không trộn `words` + `dynamics`).
- Bước 3: tối thiểu voice (+ lyrics) và hòa âm (harmony và/hoặc piano); dùng [safe-patterns](safe-patterns.md).
- Bước 4: thêm part đã hứa; tránh drum kit phức tạp trừ khi đã kiểm importer ([importer-profile](importer-profile.md)).

## Hints

- Thiếu token: **giảm** số part, không placeholder comment thay measure.
- Validate: ưu tiên đối chiếu W3C docs + anti-patterns; `xmllint`/XSD nếu môi trường có.
- Well-formed XML ≠ Flat import OK.

## DOCTYPE gợi ý

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC
  "-//Recordare//DTD MusicXML 4.0 Partwise//EN"
  "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
```

## Related

- `KNOW.MUSICXML.CANONICAL`
- `KNOW.MUSICXML.ANTI-PATTERNS`
- `KNOW.MUSICXML.SAFE-PATTERNS`
- `KNOW.MUSICXML.IMPORTER-PROFILE`
