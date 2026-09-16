---
id: PIPE.STEP-03
type: pipeline
status: active
version: "1.6"
tags: [pipeline, compose]
serves-steps: [3]
last-updated: "2026-09-16"
---

# Bước 3 — Sáng tác → MusicXML (lead sheet)

**Một bước, chạy tự động đến xong.** Không tách file plan riêng, không dừng giữa chừng để duyệt plan. MusicXML hợp lệ ≠ bài đạt — phải qua quality gate.

## Input bắt buộc

- `02-compose-prompt.md`
- **Yêu cầu bài hát** (input độc lập)
- (Tuỳ) id thẻ phong cách

## Fetch

- Mọi URL trong `DOC_REFS` của compose-prompt
- [../meta/song-request-schema.md](../meta/song-request-schema.md)
- Knowledge melody: melody-invention, composition-planning, anti-patterns, quality-gate, motif / phrase / contour
- Knowledge lyrics/VN: lyric-melody-fit, tone-melody, syllable-priority
- Knowledge harmony: basics, **piano-reduction**
- Knowledge `musicxml`: rules, anti-patterns, safe-patterns, importer-profile, canonical-source
- composition-notes template

## AI làm (một lượt)

1. Parse yêu cầu theo schema; resolve `DELEGATED`; echo đúng `REFERENCE_STYLE` id.
2. **Tự sáng tác** lời + giai điệu + hòa âm — cấm điền lời vào một skeleton pitch/rhythm cố định rồi lặp.
3. Chốt hook đáng nhớ, motif khác nhau theo section, map prosody; rồi viết thẳng lead sheet.
4. Xuất **MusicXML 4.0 partwise** (voice + lyrics + harmony/piano).
   - Piano reduction phải nghe được nhịp hòa âm: sung sections ≥ half-note pulse hoặc broken/comp; cấm whole-note-only toàn bài.
5. Tự chấm `music_quality_gate`, gồm `REQUIRE_PIANO_TEXTURE`. Mọi ngưỡng cứng phải `pass`; `required: weak` không được coi PASS; ≥3 weak melody/prosody → FAIL theo canonical quality gate.
6. FAIL → viết lại lead sheet và piano texture; không patch vài nốt; không “để Bước 4 sửa”.

## Output

```text
runs/compose/<run-id>/03-song.musicxml
runs/compose/<run-id>/03-composition-notes.md
STATUS.md
```

## Runtime orchestration

- **Auto mode:** khi technical validation + Composition Quality Gate PASS, Product runtime được chuyển thẳng sang Bước 4 mà không yêu cầu thêm một click.
- **Manual mode:** có thể dừng để user nghe/duyệt Lead Sheet.
- Auto quality retry có giới hạn; không loop vô hạn. Nếu vẫn FAIL, giữ artifact tốt nhất nhưng trạng thái phải là `QUALITY REVIEW REQUIRED`, không được giả PASS.
- Step 4 chỉ được khởi chạy khi Composition Quality Gate PASS.
- Runtime deterministic gate hiện **không tuyên bố machine-proven** cho speak-test và Vietnamese tone–melody semantic audit đầy đủ nếu chưa có lyric-note/beat evidence; không được dùng công thức dấu thanh máy móc để giả PASS.
