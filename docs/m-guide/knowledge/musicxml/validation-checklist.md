---
id: KNOW.MUSICXML.VALIDATION-CHECKLIST
type: knowledge
status: active
version: "1.2"
tags: [compose, arrange, musicxml]
serves-steps: [3, 4]
sources:
  - "docs/m-guide/knowledge/musicxml/rules.md"
  - "docs/m-guide/knowledge/musicxml/anti-patterns.md"
  - "docs/m-guide/knowledge/musicxml/importer-profile.md"
last-updated: "2026-09-08"
---

# MusicXML — checklist trước khi trả file

> **AI:** Cuối Bước 3 / 4. Không thay validator; không thay musical quality gate.

**Ba lớp:** `XML well-formed` ≠ `MusicXML/profile PASS` ≠ `Flat import OK` ≠ `musical quality PASS`.

## Constraints

- Đạt [rules](rules.md) + [anti-patterns](anti-patterns.md) (#1–13).
- Bước 3: thêm `music_quality_gate: PASS` (hoặc user override).

## Hints

### Structural

- Well-formed; pretty-print.
- DOCTYPE / version 4.0 partwise.
- part-list ↔ parts; measure 1→N.
- Duration totals đúng; midi-program 1–128.
- Mỗi midi-instrument có score-instrument cùng id.
- Không `direction-type` hỗn hợp words+dynamics.

### Importer (Flat)

- Đọc [importer-profile](importer-profile.md).
- Bước 4: nếu nhiều part trống — đơn giản hóa trước khi handoff.
- Thử Bước 3 lead sheet nếu arranged fail.

### Musical / handoff

- Quality gate (Bước 3); notes có tradeoff.
- Không placeholder thay dữ liệu bắt buộc.

## Cách áp dụng

1. Well-formed.
2. Profile constraints + safe-patterns.
3. Importer-profile nếu target Flat.
4. Musical quality gate (B3).
5. Xuất.

## Related

- `KNOW.MUSICXML.CANONICAL`
- `KNOW.MUSICXML.RULES`
- `KNOW.MUSICXML.ANTI-PATTERNS`
- `KNOW.MUSICXML.SAFE-PATTERNS`
- `KNOW.MUSICXML.IMPORTER-PROFILE`
- `KNOW.MELODY.QUALITY-GATE`
