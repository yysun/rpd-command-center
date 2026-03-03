# DD - Staged Changes (Outliner Phase 5)

**Date:** 2026-03-03  
**Scope:** Staged changes only (`git diff --staged`)  
**Area:** `outliner` package

## Summary

This staged set completes a major Outliner behavior expansion focused on keyboard-first editing semantics, page-level transitions, and caret/focus stability under structural and content updates.

The changes add:
- New structural behaviors for `Enter`, `Tab`, `Shift+Tab`, `Backspace`, and `Delete` across nested and page-level boundaries.
- Deterministic caret/focus restoration after mutations and parent re-renders.
- Expanded E2E harness APIs and styling for reliable browser-level assertions.
- Broader unit and E2E coverage for page breakout/promotion, merge rules, and content retention.

## Staged Files

- `outliner/src/Outliner.tsx`
- `outliner/tests/model.test.ts`
- `outliner/tests/keyboard-shortcuts.test.tsx`
- `outliner/tests/editor-boundaries.test.tsx`
- `outliner/e2e/keyboard.spec.ts`
- `outliner/e2e/app/main.tsx`
- `outliner/e2e/app/e2e.css`
- `outliner/README.md`

## Design and Behavior Changes

### 1. Structural model extensions

In `outliner/src/Outliner.tsx`:
- Added cross-page predecessor lookup via `findPrevNonPageBlock`.
- Added page-root indentation support via `indentPageRoot`.
- Added top-level promotion support via `promoteBlockToNewPage`.
- Extended `mergeBlock` to support page-level/root merge behavior where valid.

### 2. Keyboard semantics updates

In `outliner/src/Outliner.tsx` keyboard handling:
- `Enter`:
  - On empty nested leaf: break out one level (outdent behavior).
  - On empty top-level leaf: promote to a new page-level item.
  - Otherwise: split at caret.
- `Tab`:
  - On page root: indent under previous page root when valid.
  - On non-root: indent existing behavior.
- `Shift+Tab`:
  - On top-level block under page root: promote to new page.
  - Otherwise: outdent existing behavior.
- Backspace/Delete merge semantics expanded for page-level boundaries.

### 3. Caret and focus resilience

In `outliner/src/Outliner.tsx`:
- Added `useLayoutEffect` path for mutation focus/caret restoration (`pendingMutationRef`).
- Added fallback snapshot restoration path for content edits (`pendingCaretRestoreRef`) to preserve user context when marker restoration is unavailable.
- Ensured block focus callback is emitted after successful restoration.

### 4. E2E harness and reliability improvements

In `outliner/e2e/app/main.tsx`:
- Added `__outlinerE2E.setBlockContent(blockId, content)` helper.
- Implemented deterministic success return by computing updates synchronously from a current pages ref before scheduling `setPages`.

In `outliner/e2e/app/e2e.css`:
- Added stable visual baseline variables/styles for E2E rendering consistency.

### 5. Test coverage expansion

- `outliner/e2e/keyboard.spec.ts`:
  - Added many scenarios for split/merge/promote/indent/outdent and content retention.
  - Added `setBlockContent` usage for direct setup in edge cases.
- `outliner/tests/model.test.ts`:
  - Added model-level tests for page-level merge/indent/promote and round-trip content retention.
- `outliner/tests/keyboard-shortcuts.test.tsx`:
  - Added renderer keyboard scenarios matching new semantics.
- `outliner/tests/editor-boundaries.test.tsx`:
  - Added selection-preservation regression test when parent updates are triggered by keyup edits.

### 6. Documentation update

In `outliner/README.md`:
- Updated keyboard interaction table and behavior notes to match implemented semantics.
- Added tree split pattern examples for common workflows.

## Verification

- Workspace test run reported success (`npm t` exit code `0`).
- Outliner targeted unit and E2E validations for new focus/caret and keyboard semantics were executed during implementation and passed.

## Outcome

Staged changes are cohesive and align with the intended Phase 5 Outliner interaction model:
- Keyboard-first structural editing is now richer and more consistent across page boundaries.
- Focus/caret handling is significantly more robust under React update timing.
- Automated coverage now guards key regression points for newly introduced behaviors.
