---
id: KNOW.LYRICS.LYRIC-MELODY-FIT
type: knowledge
status: active
version: "1.0"
tags: [compose, lyrics, melody, vietnamese]
serves-steps: [3]
sources:
  - "https://en.wikipedia.org/wiki/Lyric_setting"
  - "https://en.wikipedia.org/wiki/Prosody_(music)"
  - "https://songcage.com/blog/fitting-lyrics-to-a-melody/"
  - "https://www.isca-archive.org/tal_2016/kirby16_tal.pdf"
  - "https://songwritingauthority.com/melody-writing-techniques/"
last-updated: "2026-09-08"
needs-approval: true
---

# Khớp lời–nhạc (text-setting / prosody)

> **AI:** Đọc bắt buộc ở Bước 3 khi gắn lời vào giai điệu. **Rhyme ≠ prosody-to-beat ≠ tone-melody.** Ba lớp phải tách khi chấm. Vi phạm có hệ thống → `lyric_melody_fit: fail` → quality gate FAIL.

## Dùng ở bước nào

- Bước 3 — khi gắn lời vào giai điệu; ghi `prosody_audit` trong composition notes (cùng lượt xuất XML).

## Constraints

- **Stress / semantic weight ↔ beat:** Từ khóa và âm tiết mang nghĩa không được thường xuyên nằm beat yếu trong khi từ chức năng chiếm downbeat hoặc nốt dài. Trong 4/4: beat 1 mạnh nhất, beat 3 kế; subdivision on-beat mạnh hơn off-beat.
- **Duration ↔ importance:** Không đặt nốt dài / cao độ cao trên âm tiết phụ trừ tradeoff ghi notes.
- **Phrase breath:** Nghỉ nhạc khớp chỗ ngắt ngữ pháp tự nhiên; không cắt giữa cụm nghĩa.
- **VN tone transitions (Kirby & Ladd):** Chấm hướng chuyển pitch giữa hai âm tiết liên tiếp (similar / oblique / contrary) theo **tonal offset**, không theo `sắc=+1` độc lập từng âm tiết. Ưu tiên similar; hạn chế contrary ở hook/từ khóa. **Cấm** công thức cộng/trừ pitch từng thanh như “đã xong tone”.
- **Syllabic default (VN pop lead sheet):** 1 âm tiết → 1 nốt; melisma chỉ ở từ khóa cảm xúc và vẫn giữ accent đúng âm tiết.
- **Speak-test bắt buộc:** Trước PASS gate, notes phải có `prosody_audit` (hook + ≥1 câu verse): syllable / tone / beat / duration / pass?
- **Macro prosody:** Contour và năng lượng section khớp cảm xúc lời (lời vui không đủ nếu chỉ tăng tempo mà contour vẫn phẳng đều).

## Hints

- Mantra: *preserve the natural shape of the language* (Pattison).
- Draft **rhythmic skeleton** trên bar trước khi khóa pitch.
- Front-heavy phrase (bắt đầu trên/vào downbeat) ổn định; back-heavy (sau downbeat) đẩy chuyển động.
- Thứ tự sửa mismatch: đổi từ → dịch timing phrase → mới đổi melody.
- Word painting nhẹ ở mức contour/cảm xúc; tránh gimmick từng từ.
- Nói lời theo nhịp melody; nếu nghe như đọc máy → FAIL.

## Cách áp dụng

1. Đánh dấu từ khóa + trọng âm ngữ nghĩa từng câu.
2. Map vào beat mạnh / nốt ngân trong `lyric_prosody_map`.
3. Chọn pitch theo contour + tone **transitions**.
4. Speak-test; ghi `prosody_audit`.
5. Sửa theo thứ tự từ → timing → melody nếu lệch.

## Ví dụ ngắn (tự viết)

- Hook “Yêu là vui thế thôi”: đặt “Yêu / vui / thôi” gần beat mạnh hoặc nốt dài hơn “là / thế”.
- Thanh: “vui” (ngang) → “thế” (sắc): ưu tiên pitch không đi xuống mạnh (tránh contrary rõ).

## Related

- `KNOW.LYRICS.PROSODY-RHYME`
- `KNOW.VI.TONE-MELODY`
- `KNOW.VI.SYLLABLE-PRIORITY`
- `KNOW.MELODY.QUALITY-GATE`
- `KNOW.MELODY.COMPOSITION-PLANNING`
