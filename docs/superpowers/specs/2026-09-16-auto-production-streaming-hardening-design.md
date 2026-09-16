# Auto Production Streaming Hardening Design

## Goal
Harden Music-Pro V1 so automatic composition uses one streamed server orchestration request, and every arrangement entry point enforces the same master-identity/quality contract.

## Constraints
- Exactly four Composer steps; no Step 5.
- Final MusicXML is master composition.
- No changes to composer.ts, musicxml-validator.ts, song-dna.ts, model routing, Lyria, SoundFont or Score Theater.
- One quality retry by default; failed final candidate remains reviewable.

## Architecture
- `server/music/auto-production-stream.ts`: server-side runner + NDJSON response handler.
- `src/compose/stream-auto-compose.ts`: incremental NDJSON parser with explicit compatibility fallback.
- `src/compose/master-identity-lock.ts`: deterministic replacement of selected lead melody part from accepted Lead Sheet.
- `src/compose/arrangement-production-run.ts`: reusable Step-4 production runner for Manual + Project Resume.
- `scripts/apply-auto-production-v1.4.1.mjs`: guarded/idempotent integration into server.ts and RunsView.tsx.

## Master Identity Contract
Before quality audit, the arranged selected melody part is replaced byte-for-byte by the accepted Lead Sheet part. Accompaniment parts remain generated. Harmony/section/key/meter/BPM are independently checked by the deterministic quality gate.

## Streaming Contract
`POST /api/compose/run-stream` returns `application/x-ndjson` records:
- `{type:"event", event}`
- `{type:"result", result}`
- `{type:"error", error}`

The client parser must tolerate arbitrary network chunk boundaries and never expose partial raw MusicXML as a valid result.
