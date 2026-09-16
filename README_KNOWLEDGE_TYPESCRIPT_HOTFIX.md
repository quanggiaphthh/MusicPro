# Music-Pro Knowledge TypeScript Hotfix — 2026-09-16

## Root cause
AI Studio `npm run lint` reported:

`src/views/KnowledgeView.tsx(216,21): error TS2339: Property 'map' does not exist on type 'unknown'.`

The runtime data was correct. The problem was TypeScript inference at `Object.entries(groupedDocs)`: in the full project typing environment, the tuple value was inferred as `unknown`, so `docs.map(...)` was rejected.

## Fix
Only `src/views/KnowledgeView.tsx` changes:
- explicitly type `useMemo<Record<string, KnowledgeDoc[]>>`
- explicitly type `Object.entries(groupedDocs)` as `Array<[string, KnowledgeDoc[]]>`
- render from the typed `groupedEntries`

No runtime behavior, API shape, knowledge content, Composer Core, validator, SongDNA, Lyria, dependencies, or package configuration is changed.
