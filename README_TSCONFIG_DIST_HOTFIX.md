# Music-Pro TypeScript dist-exclusion hotfix

## Root cause

`npm run lint` executes `tsc --noEmit`. The project enables `allowJs: true` and previously had no `include` / `exclude` fields in `tsconfig.json`, so TypeScript's default `**/*` include also admitted generated JavaScript under `dist/`.

In AI Studio the preview/build system can replace hashed files in `dist/` while TypeScript is enumerating them. That produced TS6053 errors for files such as `dist/assets/index-*.js`, `dist/registerSW.js`, `dist/server.cjs`, and Workbox/PWA output that disappeared after enumeration.

## Fix

Only `tsconfig.json` changes. It adds:

```json
"exclude": ["dist", "node_modules"]
```

No product runtime code, dependency, Composer Core, validator, SongDNA, SoundFont, Knowledge Base, or Lyria logic is changed.
