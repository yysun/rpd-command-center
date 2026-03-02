# REQ — Project Scaffold

**Date:** 2026-03-02  
**Parent plan:** `.docs/plans/2026/03/02/plan-story-map-manager.md`  
**Status:** Draft

---

## Overview

The project is structured as two distinct units within a single repository:

1. **`core`** — a framework-agnostic TypeScript library containing all business logic (data model, parser, writer, store actions, slug validation, query engine, template rendering).
2. **`electron`** — the desktop application shell that hosts the React UI and bridges `core` to the OS (file system, IPC, shell integration).

The separation ensures `core` is independently testable without Electron or a DOM, and can later be reused in a CLI tool or web-based viewer.

---

## Scope

### In Scope
- Monorepo workspace layout with `core` and `electron` packages
- TypeScript configuration for both packages
- Build pipeline: `core` compiles to CommonJS + ESM; `electron` bundles via `electron-vite`
- Lint and format tooling shared across the repo
- Test runner configured for both packages
- Development workflow: single command starts Electron with hot-reload renderer

### Out of Scope
- Any business logic implementation (covered by subsequent REQs per phase)
- CI/CD pipeline configuration (post-scaffold)
- Packaging / installer generation (Phase 7)

---

## Package: `core`

### What it is
A plain TypeScript library. No Electron, no React, no DOM dependencies.

### What it must expose
- All data model types (`StoryMap`, `Activity`, `Task`, `Story`, `DocRef`, `Status`, `DocRefType`)
- `FormatMode` type: `'preserve' | 'normalize'`
- `parse(markdown: string): StoryMap` function (stub in scaffold)
- `serialize(map: StoryMap, mode: FormatMode): string` function (stub in scaffold)
- Re-exports of all future modules (parser, writer, store actions, queries)

### Constraints
- Zero runtime dependencies at scaffold time; only `devDependencies`
- Requires **Node.js ≥ 20** (LTS; aligns with Electron 30+ bundled Node version)
- Testable with Vitest in a Node environment (no jsdom required for pure logic)
- Outputs: `dist/index.cjs` and `dist/index.mjs`

---

## Package: `electron`

### What it is
The Electron desktop application. Depends on `core` as a local workspace package.

### What it must contain at scaffold time
| Layer | Content |
|-------|---------|
| Main process | Entry point (`main/index.ts`): creates `BrowserWindow`, registers IPC handlers |
| Preload script | `preload/index.ts`: exposes typed `window.api` via `contextBridge` — no raw `ipcRenderer` in renderer |
| Renderer | `src/App.tsx`: minimal React shell (blank canvas); mounts into `index.html` |
| IPC stub | At least one round-trip channel (`ping` / `pong`) to verify IPC wiring |

### Constraints
- `nodeIntegration: false`, `contextIsolation: true` on every `BrowserWindow` (security baseline)
- Renderer has no direct access to Node.js APIs
- `electron-vite` used as the build/dev tool
- React + TypeScript in the renderer
- Tailwind CSS configured in the renderer

---

## Shared / Root

### What the repo root must provide
- `package.json` with workspace definitions (`core`, `electron`)
- Shared ESLint config (TypeScript-aware)
- Shared Prettier config
- `tsconfig.base.json` extended by each package
- Single `npm run dev` script that starts the Electron app with renderer HMR
- Single `npm test` script that runs tests in both packages

---

## Acceptance Criteria

| # | Criterion |
|---|-----------|
| AC-1 | `npm run dev` launches the Electron window with a visible React UI |
| AC-2 | Renderer hot-reloads on source change without restarting the Electron process |
| AC-3 | `npm test` runs and passes (at minimum: one smoke test in `core`, one in `electron`) |
| AC-4 | The preload `window.api` ping/pong IPC round-trip works end-to-end |
| AC-5 | `core` builds independently (`npm run build --workspace=core`) with no Electron/DOM imports |
| AC-6 | ESLint passes with zero errors across both packages |
| AC-7 | `BrowserWindow` is created with `nodeIntegration: false` and `contextIsolation: true` |
| AC-8 | `electron` package lists `core` as a local workspace dependency (`"core": "workspace:*"`) and can import from it at runtime |
