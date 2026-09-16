---
id: KNOW.HARMONY.MODULATION
type: knowledge
status: active
version: "1.0"
tags: [compose, arrange, harmony]
serves-steps: [3, 4]
sources: []
last-updated: "2026-09-07"
---

# Chuyển giọng (modulation) trong bài hát

> **AI:** Đọc ở Bước 3 khi `HARMONY.modulation` được yêu cầu hoặc cao trào
> cần "đẩy" thêm; đọc lại ở Bước 4 nếu phối khí cần nhấn mạnh điểm chuyển
> giọng bằng nhạc cụ. `KNOW.HARMONY.BASICS` nói về hòa âm trong **một**
> giọng; trang này nói riêng về việc **đổi giọng** giữa bài.

## Dùng ở bước nào

- Bước 3 — quyết định có chuyển giọng hay không, chuyển ở đâu, bằng cách
  nào; ghi `<key>` mới đúng chỗ trong MusicXML.
- Bước 4 — nhấn điểm chuyển giọng bằng dàn dựng (built-up, im lặng ngắn,
  đổi màu nhạc cụ) nếu phù hợp.

## Constraints

- Nếu `HARMONY.progression` hoặc key đã `locked` / USER_EXPLICIT không
  cho phép đổi giọng → không tự thêm modulation.
- Khi đổi giọng trong MusicXML: phần tử `<key>` mới phải đặt đúng tại
  measure nơi giọng đổi (không đổi `fifths` giữa chừng một measure mà
  không có `<key>` mới khai báo tại đầu measure đó).
- Modulation là lựa chọn có chủ đích — không chèn tùy tiện chỉ vì "bài
  pop hay có" nếu không phục vụ `EMOTION.emotional_arc` hoặc yêu cầu user.

## Hints

### Các kiểu chuyển giọng thường dùng ở nhạc pop/ballad

| Kiểu | Mô tả | Cảm giác |
|---|---|---|
| Direct modulation (chuyển thẳng) | Nhảy thẳng sang giọng mới ở đầu section (thường chorus cuối), thường lên quãng 2 hoặc quãng 4 (semitone hoặc whole-tone up) | Bất ngờ, "bung" mạnh — hay dùng ở chorus cuối |
| Pivot chord (hợp âm bản lề) | Dùng một hợp âm chung cho cả giọng cũ và giọng mới để chuyển mượt | Mượt, ít gây giật |
| Chromatic mediant | Chuyển tới giọng cách quãng 3 (trưởng/thứ đổi màu) qua 1–2 hợp âm chuyển tiếp | Màu sắc mới lạ, "điện ảnh" hơn |
| Sequential / bậc thang | Nhắc lại một câu nhạc ở giọng cao dần từng bước | Dồn nén cảm xúc dần, hay ở pre-chorus |

### Khi nào nên cân nhắc modulation

- Chorus cuối cùng của bài (sau bridge) — kiểu direct modulation lên
  nửa cung hoặc nguyên cung là lựa chọn phổ biến để tạo cao trào cuối.
- Chuyển từ đoạn u buồn (thứ) sang đoạn hy vọng (trưởng) ở bridge —
  dùng pivot chord hoặc chromatic mediant để không đột ngột quá mức nếu
  cần mượt.
- **Không bắt buộc phải có** modulation — nhiều bài ballad hay không đổi
  giọng cả bài; chỉ thêm khi phục vụ `emotional_arc` hoặc user yêu cầu.

### Rủi ro cần tránh

- Modulation liên tục nhiều lần trong một bài ngắn dễ gây rối tai — ưu
  tiên tối đa 1 lần chuyển giọng rõ rệt cho một bài pop/ballad tiêu chuẩn
  trừ khi user yêu cầu cấu trúc phức tạp hơn.
- Sau khi chuyển giọng, giữ ổn định (không quay lại giọng cũ nửa chừng)
  trừ khi có chủ đích rõ (ví dụ outro quay về giọng gốc để "khép vòng").

## Cách áp dụng khi sáng tác / phối khí

1. Xác định có cần modulation không: đọc `HARMONY.modulation`,
   `EMOTION.emotional_arc`, và `SONG_FORM` (thường xét ở chorus cuối).
2. Nếu có: chọn kiểu chuyển (bảng trên) theo mức độ "mượt" mong muốn.
3. Đặt `<key>` mới đúng measure trong MusicXML; kiểm tra hợp âm ngay
   trước/sau điểm chuyển vẫn hợp lý theo `KNOW.HARMONY.BASICS`.
4. Bước 4: cân nhắc nhấn điểm chuyển bằng cách tạm ngưng một nhịp, đổi
   texture, hoặc thêm nhạc cụ mới đúng lúc chuyển giọng.
5. Ghi lựa chọn (có/không modulation, kiểu nào, ở đâu) vào
   `COMPOSITION_NOTES`.

## Ví dụ ngắn (tự viết, không trích tác phẩm có bản quyền)

Bài giọng Đô trưởng; chorus cuối chuyển thẳng (direct modulation) lên Rê
trưởng ở đúng đầu measure của chorus cuối, giữ nguyên tiến trình hợp âm
tương ứng dịch lên nguyên cung, không quay lại Đô trưởng ở outro.

## Conflicts / related

- `related:` `KNOW.HARMONY.BASICS`, `KNOW.RHYTHM.FORM`,
  `KNOW.MUSICXML.RULES`
- `conflicts-with:` không có — mở rộng `KNOW.HARMONY.BASICS`, không thay
  thế các constraint hòa âm trong-một-giọng đã có ở đó.
