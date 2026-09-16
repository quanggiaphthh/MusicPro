---
id: KNOW.ARR.DYNAMICS-STRUCTURE
type: knowledge
status: active
version: "1.0"
tags: [arrange, arrangement, compose]
serves-steps: [3, 4]
sources: []
last-updated: "2026-09-08"
---

# Động lực và cấu trúc tương phản trong phối khí

> **AI:** Đọc ở Bước 4 (và Bước 3 khi phác arc). Bổ sung cho [section-energy](section-energy.md): trang kia = thang energy/density 1–5; trang này = động lực ký hiệu + tương phản texture cụ thể.

## Dùng ở bước nào

- Bước 3 — phác arc động lực theo section.
- Bước 4 — gắn dynamics / layer / texture để hiện thực hóa arc.

## Constraints

- Không đổi lyric / melody / harmony đã locked chỉ để tạo climax.
- Dynamics trong MusicXML phải nhất quán với marking đã dùng (xem performance-markings).
- **Cấm** một pattern đệm/rhythm section giống hệt mọi section chỉ đổi hợp âm — làm mất tương phản lead sheet (Bước 4).
- Verse và Chorus phải khác mật độ layer hoặc articulation nghe được; Bridge không “Chorus nhẹ hơn một nấc” nếu notes Bước 3 đã yêu cầu đổi màu.

## Hints

| Mức | Ký hiệu | Cảm giác gợi ý |
| --- | ------- | -------------- |
| Rất nhỏ | pp | Mong manh |
| Nhỏ | p | Nhẹ |
| Vừa | mf | Kể chuyện |
| To | f | Cao trào |
| Rất to | ff | Bùng nổ |

Gợi ý theo đoạn (xu hướng):

| Đoạn | Động lực | Mật độ |
| ---- | -------- | ------ |
| Intro | p–mf | Ít layer |
| Verse | p–mf | Rhythm nhẹ |
| Pre-chorus | mf–f | Thêm layer |
| Chorus | f–ff | Dày hơn |
| Bridge | p–mf | Giảm / đổi màu |
| Outro | p–pp | Giảm dần |

Kỹ thuật tương phản: đổi texture (block ↔ arpeggio), đổi register, thêm/bớt part, đảo vai trò (đệm ↔ lead). Ballad thường tăng từ verse→chorus rồi hạ bridge trước final chorus — scaffold, không luật.

## Cách áp dụng

1. Vẽ arc động lực toàn bài (khớp thang 1–5 ở section-energy nếu đã dùng).
2. Chọn climax (thường final chorus).
3. Phân bổ layer theo đoạn; giữ headroom.
4. Kiểm tra bài không “một màu” giữa verse và chorus.

## Ví dụ ngắn (tự viết)

Intro piano p → verse piano+bass mf → pre thêm drums → chorus full f–ff → bridge chỉ piano+vocal p → final chorus full + pad ff.

## Related

- `KNOW.ARR.SECTION-ENERGY`
- `KNOW.ARR.ORCHESTRATION`
- `KNOW.ARR.INSTRUMENT-ROLES-REGISTER`
- `KNOW.MUSICXML.PERFORMANCE-MARKINGS`
