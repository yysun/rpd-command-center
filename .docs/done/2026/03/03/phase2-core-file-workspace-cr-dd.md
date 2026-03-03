# Done — CR + DD: Phase 2 Core File & Workspace

**Date:** 2026-03-03
**REQ:** `.docs/reqs/2026/03/03/req-phase2-core-file-workspace.md`
**Plan:** `.docs/plans/2026/03/03/plan-phase2-core-file-workspace.md`
**Status:** Completed (CR Passed, DD Recorded)

---

## CR Findings

### High

1. **Watcher startup error path did not always return structured IPC errors**
   - Risk: renderer callers could receive unstructured failures if file-watch setup throws.
   - Fix applied in `electron/workspaceIpc.ts`:
     - Wrapped `startWatchStoryMap` setup in `try/catch`.
     - Returns `IpcResult` with code `STORY_MAP_WATCH_START_FAILED`.

### Medium

1. **Targeted tests for workspace picker and watcher-failure edge paths were missing**
   - Added targeted coverage in `electron/tests/workspace-ipc.test.ts`:
     - `openWorkspaceFolder` success (recursive markdown discovery)
     - `openWorkspaceFolder` cancel path
     - `openWorkspaceFolder` dialog-throw path
     - `loadStoryMap` missing-file failure path
     - `registerWorkspaceIpcHandlers` watcher-start throw path

### Low

1. **No additional functional regressions found in this CR pass**
   - Core logic and Electron IPC/watch behavior remain green under test.

---

## Implemented Scope Summary

### Core (Phase 2A)

- Added headless workspace module at `core/src/workspace/index.ts`:
  - Full-text search
  - Composed filtering (status/doc-coverage/unfinished/text)
  - Slug validation (format + uniqueness + exclusion)
  - Activity/task metrics (counts, percent-done, doc-coverage)
- Exported workspace APIs and types from `core/src/index.ts`.

### Electron IPC + Watch (Phase 2B/2C)

- Added typed IPC module `electron/workspaceIpc.ts`:
  - Open workspace, load/save story map
  - Search/filter/slug validation/metrics wrappers
  - File watch start/stop with coalesced events
  - External-change and watcher-error event dispatch
  - Structured `IpcResult` envelopes
- Wired registration + cleanup in `electron/main.ts`.

### Preload + Renderer Types (Phase 2D)

- Extended API bridge in `electron/preload.ts`.
- Extended `window.api` typing in `electron/renderer/src/env.d.ts`.

### Test and Config Updates (Phase 2E)

- Added `core/tests/workspace.test.ts`.
- Added and expanded `electron/tests/workspace-ipc.test.ts`.
- Added `core` source alias for Electron Vitest in `electron/vitest.config.mts`.
- Simplified `core` package `exports` typing in `core/package.json` for stable workspace type resolution.

---

## Verification Evidence

Executed successfully:

1. `npm test`
- `core`: 5 files, 82 tests passed
- `electron`: 2 files, 15 tests passed

2. `npm run build --workspace=core`
- Build succeeded

3. `npm run build --workspace=electron`
- Build succeeded

---

## Residual Risks / Follow-ups

1. Workspace markdown scan is recursive across the selected folder; very large workspaces may need optional depth limits or incremental indexing in future phases.
2. Current validation coverage is strong at module level; full UI flow tests for invoking these APIs from renderer components can be added in upcoming frontend implementation phases.
