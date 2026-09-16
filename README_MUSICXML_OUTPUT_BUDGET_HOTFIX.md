# Music-Pro — MusicXML Output Budget Hotfix

## Root cause
Runtime diagnostics captured a fallback Lead Sheet ending mid-tag:
- code: `MUSICXML_INVALID_AFTER_RETRY`
- xmlLength: 3406
- hasClosingScorePartwise: false
- likelyTruncated: true
- tail ended inside `<text>Dòng</text...`

The Composer was requesting a complete 180–240 second MusicXML score while both Lead Sheet and Arrangement generation calls were capped at `maxOutputTokens: 8192`.

## Fix
A deterministic patch script updates only the two MusicXML generation configs in `server/music/composer.ts`:
- Lead Sheet: `maxOutputTokens: 32768`
- Arrangement: `maxOutputTokens: 65536`
- Both: `thinkingConfig: { thinkingLevel: 'minimal' }`

The validator, model routing, retry count, SongDNA, Lyria, and knowledge corpus are unchanged.

## Apply
From project root:

```bash
node tools/apply-musicxml-output-budget-hotfix.mjs
npm run lint
npm run build
```

The patch script is guarded: it applies only when it sees exactly the two expected legacy 8192-token blocks, and it is idempotent.
