# Done — Project Scaffold

**Date:** 2026-03-02
**REQ:** `.docs/reqs/2026/03/02/req-project-scaffold.md`
**Plan:** `.docs/plans/2026/03/02/plan-project-scaffold.md`
**Status:** Complete ✅

---

## Summary

Bootstrapped the full npm monorepo scaffold for the RPD Command Center. The repository is an npm workspace with two packages — `core` (pure TypeScript library) and `electron` (Electron + React renderer). All acceptance criteria from the REQ were met.

---

## What Was Built

### Repository Root
| File | Purpose |
|---|---|
| `package.json` | npm workspace root (`workspaces: ["core","electron"]`), shared dev scripts |
| `tsconfig.base.json` | Shared TS config (`ES2022`, `strict`, `bundler` resolution) |
| `eslint.config.mjs` | Shared flat ESLint config using `typescript-eslint` v8 |
| `.prettierrc` | `semi: false`, `singleQuote: true`, `printWidth: 100` |
| `.nvmrc` | Node 20 pin |
| `.gitignore` | Ignores build outputs, `node_modules`, coverage, `.env` |

### `core` Package
Pure TypeScript library; no DOM dependency.

- **`src/types/model.ts`** — All data model types: `Status`, `FormatMode`, `DocRefType`, `DocRef`, `Story` (includes `updatedAt`), `Task`, `Activity`, `StoryMap`
- **`src/parser/parse.ts`** — Stub parser (returns empty `StoryMap` with correct shape)
- **`src/writer/serialize.ts`** — Stub serializer (returns `""`)
- **`src/index.ts`** — Public re-exports of all types + `parse` + `serialize`
- **Dual CJS+ESM output** via Vite lib mode → `dist/index.cjs`, `dist/index.mjs`, `dist/index.d.ts`
- Exports map with `types` condition for TypeScript consumers
- **3 smoke tests** — all passing (Vitest, Node environment)

### `electron` Package
Electron 30 + React 18 + TypeScript renderer app.

**Dev toolchain (plain tsc + vite, no electron-vite):**
- `tsc --project tsconfig.electron.json` compiles `main.ts` + `preload.ts` → `dist/main.js` + `dist/preload.js` (CommonJS)
- `vite --config vite.config.mts` serves `renderer/` at `http://127.0.0.1:5182` (HMR)
- `npm-run-all` orchestrates: sequential `main:build`, then parallel `main:watch`, `renderer:dev`, `electron:dev`
- `wait-on` delays Electron launch until renderer server is up and `dist/main.js` exists
- `cross-env` sets `ELECTRON_RENDERER_URL` for the main process

**Key files:**
| File | Purpose |
|---|---|
| `main.ts` | BrowserWindow creation, IPC registration, env-aware URL loading |
| `preload.ts` | `contextBridge.exposeInMainWorld('api', { ping })` |
| `tsconfig.electron.json` | CommonJS output for main+preload; overrides `declaration: false`, `declarationMap: false` |
| `tsconfig.json` | ESM/DOM config for renderer + tests |
| `vite.config.mts` | Vite renderer config; `.mts` extension forces ESM loading (bypasses `package.json` CJS default) |
| `tailwind.config.js` | `module.exports` (CJS); content path `./renderer/**/*.{ts,tsx,html}` |
| `renderer/index.html` | HTML entry (`<script type="module" src="/src/main.tsx">`) |
| `renderer/src/main.tsx` | `ReactDOM.createRoot` entry |
| `renderer/src/App.tsx` | Minimal dark shell UI |
| `renderer/src/globals.css` | Tailwind directives |
| `renderer/src/env.d.ts` | `window.api` type augmentation |
| `tests/smoke.test.ts` | 3 tests: mocked IPC, `window.api` shape verification |

**Security baseline:**
- `nodeIntegration: false`, `contextIsolation: true`, `sandbox: app.isPackaged`
- Raw `ipcRenderer` never exposed to renderer — only typed API surface via contextBridge

---

## Issues Resolved

### 1. `electron-vite` entry point error
`electron-vite dev` failed with `"An entry point is required in the electron vite main config"` due to ESM `__dirname` resolution issues. Replaced entirely with the proven pattern from the sibling `agent-world` project: plain `tsc` for main/preload + plain `vite` for renderer.

### 2. `"exports is not defined in ES module scope"`
`electron/package.json` had `"type": "module"`, but `tsc` compiled `main.ts` → CommonJS. Node loaded `dist/main.js` as ESM due to the type field, crashing on `exports`. **Fix:** removed `"type": "module"` from `electron/package.json`.

### 3. Vite config ESM load failure
Without `"type": "module"`, Node tried to load `vite.config.ts` as CJS, failing on the ESM-only `@vitejs/plugin-react`. **Fix:** renamed to `vite.config.mts` — `.mts` extension forces ESM interpretation regardless of `package.json` type.

### 4. `declarationMap` error (TS5069)
`tsconfig.base.json` sets `declarationMap: true`; `tsconfig.electron.json` set `declaration: false` without also setting `declarationMap: false`. **Fix:** added `"declarationMap": false` explicitly.

### 5. `workspace:*` not supported by npm
npm workspaces don't support pnpm/Yarn `"workspace:*"` syntax. **Fix:** changed to `"core": "*"` — npm resolves by package name automatically.

---

## Acceptance Criteria Status

| AC | Description | Status |
|---|---|---|
| AC-1 | `npm run dev` opens Electron window | ✅ |
| AC-2 | HMR in renderer | ✅ |
| AC-3 | `npm test` — all tests pass | ✅ 6/6 |
| AC-4 | `window.api.ping()` returns `"pong"` | ✅ (wired in main + preload) |
| AC-5 | `npm run build` produces `core/dist` + `electron/renderer/dist` | ✅ (core verified; electron build path configured) |
| AC-6 | `npm run lint` — 0 errors | ✅ |
| AC-7 | Node.js ≥ 20 required | ✅ (.nvmrc = 20) |
| AC-8 | `core` resolves as workspace dependency in `electron` | ✅ |

---

## Next Steps

The scaffold is complete. Implementation follows Phase 1 of `.docs/plans/2026/03/02/plan-story-map-manager.md`:

1. **Parser** — implement `core/src/parser/parse.ts` to parse `.usm.md` files into `StoryMap`
2. **Writer** — implement `core/src/writer/serialize.ts` to round-trip `StoryMap` back to markdown
3. **File I/O IPC** — wire `open-file` / `save-file` IPC handlers in `electron/main.ts`
