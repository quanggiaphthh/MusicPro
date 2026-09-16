# Template — COMPOSITION_NOTES

Lưu: `runs/compose/<run-id>/03-composition-notes.md` (hoặc arrangement notes).

**Bắt buộc (Bước 3):** có khối `lyrics_by_section` — bản lời đọc được theo section, **khớp** lời gắn nốt trong MusicXML. Mục đích: người duyệt xem/sửa lời mà không cần mở score. Section instrumental → `lines: []`.

**Bắt buộc thêm:** `motifs_declared`, `hook_melody_cell`, `prosody_audit`, `music_quality_gate`.

---

```text
COMPOSITION_NOTES
──────────────────────────────────────────────
central_poetic_image:
  chosen_image: ""
  development_across_song: ""

literary_devices_used:
  - device: ""
    location: ""
    purpose: ""

reference_style_handling:
  - style_card_id: ""   # PHẢI khớp id trong 02-compose-prompt
    how_applied: "đặc trưng khái quát only"
    no_copy_affirmation: true

resolved_delegated_fields:
  - field: ""
    decision: ""
    rationale: ""
    alternatives_considered: []

motifs_declared:
  - id: ""
    pitches: ""
    rhythm: ""

hook_melody_cell:
  pitches: ""
  rhythm: ""
  lyric_hook: ""

section_contrast_map:
  - section: ""
    contrast_notes: ""

tone_melody_tradeoffs:   # nếu tiếng Việt — theo transitions, không ±1 máy móc
  - ""

prosody_audit:           # BẮT BUỘC — hook + ≥1 câu verse
  - line: ""
    syllables: []        # {syl, tone, beat, duration, keyword?}
    speak_test: pass|fail
    notes: ""

music_quality_gate:
  result: PASS|FAIL
  scores:
    melodic_repetition: ok|weak|fail
    phrase_similarity: ok|weak|fail
    section_contrast: ok|weak|fail
    rhythmic_variety: ok|weak|fail
    hook_distinctiveness: ok|weak|fail
    register_development: ok|weak|fail
    cadential_variety: ok|weak|fail
    harmonic_motion: ok|weak|fail
    piano_accompaniment: ok|weak|fail   # fail nếu pad whole-note / thiếu pitched harmony pulse
    lyric_melody_fit: ok|weak|fail
    vietnamese_tone_melody: ok|weak|fail
    style_consistency: ok|weak|fail
  thresholds:
    REQUIRE_CHORUS_HOOK: pass|fail
    REQUIRE_BRIDGE_CONTRAST: pass|fail
    REQUIRE_FINAL_CHORUS_DEVELOPMENT: pass|fail
    REQUIRE_SPEAK_TEST: pass|fail
    REQUIRE_STYLE_ECHO: pass|fail
    REQUIRE_PIANO_TEXTURE: pass|fail    # thiếu piano_texture hoặc sung_sections_ok false → fail
  evidence: ""
  if_fail: "rewrite whole lead sheet with new motifs AND fix piano texture — do not patch isolated notes; do not defer pad fix to step 4"

piano_texture:            # BẮT BUỘC — KNOW.HARMONY.PIANO-REDUCTION (thiếu = gate FAIL)
  pattern: ""             # half-pulse | quarter-pulse | broken | alberti | comp | arpeggio | pad-limited
  sung_sections_ok: true  # false nếu chỉ whole-note ở phần có lời → FAIL / phải sửa
  pad_only_sections: []   # ví dụ: [INTRO, OUTRO] — ghi rõ nếu dùng whole-note pad
  notes: ""

deviations_or_tradeoffs:
  - ""

musicxml_parts:
  - id: P1
    name: Voice
  - id: P2
    name: Piano

structure:               # khuyến nghị
  tempo_bpm:
  meter: ""
  key: ""
  form:
    - SECTION_NAME: measures a–b
  lyric_policy:
    syllable_to_note: "1 Vietnamese syllable → 1 note"  # nếu VN
    syllabic: "single"
    melisma: false

lyrics_by_section:       # BẮT BUỘC — mirror lời trong MusicXML
  - section: INTRO
    measures: "1-4"
    lines: []            # instrumental / không lời
  - section: VERSE_1
    measures: "5-..."
    lines:
      - ""               # mỗi dòng ≈ một câu hát / một cụm measure có lời
  - section: CHORUS
    measures: "..."
    lines:
      - ""
```
