# One-shot AI Studio integration prompt

Upload **Music-Pro_Product_V1_Complete_2026-09-16.zip** and paste exactly:

```text
Tôi vừa upload file:

Music-Pro_Product_V1_Complete_2026-09-16.zip

Đây là gói Product V1 hoàn chỉnh, được tạo trên GitHub base:
7da6e629ac4610bfa5537d8deec0d9d2d85fb312

Nhiệm vụ của bạn CHỈ là áp dụng nguyên trạng gói này vào project hiện tại và kiểm tra tích hợp.

YÊU CẦU BẮT BUỘC:

1. Trước khi làm gì, xác nhận project hiện tại đang ở đúng base commit:
   7da6e629ac4610bfa5537d8deec0d9d2d85fb312
   Nếu KHÔNG đúng: DỪNG NGAY và báo current SHA. Không áp dụng ZIP.

2. Giải nén ZIP vào root project.
3. Giữ nguyên cấu trúc thư mục.
4. Ghi đè đúng các file trùng tên.
5. Không tự chỉnh sửa code.
6. Không refactor.
7. Không auto-fix.
8. Không thử workaround.
9. Không thêm/bớt/thay đổi dependency.
10. Không sửa Composer Core, validator, SongDNA, model routing hoặc Lyria ngoài đúng nội dung có sẵn trong ZIP.
11. Không gọi Gemini/Lyria để test.
12. Không commit/push.

Sau khi áp dụng patch, chỉ chạy đúng các lệnh:

npm install --no-audit --no-fund --package-lock=false
npm run lint
npm run build

Nếu cả ba PASS, chỉ báo:

base: PASS
install: PASS
lint: PASS
build: PASS

Nếu bất kỳ bước/lệnh nào FAIL:
- DỪNG NGAY
- Không sửa code
- Không auto-fix
- Không đổi dependency
- Không retry bằng workaround
- Gửi nguyên văn đầy đủ current SHA và log lỗi

Không làm thêm bất kỳ việc gì khác.
```
