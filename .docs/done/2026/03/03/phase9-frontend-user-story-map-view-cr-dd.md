# DONE - Phase 9 Frontend User Story Map View (SS + CR + DD)

Date: 2026-03-03
Related REQ: `.docs/reqs/2026/03/03/req-phase9-frontend-user-story-map-view.md`
Related PLAN: `.docs/plans/2026/03/03/plan-phase9-frontend-user-story-map-view.md`

## Summary

Completed Phase 9 implementation and review work for the new map-oriented story map experience while preserving the existing Board experience.

Final UX state after implementation and review:
1. Existing `Board` view remains intact (original board columns behavior preserved).
2. New `Map` view is available in the title bar and renders Activities -> Tasks -> Release Slice card lanes.
3. Map card interactions support focus handoff behavior without forcing view switches.
4. Delete controls are present as in-card SVG `X` buttons (hover/focus visible), with task placeholder safeguards.
5. Dark mode safe map colors and map-specific spacing/scroll refinements were applied.

## Delivered Implementation

1. Added dedicated `Map` mode and component.
- Added `map` to title-bar view options and UI toggle.
- Added `MapLanes` component for lane projection/rendering and map interactions.
- Files:
  - `electron/renderer/src/components/MainTitleBar.tsx`
  - `electron/renderer/src/components/MapLanes.tsx`
  - `electron/renderer/src/App.tsx`

2. Preserved existing `Board` mode behavior.
- Restored/kept original board lanes implementation for `board` mode.
- Map functionality is isolated to `map` mode.
- File:
  - `electron/renderer/src/components/BoardLanes.tsx`

3. Implemented map-to-outliner focus bridge plumbing.
- Added typed map focus target contract.
- Added outliner external focus request support with ancestor expansion.
- Files:
  - `electron/renderer/src/components/storyMapTypes.ts`
  - `outliner/src/types.ts`
  - `outliner/src/Outliner.tsx`
  - `electron/renderer/src/App.tsx`

4. Applied visual and layout refinements requested during iteration.
- Map card palette aligned to reference and made dark-mode safe via CSS variables.
- Left lane label column hidden.
- Horizontal scroll behavior moved/refined so scrollbar does not overlap last row.
- Added right-side trailing gutter to balance horizontal spacing.
- Removed thin outer border around map content area.
- Files:
  - `electron/renderer/src/components/MapLanes.tsx`
  - `electron/renderer/src/globals.css`

5. Finalized map delete affordances.
- Delete affordances are SVG `X` buttons in top-right of cards.
- Delete controls are hover/focus visible only.
- Added pointer-event and z-index safeguards so hidden controls are not accidentally interactive and visible controls are clickable.
- Placeholder `No task` cards no longer expose a no-op delete control.
- File:
  - `electron/renderer/src/components/MapLanes.tsx`

## CR Findings And Fixes Applied

1. Medium - Hidden delete buttons could still be interactable while invisible.
- Fix: Added `pointer-events-none` by default and enabled pointer events only on hover/focus.
- File: `electron/renderer/src/components/MapLanes.tsx`

2. Medium - Top-right delete controls could be blocked by full-card click layer.
- Fix: Added `z-10` to delete controls to ensure clickability.
- File: `electron/renderer/src/components/MapLanes.tsx`

3. Medium - Placeholder task rows showed a delete control that no-opped.
- Fix: Added `canDelete` guard to hide delete control for placeholder tasks.
- File: `electron/renderer/src/components/MapLanes.tsx`

## Test And Build Verification

Commands run:
- `npm test --workspace=electron`
- `npm test --workspace=outliner`
- `npm run build --workspace=electron`

Latest results in this pass:
- Electron tests: passed (31 tests, 4 files)
- Outliner tests: passed (78 tests, 6 files)
- Electron build: passed (`tsc` + renderer `vite build`)

## Remaining Follow-Up (From Plan)

1. `9D-4` explicit stale/missing node focus feedback is still limited to safe no-op behavior; user-facing message could be added.
2. `9F-3` and `9F-4` deeper map click-to-focus integration coverage can be expanded.
