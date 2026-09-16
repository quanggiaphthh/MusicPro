# Mẫu tin nhắn gửi AI (cheatsheet)

Hướng dẫn đầy đủ Chức năng 1: [guides/chuc-nang-1-sang-tac.md](../guides/chuc-nang-1-sang-tac.md).

Repo mặc định dưới đây: `trungnv84/ProjectMusic00`, branch `master`. Đổi `OWNER` / `REPO` / `BRANCH` nếu fork khác.

Canonical: `https://github.com/trungnv84/ProjectMusic00/blob/master/docs/m-guide/for-ai.md`

---

## Chức năng 1 — cả chuỗi

```text
Đọc https://github.com/trungnv84/ProjectMusic00/blob/master/docs/m-guide/for-ai.md
Thực hiện Chức năng 1, cả 4 bước (dừng sau mỗi bước để tôi duyệt).
Nếu đang ở workspace: ghi vào runs/compose/<ngày-slug>/.
Yêu cầu bài hát: "..."
REFERENCE_STYLE (nếu có): STYLE.VN.VPOP-BALLAD
```

## Chỉ Bước 1

```text
Đọc https://github.com/trungnv84/ProjectMusic00/blob/master/docs/m-guide/for-ai.md
Làm Bước 1 (meta-prompt).
Yêu cầu: tạo khung để AI Bước 2 đọc catalog và sinh 2 prompt + DOC_REFS.
Yêu cầu bài hát: "..."
```

## Chỉ Bước 2

```text
Đọc .../for-ai.md
Làm Bước 2. Input: runs/compose/.../01-meta-prompt.md
Xuất 02-compose-prompt.md + 02-arrange-prompt.md (có DOC_REFS từ catalog).
```

## Chỉ Bước 3

```text
Đọc .../for-ai.md
Làm Bước 3.
Compose-prompt: runs/compose/.../02-compose-prompt.md
Yêu cầu bài hát: "..."
REFERENCE_STYLE (nếu có): STYLE.VN.VPOP-BALLAD
```

## Chỉ Bước 4

```text
Đọc .../for-ai.md
Làm Bước 4.
Arrange-prompt: runs/compose/.../02-arrange-prompt.md
Lead sheet: runs/compose/.../03-song.musicxml
Khóa lyric/melody/harmony trừ khi tôi cho phép sửa.
```

## Curator

```text
Đọc .../for-ai.md
Chạy curator.
Chủ đề thiếu: "..."
Ghi đề xuất vào runs/upgrade/<ngày-slug>/proposed/. Không sửa docs/m-guide/ cho đến khi tôi bảo merge.
```

## Improver

```text
Đọc .../for-ai.md
Chạy improver.
Compose run: runs/compose/...
(dán run-review hoặc mô tả lệch)
Không sửa docs/m-guide/ cho đến khi tôi bảo merge.
```

## Merge

```text
Merge đề xuất runs/upgrade/<id>/ vào docs/m-guide/ theo pipeline/merge-policy.md.
Tôi chấp nhận các mục needs_approval: ...
```
