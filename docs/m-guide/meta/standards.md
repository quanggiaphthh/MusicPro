---
id: META.STANDARDS
type: meta
status: active
version: "1.0"
tags: [meta, standards]
serves-steps: [1, 2, 3, 4]
last-updated: "2026-09-07"
---

# Quy chuẩn kho (bắt buộc)

AI đọc file này trước khi thêm / sửa trang (curator, improver) hoặc khi sinh DOC_REFS.

## Tiêu chí nhận trang (admission)

Trang chỉ được thêm nếu giúp **ít nhất một**:

- viết lời, giai điệu, hòa âm, nhịp/form, hát (kể cả thanh điệu tiếng Việt)
- phối khí
- xuất / validate MusicXML
- vận hành 4 bước (prompt-craft, hợp đồng I/O)
- thẻ phong cách (`style-card`)
- cải thiện vòng curator / improver

## Từ chối

- So sánh vendor (Suno, Udio, …) như nội dung sáng tác
- Tranh luận kiến trúc DSL / compiler
- Trùng trang đã có (phải nâng cấp trang cũ)
- Trích nguyên văn lời / nhạc có bản quyền
- Biến tin web chưa kiểm chứng thành **constraint**
- Phụ thuộc `archive/` trong `sources` hoặc `DOC_REFS`
- Dump bài báo không trả lời “dùng lúc sáng tác/phối khí thế nào?”

## Constraint vs hint

| Loại | Ý nghĩa | Ví dụ |
|------|---------|--------|
| **constraint** | Bắt buộc khi sáng tác / xuất XML | `midi-program` ∈ 1–128; không duration 0 |
| **hint** | Gợi ý, có thể bỏ nếu xung đột yêu cầu user | BPM ballad thường 65–80 |

Hint **không** được viết như luật. Đổi constraint mới = đề xuất `needs_approval` cho đến khi user chốt (khi merge).

**Mặc định từ web:** xu hướng nghiên cứu / thống kê corpus / “thường gặp” → **hint**. Chỉ nâng **constraint** khi là XML well-formed, schema-hard, hoặc user đã chốt.

## Nguồn ngoài (theo dõi khi có dùng)

- **Không** bắt buộc mọi trang / mọi đề xuất curator–improver phải có URL ngoài.
- **Khi** AI (hoặc người) có tham khảo tài liệu ngoài: ghi URL cụ thể vào `sources` (và changelog upgrade) để theo dõi được.
- `sources: []` hợp lệ nếu nội dung chỉ dựa kho nội bộ / suy luận có kiểm soát, không viện dẫn trang ngoài.
- Cấm viện dẫn ngoài mà không để link, hoặc để URL giả / không mở được / không liên quan.

## Frontmatter bắt buộc

```yaml
id: TYPE.DOMAIN.NAME          # ổn định; không tái dùng id đã deprecate
type: knowledge | style-card | pipeline | meta | prompt | artifact
status: draft | active | deprecated
version: "1.0"
tags: [compose, arrange, musicxml, lyrics, style, ...]
serves-steps: [1, 2, 3, 4]    # bước liên quan
sources: []                   # chỉ path trong m-guide hoặc URL web
last-updated: "YYYY-MM-DD"
```

## Đầu trang cho AI

Mỗi trang knowledge / style mở đầu vài dòng:

- Khi nào đọc
- Không được làm gì (nếu có)

## Thứ tự xung đột

```text
1. Hợp đồng pipeline (I/O bước)
2. Constraint trong kho (đã active)
3. Yêu cầu bài hát tường minh của user
4. Hint trong kho
5. Thông tin web mới (chưa vào kho / chưa duyệt)
```

Xung đột không tự chọn một bên: ghi `conflicts-with` hoặc báo user.

## Catalog

Mọi trang mới / sửa / deprecate **phải** cập nhật [catalog.yml](../catalog.yml) (trong đề xuất `proposed/` trước khi merge).

## Thẻ phong cách

Xem template trong [knowledge/styles/_template.md](../knowledge/styles/_template.md).

- Tên tác phẩm / nghệ sĩ = **nhãn**
- Lưu đặc trưng khái quát
- Cấm lời, giai điệu, riff, sơ đồ ô nhịp của tác phẩm có bản quyền
