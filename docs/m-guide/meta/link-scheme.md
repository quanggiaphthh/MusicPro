---
id: META.LINK-SCHEME
type: meta
status: active
version: "1.0"
tags: [meta, github]
serves-steps: [1, 2, 3, 4]
last-updated: "2026-09-07"
---

# Link scheme — dựng URL từ path

## Biến

Sau khi biết repo từ URL `for-ai.md` (hoặc user cung cấp):

```text
OWNER   = ...
REPO    = ...
BRANCH  = ...   # thường main

REPO_BLOB = https://github.com/OWNER/REPO/blob/BRANCH
REPO_RAW  = https://raw.githubusercontent.com/OWNER/REPO/BRANCH
```

## Path

Mọi `path` trong [catalog.yml](../catalog.yml) tính từ **root repo**, ví dụ:

```text
docs/m-guide/knowledge/melody/contour.md
```

## Fetch / hiển thị

| Mục đích | Công thức |
|----------|-----------|
| AI fetch markdown | `REPO_RAW + "/" + path` |
| Người mở trên GitHub | `REPO_BLOB + "/" + path` |

## DOC_REFS

Mỗi mục trong prompt Bước 2 phải có:

```yaml
- id: KNOW.MELODY.CONTOUR
  path: docs/m-guide/knowledge/melody/contour.md
  url: https://raw.githubusercontent.com/OWNER/REPO/BRANCH/docs/m-guide/knowledge/melody/contour.md
  why: "giai điệu / contour cho Bước 3"
```

Nếu chưa biết OWNER/REPO/BRANCH: ghi `path` + placeholder `url: "{REPO_RAW}/docs/m-guide/..."`.

## Link trong markdown kho

Dùng **đường dẫn tương đối** giữa các file trong `docs/m-guide/` (chạy được trên GitHub và sau này Pages).

## Cấm

- Không `DOC_REFS` / `sources` trỏ `archive/`.
- Không dùng URL Pages trừ khi repo đã bật Pages và `for-ai.md` đã cập nhật BASE.
