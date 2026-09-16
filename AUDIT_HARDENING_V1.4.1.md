# Music-Pro v1.4.1 — Pre-flight Audit & Hardening Notes

Base: GitHub main `6608e1e2fa620fd71f3356e063bac862ede6fdc5`.

## Lỗi/edge case đã khóa bằng regression

- installer fail-closed khi gặp `/api/compose/run-stream` không có marker Music-Pro đã biết; không tự “nhận nuôi” foreign handler;
- installer có marker hiện hành nhưng integration block bị tamper/drift cũng phải STOP;
- upgrade trực tiếp v1.2/v1.3/v1.4 → v1.4.1 và idempotence;
- lỗi transport mơ hồ trước khi nhận stream **không** tự fallback để tránh duplicate Gemini generation/cost; fallback chỉ dùng khi endpoint chắc chắn không hỗ trợ (404/405/501 hoặc response không có body);
- short/demo/sketch do user yêu cầu dùng short-form contract: không bị ép ≥150 giây/full Final Chorus; full song vẫn giữ gate cứng hiện hành;
- số lượng nhạc cụ không còn là hard gate tùy tiện; orchestration vẫn phải tôn trọng ARRANGEMENT/style đã khóa;
- importer-safety kiểm exact measure grid giữa các part và part IDs phải duy nhất;
- protocol error cancel reader/release lock; exact Step-2 context được checkpoint; project dirty được flush/save trước run mới;
- stale certification không hiển thị PASS/current và stale evidence không trộn với active MASTER package;
- event history không giữ XML/DNA/Blueprint/context lớn; cancel state riêng; Pre-Chorus không bị nhận nhầm thành Chorus;
- quality thresholds khớp readiness 80/84; backward seek qua khoảng nghỉ reset OSMD cursor theo vị trí thực;
- master identity/harmony/lyrics/section/importer checks giữ contract production hiện tại.

## Giới hạn cố ý chưa biến thành machine PASS

Vietnamese tone–melody/prosody semantic audit và speak-test cần mapping lyric-note-beat/semantic evidence giàu hơn. Canonical KB được nạp bắt buộc ở Step 3, nhưng v1.4.1 không dùng công thức dấu thanh đơn giản để tạo false confidence.

`READY FOR PRODUCTION` là **production-ready composition/handoff**, không phải commercial mastered audio.

Nút Dừng abort stream/client orchestration và chặn bước tiếp theo. Composer Core hiện không nhận `AbortSignal` vào provider call đang chạy, nên một request model đã bắt đầu có thể hoàn tất phía server trước khi abort có hiệu lực; v1.4.1 không tuyên bố provider-level cancellation.

## Vùng khóa

Composer, validator, SongDNA, text model routing, Lyria và SoundFont/audio transport không bị sửa. Score Theater chỉ thay helper `score-playback-visuals.ts`; `MusicXMLViewer` và `ScorePlayer` giữ nguyên.
