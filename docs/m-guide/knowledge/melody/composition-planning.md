---
id: KNOW.MELODY.COMPOSITION-PLANNING
type: knowledge
status: active
version: "1.1"
tags: [compose, melody, lyrics]
serves-steps: [3]
sources:
  - "https://songwritingauthority.com/melody-writing-techniques/"
  - "docs/m-guide/knowledge/lyrics/lyric-melody-fit.md"
  - "docs/m-guide/knowledge/melody/melody-invention.md"
last-updated: "2026-09-08"
---

# Checklist nội bộ trước khi khóa lead sheet

> **AI:** Đây là **thứ tự suy nghĩ trong cùng Bước 3**, không phải file riêng và không dừng để user duyệt plan. Kết quả checklist ghi vào `03-composition-notes.md`. Ưu tiên [melody-invention](melody-invention.md): invent giai điệu, đừng điền mẫu.

## Dùng ở bước nào

- Bước 3 — trước khi khóa MusicXML + notes (cùng một lượt output).

## Constraints

Thứ tự nội bộ:

1. **Hook melody** đáng nhớ (pitch + rhythm) — trước khi lặp Chorus.
2. **Motif Verse / Pre / Bridge** khác nhau đủ để contrast.
3. **Prosody** — từ khóa → beat mạnh; ngân; thở ([lyric-melody-fit](../lyrics/lyric-melody-fit.md)).
4. **Rhythm skeleton từng câu** — không một grid cho cả section.
5. **Pitch** — contour cảm xúc + VN tone **transitions**.
6. **Phát triển** — Verse2 biến thể; Bridge contrast; Final ≥1 kỹ thuật thật.
7. Xuất XML + notes + tự chấm quality gate.

Ghi trong notes (không file `03a-…`): `motifs_declared`, `hook_melody_cell`, `section_contrast_map`, `prosody_audit`, `music_quality_gate`.

## Hints

- Chat web / một prompt Bước 3: làm hết checklist rồi xuất luôn hai artifact (XML + notes).
- “Chorus = lặp” chỉ đúng sau khi hook đã memorable.
- Register+ ≠ development.

## Cách áp dụng

1. Chạy checklist trong đầu (hoặc nháp tạm).
2. Invent theo melody-invention.
3. Xuất `03-song.musicxml` + `03-composition-notes.md`.
4. FAIL gate → viết lại cả bài từ motif mới.

## Related

- `PIPE.STEP-03`
- `KNOW.MELODY.INVENTION`
- `KNOW.MELODY.MOTIF-DEVELOPMENT`
- `KNOW.MELODY.ANTI-PATTERNS`
- `KNOW.LYRICS.LYRIC-MELODY-FIT`
