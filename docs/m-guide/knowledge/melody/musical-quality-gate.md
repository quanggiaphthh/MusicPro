---
id: KNOW.MELODY.QUALITY-GATE
type: knowledge
status: active
version: "1.2"
tags: [compose, melody, lyrics, vietnamese, harmony]
serves-steps: [3]
sources:
  - "docs/m-guide/knowledge/melody/anti-patterns.md"
  - "docs/m-guide/knowledge/lyrics/lyric-melody-fit.md"
  - "docs/m-guide/knowledge/melody/melody-invention.md"
  - "docs/m-guide/knowledge/harmony/piano-reduction.md"
last-updated: "2026-09-08"
---

# Music quality gate (cuối Bước 3)

> **AI:** Điền gate trong `03-composition-notes.md` **trong cùng lượt** xuất lead sheet. `structural MusicXML PASS` ≠ `music_quality_gate PASS`.

## Dùng ở bước nào

- Bước 3 — ngay trước khi coi step3 done (không pha file riêng).

## Constraints

Phải ghi `music_quality_gate: PASS` hoặc `FAIL`. **PASS** chỉ khi mọi ngưỡng dưới đạt và không vi phạm [anti-patterns](anti-patterns.md) / [lyric-melody-fit](../lyrics/lyric-melody-fit.md) / [melody-invention](melody-invention.md) / [piano-reduction](../harmony/piano-reduction.md).

### Ngưỡng cứng

| Id | Yêu cầu |
|----|---------|
| `REQUIRE_CHORUS_HOOK` | Có `hook_melody_cell` và xuất hiện rõ ở Chorus |
| `REQUIRE_BRIDGE_CONTRAST` | Bridge khác Verse/Chorus về ≥2 trong: contour, rhythm cell, harmonic color, lyric density |
| `REQUIRE_FINAL_CHORUS_DEVELOPMENT` | Final ≥1 kỹ thuật phát triển (không chỉ register+) |
| `MAX_IDENTICAL_PHRASE_SKELETONS` | Không quá 2 câu liên tiếp cùng pitch+rhythm cell trong Verse (trừ A/A' ghi chú) |
| `MIN_SECTION_CONTRAST` | Verse vs Chorus khác register và/hoặc rhythm và/hoặc cadence |
| `REQUIRE_SPEAK_TEST` | Có `prosody_audit` (hook + ≥1 câu verse) |
| `REQUIRE_STYLE_ECHO` | `style_card_id` khớp compose-prompt |
| `REQUIRE_INVENTED_MELODY` | Không dùng skeleton từ ví dụ docs / một grid gắn mọi lời |
| `REQUIRE_PIANO_TEXTURE` | Có khối `piano_texture`; `sung_sections_ok: true`; Piano (hoặc lớp pitched hòa âm chính) **không** whole-note-only trên sung sections — xem [piano-reduction](../harmony/piano-reduction.md) |

### Bảng điểm

Mỗi mục: `ok` | `weak` | `fail` + evidence ngắn.

- `melodic_repetition` / `phrase_similarity` / `section_contrast` / `rhythmic_variety`
- `hook_distinctiveness` / `register_development` / `cadential_variety` / `harmonic_motion`
- `piano_accompaniment` — pulse/broken/comp nghe được ở sung sections (`fail` nếu pad whole-note hoặc thiếu part pitched hòa âm)
- `lyric_melody_fit` / `vietnamese_tone_melody` / `style_consistency`

Mọi `fail` → gate **FAIL**. ≥3 `weak` trên melody/prosody → FAIL trừ user chấp nhận tradeoff.

**Thiếu `piano_texture` hoặc `REQUIRE_PIANO_TEXTURE: fail` → gate FAIL** — không được PASS rồi “để Bước 4 sửa”.

## Hints

- Nghe đều đều trên Flat → ghi fail; không biện minh “đủ section”.
- Nghe chỉ voice + hợp âm pad kéo dài → `piano_accompaniment: fail`.
- FAIL → invent lại motif/hook **và** sửa piano texture; xuất lại XML+notes; không patch nốt lẻ.

## Cách áp dụng

1. Checklist MusicXML structural.
2. Điền `piano_texture` (bắt buộc) rồi bảng điểm + ngưỡng — gồm `REQUIRE_PIANO_TEXTURE`.
3. PASS/FAIL trong notes; STATUS step3 chỉ khi PASS (hoặc override).

## Related

- `KNOW.MELODY.INVENTION`
- `KNOW.MELODY.ANTI-PATTERNS`
- `KNOW.LYRICS.LYRIC-MELODY-FIT`
- `KNOW.HARMONY.PIANO-REDUCTION`
- `KNOW.MUSICXML.VALIDATION-CHECKLIST`
- `PIPE.STEP-03`
