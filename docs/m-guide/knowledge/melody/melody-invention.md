---
id: KNOW.MELODY.INVENTION
type: knowledge
status: active
version: "1.0"
tags: [compose, melody]
serves-steps: [3]
sources:
  - "https://songwritingauthority.com/melody-writing-techniques/"
  - "docs/m-guide/knowledge/melody/anti-patterns.md"
last-updated: "2026-09-08"
---

# Sáng tác giai điệu — invent, đừng điền mẫu

> **AI:** Đây là trang **bắt buộc** ở Bước 3. Kho hướng dẫn **cách nghĩ và kiểm**, không cấp sẵn chuỗi nốt để copy. Mọi ví dụ pitch chỉ minh họa kỹ thuật — **cấm** tái sử dụng làm skeleton cho cả bài.

## Vấn đề cần tránh

Lỗi phổ biến: chọn một công thức (vd. cùng 5 nốt + cùng nhịp cho mọi câu Verse), rồi chỉ **thay lời**. Kết quả nghe đều đều, cơ giới — dù MusicXML hợp lệ và form Verse–Chorus đủ.

Tài liệu / style card **không** phải bản mẫu giai điệu. Style = cảm giác (tempo band, bước liền vs nhảy, mật độ) — bạn phải **tự viết** pitch và rhythm mới cho bài này.

## Constraints

- **Cấm lyric-fill-on-skeleton:** không dùng một pitch-cell + rhythm-cell cố định cho ≥3 câu liên tiếp chỉ đổi lời.
- **Cấm “bảng nốt mẫu”:** không biến ví dụ trong knowledge (F–G–F–E–C, C–E–G, …) thành giai điệu thật của bài.
- Mỗi section chính (Verse, Pre, Chorus, Bridge) phải có **ý nhạc riêng** nghe được (contour và/hoặc rhythm khác), không chỉ đổi hợp âm hoặc register.
- Hook Chorus phải là câu **đáng nhớ trước**, rồi mới lặp; lặp skeleton nhạt ≠ hook.
- Verse 2 / Final: biến thể có chủ đích (rhythm, opening, cadence, sequence…) — không chỉ “cùng nốt cao hơn”.
- Sau khi viết, tự hỏi: *Nếu bỏ lời, các câu Verse còn phân biệt được không?* Nếu không → FAIL và viết lại.

## Hints — quy trình invent (nội bộ, không file riêng)

1. **Nghe lời nói:** đọc câu hát theo nhịp nói; đánh dấu từ mang nghĩa.
2. **Rhythm trước pitch:** đặt chỗ nhấn / ngân / thở trên bar (xem lyric-melody-fit) — mỗi câu có thể khác nhịp một chút.
3. **Một câu hook:** thử vài contour khác nhau; chọn câu muốn ngân nga; khóa hook cell vào notes.
4. **Verse = kể chuyện:** câu hỏi → câu trả lời (A/B), đổi hướng hoặc nhịp ở câu sau; đừng clone A.
5. **Pre = đẩy:** tăng mật độ hoặc leo register về hook — khác Verse.
6. **Bridge = không gian khác:** đổi hướng (xuống / hẹp / syncop) + màu hòa âm — người nghe phải cảm thấy “sang chỗ mới”.
7. **Hát thầm toàn bài** (speak/sing-test) trước khi xuất XML; chỗ đều đều → viết lại đoạn đó.

Kỹ thuật hợp lệ để tạo khác biệt: sequence, fragmentation, đổi cadence, pickup, augmentation/diminution, đảo khoảng — xem [motif-development](motif-development.md). Dùng để **biến tấu ý đã hay**, không để biện minh cho copy nguyên xi.

## Cách áp dụng với MusicXML

1. Invent hook + 2–3 motif section (ghi `motifs_declared` / `hook_melody_cell` trong **composition notes**).
2. Viết từng phrase có mục tiêu riêng; so với anti-patterns.
3. Xuất pretty-print XML + notes + quality gate trong **cùng Bước 3**.
4. Gate FAIL → đổi ý nhạc, sinh lại — không patch nốt lẻ.

## Related

- `KNOW.MELODY.ANTI-PATTERNS`
- `KNOW.MELODY.COMPOSITION-PLANNING`
- `KNOW.MELODY.MOTIF-DEVELOPMENT`
- `KNOW.MELODY.CONTOUR`
- `KNOW.LYRICS.LYRIC-MELODY-FIT`
- `PIPE.STEP-03`
