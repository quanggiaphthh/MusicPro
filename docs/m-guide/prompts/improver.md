# Prompt Improver — sau lần chạy không đạt

> **AI:** Dán / mở khi user yêu cầu **chạy improver** sau kết quả sáng tác/phối khí chưa như ý. Đọc trước:
>
> - `docs/m-guide/for-ai.md`
> - `docs/m-guide/meta/standards.md`
> - `docs/m-guide/catalog.yml`
> - `docs/m-guide/artifacts/run-review.template.md`
> - các trang / artifact user nêu là hỏng
>
> Raw: `{REPO_RAW}/docs/m-guide/...`

## Vai trò

Không chỉ “sửa một bài”. Bạn đề xuất **sửa bộ tài liệu** (quy trình, prompt, kiến thức, thẻ, catalog) để lần sau tốt hơn. **Không** ghi kho gốc trong lượt này.

## Input từ user

- Yêu cầu bài hát (nếu có)
- Artifact lần chạy (`runs/compose/<id>/` hoặc dán chat)
- `run-review` (hoặc mô tả lệch) — dùng template run-review

## Output bắt buộc (workspace)

```text
runs/upgrade/<YYYY-MM-DD-slug>/
  STATUS.md
  run-review.md
  changelog.md
  proposed/
    docs/m-guide/...
  MERGE.md
```

## Được đề xuất sửa

- `pipeline/` — hợp đồng I/O, thiếu bước, thứ tự
- `prompt-craft/` và template compose/arrange
- `knowledge/` — luật thiếu, hint mơ hồ, mâu thuẫn
- `knowledge/styles/` — thẻ sai / thiếu
- `catalog.yml` — khiến DOC_REFS kém
- `prompts/curator.md`, `prompts/improver.md` (chính file này)

Mỗi mục changelog phải chỉ **lỗi sản phẩm nào** nó nhắm (lời, thanh điệu, giai điệu, hòa âm, phối khí, MusicXML, trật phong cách, prompt yếu…).

## Quy trình

1. Chuẩn hóa / hoàn thiện `run-review.md`.
2. Chẩn đoán lớp: quy trình | prompt | kiến thức | thẻ phong cách | catalog.
3. Ghi patch vào `proposed/` (mirror path kho gốc).
4. Constraint mới → `needs-approval: true`.
5. **Nguồn:** không bắt buộc phải có link ngoài. **Nếu** đã tham khảo tài liệu/web/spec khi đề xuất → ghi URL cụ thể vào `sources` (trang đề xuất) và mục Sources của `changelog.md` để theo dõi. Không ghi nguồn mơ hồ; không URL giả/placeholder.
6. Hướng dẫn user chạy lại Bước 3/4 trên `runs/compose/` (hoặc Bước 1 nếu prompt yếu).
7. **Không merge** trừ khi user yêu cầu rõ.

## Cấm

- Đọc `archive/`
- Sửa `docs/m-guide/` trực tiếp
- “Nâng cấp” bằng cách nhét lời/nhạc bản quyền
- Merge tự động vì “đã viết xong đề xuất”
- Tham khảo ngoài nhưng không để lại URL theo dõi được

## STATUS.md tối thiểu

```markdown
# Upgrade STATUS
- type: improver
- related_compose_run: runs/compose/...
- status: proposed
- layers: [knowledge, prompt]
```
