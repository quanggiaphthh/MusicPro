# Music-Pro r3 Real Runtime Benchmark

Status: **NOT RUN in this local verification environment**.

Reason: `GEMINI_API_KEY` is unset and the supplied source snapshot contains no installed runtime dependencies. Results below must be produced in the dependency-complete AI Studio integration runner. Do not fabricate or infer scores from offline fixtures.

## Fixed benchmark configuration

Use the same style for all prompts and for any r2/r3 comparison: `STYLE.VN.VPOP-BALLAD`. Do not change model routing during this benchmark.

### Ten fixed prompts

1. **School nostalgia / hoa phượng** — Viết một ca khúc V-Pop ballad tiếng Việt về mùa chia tay cuối cấp, sân trường, hàng ghế đá và hoa phượng đỏ; cảm xúc trong trẻo, tiếc nuối nhưng không bi lụy.
2. **First love** — Viết một ca khúc V-Pop ballad tiếng Việt về mối tình đầu vụng về, những lần chờ nhau và cảm giác lần đầu biết nhớ một người; điệp khúc phải dễ nhớ, dễ hát.
3. **Family / homecoming** — Viết một ca khúc V-Pop ballad tiếng Việt về người con trở về nhà sau thời gian xa quê, bữa cơm gia đình và sự bình yên khi được ở cạnh cha mẹ.
4. **Rainy breakup** — Viết một ca khúc V-Pop ballad tiếng Việt về cuộc chia tay trong một đêm mưa; buồn sâu nhưng trưởng thành, không trách móc, hình ảnh mưa là motif xuyên suốt.
5. **Optimistic youth** — Viết một ca khúc V-Pop ballad/pop tiếng Việt về tuổi trẻ dám bắt đầu lại sau thất bại; năng lượng tích cực, điệp khúc mở rộng và có câu hook cổ vũ dễ nhớ.
6. **City-night romance** — Viết một ca khúc V-Pop ballad tiếng Việt về hai người yêu nhau giữa thành phố về đêm, ánh đèn, những con đường muộn và khoảnh khắc bình yên bên nhau.
7. **Friendship** — Viết một ca khúc V-Pop ballad tiếng Việt về tình bạn lâu năm, cùng đi qua khó khăn, có khoảng cách nhưng vẫn luôn có thể trở về với nhau.
8. **Quiet remembrance** — Viết một ca khúc V-Pop ballad tiếng Việt về việc lặng lẽ nhớ một người đã đi xa khỏi cuộc đời mình; tinh tế, ít kịch tính, ưu tiên hình ảnh và khoảng lặng.
9. **Summer travel** — Viết một ca khúc V-Pop tươi sáng tiếng Việt về chuyến đi mùa hè cùng những người thân thiết, biển, nắng, con đường dài và cảm giác tự do.
10. **Mature reconciliation** — Viết một ca khúc V-Pop ballad tiếng Việt về hai người trưởng thành gặp lại sau thời gian xa cách, nhìn nhận lỗi lầm, tha thứ và cân nhắc bắt đầu lại.

## Required metrics per run

Record only aggregate diagnostics; do not log full prompt, lyrics, SongCore payload, API key, or MusicXML.

| # | Theme | Terminal status | Step 3 wall time (ms) | Provider calls | Hook score | ToneGuard | Composition Quality | XML valid | Measures | Duration (s) | Patch used |
|---|---|---|---:|---:|---:|---:|---:|---|---:|---:|---|
| 1 | School nostalgia | NOT_RUN | — | — | — | — | — | — | — | — | — |
| 2 | First love | NOT_RUN | — | — | — | — | — | — | — | — | — |
| 3 | Family/homecoming | NOT_RUN | — | — | — | — | — | — | — | — | — |
| 4 | Rainy breakup | NOT_RUN | — | — | — | — | — | — | — | — | — |
| 5 | Optimistic youth | NOT_RUN | — | — | — | — | — | — | — | — | — |
| 6 | City-night romance | NOT_RUN | — | — | — | — | — | — | — | — | — |
| 7 | Friendship | NOT_RUN | — | — | — | — | — | — | — | — | — |
| 8 | Quiet remembrance | NOT_RUN | — | — | — | — | — | — | — | — | — |
| 9 | Summer travel | NOT_RUN | — | — | — | — | — | — | — | — | — |
| 10 | Mature reconciliation | NOT_RUN | — | — | — | — | — | — | — | — | — |

## Acceptance thresholds

- malformed MusicXML: 0/10
- terminal Step-3 artifact: >= 9/10
- normal provider calls: exactly 2
- maximum provider calls: <= 3
- full-song regenerations: 0
- accepted Composition Quality: >= 80
- background refresh/navigation: PASS
- explicit cancel: PASS
- median Step-3 wall time: lower than r2 baseline

## Human musical review

For all ten r3 candidates record: hook memorability, Vietnamese lyric intelligibility, melodic naturalness, Verse/Chorus contrast, Final Chorus development, piano playability/non-pad texture, and overall emotional fit.

No model-routing change is allowed until this benchmark is complete.
