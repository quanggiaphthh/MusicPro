# Upload vào Google AI Studio

1. Upload ZIP vào workspace hiện tại.
2. Giải nén vào root project và ghi đè đúng các file trong ZIP.
3. Không auto-fix/refactor, không đổi dependency, không commit/push.
4. Chạy:
   - `npm run lint`
   - nếu PASS: `npm run build`
5. Nếu cả hai PASS: mở Development App URL, vào **Dự án / Lịch sử**, chọn Lead Sheet hiện tại và xác nhận nút **Phối khí** xuất hiện ở phía trên workspace.
6. Bấm **Phối khí** đúng 1 lần.
7. Nếu PASS, báo `project-arrangement-runtime: PASS`.
8. Nếu FAIL, không retry; gửi nguyên văn lỗi hiển thị trên UI và server log gần nhất của `/api/compose/prepare` hoặc `/api/compose/arrange`.
