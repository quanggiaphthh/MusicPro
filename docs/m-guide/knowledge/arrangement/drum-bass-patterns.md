---
id: KNOW.ARR.DRUM-BASS-PATTERNS
type: knowledge
status: active
version: "1.0"
tags: [arrange, arrangement, rhythm-form]
serves-steps: [4]
sources: []
last-updated: "2026-09-08"
---

# Drum và bass patterns theo section

> **AI:** Đọc ở Bước 4 khi viết part trống/bass. Bổ sung [section-energy](section-energy.md) và [groove-and-syncopation](../rhythm-form/groove-and-syncopation.md) bằng pattern cụ thể — vẫn là **hint**.

## Dùng ở bước nào

- Bước 4 — gán groove trống/bass theo section trên bản phối.

## Constraints

- Không đổi lyric / melody / harmony đã locked chỉ để khớp một pattern gợi ý.
- Tôn trọng instrumentation đã DEFINED (nếu không có drums/bass thì bỏ qua trang này).
- **Importer (Flat):** trang này là **ý tưởng groove**, không phải giấy phép xuất kit `unpitched` đa instrument. Mặc định Bước 4: **omit drums** hoặc 1 sound tối giản theo [safe-patterns](../musicxml/safe-patterns.md) / [importer-profile](../musicxml/importer-profile.md). Kit GM đầy đủ → rủi ro Flat reject (đã gặp trên run v2).

## Hints

### Nguyên tắc

- Verse: thưa, ít fill.
- Pre: tăng mật độ / fill nhẹ cuối cụm.
- Chorus: dày nhất; kick rõ; hi-hat/ride nhanh hơn nếu genre cho phép.
- Bridge: đổi màu (breakdown hoặc pattern khác), không nhất thiết “to hơn”.
- Bass **khóa** với kick ở phách neo; thêm chạy ở pre/bridge khi cần tension.

| Section | Kick (gợi ý) | Snare | Hi-hat / ride | Bass |
| ------- | ------------ | ----- | ------------- | ---- |
| Verse | 1 & 3 (hoặc thưa hơn) | 2 & 4 | 8th | Root / root–5th |
| Pre | Dày dần | 2 & 4 | 8th→16th hoặc ride | Thêm chạy lên |
| Chorus | Four-on-floor **hoặc** kick mạnh theo genre | 2 & 4 (± ghost) | Dày hơn verse | Syncopation nhẹ OK |
| Bridge | Thưa / tắt cục bộ | Nhẹ hoặc bỏ | Đơn giản | Pedal hoặc pattern mới |

Ballad thường **không** four-on-floor ở chorus — ưu tiên half-time / kick thưa. Rock/EDM mới hay dùng kick đều.

Hai pattern chính (verse vs chorus) + biến thể pre/bridge thường đủ.

## Cách áp dụng

1. Đọc form + energy arc từ lead sheet / notes.
2. Chọn cặp pattern verse/chorus khớp GENRE / style card.
3. Viết drum part; khóa bass vào kick ở điểm neo.
4. Fill ngắn cuối section quan trọng (vào chorus, ra bridge).

## Ví dụ ngắn (tự viết)

- Verse: kick 1+3, snare 2+4, HH 8th; bass root–5th.
- Pre: thêm kick; bass G–A–B–C dẫn chorus C.
- Chorus: kick đều hoặc mạnh hơn; bass syncop nhẹ.
- Bridge: kick thưa, bass pedal.

## Related

- `KNOW.ARR.SECTION-ENERGY`
- `KNOW.ARR.INTRO-OUTRO-TRANSITION`
- `KNOW.RHYTHM.GROOVE-SYNCOPATION`
- `KNOW.ARR.INSTRUMENT-ROLES-REGISTER`
