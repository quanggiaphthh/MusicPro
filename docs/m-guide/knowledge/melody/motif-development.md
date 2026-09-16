---
id: KNOW.MELODY.MOTIF-DEVELOPMENT
type: knowledge
status: active
version: "1.2"
tags: [compose, melody]
serves-steps: [3]
sources: []
last-updated: "2026-09-08"
---

# Phát triển motif và sequence trong giai điệu

> **AI:** Đọc ở Bước 3 khi đã **tự invent** motif và cần biến tấu. Không dùng motif có bản quyền. Ví dụ pitch bên dưới chỉ minh họa kỹ thuật — **cấm** copy vào bài thật.

## Dùng ở bước nào

- Bước 3 — sau khi có hook/motif mới cho bài; ghi cells vào `motifs_declared` trong composition notes.

## Constraints

- Không sao chép motif / hook của tác phẩm được nêu trong `REFERENCE_STYLE`.
- Motif đã khóa trong lead sheet không đổi ở Bước 4 chỉ để “phát triển thêm”.
- Phải có `motifs_declared` + `hook_melody_cell` trong **composition notes** (không cần file plan riêng).
- Chỉ lặp motif rộng rãi **sau** khi hook đã memorable.
- **Final Chorus:** ≥1 kỹ thuật phát triển thật từ bảng — **cấm** chỉ nâng register.

## Hints

Motif là đơn vị ý nhạc ngắn (thường 2–4 nốt + tiết tấu). Mỗi bài tự invent 1–2 motif chính.

| Kỹ thuật | Mô tả | Gợi ý dùng |
| -------- | ----- | ---------- |
| Lặp lại (repetition) | Giữ cao độ + tiết tấu | Neo nhận diện |
| Dịch chuyển (sequence) | Lặp motif ở bậc khác | Tăng/giảm năng lượng |
| Phóng đại (augmentation) | Tăng trường độ | Mở rộng, lắng |
| Thu nhỏ (diminution) | Giảm trường độ | Tăng mật độ |
| Đảo ngược (inversion) | Đảo chiều quãng | Tương phản trong cùng ý |
| Thoái hóa (fragmentation) | Một phần motif | Cầu nối |
| Thêm nốt (embellishment) | Nốt lướt | Làm giàu |
| Đổi cadence / opening / pickup | Đổi cách vào hoặc kết | Final, Verse 2 |

Với lời tiếng Việt: [tone-melody](../vietnamese/tone-melody.md), [lyric-melody-fit](../lyrics/lyric-melody-fit.md).

## Cách áp dụng

1. Invent motif (melody-invention); ghi notes.
2. Chọn 2–3 kỹ thuật; áp Verse2 / pre / chorus / final.
3. Kiểm: motif gốc vẫn nhận ra; không vi phạm [anti-patterns](anti-patterns.md).

## Ví dụ kỹ thuật (đừng copy nốt vào bài)

- Motif minh họa: ba nốt lên bậc liền + một nốt nhảy xuống.
- Sequence: cùng hình ở bậc khác.
- Fragment: lấy 2 nốt đầu rồi mở hướng mới.

## Related

- `KNOW.MELODY.INVENTION`
- `KNOW.MELODY.CONTOUR`
- `KNOW.MELODY.PHRASE-STRUCTURE`
- `KNOW.MELODY.ANTI-PATTERNS`
- `KNOW.VI.TONE-MELODY`
