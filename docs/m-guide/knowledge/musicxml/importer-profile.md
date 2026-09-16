---
id: KNOW.MUSICXML.IMPORTER-PROFILE
type: knowledge
status: active
version: "1.1"
tags: [compose, arrange, musicxml]
serves-steps: [3, 4]
sources:
  - "https://www.w3.org/2021/06/musicxml40/"
  - "runs/compose/2026-09-08-vi-yeu-la-vui-v2/04-arranged.musicxml"
  - "runs/upgrade/2026-09-08-compose-quality/fixtures/flat-import-reject.md"
last-updated: "2026-09-08"
---

# MusicXML — profile importer (Flat và tương tự)

> **AI:** Well-formed XML ≠ Flat import OK. Trước khi trả `04-arranged.musicxml` (và khuyến nghị cả Bước 3), **bắt buộc** self-check dưới đây và ghi vào arrangement notes. Thiếu check = chưa xong Bước 4.

## Dùng ở bước nào

- Cuối Bước 3 / **bắt buộc cuối Bước 4**.

## Constraints — lỗi đã làm Flat reject trong ProjectMusic00

| # | Cấm | Hệ quả |
|---|-----|--------|
| 1 | `<words>` + `<dynamics>` trong **cùng** `<direction-type>` | Flat: “format is incorrect” |
| 2 | `midi-instrument` không có `score-instrument` cùng `id` | Import / playback lỗi |
| 3 | Drum kit nhiều `score-instrument` + nhiều `<unpitched>` | Flat reject hoặc im lặng fail |
| 4 | Part-list ảo / measure đứt / duration 0 / midi-program 0 | Schema / importer fail |
| 5 | Minify cả score một dòng | Khó debug; tránh |

**Mặc định Bước 4:** không xuất kit trống phức tạp. Ưu tiên voice/piano/bass/guitar/synth/BV; trống = omit hoặc rest placeholder.

## Self-check bắt buộc (điền vào notes)

```text
importer_self_check:
  no_mixed_direction_type: pass|fail
  score_instrument_pairs: pass|fail
  no_complex_unpitched_kit: pass|fail
  part_list_matches_parts: pass|fail
  measures_1_to_N: pass|fail
  pretty_print: pass|fail
  result: PASS|FAIL
```

`result: FAIL` → sửa XML, **không** ghi step4 done.

## Cách tự soát nhanh (trước khi xuất)

1. Tìm mọi `<direction-type>`: bên trong chỉ được **một** trong `words` | `dynamics` | `metronome` | … — nếu thấy cả `words` và `dynamics` → tách.
2. Với mỗi `midi-instrument id="X"`: phải có `score-instrument id="X"`.
3. Đếm `unpitched` + số `score-instrument` trên part trống: nếu >2 sound → đơn giản hóa.
4. Đếm `score-part` vs `<part id=…>`: bằng nhau; measure 1→N.

## Fixture

- `runs/upgrade/2026-09-08-compose-quality/fixtures/flat-import-reject.md`
- Triệu chứng: Flat format incorrect trên arranged file v2.

## Related

- `KNOW.MUSICXML.SAFE-PATTERNS`
- `KNOW.MUSICXML.ANTI-PATTERNS`
- `PIPE.STEP-04`
- `artifacts/arrangement-notes.template.md`
