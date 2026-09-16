---
id: STYLE.VN.VPOP-BALLAD
type: style-card
status: active
version: "1.2"
tags: [style, compose, arrange, vietnamese]
serves-steps: [3, 4]
sources:
  - "https://www.discogs.com/style/v-pop"
last-updated: "2026-09-08"
---

# Thẻ: V-Pop Ballad

> **AI:** Khi user muốn ballad V-Pop đương đại. Sáng tác **cùng hướng** — không sao chép bài cụ thể. Nhãn era dưới đây chỉ để định vị màu sắc, không phải nguồn trích dẫn.

## Nhãn tham chiếu (không phải nguồn copy)

- works_or_artists_as_labels: ["V-Pop ballad đầu 2000s (nhạc trẻ đầu 2000s)", "V-Pop ballad 2010s mainstream", "V-Pop ballad acoustic-electronic blend 2020s", "ballad indie-pop Việt hiện nay"]

## Đặc trưng khái quát

- **harmony_language:** I–V–vi–IV và biến thể; pre/bridge có thể ii–V–I hoặc climb IV→V→I; modulation lên quãng 4/5 ở cao trào (tiết chế).
- **form_tendencies:** Verse → Pre → Chorus → Bridge → Chorus; intro 4–8 ô tùy chọn.
- **groove_tempo_band:** khoảng 65–80 BPM; đôi khi 85–90 với feel half-time.
- **typical_texture:** verse thưa (piano/guitar + vocal); pre dày dần; chorus thêm strings / synth pad / electronic drums; bridge rút rồi dồn chorus cuối.
- **melodic_behavior:** verse bước liền; chorus nâng register, hook ngắn lặp; tận dụng thanh điệu ở hook (xem `KNOW.VI.TONE-MELODY`).
- **lyric_language_feel:** ngôi 1, tình cảm cá nhân; hook lặp; từ láy / thanh tạo vần nội tại (theo CONCEPT user).
- **arrangement_palette:** piano, acoustic guitar, electric bass + strings, synth pad, electronic kit — **acoustic–electronic blend**.

## Constraints khi dùng thẻ

- Không tái tạo nốt / lời / hook độc bản.
- Chỉ ánh xạ đặc trưng trên vào trường DELEGATED.
- Ưu tiên giữ nghĩa từ ở hook khi áp dụng thanh điệu.

## Hints

- Bước 3: piano reduction = broken chord / half-note pulse (intro pad OK) — `KNOW.HARMONY.PIANO-REDUCTION`; thiếu pulse trên sung sections → gate FAIL (`REQUIRE_PIANO_TEXTURE`).
- Bước 4: khóa lyric/melody/progression; **được và thường phải** viết lại piano texture theo section energy; **cấm** “P2 unchanged” khi input là pad.

## Hints — cổ điển hơn vs hiện đại hơn (trong cùng dòng)

- Cổ điển hơn (nhạc trẻ đầu 2000s / ballad V-Pop truyền thống): piano + strings làm trục, ít electronic, tempo thường ~60–70 BPM, cao trào dựa vào belt giọng hát.
- Hiện đại hơn (2010s–2020s acoustic-electronic blend): có thể thêm EDM nhẹ (riser, sidechain) ở climax, synth pad và electronic drum song song với nhạc cụ mộc.
- Cổ điển hơn: harmonic rhythm chậm, ít dùng borrowed chord; modulation nếu có thường trọn cung ở chorus cuối.
- Hiện đại hơn: có thể giữ nguyên tông nhưng tăng density/texture layer để tạo cao trào thay vì đổi tông.
- Kế thừa chung từ `STYLE.POP.BALLAD-GENERIC`; ưu tiên thẻ này khi user nói V-Pop.

## Related

- `STYLE.POP.BALLAD-GENERIC`, `KNOW.VI.TONE-MELODY`, `KNOW.ARR.GENRE-TEXTURES`, `KNOW.HARMONY.PIANO-REDUCTION`
