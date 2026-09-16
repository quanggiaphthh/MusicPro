---
id: KNOW.MUSICXML.SAFE-PATTERNS
type: knowledge
status: active
version: "1.0"
tags: [compose, arrange, musicxml]
serves-steps: [3, 4]
sources:
  - "https://www.w3.org/2021/06/musicxml40/"
  - "docs/m-guide/knowledge/musicxml/anti-patterns.md"
last-updated: "2026-09-08"
---

# MusicXML — mẫu an toàn (subset dùng trong ProjectMusic00)

> **AI:** Chỉ dùng các mẫu dưới đây trừ khi user yêu cầu kỹ thuật nâng cao **và** bạn đã đối chiếu spec. Đây không phải toàn bộ MusicXML — là **profile an toàn** cho Flat / MuseScore.

## Dùng ở bước nào

- Bước 3 / 4 — khi viết note, direction, part-list, percussion.

## Constraints

### Header

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE score-partwise PUBLIC
  "-//Recordare//DTD MusicXML 4.0 Partwise//EN"
  "http://www.musicxml.org/dtds/partwise.dtd">
<score-partwise version="4.0">
```

- Không `xmlns:xsi` / schemaLocation trên `score-partwise` (theo profile kho hiện tại).

### score-part (có MIDI)

Mỗi `midi-instrument` **phải** có `score-instrument` cùng `id`:

```xml
<score-part id="P1">
  <part-name>Voice</part-name>
  <score-instrument id="P1-I1">
    <instrument-name>Voice</instrument-name>
  </score-instrument>
  <midi-instrument id="P1-I1">
    <midi-channel>1</midi-channel>
    <midi-program>53</midi-program>
  </midi-instrument>
</score-part>
```

### direction — mỗi direction-type một loại

**Cấm** nhét `words` và `dynamics` vào cùng một `<direction-type>`. Đúng:

```xml
<direction placement="above">
  <direction-type>
    <words>CHORUS</words>
  </direction-type>
  <direction-type>
    <dynamics><f/></dynamics>
  </direction-type>
</direction>
```

Metronome (một child `metronome` trong direction-type — OK):

```xml
<direction placement="above">
  <direction-type>
    <metronome>
      <beat-unit>quarter</beat-unit>
      <per-minute>112</per-minute>
    </metronome>
  </direction-type>
  <sound tempo="112"/>
</direction>
```

### Note pitched (lead sheet)

```xml
<note>
  <pitch>
    <step>G</step>
    <octave>4</octave>
  </pitch>
  <duration>2</duration>
  <voice>1</voice>
  <type>quarter</type>
  <lyric number="1">
    <syllabic>single</syllabic>
    <text>Yêu</text>
  </lyric>
</note>
```

### Harmony

```xml
<harmony>
  <root><root-step>C</root-step></root>
  <kind>major</kind>
</harmony>
```

Không `<kind/>` rỗng.

### Percussion / drums (Bước 4) — hạn chế

- Flat và nhiều importer **dễ lỗi** với drum kit phức tạp (nhiều `score-instrument` + `unpitched` + channel 10).
- **Mặc định Bước 4:** ưu tiên pitched parts (voice, piano, bass, guitar, strings, pad). Trống: **một** kit đơn giản hoặc bỏ trống / dùng rhythm gợi ý bằng pitched percussion nhẹ — ghi tradeoff trong arrangement notes.
- Nếu vẫn viết drums: mỗi note `unpitched` phải có `<instrument id="..."/>` khớp `score-instrument`; clef `percussion`; kiểm importer trước khi handoff.

## Hints

- Bước 3: Voice + Piano (± harmony) đủ. Đừng nhồi 7 part nếu chưa chắc schema.
- Pretty-print; UTF-8; escape `&`.
- Khi FAIL import: đối chiếu [anti-patterns](anti-patterns.md) và [importer-profile](importer-profile.md).

## Related

- `KNOW.MUSICXML.CANONICAL`
- `KNOW.MUSICXML.ANTI-PATTERNS`
- `KNOW.MUSICXML.IMPORTER-PROFILE`
