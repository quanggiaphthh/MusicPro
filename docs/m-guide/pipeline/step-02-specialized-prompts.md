---
id: PIPE.STEP-02
type: pipeline
status: active
version: "1.0"
tags: [pipeline]
serves-steps: [2]
last-updated: "2026-09-07"
---

# Bước 2 — Hai prompt chuyên biệt

## Input bắt buộc

- `01-meta-prompt.md` (hoặc user dán bản tương đương)
- Catalog kho

## Fetch

- Meta-prompt của user
- [../catalog.yml](../catalog.yml) (toàn bộ)
- Template [compose](../artifacts/compose-prompt.template.md) / [arrange](../artifacts/arrange-prompt.template.md)
- [../meta/link-scheme.md](../meta/link-scheme.md)

**Không** fetch hết `knowledge/` trừ khi catalog quá ngắn và user yêu cầu quét.

## AI làm

1. Đọc catalog: `id`, `tags`, `serves-steps`, `summary`, `path`.
2. Gán trang cho **compose**: tags `compose`, `lyrics`, `melody`, `harmony`, `vietnamese`, `vocal`, `rhythm-form`, `musicxml` (compose).
3. Gán trang cho **arrange**: tags `arrange`, `musicxml` (arrange), `arrangement`.
4. Thẻ `style` nếu sẽ có `reference_style`.
5. Dựng `url` raw cho từng DOC_REF ([link-scheme](../meta/link-scheme.md)).

Mỗi prompt: vai trò, cấm/làm, schema, `DOC_REFS` (id, path, url, why), định dạng output MusicXML.

## Output

```text
runs/compose/<run-id>/02-compose-prompt.md
runs/compose/<run-id>/02-arrange-prompt.md
STATUS.md  # step2: done
```

Dừng để user sửa.
