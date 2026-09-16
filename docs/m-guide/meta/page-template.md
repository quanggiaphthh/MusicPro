---
id: META.PAGE-TEMPLATE
type: meta
status: active
version: "1.0"
tags: [meta, template]
serves-steps: [1, 2, 3, 4]
last-updated: "2026-09-07"
---

# Template trang knowledge

Copy khối dưới khi tạo trang mới (curator / thủ công). Điền frontmatter; xóa mục không dùng.

````markdown
---
id: KNOW.DOMAIN.NAME
type: knowledge
status: draft
version: "1.0"
tags: [compose]
serves-steps: [3]
sources:
  - "https://example.com/..."
last-updated: "YYYY-MM-DD"
---

# Tiêu đề ngắn

> **AI:** Đọc khi … . Không …

## Dùng ở bước nào

- Bước 3 / 4 / cả hai — mô tả một câu.

## Constraints

- (luật bắt buộc, nếu có)

## Hints

- (gợi ý, không bắt buộc)

## Cách áp dụng khi sáng tác

1. …
2. …

## Ví dụ ngắn (tự viết)

Không dán lời/nhạc có bản quyền.

## Conflicts / related

- `conflicts-with:` …
- `related:` id trang khác
````

## Template thẻ phong cách

Dùng [knowledge/styles/_template.md](../knowledge/styles/_template.md).
