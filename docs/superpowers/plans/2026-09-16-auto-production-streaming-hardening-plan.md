# Auto Production Streaming Hardening Implementation Plan

**Goal:** Add true server progress streaming and enforce the production arrangement contract across Auto, Manual and Project Resume without touching Composer Core.

1. Add failing tests for identity lock, stream parsing, server orchestration and installer idempotence.
2. Implement deterministic selected-melody-part lock.
3. Add streamed server runner and NDJSON handler using existing generation functions through injected dependencies.
4. Add client NDJSON parser with explicit compatibility fallback.
5. Route Auto Compose to streamed endpoint.
6. Add shared production arrangement runner for Manual and Project Resume.
7. Patch server.ts/RunsView.tsx through guarded idempotent installer.
8. Persist identity-lock provenance in project snapshot and production package.
9. Run overlay tests, semantic TypeScript check, syntax/transpile, protected-scope audit and ZIP integrity verification.
10. In AI Studio, run full workspace lint/build/runtime/iPad acceptance before any GitHub write.
