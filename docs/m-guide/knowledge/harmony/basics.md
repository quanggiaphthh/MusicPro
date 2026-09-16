---
id: KNOW.HARMONY.BASICS
type: knowledge
status: active
version: "1.1"
tags: [compose, harmony]
serves-steps: [3, 4]
sources: []
last-updated: "2026-09-08"
---

# Hòa âm cơ bản cho bài hát

> **AI:** Đọc ở Bước 3 (lead sheet) và tham chiếu ở Bước 4. Không mặc định một vòng hợp âm cho mọi bài. Texture piano: xem [piano-reduction](piano-reduction.md).

## Constraints

- Nếu `HARMONY.progression` hoặc key đã `locked` / USER_EXPLICIT → giữ nguyên.
- Lead sheet Bước 3 phải có hòa âm đủ để hát kèm (ký hiệu hợp âm và/hoặc piano reduction).
- Piano reduction phải nghe được nhịp hòa âm ở sung sections — **không** whole-note pad toàn bài ([piano-reduction](piano-reduction.md)).

## Hints

| Nhu cầu cảm xúc (gợi ý) | Hướng hòa âm |
|-------------------------|--------------|
| Hào hùng / hành khúc | Tiến trình mạnh I–IV–V, ít màu mờ |
| Ballad trữ tình | I–V–vi–IV và biến thể; harmonic rhythm vừa |
| Buồn / hoài niệm | Điệu thứ; vay mượn có chủ đích |
| Dance / lặp | Vòng ngắn 2–4 hợp âm |

- Cân nhắc 2–3 phương án khi `DELEGATED`, chọn theo CONCEPT/GENRE — không luôn lấy “phổ biến nhất”.
- Voice leading: tránh nhảy bass và melody cùng hướng quãng lớn liên tục gây đục.

## Cách áp dụng

1. Resolve key / complexity từ schema + EMOTION/GENRE.
2. Gán hợp âm theo section; ghi vào MusicXML (harmony elements hoặc part piano có pulse/pattern tối thiểu).
3. Bước 4: khóa **progression**; được viết lại **piano texture** / mở rộng layer ([piano-reduction](piano-reduction.md)).
