# DONE - Phase 4 Frontend App Shell (CR + DD)

Date: 2026-03-03
Related REQ: `.docs/reqs/2026/03/03/req-phase4-frontend-app-shell.md`
Related PLAN: `.docs/plans/2026/03/03/plan-phase4-frontend-app-shell.md`

## Summary

Completed a CR (code review) pass over uncommitted Phase 4 renderer-shell changes and applied an additional high-priority fix. Then validated test/build and documented the final state.

## CR Findings And Actions

1. High - Task deletion left story data/counts inconsistent.
- Finding: Deleting a task removed task labels but could leave linked stories in column state, causing hidden/orphaned story data and mismatched counts.
- Fix: Updated `onDeleteTask` to remove stories linked to the deleted task, update activity total count, update column count, and clear inspector selection when needed.
- File: `electron/renderer/src/App.tsx`

2. Review status for other changes.
- IPC handler lifecycle update to dispose on `before-quit` remains correct for macOS window re-open behavior.
- Add/delete hierarchy behavior now maps correctly:
  - activity-level add -> task
  - task-level add -> story under task
  - delete actions require confirmation

## Verification

Commands run:
- `npm test --workspace=electron`
- `npm run build --workspace=electron`

Results:
- Tests: 27 passed (3 files)
- Build: success (`tsc` + renderer `vite build`)

## Primary Files In Scope

- `electron/main.ts`
- `electron/renderer/src/App.tsx`
- `electron/renderer/src/appShell.ts`
- `electron/renderer/src/components/ProjectSidebar.tsx`
- `electron/renderer/src/components/OutlinerLanes.tsx`
- `electron/renderer/src/components/StoryInspector.tsx`
- `electron/renderer/src/components/storyMapMocks.ts`
- `electron/renderer/src/components/storyMapTypes.ts`
- `electron/tests/smoke.test.ts`
- `electron/tests/app-shell.test.ts`
