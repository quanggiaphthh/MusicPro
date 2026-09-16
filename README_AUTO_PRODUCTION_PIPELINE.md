# Music-Pro Auto Production Pipeline v1.4.1 — 2026-09-16

Base audited: GitHub `main` SHA `6608e1e2fa620fd71f3356e063bac862ede6fdc5`.

## Mục tiêu

Product V1 chạy **một lần bấm, đúng 4 bước**, có progress stream thật, ETA thích nghi, summary card, quality gate máy kiểm tra, deterministic Master Identity Lock, revision-bound certification và production handoff có provenance; không sửa Composer Core đã khóa.

## Điểm chính v1.4.1

- `Tạo bài hát` tự chạy Bước 1 → 4; Manual/Từng bước vẫn giữ.
- `/api/compose/run-stream` trả NDJSON milestone/artifact/result. Chỉ fallback khi endpoint chắc chắn không hỗ trợ (404/405/501 hoặc response không có body); lỗi transport mơ hồ phải STOP để tránh duplicate Gemini generation/cost.
- Progress: elapsed, EWMA ETA, overdue wording, cancel state riêng, summary từng bước; event history bỏ payload XML/DNA/Blueprint/context lớn để giảm RAM trên iPad.
- Exact composition context được checkpoint từ Step 2; Lead Sheet/Arrangement đã hoàn tất được bảo toàn ngay cả khi stream acknowledgement hoặc local persistence gặp lỗi.
- Bắt đầu run mới phải flush/lưu project đang dirty trước, tránh mất chỉnh sửa khi autosave chưa hoàn tất.
- Step 3 Auto + Manual dùng chung Composition Quality Gate + bounded retry. Step 4 không chạy khi Step 3 chưa PASS.
- Step 4 Auto + Manual + Dự án/Lịch sử dùng chung arrangement production runner; không còn raw-arrangement save bypass.
- Master Identity Lock khôi phục exact lead `<part>` + `<score-part>` metadata trước arrangement audit.
- Quality contract kiểm lyric order, melody identity, exact harmony-by-measure, section order, key/meter/BPM, sung-section accompaniment, importer metadata, exact measure-grid giữa các part, part-ID uniqueness, unpitched safety và section density.
- Pre-Chorus không còn bị nhận nhầm thành Chorus trong quality audit.
- Composition gate tối thiểu 80, Arrangement gate 84 — đồng nhất với Production Readiness nên retry không dừng ở một “PASS” chưa đủ READY. Short/demo/sketch chỉ dùng short-form contract khi user yêu cầu rõ; full song không được hạ chuẩn.
- Certification gắn exact active revision: `CERTIFIED`, `NOT_CERTIFIED`, `STALE`, `MISSING`. Score edit/restore/section-AI giữ evidence audit nhưng thu hồi certification hiện hành.
- Production ZIP tách evidence của revision cũ vào `production/stale-evidence/`; MASTER luôn là active revision nên không trộn provenance cũ với master mới.
- Studio/Lyria chỉ mở khi exact active revision đang `CERTIFIED`.
- Score Theater: sửa hẹp helper backward-seek qua khoảng nghỉ; nếu OSMD cursor thực đang ở tương lai so với target thì reset trước khi tiến lại. Không đổi `MusicXMLViewer`, FollowCursor, recenter policy hay audio transport.

## Tích hợp

Extract ZIP tại project root rồi chạy:

```bash
node scripts/apply-auto-production-v1.4.1.mjs
```

Installer có exact-anchor guard, foreign-route/tamper guard, idempotence và upgrade path từ v1.2/v1.3/v1.4. Anchor lệch → script dừng, không sửa mò.

## Vùng khóa

Gói KHÔNG chứa/sửa:

- `server/music/composer.ts`
- `server/music/musicxml-validator.ts`
- `server/music/song-dna.ts`
- text model routing/fallback
- Lyria model/API selection
- SoundFont renderer / offline WAV / HTMLAudioElement transport
- `src/components/MusicXMLViewer.tsx`
- `src/components/ScorePlayer.tsx`

Chỉ `src/music/score-playback-visuals.ts` được thay hẹp để sửa backward-seek/rest-gap.

## Semantics sản phẩm

- Không có Step 5.
- Final MusicXML = **MASTER COMPOSITION**.
- `READY FOR PRODUCTION` = machine-enforced composition/arrangement handoff contract PASS trên exact active revision; **không** đồng nghĩa commercial audio master.
- SoundFont WAV = reference audio; Lyria/MP3 = downstream optional interpretation.
- Vietnamese tone–melody/prosody semantic audit đầy đủ và speak-test chưa được coi là machine-proven PASS; canonical KB được nạp bắt buộc nhưng không bị giản lược thành luật dấu-thanh máy móc.

## Release gate

Local overlay PASS chưa đủ để commit/push. Bắt buộc còn full workspace tests, `npm run lint`, `npm run build`, Gemini runtime và iPad acceptance. Chỉ sau toàn bộ acceptance PASS mới xin phép người dùng commit/push GitHub.
