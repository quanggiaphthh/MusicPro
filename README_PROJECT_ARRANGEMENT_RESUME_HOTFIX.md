# Music-Pro — Project Arrangement Resume Hotfix

Mục tiêu: cho phép phối khí trực tiếp từ một Lead Sheet đã lưu trong **Dự án / Lịch sử**, không bắt người dùng tạo lại bài.

## Thay đổi sản phẩm

- Thêm nút **Phối khí** ở thanh tác vụ của Result Workspace khi phiên bản đang mở là Lead Sheet chuẩn của dự án.
- Dự án mới lưu thêm `compositionContext` gồm `arrangePrompt`, `arrangeDocRefs`, `songRequest` và các dữ liệu liên quan từ Bước 1–2.
- Với dự án cũ chưa có context, ứng dụng tự gọi `/api/compose/prepare` bằng `idea + style` để tái tạo context đúng luồng, sau đó gọi `/api/compose/arrange` bằng chính Lead Sheet đã lưu.
- Bản phối thành công được lưu thành revision mới: `reason = arrange`, `label = Bản phối`.
- Lead Sheet gốc không bị ghi đè. Nếu phối khí thất bại, Lead Sheet vẫn giữ nguyên.

## Không thay đổi

- Không sửa validator MusicXML.
- Không sửa Composer model routing.
- Không sửa maxOutputTokens/thinkingLevel của hotfix output-budget đã áp dụng.
- Không sửa SongDNA, Lyria, SoundFont hay Knowledge Base.
- Không commit/push GitHub.

## Tệp production

- `src/projects/types.ts`
- `src/projects/arrangement-resume.ts`
- `src/components/ResultWorkspace.tsx`
- `src/views/RunsView.tsx`
- `src/views/ComposeView.tsx`

## Tương thích dữ liệu

`compositionContext` là trường optional trong `MusicProject`, nên không cần migration IndexedDB. Dự án cũ vẫn mở bình thường; context chỉ được tái tạo khi người dùng bấm **Phối khí**.
