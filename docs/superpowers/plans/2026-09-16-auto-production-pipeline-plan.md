# Music-Pro Auto Production Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** One-click 4-step composition with progress/ETA, summaries, production quality gates, and production handoff package.

**Architecture:** Client orchestration over existing APIs; deterministic SongDNA/XML quality gates; no changes to locked Composer/validator/audio core.

**Tech Stack:** React 19, TypeScript 5.8, existing Express APIs, IndexedDB project service, MusicXML/SongDNA.

**Spec:** `docs/superpowers/specs/2026-09-16-auto-production-pipeline-design.md`

## Global Constraints
- Do not modify locked Composer/validator/SongDNA/model routing/Lyria/SoundFont transport.
- Preserve 4-step semantics; no Step 5.
- Default UX is automatic; manual flow remains available.
- No GitHub write.

### Task 1: Production quality contracts
- [x] Write failing tests for composition, arrangement, readiness.
- [x] Implement `src/compose/production-quality.ts`.
- [x] Verify tests PASS.

### Task 2: Auto orchestration
- [x] Write failing tests for progress ordering/retry behavior using injected fetch.
- [x] Implement `src/compose/auto-compose.ts`.
- [x] Verify tests PASS.

### Task 3: Progress and summary UI
- [x] Add static policy test for progress, ETA, four summaries, manual toggle.
- [x] Implement `src/components/compose/AutoComposeProgress.tsx`.
- [x] Integrate into `src/views/ComposeView.tsx` with default Auto mode.

### Task 4: Persistence and production package
- [x] Extend project types with production snapshot.
- [x] Enrich ZIP with MASTER/LEAD, quality reports, SongDNA, blueprint, lyrics, chord chart; retain legacy entries.
- [x] Extend package test policy.

### Task 5: Knowledge/runtime alignment
- [x] Make Step 3/4 mandatory quality docs part of core context in `server/projectmusic/knowledge.ts`.
- [x] Update pipeline overview wording for runtime auto orchestration while preserving four steps.

### Task 6: Package verification
- [x] Run pure TypeScript tests via Node strip-types.
- [x] Run semantic/syntax checks available locally.
- [x] Build SHA256 manifest and ZIP.
- [x] Provide AI Studio single-upload instructions and exact runtime acceptance commands.


### Task 7: Production resilience hardening

**Files:** `src/compose/production-quality.ts`, `src/compose/eta-history.ts`, `src/compose/auto-compose.ts`, `src/components/compose/AutoComposeProgress.tsx`, `src/views/ComposeView.tsx`, `src/export/project-package.ts`.

- [x] Add ordered lyric + harmonic + structure identity locks.
- [x] Add full-part coverage and score/midi instrument pairing checks.
- [x] Add machine-readable readiness blockers/advisories.
- [x] Add adaptive ETA EWMA and overdue UX.
- [x] Preserve last failed composition/arrangement candidate and expose halted state.
- [x] Persist/export pipeline provenance.
- [x] Add strict/regression tests.
