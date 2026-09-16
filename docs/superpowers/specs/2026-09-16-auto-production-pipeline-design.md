# Music-Pro Auto Production Pipeline Design

## Goal
Giữ đúng 4 bước Composer nhưng biến UX mặc định thành một lần bấm chạy tự động từ ý tưởng đến Final MusicXML, có tiến độ/ETA, tóm tắt từng bước, quality gates bắt buộc và production-readiness report.

## Constraints
- Không sửa `server/music/composer.ts`, `server/music/musicxml-validator.ts`, SongDNA, model routing/fallback, Lyria, SoundFont transport.
- Final MusicXML vẫn là MASTER COMPOSITION.
- Manual 4-step flow vẫn tồn tại trong chế độ nâng cao.
- Retry chất lượng tối đa 1 lần cho Bước 3 và 1 lần cho Bước 4; technical retry nội bộ của Composer giữ nguyên.
- Không commit/push GitHub.

## Architecture
1. `src/compose/auto-compose.ts`: orchestrator phía client gọi API prepare → lead sheet → blueprint/SongDNA audit → arrange → blueprint/SongDNA audit. Emit progress events; retry khi quality gate FAIL.
2. `src/compose/production-quality.ts`: deterministic quality contracts dùng SongDNA + MusicXML, không dựa vào generator tự tuyên bố PASS.
3. `src/components/compose/AutoComposeProgress.tsx`: timeline 4 bước, stage stream, progress, elapsed/ETA và summary cards.
4. `ComposeView`: Auto là mặc định; Manual là chế độ nâng cao. Lead Sheet được lưu ngay khi PASS; arrangement thành revision mới; production snapshot lưu trong project.
5. `project-package.ts`: bổ sung production handoff artifacts nhưng giữ backward-compatible files.
6. `knowledge.ts`: bắt buộc inject core quality docs vào Step 3/4 mà không sửa Composer.

## Quality contract
Composition gate: completeness/duration, lyrics, structure+chorus, chorus hook, section contrast, bridge contrast, final chorus development, vocal range, accompaniment texture.
Arrangement gate: duration, instrumentation depth, key/mode/meter/BPM preservation, lyrics+melody preservation, section density contrast, piano texture, importer identity consistency.
Production readiness PASS chỉ khi cả hai gate PASS, đạt ngưỡng điểm tối thiểu và không còn critical blocker. Identity lock kiểm tra thứ tự lời, melody LCS, harmonic progression, section sequence, part coverage và importer metadata pairing.

## Resilience / ETA
- ETA dùng EWMA từ các lần chạy thành công; lần đầu dùng baseline 240 giây.
- Nếu vượt ETA, UI chuyển sang wording `lâu hơn dự kiến`, không đếm ngược giả về 00:00.
- Khi quality retry cuối vẫn FAIL, candidate cuối được emit/persist để người dùng nghe/chỉnh, nhưng pipeline dừng trước bước tiếp theo hoặc gắn `QUALITY REVIEW REQUIRED`.
- Production snapshot lưu provenance của pipeline/quality contract/source SHA/input.
