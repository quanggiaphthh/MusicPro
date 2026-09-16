---
id: KNOW.VOCAL.BACKING-HARMONIES
type: knowledge
status: active
version: "1.0"
tags: [arrange, vocal]
serves-steps: [4]
sources: []
last-updated: "2026-09-07"
---

# Bè hát (backing vocal harmonies)

> **AI:** Đọc ở Bước 4 khi `ARRANGEMENT` gợi ý thêm bè hát (backing
> vocals / ad-lib / bè hòa âm), hoặc khi texture chorus cần dày hơn mà
> không muốn chỉ dựa vào nhạc cụ. `KNOW.VOCAL.WRITING` nói về viết **một**
> giai điệu hát chính ở Bước 3; trang này nói về việc **thêm bè** ở Bước 4,
> sau khi giai điệu chính đã khóa.

## Dùng ở bước nào

- Bước 4 — thêm part bè hát dựa trên lead vocal đã có ở MusicXML Bước 3.

## Constraints

- Không đổi giai điệu / lời của **lead vocal** đã khóa từ Bước 3 khi thêm
  bè, trừ khi user giao quyền sửa (đồng nhất với nguyên tắc chung ở
  `KNOW.ARR.ORCHESTRATION`).
- Part bè hát mới (nếu thêm) phải khai báo đủ trong `part-list` và có đủ
  measure 1→N như mọi part khác (theo `KNOW.MUSICXML.RULES`).
- Nếu bè hát lặp lại lời lead vocal, dùng đúng `<lyric>` cho part đó —
  không để part bè có note nhưng thiếu lyric trong khi lead vocal có, trừ
  khi bè hát dùng nguyên âm nền ("a", "ư", "ooh") — trường hợp đó vẫn phải
  có `<text>` (ví dụ "a") chứ không để trống.

## Hints

### Kiểu bè phổ biến

| Kiểu bè | Mô tả | Hay dùng khi |
|---|---|---|
| Unison đôi (doubling) | hát cùng cao độ lead, khác màu giọng | tăng độ dày mà không thêm hòa âm mới |
| Bè quãng 3 | song song quãng 3 trên hoặc dưới lead | chorus pop/ballad phổ biến nhất |
| Bè quãng 5/6 | mở hơn quãng 3, cảm giác rộng | đoạn cao trào, dàn dựng lớn |
| Call-and-response | bè "đáp lại" cuối câu lead, không hát cùng lúc | verse kể chuyện, tạo đối thoại |
| Nền nguyên âm (pad-like) | bè giữ nốt dài ("a", "ooh") dưới lead | bridge, đoạn cần không gian mà không thêm lời |
| Đối âm (counter-melody) | bè hát giai điệu khác, không song song | đoạn outro, sau khi hook đã quen tai |

### Khi nào thêm bè

- Verse: thường **không** cần bè (giữ thân mật) — chỉ thêm nếu concept
  cần "nhiều người kể chuyện" ngay từ đầu.
- Pre-chorus: có thể thêm bè nhẹ (unison hoặc quãng 3) để báo hiệu chorus
  sắp tới.
- Chorus: nơi phổ biến nhất để thêm bè quãng 3/5, đặc biệt lần lặp chorus
  sau (không nhất thiết bè ngay từ chorus đầu).
- Bridge: có thể dùng nền nguyên âm hoặc đối âm để đổi màu trước khi quay
  lại chorus cuối.

### Tránh

- Bè dày ở mọi section khiến mất điểm nhấn — nên để ít nhất verse đầu
  "trần" (chỉ lead) để chorus có bè nghe nổi bật hơn.
- Bè cùng thanh điệu tiếng Việt nhưng khác cao độ gây "đảo nghĩa" nếu bè
  hát cùng lời — áp dụng lại nguyên tắc ở `KNOW.VI.TONE-MELODY` cho từng
  bè, không chỉ cho lead.

## Cách áp dụng khi phối khí

1. Đọc `ARRANGEMENT` + lead vocal MusicXML Bước 3; xác định section nào
   cần dày thêm bằng giọng người thay vì chỉ nhạc cụ.
2. Chọn kiểu bè theo bảng trên, ưu tiên quãng 3 nếu không có yêu cầu khác.
3. Viết part bè mới: `part-list` khai báo, measure liên tục, gắn lyric
   đúng (lặp lời lead hoặc nguyên âm nền — không để trống).
4. Nếu lời tiếng Việt: kiểm tra lại thanh điệu của bè ở các từ khóa.
5. Ghi lựa chọn bè vào arrangement notes (section nào có bè, kiểu bè gì).

## Ví dụ ngắn (tự viết, không trích tác phẩm có bản quyền)

Mô tả bằng lời (không phải MusicXML đầy đủ): lead hát "về nhà" ở quãng
Đô–Mi; bè quãng 3 dưới hát cùng lời "về nhà" ở quãng La–Đô, vào từ chữ
"nhà" của chorus lần 2 trở đi, không có ở verse.

## Conflicts / related

- `related:` `KNOW.VOCAL.WRITING`, `KNOW.VI.TONE-MELODY`,
  `KNOW.ARR.ORCHESTRATION`, `KNOW.MUSICXML.LYRICS-ENCODING`
- `conflicts-with:` không có — mở rộng `KNOW.ARR.ORCHESTRATION` cho riêng
  giọng hát, không thay thế nguyên tắc layering chung.
