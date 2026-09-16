---
id: PIPE.STEP-04
type: pipeline
status: active
version: "1.7"
tags: [pipeline, arrange]
serves-steps: [4]
last-updated: "2026-09-16"
---

# Bước 4 — Phối khí → Final MusicXML

**Một bước, chạy tự động đến xong.** Phối khí làm rõ tương phản lead sheet. Final MusicXML là MASTER COMPOSITION; downstream audio không phải Step 5.

## Input bắt buộc

- Lead Sheet MusicXML đã qua Composition Quality Gate
- arrange-prompt
- song request / style context

## Fetch bắt buộc

- `DOC_REFS` arrange-prompt
- Arrangement: section-energy, dynamics-and-structure, genre-textures
- Harmony texture: piano-reduction
- MusicXML: safe-patterns, importer-profile, anti-patterns, rules

## AI làm

1. **LOCK:** lyric, lead melody, chord symbols/harmonic intent, key, meter, initial tempo — trừ khi user giao quyền.
2. **ALLOW:** viết lại piano texture / voicing / rhythm / dynamics; thêm/bớt part khác; tạo contrast section.
3. Nếu input piano pad-only / whole-note-dominant ở sung sections: bắt buộc rewrite hoặc thêm pitched groove layer.
4. Thêm part có vai trò rõ, register hợp lý, không che lead vocal.
5. Importer V1: >2 distinct `unpitched` instrument IDs là blocker bắt buộc; không được READY nếu chưa được profile importer hỗ trợ.
6. Chạy technical/identity validation và Arrangement Quality Gate trước khi coi hoàn tất.
7. FAIL gate → phối lại toàn bộ có feedback, retry có giới hạn; không loop vô hạn.

## Production quality contract

Bản phối chỉ đủ điều kiện `READY FOR PRODUCTION` khi:

- MusicXML hoàn chỉnh và importer-safe;
- **thứ tự lời**, giai điệu, harmonic progression, section sequence, key/meter/BPM được bảo toàn;
- instrumentation đủ chiều sâu theo style và mọi part chính phủ đủ vòng đời score (không chỉ 1–2 ô nhịp đầu);
- section energy/density có tương phản;
- accompaniment texture không pad-only; score-part/part IDs và score-instrument/midi-instrument pairing importer-safe;
- Composition Quality Gate và Arrangement Quality Gate đều PASS; mọi ngưỡng `required` phải ở trạng thái `pass`.

## Output

```text
runs/compose/<run-id>/04-arranged.musicxml
runs/compose/<run-id>/04-arrangement-notes.md
production-readiness report
```

Auto mode kết thúc tại Final MusicXML + production handoff. Production Blueprint / Gemini Music Brief / Lyria/audio là downstream tùy chọn, không phải bước sáng tác thứ năm.

## Master identity lock ở Product runtime

Ngoài prompt LOCK, Product runtime phải thực thi deterministic lock cho selected lead-melody identity: trước Arrangement Quality Gate, cả `<part>` lead melody/lyrics **và** `<score-part>` metadata tương ứng được phục hồi nguyên vẹn từ Lead Sheet đã chấp nhận. Đây là hàng rào kỹ thuật chống model vô tình đổi melody/lyrics hoặc metadata lead. Các accompaniment parts vẫn được phép thay đổi; harmony phải khớp exact theo measure/chord signature, còn section/key/meter/BPM được kiểm độc lập bằng quality gate.

Production snapshot chỉ được `CERTIFIED` khi readiness PASS **và** `certifiedRevisionId === activeRevisionId === evaluatedRevisionId`. Khi score thay đổi, giữ quality evidence để audit nhưng thu hồi certification; export/UI phải hiển thị STALE thay vì tái sử dụng PASS cũ.
