---
id: KNOW.VI.TONE-MELODY
type: knowledge
status: active
version: "1.2"
tags: [compose, vietnamese, lyrics, melody]
serves-steps: [3]
sources:
  - "https://cs.nyu.edu/~nhan/full_paper_vs2.032p1_02.pdf"
  - "https://www.research.ed.ac.uk/en/publications/tone-melody-correspondence-in-vietnamese-popular-song/"
  - "https://www.isca-archive.org/tal_2016/kirby16_tal.pdf"
last-updated: "2026-09-08"
needs-approval: true
---

# Tiếng Việt — thanh điệu ↔ giai điệu

> **AI:** Bắt buộc đọc khi `primary_language = Vietnamese`. Không bỏ qua im lặng. Thống kê nghiên cứu dưới đây là **hint**, không phải luật cứng — trừ các **Constraints**.

## Dùng ở bước nào

- Bước 3 — gán lời vào giai điệu.
- Bước 4 — giữ contour thanh khi chuyển bè nếu có.

## Constraints

- Không cố ý đặt đường nét giai điệu **ngược** thanh điệu làm **đảo nghĩa rõ** ở từ khóa / hook khi còn phương án hợp lý khác.
- Nếu user yêu cầu rõ `tone_melody_compatibility`, ưu tiên khớp thanh hơn “hát cho tiện”.
- Mọi tradeoff (lệch thanh vì motif / yêu cầu khác) phải ghi vào `COMPOSITION_NOTES`.
- Chấm khớp theo **hướng chuyển giữa hai âm tiết liên tiếp** (similar / oblique / contrary) dựa trên **tonal offset** của cặp thanh — không theo pitch tuyệt đối của một nốt đơn.
- **Cấm** công thức máy móc kiểu `sắc=+1, huyền=-1, ngã=+1, nặng=-1` độc lập từng âm tiết rồi gọi là “đã xử lý thanh”. Thanh phải tương tác với contour phrase, beat mạnh/yếu, duration, cadence và hòa âm (xem [lyric-melody-fit](../lyrics/lyric-melody-fit.md)).

## Hints

### Hướng pitch theo thanh (gợi ý đơn lẻ — không đủ một mình)

| Thanh | Hướng pitch gợi ý | Ghi chú |
|-------|-------------------|---------|
| ngang | ổn định / giữ cao độ | có thể hơi lên nhẹ cuối câu |
| sắc | đi lên hoặc đích cao | thường ở điểm nhấn |
| huyền | đi xuống hoặc đích thấp | tránh kéo lên làm nghe như sắc |
| hỏi | xuống rồi lên (V / dual note) | |
| ngã | gãy / nhấn, thường lên có “gãy” | phân biệt rõ hơn ở giọng Bắc |
| nặng | thấp, ngắn, nặng | tránh kéo dài |

### Parallel / contrary motion (Kirby & Ladd — tân nhạc)

Trong nhạc Việt phổ thông, hướng pitch **cùng chiều** chuyển thanh (similar / parallel) thường gặp hơn hướng ngược (contrary). Ưu tiên similar ở từ khóa; contrary chỉ khi có lý do nghệ thuật rõ và không đảo nghĩa. Nghiên cứu corpus (~77% similar) gợi ý: **tránh contrary** quan trọng hơn ép parallel tuyệt đối mọi chỗ.

| Loại | Định nghĩa | Khuyến nghị |
|------|------------|-------------|
| Similar / Parallel | pitch cùng hướng chuyển thanh (offset) | ưu tiên |
| Oblique | một bên giữ, một bên chuyển | cho phép (đặc biệt có ngang) |
| Contrary | pitch ngược hướng chuyển thanh | hạn chế ở hook |

### Giọng Bắc–Nam

- Bắc: hỏi / ngã tách rõ hơn → thể hiện rõ hơn nếu dialect Bắc.
- Nam: hỏi / ngã gần nhau hơn → linh hoạt hơn, vẫn tránh đảo nghĩa.

### Hook vs từ chức năng

- Hook / từ khóa: giữ nghĩa chặt.
- Từ chức năng (và, thì, mà…): linh hoạt hơn vì motif.

## Cách áp dụng (Bước 3)

1. Phân tích thanh từng âm tiết; đánh dấu bigram thanh cho từ khóa.
2. Đánh dấu hook cần bảo vệ nghĩa.
3. Phác contour ưu tiên similar motion + bảng thanh — gắn beat/duration từ lyric–melody fit.
4. Ghi tradeoff vào notes nếu lệch; không dùng bảng ±1 độc lập.

## Ví dụ ngắn (tự viết)

- “đi” (ngang) → “về” (huyền): giữ rồi xuống (similar). Đưa “về” lên cao hơn “đi” dễ nghe như “vé” → tránh.

## Related

- `KNOW.LYRICS.CRAFT`, `KNOW.LYRICS.LYRIC-MELODY-FIT`, `KNOW.MELODY.CONTOUR`, `STYLE.VN.VPOP-BALLAD`
