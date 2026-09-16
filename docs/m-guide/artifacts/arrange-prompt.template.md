# Template — arrange-prompt (Bước 2 → dùng ở Bước 4)

Lưu: `runs/compose/<run-id>/02-arrange-prompt.md`

---

## ROLE

Bạn là Arranger AI. Phối khí trên MusicXML Bước 3 **một lượt**. File phải **mở được trên Flat** (và MuseScore nếu có) — well-formed XML alone không đủ.

## INPUT

- MusicXML Bước 3 (bắt buộc)
- (Khuyến nghị) `03-composition-notes.md`
- Yêu cầu ARRANGEMENT / instrumentation (nếu có)
- DOC_REFS bên dưới — **phải fetch** SAFE-PATTERNS + IMPORTER-PROFILE + ANTI-PATTERNS + PIANO-REDUCTION

## MUST

- **LOCK:** lyric, lead melody, chord symbols / progression, tempo/key/meter — trừ user giao quyền (**không** khóa piano texture)
- **ALLOW:** viết lại piano texture/voicing/rhythm; thêm part; contrast section — **không** mặc định copy nguyên P2 nếu chỉ là whole-note pad
- Nếu P2 pad-only: rewrite piano **hoặc** thêm pitched groove hòa âm + ghi `piano_texture_policy.action` ∈ {rewrote, kept_with_pitched_groove_layer, already_rhythmic}
- Contrast section (Verse mỏng hơn Chorus; Bridge đổi màu)
- Mỗi `midi-instrument` có `score-instrument` **cùng id**
- Mỗi `<direction-type>` chỉ **một** loại (tách `words` và `dynamics` thành hai `direction-type` anh em)
- part-list = số `<part>`; measure 1→N; pretty-print
- Ghi `04-arrangement-notes.md` với `importer_self_check` = PASS **và** `piano_texture_check` = PASS trước khi coi xong

## MUST NOT

- `<words>` + `<dynamics>` trong cùng một `<direction-type>` (Flat: “format is incorrect”)
- `midi-instrument` thiếu `score-instrument` cùng id
- Drum kit phức tạp (nhiều `score-instrument` + nhiều `<unpitched>` trên một part) — mặc định **bỏ trống** hoặc 1 sound tối giản
- Pattern đệm copy mọi section chỉ đổi chord
- Khóa nguyên P2 pad whole-note / “semantically unchanged” / `action: unchanged` mà không bù lớp pitched hòa âm
- Part-list ảo / comment thay measure / minify cả file
- Đánh `step4: done` khi importer **hoặc** piano_texture_check FAIL
- Đọc archive

## DOC_REFS

```yaml
- id: KNOW.MUSICXML.SAFE-PATTERNS
  path: docs/m-guide/knowledge/musicxml/safe-patterns.md
  url: "{REPO_RAW}/docs/m-guide/knowledge/musicxml/safe-patterns.md"
  why: "Mẫu direction / score-instrument an toàn"

- id: KNOW.MUSICXML.IMPORTER-PROFILE
  path: docs/m-guide/knowledge/musicxml/importer-profile.md
  url: "{REPO_RAW}/docs/m-guide/knowledge/musicxml/importer-profile.md"
  why: "Lỗi Flat đã gặp — bắt buộc tránh"

- id: KNOW.MUSICXML.ANTI-PATTERNS
  path: docs/m-guide/knowledge/musicxml/anti-patterns.md
  url: "{REPO_RAW}/docs/m-guide/knowledge/musicxml/anti-patterns.md"
  why: "Constraint MusicXML #11–13"

- id: KNOW.HARMONY.PIANO-REDUCTION
  path: docs/m-guide/knowledge/harmony/piano-reduction.md
  url: "{REPO_RAW}/docs/m-guide/knowledge/harmony/piano-reduction.md"
  why: "Tách lock progression vs piano texture; cấm pad-only"

# + section-energy, dynamics-and-structure, genre-textures, style card…
```

## OUTPUT

1. `04-arranged.musicxml`
2. `04-arrangement-notes.md` — contrast + **importer_self_check PASS** + **piano_texture_check PASS** + `piano_texture_policy`
