---
id: STYLE.TEMPLATE
type: style-card
status: active
version: "1.0"
tags: [style]
serves-steps: [2, 3, 4]
sources: []
last-updated: "2026-09-07"
---

# Template thẻ phong cách

> **AI:** Copy khi tạo thẻ mới. Tên tác phẩm/nghệ sĩ chỉ là **nhãn**. Cấm lời, giai điệu, riff, sơ đồ ô nhịp có bản quyền.

````markdown
---
id: STYLE.DOMAIN.NAME
type: style-card
status: draft
version: "1.0"
tags: [style, compose, arrange]
serves-steps: [3, 4]
sources:
  - "https://..."
last-updated: "YYYY-MM-DD"
---

# Thẻ: <nhãn ngắn>

> **AI:** Dùng khi `REFERENCE_STYLE` trỏ id này. Sáng tác **cùng hướng**, không sao chép.

## Nhãn tham chiếu (không phải nguồn copy)

- works_or_artists_as_labels: ["...", "..."]

## Đặc trưng khái quát

- harmony_language: ...
- form_tendencies: ...
- groove_tempo_band: ...
- typical_texture: ...
- melodic_behavior: ...   # bước liền / nhảy / hook ngắn...
- lyric_language_feel: ... # nếu liên quan
- arrangement_palette: ... # nhóm nhạc cụ / layering

## Constraints khi dùng thẻ

- Không tái tạo nốt, lời, hook độc bản của nhãn.
- Chỉ ánh xạ các trường đặc trưng ở trên vào quyết định DELEGATED.

## Hints

- ...
````
