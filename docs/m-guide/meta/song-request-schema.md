---
id: META.SONG-REQUEST-SCHEMA
type: meta
status: active
version: "1.0"
tags: [meta, schema, compose]
serves-steps: [2, 3, 4]
last-updated: "2026-09-07"
---

# Schema yêu cầu bài hát (hợp đồng dữ liệu dùng chung)

Dùng ở Bước 2 (nhúng vào compose/arrange prompt) và Bước 3 (điền / tuân theo yêu cầu user).

Mỗi trường nên có: `value`, `status` (`DEFINED` | `INFERRED` | `DEFAULT` | `UNSPECIFIED` | `DELEGATED` | `REQUIRES_CONFIRMATION`), `source`, `locked` (bool).

## Nhóm

| Nhóm | Trường chính |
|------|----------------|
| **PROJECT** | title, purpose, target_audience, usage_context |
| **LANGUAGE** | primary_language, dialect, pronunciation_requirements |
| **CONCEPT** | main_theme, subject, setting, narrator, characters, central_message, imagery |
| **EMOTION** | primary_emotion, secondary_emotions, intensity, emotional_arc |
| **STORY** | beginning, development, conflict, turning_point, climax, resolution (optional) |
| **GENRE** | primary_genre, subgenre, fusion_genres, stylistic_character, era, regional_style |
| **REFERENCE_STYLE** | style_card_ids[] — id thẻ trong `knowledge/styles/` (nhãn phong cách, không sao chép) |
| **SONG_FORM** | section_order, section_count, section_length, repetition, variation |
| **LYRIC** | topic, style, vocabulary_style, syllable_target, rhyme, hook, keywords, forbidden_elements, point_of_view, singability |
| **MELODY** | character, range, register, contour, motif, memorability, complexity |
| **RHYTHM** | tempo, tempo_range, time_signature, groove, density, syncopation |
| **HARMONY** | style, complexity, chord_language, progression, harmonic_rhythm, modulation |
| **VOCAL** | voice_type, range, tessitura, vocal_character, performance_style, difficulty |
| **ARRANGEMENT** | instrumentation, primary_instruments, supporting_instruments, texture, density, layering (Bước 4 chú trọng) |
| **PERFORMANCE** | dynamics, articulation, expression, phrasing |
| **PRODUCTION** | sonic_character, spatial_character (optional) |
| **CONSTRAINTS** | hard, soft, prohibited, required, duration, range |
| **OUTPUT** | notation_format (mặc định MusicXML 4.0), include_lyrics, include_vocal_melody, include_harmony, include_instruments, include_tempo, include_key, include_time_signature, include_dynamics |

## Ưu tiên khi xung đột

```text
USER_CONFIRMED / locked > USER_EXPLICIT > CONSTRAINTS.hard
> DEFINED > CONSTRAINTS.soft > INFERRED > DEFAULT > DELEGATED
```

## Tiếng Việt

Khi `primary_language = Vietnamese`, ưu tiên ghi nhận preference về thanh điệu ↔ giai điệu (xem knowledge `vietnamese/`). Chi tiết xử lý nốt thuộc Bước 3 + trang knowledge, không thuộc Bước 1.

## Bước nào điền gì

- **Bước 1:** không bắt buộc điền schema (trừ khi user đã đưa yêu cầu bài hát).
- **Bước 2:** compose-prompt yêu cầu AI Bước 3 tuân schema; arrange-prompt nhấn mạnh ARRANGEMENT / OUTPUT.
- **Bước 3:** điền / resolve DELEGATED trong biên CONSTRAINTS; xuất lead sheet.
- **Bước 4:** tôn trọng ARRANGEMENT; không đổi LYRIC/MELODY/HARMONY đã khóa.
