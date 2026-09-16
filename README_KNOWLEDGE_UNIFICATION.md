# Music-Pro — Knowledge Base Unification Hotfix

Base target: Product V1 workspace based on GitHub commit `7da6e629ac4610bfa5537d8deec0d9d2d85fb312` plus the Product V1 and TypeScript hotfix already applied.

## Problem fixed

The previous Knowledge screen used three Firestore seed placeholders (`catalog`, `for-ai`, `knowledge_styles`) while the Composer actually read `docs/m-guide/catalog.yml`, `docs/m-guide/for-ai.md`, and catalog-referenced files through `server/projectmusic/knowledge.ts`. The UI and Composer therefore represented two different knowledge stores.

## New invariant

`docs/m-guide/` is the single canonical source of truth.

- `/api/knowledge/catalog` exposes the real catalog metadata.
- `/api/knowledge/document/:id` loads the exact canonical file used by Composer.
- `/api/knowledge/all` supplies the canonical corpus to the existing Improver analysis flow.
- `PUT /api/knowledge/document/:id` writes only known catalog IDs (plus `CORE.FOR-AI`) and immediately affects subsequent Composer requests.
- `CORE.CATALOG` is deliberately read-only to prevent accidental catalog corruption.
- Knowledge UI no longer requires Firebase.
- Placeholder seeding is disabled.
- Production canonical writes are disabled by default; set `KNOWLEDGE_WRITE_ENABLED=true` only when the deployment filesystem/persistence model is appropriate.

## UI

The Knowledge screen now shows catalog version/document count, search, Step 1–4 filter, category filter, tag filter, canonical path, tags, served steps, and canonical/read-only status.

## Protected areas

This hotfix does not modify:

- `server/music/composer.ts`
- `server/music/musicxml-validator.ts`
- `server/music/song-dna.ts`
- production blueprint / Gemini brief logic
- Lyria logic
- package dependencies
