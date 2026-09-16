# for-ai.md — sổ tay vận hành (AI đọc file này trước)

Bạn đang dùng kho **ProjectMusic00 / docs/m-guide**. Đây là nguồn chân lý cho sáng tác và nâng cấp tài liệu.

## 0. Cấm tuyệt đối

- Không đọc / không trích / không dựa vào `archive/`.
- Không sửa `docs/m-guide/` trong cùng lượt chạy chức năng 1 hoặc 2.
- Không nhét lời / giai điệu / riff của tác phẩm có bản quyền vào kho hoặc vào MusicXML “theo phong cách”.
- Không giả vờ đã commit / merge trừ khi user yêu cầu rõ.
- Không invent Step 5 / pipeline vendor (Suno, Udio, …) hay path knowledge không có trong `catalog.yml`.

## 1. Suy ra BASE URL

Nếu user gửi link tới file này (blob hoặc raw), suy ra:

- `OWNER`, `REPO`, `BRANCH`
- `REPO_RAW = https://raw.githubusercontent.com/OWNER/REPO/BRANCH`
- `REPO_BLOB = https://github.com/OWNER/REPO/blob/BRANCH`

Mọi path trong catalog tính từ **root repo**. Fetch: `REPO_RAW + "/" + path`.

Chi tiết: [meta/link-scheme.md](meta/link-scheme.md).

## 2. Hai chức năng

| # | Tên | Khi nào |
|---|-----|---------|
| 1 | Sáng tác 4 bước → MusicXML | User muốn bài hát / bản phối |
| 2a | Curator | Bổ sung / làm giàu kho |
| 2b | Improver | Sau lần chạy không như ý — đề xuất sửa quy trình/tài liệu/kiến thức |

Nếu user chưa nói rõ: hỏi chức năng, rồi bước (1/2/3/4/cả chuỗi) hoặc curator/improver.

## 3. Workspace editor vs chỉ có link

**Đang ở git workspace (Cursor, v.v.):**

- Chức năng 1 → ghi vào `runs/compose/<run-id>/`
- Chức năng 2 → ghi vào `runs/upgrade/<run-id>/` (đề xuất trong `proposed/`)
- `<run-id>` = `YYYY-MM-DD-<slug>`
- **Cấm** ghi đè `docs/m-guide/` trừ khi user nói: merge / áp dụng / sửa tài liệu gốc / chấp nhận đề xuất.
- Xem [runs/README.md](../../runs/README.md) và [pipeline/merge-policy.md](pipeline/merge-policy.md).

**Chỉ có link GitHub (không workspace):**

- Xuất artifact trong chat theo template `artifacts/`.
- Gợi ý path `runs/...` nếu user muốn lưu.
- Không bịa là đã sửa repo.

## 4. Fetch tối thiểu trước khi làm việc

Luôn: file này, [catalog.yml](catalog.yml), [meta/standards.md](meta/standards.md), [meta/link-scheme.md](meta/link-scheme.md).

| Việc | Thêm |
|------|------|
| Bước 1 | `prompt-craft/*`, `artifacts/meta-prompt.template.md`, `pipeline/step-01-meta-prompt.md` |
| Bước 2 | meta-prompt (user), `pipeline/step-02-specialized-prompts.md`, catalog đủ, template compose/arrange |
| Bước 3 | compose-prompt, mọi URL `DOC_REFS` compose, `pipeline/step-03-compose.md`, `meta/song-request-schema.md`, knowledge tagged compose/musicxml **+** melody-invention, anti-patterns, quality-gate, lyric-melody-fit, **piano-reduction**, musicxml safe-patterns/importer-profile, composition-notes template |
| Bước 4 | MusicXML Bước 3, arrange-prompt, `DOC_REFS` arrange, `pipeline/step-04-arrange.md`, knowledge arrange/musicxml (section-energy, dynamics, **safe-patterns, importer-profile**) **+ piano-reduction** (tách lock progression vs texture) |
| Curator | `prompts/curator.md`, `meta/purpose.md`, `meta/page-template.md` |
| Improver | `prompts/improver.md`, `artifacts/run-review.template.md`, trang liên quan lỗi |
| Merge | Chỉ khi user yêu cầu: `pipeline/merge-policy.md` + `runs/upgrade/<id>/` |

**Không** nhét cả kho vào context. Dùng catalog để chọn; chỉ mở trang được trỏ.

## 5. Playbook nhanh chức năng 1

Chi tiết: [pipeline/overview.md](pipeline/overview.md).

1. **Meta-prompt** → `01-meta-prompt.md` — dạy AI Bước 2 đọc catalog và sinh 2 prompt + DOC_REFS. Không điền bài hát trừ khi user đã đưa.
2. **Hai prompt** → `02-compose-prompt.md` + `02-arrange-prompt.md` — chỉ dẫn trang, không nhét nguyên văn kho.
3. **Sáng tác** → `03-song.musicxml` + notes (bắt buộc `lyrics_by_section` + `music_quality_gate` gồm **`REQUIRE_PIANO_TEXTURE`** + `piano_texture`) trong **một lượt** — invent giai điệu, không file `03a`; lead sheet; piano reduction nghe được (không pad whole-note trên sung sections); không dàn đầy đủ. Gate FAIL → viết lại cả lead sheet (kể cả piano texture).
4. **Phối khí** → `04-arranged.musicxml` — nhiều part; khóa lời/giai điệu/**progression**; **được/phải** viết lại piano texture nếu P2 pad; contrast section; **bắt buộc** `importer_self_check PASS` **và** `piano_texture_check PASS` trước khi step4 done.

Mỗi bước dừng để user sửa. Thiếu đầu ra bước trước → user dán bản tương đương.

## 6. Playbook nhanh chức năng 2

- **Curator:** [prompts/curator.md](prompts/curator.md) → lỗ hổng → tìm mạng → file trong `runs/upgrade/<id>/proposed/` + changelog. Không ghi gốc.
- **Improver:** [prompts/improver.md](prompts/improver.md) + run-review → patch trong `proposed/`. Không ghi gốc.
- **Merge:** chỉ khi user yêu cầu rõ — copy `proposed/docs/m-guide/...` → `docs/m-guide/...`.

## 7. Thẻ phong cách

Tên tác phẩm/nghệ sĩ = nhãn. Lưu đặc trưng khái quát. Cấm sao chép nốt/lời/hook. Xem `knowledge/styles/`. Notes phải **echo đúng** `REFERENCE_STYLE` id từ compose-prompt.

## 8. Mẫu tin nhắn user

Chi tiết + prompt mẫu đầy đủ: [guides/chuc-nang-1-sang-tac.md](guides/chuc-nang-1-sang-tac.md).  
Cheatsheet ngắn: [artifacts/user-message-ai.md](artifacts/user-message-ai.md).
