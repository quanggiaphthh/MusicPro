# MUSIC-PRO v1.4.1 — Upload đúng một lần vào AI Studio

Áp dụng trên CURRENT workspace có Product V1 + Knowledge Unification + Arrangement Resume + Score Theater.

## 1. Tích hợp

Upload **ZIP v1.4.1 FINAL VERIFIED này một lần**, extract tại project root, giữ nguyên relative paths và overwrite file trùng. Sau extract chạy:

```bash
node scripts/apply-auto-production-v1.4.1.mjs
```

Installer FAIL → **STOP** và trả raw log. Không auto-fix, không sửa tay theo phỏng đoán, không đổi dependency/model/validator, không commit/push GitHub.

## 2. Verification bắt buộc

```bash
for f in tests/compose/*.test.ts; do npx tsx "$f" || exit 1; done
npx tsx tests/music/project-package-policy.test.ts
npx tsx tests/music/project-package.test.ts
npx tsx tests/music/stale-package-evidence-policy.test.ts
npx tsx tests/music/score-playback-visuals.test.ts
npx tsx tests/music/score-playback-backward-gap.test.ts
npx tsx tests/music/score-theater-policy.test.ts
npx tsx tests/projects/arrangement-resume.test.ts
npm run lint
npm run build
```

Bất kỳ lệnh nào FAIL → **STOP**, trả full raw output. Không tự sửa.

## 3. Runtime acceptance trên iPad

1. Sáng tác mở mặc định ở `Tự động`; bấm `Tạo bài hát` đúng một lần và không click trung gian Bước 1→4.
2. Có `POST /api/compose/run-stream`, milestone xuất hiện trước result cuối. Fallback chỉ dùng khi endpoint chắc chắn không hỗ trợ (404/405/501 hoặc response không có body); lỗi transport mơ hồ phải STOP, không chạy pipeline lần hai.
3. Elapsed + ETA cập nhật; quá ETA hiện `lâu hơn dự kiến`; Dừng phải hiện trạng thái `Đã dừng quy trình` và giữ artifact đã hoàn tất.
4. Có summary card Step 1–4; Step 3/4 hiện quality state.
5. Step 3 Auto/Manual dùng cùng quality runner; required weak, ≥3 weak hoặc score <80 không PASS.
6. Step 4 chỉ chạy sau Composition PASS; Arrangement score <84 không PASS; retry bounded, không loop vô hạn. User-requested short/demo/sketch dùng short-form contract; full song vẫn giữ completeness gate.
7. Pre-Chorus không được dùng thay Chorus trong hook/contrast audit.
8. Fail cuối vẫn giữ candidate với nhãn `cần rà soát`; không tự CERTIFIED.
9. Auto/Manual/Project Resume giữ exact lead `<part>` + `<score-part>` metadata; harmony exact theo measure; key/meter/BPM/section/lyrics/melody không regression.
10. Step 3 sung sections không whole-note/pad-dominant; Step 4 chỉ chấp nhận Piano pad khi pitched groove layer khác thực sự mang nhịp.
11. Complex percussion >2 unpitched IDs là blocker; tất cả part phải dùng cùng exact measure grid liên tục và part IDs phải duy nhất.
12. Project đang dirty phải được flush/save trước khi run mới thay output.
13. Edit/restore/section-AI làm certification cũ thành STALE nhưng giữ audit evidence; exact current FAIL = NOT_CERTIFIED; exact current PASS = CERTIFIED.
14. Studio/Lyria chỉ mở khi exact active revision CERTIFIED.
15. Production ZIP: MASTER/LEAD đúng revision; stale evidence nằm trong `production/stale-evidence/`; provenance/readiness IDs khớp active/evaluated/certified revisions.
16. Score Theater: manual scroll không snap-back; measure highlight tiến đúng; note glow không được sai. Seek lùi qua rest về nốt trước phải reset cursor đúng; seek không tự scroll; recenter đúng một lần.
17. SoundFont playback iPad audible; Mixer/Phiên bản/Xuất file không regression.

## 4. Kết quả trả về

```text
auto-production-tests: PASS|FAIL
installer-v141: PASS|FAIL
installer-upgrade-v12: PASS|FAIL
installer-upgrade-v13: PASS|FAIL
installer-upgrade-v14: PASS|FAIL
installer-foreign-route-guard: PASS|FAIL
installer-tamper-guard: PASS|FAIL
installer-idempotence: PASS|FAIL
lint: PASS|FAIL
build: PASS|FAIL
server-ndjson-stream: PASS|FAIL
stream-fallback: PASS|FAIL
ambiguous-stream-transport-guard: PASS|FAIL
auto-one-click-4-step: PASS|FAIL
auto-progress-eta-summary: PASS|FAIL
cancel-state: PASS|FAIL
dirty-project-preservation: PASS|FAIL
composition-quality-gate: PASS|FAIL
arrangement-quality-gate: PASS|FAIL
prechorus-classification: PASS|FAIL
short-form-contract: PASS|FAIL
importer-measure-grid-and-part-ids: PASS|FAIL
master-identity-lock: PASS|FAIL
harmony-measure-lock: PASS|FAIL
revision-bound-certification: PASS|FAIL
production-package: PASS|FAIL
score-theater-manual-scroll: PASS|FAIL
score-theater-measure-highlight: PASS|FAIL
score-theater-note-glow: PASS|DEGRADED|FAIL
score-theater-backward-seek-rest-gap: PASS|FAIL
score-theater-recenter: PASS|FAIL
ipad-audio-regression: PASS|FAIL
```

Chỉ sau khi toàn bộ acceptance bắt buộc PASS mới xin phép người dùng commit/push GitHub.
