---
id: KNOW.MUSICXML.CANONICAL
type: knowledge
status: active
version: "1.0"
tags: [compose, arrange, musicxml]
serves-steps: [3, 4]
sources:
  - "https://www.w3.org/2021/06/musicxml40/"
  - "https://www.musicxml.com/for-developers/"
  - "https://github.com/w3c/musicxml"
last-updated: "2026-09-08"
---

# MusicXML — nguồn chuẩn (không viết từ điển riêng)

> **AI:** **Không** bịa schema / từ điển element. Nguồn chân lý format = **MusicXML 4.0** của W3C Music Notation Community Group. Kho này chỉ giữ **profile hẹp** (constraints + anti-patterns + mẫu an toàn) để AI và importer (Flat, MuseScore…) đỡ lệch.

## Dùng ở bước nào

- Bước 3 / 4 — trước khi xuất `.musicxml`.

## Constraints

- Tuân **MusicXML 4.0 partwise**. Spec / docs: [w3.org MusicXML 4.0](https://www.w3.org/2021/06/musicxml40/).
- Khi nghi ngờ cú pháp element: mở trang element trên spec W3C (hoặc [musicxml.com for developers](https://www.musicxml.com/for-developers/)) — **không** suy diễn từ trí nhớ nếu xung đột với profile kho.
- Kho **không** thay thế XSD/DTD đầy đủ. Không copy cả schema vào repo.
- Profile kho (`rules`, `anti-patterns`, `safe-patterns`, `importer-profile`) **thắt thêm** so với spec khi cần tương thích Flat/importer — nếu xung đột: **profile kho thắng** cho output ProjectMusic00; ghi tradeoff trong notes.

## Hints — nên làm gì thay vì “từ điển tự viết”

| Cách | Khi nào |
|------|---------|
| Spec W3C / musicxml.com | Cú pháp element, content model |
| Profile kho | Danh sách cấm + mẫu lead sheet / arrange tối thiểu đã kiểm |
| Fixture FAIL trong `runs/upgrade/.../fixtures/` | Ví dụ file importer từ chối |
| Validator ngoài (`xmllint`, XSD) | Tuỳ môi trường — khuyến nghị, không bắt buộc CI |

**Không** cần lập “từ điển MusicXML” hàng nghìn element trong m-guide. Chỉ cần: (1) link chuẩn, (2) anti-patterns thực tế, (3) safe patterns copy được.

## Related

- `KNOW.MUSICXML.RULES`
- `KNOW.MUSICXML.ANTI-PATTERNS`
- `KNOW.MUSICXML.SAFE-PATTERNS`
- `KNOW.MUSICXML.IMPORTER-PROFILE`
