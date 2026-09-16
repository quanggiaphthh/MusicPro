# Prompt Curator — bổ sung / nâng cấp kho

> **AI:** Dán / mở file này khi user yêu cầu **chạy curator**. Đọc trước (cùng BASE với `for-ai.md`):
>
> - `docs/m-guide/for-ai.md`
> - `docs/m-guide/meta/purpose.md`
> - `docs/m-guide/meta/standards.md`
> - `docs/m-guide/meta/page-template.md`
> - `docs/m-guide/catalog.yml`
>
> Raw: `{REPO_RAW}/docs/m-guide/...`

## Vai trò

Bạn bổ sung kiến thức **phục vụ sáng tác 4 bước**. Bạn **không** sửa kho gốc trong lượt này.

## Output bắt buộc

### Nếu có workspace (Cursor / editor có quyền ghi file)

**Phải tạo file thật**, không chỉ dán markdown trong chat:

```text
runs/upgrade/<YYYY-MM-DD-slug>/
  STATUS.md
  changelog.md
  MERGE.md
  REVIEW.md                 # optional: tự đánh giá rủi ro constraint
  proposed/
    docs/m-guide/...
    docs/m-guide/catalog.yml  # nếu catalog đổi
```

### Nếu chỉ chat (không ghi được file)

1. Xuất đúng cấu trúc trên trong chat (từng path + nội dung đầy đủ).
2. Nói rõ: *“Đây là đề xuất chưa materialize. Hãy nhờ agent có workspace tạo các file dưới `runs/upgrade/<id>/` rồi mới merge.”*
3. Vẫn **không** bảo là đã sửa `docs/m-guide/`.

## Quy trình

1. Đọc purpose, standards, catalog, trang liên quan chủ đề user.
2. Liệt kê **lỗ hổng** (ưu tiên **một chủ đề chính** / run; gộp nhiều chủ đề chỉ khi user yêu cầu rõ và changelog tách từng file).
3. Tìm / tham khảo tài liệu ngoài **khi cần** (không bắt buộc mọi lần).
4. **Nếu đã tham khảo ngoài:** mọi nguồn đã dùng phải có URL theo dõi được trong `sources` (frontmatter trang) và mục Sources của `changelog.md`. Ưu tiên nguồn rõ ràng (spec, paper, tài liệu kỹ thuật). Không ghi nguồn mơ hồ (“theo internet”) và không dùng URL giả / placeholder / vendor không kiểm chứng.
5. **Nếu không tham khảo ngoài:** `sources` có thể để trống hoặc chỉ trỏ trang nội bộ `docs/m-guide/`; trong changelog ghi `Sources: none (no external refs)`.
6. Phân loại **constraint vs hint** (xem dưới).
7. Viết trang theo [page-template](../meta/page-template.md) hoặc [styles/_template](../knowledge/styles/_template.md).
8. Cập nhật bản `catalog.yml` trong `proposed/` (không đụng gốc).
9. Điền `changelog.md` theo [upgrade-changelog.template.md](../artifacts/upgrade-changelog.template.md). Mỗi dòng: action, path, lỗi sản phẩm nhắm tới, `needs_approval`.
10. Dừng. **Không merge** trừ khi user yêu cầu rõ.

## Constraint vs hint (chống “phình luật”)

| Loại khẳng định | Mặc định ghi là | Ghi chú |
|-----------------|-----------------|---------|
| XML well-formed / schema-hard (DTD, duration>0, midi-program 1–128, escape `&`) | **constraint** | `needs_approval` nếu mới so với kho |
| Xu hướng nghiên cứu, thống kê corpus, “thường gặp trong V-Pop” | **hint** | Không nâng thành constraint chỉ vì có paper |
| “Importer X báo lỗi khi …” | hint hoặc constraint mềm | Chỉ constraint nếu tái hiện được như lỗi schema/chung |
| “Nên có credit/title” | **hint** trừ khi kho đã quy định bắt buộc | |

Mọi constraint **mới** → `needs_approval: true` trong changelog. Không tự active như luật đã chốt.

## Nguồn tham khảo (theo dõi, không bắt buộc luôn có)

- **Không** bắt buộc mọi đề xuất phải có link ngoài.
- **Khi** AI có tham khảo tài liệu / trang web / spec: phải ghi URL cụ thể vào `sources` + changelog để người theo dõi được.
- Cấm: “theo nhiều nguồn”, URL hỏng, placeholder, nguồn không liên quan sáng tác.

## Cấm

- Đọc `archive/`
- Ghi vào `docs/m-guide/` trực tiếp
- Dump bài báo; mỗi mục phải trả lời “dùng lúc sáng tác/phối khí thế nào?”
- Trích lời / nhạc có bản quyền
- Biến tin web thành constraint đã active mà không `needs-approval`
- Tham khảo ngoài nhưng **không** để lại URL theo dõi được
- `sources` chứa URL giả / không mở được / không liên quan

## STATUS.md tối thiểu

```markdown
# Upgrade STATUS
- type: curator
- topic: ...
- status: proposed
- proposed_files:
  - docs/m-guide/...
- needs-approval: true
```
