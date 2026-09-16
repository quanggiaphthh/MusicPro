---
id: KNOW.VI.RHYME-METER
type: knowledge
status: active
version: "1.0"
tags: [compose, vietnamese, lyrics]
serves-steps: [3]
sources: []
last-updated: "2026-09-07"
---

# Tiếng Việt — vần và thể thơ trong lời bài hát

> **AI:** Đọc ở Bước 3 khi viết lời tiếng Việt, ngay sau
> [`KNOW.LYRICS.CRAFT`](../lyrics/craft.md) và trước khi gán thanh điệu theo
> [`KNOW.VI.TONE-MELODY`](tone-melody.md). Trang này nói về **cách gieo vần
> và chọn thể thơ**; không lặp lại nội dung thanh điệu ↔ giai điệu — xem
> `tone-melody.md` cho phần đó. Không dùng để tạo ra "công thức" cứng nhắc
> thay cho cảm nhận của người viết.

## Dùng ở bước nào

- Bước 3 — chốt **cách gieo vần** và **thể thơ nền** cho lời trước khi viết
  chi tiết từng dòng; hỗ trợ đếm âm tiết theo `syllable_target` nếu có.

## Constraints

- Không sao chép nguyên văn câu thơ / lời bài hát có bản quyền làm ví dụ
  (đã nêu ở `KNOW.LYRICS.CRAFT`, nhắc lại tại đây vì dễ vi phạm khi minh họa
  luật vần).
- Nếu user đã khóa `rhyme_scheme` hoặc `verse_form` tường minh trong yêu cầu
  bài hát → tuân thủ, không tự đổi sang thể thơ khác.

## Hints

### Bằng — trắc (nền của vần)

| Nhóm thanh | Thanh | Ghi chú |
|---|---|---|
| Bằng | ngang, huyền | âm vực ổn định, dễ ngân dài |
| Trắc | sắc, hỏi, ngã, nặng | âm vực đổi hướng / ngắn, hợp điểm nhấn |

Vần **chính** thường ghép cùng nhóm bằng–bằng hoặc trắc–trắc; vần **thông**
(gần đúng, khác nhóm nhưng nghe vẫn xuôi) chấp nhận được ở lời bài hát —
âm nhạc khoan dung hơn thơ in giấy vì giai điệu "kéo" tai người nghe.

### Vị trí gieo vần

| Loại vần | Vị trí | Hay dùng khi |
|---|---|---|
| Vần chân (cước vận) | cuối dòng | phổ biến nhất trong lời bài hát |
| Vần lưng (yêu vận) | giữa dòng, thường tiếng thứ 6 nối tiếng thứ 8 (kiểu lục bát) | tạo nhịp trôi chảy, ít dùng ở pop hiện đại |
| Vần liền | hai dòng sát nhau cùng vần (AA) | verse ngắn, dễ nhớ nhanh |
| Vần cách / ôm (ABAB, ABBA) | so le hoặc ôm nhau | verse dài hơn, chorus cần biến hóa |

### Thể thơ nền hay dùng làm khung lời

| Thể thơ | Cấu trúc âm tiết/dòng | Gợi ý dùng |
|---|---|---|
| Lục bát | 6–8, xen kẽ, vần lưng ở câu 8 nối câu 6 | verse tự sự, màu dân gian/quê hương |
| Song thất lục bát | 7–7–6–8 | đoạn kể chuyện dài, ballad tự sự |
| Thơ 5 chữ | 5 âm tiết/dòng đều | tiết tấu nhanh, dồn dập, phù hợp hành khúc/upbeat |
| Thơ 7 chữ | 7 âm tiết/dòng đều | phổ biến ở ballad V-Pop, dễ khớp giai điệu 4 nhịp |
| Thơ 8 chữ | 8 âm tiết/dòng đều | chorus cần câu dài, nhiều hơi |
| Tự do (không cố định số chữ) | biến thiên | pop hiện đại, ưu tiên tự nhiên khi hát hơn đúng luật |

Không bắt buộc theo đúng một thể cả bài — nhiều lời V-Pop hiện đại chỉ mượn
**cảm giác** vần/nhịp của lục bát hoặc thơ 7 chữ chứ không tuân luật chặt.
Coi đây là **nguồn cảm hứng cấu trúc**, không phải khuôn.

### Vần và câu nhạc (section)

- Verse: vần chân đều đặn (AABB hoặc ABAB) giúp dễ nhớ khi kể chuyện.
- Chorus/hook: có thể lặp một vần xuyên suốt để tăng độ "bắt tai"; chấp
  nhận vần thông nếu từ khóa ý nghĩa quan trọng hơn khớp vần tuyệt đối.
- Bridge: có thể đổi vần hoặc bỏ vần tạm thời để tạo tương phản trước khi
  chorus cuối quay lại.

### Xung đột thường gặp

- Ép đúng vần chính nhưng làm sai/đảo nghĩa từ khóa → ưu tiên nghĩa, chuyển
  sang vần thông hoặc đổi từ, không giữ vần bằng mọi giá.
- Ép đúng số chữ theo thể thơ nhưng câu hát trở nên gượng khi hát lên giai
  điệu đã có sẵn (Bước 4 phối khí) → ưu tiên độ tự nhiên khi hát, ghi
  tradeoff vào `COMPOSITION_NOTES`.

## Cách áp dụng khi sáng tác

1. Xem `SONG_FORM` và `EMOTION` trong schema; chọn một thể thơ nền phù hợp
   màu sắc (ví dụ: kể chuyện quê hương → thiên hướng lục bát; ballad hiện
   đại → thơ 7–8 chữ hoặc tự do).
2. Chọn sơ đồ gieo vần theo section (vần liền cho verse dễ nhớ, vần cách
   cho đoạn cần biến hóa).
3. Viết nháp lời theo tứ thơ đã chốt (xem `KNOW.LYRICS.CRAFT`), đối chiếu
   vần ở cuối mỗi dòng; chấp nhận vần thông nếu cần giữ nghĩa.
4. Sau khi lời ổn định về vần, mới gán thanh điệu theo contour giai điệu
   (`KNOW.VI.TONE-MELODY`) — không làm ngược thứ tự vì dễ phải viết lại vần.
5. Ghi lại thể thơ/sơ đồ vần đã chọn vào `COMPOSITION_NOTES` để Bước 4 giữ
   nhất quán khi phối khí thêm bè.

## Ví dụ ngắn (tự viết)

Minh họa sơ đồ vần AABB, không phải trích dẫn tác phẩm có thật:

```
Chiều nay nắng nhẹ trên vai      (A: "vai")
Gió đưa hương lúa qua ngoài      (A: "ngoài")
Con đường nhỏ dẫn về xa          (B: "xa")
Có ai còn nhớ khúc ca            (B: "ca")
```

## Conflicts / related

- `related:` `KNOW.LYRICS.CRAFT`, `KNOW.LYRICS.PROSODY-RHYME`, `KNOW.VI.TONE-MELODY`, `KNOW.RHYTHM.FORM`
- `conflicts-with:` không có — bổ sung cho `KNOW.LYRICS.CRAFT` / `PROSODY-RHYME`, không thay thế; nếu user khóa `rhyme_scheme` khác gợi ý ở đây, yêu cầu user luôn thắng (xem thứ tự xung đột trong `meta/standards.md`).
